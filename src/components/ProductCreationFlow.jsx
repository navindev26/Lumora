import React, { useState } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { ImageUploader } from './ImageUploader'
import { Upload, Sparkles, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

export function ProductCreationFlow({ onProductCreated, onFormDataUpdate, onProductAdded }) {
  const [currentDraftId, setCurrentDraftId] = useState(null)
  const [uploadedImages, setUploadedImages] = useState([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const draftCreatedRef = React.useRef(false)

  // Create a new product draft
  const createProductDraft = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/product_drafts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          title: 'New Product Draft',
          status: 'pending_analysis'
        })
      })
      
      if (response.ok) {
        const draft = await response.json()
        const draftId = draft[0].id
        setCurrentDraftId(draftId)
        console.log('Created product draft:', draftId)
        return draftId
      }
    } catch (error) {
      console.error('Error creating draft:', error)
      toast.error('Failed to create product draft')
    }
    return null
  }

  // Handle image upload completion
  const handleImageUploaded = (imageData) => {
    setUploadedImages(prev => [...prev, imageData])
    toast.success('Image uploaded successfully!')
  }

  // Trigger AI analysis of all uploaded images
  const triggerBatchAnalysis = async () => {
    if (!currentDraftId || uploadedImages.length === 0) {
      toast.error('Please upload at least one image first')
      return
    }

    setIsAnalyzing(true)
    toast.loading('Analyzing images with AI...', { id: 'batch-analysis' })

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-product-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          draftId: currentDraftId
        })
      })

      const result = await response.json()

      if (result.success) {
        // Auto-fill form with AI analysis
        const analysisData = {
          Title: result.analysis.title,
          'Body (HTML)': result.analysis.description,
          Vendor: result.analysis.vendor,
          Type: result.analysis.type,
          Tags: result.analysis.tags,
          'Variant Price': result.analysis.price?.toString() || '',
          'Variant Grams': result.analysis.weight?.toString() || '',
          'Variant SKU': result.analysis.sku,
          'Benifits (product.metafields.custom.benifits)': result.analysis.benefits,
          'Image Src': uploadedImages[0]?.url || '',
          'Image Alt Text': uploadedImages[0]?.altText || result.analysis.title
        }

        onFormDataUpdate?.(analysisData)
        setAnalysisComplete(true)

        toast.success('AI analysis complete!', {
          id: 'batch-analysis',
          description: `Analyzed ${result.imageCount} image(s). Form auto-filled.`
        })
      } else {
        toast.error('AI analysis failed', {
          id: 'batch-analysis',
          description: result.error
        })
      }
    } catch (error) {
      console.error('Batch analysis error:', error)
      toast.error('AI analysis failed', {
        id: 'batch-analysis',
        description: error.message
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Initialize draft when component mounts
  React.useEffect(() => {
    if (!currentDraftId && !draftCreatedRef.current) {
      draftCreatedRef.current = true
      createProductDraft()
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Step 1: Upload Images */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Step 1: Upload Product Images
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Upload one or more high-quality product images. Multiple angles help with better AI analysis.
          </p>
        </CardHeader>
        <CardContent>
          <ImageUploader
            value={''}
            onChange={() => {}} // We don't use this for the new flow
            onAltTextChange={() => {}} // We don't use this for the new flow
            draftId={currentDraftId}
            onImageUploaded={handleImageUploaded}
            onProductAdded={onProductAdded}
          />
          
          {/* Show uploaded images */}
          {uploadedImages.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Uploaded Images ({uploadedImages.length})</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative">
                    <img 
                      src={img.url} 
                      alt={img.altText}
                      className="w-full aspect-square object-cover rounded-md border"
                    />
                    <Badge className="absolute top-1 right-1 text-xs">
                      {index + 1}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      
      {/* Step 3: Complete Product Creation */}
      {analysisComplete && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-green-800">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Product details analyzed and ready!</span>
            </div>
            <p className="text-sm text-green-700 mt-1">
              Review the auto-filled information below and click Create Product to save.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 