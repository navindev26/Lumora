import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// Initialize Supabase client with service role key
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Analyze product image using OpenAI Vision
async function analyzeProductImage(imageUrl: string) {
  const prompt = `
Analyze this product image and extract detailed product information. Return ONLY valid JSON in this exact format:

{
  "title": "Clear, descriptive product name",
  "description": "Detailed product description including benefits, ingredients, usage instructions (HTML format)",
  "vendor": "Brand or manufacturer name",
  "type": "Product category (Supplement, Tea, Vitamin, Protein, etc.)",
  "tags": "Comma-separated tags in quotes like: \"Health\", \"Vitamins\", \"Energy\"",
  "price": "Estimated retail price as number (e.g., 29.99)",
  "weight": "Product weight in grams as number",
  "sku": "Generate a SKU based on product name",
  "confidence": "Analysis confidence from 0-100"
}

Focus on:
- Clear, marketable product title
- Detailed description with benefits and usage
- Accurate brand identification
- Relevant product category
- Appropriate supplement/health tags
- Realistic pricing estimate
- Weight estimation from package size
- Professional SKU generation

Image URL: ${imageUrl}
`;

  try {
    console.log('🤖 Making OpenAI Vision API call for product analysis...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a professional product analyst specializing in health supplements and wellness products. Analyze product images and extract detailed information accurately.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI Vision');
    }

    console.log('📝 Raw OpenAI Vision response:', content);

    // Parse the JSON response
    const analyzedProduct = JSON.parse(content.trim());

    // Validate the response structure
    const requiredFields = ['title', 'description', 'vendor', 'type', 'tags'];
    for (const field of requiredFields) {
      if (!analyzedProduct[field]) {
        console.warn(`⚠️ Missing field: ${field}`);
      }
    }

    console.log('✅ Successfully analyzed product:', {
      title: analyzedProduct.title,
      vendor: analyzedProduct.vendor,
      type: analyzedProduct.type,
      confidence: analyzedProduct.confidence
    });

    return analyzedProduct;
  } catch (error) {
    console.error('❌ Error analyzing product image:', error);
    // Return fallback values if AI processing fails
    return {
      title: 'Product Analysis Pending',
      description: 'Product image uploaded. Manual description needed.',
      vendor: 'Unknown Brand',
      type: 'Supplement',
      tags: '"Health", "Supplement"',
      price: 0,
      weight: 0,
      sku: 'PENDING-SKU',
      confidence: 0,
      error: error.message
    };
  }
}

// Generate product handle from title
function generateHandle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Store analyzed product data
async function storeAnalyzedProduct(productData: any, imageUrl: string) {
  try {
    console.log('💾 Storing analyzed product data...');

    const handle = generateHandle(productData.title);
    
    const productRecord = {
      Handle: handle,
      Title: productData.title,
      'Body (HTML)': productData.description,
      Vendor: productData.vendor,
      Type: productData.type,
      Tags: productData.tags,
      'Variant Price': productData.price || null,
      'Variant Grams': productData.weight || null,
      'Variant SKU': productData.sku,
      'Image Src': imageUrl,
      'Image Alt Text': `${productData.title} - ${productData.vendor}`,
      Published: false, // Default to draft for review
      Status: 'draft',
      'Variant Inventory Qty': 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('shopify_products_complete')
      .insert([productRecord])
      .select()
      .single();

    if (error) {
      console.error('❌ Error storing product:', error);
      throw error;
    }

    console.log('✅ Product stored successfully:', data.Handle);
    return data;
  } catch (error) {
    console.error('❌ Error in storeAnalyzedProduct:', error);
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
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    const { imageUrl, action = 'analyze' } = await req.json();

    if (!imageUrl) {
      return new Response(JSON.stringify({
        error: 'Missing imageUrl'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }

    console.log(`📸 Processing product image: ${imageUrl}`);

    // Step 1: Analyze the product image
    const analyzedProduct = await analyzeProductImage(imageUrl);

    if (action === 'analyze-only') {
      // Return analysis without storing
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

    // Step 2: Store the analyzed product as draft
    const storedProduct = await storeAnalyzedProduct(analyzedProduct, imageUrl);

    console.log('✅ Product analysis and storage completed');

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
    console.error('❌ Process product image error:', error);
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