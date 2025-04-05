"use client"

import { useState } from "react"
import Image from "next/image"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const reviews = [
  {
    id: 1,
    rating: 5,
    comment:
      "Absolutely stunning artwork! The neon effects are incredible and the resolution is perfect for my needs. Highly recommend this collection to anyone looking for high-quality digital art.",
    date: "2023-11-20",
    user: {
      name: "DigitalFan",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: 2,
    rating: 4,
    comment:
      "Great collection with beautiful designs. The only reason I'm not giving 5 stars is because I wish there were more variations in the color schemes. Otherwise, excellent quality!",
    date: "2023-11-15",
    user: {
      name: "ArtCollector",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
  {
    id: 3,
    rating: 5,
    comment:
      "The seller was very responsive when I had questions about the file formats. The artwork itself is phenomenal and exactly what I needed for my project.",
    date: "2023-11-10",
    user: {
      name: "ProjectManager",
      avatar: "/placeholder.svg?height=100&width=100",
    },
  },
]

export function ProductReviews() {
  const [activeTab, setActiveTab] = useState("reviews")

  return (
    <div>
      <div className="mb-6 flex border-b border-zinc-800">
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "reviews" ? "border-b-2 border-violet-500 text-white" : "text-zinc-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("reviews")}
        >
          Reviews ({reviews.length})
        </button>
        <button
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === "add" ? "border-b-2 border-violet-500 text-white" : "text-zinc-400 hover:text-white"
          }`}
          onClick={() => setActiveTab("add")}
        >
          Add Review
        </button>
      </div>

      {activeTab === "reviews" ? (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg bg-zinc-900/50 p-4 backdrop-blur-sm">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 overflow-hidden rounded-full">
                    <Image
                      src={review.user.avatar || "/placeholder.svg"}
                      alt={review.user.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium">{review.user.name}</div>
                    <div className="text-sm text-zinc-400">{review.date}</div>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating ? "fill-yellow-500 text-yellow-500" : "fill-zinc-700 text-zinc-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-zinc-400">{review.comment}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg bg-zinc-900/50 p-6 backdrop-blur-sm">
          <h3 className="mb-4 text-lg font-medium">Write a Review</h3>
          <div className="mb-4">
            <div className="mb-2 text-sm">Rating</div>
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <button key={i} className="rounded-full p-1 hover:bg-zinc-800">
                  <Star className="h-6 w-6 fill-zinc-700 text-zinc-700 hover:fill-yellow-500 hover:text-yellow-500" />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <div className="mb-2 text-sm">Your Review</div>
            <Textarea
              placeholder="Share your experience with this product..."
              className="min-h-32 border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:ring-violet-500"
            />
          </div>
          <Button className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
            Submit Review
          </Button>
        </div>
      )}
    </div>
  )
}

