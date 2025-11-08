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
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing question about:', productName);

    const systemPrompt = `You are a knowledgeable shopping assistant helping users learn more about products. 
Product Context:
- Name: ${productName}
- Category: ${productCategory || 'Unknown'}
- Description: ${productDescription || 'N/A'}

Respond to user questions about this product in exactly 5-10 concise bullet points. Each bullet point should be informative and helpful.
Format your response as a JSON array of strings, where each string is one bullet point.
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
        .filter((line: string) => line.length > 0)
        .slice(0, 10);
    }

    // Ensure we have 5-10 bullet points
    if (bulletPoints.length < 5) {
      bulletPoints.push('Feel free to ask more specific questions!');
    }
    bulletPoints = bulletPoints.slice(0, 10);

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
