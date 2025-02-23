
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StoryData, InteractionPointType } from '@/types/story';

interface StoryEditorProps {
  storyData: StoryData;
  interactionPoint: InteractionPointType | null;
  onInputChange: (field: string, value: string) => void;
}

export const StoryEditor = ({ storyData, interactionPoint, onInputChange }: StoryEditorProps) => {
  return (
    <div className="space-y-6">
      <div className="form-group">
        <Label htmlFor="storyTitle" className="text-blue-900">Title</Label>
        <Input
          id="storyTitle"
          type="text"
          placeholder="Story title..."
          value={storyData.storyTitle}
          onChange={(e) => onInputChange('storyTitle', e.target.value)}
          className={`text-input ${storyData.storyTitle ? 'text-black' : 'text-gray-500'}`}
        />
      </div>
      
      <div className="space-y-4">
        <div className="form-group">
          <Label htmlFor="storyContent" className="text-blue-900">Story Content</Label>
          <Textarea
            id="storyContent"
            placeholder="Story content will appear here..."
            value={storyData.storyContent}
            onChange={(e) => onInputChange('storyContent', e.target.value)}
            className={`min-h-[200px] text-input resize-none bg-white/50 ${storyData.storyContent ? 'text-black' : 'text-gray-500'} whitespace-pre-wrap`}
          />
        </div>

        <div className="form-group">
          <Label className="text-blue-900">Story Image</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center aspect-video w-full">
            {storyData.storyImage ? (
              <img
                src={storyData.storyImage}
                alt="Story illustration"
                className="w-full h-full object-cover rounded"
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
            <Label htmlFor="continuation" className="text-blue-900">Story Continuation</Label>
            <Textarea
              id="continuation"
              value={interactionPoint.continuation}
              readOnly
              className="min-h-[200px] text-input resize-none bg-white/50 text-black whitespace-pre-wrap"
            />
          </div>

          <div className="form-group">
            <Label className="text-blue-900">Continuation Image</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 flex flex-col items-center justify-center aspect-video w-full">
              {storyData.continuationImage ? (
                <img
                  src={storyData.continuationImage}
                  alt="Story continuation illustration"
                  className="w-full h-full object-cover rounded"
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
