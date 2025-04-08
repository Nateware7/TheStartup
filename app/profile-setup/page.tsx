"use client"

import React, { useEffect, useState } from 'react';
import { ProfileSetupForm } from '@/components/profile-setup-form';
import { AnimatedBackground } from '@/components/animated-background';
import { Navbar } from '@/components/navbar';
import { auth } from '@/lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import toast from 'react-hot-toast';
import { Loader } from 'lucide-react';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      
      if (!user) {
        // If no user is signed in, redirect to sign in
        toast.error("Please sign in to access this page");
        router.push('/auth/signin');
        return;
      } 
      
      // If user is signed in but not verified, redirect to verification page
      await user.reload(); // Refresh user data to get latest verification status
      if (!user.emailVerified) {
        toast.error("Please verify your email before setting up your profile");
        router.push('/verify');
        return;
      }
      
      // User is logged in and verified, allow access to page
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen text-white">
          <Navbar />
          <div className="container mx-auto px-4 pt-20 pb-16 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin mr-3" />
            <span>Checking authentication...</span>
          </div>
        </div>
      </AnimatedBackground>
    );
  }

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
