"use client"
import Image from "next/image"
import { Download, ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"

const sales = [
  {
    id: "1",
    product: {
      id: "1",
      title: "Neon Dreams Collection",
      image: "/placeholder.svg?height=600&width=600",
    },
    buyer: {
      name: "DigitalFan",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    amount: 89.99,
    date: "2023-11-20",
    status: "completed",
  },
  {
    id: "2",
    product: {
      id: "2",
      title: "Cyberpunk Icon Set",
      image: "/placeholder.svg?height=600&width=600",
    },
    buyer: {
      name: "WebDesigner",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    amount: 29.99,
    date: "2023-11-18",
    status: "completed",
  },
  {
    id: "3",
    product: {
      id: "4",
      title: "Futuristic UI Elements",
      image: "/placeholder.svg?height=600&width=600",
    },
    buyer: {
      name: "AppDeveloper",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    amount: 59.99,
    date: "2023-11-15",
    status: "processing",
  },
  {
    id: "4",
    product: {
      id: "1",
      title: "Neon Dreams Collection",
      image: "/placeholder.svg?height=600&width=600",
    },
    buyer: {
      name: "ArtCollector",
      avatar: "/placeholder.svg?height=100&width=100",
    },
    amount: 89.99,
    date: "2023-11-10",
    status: "completed",
  },
]

export function DashboardSales() {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Product</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Buyer</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id} className="border-b border-zinc-800">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 overflow-hidden rounded-md">
                      <Image
                        src={sale.product.image || "/placeholder.svg"}
                        alt={sale.product.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="font-medium">{sale.product.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="relative h-6 w-6 overflow-hidden rounded-full">
                      <Image
                        src={sale.buyer.avatar || "/placeholder.svg"}
                        alt={sale.buyer.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <span className="text-sm">{sale.buyer.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 font-medium">${sale.amount.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-zinc-400">{sale.date}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2 py-1 text-xs ${
                      sale.status === "completed"
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {sale.status === "completed" ? "Completed" : "Processing"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

