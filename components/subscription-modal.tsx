"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CreditCard, CheckCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  plan: "basic" | "pro" | null
  isLoading: boolean
}

export function SubscriptionModal({ isOpen, onClose, onConfirm, plan, isLoading }: SubscriptionModalProps) {
  const [step, setStep] = useState<"confirm" | "payment" | "success">("confirm")
  const [paymentDetails, setPaymentDetails] = useState({
    cardNumber: "",
    cardName: "",
    expiry: "",
    cvc: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (step === "confirm") {
      setStep("payment")
      return
    }

    if (step === "payment") {
      // Process payment
      await onConfirm()
      setStep("success")

      // Reset form after success
      setTimeout(() => {
        setStep("confirm")
        setPaymentDetails({
          cardNumber: "",
          cardName: "",
          expiry: "",
          cvc: "",
        })
      }, 3000)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setPaymentDetails((prev) => ({ ...prev, [name]: value }))
  }

  const planDetails = {
    basic: {
      title: "Basic Plan",
      price: "$5/month",
      features: ["Buy usernames and accounts", "Bid on auction listings", "Access to marketplace"],
    },
    pro: {
      title: "Pro Plan",
      price: "$15/month",
      features: [
        "Buy usernames and accounts",
        "Bid on auction listings",
        "Access to marketplace",
        "Sell usernames and accounts",
        "Featured listings",
      ],
    },
  }

  if (!isOpen || !plan) return null

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
              disabled={isLoading}
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              {step === "confirm" && (
                <div>
                  <h2 className="mb-4 text-xl font-bold text-white">Confirm Subscription</h2>
                  <div className="mb-6 rounded-lg bg-zinc-800/50 p-4">
                    <h3 className="mb-2 font-medium text-white">{planDetails[plan].title}</h3>
                    <p className="mb-3 text-lg font-bold text-violet-400">{planDetails[plan].price}</p>
                    <div className="space-y-1">
                      {planDetails[plan].features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="mr-2 h-4 w-4 text-emerald-500" />
                          <span className="text-zinc-300">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => setStep("payment")}
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                  >
                    Continue to Payment
                  </Button>
                </div>
              )}

              {step === "payment" && (
                <form onSubmit={handleSubmit}>
                  <h2 className="mb-4 text-xl font-bold text-white">Payment Details</h2>
                  <div className="mb-6 space-y-4">
                    <div>
                      <label className="mb-1 block text-sm text-zinc-400">Card Number</label>
                      <input
                        type="text"
                        name="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={paymentDetails.cardNumber}
                        onChange={handleChange}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm text-zinc-400">Cardholder Name</label>
                      <input
                        type="text"
                        name="cardName"
                        placeholder="John Doe"
                        value={paymentDetails.cardName}
                        onChange={handleChange}
                        className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">Expiry Date</label>
                        <input
                          type="text"
                          name="expiry"
                          placeholder="MM/YY"
                          value={paymentDetails.expiry}
                          onChange={handleChange}
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-sm text-zinc-400">CVC</label>
                        <input
                          type="text"
                          name="cvc"
                          placeholder="123"
                          value={paymentDetails.cvc}
                          onChange={handleChange}
                          className="w-full rounded-md border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder:text-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-4 w-4" />
                        Pay {plan === "basic" ? "$5.00" : "$15.00"}
                      </>
                    )}
                  </Button>
                </form>
              )}

              {step === "success" && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-white">Payment Successful!</h2>
                  <p className="mb-6 text-zinc-400">
                    Thank you for subscribing to the {plan === "basic" ? "Basic" : "Pro"} plan. Your subscription is now
                    active.
                  </p>
                  <Button onClick={onClose} className="w-full bg-zinc-800 text-white hover:bg-zinc-700">
                    Close
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

