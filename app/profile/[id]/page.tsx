import Image from "next/image"
import { Star, MessageCircle, Calendar, Award } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UserProducts } from "@/components/user-products"
import { AnimatedBackground } from "@/components/animated-background"

// This would normally come from a database
const user = {
  id: "cyber123",
  name: "CyberArtist",
  avatar: "/placeholder.svg?height=200&width=200",
  cover: "/placeholder.svg?height=600&width=1200",
  bio: "Digital artist specializing in cyberpunk and neon aesthetics. Creating unique digital art collections for modern spaces and digital platforms.",
  verified: true,
  joinDate: "March 2021",
  location: "Tokyo, Japan",
  stats: {
    sales: 128,
    followers: 1.2,
    following: 45,
    rating: 4.8,
  },
  badges: [
    { name: "Top Seller", icon: Award },
    { name: "Verified Creator", icon: Star },
    { name: "1 Year Member", icon: Calendar },
  ],
}

export default function UserProfilePage({ params }) {
  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        {/* Cover Image */}
        <div className="relative h-64 w-full md:h-80">
          <Image src={user.cover || "/placeholder.svg"} alt="Cover" fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="container mx-auto px-4 pb-20">
          {/* Profile Header */}
          <div className="relative -mt-20 mb-8 flex flex-col items-center">
            <div className="relative h-40 w-40 overflow-hidden rounded-full border-4 border-black">
              <Image src={user.avatar || "/placeholder.svg"} alt={user.name} fill className="object-cover" />
            </div>

            <div className="mt-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-3xl font-bold">{user.name}</h1>
                {user.verified && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white">
                    ✓
                  </span>
                )}
              </div>
              <p className="mt-2 text-zinc-400">{user.bio}</p>
              <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-zinc-400">
                <span>Joined {user.joinDate}</span>
                <span>•</span>
                <span>{user.location}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-4">
              <Button className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
              <Button variant="outline" className="border-zinc-800 text-white hover:bg-zinc-900">
                Follow
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-zinc-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{user.stats.sales}</div>
              <div className="text-sm text-zinc-400">Sales</div>
            </div>
            <div className="rounded-xl bg-zinc-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{user.stats.followers}K</div>
              <div className="text-sm text-zinc-400">Followers</div>
            </div>
            <div className="rounded-xl bg-zinc-900/50 p-4 text-center backdrop-blur-sm">
              <div className="text-2xl font-bold">{user.stats.following}</div>
              <div className="text-sm text-zinc-400">Following</div>
            </div>
            <div className="rounded-xl bg-zinc-900/50 p-4 text-center backdrop-blur-sm">
              <div className="flex items-center justify-center text-2xl font-bold">
                <Star className="mr-1 h-5 w-5 fill-yellow-500 text-yellow-500" />
                {user.stats.rating}
              </div>
              <div className="text-sm text-zinc-400">Rating</div>
            </div>
          </div>

          {/* Badges */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold">Badges</h2>
            <div className="flex flex-wrap gap-4">
              {user.badges.map((badge, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 rounded-full bg-zinc-900/50 px-4 py-2 backdrop-blur-sm"
                >
                  <badge.icon className="h-4 w-4 text-violet-400" />
                  <span>{badge.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="products" className="mb-12">
            <TabsList className="grid w-full grid-cols-3 bg-zinc-900">
              <TabsTrigger value="products">Products</TabsTrigger>
              <TabsTrigger value="collections">Collections</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="products">
              <UserProducts />
            </TabsContent>
            <TabsContent value="collections">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
                <h3 className="text-lg font-medium">No Collections Yet</h3>
                <p className="mt-2 text-zinc-400">This user hasn't created any collections yet.</p>
              </div>
            </TabsContent>
            <TabsContent value="reviews">
              <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-8 text-center backdrop-blur-sm">
                <h3 className="text-lg font-medium">No Reviews Yet</h3>
                <p className="mt-2 text-zinc-400">This user hasn't received any reviews yet.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AnimatedBackground>
  )
}

