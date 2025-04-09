import { Users, ShoppingBag, Award, Clock } from "lucide-react"
import { db } from "@/lib/firebaseConfig"
import { collection, getDocs, getCountFromServer, query, where } from "firebase/firestore"

// Type for site statistics
export type SiteStat = {
  icon: any
  value: string
  label: string
  delay?: number
}

// Function to get real-time statistics
export async function fetchSiteStats(): Promise<SiteStat[]> {
  try {
    // Get user count
    const usersSnapshot = await getCountFromServer(collection(db, "users"))
    const userCount = usersSnapshot.data().count
    
    // Get products sold count
    const soldProductsQuery = query(
      collection(db, "listings"),
      where("status", "==", "sold")
    )
    const soldProductsSnapshot = await getCountFromServer(soldProductsQuery)
    const soldProductsCount = soldProductsSnapshot.data().count
    
    // Get active listings count (replacing verified creators)
    const activeListingsQuery = query(
      collection(db, "listings"),
      where("status", "==", "active")
    )
    const activeListingsSnapshot = await getCountFromServer(activeListingsQuery)
    const activeListingsCount = activeListingsSnapshot.data().count
    
    // Return formatted stats array
    return [
      {
        icon: Users,
        value: `${userCount.toLocaleString()}+`,
        label: "Active Users",
        delay: 0.1,
      },
      {
        icon: ShoppingBag,
        value: `${soldProductsCount.toLocaleString()}+`,
        label: "Products Sold",
        delay: 0.2,
      },
      {
        icon: Award,
        value: `${activeListingsCount.toLocaleString()}+`,
        label: "Listed Items",
        delay: 0.3,
      },
      {
        icon: Clock,
        value: "24/7",
        label: "Support Available",
        delay: 0.4,
      },
    ]
  } catch (error) {
    console.error("Error fetching site stats:", error)
    
    // Return default fallback values if there's an error
    return [
      {
        icon: Users,
        value: "12,500+",
        label: "Active Users",
        delay: 0.1,
      },
      {
        icon: ShoppingBag,
        value: "45,000+",
        label: "Products Sold",
        delay: 0.2,
      },
      {
        icon: Award,
        value: "3,800+",
        label: "Listed Items",
        delay: 0.3,
      },
      {
        icon: Clock,
        value: "24/7",
        label: "Support Available",
        delay: 0.4,
      },
    ]
  }
} 