"use client"

import { useState, useEffect } from "react";
import { TransactionConfirmation } from "@/components/transaction-confirmation";
import { RatingModal } from "@/components/rating-modal";
import { useAuth } from "@/hooks/use-auth";
import { isTransactionComplete, checkAndUpdateAuctionStatus } from "@/lib/auction";
import { doc, getDoc, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Trophy, Tag } from "lucide-react";
import { MessageButton } from "@/components/message-button";

interface AuctionCompletionProps {
  listingId: string;
}

export function AuctionCompletion({ listingId }: AuctionCompletionProps) {
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [targetRatingRole, setTargetRatingRole] = useState<'seller' | 'winner'>('seller');
  const [winnerInfo, setWinnerInfo] = useState<any>(null);

  // Listen for changes to the listing document
  useEffect(() => {
    if (!listingId) return;

    const unsubscribe = onSnapshot(
      doc(db, "listings", listingId),
      async (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setListing(data);

          // If not complete but endTime has passed, check auction status
          if (!data.isComplete && data.endTime) {
            const endTime = data.endTime;
            const now = Timestamp.now();
            
            if (endTime.toMillis() <= now.toMillis()) {
              await checkAndUpdateAuctionStatus(listingId);
            }
          }
          
          // If winner exists, fetch their info
          if (data.winnerId) {
            try {
              const winnerDoc = await getDoc(doc(db, "users", data.winnerId));
              if (winnerDoc.exists()) {
                const winnerData = winnerDoc.data();
                setWinnerInfo({
                  id: data.winnerId,
                  username: winnerData.username || "Anonymous",
                  handle: winnerData.handle || `@${winnerData.username?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                  avatar: winnerData.profilePicture || winnerData.photoURL || "/placeholder.svg?height=200&width=200",
                });
              }
            } catch (error) {
              console.error("Error fetching winner info:", error);
            }
          }
        } else {
          setListing(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error listening to listing:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [listingId]);

  // Check if both parties have confirmed and show rating modal if needed
  useEffect(() => {
    if (!user || !listing || !listing.isComplete) return;

    const checkConfirmationAndRating = async () => {
      try {
        // Check if both parties have confirmed the transaction
        const complete = await isTransactionComplete(listingId);
        
        // If transaction is complete and user is involved (seller or winner)
        if (complete && (user.uid === listing.sellerId || user.uid === listing.winnerId)) {
          // Check if listing has already been rated
          if (!listing.hasBeenRated) {
            // Determine who the user should rate (the other party)
            if (user.uid === listing.sellerId) {
              setTargetRatingRole('winner');
            } else {
              setTargetRatingRole('seller');
            }
            
            // Show rating modal
            setShowRatingModal(true);
          }
        }
      } catch (error) {
        console.error("Error checking transaction status:", error);
      }
    };

    checkConfirmationAndRating();
  }, [user, listing, listingId]);

  if (loading || !listing) {
    return null; // Or a loading indicator
  }

  return (
    <>
      {/* Auction Winner Banner */}
      {listing.isComplete && listing.winnerId && (
        <div className="my-4 rounded-xl border border-amber-800/40 bg-amber-900/30 p-5 backdrop-blur-sm shadow-lg">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-600/30 p-2">
                <Trophy className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-amber-300">Auction Complete</h3>
                {winnerInfo ? (
                  <div className="space-y-1">
                    <p className="text-sm text-amber-200/80">
                      Winner: <span className="font-medium">{winnerInfo.username}</span> ({winnerInfo.handle})
                    </p>
                    <p className="text-sm text-amber-200/80">
                      Final Price: <span className="font-medium">${listing.currentBid?.toFixed(2) || "0.00"}</span>
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-amber-200/80">
                    A winner has been determined for this auction.
                  </p>
                )}
              </div>
            </div>
            
            {/* Message button if you're the seller or winner, but not both */}
            {user && ((user.uid === listing.sellerId && listing.winnerId !== user.uid) || 
                       (user.uid === listing.winnerId && listing.sellerId !== user.uid)) && (
              <MessageButton
                recipientId={user.uid === listing.sellerId ? listing.winnerId : listing.sellerId}
                recipientName={winnerInfo?.username || "Auction Participant"}
                className="bg-amber-700/30 hover:bg-amber-700/50 border-amber-700/50 text-white"
                size="sm"
              />
            )}
          </div>
        </div>
      )}
      
      {/* Transaction Confirmation Button */}
      <TransactionConfirmation 
        listingId={listingId}
        isComplete={listing.isComplete || false}
        sellerId={listing.sellerId || ""}
        winnerId={listing.winnerId || null}
        confirmation={listing.confirmation || { sellerConfirmed: false, winnerConfirmed: false }}
        onConfirmationUpdate={() => {
          // This will be triggered when the user confirms the transaction
          // We'll rely on the Firestore listener to update the UI
        }}
      />
      
      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        listingId={listingId}
        sellerId={listing.sellerId || ""}
        winnerId={listing.winnerId || ""}
        targetRole={targetRatingRole}
      />
    </>
  );
} 