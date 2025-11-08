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
    const { productName, category, country } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const OPEN_NINJA_API_KEY = Deno.env.get('OPEN_NINJA_API_KEY');
    if (!OPEN_NINJA_API_KEY) {
      throw new Error('OPEN_NINJA_API_KEY not configured');
    }

    console.log('Searching for deals:', { productName, category, country });

    // First, get real product data from OpenWeb Ninja API (via RapidAPI)
    const searchUrl = `https://local-business-data.p.rapidapi.com/search?query=${encodeURIComponent(productName)}&limit=10&region=${country.toLowerCase()}`;
    console.log('Fetching from OpenWeb Ninja:', searchUrl);
    
    const ninjaResponse = await fetch(searchUrl, {
      headers: {
        'X-RapidAPI-Key': OPEN_NINJA_API_KEY,
        'X-RapidAPI-Host': 'local-business-data.p.rapidapi.com',
        'Content-Type': 'application/json',
      }
    });

    if (!ninjaResponse.ok) {
      const errorText = await ninjaResponse.text();
      console.error('OpenWeb Ninja API error:', errorText);
      throw new Error(`OpenWeb Ninja API failed: ${ninjaResponse.status}`);
    }

    const ninjaData = await ninjaResponse.json();
    console.log('OpenWeb Ninja response:', JSON.stringify(ninjaData, null, 2));

    // Use AI to analyze and format the best deals
    const aiPrompt = `You are a shopping assistant helping users find the best online deals.

Product: ${productName}
Category: ${category}
Country: ${country}

Here is real product data from online stores:
${JSON.stringify(ninjaData, null, 2)}

Task: Extract and return EXACTLY the top 3 best online deals available in ${country}. Focus on:
1. Best prices (lowest first)
2. Reputable online retailers
3. Currently available deals

Return your response as a JSON array with this EXACT structure:
[
  {
    "name": "Store Name",
    "price": "XX.XX",
    "link": "full URL to product page"
  }
]

CRITICAL RULES:
- Return ONLY the JSON array, no additional text
- Include exactly 3 deals (or fewer if less available)
- Prices must be numbers only (no currency symbols)
- Links must be complete URLs
- If no deals found, return empty array: []`;

    console.log('Sending to Lovable AI...');
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      throw new Error(`AI API failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));
    
    let deals = [];
    try {
      const content = aiData.choices[0].message.content;
      console.log('AI content:', content);
      
      // Clean up the response - remove markdown code blocks if present
      let cleanContent = content.trim();
      if (cleanContent.startsWith('```json')) {
        cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanContent.startsWith('```')) {
        cleanContent = cleanContent.replace(/```\n?/g, '');
      }
      
      deals = JSON.parse(cleanContent);
      console.log('Parsed deals:', deals);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      deals = [];
    }

    return new Response(
      JSON.stringify({ deals }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in ai-deal-search:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        deals: []
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
