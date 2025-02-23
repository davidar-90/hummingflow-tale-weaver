
import React from 'react';
import { Card } from "@/components/ui/card";
import { StoryData, InteractionPointType } from '@/types/story';
import { StoryAudioPlayer } from './StoryAudioPlayer';

interface StoryEditorProps {
  storyData: StoryData;
  interactionPoint: InteractionPointType;
  onInputChange: (field: string, value: string) => void;
  audioContent: string | null;
  isGeneratingVoice: boolean;
}

export const StoryEditor = ({
  storyData,
  interactionPoint,
  onInputChange,
  audioContent,
  isGeneratingVoice
}: StoryEditorProps) => {
  return (
    <div className="space-y-6">
      <h2 className="section-title">Story Content</h2>
      
      {storyData.storyImage && (
        <div className="story-image-container mb-6">
          <img
            src={storyData.storyImage}
            alt="Story illustration"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {storyData.storyTitle && (
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {storyData.storyTitle}
        </h3>
      )}

      <div className="prose max-w-none">
        {storyData.storyContent && (
          <p className="text-gray-700 whitespace-pre-wrap">
            {storyData.storyContent}
          </p>
        )}
      </div>

      {audioContent && (
        <div className="mt-6">
          <StoryAudioPlayer
            audioContent={audioContent}
            isGenerating={isGeneratingVoice}
          />
        </div>
      )}
    </div>
  );
};
