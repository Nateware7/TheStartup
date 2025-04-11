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
import { handleMessageNotification } from "@/lib/message-notification-utils"

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
  replyTo?: {
    messageId: string
    textPreview: string
    senderUsername: string
  }
}

interface ParticipantStatus {
  lastSeenAt: Timestamp | null
  isTyping: boolean
}

// For grouping messages
interface MessageGroup {
  senderId: string
  senderName: string
  senderProfilePic: string
  messages: Message[]
  timestamp: Date
}

// For day separators
interface DaySeparator {
  date: Date
  type: 'today' | 'yesterday' | 'date'
  label: string
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
  
  // New state variables for enhanced features
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null)
  const [participantStatus, setParticipantStatus] = useState<Record<string, ParticipantStatus>>({})
  const [isTyping, setIsTyping] = useState(false)
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const [messageGroups, setMessageGroups] = useState<MessageGroup[]>([])
  const [daySeparators, setDaySeparators] = useState<Record<string, DaySeparator>>({})
  
  // Add CSS for message highlighting
  useEffect(() => {
    // Add the CSS for the highlight animation
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes highlight-pulse {
        0% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0.7); }
        70% { box-shadow: 0 0 0 10px rgba(147, 51, 234, 0); }
        100% { box-shadow: 0 0 0 0 rgba(147, 51, 234, 0); }
      }
      
      .highlight-message {
        animation: highlight-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1);
      }
    `;
    document.head.appendChild(style);
    
    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
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
  
  // Update typing status
  const updateTypingStatus = (isCurrentlyTyping: boolean) => {
    if (!currentUser || !activeConversation) return;
    
    try {
      // Create a reference to the participant status document
      const statusRef = doc(db, `conversations/${activeConversation.id}/participants/${currentUser.id}`);
      
      // Update the status
      setDoc(statusRef, {
        isTyping: isCurrentlyTyping,
        // Also update the lastSeenAt whenever we do any action
        lastSeenAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating typing status:", error);
    }
  };
  
  // Handle input change with debounced typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Update the input value
    setNewMessage(e.target.value);
    
    // If not currently marked as typing, update status
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(true);
    }
    
    // Clear any existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set a new timeout to stop typing indicator after 2.5 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(false);
    }, 2500);
    
    setTypingTimeout(timeout);
  };
  
  // Update the last seen status
  const updateLastSeen = () => {
    if (!currentUser || !activeConversation) return;
    
    try {
      // Create a reference to the participant status document
      const statusRef = doc(db, `conversations/${activeConversation.id}/participants/${currentUser.id}`);
      
      // Update the lastSeenAt field
      setDoc(statusRef, {
        lastSeenAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error updating last seen status:", error);
    }
  };
  
  // Group messages by sender and time
  const groupMessages = (messages: Message[]): MessageGroup[] => {
    if (!messages.length) return [];
    
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;
    
    // Sort messages by timestamp
    const sortedMessages = [...messages].sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.toMillis() - b.createdAt.toMillis();
    });
    
    sortedMessages.forEach((message) => {
      if (!message.createdAt) return;
      
      const messageTime = message.createdAt.toDate();
      const sender = message.senderId;
      const senderInfo = sender === currentUser?.id 
        ? { name: currentUser.username, profilePic: currentUser.profilePicture }
        : { name: activeConversation?.otherUser?.username || "User", profilePic: activeConversation?.otherUser?.profilePicture || "" };
      
      // Start a new group if:
      // 1. No current group
      // 2. Different sender 
      // 3. Time gap > 1 minute
      if (!currentGroup || 
          currentGroup.senderId !== sender || 
          Math.abs(messageTime.getTime() - currentGroup.timestamp.getTime()) > 60000) {
        
        // Push the previous group if it exists
        if (currentGroup) {
          groups.push(currentGroup);
        }
        
        // Start a new group
        currentGroup = {
          senderId: sender,
          senderName: senderInfo.name,
          senderProfilePic: senderInfo.profilePic,
          messages: [message],
          timestamp: messageTime
        };
      } else {
        // Add to the current group
        currentGroup.messages.push(message);
        // Update the timestamp to the latest message
        currentGroup.timestamp = messageTime;
      }
    });
    
    // Add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  };
  
  // Create day separators
  const createDaySeparators = (messages: Message[]): Record<string, DaySeparator> => {
    const separators: Record<string, DaySeparator> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    messages.forEach((message) => {
      if (!message.createdAt) return;
      
      const messageDate = message.createdAt.toDate();
      messageDate.setHours(0, 0, 0, 0);
      
      const messageDay = messageDate.toDateString();
      
      // Skip if we already have this day
      if (separators[messageDay]) return;
      
      // Create the appropriate separator
      if (messageDate.getTime() === today.getTime()) {
        separators[messageDay] = {
          date: messageDate,
          type: 'today',
          label: 'Today'
        };
      } else if (messageDate.getTime() === yesterday.getTime()) {
        separators[messageDay] = {
          date: messageDate,
          type: 'yesterday',
          label: 'Yesterday'
        };
      } else {
        separators[messageDay] = {
          date: messageDate,
          type: 'date',
          label: messageDate.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric',
            year: 'numeric'
          })
        };
      }
    });
    
    return separators;
  };
  
  // Update message groups when messages change
  useEffect(() => {
    const groups = groupMessages(messages);
    setMessageGroups(groups);
    
    const separators = createDaySeparators(messages);
    setDaySeparators(separators);
  }, [messages, currentUser?.id, activeConversation?.otherUser]);
  
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
  
  // Function to handle selecting a conversation
  const handleSelectConversation = async (conversation: Conversation) => {
    // First set the active conversation and clear any previous messages
    setActiveConversation(conversation);
    setMobileViewMode('chat');
    setAtBottom(true);
    setMessages([]);
    setReplyToMessage(null);  // Clear any pending replies
    
    // Store key conversation data in a local variable to ensure it's available for the loadMessages function
    const selectedConversation = {
      id: conversation.id,
      otherUserId: conversation.otherUser?.id || ''
    };
    
    // Load messages directly with the necessary conversation data instead of relying on state
    if (currentUser && selectedConversation.id && selectedConversation.otherUserId) {
      const unsubscribe = await loadMessagesWithUserIds(
        selectedConversation.id, 
        currentUser.id, 
        selectedConversation.otherUserId
      );
      // We could store this unsubscribe function if needed
    }
  };
  
  // New function that loads and decrypts messages with explicit user IDs
  const loadMessagesWithUserIds = async (conversationId: string, currentUserId: string, otherUserId: string) => {
    try {
      if (!currentUserId || !otherUserId) return () => {};
      
      // Get nested messages collection for this conversation
      const messagesRef = collection(db, `conversations/${conversationId}/messages`);
      const messagesQuery = query(
        messagesRef,
        orderBy("createdAt", "asc")
      );
      
      // Set up real-time listener for messages
      const unsubscribeMessages = onSnapshot(messagesQuery, async (querySnapshot) => {
        const messagesData: Message[] = [];
        
        // Process each message
        for (const doc of querySnapshot.docs) {
          const messageData = doc.data();
          const messageText = messageData.message as string;
          
          try {
            // Decrypt with the explicit user IDs we passed in
            const decryptedMessage = decryptMessage(
              messageText, 
              currentUserId,
              otherUserId
            );
            
            // Extract and process reply data if it exists
            let replyToData = messageData.replyTo;
            if (replyToData) {
              // If the reply text is encrypted, decrypt it
              if (replyToData.textPreview && typeof replyToData.textPreview === 'string' && replyToData.textPreview.startsWith('E2E:')) {
                replyToData.textPreview = decryptMessage(
                  replyToData.textPreview,
                  currentUserId,
                  otherUserId
                );
              }
            }
            
            messagesData.push({
              id: doc.id,
              senderId: messageData.senderId as string,
              message: decryptedMessage,
              createdAt: messageData.createdAt as Timestamp | null,
              replyTo: replyToData
            });
          } catch (error) {
            console.error("Error processing message:", error);
            // Fall back to original message
            messagesData.push({
              id: doc.id,
              senderId: messageData.senderId as string,
              message: "[Message could not be decrypted]",
              createdAt: messageData.createdAt as Timestamp | null
            });
          }
        }
        
        setMessages(messagesData);
        
        // When messages are loaded, update our lastSeen status
        updateLastSeen();
      }, (error) => {
        console.error("Error in messages snapshot listener:", error);
        toast.error("Failed to load messages. Please try again.");
      });
      
      // Set up another listener for participant status (typing indicator and last seen)
      const participantsRef = collection(db, `conversations/${conversationId}/participants`);
      const unsubscribeParticipants = onSnapshot(participantsRef, (snapshot) => {
        const statusData: Record<string, ParticipantStatus> = {};
        
        snapshot.forEach((doc) => {
          const participantData = doc.data();
          statusData[doc.id] = {
            lastSeenAt: participantData.lastSeenAt as Timestamp | null,
            isTyping: participantData.isTyping as boolean || false
          };
        });
        
        setParticipantStatus(statusData);
      }, (error) => {
        console.error("Error in participants snapshot listener:", error);
      });
      
      // Return a combined unsubscribe function
      return () => {
        unsubscribeMessages();
        unsubscribeParticipants();
      };
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load messages");
      return () => {};
    }
  };
  
  // Keep the original loadMessages function for backward compatibility
  const loadMessages = async (conversationId: string) => {
    if (!currentUser || !activeConversation?.otherUser?.id) return () => {};
    
    return loadMessagesWithUserIds(
      conversationId,
      currentUser.id,
      activeConversation.otherUser.id
    );
  };
  
  // Function to send a new message
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversation || !currentUser) return
    
    try {
      // Make sure we have the other user's ID
      const otherUserId = activeConversation.otherUser?.id;
      if (!otherUserId) {
        toast.error("Cannot send message: recipient information missing");
        return;
      }
      
      // Encrypt the message with end-to-end encryption using both user IDs
      const messageToSend = encryptMessage(
        newMessage, 
        currentUser.id, 
        otherUserId
      );
      const messagePreview = newMessage;
      
      // Prepare message data
      const messageData: any = {
        senderId: currentUser.id,
        message: messageToSend,
        createdAt: serverTimestamp(),
      };
      
      // Add reply data if replying to a message
      if (replyToMessage) {
        const replyPreview = replyToMessage.message.length > 50 
          ? replyToMessage.message.substring(0, 47) + "..." 
          : replyToMessage.message;
        
        // Encrypt the reply preview for security
        const encryptedReplyPreview = encryptMessage(
          replyPreview,
          currentUser.id,
          otherUserId
        );
        
        // Add reply metadata to the message
        messageData.replyTo = {
          messageId: replyToMessage.id,
          textPreview: encryptedReplyPreview,
          senderUsername: replyToMessage.senderId === currentUser.id 
            ? currentUser.username 
            : activeConversation.otherUser?.username || "User"
        };
      }
      
      // Add message to the nested messages collection
      const messageRef = collection(db, `conversations/${activeConversation.id}/messages`);
      await addDoc(messageRef, messageData);
      
      // Update the conversation with the last message (plain text for preview)
      await setDoc(doc(db, "conversations", activeConversation.id), {
        userIds: activeConversation.userIds,
        lastMessage: messagePreview.length > 30 ? messagePreview.substring(0, 27) + "..." : messagePreview,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      // Send notification to the other user
      await handleMessageNotification(
        otherUserId,
        currentUser.id,
        messagePreview,
        activeConversation.id
      );
      
      // Clear the input field and reply state
      setNewMessage("");
      setReplyToMessage(null);
      
      // Reset typing status
      if (isTyping) {
        setIsTyping(false);
        updateTypingStatus(false);
      }
      
      // Clear any existing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }

      // Ensure we're at the bottom after sending
      setAtBottom(true);
      
      // Force scroll to bottom immediately
      if (messagesContainerRef.current) {
        setTimeout(() => {
          const scrollableParent = messagesContainerRef.current?.parentElement;
          if (scrollableParent) {
            scrollableParent.scrollTop = scrollableParent.scrollHeight;
          }
        }, 100);
      }
      
      // Update last seen
      updateLastSeen();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };
  
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
  
  // Function to handle replying to a message
  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };
  
  // Function to cancel a reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };
  
  // Function to scroll to a message (for when clicking on a reply)
  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Highlight the message briefly
      messageElement.classList.add('highlight-message');
      setTimeout(() => {
        messageElement.classList.remove('highlight-message');
      }, 1500);
    }
  };
  
  // Check if a message has been seen by the other user
  const isMessageSeen = (message: Message): boolean => {
    if (!activeConversation || !message.createdAt) return false;
    
    // Get the other user's ID
    const otherUserId = activeConversation.otherUser?.id;
    if (!otherUserId || !participantStatus[otherUserId]) return false;
    
    // Get the other user's last seen timestamp
    const lastSeen = participantStatus[otherUserId].lastSeenAt;
    if (!lastSeen) return false;
    
    // Compare timestamps to see if the message was seen
    return message.createdAt.toMillis() <= lastSeen.toMillis();
  };
  
  // Find the last message sent by the current user
  const findLastOwnMessage = (): Message | null => {
    if (!messages.length || !currentUser) return null;
    
    // Get all messages sent by the current user
    const ownMessages = messages.filter(msg => msg.senderId === currentUser.id);
    if (!ownMessages.length) return null;
    
    // Sort by creation time and get the most recent
    const sortedMessages = [...ownMessages].sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });
    
    return sortedMessages[0];
  };
  
  // Find the first unread message by the other user
  const findFirstUnreadMessage = (): Message | null => {
    if (!messages.length || !currentUser) return null;
    
    // Get all messages from the other user
    const otherUserMessages = messages.filter(msg => msg.senderId !== currentUser.id);
    if (!otherUserMessages.length) return null;
    
    // Sort by creation time
    const sortedMessages = [...otherUserMessages].sort((a, b) => {
      if (!a.createdAt || !b.createdAt) return 0;
      return a.createdAt.toMillis() - b.createdAt.toMillis();
    });
    
    // Get our last seen timestamp
    if (!activeConversation) return null;
    const myId = currentUser.id;
    if (!participantStatus[myId] || !participantStatus[myId].lastSeenAt) {
      // If we haven't seen any messages yet, the first message is unread
      return sortedMessages[0];
    }
    
    const myLastSeen = participantStatus[myId].lastSeenAt;
    
    // Find the first message that was sent after we last saw the conversation
    for (const message of sortedMessages) {
      if (!message.createdAt) continue;
      if (message.createdAt.toMillis() > myLastSeen.toMillis()) {
        return message;
      }
    }
    
    // If all messages are read, return null
    return null;
  };
  
  // Check if the other user is currently typing
  const isOtherUserTyping = (): boolean => {
    if (!activeConversation) return false;
    
    const otherUserId = activeConversation.otherUser?.id;
    if (!otherUserId || !participantStatus[otherUserId]) return false;
    
    return participantStatus[otherUserId].isTyping;
  };
  
  // Update the last seen when the chat is focused/opened
  useEffect(() => {
    if (activeConversation) {
      updateLastSeen();
    }
  }, [activeConversation]);
  
  // Listen for window focus to update last seen
  useEffect(() => {
    const handleFocus = () => {
      if (activeConversation) {
        updateLastSeen();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeConversation]);
  
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
                  className="p-4 scroll-pt-4 relative min-h-full" 
                  ref={messagesContainerRef}
                  onScroll={checkIfAtBottom}
                >
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-zinc-400">
                      <p>No messages yet. Send a message to start the conversation!</p>
                    </div>
                  ) : (
                    <>
                      {/* Render messages grouped by day and sender */}
                      {Object.entries(daySeparators).map(([dateKey, separator]) => {
                        // Filter messages for this day
                        const dayMessages = messages.filter(msg => {
                          if (!msg.createdAt) return false;
                          const msgDate = msg.createdAt.toDate();
                          msgDate.setHours(0, 0, 0, 0);
                          return msgDate.toDateString() === new Date(separator.date).toDateString();
                        });
                        
                        if (dayMessages.length === 0) return null;
                        
                        // Group messages for this day
                        const dayGroups = groupMessages(dayMessages);
                        
                        // Find first unread message
                        const firstUnread = findFirstUnreadMessage();
                        
                        return (
                          <div key={dateKey} className="mb-6">
                            {/* Day header */}
                            <div className="sticky top-0 z-10 flex justify-center my-4">
                              <div className="bg-zinc-800 text-zinc-200 text-xs px-3 py-1 rounded-full">
                                {separator.label}
                              </div>
                            </div>
                            
                            {/* Groups for this day */}
                            <div className="space-y-6">
                              {dayGroups.map((group, groupIndex) => {
                                const isCurrentUser = group.senderId === currentUser?.id;
                                
                                // Check if we need to show "unread messages" marker before this group
                                const showUnreadMarker = firstUnread && 
                                  group.messages.some(m => m.id === firstUnread.id) &&
                                  firstUnread.senderId !== currentUser?.id;
                                
                                return (
                                  <div key={`${group.senderId}-${groupIndex}`}>
                                    {/* Unread messages marker */}
                                    {showUnreadMarker && (
                                      <div className="flex justify-center my-4">
                                        <div className="bg-purple-900/50 text-purple-200 text-xs px-3 py-1 rounded-full border border-purple-700/50">
                                          Unread messages
                                        </div>
                                      </div>
                                    )}
                                    
                                    {/* Message group container */}
                                    <div className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'} w-full`}>
                                      {/* Avatar (only for other user and only on the first message) */}
                                      {!isCurrentUser && (
                                        <Avatar className="h-8 w-8 mr-2 mt-1 flex-shrink-0 border border-zinc-700">
                                          <AvatarImage 
                                            src={group.senderProfilePic} 
                                            alt={group.senderName} 
                                          />
                                          <AvatarFallback className="bg-zinc-700 text-xs">
                                            {group.senderName.charAt(0).toUpperCase() || "?"}
                                          </AvatarFallback>
                                        </Avatar>
                                      )}
                                      
                                      {/* Message bubbles stack */}
                                      <div className={`flex flex-col gap-1 max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                                        {/* Sender name - only shown above first message */}
                                        {!isCurrentUser && (
                                          <div className="text-xs text-zinc-400 ml-1 mb-1">
                                            {group.senderName}
                                          </div>
                                        )}
                                        
                                        {/* Messages */}
                                        {group.messages.map((message, msgIndex) => {
                                          const isFirstInGroup = msgIndex === 0;
                                          const isLastInGroup = msgIndex === group.messages.length - 1;
                                          
                                          // Determine bubble shape based on position in group
                                          let bubbleShape = '';
                                          if (isCurrentUser) {
                                            if (group.messages.length === 1) {
                                              bubbleShape = 'rounded-lg rounded-br-none';
                                            } else if (isFirstInGroup) {
                                              bubbleShape = 'rounded-lg rounded-br-none rounded-tr-md';
                                            } else if (isLastInGroup) {
                                              bubbleShape = 'rounded-lg rounded-br-none rounded-tr-md';
                                            } else {
                                              bubbleShape = 'rounded-lg rounded-br-none rounded-tr-md';
                                            }
                                          } else {
                                            if (group.messages.length === 1) {
                                              bubbleShape = 'rounded-lg rounded-bl-none';
                                            } else if (isFirstInGroup) {
                                              bubbleShape = 'rounded-lg rounded-bl-none rounded-tl-md';
                                            } else if (isLastInGroup) {
                                              bubbleShape = 'rounded-lg rounded-bl-none rounded-tl-md';
                                            } else {
                                              bubbleShape = 'rounded-lg rounded-bl-none rounded-tl-md';
                                            }
                                          }
                                          
                                          // Check if this message has been seen
                                          const seen = isMessageSeen(message);
                                          
                                          // Determine if we should show the "seen" indicator
                                          // Only show for the last message from the current user
                                          const isLastOwnMessage = isCurrentUser && 
                                            message.id === findLastOwnMessage()?.id;
                                          
                                          return (
                                            <div 
                                              key={message.id} 
                                              id={`message-${message.id}`}
                                              className={`group relative transition-all duration-300 ease-in-out`}
                                            >
                                              {/* Reply button on hover */}
                                              <button 
                                                onClick={() => handleReplyToMessage(message)}
                                                className={`absolute ${isCurrentUser ? 'left-0' : 'right-0'} top-1/2 transform ${isCurrentUser ? '-translate-x-full -translate-y-1/2 -ml-2' : 'translate-x-full -translate-y-1/2 mr-2'} opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-zinc-800 rounded-full hover:bg-zinc-700`}
                                                aria-label="Reply"
                                              >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-zinc-400">
                                                  <path d="M9 20L3 12L9 4M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                              </button>
                                              
                                              {/* Message bubble */}
                                              <div className={`py-2 px-4 ${bubbleShape} ${
                                                isCurrentUser 
                                                  ? 'bg-purple-800 text-white' 
                                                  : 'bg-zinc-800 text-zinc-100'
                                              }`}>
                                                {/* Reply preview if this message is a reply */}
                                                {message.replyTo && (
                                                  <div 
                                                    className={`mb-1 p-2 text-xs rounded ${
                                                      isCurrentUser 
                                                        ? 'bg-purple-900 text-purple-200' 
                                                        : 'bg-zinc-700 text-zinc-300'
                                                    } cursor-pointer`}
                                                    onClick={() => scrollToMessage(message.replyTo?.messageId || '')}
                                                  >
                                                    <div className="font-medium mb-1">{message.replyTo.senderUsername}</div>
                                                    <div className="overflow-hidden text-ellipsis">{message.replyTo.textPreview}</div>
                                                  </div>
                                                )}
                                                
                                                {/* Message content */}
                                                <p className="break-words whitespace-normal overflow-hidden">
                                                  {message.message}
                                                </p>
                                                
                                                {/* Time and seen status */}
                                                <div className={`text-xs mt-1 flex items-center gap-1 ${isCurrentUser ? 'text-purple-200 justify-end' : 'text-zinc-400'}`}>
                                                  {/* Timestamp - only on last message in group */}
                                                  {isLastInGroup && message.createdAt && (
                                                    <span>
                                                      {new Date(message.createdAt.toDate()).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                      })}
                                                    </span>
                                                  )}
                                                  
                                                  {/* Seen indicator with checkmarks */}
                                                  {isCurrentUser && (
                                                    <span className={`ml-1 ${seen ? 'text-blue-400' : 'text-zinc-400'}`}>
                                                      {seen ? (
                                                        <span className="flex">
                                                          <svg width="16" height="10" viewBox="0 0 16 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline">
                                                            <path d="M1 5L5 9L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                            <path d="M6 5L10 9L16 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                          </svg>
                                                        </span>
                                                      ) : (
                                                        <span className="flex">
                                                          <svg width="12" height="10" viewBox="0 0 12 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline">
                                                            <path d="M1 5L5 9L11 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                          </svg>
                                                        </span>
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              {/* Message timestamp separator for gaps > 1 min */}
                                              {msgIndex < group.messages.length - 1 && 
                                               (group.messages[msgIndex + 1].createdAt &&
                                                message.createdAt &&
                                                Math.abs((group.messages[msgIndex + 1].createdAt?.toDate() || new Date()).getTime() - 
                                                         (message.createdAt?.toDate() || new Date()).getTime()) > 60000) && (
                                                <div className="flex justify-center my-2">
                                                  <div className="bg-zinc-800/80 text-zinc-400 text-[10px] px-2 py-0.5 rounded-full">
                                                    {message.createdAt ? 
                                                      new Date(message.createdAt.toDate()).toLocaleTimeString('en-US', {
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                      }) : ''}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* Avatar for current user (right side) */}
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
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                      
                      {/* Typing indicator */}
                      {isOtherUserTyping() && (
                        <div className="flex items-start mt-4">
                          <Avatar className="h-8 w-8 mr-2 flex-shrink-0 border border-zinc-700">
                            <AvatarImage 
                              src={activeConversation?.otherUser?.profilePicture} 
                              alt={activeConversation?.otherUser?.username} 
                            />
                            <AvatarFallback className="bg-zinc-700 text-xs">
                              {activeConversation?.otherUser?.username.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="bg-zinc-800 text-zinc-400 py-2 px-4 rounded-lg rounded-bl-none max-w-[70%]">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                              <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  <div ref={messageEndRef} className="h-px w-full absolute bottom-0" />
                </div>
              </div>
              
              {/* Message Input - Fixed at bottom */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-800 bg-zinc-900/80 z-10">
                {/* Reply preview */}
                {replyToMessage && (
                  <div className="mb-2 p-2 rounded bg-zinc-800 flex items-center">
                    <div className="flex-1 overflow-hidden">
                      <div className="text-xs text-zinc-400">
                        Replying to {replyToMessage.senderId === currentUser?.id ? 'yourself' : activeConversation?.otherUser?.username}
                      </div>
                      <div className="text-sm text-zinc-300 truncate">
                        {replyToMessage.message}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={cancelReply}
                      className="ml-2 h-6 w-6 p-0 text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Input
                      className="flex-1 bg-zinc-800/50 border-zinc-700 pr-12 min-h-[2.75rem]"
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={handleInputChange}
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