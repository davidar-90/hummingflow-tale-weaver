
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateStoryContent(params: any) {
  console.log('Generating story with params:', params);
  
  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Create an engaging social story with a title, content, and an interaction point.

          Your response must be in this exact JSON format:
          {
            "title": "story title",
            "content": "main story content",
            "imagePrompt": "detailed image prompt",
            "interactionPoint": {
              "prompt": "interaction question",
              "choices": [{"text": "choice text", "isCorrect": boolean}],
              "feedback": {"correct": "feedback", "incorrect": "feedback"},
              "continuation": "story continuation",
              "continuationImagePrompt": "continuation image prompt"
            }
          }

          Story parameters:
          - Therapy goal: ${params.therapyGoal}
          - Age group: ${params.ageGroup}
          - Communication level: ${params.communicationLevel}
          - Support cues: ${params.supportCues || 'none'}
          - Student interests: ${params.studentInterests}
          
          Additional instructions:
          ${params.systemInstructions}
          
          Remember to return ONLY the JSON object, no additional text or markdown.`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 32,
        topP: 1,
        maxOutputTokens: 2048
      }
    })
  });

  if (!response.ok) {
    console.error('Gemini API error:', await response.text());
    throw new Error(`Failed to generate story content: ${response.statusText}`);
  }

  const geminiResponse = await response.json();
  console.log('Raw Gemini Response:', JSON.stringify(geminiResponse, null, 2));

  if (!geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Invalid Gemini response format:', geminiResponse);
    throw new Error('Invalid response format from Gemini API');
  }

  const jsonContent = geminiResponse.candidates[0].content.parts[0].text;
  console.log('Raw JSON content:', jsonContent);
  
  try {
    // Clean up any markdown formatting that might be present
    const cleanJson = jsonContent.replace(/```json\n|\n```/g, '').trim();
    console.log('Cleaned JSON:', cleanJson);
    
    const parsedData = JSON.parse(cleanJson);
    console.log('Successfully parsed story data:', parsedData);
    
    // Validate required fields
    if (!parsedData.title || !parsedData.content || !parsedData.interactionPoint) {
      throw new Error('Missing required fields in generated story');
    }
    
    return parsedData;
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Failed to parse JSON:', jsonContent);
    throw new Error(`Failed to parse story data: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', await req.clone().text());
    const params = await req.json();
    
    console.log('Step 1: Generating story content...');
    const storyData = await generateStoryContent(params);
    console.log('Story data generated successfully:', storyData);

    return new Response(JSON.stringify(storyData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack || 'Failed to generate story content'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
