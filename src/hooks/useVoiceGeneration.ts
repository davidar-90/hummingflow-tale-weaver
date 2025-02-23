
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";

export const useVoiceGeneration = () => {
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
  const [audioContent, setAudioContent] = useState<string | null>(null);

  const generateVoice = async (text: string) => {
    if (!text) {
      throw new Error("Please provide text to generate voice");
    }

    setIsGeneratingVoice(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-voice', {
        body: { text }
      });

      if (error) throw error;
      if (!data?.audioContent) {
        throw new Error('Failed to generate voice audio');
      }

      setAudioContent(data.audioContent);
      return data.audioContent;
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  return {
    generateVoice,
    isGeneratingVoice,
    audioContent,
    setAudioContent
  };
};
