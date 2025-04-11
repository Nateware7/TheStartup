"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { Bell } from "lucide-react"
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover"
import { 
  Notification
} from "@/lib/notification"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Timestamp } from "firebase/firestore"
import { useNotifications } from "@/hooks/use-notifications"
import Image from "next/image"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'message':
      return '✉️'
    case 'bid':
      return '💰'
    case 'outbid':
      return '📊'
    case 'auction-ended':
      return '🏁'
    case 'auction-won':
      return '🏆'
    case 'review-received':
      return '⭐'
    case 'transaction-confirmed':
      return '✅'
    default:
      return '🔔'
  }
}

// Add a new component to display user avatars
function UserAvatar({ userId, type }: { userId: string, type: string }) {
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
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
        <span className="animate-pulse">...</span>
      </div>
    )
  }
  
  if (avatar) {
    return (
      <div className="relative h-8 w-8 overflow-hidden rounded-full">
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
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
      <span>{getNotificationIcon(type)}</span>
    </div>
  )
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.id) return

    // Mark notification as read
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Close the popover
    setIsOpen(false)

    // Navigate to the notification link if provided
    if (notification.link) {
      router.push(notification.link)
    }
  }

  // Format the timestamp
  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return ''
    
    try {
      const date = timestamp.toDate()
      return formatDistanceToNow(date, { addSuffix: true })
    } catch (error) {
      return ''
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="relative rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-violet-400">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h3 className="font-medium text-white">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-zinc-400 hover:text-white"
            >
              Mark all as read
            </Button>
          )}
        </div>
        <ScrollArea className="h-[400px]">
          {notifications.length > 0 ? (
            <div className="divide-y divide-zinc-800">
              {notifications.slice(0, 10).map((notification) => (
                <button
                  key={notification.id}
                  className={`w-full cursor-pointer px-4 py-3 text-left transition hover:bg-zinc-800/50 ${
                    !notification.read ? 'bg-zinc-800/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {notification.type === 'message' && notification.fromUserId ? (
                      <UserAvatar userId={notification.fromUserId} type={notification.type} />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800">
                        <span>{getNotificationIcon(notification.type)}</span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-white">{notification.title}</p>
                      <p className="text-sm text-zinc-400">{notification.description}</p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {formatTimestamp(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="h-2 w-2 rounded-full bg-violet-500"></div>
                    )}
                  </div>
                </button>
              ))}
              {notifications.length > 10 && (
                <Link
                  href="/notifications"
                  className="block w-full p-3 text-center text-sm text-violet-400 hover:text-violet-300 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              )}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-zinc-500">No notifications yet</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
} 