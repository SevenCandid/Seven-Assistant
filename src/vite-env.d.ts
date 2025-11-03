/// <reference types="vite/client" />

// Electron API type declarations
declare global {
  interface Window {
    electron?: {
      ping: () => Promise<string>;
      minimizeWindow: () => void;
      maximizeWindow: () => void;
      closeWindow: () => void;
      isMaximized: () => Promise<boolean>;
      onWindowMaximized: (callback: () => void) => void;
      onWindowUnmaximized: (callback: () => void) => void;
    };
    seven?: {
      ping: () => Promise<string>;
    };
  }
}

export {};

interface ImportMetaEnv {
  readonly VITE_OPENAI_API_KEY: string;
  readonly VITE_GROQ_API_KEY: string;
  readonly VITE_GROQ_BASE_URL: string;
  readonly VITE_GROK_API_KEY: string;
  readonly VITE_GROK_BASE_URL: string;
  readonly VITE_GROK_MODEL: string;
  readonly VITE_LLM_PROVIDER: string;
  readonly VITE_OLLAMA_BASE_URL: string;
  readonly VITE_USE_OLLAMA: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

