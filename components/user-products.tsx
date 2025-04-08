"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebaseConfig"
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore"
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchUserProducts() {
      try {
        setLoading(true)
        
        // Query firestore for products where seller/creator is the userId
        const q = query(collection(db, "listings"), where("sellerId", "==", userId))
        const querySnapshot = await getDocs(q)
        
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
            sellerId: userId
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
      } catch (error) {
        console.error("Error fetching user products:", error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchUserProducts()
  }, [userId])
  
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

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

