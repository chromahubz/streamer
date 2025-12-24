const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY;
    if (this.apiKey) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.visionModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      this.textModel = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    }
  }

  isConfigured() {
    return !!this.apiKey;
  }

  // Extract chat messages from screenshot using OCR
  async extractChatMessages(screenshotBase64) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
Analyze this screenshot of a live streaming chat display.

Extract ALL visible chat messages in this exact JSON format:
{
  "messages": [
    {
      "platform": "twitch|youtube|kick|tiktok|unknown",
      "username": "string",
      "message": "string",
      "timestamp": "HH:MM:SS or relative time"
    }
  ]
}

Rules:
- Identify the platform by logo, color scheme, or layout
- Extract username exactly as shown
- Extract complete message text
- Include timestamp if visible (or use "now" if not shown)
- Ignore emotes, badges, or UI elements
- Only include chat messages, not system messages
- Return valid JSON only, no other text
`;

    try {
      const result = await this.visionModel.generateContent([
        {
          inlineData: {
            data: screenshotBase64.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: 'image/png'
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('No JSON found in Gemini response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.messages || [];
    } catch (error) {
      console.error('Gemini chat OCR error:', error);
      return [];
    }
  }

  // Analyze gameplay screenshot
  async analyzeGameplay(screenshotBase64) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
Analyze this gameplay screenshot and provide context in JSON format:
{
  "game": "game name or 'unknown'",
  "scene": "brief description of what's happening",
  "action": "what the player appears to be doing",
  "state": "winning|losing|neutral|stuck|loading",
  "notable": "any notable elements (score, health, enemies, etc.)"
}

Be concise but specific. This will be used to inform AI responses to chat.
Return valid JSON only, no other text.
`;

    try {
      const result = await this.visionModel.generateContent([
        {
          inlineData: {
            data: screenshotBase64.replace(/^data:image\/\w+;base64,/, ''),
            mimeType: 'image/png'
          }
        },
        { text: prompt }
      ]);

      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { game: 'unknown', scene: 'unknown', action: 'unknown', state: 'neutral', notable: '' };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini gameplay analysis error:', error);
      return { game: 'unknown', scene: 'unknown', action: 'unknown', state: 'neutral', notable: '' };
    }
  }

  // Build formatted prompt from master prompt object
  buildFormattedPrompt(masterPrompt, chatMessage, context) {
    let fullPrompt = '';

    // If masterPrompt is an object (master prompt structure)
    if (typeof masterPrompt === 'object' && masterPrompt.personality) {
      const mp = masterPrompt;

      fullPrompt += `${mp.personality}\n\n`;

      if (mp.responseStyle) {
        fullPrompt += `RESPONSE STYLE:\n`;
        fullPrompt += `- Length: ${mp.responseStyle.length}\n`;
        fullPrompt += `- Tone: ${mp.responseStyle.tone}\n`;
        fullPrompt += `- Language: ${mp.responseStyle.language}\n`;
        fullPrompt += `- Emojis: ${mp.responseStyle.emojis}\n`;
        fullPrompt += `- Punctuation: ${mp.responseStyle.punctuation}\n\n`;
      }

      if (mp.contextualRules) {
        fullPrompt += `HOW TO RESPOND:\n`;
        fullPrompt += `- Questions: ${mp.contextualRules.questions}\n`;
        fullPrompt += `- Comments: ${mp.contextualRules.comments}\n`;
        fullPrompt += `- Trolls: ${mp.contextualRules.trolls}\n`;
        fullPrompt += `- New followers: ${mp.contextualRules.newFollowers}\n\n`;
      }

      if (mp.gameAwareness && context.gameplay && context.gameplay.game !== 'unknown') {
        fullPrompt += `GAME CONTEXT:\n`;
        fullPrompt += `- Game: ${context.gameplay.game}\n`;
        fullPrompt += `- Scene: ${context.gameplay.scene}\n`;
        fullPrompt += `- Action: ${context.gameplay.action}\n`;
        fullPrompt += `- State: ${context.gameplay.state}\n`;
        fullPrompt += `- Commentary focus: ${mp.gameAwareness.commentaryFocus}\n\n`;
      }
    } else {
      // Simple string prompt
      fullPrompt = `${masterPrompt}\n\n`;

      if (context.gameplay && context.gameplay.game !== 'unknown') {
        fullPrompt += `Current game context:\n`;
        fullPrompt += `- Game: ${context.gameplay.game}\n`;
        fullPrompt += `- Scene: ${context.gameplay.scene}\n`;
        fullPrompt += `- Player action: ${context.gameplay.action}\n`;
        fullPrompt += `- State: ${context.gameplay.state}\n\n`;
      }
    }

    if (context.recentChat && context.recentChat.length > 0) {
      fullPrompt += `Recent chat messages:\n`;
      context.recentChat.slice(-5).forEach(msg => {
        fullPrompt += `[${msg.platform}] ${msg.username}: ${msg.message}\n`;
      });
      fullPrompt += '\n';
    }

    fullPrompt += `Respond to this chat message:\n${chatMessage.username}: ${chatMessage.message}\n\nYour response:`;

    return fullPrompt;
  }

  // Generate AI response to chat message
  async generateResponse(chatMessage, masterPrompt, context) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const fullPrompt = this.buildFormattedPrompt(masterPrompt, chatMessage, context);

    try {
      const result = await this.textModel.generateContent(fullPrompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Gemini response generation error:', error);
      throw error;
    }
  }

  // Generate multiple AI response options
  async generateMultipleResponses(chatMessage, masterPrompt, context, count = 3) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const basePrompt = this.buildFormattedPrompt(masterPrompt, chatMessage, context);
    const multiPrompt = basePrompt + `\n\nGenerate ${count} different response options. Each should be unique in style or approach. Format as a JSON array of strings like: ["response 1", "response 2", "response 3"]`;

    try {
      const result = await this.textModel.generateContent(multiPrompt);
      const response = await result.response;
      const text = response.text().trim();

      // Try to parse JSON array
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const responses = JSON.parse(jsonMatch[0]);
        return responses.slice(0, count);
      }

      // Fallback: split by newlines or generate individually
      const lines = text.split('\n').filter(l => l.trim() && !l.includes('[') && !l.includes(']'));
      if (lines.length >= count) {
        return lines.slice(0, count);
      }

      // Last resort: generate individually
      const responses = [];
      for (let i = 0; i < count; i++) {
        const variantPrompt = basePrompt + `\n\n(Variation ${i + 1})`;
        const result = await this.textModel.generateContent(variantPrompt);
        const response = await result.response;
        responses.push(response.text().trim());

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      return responses;
    } catch (error) {
      console.error('Gemini multiple response generation error:', error);
      throw error;
    }
  }

  // Detect language and translate text
  async translateText(text, targetLanguage) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured');
    }

    const prompt = `
Detect the language of this text and translate it to ${targetLanguage}.

Text: "${text}"

Respond in JSON format:
{
  "sourceLanguage": "detected language code (en, es, fr, etc.)",
  "targetLanguage": "${targetLanguage}",
  "originalText": "${text}",
  "translatedText": "translation here"
}

Return valid JSON only.
`;

    try {
      const result = await this.textModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          sourceLanguage: 'unknown',
          targetLanguage,
          originalText: text,
          translatedText: text
        };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('Gemini translation error:', error);
      return {
        sourceLanguage: 'unknown',
        targetLanguage,
        originalText: text,
        translatedText: text
      };
    }
  }
}

module.exports = GeminiService;
