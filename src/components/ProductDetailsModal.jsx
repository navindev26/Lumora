import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TrashIcon, EditIcon } from 'lucide-react'
import { toast } from 'sonner'

export function ProductDetailsModal({ product, isOpen, onClose, onDelete }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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

  const images = product.images && product.images.length > 0 
    ? product.images 
    : product['Image Src'] 
    ? [{ src: product['Image Src'], alt: product['Image Alt Text'] || product.Title }]
    : []

  const hasComparePrice = product['Variant Compare At Price'] && 
    parseFloat(product['Variant Compare At Price']) > parseFloat(product['Variant Price'] || 0)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1400px] max-h-[95vh] overflow-y-auto p-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          {/* Left Column - Media Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square relative overflow-hidden rounded-lg border bg-muted">
              {images.length > 0 ? (
                <img
                  src={images[selectedImage]?.src || images[0].src}
                  alt={images[selectedImage]?.alt || images[0].alt || product.Title}
                  className="object-contain w-full h-full hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/600x600?text=No+Image'
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-muted-foreground">
                    <div className="text-4xl mb-2">📷</div>
                    <div className="text-sm">No Image Available</div>
                  </div>
                </div>
              )}
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square relative overflow-hidden rounded border-2 transition-colors ${
                      selectedImage === index ? 'border-primary' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <img
                      src={image.src}
                      alt={image.alt || `${product.Title} ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{product.Vendor}</Badge>
                <Badge variant="secondary">{product.Type}</Badge>
                {product.Published && <Badge>Live</Badge>}
              </div>
              
              <h1 className="text-2xl font-bold leading-tight">
                {product.Title || 'Untitled Product'}
              </h1>
              
              <div className="flex items-center gap-3">
                {hasComparePrice && (
                  <span className="text-lg text-muted-foreground line-through">
                    {formatPrice(product['Variant Compare At Price'])}
                  </span>
                )}
                <span className="text-2xl font-bold text-primary">
                  {formatPrice(product['Variant Price'])}
                </span>
                {hasComparePrice && (
                  <Badge variant="destructive" className="text-xs">
                    Save {Math.round(((parseFloat(product['Variant Compare At Price']) - parseFloat(product['Variant Price'])) / parseFloat(product['Variant Compare At Price'])) * 100)}%
                  </Badge>
                )}
              </div>
            </div>

                         <Separator />

             {/* Stock Information */}
             <div className="space-y-2">
               <div className="flex items-center justify-between">
                 <span className="font-medium">Stock Status:</span>
                 <Badge variant={product['Variant Inventory Qty'] > 0 ? 'default' : 'destructive'}>
                   {product['Variant Inventory Qty'] || 0} in stock
                 </Badge>
               </div>
             </div>

             <Separator />

            {/* Product Description */}
            <div className="space-y-3">
              <h4 className="font-medium">Product Description</h4>
              <div 
                className="prose prose-sm max-w-none text-muted-foreground"
                dangerouslySetInnerHTML={{ 
                  __html: product['Body (HTML)'] || 'No description available.' 
                }}
              />
            </div>

            {/* Product Tags */}
            {product.Tags && (
              <div className="space-y-3">
                <h4 className="font-medium">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {product.Tags.split(',').map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag.trim().replace(/"/g, '')}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

                         {/* Product Details */}
             <div className="space-y-4">
               <h4 className="font-medium">Product Details</h4>
               
               {/* Basic Info */}
               <Card>
                 <CardContent className="p-4">
                   <div className="grid grid-cols-1 gap-3 text-sm">
                     <div className="flex justify-between">
                       <span className="font-medium">SKU:</span>
                       <span className="text-muted-foreground">
                         {product['Variant SKU'] || 'Not specified'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Weight:</span>
                       <span className="text-muted-foreground">
                         {product['Variant Grams'] ? `${product['Variant Grams']}g` : 'Not specified'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Category:</span>
                       <span className="text-muted-foreground">
                         {product['Product Category'] || 'Uncategorized'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Handle:</span>
                       <span className="text-muted-foreground font-mono text-xs">
                         {product.Handle}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Status:</span>
                       <span className="text-muted-foreground">
                         {product.Status || 'Active'}
                       </span>
                     </div>
                     {product['Variant Compare At Price'] && (
                       <div className="flex justify-between">
                         <span className="font-medium">Compare Price:</span>
                         <span className="text-muted-foreground">
                           {formatPrice(product['Variant Compare At Price'])}
                         </span>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>

               {/* Inventory Info */}
               <Card>
                 <CardContent className="p-4">
                   <h5 className="font-medium mb-3">Inventory Information</h5>
                   <div className="grid grid-cols-1 gap-3 text-sm">
                     <div className="flex justify-between">
                       <span className="font-medium">Stock Quantity:</span>
                       <span className="text-muted-foreground">
                         {product['Variant Inventory Qty'] || 0} units
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Inventory Tracker:</span>
                       <span className="text-muted-foreground">
                         {product['Variant Inventory Tracker'] || 'Shopify'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Inventory Policy:</span>
                       <span className="text-muted-foreground">
                         {product['Variant Inventory Policy'] || 'Deny'}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Fulfillment Service:</span>
                       <span className="text-muted-foreground">
                         {product['Variant Fulfillment Service'] || 'Manual'}
                       </span>
                     </div>
                   </div>
                 </CardContent>
               </Card>

               {/* Shipping & Tax */}
               <Card>
                 <CardContent className="p-4">
                   <h5 className="font-medium mb-3">Shipping & Tax</h5>
                   <div className="grid grid-cols-1 gap-3 text-sm">
                     <div className="flex justify-between">
                       <span className="font-medium">Requires Shipping:</span>
                       <Badge variant={product['Variant Requires Shipping'] ? 'default' : 'secondary'}>
                         {product['Variant Requires Shipping'] ? 'Yes' : 'No'}
                       </Badge>
                     </div>
                     <div className="flex justify-between">
                       <span className="font-medium">Taxable:</span>
                       <Badge variant={product['Variant Taxable'] ? 'default' : 'secondary'}>
                         {product['Variant Taxable'] ? 'Yes' : 'No'}
                       </Badge>
                     </div>
                     {product['Variant Weight Unit'] && (
                       <div className="flex justify-between">
                         <span className="font-medium">Weight Unit:</span>
                         <span className="text-muted-foreground">
                           {product['Variant Weight Unit']}
                         </span>
                       </div>
                     )}
                     {product['Variant Tax Code'] && (
                       <div className="flex justify-between">
                         <span className="font-medium">Tax Code:</span>
                         <span className="text-muted-foreground">
                           {product['Variant Tax Code']}
                         </span>
                       </div>
                     )}
                   </div>
                 </CardContent>
               </Card>
             </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <DialogFooter className="border-t pt-4">
          <div className="flex justify-between w-full">
            <div className="flex gap-2">
              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isDeleting}
                  className="gap-2"
                >
                  <TrashIcon className="h-4 w-4" />
                  Delete Product
                </Button>
              ) : (
                <div className="flex gap-2 items-center">
                  <span className="text-sm text-muted-foreground">Are you sure?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="gap-2"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
            
            <Button variant="outline" onClick={onClose} disabled={isDeleting}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 