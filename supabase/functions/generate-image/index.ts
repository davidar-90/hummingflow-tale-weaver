
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('[Debug] API Key available:', !!GEMINI_API_KEY);
    console.log('[Debug] Received prompt:', prompt);

    const request = {
      contents: [{
        parts: [{
          text: `Generate an image: High quality digital illustration in a friendly children's book style: ${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 32,
        topP: 1
      }
    };

    console.log('[Debug] Request payload:', JSON.stringify(request, null, 2));

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    console.log('[Debug] Response status:', response.status);
    console.log('[Debug] Response status text:', response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Debug] Full error response:', errorText);
      throw new Error(`Failed to generate image: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[Debug] Success response:', JSON.stringify(data, null, 2));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Debug] Detailed error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
