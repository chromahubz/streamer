# Contributing to AI Streamer Assistant

Thank you for your interest in contributing! This document provides guidelines for contributing to the AI Streamer Assistant project.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- Gemini API key (https://makersuite.google.com/app/apikey)
- Groq API key (https://console.groq.com)

### Initial Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd streamer-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env and add your API keys
   ```

4. **Start development**
   ```bash
   npm run dev
   ```

## Project Structure

```
streamer-assistant/
├── electron/           # Electron main process
├── backend/           # Express + Socket.IO server
├── src/              # React frontend
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── utils/        # Utility functions
│   └── types/        # TypeScript types
└── public/           # Static assets
```

## Development Workflow

### Running Services Separately

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:renderer

# Electron only (requires backend + frontend)
npm run dev:electron
```

### Code Style

- **TypeScript**: All new code should be TypeScript
- **Components**: Use functional components with hooks
- **Naming**: PascalCase for components, camelCase for functions/variables
- **Imports**: Use relative imports (not @ aliases)

### TypeScript

Always check for TypeScript errors before committing:

```bash
npx tsc --noEmit
```

## Making Changes

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

### 2. Make Your Changes

- Write clean, readable code
- Add comments for complex logic
- Follow existing code patterns

### 3. Test Your Changes

- Test all affected features manually
- Ensure no TypeScript errors
- Test on multiple monitors if changing screen capture

### 4. Commit Your Changes

Use descriptive commit messages:

```bash
git commit -m "Add feature: description of what you added"
git commit -m "Fix: description of what you fixed"
git commit -m "Refactor: description of refactoring"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Adding New Features

### Adding a New Component

1. Create component file in `src/components/`
2. Use TypeScript with proper types
3. Import shadcn/ui components as needed
4. Export component at bottom of file

Example:
```tsx
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
}
```

### Adding a New Backend Service

1. Create service file in `backend/services/`
2. Export a class or object with methods
3. Add error handling
4. Document API usage

Example:
```javascript
class MyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }

  async doSomething(input) {
    try {
      // Implementation
      return result;
    } catch (error) {
      console.error('MyService error:', error);
      throw error;
    }
  }
}

module.exports = MyService;
```

### Adding Socket Events

1. Define event in `backend/server.js`
2. Add handler in `src/hooks/useSocket.ts`
3. Document event in code comments

Backend:
```javascript
socket.on('my-event', async (data) => {
  try {
    const result = await myService.process(data);
    socket.emit('my-event-result', result);
  } catch (error) {
    socket.emit('my-event-error', { error: error.message });
  }
});
```

Frontend:
```typescript
const handleMyEvent = (data: any) => {
  if (window.socketIO) {
    window.socketIO.emit('my-event', data);

    window.socketIO.once('my-event-result', (result) => {
      // Handle result
    });
  }
};
```

## Testing

### Manual Testing Checklist

- [ ] Backend starts without errors
- [ ] Frontend connects to backend (green badge)
- [ ] Screen capture works (both monitors)
- [ ] OCR extracts chat messages
- [ ] AI responses generate correctly
- [ ] Translation works (if enabled)
- [ ] Voice input works (if enabled)
- [ ] OBS connection works (if enabled)
- [ ] Settings persist across restarts
- [ ] Export/Import settings works
- [ ] No TypeScript errors

### Testing OCR

1. Open a streaming platform chat in browser
2. Select the monitor with chat
3. Start capture
4. Verify messages appear in Chat Feed
5. Check OCR Stats for performance

### Testing AI Responses

1. Select a chat message
2. Click "Generate Response"
3. Verify 3-5 options appear
4. Click "Regenerate" to test
5. Test TTS preview

## Common Tasks

### Adding a New Language

1. Edit `src/components/TranslationSettings.tsx`
2. Add to `LANGUAGES` array with flag emoji
3. Test translation with new language

### Adding a New Personality

1. Edit `public/master-prompts.json`
2. Add new preset with all fields
3. Test personality in ResponsePanel

### Updating Dependencies

```bash
# Check for updates
npm outdated

# Update specific package
npm install package-name@latest

# Update all (careful!)
npm update
```

## Debugging

### Backend Debugging

Check backend logs in terminal:
```bash
npm run dev:backend
```

Add debug logs:
```javascript
console.log('[DEBUG] Variable:', variable);
console.error('[ERROR] Something failed:', error);
```

### Frontend Debugging

1. Open DevTools (Cmd+Option+I / Ctrl+Shift+I)
2. Check Console for errors
3. Check Network tab for Socket.IO
4. Use React DevTools for component state

### Electron Debugging

Main process logs appear in terminal where you ran `npm run dev`

Renderer process logs appear in Electron DevTools

## Documentation

### Code Comments

Add comments for:
- Complex logic
- API integrations
- Non-obvious behavior
- Workarounds

### JSDoc

Use JSDoc for functions:
```javascript
/**
 * Extracts chat messages from screenshot using Gemini Vision
 * @param {string} screenshot - Base64 encoded screenshot
 * @returns {Promise<ChatMessage[]>} Array of extracted messages
 */
async extractChatMessages(screenshot) {
  // Implementation
}
```

## Pull Request Guidelines

### PR Title

Use descriptive titles:
- ✅ "Add Portuguese language support"
- ✅ "Fix OCR duplicate detection bug"
- ✅ "Refactor settings persistence logic"
- ❌ "Update code"
- ❌ "Fix bug"

### PR Description

Include:
1. **What**: What does this PR do?
2. **Why**: Why is this change needed?
3. **How**: How did you implement it?
4. **Testing**: How did you test it?

### Review Process

1. Ensure CI passes (TypeScript check)
2. Request review from maintainer
3. Address review comments
4. Merge when approved

## Getting Help

- **Issues**: Check existing GitHub issues
- **Discussions**: Start a discussion for questions
- **Documentation**: Read README.md and PHASE*_UPDATES.md
- **Plan File**: See implementation plan at `~/.claude/plans/kind-imagining-dragon.md`

## Code of Conduct

- Be respectful and constructive
- Help others learn
- Focus on the code, not the person
- Assume good intentions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

If you have questions about contributing, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with your question

Thank you for contributing to AI Streamer Assistant! 🎉
