"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  Send, 
  Search, 
  User, 
  Loader, 
  MessageSquare, 
  ChevronLeft,
  PlusCircle,
  X,
  Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { auth, db } from "@/lib/firebaseConfig"
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  setDoc,
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  Timestamp,
  limit,
  collectionGroup
} from "firebase/firestore"
import toast from "react-hot-toast"
import { 
  encryptMessage, 
  decryptMessage 
} from "@/lib/encryption"

// Define TypeScript interfaces
interface UserInfo {
  id: string
  username: string
  profilePicture: string
}

interface Conversation {
  id: string
  userIds: string[]
  otherUser: UserInfo | null
  lastMessage: string
  updatedAt: Timestamp | null
}

interface Message {
  id: string
  senderId: string
  message: string
  createdAt: Timestamp | null
}

export function MessageCenter() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null)
  const [mobileViewMode, setMobileViewMode] = useState<'list' | 'chat'>('list')
  const messageEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [atBottom, setAtBottom] = useState(true)
  
  // Check if user is at bottom of chat
  const checkIfAtBottom = () => {
    if (!messagesContainerRef.current) return

    // The scrollable container is now the parent element
    const scrollableParent = messagesContainerRef.current.parentElement
    if (!scrollableParent) return

    const { scrollTop, scrollHeight, clientHeight } = scrollableParent
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50
    setAtBottom(isAtBottom)
  }
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (atBottom && messageEndRef.current && messagesContainerRef.current) {
      // Use scrollTo instead of scrollIntoView to avoid whole page scrolling
      const container = messagesContainerRef.current
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth"
      })
    }
  }, [messages, atBottom])

  // Scroll to bottom whenever new messages arrive
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // If user was already at bottom or this is a new message being sent
      if (atBottom) {
        const container = messagesContainerRef.current
        setTimeout(() => {
          if (container) {
            // Find the actual scrollable parent which is now the container div
            const scrollableParent = container.parentElement
            if (scrollableParent) {
              scrollableParent.scrollTop = scrollableParent.scrollHeight
            }
          }
        }, 50)
      }
    }
  }, [messages.length, atBottom])

  // Check if user is authenticated
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        toast.error("You must be logged in to view messages")
        router.push("/auth/signin")
        return
      }
      
      // Get current user details
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid))
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setCurrentUser({
            id: user.uid,
            username: userData.username || "Anonymous",
            profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
          })
          
          // Fetch user conversations
          fetchConversations(user.uid)
        }
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    })
    
    return () => unsubscribe()
  }, [router])
  
  // Check for conversation ID in URL
  useEffect(() => {
    const checkUrlParams = async () => {
      if (!currentUser) return;

      const params = new URLSearchParams(window.location.search);
      const conversationId = params.get('conversation');
      
      if (conversationId) {
        try {
          // Get the conversation details
          const conversationDoc = await getDoc(doc(db, "conversations", conversationId));
          
          if (conversationDoc.exists()) {
            const conversationData = conversationDoc.data();
            
            // Make sure the current user is part of this conversation
            if (conversationData.userIds.includes(currentUser.id)) {
              // Get other user details
              const otherUserId = conversationData.userIds.find((id: string) => id !== currentUser.id);
              let otherUser: UserInfo | null = null;
              
              if (otherUserId) {
                const userDoc = await getDoc(doc(db, "users", otherUserId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  otherUser = {
                    id: otherUserId,
                    username: userData.username || "Anonymous",
                    profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
                  };
                }
              }
              
              // Set active conversation
              const conversation: Conversation = {
                id: conversationDoc.id,
                userIds: conversationData.userIds,
                otherUser,
                lastMessage: conversationData.lastMessage || "No messages yet",
                updatedAt: conversationData.updatedAt,
              };
              
              // Then select the conversation
              handleSelectConversation(conversation);
              setMobileViewMode('chat');
            }
          }
        } catch (error) {
          console.error("Error fetching conversation from URL:", error);
        }
      }
    };
    
    checkUrlParams();
  }, [currentUser]);
  
  // Function to fetch user conversations
  const fetchConversations = async (userId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Query conversations where the current user is a participant
      const conversationsRef = collection(db, "conversations")
      const conversationsQuery = query(
        conversationsRef,
        where("userIds", "array-contains", userId),
        orderBy("updatedAt", "desc")
      )
      
      // Set up real-time listener for conversations
      const unsubscribe = onSnapshot(conversationsQuery, async (querySnapshot) => {
        const conversationsPromises = querySnapshot.docs.map(async (conversationDoc) => {
          const conversationData = conversationDoc.data()
          
          // Get other user details
          const otherUserId = conversationData.userIds.find((id: string) => id !== userId)
          let otherUser: UserInfo | null = null
          
          if (otherUserId) {
            const userDoc = await getDoc(doc(db, "users", otherUserId))
            if (userDoc.exists()) {
              const userData = userDoc.data()
              otherUser = {
                id: otherUserId,
                username: userData.username || "Anonymous",
                profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
              }
            }
          }
          
          return {
            id: conversationDoc.id,
            userIds: conversationData.userIds || [],
            otherUser,
            lastMessage: conversationData.lastMessage || "No messages yet",
            updatedAt: conversationData.updatedAt,
          }
        })
        
        const conversationsData = await Promise.all(conversationsPromises)
        setConversations(conversationsData)
        setIsLoading(false)
      }, (error) => {
        console.error("Error in conversations snapshot listener:", error)
        setError("Error loading conversations. Please try again.")
        setIsLoading(false)
      })
      
      return unsubscribe
    } catch (error) {
      console.error("Error fetching conversations:", error)
      setError("Failed to load conversations. Please try again.")
      setIsLoading(false)
      return () => {}
    }
  }
  
  // Function to load messages for a conversation
  const loadMessages = async (conversationId: string) => {
    try {
      if (!currentUser) return () => {}
      
      // Get nested messages collection for this conversation
      const messagesRef = collection(db, `conversations/${conversationId}/messages`)
      const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
      )
      
      // Set up real-time listener for messages
      const unsubscribe = onSnapshot(messagesQuery, async (querySnapshot) => {
        const messagesData: Message[] = []
        
        // Process each message
        for (const doc of querySnapshot.docs) {
          const messageData = doc.data()
          const messageText = messageData.message as string
          
          try {
            // Decrypt the message
            const decryptedMessage = decryptMessage(messageText)
            
            messagesData.push({
              id: doc.id,
              senderId: messageData.senderId as string,
              message: decryptedMessage,
              createdAt: messageData.createdAt as Timestamp | null
            })
          } catch (error) {
            console.error("Error processing message:", error)
            // Fall back to original message
            messagesData.push({
              id: doc.id,
              senderId: messageData.senderId as string,
              message: "[Message could not be decrypted]",
              createdAt: messageData.createdAt as Timestamp | null
            })
          }
        }
        
        setMessages(messagesData)
      }, (error) => {
        console.error("Error in messages snapshot listener:", error)
        toast.error("Failed to load messages. Please try again.")
      })
      
      return unsubscribe
    } catch (error) {
      console.error("Error loading messages:", error)
      toast.error("Failed to load messages")
      return () => {}
    }
  }
  
  // Function to handle selecting a conversation
  const handleSelectConversation = async (conversation: Conversation) => {
    // First set the active conversation
    setActiveConversation(conversation)
    setMobileViewMode('chat')
    setAtBottom(true)
    
    // Clear messages while loading
    setMessages([])
    
    // Load messages for this conversation
    const unsubscribe = await loadMessages(conversation.id)
    return () => unsubscribe()
  }
  
  // Function to send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser) return
    
    try {
      // Encrypt the message before sending
      const messageToSend = encryptMessage(newMessage)
      const messagePreview = newMessage
      
      // Add message to the nested messages collection
      const messageRef = collection(db, `conversations/${activeConversation.id}/messages`)
      await addDoc(messageRef, {
        senderId: currentUser.id,
        message: messageToSend,
        createdAt: serverTimestamp(),
      })
      
      // Update the conversation with the last message (plain text for preview)
      await setDoc(doc(db, "conversations", activeConversation.id), {
        userIds: activeConversation.userIds,
        lastMessage: messagePreview.length > 30 ? messagePreview.substring(0, 27) + "..." : messagePreview,
        updatedAt: serverTimestamp()
      }, { merge: true })
      
      // Clear the input field
      setNewMessage("")

      // Ensure we're at the bottom after sending
      setAtBottom(true)
      
      // Force scroll to bottom immediately
      if (messagesContainerRef.current) {
        setTimeout(() => {
          const scrollableParent = messagesContainerRef.current?.parentElement
          if (scrollableParent) {
            scrollableParent.scrollTop = scrollableParent.scrollHeight
          }
        }, 100)
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }
  
  // Function to search for users
  const searchUsers = async (queryText: string) => {
    if (!queryText.trim() || queryText.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      // Query users where username contains the search query
      // Note: Firestore doesn't support true contains queries, this is an approximation
      const usersRef = collection(db, "users");
      const usersQuery = query(usersRef, limit(10));
      const querySnapshot = await getDocs(usersQuery);
      
      const results: UserInfo[] = [];
      querySnapshot.forEach((doc) => {
        // Skip the current user
        if (doc.id === currentUser?.id) return;
        
        const userData = doc.data();
        // Filter client-side since Firestore doesn't support contains
        const username = userData.username as string | undefined;
        const profilePicture = userData.profilePicture as string | undefined;
        
        if (username && 
            typeof username === 'string' && 
            username.toLowerCase().includes(queryText.toLowerCase())) {
          results.push({
            id: doc.id,
            username: username || "Anonymous",
            profilePicture: profilePicture || "/placeholder.svg?height=200&width=200",
          });
        }
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      toast.error("Error searching users");
    } finally {
      setIsSearching(false);
    }
  };

  // Function to generate a consistent conversation ID for two users
  const generateConversationId = (uid1: string, uid2: string): string => {
    return [uid1, uid2].sort().join('_');
  };

  // Function to start a conversation with a user
  const startConversation = async (recipientId: string, recipientName: string) => {
    if (!currentUser) return;
    
    try {
      // Generate consistent conversation ID
      const conversationId = generateConversationId(currentUser.id, recipientId);
      
      // Check if conversation exists
      const conversationRef = doc(db, "conversations", conversationId);
      const conversationSnap = await getDoc(conversationRef);
      
      let conversation: Conversation;
      
      if (conversationSnap.exists()) {
        // Conversation exists, get data
        const conversationData = conversationSnap.data();
        
        conversation = {
          id: conversationId,
          userIds: conversationData.userIds,
          otherUser: {
            id: recipientId,
            username: recipientName,
            profilePicture: "/placeholder.svg?height=200&width=200",
          },
          lastMessage: conversationData.lastMessage || "No messages yet",
          updatedAt: conversationData.updatedAt,
        };
      } else {
        // Create a new conversation
        await setDoc(conversationRef, {
          userIds: [currentUser.id, recipientId],
          lastMessage: "No messages yet",
          updatedAt: serverTimestamp()
        });
        
        conversation = {
          id: conversationId,
          userIds: [currentUser.id, recipientId],
          otherUser: {
            id: recipientId,
            username: recipientName,
            profilePicture: "/placeholder.svg?height=200&width=200",
          },
          lastMessage: "No messages yet",
          updatedAt: null
        };
      }
      
      // Open the conversation
      handleSelectConversation(conversation);
      
      // Close the modal
      setIsSearchModalOpen(false);
      setUserSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Error starting conversation");
    }
  };
  
  // Format timestamp to display
  const formatTimestamp = (timestamp: Timestamp | null): string => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today, show time
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // Within a week, show day name
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // More than a week, show date
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };
  
  // Render the component
  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/60 overflow-hidden h-full">
      <div className="grid md:grid-cols-12 h-full">
        {/* Conversations Sidebar */}
        <div className={`md:col-span-4 border-r border-zinc-800 flex flex-col ${mobileViewMode === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-800 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input
                  className="pl-10 bg-zinc-800/50 border-zinc-700"
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 border-zinc-700 text-zinc-300 hover:text-white hover:bg-zinc-800"
                onClick={() => setIsSearchModalOpen(true)}
                title="New Message"
              >
                <PlusCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader className="w-6 h-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-zinc-400">
                <div className="mb-4 text-red-400">{error}</div>
                <Button 
                  onClick={() => currentUser && fetchConversations(currentUser.id)}
                  variant="outline"
                  className="border-zinc-700"
                >
                  Retry
                </Button>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center text-zinc-400">
                <MessageSquare className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p>No conversations yet</p>
                <p className="text-sm mt-2">When you message other users, they'll appear here.</p>
              </div>
            ) : (
              conversations
                .filter(convo => 
                  convo.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map(conversation => (
                  <div
                    key={conversation.id}
                    className={`p-4 flex items-center gap-3 hover:bg-zinc-800/50 cursor-pointer transition-colors ${
                      activeConversation?.id === conversation.id ? "bg-zinc-800/80" : ""
                    }`}
                    onClick={() => handleSelectConversation(conversation)}
                  >
                    <Avatar className="h-12 w-12 border border-zinc-700">
                      <AvatarImage 
                        src={conversation.otherUser?.profilePicture} 
                        alt={conversation.otherUser?.username} 
                      />
                      <AvatarFallback className="bg-zinc-700">
                        {conversation.otherUser?.username.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">
                          {conversation.otherUser?.username || "Anonymous"}
                        </h3>
                        <span className="text-xs text-zinc-400">
                          {formatTimestamp(conversation.updatedAt)}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 truncate">{conversation.lastMessage}</p>
                    </div>
                  </div>
                ))
            )}
          </ScrollArea>
        </div>
        
        {/* Messages Area */}
        <div className={`md:col-span-8 h-full flex flex-col ${mobileViewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium mb-2">Your Messages</h3>
              <p className="max-w-md">
                Select a conversation from the sidebar to start chatting or search for a user to start a new conversation.
              </p>
            </div>
          ) : (
            <div className="flex flex-col h-full relative">
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center flex-shrink-0">
                <button 
                  className="md:hidden mr-2 p-1"
                  onClick={() => setMobileViewMode('list')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <Avatar className="h-10 w-10 border border-zinc-700">
                  <AvatarImage 
                    src={activeConversation.otherUser?.profilePicture} 
                    alt={activeConversation.otherUser?.username} 
                  />
                  <AvatarFallback className="bg-zinc-700">
                    {activeConversation.otherUser?.username.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-3 flex-1">
                  <h3 className="font-medium">
                    {activeConversation.otherUser?.username || "Anonymous"}
                  </h3>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-400 hover:text-white"
                  title="Conversation Info"
                >
                  <Info className="h-5 w-5" />
                </Button>
              </div>
              
              {/* Message Container - Positioned absolutely between header and input */}
              <div className="absolute top-[72px] bottom-[72px] left-0 right-0 overflow-y-auto overflow-x-hidden">
                {/* Messages List */}
                <div 
                  className="p-4 space-y-6 scroll-pt-4 relative min-h-full" 
                  ref={messagesContainerRef}
                  onScroll={checkIfAtBottom}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-400">
                      <p>No messages yet. Send a message to start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isCurrentUser = currentUser?.id === message.senderId
                      return (
                        <div 
                          key={message.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full`}
                        >
                          {!isCurrentUser && (
                            <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0 border border-zinc-700">
                              <AvatarImage 
                                src={activeConversation?.otherUser?.profilePicture} 
                                alt={activeConversation?.otherUser?.username} 
                              />
                              <AvatarFallback className="bg-zinc-700 text-xs">
                                {activeConversation?.otherUser?.username.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className={`max-w-[70%] rounded-lg py-2 px-4 ${
                            isCurrentUser 
                              ? 'bg-purple-800 text-white rounded-br-none' 
                              : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                          }`}>
                            <p className="break-words whitespace-normal overflow-hidden">
                              {message.message}
                            </p>
                            <div className={`text-xs mt-1 ${isCurrentUser ? 'text-purple-200' : 'text-zinc-400'}`}>
                              {message.createdAt ? 
                                new Date(message.createdAt.toDate()).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                }) : ''}
                            </div>
                          </div>
                          {isCurrentUser && (
                            <Avatar className="h-8 w-8 ml-2 mt-1 flex-shrink-0 border border-zinc-700">
                              <AvatarImage 
                                src={currentUser?.profilePicture} 
                                alt={currentUser?.username} 
                              />
                              <AvatarFallback className="bg-zinc-700 text-xs">
                                {currentUser?.username.charAt(0).toUpperCase() || "?"}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )
                    })
                  )}
                  <div ref={messageEndRef} className="h-px w-full absolute bottom-0" />
                </div>
              </div>
              
              {/* Message Input - Fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800 bg-zinc-900/80 z-10">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      className="flex-1 bg-zinc-800/50 border-zinc-700 pr-12 min-h-[2.75rem]"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                    />
                    <Button 
                      onClick={handleSendMessage}
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-purple-700 hover:bg-purple-800 h-8 w-8 p-0"
                      disabled={!newMessage.trim()}
                      type="submit"
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {isSearchModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl border border-zinc-800 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-semibold text-lg">New Message</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setIsSearchModalOpen(false);
                  setUserSearchQuery("");
                  setSearchResults([]);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            
            <div className="p-4 border-b border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400 h-4 w-4" />
                <Input
                  className="pl-10 bg-zinc-800/50 border-zinc-700"
                  placeholder="Search users..."
                  value={userSearchQuery}
                  onChange={(e) => {
                    setUserSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {isSearching ? (
                <div className="flex justify-center items-center h-20">
                  <Loader className="w-5 h-5 animate-spin" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-zinc-400 p-4">
                  {userSearchQuery.length > 0 ? "No users found" : "Type to search for users"}
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className="p-2 flex items-center gap-3 hover:bg-zinc-800/50 cursor-pointer transition-colors rounded-md"
                      onClick={() => startConversation(user.id, user.username)}
                    >
                      <Avatar className="h-10 w-10 border border-zinc-700">
                        <AvatarImage 
                          src={user.profilePicture} 
                          alt={user.username} 
                        />
                        <AvatarFallback className="bg-zinc-700">
                          {user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{user.username}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 