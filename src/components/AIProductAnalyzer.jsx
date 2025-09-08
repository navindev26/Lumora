import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { BrainIcon, ImageIcon, CheckIcon, AlertCircleIcon, SparklesIcon, EditIcon } from 'lucide-react'
import { toast } from 'sonner'
import { ProductForm } from './ProductForm'

export function AIProductAnalyzer({ imageUrl, imageUrls, onAnalysisComplete, onError, compact = false, onProductAdded, isWaitingForImages = false }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [confidence, setConfidence] = useState(0)
  const [showProductForm, setShowProductForm] = useState(false)
  
  // Determine if we're working with multiple images
  const isMultiImage = imageUrls && imageUrls.length > 1
  const totalImages = imageUrls ? imageUrls.length : (imageUrl ? 1 : 0)
  const allImageUrls = imageUrls || (imageUrl ? [imageUrl] : [])

  const analyzeProduct = async () => {
    if (!imageUrl && (!imageUrls || imageUrls.length === 0)) {
      toast.error('No images provided for analysis')
      return
    }

    setIsAnalyzing(true)
    setAnalysis(null)
    
    try {
      const analysisMessage = isMultiImage 
        ? `🤖 AI analyzing ${totalImages} product images...`
        : '🤖 AI analyzing product image...'
      
      toast.loading(analysisMessage, { id: 'ai-analysis' })

      // Prepare request body for single or multiple images
      const requestBody = isMultiImage 
        ? { imageUrls: imageUrls, action: 'analyze-only' }
        : { imageUrl: imageUrl, action: 'analyze-only' }

      // Call the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-product-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        let errorMessage = 'Analysis failed'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch {
          if (response.status === 404) {
            errorMessage = 'AI Analysis service is not configured. Please set up OpenAI API key.'
          } else {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`
          }
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      
      if (result.success && result.analysis) {
        setAnalysis(result.analysis)
        setConfidence(result.analysis.confidence || 85)
        
        const successMessage = isMultiImage
          ? `🎉 Multi-image AI analysis complete! Analyzed ${totalImages} images for comprehensive results.`
          : '🎉 AI analysis complete!'
        
        toast.success(successMessage, {
          id: 'ai-analysis',
          description: isMultiImage 
            ? 'Product details analyzed from multiple angles for higher accuracy.'
            : 'Product details have been analyzed and populated.'
        })

        // Pass the analysis back to parent component
        onAnalysisComplete?.(result.analysis)
        
        // In compact mode, automatically open the product form
        if (compact) {
          setShowProductForm(true)
        }
      } else {
        throw new Error('Invalid response from AI analysis')
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      toast.error('AI analysis failed', {
        id: 'ai-analysis',
        description: error.message.includes('not configured') 
          ? 'AI Analysis requires OpenAI API key setup in Supabase Edge Functions.'
          : error.message || 'Please try again or fill fields manually.'
      })
      onError?.(error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const formatPrice = (price) => {
    if (!price) return '$0.00'
    return `$${parseFloat(price).toFixed(2)}`
  }

  // Compact mode - just the action button
  if (compact) {
    return (
      <>
        <Button
          onClick={analyzeProduct}
          disabled={isAnalyzing || isWaitingForImages || (!imageUrl && (!imageUrls || imageUrls.length === 0))}
          className="gap-2"
          size="sm"
        >
          {isWaitingForImages ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
              Preparing...
            </>
          ) : isAnalyzing ? (
            <>
              <SparklesIcon className="w-4 h-4 animate-pulse" />
              Analyzing...
            </>
          ) : (
            <>
              <BrainIcon className="w-4 h-4" />
              Analyze & Add Product
            </>
          )}
        </Button>
        
        {/* Product Form Dialog */}
        <ProductForm 
          open={showProductForm}
          onOpenChange={setShowProductForm}
          analysisData={analysis}
          imageUrls={allImageUrls}
          onProductAdded={onProductAdded}
        />
      </>
    )
  }

  return (
    <div className="space-y-4">

      {/* Analysis Results */}
      {analysis && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-green-600" />
                AI Analysis Results
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  <SparklesIcon className="w-3 h-3" />
                  {analysis.confidence}% confident
                </Badge>
                {analysis.imagesAnalyzed > 1 && (
                  <Badge variant="outline" className="gap-1">
                    <ImageIcon className="w-3 h-3" />
                    {analysis.imagesAnalyzed} images analyzed
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Product Title</h4>
                <p className="font-semibold">{analysis.title}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Brand</h4>
                <p>{analysis.vendor}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Category</h4>
                <p>{analysis.type}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-1">Estimated Price</h4>
                <p className="font-semibold text-green-600">{formatPrice(analysis.price)}</p>
              </div>
            </div>

            <Separator />

            {/* Description Preview */}
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Generated Description</h4>
              <div 
                className="text-sm bg-white rounded-md p-3 border max-h-32 overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: analysis.description }}
              />
            </div>

            {/* Tags */}
            {analysis.tags && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Suggested Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {analysis.tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag.trim().replace(/"/g, '')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Details */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">SKU:</span>
                <span className="ml-2 font-mono">{analysis.sku}</span>
              </div>
              <div>
                <span className="font-medium">Weight:</span>
                <span className="ml-2">{analysis.weight}g</span>
              </div>
            </div>

            {/* Confidence Indicator */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                {analysis.confidence >= 80 ? (
                  <CheckIcon className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircleIcon className="w-4 h-4 text-yellow-600" />
                )}
                <span className="text-muted-foreground">
                  {analysis.confidence >= 80 
                    ? 'High confidence analysis - ready for review'
                    : 'Medium confidence - please verify details'
                  }
                </span>
              </div>
              
              <Button 
                onClick={() => setShowProductForm(true)}
                className="gap-2"
              >
                <EditIcon className="w-4 h-4" />
                Add Product
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Product Form Dialog */}
      <ProductForm 
        open={showProductForm}
        onOpenChange={setShowProductForm}
        analysisData={analysis}
        imageUrls={allImageUrls}
        onProductAdded={onProductAdded}
      />
    </div>
  )
} 