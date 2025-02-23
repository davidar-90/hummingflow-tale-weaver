
export interface StoryData {
  therapyGoal: string;
  ageGroup: string;
  communicationLevel: string;
  supportCues: string;
  studentInterests: string;
  storyTitle: string;
  storyContent: string;
  storyImage: string;
  continuationImage: string;
  imagePrompt?: string;
  continuationImagePrompt?: string;  // Added this field
}

export interface Choice {
  text: string;
  isCorrect: boolean;
}

export interface InteractionPointType {
  prompt: string;
  choices: Choice[];
  selectedChoice?: number;
  feedback?: {
    correct: string;
    incorrect: string;
  };
  continuation: string;
  continuationImagePrompt?: string;
}
