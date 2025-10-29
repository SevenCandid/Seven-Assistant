# Quick Start Guide

Get Seven AI Assistant running in under 5 minutes!

## ⚡ Fastest Path (Using Ollama - Free, No API Key Required)

### 1. Install Ollama
Download and install from [ollama.ai](https://ollama.ai)

### 2. Pull a Model
```bash
ollama pull llama2
```

### 3. Install Project Dependencies
```bash
npm install
```

### 4. Start the App
```bash
npm run dev
```

### 5. Configure
- Open http://localhost:5173
- Click the Settings gear icon
- Select "Ollama" as provider
- Enter "llama2" as the model
- Click the microphone or type to start chatting!

## 🚀 Alternative: Using OpenAI

### 1. Get API Key
Sign up at [OpenAI Platform](https://platform.openai.com) and get an API key

### 2. Create .env File
```bash
# Create .env file
echo "VITE_OPENAI_API_KEY=your-api-key-here" > .env
```

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. Start Chatting
- Open http://localhost:5173
- The default provider is OpenAI
- Start using the assistant immediately!

## 📱 Platform-Specific Starts

### Desktop App (Electron)
```bash
npm install
npm run electron:start
```

### Mobile App (Capacitor)
```bash
npm install
npm run build
npx cap add android  # or ios
npm run capacitor:android  # or capacitor:ios
```

## 🎯 First Commands to Try

Once the app is running, try these:

**Voice Commands:**
- "What time is it?"
- "Open google.com"
- "Search for AI news"
- "What's the date today?"

**Text Commands:**
- Type: "Tell me a joke"
- Type: "Explain quantum computing"
- Type: "Open youtube.com"

## ⚙️ Settings Options

Access settings via the gear icon:

- **LLM Provider**: OpenAI or Ollama
- **Model**: Model name (gpt-3.5-turbo, llama2, etc.)
- **Auto-speak**: Enable voice responses

## 🔧 Troubleshooting

**"Speech recognition not supported"**
- Use Chrome or Edge browser
- Grant microphone permissions

**"Failed to connect to Ollama"**
- Ensure Ollama is running: `ollama serve`
- Check model is pulled: `ollama list`

**"OpenAI API Error"**
- Verify API key in .env file
- Check you have credits at OpenAI

## 📚 Next Steps

- Read [README.md](README.md) for full documentation
- See [INSTALLATION.md](INSTALLATION.md) for detailed setup
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to contribute

## 💡 Tips

- Use Ctrl+Enter or Cmd+Enter to send messages
- Click the microphone button to use voice input
- Enable auto-speak for hands-free operation
- Clear conversation to reset context

Enjoy your AI assistant! 🎉





