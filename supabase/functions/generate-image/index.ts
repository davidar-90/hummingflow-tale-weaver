
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RunwareResponse {
  data: Array<{
    taskType: string;
    taskUUID: string;
    imageUUID: string;
    imageURL: string;
    NSFWContent: boolean;
    cost: number;
    seed: number;
    positivePrompt: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt } = await req.json();
    const RUNWARE_API_KEY = Deno.env.get('RUNWARE_API_KEY');

    if (!RUNWARE_API_KEY) {
      throw new Error('Runware API key not configured');
    }

    console.log('Generating image with Runware API, prompt:', prompt);

    const response = await fetch('https://api.runware.ai/v1', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
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
          model: "runware:100@1",
          width: 1024,
          height: 1024,
          numberResults: 1,
          outputFormat: "WEBP",
          CFGScale: 1,
          scheduler: "FlowMatchEulerDiscreteScheduler",
          strength: 0.8
        }
      ])
    });

    const data = await response.json() as RunwareResponse;
    console.log('Runware API response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error('Failed to generate image');
    }

    const imageData = data.data.find(item => item.taskType === 'imageInference');
    if (!imageData?.imageURL) {
      throw new Error('No image URL in response');
    }

    return new Response(
      JSON.stringify({ imageUrl: imageData.imageURL }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
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
