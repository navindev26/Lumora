import React, { useState, useEffect } from 'react'
import { useProducts } from '@/hooks/useSupabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { TagPicker } from '@/components/TagPicker'
import { VendorPicker } from '@/components/VendorPicker'
import { TypePicker } from '@/components/TypePicker'
import { ImageUploader } from '@/components/ImageUploader'
import { ProductDetailsModal } from '@/components/ProductDetailsModal'
import { Toaster } from '@/components/ui/sonner'
import { PlusIcon, SearchIcon, FilterIcon, PackageIcon, ShoppingCartIcon, DollarSignIcon, TrendingUpIcon, LoaderIcon } from 'lucide-react'
import { toast } from 'sonner'

function App() {
  const { products, loading, error, fetchProducts, createProduct, getUniqueValues } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [vendors, setVendors] = useState([])
  const [types, setTypes] = useState([])
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [imageAltText, setImageAltText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    Title: '',
    Handle: '',
    'Body (HTML)': '',
    Vendor: '',
    'Product Category': '',
    Type: '',
    Tags: '',
    Published: true,
    'Variant Price': '',
    'Variant Compare At Price': '',
    'Variant SKU': '',
    'Variant Inventory Qty': 0,
    'Variant Grams': '',
    'SEO Title': '',
    'SEO Description': '',
    'Image Src': '',
    'Image Alt Text': '',
    Status: 'active'
  })

  // Load filter options
  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        setFiltersLoading(true)
        
        // Hardcoded values to prevent API issues - you can replace with API calls later
        const vendorList = ['GNC', 'Harney & Sons', 'Himalayan Organic', 'Wellbeing Nutrition']
        const typeList = ['Supplement', 'Tea', 'Vitamin', 'Protein', 'Health Food']
        
        // Uncomment below to use API calls when CORS is fixed
        // const [vendorList, typeList] = await Promise.all([
        //   getUniqueValues('Vendor'),
        //   getUniqueValues('Type')
        // ])
        
        setVendors(vendorList || [])
        setTypes(typeList || [])
      } catch (error) {
        console.error('Error loading filter options:', error)
        setVendors([])
        setTypes([])
      } finally {
        setFiltersLoading(false)
      }
    }
    loadFilterOptions()
  }, []) // Remove getUniqueValues dependency to prevent infinite loop

  const handleAddVendor = (newVendor) => {
    if (!vendors.includes(newVendor)) {
      setVendors(prev => [...prev, newVendor].sort())
    }
  }

  const handleAddType = (newType) => {
    if (!types.includes(newType)) {
      setTypes(prev => [...prev, newType].sort())
    }
  }

  // Initial load
  useEffect(() => {
    fetchProducts()
  }, []) // Only run once on mount

  // Handle search and filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchProducts(searchTerm, filters)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, filters]) // Remove fetchProducts from dependencies

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      toast.loading('Creating product...', { id: 'create-product' })
      
      const result = await createProduct(formData)
      
      if (result.success) {
        toast.success('Product created successfully!', { 
          id: 'create-product',
          description: `${formData.Title} has been added to your store.`
        })
        
        setIsAddModalOpen(false)
        setFormData({
          Title: '',
          Handle: '',
          'Body (HTML)': '',
          Vendor: '',
          'Product Category': '',
          Type: '',
          Tags: '',
          Published: true,
          'Variant Price': '',
          'Variant Compare At Price': '',
          'Variant SKU': '',
          'Variant Inventory Qty': 0,
          'Variant Grams': '',
          'SEO Title': '',
          'SEO Description': '',
          'Image Src': '',
          'Image Alt Text': '',
          Status: 'active'
        })
        setImageAltText('')
      } else {
        toast.error('Failed to create product', {
          id: 'create-product',
          description: result.error || 'An error occurred while creating the product.'
        })
      }
    } catch (error) {
      toast.error('Failed to create product', {
        id: 'create-product',
        description: 'An unexpected error occurred.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setIsDetailsModalOpen(true)
  }

  const formatPrice = (price) => {
    if (!price) return '$0.00'
    return `$${parseFloat(price).toFixed(2)}`
  }

  const stats = {
    total: products.length,
    published: products.filter(p => p.Published).length,
    draft: products.filter(p => !p.Published).length,
    totalValue: products.reduce((sum, p) => sum + (parseFloat(p['Variant Price']) || 0), 0)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Lumora Admin</h1>
              <p className="text-muted-foreground">Product Management Dashboard</p>
            </div>
            
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[85vw] max-w-[1200px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                  <DialogDescription>
                    Create a new product for your Shopify store
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Section 1: Product Identity */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">1</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Product Identity</h3>
                        <p className="text-sm text-muted-foreground">Basic product information and branding</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Product Title *</Label>
                        <Input
                          id="title"
                          value={formData.Title}
                          onChange={(e) => handleInputChange('Title', e.target.value)}
                          placeholder="Enter a clear, descriptive product name"
                          required
                          className="text-base"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Product Description</Label>
                        <Textarea
                          id="description"
                          value={formData['Body (HTML)']}
                          onChange={(e) => handleInputChange('Body (HTML)', e.target.value)}
                          placeholder="Describe your product's benefits, features, and usage instructions..."
                          rows={4}
                          className="text-base"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Brand/Vendor</Label>
                          <VendorPicker
                            value={formData.Vendor}
                            onValueChange={(value) => handleInputChange('Vendor', value)}
                            vendors={vendors}
                            onAddVendor={handleAddVendor}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>Product Category</Label>
                          <TypePicker
                            value={formData.Type}
                            onValueChange={(value) => handleInputChange('Type', value)}
                            types={types}
                            onAddType={handleAddType}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Pricing & Inventory */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">2</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Pricing & Stock</h3>
                        <p className="text-sm text-muted-foreground">Set pricing and manage inventory</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="price">Selling Price *</Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              id="price"
                              type="number"
                              step="0.01"
                              value={formData['Variant Price']}
                              onChange={(e) => handleInputChange('Variant Price', e.target.value)}
                              placeholder="0.00"
                              required
                              className="pl-8 text-base"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="inventory">Stock Quantity</Label>
                          <Input
                            id="inventory"
                            type="number"
                            value={formData['Variant Inventory Qty']}
                            onChange={(e) => handleInputChange('Variant Inventory Qty', parseInt(e.target.value) || 0)}
                            placeholder="0"
                            className="text-base"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="weight">Weight (grams)</Label>
                          <Input
                            id="weight"
                            type="number"
                            value={formData['Variant Grams']}
                            onChange={(e) => handleInputChange('Variant Grams', e.target.value)}
                            placeholder="0"
                            className="text-base"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="sku">SKU (Stock Keeping Unit)</Label>
                        <Input
                          id="sku"
                          value={formData['Variant SKU']}
                          onChange={(e) => handleInputChange('Variant SKU', e.target.value)}
                          placeholder="Enter unique product identifier"
                          className="text-base font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Product Images */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">3</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Product Images</h3>
                        <p className="text-sm text-muted-foreground">Upload high-quality product photos</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-6">
                      <ImageUploader
                        value={formData['Image Src']}
                        onChange={(value) => handleInputChange('Image Src', value)}
                        altText={formData['Image Alt Text']}
                        onAltTextChange={(value) => handleInputChange('Image Alt Text', value)}
                      />
                    </div>
                  </div>

                  {/* Section 4: Publishing */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-semibold text-sm">4</span>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">Publishing</h3>
                        <p className="text-sm text-muted-foreground">Control product visibility</p>
                      </div>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-6">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id="published"
                          checked={formData.Published}
                          onCheckedChange={(checked) => handleInputChange('Published', checked)}
                        />
                        <div>
                          <Label htmlFor="published" className="text-base font-medium">Make this product live</Label>
                          <p className="text-sm text-muted-foreground">Product will be visible to customers in your store</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsAddModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting} className="min-w-[120px]">
                      {isSubmitting ? (
                        <>
                          <LoaderIcon className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Product'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <PackageIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.published}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.draft}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPrice(stats.totalValue)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search products, handles, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filters.vendor || 'all-vendors'} onValueChange={(value) => setFilters(prev => ({ ...prev, vendor: value === 'all-vendors' ? undefined : value }))}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Vendor" />
                  </SelectTrigger>
                                     <SelectContent>
                     <SelectItem value="all-vendors">All Vendors</SelectItem>
                     {vendors.filter(vendor => vendor && vendor.trim()).map(vendor => (
                       <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                     ))}
                   </SelectContent>
                </Select>
                
                <Select value={filters.type || 'all-types'} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value === 'all-types' ? undefined : value }))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                                     <SelectContent>
                     <SelectItem value="all-types">All Types</SelectItem>
                     {types.filter(type => type && type.trim()).map(type => (
                       <SelectItem key={type} value={type}>{type}</SelectItem>
                     ))}
                   </SelectContent>
                </Select>
                
                <Select 
                  value={filters.published === undefined ? 'all-status' : filters.published.toString()} 
                  onValueChange={(value) => setFilters(prev => ({ 
                    ...prev, 
                    published: value === 'all-status' ? undefined : value === 'true' 
                  }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                                     <SelectContent>
                     <SelectItem value="all-status">All Status</SelectItem>
                     <SelectItem value="true">Published</SelectItem>
                     <SelectItem value="false">Draft</SelectItem>
                   </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-destructive">Error: {error}</p>
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="product-grid">
            {products.map((product) => (
              <Card 
                key={product.Handle} 
                className="group hover:shadow-md transition-all duration-200 cursor-pointer"
                onClick={() => handleProductClick(product)}
              >
                <div className="aspect-square relative overflow-hidden rounded-t-lg">
                  {product.images && product.images.length > 0 ? (
                    <img 
                      src={product.images[0].src} 
                      alt={product.images[0].alt || product.Title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : product['Image Src'] ? (
                    <img 
                      src={product['Image Src']} 
                      alt={product['Image Alt Text'] || product.Title}
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : (
                    <div className="image-placeholder">
                      <div className="text-center text-muted-foreground">
                        <div className="text-2xl mb-1">📷</div>
                        <div className="text-xs">No Image</div>
                      </div>
                    </div>
                  )}
                  <div className="image-placeholder" style={{ display: 'none' }}>
                    <div className="text-center text-muted-foreground">
                      <div className="text-2xl mb-1">❌</div>
                      <div className="text-xs">Image Error</div>
                    </div>
                  </div>
                  
                  <Badge 
                    variant={product.Published ? "default" : "secondary"}
                    className="absolute top-2 left-2 text-xs"
                  >
                    {product.Published ? 'Live' : 'Draft'}
                  </Badge>

                  {product.images && product.images.length > 1 && (
                    <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                      +{product.images.length - 1}
                    </Badge>
                  )}
                </div>

                <CardContent className="p-3">
                  <div className="space-y-2">
                    <h4 className="font-medium text-xs leading-tight line-clamp-2">
                      {product.Title || 'Untitled Product'}
                    </h4>
                    
                    <div className="text-xs text-muted-foreground truncate">
                      {product.Vendor}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">
                        {formatPrice(product['Variant Price'])}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {product['Variant Inventory Qty'] || 0} left
                      </span>
                    </div>

                    {product.Tags && (
                      <div className="flex flex-wrap gap-1">
                        {product.Tags.split(',').slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs px-1 py-0">
                            {tag.trim().replace(/"/g, '').substring(0, 8)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Product Details Modal */}
      <ProductDetailsModal
        product={selectedProduct}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
      />

      {/* Toast Notifications */}
      <Toaster />
    </div>
  )
}

export default App
