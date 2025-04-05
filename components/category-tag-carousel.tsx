"use client"

import { useRef, useState, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

// Simplified categories for marketplace
const categories = [
  { name: "All", active: true },
  { name: "Usernames", active: false },
  { name: "Accounts", active: false },
]

export function CategoryTagCarousel() {
  const [activeCategory, setActiveCategory] = useState("All")
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    checkScrollPosition()
    window.addEventListener("resize", checkScrollPosition)
    return () => window.removeEventListener("resize", checkScrollPosition)
  }, [])

  const checkScrollPosition = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    setShowLeftArrow(scrollLeft > 0)
    setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10)
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return

    const scrollAmount = 300
    const currentScroll = scrollContainerRef.current.scrollLeft

    scrollContainerRef.current.scrollTo({
      left: direction === "left" ? currentScroll - scrollAmount : currentScroll + scrollAmount,
      behavior: "smooth",
    })

    // Check scroll position after animation
    setTimeout(checkScrollPosition, 300)
  }

  return (
    <div className="relative mx-auto w-full max-w-7xl px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: mounted ? 1 : 0, y: mounted ? 0 : 10 }}
        transition={{ duration: 0.4 }}
        className="relative"
      >
        {/* Left scroll button - only shown if needed */}
        {showLeftArrow && (
          <button
            onClick={() => scroll("left")}
            className="absolute -left-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900/90 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-zinc-800"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Right scroll button - only shown if needed */}
        {showRightArrow && (
          <button
            onClick={() => scroll("right")}
            className="absolute -right-2 top-1/2 z-10 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-900/90 text-white shadow-sm backdrop-blur-sm transition-all hover:bg-zinc-800"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        )}

        {/* Gradient fades */}
        <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-12 bg-gradient-to-r from-zinc-950 to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-12 bg-gradient-to-l from-zinc-950 to-transparent" />

        {/* Centered container for category pills */}
        <div className="flex justify-center">
          <div
            ref={scrollContainerRef}
            className="hide-scrollbar flex gap-2 overflow-x-auto py-2 scrollbar-none"
            onScroll={checkScrollPosition}
          >
            {categories.map((category) => (
              <button
                key={category.name}
                className={cn(
                  // Base styles for all pills - consistent size, shape, padding
                  "relative flex-shrink-0 rounded-full px-5 py-1.5 text-xs font-medium transition-all duration-200",
                  // Active pill styling with glow effect
                  activeCategory === category.name
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm"
                    : "bg-zinc-900/40 text-zinc-400 border border-zinc-800/80 hover:bg-zinc-800/60 hover:text-zinc-200",
                )}
                onClick={() => setActiveCategory(category.name)}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

