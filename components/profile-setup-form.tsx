"use client"

import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Input } from "@/components/ui/input";
import { auth, db } from '@/lib/firebaseConfig';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Cloudinary } from "@cloudinary/url-gen";
import { ImageCropper } from '@/components/image-cropper';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ImageIcon, User } from 'lucide-react';

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME // Use environment variable
  }
});

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  bio: z.string().max(150, "Bio must be less than 150 characters"),
});

type FormData = z.infer<typeof formSchema>;

export function ProfileSetupForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  
  // State for image croppers and previews
  const [profileCropperOpen, setProfileCropperOpen] = useState(false);
  const [bannerCropperOpen, setBannerCropperOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null);
  const [croppedProfileBlob, setCroppedProfileBlob] = useState<Blob | null>(null);
  const [croppedBannerBlob, setCroppedBannerBlob] = useState<Blob | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [profilePreview, setProfilePreview] = useState<string | null>(null);

  // Handle profile picture file selection
  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setProfileImageFile(file);
      setProfileCropperOpen(true);
    }
  };

  // Handle banner image file selection
  const handleBannerImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setBannerImageFile(file);
      setBannerCropperOpen(true);
    }
  };
  
  // Handle profile crop completion
  const handleProfileCropComplete = (blob: Blob) => {
    setCroppedProfileBlob(blob);
    const previewUrl = URL.createObjectURL(blob);
    setProfilePreview(previewUrl);
  };
  
  // Handle banner crop completion
  const handleBannerCropComplete = (blob: Blob) => {
    setCroppedBannerBlob(blob);
    const previewUrl = URL.createObjectURL(blob);
    setBannerPreview(previewUrl);
  };

  const uploadToCloudinary = async (blob: Blob | null, folder: string) => {
    if (!blob) return null;

    const formData = new FormData();
    // Create a file from the blob
    const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
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
    setUsernameError(null); // Clear previous username errors
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      
      // Check if username is already taken
      const usersRef = collection(db, 'users');
      const usernameQuery = query(usersRef, where("username", "==", data.username));
      const querySnapshot = await getDocs(usernameQuery);
      
      if (!querySnapshot.empty) {
        setUsernameError('Username is already taken. Please choose a different one.');
        toast.error('Username is already taken. Please choose a different one.');
        setIsLoading(false);
        return;
      }
      
      // Prepare update data
      const updateData: Record<string, any> = {
        username: data.username,
        bio: data.bio,
        updatedAt: new Date(),
      };

      // Upload cropped images if provided
      if (croppedBannerBlob) {
        const bannerUrl = await uploadToCloudinary(croppedBannerBlob, `users/${user.uid}/banners`);
        if (bannerUrl) updateData.banner = bannerUrl;
      } else {
        // Use a plain black placeholder
        updateData.banner = `https://placehold.co/1200x300/000000/000000`;
      }

      if (croppedProfileBlob) {
        const profileUrl = await uploadToCloudinary(croppedProfileBlob, `users/${user.uid}/profiles`);
        if (profileUrl) updateData.profilePicture = profileUrl;
      } else {
        // Use a simple default profile image
        updateData.profilePicture = `https://placehold.co/400x400/333333/FFFFFF`;
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
    <>
      {usernameError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-md">
          <p className="text-red-500 font-medium flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {usernameError}
          </p>
        </div>
      )}
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
            className={`bg-zinc-900/50 border-zinc-800 focus:border-violet-500 ${errors.username || usernameError ? "border-red-500" : ""}`}
          />
          <p className="text-xs text-zinc-400">
            Choose carefully! Usernames are permanent and cannot be changed after your profile is created.
          </p>
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

        {/* Profile Picture Preview and Upload */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Profile Picture</h2>
          <div className="relative h-32 w-32 mx-auto overflow-hidden rounded-full border-4 border-zinc-800">
            {profilePreview ? (
              <Image 
                src={profilePreview} 
                alt="Profile preview" 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-zinc-800/50">
                <User className="h-8 w-8 text-zinc-600" />
              </div>
            )}
          </div>
          <div className="flex justify-center">
            <input
              id="profilePicture"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfileImageSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('profilePicture')?.click()}
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              {profilePreview ? 'Change Profile Picture' : 'Upload Profile Picture'}
            </Button>
          </div>
          <p className="text-center text-xs text-zinc-400">
            Square image recommended. Will be cropped to a circle.
          </p>
        </div>

        {/* Banner Image Preview and Upload */}
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-zinc-300">Banner Image</h2>
          <div className="relative h-40 w-full overflow-hidden rounded-lg border border-zinc-800">
            {bannerPreview ? (
              <Image 
                src={bannerPreview} 
                alt="Banner preview" 
                fill 
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-zinc-800/50">
                <ImageIcon className="h-8 w-8 text-zinc-600" />
                <span className="ml-2 text-zinc-600">No banner image</span>
              </div>
            )}
          </div>
          <div>
            <input
              id="banner"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerImageSelect}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('banner')?.click()}
              className="w-full border-zinc-700 text-white hover:bg-zinc-800"
            >
              {bannerPreview ? 'Change Banner Image' : 'Upload Banner Image'}
            </Button>
            <p className="mt-1 text-xs text-zinc-400">
              Recommended size: 1200 × 300 pixels. The banner will be cropped to 4:1 aspect ratio.
            </p>
          </div>
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

      {/* Image Croppers */}
      <ImageCropper
        isOpen={profileCropperOpen}
        onClose={() => setProfileCropperOpen(false)}
        onCropComplete={handleProfileCropComplete}
        imageFile={profileImageFile}
        aspectRatio={1}
        cropShape="round"
        minWidth={150}
        title="Crop Profile Picture"
      />
      
      <ImageCropper
        isOpen={bannerCropperOpen}
        onClose={() => setBannerCropperOpen(false)}
        onCropComplete={handleBannerCropComplete}
        imageFile={bannerImageFile}
        aspectRatio={4}
        cropShape="rect"
        minWidth={400}
        title="Crop Banner Image"
      />
    </>
  );
}
