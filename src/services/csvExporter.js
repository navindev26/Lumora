/**
 * Shopify CSV Exporter Service
 * 
 * Handles the export of product data to Shopify-compatible CSV format
 * following Shopify's exact specifications and requirements.
 */

export class ShopifyCSVExporter {
  constructor() {
    // Shopify CSV headers in exact order as per documentation
    this.headers = [
      'Handle', 'Title', 'Body (HTML)', 'Vendor', 'Product Category', 'Type', 'Tags', 'Published',
      'Option1 Name', 'Option1 Value', 'Option1 Linked To', 'Option2 Name', 'Option2 Value', 'Option2 Linked To',
      'Option3 Name', 'Option3 Value', 'Option3 Linked To', 'Variant SKU', 'Variant Grams',
      'Variant Inventory Tracker', 'Variant Inventory Qty', 'Variant Inventory Policy',
      'Variant Fulfillment Service', 'Variant Price', 'Variant Compare At Price',
      'Variant Requires Shipping', 'Variant Taxable', 'Variant Barcode',
      'Image Src', 'Image Position', 'Image Alt Text', 'Gift Card', 'SEO Title', 'SEO Description',
      'Benefits (product.metafields.custom.benefits)',
      'Age group (product.metafields.shopify.age-group)',
      'Application method (product.metafields.shopify.application-method)',
      'Detailed ingredients (product.metafields.shopify.detailed-ingredients)',
      'Dietary preferences (product.metafields.shopify.dietary-preferences)',
      'Flavor (product.metafields.shopify.flavor)',
      'Ingredient category (product.metafields.shopify.ingredient-category)',
      'Product certifications & standards (product.metafields.shopify.product-certifications-standards)',
      'Variant Image', 'Variant Weight Unit', 'Variant Tax Code', 'Cost per item', 'Status'
    ]
  }

  /**
   * Safely formats CSV values by escaping quotes and wrapping in quotes if needed
   * @param {any} value - The value to format
   * @returns {string} - Properly formatted CSV value
   */
  formatCSVValue(value) {
    if (!value) return ''
    const stringValue = String(value)
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  /**
   * Generates a Shopify handle from a title
   * @param {string} title - Product title
   * @returns {string} - URL-safe handle
   */
  generateHandle(title) {
    if (!title) return 'product-' + Date.now()
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  /**
   * Parses image URLs from product data
   * @param {Object} product - Product data object
   * @returns {Array} - Array of image URLs
   */
  parseImageUrls(product) {
    try {
      if (product['Image URLs']) {
        return JSON.parse(product['Image URLs'])
      }
    } catch (e) {
      console.warn('Error parsing Image URLs:', e)
    }
    
    // Fallback to single image
    return [product['Image Src']].filter(Boolean)
  }

  /**
   * Creates the main product row following Shopify requirements
   * @param {Object} product - Product data object
   * @param {Array} imageUrls - Array of image URLs
   * @returns {Array} - CSV row array
   */
  createMainProductRow(product, imageUrls) {
    // Generate fallback values for missing required fields
    const title = product.Title || product.Handle || `${product.Vendor || 'Unknown'} Product` || 'Unnamed Product'
    const handle = product.Handle || this.generateHandle(title)
    const vendor = product.Vendor || 'Store Default'
    
    return [
      handle, // Required - auto-generated from title if blank
      this.formatCSVValue(title), // Required - with fallback
      this.formatCSVValue(product['Body (HTML)'] || ''), // Optional
      this.formatCSVValue(vendor), // Required - defaults to store name
      this.formatCSVValue(product['AI Product Category'] || ''), // Optional - Shopify taxonomy
      this.formatCSVValue(product.Type || 'Supplement'), // Optional
      this.formatCSVValue(product.Tags || ''), // Optional
      product.Published === false ? 'false' : 'true', // Required - defaults to true
      'Title', // Option1 Name - Required, defaults to "Title"
      'Default Title', // Option1 Value - Required, defaults to "Default Title"
      '', // Option1 Linked To
      '', // Option2 Name
      '', // Option2 Value
      '', // Option2 Linked To
      '', // Option3 Name
      '', // Option3 Value
      '', // Option3 Linked To
      product['Variant SKU'] || '', // Optional
      product['Variant Grams'] || '0', // Required - defaults to 0.0
      'shopify', // Variant Inventory Tracker
      product['Variant Inventory Qty'] || '0', // Required - defaults to 0
      'deny', // Required - deny/continue
      'manual', // Required - defaults to manual
      product['Variant Price'] || '0.00', // Required - defaults to 0.0
      product['Variant Compare At Price'] || '', // Optional
      'true', // Required - defaults to true (physical product)
      'true', // Required - defaults to true (taxable)
      '', // Variant Barcode - optional
      imageUrls[0] || '', // Image Src
      imageUrls[0] ? '1' : '', // Image Position - only if image exists
      this.formatCSVValue(imageUrls[0] ? (product['Image Alt Text'] || title || '') : ''), // Image Alt Text
      'false', // Gift Card - Required, defaults to false
      this.formatCSVValue(product['AI SEO Title'] || title || ''), // SEO Title
      this.formatCSVValue(product['AI SEO Description'] || ''), // SEO Description
      // Metafields
      this.formatCSVValue(product['AI Benefits'] || ''),
      product['AI Age Group'] || 'Adult',
      '', // Application method - not extracted by AI yet
      this.formatCSVValue(product['AI Detailed Ingredients'] || ''),
      product['AI Dietary Preferences'] || '',
      product['AI Flavor'] || '',
      product['AI How To Use'] || '', // Using as ingredient category for now
      this.formatCSVValue(product['AI Certifications'] || ''),
      '', // Variant Image
      'kg', // Required - defaults to kg
      '', // Variant Tax Code
      '', // Cost per item
      product.Status || 'active' // Required - defaults to active if present
    ]
  }

  /**
   * Creates additional image rows for products with multiple images
   * @param {Object} product - Product data object
   * @param {Array} imageUrls - Array of image URLs
   * @returns {Array} - Array of CSV row arrays
   */
  createAdditionalImageRows(product, imageUrls) {
    const additionalRows = []
    
    // Additional image rows (positions 2, 3, 4...) - Shopify requires separate rows for each image
    if (imageUrls.length > 1) {
      const title = product.Title || product.Handle || `${product.Vendor || 'Unknown'} Product` || 'Unnamed Product'
      const handle = product.Handle || this.generateHandle(title)
      
      for (let i = 1; i < imageUrls.length; i++) {
        const imageRow = new Array(this.headers.length).fill('')
        imageRow[0] = handle // Handle - required for all rows
        imageRow[28] = imageUrls[i] // Image Src - column index for Image Src
        imageRow[29] = (i + 1).toString() // Image Position - sequential numbering
        imageRow[30] = this.formatCSVValue(`${title} - Image ${i + 1}`) // Image Alt Text
        additionalRows.push(imageRow)
      }
    }
    
    return additionalRows
  }

  /**
   * Exports products to Shopify-compatible CSV format
   * @param {Array} products - Array of product objects
   * @param {string} filename - Optional filename (defaults to shopify-products-export.csv)
   * @returns {Promise<void>} - Downloads the CSV file
   */
  async exportToCSV(products, filename = 'shopify-products-export.csv') {
    if (!products || products.length === 0) {
      throw new Error('No products provided for export')
    }

    // Create CSV rows
    const csvRows = []
    
    // Add headers
    csvRows.push(this.headers.join(','))

    // Process each product
    products.forEach(product => {
      // Parse image URLs from product data
      const imageUrls = this.parseImageUrls(product)
      
      // Create main product row
      const mainRow = this.createMainProductRow(product, imageUrls)
      csvRows.push(mainRow.join(','))
      
      // Create additional image rows
      const additionalRows = this.createAdditionalImageRows(product, imageUrls)
      additionalRows.forEach(row => {
        csvRows.push(row.join(','))
      })
    })

    // Create and download CSV file
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    
    // Create download link
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }

    return {
      success: true,
      totalProducts: products.length,
      totalRows: csvRows.length - 1, // Exclude header row
      filename
    }
  }

  /**
   * Validates product data before export
   * @param {Array} products - Array of product objects
   * @returns {Object} - Validation result with errors and warnings
   */
  validateProducts(products) {
    const errors = []
    const warnings = []
    
    if (!products || products.length === 0) {
      errors.push('No products provided for validation')
      return { isValid: false, errors, warnings }
    }

    products.forEach((product, index) => {
      // Check required fields with more lenient validation
      if (!product.Title && !product.Handle && !product.Vendor) {
        errors.push(`Product ${index + 1}: Missing all identifying fields (Title, Handle, Vendor) - cannot export`)
      } else {
        // Warnings for missing fields that can be auto-generated
        if (!product.Title) {
          warnings.push(`Product ${index + 1}: Missing Title - will use Handle or generate from Vendor`)
        }
        
        if (!product.Handle) {
          warnings.push(`Product ${index + 1}: Missing Handle - will be auto-generated from Title`)
        }
        
        if (!product.Vendor) {
          warnings.push(`Product ${index + 1}: Missing Vendor - will use store default`)
        }
      }

      // Check price format (non-blocking)
      if (product['Variant Price'] && isNaN(parseFloat(product['Variant Price']))) {
        warnings.push(`Product ${index + 1}: Invalid price format - will default to 0.00`)
      }

      // Check weight format (non-blocking)
      if (product['Variant Grams'] && isNaN(parseFloat(product['Variant Grams']))) {
        warnings.push(`Product ${index + 1}: Invalid weight format - will default to 0`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalProducts: products.length
    }
  }

  /**
   * Gets export statistics
   * @param {Array} products - Array of product objects
   * @returns {Object} - Export statistics
   */
  getExportStats(products) {
    if (!products || products.length === 0) {
      return {
        totalProducts: 0,
        totalVariants: 0,
        totalImages: 0,
        estimatedRows: 0
      }
    }

    let totalImages = 0
    let estimatedRows = products.length // One row per product minimum

    products.forEach(product => {
      const imageUrls = this.parseImageUrls(product)
      totalImages += imageUrls.length
      
      // Additional rows for extra images
      if (imageUrls.length > 1) {
        estimatedRows += imageUrls.length - 1
      }
    })

    return {
      totalProducts: products.length,
      totalVariants: products.length, // Assuming single variant per product
      totalImages,
      estimatedRows: estimatedRows + 1 // +1 for header row
    }
  }
}

// Export singleton instance
export const csvExporter = new ShopifyCSVExporter()
