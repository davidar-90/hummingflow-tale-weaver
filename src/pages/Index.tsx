
import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const Index = () => {
  const [storyData, setStoryData] = useState({
    therapyGoal: '',
    communicationLevel: '',
    supportCues: '',
    studentInterests: '',
    storyTitle: '',
    storyContent: ''
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

              <div className="form-group">
                <Label htmlFor="communicationLevel" className="text-blue-900">Communication Level</Label>
                <Select
                  value={storyData.communicationLevel}
                  onValueChange={(value) => handleInputChange('communicationLevel', value)}
                >
                  <SelectTrigger className="select-input">
                    <SelectValue placeholder="Beginner" />
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
                <Label htmlFor="supportCues" className="text-blue-900">Support Cues (Optional)</Label>
                <Select
                  value={storyData.supportCues}
                  onValueChange={(value) => handleInputChange('supportCues', value)}
                >
                  <SelectTrigger className="select-input">
                    <SelectValue placeholder="None (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="visual">Visual Cues</SelectItem>
                    <SelectItem value="verbal">Verbal Prompts</SelectItem>
                    <SelectItem value="breathing">Deep Breaths</SelectItem>
                    <SelectItem value="first-then">First-Then Structure</SelectItem>
                    <SelectItem value="social-rules">Social Rule Focus</SelectItem>
                    <SelectItem value="emotion-words">Emotion Words</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="form-group">
                <Label htmlFor="studentInterests" className="text-blue-900">Student Interests</Label>
                <Input
                  id="studentInterests"
                  type="text"
                  placeholder="e.g., space, dinosaurs"
                  value={storyData.studentInterests}
                  onChange={(e) => handleInputChange('studentInterests', e.target.value)}
                  className="text-input"
                />
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl shadow-md transition-colors duration-200"
              >
                Generate Story
                <Sparkles className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </Card>

          {/* Story Editor Panel */}
          <Card className="glass-card p-8">
            <h2 className="text-2xl font-semibold text-blue-900 mb-8">Story Editor</h2>
            <div className="space-y-6">
              <div className="form-group">
                <Label htmlFor="storyTitle" className="text-blue-900">Title</Label>
                <Input
                  id="storyTitle"
                  type="text"
                  placeholder="Story title..."
                  value={storyData.storyTitle}
                  onChange={(e) => handleInputChange('storyTitle', e.target.value)}
                  className="text-input"
                />
              </div>
              
              <div className="form-group">
                <Label htmlFor="storyContent" className="text-blue-900">Story Content</Label>
                <Textarea
                  id="storyContent"
                  placeholder="Story content will appear here..."
                  value={storyData.storyContent}
                  onChange={(e) => handleInputChange('storyContent', e.target.value)}
                  className="min-h-[400px] text-input resize-none bg-white/50"
                />
              </div>

              <div className="form-group">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 flex items-center justify-center min-h-[200px]">
                  <p className="text-gray-400">Image will appear here</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
