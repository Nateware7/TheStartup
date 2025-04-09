import { NextRequest, NextResponse } from 'next/server'
import { auth, db } from '@/lib/firebaseConfig'
import { 
  collection, 
  addDoc, 
  getDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  orderBy,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore'

// This is a helper to validate the user's auth token
async function validateUser(token: string) {
  try {
    // This would need Firebase Admin SDK to properly verify tokens
    // For now, we'll just check if a user with that ID exists
    // In a real implementation, you'd verify the token server-side
    const userDoc = await getDoc(doc(db, 'users', token))
    return userDoc.exists() ? userDoc.data() : null
  } catch (error) {
    return null
  }
}

// GET handler - fetch conversations or messages
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')
  const type = searchParams.get('type') // 'conversations' or 'messages'
  const conversationId = searchParams.get('conversationId')
  
  // Validate the user
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const user = await validateUser(token)
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Fetch conversations
    if (type === 'conversations') {
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participantIds', 'array-contains', token),
        orderBy('lastMessageTime', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const conversations = []
      
      for (const conversationDoc of querySnapshot.docs) {
        const data = conversationDoc.data()
        
        // Fetch participant details for each conversation
        const participantsDetails = []
        for (const participantId of data.participantIds) {
          if (participantId !== token) {
            const userDoc = await getDoc(doc(db, 'users', participantId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              participantsDetails.push({
                id: participantId,
                username: userData.username as string || 'Anonymous',
                profilePicture: userData.profilePicture as string || "/placeholder.svg?height=200&width=200",
              })
            }
          }
        }
        
        conversations.push({
          id: conversationDoc.id,
          participantIds: data.participantIds,
          participants: participantsDetails,
          lastMessage: data.lastMessage || 'No messages yet',
          lastMessageTime: data.lastMessageTime,
          unreadCount: data.unreadCount?.[token] || 0
        })
      }
      
      return NextResponse.json({ conversations })
    }
    
    // Fetch messages for a specific conversation
    if (type === 'messages' && conversationId) {
      // First check if user is part of the conversation
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId))
      
      if (!conversationDoc.exists()) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      
      const conversationData = conversationDoc.data()
      if (!conversationData.participantIds.includes(token)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      // Fetch messages
      const messagesRef = collection(db, 'messages')
      const q = query(
        messagesRef,
        where('conversationId', '==', conversationId),
        orderBy('timestamp', 'asc')
      )
      
      const querySnapshot = await getDocs(q)
      const messages: Array<any> = []
      
      querySnapshot.forEach(doc => {
        const data = doc.data()
        messages.push({
          id: doc.id,
          ...data,
        })
      })
      
      return NextResponse.json({ messages })
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

// POST handler - create new message or conversation
export async function POST(request: NextRequest) {
  try {
    const { token, type, conversationId, recipientId, message } = await request.json()
    
    // Validate the user
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await validateUser(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Create a new conversation
    if (type === 'conversation' && recipientId) {
      // Check if a conversation already exists between these users
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participantIds', 'array-contains', token)
      )
      
      const querySnapshot = await getDocs(q)
      let existingConversationId = null
      
      querySnapshot.forEach(doc => {
        const data = doc.data()
        if (data.participantIds.includes(recipientId)) {
          existingConversationId = doc.id
        }
      })
      
      // Return existing conversation if found
      if (existingConversationId) {
        return NextResponse.json({ 
          success: true, 
          conversationId: existingConversationId,
          existing: true
        })
      }
      
      // Create a new conversation
      const newConversation = await addDoc(conversationsRef, {
        participantIds: [token, recipientId],
        lastMessageTime: serverTimestamp(),
        lastMessage: "No messages yet",
        createdAt: serverTimestamp(),
        unreadCount: {
          [token]: 0,
          [recipientId]: 0
        }
      })
      
      return NextResponse.json({ 
        success: true, 
        conversationId: newConversation.id,
        existing: false
      })
    }
    
    // Send a new message
    if (type === 'message' && conversationId && message) {
      // First check if user is part of the conversation
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId))
      
      if (!conversationDoc.exists()) {
        return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
      }
      
      const conversationData = conversationDoc.data()
      if (!conversationData.participantIds.includes(token)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
      
      // Add the message
      const messageRef = await addDoc(collection(db, 'messages'), {
        conversationId,
        senderId: token,
        text: message,
        timestamp: serverTimestamp(),
        read: false
      })
      
      // Update the conversation with last message
      const recipientId = conversationData.participantIds.find((id: string) => id !== token)
      
      // Update unread count for recipient
      const unreadCount = {
        ...conversationData.unreadCount,
        [recipientId]: (conversationData.unreadCount?.[recipientId] || 0) + 1
      }
      
      await updateDoc(doc(db, 'conversations', conversationId), {
        lastMessage: message,
        lastMessageTime: serverTimestamp(),
        unreadCount
      })
      
      return NextResponse.json({ 
        success: true, 
        messageId: messageRef.id 
      })
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error processing request:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
} 