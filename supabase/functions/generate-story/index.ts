
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatGPTAPI } from 'npm:chatgpt';

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

    const API_KEY = Deno.env.get('OPENAI_API_KEY');
    const api = new ChatGPTAPI({
      apiKey: API_KEY!,
      completionParams: {
        model: 'gpt-4-turbo-preview',
        temperature: 0.7,
        max_tokens: 1500,
      },
    });

    const response = await api.sendMessage(prompt);
    console.log('Story generation response:', response.text);

    return new Response(response.text, {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
