#!/bin/bash

# Check latest Gemini models
echo "Fetching available Gemini models..."
echo ""

curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyC5t0UuApJx2n_XQVKUFyD8sKE1bgLH-sw" | \
  python3 -c "
import sys, json
data = json.load(sys.stdin)
for model in data.get('models', []):
    name = model.get('name', '').replace('models/', '')
    methods = model.get('supportedGenerationMethods', [])
    if 'generateContent' in methods:
        print(f'✅ {name}')
    else:
        print(f'   {name}')
"
