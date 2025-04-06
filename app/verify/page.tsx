"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../../lib/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';

const Verify: React.FC = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const checkVerification = async () => {
    setIsLoading(true);
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
      }
    } else {
      console.log('No user is currently signed in.');
    }
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-xl mb-4">Verifying your email...</h1>
      <button
        onClick={checkVerification}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Checking...' : 'Check Verification'}
      </button>
    </div>
  );
};

export default Verify;
