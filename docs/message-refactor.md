# Message Center Refactoring

This document outlines the changes made to refactor the messaging feature of the application.

## Database Structure Changes

### Old Structure
- Conversations collection: `/conversations/{auto-generated-id}`
  - `participantIds`: Array of user IDs
  - `participants`: Array of user info objects
  - `lastMessage`: String
  - `lastMessageTime`: Timestamp
  - `unreadCount`: Object mapping user IDs to unread count

- Messages collection: `/messages/{auto-generated-id}`
  - `conversationId`: Reference to conversation
  - `senderId`: User ID
  - `text`: Message content
  - `timestamp`: Timestamp
  - `read`: Boolean

### New Structure
- Conversations collection: `/conversations/{user1_user2}`
  - `userIds`: Array of user IDs
  - `lastMessage`: String
  - `updatedAt`: Timestamp

- Messages subcollection: `/conversations/{conversationId}/messages/{auto-generated-id}`
  - `senderId`: User ID
  - `message`: Message content
  - `createdAt`: Timestamp

## Key Improvements

1. **Deterministic Conversation IDs**
   - Conversation IDs are now generated from the sorted user IDs (`user1_user2`)
   - This ensures a consistent ID for the same conversation, preventing duplicates
   - Makes it easier to look up conversations between specific users

2. **Nested Collections**
   - Messages are now stored as subcollections under their respective conversations
   - Improves data organization and makes queries more efficient
   - Better aligns with Firestore best practices for related data

3. **Simplified Data Model**
   - Removed redundant fields and simplified the schema
   - Removed unread counts (can be added back later if needed)
   - Renamed fields to be more consistent (`updatedAt` instead of `lastMessageTime`)

4. **UI Improvements**
   - Added auto-scroll detection to only auto-scroll when user is at the bottom
   - Made the layout fully responsive with proper mobile support
   - Fixed header to remain at the top while scrolling
   - Improved timestamp formatting for better readability
   - Used proper flex layout for better space utilization

## Migration

A migration script was created to help migrate data from the old structure to the new structure:

1. For each existing conversation:
   - Generate a new consistent conversation ID
   - Create a new conversation document with the new ID
   - Migrate all messages to the new subcollection

2. The script includes options to:
   - Skip conversations that have already been migrated
   - Track progress with detailed logs
   - Clean up old data (optional) after migration is complete

## Files Changed

1. `components/message-center.tsx`
   - Complete redesign of the message center component
   - Updated to use the new data structure
   - Improved UX with scrolling behavior, better timestamps, etc.

2. `components/message-button.tsx`
   - Updated to use the new conversation ID generation
   - Simplified to use the deterministic IDs instead of querying

3. `app/messages/page.tsx`
   - Updated layout to fix the navbar and improve spacing

4. `scripts/migrate-messages.js`
   - Created migration script to transfer data from old to new structure 