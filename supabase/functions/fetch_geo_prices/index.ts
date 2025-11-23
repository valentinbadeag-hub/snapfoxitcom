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

    const countryCode = country.toLowerCase();
    console.log(
      `Fetching prices for: ${product_name}, country: ${countryCode}, location: ${location}, uule: ${uule ? "provided" : "none"}`,
    );

    const params = new URLSearchParams({
      engine: "google_shopping",
      q: product_name,
      gl: countryCode,
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
    console.log("SerpAPI full response for debugging:", JSON.stringify(data, null, 2));
    
    // Helper function to extract country code from offer data
    const getOfferCountryCode = (offer: any): string | null => {
      // Check link/product_link for country indicators
      const url = offer.link || offer.product_link || "";
      
      // Extract domain from URL
      try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.toLowerCase();
        
        // Extract TLD (top-level domain)
        const tldMatch = domain.match(/\.([a-z]{2})$/);
        if (tldMatch) {
          const tld = tldMatch[1];
          // Map common TLDs to country codes
          const tldToCountry: { [key: string]: string } = {
            'ro': 'ro', 'de': 'de', 'fr': 'fr', 'uk': 'gb', 'us': 'us',
            'ca': 'ca', 'au': 'au', 'it': 'it', 'es': 'es', 'nl': 'nl',
            'pl': 'pl', 'br': 'br', 'mx': 'mx', 'jp': 'jp', 'cn': 'cn'
          };
          if (tldToCountry[tld]) {
            return tldToCountry[tld];
          }
        }
        
        // Check for country indicators in domain name
        if (domain.includes('.ro') || domain.includes('romania')) return 'ro';
        if (domain.includes('.de') || domain.includes('germany')) return 'de';
        if (domain.includes('.fr') || domain.includes('france')) return 'fr';
        
        // For global marketplaces, check source name
        if (offer.source) {
          const source = offer.source.toLowerCase();
          if (source.includes('romania') || source.includes('român')) return 'ro';
          if (source.includes('germany') || source.includes('deutschland')) return 'de';
          if (source.includes('france')) return 'fr';
        }
      } catch (e) {
        console.log(`Could not parse URL for offer: ${offer.source}`);
      }
      
      return null; // Unknown country
    };

    if (data.shopping_results && data.shopping_results.length > 0) {
      console.log(`Received ${data.shopping_results.length} offers from SERP API`);
      
      // Filter offers by country code before processing
      const filteredByCountry = data.shopping_results.filter((offer: any) => {
        const offerCountry = getOfferCountryCode(offer);
        console.log(`Offer: ${offer.source} - Detected country: ${offerCountry || 'unknown'} - User country: ${countryCode}`);
        
        // Keep offer if:
        // 1. Country matches user's country
        // 2. Country is unknown (might be local but couldn't detect)
        const shouldKeep = offerCountry === countryCode || offerCountry === null;
        
        if (!shouldKeep) {
          console.log(`Filtering out ${offer.source} - country mismatch`);
        }
        
        return shouldKeep;
      });
      
      console.log(`After country filtering: ${filteredByCountry.length} offers remain for country: ${countryCode}`);
      
      if (filteredByCountry.length === 0) {
        console.log("No offers match user's country after filtering");
        return new Response(
          JSON.stringify({ 
            error: "No local deals found", 
            message: `No offers available in your country (${countryCode.toUpperCase()})` 
          }), 
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const offers = filteredByCountry.slice(0, 5); // Top 5 deals after filtering

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

      // Format offers for response - Google Shopping doesn't provide direct merchant links
      // The API returns Google Shopping product page URLs which can't be opened cross-origin
      const formattedOffers = offers.map((offer: any) => {
        // Create a Google Shopping search URL for the specific product and source
        const searchQuery = encodeURIComponent(`${offer.title} ${offer.source}`);
        const googleShoppingSearch = `https://www.google.com/search?tbm=shop&q=${searchQuery}&gl=${countryCode}`;
        
        console.log(`Creating search link for ${offer.source}`);
        
        return {
          title: offer.title,
          price: offer.price || offer.extracted_price,
          source: offer.source,
          link: googleShoppingSearch, // Use Google Shopping search instead of product_link
          thumbnail: offer.thumbnail,
          rating: offer.rating,
          reviews: offer.reviews,
        };
      });

      console.log(`Best deal found from ${best.source} at ${best.price || best.extracted_price}`);
      console.log(`Returning ${formattedOffers.length} offers for country: ${countryCode}`);
      
      // Create Google Shopping search link for the best deal
      const bestSearchQuery = encodeURIComponent(`${best.title} ${best.source}`);
      const bestDealLink = `https://www.google.com/search?tbm=shop&q=${bestSearchQuery}&gl=${countryCode}`;
      
      return new Response(
        JSON.stringify({
          best_deal: {
            title: best.title,
            price: best.price || best.extracted_price,
            source: best.source,
            link: bestDealLink,
            thumbnail: best.thumbnail,
          },
          avg_price: avg_price.toFixed(2),
          offers: formattedOffers,
          currency: data.search_parameters?.currency || "USD",
          location: data.search_parameters?.location || country,
          countryCode: countryCode,
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
