const Groq = require('groq-sdk');

class GroqService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    if (this.apiKey) {
      this.groq = new Groq({ apiKey: this.apiKey });
    }
  }

  isConfigured() {
    return !!this.apiKey;
  }

  // Text-to-Speech using Groq PlayAI TTS (Direct HTTP API)
  async textToSpeech(text, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    try {
      console.log('🔊 Groq TTS request:', { text: text.substring(0, 50), voice: options.voice });

      // Use direct HTTP API call instead of broken SDK
      const https = require('https');

      const payload = JSON.stringify({
        model: options.model || 'playai-tts',
        voice: options.voice || 'Aaliyah-PlayAI', // Default voice
        response_format: options.format || 'wav', // wav, mp3, opus
        input: text,
        speed: options.speed || 1.0, // 0.25 to 4.0
      });

      return new Promise((resolve, reject) => {
        const req = https.request({
          hostname: 'api.groq.com',
          path: '/openai/v1/audio/speech',
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        }, (res) => {
          const chunks = [];

          res.on('data', (chunk) => {
            chunks.push(chunk);
          });

          res.on('end', () => {
            if (res.statusCode === 200) {
              const buffer = Buffer.concat(chunks);
              console.log('✅ Groq TTS success:', { size: buffer.length, format: options.format || 'wav' });

              resolve({
                type: 'audio/wav',
                audio: buffer,
                format: options.format || 'wav'
              });
            } else {
              const errorBody = Buffer.concat(chunks).toString();
              console.error('Groq TTS API error:', res.statusCode, errorBody);
              reject(new Error(`Groq TTS failed: ${res.statusCode} - ${errorBody}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('Groq TTS request error:', error);
          reject(error);
        });

        req.write(payload);
        req.end();
      });
    } catch (error) {
      console.error('Groq TTS error:', error);
      throw error;
    }
  }

  // Speech-to-Text using Groq Whisper
  async speechToText(audioFile, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    try {
      // Groq supports Whisper Large V3 for transcription
      const transcription = await this.groq.audio.transcriptions.create({
        file: audioFile, // File object or path
        model: 'whisper-large-v3',
        language: options.language || undefined, // Auto-detect if not specified
        response_format: 'verbose_json', // Get detailed response with language detection
        temperature: options.temperature || 0.0, // Lower for more accurate transcription
      });

      return {
        text: transcription.text,
        language: transcription.language || options.language || 'en',
        duration: transcription.duration,
        segments: transcription.segments || []
      };
    } catch (error) {
      console.error('Groq Whisper STT error:', error);
      throw error;
    }
  }

  // Use Groq for fast text generation (alternative to Gemini for simple responses)
  async generateText(prompt, options = {}) {
    if (!this.isConfigured()) {
      throw new Error('Groq API key not configured');
    }

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        model: options.model || 'mixtral-8x7b-32768', // Fast inference model
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 200,
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Groq text generation error:', error);
      throw error;
    }
  }
}

module.exports = GroqService;
