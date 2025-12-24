import { Socket } from 'socket.io-client';

declare global {
  interface Window {
    socketIO?: Socket;
    electronAPI?: {
      getAvailableSources: () => Promise<Array<{
        id: string;
        name: string;
        thumbnail: string;
      }>>;
      startChatCapture: (sourceId: string, interval: number) => void;
      startGameplayCapture: (sourceId: string, interval: number) => void;
      stopChatCapture: () => void;
      stopGameplayCapture: () => void;
      onChatScreenshot: (callback: (event: any, screenshot: string) => void) => void;
      onGameplayScreenshot: (callback: (event: any, screenshot: string) => void) => void;
      playTTS: (text: string) => Promise<void>;
      setVolume: (volume: number) => void;
    };
  }
}

export {};
