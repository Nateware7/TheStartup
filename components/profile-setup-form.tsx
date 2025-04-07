"use client"

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { auth, db } from '@/lib/firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Cloudinary } from "@cloudinary/url-gen";

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME // Use environment variable
  }
});

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  bio: z.string().max(150, "Bio must be less than 150 characters"),
  banner: z.any(),
  profilePicture: z.any(),
});

type FormData = z.infer<typeof formSchema>;

export function ProfileSetupForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const uploadToCloudinary = async (file: File, folder: string) => {
    if (!file) return null;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'profilesetup');
    formData.append('folder', folder);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      if (data.error) {
        console.error("Cloudinary error:", data.error);
        return null;
      }
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      // Check if user is verified
      if (!user.emailVerified) {
        toast.error("Please verify your email before setting up your profile");
        router.push('/verify');
        setIsLoading(false);
        return;
      }

      // Prepare update data
      const updateData: Record<string, any> = {
        username: data.username,
        bio: data.bio,
        updatedAt: new Date(),
      };

      // Upload images if provided
      if (data.banner && data.banner[0]) {
        const bannerUrl = await uploadToCloudinary(data.banner[0], `users/${user.uid}/banners`);
        if (bannerUrl) updateData.banner = bannerUrl;
      } else {
        // Use placeholder if no image uploaded
        updateData.banner = `https://placehold.co/1200x300/36393f/FFFFFF?text=${data.username}+Banner`;
      }

      if (data.profilePicture && data.profilePicture[0]) {
        const profileUrl = await uploadToCloudinary(data.profilePicture[0], `users/${user.uid}/profiles`);
        if (profileUrl) updateData.profilePicture = profileUrl;
      } else {
        // Use placeholder if no image uploaded
        updateData.profilePicture = `https://placehold.co/400x400/36393f/FFFFFF?text=${data.username.charAt(0).toUpperCase()}`;
      }

      // Update Firestore document with available data
      await updateDoc(doc(db, 'users', user.uid), updateData);

      toast.success('Profile updated successfully!');
      router.push('/dashboard'); // Redirect to dashboard after completion
    } catch (error) {
      toast.error('Error updating profile: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
          Username
        </label>
        <Input
          id="username"
          type="text"
          placeholder="Enter your username"
          {...register("username")}
          className={`bg-zinc-900/50 border-zinc-800 focus:border-violet-500 ${errors.username ? "border-red-500" : ""}`}
        />
        {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="bio" className="block text-sm font-medium text-zinc-300">
          Bio
        </label>
        <textarea
          id="bio"
          placeholder="Tell us about yourself"
          {...register("bio")}
          className={`w-full p-2 rounded-md bg-zinc-900/50 border border-zinc-800 focus:border-violet-500 focus:outline-none ${errors.bio ? "border-red-500" : ""}`}
        />
        {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
      </div>

      <div className="space-y-2">
        <label htmlFor="profilePicture" className="block text-sm font-medium text-zinc-300">
          Profile Picture
        </label>
        <input
          id="profilePicture"
          type="file"
          accept="image/*"
          {...register("profilePicture")}
          className="w-full p-2 rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300"
        />
        <p className="text-xs text-zinc-400">Square image recommended (e.g., 400 × 400 pixels)</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="banner" className="block text-sm font-medium text-zinc-300">
          Banner Image
        </label>
        <input
          id="banner"
          type="file"
          accept="image/*"
          {...register("banner")}
          className="w-full p-2 rounded-md bg-zinc-900/50 border border-zinc-800 text-zinc-300"
        />
        <p className="text-xs text-zinc-400">Recommended size: 1200 × 300 pixels</p>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2.5 px-4 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium hover:from-violet-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all disabled:opacity-70"
        >
          {isLoading ? 'Updating Profile...' : 'Complete Profile'}
        </button>
      </div>
    </form>
  );
}
