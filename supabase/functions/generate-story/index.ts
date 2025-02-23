
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GENAI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { therapyGoal, ageGroup, communicationLevel, supportCues, studentInterests, systemInstructions } = await req.json();

    const response = await fetch(`${GENAI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a social story with a title, content, interaction point, and an image prompt following Imagen best practices.
            
            Guidelines for the image prompt:
            - Be specific and detailed about what should be in the scene
            - Focus on the main action or emotion of the story
            - Describe visual elements like lighting, perspective, and style
            - Specify it should be in a friendly, children's illustration style
            - Include mood and atmosphere descriptions
            
            Response format should be JSON with:
            {
              "title": "story title",
              "content": "main story content",
              "imagePrompt": "detailed scene description following Imagen guidelines",
              "interactionPoint": {
                "prompt": "interaction question",
                "choices": [{"text": "choice text", "isCorrect": boolean}],
                "feedback": {"correct": "feedback", "incorrect": "feedback"},
                "continuation": "story continuation",
                "continuationImagePrompt": "detailed scene description for continuation"
              }
            }

            Story parameters:
            - Therapy goal: ${therapyGoal}
            - Age group: ${ageGroup}
            - Communication level: ${communicationLevel}
            - Support cues: ${supportCues || 'none'}
            - Student interests: ${studentInterests}
            
            Additional instructions:
            ${systemInstructions}`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to generate story: ${response.statusText}`);
    }

    const geminiResponse = await response.json();
    console.log('Gemini API Response:', JSON.stringify(geminiResponse, null, 2));

    if (!geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    // Extract the JSON string from the response and parse it
    const jsonContent = geminiResponse.candidates[0].content.parts[0].text;
    console.log('Raw JSON content:', jsonContent);
    
    // Remove markdown code block syntax if present
    const cleanJson = jsonContent.replace(/```json\n|\n```/g, '').trim();
    console.log('Cleaned JSON:', cleanJson);
    
    const storyData = JSON.parse(cleanJson);
    console.log('Parsed story data:', storyData);

    // Validate required fields
    if (!storyData.title || !storyData.content || !storyData.imagePrompt || !storyData.interactionPoint) {
      throw new Error('Generated story is missing required fields');
    }

    return new Response(JSON.stringify(storyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Failed to generate story content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
