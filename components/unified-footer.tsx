"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import {
  Globe,
  ChevronUp,
  Twitter,
  Instagram,
  Facebook,
  CreditCard,
  ShoppingCartIcon as Paypal,
  Bitcoin,
} from "lucide-react"
import { StatsBar } from "@/components/stats-bar"

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "Marketplace", href: "/marketplace" },
  { name: "Sell", href: "/sell" },
  { name: "My Account", href: "/my-account" },
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

export function UnifiedFooter() {
  const [mounted, setMounted] = useState(false)
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300)
    }
    
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    })
  }
  
  return (
    <footer className="relative bg-zinc-950">
      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 to-black"></div>
      
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[radial-gradient(#3E3E3E_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      {/* Separator */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent"></div>
      
      {/* Back to top button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/30 ${
          showBackToTop ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronUp className="h-5 w-5" />
      </button>

      <div className="relative z-10">
        {/* Stats Section */}
        <div className="container mx-auto px-4 pt-16 pb-10">
          <StatsBar />
        </div>

        {/* Main Footer Content */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {/* Company Info */}
            <div>
              <Link href="/" className="mb-4 inline-flex items-center">
                <h2 className="text-xl font-bold text-white">Bixt</h2>
              </Link>
              <p className="mb-6 text-zinc-400">
                A premium digital marketplace for online assets. Buy, sell, and trade with confidence in our secure environment.
              </p>
              <h3 className="mb-3 text-sm font-medium text-zinc-300">We accept</h3>
              <div className="flex space-x-2">
                {paymentMethods.map((method, index) => (
                  <div
                    key={index}
                    className="flex h-8 w-12 items-center justify-center rounded bg-zinc-800 text-zinc-400"
                  >
                    <method.icon className="h-4 w-4" />
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-lg font-medium text-white">Quick Links</h3>
              <ul className="space-y-2">
                {quickLinks.slice(0, 4).map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-zinc-400 transition-colors hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="mb-4 text-lg font-medium text-white">Support</h3>
              <ul className="space-y-2">
                {quickLinks.slice(4).map((link) => (
                  <li key={link.name}>
                    <Link href={link.href} className="text-zinc-400 transition-colors hover:text-white">
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Connect */}
            <div>
              <h3 className="mb-4 text-lg font-medium text-white">Connect With Us</h3>
              <div className="mb-6 flex space-x-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 transition-colors hover:bg-violet-600 hover:text-white"
                  >
                    <link.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
              
              <h3 className="mb-3 text-sm font-medium text-zinc-300">Subscribe to our newsletter</h3>
              <div className="flex">
                <input
                  type="email"
                  placeholder="Your email address"
                  className="w-full rounded-l-md border-y border-l border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                />
                <button className="rounded-r-md bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
          
          {/* Footer Bottom */}
          <div className="mt-12 border-t border-zinc-800 pt-6">
            <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
              <p className="text-center text-sm text-zinc-500 md:text-left">
                © {new Date().getFullYear()} Bixt Digital Marketplace. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <Link href="/terms" className="text-sm text-zinc-500 hover:text-zinc-300">
                  Terms
                </Link>
                <Link href="/privacy" className="text-sm text-zinc-500 hover:text-zinc-300">
                  Privacy
                </Link>
                <Link href="/cookies" className="text-sm text-zinc-500 hover:text-zinc-300">
                  Cookies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

