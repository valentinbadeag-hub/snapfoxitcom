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
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing product image with location:', location ? 'provided' : 'not provided');

    // Call Lovable AI with vision capabilities
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
            content: `You are a product analysis expert with precise geolocation capabilities. Analyze product images and return detailed information in JSON format.

${location ? `CRITICAL LOCATION INSTRUCTIONS:
- User coordinates: ${location.latitude}, ${location.longitude}
- Step 1: Use these EXACT coordinates to determine the user's country and city
- Step 2: Convert ALL prices to the local currency of that specific country (e.g., EUR for Europe, RON for Romania, USD for USA, GBP for UK, etc.)
- Step 3: Find only REAL stores that exist within a strict 100km radius of these coordinates
- Step 4: Provide accurate distances in kilometers from the user's location
- DO NOT use generic or fictional store names
- DO NOT provide stores outside the 100km radius
- ALWAYS use the native currency symbol and format for the detected country` : 'No location provided. Use USD and provide general online store information.'}

Your response must be valid JSON with this exact structure:
{
  "productName": "Brand and product name",
  "category": "Product category",
  "description": "Brief 2-3 sentence description",
  "rating": 4.2,
  "reviewCount": 1250,
  "currency": "${location ? 'MUST be the actual currency symbol for the detected country (€, £, ¥, $, etc.)' : '$'}",
  "priceRange": "${location ? 'Price range in LOCAL currency only' : '20-30'}",
  "bestPrice": "${location ? 'Best price in LOCAL currency with proper formatting' : '24.99'}",
  "bestDealer": "${location ? 'Real store name that exists near the coordinates' : 'Store name'}",
  "dealerDistance": "${location ? 'Actual distance in km (e.g., 2.5 km away)' : 'Online'}",
  "userLocation": ${location ? '{"city": "City name from coordinates", "country": "Country name from coordinates"}' : 'null'},
  "reviewBreakdown": {
    "quality": 85,
    "value": 70,
    "durability": 60
  },
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "usageTips": ["Tip 1", "Tip 2", "Tip 3"],
  "recommendation": "A personalized recommendation sentence",
  "nearbyStores": [
    ${location ? '{"name": "Real store name within 100km", "price": "Price in LOCAL currency", "distance": "X.X km"}' : '{"name": "Online Store", "price": "XX.XX", "distance": "Online"}'}
  ]
}

${location ? `MANDATORY REQUIREMENTS:
1. Use coordinates ${location.latitude}, ${location.longitude} to determine exact country and city
2. Research typical retail stores in that specific region
3. Only include stores within 100km radius with accurate distances
4. All prices MUST be in the currency of the detected country
5. Provide 3-5 real nearby stores with realistic local pricing
6. Distance must be calculated from user coordinates in kilometers` : 'Provide general online store pricing in USD.'}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product photo: Identify the exact item (brand, model), extract key details (including barcode if visible), provide aggregated review insights, price information, and usage recommendations.'
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

    console.log('Product analysis complete:', productData.productName);

    return new Response(
      JSON.stringify(productData),
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
