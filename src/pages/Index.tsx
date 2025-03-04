
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Feather } from "lucide-react";
import { toast } from "sonner";
import { StoryForm } from "@/components/story/StoryForm";
import { InteractionPoint } from "@/components/story/InteractionPoint";
import { StoryEditor } from "@/components/story/StoryEditor";
import { StoryData, InteractionPointType } from '@/types/story';
import { useStoryGeneration } from "@/hooks/useStoryGeneration";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useVoiceGeneration } from "@/hooks/useVoiceGeneration";

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

  const [storyData, setStoryData] = useState<StoryData>(initialStoryData);
  const { generateStory, isGenerating, interactionPoint, setInteractionPoint } = useStoryGeneration();
  const { generateImage, isGeneratingImage } = useImageGeneration();
  const { generateVoice, isGeneratingVoice, audioContent } = useVoiceGeneration();

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

  const handleGenerateStory = async () => {
    try {
      const parsedData = await generateStory(storyData);
      
      setStoryData(prev => ({
        ...prev,
        storyTitle: parsedData.title,
        storyContent: parsedData.content,
        imagePrompt: parsedData.imagePrompt
      }));

      toast.success("Story generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate story. Please try again.");
    }
  };

  const handleGenerateImage = async () => {
    try {
      const images = await generateImage(storyData.storyContent, storyData.imagePrompt, storyData.continuationImagePrompt);
      
      setStoryData(prev => ({
        ...prev,
        storyImage: images.storyImage,
        continuationImage: images.continuationImage || prev.continuationImage
      }));

      toast.success(images.continuationImage ? "Both images generated successfully!" : "Story image generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate images. Please try again.");
    }
  };

  const handleGenerateVoice = async () => {
    if (!storyData.storyContent) {
      toast.error("Please generate a story first");
      return;
    }
    
    try {
      // Combine title and story content, with continuation if it exists
      const fullText = `${storyData.storyTitle}.\n\n${storyData.storyContent}${
        interactionPoint?.selectedChoice !== undefined && interactionPoint?.continuation 
          ? `\n\n${interactionPoint.continuation}`
          : ''
      }`;

      await generateVoice(fullText);
      toast.success("Voice generated successfully!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to generate voice. Please try again.");
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

    // Don't modify the story content, just update the continuation image prompt
    if (interactionPoint.continuation) {
      setStoryData(prev => ({
        ...prev,
        continuationImagePrompt: interactionPoint.continuationImagePrompt
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 flex items-center justify-center gap-3 text-blue-900">
          <Feather className="w-10 h-10 text-blue-600" />
          HummingFlow Studio
        </h1>
        <p className="text-center text-blue-600/80 mb-12 animate-fadeIn">
          Create engaging social stories that make a difference
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 px-4 lg:px-6">
          <Card className="bg-white/90 backdrop-blur-sm border border-blue-100/50 shadow-lg rounded-2xl p-8">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-semibold text-blue-900">Story Setup</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearStory}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Story
                  </Button>
                </div>
                
                <StoryForm
                  storyData={storyData}
                  onInputChange={handleInputChange}
                  onGenerateStory={handleGenerateStory}
                  onGenerateImage={handleGenerateImage}
                  onGenerateVoice={handleGenerateVoice}
                  isGenerating={isGenerating}
                  isGeneratingImage={isGeneratingImage}
                  isGeneratingVoice={isGeneratingVoice}
                  onClearStory={clearStory}
                />
              </div>

              <InteractionPoint
                interactionPoint={interactionPoint}
                onChoiceSelection={handleChoiceSelection}
              />
            </div>
          </Card>

          <Card className="bg-white/90 backdrop-blur-sm border border-blue-100/50 shadow-lg rounded-2xl p-8">
            <StoryEditor
              storyData={storyData}
              interactionPoint={interactionPoint}
              onInputChange={handleInputChange}
              audioContent={audioContent}
              isGeneratingVoice={isGeneratingVoice}
            />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
