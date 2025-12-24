import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Settings as SettingsIcon, Download, Upload, Trash2, Save } from 'lucide-react';
import { SettingsManager } from '../utils/settingsManager';

export function Settings() {
  const [captureIntervals, setCaptureIntervals] = useState(() => {
    const settings = SettingsManager.loadSettings();
    return settings.captureIntervals;
  });

  const [showSuccess, setShowSuccess] = useState(false);

  const handleSaveIntervals = () => {
    SettingsManager.updateCaptureIntervals(captureIntervals.chat, captureIntervals.gameplay);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleExportSettings = () => {
    const json = SettingsManager.exportSettings();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `streamer-assistant-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          const success = SettingsManager.importSettings(result);
          if (success) {
            window.location.reload(); // Reload to apply settings
          } else {
            alert('Failed to import settings. Please check the file format.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      SettingsManager.clearSettings();
      window.location.reload();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SettingsIcon className="h-5 w-5" />
          <span>Application Settings</span>
          {showSuccess && <Badge variant="default">Saved!</Badge>}
        </CardTitle>
        <CardDescription>
          Configure capture intervals and manage your settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Capture Intervals */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Capture Intervals</h3>

          <div className="space-y-2">
            <Label htmlFor="chat-interval">Chat Capture Interval (ms)</Label>
            <Input
              id="chat-interval"
              type="number"
              min="1000"
              max="10000"
              step="500"
              value={captureIntervals.chat}
              onChange={(e) =>
                setCaptureIntervals((prev) => ({
                  ...prev,
                  chat: parseInt(e.target.value) || 3000,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Default: 3000ms (3 seconds). Lower values = more frequent captures, higher API costs.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gameplay-interval">Gameplay Capture Interval (ms)</Label>
            <Input
              id="gameplay-interval"
              type="number"
              min="5000"
              max="30000"
              step="1000"
              value={captureIntervals.gameplay}
              onChange={(e) =>
                setCaptureIntervals((prev) => ({
                  ...prev,
                  gameplay: parseInt(e.target.value) || 12000,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Default: 12000ms (12 seconds). Gameplay changes slower than chat.
            </p>
          </div>

          <Button onClick={handleSaveIntervals} className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Save Intervals
          </Button>
        </div>

        {/* API Keys Info */}
        <div className="p-3 rounded-lg bg-card border space-y-2">
          <p className="text-sm font-medium">API Keys Configuration</p>
          <p className="text-xs text-muted-foreground">
            API keys are stored in the backend <code className="bg-muted px-1 rounded">.env</code> file:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1 ml-4">
            <li>• <strong>GEMINI_API_KEY</strong> - Required for OCR and AI responses</li>
            <li>• <strong>GROQ_API_KEY</strong> - Required for voice transcription (Whisper)</li>
          </ul>
          <p className="text-xs text-muted-foreground">
            Edit <code className="bg-muted px-1 rounded">.env</code> file in the backend folder and restart the server.
          </p>
        </div>

        {/* Settings Management */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Settings Management</h3>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleExportSettings} variant="outline" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button onClick={handleImportSettings} variant="outline" className="w-full">
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
          </div>

          <Button onClick={handleResetSettings} variant="destructive" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>

          <p className="text-xs text-muted-foreground">
            Export your settings as JSON to backup or share. Import to restore or apply settings from another setup.
          </p>
        </div>

        {/* What's Saved */}
        <div className="p-3 rounded-lg bg-muted space-y-2">
          <p className="text-xs font-medium">Automatically Saved Settings:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>✓ Translation language preferences</li>
            <li>✓ Selected personality/master prompt</li>
            <li>✓ OBS WebSocket connection details</li>
            <li>✓ Capture interval configurations</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
