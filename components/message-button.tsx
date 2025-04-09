"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { auth, db } from '@/lib/firebaseConfig'
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  serverTimestamp,
  getDoc,
  doc,
  setDoc
} from 'firebase/firestore'
import toast from 'react-hot-toast'

interface MessageButtonProps {
  recipientId: string
  recipientName: string
  variant?: 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

export function MessageButton({
  recipientId,
  recipientName,
  variant = 'default',
  size = 'default',
  className = ''
}: MessageButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  // Function to initialize collections if they don't exist
  const initializeCollections = async (userId: string) => {
    try {
      // Check if conversations collection exists
      const conversationsRef = collection(db, 'conversations')
      const testConversationRef = doc(conversationsRef, 'test_init_doc')
      
      try {
        const testDoc = await getDoc(testConversationRef)
        
        if (!testDoc.exists()) {
          await setDoc(testConversationRef, {
            _isTestDoc: true,
            _createdAt: serverTimestamp(),
            participantIds: [userId],
          })
          console.log("Created test document to initialize conversations collection")
        }
      } catch (error) {
        console.error("Error initializing conversations collection:", error)
      }
      
      // Check if messages collection exists
      const messagesRef = collection(db, 'messages')
      const testMessageRef = doc(messagesRef, 'test_init_doc')
      
      try {
        const testMessageDoc = await getDoc(testMessageRef)
        
        if (!testMessageDoc.exists()) {
          await setDoc(testMessageRef, {
            _isTestDoc: true,
            _createdAt: serverTimestamp(),
            senderId: userId,
            conversationId: 'test_init_doc'
          })
          console.log("Created test document to initialize messages collection")
        }
      } catch (error) {
        console.error("Error initializing messages collection:", error)
      }
    } catch (error) {
      console.error("Error initializing collections:", error)
    }
  }

  const handleMessageClick = async () => {
    try {
      setIsLoading(true)
      const user = auth.currentUser
      
      if (!user) {
        toast.error('You must be logged in to send messages')
        router.push('/auth/signin')
        return
      }
      
      // Don't allow messaging yourself
      if (user.uid === recipientId) {
        toast.error("You can't message yourself")
        return
      }
      
      // Initialize collections if needed
      await initializeCollections(user.uid)
      
      // Check if a conversation already exists between these users
      const conversationsRef = collection(db, 'conversations')
      const q = query(
        conversationsRef,
        where('participantIds', 'array-contains', user.uid)
      )
      
      const querySnapshot = await getDocs(q)
      let existingConversationId = null
      
      querySnapshot.forEach(doc => {
        const data = doc.data()
        if (data.participantIds.includes(recipientId)) {
          existingConversationId = doc.id
        }
      })
      
      // Navigate to existing conversation if found
      if (existingConversationId) {
        router.push(`/messages?conversation=${existingConversationId}`)
        return
      }
      
      // Create a new conversation
      const newConversation = await addDoc(conversationsRef, {
        participantIds: [user.uid, recipientId],
        lastMessageTime: serverTimestamp(),
        lastMessage: "No messages yet",
        createdAt: serverTimestamp(),
        unreadCount: {
          [user.uid]: 0,
          [recipientId]: 0
        }
      })
      
      // Navigate to the new conversation
      router.push(`/messages?conversation=${newConversation.id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error('Failed to start conversation')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleMessageClick}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4 mr-2" />
      )}
      {isLoading ? "Opening chat..." : `Message ${recipientName}`}
    </Button>
  )
} 