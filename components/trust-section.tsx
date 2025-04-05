"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Shield, Check } from "lucide-react"

const securityFeatures = [
  {
    title: "Instant Purchase & Bidding Protection",
    icon: Check,
    delay: 0.3,
  },
  {
    title: "Verified Creator Badges",
    icon: Check,
    delay: 0.4,
  },
  {
    title: "Encrypted Payment Processing",
    icon: Check,
    delay: 0.5,
  },
  {
    title: "Dispute Resolution System",
    icon: Check,
    delay: 0.6,
  },
]

export function TrustSection() {
  const [isInView, setIsInView] = useState(false)
  const sectionRef = useRef(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      { threshold: 0.2 },
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e
      const rect = sectionRef.current?.getBoundingClientRect()
      if (rect) {
        const x = clientX - rect.left
        const y = clientY - rect.top
        setMousePosition({ x, y })
      }
    }

    window.addEventListener("mousemove", handleMouseMove)

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current)
      }
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  // Generate floating orbs
  const orbs = Array.from({ length: 6 }).map((_, i) => ({
    id: i,
    size: Math.random() * 200 + 100,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 20,
    delay: Math.random() * 10,
  }))

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24 md:py-32">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="absolute opacity-10"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${
              orb.id % 2 === 0 ? "rgba(139, 92, 246, 0.3)" : "rgba(79, 70, 229, 0.3)"
            }, transparent)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            animation: `float ${orb.duration}s infinite alternate ease-in-out`,
            animationDelay: `${orb.delay}s`,
          }}
        />
      ))}

      {/* Mouse follow effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30 transition-all duration-1000 ease-out"
        style={{
          background: `radial-gradient(circle 400px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 80%)`,
        }}
      />

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 40 }}
          transition={{ duration: 0.8 }}
          className="mx-auto max-w-7xl"
        >
          {/* Main card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-900/90 p-8 shadow-2xl backdrop-blur-lg md:p-12 lg:p-16">
            {/* Card background effects */}
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
            <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 -translate-y-1/2 transform rounded-full bg-blue-500/10 blur-3xl" />

            {/* Card border glow */}
            <div className="absolute inset-0 rounded-3xl border border-violet-500/10 opacity-70" />

            <div className="relative z-10 flex flex-col items-center text-center">
              {/* Shield icon with glow */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: isInView ? 1 : 0.8, opacity: isInView ? 1 : 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative mb-8"
              >
                <div className="absolute -inset-4 animate-pulse rounded-full bg-violet-500/10 blur-xl" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-violet-600/20 to-indigo-600/20 p-5 shadow-lg shadow-violet-500/20 backdrop-blur-sm">
                  <Shield className="h-12 w-12 text-white drop-shadow-lg" />
                </div>
                <div
                  className="absolute inset-0 animate-ping rounded-full bg-violet-500/10 blur-sm"
                  style={{ animationDuration: "3s" }}
                />
              </motion.div>

              {/* Heading */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mb-4 font-sora text-3xl font-bold tracking-tight text-white md:text-4xl lg:text-5xl"
              >
                Secure Digital Marketplace
              </motion.h2>

              {/* Subheading */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.25 }}
                className="mb-12 max-w-3xl text-lg text-zinc-300 md:text-xl"
              >
                Your digital assets are protected by end-to-end encrypted transactions, verified sellers, and our buyer
                protection policy.
              </motion.p>

              {/* Features grid */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="mb-12 grid w-full max-w-4xl grid-cols-1 gap-6 md:grid-cols-2"
              >
                {securityFeatures.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                    animate={{ opacity: isInView ? 1 : 0, x: isInView ? 0 : index % 2 === 0 ? -20 : 20 }}
                    transition={{ duration: 0.5, delay: feature.delay }}
                    className="flex items-center rounded-xl bg-zinc-800/50 p-4 backdrop-blur-sm"
                  >
                    <div className="mr-4 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-indigo-500/20">
                      <feature.icon className="h-5 w-5 text-violet-400" />
                    </div>
                    <span className="text-left font-medium text-white">{feature.title}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isInView ? 1 : 0, y: isInView ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex flex-wrap justify-center gap-4"
              >
                <button className="relative overflow-hidden rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-3 font-medium text-white shadow-lg shadow-violet-500/20 transition-all hover:shadow-xl hover:shadow-violet-500/30">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      className="h-full w-full animate-pulse bg-white opacity-10 blur-xl"
                      style={{ animationDuration: "3s" }}
                    />
                  </div>
                  <span className="relative z-10">Start Selling</span>
                </button>
                <button className="rounded-full border border-zinc-700 bg-zinc-800/50 px-8 py-3 font-medium text-white transition-all hover:bg-zinc-800">
                  View Buyer Policy
                </button>
                <button className="rounded-full border border-zinc-700 bg-zinc-800/50 px-8 py-3 font-medium text-white transition-all hover:bg-zinc-800">
                  View Marketplace
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* CSS for floating animation */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
    </section>
  )
}

