/**
 * Message Encryption Utilities
 * 
 * This file provides utilities for end-to-end encryption of messages
 * using the Web Crypto API.
 */

// Generate a conversation key for two users
export async function generateConversationKey(userId1: string, userId2: string): Promise<string> {
  // Create a deterministic seed based on the user IDs (always sorted to ensure consistency)
  const seed = [userId1, userId2].sort().join('_');
  
  // Convert the seed to a key using SHA-256
  const encoder = new TextEncoder();
  const data = encoder.encode(seed);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert to base64 for storage
  return bufferToBase64(hashBuffer);
}

// Encrypt a message
export async function encryptMessage(message: string, conversationKey: string): Promise<string> {
  try {
    // Convert base64 key back to CryptoKey
    const key = await deriveKeyFromString(conversationKey);
    
    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the message
    const encoder = new TextEncoder();
    const encodedMessage = encoder.encode(message);
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedMessage
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Return as base64 string
    return bufferToBase64(result.buffer);
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt message');
  }
}

// Decrypt a message
export async function decryptMessage(encryptedMessage: string, conversationKey: string): Promise<string> {
  try {
    // Convert base64 key back to CryptoKey
    const key = await deriveKeyFromString(conversationKey);
    
    // Decode the base64 encrypted message
    const encryptedData = base64ToBuffer(encryptedMessage);
    
    // Extract IV (first 12 bytes) and encrypted data
    const iv = encryptedData.slice(0, 12);
    const ciphertext = encryptedData.slice(12);
    
    // Decrypt the message
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    
    // Convert the decrypted data back to a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt message');
  }
}

// Helper function to convert an ArrayBuffer to a base64 string
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper function to convert a base64 string to an ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper function to derive a CryptoKey from a string
async function deriveKeyFromString(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  
  // Hash the key string to get a suitable key material
  const keyMaterial = await crypto.subtle.digest('SHA-256', keyData);
  
  // Import the key
  return crypto.subtle.importKey(
    'raw',
    keyMaterial,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
} 