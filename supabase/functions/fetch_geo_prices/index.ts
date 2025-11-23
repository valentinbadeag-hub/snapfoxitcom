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
    const { product_name, country = "us", location = "" } = await req.json();
    const apiKey = Deno.env.get("SERPAPI_KEY");

    if (!apiKey) {
      console.error("SERPAPI_KEY not configured");
      return new Response(JSON.stringify({ error: "SerpAPI key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Fetching prices for: ${product_name}, country: ${country}, location: ${location}`);

    // Build SerpAPI request with exact parameters
    const params = new URLSearchParams({
      engine: "google_shopping",
      q: product_name,
      gl: country.toLowerCase(),
      sort_by: "1", // Low to high price
      no_cache: "true",
      api_key: apiKey,
    });

    if (location) {
      params.append("location", location);
    }

    console.log(`SerpAPI URL: https://serpapi.com/search?${params}`);
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
    console.log(`Received ${data.shopping_results?.length || 0} results from SerpAPI`);

    if (!data.shopping_results || data.shopping_results.length === 0) {
      console.log("No local results found");
      return new Response(
        JSON.stringify({ 
          error: "no_local_results",
          message: "No local gems nearby, try global view?" 
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 1: Filter offers that have a price
    const offersWithPrice = data.shopping_results.filter((offer: any) => {
      const price = offer.extracted_price || offer.price;
      return price != null && price !== "";
    });

    console.log(`${offersWithPrice.length} offers have prices`);

    if (offersWithPrice.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "no_local_results",
          message: "No local gems nearby, try global view?" 
        }), 
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Step 2: Convert prices to numbers and sort ascending (cheapest first)
    const parsedOffers = offersWithPrice.map((offer: any) => {
      let priceValue = offer.extracted_price;
      
      // If extracted_price is not available, parse from price string
      if (!priceValue && offer.price) {
        const priceStr = String(offer.price).replace(/[^0-9.,]/g, '');
        priceValue = parseFloat(priceStr.replace(',', '.'));
      }

      return {
        ...offer,
        priceNumber: priceValue || 0,
      };
    }).filter((offer: any) => offer.priceNumber > 0);

    // Sort by price ascending
    parsedOffers.sort((a: any, b: any) => a.priceNumber - b.priceNumber);
    console.log(`Sorted ${parsedOffers.length} offers by price`);

    // Step 3: Take top 3 cheapest, deduplicate by merchant
    const seenMerchants = new Set<string>();
    const top3Offers = parsedOffers.filter((offer: any) => {
      const merchant = offer.source?.toLowerCase() || "";
      if (seenMerchants.has(merchant)) {
        return false;
      }
      seenMerchants.add(merchant);
      return true;
    }).slice(0, 3);

    console.log(`Top 3 unique merchant offers selected`);

    // Step 4: Calculate average of top 3
    const averagePrice = top3Offers.reduce((sum: number, offer: any) => sum + offer.priceNumber, 0) / top3Offers.length;

    // Detect currency from first offer
    const currencyMatch = top3Offers[0]?.price?.match(/[€$£¥₹]/);
    const currency = currencyMatch ? currencyMatch[0] : data.search_parameters?.currency || "USD";

    console.log(`Average price: ${averagePrice.toFixed(2)} ${currency}`);

    // Format offers for response
    const formattedOffers = top3Offers.map((offer: any) => {
      // Create search link
      const searchQuery = encodeURIComponent(`${offer.title} ${offer.source}`);
      const link = `https://www.google.com/search?tbm=shop&q=${searchQuery}&gl=${country}`;

      return {
        title: offer.title,
        price: offer.price,
        priceNumber: offer.priceNumber,
        source: offer.source,
        link: link,
        thumbnail: offer.thumbnail,
      };
    });

    // Best deal is the first one (cheapest)
    const bestDeal = formattedOffers[0];
    const bestSearchQuery = encodeURIComponent(`${bestDeal.title} ${bestDeal.source}`);
    const bestDealLink = `https://www.google.com/search?tbm=shop&q=${bestSearchQuery}&gl=${country}`;

    return new Response(
      JSON.stringify({
        best_deal: {
          title: bestDeal.title,
          price: bestDeal.price,
          priceNumber: bestDeal.priceNumber,
          source: bestDeal.source,
          link: bestDealLink,
          thumbnail: bestDeal.thumbnail,
        },
        offers: formattedOffers,
        average_price: averagePrice.toFixed(2),
        currency: currency,
        location: data.search_parameters?.location || country,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in fetch_geo_prices:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
