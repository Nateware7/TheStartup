"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSubscription } from "@/hooks/use-subscription"
import { AccessRestrictedModal } from "@/components/access-restricted-modal"
import { ProductTimer } from "@/components/product-timer"

// Define Product interface based on the actual data structure
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
}

export function ProductCard({ product }: { product: Product }) {
  const { canPerformAction, subscriptionTier } = useSubscription()
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<"buy" | "bid" | null>(null)
  
  // Determine if this is an auction product
  const isAuction = product?.currentBid !== undefined && product?.startingBid !== undefined

  if (!product) return null

  const getInitials = (name: string) => {
    // Handle @ symbol in usernames
    const nameWithoutAt = name.startsWith("@") ? name.substring(1) : name

    return nameWithoutAt
      .split(/\s+/)
      .map((part: string) => part[0])
      .join("")
      .toUpperCase()
  }

  const handleAction = (action: "buy" | "bid") => {
    if (!canPerformAction(action)) {
      setActionType(action)
      setShowModal(true)
      return
    }

    // Handle the action if user has permission
    console.log(`Performing ${action} action`)
    // Implement actual action logic here
  }

  return (
    <>
      <div className="h-full rounded-lg overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-900/90 via-indigo-950/10 border border-zinc-800/50 transition-all hover:border-zinc-700/50 flex flex-col">
        {/* Header - Seller info */}
        <div className="p-4 border-b border-zinc-800/30">
          <div className="flex items-center justify-between">
            <Link href={product.seller?.id ? `/profile/${product.seller.id}` : '#'} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Avatar className="h-7 w-7 border border-zinc-800">
                <AvatarImage src={product.seller?.avatar} alt={product.seller?.name} />
                <AvatarFallback className="bg-gradient-to-br from-violet-600/80 to-indigo-600/80 text-xs text-white">
                  {getInitials(product.seller?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-medium text-zinc-300">{product.seller?.name || "Anonymous"}</span>
                  {product.seller?.verified && <CheckCircle className="h-3 w-3 fill-indigo-500 text-white" />}
                </div>
                {product.seller?.handle && (
                  <span className="text-[10px] text-zinc-500">{product.seller.handle}</span>
                )}
              </div>
            </Link>
            <div className="flex flex-col items-end gap-1">
              {product.assetType && (
                <div className="rounded-full bg-zinc-800/70 px-2 py-0.5 text-[10px] font-medium text-zinc-300">
                  {product.assetType === "username" ? "Username" : "Account"}
                </div>
              )}
              <div className="rounded-full bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                {product.category}
              </div>
            </div>
          </div>
        </div>

        {/* Content - Product info */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex-1">
            <div className="flex justify-between items-start mb-1">
              <Link href={`/product/${product.id}`}>
                <h3 className="text-base font-bold leading-tight text-white hover:text-violet-300 transition-colors line-clamp-1">
                  {product.title}
                </h3>
              </Link>
              
              {/* Time chip - now using ProductTimer component */}
              <div className="flex items-center bg-zinc-800 rounded-full px-2.5 py-1 text-[10px] border border-zinc-700/50">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <ProductTimer 
                  expiresAt={product.expiresAt}
                  durationString={product.durationString}
                  durationDays={product.durationDays}
                  durationHours={product.durationHours}
                  durationMinutes={product.durationMinutes}
                  className="font-medium"
                  prefix={isAuction ? "Ends: " : ""}
                  isAuction={isAuction}
                />
              </div>
            </div>
            <p className="line-clamp-1 text-xs text-zinc-400 mb-3">{product.description}</p>
          </div>

          {/* Price info - Fixed height regardless of auction or buy-now */}
          <div className="mb-3 flex items-end justify-between">
            {isAuction ? (
              <div className="w-full">
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-zinc-500">Starting Bid</div>
                    <div className="text-xs text-zinc-300">${typeof product.startingBid === 'number' ? product.startingBid.toFixed(2) : '0.00'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500">Current Bid</div>
                    <div className="text-sm font-bold text-emerald-400">${typeof product.currentBid === 'number' ? product.currentBid.toFixed(2) : '0.00'}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-end h-full">
                <div className="text-base font-bold text-white">${product.price.toFixed(2)}</div>
              </div>
            )}
          </div>
          
          {/* Action buttons - fixed height */}
          <div className="flex gap-2 h-9">
            {isAuction ? (
              <button
                className="flex-1 rounded-md bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-medium text-white"
                onClick={() => handleAction("bid")}
              >
                Place Bid
              </button>
            ) : (
              <button
                className="flex-1 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1.5 text-xs font-medium text-white"
                onClick={() => handleAction("buy")}
              >
                Buy Now
              </button>
            )}
            <Link href={`/product/${product.id}`} className="block">
              <button className="h-full rounded-md border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors cursor-pointer">
                Details
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Access Restricted Modal */}
      <AccessRestrictedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        requiredTier="basic"
        currentTier={subscriptionTier}
        actionType={actionType || "buy"}
      />
    </>
  )
}

