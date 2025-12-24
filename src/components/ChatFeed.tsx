import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import type { ChatMessage } from '../types/chat.types';

interface ChatFeedProps {
  messages: ChatMessage[];
}

const platformColors: Record<string, string> = {
  twitch: 'bg-purple-500',
  youtube: 'bg-red-500',
  kick: 'bg-green-500',
  tiktok: 'bg-pink-500',
  unknown: 'bg-gray-500'
};

export function ChatFeed({ messages }: ChatFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Live Chat Feed</span>
          <Badge variant="outline">{messages.length} messages</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]" ref={scrollRef}>
          <div className="space-y-2">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>No messages yet</p>
                <p className="text-sm mt-2">Select monitors and start capture to see chat messages</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      className={`${platformColors[msg.platform]} text-white text-xs`}
                      variant="default"
                    >
                      {msg.platform}
                    </Badge>
                    <span className="font-semibold text-sm">{msg.username}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
