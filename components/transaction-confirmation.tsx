"use client"

import { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { confirmTransaction } from "@/lib/auction";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { toast } from "sonner";

interface TransactionConfirmationProps {
  listingId: string;
  isComplete: boolean;
  sellerId: string;
  winnerId: string | null;
  confirmation?: {
    sellerConfirmed: boolean;
    winnerConfirmed: boolean;
  };
  onConfirmationUpdate?: () => void;
}

export function TransactionConfirmation({
  listingId,
  isComplete,
  sellerId,
  winnerId,
  confirmation = { sellerConfirmed: false, winnerConfirmed: false },
  onConfirmationUpdate
}: TransactionConfirmationProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<'seller' | 'winner' | null>(null);
  const [hasConfirmed, setHasConfirmed] = useState(false);

  useEffect(() => {
    if (!user || !isComplete) return;

    // Determine if current user is seller or winner
    if (user.uid === sellerId) {
      setUserRole('seller');
      setHasConfirmed(confirmation.sellerConfirmed);
    } else if (user.uid === winnerId) {
      setUserRole('winner');
      setHasConfirmed(confirmation.winnerConfirmed);
    } else {
      setUserRole(null);
    }
  }, [user, isComplete, sellerId, winnerId, confirmation]);

  // If listing isn't complete or user isn't seller/winner, don't show anything
  if (!isComplete || !userRole) return null;

  const handleConfirm = async () => {
    if (!user || !userRole || hasConfirmed) return;

    setIsLoading(true);
    try {
      const success = await confirmTransaction(listingId, user.uid, userRole);
      
      if (success) {
        setHasConfirmed(true);
        toast.success("Transaction confirmed successfully!");
        if (onConfirmationUpdate) {
          onConfirmationUpdate();
        }
      } else {
        toast.error("Failed to confirm transaction. Please try again.");
      }
    } catch (error) {
      console.error("Error confirming transaction:", error);
      toast.error("An error occurred while confirming the transaction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-5 backdrop-blur-sm shadow-lg">
      <div className="flex flex-col">
        <h3 className="text-lg font-semibold text-white mb-2">Transaction Confirmation</h3>
        
        {confirmation.sellerConfirmed && confirmation.winnerConfirmed ? (
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-2 text-emerald-400 mb-2">
              <CheckCircle className="h-6 w-6" />
              <span className="text-base font-medium">Transaction Complete</span>
            </div>
            <p className="text-sm text-zinc-400">
              Both parties have confirmed this transaction. The item has been marked as sold.
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-400 mb-4">
              {userRole === 'seller'
                ? "Please confirm that you've completed this transaction with the buyer."
                : "Please confirm that you've completed this transaction with the seller."}
            </p>
            
            {hasConfirmed ? (
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">
                  You have confirmed this transaction
                </span>
              </div>
            ) : (
              <Button
                onClick={handleConfirm}
                disabled={isLoading}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium"
                variant="default"
              >
                {isLoading ? "Confirming..." : "Confirm Transaction"}
              </Button>
            )}
            
            {(userRole === 'seller' && confirmation.winnerConfirmed) && (
              <div className="mt-2 text-xs text-emerald-400/80">
                The buyer has already confirmed this transaction.
              </div>
            )}
            
            {(userRole === 'winner' && confirmation.sellerConfirmed) && (
              <div className="mt-2 text-xs text-emerald-400/80">
                The seller has already confirmed this transaction.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 