# Grok (xAI) Setup Guide for Seven

Seven is now configured to use Grok, xAI's powerful language model!

## Getting Your Grok API Key

1. Visit [console.x.ai](https://console.x.ai)
2. Sign up or log in to your xAI account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key

## Configuration

### Step 1: Create .env File

In your project root, create a `.env` file with:

```env
# Grok (xAI) Configuration
VITE_GROK_API_KEY=your-grok-api-key-here

# Provider Selection
VITE_LLM_PROVIDER=grok

# Grok API Base URL
VITE_GROK_BASE_URL=https://api.x.ai/v1

# Grok Model
VITE_GROK_MODEL=grok-beta
```

### Step 2: Add Your API Key

Replace `your-grok-api-key-here` with your actual Grok API key.

## Running Seven with Grok

```bash
# Install dependencies
npm install

# Run web version
npm run dev:web

# Run desktop version
npm run dev:electron

# Run on mobile
npm run sync:mobile
npm run run:android  # or run:ios
```

## Using Seven

Once running:

1. **Open the app** (web: http://localhost:5173)
2. **Settings are pre-configured** for Grok
3. **Start chatting** by:
   - Typing a message
   - Clicking the microphone (voice input)
   - Saying "Hey Seven" (wake word)

## Features

### What Grok Can Do in Seven

- **Conversational AI**: Chat naturally
- **Execute Actions**: 
  - Open URLs: "Open google.com"
  - Get Time/Date: "What time is it?"
  - Search: "Search for AI news"
  - Show Alerts: "Remind me about the meeting"
  
### Voice Features

- **Voice Input**: Click mic or use wake word
- **Voice Output**: Enable "Auto-speak" in settings
- **Wake Word**: Say "Hey Seven" to activate

## Models Available

- `grok-beta` - Default, fastest
- `grok-1` - Production model
- Update in Settings or `.env`

## Switching Providers

To switch between providers, use the Settings panel:

1. Click the gear icon
2. Select provider:
   - **Grok (xAI)** - Currently active
   - **OpenAI** - Requires OpenAI API key
   - **Ollama (Local)** - Free, runs locally

## Example Prompts

Try these with Grok:

```
"Hey Seven, what's the weather like today?"
"Open YouTube"
"Search for the latest tech news"
"What time is it?"
"Tell me a joke"
"Explain quantum computing"
```

## Troubleshooting

### "Failed to get response from grok"

- Check your API key in `.env`
- Verify you have Grok API credits
- Check internet connection
- Ensure API base URL is correct

### Speech not working

- Grant microphone permissions
- Use HTTPS or localhost
- Use Chrome/Edge browser

### Wake word not activating

- Speak clearly: "Hey Seven"
- Check microphone permissions
- Try increasing volume

## Cost Management

Grok API is metered:

- Check usage at [console.x.ai](https://console.x.ai)
- Monitor API calls
- Set usage limits if needed

## Advanced Configuration

### Custom System Prompt

Edit `src/core/llm.ts` to customize how Seven behaves:

```typescript
const SYSTEM_PROMPT = `You are Seven, customize me!`;
```

### Add More Actions

Edit `src/core/actions.ts` to add custom actions:

```typescript
case 'your_action':
  return this.yourCustomAction(data);
```

## Support

- Grok Documentation: [x.ai/docs](https://x.ai/docs)
- Seven Issues: Open an issue on GitHub
- xAI Support: [console.x.ai/support](https://console.x.ai/support)

---

**You're all set! Enjoy using Seven with Grok! 🚀**

# Windows PowerShell:
@"
VITE_GROK_API_KEY=your-grok-api-key-here
VITE_LLM_PROVIDER=grok
VITE_GROK_BASE_URL=https://api.x.ai/v1
VITE_GROK_MODEL=grok-beta
"@ > .env