import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { Video, VideoOff, RefreshCw } from 'lucide-react';

interface OBSConnectionProps {
  onConnectionChange: (isConnected: boolean) => void;
}

export function OBSConnection({ onConnectionChange }: OBSConnectionProps) {
  const [url, setUrl] = useState('ws://localhost:4455');
  const [password, setPassword] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [obsVersion, setObsVersion] = useState<string>('');
  const [scenes, setScenes] = useState<any[]>([]);
  const [currentScene, setCurrentScene] = useState<string>('');

  useEffect(() => {
    // Check initial connection status
    checkConnectionStatus();

    // Listen for OBS status updates
    if (window.socketIO) {
      window.socketIO.on('obs-status', (status: any) => {
        setIsConnected(status.isConnected);
        onConnectionChange(status.isConnected);
      });

      window.socketIO.on('obs-connect-result', (result: any) => {
        setIsConnecting(false);
        setIsConnected(true);
        setError('');
        if (result.version) {
          setObsVersion(result.version.obsVersion || '');
        }
        onConnectionChange(true);
        // Load scenes after connection
        loadScenes();
      });

      window.socketIO.on('obs-connect-error', (data: any) => {
        setIsConnecting(false);
        setIsConnected(false);
        setError(data.error || 'Failed to connect to OBS');
        onConnectionChange(false);
      });

      window.socketIO.on('obs-disconnect-result', () => {
        setIsConnected(false);
        setObsVersion('');
        setScenes([]);
        setCurrentScene('');
        onConnectionChange(false);
      });

      window.socketIO.on('obs-scenes', (scenesData: any) => {
        if (scenesData && scenesData.scenes) {
          setScenes(scenesData.scenes);
          setCurrentScene(scenesData.currentProgramSceneName || '');
        }
      });

      window.socketIO.on('obs-scene-changed', (data: any) => {
        setCurrentScene(data.sceneName);
      });

      window.socketIO.on('obs-error', (data: any) => {
        setError(data.error || 'OBS error occurred');
      });
    }

    return () => {
      if (window.socketIO) {
        window.socketIO.off('obs-status');
        window.socketIO.off('obs-connect-result');
        window.socketIO.off('obs-connect-error');
        window.socketIO.off('obs-disconnect-result');
        window.socketIO.off('obs-scenes');
        window.socketIO.off('obs-scene-changed');
        window.socketIO.off('obs-error');
      }
    };
  }, [onConnectionChange]);

  const checkConnectionStatus = () => {
    if (window.socketIO) {
      window.socketIO.emit('obs-get-status');
    }
  };

  const handleConnect = () => {
    if (!window.socketIO) {
      setError('Not connected to backend');
      return;
    }

    setError('');
    setIsConnecting(true);
    window.socketIO.emit('obs-connect', { url, password });
  };

  const handleDisconnect = () => {
    if (!window.socketIO) {
      return;
    }

    window.socketIO.emit('obs-disconnect');
  };

  const loadScenes = () => {
    if (!window.socketIO || !isConnected) {
      return;
    }

    window.socketIO.emit('obs-get-scenes');
  };

  const switchScene = (sceneName: string) => {
    if (!window.socketIO || !isConnected) {
      return;
    }

    window.socketIO.emit('obs-set-scene', { sceneName });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>OBS WebSocket Connection</span>
          {isConnected ? (
            <Badge variant="default" className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary" className="flex items-center gap-1">
              <VideoOff className="h-3 w-3" />
              Disconnected
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Connect to OBS Studio for direct audio routing and scene control
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <>
            {/* Connection Form */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="obs-url">WebSocket URL</Label>
                <Input
                  id="obs-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="ws://localhost:4455"
                  disabled={isConnecting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs-password">Password (optional)</Label>
                <Input
                  id="obs-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave empty if no password"
                  disabled={isConnecting}
                />
              </div>

              <Button
                onClick={handleConnect}
                disabled={isConnecting || !url}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Connect to OBS
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

            {/* Instructions */}
            <div className="p-3 rounded-lg bg-card border">
              <p className="text-xs text-muted-foreground">
                <strong>Setup Instructions:</strong>
                <br />
                1. Open OBS Studio
                <br />
                2. Go to Tools → WebSocket Server Settings
                <br />
                3. Enable WebSocket server
                <br />
                4. Note the port (default: 4455) and password
                <br />
                5. Enter connection details above
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Connected Info */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">OBS Version</p>
                  <p className="text-xs text-muted-foreground">{obsVersion || 'Unknown'}</p>
                </div>
                <Button onClick={handleDisconnect} variant="outline" size="sm">
                  Disconnect
                </Button>
              </div>

              {/* Scene List */}
              {scenes.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Scenes ({scenes.length})</Label>
                    <Button onClick={loadScenes} variant="ghost" size="sm">
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {scenes.map((scene: any) => (
                      <Button
                        key={scene.sceneName}
                        onClick={() => switchScene(scene.sceneName)}
                        variant={currentScene === scene.sceneName ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs"
                      >
                        {scene.sceneName}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features Info */}
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-xs font-medium mb-2">Available Features:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>✓ Scene switching</li>
                  <li>✓ Stream/record status monitoring</li>
                  <li>✓ Direct audio routing (coming soon)</li>
                  <li>✓ Chat overlay integration (coming soon)</li>
                </ul>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
