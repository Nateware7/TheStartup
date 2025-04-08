"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { AlertCircle, Upload, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"

export function SellForm() {
  const { toast } = useToast()
  const [isAuction, setIsAuction] = useState(false)
  const [formData, setFormData] = useState({
    assetType: "",
    platform: "",
    username: "",
    shortDescription: "",
    fullDescription: "",
    price: "",
    startingBid: "",
    bidIncrement: "",
    maxBid: "",
    duration: "",
    ownershipConfirmed: false,
  })
  const [formErrors, setFormErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const validateForm = () => {
    const errors = {}

    // Required fields for all submissions
    if (!formData.assetType) errors.assetType = "Asset type is required"
    if (!formData.platform) errors.platform = "Platform is required"
    if (!formData.username) errors.username = "Username is required"
    if (!formData.shortDescription) errors.shortDescription = "Short description is required"

    // Price validation
    if (!isAuction && (!formData.price || Number.parseFloat(formData.price) <= 0)) {
      errors.price = "Valid price is required"
    }

    // Auction validation
    if (isAuction) {
      if (!formData.startingBid || Number.parseFloat(formData.startingBid) <= 0) {
        errors.startingBid = "Valid starting bid is required"
      }
      if (!formData.bidIncrement || Number.parseFloat(formData.bidIncrement) <= 0) {
        errors.bidIncrement = "Valid bid increment is required"
      }
      if (!formData.duration) errors.duration = "Duration is required"
    }

    // Ownership confirmation
    if (!formData.ownershipConfirmed) {
      errors.ownershipConfirmed = "You must confirm ownership"
    }

    return errors
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const errors = validateForm()
    setFormErrors(errors)

    if (Object.keys(errors).length === 0) {
      setIsSubmitting(true)

      // Simulate API call
      setTimeout(() => {
        setIsSubmitting(false)
        toast({
          title: "Listing submitted successfully",
          description: "Your listing has been submitted and is under review.",
          action: (
            <Button variant="outline" size="sm" onClick={() => (window.location.href = "/dashboard")}>
              View My Listings
            </Button>
          ),
        })
      }, 1500)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Main Form Card */}
      <div className="overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/50 backdrop-blur-sm">
        {/* Form Header */}
        <div className="border-b border-zinc-800/50 bg-zinc-800/30 px-6 py-4">
          <h2 className="text-lg font-medium">Listing Details</h2>
        </div>

        {/* Form Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Left Column - Asset Info */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Asset Information</h3>

                <div className="space-y-4">
                  {/* Asset Type */}
                  <div className="space-y-2">
                    <Label htmlFor="assetType">
                      Asset Type <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("assetType", value)}
                      defaultValue={formData.assetType}
                    >
                      <SelectTrigger
                        id="assetType"
                        className={`w-full border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                          formErrors.assetType ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select asset type" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectItem value="username">Username</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.assetType && <p className="text-xs text-red-500">{formErrors.assetType}</p>}
                  </div>

                  {/* Platform */}
                  <div className="space-y-2">
                    <Label htmlFor="platform">
                      Platform <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      onValueChange={(value) => handleSelectChange("platform", value)}
                      defaultValue={formData.platform}
                    >
                      <SelectTrigger
                        id="platform"
                        className={`w-full border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                          formErrors.platform ? "border-red-500" : ""
                        }`}
                      >
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent className="border-zinc-700 bg-zinc-800 text-white">
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="x">X</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="discord">Discord</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.platform && <p className="text-xs text-red-500">{formErrors.platform}</p>}
                  </div>

                  {/* Username */}
                  <div className="space-y-2">
                    <Label htmlFor="username">
                      Username / Handle <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">@</span>
                      <Input
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className={`pl-8 border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                          formErrors.username ? "border-red-500" : ""
                        }`}
                        placeholder="username"
                      />
                    </div>
                    {formErrors.username && <p className="text-xs text-red-500">{formErrors.username}</p>}
                  </div>

                  {/* Short Description */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shortDescription">
                        Short Description <span className="text-red-500">*</span>
                      </Label>
                      <span className="text-xs text-zinc-500">{formData.shortDescription.length}/100</span>
                    </div>
                    <Input
                      id="shortDescription"
                      name="shortDescription"
                      value={formData.shortDescription}
                      onChange={handleInputChange}
                      maxLength={100}
                      className={`border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                        formErrors.shortDescription ? "border-red-500" : ""
                      }`}
                      placeholder="Brief description shown in listing card"
                    />
                    {formErrors.shortDescription && (
                      <p className="text-xs text-red-500">{formErrors.shortDescription}</p>
                    )}
                  </div>

                  {/* Full Description */}
                  <div className="space-y-2">
                    <Label htmlFor="fullDescription">Full Description</Label>
                    <Textarea
                      id="fullDescription"
                      name="fullDescription"
                      value={formData.fullDescription}
                      onChange={handleInputChange}
                      rows={5}
                      className="border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500"
                      placeholder="Detailed description of your username or account"
                    />
                    <p className="text-xs text-zinc-500">
                      Markdown formatting supported. Be detailed about the value of your username/account.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Pricing & Verification */}
            <div className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Pricing & Auction Settings</h3>

                <div className="space-y-4">
                  {/* Sale Type Toggle */}
                  <div className="space-y-2">
                    <Label>Sale Type</Label>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/30 p-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${!isAuction ? "text-white" : "text-zinc-400"}`}>Fixed Price</span>
                        <Switch
                          checked={isAuction}
                          onCheckedChange={setIsAuction}
                          className="data-[state=checked]:bg-violet-600"
                        />
                        <span className={`text-sm ${isAuction ? "text-white" : "text-zinc-400"}`}>Auction</span>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-zinc-400" />
                          </TooltipTrigger>
                          <TooltipContent className="bg-zinc-800 text-white">
                            <p>Choose how you want to sell your asset</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Fixed Price Fields */}
                  {!isAuction && (
                    <div className="space-y-2">
                      <Label htmlFor="price">
                        Price <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                        <Input
                          id="price"
                          name="price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.price}
                          onChange={handleInputChange}
                          className={`pl-8 border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                            formErrors.price ? "border-red-500" : ""
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                      {formErrors.price && <p className="text-xs text-red-500">{formErrors.price}</p>}
                    </div>
                  )}

                  {/* Auction Fields */}
                  {isAuction && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="startingBid">
                          Starting Bid <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                          <Input
                            id="startingBid"
                            name="startingBid"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.startingBid}
                            onChange={handleInputChange}
                            className={`pl-8 border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                              formErrors.startingBid ? "border-red-500" : ""
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                        {formErrors.startingBid && <p className="text-xs text-red-500">{formErrors.startingBid}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bidIncrement">
                          Bid Increment <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                          <Input
                            id="bidIncrement"
                            name="bidIncrement"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.bidIncrement}
                            onChange={handleInputChange}
                            className={`pl-8 border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                              formErrors.bidIncrement ? "border-red-500" : ""
                            }`}
                            placeholder="0.00"
                          />
                        </div>
                        {formErrors.bidIncrement && <p className="text-xs text-red-500">{formErrors.bidIncrement}</p>}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="maxBid">Max Bid (Optional)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
                          <Input
                            id="maxBid"
                            name="maxBid"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.maxBid}
                            onChange={handleInputChange}
                            className="pl-8 border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500"
                            placeholder="0.00"
                          />
                        </div>
                        <p className="text-xs text-zinc-500">
                          Set a maximum bid to automatically end the auction when reached
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="duration">
                          Duration <span className="text-red-500">*</span>
                        </Label>
                        <Select
                          onValueChange={(value) => handleSelectChange("duration", value)}
                          defaultValue={formData.duration}
                        >
                          <SelectTrigger
                            id="duration"
                            className={`w-full border-zinc-700 bg-zinc-800/50 text-white focus:border-violet-500 focus:ring-violet-500 ${
                              formErrors.duration ? "border-red-500" : ""
                            }`}
                          >
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                          <SelectContent className="border-zinc-700 bg-zinc-800 text-white">
                            <SelectItem value="1">1 Day</SelectItem>
                            <SelectItem value="3">3 Days</SelectItem>
                            <SelectItem value="7">7 Days</SelectItem>
                            <SelectItem value="14">14 Days</SelectItem>
                            <SelectItem value="30">30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                        {formErrors.duration && <p className="text-xs text-red-500">{formErrors.duration}</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verification Section */}
              <div>
                <h3 className="mb-4 text-lg font-medium">Verification</h3>

                <div className="space-y-4">
                  {/* Ownership Confirmation */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="ownershipConfirmed"
                        name="ownershipConfirmed"
                        checked={formData.ownershipConfirmed}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500"
                      />
                      <div>
                        <Label htmlFor="ownershipConfirmed" className="font-medium">
                          I confirm I own or control access to this username/account{" "}
                          <span className="text-red-500">*</span>
                        </Label>
                        <p className="text-xs text-zinc-500">
                          By checking this box, you confirm that you have legal ownership or control of the asset being
                          listed.
                        </p>
                        {formErrors.ownershipConfirmed && (
                          <p className="text-xs text-red-500">{formErrors.ownershipConfirmed}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Optional Verification Upload */}
                  <div className="space-y-2">
                    <Label>Verification Screenshot (Optional)</Label>
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-800/30 p-6">
                      <div className="text-center">
                        <Upload className="mx-auto h-8 w-8 text-zinc-500" />
                        <p className="mt-2 text-sm text-zinc-400">Drag and drop a screenshot or click to browse</p>
                        <p className="mt-1 text-xs text-zinc-500">Accepted formats: PNG, JPG, WEBP (Max 5MB)</p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-4 border-zinc-700 bg-zinc-800/50 text-white hover:bg-zinc-700"
                        >
                          Upload Screenshot
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end">
        <Button
          type="submit"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-2 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 w-full md:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
              />
              Processing...
            </span>
          ) : (
            "List Username / Account"
          )}
        </Button>
      </div>

      {/* Form Submission Guidelines */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
          <div>
            <h4 className="font-medium text-white">Important Information</h4>
            <ul className="mt-2 space-y-1 text-sm text-zinc-400">
              <li>• All listings are manually reviewed before appearing on the marketplace</li>
              <li>• Review typically takes 24-48 hours</li>
              <li>• You must be able to verify ownership when a sale occurs</li>
              <li>• Commission fee: 5% of final sale price</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}

