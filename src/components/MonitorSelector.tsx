import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import type { MonitorSource } from '../types/chat.types';

interface MonitorSelectorProps {
  onChatMonitorSelected: (sourceId: string, interval: number) => void;
  onGameplayMonitorSelected: (sourceId: string, interval: number) => void;
}

export function MonitorSelector({ onChatMonitorSelected, onGameplayMonitorSelected }: MonitorSelectorProps) {
  const [sources, setSources] = useState<MonitorSource[]>([]);
  const [selectedChatSource, setSelectedChatSource] = useState<string | null>(null);
  const [selectedGameplaySource, setSelectedGameplaySource] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState({ chat: false, gameplay: false });

  useEffect(() => {
    loadSources();
  }, []);

  const loadSources = async () => {
    if (window.electronAPI) {
      try {
        const availableSources = await window.electronAPI.getAvailableSources();
        setSources(availableSources);
      } catch (error) {
        console.error('Failed to load sources:', error);
      }
    }
  };

  const startChatCapture = () => {
    if (selectedChatSource && window.electronAPI) {
      const interval = 3000; // Default chat capture interval
      window.electronAPI.startChatCapture(selectedChatSource, interval);
      onChatMonitorSelected(selectedChatSource, interval);
      setIsCapturing(prev => ({ ...prev, chat: true }));
    }
  };

  const startGameplayCapture = () => {
    if (selectedGameplaySource && window.electronAPI) {
      const interval = 12000; // Default gameplay capture interval
      window.electronAPI.startGameplayCapture(selectedGameplaySource, interval);
      onGameplayMonitorSelected(selectedGameplaySource, interval);
      setIsCapturing(prev => ({ ...prev, gameplay: true }));
    }
  };

  const stopChatCapture = () => {
    if (window.electronAPI) {
      window.electronAPI.stopChatCapture();
      setIsCapturing(prev => ({ ...prev, chat: false }));
    }
  };

  const stopGameplayCapture = () => {
    if (window.electronAPI) {
      window.electronAPI.stopGameplayCapture();
      setIsCapturing(prev => ({ ...prev, gameplay: false }));
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Chat Monitor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Chat Monitor</span>
            {isCapturing.chat && <Badge variant="default">Capturing</Badge>}
          </CardTitle>
          <CardDescription>
            Select the monitor/window showing your chat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={loadSources} variant="outline" className="w-full">
            Refresh Sources
          </Button>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedChatSource(source.id)}
                className={`p-2 rounded border-2 transition-all ${
                  selectedChatSource === source.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={source.thumbnail}
                  alt={source.name}
                  className="w-full h-auto rounded mb-1"
                />
                <p className="text-xs truncate">{source.name}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={startChatCapture}
              disabled={!selectedChatSource || isCapturing.chat}
              className="flex-1"
            >
              {isCapturing.chat ? 'Capturing...' : 'Start Capture'}
            </Button>
            {isCapturing.chat && (
              <Button onClick={stopChatCapture} variant="destructive">
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gameplay Monitor Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Gameplay Monitor</span>
            {isCapturing.gameplay && <Badge variant="default">Capturing</Badge>}
          </CardTitle>
          <CardDescription>
            Select the monitor/window showing your game
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={loadSources} variant="outline" className="w-full">
            Refresh Sources
          </Button>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => setSelectedGameplaySource(source.id)}
                className={`p-2 rounded border-2 transition-all ${
                  selectedGameplaySource === source.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <img
                  src={source.thumbnail}
                  alt={source.name}
                  className="w-full h-auto rounded mb-1"
                />
                <p className="text-xs truncate">{source.name}</p>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={startGameplayCapture}
              disabled={!selectedGameplaySource || isCapturing.gameplay}
              className="flex-1"
            >
              {isCapturing.gameplay ? 'Capturing...' : 'Start Capture'}
            </Button>
            {isCapturing.gameplay && (
              <Button onClick={stopGameplayCapture} variant="destructive">
                Stop
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
