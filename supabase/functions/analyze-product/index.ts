import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper function to generate UULE parameter from lat/lon coordinates
function generateUULE(latitude: number, longitude: number): string {
  // UULE encoding: Encode the location name "lat,lon" in base64 with Google's UULE format
  const locationString = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  
  // Convert to bytes and base64
  const encoder = new TextEncoder();
  const bytes = encoder.encode(locationString);
  const base64 = btoa(String.fromCharCode(...bytes));
  
  // Google UULE format: w+CAIQICI followed by the base64 string
  return `w+CAIQICI${base64.replace(/=/g, '')}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing product image with location:", location ? "provided" : "not provided");

    // Step 1: Determine user location and language from coordinates using reverse geocoding
    let userLocation: { city: string; country: string; language: string; countryCode: string; uule?: string; serpLocation?: string } | null = null;
    let detectedLanguage = "English"; // Default language
    
    if (location?.latitude && location?.longitude) {
      try {
        // Use OpenStreetMap Nominatim for reverse geocoding with higher zoom for better detail
        const geocodeResponse = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "PriceHunt/1.0",
            },
          },
        );

        if (geocodeResponse.ok) {
          const geocodeData = await geocodeResponse.json();
          console.log("Geocode response:", JSON.stringify(geocodeData.address));

          const address = geocodeData.address;
          const country = address?.country || "Unknown";
          const countryCode = address?.country_code?.toLowerCase() || "us";

          // Extract the most appropriate city for SERP API compatibility
          // Priority: city > county > state (prefer larger administrative divisions)
          let serpCity = address?.city;
          
          // If no city, try to find a larger administrative division
          if (!serpCity) {
            // For smaller locations (town, village, suburb), prefer county or state
            if (address?.town || address?.village || address?.suburb) {
              serpCity = address?.county || address?.state || address?.town || address?.village;
            } else {
              serpCity = address?.county || address?.state || address?.municipality || address?.region;
            }
          }
          
          const city = serpCity || "Unknown";
          console.log(`Location identified - Original: ${address?.city || address?.town || address?.village}, SERP City: ${city}`);
          
          // Map country codes to languages
          const languageMap: { [key: string]: string } = {
            "ro": "Romanian",
            "us": "English",
            "gb": "English",
            "ca": "English",
            "au": "English",
            "de": "German",
            "fr": "French",
            "es": "Spanish",
            "it": "Italian",
            "pt": "Portuguese",
            "br": "Portuguese",
            "nl": "Dutch",
            "pl": "Polish",
            "ru": "Russian",
            "jp": "Japanese",
            "cn": "Chinese",
            "kr": "Korean",
            "in": "Hindi",
            "mx": "Spanish",
            "ar": "Spanish",
          };
          
          detectedLanguage = languageMap[countryCode] || "English";

          // Generate UULE parameter from coordinates for precise SERP API location
          const uule = generateUULE(location.latitude, location.longitude);
          
          // Format location for SERP API: "City, Country"
          const serpLocation = `${city}, ${country}`;

          userLocation = {
            city: city,
            country: country,
            countryCode: countryCode,
            language: detectedLanguage,
            uule: uule,
            serpLocation: serpLocation,
          };
          console.log("Location and language identified:", JSON.stringify(userLocation));
        } else {
          console.error("Geocoding error:", geocodeResponse.status);
          userLocation = { 
            city: "Unknown", 
            country: "Unknown", 
            countryCode: "us",
            language: "English" 
          };
        }
      } catch (geocodeError) {
        console.error("Error reverse geocoding location:", geocodeError);
        userLocation = { 
          city: "Unknown", 
          country: "Unknown", 
          countryCode: "us",
          language: "English" 
        };
      }
    } else if (location) {
      userLocation = {
        city: location.city || "Unknown",
        country: location.country || "Unknown",
        countryCode: "us",
        language: "English",
      };
    }

    // Step 2: Call Lovable AI to identify the product in the detected language
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-pro-preview",
        messages: [
          {
            role: "system",
            content: `You are a specialized retail and market analyst following a Chain-of-Thought (CoT) reasoning process.

ANALYSIS PHASES:
Phase 1: Product Identification - Identify the exact product (brand, model, specifications) from the image. Extract all visible details including barcodes.
Phase 2: Review Analysis - Analyze typical consumer reviews, ratings, and feedback for this product category and model.
Phase 3: Usage Insights - Provide practical usage tips, pros, and cons based on common user experiences.
Phase 4: Synthesis - Combine all insights into a comprehensive product profile.

IMPORTANT: Respond in ${detectedLanguage}. All text fields must be in ${detectedLanguage}.

Your response must be valid JSON with this exact structure (DO NOT include pricing information):
{
  "productName": "Full product name with brand and model in ${detectedLanguage}",
  "category": "Product category in ${detectedLanguage}",
  "description": "Brief 2-3 sentence description in ${detectedLanguage}",
  "rating": 4.2,
  "reviewCount": 1250,
  "reviewBreakdown": {
    "quality": 85,
    "value": 70,
    "durability": 60
  },
  "pros": ["Pro 1 in ${detectedLanguage}", "Pro 2 in ${detectedLanguage}", "Pro 3 in ${detectedLanguage}"],
  "cons": ["Con 1 in ${detectedLanguage}", "Con 2 in ${detectedLanguage}"],
  "usageTips": ["Tip 1 in ${detectedLanguage}", "Tip 2 in ${detectedLanguage}", "Tip 3 in ${detectedLanguage}"],
  "recommendation": "Personalized recommendation in ${detectedLanguage}"
}`,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this product photo: Identify the exact item (brand, model), extract key details (including barcode if visible), provide aggregated review insights, pros/cons, and usage recommendations. DO NOT provide pricing information.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageData,
                },
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log("AI Response received");

    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    let productData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      productData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse product data from AI response");
    }

    console.log("Product identified:", productData.productName);

    // Step 3: Get detailed product information from Open Ninja API
    let openNinjaData: any = null;
    if (productData.productName) {
      try {
        console.log(`Fetching detailed product data from Open Ninja for: ${productData.productName}`);
        const OPEN_NINJA_API_KEY = Deno.env.get("OPEN_NINJA_API_KEY");
        
        if (!OPEN_NINJA_API_KEY) {
          console.warn("OPEN_NINJA_API_KEY not configured, skipping Open Ninja enrichment");
        } else {
          const openNinjaResponse = await fetch(
            `https://api.api-ninjas.com/v1/pricesearch?q=${encodeURIComponent(productData.productName)}`,
            {
              headers: {
                "X-Api-Key": OPEN_NINJA_API_KEY,
              },
            }
          );

          if (openNinjaResponse.ok) {
            const openNinjaResults = await openNinjaResponse.json();
            if (openNinjaResults && openNinjaResults.length > 0) {
              openNinjaData = openNinjaResults[0];
              console.log("Open Ninja data retrieved:", JSON.stringify(openNinjaData).substring(0, 200));
            } else {
              console.log("No Open Ninja data found for product");
            }
          } else {
            console.error("Open Ninja API error:", openNinjaResponse.status);
          }
        }
      } catch (openNinjaError) {
        console.error("Error fetching Open Ninja data:", openNinjaError);
        // Continue without Open Ninja data
      }
    }

    // Step 4: Get real pricing data using SerpAPI via fetch_geo_prices function
    let pricingData: any = {
      currency: "USD",
      priceRange: "N/A",
      bestPrice: "N/A",
      bestDealer: "Not found",
      dealerDistance: "Online",
      nearbyStores: [],
      priceHistory: null,
    };

    if (productData.productName) {
      try {
        console.log(`Fetching geo-prices for: ${productData.productName}, userLocation:`, JSON.stringify(userLocation));

        // Call fetch_geo_prices edge function
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
        const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const priceResponse = await fetch(`${SUPABASE_URL}/functions/v1/fetch_geo_prices`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            product_name: productData.productName,
            country: userLocation?.countryCode || "us",
            location: userLocation?.serpLocation || "",
            uule: userLocation?.uule,
          }),
        });

        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          console.log("Geo-pricing data retrieved:", priceData);

          // Format the response data
          const bestPrice = priceData.best_deal?.price || "N/A";
          const bestDealer = priceData.best_deal?.source || "Online Store";
          const dealLink = priceData.best_deal?.link;

          // Map offers to nearby stores format
          const nearbyStores = priceData.offers?.map((offer: any) => ({
            name: offer.source,
            price: offer.price,
            distance: "Online", // SerpAPI doesn't provide physical distance
            rating: offer.rating,
            link: offer.link, // Now using the consolidated link field
          })) || [];

          pricingData = {
            currency: priceData.currency || "USD",
            priceRange:
              priceData.offers && priceData.offers.length > 1
                ? `${priceData.offers[0].price} - ${priceData.offers[priceData.offers.length - 1].price}`
                : bestPrice,
            bestPrice: bestPrice,
            bestDealer: bestDealer,
            dealerDistance: "Online",
            dealLink: dealLink,
            averagePrice: priceData.avg_price,
            nearbyStores: nearbyStores.length > 0 ? nearbyStores : [
              {
                name: "View Offers",
                price: "N/A",
                distance: "Online",
                link: dealLink,
              },
            ],
            priceHistory: {
              note: "Live Google Shopping data",
            },
          };

          console.log(`Geo-pricing complete: ${nearbyStores.length} offers, best price: ${bestPrice}`);
        } else {
          const errorText = await priceResponse.text();
          console.error("Geo-pricing API error:", priceResponse.status, errorText);
        }
      } catch (pricingError) {
        console.error("Error fetching geo-pricing data:", pricingError);
        // Continue with fallback pricing data
      }
    } else {
      console.log("No product name identified, skipping pricing");
    }

    // Step 5: Use Gemini AI to merge and validate all data sources
    let finalProductData = {
      ...productData,
      ...pricingData,
      userLocation,
    };

    // If we have data from multiple sources, use Gemini to intelligently merge
    if (openNinjaData && pricingData.bestPrice !== 'N/A') {
      try {
        console.log("Using Gemini AI to merge and validate data from all sources");
        
        const mergePrompt = `You are a specialized retail and market analyst. Follow this Chain-of-Thought (CoT) process:

PHASE 1: GENERAL AVAILABILITY
- Analyze the product's online presence in ${userLocation?.country}
- Identify major retailers that typically stock this product (e.g., eMAG, Auchan, dm, etc.)
- Confirm base stock availability in the country

PHASE 2: LOCAL AVAILABILITY
- Focus on ${userLocation?.city}, ${userLocation?.country}
- Identify which major retailers are present in ${userLocation?.city}
- Look for local chains/stores explicitly in ${userLocation?.city}
- CRITICAL: All pricing data provided is WITHIN 100KM of user location
- If no local deals available, recommend "Go Online" for country-wide search

PHASE 3: PRICE ANALYSIS
- Analyze current prices from confirmed online retailers
- Look for explicit promotions, offers, and bundles
- Focus on the target product or closest variant
- Convert prices to numbers (remove $ € £ symbols)
- Sort by price ascending (cheapest first)
- Take top 3 cheapest offers
- Calculate average price of these 3

PHASE 4: SYNTHESIS & RECOMMENDATION
- Recommend the best deal based on analysis
- Prioritize LOCAL availability (100km radius) over online-only stores
- Only recommend offers that have confirmed prices
- Provide actionable recommendation in ${detectedLanguage}

DATA SOURCES:

SOURCE 1 - AI Image Analysis:
${JSON.stringify(productData, null, 2)}

SOURCE 2 - Open Ninja Product Database:
${JSON.stringify(openNinjaData, null, 2)}

SOURCE 3 - Real-time LOCAL Pricing (WITHIN 100KM of ${userLocation?.city}, ${userLocation?.country}):
Best Price: ${pricingData.bestPrice} ${pricingData.currency}
Average Price: ${pricingData.averagePrice}
Dealer: ${pricingData.bestDealer}
Available Stores: ${pricingData.nearbyStores?.length || 0}

User Location: ${userLocation?.city}, ${userLocation?.country}
User Language: ${detectedLanguage}

Return ONLY valid JSON in this exact structure (all text in ${detectedLanguage}):
{
  "productName": "Most accurate product name",
  "category": "Category in ${detectedLanguage}",
  "description": "Enhanced description in ${detectedLanguage} incorporating all sources and CoT analysis",
  "rating": <merged rating>,
  "reviewCount": <verified review count if available>,
  "reviewBreakdown": {
    "quality": <0-100>,
    "value": <0-100>,
    "durability": <0-100>
  },
  "pros": ["verified pros in ${detectedLanguage}"],
  "cons": ["verified cons in ${detectedLanguage}"],
  "usageTips": ["practical tips in ${detectedLanguage}"],
  "recommendation": "Actionable recommendation based on CoT analysis, emphasizing LOCAL availability in ${detectedLanguage}"
}`;

        const mergeResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-pro-preview",
            messages: [
              {
                role: "system",
                content: "You are a specialized retail and market analyst using Chain-of-Thought (CoT) reasoning. Follow the 4 phases: (1) General Availability - identify major retailers and country-wide stock, (2) Local Availability - focus on specific city within 100km radius, (3) Price Analysis - analyze prices from confirmed retailers, sort by value, (4) Synthesis - recommend best deal with actionable insights. Prioritize local availability, real-time pricing, and consumer value. Always respond with valid JSON only."
              },
              {
                role: "user",
                content: mergePrompt
              }
            ],
          }),
        });

        if (mergeResponse.ok) {
          const mergeResult = await mergeResponse.json();
          const mergeContent = mergeResult.choices?.[0]?.message?.content;
          
          if (mergeContent) {
            try {
              const jsonMatch = mergeContent.match(/```json\n([\s\S]*?)\n```/) || mergeContent.match(/```([\s\S]*?)```/);
              const jsonString = jsonMatch ? jsonMatch[1] : mergeContent;
              const mergedData = JSON.parse(jsonString);
              
              // Merge the AI-enhanced data with pricing data
              finalProductData = {
                ...mergedData,
                ...pricingData,
                userLocation,
              };
              
              console.log("Successfully merged data from all sources using Gemini AI");
            } catch (parseError) {
              console.error("Failed to parse Gemini merge response:", parseError);
              // Keep original finalProductData
            }
          }
        } else {
          console.error("Gemini merge API error:", mergeResponse.status);
        }
      } catch (mergeError) {
        console.error("Error during AI data merging:", mergeError);
        // Continue with basic merged data
      }
    }

    console.log("Product analysis complete with enhanced 3-API pipeline");

    return new Response(JSON.stringify(finalProductData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in analyze-product function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
        details: "Failed to analyze product image",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
