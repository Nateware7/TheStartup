import { createMessageNotification } from './notification';

/**
 * Handle sending a notification for a new message
 * 
 * @param recipientId The ID of the message recipient
 * @param senderId The ID of the message sender
 * @param messageContent The content of the message
 * @param conversationId The ID of the conversation
 * @returns The ID of the created notification
 */
export async function handleMessageNotification(
  recipientId: string,
  senderId: string,
  messageContent: string,
  conversationId: string
): Promise<string | undefined> {
  try {
    // Skip notifications if sender and recipient are the same
    if (recipientId === senderId) {
      return;
    }
    
    // Create notification
    const notificationId = await createMessageNotification(
      recipientId,
      senderId,
      messageContent,
      conversationId
    );
    
    return notificationId;
  } catch (error) {
    console.error('Error creating message notification:', error);
    return undefined;
  }
} 