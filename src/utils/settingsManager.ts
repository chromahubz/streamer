import type { TranslationConfig } from '../components/TranslationSettings';

interface AppSettings {
  translationSettings: TranslationConfig;
  selectedMasterPromptId: string | null;
  obsConnection: {
    url: string;
    password: string;
  };
  captureIntervals: {
    chat: number;
    gameplay: number;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  translationSettings: {
    enabled: false,
    autoDetect: true,
    sourceLanguage: 'en',
    targetLanguage: 'en',
    bidirectional: true,
  },
  selectedMasterPromptId: null,
  obsConnection: {
    url: 'ws://localhost:4455',
    password: '',
  },
  captureIntervals: {
    chat: 3000,
    gameplay: 12000,
  },
};

const STORAGE_KEY = 'streamer-assistant-settings';

export class SettingsManager {
  /**
   * Load all settings from localStorage
   */
  static loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return { ...DEFAULT_SETTINGS };
      }

      const parsed = JSON.parse(stored);

      // Merge with defaults to handle new settings
      return {
        ...DEFAULT_SETTINGS,
        ...parsed,
        translationSettings: {
          ...DEFAULT_SETTINGS.translationSettings,
          ...parsed.translationSettings,
        },
        obsConnection: {
          ...DEFAULT_SETTINGS.obsConnection,
          ...parsed.obsConnection,
        },
        captureIntervals: {
          ...DEFAULT_SETTINGS.captureIntervals,
          ...parsed.captureIntervals,
        },
      };
    } catch (error) {
      console.error('Failed to load settings:', error);
      return { ...DEFAULT_SETTINGS };
    }
  }

  /**
   * Save all settings to localStorage
   */
  static saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      console.log('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Update translation settings
   */
  static updateTranslationSettings(translationSettings: TranslationConfig): void {
    const settings = this.loadSettings();
    settings.translationSettings = translationSettings;
    this.saveSettings(settings);
  }

  /**
   * Update selected master prompt
   */
  static updateMasterPrompt(promptId: string): void {
    const settings = this.loadSettings();
    settings.selectedMasterPromptId = promptId;
    this.saveSettings(settings);
  }

  /**
   * Update OBS connection details
   */
  static updateOBSConnection(url: string, password: string): void {
    const settings = this.loadSettings();
    settings.obsConnection = { url, password };
    this.saveSettings(settings);
  }

  /**
   * Update capture intervals
   */
  static updateCaptureIntervals(chat: number, gameplay: number): void {
    const settings = this.loadSettings();
    settings.captureIntervals = { chat, gameplay };
    this.saveSettings(settings);
  }

  /**
   * Clear all settings (reset to defaults)
   */
  static clearSettings(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('Settings cleared');
    } catch (error) {
      console.error('Failed to clear settings:', error);
    }
  }

  /**
   * Export settings as JSON file
   */
  static exportSettings(): string {
    const settings = this.loadSettings();
    return JSON.stringify(settings, null, 2);
  }

  /**
   * Import settings from JSON string
   */
  static importSettings(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);

      // Validate structure
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Invalid settings format');
      }

      this.saveSettings(parsed);
      return true;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }
}

export type { AppSettings };
