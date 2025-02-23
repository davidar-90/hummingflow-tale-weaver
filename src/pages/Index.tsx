import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Sparkles, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const initialStoryData = {
    therapyGoal: '',
    ageGroup: '',
    communicationLevel: '',
    supportCues: '',
    studentInterests: '',
    storyTitle: '',
    storyContent: '',
    storyImage: '',
    continuationImage: ''
  };

  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [storyData, setStoryData] = useState(initialStoryData);
  const [interactionPoint, setInteractionPoint] = useState<{
    prompt: string;
    choices: { text: string; isCorrect: boolean }[];
    selectedChoice?: number;
    feedback?: { correct: string; incorrect: string };
    continuation: string;
  } | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setStoryData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearStory = () => {
    setStoryData(initialStoryData);
    setInteractionPoint(null);
    toast.success("Story cleared successfully!");
  };

  const generateImage = async (prompt: string, isInitialStory: boolean = true) => {
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: { prompt }
      });

      if (error) throw error;

      const imageUrl = data.candidates[0].content.parts[0].text;
      
      setStoryData(prev => ({
        ...prev,
        [isInitialStory ? 'storyImage' : 'continuationImage']: imageUrl
      }));

      toast.success(`Image generated successfully for ${isInitialStory ? 'story' : 'continuation'}!`);
    } catch (error) {
      console.error('Error generating image:', error);
      toast.error('Failed to generate image. Please try again.');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateStory = async () => {
    if (!storyData.therapyGoal || !storyData.ageGroup || !storyData.communicationLevel || !storyData.studentInterests) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          therapyGoal: storyData.therapyGoal,
          ageGroup: storyData.ageGroup,
          communicationLevel: storyData.communicationLevel,
          supportCues: storyData.supportCues,
          studentInterests: storyData.studentInterests,
          systemInstructions: `Create an engaging social story with a positive, supportive interaction point.
            The interaction should:
            - Focus on practicing positive behaviors and choices
            - Avoid depicting negative or mean behaviors
            - Present realistic, age-appropriate scenarios for ${storyData.ageGroup}
            - Use vocabulary and concepts appropriate for ${storyData.ageGroup}
            - Encourage empathy and understanding
            - Maintain a supportive and encouraging tone
            - Relate directly to the therapy goal
            - Use language appropriate for the student's communication level`
        }
      });

      if (error) throw error;

      const { title, content, imagePrompt, interactionPoint } = cleanAndParseResponse(data);

      setStoryData(prev => ({
        ...prev,
        storyTitle: title,
        storyContent: content
      }));

      setInteractionPoint(interactionPoint);

      await generateImage(imagePrompt);

      toast.success("Story generated successfully!");
    } catch (error) {
      console.error('Error generating story:', error);
      toast.error("Failed to generate story. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleChoiceSelection = async (index: number) => {
    if (!interactionPoint) return;
    
    setInteractionPoint(prev => ({
      ...prev!,
      selectedChoice: index
    }));

    const isCorrect = interactionPoint.choices[index].isCorrect;
    const feedback = isCorrect ? interactionPoint.feedback?.correct : interactionPoint.feedback?.incorrect;
    
    toast(feedback, {
      icon: isCorrect ? <CheckCircle2 className="text-green-500" /> : <XCircle className="text-red-500" />,
      duration: 5000
    });

    if (interactionPoint.continuation && interactionPoint.continuationImagePrompt) {
      await generateImage(interactionPoint.continuationImagePrompt, false);
    }
  };

  const cleanAndParseResponse = (response: any) => {
    try {
      let data = response;
      
      if (typeof response === 'string') {
        data = response.replace(/```json\n|\n```/g, '').trim();
        
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.error('First JSON parse failed:', e);
        }
      }

      if (data.content && typeof data.content === 'string') {
        try {
          if (data.content.trim().startsWith('{')) {
            const innerJson = JSON.parse(data.content);
            if (innerJson.title && innerJson.content) {
              data = innerJson;
            }
          }
        } catch (e) {
          console.error('Inner JSON parse failed:', e);
        }
      }

      const title = (data.title || '').replace(/^["']|["']$/g, '').trim();
      const content = (data.content || '')
        .replace(/\\n/g, '\n')
        .replace(/\\"/g, '"')
        .replace(/^["']|["']$/g, '')
        .trim();

      console.log('Cleaned data:', { 
        title, 
        content, 
        imagePrompt: data.imagePrompt,
        interactionPoint: {
          ...data.interactionPoint,
          continuationImagePrompt: data.interactionPoint?.continuationImagePrompt
        }
      });

      return { 
        title, 
        content,
        imagePrompt: data.imagePrompt,
        interactionPoint: {
          ...data.interactionPoint,
          continuationImagePrompt: data.interactionPoint?.continuationImagePrompt
        }
      };
    } catch (error) {
      console.error('Error parsing response:', error);
      return {
        title: 'Error parsing title',
        content: 'There was an error processing the story. Please try again.',
        imagePrompt: '',
        interactionPoint: null
      };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      <div className="container mx-auto py-12">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-2 hero-gradient animate-fadeIn">
          HummingFlow Studio
        </h1>
        <p className="text-center text-blue-600/80 mb-12 animate-fadeIn">
          Create engaging social stories that make a difference
        </p>
        
        <div className="split-panel">
          <Card className="glass-card p-8 animate-slideIn">
            <div className="space-y-8">
              <div>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-semibold text-blue-900">Story Setup</h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearStory}
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Clear Story
                  </Button>
                </div>
                
                <div className="space-y-6">
                  <div className="form-group">
                    <Label htmlFor="therapyGoal" className="text-blue-900">Therapy Goal *</Label>
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
                    <Label htmlFor="ageGroup" className="text-blue-900">Age Group / Grade Level *</Label>
                    <Select
                      value={storyData.ageGroup}
                      onValueChange={(value) => handleInputChange('ageGroup', value)}
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
                    <Label htmlFor="communicationLevel" className="text-blue-900">Communication Level *</Label>
                    <Select
                      value={storyData.communicationLevel}
                      onValueChange={(value) => handleInputChange('communicationLevel', value)}
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
                    <Label htmlFor="studentInterests" className="text-blue-900">Student Interests *</Label>
                    <Input
                      id="studentInterests"
                      type="text"
                      placeholder="e.g., space, dinosaurs"
                      value={storyData.studentInterests}
                      onChange={(e) => handleInputChange('studentInterests', e.target.value)}
                      className={`text-input ${storyData.studentInterests ? 'text-black' : 'text-gray-500'}`}
                    />
                  </div>

                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-xl shadow-md transition-colors duration-200"
                    onClick={generateStory}
                    disabled={isGenerating}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Story'}
                    <Sparkles className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>

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
                
                {interactionPoint ? (
                  <div className="space-y-4">
                    <p className="text-gray-800 font-medium p-4 bg-gray-50 rounded-lg border border-gray-100">
                      {interactionPoint.prompt}
                    </p>
                    
                    <RadioGroup
                      className="space-y-3"
                      value={interactionPoint.selectedChoice?.toString()}
                      onValueChange={(value) => handleChoiceSelection(parseInt(value))}
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
            </div>
          </Card>

          <Card className="glass-card p-8 animate-slideIn">
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
                  className={`text-input ${storyData.storyTitle ? 'text-black' : 'text-gray-500'}`}
                />
              </div>
              
              <div className="space-y-4">
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

                <div className="form-group">
                  <Label htmlFor="storyContent" className="text-blue-900">Story Content</Label>
                  <Textarea
                    id="storyContent"
                    placeholder="Story content will appear here..."
                    value={storyData.storyContent}
                    onChange={(e) => handleInputChange('storyContent', e.target.value)}
                    className={`min-h-[200px] text-input resize-none bg-white/50 ${storyData.storyContent ? 'text-black' : 'text-gray-500'} whitespace-pre-wrap`}
                  />
                </div>
              </div>

              {interactionPoint?.selectedChoice !== undefined && (
                <div className="space-y-4">
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

                  <div className="form-group">
                    <Label htmlFor="continuation" className="text-blue-900">Story Continuation</Label>
                    <Textarea
                      id="continuation"
                      value={interactionPoint.continuation}
                      readOnly
                      className="min-h-[200px] text-input resize-none bg-white/50 text-black whitespace-pre-wrap"
                    />
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
