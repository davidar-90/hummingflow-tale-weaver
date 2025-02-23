
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

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!requestData.therapyGoal || !requestData.ageGroup || !requestData.communicationLevel) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
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

    console.log('Sending request to Gemini API with message:', messages[0].content);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
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
      return new Response(
        JSON.stringify({ 
          error: `API request failed: ${response.statusText}`,
          details: data
        }),
        { 
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      return new Response(
        JSON.stringify({ error: 'Invalid response format from API' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const storyContent = data.candidates[0].content.parts[0].text;
    console.log('Story content:', storyContent);

    // Try to parse the story content as JSON, removing potential markdown formatting
    let parsedStory;
    try {
      // Remove markdown code block syntax and any leading/trailing whitespace
      const cleanContent = storyContent
        .replace(/```json\s*|\s*```/g, '')
        .trim();
      
      console.log('Cleaned content:', cleanContent);
      
      parsedStory = JSON.parse(cleanContent);
      
      // Validate the parsed story has required fields
      if (!parsedStory.title || !parsedStory.content) {
        throw new Error('Missing required story fields');
      }
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

    // Return the parsed story data with explicit 200 status
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
