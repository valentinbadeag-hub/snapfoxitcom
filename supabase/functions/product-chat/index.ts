import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const { question, productName, productCategory, productDescription } = await req.json();
    
    if (!question || !productName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const OPEN_NINJA_API_KEY = Deno.env.get('OPEN_NINJA_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing question about:', productName);

    // Fetch real-time product data from OpenWeb Ninja
    let productData = '';
    if (OPEN_NINJA_API_KEY) {
      try {
        const searchQuery = encodeURIComponent(productName);
        const apiUrl = `https://api.openwebninja.com/realtime-product-search/search-v2?q=${searchQuery}&country=US&num_results=3`;
        
        const ninjaResponse = await fetch(apiUrl, {
          headers: {
            'X-RapidAPI-Key': OPEN_NINJA_API_KEY,
            'X-RapidAPI-Host': 'api.openwebninja.com',
            'Content-Type': 'application/json',
          },
        });

        if (ninjaResponse.ok) {
          const data = await ninjaResponse.json();
          if (data.offers && data.offers.length > 0) {
            productData = `\nReal-time market data:\n${data.offers.slice(0, 3).map((offer: any) => 
              `- ${offer.store_name}: ${offer.price} ${offer.currency || 'USD'}`
            ).join('\n')}`;
          }
        }
      } catch (error) {
        console.error('Error fetching OpenWeb Ninja data:', error);
      }
    }

    const systemPrompt = `You are a knowledgeable shopping assistant helping users learn more about products. 
Product Context:
- Name: ${productName}
- Category: ${productCategory || 'Unknown'}
- Description: ${productDescription || 'N/A'}${productData}

Answer the user's question with 3-7 specific, informative bullet points. Be concise and direct.
Format your response as a JSON array of strings, where each string is one bullet point without any quotes or extra formatting.
Do not include any other text, just the JSON array.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('AI response:', content);

    // Try to parse as JSON array
    let bulletPoints: string[];
    try {
      bulletPoints = JSON.parse(content);
      if (!Array.isArray(bulletPoints)) {
        throw new Error('Not an array');
      }
    } catch {
      // If not JSON, split by newlines and extract bullet points
      bulletPoints = content
        .split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^[-•*]\s*/, '').trim())
        .filter((line: string) => line.length > 0);
    }

    // Clean up quotes and limit to 7 bullet points
    bulletPoints = bulletPoints
      .map((point: string) => point.replace(/^["']|["']$/g, '').trim())
      .filter((point: string) => point.length > 0)
      .slice(0, 7);

    return new Response(
      JSON.stringify({ bulletPoints }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in product-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
