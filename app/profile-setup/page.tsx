"use client"

import React, { useEffect } from 'react';
import { ProfileSetupForm } from '@/components/profile-setup-form';
import { AnimatedBackground } from '@/components/animated-background';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';

export default function ProfileSetupPage() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // If no user is signed in, redirect to sign in
        toast.error("Please sign in to access this page");
        router.push('/auth/signin');
      } else {
        // If user is signed in but not verified, redirect to verification page
        await user.reload(); // Refresh user data
        if (!user.emailVerified) {
          toast.error("Please verify your email before setting up your profile");
          router.push('/verify');
        }
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white flex flex-col items-center justify-center">
        <div className="w-full max-w-md px-6 py-8 bg-black/20 backdrop-blur-lg rounded-xl shadow-xl">
          <h1 className="text-2xl font-bold mb-6 text-center">Complete Your Profile</h1>
          <p className="text-zinc-400 mb-6 text-center">
            Share a bit about yourself to help others connect with you.
          </p>
          <ProfileSetupForm />
        </div>
      </div>
    </AnimatedBackground>
  );
}
