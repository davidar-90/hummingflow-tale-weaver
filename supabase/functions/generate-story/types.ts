
export interface CreateStoryRequest {
  therapyGoal: string;
  ageGroup: string;
  communicationLevel: string;
  supportCues?: string;
  studentInterests: string;
  systemInstructions: string;
}

export interface StoryResponse {
  title: string;
  content: string;
  imagePrompt: string;
  interactionPoint?: {
    prompt: string;
    choices: Array<{
      text: string;
      isCorrect: boolean;
    }>;
    feedback?: {
      correct: string;
      incorrect: string;
    };
    continuation: string;
    continuationImagePrompt?: string;
  };
}
