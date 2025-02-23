
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GENAI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateStoryContent(params: any) {
  console.log('Generating story with params:', params);
  
  const response = await fetch(`${GENAI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Create an engaging social story with a title, content, and an interaction point.

          Response format should be JSON with:
          {
            "title": "story title",
            "content": "main story content",
            "interactionPoint": {
              "prompt": "interaction question",
              "choices": [{"text": "choice text", "isCorrect": boolean}],
              "feedback": {"correct": "feedback", "incorrect": "feedback"},
              "continuation": "story continuation"
            }
          }

          Story parameters:
          - Therapy goal: ${params.therapyGoal}
          - Age group: ${params.ageGroup}
          - Communication level: ${params.communicationLevel}
          - Support cues: ${params.supportCues || 'none'}
          - Student interests: ${params.studentInterests}
          
          Additional instructions:
          ${params.systemInstructions}`
        }]
      }]
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
  
  const cleanJson = jsonContent.replace(/```json\n|\n```/g, '').trim();
  console.log('Cleaned JSON:', cleanJson);
  
  try {
    const parsedData = JSON.parse(cleanJson);
    console.log('Successfully parsed story data:', parsedData);
    return parsedData;
  } catch (error) {
    console.error('JSON parsing error:', error);
    console.error('Failed to parse JSON:', cleanJson);
    throw new Error('Failed to parse story data from Gemini response');
  }
}

async function generateImagePrompt(title: string, content: string, isInitial: boolean = true) {
  console.log(`Generating ${isInitial ? 'initial' : 'continuation'} image prompt for:`, { title, content });
  
  const response = await fetch(`${GENAI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Create a detailed image prompt for the following ${isInitial ? 'story' : 'story continuation'}:

          Title: ${title}
          ${isInitial ? 'Content' : 'Continuation'}: ${content}

          Guidelines for the image prompt:
          - Be specific and detailed about what should be in the scene
          - Focus on the main action or emotion of the story
          - Describe visual elements like lighting, perspective, and style
          - Specify it should be in a friendly, children's illustration style
          - Include mood and atmosphere descriptions
          
          Return ONLY the image prompt text, no additional formatting or explanation.`
        }]
      }]
    })
  });

  if (!response.ok) {
    console.error('Image prompt generation error:', await response.text());
    throw new Error(`Failed to generate image prompt: ${response.statusText}`);
  }

  const geminiResponse = await response.json();
  console.log('Raw image prompt response:', JSON.stringify(geminiResponse, null, 2));
  
  const imagePrompt = geminiResponse.candidates[0].content.parts[0].text.trim();
  console.log('Generated image prompt:', imagePrompt);
  
  return imagePrompt;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received request:', await req.clone().text());
    const params = await req.json();
    
    // Step 1: Generate the story content
    console.log('Step 1: Generating story content...');
    const storyData = await generateStoryContent(params);
    console.log('Story data generated successfully');

    // Step 2: Generate the image prompt for the initial story
    console.log('Step 2: Generating initial image prompt...');
    const imagePrompt = await generateImagePrompt(storyData.title, storyData.content);
    console.log('Initial image prompt generated successfully');

    // Step 3: If there's a continuation, generate its image prompt
    let continuationImagePrompt = '';
    if (storyData.interactionPoint?.continuation) {
      console.log('Step 3: Generating continuation image prompt...');
      continuationImagePrompt = await generateImagePrompt(
        storyData.title,
        storyData.interactionPoint.continuation,
        false
      );
      console.log('Continuation image prompt generated successfully');
    }

    // Combine all data
    const finalData = {
      ...storyData,
      imagePrompt,
      interactionPoint: storyData.interactionPoint ? {
        ...storyData.interactionPoint,
        continuationImagePrompt
      } : null
    };

    // Validate the final data
    if (!finalData.title || !finalData.content || !finalData.imagePrompt || !finalData.interactionPoint) {
      console.error('Missing required fields in final data:', finalData);
      throw new Error('Generated story is missing required fields');
    }

    console.log('Sending successful response with data:', finalData);
    return new Response(JSON.stringify(finalData), {
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
