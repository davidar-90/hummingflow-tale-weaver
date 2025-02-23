
import { useState } from 'react';
import { StoryData, InteractionPointType } from '@/types/story';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStoryGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [interactionPoint, setInteractionPoint] = useState<InteractionPointType | null>(null);

  const cleanAndParseResponse = (response: any) => {
    try {
      let data = response;
      
      if (typeof response === 'string') {
        data = response.replace(/```json\n?|```\n?/g, '').trim();
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse response JSON:', e);
          throw e;
        }
      }

      if (data.content && typeof data.content === 'string' && data.content.trim().startsWith('{')) {
        try {
          const innerJson = JSON.parse(data.content);
          if (innerJson.title && innerJson.content) {
            data = innerJson;
          }
        } catch (e) {
          console.error('Failed to parse inner content JSON:', e);
        }
      }

      return {
        title: (data.title || '').replace(/^["']|["']$/g, '').trim(),
        content: (data.content || '')
          .replace(/\\n/g, '\n')
          .replace(/\\"/g, '"')
          .replace(/^["']|["']$/g, '')
          .trim(),
        imagePrompt: data.imagePrompt || '',
        interactionPoint: data.interactionPoint ? {
          prompt: data.interactionPoint.prompt || '',
          choices: Array.isArray(data.interactionPoint.choices) 
            ? data.interactionPoint.choices.map((choice: any) => ({
                text: choice.text || '',
                isCorrect: !!choice.isCorrect
              }))
            : [],
          feedback: {
            correct: data.interactionPoint.feedback?.correct || '',
            incorrect: data.interactionPoint.feedback?.incorrect || ''
          },
          continuation: data.interactionPoint.continuation || '',
          continuationImagePrompt: data.interactionPoint.continuationImagePrompt || ''
        } : null
      };
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse story response. Please try again.');
    }
  };

  const generateStory = async (storyData: StoryData) => {
    if (!storyData.therapyGoal || !storyData.ageGroup || !storyData.communicationLevel || !storyData.studentInterests) {
      throw new Error("Please fill in all required fields");
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          therapyGoal: storyData.therapyGoal,
          ageGroup: storyData.ageGroup,
          communicationLevel: storyData.communicationLevel,
          supportCues: storyData.supportCues,
          studentInterests: storyData.studentInterests,
          systemInstructions: `Create an engaging social story with a positive, supportive interaction point.
            The interaction should:
            - Focus on practicing positive behaviors and choices
            - Avoid depicting negative or mean behaviors
            - Present realistic, age-appropriate scenarios for ${storyData.ageGroup}
            - Use vocabulary and concepts appropriate for ${storyData.ageGroup}
            - Encourage empathy and understanding
            - Maintain a supportive and encouraging tone
            - Relate directly to the therapy goal
            - Use language appropriate for the student's communication level`
        }
      });

      if (error) throw error;
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from story generation');
      }

      const parsedData = cleanAndParseResponse(data);
      
      if (parsedData.interactionPoint) {
        setInteractionPoint(parsedData.interactionPoint);
      }

      return parsedData;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateStory,
    isGenerating,
    interactionPoint,
    setInteractionPoint
  };
};
