import { Timestamp, doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { handleAuctionEndNotifications } from './auction-notification-utils';

/**
 * Check if a listing's auction has ended and update its status
 * @param listingId The ID of the listing to check
 * @returns true if the auction ended and was updated, false otherwise
 */
export async function checkAndUpdateAuctionStatus(listingId: string): Promise<boolean> {
  try {
    // Get the listing document
    const listingRef = doc(db, "listings", listingId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      console.error(`Listing ${listingId} not found`);
      return false;
    }
    
    const listingData = listingDoc.data();
    
    // Check if the auction has already been completed
    if (listingData.isComplete) {
      return false;
    }
    
    // Check if the endTime has passed
    const now = Timestamp.now();
    let hasEnded = false;

    // Try to determine the end time from various potential sources
    if (listingData.endTime) {
      let endTimeMs: number;
      
      // Handle various timestamp formats
      if (listingData.endTime instanceof Timestamp) {
        endTimeMs = listingData.endTime.toMillis();
      } else if (listingData.endTime._seconds) {
        // Serialized Firestore timestamp
        endTimeMs = listingData.endTime._seconds * 1000;
      } else if (listingData.endTime.seconds) {
        // Another common Firestore timestamp format
        endTimeMs = listingData.endTime.seconds * 1000;
      } else if (listingData.endTime.toDate) {
        // Callable toDate method
        endTimeMs = listingData.endTime.toDate().getTime();
      } else if (typeof listingData.endTime === 'string') {
        // String date format
        endTimeMs = new Date(listingData.endTime).getTime();
      } else {
        console.warn(`Listing ${listingId} has endTime in unknown format:`, listingData.endTime);
        // Try to parse it as Date anyway
        try {
          endTimeMs = new Date(listingData.endTime).getTime();
        } catch (e) {
          console.error(`Could not parse endTime for listing ${listingId}`);
          endTimeMs = 0;
        }
      }
      
      hasEnded = endTimeMs <= now.toMillis();
    } else if (listingData.expiresAt) {
      // Try using expiresAt field instead
      let expiresAtMs: number;
      
      if (listingData.expiresAt instanceof Timestamp) {
        expiresAtMs = listingData.expiresAt.toMillis();
      } else if (listingData.expiresAt._seconds) {
        expiresAtMs = listingData.expiresAt._seconds * 1000;
      } else if (listingData.expiresAt.seconds) {
        expiresAtMs = listingData.expiresAt.seconds * 1000;
      } else if (listingData.expiresAt.toDate) {
        expiresAtMs = listingData.expiresAt.toDate().getTime();
      } else if (typeof listingData.expiresAt === 'string') {
        expiresAtMs = new Date(listingData.expiresAt).getTime();
      } else {
        try {
          expiresAtMs = new Date(listingData.expiresAt).getTime();
        } catch (e) {
          console.error(`Could not parse expiresAt for listing ${listingId}`);
          expiresAtMs = 0;
        }
      }
      
      hasEnded = expiresAtMs <= now.toMillis();
    } else if (listingData.createdAt && 
              (listingData.durationDays || listingData.durationHours || listingData.durationMinutes)) {
      // Try to calculate end time from creation time and duration
      let createdAtMs: number;
      if (listingData.createdAt instanceof Timestamp) {
        createdAtMs = listingData.createdAt.toMillis();
      } else if (listingData.createdAt._seconds) {
        createdAtMs = listingData.createdAt._seconds * 1000;
      } else if (listingData.createdAt.seconds) {
        createdAtMs = listingData.createdAt.seconds * 1000;
      } else if (listingData.createdAt.toDate) {
        createdAtMs = listingData.createdAt.toDate().getTime();
      } else {
        try {
          createdAtMs = new Date(listingData.createdAt).getTime();
        } catch (e) {
          console.error(`Could not parse createdAt for listing ${listingId}`);
          return false;
        }
      }
      
      // Calculate total duration in milliseconds
      const durationDays = listingData.durationDays || 0;
      const durationHours = listingData.durationHours || 0;
      const durationMinutes = listingData.durationMinutes || 0;
      
      const durationMs = 
        (durationDays * 24 * 60 * 60 * 1000) + 
        (durationHours * 60 * 60 * 1000) + 
        (durationMinutes * 60 * 1000);
      
      const endTimeMs = createdAtMs + durationMs;
      hasEnded = endTimeMs <= now.toMillis();
    } else {
      // If we can't determine the end time, we'll use the durationString as a heuristic
      // If it contains "Expired", we'll consider the auction as ended
      if (listingData.durationString && listingData.durationString.includes("Expired")) {
        hasEnded = true;
      } else {
        console.warn(`Listing ${listingId} has no determinable end time`);
        return false;
      }
    }
    
    if (!hasEnded) {
      // Auction hasn't ended yet
      return false;
    }
    
    // Auction has ended, update the listing
    await updateDoc(listingRef, {
      isComplete: true,
      winnerId: listingData.highestBidderId || null,
      confirmation: {
        sellerConfirmed: false,
        winnerConfirmed: false
      }
    });
    
    // Send notifications to the seller and winner
    await handleAuctionEndNotifications(listingId);
    
    console.log(`Auction for listing ${listingId} marked as complete`);
    return true;
  } catch (error) {
    console.error("Error checking auction status:", error);
    return false;
  }
}

/**
 * Confirm a transaction by the seller or winner
 * @param listingId The ID of the listing
 * @param userId The ID of the user confirming the transaction
 * @param role Either 'seller' or 'winner'
 * @returns true if confirmation was successful, false otherwise
 */
export async function confirmTransaction(
  listingId: string, 
  userId: string, 
  role: 'seller' | 'winner'
): Promise<boolean> {
  try {
    const listingRef = doc(db, "listings", listingId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      console.error(`Listing ${listingId} not found`);
      return false;
    }
    
    const listingData = listingDoc.data();
    
    // Verify the user is either the seller or winner
    if (
      (role === 'seller' && listingData.sellerId !== userId) || 
      (role === 'winner' && listingData.winnerId !== userId)
    ) {
      console.error(`User ${userId} is not the ${role} of listing ${listingId}`);
      return false;
    }
    
    // Update the confirmation status
    const confirmationField = role === 'seller' ? 'sellerConfirmed' : 'winnerConfirmed';
    
    await updateDoc(listingRef, {
      [`confirmation.${confirmationField}`]: true
    });
    
    // Check if both parties have now confirmed the transaction
    const otherRole = role === 'seller' ? 'winnerConfirmed' : 'sellerConfirmed';
    const otherConfirmed = listingData.confirmation?.[otherRole] === true;
    
    // If both have confirmed, update status to "sold"
    if (otherConfirmed) {
      await updateDoc(listingRef, {
        status: "sold"
      });
      console.log(`Listing ${listingId} has been marked as sold`);
    }
    
    return true;
  } catch (error) {
    console.error("Error confirming transaction:", error);
    return false;
  }
}

/**
 * Check if both parties have confirmed the transaction
 * @param listingId The ID of the listing
 * @returns true if both parties have confirmed, false otherwise
 */
export async function isTransactionComplete(listingId: string): Promise<boolean> {
  try {
    const listingRef = doc(db, "listings", listingId);
    const listingDoc = await getDoc(listingRef);
    
    if (!listingDoc.exists()) {
      return false;
    }
    
    const listingData = listingDoc.data();
    
    // Check if both parties have confirmed
    const isComplete = (
      listingData.confirmation?.sellerConfirmed === true && 
      listingData.confirmation?.winnerConfirmed === true
    );
    
    return isComplete;
  } catch (error) {
    console.error("Error checking transaction status:", error);
    return false;
  }
}

/**
 * Save a user's rating and review for a transaction
 * @param listingId The ID of the listing
 * @param raterId The ID of the user leaving the rating
 * @param targetId The ID of the user being rated
 * @param rating Numeric rating (1-5)
 * @param review Optional text review
 * @returns true if the rating was saved successfully, false otherwise
 */
export async function saveRating(
  listingId: string,
  raterId: string,
  targetId: string,
  rating: number,
  review?: string
): Promise<boolean> {
  try {
    console.log("Starting saveRating function with parameters:", {
      listingId, raterId, targetId, rating, review: review ? "Has review" : "No review"
    });

    // Validate the rating
    if (rating < 1 || rating > 5) {
      console.error("Rating must be between 1 and 5");
      return false;
    }
    
    // Create the rating document
    const ratingData = {
      listingId,
      raterId,
      targetId,
      rating,
      review: review || "",
      createdAt: Timestamp.now()
    };
    
    console.log("Rating data prepared:", ratingData);
    
    // First mark the listing as rated to prevent duplicate ratings
    try {
      console.log("Updating listing with hasBeenRated flag...");
      await updateDoc(doc(db, "listings", listingId), {
        hasBeenRated: true
      });
      console.log("Successfully updated listing with hasBeenRated flag");
    } catch (error) {
      console.error("Error updating listing with hasBeenRated flag:", error);
      // Continue even if this fails, as it's not critical
    }
    
    // Then create the rating document directly in the ratings collection
    try {
      // Generate a unique ID for the rating
      const ratingId = `${listingId}_${raterId}_${Date.now()}`;
      console.log(`Attempting to create rating document with ID: ${ratingId}`);
      await setDoc(doc(db, "ratings", ratingId), ratingData);
      console.log("Successfully created rating document");
      
      // Manually update the user's rating - this ensures it works even if Cloud Function fails
      try {
        await updateUserRating(targetId);
        console.log("Successfully updated user's average rating");
      } catch (ratingUpdateError) {
        console.error("Error updating user's average rating:", ratingUpdateError);
        // Continue even if rating update fails - at least we saved the rating
      }
      
      return true;
    } catch (error) {
      console.error("Error creating rating document:", error);
      // This is the critical error - if we can't create the rating, consider it a failure
      throw new Error(`Failed to create rating: ${error instanceof Error ? error.message : String(error)}`);
    }
    
  } catch (error) {
    console.error("Error in saveRating function:", error);
    throw error; // Re-throw the error to be handled by the calling component
  }
}

/**
 * Update a user's average rating based on all their received ratings
 * @param userId The ID of the user to update
 */
export async function updateUserRating(userId: string): Promise<void> {
  try {
    console.log(`Updating average rating for user ${userId}`);
    
    // Get all ratings for this user
    const ratingsRef = collection(db, "ratings");
    const q = query(ratingsRef, where("targetId", "==", userId));
    const ratingsSnapshot = await getDocs(q);
    
    if (ratingsSnapshot.empty) {
      console.log(`No ratings found for user ${userId}`);
      return;
    }
    
    // Calculate the average rating
    let totalRating = 0;
    let count = 0;
    
    ratingsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.rating && typeof data.rating === 'number') {
        totalRating += data.rating;
        count++;
      }
    });
    
    if (count === 0) {
      console.log(`No valid ratings found for user ${userId}`);
      return;
    }
    
    const averageRating = totalRating / count;
    console.log(`Calculated average rating for user ${userId}: ${averageRating.toFixed(1)} (${count} ratings)`);
    
    // Store the rating in a separate 'userRatings' collection instead of updating the user directly
    // This avoids the permission issues with updating user documents
    const userRatingRef = doc(db, "userRatings", userId);
    await setDoc(userRatingRef, {
      userId: userId,
      rating: averageRating,
      count: count,
      updatedAt: Timestamp.now()
    }, { merge: true });
    
    console.log(`Successfully stored rating for user ${userId} in userRatings collection`);
  } catch (error) {
    console.error(`Error updating user rating for ${userId}:`, error);
  }
} 