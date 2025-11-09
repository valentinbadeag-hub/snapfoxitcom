import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, location } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPEN_NINJA_API_KEY = Deno.env.get("OPEN_NINJA_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Analyzing product image with location:", location ? "provided" : "not provided");

    // Step 1: Call Lovable AI to identify the product
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

    // Step 2: Get real pricing data using OpenWeb Ninja API
    let pricingData: any = {
      currency: "$",
      priceRange: "N/A",
      bestPrice: "N/A",
      bestDealer: "Not found",
      dealerDistance: "Online",
      nearbyStores: [],
      priceHistory: null,
    };

    if (productData.productName && OPEN_NINJA_API_KEY) {
      try {
        // First, reverse geocode to get country if we have coordinates
        let countryCode = "us";

        if (location?.latitude && location?.longitude) {
          try {
            const geocodeResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}&zoom=10&addressdetails=1`,
              {
                headers: {
                  "User-Agent": "PriceHunt/1.0",
                },
              },
            );

            if (geocodeResponse.ok) {
              const geocodeData = await geocodeResponse.json();
              countryCode = geocodeData.address?.country_code || "us";
              console.log("Country identified for pricing:", countryCode);
            }
          } catch (e) {
            console.error("Error geocoding for pricing:", e);
          }
        }

        console.log("Fetching real-time pricing from OpenWeb Ninja for:", productData.productName);

        // Call OpenWeb Ninja Real-Time Product Search API v2 with location parameters
        const searchQuery = encodeURIComponent(productData.productName);
        let apiUrl = `https://api.openwebninja.com/realtime-product-search/search-v2?q=${searchQuery}&country=${countryCode}&limit=10`;
        
        // Add location parameters if available for nearby deals (within 100km radius)
        if (location?.latitude && location?.longitude) {
          apiUrl += `&lat=${location.latitude}&lng=${location.longitude}&zoom=10`;
          console.log("Searching with location parameters:", { lat: location.latitude, lng: location.longitude });
        }
        
        const ninjaResponse = await fetch(apiUrl, {
          method: "GET",
          headers: {
            "x-api-key": OPEN_NINJA_API_KEY,
            "X-RapidAPI-Host": "real-time-product-search",
            "Content-Type": "application/json",
          },
        });

        if (ninjaResponse.ok) {
          const ninjaData = await ninjaResponse.json();
          console.log("OpenWeb Ninja response received:", ninjaData.status);

          console.log(
            `https://api.openwebninja.com/realtime-product-search/search-v2?q=${searchQuery}&country=${countryCode}&num_results=5`,
          );
          console.log(ninjaData.status);
          console.log(ninjaData.data);

          if (ninjaData.status === "OK" && ninjaData.data && ninjaData.data.products.length > 0) {
            // Helper function to calculate distance between two coordinates (Haversine formula)
            const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
              const R = 6371; // Earth's radius in km
              const dLat = (lat2 - lat1) * Math.PI / 180;
              const dLon = (lon2 - lon1) * Math.PI / 180;
              const a = 
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
              return R * c; // Distance in km
            };

            // Helper function to extract numeric price from string
            const extractPrice = (priceString: string): number => {
              if (!priceString || priceString === "N/A") return Infinity;
              const match = priceString.match(/[\d,\.]+/);
              return match ? parseFloat(match[0].replace(/,/g, '')) : Infinity;
            };

            // Process all products from the response
            const allOffers: any[] = [];
            
            ninjaData.data.products.forEach((product: any) => {
              // Get main offer
              if (product.offer) {
                const offer = {
                  name: product.offer.store_name || "Online Store",
                  price: product.offer.price || "N/A",
                  numericPrice: extractPrice(product.offer.price),
                  distance: "Online",
                  distanceKm: 0,
                  rating: product.offer.store_rating,
                  link: product.offer.offer_page_url,
                  lat: product.offer.store_lat,
                  lon: product.offer.store_lon,
                };
                
                // Calculate distance if coordinates available
                if (location?.latitude && location?.longitude && offer.lat && offer.lon) {
                  offer.distanceKm = calculateDistance(location.latitude, location.longitude, offer.lat, offer.lon);
                  offer.distance = `${offer.distanceKm.toFixed(1)} km`;
                }
                
                allOffers.push(offer);
              }
              
              // Get additional offers
              if (product.offers && Array.isArray(product.offers)) {
                product.offers.forEach((offer: any) => {
                  const offerData = {
                    name: offer.store_name || "Online Store",
                    price: offer.price || "N/A",
                    numericPrice: extractPrice(offer.price),
                    distance: "Online",
                    distanceKm: 0,
                    rating: offer.store_rating,
                    link: offer.offer_page_url,
                    lat: offer.store_lat,
                    lon: offer.store_lon,
                  };
                  
                  // Calculate distance if coordinates available
                  if (location?.latitude && location?.longitude && offerData.lat && offerData.lon) {
                    offerData.distanceKm = calculateDistance(location.latitude, location.longitude, offerData.lat, offerData.lon);
                    offerData.distance = `${offerData.distanceKm.toFixed(1)} km`;
                  }
                  
                  allOffers.push(offerData);
                });
              }
            });

            // Filter by 100km radius if location is available
            let filteredOffers = allOffers;
            if (location?.latitude && location?.longitude) {
              filteredOffers = allOffers.filter(offer => 
                offer.distanceKm === 0 || offer.distanceKm <= 100
              );
              console.log(`Filtered ${filteredOffers.length} offers within 100km from ${allOffers.length} total offers`);
            }

            // Sort by price (lowest first)
            filteredOffers.sort((a, b) => a.numericPrice - b.numericPrice);

            // Take top 5 offers
            const top5Offers = filteredOffers.slice(0, 5);

            // Get best price and dealer
            const bestOffer = top5Offers[0];
            const bestPrice = bestOffer?.price || "N/A";
            const bestDealer = bestOffer?.name || "Online Store";
            const bestLink = bestOffer?.link;

            // Clean up offers for response (remove helper fields)
            const nearbyStores = top5Offers.map(offer => ({
              name: offer.name,
              price: offer.price,
              distance: offer.distance,
              rating: offer.rating,
              link: offer.link,
            }));

            pricingData = {
              currency: "$",
              priceRange: top5Offers.length > 1 ? `${top5Offers[0].price} - ${top5Offers[top5Offers.length - 1].price}` : bestPrice,
              bestPrice: bestPrice,
              bestDealer: bestDealer,
              dealerDistance: bestOffer?.distance || "Online",
              dealLink: bestLink || ninjaData.data.products[0]?.product_offers_page_url || ninjaData.data.products[0]?.product_page_url,
              nearbyStores: nearbyStores.length > 0 ? nearbyStores : [{
                name: "View Offers",
                price: "N/A",
                distance: "Online",
                link: ninjaData.data.products[0]?.product_offers_page_url,
              }],
              priceHistory: null,
            };

            // Update product rating and reviews from the first product
            const firstProduct = ninjaData.data.products[0];
            if (firstProduct.product_rating) {
              productData.rating = firstProduct.product_rating;
            }
            if (firstProduct.product_num_reviews) {
              productData.reviewCount = firstProduct.product_num_reviews;
            }

            console.log(`Real-time pricing data retrieved: ${top5Offers.length} offers, best price: ${bestPrice}`);
          } else {
            console.log("No product results found in OpenWeb Ninja response");
          }
        } else {
          const errorText = await ninjaResponse.text();
          console.error("OpenWeb Ninja API error:", ninjaResponse.status, errorText);
        }
      } catch (pricingError) {
        console.error("Error fetching pricing data from OpenWeb Ninja:", pricingError);
        // Continue with fallback pricing data
      }
    } else if (!OPEN_NINJA_API_KEY) {
      console.log("OPEN_NINJA_API_KEY not configured, skipping real-time pricing");
    }

    // Step 3: Determine user location from coordinates using reverse geocoding
    let userLocation = null;
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
          
          // Try multiple address fields to identify city
          const city = geocodeData.address?.city || 
                      geocodeData.address?.town || 
                      geocodeData.address?.village || 
                      geocodeData.address?.municipality ||
                      geocodeData.address?.county ||
                      geocodeData.address?.state ||
                      geocodeData.address?.region ||
                      "Unknown";
          
          userLocation = {
            city: city,
            country: geocodeData.address?.country || "Unknown",
          };
          console.log("Location identified:", userLocation);
        } else {
          console.error("Geocoding error:", geocodeResponse.status);
          userLocation = { city: "Unknown", country: "Unknown" };
        }
      } catch (geocodeError) {
        console.error("Error reverse geocoding location:", geocodeError);
        userLocation = { city: "Unknown", country: "Unknown" };
      }
    } else if (location) {
      userLocation = {
        city: location.city || "Unknown",
        country: location.country || "Unknown",
      };
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
