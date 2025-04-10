"use client"

import { useState, useEffect } from "react"

interface ProductTimerProps {
  expiresAt?: any; // Firestore timestamp
  durationString?: string;
  durationDays?: number;
  durationHours?: number;
  durationMinutes?: number;
  className?: string;
  prefix?: string; // Optional prefix like "Ends: " or "Auction ends in"
  isAuction?: boolean; // Optional flag to style differently based on auction status
  onExpired?: () => void; // Callback function to trigger when auction expires
}

// Static helper function to check if a timer is expired
export function isTimerExpired(expiresAt?: any): boolean {
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

export function ProductTimer({
  expiresAt,
  durationString,
  durationDays,
  durationHours,
  durationMinutes,
  className = "",
  prefix = "",
  isAuction = false,
  onExpired
}: ProductTimerProps) {
  const [remainingTime, setRemainingTime] = useState<string>("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    console.log("ProductTimer props:", { 
      expiresAt, 
      hasToDate: expiresAt?.toDate ? true : false,
      durationString, 
      durationDays, 
      durationHours, 
      durationMinutes 
    });
    
    if (!expiresAt) {
      // If no expiresAt, check for durationString or try to construct from components
      if (durationString && durationString.trim() !== '') {
        console.log("Using durationString:", durationString);
        setRemainingTime(durationString);
        return;
      }
      
      // Try constructing from individual components
      if (durationDays !== undefined || 
          durationHours !== undefined || 
          durationMinutes !== undefined) {
          
        const days = durationDays || 0;
        const hours = durationHours || 0;
        const minutes = durationMinutes || 0;
        
        console.log("Using components:", { days, hours, minutes });
        
        if (days > 0) {
          setRemainingTime(`${days}d ${hours}h ${minutes}m`);
        } else if (hours > 0) {
          setRemainingTime(`${hours}h ${minutes}m`);
        } else {
          setRemainingTime(`${minutes}m`);
        }
        return;
      }
      
      // No time data available
      console.log("No time data found, using fallback");
      setRemainingTime("--");
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
        
        console.log("Calculated expiration date:", expirationDate);
        
        const now = new Date();
        const diffMs = expirationDate.getTime() - now.getTime();
        
        console.log("Time difference (ms):", diffMs);
        
        // If expired
        if (diffMs <= 0) {
          if (!isExpired) {
            setIsExpired(true);
            setRemainingTime("Expired");
            
            // Call the onExpired callback if provided
            if (onExpired) {
              onExpired();
            }
          }
          return;
        }
        
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        console.log("Time components:", { days, hours, minutes, seconds });
        
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
        
        // Fall back to duration string or component values
        if (durationString) {
          setRemainingTime(durationString);
        } else if (durationDays !== undefined || durationHours !== undefined || durationMinutes !== undefined) {
          const days = durationDays || 0;
          const hours = durationHours || 0;
          const minutes = durationMinutes || 0;
          
          if (days > 0) {
            setRemainingTime(`${days}d ${hours}h ${minutes}m`);
          } else if (hours > 0) {
            setRemainingTime(`${hours}h ${minutes}m`);
          } else {
            setRemainingTime(`${minutes}m`);
          }
        } else {
          setRemainingTime("--");
        }
      }
    };
    
    // Initial calculation
    calculateRemainingTime();
    
    // Update more frequently (every second) for more responsive UI
    const interval = setInterval(calculateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, [expiresAt, durationString, durationDays, durationHours, durationMinutes, onExpired, isExpired]);

  // If there's no time data yet, show a loading state
  if (!remainingTime) {
    return <span className={className}>Loading...</span>;
  }

  // Return the formatted time
  return (
    <span className={`${className} ${isAuction ? "text-emerald-400" : ""} ${isExpired ? "text-red-400" : ""}`}>
      {remainingTime === "Expired" 
        ? remainingTime 
        : `${prefix}${remainingTime}`}
    </span>
  );
} 