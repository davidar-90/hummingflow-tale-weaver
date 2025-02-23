
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CreateChatCompletionRequestMessage, ChatRole } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const requestData = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    console.log('API Key available:', !!GEMINI_API_KEY);

    if (!GEMINI_API_KEY) {
      console.error('Missing Gemini API key');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const messages: CreateChatCompletionRequestMessage[] = [
      {
        role: 'user' as ChatRole,
        content: `Create a social story focusing on ${requestData.therapyGoal} for a ${requestData.ageGroup} student with ${requestData.communicationLevel} communication level. Their interests include: ${requestData.studentInterests}. ${requestData.systemInstructions}`
      }
    ];

    console.log('Making request to Gemini API...');
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: messages[0].content
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('API request failed:', data);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate story',
          details: data
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const storyContent = data.candidates[0].content.parts[0].text;
    console.log('Generated story content:', storyContent);

    // Try to parse the story content as JSON
    let parsedStory;
    try {
      const cleanContent = storyContent.replace(/```json\s*|\s*```/g, '').trim();
      parsedStory = JSON.parse(cleanContent);
    } catch (error) {
      console.error('Failed to parse story JSON:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid story format received from API',
          details: error.message,
          content: storyContent
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    return new Response(
      JSON.stringify(parsedStory),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
