import type { Metadata } from "next";
import { AuthCard } from "../../../components/auth/auth-card";
import Link from "next/link";
import { PasswordResetForm } from "../../../components/auth/password-reset-form";

export const metadata: Metadata = {
  title: "Password Reset - TextMarket",
  description: "Reset your TextMarket account password",
};

export default function PasswordResetPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12 md:py-16">
      <div className="w-full max-w-md">
        <AuthCard
          title="Reset Your Password"
          footer={
            <div className="text-sm text-zinc-400">
              Remember your password?{" "}
              <Link href="/auth/signin" className="text-violet-400 hover:text-violet-300 transition-colors">
                Sign In
              </Link>
            </div>
          }
        >
          <PasswordResetForm />
        </AuthCard>
      </div>
    </div>
  );
}