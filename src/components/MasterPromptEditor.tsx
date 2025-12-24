import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface MasterPrompt {
  id: string;
  name: string;
  icon: string;
  masterPrompt: {
    personality: string;
    responseStyle: {
      length: string;
      tone: string;
      language: string;
      emojis: string;
      punctuation: string;
    };
    contextualRules: {
      questions: string;
      comments: string;
      trolls: string;
      newFollowers: string;
    };
    gameAwareness: {
      commentaryFocus: string;
      whenWinning: string;
      whenLosing: string;
      whenStuck: string;
    };
    translation: {
      autoDetect: boolean;
      respondInSameLanguage: boolean;
      defaultLanguage: string;
    };
  };
  temperature: number;
}

interface MasterPromptEditorProps {
  onSelectPrompt: (prompt: MasterPrompt) => void;
}

export function MasterPromptEditor({ onSelectPrompt }: MasterPromptEditorProps) {
  const [prompts, setPrompts] = useState<MasterPrompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<MasterPrompt | null>(null);

  useEffect(() => {
    // Load master prompts from public folder
    fetch('/master-prompts.json')
      .then(res => res.json())
      .then(data => {
        setPrompts(data.presets || []);
        if (data.presets && data.presets.length > 0 && !selectedPrompt) {
          const initial = data.presets[0];
          setSelectedPrompt(initial);
          onSelectPrompt(initial);
        }
      })
      .catch(error => console.error('Failed to load master prompts:', error));
  }, []);

  const handleSelectPrompt = (prompt: MasterPrompt) => {
    setSelectedPrompt(prompt);
    onSelectPrompt(prompt);
  };

  if (!selectedPrompt && prompts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Master Prompt</CardTitle>
          <CardDescription>Loading personalities...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Master Prompt & Personality</span>
          {selectedPrompt && (
            <Badge variant="default" className="text-lg">
              {selectedPrompt.icon} {selectedPrompt.name}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Choose your AI personality and response style
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preset Selection */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {prompts.map(prompt => (
            <Button
              key={prompt.id}
              onClick={() => handleSelectPrompt(prompt)}
              variant={selectedPrompt?.id === prompt.id ? 'default' : 'outline'}
              className="h-auto flex-col gap-1 p-3"
            >
              <span className="text-2xl">{prompt.icon}</span>
              <span className="text-xs">{prompt.name}</span>
            </Button>
          ))}
        </div>

        {/* Prompt Details */}
        {selectedPrompt && (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="rules">Rules</TabsTrigger>
              <TabsTrigger value="game">Game</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Personality</p>
                <p className="text-sm text-muted-foreground">
                  {selectedPrompt.masterPrompt.personality}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">Temperature</p>
                <Badge variant="outline">{selectedPrompt.temperature}</Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedPrompt.temperature > 0.8
                    ? 'Very creative and varied'
                    : selectedPrompt.temperature > 0.6
                    ? 'Balanced creativity'
                    : 'Focused and consistent'}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Length</p>
                  <p className="text-sm font-medium">{selectedPrompt.masterPrompt.responseStyle.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Tone</p>
                  <p className="text-sm font-medium">{selectedPrompt.masterPrompt.responseStyle.tone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Language</p>
                  <p className="text-sm font-medium">{selectedPrompt.masterPrompt.responseStyle.language}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Emojis</p>
                  <p className="text-sm font-medium">{selectedPrompt.masterPrompt.responseStyle.emojis}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Punctuation</p>
                  <p className="text-sm font-medium">{selectedPrompt.masterPrompt.responseStyle.punctuation}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rules" className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Questions</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.contextualRules.questions}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Comments</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.contextualRules.comments}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trolls</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.contextualRules.trolls}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New Followers</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.contextualRules.newFollowers}</p>
              </div>
            </TabsContent>

            <TabsContent value="game" className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">Commentary Focus</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.gameAwareness.commentaryFocus}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">When Winning</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.gameAwareness.whenWinning}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">When Losing</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.gameAwareness.whenLosing}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">When Stuck</p>
                <p className="text-sm">{selectedPrompt.masterPrompt.gameAwareness.whenStuck}</p>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
