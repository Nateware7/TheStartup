"use client"

import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode 
} from "react"
import { User } from "firebase/auth"
import { auth } from "@/lib/firebaseConfig"
import { 
  subscribeToNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  Notification
} from "@/lib/notification"

interface NotificationContextType {
  notifications: Notification[]
  unreadCount: number
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  unreadCount: 0,
  markAsRead: async () => {},
  markAllAsRead: async () => {}
})

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user) {
      setNotifications([])
      setUnreadCount(0)
      return
    }

    const unsubscribe = subscribeToNotifications(user.uid, (notificationData) => {
      setNotifications(notificationData)
      
      // Calculate unread count
      const count = notificationData.filter(n => !n.read).length
      setUnreadCount(count)
    })

    return () => unsubscribe()
  }, [user])

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      await markNotificationAsRead(user.uid, notificationId)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return

    try {
      await markAllNotificationsAsRead(user.uid)
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
      
      // Reset unread count
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        markAsRead, 
        markAllAsRead 
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  return useContext(NotificationContext)
} 