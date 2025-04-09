import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { MessageCenter } from "@/components/message-center"

export default function MessagesPage() {
  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />

        <main className="container mx-auto px-4 pt-24 pb-20">
          <div className="mx-auto max-w-7xl">
            {/* Page Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold md:text-4xl">Messages</h1>
              <p className="mt-2 text-zinc-400">Communicate with other users on the platform.</p>
            </div>

            {/* Messages Content */}
            <MessageCenter />
          </div>
        </main>
      </div>
    </AnimatedBackground>
  )
} 