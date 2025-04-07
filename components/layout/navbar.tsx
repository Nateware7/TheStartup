"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, ShoppingCart, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true)
      } else {
        setIsScrolled(false)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Sell", href: "/sell" },
    { name: "Subscribe", href: "/subscribe" },
    { name: "My Account", href: "/dashboard" },
  ]

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        isScrolled
          ? "bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-800/40 shadow-lg shadow-black/5"
          : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          {/* Left: Platform name */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Bixt
              </span>
            </Link>
          </div>

          {/* Center: Navigation links (desktop) */}
          <nav className="hidden mx-auto md:block">
            <ul className="flex space-x-8">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "group relative text-zinc-400 transition-colors hover:text-white",
                      pathname === item.href && "text-white",
                    )}
                  >
                    <span className="relative">
                      {item.name}
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-300 group-hover:w-full" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Right: Cart, Sign In, Sign Up */}
          <div className="flex items-center space-x-4">
            <button className="hidden rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-white md:block">
              <ShoppingCart className="h-5 w-5" />
            </button>

            <Link href="/auth/signin" className="hidden md:block">
              <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white">
                <User className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>

            <Link href="/auth/signup" className="hidden md:block">
              <Button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700">
                Sign Up
              </Button>
            </Link>

            {/* Mobile menu button */}
            <button
              className="rounded-md p-2 text-zinc-400 md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-zinc-950/95 backdrop-blur-md md:hidden">
          <nav className="container mx-auto px-4 py-8">
            <ul className="flex flex-col space-y-6">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-xl font-medium text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li className="pt-4">
                <Link href="/auth/signin" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full" variant="outline">
                    Sign In
                  </Button>
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white">Sign Up</Button>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

