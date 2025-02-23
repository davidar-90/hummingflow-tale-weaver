
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoryData, InteractionPointType } from '@/types/story';
import { StoryAudioPlayer } from "@/components/story/StoryAudioPlayer";

interface StoryEditorProps {
  storyData: StoryData;
  interactionPoint: InteractionPointType | null;
  onInputChange: (field: string, value: string) => void;
  audioContent?: string | null;
  isGeneratingVoice?: boolean;
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
      <div className="flex justify-between items-center mb-4">
        <Label htmlFor="storyTitle" className="text-lg font-medium text-gray-900">Title</Label>
        <StoryAudioPlayer 
          audioContent={audioContent}
          isGenerating={isGeneratingVoice}
        />
      </div>

      <div className="form-group">
        <Input
          id="storyTitle"
          type="text"
          placeholder="Story title..."
          value={storyData.storyTitle}
          onChange={(e) => onInputChange('storyTitle', e.target.value)}
          className={`text-input ${storyData.storyTitle ? 'text-gray-900' : 'text-gray-500'}`}
        />
      </div>
      
      <div className="space-y-4">
        <div className="form-group">
          <Label htmlFor="storyContent" className="text-lg font-medium text-gray-900">Story Content</Label>
          <Textarea
            id="storyContent"
            placeholder="Story content will appear here..."
            value={storyData.storyContent}
            onChange={(e) => onInputChange('storyContent', e.target.value)}
            className={`min-h-[200px] text-input resize-none bg-white shadow-sm ${storyData.storyContent ? 'text-gray-900' : 'text-gray-500'} whitespace-pre-wrap`}
          />
        </div>

        <div className="form-group">
          <Label className="text-lg font-medium text-gray-900">Story Image</Label>
          <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-white/50 flex flex-col items-center justify-center aspect-video w-full transition-colors hover:border-apple-blue/30">
            {storyData.storyImage ? (
              <img
                src={storyData.storyImage}
                alt="Story illustration"
                className="w-full h-full object-cover rounded-md"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400 text-center">Initial story image will appear here (16:9)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {interactionPoint?.selectedChoice !== undefined && (
        <div className="space-y-4">
          <div className="form-group">
            <Label htmlFor="continuation" className="text-lg font-medium text-gray-900">Story Continuation</Label>
            <Textarea
              id="continuation"
              value={interactionPoint.continuation}
              readOnly
              className="min-h-[200px] text-input resize-none bg-white shadow-sm text-gray-900 whitespace-pre-wrap"
            />
          </div>

          <div className="form-group">
            <Label className="text-lg font-medium text-gray-900">Continuation Image</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 bg-white/50 flex flex-col items-center justify-center aspect-video w-full transition-colors hover:border-apple-blue/30">
              {storyData.continuationImage ? (
                <img
                  src={storyData.continuationImage}
                  alt="Story continuation illustration"
                  className="w-full h-full object-cover rounded-md"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-400 text-center">Continuation image will appear here (16:9)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
