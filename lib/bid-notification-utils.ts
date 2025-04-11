import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { 
  createBidNotification, 
  createOutbidNotification 
} from './notification';

/**
 * Handle bid notifications when a new bid is placed
 * This will:
 * 1. Notify the seller about the new bid
 * 2. Notify the previous highest bidder that they've been outbid (if applicable)
 * 
 * @param listingId The ID of the listing being bid on
 * @param bidderId The ID of the user placing the bid
 * @param bidAmount The amount of the bid
 * @returns An object with notification IDs that were created
 */
export async function handleBidNotifications(
  listingId: string,
  bidderId: string,
  bidAmount: number
): Promise<{ sellerNotificationId?: string; previousBidderNotificationId?: string }> {
  try {
    // Get the listing data
    const listingDoc = await getDoc(doc(db, "listings", listingId));
    if (!listingDoc.exists()) {
      console.error(`Listing ${listingId} not found`);
      return {};
    }
    
    const listingData = listingDoc.data();
    const itemTitle = listingData.title || 'Item';
    const sellerId = listingData.sellerId;
    const previousBidderId = listingData.highestBidderId;
    
    const result: { sellerNotificationId?: string; previousBidderNotificationId?: string } = {};
    
    // 1. Notify the seller about the new bid
    if (sellerId && sellerId !== bidderId) {
      const sellerNotificationId = await createBidNotification(
        listingId,
        sellerId,
        bidderId,
        bidAmount,
        itemTitle
      );
      result.sellerNotificationId = sellerNotificationId;
    }
    
    // 2. Notify the previous highest bidder that they've been outbid
    if (previousBidderId && 
        previousBidderId !== bidderId && 
        previousBidderId !== sellerId) {
      const previousBidderNotificationId = await createOutbidNotification(
        listingId,
        previousBidderId,
        bidderId,
        bidAmount,
        itemTitle
      );
      result.previousBidderNotificationId = previousBidderNotificationId;
    }
    
    return result;
  } catch (error) {
    console.error('Error handling bid notifications:', error);
    return {};
  }
} 