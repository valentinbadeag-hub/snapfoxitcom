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
            content: `You are a product analysis expert with real-time geolocation and retail data access. Analyze product images and provide location-aware pricing and store information.

${location ? `🎯 CRITICAL GEOLOCATION PROTOCOL - FOLLOW EXACTLY:

📍 USER COORDINATES: ${location.latitude}°N, ${location.longitude}°E

STEP 1️⃣ - REVERSE GEOCODING (MANDATORY):
→ Determine EXACT country from coordinates ${location.latitude}, ${location.longitude}
→ Determine EXACT city/region from these coordinates
→ Populate userLocation: {"city": "determined city", "country": "determined country"}

STEP 2️⃣ - CURRENCY LOCALIZATION (MANDATORY):
→ Identify the official currency of the detected country
→ Set "currency" field to the native symbol ONLY (€ for Eurozone, £ for UK, $ for USA/Canada, ¥ for Japan/China, ₹ for India, zł for Poland, Kč for Czech, RON for Romania, etc.)
→ Convert ALL price fields to this local currency
→ Format prices according to local conventions
→ NEVER use USD unless coordinates are in USA/territories

STEP 3️⃣ - NEARBY STORES (100KM RADIUS STRICT):
→ Identify major retailers that:
  ✓ Physically operate in the detected country/region
  ✓ Are located within EXACTLY 100 kilometers of ${location.latitude}, ${location.longitude}
  ✓ Actually stock this product category
→ Calculate precise distance from user coordinates to each store location
→ Use full store names (e.g., "Carrefour Market Downtown", "Tesco Extra", "Walmart Supercenter #2341")
→ Provide 4-5 stores ordered by distance (nearest first)
→ Include realistic local pricing in the local currency

STEP 4️⃣ - QUALITY VALIDATION:
✓ Currency symbol matches detected country? 
✓ All store distances are ≤ 100km?
✓ Stores are real businesses in this geographic area?
✓ Prices reflect local market rates?

❌ STRICTLY FORBIDDEN:
✗ Generic names like "Local Store", "Nearby Shop", "Store A"
✗ Stores from other countries or outside 100km radius
✗ Online-only retailers (unless they have physical stores nearby)
✗ Using wrong currency (e.g., USD for European locations)
✗ Fictional or placeholder store names

✅ EXAMPLE - For Paris, France (48.8566°N, 2.3522°E):
currency: "€"
userLocation: {"city": "Paris", "country": "France"}
bestPrice: "8.99 €"
nearbyStores: [
  {"name": "Monoprix Champs-Élysées", "price": "8.99 €", "distance": "2.3 km"},
  {"name": "Carrefour City Bastille", "price": "7.49 €", "distance": "4.7 km"},
  {"name": "Franprix Marais", "price": "9.29 €", "distance": "5.1 km"}
]` : 'No location provided. Use USD and provide general online store information with "Online" distance.'}

Your response must be valid JSON with this exact structure:
{
  "productName": "Brand and product name",
  "category": "Product category",
  "description": "Brief 2-3 sentence description",
  "rating": 4.2,
  "reviewCount": 1250,
  "currency": "${location ? 'LOCAL currency symbol based on coordinates' : '$'}",
  "priceRange": "${location ? 'Range in LOCAL currency' : '20-30'}",
  "bestPrice": "${location ? 'Price in LOCAL currency' : '24.99'}",
  "bestDealer": "${location ? 'Real store name within 100km' : 'Store name'}",
  "dealerDistance": "${location ? 'X.X km' : 'Online'}",
  "userLocation": ${location ? '{"city": "from coordinates", "country": "from coordinates"}' : 'null'},
  "reviewBreakdown": {
    "quality": 85,
    "value": 70,
    "durability": 60
  },
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "usageTips": ["Tip 1", "Tip 2", "Tip 3"],
  "recommendation": "Personalized recommendation",
  "nearbyStores": [
    ${location ? '{"name": "Real store within 100km", "price": "LOCAL currency", "distance": "X.X km"}' : '{"name": "Online Store", "price": "XX.XX", "distance": "Online"}'}
  ]
}`
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
