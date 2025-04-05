"use client"
import Image from "next/image"
import Link from "next/link"
import { MoreHorizontal, Edit, Trash, Eye, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { products } from "@/lib/products"

// Use the first 4 products from our products library
const listings = products.slice(0, 4).map((product) => ({
  id: product.id,
  title: product.title,
  type: product.category,
  price: product.price,
  status: "Active",
  sales: product.stats?.sales || 0,
  views: Math.floor(Math.random() * 400) + 100, // Random views between 100-500
  image: "/placeholder.svg?height=600&width=600",
  date: "2023-11-10",
}))

export function DashboardListings() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button className="bg-gradient-to-r from-blue-500 to-violet-500 text-white hover:from-blue-600 hover:to-violet-600">
          <Plus className="mr-2 h-4 w-4" />
          Add New Listing
        </Button>
      </div>

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Type</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Price</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Sales</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Views</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b border-zinc-800">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-md">
                        <Image
                          src={listing.image || "/placeholder.svg"}
                          alt={listing.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <span className="font-medium">{listing.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{listing.type}</td>
                  <td className="px-4 py-3 text-sm">${listing.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2 py-1 text-xs ${
                        listing.status === "Active" ? "bg-green-500/10 text-green-500" : "bg-zinc-500/10 text-zinc-400"
                      }`}
                    >
                      {listing.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{listing.sales}</td>
                  <td className="px-4 py-3 text-sm">{listing.views}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{listing.date}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40 bg-zinc-900 text-white">
                        <Link href={`/product/${listing.id}`}>
                          <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 hover:text-white cursor-pointer">
                            <Eye className="h-4 w-4" />
                            <span>View</span>
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="flex items-center gap-2 text-zinc-400 hover:text-white">
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="flex items-center gap-2 text-red-500 hover:text-red-400">
                          <Trash className="h-4 w-4" />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

