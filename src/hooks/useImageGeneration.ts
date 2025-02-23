
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

      // Define consistent style for all images
      const baseStyle = "Generate an image with a dynamic, stylized animation aesthetic, reminiscent of a modern comic book or graphic novel. Employ vibrant, saturated colors with layered, textured overlays and halftone patterns. Use strong, exaggerated motion blur and speed lines to convey kinetic energy. Incorporate bold ink lines and fragmented imagery, with a focus on dynamic perspective. The overall feel should be energetic and visually diverse, similar to a pop art inspired animation.";
      
      // Generate initial story image with enhanced context
      const storyPrompt = `${baseStyle} Scene: ${imagePrompt || storyContent}. ${characterContext}`;
      console.log('Using story image prompt:', storyPrompt);
      
      const { data: storyImageData, error: storyImageError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: storyPrompt }
      });

      if (storyImageError) throw storyImageError;
      if (storyImageData.error) throw new Error(storyImageData.error);

      let continuationImage = null;
      // Generate continuation image if available
      if (continuationImagePrompt) {
        const continuationPrompt = `${baseStyle} Scene: ${continuationImagePrompt}. ${characterContext} Maintain exact same character appearances, clothing, and art style as the previous image for consistency.`;
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
