
import { Button } from "@/components/ui/button";
import { PlayCircle, PauseCircle } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface StoryAudioPlayerProps {
  audioContent?: string | null;
  isGenerating?: boolean;
}

export const StoryAudioPlayer = ({ audioContent, isGenerating }: StoryAudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioContent) {
      const audioBlob = new Blob(
        [Uint8Array.from(atob(audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        return () => URL.revokeObjectURL(audioUrl);
      }
    }
  }, [audioContent]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <>
      <Button
        onClick={handlePlayPause}
        disabled={isGenerating || !audioContent}
        variant="outline"
        size="icon"
        className={`w-10 h-10 ${!audioContent ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-50'}`}
      >
        {isPlaying ? (
          <PauseCircle className="h-6 w-6 text-blue-600" />
        ) : (
          <PlayCircle className={`h-6 w-6 ${audioContent ? 'text-blue-600' : 'text-gray-400'}`} />
        )}
      </Button>
      {isGenerating && (
        <span className="text-sm text-blue-600 animate-pulse ml-2">
          Generating voice...
        </span>
      )}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />
    </>
  );
};
