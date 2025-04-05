import { ProductGrid } from "@/components/product-grid"
import { Navbar } from "@/components/navbar"
import { UnifiedHero } from "@/components/unified-hero"
import { AnimatedBackground } from "@/components/animated-background"
import { CategoryTagCarousel } from "@/components/category-tag-carousel"
import { SeamlessConnector } from "@/components/seamless-connector"

export default function Home() {
  return (
    <AnimatedBackground>
      <div className="flex min-h-screen flex-col text-white">
        <Navbar />

        {/* Combined Hero and Trust Section */}
        <UnifiedHero />

        {/* Visual connector between sections */}
        <SeamlessConnector />

        {/* Main Content */}
        <main className="flex-1">
          {/* Featured Products */}
          <section className="container mx-auto px-4 pt-8 pb-20">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold md:text-3xl">Featured Products</h2>
                <p className="text-sm text-zinc-400 mt-1">Usernames & Accounts marketplace</p>
              </div>
              <div className="relative w-full sm:max-w-xs">
                <input
                  placeholder="Search products..."
                  className="w-full rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>
            </div>

            <CategoryTagCarousel />
            <ProductGrid />
          </section>
        </main>
      </div>
    </AnimatedBackground>
  )
}

