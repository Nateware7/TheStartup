"use client"

import { useState } from "react"
import Image from "next/image"
import { Check, X } from "lucide-react"

import { Button } from "@/components/ui/button"

const bids = [
  {
    id: "1",
    product: {
      id: "1",
      title: "Neon Dreams Collection",
      image: "/placeholder.svg?height=600&width=600",
    },
    bidder: {
      name: "DigitalFan",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 4.8,
    },
    amount: 95.0,
    originalPrice: 89.99,
    date: "2023-11-20",
    expires: "2023-12-31",
    status: "pending",
  },
  {
    id: "2",
    product: {
      id: "5",
      title: "Portfolio Website Template",
      image: "/placeholder.svg?height=600&width=600",
    },
    bidder: {
      name: "WebDeveloper",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 4.5,
    },
    amount: 42.0,
    originalPrice: 39.99,
    date: "2023-11-18",
    expires: "2023-12-18",
    status: "pending",
  },
  {
    id: "3",
    product: {
      id: "7",
      title: "Retro Wave Collection",
      image: "/placeholder.svg?height=600&width=600",
    },
    bidder: {
      name: "MusicProducer",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 4.9,
    },
    amount: 52.5,
    originalPrice: 49.99,
    date: "2023-11-15",
    expires: "2023-12-15",
    status: "accepted",
  },
  {
    id: "4",
    product: {
      id: "9",
      title: "UI Animation Library",
      image: "/placeholder.svg?height=600&width=600",
    },
    bidder: {
      name: "UXDesigner",
      avatar: "/placeholder.svg?height=100&width=100",
      rating: 4.7,
    },
    amount: 65.0,
    originalPrice: 59.99,
    date: "2023-11-10",
    expires: "2023-12-10",
    status: "rejected",
  },
]

export function DashboardBids() {
  const [bidsList, setBidsList] = useState(bids)

  const handleAccept = (id) => {
    setBidsList(bidsList.map((bid) => (bid.id === id ? { ...bid, status: "accepted" } : bid)))
  }

  const handleReject = (id) => {
    setBidsList(bidsList.map((bid) => (bid.id === id ? { ...bid, status: "rejected" } : bid)))
  }

  return (
    <div className="space-y-4">
      {bidsList.map((bid) => (
        <div key={bid.id} className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 backdrop-blur-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-md">
                <Image
                  src={bid.product.image || "/placeholder.svg"}
                  alt={bid.product.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-medium">{bid.product.title}</h3>
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <div className="relative h-5 w-5 overflow-hidden rounded-full">
                    <Image
                      src={bid.bidder.avatar || "/placeholder.svg"}
                      alt={bid.bidder.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <span>{bid.bidder.name}</span>
                  <span>•</span>
                  <span>Rating: {bid.bidder.rating}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1">
              <div className="text-lg font-bold">${bid.amount.toFixed(2)}</div>
              <div className="text-sm text-zinc-400">Original: ${bid.originalPrice.toFixed(2)}</div>
              <div className="text-xs text-zinc-500">Expires: {bid.expires}</div>
            </div>

            <div className="flex items-center gap-2">
              {bid.status === "pending" ? (
                <>
                  <Button onClick={() => handleAccept(bid.id)} className="bg-green-600 text-white hover:bg-green-700">
                    <Check className="mr-2 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleReject(bid.id)}
                    className="border-zinc-700 text-white hover:bg-zinc-800"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </>
              ) : (
                <div
                  className={`rounded-full px-3 py-1 text-sm ${
                    bid.status === "accepted" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  }`}
                >
                  {bid.status === "accepted" ? "Accepted" : "Rejected"}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

