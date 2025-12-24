require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const GeminiService = require('./services/gemini.service');
const GroqService = require('./services/groq.service');
const GoogleTTSService = require('./services/google-tts.service');
const OBSService = require('./services/obs.service');
const OCROptimizerService = require('./services/ocr-optimizer.service');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize AI services
const geminiService = new GeminiService();
const groqService = new GroqService();
const googleTTSService = new GoogleTTSService();
const obsService = new OBSService();
const ocrOptimizer = new OCROptimizerService();

// Store for chat messages and context
const chatMessages = [];
const gameplayContext = {
  lastUpdate: null,
  game: null,
  scene: null,
  action: null,
  state: null
};

// Store last screenshots for comparison
let lastChatScreenshot = null;
let lastGameplayScreenshot = null;

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Send current state to new client
  socket.emit('chat-history', chatMessages.slice(-50)); // Last 50 messages
  socket.emit('gameplay-context', gameplayContext);

  // Handle chat screenshot OCR
  socket.on('process-chat-screenshot', async (data) => {
    try {
      const { screenshot } = data;

      // Optimization 1: Check for duplicate screenshots
      if (ocrOptimizer.isDuplicate(screenshot)) {
        socket.emit('chat-ocr-result', {
          success: true,
          messageCount: 0,
          skipped: true,
          reason: 'duplicate'
        });
        return;
      }

      // Optimization 2: Check for significant changes
      if (!ocrOptimizer.hasSignificantChange(screenshot, lastChatScreenshot, 5)) {
        socket.emit('chat-ocr-result', {
          success: true,
          messageCount: 0,
          skipped: true,
          reason: 'no-significant-change'
        });
        lastChatScreenshot = screenshot; // Update for next comparison
        return;
      }

      // Store screenshot for next comparison
      lastChatScreenshot = screenshot;

      // Extract chat messages from screenshot using Gemini Vision
      const messages = await geminiService.extractChatMessages(screenshot);

      // Filter new messages (compare with existing)
      const newMessages = messages.filter(msg => {
        return !chatMessages.some(existing =>
          existing.username === msg.username &&
          existing.message === msg.message &&
          Math.abs(new Date(existing.timestamp) - new Date(msg.timestamp)) < 5000
        );
      });

      // Add new messages to store
      chatMessages.push(...newMessages);

      // Keep only last 200 messages
      if (chatMessages.length > 200) {
        chatMessages.splice(0, chatMessages.length - 200);
      }

      // Optimization 3: Update activity tracking
      ocrOptimizer.updateActivity(chatMessages.length);
      if (newMessages.length > 0) {
        ocrOptimizer.resetActivity();
      }

      // Broadcast new messages to all clients
      newMessages.forEach(msg => {
        io.emit('new-chat-message', msg);
      });

      // Send adaptive interval recommendation
      const recommendedInterval = ocrOptimizer.getAdaptiveInterval();
      socket.emit('chat-ocr-result', {
        success: true,
        messageCount: newMessages.length,
        skipped: false,
        recommendedInterval
      });
    } catch (error) {
      console.error('Chat OCR error:', error);
      socket.emit('chat-ocr-error', { error: error.message });
    }
  });

  // Handle gameplay screenshot analysis
  socket.on('process-gameplay-screenshot', async (data) => {
    try {
      const { screenshot } = data;

      // Optimization: Check for significant changes (gameplay changes slower than chat)
      if (!ocrOptimizer.hasSignificantChange(screenshot, lastGameplayScreenshot, 10)) {
        socket.emit('gameplay-analysis-result', {
          success: true,
          skipped: true,
          reason: 'no-significant-change'
        });
        lastGameplayScreenshot = screenshot;
        return;
      }

      // Store screenshot for next comparison
      lastGameplayScreenshot = screenshot;

      // Analyze gameplay with Gemini Vision
      const context = await geminiService.analyzeGameplay(screenshot);

      // Update gameplay context
      Object.assign(gameplayContext, {
        ...context,
        lastUpdate: new Date().toISOString()
      });

      // Broadcast updated context
      io.emit('gameplay-context', gameplayContext);

      socket.emit('gameplay-analysis-result', { success: true, skipped: false });
    } catch (error) {
      console.error('Gameplay analysis error:', error);
      socket.emit('gameplay-analysis-error', { error: error.message });
    }
  });

  // Generate AI response (single or multiple)
  socket.on('generate-response', async (data) => {
    try {
      const { chatMessage, masterPrompt, includeGameplayContext, count = 1, translationSettings } = data;

      // Debug logging
      console.log('📝 Generate response request:', {
        username: chatMessage?.username,
        message: chatMessage?.message,
        messageType: typeof chatMessage?.message,
        fullMessage: JSON.stringify(chatMessage)
      });

      // Fix masterPrompt if it's an object
      let promptString = masterPrompt;
      if (typeof masterPrompt === 'object' && masterPrompt !== null) {
        promptString = masterPrompt.masterPrompt || masterPrompt.prompt || 'You are a friendly streaming assistant.';
      } else if (!masterPrompt) {
        promptString = 'You are a friendly, energetic gaming streamer. Keep responses short (1-2 sentences), casual, and engaging.';
      }
      console.log('📝 Using prompt:', promptString.substring(0, 100));

      // Build context for AI
      const context = {
        recentChat: chatMessages.slice(-10),
        gameplay: includeGameplayContext ? gameplayContext : null
      };

      // Detect message language if translation enabled and autoDetect is on
      let detectedLanguage = null;
      if (translationSettings?.enabled && translationSettings?.autoDetect) {
        try {
          const detectionResult = await geminiService.translateText(
            chatMessage.message,
            'en' // Dummy target, we just want detection
          );
          detectedLanguage = detectionResult.detectedLanguage || translationSettings.sourceLanguage;
        } catch (err) {
          console.error('Language detection error:', err);
          detectedLanguage = translationSettings.sourceLanguage;
        }
      } else if (translationSettings?.enabled) {
        detectedLanguage = translationSettings.sourceLanguage;
      }

      if (count === 1) {
        // Single response - Try Gemini first, fallback to Groq
        let response;
        try {
          response = await geminiService.generateResponse(
            chatMessage,
            promptString,
            context
          );
          console.log('✅ Response generated with Gemini');
        } catch (geminiError) {
          console.log('⚠️  Gemini failed, using Groq fallback...');
          // Fallback to Groq
          const prompt = `${promptString}\n\nUser (${chatMessage.username}): ${chatMessage.message}\n\nRespond naturally in 1-2 sentences:`;
          console.log('📤 Groq prompt:', prompt.substring(0, 200));
          response = await groqService.generateText(prompt, {
            model: 'llama-3.3-70b-versatile',
            temperature: 0.8,
            maxTokens: 150
          });
          console.log('✅ Response generated with Groq (fallback)');
          console.log('📥 Groq response:', response.substring(0, 100));
        }

        // Translate response if bidirectional translation enabled
        if (translationSettings?.enabled && translationSettings?.bidirectional && detectedLanguage && detectedLanguage !== translationSettings.targetLanguage) {
          try {
            const translationResult = await geminiService.translateText(response, detectedLanguage);
            response = translationResult.translatedText;
          } catch (err) {
            console.error('Response translation error:', err);
          }
        }

        socket.emit('ai-response', { response, detectedLanguage });
      } else {
        // Multiple responses - Try Gemini first, fallback to Groq
        let responses;
        try {
          responses = await geminiService.generateMultipleResponses(
            chatMessage,
            promptString,
            context,
            count
          );
          console.log(`✅ ${count} responses generated with Gemini`);
        } catch (geminiError) {
          console.log('⚠️  Gemini failed, using Groq fallback for multiple responses...');
          // Fallback to Groq - generate multiple responses
          const basePrompt = `${promptString}\n\nUser (${chatMessage.username}): ${chatMessage.message}\n\nRespond naturally in 1-2 sentences:`;
          console.log('📤 Groq base prompt:', basePrompt.substring(0, 200));
          responses = await Promise.all(
            Array.from({ length: count }, async (_, i) => {
              const prompt = `${basePrompt}\n\nVariation ${i + 1} (be creative and different):`;
              return await groqService.generateText(prompt, {
                model: 'llama-3.3-70b-versatile',
                temperature: 0.7 + (i * 0.1), // Vary temperature for diversity
                maxTokens: 150
              });
            })
          );
          console.log(`✅ ${count} responses generated with Groq (fallback)`);
          console.log('📥 First Groq response:', responses[0]?.substring(0, 100));
        }

        // Translate all responses if bidirectional translation enabled
        if (translationSettings?.enabled && translationSettings?.bidirectional && detectedLanguage && detectedLanguage !== translationSettings.targetLanguage) {
          try {
            const translatedResponses = await Promise.all(
              responses.map(async (response) => {
                try {
                  const result = await geminiService.translateText(response, detectedLanguage);
                  return result.translatedText;
                } catch (err) {
                  console.error('Response translation error:', err);
                  return response; // Fallback to original
                }
              })
            );
            responses = translatedResponses;
          } catch (err) {
            console.error('Batch translation error:', err);
          }
        }

        socket.emit('ai-responses', { responses, detectedLanguage });
      }
    } catch (error) {
      console.error('Response generation error:', error);
      socket.emit('ai-response-error', { error: error.message });
    }
  });

  // Generate TTS with automatic fallback
  socket.on('generate-tts', async (data) => {
    try {
      const { text, voice, speed } = data;
      let result;
      let provider = 'unknown';

      // Try Groq TTS first (primary)
      if (groqService.isConfigured()) {
        try {
          console.log('🔊 Attempting Groq TTS...');
          result = await groqService.textToSpeech(text, {
            voice: voice || 'Aaliyah-PlayAI',
            speed: speed || 1.0,
            format: 'wav'
          });
          provider = 'groq';
          console.log('✅ Groq TTS succeeded');
        } catch (groqError) {
          console.warn('⚠️  Groq TTS failed:', groqError.message);
          console.log('🔄 Falling back to Google Cloud TTS...');

          // Fallback to Google Cloud TTS
          if (googleTTSService.isConfigured()) {
            try {
              result = await googleTTSService.textToSpeech(text, {
                voice: voice || 'en-US-Neural2-F',
                speed: speed || 1.0,
                languageCode: 'en-US'
              });
              provider = 'google';
              console.log('✅ Google TTS succeeded (fallback)');
            } catch (googleError) {
              console.error('❌ Google TTS also failed:', googleError.message);
              throw new Error('Both Groq and Google TTS failed. Check your API keys and quotas.');
            }
          } else {
            throw new Error('Groq TTS failed and Google TTS not configured. Please configure at least one TTS service.');
          }
        }
      } else if (googleTTSService.isConfigured()) {
        // Use Google TTS directly if Groq not configured
        console.log('🔊 Using Google Cloud TTS (Groq not configured)...');
        result = await googleTTSService.textToSpeech(text, {
          voice: voice || 'en-US-Neural2-F',
          speed: speed || 1.0,
          languageCode: 'en-US'
        });
        provider = 'google';
        console.log('✅ Google TTS succeeded');
      } else {
        throw new Error('No TTS service configured. Please configure Groq or Google Cloud TTS.');
      }

      // Send audio buffer as base64
      const audioBase64 = result.audio.toString('base64');

      socket.emit('tts-audio', {
        audio: audioBase64,
        type: result.type,
        format: result.format,
        provider: provider // Let frontend know which service was used
      });
    } catch (error) {
      console.error('TTS generation error:', error);
      socket.emit('tts-error', { error: error.message });
    }
  });

  // Translate text
  socket.on('translate-text', async (data) => {
    try {
      const { text, targetLanguage } = data;

      // Detect source language and translate using Gemini
      const result = await geminiService.translateText(text, targetLanguage);

      socket.emit('translation-result', result);
    } catch (error) {
      console.error('Translation error:', error);
      socket.emit('translation-error', { error: error.message });
    }
  });

  // Transcribe voice using Groq Whisper
  socket.on('transcribe-voice', async (data) => {
    try {
      const { audioData, language } = data;

      // Convert base64 audio to buffer
      const audioBuffer = Buffer.from(audioData.split(',')[1], 'base64');

      // Create a temporary file for Groq API (Whisper requires file input)
      const fs = require('fs');
      const path = require('path');
      const os = require('os');
      const tempFilePath = path.join(os.tmpdir(), `voice_${Date.now()}.webm`);

      fs.writeFileSync(tempFilePath, audioBuffer);

      // Transcribe using Groq Whisper
      const transcription = await groqService.speechToText(
        fs.createReadStream(tempFilePath),
        { language }
      );

      // Clean up temp file
      fs.unlinkSync(tempFilePath);

      socket.emit('transcription-result', transcription);
    } catch (error) {
      console.error('Voice transcription error:', error);
      socket.emit('transcription-error', { error: error.message });
    }
  });

  // OBS WebSocket - Connect
  socket.on('obs-connect', async (data) => {
    try {
      const { url, password } = data;
      const result = await obsService.connect(url, password);
      socket.emit('obs-connect-result', result);

      // Broadcast connection status to all clients
      io.emit('obs-status', obsService.getConnectionStatus());
    } catch (error) {
      console.error('OBS connect error:', error);
      socket.emit('obs-connect-error', { error: error.message });
    }
  });

  // OBS WebSocket - Disconnect
  socket.on('obs-disconnect', async () => {
    try {
      await obsService.disconnect();
      socket.emit('obs-disconnect-result', { success: true });
      io.emit('obs-status', obsService.getConnectionStatus());
    } catch (error) {
      console.error('OBS disconnect error:', error);
      socket.emit('obs-disconnect-error', { error: error.message });
    }
  });

  // OBS - Get scenes
  socket.on('obs-get-scenes', async () => {
    try {
      const scenes = await obsService.getSceneList();
      socket.emit('obs-scenes', scenes);
    } catch (error) {
      console.error('OBS get scenes error:', error);
      socket.emit('obs-error', { error: error.message });
    }
  });

  // OBS - Set current scene
  socket.on('obs-set-scene', async (data) => {
    try {
      const { sceneName } = data;
      const result = await obsService.setCurrentScene(sceneName);
      socket.emit('obs-scene-changed', result);
    } catch (error) {
      console.error('OBS set scene error:', error);
      socket.emit('obs-error', { error: error.message });
    }
  });

  // OBS - Get stream status
  socket.on('obs-get-stream-status', async () => {
    try {
      const status = await obsService.getStreamStatus();
      socket.emit('obs-stream-status', status);
    } catch (error) {
      console.error('OBS get stream status error:', error);
      socket.emit('obs-error', { error: error.message });
    }
  });

  // OBS - Get connection status
  socket.on('obs-get-status', () => {
    socket.emit('obs-status', obsService.getConnectionStatus());
  });

  // OCR Optimizer - Get stats
  socket.on('ocr-get-stats', () => {
    socket.emit('ocr-stats', ocrOptimizer.getStats());
  });

  // OCR Optimizer - Clear cache
  socket.on('ocr-clear-cache', () => {
    ocrOptimizer.clearCache();
    socket.emit('ocr-cache-cleared', { success: true });
  });

  // TEST: Allow manually injecting chat messages for testing
  socket.on('test-inject-message', (message) => {
    console.log('Test message injected:', message.message);
    chatMessages.push(message);
    io.emit('new-chat-message', message);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    services: {
      gemini: geminiService.isConfigured(),
      groq: groqService.isConfigured(),
      obs: obsService.getConnectionStatus().isConnected
    },
    ocrOptimizer: ocrOptimizer.getStats()
  });
});

// Start server
const PORT = process.env.BACKEND_PORT || 3001;
server.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Services configured:');
  console.log('  - Gemini:', geminiService.isConfigured() ? '✓' : '✗');
  console.log('  - Groq:', groqService.isConfigured() ? '✓' : '✗');
});
