"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Shield, Check } from "lucide-react"

const securityFeatures = [
  {
    title: "Instant Purchase & Bidding Protection",
    icon: Check,
    delay: 0.3,
  },
  {
    title: "Verified Creator Badges",
    icon: Check,
    delay: 0.4,
  },
  {
    title: "Encrypted Payment Processing",
    icon: Check,
    delay: 0.5,
  },
  {
    title: "Dispute Resolution System",
    icon: Check,
    delay: 0.6,
  },
]

export function UnifiedHero() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section className="relative overflow-hidden pt-24 pb-24 lg:pt-32 lg:pb-32">
      <div className="container relative z-10 mx-auto px-4">
        {/* Hero and Trust Card Row */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
          {/* Hero Content - Left Side */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.6 }}
            className="mb-8 flex flex-1 flex-col items-center text-center lg:mb-0 lg:items-start lg:pr-8 lg:text-left"
          >
            <h1 className="mb-6 font-sora text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
              <span className="block">Thameen</span>
              <span className="mt-2 block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              Digital Marketplace
              </span>
            </h1>

            <p className="mb-8 max-w-xl text-lg text-zinc-300 md:text-xl">
              A text-first marketplace for digital products. Buy, sell, and bid on exclusive digital assets based on
              their merit, not their appearance.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/marketplace"
                className="group flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30"
              >
                Explore Marketplace
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/sell"
                className="rounded-full border border-zinc-700 bg-zinc-800/50 px-6 py-3 font-medium text-white backdrop-blur-sm transition-all hover:bg-zinc-800"
              >
                Start Selling
              </Link>
            </div>
          </motion.div>

          {/* Trust Card - Right Side */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: mounted ? 1 : 0, x: mounted ? 0 : 20 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1"
          >
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/80 via-zinc-900/70 to-zinc-900/80 p-6 shadow-2xl backdrop-blur-lg md:p-8">
              {/* Card border glow */}
              <div className="absolute inset-0 rounded-2xl border border-violet-500/10 opacity-70" />

              <div className="relative z-10">
                {/* Shield icon with glow */}
                <div className="mb-6 flex items-center justify-center lg:justify-start">
                  <div className="relative">
                    <div className="absolute -inset-3 animate-pulse rounded-full bg-violet-500/10 blur-lg" />
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 p-4 shadow-lg shadow-violet-500/20 backdrop-blur-sm">
                      <Shield className="h-8 w-8 text-white drop-shadow-lg" />
                    </div>
                  </div>
                  <h2 className="ml-4 font-sora text-2xl font-bold text-white md:text-3xl">
                    Secure Digital Marketplace
                  </h2>
                </div>

                {/* Subheading */}
                <p className="mb-6 text-zinc-300">
                  Your digital assets are protected by end-to-end encrypted transactions, verified sellers, and our
                  buyer protection policy.
                </p>

                {/* Features grid */}
                <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {securityFeatures.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 10 }}
                      transition={{ duration: 0.4, delay: feature.delay }}
                      className="flex items-center rounded-lg bg-zinc-800/50 p-3 backdrop-blur-sm"
                    >
                      <div className="mr-3 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                        <feature.icon className="h-4 w-4 text-violet-400" />
                      </div>
                      <span className="text-sm font-medium text-white">{feature.title}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="flex flex-wrap gap-3">
                  <button className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30">
                    Start Selling
                  </button>
                  <button className="rounded-full border border-zinc-700 bg-zinc-800/50 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800">
                    View Buyer Policy
                  </button>
                  <button className="rounded-full border border-zinc-700 bg-zinc-800/50 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800">
                    View Marketplace
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

