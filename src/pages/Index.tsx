
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
                <Label htmlFor="title" className="text-blue-900">Story Title</Label>
                <Input
                  id="title"
                  value={storyData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a title for the story"
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="patientName" className="text-blue-900">Patient's Name</Label>
                <Input
                  id="patientName"
                  value={storyData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  placeholder="Enter patient's name"
                  className="text-input"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="age" className="text-blue-900">Age</Label>
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
                <Label htmlFor="context" className="text-blue-900">Situation/Context</Label>
                <Textarea
                  id="context"
                  value={storyData.context}
                  onChange={(e) => handleInputChange('context', e.target.value)}
                  placeholder="Describe the situation or context for the social story"
                  className="text-input min-h-[100px]"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="goals" className="text-blue-900">Goals/Objectives</Label>
                <Textarea
                  id="goals"
                  value={storyData.goals}
                  onChange={(e) => handleInputChange('goals', e.target.value)}
                  placeholder="What are the learning objectives for this story?"
                  className="text-input min-h-[100px]"
                />
              </div>

              <div className="form-group">
                <Label htmlFor="tone" className="text-blue-900">Story Tone</Label>
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
