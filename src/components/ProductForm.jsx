import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { CheckIcon, EditIcon, SaveIcon, ImageIcon } from 'lucide-react'
import { ImageCarousel } from '@/components/ui/image-carousel'
import { toast } from 'sonner'

export function ProductForm({ open, onOpenChange, analysisData, imageUrls = [], onProductAdded, isEditMode = false, productId = null }) {
  // Debug: Log the analysis data being received
  console.log('📋 ProductForm received analysisData:', analysisData)
  console.log('📋 ProductForm received imageUrls:', imageUrls)
  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      vendor: '',
      type: 'Supplement',
      tags: '',
      price: 0,
      weight: 0,
      sku: '',
      seoTitle: '',
      seoDescription: '',
      benefits: '',
      detailedIngredients: '',
      certifications: '',
      ageGroup: 'Adult',
      dietaryPreferences: '',
      flavor: '',
      servingSize: '',
      servingsPerContainer: '',
      published: false
    }
  })

  // Update form values when analysisData changes
  useEffect(() => {
    if (analysisData) {
      console.log('🔄 Updating form with AI analysis data:', analysisData)
      
      // Debug: Check for object serialization issues
      Object.keys(analysisData).forEach(key => {
        if (typeof analysisData[key] === 'object' && analysisData[key] !== null) {
          console.warn(`⚠️ Field ${key} is an object:`, analysisData[key])
        }
      })
      
      // Helper function to safely convert values to strings
      const safeString = (value) => {
        if (value === null || value === undefined) return ''
        if (typeof value === 'object') {
          console.warn('Converting object to string:', value)
          return JSON.stringify(value)
        }
        return String(value)
      }

      form.reset({
        title: safeString(analysisData.title),
        description: safeString(analysisData.description),
        vendor: safeString(analysisData.vendor),
        type: safeString(analysisData.type) || 'Supplement',
        tags: safeString(analysisData.tags),
        price: typeof analysisData.price === 'number' ? analysisData.price : parseFloat(analysisData.price) || 0,
        weight: typeof analysisData.weight === 'number' ? analysisData.weight : parseFloat(analysisData.weight) || 0,
        sku: safeString(analysisData.sku),
        seoTitle: safeString(analysisData.seoTitle || analysisData.title),
        seoDescription: safeString(analysisData.seoDescription),
        benefits: safeString(analysisData.benefits),
        detailedIngredients: safeString(analysisData.detailedIngredients),
        certifications: safeString(analysisData.certifications),
        ageGroup: safeString(analysisData.ageGroup) || 'Adult',
        dietaryPreferences: safeString(analysisData.dietaryPreferences),
        flavor: safeString(analysisData.flavor),
        servingSize: safeString(analysisData.servingSize),
        servingsPerContainer: safeString(analysisData.servingsPerContainer),
        productCategory: safeString(analysisData.productCategory),
        ingredientCategory: safeString(analysisData.ingredientCategory),
        benefitsStructured: safeString(analysisData.benefitsStructured),
        ingredientsStructured: safeString(analysisData.ingredientsStructured),
        howToUse: safeString(analysisData.howToUse),
        warnings: safeString(analysisData.warnings),
        published: false
      })
    }
  }, [analysisData, form])

  // Auto-generate HTML description from structured fields
  const generateHTMLDescription = (data) => {
    let html = ''
    
    if (data.benefitsStructured) {
      html += '<h2>Benefits</h2>\n<ul>\n'
      const benefits = data.benefitsStructured.split('\n').filter(b => b.trim())
      benefits.forEach(benefit => {
        const cleanBenefit = benefit.replace(/^[•\-\*]\s*/, '').trim()
        if (cleanBenefit) html += `<li>${cleanBenefit}</li>\n`
      })
      html += '</ul>\n'
    }
    
    if (data.ingredientsStructured) {
      html += '<h2>Ingredients</h2>\n<p>'
      html += data.ingredientsStructured.replace(/\n/g, '<br>')
      html += '</p>\n'
    }
    
    if (data.howToUse) {
      html += '<h2>How to Use</h2>\n<p>'
      html += data.howToUse.replace(/\n/g, '<br>')
      html += '</p>\n'
    }
    
    if (data.warnings) {
      html += '<h2>Warnings</h2>\n<p>'
      html += data.warnings.replace(/\n/g, '<br>')
      html += '</p>\n'
    }
    
    return html
  }

  const onSubmit = async (data) => {
    try {
      const action = isEditMode ? 'Updating' : 'Creating'
      toast.loading(`${action} product...`, { id: 'save-product' })
      
      // Auto-generate HTML description from structured fields
      const generatedHTML = generateHTMLDescription(data)
      
      // Create comprehensive product record with all AI data
      const productRecord = {
        Handle: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        Title: data.title,
        'Body (HTML)': generatedHTML || data.description,
        Vendor: data.vendor,
        'Product Category': data.productCategory, // Full Shopify category path
        Type: data.type,
        Tags: data.tags,
        'Variant Price': data.price || null,
        'Variant Grams': data.weight || null,
        'Variant SKU': data.sku,
        'Image Src': imageUrls[0] || '',
        'Image Position': 1,
        'Image Alt Text': `${data.title} - ${data.vendor}`,
        'SEO Title': data.seoTitle,
        'SEO Description': data.seoDescription,
        'Benifits (product.metafields.custom.benifits)': data.benefits,
        'Detailed ingredients (product.metafields.shopify.detailed-ingre': data.detailedIngredients,
        'Product certifications & standards (product.metafields.shopify.': data.certifications,
        'Age group (product.metafields.shopify.age-group)': data.ageGroup,
        'Dietary preferences (product.metafields.shopify.dietary-prefere': data.dietaryPreferences,
        'Flavor (product.metafields.shopify.flavor)': data.flavor,
        'Ingredient category (product.metafields.shopify.ingredient-cate': data.ingredientCategory,
        
        // Structured Description Fields
        'Benefits': data.benefitsStructured,
        'Ingredients': data.ingredientsStructured,
        'How to Use': data.howToUse,
        'Warnings': data.warnings,
        
        // New AI Analysis Columns
        'AI Benefits': data.benefits,
        'AI Benefits Structured': data.benefitsStructured,
        'AI Ingredients Structured': data.ingredientsStructured,
        'AI How to Use': data.howToUse,
        'AI Warnings': data.warnings,
        'AI Detailed Ingredients': data.detailedIngredients,
        'AI Certifications': data.certifications,
        'AI Age Group': data.ageGroup,
        'AI Dietary Preferences': data.dietaryPreferences,
        'AI Flavor': data.flavor,
        'AI Serving Size': data.servingSize,
        'AI Servings Per Container': data.servingsPerContainer,
        'AI Confidence': analysisData?.confidence || 0,
        'AI Images Analyzed': analysisData?.imagesAnalyzed || imageUrls.length,
        'AI Analysis Date': new Date().toISOString(),
        'Image URLs': JSON.stringify(imageUrls),
        
        Published: data.published,
        Status: data.published ? 'active' : 'draft',
        'Variant Inventory Qty': 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // Save or update product record in Supabase
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      const url = isEditMode 
        ? `${supabaseUrl}/rest/v1/shopify_products_complete?id=eq.${productId}`
        : `${supabaseUrl}/rest/v1/shopify_products_complete`
      
      const response = await fetch(url, {
        method: isEditMode ? 'PATCH' : 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(productRecord)
      })
      
      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(`Database error: ${response.status} - ${errorData}`)
      }
      
      const savedProduct = await response.json()
      console.log('✅ Product saved to database:', savedProduct)
      
      const successMessage = isEditMode ? 'Product updated successfully!' : 'Product added successfully!'
      const successDescription = isEditMode 
        ? `${data.title} has been updated in your store.`
        : `${data.title} has been added to your store.`

      toast.success(successMessage, {
        id: 'save-product',
        description: successDescription
      })
      
      // Close modal and trigger refresh
      onOpenChange(false)
      onProductAdded?.(savedProduct)
      form.reset()
    } catch (error) {
      const errorAction = isEditMode ? 'updating' : 'creating'
      console.error(`Error ${errorAction} product:`, error)
      toast.error(`Failed to ${errorAction.slice(0, -3)}e product`, {
        id: 'save-product',
        description: error.message || 'Please try again.'
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <EditIcon className="w-5 h-5 text-blue-600" />
                Edit Product
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5 text-green-600" />
                Review & Create Product
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Update the product information below. All current data has been loaded for editing.'
              : 'All fields have been automatically filled by AI analysis. Review the information for accuracy and make any necessary corrections before publishing.'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            {/* Supplement Details - Consolidated Section */}
            <Card>
              <CardHeader>
                <CardTitle>Supplement Details</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Complete supplement information including product details, usage, and safety
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Product Identity */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          Product Title
                          {field.value && <Badge variant="outline" className="text-xs">AI Filled</Badge>}
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Enter product title" {...field} />
                        </FormControl>
                        <FormDescription>
                          SEO-optimized title for your Shopify store
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="vendor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand/Vendor</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter brand name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Supplements">Supplements</SelectItem>
                            <SelectItem value="Vitamin">Vitamin</SelectItem>
                            <SelectItem value="Protein">Protein</SelectItem>
                            <SelectItem value="Pre-Workout">Pre-Workout</SelectItem>
                            <SelectItem value="Post-Workout">Post-Workout</SelectItem>
                            <SelectItem value="Mineral">Mineral</SelectItem>
                            <SelectItem value="Herbal">Herbal</SelectItem>
                            <SelectItem value="Tea">Tea</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            step="0.01" 
                            placeholder="0.00" 
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (grams)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Product SKU" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input placeholder="Health, Wellness, Vitamins..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Comma-separated tags for Shopify
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Structured Product Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Product Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="benefitsStructured"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="• Supports immune system&#10;• Boosts energy levels&#10;• Improves focus..." 
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Key health benefits (bullet points)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ingredientsStructured"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ingredients</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Vitamin C 1000mg (1111% DV)&#10;Zinc 15mg (136% DV)..." 
                              className="min-h-24"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Complete ingredient list with amounts
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="howToUse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>How to Use</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Take 1-2 capsules daily with food..." 
                              className="min-h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Usage instructions from packaging
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="warnings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warnings</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Consult physician before use..." 
                              className="min-h-20"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Safety information and warnings
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Additional Supplement Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Additional Details</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="ageGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age Group</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select age group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Adult">Adult</SelectItem>
                            <SelectItem value="Teen">Teen (13-17)</SelectItem>
                            <SelectItem value="Senior">Senior (65+)</SelectItem>
                            <SelectItem value="All Ages">All Ages</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dietaryPreferences"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Dietary Preferences</FormLabel>
                        <FormControl>
                          <Input placeholder="Vegan, Gluten-Free..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="flavor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flavor</FormLabel>
                        <FormControl>
                          <Input placeholder="Unflavored, Berry..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="servingSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Serving Size</FormLabel>
                        <FormControl>
                          <Input placeholder="1 capsule, 1 scoop, etc." {...field} />
                        </FormControl>
                        <FormDescription>
                          Exact serving size from supplement facts
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="servingsPerContainer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Servings Per Container</FormLabel>
                        <FormControl>
                          <Input placeholder="30, 60, 120..." {...field} />
                        </FormControl>
                        <FormDescription>
                          Number of servings in the container
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="certifications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Certifications & Standards</FormLabel>
                      <FormControl>
                        <Input placeholder="GMP, FDA, Organic, Non-GMO..." {...field} />
                      </FormControl>
                      <FormDescription>
                        Quality certifications and standards
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Image Viewer for Data Entry */}
            {imageUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5" />
                    Product Images ({imageUrls.length})
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click any image to view in full size with zoom. Use these images to verify the AI-extracted product details.
                  </p>
                </CardHeader>
                <CardContent>
                  <ImageCarousel images={imageUrls} className="w-full" />
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                {isEditMode ? (
                  <Button type="submit">
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Update Product
                  </Button>
                ) : (
                  <>
                    <Button 
                      type="submit" 
                      variant="outline"
                      onClick={() => form.setValue('published', false)}
                    >
                      <EditIcon className="w-4 h-4 mr-2" />
                      Save as Draft
                    </Button>
                    <Button 
                      type="submit"
                      onClick={() => form.setValue('published', true)}
                    >
                      <SaveIcon className="w-4 h-4 mr-2" />
                      Add Product
                    </Button>
                  </>
                )}
              </div>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
