"use client"
import { motion, AnimatePresence } from "framer-motion"
import { X, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface AccessRestrictedModalProps {
  isOpen: boolean
  onClose: () => void
  requiredTier: "basic" | "pro"
  currentTier: "none" | "basic" | "pro"
  actionType: "buy" | "bid" | "sell"
}

export function AccessRestrictedModal({
  isOpen,
  onClose,
  requiredTier,
  currentTier,
  actionType,
}: AccessRestrictedModalProps) {
  if (!isOpen) return null

  const actionText = {
    buy: "purchase items",
    bid: "place bids",
    sell: "sell items",
  }

  const tierText = {
    basic: "Basic",
    pro: "Pro",
  }

  const isUpgrade = currentTier === "basic" && requiredTier === "pro"

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-md overflow-hidden rounded-xl bg-zinc-900 shadow-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/20">
                <Lock className="h-8 w-8 text-violet-400" />
              </div>

              <h2 className="mb-2 text-xl font-bold text-white">
                {isUpgrade ? "Upgrade Required" : "Subscription Required"}
              </h2>

              <p className="mb-6 text-zinc-400">
                {isUpgrade
                  ? `You need to upgrade to the ${tierText[requiredTier]} plan to ${actionText[actionType]}.`
                  : `You need a subscription to ${actionText[actionType]}. Subscribe to the ${tierText[requiredTier]} plan to unlock this feature.`}
              </p>

              <div className="space-y-3">
                <Link href="/subscribe" className="block w-full">
                  <Button className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700">
                    {isUpgrade ? "Upgrade Now" : "Subscribe Now"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Button
                  onClick={onClose}
                  variant="outline"
                  className="w-full border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                >
                  Maybe Later
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

