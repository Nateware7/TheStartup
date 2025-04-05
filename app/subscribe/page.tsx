import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { SubscriptionPlans } from "@/components/subscription-plans"

export default function SubscribePage() {
  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        <main className="container mx-auto px-4 pt-24 pb-20">
          <div className="mx-auto max-w-5xl">
            {/* Page Header */}
            <div className="mb-12 text-center">
              <h1 className="text-3xl font-bold md:text-4xl">TextMarket Membership</h1>
              <p className="mt-4 text-lg text-zinc-400">
                Choose the plan that's right for you and unlock premium features
              </p>
            </div>

            {/* Subscription Plans */}
            <SubscriptionPlans />

            {/* Additional Information */}
            <div className="mt-16 rounded-xl border border-zinc-800/50 bg-zinc-900/50 p-6 backdrop-blur-sm">
              <h2 className="mb-4 text-xl font-semibold">Membership Benefits</h2>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="font-medium text-violet-400">Secure Transactions</h3>
                  <p className="text-sm text-zinc-400">
                    All transactions are protected by our secure payment system and buyer protection policy.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-violet-400">Premium Support</h3>
                  <p className="text-sm text-zinc-400">
                    Get priority support from our team for any questions or issues you may have.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-violet-400">Cancel Anytime</h3>
                  <p className="text-sm text-zinc-400">
                    No long-term commitments. You can cancel your subscription at any time.
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <div className="mt-12">
              <h2 className="mb-6 text-center text-2xl font-bold">Frequently Asked Questions</h2>
              <div className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 font-medium">What happens when I upgrade my plan?</h3>
                  <p className="text-sm text-zinc-400">
                    When you upgrade, you'll immediately gain access to all the features included in your new plan. Your
                    billing will be prorated for the remainder of your billing cycle.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 font-medium">Can I downgrade my subscription?</h3>
                  <p className="text-sm text-zinc-400">
                    Yes, you can downgrade your subscription at any time. The changes will take effect at the end of
                    your current billing cycle.
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4">
                  <h3 className="mb-2 font-medium">How do I cancel my subscription?</h3>
                  <p className="text-sm text-zinc-400">
                    You can cancel your subscription from your account settings. Your subscription will remain active
                    until the end of your current billing period.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AnimatedBackground>
  )
}

