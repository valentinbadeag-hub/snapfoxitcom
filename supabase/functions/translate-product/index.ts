import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Translating product data to English');

    // Call Lovable AI to translate to English
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
            content: `You are a professional translator. Translate the product information to English while preserving the JSON structure.

Your response must be valid JSON with this exact structure:
{
  "productName": "Translated product name",
  "category": "Translated category",
  "description": "Translated description",
  "pros": ["Translated pro 1", "Translated pro 2", "Translated pro 3"],
  "cons": ["Translated con 1", "Translated con 2"],
  "usageTips": ["Translated tip 1", "Translated tip 2", "Translated tip 3"],
  "recommendation": "Translated recommendation"
}

Only translate the text fields. Do NOT modify: rating, reviewCount, reviewBreakdown, or any numeric values.`,
          },
          {
            role: "user",
            content: `Translate this product information to English:

${JSON.stringify({
  productName: productData.productName,
  category: productData.category,
  description: productData.description,
  pros: productData.pros,
  cons: productData.cons,
  usageTips: productData.usageTips,
  recommendation: productData.recommendation
}, null, 2)}`,
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
    console.log("Translation received");

    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in AI response");
    }

    // Parse the JSON response from AI
    let translatedData;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```([\s\S]*?)```/);
      const jsonString = jsonMatch ? jsonMatch[1] : content;
      translatedData = JSON.parse(jsonString);
    } catch (e) {
      console.error("Failed to parse AI response as JSON:", content);
      throw new Error("Failed to parse translation from AI response");
    }

    console.log("Translation complete");

    return new Response(
      JSON.stringify({
        ...productData,
        ...translatedData,
        isTranslated: true
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in translate-product:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
