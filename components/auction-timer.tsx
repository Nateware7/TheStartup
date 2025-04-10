"use client"

import { useState, useEffect } from "react"
import { Timestamp } from "firebase/firestore"
import { checkAndUpdateAuctionStatus } from "@/lib/auction"
import { toast } from "sonner"

type TimerStatus = "active" | "processing" | "sold" | "expired";

interface AuctionTimerProps {
  expiresAt?: any; // Firestore timestamp
  listingId: string;
  isComplete: boolean;
  className?: string;
  onStatusChange?: (isComplete: boolean) => void;
  status?: TimerStatus; // Using the defined type
}

// Helper function to check if a timer is expired
export function isAuctionExpired(expiresAt?: any): boolean {
  if (!expiresAt) return false;
  
  try {
    // Handle various timestamp formats
    let expirationDate;
    if (expiresAt?.toDate) {
      // Firestore Timestamp
      expirationDate = expiresAt.toDate();
    } else if (expiresAt?._seconds) {
      // Firestore serialized timestamp
      expirationDate = new Date(expiresAt._seconds * 1000);
    } else if (expiresAt?.seconds) {
      // Another common Firestore timestamp format
      expirationDate = new Date(expiresAt.seconds * 1000);
    } else {
      // Try as regular date string/object
      expirationDate = new Date(expiresAt);
    }
    
    const now = new Date();
    return expirationDate.getTime() <= now.getTime();
  } catch (error) {
    console.error("Error checking if timer is expired:", error);
    return false;
  }
}

export function AuctionTimer({
  expiresAt,
  listingId,
  isComplete,
  className = "",
  onStatusChange,
  status
}: AuctionTimerProps) {
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [expired, setExpired] = useState(false);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    // If we have a specific status, use that for display instead of calculating time
    if (status === "processing") {
      setRemainingTime("Processing");
      return;
    }
    
    if (status === "sold") {
      setRemainingTime("Sold");
      return;
    }
    
    if (!expiresAt || isComplete) {
      setRemainingTime(isComplete ? "Completed" : "No end time");
      return;
    }
    
    const calculateRemainingTime = () => {
      try {
        // Handle various timestamp formats
        let expirationDate;
        if (expiresAt?.toDate) {
          // Firestore Timestamp
          expirationDate = expiresAt.toDate();
        } else if (expiresAt?._seconds) {
          // Firestore serialized timestamp
          expirationDate = new Date(expiresAt._seconds * 1000);
        } else if (expiresAt?.seconds) {
          // Another common Firestore timestamp format
          expirationDate = new Date(expiresAt.seconds * 1000);
        } else {
          // Try as regular date string/object
          expirationDate = new Date(expiresAt);
        }
        
        const now = new Date();
        const diffMs = expirationDate.getTime() - now.getTime();
        
        // If expired and not already marked as such
        if (diffMs <= 0) {
          if (!expired) {
            setExpired(true);
            setRemainingTime("Expired");
            
            // Auto-complete the auction if not already complete
            if (!isComplete && !status) {
              completeAuction();
            }
          }
          return;
        }
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        // Format time based on components
        if (days > 0) {
          setRemainingTime(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
        } else if (minutes > 0) {
          setRemainingTime(`${minutes}m ${seconds}s`);
        } else {
          setRemainingTime(`${seconds}s`);
        }
      } catch (error) {
        console.error("Error calculating time:", error);
        setRemainingTime("Error");
      }
    };
    
    // Initial calculation
    calculateRemainingTime();
    
    // Update every second for more responsive UI
    const interval = setInterval(calculateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt, isComplete, expired, status]);

  // Function to handle auction completion
  const completeAuction = async () => {
    if (isComplete || completing) return;
    
    setCompleting(true);
    setRemainingTime("Processing");
    try {
      const updated = await checkAndUpdateAuctionStatus(listingId);
      if (updated) {
        if (onStatusChange) {
          onStatusChange(true);
        }
        setRemainingTime("Completed");
        toast.success("Auction has completed");
      }
    } catch (error) {
      console.error("Error completing auction:", error);
      setRemainingTime("Expired");
    } finally {
      setCompleting(false);
    }
  };

  // Handle special status colors
  let statusColor = "";
  if (completing || status === "processing") {
    statusColor = "text-amber-400";
  } else if (status === "sold") {
    statusColor = "text-emerald-500";
  } else if (expired && !isComplete) {
    statusColor = "text-red-400";
  } else if (isComplete) {
    statusColor = "text-amber-400";
  }

  // Determine the display text based on status and completion
  let displayText = remainingTime;
  if (completing) {
    displayText = "Processing";
  } else if (status === "processing") {
    displayText = "Processing";
  } else if (status === "sold") {
    displayText = "Sold";
  } else if (isComplete) {
    displayText = "Completed";
  }

  return (
    <div className="flex flex-col gap-2">
      <span className={`${className} ${statusColor}`}>
        {displayText}
      </span>
      
      {expired && !isComplete && !status && (
        <button
          onClick={completeAuction}
          disabled={completing}
          className="w-full mt-1 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 transition-colors disabled:opacity-50"
        >
          {completing ? "Processing..." : "Complete Auction"}
        </button>
      )}
    </div>
  );
} 