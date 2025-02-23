
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY');

    if (!RUNWARE_API_KEY) {
      throw new Error('RUNWARE_API_KEY is not set');
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
          positivePrompt: prompt,
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

    let data;
    try {
      const text = await response.text();
      console.log('[Debug] Raw response:', text);
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('[Debug] JSON parsing error:', parseError);
      throw new Error(`Failed to parse response: ${parseError.message}`);
    }

    if (!response.ok) {
      console.error('[Debug] API error response:', data);
      throw new Error(`Failed to generate image: ${response.statusText}`);
    }

    console.log('[Debug] Success response:', JSON.stringify(data, null, 2));

    // Extract the image URL from the response
    const imageData = data.data?.find((item: any) => item.taskType === "imageInference");
    if (!imageData?.imageURL) {
      console.error('[Debug] No image data found in response:', data);
      throw new Error('No image URL in response');
    }

    return new Response(JSON.stringify({ imageUrl: imageData.imageURL }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Debug] Error in generate-image:', error);
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
