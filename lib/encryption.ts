/**
 * Message Utilities
 * 
 * This file now provides simple pass-through utilities since encryption has been disabled.
 * The functions remain for compatibility but don't perform any actual encryption.
 */

// Generate a conversation key for two users - returns a placeholder string
export async function generateConversationKey(userId1: string, userId2: string): Promise<string> {
  // Just return a simple placeholder - no actual encryption happens
  return "no-encryption-used";
}

// Encrypt a message - now just returns the original message
export async function encryptMessage(message: string, conversationKey: string): Promise<string> {
  // Just return the original message - no encryption
  return message;
}

// Decrypt a message - now just returns the original message
export async function decryptMessage(encryptedMessage: string, conversationKey: string): Promise<string> {
  // Just return the message as-is - no decryption
  return encryptedMessage;
} 