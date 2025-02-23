
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { CreateStoryRequest, StoryResponse } from "./types.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { therapyGoal, ageGroup, communicationLevel, studentInterests, systemInstructions } = await req.json() as CreateStoryRequest;
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('API key not found');
    }

    const prompt = `
      Create a social story that helps teach and reinforce appropriate social behaviors.
      
      Student Profile:
      - Therapy Goal: ${therapyGoal}
      - Age/Grade Level: ${ageGroup}
      - Communication Level: ${communicationLevel}
      - Interests: ${studentInterests}
      
      ${systemInstructions}
      
      Response Format:
      Return a JSON object with:
      - title: A concise, engaging title
      - content: The main story content (2-3 paragraphs)
      - imagePrompt: A detailed visual description for generating an illustration
      - interactionPoint: {
          prompt: A question or situation from the story
          choices: Array of 2-4 options, each with:
            - text: The choice text
            - isCorrect: boolean
          feedback: {
            correct: Positive reinforcement message
            incorrect: Gentle guidance message
          }
          continuation: Text that continues the story based on making the correct choice
          continuationImagePrompt: A detailed visual description for the continuation scene
        }
      
      The interaction point should:
      1. Match the student's communication level
      2. Focus on practicing the specific therapy goal
      3. Present clear, age-appropriate choices
      4. Include positive feedback and reinforcement
      5. Naturally continue the story after the interaction
      
      Keep the language clear, supportive, and engaging.`;

    console.log('Sending prompt to Gemini:', prompt);

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
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
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      throw new Error('Failed to generate story');
    }

    const generatedText = data.candidates[0].content.parts[0].text;
    const cleanedResponse = generatedText.replace(/```json\n?|```\n?/g, '').trim();
    
    try {
      const parsedResponse = JSON.parse(cleanedResponse) as StoryResponse;
      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse story response');
    }

  } catch (error) {
    console.error('Error in generate-story function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
