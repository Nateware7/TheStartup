import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { SellerDashboard } from "@/components/seller-dashboard"

export default function DashboardPage() {
  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        <main className="container mx-auto px-4 pt-24 pb-20">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold md:text-4xl">Seller Dashboard</h1>
              <p className="mt-2 text-zinc-400">Track your listings, sales, and earnings in one place.</p>
            </div>

            {/* Dashboard Content */}
            <SellerDashboard />
          </div>
        </main>
      </div>
    </AnimatedBackground>
  )
}

