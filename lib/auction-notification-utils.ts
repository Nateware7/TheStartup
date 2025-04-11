import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { 
  createAuctionEndedSellerNotification, 
  createAuctionWonNotification 
} from './notification';

/**
 * Handle notifications when an auction ends
 * This will:
 * 1. Notify the seller about the auction ending and who won
 * 2. Notify the winner that they won the auction (if there is a winner)
 * 
 * @param listingId The ID of the listing that ended
 * @returns An object with notification IDs that were created
 */
export async function handleAuctionEndNotifications(
  listingId: string
): Promise<{ sellerNotificationId?: string; winnerNotificationId?: string }> {
  try {
    // Get the listing data
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if (!listingDoc.exists()) {
      console.error(`Listing ${listingId} not found`);
      return {};
    }
    
    const listingData = listingDoc.data();
    const itemTitle = listingData.title || 'Item';
    const sellerId = listingData.sellerId;
    const winnerId = listingData.winnerId || listingData.highestBidderId;
    const winningBid = listingData.currentBid || 0;
    
    const result: { sellerNotificationId?: string; winnerNotificationId?: string } = {};
    
    // 1. Notify the seller about the auction ending
    if (sellerId) {
      const sellerNotificationId = await createAuctionEndedSellerNotification(
        listingId,
        sellerId,
        winnerId,
        itemTitle
      );
      result.sellerNotificationId = sellerNotificationId;
    }
    
    // 2. Notify the winner that they won the auction
    if (winnerId && sellerId && winnerId !== sellerId) {
      const winnerNotificationId = await createAuctionWonNotification(
        listingId,
        winnerId,
        sellerId,
        itemTitle,
        winningBid
      );
      result.winnerNotificationId = winnerNotificationId;
    }
    
    return result;
  } catch (error) {
    console.error('Error handling auction end notifications:', error);
    return {};
  }
} 