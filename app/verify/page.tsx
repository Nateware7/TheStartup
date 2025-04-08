"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { sendEmailVerification } from 'firebase/auth';
import toast from 'react-hot-toast';
import { AnimatedBackground } from '@/components/animated-background';
import { Navbar } from '@/components/navbar';
import { Button } from '@/components/ui/button';
import { Loader, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');
  const [lastSent, setLastSent] = useState<Date | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Timer for resend cooldown
  const [cooldown, setCooldown] = useState(0);
  
  useEffect(() => {
    // Check if user is logged in
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to verify your email");
      router.push('/auth/signin');
      return;
    }
    
    setUserEmail(user.email);
    
    // If already verified, redirect to dashboard
    if (user.emailVerified) {
      // Update Firestore status and redirect
      const updateVerificationStatus = async () => {
        try {
          await updateDoc(doc(db, 'users', user.uid), { isVerified: true });
          toast.success('Your email has been verified!');
          router.push('/profile-setup');
        } catch (error) {
          console.error('Error updating verification status:', error);
        }
      };
      
      updateVerificationStatus();
    }
  }, [router]);
  
  // Handle cooldown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldown]);

  const checkVerification = async () => {
    setIsLoading(true);
    setVerificationMessage('');
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setVerificationMessage('No user is currently signed in. Please sign in again.');
        toast.error('You must be logged in to verify your email');
        router.push('/auth/signin');
        return;
      }
      
      // Reload user to get the latest auth state
      try {
        await user.reload();
      } catch (reloadError) {
        console.error('Error reloading user:', reloadError);
        setVerificationMessage('Unable to refresh your verification status. Please try again.');
        toast.error('Failed to check verification status');
        setIsLoading(false);
        return;
      }
      
      if (user.emailVerified) {
        const userDoc = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDoc, { 
            isVerified: true,
            updatedAt: new Date()
          });
          toast.success('Email verified successfully!');
          
          // Check if the user already has a username (profile setup)
          const userDocSnapshot = await getDoc(userDoc);
          if (userDocSnapshot.exists() && userDocSnapshot.data().username) {
            router.push('/dashboard');
          } else {
            router.push('/profile-setup');
          }
        } catch (error) {
          console.error('Error updating Firestore:', error);
          toast.error('Your email is verified, but we had trouble updating your profile. Please try again.');
        }
      } else {
        setVerificationMessage(
          'Your email is not verified yet. Please check your inbox and spam folder for the verification email. ' +
          'Click the link in the email to verify your account.'
        );
        toast.error('Email not verified yet');
      }
    } catch (error) {
      console.error('Error checking verification:', error);
      setVerificationMessage('An error occurred while checking your verification status. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendVerificationEmail = async () => {
    setIsSending(true);
    
    const user = auth.currentUser;
    if (!user) {
      toast.error("You must be logged in to request verification");
      router.push('/auth/signin');
      return;
    }
    
    try {
      await sendEmailVerification(user);
      setLastSent(new Date());
      setCooldown(60); // 60 second cooldown
      toast.success('Verification email sent! Please check your inbox and spam folder.');
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      // Handle rate limiting error more gracefully
      if (error.code === 'auth/too-many-requests') {
        // Set a longer cooldown timer when rate-limited (5 minutes)
        setCooldown(300);
        toast.error('Too many verification emails sent. Please wait 5 minutes before trying again.');
        setVerificationMessage(
          'Firebase limits how frequently verification emails can be sent to prevent abuse. ' +
          'Please check your inbox and spam folder for previously sent emails, or wait 5 minutes to try again.'
        );
      } else {
        toast.error('Failed to send verification email. Please try again later.');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white flex flex-col">
        <Navbar />
        
        <div className="flex-1 flex items-center justify-center">
          <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto">
              <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/60 shadow-xl overflow-hidden">
                <div className="p-8 text-center">
                  <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-zinc-800/70 mb-6">
                    <Mail className="h-10 w-10 text-indigo-400" />
                  </div>
                  
                  <h1 className="text-2xl font-bold mb-2">Verify Your Email</h1>
                  <p className="text-zinc-400 mb-8">
                    We've sent a verification link to{' '}
                    <span className="text-white font-medium">{userEmail || 'your email'}</span>. 
                    Please check your inbox and spam folder.
                  </p>
                  
                  {verificationMessage && (
                    <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-lg">
                      {verificationMessage}
                    </div>
                  )}
                  
                  <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
                    <Button
                      onClick={checkVerification}
                      disabled={isLoading}
                      className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                    >
                      {isLoading ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Checking...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          I've Verified My Email
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={resendVerificationEmail}
                      disabled={isSending || cooldown > 0}
                      variant="outline"
                      className="border-zinc-700 text-white hover:bg-zinc-800"
                    >
                      {isSending ? (
                        <>
                          <Loader className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : cooldown > 0 ? (
                        <>
                          <div className="flex items-center">
                            <span className="mr-2">Resend in {cooldown}s</span>
                            <div className="w-12 h-1 bg-zinc-700 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-indigo-500"
                                style={{ 
                                  width: `${((cooldown > 300 ? 300 : cooldown) / 300) * 100}%`,
                                  transition: 'width 1s linear'
                                }}
                              />
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Resend Verification
                        </>
                      )}
                    </Button>
                  </div>
                  
                  <div className="text-sm text-zinc-500">
                    <p className="mb-2">
                      Need help? Contact our support team or go back to{' '}
                      <Link href="/" className="text-indigo-400 hover:text-indigo-300">
                        homepage
                      </Link>.
                    </p>
                    <p>
                      You won't be able to set up your profile or access all features until your email is verified.
                    </p>
                  </div>
                  
                  {/* Add a collapsible troubleshooting section */}
                  <div className="mt-8 pt-6 border-t border-zinc-800">
                    <details className="text-left">
                      <summary className="text-sm font-medium text-indigo-400 cursor-pointer hover:text-indigo-300">
                        Having trouble verifying your email?
                      </summary>
                      <div className="mt-4 px-4 py-3 rounded-lg bg-zinc-800/50 text-sm text-zinc-300">
                        <h3 className="font-medium mb-2">Troubleshooting Tips:</h3>
                        <ul className="space-y-2 list-disc pl-5">
                          <li>Check both your inbox and spam/junk folders</li>
                          <li>Make sure you're clicking the verification link in the most recent email</li>
                          <li>Some email providers may delay delivery - please wait up to 15 minutes</li>
                          <li>If using Gmail, check the "Promotions" or "Updates" tabs</li>
                          <li>Try using a different web browser if the verification link isn't working</li>
                          <li>Clear your browser cookies and cache, then try again</li>
                          <li>Ensure you're using the same device/browser you signed up with</li>
                        </ul>
                        
                        <h3 className="font-medium mt-4 mb-2">About Firebase's Rate Limiting:</h3>
                        <p className="text-zinc-400 mb-2">
                          For security reasons, Firebase limits how many verification emails can be sent to the same address 
                          in a short period of time. If you're seeing a "too many requests" error, please:
                        </p>
                        <ul className="space-y-2 list-disc pl-5">
                          <li>Check for previously sent emails before requesting a new one</li>
                          <li>Wait at least 5 minutes between attempts to resend verification emails</li>
                          <li>If you've made multiple attempts, use the most recent verification email</li>
                        </ul>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
}
