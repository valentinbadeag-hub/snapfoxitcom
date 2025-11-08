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

    // Step 2: Get real pricing data from OpenWeb Ninja API
    let pricingData: any = {
      currency: '$',
      priceRange: 'N/A',
      bestPrice: 'N/A',
      bestDealer: 'Not found',
      dealerDistance: 'Online',
      nearbyStores: [],
      onlineDeals: [],
      priceHistory: null
    };

    if (OPEN_NINJA_API_KEY && productData.productName) {
      try {
        // Determine country - use provided country or map from coordinates, default to US
        let country = 'US';
        if (location?.country) {
          country = location.country;
        } else if (location?.latitude && location?.longitude) {
          // Simple coordinate-based country detection (basic implementation)
          // For production, you'd use a proper reverse geocoding service
          const lat = location.latitude;
          const lon = location.longitude;
          
          // Basic region detection based on coordinates
          if (lat >= 36 && lat <= 71 && lon >= -10 && lon <= 40) {
            country = 'EU'; // Europe
          } else if (lat >= 24 && lat <= 49 && lon >= -125 && lon <= -66) {
            country = 'US'; // USA
          } else if (lat >= -44 && lat <= -10 && lon >= 112 && lon <= 154) {
            country = 'AU'; // Australia
          }
        }
        
        const searchQuery = encodeURIComponent(productData.productName);
        
        console.log('Fetching real-time pricing for:', productData.productName, 'in', country);
        
        const pricingResponse = await fetch(
          `https://api.openwebninja.com/realtime-product-search/search-v2?q=${searchQuery}&country=${country}&num_results=10`,
          {
            method: 'GET',
            headers: {
              'X-RapidAPI-Key': OPEN_NINJA_API_KEY,
              'X-RapidAPI-Host': 'real-time-product-search.p.rapidapi.com',
              'Content-Type': 'application/json'
            }
          }
        );

        if (pricingResponse.ok) {
          const pricingJson = await pricingResponse.json();
          console.log('Pricing API response:', JSON.stringify(pricingJson).substring(0, 200));

          if (pricingJson.data?.offers && pricingJson.data.offers.length > 0) {
            const offers = pricingJson.data.offers;
            
            // Find best price (lowest)
            const validOffers = offers.filter((offer: any) => offer.price && !isNaN(parseFloat(offer.price)));
            
            if (validOffers.length > 0) {
              const sortedOffers = validOffers.sort((a: any, b: any) => 
                parseFloat(a.price) - parseFloat(b.price)
              );
              
              const bestOffer = sortedOffers[0];
              const prices = validOffers.map((o: any) => parseFloat(o.price));
              const avgPrice = (prices.reduce((a: number, b: number) => a + b, 0) / prices.length).toFixed(2);
              const minPrice = Math.min(...prices).toFixed(2);
              const maxPrice = Math.max(...prices).toFixed(2);
              
              // Determine currency from the offers or location
              const currencySymbol = pricingJson.data.currency || bestOffer.currency || '$';
              
              // Set online deals (best 3 offers)
              const onlineDealsData = sortedOffers.slice(0, 3).map((offer: any) => ({
                name: offer.store_name || 'Online Store',
                price: `${parseFloat(offer.price).toFixed(2)}`,
                link: offer.link || offer.product_link
              }));
              
              pricingData = {
                currency: currencySymbol,
                priceRange: `${minPrice} - ${maxPrice}`,
                bestPrice: parseFloat(bestOffer.price).toFixed(2),
                bestDealer: bestOffer.store_name || 'Online Store',
                dealerDistance: 'Online',
                averagePrice: avgPrice,
                dealLink: bestOffer.link || bestOffer.product_link,
                nearbyStores: [], // No nearby stores in 100km
                onlineDeals: onlineDealsData,
                priceHistory: null // OpenWeb Ninja doesn't provide historical data in this endpoint
              };
              
              console.log('Real pricing data retrieved successfully with online deals');
            }
          } else {
            console.log('No offers found in pricing API response');
          }
        } else {
          console.error('Pricing API error:', pricingResponse.status, await pricingResponse.text());
        }
      } catch (pricingError) {
        console.error('Error fetching pricing data:', pricingError);
        // Continue with fallback pricing data
      }
    }

    // Step 3: Determine user location from coordinates
    let userLocation = null;
    if (location) {
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
