# 🚀 Seven AI Assistant - Start Here!

Welcome to **Seven**, your cross-platform AI assistant! This guide will get you running in under 5 minutes.

## ⚡ Quick Start (Fastest Path)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Grok API (You need this!)

You already have your Grok API key. Now create a `.env` file in the project root:

```bash
# On Windows PowerShell:
@"
VITE_GROK_API_KEY=your-grok-api-key-here
VITE_LLM_PROVIDER=grok
VITE_GROK_BASE_URL=https://api.x.ai/v1
VITE_GROK_MODEL=grok-beta
"@ > .env

# On Mac/Linux:
cat > .env << EOL
VITE_GROK_API_KEY=your-grok-api-key-here
VITE_LLM_PROVIDER=grok
VITE_GROK_BASE_URL=https://api.x.ai/v1
VITE_GROK_MODEL=grok-beta
EOL
```

**Replace `your-grok-api-key-here` with your actual Grok API key!**

### 3. Run Seven

#### Option A: Web Version (Recommended for First Run)
```bash
npm run dev:web
```
Then open http://localhost:5173

#### Option B: Desktop Version (Electron)
```bash
npm run dev:electron
```

## 🎯 First Steps

Once Seven is running:

1. **Look at the beautiful dark glassy UI** ✨
2. **Try typing**: "Hello Seven!"
3. **Click the microphone button** and say something
4. **Try these commands**:
   - "What time is it?"
   - "Open google.com"
   - "Tell me a joke"
   - "Search for AI news"

## 🎤 Voice Features

### Voice Input
- Click the **microphone button** (neumorphic style)
- Watch the **waveform animation** while speaking
- Say "Hey Seven" to activate with wake word

### Voice Output
1. Click the **settings gear** (top right)
2. Enable **"Auto-speak responses"**
3. Seven will now talk back to you!

## 🎨 UI Features

Seven has a stunning dark glassy design:

- **Glassmorphism**: Frosted glass effects
- **Neumorphic Buttons**: Soft, tactile buttons
- **Glowing Effects**: Pulsing glow on mic button
- **Waveform Visualization**: Animated audio waves
- **No border radius**: Clean, square aesthetic

## ⚙️ Settings

Click the gear icon to:
- Switch between **Grok**, **OpenAI**, or **Ollama**
- Change the AI model
- Enable/disable auto-speak
- Customize behavior

## 📱 Run on Mobile

```bash
# Build web app
npm run build

# Initialize platforms (first time only)
npx cap add android
npx cap add ios

# Sync and run
npm run sync:mobile
npm run run:android  # or run:ios
```

## 🎯 Example Prompts

Try these with Seven:

**General Chat:**
- "Hello, who are you?"
- "Tell me a fun fact"
- "Explain quantum computing"

**Actions:**
- "Open YouTube"
- "Search for the weather"
- "What's the date today?"

**Voice:**
- Say "Hey Seven" then your question
- Use auto-speak for voice conversations

## 📁 Project Structure

```
seven/
├── src/
│   ├── core/
│   │   ├── llm.ts       # Grok/OpenAI/Ollama integration
│   │   ├── speech.ts    # STT/TTS
│   │   ├── actions.ts   # Action executor
│   │   └── wakeword.ts  # "Hey Seven" detection
│   └── ui/
│       ├── App.tsx      # Main app
│       └── components/  # UI components
├── electron/            # Desktop app
└── .env                 # Your API keys
```

## 🐛 Troubleshooting

### "Failed to get response"
- Check your Grok API key in `.env`
- Make sure you have internet connection
- Verify API key at console.x.ai

### Microphone not working
- Grant microphone permissions
- Use HTTPS or localhost
- Try Chrome or Edge browser

### Dark UI not showing
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)

## 📖 Documentation

- **[GROK_SETUP.md](GROK_SETUP.md)** - Detailed Grok configuration
- **[README.md](README.md)** - Full documentation
- **[FEATURES.md](FEATURES.md)** - Feature details
- **[INSTALLATION.md](INSTALLATION.md)** - Platform-specific setup

## 🎉 You're Ready!

Seven is fully configured and ready to use. Start chatting!

### Next Steps

1. **Customize the system prompt** in `src/core/llm.ts`
2. **Add custom actions** in `src/core/actions.ts`
3. **Modify the UI** in `src/ui/components/`
4. **Build for production**:
   ```bash
   npm run build:electron  # Desktop
   npm run capacitor:build # Mobile
   ```

## 💡 Pro Tips

- Enable **auto-speak** for hands-free operation
- Use **wake word** for natural activation
- Try different AI models in settings
- Dark mode looks best at night 🌙

---

**Need help?** Check the documentation or open an issue on GitHub.

**Enjoy using Seven! 🚀**









