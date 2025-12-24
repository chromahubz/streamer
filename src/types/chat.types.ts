export interface ChatMessage {
  id?: string;
  platform: 'twitch' | 'youtube' | 'kick' | 'tiktok' | 'voice' | 'unknown';
  username: string;
  message: string;
  timestamp: string;
}

export interface GameplayContext {
  lastUpdate: string | null;
  game: string | null;
  scene: string | null;
  action: string | null;
  state: 'winning' | 'losing' | 'neutral' | 'stuck' | 'loading' | null;
  notable?: string;
}

export interface MonitorSource {
  id: string;
  name: string;
  thumbnail: string;
}

export interface AIResponse {
  response: string;
  timestamp: string;
}
