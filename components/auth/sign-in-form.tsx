"use client"

import React from 'react';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { motion } from "framer-motion";
import { auth, db } from '../../lib/firebaseConfig';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

// Form schema
const formSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  rememberMe: z.boolean(), // Ensure this is a required boolean
});

type FormData = z.infer<typeof formSchema>;

export function SignInForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false, // Ensure this matches the schema
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);

    try {
      // Sign in user with email and password
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      // Check if email is verified
      if (!user.emailVerified) {
        toast.error('Please verify your email before logging in');
        await signOut(auth);
        return;
      }

      // Fetch user document from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (!userData.isVerified) {
          toast.error('Please verify your email before logging in');
          await signOut(auth);
          return;
        }
      }

      // Proceed with login
      toast.success('Successfully logged in');
      router.push('/dashboard'); // Redirect to a protected route
    } catch (error) {
      toast.error('Error signing in: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-zinc-300">
            Password
          </label>
          <Link href="/auth/forgot-password" className="text-xs text-zinc-400 hover:text-white transition-colors">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
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

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="rememberMe"
            {...register("rememberMe")}
            className="border-zinc-700 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600"
          />
          <label htmlFor="rememberMe" className="text-sm font-medium text-zinc-300 leading-none">
            Remember Me
          </label>
        </div>
        <Link href="/auth/forgot-password" className="text-xs text-zinc-400 hover:text-white transition-colors">
          Forgot password?
        </Link>
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
            "Sign In"
          )}
        </motion.button>
      </div>
    </form>
  );
}