"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { auth, db } from '../../lib/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import Link from "next/link";

// Form schema with password confirmation
const formSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })

type FormData = z.infer<typeof formSchema>

export function SignUpForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSigningUp, setIsSigningUp] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Skip automatic redirect during the signup process
      if (user && !isSigningUp) {
        // Only redirect to dashboard if user is verified
        await user.reload(); // Refresh user data
        if (user.emailVerified) {
          router.push('/dashboard');
        }
      }
    });
    
    return () => unsubscribe();
  }, [router, isSigningUp]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    setIsSigningUp(true) // Set sign-up flag to prevent auto-redirect
    setFormError(null) // Clear previous errors

    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Create a Firestore document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        role: 'unverified',
        isVerified: false,
        profilePicture: '',
        bio: '',
        location: '',
        followers: 0,
        following: 0,
        sales: 0,
        rating: 0,
        badges: [],
        createdAt: new Date(),
        lastLogin: new Date(),
        subscriptionTier: 'none',
        notifications: {
          email: true,
          push: true,
          marketing: false
        },
      });

      // Show success toast
      toast.success('Check your email to verify');
      router.push('/verify');
    } catch (error) {
      // Handle specific Firebase auth errors
      const errorCode = (error as any)?.code;
      let errorMessage = '';
      
      if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      } else if (errorCode === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else {
        errorMessage = 'Error signing up: ' + (error as Error).message;
      }
      
      // Set form error and show toast
      setFormError(errorMessage);
      toast.error(errorMessage);
      setIsSigningUp(false); // Reset sign-up flag on error
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Form-level error message */}
      {formError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/50 p-3 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-500">{formError}</p>
        </div>
      )}
      
      <div className="space-y-2">
        <label htmlFor="email" className="block text-sm font-medium text-zinc-300">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="name@example.com"
          autoComplete="email"
          disabled={isLoading}
          {...register("email")}
          className={`bg-zinc-900/50 border-zinc-800 focus:border-violet-500 ${errors.email ? "border-red-500" : ""}`}
        />
        {errors.email && (
          <p className="text-sm text-red-500">
            {errors.email.message === "Invalid email" ? "Please enter a valid email" : "Email is required"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
          Password
        </label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("password")}
            className={`bg-zinc-900/50 border-zinc-800 focus:border-violet-500 ${errors.password ? "border-red-500" : ""} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-red-500">
            {errors.password.message === "String must contain at least 8 character(s)"
              ? "Password must be at least 8 characters"
              : "Password is required"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-zinc-300">
          Confirm Password
        </label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="new-password"
            disabled={isLoading}
            {...register("confirmPassword")}
            className={`bg-zinc-900/50 border-zinc-800 focus:border-violet-500 ${errors.confirmPassword ? "border-red-500" : ""} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-zinc-400"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && <p className="text-sm text-red-500">Passwords don't match</p>}
      </div>

      <div className="mt-6">
        <motion.button
          type="submit"
          disabled={isLoading}
          whileTap={{ scale: 0.98 }}
          className="w-full py-2.5 px-4 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </span>
          ) : (
            "Create Account"
          )}
        </motion.button>
        <p className="mt-2 text-xs text-zinc-400 text-center">
          After registration, you'll set up your profile with a unique username that cannot be changed later.
        </p>
      </div>
    </form>
  )
}

