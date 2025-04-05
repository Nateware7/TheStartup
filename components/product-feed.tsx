"use client"

import { ProductCard } from "@/components/product-card"

const products = [
  {
    id: "1",
    title: "Advanced React Component Library",
    description: "50+ custom React components with TypeScript support and comprehensive documentation",
    price: 79.99,
    bid: 85.0,
    category: "Code",
    seller: {
      name: "DevMaster",
      handle: "@devmaster",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "2",
    title: "Crypto Trading Guide 2025",
    description: "Comprehensive strategies for cryptocurrency trading success with real-world case studies",
    price: 29.99,
    bid: 32.5,
    category: "eBooks",
    seller: {
      name: "CryptoGuru",
      handle: "@cryptoguru",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "3",
    title: "Minimal Portfolio Template",
    description: "Clean, responsive HTML/CSS template for creative portfolios with dark and light modes",
    price: 19.99,
    bid: null,
    category: "Templates",
    seller: {
      name: "DesignStudio",
      handle: "@designstudio",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "4",
    title: "Future Bass Sample Pack Vol. 3",
    description: "Premium audio samples for modern electronic music production, royalty-free",
    price: 49.99,
    bid: null,
    category: "Music",
    seller: {
      name: "BeatMaker",
      handle: "@beatmaker",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: false,
    },
  },
  {
    id: "5",
    title: "UX Design Principles",
    description: "In-depth guide to modern user experience design with practical exercises",
    price: 39.99,
    bid: 42.0,
    category: "eBooks",
    seller: {
      name: "UXMaster",
      handle: "@uxmaster",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
  {
    id: "6",
    title: "Admin Dashboard UI Kit",
    description: "Complete dashboard interface with dark and light themes, charts, and data visualizations",
    price: 59.99,
    bid: null,
    category: "Templates",
    seller: {
      name: "UIDesigner",
      handle: "@uidesigner",
      avatar: "/placeholder.svg?height=100&width=100",
      verified: true,
    },
  },
]

export function ProductFeed() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

