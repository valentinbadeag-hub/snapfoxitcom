import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, category, description, rating } = await req.json();
    
    console.log(`Analyzing intent for product: ${productName}, category: ${category}`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Construct the Chain-of-Thought prompt
    const systemPrompt = `You are an intelligent product analyst performing contextual intent analysis. Follow this Chain-of-Thought process:

STEP 1: PRODUCT CATEGORIZATION
- Identify the primary category (Food Ingredient, Alcoholic Beverage, Supplement, Cosmetic, Tool, etc.)
- Extract critical keywords

STEP 2: DETERMINE USER INTENT
Based on category, determine the most probable user intent:
- Food Ingredient → Cooking/Allergens/Dietary
- Alcoholic Beverage → Consumption/Safety/Dietary
- Supplement/Medication → Dosage/Usage/Safety
- Cosmetic/Personal Care → Usage/Safety/Ingredients
- Pet Product → Pet Safety/Dosage

STEP 3: SAFETY & HEALTH CHECKS
Extract critical safety metrics:
- Food: Top 3 allergens
- Alcohol: ABV% and gluten status
- Supplement: RDI and maximum safe limit

STEP 4: ACTIONABLE RECOMMENDATIONS
Based on intent, provide:
- Cooking Intent: 2 quick recipes + 1 substitution
- Consumption Intent: ABV, gluten status, food pairing
- Dosage Intent: Daily dosage, timing, 1 common side effect

STEP 5: FORMAT OUTPUT
Return a JSON object with this structure:
{
  "intent": "cooking" | "consumption" | "health" | "usage",
  "intentLabel": "Quick Recipe Ideas" | "Safe Consumption Guide" | etc.,
  "safetyData": {
    "type": "allergens" | "alcohol" | "dosage",
    "items": ["item1", "item2", "item3"],
    "highlight": "Most critical safety info"
  },
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "icon": "🍳" | "🍷" | "💊" | "✨"
    }
  ]
}`;

    const userPrompt = `Analyze this product and determine user intent:
Product: ${productName}
Category: ${category}
Description: ${description}
Rating: ${rating || 'N/A'}

Follow the Chain-of-Thought process and return only valid JSON.`;

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI analysis failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    
    console.log('AI Response:', content);

    // Parse JSON response
    let intentAnalysis;
    try {
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      intentAnalysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback response
      intentAnalysis = {
        intent: "general",
        intentLabel: "Product Insights",
        safetyData: {
          type: "general",
          items: ["Check product label", "Follow instructions", "Store properly"],
          highlight: "Always read the label before use"
        },
        recommendations: [
          {
            title: "General Usage",
            description: content.substring(0, 200),
            icon: "💡"
          }
        ]
      };
    }

    console.log('Intent analysis complete:', intentAnalysis.intent);

    return new Response(JSON.stringify(intentAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Intent analysis error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        intent: "error",
        intentLabel: "Analysis Unavailable",
        recommendations: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
