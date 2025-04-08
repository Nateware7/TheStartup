"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { db } from "@/lib/firebaseConfig"
import { collection, query, where, getDocs } from "firebase/firestore"

// Define product type
type Product = {
  id: string
  title: string
  type: string
  price: number
  bid: number | null
  image: string
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
            price: data.price || 0,
            bid: data.currentBid || null,
            image: data.image || "/placeholder.svg?height=600&width=600"
          })
        })
        
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

function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <Link
      href={`/product/${product.id}`}
      className="group relative overflow-hidden rounded-xl bg-zinc-900/50 backdrop-blur-sm transition-all hover:shadow-lg hover:shadow-violet-500/10"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square overflow-hidden">
        <Image
          src={product.image || "/placeholder.svg"}
          alt={product.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity ${isHovered ? "opacity-100" : "opacity-0"}`}
        />

        <button
          className={`absolute right-3 top-3 rounded-full bg-black/30 p-2 backdrop-blur-md transition-all ${isFavorite ? "text-red-500" : "text-white"} ${isHovered ? "opacity-100" : "opacity-0"}`}
          onClick={(e) => {
            e.preventDefault()
            setIsFavorite(!isFavorite)
          }}
        >
          <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500" : ""}`} />
        </button>

        <div
          className={`absolute bottom-0 left-0 right-0 p-4 transition-transform duration-300 ${isHovered ? "translate-y-0" : "translate-y-full"}`}
        >
          <div className="flex gap-2">
            {product.bid ? (
              <Button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
                Place Bid
              </Button>
            ) : (
              <Button className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
                Buy Now
              </Button>
            )}
            <Button
              variant="outline"
              className="border-zinc-700 bg-black/50 text-white backdrop-blur-md hover:bg-black/70"
            >
              View
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4">
        <h3 className="mb-1 text-lg font-semibold">{product.title}</h3>
        <div className="mb-3 inline-block rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
          {product.type}
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold">${product.price.toFixed(2)}</div>
            {product.bid && <div className="text-sm text-green-400">Current bid: ${product.bid.toFixed(2)}</div>}
          </div>
        </div>
      </div>
    </Link>
  )
}

