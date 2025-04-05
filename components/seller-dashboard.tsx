"use client"

import { useState } from "react"
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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

// Mock data for the dashboard
const statsData = [
  {
    title: "Total Revenue",
    value: "$3,850.00",
    change: "+12.5%",
    isPositive: true,
    icon: DollarSign,
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Total Sales",
    value: "24",
    subtext: "Products Sold",
    change: "+8",
    isPositive: true,
    icon: ShoppingBag,
    color: "from-blue-500 to-indigo-500",
  },
  {
    title: "Active Listings",
    value: "8",
    subtext: "Live Listings",
    change: "-2",
    isPositive: false,
    icon: Tag,
    color: "from-violet-500 to-purple-500",
  },
  {
    title: "Pending Review",
    value: "3",
    subtext: "Awaiting Approval",
    change: "+3",
    isPositive: true,
    icon: Clock,
    color: "from-amber-500 to-orange-500",
  },
]

const listingsData = [
  {
    id: "1",
    handle: "@luxuryhandle",
    type: "Username",
    platform: "Instagram",
    price: 99,
    isAuction: false,
    status: "active",
    views: 320,
    lastUpdate: "2 hours ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "2",
    handle: "@oldigpage",
    type: "Account",
    platform: "Instagram",
    price: 120,
    isAuction: true,
    currentBid: 135,
    status: "active",
    views: 87,
    lastUpdate: "10 mins ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "3",
    handle: "@gamertag_pro",
    type: "Username",
    platform: "Xbox",
    price: 75,
    isAuction: false,
    status: "sold",
    views: 142,
    lastUpdate: "2 days ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "4",
    handle: "@cryptotrader",
    type: "Account",
    platform: "Twitter",
    price: 250,
    isAuction: true,
    currentBid: 275,
    status: "active",
    views: 215,
    lastUpdate: "1 hour ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "5",
    handle: "@travelgram",
    type: "Username",
    platform: "Instagram",
    price: 180,
    isAuction: false,
    status: "pending",
    views: 0,
    lastUpdate: "1 day ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "6",
    handle: "@fitnessguru",
    type: "Account",
    platform: "TikTok",
    price: 320,
    isAuction: false,
    status: "pending",
    views: 0,
    lastUpdate: "5 hours ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "7",
    handle: "@techreview",
    type: "Username",
    platform: "YouTube",
    price: 150,
    isAuction: false,
    status: "draft",
    views: 0,
    lastUpdate: "3 days ago",
    image: "/placeholder.svg?height=100&width=100",
  },
  {
    id: "8",
    handle: "@foodie",
    type: "Username",
    platform: "Twitter",
    price: 85,
    isAuction: false,
    status: "sold",
    views: 178,
    lastUpdate: "1 week ago",
    image: "/placeholder.svg?height=100&width=100",
  },
]

const payoutData = {
  totalEarned: 3850,
  pendingWithdrawal: 1250,
  withdrawnTotal: 2600,
  recentPayouts: [
    {
      id: "p1",
      amount: 850,
      date: "2023-03-15",
      status: "completed",
    },
    {
      id: "p2",
      amount: 1200,
      date: "2023-02-28",
      status: "completed",
    },
    {
      id: "p3",
      amount: 550,
      date: "2023-01-20",
      status: "completed",
    },
  ],
}

export function SellerDashboard() {
  const [activeTab, setActiveTab] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // Filter listings based on active tab and search query
  const filteredListings = listingsData.filter((listing) => {
    // Filter by tab
    if (activeTab !== "all" && listing.status !== activeTab) {
      return false
    }

    // Filter by search query
    if (searchQuery && !listing.handle.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false
    }

    return true
  })

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-4 min-w-max">
          {statsData.map((stat, index) => (
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
                <TabsTrigger value="pending" className="rounded-md px-3 py-1 text-sm data-[state=active]:bg-violet-600">
                  Pending
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
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Price</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Views</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Last Update</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredListings.length > 0 ? (
                      filteredListings.map((listing) => (
                        <tr key={listing.id} className="border-b border-zinc-800/50">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 rounded-md border border-zinc-800">
                                <AvatarImage src={listing.image} alt={listing.handle} />
                                <AvatarFallback className="rounded-md bg-zinc-800 text-xs">
                                  {listing.platform.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{listing.handle}</div>
                                <div className="text-xs text-zinc-500">{listing.platform}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm">{listing.type}</td>
                          <td className="px-4 py-3">
                            {listing.isAuction ? (
                              <div>
                                <div className="text-sm font-medium">${listing.currentBid}</div>
                                <div className="text-xs text-zinc-500">Starting: ${listing.price}</div>
                              </div>
                            ) : (
                              <div className="text-sm font-medium">${listing.price}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={listing.status} isAuction={listing.isAuction} />
                          </td>
                          <td className="px-4 py-3 text-sm">{listing.views}</td>
                          <td className="px-4 py-3 text-sm text-zinc-400">{listing.lastUpdate}</td>
                          <td className="px-4 py-3">
                            <ListingActions listing={listing} />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
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
                          <Avatar className="h-10 w-10 rounded-md border border-zinc-800">
                            <AvatarImage src={listing.image} alt={listing.handle} />
                            <AvatarFallback className="rounded-md bg-zinc-800 text-xs">
                              {listing.platform.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{listing.handle}</div>
                            <div className="text-xs text-zinc-500">
                              {listing.platform} • {listing.type}
                            </div>
                          </div>
                        </div>
                        <StatusBadge status={listing.status} isAuction={listing.isAuction} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                        <div>
                          <div className="text-zinc-500">Price</div>
                          <div className="font-medium">
                            {listing.isAuction ? `$${listing.currentBid} (Bid)` : `$${listing.price}`}
                          </div>
                        </div>
                        <div>
                          <div className="text-zinc-500">Views</div>
                          <div>{listing.views}</div>
                        </div>
                        <div>
                          <div className="text-zinc-500">Last Update</div>
                          <div>{listing.lastUpdate}</div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        {listing.status === "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            View
                          </Button>
                        )}
                        {(listing.status === "active" ||
                          listing.status === "draft" ||
                          listing.status === "pending") && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
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

      {/* Payouts / Earnings Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-zinc-800/50 px-6 py-4">
            <h3 className="font-medium">Earnings Summary</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-6">
              <div className="rounded-lg bg-zinc-800/30 p-4">
                <div className="text-sm text-zinc-400">Total Earned</div>
                <div className="text-2xl font-bold">${payoutData.totalEarned.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-zinc-800/30 p-4">
                <div className="text-sm text-zinc-400">Pending Withdrawal</div>
                <div className="text-2xl font-bold">${payoutData.pendingWithdrawal.toFixed(2)}</div>
              </div>
              <div className="rounded-lg bg-zinc-800/30 p-4">
                <div className="text-sm text-zinc-400">Withdrawn Total</div>
                <div className="text-2xl font-bold">${payoutData.withdrawnTotal.toFixed(2)}</div>
              </div>
            </div>

            <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Request Withdrawal</Button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm overflow-hidden">
          <div className="border-b border-zinc-800/50 px-6 py-4">
            <h3 className="font-medium">Recent Payouts</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {payoutData.recentPayouts.map((payout) => (
                <div key={payout.id} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">${payout.amount.toFixed(2)}</div>
                    <div className="text-sm text-zinc-500">{formatDate(payout.date)}</div>
                  </div>
                  <div className="text-xs rounded-full bg-green-500/10 px-2 py-1 text-green-500">Completed</div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full mt-4 border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
            >
              View All Transactions
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ stat }) {
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

      {stat.change && (
        <div className="mt-3 flex items-center text-xs">
          <span className={stat.isPositive ? "text-green-500" : "text-red-500"}>{stat.change}</span>
          <span className="ml-1 text-zinc-500">from last month</span>
        </div>
      )}
    </motion.div>
  )
}

function StatusBadge({ status, isAuction }) {
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
    case "pending":
      bgColor = "bg-amber-500/10"
      textColor = "text-amber-500"
      label = "Pending Review"
      break
    case "draft":
      bgColor = "bg-zinc-500/10"
      textColor = "text-zinc-400"
      label = "Draft"
      break
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${bgColor} ${textColor}`}>
      {status === "pending" && <AlertTriangle className="mr-1 h-3 w-3" />}
      {label}
    </span>
  )
}

function ListingActions({ listing }) {
  return (
    <div className="flex items-center gap-1">
      {listing.status === "active" && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="View Listing">
          <Eye className="h-4 w-4" />
        </Button>
      )}

      {(listing.status === "active" || listing.status === "draft" || listing.status === "pending") && (
        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white" title="Edit Listing">
          <Edit className="h-4 w-4" />
        </Button>
      )}

      <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-red-500" title="Remove Listing">
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
            <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
              <span>Promote</span>
            </DropdownMenuItem>
          )}
          {listing.status === "draft" && (
            <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 hover:text-white">
              <ArrowUpRight className="h-4 w-4" />
              <span>Publish</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 hover:text-white">
            <Filter className="h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// Helper function to format date
function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" }
  return new Date(dateString).toLocaleDateString(undefined, options)
}

