"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import {
  ChevronUp,
  Twitter,
  Instagram,
  Facebook,
  CreditCard,
  ShoppingCartIcon as Paypal,
  Bitcoin,
} from "lucide-react"
import { fetchSiteStats, SiteStat } from "@/lib/stats"

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Sell", href: "/sell" },
  { name: "My Account", href: "/dashboard" },
  { name: "Help Center", href: "/help" },
  { name: "Terms", href: "/terms" },
  { name: "Privacy", href: "/privacy" },
]

const socialLinks = [
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Facebook", icon: Facebook, href: "#" },
]

const paymentMethods = [
  { name: "Credit Card", icon: CreditCard },
  { name: "PayPal", icon: Paypal },
  { name: "Crypto", icon: Bitcoin },
]

export function EnhancedFooter() {
  const [mounted, setMounted] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [stats, setStats] = useState<SiteStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith("/auth")

  useEffect(() => {
    setMounted(true)

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500)
    }
    
    // Load dynamic stats
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
    
    // Set up interval to refresh stats
    const interval = setInterval(loadStats, 5 * 60 * 1000) // Refresh every 5 minutes

    window.addEventListener("scroll", handleScroll)
    return () => {
      window.removeEventListener("scroll", handleScroll)
      clearInterval(interval)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  return (
    <footer className="relative">
      {/* Gradient blend - starts higher up for seamless transition */}
      <div className="absolute inset-x-0 top-[-150px] bottom-0 z-0 pointer-events-none">
        {/* Multiple gradient layers for a more natural blend */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-900" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-purple-900/20" />

        {/* Radial gradients for depth and natural blending */}
        <div className="absolute left-1/4 top-1/3 h-[500px] w-[500px] rounded-full bg-violet-900/10 blur-[150px] opacity-50" />
        <div className="absolute right-1/4 top-2/3 h-[400px] w-[400px] rounded-full bg-indigo-900/10 blur-[150px] opacity-50" />
        <div className="absolute left-1/2 bottom-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-900/10 blur-[150px] opacity-40" />
      </div>

      <div className="relative z-10">
        {/* Stats Section - Only show on non-auth pages */}
        {!isAuthPage && (
          <div className="container mx-auto px-4 pt-16 pb-10">
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
          </div>
        )}

        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* Column 1: Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h3 className="mb-4 font-sora text-lg font-semibold text-white">Quick Links</h3>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="group text-sm text-zinc-400 transition-colors hover:text-white">
                      <span className="relative">
                        {link.name}
                        <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Column 2: About */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h3 className="mb-4 font-sora text-lg font-semibold text-white">About Bixt</h3>
              <p className="mb-4 text-sm leading-relaxed text-zinc-400">
                Bixt is a revolutionary digital marketplace focused on the quality and value of digital products
                rather than flashy visuals. We connect creators with buyers in a secure, transparent environment.
              </p>
              <Link
                href="/about"
                className="group inline-flex items-center gap-1 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <span>Learn more about us</span>
                <span className="transition-transform group-hover:translate-x-0.5">→</span>
              </Link>
            </motion.div>

            {/* Column 3: Connect */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h3 className="mb-4 font-sora text-lg font-semibold text-white">Connect</h3>

              {/* Social Links */}
              <div className="mb-6">
                <div className="flex gap-3">
                  {socialLinks.map((social) => (
                    <Link
                      key={social.name}
                      href={social.href}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all hover:border-violet-500/30 hover:bg-zinc-800 hover:text-white hover:shadow-sm hover:shadow-violet-500/20"
                      aria-label={social.name}
                    >
                      <social.icon className="h-4 w-4" />
                    </Link>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <p className="mb-2 text-sm text-zinc-500">Accepted Payment Methods</p>
                <div className="flex gap-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.name}
                      className="flex h-8 w-12 items-center justify-center rounded-md border border-zinc-800 bg-zinc-900/50"
                      title={method.name}
                    >
                      <method.icon className="h-4 w-4 text-zinc-400" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Copyright - with subtle separator */}
        <div className="relative">
          {/* Subtle gradient separator instead of a border */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-800/30 to-transparent" />

          <div className="container mx-auto px-4 py-6">
            <div className="flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-sm text-zinc-500"
              >
                © Bixt 2025. Powered by <span className="text-zinc-400">DigitalVentures</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: mounted ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="flex items-center gap-4 text-sm text-zinc-500"
              >
                <Link href="/terms" className="hover:text-zinc-400">
                  Terms
                </Link>
                <span>•</span>
                <Link href="/privacy" className="hover:text-zinc-400">
                  Privacy
                </Link>
                <span>•</span>
                <Link href="/cookies" className="hover:text-zinc-400">
                  Cookies
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Back to top button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: showBackToTop ? 1 : 0,
          scale: showBackToTop ? 1 : 0.8,
          y: showBackToTop ? 0 : 20,
        }}
        transition={{ duration: 0.3 }}
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30"
        aria-label="Back to top"
      >
        <ChevronUp className="h-5 w-5" />
      </motion.button>
    </footer>
  )
}

