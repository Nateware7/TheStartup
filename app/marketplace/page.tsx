"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { ProductGrid } from "@/components/product-grid"
import { AnimatedBackground } from "@/components/animated-background"
import { RefinedTrustCard } from "@/components/refined-trust-card"
import { SubscriptionBanner } from "@/components/subscription-banner"

export default function MarketplacePage() {
  const [activeFilter, setActiveFilter] = useState("All")
  
  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        <main className="pt-24">
          {/* Subscription Banner - only visible to non-subscribers */}
          <SubscriptionBanner />

          {/* Centered Header Section */}
          <section className="container mx-auto mb-4 px-4 text-center">
            <h1 className="text-3xl font-bold md:text-4xl">Marketplace</h1>
            <p className="mt-1 text-sm text-zinc-400">Discover premium usernames and accounts from verified creators</p>
          </section>

          {/* Unified Filter & Category Bar */}
          <section className="container mx-auto px-4 mb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
              <div className="relative w-full sm:max-w-xs">
                <input
                  type="search"
                  placeholder="Search products..."
                  className="w-full rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-400">Sort by:</span>
                <select className="rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5 text-sm text-zinc-200 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500">
                  <option>Newest</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Most Popular</option>
                </select>
              </div>
            </div>

            {/* Category Pills - directly in this section */}
            <div className="flex justify-center sm:justify-start gap-3 mb-4">
              {["All", "Usernames", "Accounts"].map((category) => (
                <button
                  key={category}
                  className={`relative flex-shrink-0 rounded-full px-5 py-1.5 text-xs font-medium transition-all duration-200 ${
                    category === activeFilter
                      ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                      : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200"
                  }`}
                  aria-label={category === "All" ? "Show all listings" : `Show only ${category.toLowerCase()}`}
                  onClick={() => setActiveFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          </section>

          {/* Refined Trust Card */}
          <section className="container mx-auto px-4 mb-6">
            <RefinedTrustCard />
          </section>

          {/* Subtle divider */}
          <div className="container mx-auto px-4 mb-6">
            <div className="h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent"></div>
          </div>

          {/* Product Grid */}
          <section className="container mx-auto px-4 mb-16">
            <ProductGrid filter={activeFilter} />

            <div className="mt-8 flex justify-center">
              <button className="rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-2 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white">
                Load More
              </button>
            </div>
          </section>
        </main>
      </div>
    </AnimatedBackground>
  )
}

