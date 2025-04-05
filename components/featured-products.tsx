"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Heart } from "lucide-react"

import { Button } from "@/components/ui/button"

const products = [
  {
    id: "1",
    title: "Neon Dreams Collection",
    type: "Art",
    price: 0.089,
    bid: 0.095,
    image: "/placeholder.svg?height=600&width=600",
    seller: {
      name: "CyberArtist",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "2",
    title: "Future Bass Samples",
    type: "Music",
    price: 49.99,
    bid: null,
    image: "/placeholder.svg?height=600&width=600",
    seller: {
      name: "BeatMaker",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "3",
    title: "Crypto Trading eBook",
    type: "eBooks",
    price: 29.99,
    bid: 32.5,
    image: "/placeholder.svg?height=600&width=600",
    seller: {
      name: "CryptoGuru",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: false,
    },
  },
  {
    id: "4",
    title: "React Component Library",
    type: "Code",
    price: 79.99,
    bid: null,
    image: "/placeholder.svg?height=600&width=600",
    seller: {
      name: "DevMaster",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "5",
    title: "Portfolio Website Template",
    type: "Templates",
    price: 39.99,
    bid: 42.0,
    image: "/placeholder.svg?height=600&width=600",
    seller: {
      name: "DesignPro",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "6",
    title: "Abstract Geometry Pack",
    type: "Art",
    price: 19.99,
    bid: null,
    image: "/placeholder.svg?height=600&width=600",
    seller: {
      name: "ArtistX",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: false,
    },
  },
]

export function FeaturedProducts() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
      <div className="flex items-center justify-center">
        <Link
          href="/marketplace"
          className="group flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
        >
          <span>View all products</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

function ProductCard({ product }) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div
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
        <div className="mb-2 flex items-center gap-2">
          <div className="relative h-6 w-6 overflow-hidden rounded-full">
            <Image
              src={product.seller.avatar || "/placeholder.svg"}
              alt={product.seller.name}
              fill
              className="object-cover"
            />
          </div>
          <span className="text-sm text-zinc-400">{product.seller.name}</span>
          {product.seller.verified && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white">
              ✓
            </span>
          )}
        </div>

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
    </div>
  )
}

