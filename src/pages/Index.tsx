
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Index = () => {
  const [storyData, setStoryData] = useState({
    therapyGoal: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setStoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 hero-gradient">
          HummingFlow Studio
        </h1>
        <p className="text-center text-blue-600/80 mb-12">
          Create engaging social stories that make a difference
        </p>
        
        <div className="split-panel">
          {/* Story Setup Panel */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-semibold text-blue-900 mb-8">Story Setup</h2>
            
            <div className="space-y-6">
              <div className="form-group">
                <Label htmlFor="therapyGoal" className="text-blue-900">Therapy Goal</Label>
                <Select
                  value={storyData.therapyGoal}
                  onValueChange={(value) => handleInputChange('therapyGoal', value)}
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
            </div>
          </Card>

          {/* Story Editor Panel */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-semibold text-blue-900 mb-8">Story Editor</h2>
            <div className="h-full flex items-center justify-center text-blue-400">
              <p className="text-center">
                Story editor coming soon...<br/>
                <span className="text-sm opacity-75">Your stories will come to life here</span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
