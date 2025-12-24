// Test script to inject fake chat messages for testing
const io = require('socket.io-client');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
  console.log('✅ Connected to backend server');
  console.log('📨 Injecting test chat messages...\n');

  // Wait a moment then inject test messages
  setTimeout(() => {
    const testMessages = [
      {
        id: 'test-1',
        platform: 'twitch',
        username: 'TestUser123',
        message: 'What FOV are you using?',
        timestamp: Date.now(),
        language: 'en'
      },
      {
        id: 'test-2',
        platform: 'twitch',
        username: 'GamerPro',
        message: 'Nice play! How did you do that?',
        timestamp: Date.now() + 1000,
        language: 'en'
      },
      {
        id: 'test-3',
        platform: 'youtube',
        username: 'ViewerX',
        message: 'Can you explain your strategy?',
        timestamp: Date.now() + 2000,
        language: 'en'
      }
    ];

    testMessages.forEach((msg, index) => {
      setTimeout(() => {
        socket.emit('test-inject-message', msg);
        console.log(`✅ Sent message ${index + 1}: "${msg.message}" from ${msg.username}`);
      }, index * 500);
    });

    setTimeout(() => {
      console.log('\n✅ All test messages injected!');
      console.log('📺 Check the "Chat & Responses" tab in the app');
      console.log('💡 You should now see 3 chat messages');
      console.log('\nPress Ctrl+C to exit');
    }, 2000);
  }, 1000);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from backend');
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error.message);
  console.log('💡 Make sure the backend is running on http://localhost:3001');
  process.exit(1);
});
