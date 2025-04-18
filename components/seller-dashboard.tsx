"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  DollarSign,
  ShoppingBag,
  Tag,
  Clock,
  Plus,
  Search,
  ChevronDown,
  Edit,
  Trash,
  Eye,
  AlertTriangle,
  ArrowUpRight,
  Filter,
  Loader,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { auth, db } from "@/lib/firebaseConfig"
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc,
  deleteDoc,
  updateDoc, 
  orderBy,
  Timestamp,
  onSnapshot,
  Unsubscribe
} from "firebase/firestore"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"

// Define TypeScript interfaces for our data
interface Listing {
  id: string
  title: string
  type: string
  category: string
  platform?: string
  assetType?: string
  price: number
  isAuction?: boolean
  currentBid?: number
  status: string
  image?: string
  createdAt: Timestamp
  sellerId: string
}

interface Stats {
  title: string
  value: string
  subtext?: string
  change?: string
  isPositive: boolean
  icon: any
  color: string
}

// Helper function to get avatar color based on title
function getAvatarColor(title: string) {
  if (!title || title.length === 0) return "bg-zinc-800 text-zinc-300";
  
  // Use the character code to determine a color
  const charCode = title.charCodeAt(0) % 8;
  
  switch(charCode) {
    case 0: return "bg-gradient-to-br from-violet-600 to-indigo-800 text-white";
    case 1: return "bg-gradient-to-br from-blue-600 to-cyan-800 text-white";
    case 2: return "bg-gradient-to-br from-emerald-600 to-teal-800 text-white";
    case 3: return "bg-gradient-to-br from-amber-500 to-orange-700 text-white";
    case 4: return "bg-gradient-to-br from-pink-600 to-rose-800 text-white";
    case 5: return "bg-gradient-to-br from-indigo-600 to-purple-800 text-white";
    case 6: return "bg-gradient-to-br from-teal-600 to-emerald-800 text-white";
    case 7: return "bg-gradient-to-br from-red-600 to-rose-800 text-white";
    default: return "bg-gradient-to-br from-violet-600 to-indigo-800 text-white";
  }
}

export function SellerDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<Stats[]>([
  {
    title: "Total Revenue",
      value: "$0.00",
      change: "0%",
    isPositive: true,
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Total Sales",
      value: "0",
    subtext: "Products Sold",
      change: "0",
    isPositive: true,
    icon: ShoppingBag,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Active Listings",
      value: "0",
    subtext: "Live Listings",
      change: "0",
      isPositive: true,
    icon: Tag,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Draft Listings",
      value: "0",
    subtext: "Not Yet Published",
      change: "0",
    isPositive: true,
    icon: Clock,
    color: "from-amber-500 to-orange-500",
  },
  ])

  // Fetch user listings
  useEffect(() => {
    function fetchListings(): Unsubscribe | undefined {
      // Add a check for auth loading state
      if (auth.currentUser === null && !auth.currentUser) {
        // Only redirect if we're sure auth is fully loaded and user is null
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
          if (!user) {
            router.push("/login");
          }
          // Cleanup this listener once we've checked
          unsubscribeAuth();
        });
        return;
      }

      try {
        setIsLoading(true);
        const userId = auth.currentUser?.uid;
        
        // Only proceed if we have a valid user ID
        if (!userId) {
          setIsLoading(false);
          return;
        }

        // Create a Firestore query for the user's listings
        const listingsRef = collection(db, "listings");
        const q = query(listingsRef, where("sellerId", "==", userId));
        
        // Use onSnapshot instead of getDocs for real-time updates
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
          const listingsData: Listing[] = []
          let activeCount = 0
          let soldCount = 0
          let draftCount = 0
          let totalRev = 0

          querySnapshot.forEach((doc) => {
            const data = doc.data()
            console.log("Listing data:", data)
            
            // More robust check for auction status
            // An item is an auction if:
            // 1. It has isAuction = true explicitly, OR
            // 2. It has a currentBid value and the flag is missing
            const isAuction = data.isAuction === true || (data.isAuction !== false && data.currentBid !== undefined);
            
            const listing: Listing = {
              id: doc.id,
              title: data.title || "Untitled Listing",
              type: data.category || "Other",
              category: data.category || "Other",
              platform: data.platform || "",
              assetType: data.assetType || "username",
              price: data.price || 0,
              isAuction: isAuction,
              currentBid: data.currentBid,
              status: data.status || "draft",
              image: data.image || "/placeholder.svg?height=100&width=100",
              createdAt: data.createdAt,
              sellerId: data.sellerId
            }
            
            listingsData.push(listing)
            
            // Count by status
            if (listing.status === "active") activeCount++
            else if (listing.status === "sold") {
              soldCount++
              console.log("Found sold item:", listing.title)
              console.log("isAuction:", isAuction, "currentBid:", data.currentBid, "price:", data.price)
              
              // Calculate revenue based on the type of listing
              let revenue = 0;
              
              // If it has a currentBid and it's an auction, use that value
              if (isAuction && data.currentBid !== undefined) {
                revenue = parseFloat(data.currentBid.toString() || "0");
                console.log(`Using auction bid amount: ${revenue}`);
              } else {
                revenue = parseFloat(data.price?.toString() || "0");
                console.log(`Using regular price amount: ${revenue}`);
              }
              
              totalRev += revenue;
              console.log("Running total revenue:", totalRev)
            }
            else if (listing.status === "draft") draftCount++
          })

          // Update state with the new data
          setListings(listingsData)
          
          // Update stats
          setStats([
            {
              title: "Total Revenue",
              value: `$${totalRev.toFixed(2)}`,
              change: "+0%", // You would calculate this from historical data
              subtext: "Total Revenue Earned ",
              isPositive: true,
              icon: DollarSign,
              color: "from-emerald-500 to-teal-500",
            },
            {
              title: "Total Sales",
              value: soldCount.toString(),
              subtext: "Products Sold",
              change: "+0", // You would calculate this from historical data
              isPositive: true,
              icon: ShoppingBag,
              color: "from-blue-500 to-indigo-500",
            },
            {
              title: "Active Listings",
              value: activeCount.toString(),
              subtext: "Live Listings",
              change: "+0", // You would calculate this from historical data
              isPositive: true,
              icon: Tag,
              color: "from-violet-500 to-purple-500",
            },
            {
              title: "Draft Listings",
              value: draftCount.toString(),
              subtext: "Not Yet Published",
              change: "+0", // You would calculate this from historical data
              isPositive: true,
              icon: Clock,
              color: "from-amber-500 to-orange-500",
            },
          ])
          
          setIsLoading(false)
        }, (error) => {
          console.error("Error in listings listener:", error)
          toast.error("Failed to load real-time dashboard updates")
          setIsLoading(false)
        })
        
        // Return the unsubscribe function
        return unsubscribe
      } catch (error) {
        console.error("Error setting up listings listener:", error)
        toast.error("Failed to load dashboard data")
        setIsLoading(false)
        return undefined
      }
    }
    
    // Initialize the auth state listener that will fetch listings once ready
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        const unsubscribeFirestore = fetchListings()
        
        // Return cleanup function to unsubscribe both listeners
        return () => {
          if (unsubscribeFirestore) {
            unsubscribeFirestore()
          }
        }
      } else {
        router.push("/login")
      }
    })
    
    // Clean up the auth state listener
    return () => unsubscribeAuth()
  }, [router])
  
  // Filter listings when activeTab or searchQuery changes
  useEffect(() => {
    if (!listings) return
    
    const filtered = listings.filter((listing) => {
    // Filter by tab
    if (activeTab !== "all" && listing.status !== activeTab) {
      return false
    }

      // Filter by search query (search in title and category)
      if (searchQuery && 
         !listing.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
         !listing.category.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })
    
    setFilteredListings(filtered)
  }, [listings, activeTab, searchQuery])

  // Handle listing deletion
  const handleDeleteListing = async (listingId: string) => {
    try {
      if (confirm("Are you sure you want to delete this listing?")) {
        await deleteDoc(doc(db, "listings", listingId))
        toast.success("Listing deleted successfully")
        
        // Update listings state
        setListings(listings.filter(listing => listing.id !== listingId))
      }
    } catch (error) {
      console.error("Error deleting listing:", error)
      toast.error("Failed to delete listing")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-violet-500" />
        <span className="ml-2 text-zinc-400">Loading dashboard data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {stats.map((stat, index) => (
            <StatCard key={index} stat={stat} />
          ))}
        </div>
      </div>

      {/* Listings Manager */}
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold">Listings Manager</h2>

          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
              <Input
                placeholder="Search listings..."
                className="pl-9 border-zinc-700 bg-zinc-800/50 text-white w-full sm:w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Link href="/sell">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                New Listing
              </Button>
            </Link>
          </div>
        </div>

        {/* Listings Tabs and Table */}
        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
          <Tabs defaultValue="all" onValueChange={setActiveTab}>
            <div className="border-b border-zinc-800/50 px-4 pt-4">
              <TabsList className="bg-zinc-800/30 w-auto inline-flex h-9 gap-1">
                <TabsTrigger value="all" className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-violet-600">
                  All Listings
                </TabsTrigger>
                <TabsTrigger value="active" className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-violet-600">
                  Active
                </TabsTrigger>
                <TabsTrigger value="sold" className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-violet-600">
                  Sold
                </TabsTrigger>
                <TabsTrigger value="draft" className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-violet-600">
                  Drafts
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeTab} className="mt-0">
              {/* Desktop Table */}
              <div className="hidden md:block">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Product</th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                        Platform
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                        Asset Type
                      </th>
                      <th className="whitespace-nowrap px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500">
                        Price
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.length > 0 ? (
                      filteredListings.map((listing) => (
                        <tr key={listing.id} className="border-b border-zinc-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-md flex items-center justify-center overflow-hidden shadow-md">
                                <div className={`w-full h-full ${getAvatarColor(listing.title)} flex items-center justify-center transition-transform duration-200 hover:scale-110`}>
                                  <span className="font-bold">{listing.title.charAt(0).toUpperCase()}</span>
                                </div>
                              </div>
                              <div>
                                <div className="font-medium">{listing.title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{listing.type}</td>
                          <td className="px-4 py-3 text-sm">{listing.assetType || "username"}</td>
                          <td className="px-4 py-3">
                            {listing.isAuction ? (
                              <div>
                                <div className="text-sm font-medium">${listing.currentBid?.toFixed(2)}</div>
                                <div className="text-xs text-zinc-500">Starting: ${listing.price.toFixed(2)}</div>
                              </div>
                            ) : (
                              <div className="text-sm font-medium">${listing.price.toFixed(2)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={listing.status} isAuction={listing.isAuction} />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              {listing.status === "active" && (
                                <Link href={`/product/${listing.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="View Listing">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}

                              {(listing.status === "active" || listing.status === "draft") && (
                                <Link href={`/edit-listing/${listing.id}`}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="Edit Listing">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </Link>
                              )}

                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-zinc-400 hover:text-red-500" 
                                title="Remove Listing"
                                onClick={() => handleDeleteListing(listing.id)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 bg-zinc-900 text-white">
                                  {listing.status === "active" && (
                                    <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer" onClick={() => router.push(`/promote/${listing.id}`)}>
                                      <ArrowUpRight className="h-4 w-4" />
                                      <span>Promote</span>
                                    </DropdownMenuItem>
                                  )}
                                  {listing.status === "draft" && (
                                    <DropdownMenuItem 
                                      className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
                                      onClick={async () => {
                                        try {
                                          await updateDoc(doc(db, "listings", listing.id), { status: "active" })
                                          toast.success("Listing published successfully")
                                          // Update listings
                                          setListings(listings.map(item => 
                                            item.id === listing.id ? {...item, status: "active"} : item
                                          ))
                                        } catch (error) {
                                          toast.error("Failed to publish listing")
                                        }
                                      }}
                                    >
                                      <ArrowUpRight className="h-4 w-4" />
                                      <span>Publish</span>
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer"
                                    onClick={() => router.push(`/duplicate/${listing.id}`)}
                                  >
                                    <Filter className="h-4 w-4" />
                                    <span>Duplicate</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-400">
                          No listings found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {filteredListings.length > 0 ? (
                  filteredListings.map((listing) => (
                    <div key={listing.id} className="rounded-lg border border-zinc-800/50 bg-zinc-800/30 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-md flex items-center justify-center overflow-hidden shadow-md">
                            <div className={`w-full h-full ${getAvatarColor(listing.title)} flex items-center justify-center transition-transform duration-200 hover:scale-110`}>
                              <span className="font-bold">{listing.title.charAt(0).toUpperCase()}</span>
                            </div>
                          </div>
                          <div>
                            <div className="font-medium">{listing.title}</div>
                            <div className="text-xs text-zinc-500">
                             {listing.type} • {listing.assetType || "username"}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={listing.status} isAuction={listing.isAuction} />
                      </div>

                      <div className="grid grid-cols-1 gap-2 mb-3 text-sm">
                        <div>
                          <div className="text-zinc-500">Price</div>
                          <div className="font-medium">
                            {listing.isAuction ? `$${listing.currentBid?.toFixed(2)} (Bid)` : `$${listing.price.toFixed(2)}`}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        {listing.status === "active" && (
                          <Link href={`/product/${listing.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                          </Link>
                        )}
                        {(listing.status === "active" ||
                          listing.status === "draft") && (
                          <Link href={`/edit-listing/${listing.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                          </Link>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                          onClick={() => handleDeleteListing(listing.id)}
                        >
                          <Trash className="mr-1 h-3 w-3" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-zinc-400">No listings found</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

    </div>
  )
}

function StatCard({ stat }: { stat: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full min-w-[240px] max-w-xs rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-5 backdrop-blur-sm"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-zinc-400">{stat.title}</div>
          <div className="mt-1 text-2xl font-bold">{stat.value}</div>
          {stat.subtext && <div className="text-xs text-zinc-500">{stat.subtext}</div>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${stat.color} bg-opacity-20`}
        >
          <stat.icon className="h-5 w-5 text-white" />
        </div>
      </div>


    </motion.div>
  )
}

function StatusBadge({ status, isAuction }: { status: string, isAuction: boolean | undefined }) {
  let bgColor = "bg-zinc-500/10"
  let textColor = "text-zinc-400"
  let label = "Unknown"

  switch (status) {
    case "active":
      bgColor = isAuction ? "bg-amber-500/10" : "bg-green-500/10"
      textColor = isAuction ? "text-amber-500" : "text-green-500"
      label = isAuction ? "Auction Live" : "For Sale"
      break
    case "sold":
      bgColor = "bg-blue-500/10"
      textColor = "text-blue-500"
      label = "Sold"
      break
    case "draft":
      bgColor = "bg-zinc-500/10"
      textColor = "text-zinc-400"
      label = "Draft"
      break
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bgColor} ${textColor}`}>
      {status === "draft" && <AlertTriangle className="mr-1 h-3 w-3" />}
      {label}
    </span>
  )
}

// Helper function to format date
function formatDate(dateString: string) {
  const options: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

