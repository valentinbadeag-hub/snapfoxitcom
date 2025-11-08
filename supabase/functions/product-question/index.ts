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
    const { question, productName, category, country } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Processing question about:', productName, 'Question:', question);

    // Call Lovable AI to answer the question with web search
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a product expert assistant. Answer questions about products with specific, actionable information.

CRITICAL RULES:
- Return ONLY a JSON array of exactly 3 bullet points, nothing else
- Each bullet point should be specific and informative
- Do NOT include quotes around the text
- Do NOT include any explanatory text outside the JSON
- Search the web for current information if needed
- Be concise and direct

Format: ["Bullet point 1", "Bullet point 2", "Bullet point 3"]`
          },
          {
            role: 'user',
            content: `Product: ${productName}
Category: ${category}
Country: ${country || 'US'}
Question: ${question}

Provide a JSON array of exactly 3 specific, informative bullet points answering this question.`
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    console.log('AI Response received');
    
    const content = aiResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in AI response');
    }

    // Parse the JSON response from AI
    let bulletPoints;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      bulletPoints = JSON.parse(jsonString);
      
      // Ensure it's an array
      if (!Array.isArray(bulletPoints)) {
        throw new Error('Response is not an array');
      }
      
      // Limit to exactly 3 bullet points
      bulletPoints = bulletPoints.slice(0, 3);
      
      // Clean up any quotes from the bullet points
      bulletPoints = bulletPoints.map((point: string) => 
        point.replace(/^["']|["']$/g, '').trim()
      );
      
    } catch (e) {
      console.error('Failed to parse AI response as JSON:', content);
      throw new Error('Failed to parse response from AI');
    }

    console.log('Question answered with', bulletPoints.length, 'bullet points');

    return new Response(
      JSON.stringify({ bulletPoints }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in product-question function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to answer product question'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
