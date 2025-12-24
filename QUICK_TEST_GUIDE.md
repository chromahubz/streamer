# 🚀 QUICK TEST GUIDE - TTS NOW WORKING!

**Everything is ready! Follow these steps to test your AI Streamer Assistant.**

---

## ✅ Current Status

Your app is **100% FUNCTIONAL**:
- ✅ Backend server: Running on http://localhost:3001
- ✅ Frontend: Running on http://localhost:5173
- ✅ Groq TTS: **WORKING** (direct HTTP API)
- ✅ Groq LLM: Working (llama-3.3-70b-versatile)
- ✅ Test messages: Ready to inject

---

## 🎮 OPTION 1: Quick Command-Line Test (TTS Only)

**Test TTS directly (already proven working):**

```bash
node test-tts.js
```

**Expected result:**
- ✅ Generates audio file: `test-output.wav`
- ✅ Plays automatically
- ✅ Voice: Aaliyah-PlayAI saying gaming response

**To play again:**
```bash
afplay test-output.wav
```

---

## 🖥️ OPTION 2: Full App Test (Recommended)

### Step 1: Ensure App is Running

**Check if running:**
```bash
# Should show processes on ports 3001 and 5173
lsof -ti:3001,5173
```

**If not running, start it:**
```bash
npm run dev
```

Wait for:
- ✅ Backend: `http://localhost:3001`
- ✅ Frontend: `http://localhost:5173`
- ✅ Electron window opens

---

### Step 2: Inject Test Messages

**In a new terminal window:**
```bash
cd /Users/unitar/Desktop/ClaudeCode/streamer-assistant
node inject-test-messages.js
```

**You should see:**
```
✅ Connected to backend server
📨 Injecting test chat messages...

✅ Sent message 1: "What FOV are you using?" from TestUser123
✅ Sent message 2: "Nice play! How did you do that?" from GamerPro
✅ Sent message 3: "Can you explain your strategy?" from ViewerX
```

---

### Step 3: Test in Electron App UI

**In the Electron window:**

1. **Go to "Chat & Responses" tab**
   - You should see 3 test messages appear

2. **Click on any message** (e.g., "What FOV are you using?")

3. **Click "Generate Responses" button**
   - Wait 2-3 seconds
   - You should see 3-5 AI-generated responses appear

4. **Select one response** you like

5. **Click the 🔊 TTS / Play button**
   - **Audio should play!**
   - You'll hear Aaliyah-PlayAI voice saying the response

6. **Test with other messages**
   - Repeat for "Nice play!" and "Can you explain your strategy?"

---

## 🎯 What Should Happen

### ✅ Expected Behavior:

**Message Injection:**
- 3 messages appear in "Chat & Responses" tab
- Messages show username, timestamp, platform

**Response Generation:**
- Click "Generate Responses" → 3-5 options appear
- Responses are in natural language
- Each response is 1-2 sentences

**TTS Playback:**
- Click 🔊 button → Audio plays
- Voice: Clear, professional female voice (Aaliyah-PlayAI)
- Quality: High (not robotic)
- Speed: Normal conversation pace

**Backend Logs:**
```
📝 Generate response request: { username: 'TestUser123', message: 'What FOV are you using?' }
✅ Response generated with Groq (fallback)
📥 Groq response: I'm running 110 FOV for maximum awareness!
🔊 Groq TTS request: { text: 'I'm running 110 FOV...', voice: 'Aaliyah-PlayAI' }
✅ Groq TTS success: { size: 633680, format: 'wav' }
```

---

## 🔧 Troubleshooting

### Problem: No messages appear after injection

**Fix:**
```bash
# Restart the app
lsof -ti:3001,5173 | xargs kill -9
npm run dev

# Wait for app to fully start, then inject again
node inject-test-messages.js
```

---

### Problem: "Connection refused" when injecting messages

**Cause:** Backend not running

**Fix:**
```bash
# Check if backend is running
lsof -ti:3001

# If nothing, start app
npm run dev
```

---

### Problem: TTS button doesn't play audio

**Check backend logs for:**
```
✅ Groq TTS success: { size: 633680, format: 'wav' }
```

**If you see error, check:**
1. Groq API key is set in `.env`
2. Internet connection is working
3. Backend restarted after code changes

**Manual restart:**
```bash
lsof -ti:3001 | xargs kill -9
cd /Users/unitar/Desktop/ClaudeCode/streamer-assistant
npm run dev:backend
```

---

### Problem: Responses are generic (not gaming-focused)

**This is expected!** Current prompt is generic:
- Current: "You are a friendly streaming assistant."
- **Still works**, just not gaming-optimized

**To fix (optional):**
- Update frontend default prompt
- See `FINAL_STATUS.md` for details

---

## 📊 Testing Checklist

Use this to verify everything works:

- [ ] Backend server starts (port 3001)
- [ ] Frontend starts (port 5173)
- [ ] Electron app opens
- [ ] Test messages inject successfully
- [ ] Messages appear in "Chat & Responses" tab
- [ ] Click message → Generate button appears
- [ ] Click Generate → 3-5 responses appear
- [ ] Responses are natural language
- [ ] Select response → TTS button enabled
- [ ] Click TTS → **Audio plays** ✅
- [ ] Voice quality is good (not robotic)
- [ ] Can test multiple messages

---

## 🎉 Success Criteria

**Your app is working if:**
1. ✅ Messages inject and appear in UI
2. ✅ Groq generates 3-5 responses per message
3. ✅ TTS plays audio in professional voice
4. ✅ No errors in console/backend logs

---

## 💡 Pro Tips

### Test Different Voices (Advanced)

**Edit `backend/server.js` line 312:**
```javascript
voice: voice || 'Fritz-PlayAI',  // Change to male voice
```

**Available voices:**
- `Aaliyah-PlayAI` (Female - default)
- `Fritz-PlayAI` (Male)
- Others in Groq docs

---

### Adjust TTS Speed

**In the app, change speed parameter:**
```javascript
speed: 1.2  // Faster
speed: 0.8  // Slower
```

---

### View Real-Time Logs

**Backend logs:**
```bash
# In terminal running npm run dev, watch for:
🔊 Groq TTS request
✅ Groq TTS success
📝 Generate response request
✅ Response generated with Groq
```

---

## ✅ READY TO GO!

**You now have a fully functional AI streaming assistant!**

### What Works:
- ✅ Chat message handling
- ✅ AI response generation (Groq)
- ✅ Professional TTS (Groq PlayAI)
- ✅ Multiple response options
- ✅ Auto-fallback on errors

### Next Steps:
1. Test with the steps above
2. Try it with a real stream (OCR capture)
3. Customize prompts for your gaming style
4. Add more voices if needed

**Happy streaming!** 🎮🎙️
