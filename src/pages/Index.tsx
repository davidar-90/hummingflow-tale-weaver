
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { StoryForm } from "@/components/story/StoryForm";
import { InteractionPoint } from "@/components/story/InteractionPoint";
import { StoryEditor } from "@/components/story/StoryEditor";
import { StoryData, InteractionPointType } from '@/types/story';

const Index = () => {
  const initialStoryData: StoryData = {
    therapyGoal: '',
    ageGroup: '',
    communicationLevel: '',
    supportCues: '',
    studentInterests: '',
    storyTitle: '',
    storyContent: '',
    storyImage: '',
    continuationImage: ''
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [storyData, setStoryData] = useState<StoryData>(initialStoryData);
  const [interactionPoint, setInteractionPoint] = useState<InteractionPointType | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setStoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearStory = () => {
    setStoryData(initialStoryData);
    setInteractionPoint(null);
    toast.success("Story cleared successfully!");
  };

  const generateImage = async () => {
    if (!storyData.storyContent) {
      toast.error("Please generate a story first");
      return;
    }
    
    setIsGeneratingImage(true);
    try {
      // Extract character descriptions and setting from the story
      const characters = storyData.storyContent.match(/[A-Z][a-z]+(?=\s(?:was|were|and|is|had|looked))/g) || [];
      const uniqueCharacters = [...new Set(characters)];
      const characterContext = uniqueCharacters.length > 0 
        ? `Main characters: ${uniqueCharacters.join(', ')}. `
        : '';

      // Define consistent style and setting
      const baseStyle = "Professional storybook illustration style, modern aesthetic, soft lighting, detailed environment";
      const artDirection = "Use vibrant colors, dynamic composition, and consistent character designs throughout";
      
      // Generate initial story image with enhanced context
      const storyPrompt = `${baseStyle}. ${characterContext}Scene: ${storyData.imagePrompt || storyData.storyContent}. ${artDirection}`;
      console.log('Using story image prompt:', storyPrompt);
      
      const { data: storyImageData, error: storyImageError } = await supabase.functions.invoke('generate-image', {
        body: { prompt: storyPrompt }
      });

      if (storyImageError) throw storyImageError;
      if (storyImageData.error) throw new Error(storyImageData.error);

      console.log('Story image generation response:', storyImageData);
      
      setStoryData(prev => ({
        ...prev,
        storyImage: storyImageData.imageUrl
      }));

      // Generate continuation image if available
      if (storyData.continuationImagePrompt) {
        // Pass the same character and style context for consistency
        const continuationPrompt = `${baseStyle}. ${characterContext}Scene: ${storyData.continuationImagePrompt}. ${artDirection}. Maintain exact same character appearances, clothing, and art style as the previous image for consistency.`;
        console.log('Using continuation image prompt:', continuationPrompt);
        
        const { data: continuationImageData, error: continuationImageError } = await supabase.functions.invoke('generate-image', {
          body: { prompt: continuationPrompt }
        });

        if (continuationImageError) throw continuationImageError;
        if (continuationImageData.error) throw new Error(continuationImageData.error);

        console.log('Continuation image generation response:', continuationImageData);
        
        setStoryData(prev => ({
          ...prev,
          continuationImage: continuationImageData.imageUrl
        }));

        toast.success("Both images generated successfully!");
      } else {
        toast.success("Story image generated successfully!");
      }
    } catch (error) {
      console.error('Error generating images:', error);
      toast.error('Failed to generate images. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateVoice = async () => {
    if (!storyData.storyContent) {
      toast.error("Please generate a story first");
      return;
    }
    
    toast.info("Voice generation coming soon!");
  };

  const generateStory = async () => {
    if (!storyData.therapyGoal || !storyData.ageGroup || !storyData.communicationLevel || !storyData.studentInterests) {
      toast.error("Please fill in all required fields");
      return;
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

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Raw response from generate-story:', data);

      // Add direct check for data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from story generation');
      }

      const parsedData = cleanAndParseResponse(data);
      console.log('Parsed story data:', parsedData);

      setStoryData(prev => ({
        ...prev,
        storyTitle: parsedData.title,
        storyContent: parsedData.content,
        imagePrompt: parsedData.imagePrompt
      }));

      if (parsedData.interactionPoint) {
        setInteractionPoint(parsedData.interactionPoint);
      }

      toast.success("Story generated successfully!");
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error("Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChoiceSelection = async (index: number) => {
    if (!interactionPoint) return;
    
    setInteractionPoint(prev => ({
      ...prev!,
      selectedChoice: index
    }));

    const isCorrect = interactionPoint.choices[index].isCorrect;
    const feedback = isCorrect ? interactionPoint.feedback?.correct : interactionPoint.feedback?.incorrect;
    
    toast(feedback, {
      icon: isCorrect ? "✅" : "❌",
      duration: 5000
    });

    if (interactionPoint.continuation) {
      setStoryData(prev => ({
        ...prev,
        storyContent: prev.storyContent + '\n\n' + interactionPoint.continuation,
        continuationImagePrompt: interactionPoint.continuationImagePrompt
      }));
    }
  };

  const cleanAndParseResponse = (response: any) => {
    try {
      let data = response;
      
      // If response is a string, clean markdown and parse JSON
      if (typeof response === 'string') {
        // Remove markdown code block syntax and any whitespace
        data = response.replace(/```json\n?|```\n?/g, '').trim();
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('Failed to parse response JSON:', e);
          throw e;
        }
      }

      // Check if we need to parse nested JSON content
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

      // Clean and format the data fields
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 hero-gradient animate-fadeIn">
          HummingFlow Studio
        </h1>
        <p className="text-center text-blue-600/80 mb-12 animate-fadeIn">
          Create engaging social stories that make a difference
        </p>
        
        <div className="split-panel">
          <Card className="glass-card p-8 animate-slideIn">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-semibold text-blue-900">Story Setup</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearStory}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Story
                  </Button>
                </div>
                
                <StoryForm
                  storyData={storyData}
                  onInputChange={handleInputChange}
                  onGenerateStory={generateStory}
                  onGenerateImage={generateImage}
                  onGenerateVoice={generateVoice}
                  isGenerating={isGenerating}
                  isGeneratingImage={isGeneratingImage}
                  onClearStory={clearStory}
                />
              </div>

              <InteractionPoint
                interactionPoint={interactionPoint}
                onChoiceSelection={handleChoiceSelection}
              />
            </div>
          </Card>

          <Card className="glass-card p-8 animate-slideIn">
            <h2 className="text-2xl font-semibold text-blue-900 mb-8">Story Editor</h2>
            <StoryEditor
              storyData={storyData}
              interactionPoint={interactionPoint}
              onInputChange={handleInputChange}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
