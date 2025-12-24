require('dotenv').config();

// Test Gemini API
async function testGemini() {
  console.log('Testing Gemini API...');
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent('Say hello in 3 words');
    const response = await result.response;
    const text = response.text();

    console.log('✅ Gemini API is working!');
    console.log('Response:', text);
    return true;
  } catch (error) {
    console.error('❌ Gemini API failed:', error.message);
    return false;
  }
}

// Test Groq API
async function testGroq() {
  console.log('\nTesting Groq API...');
  try {
    const Groq = require('groq-sdk');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'Say hello in 3 words' }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 20
    });

    console.log('✅ Groq API is working!');
    console.log('Response:', completion.choices[0]?.message?.content);
    return true;
  } catch (error) {
    console.error('❌ Groq API failed:', error.message);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('=== API Keys Test ===\n');

  const geminiOk = await testGemini();
  const groqOk = await testGroq();

  console.log('\n=== Test Summary ===');
  console.log('Gemini:', geminiOk ? '✅ Working' : '❌ Failed');
  console.log('Groq:', groqOk ? '✅ Working' : '❌ Failed');

  if (geminiOk && groqOk) {
    console.log('\n🎉 All APIs are configured correctly!');
    console.log('You can now run: npm run dev');
  } else {
    console.log('\n⚠️  Some APIs failed. Check your API keys in .env file');
  }
}

runTests();
