"use client"

import { useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { useSubscription } from "@/hooks/use-subscription"

export function SubscriptionBanner() {
  const { subscriptionTier } = useSubscription()
  const [dismissed, setDismissed] = useState(false)

  // Don't show banner for subscribers
  if (subscriptionTier !== "none" || dismissed) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-violet-900/30 to-indigo-900/30 border-b border-violet-800/20">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-zinc-300">
              <span className="font-medium text-violet-300">Subscribe now</span> to unlock all marketplace features
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/subscribe"
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-white/20"
            >
              View Plans
            </Link>
            <button
              onClick={() => setDismissed(true)}
              className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

