import React, { useState, useRef } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { UploadIcon, XIcon, ImageIcon, LinkIcon, GridIcon } from 'lucide-react'
import { Progress } from './ui/progress'
import { AIProductAnalyzer } from './AIProductAnalyzer'

// Function to store image metadata in database
const storeImageInDatabase = async (imageUrl, altText, draftId) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    const response = await fetch(`${supabaseUrl}/rest/v1/product_images`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        draft_id: draftId,
        image_url: imageUrl,
        storage_path: imageUrl.includes('/product-images/') ? 
          imageUrl.split('/product-images/')[1] : 
          imageUrl.split('/').pop(), // Extract path from Supabase storage URL
        alt_text: altText,
        display_order: 1,
        is_primary: true,
        analysis_status: 'pending'
      })
    })
    
    if (!response.ok) {
      console.error('Failed to store image metadata:', await response.text())
    } else {
      console.log('Image metadata stored successfully')
    }
  } catch (error) {
    console.error('Error storing image metadata:', error)
  }
}

export function ImageUploader({ value, onChange, onAltTextChange, altText = '', onAIAnalysis, draftId, onImageUploaded, onProductAdded }) {
  const [dragActive, setDragActive] = useState(false)
  const [uploadedImages, setUploadedImages] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isWaitingForAvailability, setIsWaitingForAvailability] = useState(false)
  const fileInputRef = useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleMultipleFiles(Array.from(e.dataTransfer.files))
    }
  }

  // Handle multiple file uploads
  const handleMultipleFiles = async (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    if (imageFiles.length === 0) return

    setIsUploading(true)
    setUploadProgress(0)
    
    try {
      const uploadPromises = imageFiles.map(async (file, index) => {
        // Create object URL for immediate preview
        const objectUrl = URL.createObjectURL(file)
        
        // Auto-generate alt text from filename
        const filename = file.name.split('.')[0]
        const autoAlt = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

        try {
          // Upload to Supabase storage
          const formData = new FormData()
          formData.append('file', file)
          formData.append('productHandle', draftId || 'temp-product')

          const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-product-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            },
            body: formData
          })

          const result = await response.json()
          
          if (result.success) {
            // Clean up the blob URL
            URL.revokeObjectURL(objectUrl)
            
            // Store image in product_images table if we have a draftId
            if (draftId) {
              await storeImageInDatabase(result.data.url, result.data.altText, draftId)
            }
            
            // Update progress
            setUploadProgress(((index + 1) / imageFiles.length) * 100)
            
            return {
              url: result.data.url,
              altText: result.data.altText,
              size: result.data.size,
              type: result.data.type,
              objectUrl: objectUrl,
              filename: file.name
            }
          } else {
            console.error('Upload failed:', result.error)
            URL.revokeObjectURL(objectUrl)
            throw new Error(result.error)
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          URL.revokeObjectURL(objectUrl)
          throw error
        }
      })

      const uploadedResults = await Promise.all(uploadPromises)
      setUploadedImages(prev => [...prev, ...uploadedResults])
      
      // Set the first image as the primary image for backward compatibility
      if (uploadedResults.length > 0) {
        onChange(uploadedResults[0].url)
        onAltTextChange?.(uploadedResults[0].altText)
        
        // Add delay to ensure images are fully available before AI analysis
        setIsWaitingForAvailability(true)
        console.log('⏱️ Waiting 3 seconds for images to be fully available...')
        await new Promise(resolve => setTimeout(resolve, 3000))
        console.log('✅ Images should now be accessible for AI analysis')
        setIsWaitingForAvailability(false)
        
        // Notify parent component with all uploaded images
        onImageUploaded?.({
          primary: uploadedResults[0],
          all: uploadedResults
        })
      }
      
    } catch (error) {
      console.error('Error uploading multiple images:', error)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Handle single file upload (backward compatibility)
  const handleFile = async (file) => {
    if (file && file.type.startsWith('image/')) {
      await handleMultipleFiles([file])
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleMultipleFiles(Array.from(e.target.files))
    }
  }

  const removeImage = (index = null) => {
    if (index !== null) {
      // Remove specific image from uploaded images
      const newUploadedImages = uploadedImages.filter((_, i) => i !== index)
      setUploadedImages(newUploadedImages)
      
      // If removing the primary image, set next image as primary
      if (index === 0 && newUploadedImages.length > 0) {
        onChange(newUploadedImages[0].url)
        onAltTextChange?.(newUploadedImages[0].altText)
      } else if (newUploadedImages.length === 0) {
        onChange('')
        onAltTextChange?.('')
      }
    } else {
      // Remove all images (backward compatibility)
      setUploadedImages([])
      onChange('')
      onAltTextChange?.('')
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-4">
      {/* File Upload */}
      <div className="space-y-2">
        <Label>Upload Image File</Label>
        <Card 
          className={`relative cursor-pointer transition-colors ${
            dragActive ? 'border-primary bg-primary/5' : 'border-dashed'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="p-6">
            <div className="text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Drag and drop images here, or click to select multiple files
              </p>
              <Badge variant="outline">JPG, PNG, WebP up to 10MB each</Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileInput}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-2">
          <Label>Uploading Images...</Label>
          <Progress value={uploadProgress} className="h-2" />
          <p className="text-sm text-muted-foreground">
            {Math.round(uploadProgress)}% complete
          </p>
        </div>
      )}

      {/* Waiting for Availability */}
      {isWaitingForAvailability && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
              <div>
                <p className="font-medium text-blue-900">Preparing images for AI analysis...</p>
                <p className="text-sm text-blue-700">Ensuring images are fully accessible (3 seconds)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Multiple Images Preview */}
      {uploadedImages.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label>Uploaded Images ({uploadedImages.length})</Label>
            <Badge variant="secondary" className="gap-1">
              <GridIcon className="w-3 h-3" />
              Multi-image analysis ready
            </Badge>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={image.altText || `Product image ${index + 1}`}
                  className={`w-full h-24 object-cover rounded-md border-2 transition-all ${
                    index === 0 ? 'border-primary shadow-md' : 'border-border'
                  }`}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/200x200?text=Error'
                  }}
                />
                {index === 0 && (
                  <Badge className="absolute -top-2 -left-2 text-xs">
                    Primary
                  </Badge>
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  onClick={() => removeImage(index)}
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Backward compatibility - single image preview */}
      {value && uploadedImages.length === 0 && (
        <div className="space-y-2">
          <Label>Image Preview</Label>
          <div className="relative">
            <img
              src={value}
              alt={altText || 'Product image preview'}
              className="w-full h-40 object-cover rounded-md border"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/400x400?text=Image+Error'
              }}
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => removeImage()}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Alt Text Input */}
      {value && (
        <div className="space-y-2">
          <Label htmlFor="image-alt">Image Alt Text</Label>
          <Input
            id="image-alt"
            value={altText}
            onChange={(e) => onAltTextChange?.(e.target.value)}
            placeholder="Descriptive alt text for accessibility"
          />
        </div>
      )}

      {/* Quick Actions */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="gap-1">
                  <GridIcon className="w-3 h-3" />
                  {uploadedImages.length} images ready
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Ready for AI analysis and product creation
                </span>
              </div>
              <AIProductAnalyzer
                imageUrl={value}
                imageUrls={uploadedImages.map(img => img.url)}
                onAnalysisComplete={onAIAnalysis}
                onError={(error) => console.error('AI Analysis Error:', error)}
                onProductAdded={onProductAdded}
                isWaitingForImages={isWaitingForAvailability}
                compact={true}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 