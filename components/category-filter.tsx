"use client"

import { useState } from "react"

const categories = [
  { id: "all", name: "All" },
  { id: "ebooks", name: "eBooks" },
  { id: "code", name: "Code" },
  { id: "templates", name: "Templates" },
  { id: "music", name: "Music" },
  { id: "art", name: "Digital Art" },
]

export function CategoryFilter() {
  const [activeCategory, setActiveCategory] = useState("all")

  return (
    <div className="mb-8 flex flex-wrap gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${
            activeCategory === category.id
              ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
              : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
          onClick={() => setActiveCategory(category.id)}
        >
          {category.name}
        </button>
      ))}
    </div>
  )
}

