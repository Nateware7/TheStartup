import type { Metadata } from "next"
import { AuthCard } from "@/components/auth/auth-card"
import { SignUpForm } from "@/components/auth/sign-up-form"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sign Up - TextMarket",
  description: "Create a new TextMarket account",
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-md">
        <AuthCard
          title="Create an Account"
          footer={
            <div className="text-sm text-zinc-400">
              Already have an account?{" "}
              <Link href="/auth/signin" className="text-violet-400 hover:text-violet-300 transition-colors">
                Sign In
              </Link>
            </div>
          }
        >
          <SignUpForm />
        </AuthCard>
      </div>
    </div>
  )
}

