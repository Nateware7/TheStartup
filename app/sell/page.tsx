"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { auth, db } from '@/lib/firebaseConfig'
import { doc, addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { AnimatedBackground } from '@/components/animated-background'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Loader, Tag, Hammer } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const fixedPriceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(200),
  longDescription: z.string().min(20, "Description must be at least 20 characters").max(1000),
  category: z.string().min(1, "Category is required"),
  assetType: z.string().min(1, "Asset type is required"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  status: z.string()
});

const auctionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(200),
  longDescription: z.string().min(20, "Description must be at least 20 characters").max(1000),
  category: z.string().min(1, "Category is required"),
  assetType: z.string().min(1, "Asset type is required"),
  startingBid: z.coerce.number().min(1, "Starting bid must be at least 1"),
  durationDays: z.coerce.number().min(0),
  durationHours: z.coerce.number().min(0).max(23),
  durationMinutes: z.coerce.number().min(0).max(59),
  status: z.string()
}).refine((data) => {
  const totalMinutes = (data.durationDays * 24 * 60) + (data.durationHours * 60) + data.durationMinutes;
  return totalMinutes > 0;
}, {
  message: "Duration must be greater than zero",
  path: ["durationDays"]
});

type FixedPriceFormData = z.infer<typeof fixedPriceSchema>
type AuctionFormData = z.infer<typeof auctionSchema>

export default function SellPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [formType, setFormType] = useState<'fixed' | 'auction'>('fixed')

  // Fixed price form
  const fixedPriceForm = useForm<FixedPriceFormData>({
    resolver: zodResolver(fixedPriceSchema),
    defaultValues: {
      title: "",
      description: "",
      longDescription: "",
      category: "insta",
      assetType: "username",
      price: 0,
      status: "active"
    }
  })

  // Auction form
  const auctionForm = useForm<AuctionFormData>({
    resolver: zodResolver(auctionSchema),
    defaultValues: {
      title: "",
      description: "",
      longDescription: "",
      category: "insta",
      assetType: "username",
      startingBid: 0,
      durationDays: 0,
      durationHours: 0,
      durationMinutes: 0,
      status: "active"
    }
  })

  // Check authentication state
  useEffect(() => {
    const checkAuth = () => {
      const user = auth.currentUser
      if (!user) {
        toast.error("You must be logged in to sell items")
        router.push('/auth/signin')
        return
      }
      setUserId(user.uid)
    }
    
    checkAuth()
  }, [router])

  const onFixedPriceSubmit = async (data: FixedPriceFormData) => {
    if (!userId) {
      toast.error("You must be logged in to sell items")
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    try {
      const listingData = {
        title: data.title,
        description: data.description,
        longDescription: data.longDescription,
        category: data.category,
        assetType: data.assetType,
        price: data.price,
        sellerId: userId,
        isAuction: false,
        status: data.status,
        createdAt: serverTimestamp()
      }

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, "listings"), listingData)
      
      toast.success("Item listed successfully!")
      router.push(`/product/${docRef.id}`)
    } catch (error) {
      console.error("Error adding listing:", error)
      toast.error("Failed to list item. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const onAuctionSubmit = async (data: AuctionFormData) => {
    if (!userId) {
      toast.error("You must be logged in to sell items")
      router.push('/auth/signin')
      return
    }

    setIsLoading(true)
    try {
      // Calculate expiration date based on duration
      const totalMinutes = (data.durationDays * 24 * 60) + (data.durationHours * 60) + data.durationMinutes
      const expirationDate = new Date()
      expirationDate.setMinutes(expirationDate.getMinutes() + totalMinutes)

      const listingData = {
        title: data.title,
        description: data.description,
        longDescription: data.longDescription,
        category: data.category,
        assetType: data.assetType,
        price: data.startingBid, // Use startingBid as the price
        startingBid: data.startingBid,
        currentBid: data.startingBid, // Initially, current bid equals starting bid
        durationDays: data.durationDays,
        durationHours: data.durationHours,
        durationMinutes: data.durationMinutes,
        durationString: `${data.durationDays}d ${data.durationHours}h ${data.durationMinutes}m`,
        sellerId: userId,
        isAuction: true,
        status: data.status,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expirationDate)
      }

      // Add the document to Firestore
      const docRef = await addDoc(collection(db, "listings"), listingData)
      
      toast.success("Auction listed successfully!")
      router.push(`/product/${docRef.id}`)
    } catch (error) {
      console.error("Error adding auction:", error)
      toast.error("Failed to list auction. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />
        
        <div className="container mx-auto px-4 pt-24 pb-20">
          <div className="max-w-3xl mx-auto">
            <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/60 shadow-xl overflow-hidden">
              <div className="p-6 md:p-8">
                <h1 className="text-2xl font-bold mb-2">List Your Item</h1>
                <p className="text-zinc-400 mb-6">Choose how you want to sell your item.</p>
                
                <Tabs defaultValue="fixed" onValueChange={(value) => setFormType(value as 'fixed' | 'auction')}>
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="fixed" className="flex items-center justify-center gap-2 data-[state=active]:bg-violet-600">
                      <Tag className="h-4 w-4" />
                      <span>Fixed Price</span>
                    </TabsTrigger>
                    <TabsTrigger value="auction" className="flex items-center justify-center gap-2 data-[state=active]:bg-violet-600">
                      <Hammer className="h-4 w-4" />
                      <span>Auction</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  {/* Fixed Price Form */}
                  <TabsContent value="fixed">
                    <form onSubmit={fixedPriceForm.handleSubmit(onFixedPriceSubmit)} className="space-y-6">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-title">Title</Label>
                        <Input
                          id="fixed-title"
                          type="text"
                          placeholder="Enter a catchy title for your item"
                          {...fixedPriceForm.register("title")}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                            fixedPriceForm.formState.errors.title ? "border-red-500" : ""
                          }`}
                        />
                        {fixedPriceForm.formState.errors.title && (
                          <p className="text-sm text-red-500">{fixedPriceForm.formState.errors.title.message}</p>
                        )}
                      </div>
                      
                      {/* Asset Type */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-assetType">Asset Type</Label>
                        <select
                          id="fixed-assetType"
                          {...fixedPriceForm.register("assetType")}
                          className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                        >
                          <option value="username">Username</option>
                          <option value="account">Account</option>
                        </select>
                        {fixedPriceForm.formState.errors.assetType && (
                          <p className="text-sm text-red-500">{fixedPriceForm.formState.errors.assetType.message}</p>
                        )}
                      </div>
                      
                      {/* Category */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-category">Category</Label>
                        <select
                          id="fixed-category"
                          {...fixedPriceForm.register("category")}
                          className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                        >
                          <option value="insta">Instagram</option>
                          <option value="x">X</option>
                          <option value="tiktok">TikTok</option>
                          <option value="telegram">Telegram</option>
                          <option value="discord">Discord</option>
                          <option value="other">Other</option>
                        </select>
                        {fixedPriceForm.formState.errors.category && (
                          <p className="text-sm text-red-500">{fixedPriceForm.formState.errors.category.message}</p>
                        )}
                      </div>
                      
                      {/* Short Description */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-description">Short Description</Label>
                        <Input
                          id="fixed-description"
                          type="text"
                          placeholder="Brief description (shown in listings)"
                          {...fixedPriceForm.register("description")}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                            fixedPriceForm.formState.errors.description ? "border-red-500" : ""
                          }`}
                        />
                        {fixedPriceForm.formState.errors.description && (
                          <p className="text-sm text-red-500">{fixedPriceForm.formState.errors.description.message}</p>
                        )}
                      </div>
                      
                      {/* Long Description */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-longDescription">Full Description</Label>
                        <textarea
                          id="fixed-longDescription"
                          placeholder="Detailed description of your item"
                          {...fixedPriceForm.register("longDescription")}
                          className={`w-full p-3 rounded-md bg-zinc-800/50 border border-zinc-700 focus:border-violet-500 focus:outline-none ${
                            fixedPriceForm.formState.errors.longDescription ? "border-red-500" : ""
                          }`}
                          rows={5}
                        />
                        {fixedPriceForm.formState.errors.longDescription && (
                          <p className="text-sm text-red-500">{fixedPriceForm.formState.errors.longDescription.message}</p>
                        )}
                      </div>
                      
                      {/* Price */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-price">Price ($)</Label>
                        <Input
                          id="fixed-price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Fixed price"
                          {...fixedPriceForm.register("price", { valueAsNumber: true })}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                            fixedPriceForm.formState.errors.price ? "border-red-500" : ""
                          }`}
                        />
                        {fixedPriceForm.formState.errors.price && (
                          <p className="text-sm text-red-500">{fixedPriceForm.formState.errors.price.message}</p>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="fixed-status">Listing Status</Label>
                        <select
                          id="fixed-status"
                          {...fixedPriceForm.register("status")}
                          className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                        >
                          <option value="active">Live - Visible to Everyone</option>
                          <option value="draft">Draft - Only Visible to You</option>
                        </select>
                      </div>
                      
                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                      >
                        {isLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Creating Listing...
                          </>
                        ) : (
                          'List with Fixed Price'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                  
                  {/* Auction Form */}
                  <TabsContent value="auction">
                    <form onSubmit={auctionForm.handleSubmit(onAuctionSubmit)} className="space-y-6">
                      {/* Title */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-title">Title</Label>
                        <Input
                          id="auction-title"
                          type="text"
                          placeholder="Enter a catchy title for your auction"
                          {...auctionForm.register("title")}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                            auctionForm.formState.errors.title ? "border-red-500" : ""
                          }`}
                        />
                        {auctionForm.formState.errors.title && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.title.message}</p>
                        )}
                      </div>
                      
                      {/* Asset Type */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-assetType">Asset Type</Label>
                        <select
                          id="auction-assetType"
                          {...auctionForm.register("assetType")}
                          className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                        >
                          <option value="username">Username</option>
                          <option value="account">Account</option>
                        </select>
                        {auctionForm.formState.errors.assetType && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.assetType.message}</p>
                        )}
                      </div>
                      
                      {/* Category */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-category">Category</Label>
                        <select
                          id="auction-category"
                          {...auctionForm.register("category")}
                          className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                        >
                          <option value="insta">Instagram</option>
                          <option value="x">X</option>
                          <option value="tiktok">TikTok</option>
                          <option value="telegram">Telegram</option>
                          <option value="discord">Discord</option>
                          <option value="other">Other</option>
                        </select>
                        {auctionForm.formState.errors.category && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.category.message}</p>
                        )}
                      </div>
                      
                      {/* Short Description */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-description">Short Description</Label>
                        <Input
                          id="auction-description"
                          type="text"
                          placeholder="Brief description (shown in listings)"
                          {...auctionForm.register("description")}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                            auctionForm.formState.errors.description ? "border-red-500" : ""
                          }`}
                        />
                        {auctionForm.formState.errors.description && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.description.message}</p>
                        )}
                      </div>
                      
                      {/* Long Description */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-longDescription">Full Description</Label>
                        <textarea
                          id="auction-longDescription"
                          placeholder="Detailed description of your item"
                          {...auctionForm.register("longDescription")}
                          className={`w-full p-3 rounded-md bg-zinc-800/50 border border-zinc-700 focus:border-violet-500 focus:outline-none ${
                            auctionForm.formState.errors.longDescription ? "border-red-500" : ""
                          }`}
                          rows={5}
                        />
                        {auctionForm.formState.errors.longDescription && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.longDescription.message}</p>
                        )}
                      </div>
                      
                      {/* Starting Bid */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-startingBid">Starting Bid ($)</Label>
                        <Input
                          id="auction-startingBid"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Starting bid amount"
                          {...auctionForm.register("startingBid", { valueAsNumber: true })}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                            auctionForm.formState.errors.startingBid ? "border-red-500" : ""
                          }`}
                        />
                        {auctionForm.formState.errors.startingBid && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.startingBid.message}</p>
                        )}
                      </div>
                      
                      {/* Duration */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-duration">Auction Duration</Label>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="auction-durationDays"
                                type="number"
                                min="0"
                                placeholder="0"
                                {...auctionForm.register("durationDays", { valueAsNumber: true })}
                                className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${
                                  auctionForm.formState.errors.durationDays ? "border-red-500" : ""
                                }`}
                              />
                              <Label htmlFor="auction-durationDays" className="whitespace-nowrap">Days</Label>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="auction-durationHours"
                                type="number"
                                min="0"
                                max="23"
                                placeholder="0"
                                {...auctionForm.register("durationHours", { valueAsNumber: true })}
                                className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500"
                              />
                              <Label htmlFor="auction-durationHours" className="whitespace-nowrap">Hours</Label>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <Input
                                id="auction-durationMinutes"
                                type="number"
                                min="0"
                                max="59"
                                placeholder="0"
                                {...auctionForm.register("durationMinutes", { valueAsNumber: true })}
                                className="bg-zinc-800/50 border-zinc-700 focus:border-violet-500"
                              />
                              <Label htmlFor="auction-durationMinutes" className="whitespace-nowrap">Min</Label>
                            </div>
                          </div>
                        </div>
                        {auctionForm.formState.errors.durationDays && (
                          <p className="text-sm text-red-500">{auctionForm.formState.errors.durationDays.message}</p>
                        )}
                      </div>
                      
                      {/* Status */}
                      <div className="space-y-2">
                        <Label htmlFor="auction-status">Listing Status</Label>
                        <select
                          id="auction-status"
                          {...auctionForm.register("status")}
                          className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                        >
                          <option value="active">Live - Visible to Everyone</option>
                          <option value="draft">Draft - Only Visible to You</option>
                        </select>
                      </div>
                      
                      {/* Submit Button */}
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600"
                      >
                        {isLoading ? (
                          <>
                            <Loader className="mr-2 h-4 w-4 animate-spin" />
                            Creating Auction...
                          </>
                        ) : (
                          'List as Auction'
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  )
}

