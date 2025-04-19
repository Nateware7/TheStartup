"use client"

import React, { useState, useEffect } from 'react'
import * as ReactHooks from 'react'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Input } from "@/components/ui/input"
import { auth, db } from '@/lib/firebaseConfig'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Cloudinary } from "@cloudinary/url-gen"
import Image from 'next/image'
import { AnimatedBackground } from '@/components/animated-background'
import { Navbar } from '@/components/navbar'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Loader, User, ImageIcon } from 'lucide-react'
import Link from 'next/link'
import { ImageCropper } from '@/components/image-cropper'

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  }
})

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  bio: z.string().max(150, "Bio must be less than 150 characters").optional(),
  banner: z.any(),
  profilePicture: z.any(),
})

type FormData = z.infer<typeof formSchema>

// Main Edit Profile Page Component
export default function EditProfilePage({ params }: { params: { id: string } }) {
  // Unwrap params using React.use()
  const unwrappedParams = ReactHooks.use(params as unknown as Promise<{ id: string }>)
  const userId = unwrappedParams.id
  
  return <EditProfileContent userId={userId} />
}

// Content component that uses the unwrapped userId
function EditProfileContent({ userId }: { userId: string }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [bannerPreview, setBannerPreview] = useState<string | null>(null)
  const [profilePreview, setProfilePreview] = useState<string | null>(null)
  
  // State for image croppers
  const [profileCropperOpen, setProfileCropperOpen] = useState(false)
  const [bannerCropperOpen, setBannerCropperOpen] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [bannerImageFile, setBannerImageFile] = useState<File | null>(null)
  const [croppedProfileBlob, setCroppedProfileBlob] = useState<Blob | null>(null)
  const [croppedBannerBlob, setCroppedBannerBlob] = useState<Blob | null>(null)
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      bio: '',
    }
  })
  
  // Watch for file changes to create previews
  const watchBanner = watch("banner")
  const watchProfilePicture = watch("profilePicture")

  useEffect(() => {
    // Check if user is logged in and is the owner of this profile
    const checkAuth = async () => {
      setIsLoading(true)
      const user = auth.currentUser
      
      if (!user) {
        toast.error("You must be logged in to edit a profile")
        router.push('/auth/signin')
        return
      }
      
      if (user.uid !== userId) {
        toast.error("You can only edit your own profile")
        router.push('/dashboard')
        return
      }
      
      // Check if email is verified
      if (!user.emailVerified) {
        toast.error("Please verify your email before editing your profile")
        router.push('/verify')
        return
      }
      
      try {
        // Fetch the user's current profile data
        const userDoc = await getDoc(doc(db, 'users', user.uid))
        
        if (userDoc.exists()) {
          const userData = userDoc.data()
          setCurrentUser(userData)
          
          // Set form default values
          setValue('username', userData.username || '')
          setValue('bio', userData.bio || '')
          
          // Set image previews
          setBannerPreview(userData.banner || null)
          setProfilePreview(userData.profilePicture || null)
        } else {
          setError("Profile data not found")
        }
      } catch (err) {
        console.error("Error fetching user data:", err)
        setError("Failed to load your profile data")
      } finally {
        setIsLoading(false)
      }
    }
    
    checkAuth()
  }, [userId, router, setValue])
  
  // Handle profile picture file selection
  const handleProfileImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setProfileImageFile(file)
      setProfileCropperOpen(true)
    }
  }

  // Handle banner image file selection
  const handleBannerImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setBannerImageFile(file)
      setBannerCropperOpen(true)
    }
  }
  
  // Handle profile crop completion
  const handleProfileCropComplete = (blob: Blob) => {
    setCroppedProfileBlob(blob)
    const previewUrl = URL.createObjectURL(blob)
    setProfilePreview(previewUrl)
  }
  
  // Handle banner crop completion
  const handleBannerCropComplete = (blob: Blob) => {
    setCroppedBannerBlob(blob)
    const previewUrl = URL.createObjectURL(blob)
    setBannerPreview(previewUrl)
  }

  const uploadToCloudinary = async (blob: Blob | null, folder: string) => {
    if (!blob) return null

    const formData = new FormData()
    // Create a file from the blob
    const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
    formData.append('file', file)
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'profilesetup')
    formData.append('folder', folder)

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()
      if (data.error) {
        console.error("Cloudinary error:", data.error)
        return null
      }
      return data.secure_url
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error)
      return null
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSaving(true)
    try {
      const user = auth.currentUser
      if (!user) throw new Error("User not authenticated")
      
      // Prepare update data
      const updateData: Record<string, any> = {
        bio: data.bio || '',
        updatedAt: new Date(),
      }

      // Upload cropped images if provided
      if (croppedBannerBlob) {
        const bannerUrl = await uploadToCloudinary(croppedBannerBlob, `users/${user.uid}/banners`)
        if (bannerUrl) updateData.banner = bannerUrl
      } else if (!bannerPreview) {
        // Set a plain black background if the user removed their current banner
        updateData.banner = `https://placehold.co/1200x300/000000/000000`
      }

      if (croppedProfileBlob) {
        const profileUrl = await uploadToCloudinary(croppedProfileBlob, `users/${user.uid}/profiles`)
        if (profileUrl) updateData.profilePicture = profileUrl
      } else if (!profilePreview) {
        // Use a simple default profile image
        updateData.profilePicture = `https://placehold.co/400x400/333333/FFFFFF`
      }

      // Update Firestore document with available data
      await updateDoc(doc(db, 'users', user.uid), updateData)

      toast.success('Profile updated successfully!')
      router.push(`/profile/${user.uid}`) // Redirect to profile page
    } catch (error) {
      toast.error('Error updating profile: ' + (error as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen text-white">
          <Navbar />
          <div className="container mx-auto px-4 py-20 flex items-center justify-center">
            <Loader className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading your profile data...</span>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  if (error) {
    return (
      <AnimatedBackground>
        <div className="min-h-screen text-white">
          <Navbar />
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-2xl font-bold mb-4">Error Loading Profile</h1>
            <p className="text-zinc-400 mb-8">{error}</p>
            <Button onClick={() => router.push('/dashboard')} className="bg-gradient-to-r from-blue-500 to-violet-500">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </AnimatedBackground>
    )
  }

  return (
    <AnimatedBackground>
      <div className="min-h-screen text-white">
        <Navbar />
        
        <div className="container mx-auto px-4 pt-16 pb-20">
          <div className="mb-8">
            <Link 
              href={`/profile/${userId}`}
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Profile</span>
            </Link>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="bg-zinc-900/80 backdrop-blur-md rounded-xl border border-zinc-800/60 shadow-xl overflow-hidden">
              <div className="p-6">
                <h1 className="text-2xl font-bold mb-6">Edit Your Profile</h1>
                
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                  {/* Banner Preview */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Banner Image</h2>
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
                  
                  {/* Profile Picture Preview */}
                  <div className="space-y-4">
                    <h2 className="text-lg font-medium">Profile Picture</h2>
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
                  
                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-zinc-300">
                      Username
                    </label>
                    <Input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      {...register("username")}
                      disabled={true}
                      className={`bg-zinc-800/50 border-zinc-700 focus:border-violet-500 ${errors.username ? "border-red-500" : ""} cursor-not-allowed opacity-70`}
                    />
                    <p className="text-xs text-zinc-400">Usernames cannot be changed after account creation.</p>
                    {errors.username && <p className="text-sm text-red-500">{errors.username.message}</p>}
                  </div>
                  
                  {/* Bio */}
                  <div className="space-y-2">
                    <label htmlFor="bio" className="block text-sm font-medium text-zinc-300">
                      Bio
                    </label>
                    <textarea
                      id="bio"
                      placeholder="Tell others about yourself"
                      {...register("bio")}
                      className={`w-full p-3 rounded-md bg-zinc-800/50 border border-zinc-700 focus:border-violet-500 focus:outline-none ${errors.bio ? "border-red-500" : ""}`}
                      rows={4}
                    />
                    {errors.bio && <p className="text-sm text-red-500">{errors.bio.message}</p>}
                    <p className="text-xs text-zinc-400">Brief description shown on your profile. Maximum 150 characters.</p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-4">
                    <Button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-700 hover:to-indigo-700 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                    >
                      {isSaving ? 'Saving Changes...' : 'Save Changes'}
                    </Button>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 border-zinc-700 text-white hover:bg-zinc-800"
                      onClick={() => router.push(`/profile/${userId}`)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
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
    </AnimatedBackground>
  )
} 