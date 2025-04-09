import type { Metadata } from "next"
import { AuthCard } from "@/components/auth/auth-card"
import { SignInForm } from "@/components/auth/sign-in-form"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Sign In - TextMarket",
  description: "Sign in to your TextMarket account",
}

export default function SignInPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-24 md:py-32 mt-12">
      <div className="w-full max-w-md">
        <AuthCard
          title="Sign In to Your Account"
          footer={
            <div className="text-sm text-zinc-400">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-violet-400 hover:text-violet-300 transition-colors">
                Sign Up
              </Link>
            </div>
          }
        >
          <SignInForm />
        </AuthCard>
      </div>
    </div>
  )
}

