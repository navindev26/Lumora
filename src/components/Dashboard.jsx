import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '@/hooks/useSupabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ProductDetailsModal } from './ProductDetailsModal'
import { csvExporter } from '../services/csvExporter'
import { SearchIcon, PackageIcon, ShoppingCartIcon, DollarSignIcon, TrendingUpIcon, Sparkles, DownloadIcon } from 'lucide-react'
import { toast } from 'sonner'

export function Dashboard() {
  const navigate = useNavigate()
  const { products, loading, error, fetchProducts, deleteProduct, getUniqueValues } = useProducts()
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({})
  const [vendors, setVendors] = useState([])
  const [types, setTypes] = useState([])
  const [filtersLoading, setFiltersLoading] = useState(true)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)

  // Load filter options
  useEffect(() => {
    const loadFilters = async () => {
      setFiltersLoading(true)
      try {
        const filterValues = await getUniqueValues()
        setVendors(filterValues.vendors || [])
        setTypes(filterValues.types || [])
      } catch (error) {
        console.error('Error loading filter values:', error)
      } finally {
        setFiltersLoading(false)
      }
    }

    loadFilters()
  }, [getUniqueValues])

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm || 
      product.Title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.Tags?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesVendor = !filters.vendor || product.Vendor === filters.vendor
    const matchesType = !filters.type || product.Type === filters.type
    const matchesPublished = filters.published === undefined || product.Published === filters.published
    
    return matchesSearch && matchesVendor && matchesType && matchesPublished
  })

  const handleProductClick = (product) => {
    setSelectedProduct(product)
    setIsDetailsModalOpen(true)
  }

  const formatPrice = (price) => {
    if (!price) return '$0.00'
    return `$${parseFloat(price).toFixed(2)}`
  }

  // Export products to Shopify CSV format using the CSV service
  const exportToShopifyCSV = async () => {
    try {
      toast.loading('Generating Shopify CSV...', { id: 'export-csv' })

      // Validate products before export
      const validation = csvExporter.validateProducts(products)
      
      if (!validation.isValid) {
        toast.error(`Export failed: ${validation.errors.join(', ')}`, { id: 'export-csv' })
        return
      }

      // Show warnings if any
      if (validation.warnings.length > 0) {
        console.warn('CSV Export warnings:', validation.warnings)
      }

      // Get export statistics
      const stats = csvExporter.getExportStats(products)
      
      // Export to CSV with timestamped filename
      const filename = `shopify-products-${new Date().toISOString().split('T')[0]}.csv`
      const result = await csvExporter.exportToCSV(products, filename)
      
      toast.success(
        `✅ Exported ${result.totalProducts} products (${result.totalRows} rows) to Shopify CSV`, 
        { 
          id: 'export-csv',
          description: `${stats.totalImages} images total across ${stats.estimatedRows} CSV rows.`
        }
      )
      
      console.log('Export completed:', {
        ...result,
        stats,
        warnings: validation.warnings
      })

    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export CSV', {
        id: 'export-csv',
        description: error.message || 'Please try again.'
      })
    }
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
            
            <div className="flex gap-3">
              {/* Export to Shopify CSV */}
              <Button 
                variant="outline" 
                onClick={exportToShopifyCSV}
                disabled={products.length === 0}
                className="gap-2 border-green-200 text-green-700 hover:bg-green-50"
              >
                <DownloadIcon className="h-4 w-4" />
                Export to Shopify CSV
              </Button>

              {/* AI Product Creation Button */}
              <Button 
                variant="outline" 
                className="gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                onClick={() => navigate('/create-product')}
              >
                <Sparkles className="h-4 w-4" />
                AI Create Product
              </Button>
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
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No products found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
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
          onDelete={deleteProduct}
        />
      </div>
    </div>
  )
}
