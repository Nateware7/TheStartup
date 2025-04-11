"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { format } from "date-fns"
import { 
  MessageCircle, 
  Bell, 
  MessageSquare, 
  Gavel, 
  CheckCircle2, 
  Award, 
  Timer, 
  Star, 
  Trash2, 
  BellOff, 
  Filter, 
  X
} from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  getRecentNotifications, 
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  Notification, 
  NotificationType 
} from "@/lib/notification"
import { auth } from "@/lib/firebaseConfig"
import { User } from "firebase/auth"
import { Timestamp } from "firebase/firestore"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const router = useRouter()

  // Listen to auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      if (!currentUser) {
        router.push("/auth/signin?redirectTo=/notifications")
      }
    })
    return () => unsubscribe()
  }, [router])

  // Fetch notifications when user is authenticated
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return

      setIsLoading(true)
      try {
        const notifs = await getRecentNotifications(user.uid, 50)
        setNotifications(notifs)
      } catch (error) {
        console.error("Error fetching notifications:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchNotifications()
    }
  }, [user])

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!user || !notification.id) return

    // Mark as read
    if (!notification.read) {
      await markNotificationAsRead(user.uid, notification.id)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notification.id ? { ...n, read: true } : n
        )
      )
    }

    // Navigate to the linked page if available
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    if (!user) return
    
    await markAllNotificationsAsRead(user.uid)
    
    // Update local state
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }

  // Format date for display
  const formatDate = (timestamp: Timestamp) => {
    if (!timestamp) return ""
    
    try {
      const date = timestamp.toDate()
      return format(date, "MMM d, yyyy 'at' h:mm a")
    } catch (error) {
      return ""
    }
  }

  // Get icon based on notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'message':
        return <MessageCircle className="h-5 w-5 text-blue-400" />
      case 'bid':
        return <Gavel className="h-5 w-5 text-green-400" />
      case 'outbid':
        return <Gavel className="h-5 w-5 text-red-400" />
      case 'auction-ended':
        return <Timer className="h-5 w-5 text-orange-400" />
      case 'auction-won':
        return <Award className="h-5 w-5 text-yellow-400" />
      case 'review-received':
        return <Star className="h-5 w-5 text-purple-400" />
      case 'transaction-confirmed':
        return <CheckCircle2 className="h-5 w-5 text-emerald-400" />
      case 'system':
        return <Bell className="h-5 w-5 text-zinc-400" />
      default:
        return <MessageSquare className="h-5 w-5 text-zinc-400" />
    }
  }

  // Filter notifications by type
  const filteredNotifications = activeFilter === "all" 
    ? notifications 
    : notifications.filter(n => n.type === activeFilter)

  // Filter options
  const filterOptions = [
    { value: "all", label: "All Notifications" },
    { value: "message", label: "Messages" },
    { value: "bid", label: "Bids" },
    { value: "outbid", label: "Outbids" },
    { value: "auction-ended", label: "Ended Auctions" },
    { value: "auction-won", label: "Won Auctions" },
    { value: "review-received", label: "Reviews" },
    { value: "transaction-confirmed", label: "Confirmations" },
  ]

  // Add a UserAvatar component similar to the notification bell
  function UserAvatar({ userId, type }: { userId: string, type: NotificationType }) {
    const [avatar, setAvatar] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    
    useEffect(() => {
      const fetchUserAvatar = async () => {
        try {
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setAvatar(userData.profilePicture || userData.avatar || null)
          }
        } catch (error) {
          console.error("Error fetching user avatar:", error)
        } finally {
          setLoading(false)
        }
      }
      
      if (userId) {
        fetchUserAvatar()
      } else {
        setLoading(false)
      }
    }, [userId])
    
    if (loading) {
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
          <span className="animate-pulse">...</span>
        </div>
      )
    }
    
    if (avatar) {
      return (
        <div className="relative h-10 w-10 overflow-hidden rounded-full">
          <Image
            src={avatar}
            alt="User avatar"
            fill
            className="object-cover"
          />
        </div>
      )
    }
    
    return (
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800">
        <span>{getNotificationIcon(type)}</span>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-32 min-h-screen">
        <h1 className="text-3xl font-bold mb-8">Notifications</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="rounded-lg bg-zinc-800/20 p-4 animate-pulse">
              <div className="h-6 w-3/4 bg-zinc-800 rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-zinc-800 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-32 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Notifications</h1>
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {filterOptions.map((option) => (
                <DropdownMenuItem 
                  key={option.value}
                  className={activeFilter === option.value ? "bg-zinc-800 text-white" : ""}
                  onClick={() => setActiveFilter(option.value)}
                >
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={notifications.every(n => n.read)}
          >
            <BellOff className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div 
                  key={notification.id}
                  className={`rounded-lg border ${notification.read ? 'border-zinc-800' : 'border-violet-500'} 
                             ${notification.read ? 'bg-zinc-900/50' : 'bg-zinc-800/30'} 
                             p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {notification.type === 'message' && notification.fromUserId ? (
                      <UserAvatar userId={notification.fromUserId} type={notification.type} />
                    ) : (
                      <div className={`p-2.5 rounded-full ${notification.read ? 'bg-zinc-800' : 'bg-zinc-700'}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-medium">{notification.title}</h3>
                      <p className="text-zinc-400 mt-1">{notification.description}</p>
                      <p className="text-xs text-zinc-500 mt-2">{formatDate(notification.createdAt)}</p>
                    </div>
                    {!notification.read && (
                      <div className="h-3 w-3 rounded-full bg-violet-500 mt-1"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-900/30 rounded-lg border border-zinc-800">
              <Bell className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-xl font-medium mb-2">No notifications found</h3>
              <p className="text-zinc-500">
                {activeFilter !== "all" 
                  ? "Try changing your filter or check back later" 
                  : "You're all caught up! Check back later for new notifications"}
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="unread">
          {filteredNotifications.filter(n => !n.read).length > 0 ? (
            <div className="space-y-4">
              {filteredNotifications
                .filter(notification => !notification.read)
                .map((notification) => (
                  <div 
                    key={notification.id}
                    className="rounded-lg border border-violet-500 bg-zinc-800/30 p-4 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {notification.type === 'message' && notification.fromUserId ? (
                        <UserAvatar userId={notification.fromUserId} type={notification.type} />
                      ) : (
                        <div className="p-2.5 rounded-full bg-zinc-700">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-lg font-medium">{notification.title}</h3>
                        <p className="text-zinc-400 mt-1">{notification.description}</p>
                        <p className="text-xs text-zinc-500 mt-2">{formatDate(notification.createdAt)}</p>
                      </div>
                      <div className="h-3 w-3 rounded-full bg-violet-500 mt-1"></div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-zinc-900/30 rounded-lg border border-zinc-800">
              <CheckCircle2 className="h-12 w-12 mx-auto text-zinc-600 mb-4" />
              <h3 className="text-xl font-medium mb-2">No unread notifications</h3>
              <p className="text-zinc-500">You're all caught up!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}