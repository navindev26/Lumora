import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { UploadIcon, XIcon, ImageIcon, LinkIcon } from 'lucide-react'

export function ImageUploader({ value, onChange, onAltTextChange, altText = '' }) {
  const [dragActive, setDragActive] = useState(false)
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      // Create object URL for preview
      const objectUrl = URL.createObjectURL(file)
      onChange(objectUrl)
      
      // Auto-generate alt text from filename
      const filename = file.name.split('.')[0]
      const autoAlt = filename.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
      onAltTextChange?.(autoAlt)
    }
  }

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const removeImage = () => {
    onChange('')
    onAltTextChange?.('')
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
                Drag and drop an image here, or click to select
              </p>
              <Badge variant="outline">JPG, PNG, WebP up to 10MB</Badge>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      {/* Image Preview */}
      {value && (
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
              onClick={removeImage}
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
    </div>
  )
} 