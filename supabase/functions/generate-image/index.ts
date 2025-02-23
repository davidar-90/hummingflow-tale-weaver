
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
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('[Debug] Failed to parse request body:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { prompt } = requestBody;
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

    const apiResponse = await fetch(API_ENDPOINT, {
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
          model: "runware:100@1",
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

    // First check if the response is ok
    if (!apiResponse.ok) {
      console.error('[Debug] API response not ok:', apiResponse.status, apiResponse.statusText);
      return new Response(
        JSON.stringify({ 
          error: 'API request failed',
          status: apiResponse.status,
          statusText: apiResponse.statusText
        }),
        { 
          status: apiResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Get response text first
    const responseText = await apiResponse.text();
    console.log('[Debug] Raw API response:', responseText);

    // Try to parse the response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (error) {
      console.error('[Debug] Failed to parse API response:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid JSON response from API',
          details: error.message,
          responseText: responseText
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if data has the expected structure
    if (!Array.isArray(data?.data)) {
      console.error('[Debug] Unexpected response structure:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Unexpected API response structure',
          response: data
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Find the image inference result
    const imageData = data.data.find((item: any) => item.taskType === "imageInference");
    
    if (!imageData) {
      console.error('[Debug] No image inference data found in response:', data);
      return new Response(
        JSON.stringify({ 
          error: 'No image inference data in response',
          response: data
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!imageData.imageURL) {
      console.error('[Debug] No image URL in inference data:', imageData);
      return new Response(
        JSON.stringify({ 
          error: 'No image URL in response',
          inferenceData: imageData
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Successfully got the image URL
    return new Response(
      JSON.stringify({ imageUrl: imageData.imageURL }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Debug] Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
