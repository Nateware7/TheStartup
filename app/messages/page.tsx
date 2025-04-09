import { Navbar } from "@/components/navbar"
import { AnimatedBackground } from "@/components/animated-background"
import { MessageCenter } from "@/components/message-center"

export default function MessagesPage() {
  return (
    <AnimatedBackground>
      <div className="min-h-screen h-screen flex flex-col text-white overflow-hidden">
        <div className="sticky top-0 z-50">
          <Navbar />
        </div>

        <main className="flex-1 container mx-auto px-4 pt-20 pb-6 flex flex-col overflow-hidden">
          <div className="mx-auto max-w-7xl w-full flex flex-col flex-1 overflow-hidden">
            {/* Page Header */}
            <div className="mb-4 flex-shrink-0">
              <h1 className="text-3xl font-bold md:text-4xl">Messages</h1>
              <p className="mt-2 text-zinc-400">Communicate with other users on the platform.</p>
            </div>

            {/* Messages Content */}
            <div className="flex-1 overflow-hidden">
              <MessageCenter />
            </div>
          </div>
        </main>
      </div>
    </AnimatedBackground>
  )
} 