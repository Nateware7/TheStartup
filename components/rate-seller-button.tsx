"use client"

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { RatingModal } from "@/components/rating-modal"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

interface RateSellerButtonProps {
  sellerId: string
  listingId: string
  className?: string
  hasBeenRated?: boolean
  onRatingSubmitted?: (rating: number) => void
}

export function RateSellerButton({
  sellerId,
  listingId,
  className = "",
  hasBeenRated = false,
  onRatingSubmitted
}: RateSellerButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [localHasBeenRated, setLocalHasBeenRated] = useState(hasBeenRated)
  const { user } = useAuth()

  const handleOpenModal = () => {
    if (!user) {
      toast.error("You must be logged in to rate a seller")
      return
    }

    // Don't allow users to rate themselves
    if (user.uid === sellerId) {
      toast.error("You cannot rate yourself")
      return
    }

    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleRatingSubmitted = (rating: number) => {
    setLocalHasBeenRated(true)
    if (onRatingSubmitted) {
      onRatingSubmitted(rating)
    }
  }

  return (
    <>
      <Button 
        onClick={handleOpenModal}
        variant="outline"
        className={`flex items-center gap-1.5 ${className}`}
        disabled={localHasBeenRated}
      >
        <Star className="h-4 w-4" />
        {localHasBeenRated ? "Already Rated" : "Rate Seller"}
      </Button>

      <RatingModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        listingId={listingId}
        sellerId={sellerId}
        winnerId={null}
        targetRole="seller"
        onRatingSubmitted={handleRatingSubmitted}
      />
    </>
  )
} 