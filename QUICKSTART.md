# Quick Start Guide

Get AI Streamer Assistant running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

Wait for all packages to install (takes 1-2 minutes).

## Step 2: Get Your API Keys

### Gemini API Key (Required)
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### Groq API Key (Required for Voice)
1. Go to https://console.groq.com
2. Sign up for a free account
3. Go to API Keys section
4. Create a new key
5. Copy the key

## Step 3: Add API Keys

Create a `.env` file (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and paste your keys:

```env
GEMINI_API_KEY=your_gemini_key_here
GROQ_API_KEY=your_groq_key_here
```

## Step 4: Start the App

```bash
npm run dev
```

This starts:
- Backend server (port 3001)
- Frontend (port 5173)
- Electron app window

## Step 5: Configure Your Setup

### In the Electron App:

1. **Choose a Personality** (Setup tab)
   - Click on one of 4 preset personalities
   - Energetic Gamer, Chill Commentator, Educational, or Sarcastic

2. **Select Monitors** (Setup tab, scroll down)
   - Click "Get Available Sources"
   - Select your chat display monitor
   - Select your gameplay monitor
   - Click "Start Capture" for each

3. **Go to Chat & Responses Tab**
   - Watch chat messages appear from OCR
   - Click on a message
   - Click "Generate Response"
   - See 3-5 AI response options
   - Click on one to select it
   - Click "Play TTS" to hear it

## That's It!

You're now capturing chat, generating AI responses, and ready to stream!

## Optional Setup

### Enable Translation

1. Go to Setup tab
2. Find "Translation Settings"
3. Toggle "Enable Translation"
4. Select source and target languages
5. Enable "Bidirectional" if you want both directions

### Connect to OBS

1. Open OBS Studio
2. Go to Tools → WebSocket Server Settings
3. Enable WebSocket server
4. Set a password (optional)
5. In the app, go to Setup tab
6. Find "OBS Connection"
7. Enter URL: `ws://localhost:4455`
8. Enter password (if you set one)
9. Click "Connect"

### Use Voice Input

1. Go to Setup tab
2. Find "Voice Input"
3. Click "Start Recording"
4. Speak your message
5. Click "Stop Recording"
6. Your voice will be transcribed and translated

## Troubleshooting

### Backend shows "Disconnected"
- Make sure backend is running: `npm run dev:backend`
- Check that port 3001 is not in use

### Chat messages not showing
- Ensure you selected the correct monitor
- Check that chat is visible on the monitor
- Verify your Gemini API key is correct

### "Gemini API key not configured"
- Double-check your `.env` file
- Restart the backend: `Ctrl+C` then `npm run dev:backend`

### Screen capture permission denied (macOS)
- Go to System Preferences → Security & Privacy → Screen Recording
- Enable permission for Electron

### Microphone not working
- Grant microphone permission in your browser
- Check browser console for errors

## Tips

1. **Save API Costs**: Increase capture intervals in Settings
   - Chat: 3-5 seconds is good
   - Gameplay: 12-15 seconds is recommended

2. **Better Responses**: Choose a personality that matches your stream style

3. **Multi-Language**: Enable translation if you stream to international audience

4. **Check Stats**: Go to Stats tab to see OCR performance and optimization

## Next Steps

- Read the full [README.md](README.md) for detailed features
- Check [PHASE1_UPDATES.md](PHASE1_UPDATES.md) through [PHASE4_UPDATES.md](PHASE4_UPDATES.md) for implementation details
- Customize master prompts in `public/master-prompts.json`
- Explore all settings in the Setup tab

## Need Help?

- Check the [README.md](README.md) Troubleshooting section
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development help
- Open an issue on GitHub

Happy streaming! 🎮🎙️
