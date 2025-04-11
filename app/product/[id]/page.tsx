"use client";

import Link from "next/link"
import { ArrowLeft, CheckCircle, Share2, MessageCircle, ShoppingBag } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AnimatedBackground } from "@/components/animated-background"
import { AuctionLog } from "@/components/auction-log"
import { MessageButton } from "@/components/message-button"
import { ProductTimer, isTimerExpired } from "@/components/product-timer"
import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore"
import { db, auth } from "@/lib/firebaseConfig"
import { usePathname } from "next/navigation"
import { format } from "date-fns"
import { AuctionCompletion } from "@/components/auction-completion"
import { checkAndUpdateAuctionStatus } from "@/lib/auction"
import { toast } from "sonner"
import { AuctionTimer } from "@/components/auction-timer"
import { StarRating } from "@/components/star-rating"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { handleBidNotifications } from "@/lib/bid-notification-utils"

// NOTE: This component directly accesses params.id which will show warnings in the console
// In a future version of Next.js, params will need to be unwrapped with React.use()
// For now, the direct access approach works and the warnings can be ignored

interface Product {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  startingBid: number;
  currentBid: number;
  price: number;
  category: string;
  assetType: string;
  durationDays?: number;
  durationHours?: number;
  durationMinutes?: number;
  durationString?: string;
  expiresAt?: any;
  createdAt?: any;
  seller: {
    id: string;
    name: string;
    handle: string;
    avatar: string;
    verified: boolean;
    joinDate: string;
    sales: number;
    rating: number;
  };
  status: "active" | "sold";
  bid?: number;
  auctionLog?: Array<{ username: string; amount: number; timestamp: string; isLeading?: boolean }>;
  isComplete: boolean;
  sellerId?: string;
  winnerId?: string | null;
  highestBidderId?: string;
  confirmation?: {
    sellerConfirmed: boolean;
    winnerConfirmed: boolean;
  };
  hasBeenRated?: boolean;
  isAuction?: boolean;
}

export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [auctionExpired, setAuctionExpired] = useState(false);
  
  // Get the product ID from the pathname instead of params
  const pathname = usePathname();
  const productId = pathname ? pathname.split('/').pop() : '';

  const router = useRouter();

  useEffect(() => {
    if (!productId) return;
    
    setLoading(true);
    
    // Set up real-time listener for product updates
    const unsubscribe = onSnapshot(
      doc(db, "listings", productId),
      async (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if transaction is complete but status is not updated
          if (data.isComplete && 
              data.confirmation?.sellerConfirmed === true && 
              data.confirmation?.winnerConfirmed === true && 
              data.status !== "sold") {
            // Update status to "sold"
            await updateDoc(doc(db, "listings", productId), { status: "sold" });
            console.log(`Updated listing ${productId} status to sold`);
            data.status = "sold";
          }
          
          // Get seller information
          let sellerInfo = {
            id: data.sellerId || "",
            name: "Anonymous",
            handle: "@user",
            avatar: "/placeholder.svg?height=200&width=200",
            verified: false,
            joinDate: "Unknown",
            sales: 0,
            rating: 0,
          };
          
          // Fetch seller details from the users collection
          if (data.sellerId) {
            try {
              const sellerDoc = await getDoc(doc(db, "users", data.sellerId));
              if (sellerDoc.exists()) {
                const sellerData = sellerDoc.data();
                
                // Get the seller's rating from userRatings collection if available
                let sellerRating = sellerData.rating || 0;
                try {
                  const sellerRatingDoc = await getDoc(doc(db, "userRatings", data.sellerId));
                  if (sellerRatingDoc.exists()) {
                    const ratingData = sellerRatingDoc.data();
                    sellerRating = ratingData.rating || sellerRating;
                  }
                } catch (ratingErr) {
                  console.error("Error fetching seller rating:", ratingErr);
                  // Continue with the original rating if there's an error
                }
                
                // Calculate sales by getting listings that are sold
                let salesCount = sellerData.sales || 0;
                try {
                  const listingsRef = collection(db, "listings");
                  const q = query(
                    listingsRef,
                    where("sellerId", "==", data.sellerId),
                    where("status", "==", "sold")
                  );
                  const soldListingsSnapshot = await getDocs(q);
                  salesCount = soldListingsSnapshot.size;
                } catch (error) {
                  console.error("Error counting sold items:", error);
                }
                
                sellerInfo = {
                  id: data.sellerId,
                  name: sellerData.username || sellerData.displayName || "Anonymous",
                  handle: sellerData.handle || `@${sellerData.username?.toLowerCase().replace(/\s+/g, '') || 'user'}`,
                  avatar: sellerData.profilePicture || sellerData.photoURL || "/placeholder.svg?height=200&width=200",
                  verified: sellerData.isVerified || false,
                  joinDate: sellerData.createdAt ? format(sellerData.createdAt.toDate(), 'MMMM yyyy') : "Unknown",
                  sales: salesCount,
                  rating: sellerRating,
                };
              }
            } catch (error) {
              console.error("Error fetching seller info:", error);
            }
          }
          
          setProduct({
            id: docSnap.id,
            title: data.title || "",
            description: data.description || "",
            longDescription: data.longDescription || "",
            startingBid: data.startingBid || 0,
            currentBid: data.currentBid || 0,
            price: data.price || 0,
            category: data.category || "",
            assetType: data.assetType || "username",
            durationDays: data.durationDays || 0,
            durationHours: data.durationHours || 0,
            durationMinutes: data.durationMinutes || 0,
            durationString: data.durationString || "",
            expiresAt: data.expiresAt || null,
            createdAt: data.createdAt || new Date(),
            seller: sellerInfo,
            status: data.status || "active",
            bid: data.bid,
            auctionLog: data.auctionLog || [],
            isComplete: data.isComplete || false,
            sellerId: data.sellerId,
            winnerId: data.winnerId,
            highestBidderId: data.highestBidderId,
            confirmation: data.confirmation || { sellerConfirmed: false, winnerConfirmed: false },
            hasBeenRated: data.hasBeenRated || false,
            isAuction: data.isAuction || false,
          });
        } else {
          setProduct(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error in product listener:", error);
        setLoading(false);
      }
    );
    
    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [productId]);

  const handleBid = async () => {
    if (!product) return;
    if (typeof bidAmount !== "number" || bidAmount <= product.currentBid) {
      setError("Bid must be higher than the current bid.");
      return;
    }
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("You must be logged in to place a bid.");
      return;
    }

    try {
      // Get the user's username from Firestore
      let username = "Anonymous";
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          username = userData.username || "Anonymous";
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }

      const productRef = doc(db, "listings", product.id);
      await updateDoc(productRef, { 
        currentBid: bidAmount,
        highestBidderId: currentUser.uid,
        // Add to auction log
        auctionLog: [
          {
            username: username,
            amount: bidAmount,
            timestamp: new Date().toISOString(),
            isLeading: true
          },
          ...(product.auctionLog || []).map(log => ({...log, isLeading: false}))
        ]
      });
      
      // Send notifications to relevant parties
      await handleBidNotifications(product.id, currentUser.uid, bidAmount);
      
      setProduct((prev) => prev && { 
        ...prev, 
        currentBid: bidAmount,
        auctionLog: [
          {
            username: username,
            amount: bidAmount,
            timestamp: "Just now",
            isLeading: true
          },
          ...(prev.auctionLog || []).map(log => ({...log, isLeading: false}))
        ]
      });
      
      setSuccess("Bid placed successfully!");
      setError(null);
    } catch (err) {
      console.error("Error placing bid:", err);
      setError("Failed to place bid. Please try again.");
    }
  };

  // Show loading state
  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen text-white">
          <Navbar />
          <main className="container mx-auto px-4 pt-24 pb-20">
            <Link
              href="/marketplace"
              className="mb-8 inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Marketplace</span>
            </Link>
            
            <div className="rounded-xl bg-zinc-900/50 p-8 shadow-lg backdrop-blur-sm">
              {/* Loading header */}
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-zinc-800/80 animate-pulse"></div>
                  <div>
                    <div className="h-4 w-32 bg-zinc-800/80 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-zinc-800/80 rounded mt-2 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-6 w-20 rounded-full bg-zinc-800/80 animate-pulse"></div>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                {/* Main content loading skeleton */}
                <div className="lg:col-span-2">
                  <div className="h-8 w-2/3 bg-zinc-800/80 rounded animate-pulse mb-3"></div>
                  <div className="h-4 w-full bg-zinc-800/80 rounded animate-pulse mb-6"></div>

                  <div className="mb-6">
                    <div className="h-6 w-40 bg-zinc-800/80 rounded animate-pulse mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 w-full bg-zinc-800/80 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-zinc-800/80 rounded animate-pulse"></div>
                      <div className="h-4 w-3/4 bg-zinc-800/80 rounded animate-pulse"></div>
                    </div>
                  </div>
                </div>

                {/* Right sidebar loading skeleton */}
                <div className="space-y-6">
                  {/* Price/Bid card */}
                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-5 backdrop-blur-sm shadow-lg">
                    <div className="h-20 bg-zinc-800/50 rounded animate-pulse mb-4"></div>
                    <div className="h-10 w-full bg-zinc-800/50 rounded animate-pulse"></div>
                  </div>

                  {/* Seller info card */}
                  <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-5 backdrop-blur-sm shadow-lg">
                    <div className="h-5 w-32 bg-zinc-800/50 rounded animate-pulse mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse"></div>
                      <div className="h-4 w-full bg-zinc-800/50 rounded animate-pulse"></div>
                    </div>
                    <div className="h-10 w-full bg-zinc-800/50 rounded animate-pulse mt-4"></div>
                  </div>

                  {/* Share button */}
                  <div className="h-10 w-full bg-zinc-800/30 rounded animate-pulse"></div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    );
  }

  // Handle case where product is not found
  if (!product) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen text-white">
          <Navbar />
          <main className="container mx-auto px-4 pt-24 pb-20">
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
              <p className="text-zinc-400 mb-8">The product you're looking for doesn't exist or has been removed.</p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 rounded-md bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 font-medium text-white hover:from-violet-600 hover:to-indigo-600"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
              </Link>
            </div>
          </main>
        </div>
      </AnimatedBackground>
    );
  }

  console.log('Raw product data:', product);

  // Force isAuction to be a boolean based on explicit isAuction flag
  const isAuction = Boolean(product.isAuction);
  console.log('Is this an auction?', isAuction);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase();
  };

  // Update the remaining time state on expiration
  const handleTimerExpired = () => {
    setAuctionExpired(true);
  };

  // Check if the auction timer has expired
  const isExpired = product?.expiresAt ? isTimerExpired(product.expiresAt) : false;

  // Handle auction status changes
  const handleAuctionStatusChange = (isComplete: boolean) => {
    if (isComplete) {
      setProduct(prevProduct => {
        if (!prevProduct) return null;
        return {
          ...prevProduct,
          isComplete: true,
          winnerId: prevProduct.highestBidderId || null
        };
      });
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        <main className="container mx-auto px-4 pt-24 pb-20">
          <Link
            href="/marketplace"
            className="mb-8 inline-flex items-center gap-2 text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Marketplace</span>
          </Link>

          <div className="rounded-xl bg-zinc-900/50 p-8 shadow-lg backdrop-blur-sm">
            {/* Seller info header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Link href={`/profile/${product.seller.id}`}>
                  <Avatar className="h-10 w-10 border border-zinc-800 cursor-pointer">
                    <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-xs text-white">
                      {getInitials(product.seller.name)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div>
                  <div className="flex items-center gap-1">
                    <Link href={`/profile/${product.seller.id}`} className="hover:underline">
                      <span className="font-medium text-zinc-200">{product.seller.name}</span>
                    </Link>
                    {product.seller.verified && <CheckCircle className="h-4 w-4 fill-indigo-500 text-white" />}
                  </div>
                  <div className="text-xs text-zinc-500">{product.seller.handle}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-zinc-800/70 px-3 py-1 text-sm font-medium text-white">
                  {product.assetType}
                </div>
                <div className="rounded-full bg-zinc-800/70 px-3 py-1 text-sm font-medium text-zinc-400">
                  {product.category}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main content area */}
              <div className="lg:col-span-2">
                <h1 className="mb-3 text-2xl font-bold md:text-3xl">{product.title}</h1>
                <p className="mb-6 text-zinc-400">{product.description}</p>

                <div className="mb-6">
                  <h2 className="mb-4 text-xl font-semibold">About This Product</h2>
                  <div className="text-zinc-300 leading-relaxed text-base whitespace-pre-wrap break-words">
                    {product.longDescription?.split('\n').map((paragraph, index) => (
                      <p key={index} className={index !== 0 ? "mt-4" : ""}>
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Auction log for auction products - displayed directly below description */}
                {product.isAuction === true && (
                  <div className="mt-6">
                    <h2 className="mb-4 text-xl font-semibold">Auction Activity</h2>
                    <AuctionLog auctionLog={product.auctionLog} />
                  </div>
                )}

                {/* Add AuctionCompletion component */}
                {product.isAuction === true && product.isComplete && (
                  <AuctionCompletion listingId={product.id} />
                )}
              </div>

              {/* Right sidebar */}
              <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                {/* Price/Bid card */}
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-5 backdrop-blur-sm shadow-lg">
                  <div className="mb-4 flex items-end justify-between">
                    {product.isAuction === true ? (
                      <>
                        <div>
                          <div className="text-sm text-zinc-500">Starting Price</div>
                          <div className="text-lg font-bold">${typeof product.startingBid === 'number' ? product.startingBid.toFixed(2) : '0.00'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-zinc-500">Current Bid</div>
                          <div className="text-2xl font-bold text-emerald-400">${typeof product.currentBid === 'number' ? product.currentBid.toFixed(2) : '0.00'}</div>
                        </div>
                      </>
                    ) : (
                      <div>
                        <div className="text-sm text-zinc-500">Price</div>
                        <div className="text-2xl font-bold">${typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}</div>
                      </div>
                    )}
                  </div>

                  {product.isAuction ? (
                    <div className="space-y-3">
                      {!product.isComplete && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Enter bid amount"
                            className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            value={bidAmount}
                            onChange={(e) => setBidAmount(parseFloat(e.target.value) || "")}
                            step="0.01"
                            min={(typeof product.currentBid === 'number' ? product.currentBid + 0.01 : 0.01).toFixed(2)}
                          />
                          <button
                            onClick={handleBid}
                            className="rounded-md bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 font-medium text-white hover:from-emerald-600 hover:to-teal-600"
                          >
                            Bid
                          </button>
                        </div>
                      )}
                      {error && <div className="text-red-500 text-sm">{error}</div>}
                      {success && <div className="text-green-500 text-sm">{success}</div>}
                      <div className="text-sm text-zinc-500">
                        Auction <AuctionTimer 
                          expiresAt={product.expiresAt}
                          listingId={product.id}
                          isComplete={product.isComplete}
                          className="text-white font-medium"
                          onStatusChange={handleAuctionStatusChange}
                        />
                      </div>
                    </div>
                  ) : (
                    <Button
                      className="w-full bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 font-medium text-white hover:from-violet-600 hover:to-indigo-600"
                      onClick={() => {
                        const currentUser = auth.currentUser;
                        if (!currentUser) {
                          toast.error('You must be logged in to contact the seller');
                          router.push('/auth/signin');
                          return;
                        }
                        
                        if (currentUser.uid === product.seller.id) {
                          toast.error("You can't message yourself");
                          return;
                        }
                        
                        const conversationId = [currentUser.uid, product.seller.id].sort().join('_');
                        router.push(`/messages?conversation=${conversationId}`);
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Seller
                    </Button>
                  )}
                </div>

                {/* Seller info card */}
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-5 backdrop-blur-sm shadow-lg">
                  <h3 className="mb-4 font-semibold">About Seller</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Member since:</span>
                      <span className="text-zinc-300">{product.seller.joinDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Sales:</span>
                      <span 
                        className="text-zinc-300 flex items-center"
                        title={product.seller.sales > 0 ? 
                          `This seller has successfully completed ${product.seller.sales} ${product.seller.sales === 1 ? 'transaction' : 'transactions'}`
                          : 'This seller has not completed any sales yet'}
                      >
                        <ShoppingBag className="h-3.5 w-3.5 mr-1 text-zinc-400" />
                        {product.seller.sales > 0 ? 
                          `${product.seller.sales} successful ${product.seller.sales === 1 ? 'sale' : 'sales'}` : 
                          'No sales yet'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500">Rating:</span>
                      <div className="flex items-center gap-1">
                        <StarRating rating={product.seller.rating} maxRating={5} size="sm" showValue={true} />
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2">
                    <Link href={`/profile/${product.seller.id}`}>
                      <button className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 font-medium text-white hover:bg-zinc-700 transition-colors">
                        View Profile
                      </button>
                    </Link>
                    {auth.currentUser?.uid !== product.seller.id && (
                      <MessageButton
                        recipientId={product.seller.id}
                        recipientName={product.seller.name}
                        variant="outline"
                        className="w-full border-zinc-700 text-white hover:bg-zinc-700"
                      />
                    )}
                  </div>
                </div>

                {/* Share button */}
                <button className="w-full flex justify-center items-center gap-2 rounded-md border border-zinc-800 bg-zinc-800/30 px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 transition-colors">
                  <Share2 className="h-4 w-4" />
                  Share this product
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AnimatedBackground>
  )
}

