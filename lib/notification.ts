import { 
  Timestamp, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  writeBatch,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// Define notification types
export type NotificationType = 
  | 'message' 
  | 'bid' 
  | 'outbid' 
  | 'auction-ended' 
  | 'auction-won' 
  | 'review-received'
  | 'transaction-confirmed'
  | 'system';

// Define notification interface
export interface Notification {
  id?: string;
  userId: string;
  type: NotificationType;
  title: string;
  description: string;
  link?: string;
  createdAt: Timestamp;
  read: boolean;
  fromUserId?: string;
  relatedItemId?: string; // Can be listing ID, message ID, etc.
}

/**
 * Create a new notification for a user
 * 
 * @param notification The notification data to create
 * @returns The ID of the newly created notification
 */
export async function createNotification(notification: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<string> {
  try {
    // Prepare notification data with defaults
    const notificationData = {
      ...notification,
      createdAt: serverTimestamp(),
      read: false
    };

    // Add notification to user's subcollection
    const userNotificationsRef = collection(db, `users/${notification.userId}/notifications`);
    const docRef = await addDoc(userNotificationsRef, notificationData);
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Create bid notification for the seller when someone places a bid
 */
export async function createBidNotification(
  listingId: string,
  sellerId: string,
  bidderId: string,
  bidAmount: number,
  itemTitle: string
): Promise<string> {
  return createNotification({
    userId: sellerId,
    type: 'bid',
    title: 'New Bid Placed',
    description: `A new bid of $${bidAmount.toFixed(2)} was placed on "${itemTitle}"`,
    link: `/product/${listingId}`,
    fromUserId: bidderId,
    relatedItemId: listingId
  });
}

/**
 * Create outbid notification for the previous highest bidder
 */
export async function createOutbidNotification(
  listingId: string,
  previousBidderId: string,
  newBidderId: string,
  newBidAmount: number,
  itemTitle: string
): Promise<string> {
  return createNotification({
    userId: previousBidderId,
    type: 'outbid',
    title: 'You\'ve Been Outbid',
    description: `Someone placed a new bid of $${newBidAmount.toFixed(2)} on "${itemTitle}", which is higher than your previous bid`,
    link: `/product/${listingId}`,
    fromUserId: newBidderId,
    relatedItemId: listingId
  });
}

/**
 * Create auction ended notification for the seller
 */
export async function createAuctionEndedSellerNotification(
  listingId: string,
  sellerId: string,
  winnerId: string | null,
  itemTitle: string
): Promise<string> {
  let title = 'Your Auction Has Ended';
  let description = `Your auction for "${itemTitle}" has ended`;
  
  if (winnerId) {
    description += ' with a winning bidder. Please contact them to arrange the transaction.';
  } else {
    description += ' without any bids.';
  }
  
  return createNotification({
    userId: sellerId,
    type: 'auction-ended',
    title,
    description,
    link: `/product/${listingId}`,
    fromUserId: winnerId || undefined,
    relatedItemId: listingId
  });
}

/**
 * Create auction won notification for the winner
 */
export async function createAuctionWonNotification(
  listingId: string,
  winnerId: string,
  sellerId: string,
  itemTitle: string,
  winningBid: number
): Promise<string> {
  return createNotification({
    userId: winnerId,
    type: 'auction-won',
    title: 'You Won an Auction!',
    description: `Congratulations! You won the auction for "${itemTitle}" with a bid of $${winningBid.toFixed(2)}. Please contact the seller to arrange the transaction.`,
    link: `/product/${listingId}`,
    fromUserId: sellerId,
    relatedItemId: listingId
  });
}

/**
 * Create message notification for a user
 */
export async function createMessageNotification(
  recipientId: string,
  senderId: string,
  messageContent: string,
  conversationId: string,
  senderName?: string
): Promise<string> {
  const title = senderName ? `New Message from ${senderName}` : 'New Message';
  
  return createNotification({
    userId: recipientId,
    type: 'message',
    title,
    description: messageContent.length > 100 
      ? `${messageContent.substring(0, 100)}...` 
      : messageContent,
    link: `/messages?conversation=${conversationId}`,
    fromUserId: senderId,
    relatedItemId: conversationId
  });
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(userId: string, notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, `users/${userId}/notifications`, notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId: string): Promise<void> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(notificationsRef, where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(notificationsRef, where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread notification count:', error);
    return 0;
  }
}

/**
 * Get recent notifications for a user
 */
export async function getRecentNotifications(
  userId: string, 
  limitCount: number = 10
): Promise<Notification[]> {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(
      notificationsRef, 
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Notification));
  } catch (error) {
    console.error('Error getting recent notifications:', error);
    return [];
  }
}

/**
 * Subscribe to real-time notifications for a user
 */
export function subscribeToNotifications(
  userId: string,
  callback: (notifications: Notification[]) => void
) {
  try {
    const notificationsRef = collection(db, `users/${userId}/notifications`);
    const q = query(
      notificationsRef,
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
      
      callback(notifications);
    });
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return () => {}; // Return empty unsubscribe function
  }
} 