import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface TranslationSettingsProps {
  onSettingsChange: (settings: TranslationConfig) => void;
  initialSettings?: TranslationConfig;
}

export interface TranslationConfig {
  enabled: boolean;
  autoDetect: boolean;
  sourceLanguage: string;
  targetLanguage: string;
  bidirectional: boolean;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
];

export function TranslationSettings({ onSettingsChange, initialSettings }: TranslationSettingsProps) {
  const [settings, setSettings] = useState<TranslationConfig>(
    initialSettings || {
      enabled: false,
      autoDetect: true,
      sourceLanguage: 'en',
      targetLanguage: 'en',
      bidirectional: true,
    }
  );

  const handleChange = (key: keyof TranslationConfig, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Translation Settings</span>
          {settings.enabled && <Badge variant="default">Active</Badge>}
        </CardTitle>
        <CardDescription>
          Real-time translation for multi-language chat interaction
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Enable Translation */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
          <div>
            <p className="font-medium">Enable Translation</p>
            <p className="text-xs text-muted-foreground">
              Translate chat messages and AI responses
            </p>
          </div>
          <Switch
            checked={settings.enabled}
            onCheckedChange={(checked) => handleChange('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <>
            {/* Auto-Detect Language */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div>
                <p className="font-medium">Auto-Detect Language</p>
                <p className="text-xs text-muted-foreground">
                  Automatically detect chat message language
                </p>
              </div>
              <Switch
                checked={settings.autoDetect}
                onCheckedChange={(checked) => handleChange('autoDetect', checked)}
              />
            </div>

            {/* Bidirectional Translation */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-card border">
              <div>
                <p className="font-medium">Bidirectional Translation</p>
                <p className="text-xs text-muted-foreground">
                  Respond in the same language as chat message
                </p>
              </div>
              <Switch
                checked={settings.bidirectional}
                onCheckedChange={(checked) => handleChange('bidirectional', checked)}
              />
            </div>

            {/* Source Language */}
            {!settings.autoDetect && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Source Language (Chat)</p>
                <div className="grid grid-cols-3 gap-2">
                  {LANGUAGES.map((lang) => (
                    <Button
                      key={lang.code}
                      variant={settings.sourceLanguage === lang.code ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleChange('sourceLanguage', lang.code)}
                      className="justify-start"
                    >
                      <span className="mr-2">{lang.flag}</span>
                      <span className="text-xs">{lang.name}</span>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Target Language */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Language (Responses)</p>
              <div className="grid grid-cols-3 gap-2">
                {LANGUAGES.map((lang) => (
                  <Button
                    key={lang.code}
                    variant={settings.targetLanguage === lang.code ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleChange('targetLanguage', lang.code)}
                    className="justify-start"
                  >
                    <span className="mr-2">{lang.flag}</span>
                    <span className="text-xs">{lang.name}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Translation Flow Indicator */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-xs font-medium mb-2">Translation Flow:</p>
              <div className="flex items-center gap-2 text-xs">
                {settings.autoDetect ? (
                  <>
                    <Badge variant="outline">Any Language</Badge>
                    <span>→</span>
                    <Badge variant="outline">Auto-Detect</Badge>
                    <span>→</span>
                    <Badge variant="default">
                      {LANGUAGES.find((l) => l.code === settings.targetLanguage)?.flag}{' '}
                      {LANGUAGES.find((l) => l.code === settings.targetLanguage)?.name}
                    </Badge>
                  </>
                ) : (
                  <>
                    <Badge variant="outline">
                      {LANGUAGES.find((l) => l.code === settings.sourceLanguage)?.flag}{' '}
                      {LANGUAGES.find((l) => l.code === settings.sourceLanguage)?.name}
                    </Badge>
                    <span>→</span>
                    <Badge variant="default">
                      {LANGUAGES.find((l) => l.code === settings.targetLanguage)?.flag}{' '}
                      {LANGUAGES.find((l) => l.code === settings.targetLanguage)?.name}
                    </Badge>
                  </>
                )}
              </div>
              {settings.bidirectional && (
                <p className="text-xs text-muted-foreground mt-2">
                  ↩️ AI responses will be translated back to the detected chat language
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
