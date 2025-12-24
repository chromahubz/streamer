import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { MonitorSelector } from './components/MonitorSelector';
import { ChatFeed } from './components/ChatFeed';
import { ResponsePanel } from './components/ResponsePanel';
import { MasterPromptEditor } from './components/MasterPromptEditor';
import { TranslationSettings, type TranslationConfig } from './components/TranslationSettings';
import { VoiceInput } from './components/VoiceInput';
import { OBSConnection } from './components/OBSConnection';
import { OCRStats } from './components/OCRStats';
import { Settings } from './components/Settings';
import { useSocket } from './hooks/useSocket';
import { SettingsManager } from './utils/settingsManager';
import type { ChatMessage } from './types/chat.types';

function App() {
  const {
    isConnected,
    chatMessages,
    gameplayContext,
    processChatScreenshot,
    processGameplayScreenshot,
    generateResponse
  } = useSocket();

  // Load initial settings from localStorage
  const initialSettings = SettingsManager.loadSettings();

  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [isCapturing, setIsCapturing] = useState({ chat: false, gameplay: false });
  const [selectedMasterPrompt, setSelectedMasterPrompt] = useState<any>(null);
  const [translationSettings, setTranslationSettings] = useState<TranslationConfig>(
    initialSettings.translationSettings
  );
  const [isOBSConnected, setIsOBSConnected] = useState(false);

  // Persist translation settings
  useEffect(() => {
    SettingsManager.updateTranslationSettings(translationSettings);
  }, [translationSettings]);

  // Persist master prompt selection
  useEffect(() => {
    if (selectedMasterPrompt?.id) {
      SettingsManager.updateMasterPrompt(selectedMasterPrompt.id);
    }
  }, [selectedMasterPrompt]);

  // Listen for screenshots from Electron
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onChatScreenshot((_event: any, screenshot: string) => {
        processChatScreenshot(screenshot);
      });

      window.electronAPI.onGameplayScreenshot((_event: any, screenshot: string) => {
        processGameplayScreenshot(screenshot);
      });
    }
  }, [processChatScreenshot, processGameplayScreenshot]);

  const handleChatMonitorSelected = (sourceId: string, interval: number) => {
    setIsCapturing(prev => ({ ...prev, chat: true }));
    console.log(`Chat monitor selected: ${sourceId}, interval: ${interval}ms`);
  };

  const handleGameplayMonitorSelected = (sourceId: string, interval: number) => {
    setIsCapturing(prev => ({ ...prev, gameplay: true }));
    console.log(`Gameplay monitor selected: ${sourceId}, interval: ${interval}ms`);
  };

  const handleGenerateResponse = async (message: ChatMessage, count: number = 1): Promise<string[]> => {
    const prompt = selectedMasterPrompt?.masterPrompt || `You are a friendly, energetic gaming streamer.
Keep responses short (1-2 sentences), casual, and engaging.
Use gaming slang when appropriate. Be helpful and positive.`;

    return await generateResponse(message, prompt, true, count, translationSettings);
  };

  const handlePlayTTS = async (text: string): Promise<void> => {
    try {
      // Use Groq PlayAI TTS
      if (window.socketIO) {
        window.socketIO.emit('generate-tts', {
          text,
          voice: 'Aaliyah-PlayAI', // Can be made configurable
          speed: 1.0
        });

        // Listen for TTS audio
        window.socketIO.once('tts-audio', (data: any) => {
          try {
            // Convert base64 to audio blob
            const audioData = atob(data.audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const view = new Uint8Array(arrayBuffer);
            for (let i = 0; i < audioData.length; i++) {
              view[i] = audioData.charCodeAt(i);
            }
            const blob = new Blob([arrayBuffer], { type: data.type });
            const audioUrl = URL.createObjectURL(blob);

            // Play audio
            const audio = new Audio(audioUrl);
            audio.play();

            // Clean up URL after playing
            audio.onended = () => URL.revokeObjectURL(audioUrl);
          } catch (error) {
            console.error('Audio playback error:', error);
          }
        });

        window.socketIO.once('tts-error', (error: any) => {
          console.error('TTS error:', error);
          throw new Error(error.error);
        });
      }
    } catch (error) {
      console.error('TTS error:', error);
      throw error;
    }
  };

  const handleVoiceTranscription = (text: string, language: string) => {
    console.log('Voice transcribed:', text, 'Language:', language);

    // Create a synthetic chat message from voice input
    const voiceMessage: ChatMessage = {
      id: `voice_${Date.now()}`,
      platform: 'voice' as any,
      username: 'Voice Input',
      message: text,
      timestamp: new Date().toISOString()
    };

    // Auto-select this message for response generation
    setSelectedMessage(voiceMessage);
  };

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">AI Streamer Assistant</h1>
              <p className="text-muted-foreground">
                Multi-platform chat OCR • AI Responses • Real-time Translation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm">Backend: {isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
              {isCapturing.chat && <Badge variant="default">Chat Capturing</Badge>}
              {isCapturing.gameplay && <Badge variant="default">Gameplay Capturing</Badge>}
              {translationSettings.enabled && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  🌐 Translation: {translationSettings.autoDetect ? 'Auto' : translationSettings.sourceLanguage.toUpperCase()} → {translationSettings.targetLanguage.toUpperCase()}
                </Badge>
              )}
              {isOBSConnected && <Badge variant="default">OBS Connected</Badge>}
            </div>
          </div>
        </header>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="setup">Setup</TabsTrigger>
            <TabsTrigger value="chat">Chat & Responses</TabsTrigger>
            <TabsTrigger value="stats">Stats & Context</TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-6">
            {/* Master Prompt Editor */}
            <MasterPromptEditor
              onSelectPrompt={setSelectedMasterPrompt}
            />

            {/* Translation Settings */}
            <TranslationSettings
              onSettingsChange={setTranslationSettings}
              initialSettings={translationSettings}
            />

            {/* Voice Input */}
            <VoiceInput
              onTranscription={handleVoiceTranscription}
              targetLanguage={translationSettings.targetLanguage}
            />

            {/* OBS Connection */}
            <OBSConnection
              onConnectionChange={setIsOBSConnected}
            />

            {/* Application Settings */}
            <Settings />

            {/* Monitor Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Monitor Selection</CardTitle>
                <CardDescription>
                  Select your chat display monitor and gameplay monitor to start capturing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MonitorSelector
                  onChatMonitorSelected={handleChatMonitorSelected}
                  onGameplayMonitorSelected={handleGameplayMonitorSelected}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">1</Badge>
                  <div>
                    <p className="font-medium">Add API Keys</p>
                    <p className="text-sm text-muted-foreground">
                      Edit <code className="bg-muted px-1 rounded">.env</code> file with your Gemini API key
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">2</Badge>
                  <div>
                    <p className="font-medium">Select Monitors</p>
                    <p className="text-sm text-muted-foreground">
                      Choose your chat display monitor and gameplay monitor above
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">3</Badge>
                  <div>
                    <p className="font-medium">Start Capturing</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Start Capture" buttons to begin OCR processing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">4</Badge>
                  <div>
                    <p className="font-medium">Generate Responses</p>
                    <p className="text-sm text-muted-foreground">
                      Go to "Chat & Responses" tab to see messages and generate AI responses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat & Responses Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <div onClick={() => chatMessages.length > 0 && setSelectedMessage(chatMessages[chatMessages.length - 1])}>
                <ChatFeed messages={chatMessages} />
              </div>
              <ResponsePanel
                selectedMessage={selectedMessage}
                masterPrompt={selectedMasterPrompt}
                onGenerateResponse={handleGenerateResponse}
                onPlayTTS={handlePlayTTS}
              />
            </div>
          </TabsContent>

          {/* Stats & Context Tab */}
          <TabsContent value="stats" className="space-y-6">
            {/* OCR Performance Stats */}
            <OCRStats />

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Chat Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Messages:</span>
                      <span className="font-semibold">{chatMessages.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platforms:</span>
                      <span className="font-semibold">
                        {new Set(chatMessages.map(m => m.platform)).size}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unique Users:</span>
                      <span className="font-semibold">
                        {new Set(chatMessages.map(m => m.username)).size}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gameplay Context</CardTitle>
                </CardHeader>
                <CardContent>
                  {gameplayContext ? (
                    <div className="space-y-3">
                      <div>
                        <span className="text-muted-foreground">Game:</span>
                        <p className="font-semibold">{gameplayContext.game || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Scene:</span>
                        <p className="text-sm">{gameplayContext.scene || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Action:</span>
                        <p className="text-sm">{gameplayContext.action || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">State:</span>
                        <Badge variant="outline">{gameplayContext.state || 'neutral'}</Badge>
                      </div>
                      {gameplayContext.lastUpdate && (
                        <div>
                          <span className="text-muted-foreground text-xs">
                            Last updated: {new Date(gameplayContext.lastUpdate).toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Start gameplay capture to see context
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
