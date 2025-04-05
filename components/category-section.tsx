"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Shield, Code, BookOpen, Sparkles, Music, Palette, Zap, Layers, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

const categories = [
  {
    name: "AI Prompts",
    icon: Sparkles,
    color: "from-purple-500 to-pink-500",
    shadowColor: "shadow-purple-500/20",
    delay: 0.1,
  },
  {
    name: "Code",
    icon: Code,
    color: "from-blue-500 to-cyan-500",
    shadowColor: "shadow-blue-500/20",
    delay: 0.2,
  },
  {
    name: "eBooks",
    icon: BookOpen,
    color: "from-emerald-500 to-teal-500",
    shadowColor: "shadow-emerald-500/20",
    delay: 0.3,
  },
  {
    name: "Music",
    icon: Music,
    color: "from-red-500 to-orange-500",
    shadowColor: "shadow-red-500/20",
    delay: 0.4,
  },
  {
    name: "Design",
    icon: Palette,
    color: "from-pink-500 to-rose-500",
    shadowColor: "shadow-pink-500/20",
    delay: 0.5,
  },
  {
    name: "Templates",
    icon: Layers,
    color: "from-violet-500 to-indigo-500",
    shadowColor: "shadow-violet-500/20",
    delay: 0.6,
  },
  {
    name: "Plugins",
    icon: Zap,
    color: "from-amber-500 to-yellow-500",
    shadowColor: "shadow-amber-500/20",
    delay: 0.7,
  },
  {
    name: "Social",
    icon: MessageSquare,
    color: "from-sky-500 to-blue-500",
    shadowColor: "shadow-sky-500/20",
    delay: 0.8,
  },
]

export function CategorySection() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    const handleScroll = () => {
      const section = document.getElementById("category-section")
      if (section) {
        const rect = section.getBoundingClientRect()
        const isVisible = rect.top < window.innerHeight && rect.bottom >= 0
        setIsVisible(isVisible)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("scroll", handleScroll)

    // Trigger initial check
    handleScroll()

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <section id="category-section" className="relative overflow-hidden py-20">
      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.3) 0%, rgba(30, 64, 175, 0.2) 25%, rgba(0, 0, 0, 0) 50%)`,
          transition: "background 0.3s ease",
        }}
      />

      <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl" />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center"
        >
          <h2 className="mb-3 text-3xl font-bold md:text-4xl">Explore Categories</h2>
          <p className="mx-auto max-w-2xl text-zinc-400">
            Discover premium digital assets across multiple categories, created by talented creators worldwide
          </p>
        </motion.div>

        {/* Category grid */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8">
          {categories.map((category, index) => (
            <CategoryCard key={index} category={category} isVisible={isVisible} />
          ))}
        </div>

        {/* Callout card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 30 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mx-auto max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900/80 p-6 shadow-xl backdrop-blur-sm md:p-8">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 p-3 backdrop-blur-sm">
                <Shield className="h-8 w-8 text-white" />
              </div>

              <h3 className="mb-2 text-xl font-bold md:text-2xl">Secure Digital Marketplace</h3>
              <p className="mb-6 text-zinc-400">
                Every transaction is protected with our secure payment system and buyer protection policy
              </p>

              <div className="flex flex-wrap justify-center gap-3">
                <button className="rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-lg hover:shadow-violet-500/25">
                  Start Selling
                </button>
                <button className="rounded-full border border-zinc-700 bg-zinc-800/50 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800">
                  Learn More
                </button>
                <button className="rounded-full border border-zinc-700 bg-zinc-800/50 px-5 py-2 text-sm font-medium text-white transition-all hover:bg-zinc-800">
                  View Marketplace
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function CategoryCard({ category, isVisible }) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: isVisible ? 1 : 0, scale: isVisible ? 1 : 0.9 }}
      transition={{ duration: 0.5, delay: category.delay }}
      className={cn(
        "group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl bg-zinc-900/50 p-4 backdrop-blur-sm transition-all duration-300",
        category.shadowColor,
        isHovered ? "shadow-lg" : "shadow-md",
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-20",
          `bg-gradient-to-br ${category.color}`,
        )}
      />

      <div
        className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300",
          `bg-gradient-to-br ${category.color}`,
          isHovered ? "scale-110" : "scale-100",
        )}
      >
        <category.icon className="h-6 w-6 text-white" />
      </div>

      <span className="text-center text-sm font-medium text-white">{category.name}</span>
    </motion.div>
  )
}

