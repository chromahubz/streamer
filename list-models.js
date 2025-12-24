require('dotenv').config();

async function listModels() {
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    console.log('Available Gemini models:\n');

    // List all models
    const models = await genAI.listModels();

    models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      if (model.supportedGenerationMethods?.includes('generateContent')) {
        console.log('   ✅ Supports generateContent');
      }
    });

  } catch (error) {
    console.error('Error listing models:', error.message);
  }
}

listModels();
