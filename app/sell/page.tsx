"use client"

import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { SellForm } from "@/components/sell-form"
import { useSubscription } from "@/hooks/use-subscription"
import { AccessRestrictedModal } from "@/components/access-restricted-modal"
import { useRouter } from "next/navigation"

export default function SellPage() {
  const router = useRouter()
  const { canPerformAction, subscriptionTier } = useSubscription()
  const [showModal, setShowModal] = useState(false)

  // Check if user can access this page
  useEffect(() => {
    if (!canPerformAction("sell")) {
      setShowModal(true)
    }
  }, [canPerformAction])

  // Redirect if modal is closed
  const handleModalClose = () => {
    setShowModal(false)
    if (!canPerformAction("sell")) {
      router.push("/subscribe")
    }
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        <main className="container mx-auto px-4 pt-24 pb-20">
          <div className="mx-auto max-w-4xl">
            {/* Page Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold md:text-4xl">Sell a Username or Account</h1>
              <p className="mt-2 text-zinc-400">
                List a verified username or account for fixed price or auction. All listings are manually reviewed.
              </p>
            </div>

            {/* Sell Form - Only shown if user has permission */}
            {canPerformAction("sell") && <SellForm />}
          </div>
        </main>

        {/* Access Restricted Modal */}
        <AccessRestrictedModal
          isOpen={showModal}
          onClose={handleModalClose}
          requiredTier="pro"
          currentTier={subscriptionTier}
          actionType="sell"
        />
      </div>
    </AnimatedBackground>
  )
}

