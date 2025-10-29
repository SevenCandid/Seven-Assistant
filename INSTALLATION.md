# Installation Guide

This guide will help you set up the Seven AI Assistant on your machine.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the project root:

```bash
# On Windows
copy .env.example .env

# On macOS/Linux
cp .env.example .env
```

Or create it manually with this content:

```
# OpenAI Configuration
VITE_OPENAI_API_KEY=

# Ollama Configuration (for local AI)
VITE_OLLAMA_BASE_URL=http://localhost:11434/v1
```

### 3. Configure Your AI Provider

#### Option A: Using OpenAI

1. Get an API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. Add it to your `.env` file:
   ```
   VITE_OPENAI_API_KEY=sk-your-key-here
   ```

#### Option B: Using Ollama (Local, Free)

1. Install Ollama from [ollama.ai](https://ollama.ai)
2. Pull a model:
   ```bash
   ollama pull llama2
   ```
3. Start Ollama:
   ```bash
   ollama serve
   ```
4. No API key needed! Just select "Ollama" in the app settings

### 4. Run the Application

#### Web Version
```bash
npm run dev
```
Open http://localhost:5173

#### Desktop Version (Electron)
```bash
npm run electron:start
```

## Platform-Specific Setup

### Desktop (Electron)

No additional setup required! Just run:
```bash
npm run electron:start
```

To build a standalone executable:
```bash
npm run electron:build
```
Find the built app in the `release/` folder.

### Mobile (Capacitor)

#### Prerequisites
- **For Android:**
  - Install [Android Studio](https://developer.android.com/studio)
  - Install Android SDK (API level 22+)
  
- **For iOS (macOS only):**
  - Install [Xcode](https://developer.apple.com/xcode/)
  - Install CocoaPods: `sudo gem install cocoapods`

#### Setup Steps

1. Build the web app:
   ```bash
   npm run build
   ```

2. Initialize Capacitor platforms:
   ```bash
   npx cap add android
   npx cap add ios
   ```

3. Sync the build:
   ```bash
   npm run capacitor:sync
   ```

4. Open in IDE:
   ```bash
   # For Android
   npm run capacitor:android
   
   # For iOS (macOS only)
   npm run capacitor:ios
   ```

5. Run the app from Android Studio or Xcode

### Web (PWA)

Build for production:
```bash
npm run build
```

Deploy the `dist/` folder to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- Cloudflare Pages

The app will be installable as a PWA on supported browsers.

## Troubleshooting

### "Module not found" errors

Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Speech recognition not working

1. Use HTTPS or localhost
2. Grant microphone permissions
3. Use Chrome or Edge browser (best support)

### Ollama connection fails

1. Ensure Ollama is running: `ollama serve`
2. Check if model is available: `ollama list`
3. Verify base URL: `http://localhost:11434/v1`

### OpenAI API errors

1. Check API key is correctly set in `.env`
2. Verify you have credits at [OpenAI Platform](https://platform.openai.com/usage)
3. Check the model name (default: `gpt-3.5-turbo`)

### Electron build fails

Update Electron:
```bash
npm install electron@latest --save-dev
```

### Capacitor sync fails

Clear and rebuild:
```bash
npx cap sync --force
```

## Verification

After setup, test the following:

- [ ] Text input sends messages
- [ ] Microphone button activates
- [ ] Voice input is recognized
- [ ] AI responds to messages
- [ ] Settings can be changed
- [ ] Voice output works (if enabled)
- [ ] Actions execute (try "open google.com")

## Next Steps

Once everything is working:

1. Customize the UI in `src/ui/components/`
2. Add new actions in `src/core/actions.ts`
3. Adjust the AI system prompt in `src/core/llm.ts`
4. Build and deploy!

## Need Help?

Check the [README.md](README.md) for more details or open an issue on GitHub.

