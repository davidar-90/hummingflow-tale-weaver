
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
      
      const { data: storyImageData, error: storyImageError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: storyPrompt }
      });

      if (storyImageError) throw storyImageError;
      if (storyImageData.error) throw new Error(storyImageData.error);

      let continuationImage = null;
      // Generate continuation image if available
      if (continuationImagePrompt) {
        const continuationPrompt = `${baseStyle}. ${characterContext}Scene: ${continuationImagePrompt}. ${artDirection}. Maintain exact same character appearances, clothing, and art style as the previous image for consistency.`;
        console.log('Using continuation image prompt:', continuationPrompt);
        
        const { data: continuationImageData, error: continuationImageError } = await supabase.functions.invoke('generate-image', {
          body: { prompt: continuationPrompt }
        });

        if (continuationImageError) throw continuationImageError;
        if (continuationImageData.error) throw new Error(continuationImageData.error);

        continuationImage = continuationImageData.imageUrl;
      }

      return {
        storyImage: storyImageData.imageUrl,
        continuationImage
      };
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return {
    generateImage,
    isGeneratingImage
  };
};
