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
    const { product_name, country = "ro", location = "", uule = "" } = await req.json();
    const apiKey = Deno.env.get("SERPAPI_KEY");

    if (!apiKey) {
      console.error("SERPAPI_KEY not configured");
      return new Response(JSON.stringify({ error: "SerpAPI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const countryCode = country.toLowerCase();
    console.log(`Fetching prices for: ${product_name}, country: ${countryCode}, location: ${location}`);

    // Step 1: Call SerpAPI Google Shopping with exact parameters
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: product_name,
      gl: countryCode,
      sort_by: "1", // Sort by price (low to high)
      no_cache: "true",
      api_key: apiKey,
    });

    if (uule) {
      params.append("uule", uule);
      console.log("Using UULE for precise targeting");
    } else if (location) {
      params.append("location", location);
      console.log(`Using location: ${location}`);
    }

    console.log(`Calling SerpAPI: https://serpapi.com/search?${params}`);
    const response = await fetch(`https://serpapi.com/search?${params}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("SerpAPI error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to fetch pricing data" }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    console.log(`SerpAPI returned ${data.shopping_results?.length || 0} results`);

    if (!data.shopping_results || data.shopping_results.length === 0) {
      console.log("No shopping results found");
      return new Response(
        JSON.stringify({ 
          error: "No deals found", 
          message: "No local gems nearby, try global view? 🌍",
          canRetryGlobal: true
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Process the response
    // Filter offers that have a price
    const offersWithPrices = data.shopping_results.filter((offer: any) => {
      const price = offer.price || offer.extracted_price;
      return price && typeof price === 'string' && price.trim() !== '';
    });

    console.log(`${offersWithPrices.length} offers have prices`);

    if (offersWithPrices.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No deals found", 
          message: "No local gems nearby, try global view? 🌍",
          canRetryGlobal: true
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Convert price to number (remove currency symbols)
    const offersWithNumericPrices = offersWithPrices.map((offer: any) => {
      const priceStr = offer.price || offer.extracted_price;
      // Remove currency symbols and convert to number
      const numericPrice = parseFloat(priceStr.replace(/[$€£,]/g, ''));
      return {
        ...offer,
        numericPrice: isNaN(numericPrice) ? Infinity : numericPrice,
        displayPrice: priceStr
      };
    }).filter((offer: any) => offer.numericPrice !== Infinity);

    console.log(`${offersWithNumericPrices.length} offers have valid numeric prices`);

    if (offersWithNumericPrices.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "No deals found", 
          message: "No local gems nearby, try global view? 🌍",
          canRetryGlobal: true
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Sort by price ascending (cheapest first) - already sorted by SerpAPI but double-check
    offersWithNumericPrices.sort((a: any, b: any) => a.numericPrice - b.numericPrice);

    // Take top 3 cheapest only
    const top3 = offersWithNumericPrices.slice(0, 3);

    // Calculate average price of these 3
    const avgPrice = top3.reduce((sum: any, offer: any) => sum + offer.numericPrice, 0) / top3.length;

    // Extract currency from the response
    const currency = data.search_parameters?.currency || "$";

    // Format offers for response
    const formattedOffers = top3.map((offer: any) => {
      const searchQuery = encodeURIComponent(`${offer.title} ${offer.source}`);
      const googleShoppingSearch = `https://www.google.com/search?tbm=shop&q=${searchQuery}&gl=${countryCode}`;
      
      return {
        title: offer.title,
        price: offer.displayPrice,
        numericPrice: offer.numericPrice,
        source: offer.source,
        link: googleShoppingSearch,
        thumbnail: offer.thumbnail,
        rating: offer.rating,
        reviews: offer.reviews,
      };
    });

    const bestDeal = formattedOffers[0]; // First one is the cheapest

    console.log(`Returning best deal: ${bestDeal.source} at ${bestDeal.price}, avg: ${avgPrice.toFixed(2)}`);

    return new Response(
      JSON.stringify({
        best_deal: {
          title: bestDeal.title,
          price: bestDeal.displayPrice,
          numericPrice: bestDeal.numericPrice,
          source: bestDeal.source,
          link: bestDeal.link,
          thumbnail: bestDeal.thumbnail,
        },
        avg_price: avgPrice.toFixed(2),
        offers: formattedOffers,
        currency: currency,
        location: data.search_parameters?.location || location,
        countryCode: countryCode,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in fetch_geo_prices:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
