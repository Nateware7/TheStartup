"use client"

import { Star } from "lucide-react"

interface StarRatingProps {
  rating: number
  maxRating?: number
  size?: "sm" | "md" | "lg"
  showValue?: boolean
  className?: string
}

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  showValue = false,
  className = "",
}: StarRatingProps) {
  // Calculate the size of the stars based on the size prop
  const getStarSize = () => {
    switch (size) {
      case "sm": return "h-3 w-3"
      case "lg": return "h-5 w-5"
      default: return "h-4 w-4"
    }
  }

  const starSize = getStarSize()

  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex">
        {[...Array(maxRating)].map((_, i) => (
          <Star
            key={i}
            className={`${starSize} ${
              i < Math.floor(rating) 
                ? "fill-yellow-500 text-yellow-500" 
                : i < rating && i + 1 > rating
                ? "fill-yellow-500/50 text-yellow-500/50" // half star effect for partial ratings
                : "fill-zinc-700 text-zinc-700"
            }`}
          />
        ))}
      </div>
      {showValue && <span className="ml-1.5 text-sm text-zinc-300">{rating.toFixed(1)}</span>}
    </div>
  )
} 