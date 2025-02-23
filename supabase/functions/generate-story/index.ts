
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
          prompt: A clear question or situation from the story that tests understanding
          choices: Exactly three options, formatted as an array where:
            - First option: The correct choice that demonstrates the desired behavior
            - Second option: An incorrect but plausible alternative
            - Third option: Another incorrect but plausible alternative
            Each choice must have:
            - text: The choice text
            - isCorrect: boolean (true only for the first option)
          feedback: {
            correct: An encouraging, positive reinforcement message (e.g., "Great choice! You showed...")
            incorrect: A supportive guidance message explaining why we should choose differently
          }
          continuation: Text that continues the story showing the positive outcome from making the correct choice
          continuationImagePrompt: A detailed visual description for the continuation scene
        }
      
      IMPORTANT:
      - ALWAYS include exactly three choices
      - ALWAYS make the first choice the correct one (isCorrect: true)
      - ALWAYS make the other two choices incorrect (isCorrect: false)
      - ALWAYS include both correct and incorrect feedback messages
      - Ensure all choices are age-appropriate and relate to the therapy goal
      - Keep language clear and supportive
      
      Example interaction point structure:
      {
        "prompt": "What should Sarah do next?",
        "choices": [
          {"text": "Ask politely if she can join the game", "isCorrect": true},
          {"text": "Watch from far away without saying anything", "isCorrect": false},
          {"text": "Start playing without asking", "isCorrect": false}
        ],
        "feedback": {
          "correct": "Excellent! Asking politely shows good social skills and respect for others.",
          "incorrect": "It's better to ask politely if you can join. This helps make new friends!"
        }
      }`;

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
      
      // Validate the interaction point structure
      if (parsedResponse.interactionPoint) {
        if (!Array.isArray(parsedResponse.interactionPoint.choices) || 
            parsedResponse.interactionPoint.choices.length !== 3 ||
            !parsedResponse.interactionPoint.choices[0]?.isCorrect ||
            parsedResponse.interactionPoint.choices[1]?.isCorrect ||
            parsedResponse.interactionPoint.choices[2]?.isCorrect) {
          throw new Error('Invalid interaction point structure');
        }
      }

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
