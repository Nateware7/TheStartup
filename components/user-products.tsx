"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Loader, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { db } from "@/lib/firebaseConfig"
import { collection, query, where, getDocs, getDoc, doc, onSnapshot, Unsubscribe } from "firebase/firestore"
import { ProductCard } from "@/components/product-card"

// Define product type
type Product = {
  id: string
  title: string
  type: string
  category: string
  description: string
  longDescription?: string
  price: number
  startingBid?: number
  currentBid?: number
  bid?: number | null
  image?: string
  sellerId?: string
  assetType?: string
  status?: string
  isAuction?: boolean
  expiresAt?: any
  durationDays?: number
  durationHours?: number
  durationMinutes?: number
  durationString?: string
  seller?: {
    id: string
    name: string
    handle?: string
    avatar?: string
    verified?: boolean
    joinDate?: string
    sales?: number
    rating?: number
  }
}

interface UserProductsProps {
  userId: string
}

export function UserProducts({ userId }: UserProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")

  useEffect(() => {
    function fetchUserProducts(): Unsubscribe | undefined {
      try {
        setLoading(true)
        
        // Query firestore for products where seller/creator is the userId
        const q = query(collection(db, "listings"), where("sellerId", "==", userId))
        
        // Use onSnapshot for real-time updates
        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
          const userProducts: Product[] = []
          
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            userProducts.push({
              id: doc.id,
              title: data.title || "Untitled Product",
              type: data.category || "Other",
              category: data.category || "Other",
              description: data.description || "",
              longDescription: data.longDescription || "",
              price: data.price || 0,
              startingBid: data.startingBid,
              currentBid: data.currentBid,
              bid: data.currentBid || null,
              image: data.image || "/placeholder.svg?height=600&width=600",
              sellerId: userId,
              assetType: data.assetType || "username",
              status: data.status || "active",
              isAuction: data.isAuction || false,
              expiresAt: data.expiresAt,
              durationDays: data.durationDays,
              durationHours: data.durationHours,
              durationMinutes: data.durationMinutes,
              durationString: data.durationString
            })
          })
          
          // Get the user information
          const userDoc = await getDoc(doc(db, "users", userId))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            const sellerInfo = {
              id: userId,
              name: userData.username || userData.displayName || "Anonymous",
              handle: userData.handle || `@${(userData.username || 'user').toLowerCase().replace(/\s+/g, '')}`,
              avatar: userData.profilePicture || userData.photoURL || "/placeholder.svg?height=200&width=200",
              verified: userData.isVerified || false,
              joinDate: userData.createdAt ? new Date(userData.createdAt.toDate()).toLocaleDateString() : "Unknown",
              sales: userData.sales || 0,
              rating: userData.rating || 0,
            }
            
            // Add seller info to all products
            userProducts.forEach(product => {
              product.seller = sellerInfo
            })
          }
          
          setProducts(userProducts)
          setFilteredProducts(
            activeFilter === "all" 
              ? userProducts 
              : userProducts.filter(product => product.status === activeFilter)
          )
          setLoading(false)
        }, (error) => {
          console.error("Error in products listener:", error)
          setLoading(false)
        })
        
        return unsubscribe
      } catch (error) {
        console.error("Error fetching user products:", error)
        setLoading(false)
        return undefined
      }
    }
    
    const unsubscribe = fetchUserProducts()
    
    // Clean up the listener when the component unmounts
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, activeFilter])
  
  // Filter products when tab changes
  useEffect(() => {
    if (activeFilter === "all") {
      setFilteredProducts(products)
    } else {
      setFilteredProducts(products.filter(product => product.status === activeFilter))
    }
  }, [activeFilter, products])
  
  if (loading) {
    return (
      <div className="flex h-40 w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }
  
  if (products.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
        <h3 className="text-lg font-medium">No Products Yet</h3>
        <p className="mt-2 text-zinc-400">This user hasn't listed any products yet.</p>
      </div>
    )
  }

  // Count products by status for the tabs 
  const activeCount = products.filter(p => p.status === "active").length
  const draftCount = products.filter(p => p.status === "draft").length
  const soldCount = products.filter(p => p.status === "sold").length

  return (
    <div>
      {/* Tabs for filtering */}
      <Tabs defaultValue="all" value={activeFilter} onValueChange={setActiveFilter} className="mb-6">
        <TabsList className="bg-zinc-800/30 border border-zinc-700/30 rounded-lg p-1">
          <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700 data-[state=active]:text-white">
            All ({products.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
            Active ({activeCount})
          </TabsTrigger>
          <TabsTrigger value="draft" className="data-[state=active]:bg-amber-600 data-[state=active]:text-white">
            Draft ({draftCount})
          </TabsTrigger>
          <TabsTrigger value="sold" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            Sold ({soldCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Product Grid - using ProductCard component from main page */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-zinc-500" />
          <h3 className="text-lg font-medium">No Products Found</h3>
          <p className="mt-2 text-zinc-400">
            {activeFilter === "all" 
              ? "This user hasn't listed any products yet." 
              : `No ${activeFilter} products found.`}
          </p>
        </div>
      )}
    </div>
  )
}

