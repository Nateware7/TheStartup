"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { fetchSiteStats, SiteStat } from "@/lib/stats"

export function StatsBar() {
  const [stats, setStats] = useState<SiteStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    
    async function loadStats() {
      try {
        const siteStats = await fetchSiteStats()
        setStats(siteStats)
      } catch (error) {
        console.error("Error loading stats:", error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadStats()
    
    // Optional: Set up an interval to refresh stats periodically
    const interval = setInterval(loadStats, 5 * 60 * 1000) // Refresh every 5 minutes
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading ? (
        // Loading skeleton
        [...Array(4)].map((_, i) => (
          <div 
            key={i} 
            className="flex items-center gap-4 rounded-xl border border-violet-500/10 bg-zinc-900/50 p-4 shadow-lg backdrop-blur-sm animate-pulse"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-zinc-800"></div>
            <div>
              <div className="h-5 w-16 rounded bg-zinc-800"></div>
              <div className="mt-1 h-3 w-24 rounded bg-zinc-800"></div>
            </div>
          </div>
        ))
      ) : (
        // Actual stats
        stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
            transition={{ duration: 0.5, delay: stat.delay }}
            className="flex items-center gap-4 rounded-xl border border-violet-500/10 bg-zinc-900/50 p-4 shadow-lg backdrop-blur-sm"
          >
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20 shadow-lg shadow-violet-500/5">
              {stat.icon && <stat.icon className="h-6 w-6 text-violet-400" />}
            </div>
            <div>
              <div className="text-xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-zinc-400">{stat.label}</div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  )
} 