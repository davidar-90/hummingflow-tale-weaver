
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CreateChatCompletionRequestMessage, ChatRole } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('API key not configured');
    }

    const messages: CreateChatCompletionRequestMessage[] = [
      {
        role: 'user' as ChatRole,
        content: `Create a social story focusing on ${requestData.therapyGoal} for a ${requestData.ageGroup} student with ${requestData.communicationLevel} communication level. Their interests include: ${requestData.studentInterests}. ${requestData.systemInstructions}`
      }
    ];

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
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const storyContent = data.candidates[0].content.parts[0].text;
    console.log('Story content:', storyContent);

    // Try to parse the story content as JSON, removing potential markdown formatting
    let parsedStory;
    try {
      // Remove markdown code block syntax if present
      const cleanContent = storyContent.replace(/```json\s*|\s*```/g, '');
      parsedStory = JSON.parse(cleanContent);
    } catch (error) {
      console.error('Failed to parse story JSON:', error);
      throw new Error('Invalid story format received from API');
    }

    // Return the parsed story data
    return new Response(
      JSON.stringify(parsedStory),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
