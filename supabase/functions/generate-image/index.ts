
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const API_ENDPOINT = "https://api.runware.ai/v1";

// Calculate 16:9 height for 1024px width
const WIDTH = 1024;
const HEIGHT = Math.floor(WIDTH * (9/16)); // This will be 576px

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const { prompt } = await req.json();
    const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY');

    if (!RUNWARE_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RUNWARE_API_KEY is not set' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Debug] Generating image with prompt:', prompt);

    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify([
        {
          taskType: "authentication",
          apiKey: RUNWARE_API_KEY
        },
        {
          taskType: "imageInference",
          taskUUID: crypto.randomUUID(),
          positivePrompt: `Generate an image with a dynamic, stylized animation aesthetic, reminiscent of a modern comic book or graphic novel: ${prompt}. Employ vibrant, saturated colors with layered, textured overlays and halftone patterns. Use strong, exaggerated motion blur and speed lines to convey kinetic energy. Incorporate bold ink lines and fragmented imagery, with a focus on dynamic perspective. The overall feel should be energetic and visually diverse, similar to a pop art inspired animation.`,
          model: "runware:flux1@1",
          width: WIDTH,
          height: HEIGHT,
          numberResults: 1,
          outputFormat: "WEBP",
          CFGScale: 1,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          strength: 0.8
        }
      ])
    });

    const text = await response.text();
    console.log('[Debug] Raw response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[Debug] JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse API response',
          details: parseError.message 
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!response.ok) {
      console.error('[Debug] API error response:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate image',
          details: response.statusText,
          data: data 
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('[Debug] Success response:', JSON.stringify(data, null, 2));

    // Extract the image URL from the response
    const imageData = data.data?.find((item: any) => item.taskType === "imageInference");
    if (!imageData?.imageURL) {
      console.error('[Debug] No image data found in response:', data);
      return new Response(
        JSON.stringify({ error: 'No image URL in response', data: data }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify({ imageUrl: imageData.imageURL }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('[Debug] Error in generate-image:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
