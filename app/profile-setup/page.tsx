"use client"

import React, { useEffect } from 'react';
import { ProfileSetupForm } from '@/components/profile-setup-form';
import { AnimatedBackground } from '@/components/animated-background';
import { Navbar } from '@/components/navbar';
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
      <div className="min-h-screen text-white">
        <Navbar />
        
        <div className="container mx-auto px-4 pt-20 pb-16">
          <div className="max-w-2xl mx-auto">
            <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/60 shadow-xl overflow-hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-2 text-center">Complete Your Profile</h1>
                <p className="text-zinc-400 mb-8 text-center">
                  Share a bit about yourself to help others connect with you.
                </p>
                <ProfileSetupForm />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
