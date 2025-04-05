"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface AuthCardProps {
  title: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="relative">
      {/* Card glow effect */}
      <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-violet-600/20 to-indigo-600/20 blur-md opacity-75" />

      <div className="relative overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-950/80 backdrop-blur-sm shadow-xl">
        {/* Ambient glow inside card */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-violet-600/10 blur-3xl" />
          <div className="absolute -right-1/4 -bottom-1/4 h-1/2 w-1/2 rounded-full bg-indigo-600/10 blur-3xl" />
        </div>

        {/* Card content */}
        <div className="relative px-6 py-8 md:px-8">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="text-2xl font-bold text-center mb-8"
          >
            {title}
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="space-y-6"
          >
            {children}
          </motion.div>

          {footer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mt-8 pt-6 text-center border-t border-zinc-800/50"
            >
              {footer}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

