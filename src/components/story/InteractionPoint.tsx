
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { InteractionPointType } from '@/types/story';

interface InteractionPointProps {
  interactionPoint: InteractionPointType | null;
  onChoiceSelection: (index: number) => void;
}

export const InteractionPoint = ({ interactionPoint, onChoiceSelection }: InteractionPointProps) => {
  return (
    <div className={`mt-8 p-6 rounded-xl border ${
      interactionPoint 
        ? 'bg-white shadow-sm border-blue-100' 
        : 'bg-gray-50 border-gray-200'
    } transition-colors duration-300`}>
      <div className="flex items-center gap-3 mb-4">
        <h3 className={`text-lg font-medium ${
          interactionPoint ? 'text-blue-900' : 'text-gray-500'
        }`}>
          Interaction Point
        </h3>
      </div>
      
      {interactionPoint && Array.isArray(interactionPoint.choices) ? (
        <div className="space-y-4">
          <p className="text-gray-800 font-medium p-4 bg-gray-50 rounded-lg border border-gray-100">
            {interactionPoint.prompt}
          </p>
          
          <RadioGroup
            className="space-y-3"
            value={interactionPoint.selectedChoice?.toString()}
            onValueChange={(value) => onChoiceSelection(parseInt(value))}
          >
            {interactionPoint.choices.map((choice, index) => (
              <div 
                key={index} 
                className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-200 hover:bg-blue-50/30 transition-all"
              >
                <RadioGroupItem value={index.toString()} id={`choice-${index}`} />
                <Label 
                  htmlFor={`choice-${index}`} 
                  className="text-gray-700 flex-1 cursor-pointer"
                >
                  {choice.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ) : (
        <div className="text-center py-6">
          <p className="text-gray-500">
            Generate a story to see the interaction point
          </p>
        </div>
      )}
    </div>
  );
};
