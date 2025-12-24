#!/bin/bash

echo "=================================="
echo "AI Streamer Assistant"
echo "=================================="
echo ""
echo "Starting all services..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Please copy .env.example to .env and add your API keys"
    exit 1
fi

# Check for API keys
if ! grep -q "GEMINI_API_KEY=AIzaSyC" .env; then
    echo "⚠️  Warning: Gemini API key might not be configured"
fi

if ! grep -q "GROQ_API_KEY=gsk_" .env; then
    echo "⚠️  Warning: Groq API key might not be configured"
fi

echo "✅ Configuration check passed"
echo ""
echo "Starting services..."
echo "  - Backend (port 3001)"
echo "  - Frontend (port 5173)"
echo "  - Electron app"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Start all services
npm run dev
