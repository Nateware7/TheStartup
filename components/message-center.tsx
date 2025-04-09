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
  X 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { auth, db } from "@/lib/firebaseConfig"
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  serverTimestamp, 
  onSnapshot,
  updateDoc,
  Timestamp,
  setDoc,
  limit
} from "firebase/firestore"
import toast from "react-hot-toast"

// Define TypeScript interfaces
interface UserInfo {
  id: string
  username: string
  profilePicture: string
}

interface Conversation {
  id: string
  participantIds: string[]
  participants: UserInfo[]
  lastMessage: string
  lastMessageTime: Timestamp | null
  unreadCount: number
}

interface Message {
  id: string
  conversationId: string
  senderId: string
  text: string
  timestamp: Timestamp | null
  read: boolean
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
  const [error, setError] = useState<string | null>(null)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserInfo[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Scroll to bottom of messages when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

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
          
          // Initialize collections if needed
          await initializeCollections()
          
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
            if (conversationData.participantIds.includes(currentUser.id)) {
              // Get participant details
              const participantsInfo: UserInfo[] = [];
              for (const participantId of conversationData.participantIds) {
                if (participantId !== currentUser.id) {
                  const userDoc = await getDoc(doc(db, "users", participantId));
                  if (userDoc.exists()) {
                    const userData = userDoc.data();
                    participantsInfo.push({
                      id: participantId,
                      username: userData.username || "Anonymous",
                      profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
                    });
                  }
                }
              }
              
              // Set active conversation
              const conversation: Conversation = {
                id: conversationDoc.id,
                participantIds: conversationData.participantIds,
                participants: participantsInfo,
                lastMessage: conversationData.lastMessage || "No messages yet",
                lastMessageTime: conversationData.lastMessageTime,
                unreadCount: conversationData.unreadCount?.[currentUser.id] || 0
              };
              
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
        where("participantIds", "array-contains", userId),
        orderBy("lastMessageTime", "desc")
      )
      
      // Set up real-time listener for conversations
      const unsubscribe = onSnapshot(conversationsQuery, async (querySnapshot) => {
        const conversationsData: Conversation[] = []
        
        // Process each conversation
        for (const conversationDoc of querySnapshot.docs) {
          const conversationData = conversationDoc.data()
          
          // Get participant details
          const participantsInfo: UserInfo[] = []
          if (conversationData.participantIds && Array.isArray(conversationData.participantIds)) {
            for (const participantId of conversationData.participantIds) {
              if (participantId !== userId) {
                const userDoc = await getDoc(doc(db, "users", participantId))
                if (userDoc.exists()) {
                  const userData = userDoc.data()
                  participantsInfo.push({
                    id: participantId,
                    username: userData.username as string || "Anonymous",
                    profilePicture: userData.profilePicture as string || "/placeholder.svg?height=200&width=200",
                  })
                }
              }
            }
          }
          
          conversationsData.push({
            id: conversationDoc.id,
            participantIds: conversationData.participantIds || [],
            participants: participantsInfo,
            lastMessage: conversationData.lastMessage || "No messages yet",
            lastMessageTime: conversationData.lastMessageTime,
            unreadCount: conversationData.unreadCount?.[userId] || 0
          })
        }
        
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
      // Query messages for the selected conversation
      const messagesRef = collection(db, "messages")
      const messagesQuery = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "asc")
      )
      
      // Set up real-time listener for messages
      const unsubscribe = onSnapshot(messagesQuery, (querySnapshot) => {
        const messagesData: Message[] = []
        
        querySnapshot.forEach((doc) => {
          const messageData = doc.data()
          messagesData.push({
            id: doc.id,
            conversationId: messageData.conversationId as string,
            senderId: messageData.senderId as string,
            text: messageData.text as string || "",
            timestamp: messageData.timestamp as Timestamp | null,
            read: messageData.read as boolean || false
          })
        })
        
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
    setActiveConversation(conversation)
    setMobileViewMode('chat')
    
    // Load messages for this conversation
    const unsubscribe = await loadMessages(conversation.id)
    
    // Mark messages as read
    // You would add code here to update the unread count
    
    return () => unsubscribe()
  }
  
  // Function to send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser) return
    
    try {
      // Add message to the messages collection
      await addDoc(collection(db, "messages"), {
        conversationId: activeConversation.id,
        senderId: currentUser.id,
        text: newMessage,
        timestamp: serverTimestamp(),
        read: false
      })
      
      // Update the conversation with the last message
      await updateDoc(doc(db, "conversations", activeConversation.id), {
        lastMessage: newMessage,
        lastMessageTime: serverTimestamp()
      })
      
      // Clear the input field
      setNewMessage("")
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    }
  }
  
  // Function to initialize collections if needed
  const initializeCollections = async () => {
    if (!currentUser) return;
    
    try {
      // Check if conversations collection exists by trying to get a document
      const conversationsRef = collection(db, "conversations");
      
      // Create a test document in conversations collection
      // This will create the collection if it doesn't exist
      const testConversationRef = doc(conversationsRef, "test_init_doc");
      
      try {
        // Try to get the document
        const testDoc = await getDoc(testConversationRef);
        
        // If it doesn't exist, create it
        if (!testDoc.exists()) {
          await setDoc(testConversationRef, {
            _isTestDoc: true,
            _createdAt: serverTimestamp(),
            participantIds: [currentUser.id],  // Include current user to match security rules
          });
          console.log("Created test document to initialize conversations collection");
        }
      } catch (error) {
        console.error("Error checking/creating test conversation document:", error);
      }
      
      // Similarly for messages collection
      const messagesRef = collection(db, "messages");
      const testMessageRef = doc(messagesRef, "test_init_doc");
      
      try {
        const testMessageDoc = await getDoc(testMessageRef);
        
        if (!testMessageDoc.exists()) {
          await setDoc(testMessageRef, {
            _isTestDoc: true,
            _createdAt: serverTimestamp(),
            senderId: currentUser.id,  // Include current user to match security rules
            conversationId: "test_init_doc"
          });
          console.log("Created test document to initialize messages collection");
        }
      } catch (error) {
        console.error("Error checking/creating test message document:", error);
      }
    } catch (error) {
      console.error("Error initializing collections:", error);
    }
  };
  
  // Add new function to search for users
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

  // Add new function to start a conversation with a user
  const startConversation = async (recipientId: string, recipientName: string) => {
    if (!currentUser) return;
    
    try {
      // First check if a conversation already exists between these users
      const conversationsRef = collection(db, "conversations");
      const conversationsQuery = query(
        conversationsRef,
        where("participantIds", "array-contains", currentUser.id)
      );
      
      const querySnapshot = await getDocs(conversationsQuery);
      let existingConversationId = null;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.participantIds && 
            Array.isArray(data.participantIds) && 
            data.participantIds.includes(recipientId)) {
          existingConversationId = doc.id;
        }
      });
      
      // If conversation already exists, just open it
      if (existingConversationId) {
        const conversationDoc = await getDoc(doc(db, "conversations", existingConversationId));
        if (conversationDoc.exists()) {
          const conversationData = conversationDoc.data();
          
          // Get participant details
          const participantsInfo: UserInfo[] = [];
          for (const participantId of conversationData.participantIds) {
            if (participantId !== currentUser.id) {
              const userDoc = await getDoc(doc(db, "users", participantId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                participantsInfo.push({
                  id: participantId,
                  username: userData.username || "Anonymous",
                  profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
                });
              }
            }
          }
          
          const conversation: Conversation = {
            id: existingConversationId,
            participantIds: conversationData.participantIds,
            participants: participantsInfo,
            lastMessage: conversationData.lastMessage || "No messages yet",
            lastMessageTime: conversationData.lastMessageTime,
            unreadCount: conversationData.unreadCount?.[currentUser.id] || 0
          };
          
          handleSelectConversation(conversation);
        }
      } else {
        // Create a new conversation
        const newConversation = await addDoc(conversationsRef, {
          participantIds: [currentUser.id, recipientId],
          lastMessageTime: serverTimestamp(),
          lastMessage: "No messages yet",
          createdAt: serverTimestamp(),
          unreadCount: {
            [currentUser.id]: 0,
            [recipientId]: 0
          }
        });
        
        // Get conversation with participant info
        const newConversationObj: Conversation = {
          id: newConversation.id,
          participantIds: [currentUser.id, recipientId],
          participants: [{
            id: recipientId,
            username: recipientName,
            profilePicture: "/placeholder.svg?height=200&width=200",  // We can update this later
          }],
          lastMessage: "No messages yet",
          lastMessageTime: null,
          unreadCount: 0
        };
        
        handleSelectConversation(newConversationObj);
      }
      
      // Close the modal
      setIsSearchModalOpen(false);
      setUserSearchQuery("");
      setSearchResults([]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Error starting conversation");
    }
  };
  
  // Render the component
  return (
    <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/60 overflow-hidden">
      <div className="grid md:grid-cols-12 min-h-[600px]">
        {/* Conversations Sidebar */}
        <div className={`md:col-span-4 border-r border-zinc-800 ${mobileViewMode === 'chat' ? 'hidden md:block' : 'block'}`}>
          <div className="p-4 border-b border-zinc-800">
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
          
          <div className="overflow-y-auto max-h-[535px]">
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
                  convo.participants.some(p => 
                    p.username.toLowerCase().includes(searchQuery.toLowerCase())
                  )
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
                        src={conversation.participants[0]?.profilePicture} 
                        alt={conversation.participants[0]?.username} 
                      />
                      <AvatarFallback className="bg-zinc-700">
                        {conversation.participants[0]?.username.charAt(0).toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium truncate">
                          {conversation.participants[0]?.username || "Anonymous"}
                        </h3>
                        <span className="text-xs text-zinc-400">
                          {conversation.lastMessageTime ? 
                            new Date(conversation.lastMessageTime.toDate()).toLocaleDateString('en-US', {
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : ''}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-400 truncate">{conversation.lastMessage}</p>
                    </div>
                    
                    {conversation.unreadCount > 0 && (
                      <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center text-xs">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
        
        {/* Messages Area */}
        <div className={`md:col-span-8 flex flex-col ${mobileViewMode === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
              <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
              <h3 className="text-xl font-medium mb-2">Your Messages</h3>
              <p className="max-w-md">
                Select a conversation from the sidebar to start chatting or search for a user to start a new conversation.
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-zinc-800 flex items-center">
                <button 
                  className="md:hidden mr-2 p-1"
                  onClick={() => setMobileViewMode('list')}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
                <Avatar className="h-10 w-10 border border-zinc-700">
                  <AvatarImage 
                    src={activeConversation.participants[0]?.profilePicture} 
                    alt={activeConversation.participants[0]?.username} 
                  />
                  <AvatarFallback className="bg-zinc-700">
                    {activeConversation.participants[0]?.username.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="ml-3">
                  <h3 className="font-medium">
                    {activeConversation.participants[0]?.username || "Anonymous"}
                  </h3>
                </div>
              </div>
              
              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
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
                              src={activeConversation?.participants[0]?.profilePicture} 
                              alt={activeConversation?.participants[0]?.username} 
                            />
                            <AvatarFallback className="bg-zinc-700 text-xs">
                              {activeConversation?.participants[0]?.username.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className={`max-w-[70%] rounded-lg py-2 px-4 ${
                          isCurrentUser 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                        }`}>
                          <p className="break-words">{message.text}</p>
                          <div className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-200' : 'text-zinc-400'}`}>
                            {message.timestamp ? 
                              new Date(message.timestamp.toDate()).toLocaleTimeString('en-US', {
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
                <div ref={messageEndRef} />
              </div>
              
              {/* Message Input */}
              <div className="p-4 border-t border-zinc-800">
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
                      className="absolute right-1 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0"
                      disabled={!newMessage.trim()}
                      type="submit"
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
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