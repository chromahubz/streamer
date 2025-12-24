export interface ElectronAPI {
  // Screen Capture
  getAvailableSources: () => Promise<Array<{
    id: string;
    name: string;
    thumbnail: string;
  }>>;
  startChatCapture: (sourceId: string, interval: number) => Promise<void>;
  startGameplayCapture: (sourceId: string, interval: number) => Promise<void>;
  stopChatCapture: () => Promise<void>;
  stopGameplayCapture: () => Promise<void>;

  // Screenshot events
  onChatScreenshot: (callback: (event: any, data: string) => void) => void;
  onGameplayScreenshot: (callback: (event: any, data: string) => void) => void;

  // Audio
  playTTS: (audioBuffer: ArrayBuffer) => Promise<void>;
  setVolume: (volume: number) => Promise<void>;

  // OBS Integration
  connectToOBS: (url: string, password: string) => Promise<boolean>;
  disconnectFromOBS: () => Promise<void>;

  // General
  minimize: () => Promise<void>;
  maximize: () => Promise<void>;
  close: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}
