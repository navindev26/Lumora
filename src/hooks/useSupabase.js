import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useCallback } from 'react'

// Initialize Supabase client with proper error handling
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase = null
if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://')) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.warn('Failed to initialize Supabase client:', error)
    supabase = null
  }
} else {
  console.info('Supabase not configured, using static data for development')
}

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Static demo data to prevent API issues
  const staticProducts = [
    {
      Handle: 'premium-multivitamin',
      Title: 'Premium Daily Multivitamin',
      Vendor: 'GNC',
      Type: 'Supplement',
      'Variant Price': '29.99',
      'Variant Inventory Qty': 50,
      Published: true,
      Tags: '"Health", "Vitamins", "Daily"',
      'Image Src': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&h=400&fit=crop',
      images: []
    },
    {
      Handle: 'organic-green-tea',
      Title: 'Organic Green Tea Blend',
      Vendor: 'Harney & Sons',
      Type: 'Tea',
      'Variant Price': '19.99',
      'Variant Inventory Qty': 25,
      Published: true,
      Tags: '"Tea", "Organic", "Antioxidant"',
      'Image Src': 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
      images: []
    },
    {
      Handle: 'protein-powder-vanilla',
      Title: 'Whey Protein Powder - Vanilla',
      Vendor: 'Wellbeing Nutrition',
      Type: 'Supplement',
      'Variant Price': '49.99',
      'Variant Inventory Qty': 30,
      Published: true,
      Tags: '"Protein", "Fitness", "Vanilla"',
      'Image Src': 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=400&h=400&fit=crop',
      images: []
    },
    {
      Handle: 'himalayan-turmeric',
      Title: 'Himalayan Turmeric Capsules',
      Vendor: 'Himalayan Organic',
      Type: 'Supplement',
      'Variant Price': '24.99',
      'Variant Inventory Qty': 40,
      Published: true,
      Tags: '"Turmeric", "Anti-inflammatory", "Organic"',
      'Image Src': 'https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=400&h=400&fit=crop',
      images: []
    },
    {
      Handle: 'omega-3-fish-oil',
      Title: 'Omega-3 Fish Oil Softgels',
      Vendor: 'GNC',
      Type: 'Supplement',
      'Variant Price': '34.99',
      'Variant Inventory Qty': 60,
      Published: true,
      Tags: '"Omega-3", "Heart Health", "Fish Oil"',
      'Image Src': 'https://images.unsplash.com/photo-1559181567-c3190ca9959b?w=400&h=400&fit=crop',
      images: []
    },
    {
      Handle: 'chamomile-tea',
      Title: 'Chamomile Relaxation Tea',
      Vendor: 'Harney & Sons',
      Type: 'Tea',
      'Variant Price': '16.99',
      'Variant Inventory Qty': 35,
      Published: false,
      Tags: '"Tea", "Relaxation", "Herbal"',
      'Image Src': 'https://images.unsplash.com/photo-1597318281675-9f299dd6d96d?w=400&h=400&fit=crop',
      images: []
    }
  ]

  const fetchProducts = useCallback(async (searchTerm = '', filters = {}) => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch from Supabase first
      try {
        let query = supabase.from('shopify_products_complete').select('*')

        // Apply search filter with quoted column names
        if (searchTerm) {
          query = query.or(`"Title".ilike.%${searchTerm}%,"Handle".ilike.%${searchTerm}%,"Tags".ilike.%${searchTerm}%`)
        }

        // Apply filters with quoted column names
        if (filters.vendor && filters.vendor !== 'all-vendors') {
          query = query.eq('"Vendor"', filters.vendor)
        }
        if (filters.type && filters.type !== 'all-types') {
          query = query.eq('"Type"', filters.type)
        }
        if (filters.published !== undefined && filters.published !== 'all-status') {
          query = query.eq('"Published"', filters.published === 'true')
        }

        // Order by most recent first
        query = query.order('created_at', { ascending: false })

        const { data, error: fetchError } = await query

        if (fetchError) throw fetchError

        // Group products by handle to combine images
        const groupedProducts = {}
        data.forEach(product => {
          const handle = product.Handle
          if (!groupedProducts[handle]) {
            groupedProducts[handle] = {
              ...product,
              images: []
            }
          }
          
          if (product['Image Src']) {
            groupedProducts[handle].images.push({
              src: product['Image Src'],
              alt: product['Image Alt Text'] || '',
              position: product['Image Position'] || 1
            })
          }
        })

        const productList = Object.values(groupedProducts)
        setProducts(productList)
        
      } catch (supabaseError) {
        console.warn('Supabase fetch failed, using static data:', supabaseError)
        
        // Fallback to static data with client-side filtering
        let filteredProducts = [...staticProducts]

        // Apply search filter
        if (searchTerm) {
          filteredProducts = filteredProducts.filter(product => 
            product.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.Handle.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.Tags.toLowerCase().includes(searchTerm.toLowerCase())
          )
        }

        // Apply filters
        if (filters.vendor && filters.vendor !== 'all-vendors') {
          filteredProducts = filteredProducts.filter(product => product.Vendor === filters.vendor)
        }
        if (filters.type && filters.type !== 'all-types') {
          filteredProducts = filteredProducts.filter(product => product.Type === filters.type)
        }
        if (filters.published !== undefined && filters.published !== 'all-status') {
          filteredProducts = filteredProducts.filter(product => product.Published === (filters.published === 'true'))
        }

        setProducts(filteredProducts)
      }
    } catch (err) {
      setError(err.message)
      console.error('Error fetching products:', err)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  const createProduct = async (productData) => {
    try {
      setError(null)
      
      // Generate handle from title - ensure it's not empty and not too long
      let handle = productData.Handle || ''
      if (!handle && productData.Title) {
        handle = productData.Title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
          .substring(0, 250) // Ensure it's under 255 character limit
      }
      
      // Ensure handle is not empty
      if (!handle) {
        handle = `product-${Date.now()}`
      }
      
      productData.Handle = handle

      // Ensure Title is not empty
      if (!productData.Title || productData.Title.trim() === '') {
        throw new Error('Product title is required')
      }

      // Validate image URL - don't allow blob URLs
      if (productData['Image Src'] && productData['Image Src'].startsWith('blob:')) {
        console.warn('Removing blob URL from product data')
        productData['Image Src'] = ''
        productData['Image Alt Text'] = ''
      }

      // Clean up numeric fields - convert empty strings to null
      const cleanedData = {
        ...productData,
        Title: productData.Title.trim(), // Ensure title is trimmed
        Handle: handle, // Use the generated handle
        'Variant Price': productData['Variant Price'] === '' ? null : parseFloat(productData['Variant Price']) || null,
        'Variant Compare At Price': productData['Variant Compare At Price'] === '' ? null : parseFloat(productData['Variant Compare At Price']) || null,
        'Variant Grams': productData['Variant Grams'] === '' ? null : parseFloat(productData['Variant Grams']) || null,
        'Variant Inventory Qty': productData['Variant Inventory Qty'] === '' ? 0 : parseInt(productData['Variant Inventory Qty']) || 0,
        'Image Position': productData['Image Position'] === '' ? null : parseInt(productData['Image Position']) || null,
        'Cost per item': productData['Cost per item'] === '' ? null : parseFloat(productData['Cost per item']) || null,
      }

      // Save to Supabase
      const { data, error: insertError } = await supabase
        .from('shopify_products_complete')
        .insert([cleanedData])
        .select()

      if (insertError) {
        console.error('Supabase insert error:', insertError)
        let errorMessage = insertError.message
        
        // Provide more specific error messages
        if (insertError.message.includes('duplicate key')) {
          errorMessage = 'A product with this handle already exists. Please use a different title.'
        } else if (insertError.message.includes('violates not-null')) {
          errorMessage = 'Required fields are missing. Please check your input.'
        } else if (insertError.message.includes('violates check')) {
          errorMessage = 'Invalid data format. Please check your input values.'
        } else if (insertError.message.includes('invalid input syntax')) {
          errorMessage = 'Invalid data format. Please check numeric fields.'
        } else if (insertError.message.includes('string did not match')) {
          errorMessage = 'Invalid format in one of the fields. Please check your input.'
        }
        
        throw new Error(errorMessage)
      }

      // Refresh the product list to show the new product
      await fetchProducts()
      
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      console.error('Error creating product:', err)
      return { success: false, error: err.message }
    }
  }

  const updateProduct = async (id, productData) => {
    try {
      setError(null)
      
      const { data, error: updateError } = await supabase
        .from('shopify_products_complete')
        .update(productData)
        .eq('id', id)
        .select()

      if (updateError) throw updateError

      // Refresh products list
      await fetchProducts()
      
      return { success: true, data }
    } catch (err) {
      setError(err.message)
      console.error('Error updating product:', err)
      return { success: false, error: err.message }
    }
  }

  const deleteProduct = async (handle) => {
    try {
      setError(null)
      
      // Delete by handle since that's what we have in the UI
      const { error: deleteError } = await supabase
        .from('shopify_products_complete')
        .delete()
        .eq('Handle', handle)

      if (deleteError) throw deleteError

      // Remove from current products list immediately for better UX
      setProducts(prev => prev.filter(product => product.Handle !== handle))
      
      return { success: true }
    } catch (err) {
      setError(err.message)
      console.error('Error deleting product:', err)
      return { success: false, error: err.message }
    }
  }

  const getUniqueValues = useCallback(async () => {
    try {
      // Get unique vendors and types from database
      const { data: vendorData } = await supabase
        .from('shopify_products_complete')
        .select('"Vendor"')
        .not('"Vendor"', 'is', null)
        .neq('"Vendor"', '')

      const { data: typeData } = await supabase
        .from('shopify_products_complete')
        .select('"Type"')
        .not('"Type"', 'is', null)
        .neq('"Type"', '')

      const vendors = [...new Set(vendorData?.map(item => item.Vendor).filter(Boolean))] || []
      const types = [...new Set(typeData?.map(item => item.Type).filter(Boolean))] || []

      return { vendors, types }
    } catch (error) {
      console.warn('Error fetching unique values:', error)
      // Fallback to static values
      return {
        vendors: ['GNC', 'Harney & Sons', 'Himalayan Organic', 'Wellbeing Nutrition', 'HealthyHey Foods LLP'],
        types: ['Supplement', 'Tea', 'Vitamin', 'Protein']
      }
    }
  }, [])

  // Auto-fetch products on mount
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    getUniqueValues,
  }
} 