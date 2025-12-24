const GoogleTTSService = require('./backend/services/google-tts.service');
const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Google Cloud TTS Service\n');

const googleTTS = new GoogleTTSService();

async function test() {
  try {
    // Check if configured
    if (!googleTTS.isConfigured()) {
      console.error('❌ Google TTS not configured');
      console.log('\n📝 To fix this:');
      console.log('1. Go to: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
      console.log('2. Click "Enable" for Text-to-Speech API');
      console.log('3. Your GEMINI_API_KEY should work for TTS');
      console.log('4. Or create a new Google Cloud API key');
      process.exit(1);
    }

    console.log('✅ Google TTS service initialized\n');

    // Test text
    const testText = "Hello! This is a test of Google Cloud Text-to-Speech. I'm using the Neural2 voice for high quality!";

    console.log(`📝 Converting text to speech:`);
    console.log(`"${testText}"\n`);

    // Generate TTS
    const result = await googleTTS.textToSpeech(testText, {
      voice: 'en-US-Neural2-F',
      speed: 1.0,
      languageCode: 'en-US'
    });

    console.log('✅ TTS generation successful!');
    console.log('📊 Audio details:', {
      type: result.type,
      format: result.format,
      size: result.audio.length,
      sizeKB: (result.audio.length / 1024).toFixed(2) + ' KB'
    });

    // Save to file
    const outputPath = path.join(__dirname, 'test-google-output.wav');
    fs.writeFileSync(outputPath, result.audio);

    console.log(`\n💾 Audio saved to: ${outputPath}`);
    console.log('🎵 You can play it with: afplay test-google-output.wav');

    console.log('\n✅ GOOGLE TTS TEST SUCCESSFUL!');
    console.log('🎉 Your fallback system is fully operational!');

  } catch (error) {
    console.error('\n❌ Google TTS Test Failed:');
    console.error('Error:', error.message);

    if (error.message.includes('permission') || error.message.includes('PERMISSION_DENIED')) {
      console.log('\n📝 Fix: Enable Text-to-Speech API:');
      console.log('1. Go to: https://console.cloud.google.com/apis/library/texttospeech.googleapis.com');
      console.log('2. Click "Enable"');
      console.log('3. Wait 1-2 minutes and try again');
    } else if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
      console.log('\n📝 Fix: You have exceeded your quota');
      console.log('- Free tier: 1M characters/month (Neural2)');
      console.log('- Check usage: https://console.cloud.google.com/apis/api/texttospeech.googleapis.com/metrics');
    } else if (error.message.includes('API key')) {
      console.log('\n📝 Fix: Check your API key');
      console.log('- Make sure GEMINI_API_KEY is set in .env');
      console.log('- Or configure a separate Google Cloud API key');
    }

    process.exit(1);
  }
}

test();
