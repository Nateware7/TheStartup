"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function SeamlessConnector() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative z-10 h-16 overflow-hidden">
      {/* Visual connector elements */}
      <div className="absolute left-1/4 h-32 w-32 -translate-x-1/2 rounded-full bg-violet-500/5 blur-3xl" />
      <div className="absolute left-3/4 h-32 w-32 -translate-x-1/2 rounded-full bg-indigo-500/5 blur-3xl" />

      {/* Animated particles */}
      {mounted && (
        <>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 5,
              ease: "easeInOut",
            }}
            className="absolute left-1/3 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/20 blur-sm"
          />
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: [20, -20, 20],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 7,
              ease: "easeInOut",
            }}
            className="absolute left-2/3 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/20 blur-sm"
          />
        </>
      )}
    </div>
  )
}

