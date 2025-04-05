"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"

export function FooterGradientBlend() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="absolute inset-x-0 bottom-0 top-[-250px] pointer-events-none overflow-hidden">
      {/* Base gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/60 to-zinc-900/90" />

      {/* Radial gradient accents */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 0.4 : 0 }}
        transition={{ duration: 1.5 }}
        className="absolute left-1/4 top-1/3 h-[600px] w-[600px] rounded-full bg-violet-900/10 blur-[180px]"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 0.3 : 0 }}
        transition={{ duration: 1.5, delay: 0.2 }}
        className="absolute right-1/4 top-1/2 h-[500px] w-[500px] rounded-full bg-indigo-900/10 blur-[150px]"
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: mounted ? 0.5 : 0 }}
        transition={{ duration: 1.5, delay: 0.4 }}
        className="absolute left-1/2 bottom-0 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-purple-900/10 blur-[250px]"
      />
    </div>
  )
}

