const io = require('socket.io-client');
const fs = require('fs');
const path = require('path');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to backend server');
  console.log('🔊 Testing Groq TTS...\n');

  setTimeout(() => {
    // Test TTS with a simple message
    const testText = "Hey chat! Thanks for the question! I'm using a high FOV for better visibility.";

    console.log(`📝 Requesting TTS for: "${testText}"\n`);

    socket.emit('generate-tts', {
      text: testText,
      voice: 'Aaliyah-PlayAI',
      speed: 1.0
    });
  }, 1000);
});

socket.on('tts-audio', (data) => {
  console.log('✅ TTS Audio received!');
  console.log('📊 Audio details:', {
    type: data.type,
    format: data.format,
    size: data.audio.length,
    sizeKB: (data.audio.length / 1024).toFixed(2) + ' KB'
  });

  // Save audio to file for verification
  const audioBuffer = Buffer.from(data.audio, 'base64');
  const outputPath = path.join(__dirname, 'test-output.wav');

  fs.writeFileSync(outputPath, audioBuffer);
  console.log(`\n💾 Audio saved to: ${outputPath}`);
  console.log('🎵 You can play it with: afplay test-output.wav');

  console.log('\n✅ TTS TEST SUCCESSFUL!');
  process.exit(0);
});

socket.on('tts-error', (data) => {
  console.error('❌ TTS Error:', data.error);
  console.log('\n⚠️  TTS test failed');
  process.exit(1);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('⏱️  Test timeout - no response received in 30 seconds');
  process.exit(1);
}, 30000);
