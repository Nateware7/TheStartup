"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { auth, db } from '@/lib/firebaseConfig'
import { 
  doc, 
  getDoc,
  setDoc,
  serverTimestamp
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

  // Function to generate a consistent conversation ID for two users
  const generateConversationId = (uid1: string, uid2: string): string => {
    return [uid1, uid2].sort().join('_');
  };

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
      
      // Generate the conversation ID
      const conversationId = generateConversationId(user.uid, recipientId)
      
      // Check if the conversation already exists
      const conversationRef = doc(db, 'conversations', conversationId)
      const conversationDoc = await getDoc(conversationRef)
      
      if (!conversationDoc.exists()) {
        // Create a new conversation with the generated ID
        await setDoc(conversationRef, {
          userIds: [user.uid, recipientId],
          lastMessage: "No messages yet",
          updatedAt: serverTimestamp()
        })
      }
      
      // Navigate to the conversation
      router.push(`/messages?conversation=${conversationId}`)
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