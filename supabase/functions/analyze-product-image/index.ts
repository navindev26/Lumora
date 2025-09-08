import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Analyze product images using OpenAI Vision
async function analyzeProductImages(imageUrls: string[]) {
  const imageAnalysisText = imageUrls.length > 1 
    ? 'Analyze these ' + imageUrls.length + ' product images together'
    : 'Analyze this product image';
    
  const prompt = `You are an expert data entry operator with 15+ years of experience creating supplement product listings for Shopify stores. Your job is to extract COMPLETE and ACCURATE product information that requires minimal human review.

${imageAnalysisText} and extract ALL possible product details for a professional Shopify listing.

EXTRACT EVERY DETAIL VISIBLE and return ONLY valid JSON in this exact format:
{
  "title": "Complete SEO-optimized product title with brand, product name, strength, and key benefits",
  "vendor": "Exact brand/manufacturer name as shown on packaging",
  "type": "Specific product category (Supplement, Vitamin, Protein, Pre-Workout, Post-Workout, Mineral, Herbal, Tea)",
  "tags": "Comprehensive Shopify tags: Health, Wellness, specific benefits, target audience, ingredients",
  "sku": "Professional SKU based on brand-product-strength format",
  "benefits": "Detailed health benefits and effects extracted from packaging",
  "detailedIngredients": "Complete ingredient list with exact amounts, percentages, and daily values",
  "certifications": "All visible certifications (GMP, FDA, Organic, Non-GMO, Third-Party Tested, etc.)",
  "ageGroup": "Target age group based on product (Adult, Teen, Senior, All Ages)",
  "dietaryPreferences": "All dietary information (Vegan, Vegetarian, Gluten-Free, Kosher, Halal, etc.)",
  "flavor": "Product flavor or taste (Unflavored, Natural, Berry, Chocolate, Vanilla, etc.)",
  "servingSize": "Exact serving size from supplement facts panel",
  "servingsPerContainer": "Exact number of servings per container from label",
  "seoTitle": "SEO-optimized title under 60 characters for search engines",
  "seoDescription": "SEO meta description under 160 characters highlighting key benefits",
  "productCategory": "Full Shopify category path like: Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements > [Specific Type]",
  "howToUse": "Exact directions for use from packaging (dosage, timing, instructions)",
  "warnings": "All warnings, contraindications, and safety information from packaging"
}

CRITICAL REQUIREMENTS:
- Extract EVERY visible detail from ALL images
- Create professional, compelling copy that sells the product
- Use exact information from supplement facts panels
- Include all certifications, warnings, and directions
- Create professional SKU codes following industry standards
- Fill ALL fields with meaningful, accurate information

FORMAT REQUIREMENTS:
- benefits: Simple CSV-style string 
- detailedIngredients: Simple CSV-style string 
- DO NOT return JSON arrays for these fields - convert to readable text strings`;

  try {
    const input = [{
      role: "user",
      content: [
        { type: "input_text", text: prompt },
        ...imageUrls.map(url => ({
          type: "input_image",
          image_url: url
        }))
      ]
    }];

    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openaiApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        input: input
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error('OpenAI API error: ' + response.status + ' - ' + errorText);
    }

    const data = await response.json();
    
    // Extract content from OpenAI response
    const textContent = data.output?.[0]?.content?.find(c => c.type === 'output_text');
    const result = textContent?.text;
    
    if (!result) {
      throw new Error('No content received from OpenAI');
    }

    // Parse JSON response
    const cleanedResult = result.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
    const finalResult = jsonMatch ? jsonMatch[0] : cleanedResult;
    
    const analyzedProduct = JSON.parse(finalResult);

    // Debug logging for benefits and ingredients
    console.log('🔍 Raw AI response for benefits:', analyzedProduct.benefits);
    console.log('🔍 Raw AI response for detailedIngredients:', analyzedProduct.detailedIngredients);
    console.log('🔍 Benefits type:', typeof analyzedProduct.benefits);
    console.log('🔍 DetailedIngredients type:', typeof analyzedProduct.detailedIngredients);

    // Map field names to what ProductForm expects
    if (analyzedProduct.benefits) {
      analyzedProduct.benefitsStructured = analyzedProduct.benefits;
    }
    if (analyzedProduct.detailedIngredients) {
      analyzedProduct.ingredientsStructured = analyzedProduct.detailedIngredients;
    }

    // Ensure required fields
    const requiredFields = ['title', 'description', 'vendor', 'type'];
    for (const field of requiredFields) {
      if (!analyzedProduct[field]) {
        analyzedProduct[field] = field === 'title' ? 'Unknown Product' : 
                                 field === 'vendor' ? 'Unknown Brand' : 
                                 field === 'type' ? 'Supplement' : 'Information not available';
      }
    }

    return analyzedProduct;

  } catch (error) {
    console.error('❌ Analysis error:', error);
    return {
      title: 'Analysis Failed - Manual Entry Required',
      description: '<p>Unable to analyze product images automatically. Please enter product details manually.</p>',
      vendor: 'Unknown Brand',
      type: 'Supplement',
      tags: 'Health, Supplement, Manual Entry Required',
      price: 0,
      weight: 0,
      sku: 'PENDING-MANUAL',
      confidence: 0,
      imagesAnalyzed: imageUrls.length,
      benefits: 'Please enter health benefits manually',
      detailedIngredients: 'Please enter complete ingredient list',
      certifications: 'Check package for certifications',
      ageGroup: 'Adult',
      dietaryPreferences: 'Check package for dietary information',
      flavor: 'Check package for flavor information',
      servingSize: 'Check supplement facts panel',
      servingsPerContainer: 'Check supplement facts panel',
      seoTitle: 'Manual Entry Required',
      seoDescription: 'Please create SEO description manually based on product benefits',
      productCategory: 'Health & Beauty > Health Care > Fitness & Nutrition > Vitamins & Supplements',
      ingredientCategory: 'Please categorize ingredients manually',
      benefitsStructured: 'Please enter structured benefits manually',
      ingredientsStructured: 'Please enter structured ingredients list manually',
      howToUse: 'Please enter usage instructions manually',
      warnings: 'Please enter warnings and safety information manually',
      error: error.message
    };
  }
}

// Generate product handle
function generateHandle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// Store analyzed product data
async function storeAnalyzedProduct(productData: any, imageUrl: string) {
  try {
    const handle = generateHandle(productData.title);
    
    const productRecord = {
      Handle: handle,
      Title: productData.title,
      Vendor: productData.vendor,
      Type: productData.type,
      Tags: productData.tags,
      'Variant SKU': productData.sku,
      'Image Src': imageUrl,
      'Image Alt Text': productData.title + ' - ' + productData.vendor,
      Published: false,
      Status: 'draft',
      'Variant Inventory Qty': 0,
      // Store all AI-extracted fields
      'AI Benefits': productData.benefits,
      'AI Detailed Ingredients': productData.detailedIngredients,
      'AI Certifications': productData.certifications,
      'AI Age Group': productData.ageGroup,
      'AI Dietary Preferences': productData.dietaryPreferences,
      'AI Flavor': productData.flavor,
      'AI Serving Size': productData.servingSize,
      'AI Servings Per Container': productData.servingsPerContainer,
      'AI SEO Title': productData.seoTitle,
      'AI SEO Description': productData.seoDescription,
      'AI Product Category': productData.productCategory,
      'AI How To Use': productData.howToUse,
      'AI Warnings': productData.warnings,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('shopify_products_complete')
      .insert([productRecord])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('❌ Error storing product:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { imageUrl, imageUrls, action = 'analyze' } = await req.json();

    // Support both single and multiple images
    const imagesToProcess = imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0 
      ? imageUrls 
      : imageUrl ? [imageUrl] : [];

    if (imagesToProcess.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing imageUrl or imageUrls' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Analyze the product images
    const analyzedProduct = await analyzeProductImages(imagesToProcess);

    if (action === 'analyze-only') {
      return new Response(JSON.stringify({
        success: true,
        analysis: analyzedProduct,
        message: 'Product image analyzed successfully'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // Store analyzed product as draft
    const primaryImageUrl = imagesToProcess[0];
    const storedProduct = await storeAnalyzedProduct(analyzedProduct, primaryImageUrl);

    return new Response(JSON.stringify({
      success: true,
      productId: storedProduct.id,
      handle: storedProduct.Handle,
      analysis: analyzedProduct,
      product: storedProduct,
      message: 'Product analyzed and stored as draft for review'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Process error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
});