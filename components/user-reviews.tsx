"use client"

import { useState, useEffect } from "react"
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { Star, User, CalendarDays } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { format } from "date-fns"
import { Loader } from "lucide-react"

interface UserReviewsProps {
  userId: string;
}

interface Review {
  id: string;
  rating: number;
  review: string;
  raterId: string;
  raterName: string;
  raterAvatar: string;
  createdAt: Date;
  listingId: string;
  listingTitle?: string;
}

export function UserReviews({ userId }: UserReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserReviews() {
      try {
        setLoading(true);
        setError(null);

        // Query for ratings where this user is the target
        const ratingsRef = collection(db, "ratings");
        const ratingsQuery = query(
          ratingsRef, 
          where("targetId", "==", userId),
          orderBy("createdAt", "desc")
        );

        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        if (ratingsSnapshot.empty) {
          setReviews([]);
          setLoading(false);
          return;
        }

        // Process the ratings
        const reviewPromises = ratingsSnapshot.docs.map(async (doc) => {
          const data = doc.data();
          
          // Get rater info
          let raterName = "Anonymous";
          let raterAvatar = "/placeholder.svg?height=100&width=100";
          
          try {
            // Fetch the rater's information from users collection
            const raterDoc = await getDocs(query(
              collection(db, "users"), 
              where("__name__", "==", data.raterId)
            ));
            
            if (!raterDoc.empty) {
              const raterData = raterDoc.docs[0].data();
              raterName = raterData.username || "Anonymous";
              raterAvatar = raterData.profilePicture || "/placeholder.svg?height=100&width=100";
            }
          } catch (err) {
            console.error("Error fetching rater info:", err);
          }
          
          return {
            id: doc.id,
            rating: data.rating || 0,
            review: data.review || "",
            raterId: data.raterId || "",
            raterName,
            raterAvatar,
            createdAt: data.createdAt?.toDate() || new Date(),
            listingId: data.listingId || "",
            listingTitle: "Product" // We'll fetch this later if needed
          };
        });

        const reviewsData = await Promise.all(reviewPromises);
        setReviews(reviewsData);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setError("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    }

    fetchUserReviews();
  }, [userId]);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 animate-spin text-zinc-500" />
        <span className="ml-2 text-sm text-zinc-500">Loading reviews...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800/30 bg-red-900/10 p-4 text-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
        <h3 className="text-lg font-medium">No Reviews Yet</h3>
        <p className="mt-2 text-zinc-400">This user hasn't received any reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {reviews.map((review) => (
        <div 
          key={review.id} 
          className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm"
        >
          <div className="mb-4 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-zinc-800">
                <AvatarImage src={review.raterAvatar} alt={review.raterName} />
                <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-xs text-white">
                  {getInitials(review.raterName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-medium text-zinc-200">{review.raterName}</h4>
                <div className="flex items-center text-xs text-zinc-500">
                  <CalendarDays className="mr-1 h-3 w-3" />
                  {format(review.createdAt, 'MMM d, yyyy')}
                </div>
              </div>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < review.rating
                      ? "fill-yellow-500 text-yellow-500"
                      : "fill-none text-zinc-600"
                  }`}
                />
              ))}
            </div>
          </div>
          {review.review && (
            <p className="text-sm text-zinc-300">{review.review}</p>
          )}
        </div>
      ))}
    </div>
  );
} 