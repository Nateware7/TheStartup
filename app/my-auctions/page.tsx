"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, Timestamp, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { useAuth } from "@/hooks/use-auth"
import { ProductCard } from "@/components/product-card"
import { Loader2 } from "lucide-react"
import Link from "next/link"

// Define Product interface matching the one from ProductCard
interface Seller {
  id?: string
  name: string
  handle?: string
  avatar?: string
  verified?: boolean
  joinDate?: string
  sales?: number
  rating?: number
}

interface Product {
  id: string
  title: string
  description: string
  longDescription?: string
  price: number
  bid?: number | null
  startingBid?: number
  currentBid?: number
  category: string
  assetType?: string
  seller?: Seller
  durationDays?: number
  durationHours?: number
  durationMinutes?: number
  durationString?: string
  expiresAt?: any // Firestore timestamp
  createdAt?: any
  stats?: {
    sales: number
    lastSold: string
  }
  auctionLog?: Array<{
    username: string
    amount: number
    timestamp: string
    isLeading?: boolean
  }>
  status?: string
  isExpired?: boolean
}

// Custom wrapper for ProductCard to show "Auction Ended" for expired items
function MyAuctionCard({ product }: { product: Product }) {
  return (
    <div className="relative">
      {product.isExpired && (
        <div className="absolute -top-3 right-4 z-10 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          Auction Ended
        </div>
      )}
      <ProductCard product={product} />
    </div>
  )
}

export default function MyAuctionsPage() {
  const { user, loading: authLoading } = useAuth()
  const [myBidListings, setMyBidListings] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Only fetch data once user auth is loaded and we have a user
    if (authLoading) return
    if (!user) return

    setIsLoading(true)
    setError(null)
    
    // Find all listings where the current user is the highest bidder
    const listingsQuery = query(
      collection(db, "listings"),
      where("highestBidderId", "==", user.uid)
    )
    
    const unsubscribeListings = onSnapshot(listingsQuery, async (snapshot) => {
      try {
        if (snapshot.empty) {
          setMyBidListings([])
          setIsLoading(false)
          return
        }
        
        const now = Timestamp.now()
        const products: Product[] = []
        
        // Process each listing
        for (const doc of snapshot.docs) {
          const data = doc.data()
          
          // Check if auction is still active (not expired)
          const isExpired = data.expiresAt && data.expiresAt.toMillis() < now.toMillis()
          
          // Only add auctions that haven't been marked as sold,
          // regardless of expiration status
          if (data.status !== "sold") {
            // Fetch seller data if needed
            let sellerData: Seller | undefined = undefined
            
            if (data.sellerId) {
              try {
                const sellerDoc = await getDocs(query(
                  collection(db, "users"), 
                  where("__name__", "==", data.sellerId)
                ))
                
                if (!sellerDoc.empty) {
                  const sellerInfo = sellerDoc.docs[0].data()
                  console.log("Seller data for My Auctions:", sellerInfo)
                  sellerData = {
                    id: data.sellerId,
                    name: sellerInfo.username || sellerInfo.displayName || "Anonymous",
                    handle: sellerInfo.handle || "",
                    avatar: sellerInfo.profilePicture || sellerInfo.photoURL || sellerInfo.avatar || sellerInfo.profileImage || "/placeholder.svg?height=200&width=200",
                    verified: sellerInfo.verified || sellerInfo.isVerified || false
                  }
                }
              } catch (err) {
                console.error(`Error fetching seller ${data.sellerId}:`, err)
              }
            }
            
            products.push({
              id: doc.id,
              title: data.title || "",
              description: data.description || "",
              price: data.price || 0,
              startingBid: data.startingBid,
              currentBid: data.currentBid,
              category: data.category || "",
              assetType: data.assetType,
              expiresAt: data.expiresAt,
              seller: sellerData,
              durationString: data.durationString,
              status: data.status,
              auctionLog: data.auctionLog,
              isExpired: isExpired
            })
          }
        }
        
        // Sort by expiring soonest first
        products.sort((a, b) => {
          if (a.expiresAt && b.expiresAt) {
            return a.expiresAt.toMillis() - b.expiresAt.toMillis()
          }
          return 0
        })
        
        setMyBidListings(products)
        setIsLoading(false)
      } catch (err) {
        console.error("Error in listings listener:", err)
        setError("Failed to load your auctions. Please try again.")
        setIsLoading(false)
      }
    }, (err) => {
      console.error("Error in listings listener:", err)
      setError("Failed to load your auctions. Please try again.")
      setIsLoading(false)
    })
    
    return () => {
      unsubscribeListings()
    }
  }, [user, authLoading])
  
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-12 w-12 animate-spin text-zinc-400" />
        </div>
      </div>
    )
  }
  
  if (!user) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-20">
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h2 className="mb-4 text-2xl font-bold text-white">Sign In Required</h2>
          <p className="mb-6 max-w-md text-zinc-400">
            You need to be signed in to view your auctions.
          </p>
          <Link
            href="/auth/signin"
            className="rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-700 hover:to-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="container mx-auto px-4 pt-24 pb-20">
      <div className="mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold md:text-4xl">My Auctions</h1>
          <p className="mt-2 text-zinc-400">Listings you're actively bidding on.</p>
        </div>
        
        {/* Content */}
        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-800/40 bg-red-900/20 p-4">
            <p className="text-red-300">{error}</p>
          </div>
        ) : myBidListings.length === 0 ? (
          <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
            <h3 className="mb-2 text-xl font-medium text-white">No active bids</h3>
            <p className="mb-6 max-w-md text-zinc-400">
              You haven't placed any bids on active auctions yet.
            </p>
            <Link
              href="/marketplace"
              className="rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:from-violet-700 hover:to-indigo-700"
            >
              Explore Marketplace
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {myBidListings.map((listing) => (
              <MyAuctionCard key={listing.id} product={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 