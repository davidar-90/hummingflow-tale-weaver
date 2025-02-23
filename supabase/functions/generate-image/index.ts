
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const IMAGEN_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagegeneration:generateImage';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    console.log('Received image generation request with prompt:', prompt);

    const request = {
      prompt: `High quality digital illustration in a friendly children's book style: ${prompt}`,
      sampleCount: 1,
      samplerParams: {
        height: 1024,
        width: 1024,
        samplingMethod: "DDIM",
        guidanceScale: 7.0
      }
    };

    console.log('Sending request to Imagen API:', JSON.stringify(request, null, 2));

    const response = await fetch(`${IMAGEN_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Imagen API error:', errorText);
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Received response from Imagen:', JSON.stringify(data, null, 2));

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
