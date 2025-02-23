
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to clean and parse JSON from the story content
const parseStoryContent = (content: string) => {
  try {
    // Remove any markdown code block syntax
    let cleanContent = content.replace(/```json\s*|\s*```/g, '');
    
    // Remove any non-printable characters and control characters
    cleanContent = cleanContent.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
    
    // Try to find JSON-like structure if the content isn't pure JSON
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanContent = jsonMatch[0];
    }

    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error('Failed to parse story content: ' + error.message);
  }
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

    console.log('[Debug] API Key available:', !!GEMINI_API_KEY);

    if (!GEMINI_API_KEY) {
      throw new Error('API key not configured');
    }

    const prompt = `Create a social story focusing on ${requestData.therapyGoal} for a ${requestData.ageGroup} student with ${requestData.communicationLevel} communication level. Their interests include: ${requestData.studentInterests}. 

Please respond with a JSON object in this exact format:
{
  "title": "Story Title Here",
  "content": "Main story content here...",
  "imagePrompt": "Detailed scene description for illustration"
}

Make sure the story is age-appropriate, engaging, and focuses on the therapy goal while incorporating the student's interests.`;

    console.log('[Debug] Sending prompt to Gemini:', prompt);

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
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
    console.log('[Debug] Raw API response:', JSON.stringify(data, null, 2));

    if (!response.ok || !data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const storyContent = data.candidates[0].content.parts[0].text;
    console.log('[Debug] Generated story content:', storyContent);

    // Parse the story content with our enhanced parser
    const parsedStory = parseStoryContent(storyContent);
    
    // Validate the parsed story structure
    if (!parsedStory.title || !parsedStory.content || !parsedStory.imagePrompt) {
      throw new Error('Invalid story format: missing required fields');
    }

    return new Response(
      JSON.stringify(parsedStory),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[Debug] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
