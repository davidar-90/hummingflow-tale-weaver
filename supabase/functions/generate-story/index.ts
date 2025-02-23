
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not found');
    }

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

    console.log('[Debug] Sending request to OpenAI');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a helpful assistant that creates engaging social stories for children.' 
          },
          { 
            role: 'user', 
            content: prompt 
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Debug] OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('[Debug] OpenAI response:', JSON.stringify(data, null, 2));

    const generatedContent = data.choices[0].message.content;
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
