import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type { ChatMessage, GameplayContext } from '../types/chat.types';

const BACKEND_URL = 'http://localhost:3001';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [gameplayContext, setGameplayContext] = useState<GameplayContext | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to backend
    socketRef.current = io(BACKEND_URL);

    // Expose socket to window for VoiceInput component
    (window as any).socketIO = socketRef.current;

    socketRef.current.on('connect', () => {
      console.log('Connected to backend');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from backend');
      setIsConnected(false);
    });

    // Listen for chat history
    socketRef.current.on('chat-history', (messages: ChatMessage[]) => {
      setChatMessages(messages);
    });

    // Listen for new chat messages
    socketRef.current.on('new-chat-message', (message: ChatMessage) => {
      setChatMessages(prev => [...prev, message]);
    });

    // Listen for gameplay context updates
    socketRef.current.on('gameplay-context', (context: GameplayContext) => {
      setGameplayContext(context);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const processChatScreenshot = (screenshot: string) => {
    socketRef.current?.emit('process-chat-screenshot', { screenshot });
  };

  const processGameplayScreenshot = (screenshot: string) => {
    socketRef.current?.emit('process-gameplay-screenshot', { screenshot });
  };

  const generateResponse = (
    chatMessage: ChatMessage,
    masterPrompt: any,
    includeGameplayContext: boolean = true,
    count: number = 1,
    translationSettings?: any
  ): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('generate-response', {
        chatMessage,
        masterPrompt: typeof masterPrompt === 'object' ? masterPrompt : masterPrompt,
        includeGameplayContext,
        count,
        translationSettings
      });

      const timeout = setTimeout(() => {
        reject(new Error('Response generation timeout'));
      }, 60000); // Longer timeout for multiple responses

      if (count === 1) {
        socketRef.current?.once('ai-response', (data: { response: string }) => {
          clearTimeout(timeout);
          resolve([data.response]);
        });
      } else {
        socketRef.current?.once('ai-responses', (data: { responses: string[] }) => {
          clearTimeout(timeout);
          resolve(data.responses);
        });
      }

      socketRef.current?.once('ai-response-error', (data: { error: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.error));
      });
    });
  };

  const generateTTS = (text: string, language: string = 'en'): Promise<any> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('generate-tts', { text, language });

      const timeout = setTimeout(() => {
        reject(new Error('TTS generation timeout'));
      }, 10000);

      socketRef.current?.once('tts-audio', (data: any) => {
        clearTimeout(timeout);
        resolve(data.audio);
      });

      socketRef.current?.once('tts-error', (data: { error: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.error));
      });
    });
  };

  const transcribeVoice = (audioData: string, language?: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('transcribe-voice', { audioData, language });

      const timeout = setTimeout(() => {
        reject(new Error('Voice transcription timeout'));
      }, 30000);

      socketRef.current?.once('transcription-result', (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });

      socketRef.current?.once('transcription-error', (data: { error: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.error));
      });
    });
  };

  const connectToOBS = (url: string, password: string): Promise<any> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('obs-connect', { url, password });

      const timeout = setTimeout(() => {
        reject(new Error('OBS connection timeout'));
      }, 10000);

      socketRef.current?.once('obs-connect-result', (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });

      socketRef.current?.once('obs-connect-error', (data: { error: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.error));
      });
    });
  };

  const disconnectFromOBS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      socketRef.current?.emit('obs-disconnect');

      const timeout = setTimeout(() => {
        reject(new Error('OBS disconnect timeout'));
      }, 5000);

      socketRef.current?.once('obs-disconnect-result', (data: any) => {
        clearTimeout(timeout);
        resolve(data);
      });

      socketRef.current?.once('obs-disconnect-error', (data: { error: string }) => {
        clearTimeout(timeout);
        reject(new Error(data.error));
      });
    });
  };

  return {
    isConnected,
    chatMessages,
    gameplayContext,
    processChatScreenshot,
    processGameplayScreenshot,
    generateResponse,
    generateTTS,
    transcribeVoice,
    connectToOBS,
    disconnectFromOBS
  };
}
