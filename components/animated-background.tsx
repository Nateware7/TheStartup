"use client"

import type React from "react"

import { useEffect, useState } from "react"

export function AnimatedBackground({ children }: { children: React.ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      setMousePosition({ x: clientX, y: clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  // Generate floating orbs
  const orbs = [
    { id: 1, size: 600, x: 20, y: 15, color: "rgba(139, 92, 246, 0.15)", duration: 45, delay: 0 },
    { id: 2, size: 500, x: 70, y: 60, color: "rgba(79, 70, 229, 0.12)", duration: 60, delay: 5 },
    { id: 3, size: 400, x: 40, y: 80, color: "rgba(236, 72, 153, 0.1)", duration: 50, delay: 10 },
    { id: 4, size: 700, x: 85, y: 20, color: "rgba(45, 212, 191, 0.08)", duration: 65, delay: 15 },
  ]

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      {/* Base gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />

      {/* Floating orbs */}
      {orbs.map((orb) => (
        <div
          key={orb.id}
          className="fixed opacity-10"
          style={{
            width: `${orb.size}px`,
            height: `${orb.size}px`,
            borderRadius: "50%",
            background: `radial-gradient(circle at center, ${orb.color}, transparent 70%)`,
            left: `${orb.x}%`,
            top: `${orb.y}%`,
            animation: `float ${orb.duration}s infinite alternate ease-in-out`,
            animationDelay: `${orb.delay}s`,
            pointerEvents: "none",
          }}
        />
      ))}

      {/* Mouse follow effect */}
      {mounted && (
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-30 transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle 800px at ${mousePosition.x}px ${mousePosition.y}px, rgba(139, 92, 246, 0.15), transparent 80%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10 flow-root">{children}</div>

      {/* CSS for floating animation */}
      <style jsx global>{`
        @keyframes float {
          0% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-30px) translateX(15px);
          }
          100% {
            transform: translateY(0) translateX(0);
          }
        }
      `}</style>
    </div>
  )
}

