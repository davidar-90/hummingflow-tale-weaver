
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useImageGeneration = () => {
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const generateImage = async (storyContent: string, imagePrompt?: string, continuationImagePrompt?: string) => {
    if (!storyContent) {
      throw new Error("Please generate a story first");
    }
    
    setIsGeneratingImage(true);
    try {
      // Extract character descriptions and setting from the story
      const characters = storyContent.match(/[A-Z][a-z]+(?=\s(?:was|were|and|is|had|looked))/g) || [];
      const uniqueCharacters = [...new Set(characters)];
      const characterContext = uniqueCharacters.length > 0 
        ? `Main characters: ${uniqueCharacters.join(', ')}. `
        : '';

      // Define consistent style and setting
      const baseStyle = "Professional storybook illustration style, modern aesthetic, soft lighting, detailed environment";
      const artDirection = "Use vibrant colors, dynamic composition, and consistent character designs throughout";
      
      // Generate initial story image with enhanced context
      const storyPrompt = `${baseStyle}. ${characterContext}Scene: ${imagePrompt || storyContent}. ${artDirection}`;
      console.log('Using story image prompt:', storyPrompt);
      
      const { data: response, error: storyImageError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: storyPrompt }
      });

      console.log('Edge function response:', response);

      if (storyImageError) {
        console.error('Story image generation error:', storyImageError);
        throw storyImageError;
      }

      if (!response || response.error) {
        console.error('Story image API error:', response?.error || 'No response received');
        throw new Error(response?.error || 'Failed to generate image');
      }

      // Ensure we're accessing the imageUrl property correctly
      const storyImageUrl = response.imageUrl;
      if (!storyImageUrl) {
        console.error('No image URL in response:', response);
        throw new Error('Failed to generate image: No image URL received');
      }

      let continuationImage = null;
      // Generate continuation image if available
      if (continuationImagePrompt) {
        const continuationPrompt = `${baseStyle}. ${characterContext}Scene: ${continuationImagePrompt}. ${artDirection}. Maintain exact same character appearances, clothing, and art style as the previous image for consistency.`;
        console.log('Using continuation image prompt:', continuationPrompt);
        
        const { data: contResponse, error: continuationImageError } = await supabase.functions.invoke('generate-image', {
          body: { prompt: continuationPrompt }
        });

        console.log('Continuation edge function response:', contResponse);

        if (continuationImageError) {
          console.error('Continuation image generation error:', continuationImageError);
          throw continuationImageError;
        }

        if (!contResponse || contResponse.error) {
          console.error('Continuation image API error:', contResponse?.error || 'No response received');
          throw new Error(contResponse?.error || 'Failed to generate continuation image');
        }

        // Ensure we're accessing the imageUrl property correctly for continuation
        const continuationImageUrl = contResponse.imageUrl;
        if (!continuationImageUrl) {
          console.error('No continuation image URL in response:', contResponse);
          throw new Error('Failed to generate continuation image: No image URL received');
        }

        continuationImage = continuationImageUrl;
      }

      return {
        storyImage: storyImageUrl,
        continuationImage
      };
    } catch (error) {
      console.error('Image generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate image. Please try again.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return {
    generateImage,
    isGeneratingImage
  };
};
