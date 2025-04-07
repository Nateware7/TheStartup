"use client";

import Link from "next/link"
import { ArrowLeft, CheckCircle, Share2 } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AnimatedBackground } from "@/components/animated-background"
import { AuctionLog } from "@/components/auction-log"
import { useState, useEffect } from "react"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { db } from "@/lib/firebaseConfig"
import { usePathname } from "next/navigation"

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
  createdAt: any; // Use appropriate type for Timestamp
  status: "active" | "sold";
  bid?: number;
  auctionLog?: Array<{ username: string; amount: number; timestamp: string; isLeading?: boolean }>;
}

export default function ProductPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Get the product ID from the pathname instead of params
  const pathname = usePathname();
  const productId = pathname ? pathname.split('/').pop() : '';

  useEffect(() => {
    let isMounted = true;
    
    async function fetchProduct() {
      if (!productId) return;
      
      try {
        const docRef = doc(db, "listings", productId);
        const docSnap = await getDoc(docRef);
        
        if (!isMounted) return;
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({
            id: docSnap.id,
            title: data.title || "",
            description: data.description || "",
            longDescription: data.longDescription || "",
            startingBid: data.startingBid || 0,
            currentBid: data.currentBid || 0,
            price: data.price || 0,
            category: data.category || "",
            seller: {
              id: data.sellerId || "",
              name: data.seller?.name || "",
              handle: data.seller?.handle || "",
              avatar: data.seller?.avatar || "",
              verified: data.seller?.verified || false,
              joinDate: data.seller?.joinDate || "",
              sales: data.seller?.sales || 0,
              rating: data.seller?.rating || 0,
            },
            createdAt: data.createdAt || new Date(),
            status: data.status || "active",
            bid: data.bid,
            auctionLog: data.auctionLog || [],
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    
    fetchProduct();
    
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleBid = async () => {
    if (!product) return;
    if (typeof bidAmount !== "number" || bidAmount <= product.currentBid) {
      setError("Bid must be higher than the current bid.");
      return;
    }

    try {
      const productRef = doc(db, "listings", product.id);
      await updateDoc(productRef, { currentBid: bidAmount });
      setProduct((prev) => prev && { ...prev, currentBid: bidAmount });
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

  // Determine if this is an auction product
  const isAuction = product.startingBid !== undefined && product.currentBid !== undefined;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .toUpperCase();
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
                <Avatar className="h-10 w-10 border border-zinc-800">
                  <AvatarImage src={product.seller.avatar} alt={product.seller.name} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-xs text-white">
                    {getInitials(product.seller.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-zinc-200">{product.seller.name}</span>
                    {product.seller.verified && <CheckCircle className="h-4 w-4 fill-indigo-500 text-white" />}
                  </div>
                  <div className="text-xs text-zinc-500">{product.seller.handle}</div>
                </div>
              </div>
              <div className="rounded-full bg-zinc-800/70 px-3 py-1 text-sm font-medium text-zinc-400">
                {product.category}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Main content area */}
              <div className="lg:col-span-2">
                <h1 className="mb-3 text-2xl font-bold md:text-3xl">{product.title}</h1>
                <p className="mb-6 text-zinc-400">{product.description}</p>

                <div className="mb-6">
                  <h2 className="mb-4 text-xl font-semibold">About This Product</h2>
                  <p className="text-zinc-300 leading-relaxed text-base">{product.longDescription}</p>
                </div>

                {/* Auction log for auction products - displayed directly below description */}
                {isAuction && (
                  <div className="mt-6">
                    <h2 className="mb-4 text-xl font-semibold">Auction Activity</h2>
                    <AuctionLog auctionLog={product.auctionLog} />
                  </div>
                )}
              </div>

              {/* Right sidebar */}
              <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                {/* Price/Bid card */}
                <div className="rounded-xl border border-zinc-800/60 bg-zinc-800/20 p-5 backdrop-blur-sm shadow-lg">
                  <div className="mb-4 flex items-end justify-between">
                    {isAuction ? (
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

                  {isAuction ? (
                    <div className="space-y-3">
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
                      {error && <div className="text-red-500 text-sm">{error}</div>}
                      {success && <div className="text-green-500 text-sm">{success}</div>}
                      <div className="text-sm text-zinc-500">
                        Auction ends in <span className="text-white font-medium">2 days 14 hours</span>
                      </div>
                    </div>
                  ) : (
                    <button className="w-full rounded-md bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2 font-medium text-white hover:from-violet-600 hover:to-indigo-600">
                      Buy Now
                    </button>
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
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sales:</span>
                      <span className="text-zinc-300">{product.seller.sales} products</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Rating:</span>
                      <span className="text-zinc-300">{product.seller.rating}/5.0</span>
                    </div>
                  </div>
                  <Link href={`/profile/${product.seller.id}`}>
                    <button className="mt-4 w-full rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 font-medium text-white hover:bg-zinc-700 transition-colors">
                      View Profile
                    </button>
                  </Link>
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

