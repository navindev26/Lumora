import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageCarousel } from '@/components/ui/image-carousel'
import { TrashIcon, EditIcon, ImageIcon, InfoIcon, TagIcon, SparklesIcon } from 'lucide-react'
import { ProductForm } from './ProductForm'
import { toast } from 'sonner'

export function ProductDetailsModal({ product, isOpen, onClose, onDelete }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  if (!product) return null

  const handleDelete = async () => {
    if (!onDelete) return
    
    setIsDeleting(true)
    try {
      toast.loading('Deleting product...', { id: 'delete-product' })
      
      const result = await onDelete(product.Handle)
      
      if (result.success) {
        toast.success('Product deleted successfully!', { 
          id: 'delete-product',
          description: `${product.Title} has been removed from your store.`
        })
        onClose()
      } else {
        toast.error('Failed to delete product', {
          id: 'delete-product',
          description: result.error || 'An error occurred while deleting the product.'
        })
      }
    } catch (error) {
      toast.error('Failed to delete product', {
        id: 'delete-product',
        description: 'An unexpected error occurred.'
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatPrice = (price) => {
    if (!price) return '$0.00'
    return `$${parseFloat(price).toFixed(2)}`
  }

  // Get all images from different sources
  const imageUrls = []
  
  // Check for Image URLs JSON array first
  if (product['Image URLs']) {
    try {
      const parsedUrls = JSON.parse(product['Image URLs'])
      imageUrls.push(...parsedUrls)
    } catch (e) {
      console.warn('Error parsing Image URLs:', e)
    }
  }
  
  // Fallback to single Image Src
  if (imageUrls.length === 0 && product['Image Src']) {
    imageUrls.push(product['Image Src'])
  }
  
  // Legacy images array support
  if (imageUrls.length === 0 && product.images && product.images.length > 0) {
    imageUrls.push(...product.images.map(img => img.src))
  }

  const hasComparePrice = product['Variant Compare At Price'] && 
    parseFloat(product['Variant Compare At Price']) > parseFloat(product['Variant Price'] || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1200px] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <InfoIcon className="w-5 h-5" />
            Product Details
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="images">Images ({imageUrls.length})</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="ai-data">AI Data</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Product Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Product Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <InfoIcon className="w-5 h-5" />
                    Product Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold">{product.Title}</h2>
                    <p className="text-muted-foreground">{product.Vendor}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-2xl font-bold text-primary">
                      {formatPrice(product['Variant Price'])}
                    </div>
                    {hasComparePrice && (
                      <div className="text-lg text-muted-foreground line-through">
                        {formatPrice(product['Variant Compare At Price'])}
                      </div>
                    )}
                    <Badge variant={product.Published ? "default" : "secondary"}>
                      {product.Published ? 'Published' : 'Draft'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">SKU:</span>
                      <span className="ml-2 font-mono">{product['Variant SKU'] || 'Not set'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span>
                      <span className="ml-2">{product.Type || 'Not categorized'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Weight:</span>
                      <span className="ml-2">{product['Variant Grams'] ? `${product['Variant Grams']}g` : 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="font-medium">Stock:</span>
                      <span className={`ml-2 font-semibold ${
                        (product['Variant Inventory Qty'] || 0) > 10 ? 'text-green-600' : 
                        (product['Variant Inventory Qty'] || 0) > 0 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {product['Variant Inventory Qty'] || 0} units
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => setShowEditForm(true)}
                  >
                    <EditIcon className="w-4 h-4" />
                    Edit Product
                  </Button>
                  
                  {!showDeleteConfirm ? (
                    <Button 
                      variant="destructive" 
                      className="w-full gap-2"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <TrashIcon className="w-4 h-4" />
                      Delete Product
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive font-medium">Are you sure?</p>
                      <div className="flex gap-2">
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="flex-1"
                        >
                          {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            {product['Body (HTML)'] && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: product['Body (HTML)'] }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {product.Tags && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TagIcon className="w-5 h-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {product.Tags.split(',').map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag.trim().replace(/"/g, '')}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Images Tab */}
          <TabsContent value="images" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Product Images ({imageUrls.length})
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Click any image to view in full size with zoom controls
                </p>
              </CardHeader>
              <CardContent>
                {imageUrls.length > 0 ? (
                  <ImageCarousel images={imageUrls} className="w-full" />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                    <p>No images available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Handle:</span>
                    <span className="ml-2 font-mono text-sm">{product.Handle}</span>
                  </div>
                  <div>
                    <span className="font-medium">Product Category:</span>
                    <span className="ml-2">{product['Product Category'] || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(product.created_at).toLocaleDateString()}</span>
                  </div>
                  <div>
                    <span className="font-medium">Updated:</span>
                    <span className="ml-2">{new Date(product.updated_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* SEO Information */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">SEO Title:</span>
                    <p className="text-sm mt-1">{product['SEO Title'] || 'Not set'}</p>
                  </div>
                  <div>
                    <span className="font-medium">SEO Description:</span>
                    <p className="text-sm mt-1">{product['SEO Description'] || 'Not set'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Supplement-Specific Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Supplement Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Age Group:</span>
                    <span className="ml-2">{product['Age group (product.metafields.shopify.age-group)'] || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Dietary Preferences:</span>
                    <span className="ml-2">{product['Dietary preferences (product.metafields.shopify.dietary-prefere'] || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Flavor:</span>
                    <span className="ml-2">{product['Flavor (product.metafields.shopify.flavor)'] || 'Not specified'}</span>
                  </div>
                  <div>
                    <span className="font-medium">Ingredient Category:</span>
                    <span className="ml-2">{product['Ingredient category (product.metafields.shopify.ingredient-cate'] || 'Not specified'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Benefits & Ingredients</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Benefits:</span>
                    <p className="text-sm mt-1">{product['Benifits (product.metafields.custom.benifits)'] || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Detailed Ingredients:</span>
                    <p className="text-sm mt-1">{product['Detailed ingredients (product.metafields.shopify.detailed-ingre'] || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="font-medium">Certifications:</span>
                    <p className="text-sm mt-1">{product['Product certifications & standards (product.metafields.shopify.'] || 'Not specified'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Data Tab */}
          <TabsContent value="ai-data" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SparklesIcon className="w-5 h-5" />
                  AI Analysis Data
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Original data extracted by AI analysis
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {product['AI Confidence'] && (
                  <div className="flex items-center gap-2">
                    <span className="font-medium">AI Confidence:</span>
                    <Badge variant="secondary">{product['AI Confidence']}%</Badge>
                    <span className="text-sm text-muted-foreground">
                      ({product['AI Images Analyzed'] || 1} images analyzed)
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="font-medium">AI Benefits:</span>
                    <p className="text-sm mt-1">{product['AI Benefits'] || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="font-medium">AI Detailed Ingredients:</span>
                    <p className="text-sm mt-1">{product['AI Detailed Ingredients'] || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="font-medium">AI Certifications:</span>
                    <p className="text-sm mt-1">{product['AI Certifications'] || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="font-medium">AI Serving Size:</span>
                    <p className="text-sm mt-1">{product['AI Serving Size'] || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="font-medium">AI Age Group:</span>
                    <p className="text-sm mt-1">{product['AI Age Group'] || 'Not available'}</p>
                  </div>
                  <div>
                    <span className="font-medium">AI Flavor:</span>
                    <p className="text-sm mt-1">{product['AI Flavor'] || 'Not available'}</p>
                  </div>
                </div>

                {product['AI Analysis Date'] && (
                  <div className="text-xs text-muted-foreground border-t pt-3">
                    Analysis performed on: {new Date(product['AI Analysis Date']).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              ) : (
                <>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </div>
            
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Edit Product Form */}
      <ProductForm 
        open={showEditForm}
        onOpenChange={setShowEditForm}
        analysisData={{
          title: product.Title,
          description: product['Body (HTML)'],
          vendor: product.Vendor,
          type: product.Type,
          tags: product.Tags,
          price: parseFloat(product['Variant Price']) || 0,
          weight: parseFloat(product['Variant Grams']) || 0,
          sku: product['Variant SKU'],
          seoTitle: product['SEO Title'],
          seoDescription: product['SEO Description'],
          benefits: product['Benifits (product.metafields.custom.benifits)'] || product['AI Benefits'],
          detailedIngredients: product['Detailed ingredients (product.metafields.shopify.detailed-ingre'] || product['AI Detailed Ingredients'],
          certifications: product['Product certifications & standards (product.metafields.shopify.'] || product['AI Certifications'],
          ageGroup: product['Age group (product.metafields.shopify.age-group)'] || product['AI Age Group'],
          dietaryPreferences: product['Dietary preferences (product.metafields.shopify.dietary-prefere'] || product['AI Dietary Preferences'],
          flavor: product['Flavor (product.metafields.shopify.flavor)'] || product['AI Flavor'],
          servingSize: product['AI Serving Size'],
          servingsPerContainer: product['AI Servings Per Container'],
          productCategory: product['Product Category'],
          ingredientCategory: product['Ingredient category (product.metafields.shopify.ingredient-cate'],
          benefitsStructured: product['Benefits'] || product['AI Benefits Structured'],
          ingredientsStructured: product['Ingredients'] || product['AI Ingredients Structured'],
          howToUse: product['How to Use'] || product['AI How to Use'],
          warnings: product['Warnings'] || product['AI Warnings'],
          confidence: product['AI Confidence'],
          imagesAnalyzed: product['AI Images Analyzed']
        }}
        imageUrls={imageUrls}
        onProductAdded={(updatedProduct) => {
          console.log('Product updated:', updatedProduct)
          setShowEditForm(false)
          toast.success('Product updated successfully!', {
            description: 'The product has been updated in the database.'
          })
          // Refresh the parent component
          onClose()
        }}
        isEditMode={true}
        productId={product.id}
      />
    </Dialog>
  )
}
