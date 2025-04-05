"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { SubscriptionModal } from "@/components/subscription-modal"
import { useSubscription } from "@/hooks/use-subscription"

export function SubscriptionPlans() {
  const { toast } = useToast()
  const { user, subscriptionTier, subscribe, isLoading } = useSubscription()
  const [showModal, setShowModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<"basic" | "pro" | null>(null)

  const handleSubscribe = async (plan: "basic" | "pro") => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to subscribe to a plan",
        variant: "destructive",
      })
      return
    }

    if (subscriptionTier === plan) {
      toast({
        title: "Already subscribed",
        description: `You are already subscribed to the ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan`,
      })
      return
    }

    setSelectedPlan(plan)
    setShowModal(true)
  }

  const confirmSubscription = async () => {
    if (!selectedPlan) return

    try {
      await subscribe(selectedPlan)
      toast({
        title: "Subscription successful",
        description: `You are now subscribed to the ${selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} plan`,
      })
    } catch (error) {
      toast({
        title: "Subscription failed",
        description: "There was an error processing your subscription",
        variant: "destructive",
      })
    } finally {
      setShowModal(false)
    }
  }

  const plans = [
    {
      id: "basic",
      title: "Basic",
      price: "$5",
      period: "month",
      description: "Perfect for buyers looking for premium usernames and accounts",
      features: [
        { text: "Buy usernames and accounts", included: true },
        { text: "Bid on auction listings", included: true },
        { text: "Access to marketplace", included: true },
        { text: "Basic customer support", included: true },
        { text: "Sell usernames and accounts", included: false },
        { text: "Featured listings", included: false },
      ],
      highlight: false,
      buttonText: subscriptionTier === "basic" ? "Current Plan" : "Subscribe",
      disabled: subscriptionTier === "basic",
    },
    {
      id: "pro",
      title: "Pro",
      price: "$15",
      period: "month",
      description: "For power users who want to buy and sell premium digital assets",
      features: [
        { text: "Buy usernames and accounts", included: true },
        { text: "Bid on auction listings", included: true },
        { text: "Access to marketplace", included: true },
        { text: "Priority customer support", included: true },
        { text: "Sell usernames and accounts", included: true },
        { text: "Featured listings", included: true },
      ],
      highlight: true,
      buttonText: subscriptionTier === "pro" ? "Current Plan" : "Subscribe",
      disabled: subscriptionTier === "pro",
      popular: true,
    },
  ]

  return (
    <>
      <div className="grid gap-8 md:grid-cols-2">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`relative overflow-hidden rounded-xl border ${
              plan.highlight
                ? "border-violet-500/30 bg-gradient-to-b from-violet-950/30 to-zinc-900/90"
                : "border-zinc-800/50 bg-zinc-900/50"
            } p-6 backdrop-blur-sm`}
          >
            {plan.popular && (
              <div className="absolute -right-12 top-7 w-40 rotate-45 bg-gradient-to-r from-violet-600 to-indigo-600 py-1 text-center text-xs font-medium text-white shadow-lg">
                Most Popular
              </div>
            )}

            <div className="mb-6">
              <h2 className="text-2xl font-bold">{plan.title}</h2>
              <div className="mt-2 flex items-baseline">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="ml-1 text-zinc-400">/{plan.period}</span>
              </div>
              <p className="mt-2 text-sm text-zinc-400">{plan.description}</p>
            </div>

            <div className="mb-6 space-y-3">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  {feature.included ? (
                    <Check className="mr-2 h-5 w-5 text-emerald-500" />
                  ) : (
                    <X className="mr-2 h-5 w-5 text-zinc-600" />
                  )}
                  <span className={feature.included ? "text-zinc-200" : "text-zinc-500"}>{feature.text}</span>
                </div>
              ))}
            </div>

            <Button
              onClick={() => handleSubscribe(plan.id as "basic" | "pro")}
              disabled={plan.disabled || isLoading}
              className={`w-full ${
                plan.highlight
                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  : "bg-zinc-800 hover:bg-zinc-700"
              } text-white`}
            >
              {isLoading ? "Processing..." : plan.buttonText}
            </Button>

            {plan.disabled && (
              <p className="mt-2 text-center text-xs text-zinc-500">This is your current active subscription</p>
            )}
          </motion.div>
        ))}
      </div>

      <SubscriptionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={confirmSubscription}
        plan={selectedPlan}
        isLoading={isLoading}
      />
    </>
  )
}

