import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createMessageNotification } from './notification';

/**
 * Handle sending a notification for a new message
 * 
 * @param recipientId The ID of the message recipient
 * @param senderId The ID of the message sender
 * @param messageContent The content of the message
 * @param conversationId The ID of the conversation
 * @param senderName Optional sender name to include in the notification
 * @returns The ID of the created notification
 */
export async function handleMessageNotification(
  recipientId: string,
  senderId: string,
  messageContent: string,
  conversationId: string,
  senderName?: string
): Promise<string | undefined> {
  try {
    // Skip notifications if sender and recipient are the same
    if (recipientId === senderId) {
      return;
    }
    
    // If sender name is provided, use it directly
    if (senderName) {
      // Create notification with the provided sender name
      const notificationId = await createMessageNotification(
        recipientId,
        senderId,
        messageContent,
        conversationId,
        senderName
      );
      
      return notificationId;
    }
    
    // Otherwise, fetch sender's name from user document
    let fetchedSenderName = '';
    try {
      const senderDoc = await getDoc(doc(db, 'users', senderId));
      if (senderDoc.exists()) {
        const senderData = senderDoc.data();
        // Use username, displayName, or full name depending on what's available
        fetchedSenderName = senderData.username || senderData.displayName || 
                  (senderData.firstName && senderData.lastName ? 
                   `${senderData.firstName} ${senderData.lastName}` : '');
      }
    } catch (error) {
      console.error('Error fetching sender details:', error);
      // Continue even if we can't get the sender name
    }
    
    // Create notification with sender name if available
    const notificationId = await createMessageNotification(
      recipientId,
      senderId,
      messageContent,
      conversationId,
      fetchedSenderName
    );
    
    return notificationId;
  } catch (error) {
    console.error('Error creating message notification:', error);
    return undefined;
  }
} 