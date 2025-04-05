"use client"
import { useState } from "react"
import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSubscription } from "@/hooks/use-subscription"
import { AccessRestrictedModal } from "@/components/access-restricted-modal"

export function ProductCard({ product }) {
  const { canPerformAction, subscriptionTier } = useSubscription()
  const [showModal, setShowModal] = useState(false)
  const [actionType, setActionType] = useState<"buy" | "bid" | null>(null)

  if (!product) return null

  const getInitials = (name) => {
    // Handle @ symbol in usernames
    const nameWithoutAt = name.startsWith("@") ? name.substring(1) : name

    return nameWithoutAt
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Determine if this is an auction product
  const isAuction = product.currentBid !== undefined && product.startingBid !== undefined

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
      <div className="rounded-lg overflow-hidden bg-gradient-to-b from-zinc-900 to-zinc-900/90 via-indigo-950/10 border border-zinc-800/50 transition-all hover:border-zinc-700/50">
        {/* Header - Seller info */}
        <div className="p-4 border-b border-zinc-800/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7 border border-zinc-800">
                <AvatarImage src={product.seller?.avatar} alt={product.seller?.name} />
                <AvatarFallback className="bg-gradient-to-br from-violet-600/80 to-indigo-600/80 text-xs text-white">
                  {getInitials(product.seller?.name || "")}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-xs font-medium text-zinc-300">{product.seller?.name}</span>
                {product.seller?.verified && <CheckCircle className="h-3 w-3 fill-indigo-500 text-white" />}
              </div>
            </div>
            <div className="rounded-full bg-zinc-800/50 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
              {product.category}
            </div>
          </div>
        </div>

        {/* Content - Product info */}
        <div className="p-4">
          <Link href={`/product/${product.id}`}>
            <h3 className="mb-1 text-base font-bold leading-tight text-white hover:text-violet-300 transition-colors">
              {product.title}
            </h3>
          </Link>
          <p className="line-clamp-1 text-xs text-zinc-400 mb-3">{product.description}</p>

          {/* Price info */}
          <div className="mb-3">
            {isAuction ? (
              <>
                <div className="flex justify-between items-end">
                  <div>
                    <div className="text-[10px] text-zinc-500">Starting Bid</div>
                    <div className="text-xs text-zinc-300">${product.startingBid.toFixed(2)}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-zinc-500">Current Bid</div>
                    <div className="text-sm font-bold text-emerald-400">${product.currentBid.toFixed(2)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-base font-bold text-white">${product.price.toFixed(2)}</div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mb-3">
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
              <button className="rounded-md border border-zinc-700 bg-zinc-800/40 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors cursor-pointer">
                Details
              </button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-zinc-900/60 px-4 py-2 text-[10px] text-zinc-500 flex items-center justify-between">
          <div>Total sales: {product.stats?.sales ? product.stats.sales.toLocaleString() : "0"}</div>
          <div>Last sold: {product.stats?.lastSold || "Never"}</div>
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

