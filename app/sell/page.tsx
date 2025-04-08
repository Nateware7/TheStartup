"use client"

import React, { useState, useEffect } from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { auth, db } from '@/lib/firebaseConfig'
import { doc, addDoc, collection, serverTimestamp } from 'firebase/firestore'
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
import { Loader } from 'lucide-react'

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(200),
  longDescription: z.string().min(20, "Description must be at least 20 characters").max(1000),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(1, "Price must be at least 1"),
  isAuction: z.boolean(),
  startingBid: z.coerce.number().optional(),
  currentBid: z.coerce.number().optional(),
  status: z.string()
})

type FormData = z.infer<typeof formSchema>

export default function SellPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isAuction, setIsAuction] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      longDescription: "",
      category: "insta", // Default category
      price: 0,
      isAuction: false,
      startingBid: 0,
      currentBid: 0,
      status: "active"
    }
  })

  const watchIsAuction = watch("isAuction")

  // Set isAuction state when the checkbox changes
  useEffect(() => {
    setIsAuction(watchIsAuction)
  }, [watchIsAuction])

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

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
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
        price: data.price,
        sellerId: userId,
        status: data.status,
        createdAt: serverTimestamp()
      }

      // Add auction-specific fields if it's an auction
      if (data.isAuction) {
        Object.assign(listingData, {
          startingBid: data.startingBid,
          currentBid: data.startingBid, // Initially, current bid equals starting bid
        })
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

  const handleToggleAuction = (checked: boolean) => {
    setValue("isAuction", checked)
    if (!checked) {
      setValue("startingBid", 0)
      setValue("currentBid", 0)
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
                <p className="text-zinc-400 mb-6">Fill out the form below to list your item for sale or auction.</p>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      type="text"
                      placeholder="Enter a catchy title for your item"
                      {...register("title")}
                      className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${errors.title ? "border-red-500" : ""}`}
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                  </div>
                  
                  {/* Category */}
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select
                      id="category"
                      {...register("category")}
                      className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                    >
                      <option value="insta">Instagram</option>
                      <option value="x">X</option>
                      <option value="tiktok">TikTok</option>
                      <option value="telegram">Telegram</option>
                      <option value="discord">Discord</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.category && <p className="text-sm text-red-500">{errors.category.message}</p>}
                  </div>
                  
                  {/* Short Description */}
                  <div className="space-y-2">
                    <Label htmlFor="description">Short Description</Label>
                    <Input
                      id="description"
                      type="text"
                      placeholder="Brief description (shown in listings)"
                      {...register("description")}
                      className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${errors.description ? "border-red-500" : ""}`}
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                  </div>
                  
                  {/* Long Description */}
                  <div className="space-y-2">
                    <Label htmlFor="longDescription">Full Description</Label>
                    <textarea
                      id="longDescription"
                      placeholder="Detailed description of your item"
                      {...register("longDescription")}
                      className={`w-full p-3 rounded-md bg-zinc-800/50 border border-zinc-700 focus:border-violet-500 focus:outline-none ${errors.longDescription ? "border-red-500" : ""}`}
                      rows={5}
                    />
                    {errors.longDescription && <p className="text-sm text-red-500">{errors.longDescription.message}</p>}
                  </div>
                  
                  {/* Price */}
                  <div className="space-y-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Fixed price"
                      {...register("price", { valueAsNumber: true })}
                      className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${errors.price ? "border-red-500" : ""}`}
                    />
                    {errors.price && <p className="text-sm text-red-500">{errors.price.message}</p>}
                  </div>
                  
                  {/* Is Auction */}
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isAuction" 
                      checked={isAuction}
                      onCheckedChange={handleToggleAuction}
                      className="bg-zinc-800 border-zinc-600"
                    />
                    <Label 
                      htmlFor="isAuction" 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      List as auction
                    </Label>
                  </div>
                  
                  {/* Auction fields (conditional) */}
                  {isAuction && (
                    <div className="space-y-4 p-4 rounded-md bg-zinc-800/30 border border-zinc-700/50">
                      <h3 className="text-sm font-medium text-zinc-300">Auction Settings</h3>
                      
                      <div className="space-y-2">
                        <Label htmlFor="startingBid">Starting Bid ($)</Label>
                        <Input
                          id="startingBid"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Starting bid amount"
                          {...register("startingBid", { valueAsNumber: true })}
                          className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${errors.startingBid ? "border-red-500" : ""}`}
                        />
                        {errors.startingBid && <p className="text-sm text-red-500">{errors.startingBid.message}</p>}
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Listing Status</Label>
                    <select
                      id="status"
                      {...register("status")}
                      className="w-full p-2 rounded-md bg-zinc-800/50 border border-zinc-700 text-white"
                    >
                      <option value="active">Active</option>
                      <option value="draft">Draft (not visible)</option>
                    </select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
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
                      'Create Listing'
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  )
}

