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
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a product identification expert. Analyze product images and extract key product information.

IMPORTANT: Respond in ${detectedLanguage}. All text fields (productName, category, description, pros, cons, usageTips, recommendation) must be in ${detectedLanguage}.

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

    // Step 3: Get real pricing data using SerpAPI via fetch_geo_prices function
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
          const dealLink = priceData.best_deal?.product_link || priceData.best_deal?.link;

          // Map offers to nearby stores format
          const nearbyStores = priceData.offers?.map((offer: any) => ({
            name: offer.source,
            price: offer.price,
            distance: "Online", // SerpAPI doesn't provide physical distance
            rating: offer.rating,
            link: offer.product_link || offer.link,
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

    // Step 4: Merge product data with real pricing
    const finalProductData = {
      ...productData,
      ...pricingData,
      userLocation,
    };

    console.log("Product analysis complete with real pricing");

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
