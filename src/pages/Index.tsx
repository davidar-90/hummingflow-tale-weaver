
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const Index = () => {
  const [storyData, setStoryData] = useState({
    title: '',
    patientName: '',
    age: '',
    context: '',
    goals: '',
    tone: 'friendly'
  });

  const handleInputChange = (field: string, value: string) => {
    setStoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8 text-center animate-fadeIn">
          HummingBird Studio
        </h1>
        
        <div className="split-panel">
          {/* Story Setup Panel */}
          <Card className="p-6 bg-white shadow-sm border-gray-100">
            <h2 className="text-xl font-medium text-gray-800 mb-6">Story Setup</h2>
            
            <div className="space-y-6">
              <div className="form-group">
                <Label htmlFor="title">Story Title</Label>
                <Input
                  id="title"
                  value={storyData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a title for the story"
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="patientName">Patient's Name</Label>
                <Input
                  id="patientName"
                  value={storyData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  placeholder="Enter patient's name"
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="age">Age</Label>
                <Input
                  id="age"
                  type="number"
                  value={storyData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  placeholder="Enter patient's age"
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="context">Situation/Context</Label>
                <Textarea
                  id="context"
                  value={storyData.context}
                  onChange={(e) => handleInputChange('context', e.target.value)}
                  placeholder="Describe the situation or context for the social story"
                  className="text-input min-h-[100px]"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="goals">Goals/Objectives</Label>
                <Textarea
                  id="goals"
                  value={storyData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  placeholder="What are the learning objectives for this story?"
                  className="text-input min-h-[100px]"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="tone">Story Tone</Label>
                <Select
                  value={storyData.tone}
                  onValueChange={(value) => handleInputChange('tone', value)}
                >
                  <SelectTrigger className="select-input">
                    <SelectValue placeholder="Select a tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="supportive">Supportive</SelectItem>
                    <SelectItem value="direct">Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Story Editor Panel (Placeholder) */}
          <Card className="p-6 bg-white shadow-sm border-gray-100">
            <h2 className="text-xl font-medium text-gray-800 mb-6">Story Editor</h2>
            <div className="h-full flex items-center justify-center text-gray-500">
              Story editor coming soon...
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
