"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Verify: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const checkVerification = async () => {
    setIsLoading(true);
    setVerificationMessage('');
    
    const user = auth.currentUser;
    if (user) {
      console.log('User before reload:', user);
      await user.reload();
      console.log('User after reload:', user);
      if (user.emailVerified) {
        console.log('Email is verified');
        const userDoc = doc(db, 'users', user.uid);
        try {
          await updateDoc(userDoc, { isVerified: true });
          console.log('Firestore document updated');
          toast.success('Email verified successfully!');
          router.push('/auth/signin');
        } catch (error) {
          console.error('Error updating Firestore:', error);
          toast.error('Failed to update verification status.');
        }
      } else {
        console.log('Email not verified');
        toast.error('Please verify your email first.');
        setVerificationMessage('Your email is not verified yet. Please check your inbox and spam folder for the verification email.');
      }
    } else {
      console.log('No user is currently signed in.');
      setVerificationMessage('No user is currently signed in. Please sign up again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-4">Email Verification</h1>
      <p className="text-center mb-6">Please check your email and click the verification link we sent you.</p>
      
      {verificationMessage && (
        <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/50 text-amber-200 rounded-md">
          {verificationMessage}
        </div>
      )}
      
      <button
        onClick={checkVerification}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
      >
        {isLoading ? 'Checking...' : 'Check Verification'}
      </button>
    </div>
  );
};

export default Verify;
