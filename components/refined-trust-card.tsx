"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Shield, Check, Lock, Award, LifeBuoy } from "lucide-react"

const securityFeatures = [
  {
    title: "Instant Purchase & Bidding Protection",
    icon: Check,
  },
  {
    title: "Verified Creator Badges",
    icon: Award,
  },
  {
    title: "Encrypted Payment Processing",
    icon: Lock,
  },
  {
    title: "Dispute Resolution System",
    icon: LifeBuoy,
  },
]

export function RefinedTrustCard() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[rgba(18,18,18,0.4)] backdrop-blur-[14px] border border-zinc-800/20">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-900/5 to-indigo-900/5"></div>

      {/* Soft glow effects */}
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-500/5 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-violet-500/5 blur-3xl" />

      <div className="relative z-10 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:gap-6">
          {/* Icon and title section */}
          <div className="mb-3 flex items-center md:mb-0 md:w-auto md:min-w-[180px]">
            <div className="relative mr-3">
              {/* Pulsing glow effect */}
              <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-pulse"></div>

              <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/30 to-indigo-600/30">
                <Shield className="h-3.5 w-3.5 text-violet-400" />
              </div>
            </div>

            <h2 className="text-sm font-medium text-white">Secure Digital Marketplace</h2>
          </div>

          {/* Features section - pill style */}
          <div className="flex-1 mb-3 md:mb-0">
            <div className="flex flex-wrap gap-2">
              {securityFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 5 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="flex items-center rounded-full bg-zinc-800/30 px-3 py-1"
                >
                  <feature.icon className="mr-1.5 h-3 w-3 text-violet-400" />
                  <span className="text-xs text-zinc-300">{feature.title}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Buttons section */}
          <div className="flex gap-2 md:justify-end md:min-w-[180px]">
            <button className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-medium text-white">
              Start Selling
            </button>
            <button className="rounded-full border border-zinc-700/50 bg-zinc-800/20 px-3 py-1 text-xs font-medium text-zinc-300">
              View Policy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

