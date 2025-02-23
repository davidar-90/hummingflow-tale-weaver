
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"

const geminiKey = Deno.env.get('GEMINI_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { therapyGoal, communicationLevel, supportCues, studentInterests } = await req.json()

    // Construct a detailed prompt for the Gemini model
    const prompt = `As an expert in creating social stories for children, create an engaging and educational story based on these parameters:

Therapy Goal: ${therapyGoal}
Communication Level: ${communicationLevel}
Support Cues: ${supportCues}
Student Interests: ${studentInterests}

Create a story that:
1. Addresses the therapy goal in an engaging way
2. Uses language appropriate for the specified communication level
3. Incorporates the student's interests to maintain engagement
4. Includes the specified support cues naturally in the narrative
5. Has a clear beginning, middle, and end
6. Is positive and encouraging

Please format the response as a JSON object with two fields:
- title: A brief, engaging title for the story
- content: The full story text

Keep the story concise but impactful, using simple language that matches the communication level.`

    // Call Gemini API
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey,
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

    const data = await response.json()
    console.log('Gemini API Response:', data)

    // Extract the text from the response
    const generatedText = data.candidates[0].content.parts[0].text

    // Parse the response to extract title and content
    try {
      const parsedResponse = JSON.parse(generatedText)
      return new Response(JSON.stringify(parsedResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } catch (error) {
      console.error('Error parsing Gemini response:', error)
      // Fallback parsing logic if JSON parsing fails
      const lines = generatedText.split('\n')
      let title = lines[0]
      if (title.toLowerCase().startsWith('title:')) {
        title = title.slice(6).trim()
      }
      const content = lines.slice(1).join('\n').trim()
      
      return new Response(JSON.stringify({ title, content }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
