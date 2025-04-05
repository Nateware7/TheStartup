"use client"

import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export function RelatedProducts({ products = [] }) {
  if (products.length === 0) {
    return null
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductCard({ product }) {
  if (!product) return null

  // Determine if this is an auction product
  const isAuction = product.currentBid !== undefined && product.startingBid !== undefined

  return (
    <div className="group flex h-full flex-col rounded-xl bg-zinc-900/50 p-6 shadow-lg shadow-violet-500/5 backdrop-blur-sm transition-all hover:shadow-violet-500/10">
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-block rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
          {product.category}
        </div>
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <span>{product.seller.name}</span>
          {product.seller.verified && <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" />}
        </div>
      </div>

      <Link href={`/product/${product.id}`}>
        <h3 className="mb-2 text-xl font-bold text-white hover:text-violet-300 transition-colors">{product.title}</h3>
      </Link>
      <p className="mb-6 flex-grow text-sm text-zinc-400">{product.description}</p>

      <div className="mt-auto space-y-4">
        <div className="flex items-end justify-between">
          <div>
            {isAuction ? (
              <>
                <div className="text-sm text-zinc-400">Starting: ${product.startingBid.toFixed(2)}</div>
                <div className="text-lg font-bold text-emerald-400">Current: ${product.currentBid.toFixed(2)}</div>
              </>
            ) : (
              <div className="text-lg font-bold text-white">${product.price.toFixed(2)}</div>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          {isAuction ? (
            <Button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
              Place Bid
            </Button>
          ) : (
            <Button className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
              Buy Now
            </Button>
          )}
          <Link href={`/product/${product.id}`}>
            <Button
              variant="outline"
              className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700 cursor-pointer transition-all"
            >
              Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

