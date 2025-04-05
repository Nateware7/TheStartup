"use client"

import { useEffect, useRef, useState } from "react"
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

export function HeroWithTrust() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const sectionRef = useRef(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Generate floating orbs
  const orbs = Array.from({ length: 8 }).map((_, i) => ({
    id: i,
    size: Math.random() * 300 + 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 10,
  }))

  return (
    <section ref={sectionRef} className="relative flex min-h-screen flex-col overflow-hidden lg:min-h-[800px]">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute opacity-10"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${
              orb.id % 3 === 0
                ? "rgba(139, 92, 246, 0.3)"
                : orb.id % 3 === 1
                  ? "rgba(79, 70, 229, 0.3)"
                  : "rgba(236, 72, 153, 0.3)"
            }, transparent)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            animation: `float ${orb.duration}s infinite alternate ease-in-out`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      {/* Mouse follow effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle 600px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 80%)`,
        }}
      />

      <div className="container relative z-10 mx-auto flex h-full flex-1 flex-col px-4 pt-24 lg:flex-row lg:items-center lg:gap-8 lg:pt-0">
        {/* Hero Content - Left Side */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
          transition={{ duration: 0.6 }}
          className="mb-12 flex flex-1 flex-col items-center text-center lg:mb-0 lg:items-start lg:pr-8 lg:text-left"
        >
          <h1 className="mb-6 font-sora text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
            <span className="block">Digital Marketplace</span>
            <span className="mt-2 block bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
              No Images Required
            </span>
          </h1>

          <p className="mb-8 max-w-xl text-lg text-zinc-300 md:text-xl">
            A text-first marketplace for digital products. Buy, sell, and bid on exclusive digital assets based on their
            merit, not their appearance.
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
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-6 shadow-2xl backdrop-blur-lg md:p-8">
            {/* Card background effects */}
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />

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
                <h2 className="ml-4 font-sora text-2xl font-bold text-white md:text-3xl">Secure Digital Marketplace</h2>
              </div>

              {/* Subheading */}
              <p className="mb-6 text-zinc-300">
                Your digital assets are protected by end-to-end encrypted transactions, verified sellers, and our buyer
                protection policy.
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

      {/* CSS for floating animation */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
    </section>
  )
}

