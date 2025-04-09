/**
 * Database Migration Script for Messages
 * 
 * This script migrates from the old flat messages/conversations structure to the new nested structure
 * where messages are stored as subcollections under conversations.
 * 
 * Steps:
 * 1. Fetch all existing conversations
 * 2. For each conversation, generate a consistent ID based on participant IDs
 * 3. Create a new conversation document with the consistent ID
 * 4. Fetch all messages for the conversation
 * 5. Create each message as a subcollection of the conversation
 * 6. (Optional) Delete the old data after successful migration
 * 
 * Run this script with Node.js: node scripts/migrate-messages.js
 */

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  getDocs, 
  getDoc,
  setDoc, 
  doc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch,
  limit
} = require('firebase/firestore');

// Load environment variables
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to generate a consistent conversation ID for two users
const generateConversationId = (uid1, uid2) => {
  return [uid1, uid2].sort().join('_');
};

// Function to migrate conversations
async function migrateConversations() {
  console.log('Starting conversation migration...');
  const conversationsRef = collection(db, 'conversations');
  const conversationsSnapshot = await getDocs(conversationsRef);
  
  // Track progress
  let total = conversationsSnapshot.size;
  let migrated = 0;
  let skipped = 0;
  let failed = 0;
  
  console.log(`Found ${total} conversations to migrate.`);
  
  for (const conversationDoc of conversationsSnapshot.docs) {
    try {
      // Skip test document
      if (conversationDoc.id === 'test_init_doc') {
        console.log('Skipping test document.');
        skipped++;
        continue;
      }
      
      const conversationData = conversationDoc.data();
      
      // Only migrate conversations with exactly 2 participants
      if (!conversationData.participantIds || conversationData.participantIds.length !== 2) {
        console.log(`Skipping conversation ${conversationDoc.id} - invalid participant count.`);
        skipped++;
        continue;
      }
      
      // Generate the new conversation ID
      const newConversationId = generateConversationId(
        conversationData.participantIds[0], 
        conversationData.participantIds[1]
      );
      
      // Check if the conversation with new ID already exists
      const newConversationRef = doc(db, 'conversations', newConversationId);
      const newConversationDoc = await getDoc(newConversationRef);
      
      if (newConversationDoc.exists()) {
        console.log(`Conversation with ID ${newConversationId} already exists. Skipping.`);
        skipped++;
        continue;
      }
      
      // Create the new conversation document
      await setDoc(newConversationRef, {
        userIds: conversationData.participantIds,
        lastMessage: conversationData.lastMessage || 'No messages yet',
        updatedAt: conversationData.lastMessageTime || serverTimestamp(),
      });
      
      // Migrate messages for this conversation
      await migrateMessagesForConversation(conversationDoc.id, newConversationId);
      
      migrated++;
      console.log(`Migrated conversation ${conversationDoc.id} to ${newConversationId} (${migrated}/${total})`);
    } catch (error) {
      console.error(`Error migrating conversation ${conversationDoc.id}:`, error);
      failed++;
    }
  }
  
  console.log(`\nMigration completed:`);
  console.log(`- Total conversations: ${total}`);
  console.log(`- Successfully migrated: ${migrated}`);
  console.log(`- Skipped: ${skipped}`);
  console.log(`- Failed: ${failed}`);
}

// Function to migrate messages for a specific conversation
async function migrateMessagesForConversation(oldConversationId, newConversationId) {
  console.log(`  Migrating messages for conversation ${oldConversationId} -> ${newConversationId}`);
  
  // Get all messages for the old conversation
  const messagesRef = collection(db, 'messages');
  const messagesQuery = query(
    messagesRef,
    where('conversationId', '==', oldConversationId),
    orderBy('timestamp', 'asc')
  );
  
  const messagesSnapshot = await getDocs(messagesQuery);
  const messageCount = messagesSnapshot.size;
  console.log(`  Found ${messageCount} messages to migrate.`);
  
  // Use batched writes for better performance and atomic operations
  // Firestore allows up to 500 operations per batch
  const BATCH_SIZE = 450; // Leave some room for safety
  let batchCount = 0;
  let batch = writeBatch(db);
  let operationCount = 0;
  let migratedCount = 0;
  
  for (const messageDoc of messagesSnapshot.docs) {
    try {
      const messageData = messageDoc.data();
      
      // Create a reference for the new message
      const newMessageRef = doc(collection(db, `conversations/${newConversationId}/messages`));
      
      // Add the message to the batch
      batch.set(newMessageRef, {
        senderId: messageData.senderId,
        message: messageData.text || '',
        createdAt: messageData.timestamp || serverTimestamp(),
      });
      
      operationCount++;
      migratedCount++;
      
      // If we've reached the batch size limit, commit and start a new batch
      if (operationCount >= BATCH_SIZE) {
        await batch.commit();
        batch = writeBatch(db);
        operationCount = 0;
        batchCount++;
        console.log(`  Committed batch ${batchCount} (${migratedCount}/${messageCount} messages)`);
      }
    } catch (error) {
      console.error(`  Error migrating message ${messageDoc.id}:`, error);
    }
  }
  
  // Commit any remaining operations
  if (operationCount > 0) {
    await batch.commit();
    batchCount++;
    console.log(`  Committed final batch ${batchCount} (${migratedCount}/${messageCount} messages)`);
  }
  
  console.log(`  Completed migrating ${migratedCount}/${messageCount} messages for conversation.`);
}

// Function to delete old data (only run after confirming migration was successful)
async function cleanupOldData(confirm = false) {
  if (!confirm) {
    console.log('\nSkipping cleanup of old data. To delete old data, run with confirm=true.');
    return;
  }
  
  console.log('\nCleaning up old data...');
  
  // Delete old messages
  const messagesRef = collection(db, 'messages');
  const messagesSnapshot = await getDocs(messagesRef);
  
  let deleted = 0;
  const total = messagesSnapshot.size;
  
  // Use batched deletes
  const BATCH_SIZE = 450;
  let batch = writeBatch(db);
  let operationCount = 0;
  let batchCount = 0;
  
  for (const messageDoc of messagesSnapshot.docs) {
    // Skip test document
    if (messageDoc.id === 'test_init_doc') continue;
    
    batch.delete(messageDoc.ref);
    operationCount++;
    deleted++;
    
    if (operationCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
      batchCount++;
      console.log(`Committed deletion batch ${batchCount} (${deleted}/${total} messages)`);
    }
  }
  
  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final deletion batch (${deleted}/${total} messages)`);
  }
  
  console.log(`Deleted ${deleted} old messages.`);
  
  // Note: We don't delete old conversations as they will be replaced by the new ones
  console.log('Cleanup completed.');
}

// Main migration function
async function runMigration() {
  try {
    console.log('Starting messages database migration...');
    
    // Migrate conversations and their messages
    await migrateConversations();
    
    // Uncomment to delete old data after confirming migration was successful
    // await cleanupOldData(true);
    
    console.log('\nMigration completed successfully!');
  } catch (error) {
    console.error('Migration failed with error:', error);
  }
}

// Run the migration
runMigration(); 