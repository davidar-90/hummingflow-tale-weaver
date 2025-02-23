
import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles, ImageIcon, MicIcon } from "lucide-react";
import { toast } from "sonner";
import { StoryData } from '@/types/story';

interface StoryFormProps {
  storyData: StoryData;
  onInputChange: (field: string, value: string) => void;
  onGenerateStory: () => Promise<void>;
  onGenerateImage: () => Promise<void>;
  onGenerateVoice: () => Promise<void>;
  isGenerating: boolean;
  isGeneratingImage: boolean;
  isGeneratingVoice: boolean;
  onClearStory: () => void;
}

export const StoryForm = ({
  storyData,
  onInputChange,
  onGenerateStory,
  onGenerateImage,
  onGenerateVoice,
  isGenerating,
  isGeneratingImage,
  isGeneratingVoice,
  onClearStory
}: StoryFormProps) => {
  const hasStory = Boolean(storyData.storyContent);

  return (
    <div className="space-y-8">
      <div className="form-group">
        <Label htmlFor="therapyGoal" className="text-blue-900 mb-3 block">Therapy Goal *</Label>
        <Select
          value={storyData.therapyGoal}
          onValueChange={(value) => onInputChange('therapyGoal', value)}
        >
          <SelectTrigger className="select-input">
            <SelectValue placeholder="Select a goal..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="initiating-conversations">Initiating Conversations</SelectItem>
            <SelectItem value="turn-taking">Turn-Taking in Conversation</SelectItem>
            <SelectItem value="topic-maintenance">Topic Maintenance</SelectItem>
            <SelectItem value="facial-expressions">Recognizing Facial Expressions</SelectItem>
            <SelectItem value="requesting">Requesting Items/Activities</SelectItem>
            <SelectItem value="following-directions">Following Directions</SelectItem>
            <SelectItem value="resolving-conflicts">Resolving Conflicts</SelectItem>
            <SelectItem value="other">Other (Specify)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor="ageGroup" className="text-blue-900 mb-3 block">Age Group / Grade Level *</Label>
        <Select
          value={storyData.ageGroup}
          onValueChange={(value) => onInputChange('ageGroup', value)}
        >
          <SelectTrigger className="select-input">
            <SelectValue placeholder="Select age group..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="preschool">Preschool (3-5 years)</SelectItem>
            <SelectItem value="kindergarten">Kindergarten (5-6 years)</SelectItem>
            <SelectItem value="early-elementary">Early Elementary (Grades 1-2)</SelectItem>
            <SelectItem value="upper-elementary">Upper Elementary (Grades 3-5)</SelectItem>
            <SelectItem value="middle-school">Middle School (Grades 6-8)</SelectItem>
            <SelectItem value="high-school">High School (Grades 9-12)</SelectItem>
            <SelectItem value="young-adult">Young Adult (18-21 years)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor="communicationLevel" className="text-blue-900 mb-3 block">Communication Level *</Label>
        <Select
          value={storyData.communicationLevel}
          onValueChange={(value) => onInputChange('communicationLevel', value)}
        >
          <SelectTrigger className="select-input">
            <SelectValue placeholder="Select level..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pre-verbal">Pre-verbal/Non-verbal</SelectItem>
            <SelectItem value="emerging-language">Emerging Language (Single Words)</SelectItem>
            <SelectItem value="early-language">Early Language (Short Phrases)</SelectItem>
            <SelectItem value="basic-sentences">Basic Sentences</SelectItem>
            <SelectItem value="developing-sentences">Developing Sentences</SelectItem>
            <SelectItem value="complex-sentences">Complex Sentences</SelectItem>
            <SelectItem value="conversational">Conversational Language</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="form-group">
        <Label htmlFor="studentInterests" className="text-blue-900 mb-3 block">Student Interests *</Label>
        <Input
          id="studentInterests"
          type="text"
          placeholder="e.g., space, dinosaurs"
          value={storyData.studentInterests}
          onChange={(e) => onInputChange('studentInterests', e.target.value)}
          className={`text-input ${storyData.studentInterests ? 'text-black' : 'text-gray-500'}`}
        />
      </div>

      <div className="form-group pt-4">
        <div className="flex flex-wrap gap-4">
          <Button 
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl shadow-md transition-colors duration-200"
            onClick={onGenerateStory}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate Story'}
            <Sparkles className="ml-2 h-5 w-5" />
          </Button>

          <Button 
            className={`flex-1 py-6 rounded-xl shadow-md transition-colors duration-200 ${
              hasStory 
                ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onGenerateImage}
            disabled={!hasStory || isGeneratingImage}
          >
            {isGeneratingImage ? 'Generating...' : 'Generate Image'}
            <ImageIcon className="ml-2 h-5 w-5" />
          </Button>

          <Button 
            className={`flex-1 py-6 rounded-xl shadow-md transition-colors duration-200 ${
              hasStory 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            onClick={onGenerateVoice}
            disabled={!hasStory || isGeneratingVoice}
          >
            {isGeneratingVoice ? 'Generating...' : 'Generate Voice'}
            <MicIcon className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
