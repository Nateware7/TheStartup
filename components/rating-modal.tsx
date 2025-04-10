"use client"

import { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { saveRating } from "@/lib/auction";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  sellerId: string;
  winnerId: string | null;
  targetRole: 'seller' | 'winner';
  onRatingSubmitted?: (rating: number) => void;
}

export function RatingModal({
  isOpen,
  onClose,
  listingId,
  sellerId,
  winnerId,
  targetRole,
  onRatingSubmitted
}: RatingModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);

  // Get target user details
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchTargetUserInfo = async () => {
      try {
        const targetUserId = targetRole === 'seller' ? sellerId : winnerId;
        if (!targetUserId) return;
        
        const userDoc = await getDoc(doc(db, "users", targetUserId));
        if (userDoc.exists()) {
          setTargetUser({
            id: targetUserId,
            ...userDoc.data()
          });
        }
      } catch (error) {
        console.error("Error fetching target user:", error);
      }
    };
    
    fetchTargetUserInfo();
  }, [isOpen, sellerId, winnerId, targetRole]);

  const handleSubmit = async () => {
    if (!user || !rating || rating < 1 || rating > 5) {
      toast.error("Please select a rating before submitting");
      return;
    }

    const targetUserId = targetRole === 'seller' ? sellerId : winnerId;
    if (!targetUserId) {
      toast.error("Target user not found");
      return;
    }

    setIsLoading(true);
    try {
      console.log("Starting rating submission process");
      
      // Check if user is authenticated
      if (!user.uid) {
        toast.error("You must be logged in to submit a rating");
        setIsLoading(false);
        return;
      }
      
      console.log("Using auth UID:", user.uid);
      console.log("Target user:", targetUserId);
      console.log("Rating data:", { listingId, rating, review: review ? "Has review" : "No review" });
      
      await saveRating(
        listingId,
        user.uid,
        targetUserId,
        rating,
        review
      );
      
      // If we get here, rating was successful
      toast.success("Rating submitted successfully!");
      
      // Call the onRatingSubmitted callback if provided
      if (onRatingSubmitted) {
        onRatingSubmitted(rating);
      }
      
      onClose();
      
    } catch (error) {
      console.error("Error submitting rating:", error);
      
      // Extract error message
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log("Error message:", errorMessage);
      
      // Handle specific error cases
      if (errorMessage.includes("permission-denied") || errorMessage.includes("Missing or insufficient permissions")) {
        toast.error("Permission denied. Please check Firestore security rules.");
        console.error("Firestore permission error. Current user ID:", user.uid);
        console.error("Rating details:", { listingId, raterId: user.uid, targetId: targetUserId });
      } else if (errorMessage.includes("not found")) {
        toast.error("Document not found. The listing or user may have been deleted.");
      } else if (errorMessage.includes("network")) {
        toast.error("Network error. Please check your internet connection.");
      } else {
        toast.error(`Error: ${errorMessage.slice(0, 100)}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = () => {
    return Array(5).fill(0).map((_, i) => {
      const ratingValue = i + 1;
      return (
        <button
          type="button"
          key={ratingValue}
          className={`text-2xl transition-all ${
            (hoverRating || rating) >= ratingValue
              ? "text-yellow-400 scale-110"
              : "text-zinc-600"
          }`}
          onClick={() => setRating(ratingValue)}
          onMouseEnter={() => setHoverRating(ratingValue)}
          onMouseLeave={() => setHoverRating(0)}
        >
          <Star className="h-8 w-8" fill={(hoverRating || rating) >= ratingValue ? "currentColor" : "none"} />
        </button>
      );
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-900 border border-zinc-800 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">Rate Your Experience</DialogTitle>
          <DialogDescription className="text-zinc-400 text-center">
            {targetUser?.username 
              ? `How was your experience with ${targetUser.username}?`
              : "How was your experience with this user?"}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-center mt-2 mb-4 gap-2">
          {renderStars()}
        </div>
        
        <div className="space-y-2">
          <label htmlFor="review" className="text-sm font-medium text-zinc-300">
            Review (Optional)
          </label>
          <Textarea
            id="review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            placeholder="Tell us about your experience..."
            className="resize-none h-24 bg-zinc-800 border-zinc-700 text-white"
          />
        </div>
        
        <div className="flex justify-end gap-3 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || rating === 0}
            className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
          >
            {isLoading ? "Submitting..." : "Submit Rating"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 