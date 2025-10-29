# Seven — Cross-Platform AI Assistant

**One codebase. Works everywhere.** Desktop (Electron) • Mobile (Capacitor) • Web (PWA)

A fully functional AI assistant with voice control, powered by Grok, OpenAI, or local Ollama.

## Features

✅ **Voice Input** - Speech-to-text using Web Speech API  
✅ **AI Responses** - Powered by **Grok (xAI)**, OpenAI GPT, or local Ollama  
✅ **Action Execution** - Structured JSON-based actions (open URLs, get time/date, search, etc.)  
✅ **Voice Responses** - Text-to-speech with waveform visualization  
✅ **Wake Word** - "Hey Seven" activation  
✅ **Dark Glassy UI** - Neumorphic buttons, glassmorphism, glowing effects  
✅ **Cross-Platform** - One codebase for Desktop, Mobile, and Web  

## Tech Stack

- **Frontend:** React + TypeScript + Vite + TailwindCSS
- **Desktop:** Electron
- **Mobile:** Capacitor (Android + iOS)
- **AI:** Grok (xAI) • OpenAI GPT • Ollama (local)
- **Speech:** Web Speech API • Capacitor plugins • Wake word detection
- **Design:** Dark glassmorphism with neumorphic elements

## Project Structure

```
seven-ai-assistant/
├── electron/              # Electron main process files
│   ├── main.ts           # Electron main process
│   └── preload.ts        # Electron preload script
├── src/
│   ├── core/             # Core functionality
│   │   ├── llm.ts        # LLM integration (OpenAI/Ollama)
│   │   ├── speech.ts     # Speech recognition & synthesis
│   │   ├── actions.ts    # Action execution system
│   │   └── utils.ts      # Utility functions
│   ├── ui/               # React UI components
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   └── App.tsx       # Main app component
│   ├── index.tsx         # App entry point
│   └── index.css         # Global styles
├── public/               # Static assets
├── package.json
├── vite.config.ts
├── capacitor.config.ts
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **For Grok (Recommended)**: Get API key from [console.x.ai](https://console.x.ai)
- For Ollama: Install [Ollama](https://ollama.ai) and pull a model (e.g., `ollama pull llama2`)
- For OpenAI: Get an API key from [OpenAI](https://platform.openai.com)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd seven-ai-assistant
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   
   Create a `.env` file in the project root:
   ```env
   # Grok (xAI) Configuration - CURRENTLY ACTIVE
   VITE_GROK_API_KEY=your-grok-api-key-here
   VITE_LLM_PROVIDER=grok
   VITE_GROK_BASE_URL=https://api.x.ai/v1
   VITE_GROK_MODEL=grok-beta

   # OpenAI Configuration (optional)
   VITE_OPENAI_API_KEY=your-openai-key-here

   # Ollama Configuration (optional - local/free)
   VITE_OLLAMA_BASE_URL=http://localhost:11434/v1
   ```
   
   **Note:** Seven is pre-configured to use Grok. See [GROK_SETUP.md](GROK_SETUP.md) for detailed setup.

### Running the App

#### Web (Development)

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

#### Desktop (Electron)

```bash
npm run electron:start
```

This will build the app and launch it in Electron.

#### Mobile (Capacitor)

1. **Build the web app:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npm run capacitor:sync
   ```

3. **Open in Android Studio or Xcode:**
   ```bash
   npm run capacitor:android
   # or
   npm run capacitor:ios
   ```

4. Run the app from Android Studio or Xcode.

## Usage

### Basic Usage

1. **Type or Speak**: Use the text input or click the microphone button to speak
2. **Get AI Responses**: The AI will process your input and respond
3. **Voice Replies**: Enable "Auto-speak responses" in settings for voice replies
4. **Execute Actions**: The AI can execute actions like opening URLs, getting time/date, etc.

### Available Actions

The AI can execute the following actions:

- `open-url` - Open a website
- `get-time` - Get current time
- `get-date` - Get current date
- `search` - Search the web
- `play-media` - Play audio/video
- `system-info` - Get system information

### Settings

- **LLM Provider**: Choose between OpenAI or Ollama
- **Model**: Specify the model (e.g., `gpt-3.5-turbo`, `llama2`)
- **Auto-speak**: Enable/disable automatic voice responses

## Building for Production

### Web (PWA)

```bash
npm run build
npm run preview
```

### Desktop (Electron)

```bash
npm run electron:build
```

Builds are created in the `release/` directory.

### Mobile (Capacitor)

```bash
npm run capacitor:build
```

Then build the app in Android Studio or Xcode.

## Configuration

### OpenAI

Set your API key in `.env`:
```
VITE_OPENAI_API_KEY=sk-...
```

### Ollama (Local AI)

1. Install Ollama: https://ollama.ai
2. Pull a model:
   ```bash
   ollama pull llama2
   ```
3. The app will connect to `http://localhost:11434` by default
4. In settings, select "Ollama" as provider and specify the model name

## Troubleshooting

### Speech Recognition Not Working

- Ensure you're using HTTPS (or localhost)
- Grant microphone permissions in your browser/OS
- Check browser compatibility (Chrome, Edge work best)

### Ollama Connection Failed

- Ensure Ollama is running: `ollama serve`
- Check the base URL in settings
- Verify the model is pulled: `ollama list`

### OpenAI API Errors

- Check your API key in `.env`
- Ensure you have credits in your OpenAI account
- Check the model name is correct

## Development

### Project Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run electron:start` - Start Electron in dev mode
- `npm run electron:build` - Build Electron app
- `npm run capacitor:sync` - Sync web build to mobile platforms
- `npm run capacitor:android` - Open Android project
- `npm run capacitor:ios` - Open iOS project

### Adding New Actions

1. Add the action type to `src/core/actions.ts`
2. Implement the action handler in `ActionExecutor.execute()`
3. Update the system prompt in `src/core/llm.ts` to inform the AI

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.

