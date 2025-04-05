"use client"

import { CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

const products = [
  {
    id: "1",
    title: "Future Bass Sample Pack",
    description: "Premium audio samples for modern electronic music production",
    price: 49.99,
    bid: null,
    category: "Music",
    seller: {
      name: "BeatMaker",
      verified: true,
    },
  },
  {
    id: "2",
    title: "Crypto Trading Guide",
    description: "Comprehensive eBook on cryptocurrency trading strategies",
    price: 29.99,
    bid: 32.5,
    category: "eBooks",
    seller: {
      name: "CryptoGuru",
      verified: true,
    },
  },
  {
    id: "3",
    title: "Minimal Portfolio Template",
    description: "Clean, responsive HTML/CSS template for creative portfolios",
    price: 19.99,
    bid: null,
    category: "Templates",
    seller: {
      name: "DesignStudio",
      verified: true,
    },
  },
  {
    id: "4",
    title: "React Component Library",
    description: "50+ custom React components with TypeScript support",
    price: 79.99,
    bid: 85.0,
    category: "Code",
    seller: {
      name: "DevMaster",
      verified: false,
    },
  },
  {
    id: "5",
    title: "Ambient Soundscapes",
    description: "Atmospheric audio tracks for meditation and focus",
    price: 24.99,
    bid: null,
    category: "Music",
    seller: {
      name: "SoundArtist",
      verified: true,
    },
  },
  {
    id: "6",
    title: "Digital Marketing Playbook",
    description: "Strategic guide to modern digital marketing tactics",
    price: 34.99,
    bid: 38.5,
    category: "eBooks",
    seller: {
      name: "MarketingPro",
      verified: true,
    },
  },
  {
    id: "7",
    title: "Admin Dashboard UI Kit",
    description: "Complete dashboard interface with dark and light themes",
    price: 59.99,
    bid: null,
    category: "Templates",
    seller: {
      name: "UIDesigner",
      verified: true,
    },
  },
  {
    id: "8",
    title: "Neural Network Framework",
    description: "Lightweight ML framework for JavaScript applications",
    price: 129.99,
    bid: 145.0,
    category: "Code",
    seller: {
      name: "AIEngineer",
      verified: true,
    },
  },
  {
    id: "9",
    title: "Lo-Fi Beat Collection",
    description: "Relaxing beats for study and work sessions",
    price: 19.99,
    bid: null,
    category: "Music",
    seller: {
      name: "ChillProducer",
      verified: false,
    },
  },
  {
    id: "10",
    title: "UX Design Principles",
    description: "In-depth guide to modern user experience design",
    price: 39.99,
    bid: 42.0,
    category: "eBooks",
    seller: {
      name: "UXMaster",
      verified: true,
    },
  },
  {
    id: "11",
    title: "SaaS Landing Page Template",
    description: "Conversion-optimized template for software services",
    price: 29.99,
    bid: null,
    category: "Templates",
    seller: {
      name: "ConversionPro",
      verified: true,
    },
  },
  {
    id: "12",
    title: "Data Visualization Library",
    description: "Interactive charts and graphs for web applications",
    price: 69.99,
    bid: 75.0,
    category: "Code",
    seller: {
      name: "DataVizWizard",
      verified: true,
    },
  },
]

export function MarketplaceGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}

function ProductCard({ product }) {
  return (
    <div className="group flex h-full flex-col rounded-xl bg-zinc-900/50 p-6 shadow-lg shadow-violet-500/5 backdrop-blur-sm transition-all hover:shadow-violet-500/10">
      <div className="mb-2 flex items-center justify-between">
        <div className="inline-block rounded-full bg-zinc-800 px-2.5 py-1 text-xs text-zinc-400">
          {product.category}
        </div>
        <div className="flex items-center gap-1 text-sm text-zinc-400">
          <span>{product.seller.name}</span>
          {product.seller.verified && <CheckCircle className="h-3.5 w-3.5 fill-blue-500 text-white" />}
        </div>
      </div>

      <h3 className="mb-2 text-xl font-bold text-white">{product.title}</h3>
      <p className="mb-6 flex-grow text-sm text-zinc-400">{product.description}</p>

      <div className="mt-auto space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-lg font-bold text-white">${product.price.toFixed(2)}</div>
            {product.bid && <div className="text-sm text-green-400">Current bid: ${product.bid.toFixed(2)}</div>}
          </div>
        </div>

        <div className="flex gap-2">
          {product.bid ? (
            <Button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
              Place Bid
            </Button>
          ) : (
            <Button className="flex-1 bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
              Buy Now
            </Button>
          )}
          <Button variant="outline" className="border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700">
            Details
          </Button>
        </div>
      </div>
    </div>
  )
}

