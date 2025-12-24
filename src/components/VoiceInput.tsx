import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceInputProps {
  onTranscription: (text: string, language: string) => void;
  targetLanguage?: string;
}

export function VoiceInput({ onTranscription, targetLanguage = 'en' }: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastTranscription, setLastTranscription] = useState<string>('');
  const [error, setError] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      setError('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await processAudio(audioBlob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64 for transmission
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);

      reader.onloadend = async () => {
        const base64Audio = reader.result as string;

        // Send to backend via WebSocket
        if (window.socketIO) {
          window.socketIO.emit('transcribe-voice', {
            audioData: base64Audio,
            language: targetLanguage
          });

          // Listen for transcription result
          window.socketIO.once('transcription-result', (data: any) => {
            setLastTranscription(data.text);
            setIsProcessing(false);
            onTranscription(data.text, data.language);
          });

          window.socketIO.once('transcription-error', (data: any) => {
            setError(data.error || 'Transcription failed');
            setIsProcessing(false);
          });
        } else {
          setError('Not connected to backend');
          setIsProcessing(false);
        }
      };
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process audio');
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Voice Input</span>
          {isRecording && <Badge variant="destructive" className="animate-pulse">Recording...</Badge>}
          {isProcessing && <Badge variant="secondary">Processing...</Badge>}
        </CardTitle>
        <CardDescription>
          Speak to transcribe your voice using AI (Groq Whisper)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Recording Button */}
        <div className="flex items-center justify-center">
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            size="lg"
            variant={isRecording ? 'destructive' : 'default'}
            className="w-full max-w-xs h-20 text-lg"
          >
            {isRecording ? (
              <>
                <MicOff className="mr-2 h-6 w-6" />
                Stop Recording
              </>
            ) : isProcessing ? (
              <>
                <Volume2 className="mr-2 h-6 w-6 animate-pulse" />
                Processing...
              </>
            ) : (
              <>
                <Mic className="mr-2 h-6 w-6" />
                Start Recording
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Last Transcription */}
        {lastTranscription && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Last Transcription:</p>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm">{lastTranscription}</p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-3 rounded-lg bg-card border">
          <p className="text-xs text-muted-foreground">
            <strong>How to use:</strong>
            <br />
            1. Click "Start Recording" and speak clearly
            <br />
            2. Click "Stop Recording" when finished
            <br />
            3. Transcribed text will appear below
            <br />
            4. Use transcription as voice command or chat response
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
