"use client";

import React, { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, db } from '../../lib/firebaseConfig';
import { sendPasswordResetEmail } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Form schema
const formSchema = z.object({
  email: z.string().email(),
});

type FormData = z.infer<typeof formSchema>;

export function PasswordResetForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsLoading(true);
    setStatus('idle');
    setMessage('');
    
    try {
      // First attempt to send the reset email
      await sendPasswordResetEmail(auth, data.email);
      toast.success('Reset email sent. Please check your inbox.');
      setStatus('success');
      setMessage('Reset email sent. Please check your inbox.');
    } catch (error) {
      // Firebase Auth throws an error when the email doesn't exist
      if ((error as Error).message.includes('user-not-found') || 
          (error as Error).message.includes('auth/user-not-found')) {
        toast.error('No account found with this email address');
        setStatus('error');
        setMessage('No account found with this email address');
      } else {
        toast.error('Error sending password reset email: ' + (error as Error).message);
        setStatus('error');
        setMessage('Error sending password reset email: ' + (error as Error).message);
      }
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
      
      {status !== 'idle' && (
        <div className={`p-3 rounded-md ${status === 'success' ? 'bg-green-900/20 border border-green-800' : 'bg-red-900/20 border border-red-800'}`}>
          <div className="flex items-center">
            {status === 'success' ? (
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            )}
            <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {message}
            </p>
          </div>
        </div>
      )}

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
              Sending Reset Email...
            </span>
          ) : (
            "Send Reset Email"
          )}
        </motion.button>
      </div>
    </form>
  );
} 