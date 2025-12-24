import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RefreshCw, Trash2, TrendingDown } from 'lucide-react';

export function OCRStats() {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadStats();

    // Auto-refresh stats every 10 seconds
    const interval = setInterval(loadStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = () => {
    if (window.socketIO) {
      window.socketIO.emit('ocr-get-stats');

      window.socketIO.once('ocr-stats', (data: any) => {
        setStats(data);
      });
    }
  };

  const handleClearCache = () => {
    if (window.socketIO) {
      setIsLoading(true);
      window.socketIO.emit('ocr-clear-cache');

      window.socketIO.once('ocr-cache-cleared', () => {
        setIsLoading(false);
        loadStats();
      });
    }
  };

  const formatInterval = (ms: number) => {
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatTimestamp = (timestamp: number) => {
    const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
    if (secondsAgo < 60) return `${secondsAgo}s ago`;
    const minutesAgo = Math.floor(secondsAgo / 60);
    return `${minutesAgo}m ago`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            <span>OCR Performance</span>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadStats} variant="ghost" size="sm">
              <RefreshCw className="h-3 w-3" />
            </Button>
            <Button
              onClick={handleClearCache}
              variant="outline"
              size="sm"
              disabled={isLoading || !stats || stats.cacheSize === 0}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Clear Cache
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Real-time OCR optimization statistics and cache management
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!stats ? (
          <p className="text-sm text-muted-foreground">Loading stats...</p>
        ) : (
          <div className="space-y-4">
            {/* Adaptive Interval */}
            <div className="p-3 rounded-lg bg-card border">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium">Current Capture Interval</p>
                <Badge variant="default">{formatInterval(stats.currentInterval)}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Adaptive interval based on chat activity (2-10s range)
              </p>
            </div>

            {/* Cache Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Cache Size</p>
                <p className="text-2xl font-bold">{stats.cacheSize}</p>
                <p className="text-xs text-muted-foreground">screenshots cached</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs text-muted-foreground mb-1">Total Messages</p>
                <p className="text-2xl font-bold">{stats.messageCount}</p>
                <p className="text-xs text-muted-foreground">extracted from OCR</p>
              </div>
            </div>

            {/* Activity Info */}
            <div className="p-3 rounded-lg bg-card border">
              <p className="text-sm font-medium mb-2">Chat Activity</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Last activity:</span>
                  <span>{formatTimestamp(stats.lastActivity)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cache expiry:</span>
                  <span>{formatInterval(stats.cacheExpiry)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Max cache size:</span>
                  <span>{stats.maxCacheSize} screenshots</span>
                </div>
              </div>
            </div>

            {/* Optimization Benefits */}
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mb-2">
                Optimization Benefits:
              </p>
              <ul className="text-xs text-green-600 dark:text-green-300 space-y-1">
                <li>✓ Duplicate detection saves API calls</li>
                <li>✓ Diff detection skips unchanged screenshots</li>
                <li>✓ Adaptive intervals reduce processing when idle</li>
                <li>✓ Cache reduces redundant OCR processing</li>
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
