/**
 * Message Encryption Utilities
 * 
 * This file provides utilities for message encryption using CryptoJS.
 */

import CryptoJS from "crypto-js";

const SECRET_KEY = process.env.NEXT_PUBLIC_CHAT_KEY || "bxt-message-key";

export function encryptMessage(text: string): string {
  const ciphertext = CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
  return `ENC:${ciphertext}`;
}

export function decryptMessage(encryptedText: string): string {
  if (!encryptedText.startsWith("ENC:")) return encryptedText;
  try {
    const base64 = encryptedText.replace("ENC:", "");
    const bytes = CryptoJS.AES.decrypt(base64, SECRET_KEY);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);
    return originalText || "[Decryption failed]";
  } catch {
    return "[Invalid encrypted message]";
  }
} 