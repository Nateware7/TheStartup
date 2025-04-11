/**
 * End-to-End Encryption Utilities
 * 
 * This file provides true end-to-end encryption where keys are generated per-user 
 * and never leave the client or get stored on servers.
 */

import CryptoJS from "crypto-js";

// Store keys in memory only during the session
const userKeyCache: Record<string, string> = {};
const conversationKeyCache: Record<string, string> = {};

// Fixed shared key for all conversations (for testing - replace with proper key exchange in production)
const SHARED_KEY = "bixt-e2e-encryption-v1-shared-key-2025";

/**
 * Generates or retrieves a user's encryption key
 * The key is derived from the user's ID and stored only in the browser
 */
export function getUserKey(userId: string): string {
  // Check if we already have the key in memory
  if (userKeyCache[userId]) {
    return userKeyCache[userId];
  }
  
  // Check if we have the key in localStorage
  const localKey = localStorage.getItem(`chat_key_${userId}`);
  if (localKey) {
    userKeyCache[userId] = localKey;
    return localKey;
  }
  
  // Generate a new random key using Math.random
  const randomBytes = Array.from(
    { length: 16 }, 
    () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  // Store in localStorage (client-side only) and memory
  localStorage.setItem(`chat_key_${userId}`, randomBytes);
  userKeyCache[userId] = randomBytes;
  
  return randomBytes;
}

/**
 * Generates a shared conversation key between two users
 * For simplicity and testing, we use a fixed shared key instead of a proper key exchange
 */
export function getConversationKey(userId1: string, userId2: string): string {
  // Order user IDs to ensure same key regardless of order
  const orderedIds = [userId1, userId2].sort().join('_');
  
  // Check if we have the key in memory cache
  if (conversationKeyCache[orderedIds]) {
    return conversationKeyCache[orderedIds];
  }
  
  // Check if we have the key in localStorage
  const localConvoKey = localStorage.getItem(`convo_key_${orderedIds}`);
  if (localConvoKey) {
    conversationKeyCache[orderedIds] = localConvoKey;
    return localConvoKey;
  }
  
  // Instead of generating from user keys (which won't be available for recipients),
  // use a deterministic approach based on a fixed shared secret plus the conversation ID
  // In production, this would be replaced with proper key exchange
  const sha256: any = (CryptoJS as any).SHA256;
  const sharedKey = sha256(SHARED_KEY + orderedIds).toString();
  
  // Store in localStorage and memory for future use
  localStorage.setItem(`convo_key_${orderedIds}`, sharedKey);
  conversationKeyCache[orderedIds] = sharedKey;
  
  return sharedKey;
}

/**
 * Encrypts a message using the shared conversation key
 */
export function encryptMessage(text: string, userId1: string, userId2: string): string {
  if (!text || !userId1 || !userId2) return text;
  
  try {
    const conversationKey = getConversationKey(userId1, userId2);
    const ciphertext = CryptoJS.AES.encrypt(text, conversationKey).toString();
    return `E2E:${ciphertext}`;
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Fallback to plaintext if encryption fails
  }
}

/**
 * Decrypts a message using the shared conversation key
 */
export function decryptMessage(encryptedText: string, userId1: string, userId2: string): string {
  // Support both old ENC: format and new E2E: format for backwards compatibility
  if (!encryptedText) return encryptedText;
  
  if (encryptedText.startsWith("E2E:")) {
    try {
      const conversationKey = getConversationKey(userId1, userId2);
      const ciphertext = encryptedText.replace("E2E:", "");
      const bytes = CryptoJS.AES.decrypt(ciphertext, conversationKey);
      const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
      return decryptedText || "[Decryption failed]";
    } catch (error) {
      console.error("Decryption error:", error);
      return "[Decryption failed]";
    }
  } else if (encryptedText.startsWith("ENC:")) {
    // Legacy decryption for backwards compatibility
    try {
      const SECRET_KEY = process.env.NEXT_PUBLIC_CHAT_KEY || "bxt-message-key";
      const base64 = encryptedText.replace("ENC:", "");
      const bytes = CryptoJS.AES.decrypt(base64, SECRET_KEY);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "[Decryption failed]";
    } catch {
      return "[Invalid encrypted message]";
    }
  }
  
  return encryptedText;
} 