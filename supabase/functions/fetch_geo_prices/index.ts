import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { product_name, country = "us", location = "", uule = "" } = await req.json();
    const apiKey = Deno.env.get("SERPAPI_KEY");

    if (!apiKey) {
      console.error("SERPAPI_KEY not configured");
      return new Response(JSON.stringify({ error: "SerpAPI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(
      `Fetching prices for: ${product_name}, country: ${country}, location: ${location}, uule: ${uule ? "provided" : "none"}`,
    );

    const params = new URLSearchParams({
      engine: "google_shopping",
      q: product_name,
      //gl: country.toLowerCase(),
      no_cache: "true",
      api_key: apiKey,
    });

    // Add UULE parameter for precise location targeting (preferred)
    if (uule) {
      params.append("uule", uule);
      console.log("Using UULE for precise geo-targeting");
    }
    // Fallback to location parameter if UULE not available
    else if (location) {
      params.append("location", location);
      console.log(`Using location parameter: ${location}`);
    }

    // Sort by price (low to high) to get best deals first
    params.append("sort_by", "1");

    console.log(`https://serpapi.com/search?${params}`);
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
    console.log("SerpAPI response:", JSON.stringify(data).substring(0, 500));

    if (data.shopping_results && data.shopping_results.length > 0) {
      const offers = data.shopping_results.slice(0, 5); // Top 5 deals

      // Find best deal (lowest price)
      const best = offers.reduce((min: any, item: any) => {
        const currentPrice = parseFloat(item.price) || parseFloat(item.extracted_price) || Infinity;
        const minPrice = parseFloat(min.price) || parseFloat(min.extracted_price) || Infinity;
        return currentPrice < minPrice ? item : min;
      });

      // Calculate average price
      const validPrices = offers
        .map((item: any) => parseFloat(item.price) || parseFloat(item.extracted_price))
        .filter((price: number) => !isNaN(price) && price > 0);

      const avg_price =
        validPrices.length > 0
          ? validPrices.reduce((sum: number, price: number) => sum + price, 0) / validPrices.length
          : 0;

      // Format offers for response
      const formattedOffers = offers.map((offer: any) => ({
        title: offer.title,
        price: offer.price || offer.extracted_price,
        source: offer.source,
        link: offer.link,
        product_link: offer.product_link,
        thumbnail: offer.thumbnail,
        rating: offer.rating,
        reviews: offer.reviews,
      }));

      console.log(best);
      return new Response(
        JSON.stringify({
          best_deal: {
            title: best.title,
            price: best.price || best.extracted_price,
            source: best.source,
            link: best.link,
            product_link: best.product_link,
            thumbnail: best.thumbnail,
          },
          avg_price: avg_price.toFixed(2),
          offers: formattedOffers,
          currency: data.search_parameters?.currency || "USD",
          location: data.search_parameters?.location || country,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    console.log("No shopping results found");
    return new Response(JSON.stringify({ error: "No deals found", message: "No local gems—global view? 🌍" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in fetch_geo_prices:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
