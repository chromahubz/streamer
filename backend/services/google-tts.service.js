const textToSpeech = require('@google-cloud/text-to-speech');

class GoogleTTSService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY; // Google Cloud uses same key

    if (this.apiKey) {
      try {
        // Initialize the client with API key
        this.client = new textToSpeech.TextToSpeechClient({
          apiKey: this.apiKey
        });
      } catch (error) {
        console.warn('Google TTS client initialization failed:', error.message);
        this.client = null;
      }
    }
  }

  isConfigured() {
    return !!this.client;
  }

  // Text-to-Speech using Google Cloud TTS
  async textToSpeech(text, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Google Cloud TTS not configured');
    }

    try {
      console.log('🔊 Google TTS request:', {
        text: text.substring(0, 50),
        voice: options.voice,
        language: options.languageCode
      });

      // Construct the request
      const request = {
        input: { text: text },
        voice: {
          languageCode: options.languageCode || 'en-US',
          name: options.voice || 'en-US-Neural2-F', // Female neural voice
          ssmlGender: options.gender || 'FEMALE',
        },
        audioConfig: {
          audioEncoding: 'LINEAR16', // WAV format
          speakingRate: options.speed || 1.0,
          pitch: options.pitch || 0.0,
          volumeGainDb: options.volume || 0.0,
        },
      };

      // Perform the text-to-speech request
      const [response] = await this.client.synthesizeSpeech(request);

      console.log('✅ Google TTS success:', {
        size: response.audioContent.length,
        format: 'wav'
      });

      return {
        type: 'audio/wav',
        audio: response.audioContent,
        format: 'wav'
      };
    } catch (error) {
      console.error('Google TTS error:', error);
      throw error;
    }
  }

  // Get available voices
  async getAvailableVoices(languageCode = 'en-US') {
    if (!this.isConfigured()) {
      throw new Error('Google Cloud TTS not configured');
    }

    try {
      const [response] = await this.client.listVoices({ languageCode });
      return response.voices;
    } catch (error) {
      console.error('Google TTS voice list error:', error);
      return [];
    }
  }
}

module.exports = GoogleTTSService;
