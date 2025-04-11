"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User, Star, LogOut, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { auth } from "@/lib/firebaseConfig"
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth"
import { NotificationBell } from "@/components/notification-bell"

export function Navbar() {
  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if we're on an auth page
  const isAuthPage = pathname?.startsWith("/auth")

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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setIsLoading(false)
    })
    
    return () => unsubscribe()
  }, [])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      // Force page refresh to ensure all components update properly
      window.location.href = "/"
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Marketplace", href: "/marketplace" },
    { name: "Sell", href: "/sell" },
    { name: "Subscribe", href: "/subscribe" },
    { name: "Messages", href: "/messages", protected: true },
    { name: "My Auctions", href: "/my-auctions", protected: true },
    { name: "My Account", href: "/dashboard", protected: true },
  ]

  // Filter navItems based on auth state
  const filteredNavItems = navItems.filter(item => 
    !item.protected || (item.protected && user)
  )

  // Skeleton placeholder for auth buttons when loading
  const authButtonsPlaceholder = (
    <div className="flex items-center space-x-4">
      <div className="h-9 w-20 animate-pulse rounded-md bg-zinc-800/50"></div>
    </div>
  )

  return (
    <header
      className={cn(
        "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
        isScrolled || isAuthPage
          ? "bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-800/40 shadow-lg shadow-black/5"
          : "bg-transparent",
      )}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between md:h-20">
          <div className="flex items-center">
            <Link href="/" className="mr-8 text-2xl font-bold">
              <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Bixt
              </span>
            </Link>

            <nav className="hidden md:block">
              <ul className="flex space-x-8">
                {filteredNavItems.map((item) => (
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
          </div>

          <div className="flex items-center space-x-2">
            {/* Notification Bell - only shown when logged in */}
            {!isLoading && user && (
              <NotificationBell />
            )}
            
            {/* User Profile Link - only shown when logged in */}
            {!isLoading && user && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/profile/${user.uid}`}
                      className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-violet-400 group md:block"
                    >
                      <UserCircle className="h-6 w-6 transition-all duration-200 group-hover:text-violet-400" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>My Profile</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/favorites"
                    className="hidden rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-violet-400 group md:block"
                  >
                    <Star className="h-5 w-5 transition-all duration-200 group-hover:fill-violet-400/20" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Favorites</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {isLoading ? (
              authButtonsPlaceholder
            ) : user ? (
              <>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="text-zinc-400 hover:text-white"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sign out of your account</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </>
            ) :
              <>
                <Link href="/auth/signin" className="hidden md:block">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "text-zinc-400 hover:text-white",
                      pathname === "/auth/signin" && "bg-zinc-800/50 text-white",
                    )}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>

                {!user && (
                  <Link href="/auth/signup" className="hidden md:block">
                    <Button
                      className={cn(
                        "bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700",
                        pathname === "/auth/signup" && "from-violet-700 to-indigo-700",
                      )}
                    >
                      Sign Up
                    </Button>
                  </Link>
                )}
              </>
            }

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
              {filteredNavItems.map((item) => (
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

              {/* Profile link for mobile */}
              {user && (
                <li>
                  <Link
                    href={`/profile/${user.uid}`}
                    className="flex items-center text-xl font-medium text-white"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <UserCircle className="mr-2 h-5 w-5" />
                    My Profile
                  </Link>
                </li>
              )}

              <li>
                <Link
                  href="/favorites"
                  className="flex items-center text-xl font-medium text-white"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Star className="mr-2 h-5 w-5" />
                  Favorites
                </Link>
              </li>
              
              {/* Auth buttons for mobile */}
              {!user ? (
                <>
                  <li>
                    <Link
                      href="/auth/signin"
                      className="flex items-center text-xl font-medium text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <User className="mr-2 h-5 w-5" />
                      Sign In
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/auth/signup"
                      className="flex items-center text-xl font-medium text-white"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                  </li>
                </>
              ) : (
                <li>
                  <button
                    className="flex items-center text-xl font-medium text-white"
                    onClick={() => {
                      handleSignOut()
                      setIsMobileMenuOpen(false)
                    }}
                  >
                    <LogOut className="mr-2 h-5 w-5" />
                    Sign Out
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      )}
    </header>
  )
}

