
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const geminiKey = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// System instructions that will be consistent for all requests
const systemInstructions = `You are an expert in creating social stories for children with different communication needs. 
Your stories should:
- Have a clear beginning, middle, and end structure
- Be positive and encouraging throughout
- Use simple, clear language appropriate for the child's communication level
- Include repetition of key concepts when appropriate
- Be concise but impactful
- Focus on one main concept or skill at a time
- Use present tense and first person when possible
- Avoid abstract concepts unless specifically appropriate for the communication level
- Include concrete examples and clear action steps
- Maintain an engaging narrative that connects with the child's interests`

// Helper function to extract and parse JSON from Gemini response
function parseGeminiResponse(response: string): { title: string; content: string } | null {
  try {
    // Step 1: Remove triple backticks if present
    let cleanedResponse = response.replace(/^```json\s*|\s*```$/g, '').trim();

    // Step 2 & 3: Find and extract JSON object
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      console.error('No valid JSON object found in response');
      return null;
    }

    const jsonStr = cleanedResponse.substring(firstBrace, lastBrace + 1);

    // Step 4: Parse the JSON
    const parsed = JSON.parse(jsonStr);

    // Validate the structure
    if (!parsed.title || !parsed.content) {
      console.error('Parsed JSON missing required fields');
      return null;
    }

    return {
      title: parsed.title.trim(),
      content: parsed.content.trim()
    };
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { therapyGoal, communicationLevel, studentInterests } = await req.json()
    
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    const prompt = `Based on these specific parameters:

Therapy Goal: ${therapyGoal}
Communication Level: ${communicationLevel}
Student Interests: ${studentInterests}

Create an engaging social story that follows our guidelines, incorporating the student's interests and maintaining appropriate language for their communication level.

Format your response as a JSON object like this, without any markdown formatting or additional text:
{
  "title": "An engaging, clear title",
  "content": "The full story content with appropriate line breaks"
}`

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemInstructions}\n\n${prompt}`
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
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_LOW_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API returned ${response.status}: ${errorData}`)
    }

    const data = await response.json()
    console.log('Raw Gemini API Response:', data)

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini API response structure:', data)
      throw new Error('Invalid response structure from Gemini API')
    }

    // Extract the text from the response
    const generatedText = data.candidates[0].content.parts[0].text
    console.log('Generated text before parsing:', generatedText)

    // Use the new parsing function
    const parsedResponse = parseGeminiResponse(generatedText)
    
    if (!parsedResponse) {
      throw new Error('Failed to parse Gemini response into valid JSON')
    }

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generate-story function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
