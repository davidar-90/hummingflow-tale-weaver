
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent';
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      therapyGoal,
      ageGroup,
      communicationLevel,
      supportCues,
      studentInterests,
      systemInstructions
    } = await req.json();

    console.log('[Debug] API Key available:', !!GEMINI_API_KEY);
    console.log('[Debug] Generating story with inputs:', {
      therapyGoal,
      ageGroup,
      communicationLevel,
      supportCues,
      studentInterests
    });

    const prompt = `
Create a social story with the following requirements:
- Therapy Goal: ${therapyGoal}
- Age Group: ${ageGroup}
- Communication Level: ${communicationLevel}
- Support Cues needed: ${supportCues}
- Student Interests: ${studentInterests}

${systemInstructions}

The story should include an interaction point where the student can practice making choices.
IMPORTANT: The interaction point MUST have EXACTLY 3 choices, where:
- Only one choice is correct
- Two choices are incorrect but plausible
- All choices are positive and constructive
- No choices should depict negative behaviors

Format the response as a JSON object with the following structure:
{
  "title": "Story Title",
  "content": "Story content before the interaction point",
  "imagePrompt": "A clear description for generating an illustration",
  "interactionPoint": {
    "prompt": "What should [character] do?",
    "choices": [
      {"text": "First option (correct)", "isCorrect": true},
      {"text": "Second option", "isCorrect": false},
      {"text": "Third option", "isCorrect": false}
    ],
    "feedback": {
      "correct": "Positive feedback for correct choice",
      "incorrect": "Supportive guidance for incorrect choice"
    },
    "continuation": "Story continuation after choice is made",
    "continuationImagePrompt": "A clear description for generating an illustration for the continuation"
  }
}`;

    console.log('[Debug] Sending request to Gemini');

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 32,
          topP: 1,
          maxOutputTokens: 2048,
        },
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Debug] Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Debug] Gemini response:', JSON.stringify(data, null, 2));

    const generatedContent = data.candidates[0].content.parts[0].text;
    console.log('[Debug] Generated content:', generatedContent);

    return new Response(generatedContent, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[Debug] Error in generate-story:', error);
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
