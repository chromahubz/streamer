import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Switch } from './ui/switch';
import type { ChatMessage } from '../types/chat.types';

interface ResponsePanelProps {
  selectedMessage: ChatMessage | null;
  masterPrompt: any;
  onGenerateResponse: (message: ChatMessage, count: number) => Promise<string[]>;
  onPlayTTS: (text: string) => Promise<void>;
}

export function ResponsePanel({ selectedMessage, masterPrompt, onGenerateResponse, onPlayTTS }: ResponsePanelProps) {
  const [responses, setResponses] = useState<string[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [multipleMode, setMultipleMode] = useState(true);
  const [responseCount, setResponseCount] = useState(3);

  const handleGenerate = async () => {
    if (!selectedMessage) return;

    setIsGenerating(true);
    setResponses([]);
    setSelectedResponseIndex(null);

    try {
      const count = multipleMode ? responseCount : 1;
      const generatedResponses = await onGenerateResponse(selectedMessage, count);
      setResponses(generatedResponses);

      // Auto-select first response
      if (generatedResponses.length > 0) {
        setSelectedResponseIndex(0);
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      setResponses(['Error generating response. Please check your API keys and try again.']);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    await handleGenerate();
  };

  const handlePlayTTS = async (text: string) => {
    if (!text) return;

    setIsPlaying(true);
    try {
      await onPlayTTS(text);
    } catch (error) {
      console.error('Failed to play TTS:', error);
    } finally {
      setIsPlaying(false);
    }
  };

  const selectedResponse = selectedResponseIndex !== null ? responses[selectedResponseIndex] : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>AI Response Generator</span>
          {masterPrompt && (
            <Badge variant="outline">
              {masterPrompt.icon} {masterPrompt.name}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {selectedMessage
            ? `Responding to: ${selectedMessage.username}`
            : 'Click a chat message to generate a response'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selected Message */}
        {selectedMessage && (
          <div className="p-3 rounded-lg bg-muted">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{selectedMessage.platform}</Badge>
              <span className="font-semibold text-sm">{selectedMessage.username}</span>
            </div>
            <p className="text-sm">{selectedMessage.message}</p>
          </div>
        )}

        {/* Mode Toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div className="flex items-center gap-2">
            <Switch
              checked={multipleMode}
              onCheckedChange={setMultipleMode}
            />
            <span className="text-sm font-medium">
              {multipleMode ? 'Multiple Options' : 'Single Response'}
            </span>
          </div>
          {multipleMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Options:</span>
              {[3, 4, 5].map(num => (
                <Button
                  key={num}
                  variant={responseCount === num ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setResponseCount(num)}
                  className="h-7 w-7 p-0"
                >
                  {num}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Generate Button */}
        <div className="flex gap-2">
          <Button
            onClick={handleGenerate}
            disabled={!selectedMessage || isGenerating}
            className="flex-1"
          >
            {isGenerating ? 'Generating...' : `Generate ${multipleMode ? `${responseCount} Options` : 'Response'}`}
          </Button>
          {responses.length > 0 && (
            <Button
              onClick={handleRegenerate}
              disabled={isGenerating}
              variant="outline"
            >
              Regenerate
            </Button>
          )}
        </div>

        {/* Response Options */}
        {responses.length > 0 && (
          <div className="space-y-3">
            {multipleMode ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Choose your response:</p>
                {responses.map((response, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedResponseIndex(idx)}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      selectedResponseIndex === idx
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1">{response}</p>
                      <Badge variant="outline" className="text-xs">
                        Option {idx + 1}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-sm font-medium mb-1">AI Response:</p>
                <p className="text-sm">{responses[0]}</p>
              </div>
            )}

            {/* Action Buttons */}
            {selectedResponse && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePlayTTS(selectedResponse)}
                  disabled={isPlaying}
                  variant="outline"
                  className="flex-1"
                >
                  {isPlaying ? 'Playing...' : 'Preview TTS'}
                </Button>
                <Button variant="default" className="flex-1">
                  Broadcast
                </Button>
              </div>
            )}
          </div>
        )}

        {!responses.length && selectedMessage && !isGenerating && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Click "Generate" to create {multipleMode ? `${responseCount} response options` : 'a response'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
