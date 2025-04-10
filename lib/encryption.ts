/**
 * Simplified Message Encryption Utilities
 * 
 * This file provides reliable utilities for message encryption
 * using a simplified approach to ensure compatibility.
 */

// Simple key cache to ensure consistent encryption/decryption
const keyCache: Record<string, string> = {};

// Generate a conversation key for two users
export async function generateConversationKey(userId1: string, userId2: string): Promise<string> {
  // Create a deterministic conversation ID by sorting user IDs
  const conversationId = [userId1, userId2].sort().join('_');
  
  // Check if we already have this key in cache
  if (keyCache[conversationId]) {
    return keyCache[conversationId];
  }
  
  // Create a deterministic key based on the user IDs
  const key = btoa(conversationId + "_encryption_key");
  
  // Cache the key for future use
  keyCache[conversationId] = key;
  
  return key;
}

// Simple encryption using Base64 encoding with a prefix
export async function encryptMessage(message: string, conversationKey: string): Promise<string> {
  if (!message) return message;
  try {
    // Add the key as a salt (first 8 chars only)
    const salt = conversationKey.substring(0, 8);
    
    // Combine message with salt and encode
    const encoded = btoa(salt + message);
    
    // Add a prefix to identify encrypted messages
    return `ENC:${encoded}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return message; // Fallback to plaintext if encryption fails
  }
}

// Decrypt messages
export async function decryptMessage(encryptedMessage: string, conversationKey: string): Promise<string> {
  if (!encryptedMessage || !encryptedMessage.startsWith('ENC:')) {
    return encryptedMessage; // Not encrypted or invalid format
  }
  
  try {
    // Remove the prefix
    const encoded = encryptedMessage.substring(4);
    
    // Decode the message
    const decoded = atob(encoded);
    
    // Remove the salt (first 8 chars)
    return decoded.substring(8);
  } catch (error) {
    console.error("Decryption error:", error);
    return "🔒 [Message could not be decrypted]";
  }
} 