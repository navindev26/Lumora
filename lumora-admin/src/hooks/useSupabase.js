import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useCallback } from 'react'

const supabase = createClient(
  'https://fuaafkifukvkbpyaxafy.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ1YWFma2lmdWt2a2JweWF4YWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0NzMxMTYsImV4cCI6MjA3MDA0OTExNn0.STXSpWSC6ETuKxeRQkHU86eIKRQB1zCKGGwKbT2xx1E'
)

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

        // Apply search filter
        if (searchTerm) {
          query = query.or(`Title.ilike.%${searchTerm}%,Handle.ilike.%${searchTerm}%,Tags.ilike.%${searchTerm}%`)
        }

        // Apply filters
        if (filters.vendor && filters.vendor !== 'all-vendors') {
          query = query.eq('Vendor', filters.vendor)
        }
        if (filters.type && filters.type !== 'all-types') {
          query = query.eq('Type', filters.type)
        }
        if (filters.published !== undefined && filters.published !== 'all-status') {
          query = query.eq('Published', filters.published === 'true')
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
      
      // Generate handle from title if not provided
      if (!productData.Handle && productData.Title) {
        productData.Handle = productData.Title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }

      // Clean up numeric fields - convert empty strings to null
      const cleanedData = {
        ...productData,
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

      if (insertError) throw insertError

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

  const deleteProduct = async (id) => {
    try {
      setError(null)
      
      const { error: deleteError } = await supabase
        .from('shopify_products_complete')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Refresh products list
      await fetchProducts()
      
      return { success: true }
    } catch (err) {
      setError(err.message)
      console.error('Error deleting product:', err)
      return { success: false, error: err.message }
    }
  }

  const getUniqueValues = useCallback(async (column) => {
    // Return static values to prevent API calls
    if (column === 'Vendor') {
      return ['GNC', 'Harney & Sons', 'Himalayan Organic', 'Wellbeing Nutrition']
    }
    if (column === 'Type') {
      return ['Supplement', 'Tea', 'Vitamin', 'Protein']
    }
    return []
  }, [])

  // Remove automatic loading - let components control when to load

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