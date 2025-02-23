
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { therapyGoal, communicationLevel, studentInterests } = await req.json()
    
    if (!geminiKey) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    // User-specific prompt that builds on the system instructions
    const prompt = `Based on these specific parameters:

Therapy Goal: ${therapyGoal}
Communication Level: ${communicationLevel}
Student Interests: ${studentInterests}

Create an engaging social story that follows our guidelines, incorporating the student's interests and maintaining appropriate language for their communication level.

Format the response as a JSON object with:
{
  "title": "An engaging, clear title",
  "content": "The full story text"
}`

    // Call Gemini API with the correct model
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-1.0-pro:generateContent', {
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
    console.log('Gemini API Response:', data)

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('Unexpected Gemini API response structure:', data)
      throw new Error('Invalid response structure from Gemini API')
    }

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
