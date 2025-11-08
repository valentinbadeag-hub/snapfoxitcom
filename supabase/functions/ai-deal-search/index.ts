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

    console.log('AI searching for online deals:', { productName, category, country });

    // Use AI to search and find the best online deals
    const aiPrompt = `You are a shopping assistant helping users find the best online deals.

Product: ${productName}
Category: ${category}
Country: ${country}

Task: Search for and identify the top 3 best online deals for this product currently available in ${country}. 

Focus on:
1. Major online retailers (Amazon, eBay, Walmart, Target, Best Buy, etc.)
2. Best prices (lowest first)
3. Currently available deals with links
4. Reputable online retailers only

Return your response as a JSON array with this EXACT structure:
[
  {
    "name": "Store/Retailer Name",
    "price": "XX.XX",
    "link": "full URL to product page"
  }
]

CRITICAL RULES:
- Return ONLY the JSON array, no additional text, no markdown code blocks
- Include exactly 3 deals (or fewer if less available)
- Prices must be numbers only (no currency symbols)
- Links must be complete, valid URLs
- If no deals found, return empty array: []
- Do NOT make up fictional prices or stores - only return real, verifiable deals`;

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
