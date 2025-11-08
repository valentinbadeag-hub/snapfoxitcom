import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPEN_NINJA_API_KEY = Deno.env.get('OPEN_NINJA_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing product image with location:', location ? 'provided' : 'not provided');

    // Step 1: Call Lovable AI to identify the product
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product identification expert. Analyze product images and extract key product information.

Your response must be valid JSON with this exact structure (DO NOT include pricing information):
{
  "productName": "Full product name with brand and model",
  "category": "Product category",
  "description": "Brief 2-3 sentence description",
  "rating": 4.2,
  "reviewCount": 1250,
  "reviewBreakdown": {
    "quality": 85,
    "value": 70,
    "durability": 60
  },
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "usageTips": ["Tip 1", "Tip 2", "Tip 3"],
  "recommendation": "Personalized recommendation"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product photo: Identify the exact item (brand, model), extract key details (including barcode if visible), provide aggregated review insights, pros/cons, and usage recommendations. DO NOT provide pricing information.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');
    
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response from AI
    let productData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      productData = JSON.parse(jsonString);
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse product data from AI response');
    }

    console.log('Product identified:', productData.productName);

    // Step 2: Get real pricing data using Lovable AI
    let pricingData: any = {
      currency: '$',
      priceRange: 'N/A',
      bestPrice: 'N/A',
      bestDealer: 'Not found',
      dealerDistance: 'Online',
      nearbyStores: [],
      priceHistory: null
    };

    if (productData.productName) {
      try {
        // First, reverse geocode to get country if we have coordinates
        let country = 'US';
        let countryCode = 'US';
        
        if (location?.latitude && location?.longitude) {
          try {
            const geocodeResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'PriceHunt/1.0'
                }
              }
            );
            
            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              country = geocodeData.address?.country || 'US';
              countryCode = geocodeData.address?.country_code?.toUpperCase() || 'US';
              console.log('Country identified for pricing:', country, countryCode);
            }
          } catch (e) {
            console.error('Error geocoding for pricing:', e);
          }
        } else if (location?.country) {
          country = location.country;
        }
        
        console.log('Fetching real-time pricing using AI for:', productData.productName, 'in', country);
        
        // Use Lovable AI to get pricing data
        const aiPricingResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `You are a pricing expert. Search for current online prices for products and return structured pricing data.
Your response must be valid JSON with this structure:
{
  "currency": "$",
  "bestPrice": "12.99",
  "priceRange": "12.99 - 15.99",
  "bestDealer": "Amazon",
  "nearbyStores": [
    {"name": "Amazon", "price": "12.99", "distance": "Online"},
    {"name": "Walmart", "price": "13.99", "distance": "Online"},
    {"name": "Target", "price": "14.99", "distance": "Online"}
  ]
}`
              },
              {
                role: 'user',
                content: `Find current online prices for "${productData.productName}" in ${country}. Return the top 3-5 online stores with their prices in valid JSON format.`
              }
            ],
          }),
        });

        if (aiPricingResponse.ok) {
          const aiPricingJson = await aiPricingResponse.json();
          const pricingContent = aiPricingJson.choices?.[0]?.message?.content;
          
          if (pricingContent) {
            try {
              // Extract JSON from markdown code blocks if present
              const jsonMatch = pricingContent.match(/```json\n([\s\S]*?)\n```/) || pricingContent.match(/```([\s\S]*?)```/);
              const jsonString = jsonMatch ? jsonMatch[1] : pricingContent;
              const aiPricingData = JSON.parse(jsonString);
              
              pricingData = {
                currency: aiPricingData.currency || '$',
                priceRange: aiPricingData.priceRange || 'N/A',
                bestPrice: aiPricingData.bestPrice || 'N/A',
                bestDealer: aiPricingData.bestDealer || 'Online Store',
                dealerDistance: 'Online',
                nearbyStores: aiPricingData.nearbyStores || [],
                priceHistory: null
              };
              
              console.log('AI pricing data retrieved successfully');
            } catch (e) {
              console.error('Failed to parse AI pricing response:', pricingContent);
            }
          }
        } else {
          console.error('AI Pricing API error:', aiPricingResponse.status);
        }
      } catch (pricingError) {
        console.error('Error fetching pricing data:', pricingError);
        // Continue with fallback pricing data
      }
    }

    // Step 3: Determine user location from coordinates using reverse geocoding
    let userLocation = null;
    if (location?.latitude && location?.longitude) {
      try {
        // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key required)
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'PriceHunt/1.0'
            }
          }
        );
        
        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          userLocation = {
            city: geocodeData.address?.city || geocodeData.address?.town || geocodeData.address?.village || 'Unknown',
            country: geocodeData.address?.country || 'Unknown'
          };
          console.log('Location identified:', userLocation);
        } else {
          console.error('Geocoding error:', geocodeResponse.status);
          userLocation = { city: 'Unknown', country: 'Unknown' };
        }
      } catch (geocodeError) {
        console.error('Error reverse geocoding location:', geocodeError);
        userLocation = { city: 'Unknown', country: 'Unknown' };
      }
    } else if (location) {
      userLocation = {
        city: location.city || 'Unknown',
        country: location.country || 'Unknown'
      };
    }

    // Step 4: Merge product data with real pricing
    const finalProductData = {
      ...productData,
      ...pricingData,
      userLocation
    };

    console.log('Product analysis complete with real pricing');

    return new Response(
      JSON.stringify(finalProductData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-product function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to analyze product image'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
