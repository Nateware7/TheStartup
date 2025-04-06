"use client"

import React, { useState } from 'react';
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { auth, db } from '../../lib/firebaseConfig';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

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
      });

      // Show success toast
      toast.success('Check your email to verify');
      router.push('/verify');
    } catch (error) {
      // Show error toast
      toast.error('Error signing up: ' + (error as Error).message);
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
      </div>
    </form>
  )
}

