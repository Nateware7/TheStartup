"use client"

import { useEffect, useState, cache } from "react"
import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Star, MessageCircle, Calendar, Award, Loader, Edit, ExternalLink, ShoppingBag, Clock, CheckCircle } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProducts } from "@/components/user-products"
import { UserReviews } from "@/components/user-reviews"
import { AnimatedBackground } from "@/components/animated-background"
import { MessageButton } from "@/components/message-button"
import { db, auth } from "@/lib/firebaseConfig"
import { doc, getDoc, collection, getDocs, query, where, updateDoc } from "firebase/firestore"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import toast from "react-hot-toast"

type UserData = {
  id: string
  username: string
  profilePicture: string
  banner: string
  bio: string
  isVerified: boolean
  createdAt: Date
  location: string
  sales: number
  followers: number
  following: number
  rating: number
  badges: Array<{ name: string, icon: any }>
}

// Use a wrapper component for the actual user profile content
function UserProfileContent({ userId }: { userId: string }) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("products")
  const [isCurrentUser, setIsCurrentUser] = useState(false)
  const [salesCount, setSalesCount] = useState(0)

  useEffect(() => {
    // Check if the profile being viewed belongs to the current user
    const currentUser = auth.currentUser
    if (currentUser) {
      setIsCurrentUser(currentUser.uid === userId)
    }

    // Keep existing fetchUserData function
    async function fetchUserData() {
      try {
        setLoading(true)
        
        // First try to get user by UID
        const userDoc = await getDoc(doc(db, 'users', userId))
        let actualUserId = userId;
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          
          // Map badge names to icons
          const badgeIcons = {
            "Top Seller": Award,
            "Verified Creator": Star,
            "1 Year Member": Calendar,
          }
          
          // Format badges with the correct icons
          const formattedBadges = userData.badges?.map((badge: string) => ({
            name: badge,
            icon: badgeIcons[badge as keyof typeof badgeIcons] || Star
          })) || []
          
          // Format creation date
          const createdAt = userData.createdAt?.toDate() || new Date()
          
          // Get the user's rating from userRatings collection if available
          let userRating = userData.rating || 0
          try {
            const userRatingDoc = await getDoc(doc(db, 'userRatings', userId))
            if (userRatingDoc.exists()) {
              const ratingData = userRatingDoc.data()
              userRating = ratingData.rating || userRating
            }
          } catch (ratingErr) {
            console.error("Error fetching user rating:", ratingErr)
            // Continue with the original rating if there's an error
          }
          
          // Calculate sales by getting listings that are sold
          try {
            const listingsRef = collection(db, "listings")
            const q = query(
              listingsRef,
              where("sellerId", "==", userId),
              where("status", "==", "sold")
            )
            const soldListingsSnapshot = await getDocs(q)
            const soldCount = soldListingsSnapshot.size
            setSalesCount(soldCount)
          } catch (error) {
            console.error("Error counting sold items:", error)
          }
          
          setUser({
            id: userDoc.id,
            username: userData.username || "Anonymous",
            profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
            banner: userData.banner || "/placeholder.svg?height=600&width=1200",
            bio: userData.bio || "No bio available",
            isVerified: userData.isVerified || false,
            createdAt,
            location: userData.location || "Unknown location",
            sales: userData.sales || 0, // Keep this as fallback
            followers: userData.followers || 0,
            following: userData.following || 0,
            rating: userRating,
            badges: formattedBadges.length ? formattedBadges : [
              { name: "New Member", icon: Calendar }
            ]
          })
        } else {
          // If not found by UID, try to find by username
          const usersRef = collection(db, 'users')
          const q = query(usersRef, where("username", "==", userId))
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            actualUserId = querySnapshot.docs[0].id;
            const userData = querySnapshot.docs[0].data()
            
            // Map badge names to icons
            const badgeIcons = {
              "Top Seller": Award,
              "Verified Creator": Star,
              "1 Year Member": Calendar,
            }
            
            // Format badges with the correct icons
            const formattedBadges = userData.badges?.map((badge: string) => ({
              name: badge,
              icon: badgeIcons[badge as keyof typeof badgeIcons] || Star
            })) || []
            
            // Format creation date
            const createdAt = userData.createdAt?.toDate() || new Date()
            
            // Get the user's rating from userRatings collection if available
            let userRating = userData.rating || 0
            try {
              const userRatingDoc = await getDoc(doc(db, 'userRatings', querySnapshot.docs[0].id))
              if (userRatingDoc.exists()) {
                const ratingData = userRatingDoc.data()
                userRating = ratingData.rating || userRating
              }
            } catch (ratingErr) {
              console.error("Error fetching user rating:", ratingErr)
              // Continue with the original rating if there's an error
            }
            
            // Calculate sales by getting listings that are sold
            try {
              const listingsRef = collection(db, "listings")
              const q = query(
                listingsRef,
                where("sellerId", "==", querySnapshot.docs[0].id),
                where("status", "==", "sold")
              )
              const soldListingsSnapshot = await getDocs(q)
              const soldCount = soldListingsSnapshot.size
              setSalesCount(soldCount)
            } catch (error) {
              console.error("Error counting sold items:", error)
            }
            
            setUser({
              id: querySnapshot.docs[0].id,
              username: userData.username || "Anonymous",
              profilePicture: userData.profilePicture || "/placeholder.svg?height=200&width=200",
              banner: userData.banner || "/placeholder.svg?height=600&width=1200",
              bio: userData.bio || "No bio available",
              isVerified: userData.isVerified || false,
              createdAt,
              location: userData.location || "Unknown location",
              sales: userData.sales || 0, // Keep this as fallback
              followers: userData.followers || 0,
              following: userData.following || 0,
              rating: userRating,
              badges: formattedBadges.length ? formattedBadges : [
                { name: "New Member", icon: Calendar }
              ]
            })

            // Check if this matched profile belongs to current user
            const currentUser = auth.currentUser
            if (currentUser) {
              setIsCurrentUser(currentUser.uid === querySnapshot.docs[0].id)
            }
          } else {
            setError("User not found")
            toast.error("User not found")
          }
        }
        
        // Update user's sales count in Firestore if it's different
        if (user && salesCount !== user.sales) {
          try {
            await updateDoc(doc(db, 'users', actualUserId), {
              sales: salesCount
            });
          } catch (error) {
            console.error("Error updating user sales count:", error);
          }
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load user profile")
        toast.error("Failed to load user profile")
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [userId])

  // Handle the edit profile action
  const handleEditProfile = () => {
    router.push(`/edit-profile/${user?.id}`)
  }

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen flex items-center justify-center text-white">
          <Loader className="h-10 w-10 animate-spin" />
          <span className="ml-4 text-xl">Loading user profile...</span>
        </div>
      </AnimatedBackground>
    )
  }

  if (error || !user) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen text-white">
          <Navbar />
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-3xl font-bold mb-4">Profile Not Found</h1>
            <p className="text-zinc-400 mb-8">The user profile you're looking for doesn't exist or cannot be loaded.</p>
            <Button onClick={() => router.push('/')} className="bg-gradient-to-r from-blue-500 to-violet-500">
              Return Home
            </Button>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        {/* Cover Image */}
        <div className="relative h-48 w-full md:h-56">
          <Image src={user.banner} alt="Cover" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
          
          {/* Edit Profile Button - Only shown for the current user */}
          {isCurrentUser && (
            <div className="absolute right-4 bottom-4">
              <Button 
                onClick={handleEditProfile}
                className="bg-black/50 backdrop-blur-sm hover:bg-black/70 text-white border border-zinc-700"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          )}
        </div>

        <div className="container mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Sidebar with profile info */}
            <div className="lg:col-span-3 lg:sticky lg:top-4 lg:self-start">
              <div className="relative -mt-16 z-10 bg-zinc-900/80 p-6 rounded-xl backdrop-blur-md border border-zinc-800/60 shadow-xl">
                <div className="flex flex-col items-center">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-4 border-black mb-4">
                    <Image src={user.profilePicture} alt={user.username} fill className="object-cover" priority />
                  </div>
                
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <h1 className="text-xl font-bold">{user.username}</h1>
                      {user.isVerified && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-zinc-400">{user.bio}</p>
                  </div>
                  
                  <div className="w-full border-t border-zinc-800 my-4 pt-4">
                    <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400 mb-4">
                      <span className="flex items-center"><Calendar className="mr-1 h-3 w-3" />Date Joined: {format(user.createdAt, 'MMM yyyy')}</span>
                    </div>
                    
                    {/* Show different buttons based on whether this is the current user */}
                    {isCurrentUser ? (
                      <div className="grid grid-cols-1 gap-2 mb-4">
                        <Link href="/dashboard" className="w-full">
                          <Button className="w-full text-sm bg-gradient-to-r from-violet-500 to-indigo-500 text-white hover:from-violet-600 hover:to-indigo-600">
                            <ExternalLink className="mr-1 h-4 w-4" />
                            Dashboard
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <MessageButton 
                          recipientId={user.id}
                          recipientName={user.username}
                          className="w-full text-sm bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600"
                          size="default"
                        />
                        <Button variant="outline" className="w-full text-sm border-zinc-800 text-white hover:bg-zinc-900">
                          Follow
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {/* Stats */}
                  <div className="w-full grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                      <div className="text-lg font-bold">{salesCount}</div>
                      <div className="text-xs text-zinc-400">Sales</div>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                      <div className="text-lg font-bold">
                        {user.followers >= 1000 ? `${(user.followers / 1000).toFixed(1)}K` : user.followers}
                      </div>
                      <div className="text-xs text-zinc-400">Followers</div>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                      <div className="text-lg font-bold">{user.following}</div>
                      <div className="text-xs text-zinc-400">Following</div>
                    </div>
                    <div className="rounded-lg bg-zinc-800/50 p-3 text-center">
                      <div className="flex items-center justify-center text-lg font-bold">
                        <Star className="mr-1 h-4 w-4 fill-yellow-500 text-yellow-500" />
                        {user.rating.toFixed(1)}
                      </div>
                      <div className="text-xs text-zinc-400">Rating</div>
                    </div>
                  </div>

                  {/* Highlighted Sales Info */}
                  <div className="w-full mt-4">
                    <div className="rounded-lg bg-gradient-to-r from-blue-500/20 to-violet-500/20 border border-blue-500/30 p-4 text-center">
                      <div className="flex items-center justify-center mb-2">
                        <ShoppingBag className="h-5 w-5 mr-2 text-blue-400" />
                        <span className="font-semibold text-blue-300">Total Sales</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{salesCount}</div>
                      <div className="text-xs text-blue-300 mt-1">Products successfully sold</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="lg:col-span-9">
              {/* Content tabs */}
              <div className="bg-zinc-900/80 rounded-xl backdrop-blur-md border border-zinc-800/60 shadow-xl overflow-hidden">
                {/* Tab navigation - remove collections tab */}
                <div className="grid grid-cols-2 border-b border-zinc-800">
                  <button 
                    className={`py-4 font-medium text-center transition-colors ${activeTab === "products" ? "text-white bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-b-2 border-violet-500" : "text-zinc-400 hover:text-white"}`}
                    onClick={() => setActiveTab("products")}
                  >
                    Products
                  </button>
                  <button 
                    className={`py-4 font-medium text-center transition-colors ${activeTab === "reviews" ? "text-white bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-b-2 border-violet-500" : "text-zinc-400 hover:text-white"}`}
                    onClick={() => setActiveTab("reviews")}
                  >
                    Reviews
                  </button>
                </div>
                
                {/* Tab content */}
                <div className="p-6">
                  {activeTab === "products" && (
                    <UserProducts userId={user.id} />
                  )}
                  
                  {activeTab === "reviews" && (
                    <UserReviews userId={user.id} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  )
}

// Main page component with params unwrapping
export default function UserProfilePage({ params }: { params: { id: string } }) {
  // Safely unwrap params using React.use()
  const unwrappedParams = React.use(params as unknown as Promise<{ id: string }>)
  const userId = unwrappedParams.id
  
  return <UserProfileContent userId={userId} />
}

