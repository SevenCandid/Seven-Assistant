/**
 * Custom React hook for AI Assistant functionality
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createLLMClient, LLMClient, LLMConfig, FileAttachment } from '../../core/llm';
import { createSpeechRecognition, createSpeechSynthesis, SpeechRecognition, SpeechSynthesis } from '../../core/speech';
import { createActionExecutor, ActionExecutor } from '../../core/actions';
import { createWakeWordDetector, WakeWordDetector } from '../../core/wakeword';
import { getMemoryStore, StoredMessage } from '../../memory/memoryStore';
import { getPluginManager } from '../../plugins/pluginManager';
import { backendApi } from '../../core/backendApi';

export interface EmotionData {
  emotion: string;
  sentiment?: string;
  confidence?: number;
  description?: string;
  source?: string;
}

export interface ConfidenceData {
  score: number;
  intent: string;
  is_ambiguous: boolean;
  needs_clarification: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
  emotion?: EmotionData;
  confidence?: ConfidenceData;
  is_clarifying_question?: boolean;
}

export interface UseAIAssistantOptions {
  llmConfig: LLMConfig;
  autoSpeak?: boolean;
  wakeWordEnabled?: boolean;
  selectedVoice?: string;
  continuousVoiceMode?: boolean;
  voiceRate?: number;
  voicePitch?: number;
}

export const useAIAssistant = (options: UseAIAssistantOptions) => {
  // Load messages from memory store (IndexedDB/localStorage)
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const memoryStore = useRef(getMemoryStore());
  const pluginManager = useRef(getPluginManager());

  // Load recent messages and user facts on mount
  useEffect(() => {
    const loadMemoryAndFacts = async () => {
      try {
        console.log('📂 Loading recent messages and facts from memory...');
        
        // Ensure a session exists
        let currentSessionId = memoryStore.current.getCurrentSessionId();
        if (!currentSessionId) {
          console.log('💬 No active session found, creating new session...');
          const newSession = await memoryStore.current.createSession();
          currentSessionId = newSession.id;
          console.log('✅ Created initial session:', currentSessionId);
        } else {
          console.log('📂 Continuing session:', currentSessionId);
        }
        
        // Load recent messages from current session (increase window for better recall)
        const recentMessages = await memoryStore.current.getSessionMessages(currentSessionId, 200);
        
        const converted: Message[] = recentMessages.map((msg: StoredMessage) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
        }));
        
        setMessages(converted);
        console.log('✅ Loaded', converted.length, 'messages from current session');
        
        // Get total count across all sessions
        const count = await memoryStore.current.getMessageCount();
        if (count > converted.length) {
          console.log(`📚 ${count} total messages across all sessions`);
        }

        // Load user facts and set them in LLM
        const factsPrompt = await memoryStore.current.getFactsForPrompt();
        if (factsPrompt && llmClientRef.current) {
          llmClientRef.current.setUserFacts(factsPrompt);
          console.log('💡 Loaded user facts into LLM context');
        }

        // Load conversation history into LLM context
        if (llmClientRef.current && converted.length > 0) {
          const historyForLLM = converted.map(msg => ({
            role: msg.role,
            content: msg.content
          }));
          llmClientRef.current.loadConversationHistory(historyForLLM);
          console.log('📚 Loaded conversation history into LLM');
        }
      } catch (error) {
        console.error('Failed to load messages from memory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMemoryAndFacts();
  }, []);

  const llmClientRef = useRef<LLMClient | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);
  const actionExecutorRef = useRef<ActionExecutor | null>(null);
  const wakeWordDetectorRef = useRef<WakeWordDetector | null>(null);
  
  // Add refs for speech timeout handling
  const speechTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>('');
  
  // Keep latest options in ref to avoid stale closures
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
    console.log('🔄 Options updated:', {
      autoSpeak: options.autoSpeak,
      selectedVoice: options.selectedVoice,
      voiceRate: options.voiceRate,
      voicePitch: options.voicePitch,
      wakeWordEnabled: options.wakeWordEnabled
    });
  }, [options]);

  // Initialize services
  useEffect(() => {
    console.log('🔄 Initializing LLM client with config:', options.llmConfig);
    llmClientRef.current = createLLMClient(options.llmConfig);
    
    // Set plugin descriptions for LLM
    const pluginDescriptions = pluginManager.current.getPluginDescriptions();
    llmClientRef.current.setPluginDescriptions(pluginDescriptions);
    console.log('🔌 Registered plugins with LLM:', pluginManager.current.getPluginList());
    
    // Restore conversation history from messages
    if (messages.length > 0) {
      messages.forEach(msg => {
        if (llmClientRef.current) {
          llmClientRef.current.addToHistory({
            role: msg.role as 'user' | 'assistant',
            content: msg.content
          });
        }
      });
      console.log('📚 Restored', messages.length, 'messages to LLM context');
    }
    
    speechRecognitionRef.current = createSpeechRecognition({
      continuous: true, // Keep listening continuously
      interimResults: true,
    });
    speechSynthesisRef.current = createSpeechSynthesis();
    actionExecutorRef.current = createActionExecutor();
    
    // Initialize wake word detector
    wakeWordDetectorRef.current = createWakeWordDetector({
      wakeWord: 'seven',
      continuous: true,
    });

    // Set up speech recognition callbacks with silence detection
    speechRecognitionRef.current.onResult((result) => {
      // Update last transcript immediately
      lastTranscriptRef.current = result.transcript;

      console.log('🎤 Speech detected:', result.isFinal ? 'FINAL' : 'interim', `"${result.transcript}"`);

      // Clear existing timeout whenever we get new speech
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }

      // Set a timeout that will trigger if no more speech is detected
      // This timeout resets every time we get new speech input
      speechTimeoutRef.current = setTimeout(() => {
        const transcriptToProcess = lastTranscriptRef.current.trim();
        console.log('⏸️ 1.2 seconds of silence detected after speaking');
        
        // Stop listening first
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }
        setIsListening(false);
        
        // Process if we have text
        if (transcriptToProcess) {
          console.log('📝 Processing input:', `"${transcriptToProcess}"`);
          lastTranscriptRef.current = ''; // Clear before processing
          handleUserInput(transcriptToProcess);
        } else {
          console.log('⚠️ No speech detected, closing...');
        }
      }, 1200); // Faster silence detection for snappier responses
    });

    speechRecognitionRef.current.onError((error) => {
      console.error('🎤 Speech recognition error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = '';
      switch (error) {
        case 'no-speech':
          // This is handled silently in speech.ts, shouldn't reach here
          console.log('ℹ️ No speech detected');
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions and try again.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
          break;
        case 'network':
          // Detect if we're in Electron and provide helpful message
          const isElectron = typeof window !== 'undefined' && (window as any).electron;
          if (isElectron) {
            errorMessage = 'Network error. Speech recognition requires internet connection.\n\n💡 Tips:\n- Check your internet connection\n- Speech recognition uses Google\'s cloud service\n- Try restarting the app if connection is available';
          } else {
            errorMessage = 'Network error. Speech recognition requires internet connection.\n\n💡 Make sure you\'re connected to the internet.';
          }
          break;
        case 'aborted':
          // User manually stopped, not an error
          console.log('🛑 Speech recognition aborted by user');
          break;
        default:
          errorMessage = `Speech recognition error: ${error}`;
      }
      
      if (errorMessage) {
        setError(errorMessage);
      }
      
      setIsListening(false);
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    });

    // Set up wake word callbacks
    wakeWordDetectorRef.current.onWakeWord(() => {
      console.log('✨ Wake word "Seven" detected!');
      // Only start if not already listening
      if (!isListening) {
        startListening();
      } else {
        console.log('⚠️ Already listening, ignoring wake word');
      }
    });

    wakeWordDetectorRef.current.onError((error) => {
      // Silently ignore wake word errors (conflicts with main speech recognition)
      if (error !== 'aborted') {
        console.warn('⚠️ Wake word error:', error);
      }
    });

    return () => {
      speechRecognitionRef.current?.stop();
      speechSynthesisRef.current?.stop();
      wakeWordDetectorRef.current?.stop();
      if (speechTimeoutRef.current) {
        clearTimeout(speechTimeoutRef.current);
      }
    };
  }, [options.llmConfig.provider, options.llmConfig.model]);

  // Handle wake word enable/disable
  // Stop wake word detector when listening starts to prevent conflicts
  useEffect(() => {
    if (!options.wakeWordEnabled) {
      // Wake word is disabled - stop it
      if (wakeWordDetectorRef.current) {
        console.log('🛑 Stopping wake word detector (disabled)...');
        wakeWordDetectorRef.current.stop();
      }
    } else if (isListening) {
      // When listening starts, stop wake word detector to prevent conflicts
      // Stop silently to avoid abort errors in logs
      if (wakeWordDetectorRef.current && wakeWordDetectorRef.current.isActive) {
        wakeWordDetectorRef.current.stop(true); // Pass true for silent stop
      }
    } else if (wakeWordDetectorRef.current && !wakeWordDetectorRef.current.isActive) {
      // Start wake word detector when not listening and wake word is enabled
      console.log('🎯 Starting wake word detector...');
      wakeWordDetectorRef.current.start();
    }
  }, [options.wakeWordEnabled, isListening]);

  /**
   * Handle user input (text or voice) with optional file attachments
   */
  const handleUserInput = useCallback(async (text: string, files?: FileAttachment[]) => {
    if ((!text.trim() && !files?.length)) return;

    // Track timing for performance monitoring
    const requestStartTime = performance.now();
    console.log('⏱️ [TIMING] Request started at:', new Date().toISOString());

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text || (files && files.length > 0 ? `[${files.length} file(s) attached]` : ''),
      timestamp: new Date(),
      files: files,
      emotion: undefined, // Will be populated from backend response
    };

    // Save to memory store immediately
    const memorySaveStart = performance.now();
    await memoryStore.current.saveMessage('user', userMessage.content, userMessage.timestamp, userMessage.id);
    console.log(`⏱️ [TIMING] Memory save took: ${(performance.now() - memorySaveStart).toFixed(2)}ms`);

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔌 Sending message to backend API...');

      // Normalize input text (help voice transcripts feel more natural)
      const normalizeInput = (t: string): string => {
        let out = t.trim().replace(/\s+/g, ' ');
        // Capitalize first letter if sentence-like
        if (out && /[a-z]/.test(out[0])) {
          out = out[0].toUpperCase() + out.slice(1);
        }
        // Ensure terminal punctuation for declaratives
        if (out && !/[.!?]$/.test(out)) {
          out += '.';
        }
        return out;
      };
      const originalText = text;
      const normalizedText = normalizeInput(originalText);

      // ---------- User name/creator extraction and recall ----------
      const userCreatorClaim = /(\bi am\b|\bi'm\b)\s+(your\s+)?creator\b|\bI'm\s+your\s+maker\b|\bi\s+created\s+you\b/i.test(text);
      const nameFromStatement = (() => {
        const t = text.trim();
        // Patterns: "my name is X", "call me X", "I'm X" (only short 1-3 word names)
        const patterns = [
          /\bmy\s+name\s+is\s+([A-Za-z][A-Za-z\-\'\s]{0,40})$/i,
          /\bcall\s+me\s+([A-Za-z][A-Za-z\-\'\s]{0,40})$/i,
          /\bI\s*am\s+([A-Za-z][A-Za-z\-\'\s]{0,40})$/i,
          /\bI'm\s+([A-Za-z][A-Za-z\-\'\s]{0,40})$/i
        ];
        for (const p of patterns) {
          const m = t.match(p);
          if (m && m[1]) {
            return m[1].trim().replace(/\s+/g, ' ').slice(0, 40);
          }
        }
        return '';
      })();

      if (userCreatorClaim) {
        try {
          const creatorName = 'Frank';
          localStorage.setItem('seven_user_is_creator', 'true');
          localStorage.setItem('seven_user_name', creatorName);
          try {
            const store = memoryStore.current as any;
            if (store.saveFact) {
              await store.saveFact("User is the creator", 'personal', 1.0);
              await store.saveFact("User's name is Frank", 'personal', 1.0);
              await store.saveFact("Frank is building SEVEN", 'personal', 1.0);
            }
          } catch {}
          const ack = "Got it — you're my creator, Frank. I'll remember that you're building me, and I'll get to know you very well.";
          const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: ack, timestamp: new Date() };
          await memoryStore.current.saveMessage('assistant', ack, assistantMessage.timestamp, assistantMessage.id);
          setMessages((prev) => [...prev, assistantMessage]);
          if (options.autoSpeak && speechSynthesisRef.current) {
            await speechSynthesisRef.current.speak(ack, {
              rate: 0.9,
              pitch: 1,
              volume: 1,
            });
          }
          setIsProcessing(false);
          return;
        } catch {}
      }

      if (nameFromStatement) {
        try {
          // Persist locally for fast recall
          localStorage.setItem('seven_user_name', nameFromStatement);
          // Save as a long-term fact
          try {
            const store = memoryStore.current;
            // @ts-ignore saveFact exists in memory store
            // Fallback if not available will be caught silently
            // Fact format kept consistent for later retrieval
            await (store as any).saveFact(`User's name is ${nameFromStatement}`, 'personal', 1.0);
          } catch {}
          const ack = `Nice to meet you, ${nameFromStatement}. I’ll remember your name.`;
          const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: ack, timestamp: new Date() };
          await memoryStore.current.saveMessage('assistant', ack, assistantMessage.timestamp, assistantMessage.id);
          setMessages((prev) => [...prev, assistantMessage]);
          if (options.autoSpeak && speechSynthesisRef.current) {
            await speechSynthesisRef.current.speak(ack, {
              rate: 0.9,
              pitch: 1,
              volume: 1,
            });
          }
          setIsProcessing(false);
          return;
        } catch {}
      }

      const asksUserName = /\bwhat\s+is\s+my\s+name\b|\bdo\s+you\s+remember\s+my\s+name\b/i.test(text);
      if (asksUserName) {
        let name = localStorage.getItem('seven_user_name') || '';
        if (!name) {
          const isCreator = localStorage.getItem('seven_user_is_creator') === 'true';
          if (isCreator) name = 'Frank';
        }
        if (!name) {
          try {
            const store = memoryStore.current as any;
            if (store.getAllFacts) {
              const facts = await store.getAllFacts();
              const nameFact = (facts || []).find((f: any) => typeof f.fact === 'string' && /User's name is/i.test(f.fact));
              if (nameFact) {
                const m = String(nameFact.fact).match(/User's name is\s+(.+)/i);
                if (m && m[1]) name = m[1].trim();
              }
            }
          } catch {}
        }
        const reply = name ? `Your name is ${name}.` : `I don't have your name yet. Tell me by saying, "my name is ..."`;
        const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: reply, timestamp: new Date() };
        await memoryStore.current.saveMessage('assistant', reply, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        if (options.autoSpeak && speechSynthesisRef.current) {
          await speechSynthesisRef.current?.speak(reply, {
            rate: 0.9,
            pitch: 1,
            volume: 1,
          });
        }
        setIsProcessing(false);
        return;
      }

      // Special: "Do you know me" → friendly recap + memory confirmation
      const asksKnowMe = /\b(do\s+you\s+know\s+me|know\s+who\s+I\s+am)\b/i.test(text);
      if (asksKnowMe) {
        let summary = '';
        try {
          const store = memoryStore.current as any;
          const facts = store.getAllFacts ? await store.getAllFacts() : [];
          const rememberedName = localStorage.getItem('seven_user_name') || (localStorage.getItem('seven_user_is_creator') === 'true' ? 'Frank' : '');

          // Build clean, de-duplicated bullets
          const bulletSet = new Set<string>();

          if (rememberedName) {
            bulletSet.add(`Name: ${rememberedName}`);
          }

          (facts || []).forEach((f: any) => {
            if (!f || typeof f.fact !== 'string') return;
            let fact = f.fact.trim();
            if (!fact) return;
            // Normalize common variants
            fact = fact.replace(/User's name is\s+your\s+creator/i, "User's name is Frank");
            fact = fact.replace(/User's name is\s+seven/i, "User's name is Seven");
            if (/User's name is/i.test(fact)) {
              // Collapse into Name bullet if we already have name
              if (rememberedName) return;
            }
            bulletSet.add(fact);
          });

          const bullets = Array.from(bulletSet).slice(0, 6);

          summary = bullets.length
            ? `Yes — here’s what I know about you:\n\n- ${bullets.join('\n- ')}\n\nWould you like me to remember or forget any of that?`
            : `I’m getting to know you. Tell me a few details (e.g., “my name is Frank”, “I study Computer Engineering”), and I’ll remember them. Want me to start remembering now?`;
        } catch {
          summary = 'I’m getting to know you. Share a few details and I’ll remember them.';
        }

        const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: summary, timestamp: new Date() };
        await memoryStore.current.saveMessage('assistant', summary, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        if (options.autoSpeak && speechSynthesisRef.current) {
              try { 
                if (speechSynthesisRef.current) {
                  await speechSynthesisRef.current.speak(summary, {
                    rate: 0.9,
                    pitch: 1,
                    volume: 1,
                  });
                }
              } catch {}
        }
        setIsProcessing(false);
        return;
      }

      // Quick intents: handle simple app/URL opens locally for snappier UX
      // Enhanced natural language detection - handles many variations
      const t = text.trim().toLowerCase();
      
      // Broader intent detection to handle natural variations:
      // "open youtube" / "launch youtube" / "start youtube" / "go to youtube" / "show me youtube" / "youtube please"
      const openYouTube = /(open|launch|start|go\s+to|show\s+me|take\s+me\s+to|navigate\s+to|visit|bring\s+up|display|load|access)[^\n]{0,60}\b(youtube|yt)\b/i.test(text) ||
                          /\b(youtube|yt)\b[^\n]{0,40}(please|now|for\s+me)/i.test(text);
      
      const openTwitter = /(open|launch|start|go\s+to|show\s+me|take\s+me\s+to|navigate\s+to|visit|bring\s+up|display|load|access)[^\n]{0,60}\b(twitter|x\.com|x)\b/i.test(text) ||
                          /\b(twitter|x\.com|x)\b[^\n]{0,40}(please|now|for\s+me)/i.test(text);
      
      const openTikTok = /(open|launch|start|go\s+to|show\s+me|take\s+me\s+to|navigate\s+to|visit|bring\s+up|display|load|access)[^\n]{0,60}\b(tiktok|tik\s*tok)\b/i.test(text) ||
                         /\b(tiktok|tik\s*tok)\b[^\n]{0,40}(please|now|for\s+me)/i.test(text);
      
      const openFacebook = /(open|launch|start|go\s+to|show\s+me|take\s+me\s+to|navigate\s+to|visit|bring\s+up|display|load|access)[^\n]{0,60}\b(facebook|fb)\b/i.test(text) ||
                           /\b(facebook|fb)\b[^\n]{0,40}(please|now|for\s+me)/i.test(text);

      // Quick intent: reminder (ask for details if ambiguous)
      // Enhanced to handle: "remind me" / "set a reminder" / "don't let me forget" / "can you remind me" / "I need a reminder"
      const reminderIntent = /(set\s+(a\s+)?reminder|remind\s+me|don'?t\s+let\s+me\s+forget|can\s+you\s+remind|I\s+need\s+(a\s+)?reminder|make\s+sure\s+I\s+remember)/i.test(text);
      if (reminderIntent) {
        const hasTomorrow = /\btomorrow\b/i.test(text);
        const detailAsk = hasTomorrow
          ? 'What time tomorrow, and what should I remind you about?'
          : 'When should I remind you, and what should the reminder say?';
        const reply = `I can set that. ${detailAsk}`;
        const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: reply, timestamp: new Date() };
        await memoryStore.current.saveMessage('assistant', reply, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        if (options.autoSpeak && speechSynthesisRef.current) {
          await speechSynthesisRef.current?.speak(reply, {
            rate: 0.9,
            pitch: 1,
            volume: 1,
          });
        }
        setIsProcessing(false);
        return;
      }
      if (openYouTube && actionExecutorRef.current) {
        // Execute URL open immediately
        await actionExecutorRef.current.execute('open_url', 'https://www.youtube.com');

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: 'Opening YouTube...',
          timestamp: new Date(),
        };

        await memoryStore.current.saveMessage('assistant', assistantMessage.content, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }

      if (openTwitter && actionExecutorRef.current) {
        await actionExecutorRef.current.execute('open_url', 'https://x.com');

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: 'Opening X (Twitter)...',
          timestamp: new Date(),
        };

        await memoryStore.current.saveMessage('assistant', assistantMessage.content, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }

      if (openTikTok && actionExecutorRef.current) {
        await actionExecutorRef.current.execute('open_url', 'https://www.tiktok.com');

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: 'Opening TikTok...',
          timestamp: new Date(),
        };

        await memoryStore.current.saveMessage('assistant', assistantMessage.content, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }

      if (openFacebook && actionExecutorRef.current) {
        await actionExecutorRef.current.execute('open_url', 'https://www.facebook.com');

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: 'Opening Facebook...',
          timestamp: new Date(),
        };

        await memoryStore.current.saveMessage('assistant', assistantMessage.content, assistantMessage.timestamp, assistantMessage.id);
        setMessages((prev) => [...prev, assistantMessage]);
        setIsProcessing(false);
        return;
      }

      // Quick intents: read recent emails (supports counts like 5)
      // Enhanced to handle: "read my emails" / "show my inbox" / "check my mail" / "what's in my inbox" / "any new emails"
      const emailCountMatch = text.match(/read\s+(my\s+)?(\d+)\s+most\s+recent\s+emails?/i) || 
                              text.match(/(\d+)\s+(most\s+)?recent\s+emails?/i);
      const readMostRecentEmail = /(read|show|check|display|get|fetch|what'?s|any)\s+(my\s+)?(most\s+)?(recent|latest|new)\s+(emails?|messages?|mail|inbox)|show\s+my\s+inbox|check\s+my\s+mail|read\s+my\s+latest\s+email|any\s+(new\s+)?emails?/i.test(text);
      if (readMostRecentEmail || emailCountMatch) {
        try {
          const count = emailCountMatch ? Math.max(1, Math.min(20, parseInt(emailCountMatch[1], 10))) : 1;
          const res = await backendApi.getRecentEmails(count);
          if (res.count > 0 && res.emails.length > 0) {
            let content = '';
            if (count === 1) {
              const e = res.emails[0];
              content = `Here is your most recent email:\nFrom: ${e.from}\nSubject: ${e.subject}\n\n${e.snippet}`;
            } else {
              content = `Here are your ${res.emails.length} most recent emails:`;
              res.emails.forEach((e, i) => {
                content += `\n\n${i + 1}. From: ${e.from}\n   Subject: ${e.subject}\n   ${e.snippet}`;
              });
            }
            const assistantMessage: Message = {
              id: `${Date.now()}-assistant`,
              role: 'assistant',
              content,
              timestamp: new Date(),
            };
            await memoryStore.current.saveMessage('assistant', content, assistantMessage.timestamp, assistantMessage.id);
            setMessages((prev) => [...prev, assistantMessage]);
            if (options.autoSpeak && speechSynthesisRef.current) {
              if (speechSynthesisRef.current) {
                await speechSynthesisRef.current.speak(content, {
                  rate: 0.9,
                  pitch: 1,
                  volume: 1,
                });
              }
            }
          } else {
            const msg = 'I could not find any recent emails.';
            const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: msg, timestamp: new Date() };
            await memoryStore.current.saveMessage('assistant', msg, assistantMessage.timestamp, assistantMessage.id);
            setMessages((prev) => [...prev, assistantMessage]);
          }
        } catch (err) {
          const msg = 'Gmail is not connected. Please open Settings → Integrations and connect Gmail.';
          const assistantMessage: Message = { id: `${Date.now()}-assistant`, role: 'assistant', content: msg, timestamp: new Date() };
          await memoryStore.current.saveMessage('assistant', msg, assistantMessage.timestamp, assistantMessage.id);
          setMessages((prev) => [...prev, assistantMessage]);
        }
        setIsProcessing(false);
        return;
      }

      // Detect capability questions (shared for backend and fallback)
      const isCapabilitiesQuestion = (t: string): boolean => {
        const s = t.toLowerCase();
        return /what\s+can\s+you\s+do|things\s+you\s+can\s+do|your\s+capabilities|features|help\s+me\s+with|what\s+are\s+your\s+features/.test(s);
      };

      const capabilityMessage = (
        "I'm Seven—here's what I can do:\n\n" +
        "1. Voice Interaction\n" +
        "   - Wake word: say 'Seven' to activate\n" +
        "   - Speech-to-Text (listen via microphone)\n" +
        "   - Text-to-Speech replies\n\n" +
        "2. Web & Search\n" +
        "   - Open any website or URL\n" +
        "   - Search the web for answers\n\n" +
        "3. Time & Productivity\n" +
        "   - Get current time and date\n" +
        "   - Set reminders\n" +
        "   - Take quick notes\n\n" +
        "4. Communication\n" +
        "   - Send SMS/text messages\n" +
        "   - Open WhatsApp chats\n\n" +
        "5. Information\n" +
        "   - Weather for any location\n" +
        "   - General knowledge questions\n\n" +
        "6. Calculations\n" +
        "   - Perform math and conversions\n\n" +
        "7. Memory\n" +
        "   - Remember our conversations across sessions\n" +
        "   - Learn preferences and facts you share\n\n" +
        "8. Cross-Platform\n" +
        "   - Works on desktop, mobile, and web\n" +
        "   - Online and offline modes (where supported)\n\n" +
        "What would you like to try first?"
      );
      
      // Check if backend is available
      const isBackendHealthy = await backendApi.checkHealth();
      
      if (!isBackendHealthy) {
        console.warn('⚠️ Backend not available, falling back to direct LLM client');
        
        // Fallback to direct LLM client if backend is not available
        if (!llmClientRef.current) {
          throw new Error('AI service is not available. Please ensure the backend is running.');
        }
        
        const fallbackResponse = await llmClientRef.current.sendMessage(text, files);

        // Helper: sanitize any JSON-looking response into plain text
        const sanitizeAssistantText = (raw: string | undefined): string => {
          if (!raw) return '';
          let cleaned = raw.trim();
          // Strip markdown code fences
          if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
          }
          // If it's a JSON object with message, extract it
          try {
            const maybeObj = JSON.parse(cleaned);
            if (maybeObj && typeof maybeObj === 'object' && typeof maybeObj.message === 'string') {
              return String(maybeObj.message).trim();
            }
          } catch (_) {
            // Not pure JSON, try to locate an inline JSON {"message": ...}
            const match = cleaned.match(/\{\s*\"message\"\s*:\s*\"([\s\S]*?)\"\s*(?:,|\})/);
            if (match && match[1]) {
              try {
                // Unescape typical JSON escapes
                const unescaped = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
                return unescaped.trim();
              } catch {
                // fallthrough
              }
            }
          }
          return cleaned;
        };

        

        // Ensure creator identity is included when asked about identity/creator
        const lower = text.toLowerCase();
        const asksAboutIdentity = /who\s+created\s+you|who\s+is\s+your\s+creator|tell\s+me\s+about\s+you|who\s+are\s+you|your\s+creator|who\s+made\s+you/.test(lower);
        const userSelfInfo = /(\bi am\b|\bi'm\b|\bmy name is\b|\bcall me\b|\bi study\b|\bi work\b|\bi live\b)/i.test(lower);
        const identityMsg = "I'm Seven, created by Frank. He's actively building and developing me as his AI assistant. Since he's building me, he knows me very well, and I'm designed to be his helpful companion that learns and assists.";
        const memoryMsg = "I remember our conversations. I store chat history locally and can recall what we discussed. What part of our last chat should I revisit?";
        let finalMessage = sanitizeAssistantText(fallbackResponse.message);
        const wrongAttribution = /(openai|meta|anthropic|google|microsoft|x\.ai|cohere)/i.test(finalMessage || '');
        if (isCapabilitiesQuestion(lower)) {
          finalMessage = capabilityMessage;
        } else if (asksAboutIdentity && !userSelfInfo) {
          finalMessage = identityMsg; // Force canonical identity answer
        } else if (wrongAttribution) {
          // If LLM hallucinated creator, correct it
          finalMessage = identityMsg;
        } else if (finalMessage && !/frank|your creator|created by/i.test(finalMessage)) {
          // Otherwise, append identity if missing and contextually relevant
          if (!userSelfInfo && /creator|about\s+you|who\s+are\s+you/i.test(lower)) {
            finalMessage += "\n\n" + identityMsg;
          }
        }

        // Correct any claims of lacking memory
        const deniesMemory = /(don'?t|do not) have (personal )?memories|cannot recall previous conversations|each time you interact.*new conversation|don'?t have the ability to store or recall/i;
        if (deniesMemory.test(finalMessage)) {
          finalMessage = memoryMsg;
        }

        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: finalMessage,
          timestamp: new Date(),
        };

        await memoryStore.current.saveMessage(
          'assistant',
          finalMessage,
          assistantMessage.timestamp,
          assistantMessage.id
        );

        setMessages((prev) => [...prev, assistantMessage]);
        
        // Speak response if enabled
        if (options.autoSpeak && speechSynthesisRef.current && finalMessage) {
          if (speechSynthesisRef.current) {
            await speechSynthesisRef.current.speak(finalMessage, {
              rate: 0.9,
              pitch: 1,
              volume: 1,
            });
          }
        }
        
        setIsProcessing(false);
        return;
      }

      // Use backend API
      const apiCallStart = performance.now();
      console.log(`⏱️ [TIMING] Starting backend API call at ${new Date().toISOString()}`);
      const response = await backendApi.sendMessage({
        message: normalizedText,
        files: files,
        session_id: backendApi.getSessionId() || undefined,
      });
      const apiCallDuration = performance.now() - apiCallStart;
      console.log(`⏱️ [TIMING] Backend API call took: ${apiCallDuration.toFixed(2)}ms (${(apiCallDuration / 1000).toFixed(2)}s)`);

      // Store emotion data from backend if available
      let userEmotion: EmotionData | undefined = undefined;
      if (response.emotion) {
        userEmotion = response.emotion;
        console.log('😊 User emotion detected:', userEmotion.emotion);
      }
      
      // Store confidence data from backend if available
      let userConfidence: ConfidenceData | undefined = undefined;
      let is_clarifying = false;
      if (response.confidence) {
        userConfidence = response.confidence;
        is_clarifying = response.confidence.needs_clarification;
        console.log(`🎯 Query confidence: ${userConfidence.score.toFixed(2)} (intent: ${userConfidence.intent})`);
        if (is_clarifying) {
          console.log('❓ Assistant may ask clarifying question');
        }
      }

      // Post-process backend response to include creator identity when relevant
      const lowerInput = text.toLowerCase();
      const asksAboutIdentityBackend = /who\s+created\s+you|who\s+is\s+your\s+creator|tell\s+me\s+about\s+you|who\s+are\s+you|your\s+creator|who\s+made\s+you/.test(lowerInput);
      const userSelfInfoBackend = /(\bi am\b|\bi'm\b|\bmy name is\b|\bcall me\b|\bi study\b|\bi work\b|\bi live\b)/i.test(lowerInput);
      const identityMsgBackend = "I'm Seven, created by Frank. He's actively building and developing me as his AI assistant. Since he's building me, he knows me very well, and I'm designed to be his helpful companion that learns and assists.";
      const memoryMsgBackend = "I remember our conversations. I store chat history locally and can recall what we discussed. What part of our last chat should I revisit?";
      const sanitizeAssistantText = (raw: string | undefined): string => {
        if (!raw) return '';
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n?|```$/g, '').trim();
        }
        try {
          const maybeObj = JSON.parse(cleaned);
          if (maybeObj && typeof maybeObj === 'object' && typeof maybeObj.message === 'string') {
            return String(maybeObj.message).trim();
          }
        } catch (_) {
          const match = cleaned.match(/\{\s*\"message\"\s*:\s*\"([\s\S]*?)\"\s*(?:,|\})/);
          if (match && match[1]) {
            try {
              const unescaped = match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
              return unescaped.trim();
            } catch {
              // ignore
            }
          }
        }
        return cleaned;
      };
      let backendFinalMessage = sanitizeAssistantText(response.message);
      const backendWrongAttribution = /(openai|meta|anthropic|google|microsoft|x\.ai|cohere)/i.test(backendFinalMessage || '');
      if (isCapabilitiesQuestion(lowerInput)) {
        backendFinalMessage = capabilityMessage;
      } else if (asksAboutIdentityBackend && !userSelfInfoBackend) {
        backendFinalMessage = identityMsgBackend; // Force canonical identity answer
      } else if (backendWrongAttribution) {
        backendFinalMessage = identityMsgBackend; // Correct hallucinated creator
      } else if (backendFinalMessage && !/frank|your creator|created by/i.test(backendFinalMessage)) {
        if (!userSelfInfoBackend && /creator|about\s+you|who\s+are\s+you/i.test(lowerInput)) {
          backendFinalMessage += "\n\n" + identityMsgBackend;
        }
      }

      // Correct any claims of lacking memory
      const deniesMemoryBackend = /(don'?t|do not) have (personal )?memories|cannot recall previous conversations|each time you interact.*new conversation|don'?t have the ability to store or recall/i;
      if (deniesMemoryBackend.test(backendFinalMessage)) {
        backendFinalMessage = memoryMsgBackend;
      }

      let assistantContent = backendFinalMessage;
      // Suppress or tailor clarifier for identity/name statements
      const userSelfInfoNow = /(\bmy name is\b|\bcall me\b|\bI am\b|\bI'm\b|\bi'm\b)/i.test(originalText);
      const creatorClaimNow = /(\bi am\b|\bi'm\b)\s+(your\s+)?creator\b|\bI'm\s+your\s+maker\b|\bi\s+created\s+you\b/i.test(originalText);
      if (is_clarifying && assistantContent && !userSelfInfoNow && !creatorClaimNow && !/[?？！]$/.test(assistantContent)) {
        const shortUser = originalText.trim().slice(0, 60);
        assistantContent += `\n\nCould you clarify what you meant by "${shortUser}"?`;
      }
      // If model produced awkward phrasing like "your creator", replace with remembered name
      const rememberedName = localStorage.getItem('seven_user_name') || (localStorage.getItem('seven_user_is_creator') === 'true' ? 'Frank' : '');
      if (rememberedName) {
        assistantContent = assistantContent.replace(/\byour creator\b/gi, rememberedName);
        assistantContent = assistantContent.replace(/\bthe creator\b/gi, rememberedName);
      }

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date(),
        is_clarifying_question: is_clarifying,
      };

      // Use ref to get latest options (avoid stale closure)
      const currentOptions = optionsRef.current;

      // Save to memory store
      const memorySaveStart = performance.now();
      await memoryStore.current.saveMessage(
        'assistant',
        assistantContent,
        assistantMessage.timestamp,
        assistantMessage.id,
        {
          sessionId: response.session_id,
          voiceUsed: currentOptions.selectedVoice,
        }
      );
      console.log(`⏱️ [TIMING] Memory save (assistant message) took: ${(performance.now() - memorySaveStart).toFixed(2)}ms`);

      // Immediately show message in UI (don't wait for speech)
      const uiUpdateStart = performance.now();
      setMessages((prev) => {
        // Update the user message with emotion and confidence data if available
        const updated = [...prev];
        if ((userEmotion || userConfidence) && updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
          // Find the last user message and add emotion/confidence to it
          for (let i = updated.length - 2; i >= 0; i--) {
            if (updated[i].role === 'user') {
              updated[i] = {
                ...updated[i],
                ...(userEmotion && { emotion: userEmotion }),
                ...(userConfidence && { confidence: userConfidence })
              };
              break;
            }
          }
        }
        return [...updated, assistantMessage];
      });
      console.log(`⏱️ [TIMING] UI update took: ${(performance.now() - uiUpdateStart).toFixed(2)}ms`);

      // Mark processing as complete immediately (message is visible)
      setIsProcessing(false);

      // Handle actions from backend (if any) - run in parallel with speech
      if (response.actions && response.actions.length > 0 && actionExecutorRef.current) {
        console.log('🎯 Executing actions from backend:', response.actions);
        let actionResults = '';
        
        for (const action of response.actions) {
          try {
            const result = await actionExecutorRef.current.execute(action.type, action.data);
            console.log('✅ Action result:', result);
            
            // Format action result as message
            if (result && result.success && result.data) {
              if (action.type === 'get_time' && result.data.time) {
                actionResults += `\n\nThe current time is ${result.data.time}`;
              } else if (action.type === 'get_date' && result.data.date) {
                actionResults += `\n\nToday's date is ${result.data.date}`;
              } else if (result.data.message) {
                actionResults += '\n\n' + result.data.message;
              } else if (result.data.response) {
                actionResults += '\n\n' + result.data.response;
              }
            } else if (result && result.error) {
              console.error('Action error:', result.error);
            }
          } catch (error) {
            console.error('❌ Action execution failed:', error);
          }
        }
        
        // If we got action results, update the assistant message
        if (actionResults) {
          const updatedMessage = assistantContent + actionResults;
          
          // Update the last message
          setMessages((prev) => {
            const updated = [...prev];
            if (updated.length > 0 && updated[updated.length - 1].role === 'assistant') {
              updated[updated.length - 1] = {
                ...updated[updated.length - 1],
                content: updatedMessage,
              };
            }
            return updated;
          });
          
          // Update what we'll speak
          assistantContent = updatedMessage;
        }
      }

      // Speak the response if auto-speak is enabled - start immediately without blocking
      if (currentOptions.autoSpeak && speechSynthesisRef.current && assistantContent) {
        // Start speech asynchronously (don't await - message already visible)
        Promise.resolve().then(async () => {
          const speechStartTime = performance.now();
          setIsSpeaking(true);
          try {
            // Always use auto-selected female Jarvis-like voice (no voice parameter = auto-select)
            console.log('🔊 Attempting to speak response...');
            console.log('📝 Content length:', assistantContent.length);
            console.log('🎙️ AutoSpeak enabled:', currentOptions.autoSpeak);
            console.log('🔊 Speech synthesis ref available:', !!speechSynthesisRef.current);
            
            // Ensure we have valid content to speak
            const contentToSpeak = assistantContent.trim();
            if (!contentToSpeak) {
              console.warn('⚠️ Empty content, skipping speech');
              setIsSpeaking(false);
              return;
            }
            
            await speechSynthesisRef.current.speak(contentToSpeak, {
              // Don't pass voice parameter - let it auto-select best female AI voice
              rate: 0.9, // Calm, confident pace (fixed)
              pitch: 1, // Smooth, confident pitch (fixed)
              volume: 1, // Full volume (fixed)
            });
            
            const speechDuration = performance.now() - speechStartTime;
            console.log(`⏱️ [TIMING] Speech synthesis took: ${speechDuration.toFixed(2)}ms (${(speechDuration / 1000).toFixed(2)}s)`);
            console.log('✅ Speech synthesis call completed');
            
            // Continuous voice mode: auto-listen after speaking
            if (currentOptions.continuousVoiceMode && speechRecognitionRef.current) {
              console.log('🔄 Continuous mode: Starting to listen again...');
              setTimeout(() => {
                if (!isListening && speechRecognitionRef.current) {
                  startListening();
                }
              }, 500); // Small delay after speaking
            }
          } catch (speakError) {
            console.error('❌ Speech synthesis error in useAIAssistant:', speakError);
            console.error('Error details:', {
              message: (speakError as Error).message,
              stack: (speakError as Error).stack,
              autoSpeak: currentOptions.autoSpeak,
              hasContent: !!assistantContent,
              contentLength: assistantContent?.length || 0,
            });
          } finally {
            setIsSpeaking(false);
          }
        });
      } else {
        console.log('🔇 Speech skipped:', {
          autoSpeak: currentOptions.autoSpeak,
          hasSynthesis: !!speechSynthesisRef.current,
          hasContent: !!assistantContent,
        });
      }
    } catch (err) {
      console.error('❌ Error in handleUserInput:', err);
      console.error('Error details:', {
        message: (err as Error).message,
        stack: (err as Error).stack,
        name: (err as Error).name,
      });
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      setIsProcessing(false); // Ensure processing state is cleared on error
      
      // Add user-friendly error message to chat
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: `I apologize, but I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsProcessing(false); // Double ensure processing is cleared
      const totalDuration = performance.now() - requestStartTime;
      console.log(`⏱️ [TIMING] Total request processing time: ${totalDuration.toFixed(2)}ms (${(totalDuration / 1000).toFixed(2)}s)`);
      console.log('✅ Processing complete - isProcessing set to false');
    }
  }, []); // Empty dependency - use optionsRef for latest values

  /**
   * Start voice input
   */
  const startListening = useCallback(async () => {
    // If no messages exist, start a new chat session immediately
    if (messages.length === 0) {
      try {
        console.log('🆕 Starting new chat session for voice input...');
        const newSession = await memoryStore.current.createSession();
        console.log('✅ Created new session:', newSession.id);
        // Clear any existing messages state
        setMessages([]);
      } catch (err) {
        console.warn('⚠️ Failed to create new session:', err);
      }
    }
    if (!speechRecognitionRef.current) {
      setError('Speech recognition not available');
      return;
    }
    
    // Don't start if already listening
    if (isListening) {
      console.log('⚠️ Already listening, ignoring start request');
      return;
    }
    
    console.log('🎤 Starting voice input...');
    
    // Clear any existing transcript
    lastTranscriptRef.current = '';
    
    // Clear any pending timeout
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    setIsListening(true);
    setError(null);
    
    try {
      speechRecognitionRef.current.start();
      console.log('✅ Voice recording started successfully');
      
      // Set a fallback timeout in case no speech is detected at all
      // This ensures the overlay closes even if user says nothing
      speechTimeoutRef.current = setTimeout(() => {
        console.log('⏹️ 10 seconds elapsed with no speech, auto-closing...');
        if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
        }
        setIsListening(false);
        
        // Process if we somehow have text
        const transcriptToProcess = lastTranscriptRef.current.trim();
        if (transcriptToProcess) {
          console.log('📝 Processing captured text:', `"${transcriptToProcess}"`);
          lastTranscriptRef.current = '';
          handleUserInput(transcriptToProcess);
        }
      }, 10000); // 10 second max listening time if no speech (gives user more time to start speaking)
      
    } catch (error) {
      console.error('❌ Error starting speech recognition:', error);
      const errorMessage = (error as Error).message || '';
      
      // If already started, just update state
      if (errorMessage.includes('already started')) {
        console.log('⚠️ Recognition already started, updating state only');
        setIsListening(true);
      } else {
        setError('Failed to start voice recording. Please try again.');
        setIsListening(false);
      }
    }
  }, [isListening, handleUserInput, messages.length]);

  /**
   * Stop voice input
   */
  const stopListening = useCallback(() => {
    console.log('🛑 Stopping voice input manually...');
    
    // Clear any pending timeouts
    if (speechTimeoutRef.current) {
      clearTimeout(speechTimeoutRef.current);
      speechTimeoutRef.current = null;
    }
    
    // Get the transcript before stopping
    const transcriptToProcess = lastTranscriptRef.current.trim();
    
    // Stop the recognition
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping speech recognition:', error);
      }
    }
    setIsListening(false);
    
    // Process any remaining transcript
    if (transcriptToProcess) {
      console.log('📝 Processing transcript from manual stop:', `"${transcriptToProcess}"`);
      lastTranscriptRef.current = '';
      handleUserInput(transcriptToProcess);
    } else {
      console.log('⚠️ No transcript to process from manual stop');
    }
  }, [handleUserInput]);

  /**
   * Send text message
   */
  const sendMessage = useCallback(async (text: string, files?: FileAttachment[]) => {
    await handleUserInput(text, files);
  }, [handleUserInput]);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(async () => {
    await memoryStore.current.clearHistory();
    setMessages([]);
    llmClientRef.current?.clearHistory();
    console.log('🗑️ Cleared conversation memory (IndexedDB + localStorage)');
  }, []);

  /**
   * Stop speaking
   */
  const stopSpeaking = useCallback(() => {
    console.log('🔇 Stopping speech output...');
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.stop();
      setIsSpeaking(false);
    }
  }, []);

  /**
   * Stop all activity (listening + speaking)
   */
  const stopAll = useCallback(() => {
    console.log('⏹️ Stopping all activity...');
    try {
      console.log('  🎤 Calling stopListening...');
      stopListening();
      console.log('  🔊 Calling stopSpeaking...');
      stopSpeaking();
      console.log('✅ stopAll completed successfully');
    } catch (error) {
      console.error('❌ Error in stopAll:', error);
      // Continue even if there's an error
    }
  }, [stopListening, stopSpeaking]);

  /**
   * Start a new chat session
   * Clears the UI but keeps all memories and facts intact
   */
  const handleNewChat = useCallback(async () => {
    try {
      console.log('💬 Starting new chat session...');
      
      // Stop any ongoing activity
      stopAll();
      
      // Clear UI messages
      setMessages([]);
      setError(null);
      
      // Create a new session in the frontend database
      const newSession = await memoryStore.current.createSession();
      console.log('✅ New chat session created (frontend):', newSession.id);
      
      // Create a new session in the backend
      try {
        const backendSession = await backendApi.newSession();
        console.log('✅ New chat session created (backend):', backendSession.session_id);
      } catch (error) {
        console.warn('⚠️ Failed to create backend session, continuing with frontend only:', error);
      }
      
      // Reload user facts (they should still be there)
      const factsPrompt = await memoryStore.current.getFactsForPrompt();
      if (factsPrompt && llmClientRef.current) {
        llmClientRef.current.setUserFacts(factsPrompt);
        console.log('💡 User facts preserved in new session');
      }
      
      // Reset LLM conversation history (empty for new chat, but keep system prompt and facts)
      if (llmClientRef.current) {
        llmClientRef.current.loadConversationHistory([]);
        console.log('🔄 Conversation history reset for new chat');
      }
    } catch (error) {
      console.error('Failed to create new chat session:', error);
      setError('Failed to start new chat. Please try again.');
    }
  }, [stopAll]);

  /**
   * Load a specific session
   */
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      console.log('📂 Loading session:', sessionId);
      console.log('🖥️ Platform:', typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown');
      setIsLoading(true);
      
      // Stop any ongoing activity
      console.log('🛑 Stopping all ongoing activities...');
      stopAll();
      
      // Set as current session
      console.log('💾 Setting current session to:', sessionId);
      memoryStore.current.setCurrentSession(sessionId);
      
      // Verify session was set
      const verifySessionId = memoryStore.current.getCurrentSessionId();
      console.log('✓ Verified current session:', verifySessionId);
      
      // Load messages from this session
      console.log('📥 Fetching messages from IndexedDB for session:', sessionId);
      const sessionMessages = await memoryStore.current.getSessionMessages(sessionId, 200);
      console.log('📦 Retrieved', sessionMessages.length, 'messages from database');
      
      if (sessionMessages.length === 0) {
        console.warn('⚠️ No messages found for session:', sessionId);
      }
      
      const converted: Message[] = sessionMessages.map((msg: StoredMessage) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp),
      }));
      
      console.log('🔄 Converting messages to UI format...');
      setMessages(converted);
      console.log('✅ Loaded', converted.length, 'messages from session:', sessionId);
      
      // Load conversation history into LLM context
      if (llmClientRef.current && converted.length > 0) {
        console.log('🤖 Loading conversation into LLM context...');
        const historyForLLM = converted.map(msg => ({
          role: msg.role,
          content: msg.content
        }));
        llmClientRef.current.loadConversationHistory(historyForLLM);
        console.log('📚 Loaded conversation history into LLM');
      } else if (llmClientRef.current) {
        console.log('🤖 Clearing LLM conversation history (empty session)');
        llmClientRef.current.loadConversationHistory([]);
      } else {
        console.warn('⚠️ LLM client not initialized');
      }
      
      setError(null);
      console.log('🎉 Session loaded successfully!');
    } catch (error) {
      console.error('❌ DETAILED ERROR loading session:', error);
      console.error('Error name:', (error as Error).name);
      console.error('Error message:', (error as Error).message);
      console.error('Error stack:', (error as Error).stack);
      console.error('Session ID that failed:', sessionId);
      setError('Failed to load conversation. Please try again.');
    } finally {
      setIsLoading(false);
      console.log('🏁 Load session process completed');
    }
  }, [stopAll]);

  return {
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
  };
};

