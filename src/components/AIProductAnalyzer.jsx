import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { BrainIcon, ImageIcon, CheckIcon, AlertCircleIcon, SparklesIcon } from 'lucide-react'
import { toast } from 'sonner'

export function AIProductAnalyzer({ imageUrl, onAnalysisComplete, onError }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [confidence, setConfidence] = useState(0)

  const analyzeProduct = async () => {
    if (!imageUrl) {
      toast.error('No image provided for analysis')
      return
    }

    setIsAnalyzing(true)
    setAnalysis(null)
    
    try {
      toast.loading('🤖 AI analyzing product image...', { id: 'ai-analysis' })

      // Call the Supabase Edge Function
      const response = await fetch('/functions/v1/analyze-product-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          imageUrl: imageUrl,
          action: 'analyze-only'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Analysis failed')
      }

      const result = await response.json()
      
      if (result.success && result.analysis) {
        setAnalysis(result.analysis)
        setConfidence(result.analysis.confidence || 85)
        
        toast.success('🎉 AI analysis complete!', {
          id: 'ai-analysis',
          description: 'Product details have been analyzed and populated.'
        })

        // Pass the analysis back to parent component
        onAnalysisComplete?.(result.analysis)
      } else {
        throw new Error('Invalid response from AI analysis')
      }
    } catch (error) {
      console.error('AI Analysis Error:', error)
      toast.error('AI analysis failed', {
        id: 'ai-analysis',
        description: error.message || 'Please try again or fill fields manually.'
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

  return (
    <div className="space-y-4">
      {/* AI Analysis Trigger */}
      <Card className="border-dashed border-primary/30">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <BrainIcon className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-lg">AI Product Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            Let AI analyze your product image and auto-fill the details
          </p>
        </CardHeader>
        <CardContent className="pt-0">
          <Button
            onClick={analyzeProduct}
            disabled={isAnalyzing || !imageUrl}
            className="w-full gap-2"
            size="lg"
          >
            {isAnalyzing ? (
              <>
                <SparklesIcon className="w-4 h-4 animate-pulse" />
                Analyzing Image...
              </>
            ) : (
              <>
                <BrainIcon className="w-4 h-4" />
                Analyze with AI
              </>
            )}
          </Button>
          
          {isAnalyzing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>AI Processing...</span>
                <span>~30 seconds</span>
              </div>
              <Progress value={confidence} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {analysis && (
        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckIcon className="w-5 h-5 text-green-600" />
                AI Analysis Results
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <SparklesIcon className="w-3 h-3" />
                {analysis.confidence}% confident
              </Badge>
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
          </CardContent>
        </Card>
      )}
    </div>
  )
} 