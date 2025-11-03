/**
 * Main App Component
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { Settings } from './components/Settings';
import { Sidebar } from './components/Sidebar';
import { WakeWordIndicator } from './components/WakeWordIndicator';
import { OfflineBanner } from './components/OfflineBanner';
import { ChatHistory } from './components/ChatHistory';
import { MemoryStats } from './components/MemoryStats';
import { FactsManager } from './components/FactsManager';
import { MediaCapture } from './components/MediaCapture';
import { SevenConsole } from './components/SevenConsole';
import { TitleBar } from './components/TitleBar';
import { SplashScreen } from './components/SplashScreen';
import { useAIAssistant } from './hooks/useAIAssistant';
import { detectPlatform } from '../core/utils';
import { initializeTheme, getAccentColor, setAccentColor } from '../core/theme';
import { getMemoryStore, StoredMessage, ChatSession } from '../memory/memoryStore';
import { backendApi } from '../core/backendApi';

// Get backend URL for initialization check
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const App: React.FC = () => {
  const [platform, setPlatform] = useState<string>('web');
  const [llmProvider, setLlmProvider] = useState<'openai' | 'ollama' | 'grok' | 'groq'>('groq');
  const [llmModel, setLlmModel] = useState<string>('llama-3.1-8b-instant');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true); // Enable voice by default!
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true); // Enable wake word by default
  // Voice settings - Fixed to calm, confident, smooth female Jarvis-like voice
  const [selectedVoice] = useState<string>(''); // Auto-select best female voice
  const [continuousVoiceMode, setContinuousVoiceMode] = useState<boolean>(false);
  const [voiceRate] = useState<number>(0.9); // Calm and confident pace
  const [voicePitch] = useState<number>(1); // Smooth, confident pitch
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  // Initialize sidebar: closed on mobile (< 640px), open on desktop
  const [showSidebar, setShowSidebar] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 640;
    }
    return false; // Default to closed if window is not available (SSR)
  });
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showMemoryStats, setShowMemoryStats] = useState<boolean>(false);
  const [showFactsManager, setShowFactsManager] = useState<boolean>(false);
  const [showMediaCapture, setShowMediaCapture] = useState<boolean>(false);
  const [accentColor, setAccentColorState] = useState<string>('orange');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showDeveloperConsole, setShowDeveloperConsole] = useState<boolean>(false);
  
  // Startup/Splash screen state
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [splashMessage, setSplashMessage] = useState<string>('Initializing SEVEN Systems...');
  const [isReconnecting, setIsReconnecting] = useState<boolean>(false);
  const [backendConnected, setBackendConnected] = useState<boolean>(false);
  
  // Track if voice intro has already been played to prevent multiple plays
  const voiceIntroPlayedRef = React.useRef(false);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
    const currentColor = getAccentColor();
    setAccentColorState(currentColor.name);
  }, []);

  // Handle accent color changes
  const handleAccentColorChange = (colorName: string) => {
    setAccentColor(colorName);
    setAccentColorState(colorName);
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load saved settings from localStorage (voice settings cleared - using fixed Jarvis-like voice)
  // Delete old voice settings
  useEffect(() => {
    // Clear old voice settings from localStorage
    localStorage.removeItem('seven_selectedVoice');
    localStorage.removeItem('seven_voiceRate');
    localStorage.removeItem('seven_voicePitch');
    localStorage.removeItem('seven_continuousVoiceMode');
    console.log('🗑️ Cleared old voice settings - using fixed Jarvis-like voice');
    
    const savedProvider = localStorage.getItem('seven_llmProvider');
    const savedModel = localStorage.getItem('seven_llmModel');
    if (savedProvider) {
      setLlmProvider(savedProvider as 'openai' | 'ollama' | 'grok' | 'groq');
      console.log('📂 Loaded saved LLM provider:', savedProvider);
    } else {
      // Default to groq on first load
      setLlmProvider('groq');
    }
    if (savedModel) {
      setLlmModel(savedModel);
      console.log('📂 Loaded saved LLM model:', savedModel);
    } else {
      // Default to instant model
      setLlmModel('llama-3.1-8b-instant');
    }
  }, []);

  // Auto-switch between Groq (online) and Ollama (offline)
  useEffect(() => {
    const savedProvider = localStorage.getItem('seven_llmProvider');
    
    if (isOnline) {
      // When online, use Groq
      if (llmProvider !== 'groq') {
        console.log('🌐 Online detected - Switching to Groq');
        setLlmProvider('groq');
        setLlmModel('llama-3.1-8b-instant');
      }
    } else {
      // When offline, use Ollama
      if (llmProvider !== 'ollama') {
        console.log('📴 Offline detected - Switching to Ollama');
        setLlmProvider('ollama');
        setLlmModel('llama3.2');
      }
    }
  }, [isOnline]);

  // Voice settings are now fixed (Jarvis-like: rate 0.9, pitch 1, auto-selects best female AI voice)

  // System initialization - Check backend and play voice intro
  useEffect(() => {
    let retryInterval: NodeJS.Timeout | null = null;
    let timeoutId: NodeJS.Timeout | null = null;
    let mounted = true;

    const logSystem = (category: string, message: string) => {
      const timestamp = new Date().toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
      });
      console.log(`[${timestamp}] [${category}] ${message}`);
    };

    const checkBackend = async (): Promise<boolean> => {
      try {
        logSystem('SYSTEM', 'Checking backend connectivity...');
        const response = await fetch(`${BACKEND_URL}/api/memory`, {
          method: 'GET',
          signal: AbortSignal.timeout(5000), // 5 second timeout
        });
        
        if (response.ok) {
          logSystem('SYSTEM', 'Connected to SEVEN core.');
          setBackendConnected(true);
          setIsReconnecting(false);
          if (retryInterval) {
            clearInterval(retryInterval);
            retryInterval = null;
          }
          return true;
        } else {
          throw new Error(`Backend responded with status ${response.status}`);
        }
      } catch (error) {
        // Only log detailed errors for unexpected failures
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('Failed to fetch') || errorMessage.includes('timeout')) {
          // Expected when backend is offline - log less verbosely
          if (!retryInterval) {
            logSystem('SYSTEM', 'Backend unavailable - continuing without backend.');
          }
        } else {
          logSystem('SYSTEM', `Backend connection failed: ${errorMessage}`);
        }
        setBackendConnected(false);
        return false;
      }
    };

    const playVoiceIntro = async () => {
      // Prevent multiple plays - only play once per app session
      if (voiceIntroPlayedRef.current) {
        console.log('ℹ️ Voice intro already played, skipping...');
        return;
      }
      
      try {
        // Mark as played immediately to prevent concurrent calls
        voiceIntroPlayedRef.current = true;
        
        // Get user's name from localStorage
        const userName = localStorage.getItem('seven_user_name') || '';
        const isCreator = localStorage.getItem('seven_user_is_creator') === 'true';
        const nameToUse = userName || (isCreator ? 'Frank' : '');
        
        // Use the requested intro message
        const introText = nameToUse 
          ? `System boot complete, I am Online. Welcome back ${nameToUse}, the future begins now.`
          : 'System boot complete, I am Online. Welcome back Frank, the future begins now.';
        
        logSystem('VOICE', 'Online.');
        console.log('⏱️ [TIMING] Voice intro started at:', new Date().toISOString());
        
        // Wait for speech synthesis to be ready and voices to load
        // Voices might not be loaded immediately, so we check and wait if needed
        let voices = window.speechSynthesis.getVoices();
        let attempts = 0;
        const maxAttempts = 10; // Wait up to 2 seconds (10 * 200ms)
        
        while (voices.length === 0 && attempts < maxAttempts) {
          console.log(`⏱️ [TIMING] Waiting for voices to load... (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 200));
          voices = window.speechSynthesis.getVoices();
          attempts++;
        }
        
        if (voices.length === 0) {
          console.warn('⚠️ No voices available, using default');
        } else {
          console.log(`✅ Loaded ${voices.length} voices after ${attempts} attempts`);
        }
        
        // Auto-select best female AI voice (same logic as speech.ts)
        let selectedVoice: SpeechSynthesisVoice | null = null;
        const femaleAIVoices = [
          'Microsoft Aria Online (Natural)',
          'Microsoft Jenny Online (Natural)',
          'Samantha',
          'Karen',
          'Tessa',
          'Allison',
          'Ava',
          'Susan',
          'Google UK English Female',
          'Google US English Female',
          'Zira',
          'Hazel',
        ];
        
        for (const voiceName of femaleAIVoices) {
          const voice = voices.find(v => {
            const vName = v.name.toLowerCase();
            return vName.includes(voiceName.toLowerCase()) || 
                   vName.includes('female') ||
                   (vName.includes('aria') && vName.includes('natural')) ||
                   (vName.includes('jenny') && vName.includes('natural'));
          });
          if (voice) {
            selectedVoice = voice;
            break;
          }
        }
        
        // Fallback to any female voice
        if (!selectedVoice) {
          const femaleVoices = voices.filter(v => {
            const name = v.name.toLowerCase();
            return name.includes('female') || 
                   name.includes('aria') || 
                   name.includes('jenny') ||
                   name.includes('samantha');
          });
          if (femaleVoices.length > 0) {
            selectedVoice = femaleVoices.find(v => v.localService) || femaleVoices[0];
          }
        }
        
        // Use speech synthesis directly with auto-selected voice
        const utterance = new SpeechSynthesisUtterance(introText);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
    if (selectedVoice) {
          utterance.voice = selectedVoice;
          logSystem('VOICE', `Using voice: ${selectedVoice.name}`);
        }
        
        // Play intro
        const speakStartTime = performance.now();
        console.log('⏱️ [TIMING] Starting to speak intro message...');
        
        await new Promise<void>((resolve) => {
          utterance.onend = () => {
            const speakDuration = performance.now() - speakStartTime;
            console.log(`⏱️ [TIMING] Voice intro speaking completed in: ${speakDuration.toFixed(2)}ms (${(speakDuration / 1000).toFixed(2)}s)`);
            resolve();
          };
          utterance.onerror = (error) => {
            console.warn('⚠️ Voice intro error:', error);
            resolve(); // Don't block on errors
          };
          window.speechSynthesis.speak(utterance);
          console.log('⏱️ [TIMING] Speech synthesis.speak() called');
        });
        
        logSystem('VOICE', 'Startup sequence complete.');
        console.log('⏱️ [TIMING] Voice intro function completed');
      } catch (error) {
        console.warn('Voice intro error:', error);
        logSystem('VOICE', 'Startup sequence complete (voice skipped).');
        // Reset the flag on error so it can be retried if initialization retries
        // Only reset if we're still initializing (not after app is fully loaded)
        if (isInitializing) {
          voiceIntroPlayedRef.current = false;
        }
      }
    };

    const initialize = async () => {
      logSystem('SYSTEM', 'Starting SEVEN initialization...');
      setSplashMessage('Initializing SEVEN Systems...');
      
      // Initialize Frank as creator (since he's building SEVEN)
      try {
        const existingName = localStorage.getItem('seven_user_name');
        const existingCreator = localStorage.getItem('seven_user_is_creator');
        if (!existingName || !existingCreator) {
          localStorage.setItem('seven_user_name', 'Frank');
          localStorage.setItem('seven_user_is_creator', 'true');
          logSystem('SYSTEM', 'Initialized Frank as creator and builder.');
        }
      } catch (e) {
        console.warn('Failed to initialize creator info:', e);
      }
      
      // Set a timeout to hide splash screen even if backend doesn't connect
      const maxWaitTime = 10000; // 10 seconds
      timeoutId = setTimeout(() => {
        if (mounted) {
          logSystem('SYSTEM', 'Backend connection timeout - continuing without backend.');
          setIsInitializing(false);
          setIsReconnecting(false);
          if (retryInterval) {
            clearInterval(retryInterval);
            retryInterval = null;
          }
        }
      }, maxWaitTime);
      
      // Play voice intro immediately without waiting for backend
      // This ensures the welcome message plays right away
      logSystem('VOICE', 'Playing initialization message...');
      playVoiceIntro().catch(err => {
        console.warn('Voice intro error (non-blocking):', err);
      });
      
      // Check backend connectivity (in parallel, don't block voice intro)
      const connected = await checkBackend();
      
      if (connected && mounted) {
        // Backend is connected
        clearTimeout(timeoutId);
        setSplashMessage('SEVEN Systems Online');
        
        // Fade out splash screen
        if (mounted) {
          setTimeout(() => {
            if (mounted) {
              setIsInitializing(false);
              logSystem('SYSTEM', 'Initialization complete.');
            }
          }, 500);
        }
      } else if (mounted) {
        // Backend not connected - show reconnecting message but allow app to load
        setSplashMessage('Reconnecting to Core Systems…');
        setIsReconnecting(true);
        
        // Retry every 3 seconds, but don't block the UI forever
        let retryCount = 0;
        const maxRetries = 5; // Stop retrying after 5 attempts
        
        retryInterval = setInterval(async () => {
          if (!mounted) return;
          
          retryCount++;
          if (retryCount >= maxRetries) {
            // Stop retrying and hide splash screen
            if (mounted) {
              clearTimeout(timeoutId);
              setIsInitializing(false);
              setIsReconnecting(false);
              logSystem('SYSTEM', 'Backend unavailable - continuing without backend.');
            }
            if (retryInterval) {
              clearInterval(retryInterval);
              retryInterval = null;
            }
            return;
          }
          
          const connected = await checkBackend();
          if (connected && mounted) {
            clearTimeout(timeoutId);
            setSplashMessage('SEVEN Systems Online');
            setIsReconnecting(false);
            
            // Voice intro already played on initial load, don't play again
            // Just fade out splash screen
            setTimeout(() => {
              if (mounted) {
                setIsInitializing(false);
                logSystem('SYSTEM', 'Initialization complete.');
              }
            }, 500);
            
            if (retryInterval) {
              clearInterval(retryInterval);
              retryInterval = null;
            }
          }
        }, 3000);
      }
    };

    initialize();
    
    // No return from initialize - cleanup handled in useEffect return

    return () => {
      mounted = false;
      if (retryInterval) {
        clearInterval(retryInterval);
      }
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  // Detect platform on mount
  useEffect(() => {
    detectPlatform().then(setPlatform);
  }, []);

  // Close sidebar on mobile when window resizes to mobile size
  // Only close if actually resizing to mobile, not on initial render
  // Don't auto-close in Electron - disable this feature in Electron
  useEffect(() => {
    const isElectron = typeof window !== 'undefined' && (window as any).electron;
    if (isElectron) {
      // Don't auto-close sidebar in Electron - completely disable resize handler
      console.log('🔄 Electron detected - disabling auto-close on resize');
      return;
    }

    let resizeTimeout: NodeJS.Timeout;
    let lastWidth = window.innerWidth;
    
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const currentWidth = window.innerWidth;
        // Only close if actually resizing TO mobile size (not from mobile to desktop)
        if (currentWidth < 640 && lastWidth >= 640 && showSidebar) {
          console.log('🔄 Window resized to mobile size, closing sidebar');
          setShowSidebar(false);
        }
        lastWidth = currentWidth;
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, [showSidebar]);

  // Test Electron ping functionality
  useEffect(() => {
    window.seven?.ping().then(console.log);
  }, []);

  // Keyboard shortcut for developer console (Ctrl+Shift+S)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+Shift+S (case insensitive)
      if (event.ctrlKey && event.shiftKey && (event.key === 'S' || event.key === 's')) {
        event.preventDefault();
        event.stopPropagation();
        setShowDeveloperConsole((prev) => !prev);
        console.log('🔧 Seven Console toggled:', !showDeveloperConsole);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showDeveloperConsole]);

  // Debug: Log when selectedVoice changes
  useEffect(() => {
    console.log('🎙️ App: selectedVoice changed to:', selectedVoice);
  }, [selectedVoice]);

  // Apply theme to body
  useEffect(() => {
    document.body.className = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Handler to manually save LLM settings
  const saveLlmSettings = () => {
    localStorage.setItem('seven_llmProvider', llmProvider);
    localStorage.setItem('seven_llmModel', llmModel);
    console.log('💾 Saved LLM settings:', { provider: llmProvider, model: llmModel });
    console.log('✅ Settings saved! LLM client will reinitialize automatically.');
  };

  // Handler to load a session from history
  const handleLoadSession = async (sessionId: string, messages: StoredMessage[]) => {
    try {
      console.log('🔵 App.tsx: handleLoadSession called with sessionId:', sessionId);
      // Load the session without page reload
      await loadSession(sessionId);
      console.log('🟢 App.tsx: loadSession completed successfully');
      // Close the history modal
      setShowHistory(false);
    } catch (error) {
      console.error('🔴 App.tsx: Failed to load session:', error);
      console.error('🔴 Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
      // Show error to user
      alert(`Failed to load conversation: ${(error as Error).message}\n\nCheck console for details.`);
    }
  };

  // Initialize AI assistant
  const {
    messages,
    isListening,
    isSpeaking,
    isProcessing,
    isLoading,
    error,
    startListening,
    stopListening,
    sendMessage,
    clearMessages,
    stopSpeaking,
    stopAll,
    handleNewChat,
    loadSession,
  } = useAIAssistant({
    llmConfig: {
      provider: llmProvider,
      model: llmModel,
    },
    autoSpeak,
    wakeWordEnabled,
    selectedVoice,
    continuousVoiceMode,
    voiceRate,
    voicePitch,
  });

  // Load sessions list and refresh when messages change
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const store = getMemoryStore();
        const s = await store.getAllSessions();
        setSessions(s);
      } catch (e) {
        console.warn('Failed to load sessions', e);
      }
    };
    loadSessions();
  }, [messages.length]);

  // Handle media analysis results
  const handleMediaAnalyzed = async (results: any) => {
    try {
      console.log('📊 Full analysis results:', results);
      
      const offline = results.offline_analysis || {};
      const online = results.online_analysis || {};
      
      // Build comprehensive analysis report
      let analysisReport = "📸 **Image Analysis Complete**\n\n";
      
      // 1. Basic Information
      analysisReport += "**Image Properties:**\n";
      if (offline.dimensions) {
        analysisReport += `- Resolution: ${offline.dimensions.width}x${offline.dimensions.height} pixels\n`;
        analysisReport += `- Format: ${offline.format || results.content_type || 'Unknown'}\n`;
        if (results.file_size_bytes) {
          analysisReport += `- File Size: ${(results.file_size_bytes / 1024).toFixed(2)} KB\n`;
        }
      } else if (results.filename) {
        // Fallback if dimensions missing
        analysisReport += `- Filename: ${results.filename}\n`;
        if (results.content_type) {
          analysisReport += `- Type: ${results.content_type}\n`;
        }
        if (results.file_size_bytes) {
          analysisReport += `- File Size: ${(results.file_size_bytes / 1024).toFixed(2)} KB\n`;
        }
      }
      analysisReport += "\n";
      
      // 2. Face Detection
      if (offline.faces?.count > 0) {
        analysisReport += "**Face Detection:**\n";
        analysisReport += `- Detected: ${offline.faces.count} face(s)\n`;
        analysisReport += `- Locations: `;
        offline.faces.locations.forEach((face: any, i: number) => {
          analysisReport += `Face ${i + 1} at (x:${face.x}, y:${face.y}, size:${face.width}x${face.height})`;
          if (i < offline.faces.locations.length - 1) analysisReport += ", ";
        });
        analysisReport += "\n\n";
      } else {
        analysisReport += "**Face Detection:**\n- No faces detected\n\n";
      }
      
      // 3. Text Recognition (OCR)
      if (offline.text?.found) {
        analysisReport += "**Text Recognition (OCR):**\n";
        analysisReport += `- Text Found: Yes\n`;
        analysisReport += `- Word Count: ${offline.text.word_count}\n`;
        analysisReport += `- Content: "${offline.text.full_text}"\n\n`;
      } else {
        analysisReport += "**Text Recognition (OCR):**\n- No text detected\n\n";
      }
      
      // 4. Color Analysis
      if (offline.colors) {
        analysisReport += "**Color Analysis:**\n";
        const mean = offline.colors.mean;
        const dom = offline.colors.dominant;
        analysisReport += `- Average Color: RGB(${mean.r}, ${mean.g}, ${mean.b})\n`;
        analysisReport += `- Dominant Color: RGB(${dom.r}, ${dom.g}, ${dom.b})\n`;
        
        // Describe the color tone
        const avgBrightness = (mean.r + mean.g + mean.b) / 3;
        if (avgBrightness > 180) analysisReport += `- Overall Tone: Bright/Light\n`;
        else if (avgBrightness > 100) analysisReport += `- Overall Tone: Medium\n`;
        else analysisReport += `- Overall Tone: Dark\n`;
        
        // Describe color warmth
        if (mean.r > mean.b + 30) analysisReport += `- Color Temperature: Warm (red/orange tones)\n`;
        else if (mean.b > mean.r + 30) analysisReport += `- Color Temperature: Cool (blue tones)\n`;
        else analysisReport += `- Color Temperature: Neutral\n`;
        analysisReport += "\n";
      }
      
      // 5. Quality Metrics
      if (offline.metrics) {
        analysisReport += "**Image Quality Analysis:**\n";
        const m = offline.metrics;
        analysisReport += `- Brightness: ${m.brightness.toFixed(1)}/255 `;
        if (m.brightness > 200) analysisReport += "(Very Bright)\n";
        else if (m.brightness > 150) analysisReport += "(Bright)\n";
        else if (m.brightness > 100) analysisReport += "(Normal)\n";
        else if (m.brightness > 50) analysisReport += "(Dark)\n";
        else analysisReport += "(Very Dark)\n";
        
        analysisReport += `- Contrast: ${m.contrast.toFixed(1)} `;
        if (m.contrast > 70) analysisReport += "(High Contrast)\n";
        else if (m.contrast > 40) analysisReport += "(Good Contrast)\n";
        else analysisReport += "(Low Contrast)\n";
        
        analysisReport += `- Sharpness: ${m.sharpness.toFixed(1)} `;
        if (m.sharpness > 300) analysisReport += "(Very Sharp)\n";
        else if (m.sharpness > 150) analysisReport += "(Sharp)\n";
        else if (m.sharpness > 100) analysisReport += "(Acceptable)\n";
        else analysisReport += "(Blurry)\n";
        
        analysisReport += `- Overall Quality: ${m.quality.charAt(0).toUpperCase() + m.quality.slice(1)}\n\n`;
      }
      
      // 6. Objects Detected
      if (offline.objects?.detected_regions > 0) {
        analysisReport += "**Object Detection:**\n";
        analysisReport += `- Detected Regions: ${offline.objects.detected_regions}\n`;
        analysisReport += `- ${offline.objects.description}\n\n`;
      }
      
      // 7. AI Description (if available)
      const onlineDesc = online.description;
      if (onlineDesc && !onlineDesc.toLowerCase().includes('not supported') && 
          !onlineDesc.toLowerCase().includes('failed') && 
          !onlineDesc.toLowerCase().includes('error')) {
        analysisReport += "**AI-Powered Description:**\n";
        analysisReport += `${onlineDesc}\n\n`;
      }
      
      // Check if we have enough data
      const hasData = offline.dimensions || offline.faces || offline.colors || offline.metrics;
      
      if (!hasData) {
        analysisReport += "\n⚠️ **Analysis Error:**\n";
        analysisReport += "The analysis returned incomplete data. This might be due to:\n";
        analysisReport += "1. Backend processing error\n";
        analysisReport += "2. Unsupported image format\n";
        analysisReport += "3. Corrupted image file\n\n";
        analysisReport += "Please check the browser console for details or try uploading a different image.\n";
      } else {
        // Final instruction to Seven
        analysisReport += "---\n\n";
        analysisReport += "Please analyze this data and provide:\n";
        analysisReport += "1. A comprehensive summary of what you see\n";
        analysisReport += "2. Insights about the image composition and quality\n";
        analysisReport += "3. Any notable observations or recommendations\n";
        analysisReport += "4. Answer any specific questions I might have about the image";
      }

      // Send to Seven
      await sendMessage(analysisReport);

    } catch (error) {
      console.error('Failed to process media analysis:', error);
      await sendMessage(`❌ Error processing media analysis: ${error instanceof Error ? error.message : 'Unknown error'}. Please check the console for details.`);
    }
  };

  return (
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark bg-gray-950' : 'light bg-white'}`}>
      {/* Splash Screen - Shows during initialization */}
      {isInitializing && (
        <SplashScreen 
          message={splashMessage} 
          isReconnecting={isReconnecting}
        />
      )}

      {/* Title Bar - Shows in both Electron and Web */}
      <TitleBar 
        title="SEVEN" 
        onShowSidebar={() => {
          console.log('🔄 TitleBar onShowSidebar called, current state:', showSidebar);
          // Use functional update to ensure we're toggling based on current state
          setShowSidebar((prev) => {
            const newState = !prev;
            console.log('🔄 Setting sidebar from', prev, 'to', newState);
            console.log('🔄 Window width:', window.innerWidth, 'isMobile:', window.innerWidth < 640);
            console.log('🔄 Electron:', typeof window !== 'undefined' && (window as any).electron);
            // Force a re-render by scheduling state update
            setTimeout(() => {
              console.log('🔄 Sidebar state after update should be:', newState);
            }, 0);
            return newState;
          });
        }}
      />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        isOpen={showSidebar}
        onClose={() => {
          console.log('🔄 Sidebar onClose called');
          setShowSidebar(false);
        }}
        onShowSidebar={() => {
          console.log('🔄 Sidebar onShowSidebar called, current state:', showSidebar);
          setShowSidebar(!showSidebar);
        }}
        isDarkMode={isDarkMode}
        autoSpeak={autoSpeak}
        onToggleVoice={() => setAutoSpeak(!autoSpeak)}
        onToggleTheme={toggleTheme}
        onNewChat={handleNewChat}
        sessions={sessions}
        onSelectSession={async (sessionId: string) => {
          await loadSession(sessionId);
          setShowSidebar(false);
        }}
        onShowSettings={() => {
          setShowSettings(true);
          setShowSidebar(false);
        }}
        onShowHistory={() => {
          setShowHistory(true);
          setShowSidebar(false);
        }}
        onShowMediaCapture={() => {
          setShowMediaCapture(true);
          setShowSidebar(false);
        }}
        onShowFactsManager={() => {
          setShowFactsManager(true);
          setShowSidebar(false);
        }}
        onShowMemoryStats={() => {
          setShowMemoryStats(true);
          setShowSidebar(false);
        }}
        onClearMessages={clearMessages}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen">
      {/* Content Area - Adjusts with sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          marginLeft: showSidebar && window.innerWidth >= 640 ? (window.innerWidth < 1024 ? 240 : 260) : 0 
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="flex-1 flex flex-col overflow-hidden pt-8 sm:pt-9"
      >

        {/* Sidebar Divider */}
        <motion.div
          initial={false}
          animate={{ 
            opacity: showSidebar ? 1 : 0,
            x: showSidebar ? (window.innerWidth < 1024 ? -240 : -260) : 0
          }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="fixed left-0 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-gray-700 to-transparent z-30 pointer-events-none"
          style={{ 
            left: window.innerWidth < 1024 ? '240px' : '260px'
          }}
        />

        {/* Offline Banner */}
        <OfflineBanner isOnline={isOnline} />

      {/* Settings Modal */}
          {showSettings && (
              <Settings
                llmProvider={llmProvider}
                llmModel={llmModel}
                autoSpeak={autoSpeak}
                wakeWordEnabled={wakeWordEnabled}
                continuousVoiceMode={continuousVoiceMode}
                onProviderChange={setLlmProvider}
                onModelChange={setLlmModel}
                onAutoSpeakChange={setAutoSpeak}
                onWakeWordChange={setWakeWordEnabled}
                onContinuousVoiceModeChange={setContinuousVoiceMode}
                onSaveLlmSettings={saveLlmSettings}
                onClose={() => setShowSettings(false)}
              />
          )}

      {/* Chat History Modal */}
      {showHistory && (
        <ChatHistory
          onClose={() => setShowHistory(false)}
          onLoadSession={handleLoadSession}
        />
      )}

      {/* Memory Stats Modal */}
      {showMemoryStats && (
        <MemoryStats
          isOpen={showMemoryStats}
          onClose={() => setShowMemoryStats(false)}
        />
      )}

      {/* Facts Manager Modal */}
      {showFactsManager && (
        <FactsManager
          isOpen={showFactsManager}
          onClose={() => setShowFactsManager(false)}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Media Capture Modal */}
      {showMediaCapture && (
        <MediaCapture
          onMediaAnalyzed={handleMediaAnalyzed}
          onClose={() => setShowMediaCapture(false)}
        />
      )}

      {/* Seven Console - Jarvis-style terminal */}
      <SevenConsole
        isOpen={showDeveloperConsole}
        onClose={() => {
          console.log('🔧 Closing Seven Console');
          setShowDeveloperConsole(false);
        }}
      />
      
      {/* Debug: Show console toggle button (temporary for testing) */}
      {!showDeveloperConsole && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setShowDeveloperConsole(true)}
          className="fixed bottom-4 right-4 z-40 p-2 sm:p-2.5 md:p-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-lg font-mono text-[9px] sm:text-[10px] md:text-xs font-bold transition-colors touch-manipulation"
          style={{ minWidth: '36px', minHeight: '36px' }}
          title="Open Seven Console (Ctrl+Shift+S)"
        >
          <span className="hidden sm:inline">7</span>
          <span className="sm:hidden">7</span>
        </motion.button>
      )}

      {/* Error Display */}
      {error && (
        <div className="glass-dark border border-red-500 border-opacity-50 bg-red-900 bg-opacity-20 text-red-300 px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={stopAll}
              className="text-red-300 hover:text-red-100"
              title="Stop all activity"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Message List */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="flex gap-1 justify-center mb-4">
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Loading conversation history...</p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} isProcessing={isProcessing} isListening={isListening} />
      )}

      {/* Input Area */}
      <InputArea
        onSendMessage={sendMessage}
        onStartListening={startListening}
        onStopListening={stopListening}
        onStopSpeaking={stopSpeaking}
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        hasMessages={messages.length > 0}
      />

        {/* Wake Word Indicator */}
        <WakeWordIndicator isActive={wakeWordEnabled} />
      </motion.div>
      {/* End Content Area */}
      </div>
      {/* End Main Content Area */}
      </div>
    </div>
  );
};

