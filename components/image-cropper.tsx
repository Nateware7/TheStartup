"use client"

import React, { useState, useRef, useEffect } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { ImageIcon } from "lucide-react"

// This function creates a centered crop with the specified aspect ratio
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number,
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

// The canvas setup for creating the final cropped image
function setCanvasPreview(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement,
  crop: PixelCrop,
  scale = 1,
  rotate = 0,
) {
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('No 2d context')
  }

  const scaleX = image.naturalWidth / image.width
  const scaleY = image.naturalHeight / image.height
  const pixelRatio = window.devicePixelRatio

  canvas.width = Math.floor(crop.width * scaleX * pixelRatio)
  canvas.height = Math.floor(crop.height * scaleY * pixelRatio)

  ctx.scale(pixelRatio, pixelRatio)
  ctx.imageSmoothingQuality = 'high'

  const cropX = crop.x * scaleX
  const cropY = crop.y * scaleY
  const centerX = image.naturalWidth / 2
  const centerY = image.naturalHeight / 2

  ctx.save()
  ctx.translate(-cropX, -cropY)
  ctx.translate(centerX, centerY)
  ctx.translate(-centerX, -centerY)
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
  )
  ctx.restore()
}

interface ImageCropperProps {
  isOpen: boolean
  onClose: () => void
  onCropComplete: (croppedImage: Blob) => void
  imageFile: File | null
  aspectRatio: number
  cropShape?: 'rect' | 'round'
  minWidth?: number
  title: string
}

export function ImageCropper({
  isOpen,
  onClose,
  onCropComplete,
  imageFile,
  aspectRatio,
  cropShape = 'rect',
  minWidth = 150,
  title
}: ImageCropperProps) {
  const [imgSrc, setImgSrc] = useState<string>('')
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [scale, setScale] = useState(1)

  // Load the image when a file is provided
  useEffect(() => {
    if (!imageFile) {
      setImgSrc('')
      return
    }

    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImgSrc(reader.result?.toString() || '')
    })
    reader.readAsDataURL(imageFile)
  }, [imageFile])

  // Initialize the crop when image is loaded
  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initialCrop = centerAspectCrop(width, height, aspectRatio)
    setCrop(initialCrop)
  }

  // Handle crop changes
  function handleCropChange(pixelCrop: PixelCrop, percentCrop: Crop) {
    setCrop(percentCrop)
    setCompletedCrop(pixelCrop)
  }

  // Handle crop completion and pass the data back
  function handleCropComplete() {
    if (!imgRef.current || !canvasRef.current || !completedCrop) {
      return
    }

    setCanvasPreview(
      imgRef.current,
      canvasRef.current,
      completedCrop,
      scale
    )

    canvasRef.current.toBlob((blob) => {
      if (!blob) {
        throw new Error('Failed to create blob')
      }
      onCropComplete(blob)
      onClose()
    })
  }

  // Render an empty state if no image is loaded
  if (!imageFile || !imgSrc) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center p-8">
            <ImageIcon className="h-12 w-12 text-zinc-500 mb-4" />
            <p className="text-zinc-400">No image selected</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} className="border-zinc-700 text-white">Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl lg:max-w-2xl bg-zinc-900 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4">
          <div className="crop-container overflow-hidden max-h-[60vh]">
            <ReactCrop
              crop={crop}
              onChange={handleCropChange}
              aspect={aspectRatio}
              minWidth={minWidth}
              circularCrop={cropShape === 'round'}
              keepSelection
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imgSrc}
                onLoad={onImageLoad}
                className="max-h-[60vh] object-contain"
              />
            </ReactCrop>
          </div>
          
          <div className="w-full px-4 py-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-zinc-400">Zoom:</span>
              <Slider
                value={[scale]}
                min={0.5}
                max={3}
                step={0.1}
                onValueChange={(values) => setScale(values[0])}
                className="w-full"
              />
              <span className="text-sm text-zinc-400">{scale.toFixed(1)}x</span>
            </div>
          </div>
          
          {/* Hidden canvas used for the actual cropping */}
          <canvas
            ref={canvasRef}
            className="hidden"
          />
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose} className="border-zinc-700 text-white">
            Cancel
          </Button>
          <Button onClick={handleCropComplete} className="bg-gradient-to-r from-violet-600 to-indigo-600">
            Apply Crop
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 