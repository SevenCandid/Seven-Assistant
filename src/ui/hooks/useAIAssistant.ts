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
        
        // Load recent messages from current session
        const recentMessages = await memoryStore.current.getSessionMessages(currentSessionId, 50);
        
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
        console.log('⏸️ 3 seconds of silence detected after speaking');
        
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
      }, 3000); // 3 second silence detection after speaking (allows more natural pauses)
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
          errorMessage = 'Network error. Speech recognition requires internet connection.';
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
  useEffect(() => {
    if (options.wakeWordEnabled && wakeWordDetectorRef.current && !isListening) {
      console.log('🎯 Starting wake word detector...');
      wakeWordDetectorRef.current.start();
    } else if (wakeWordDetectorRef.current) {
      console.log('🛑 Stopping wake word detector...');
      wakeWordDetectorRef.current.stop();
    }
  }, [options.wakeWordEnabled, isListening]);

  /**
   * Handle user input (text or voice) with optional file attachments
   */
  const handleUserInput = useCallback(async (text: string, files?: FileAttachment[]) => {
    if ((!text.trim() && !files?.length)) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: text || (files && files.length > 0 ? `[${files.length} file(s) attached]` : ''),
      timestamp: new Date(),
      files: files,
      emotion: undefined, // Will be populated from backend response
    };

    // Save to memory store immediately
    await memoryStore.current.saveMessage('user', userMessage.content, userMessage.timestamp, userMessage.id);

    setMessages((prev) => [...prev, userMessage]);
    setIsProcessing(true);
    setError(null);

    try {
      console.log('🔌 Sending message to backend API...');
      
      // Check if backend is available
      const isBackendHealthy = await backendApi.checkHealth();
      
      if (!isBackendHealthy) {
        console.warn('⚠️ Backend not available, falling back to direct LLM client');
        
        // Fallback to direct LLM client if backend is not available
        if (!llmClientRef.current) {
          throw new Error('AI service is not available. Please ensure the backend is running.');
        }
        
        const fallbackResponse = await llmClientRef.current.sendMessage(text, files);
        
        const assistantMessage: Message = {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: fallbackResponse.message,
          timestamp: new Date(),
        };

        await memoryStore.current.saveMessage(
          'assistant',
          fallbackResponse.message,
          assistantMessage.timestamp,
          assistantMessage.id
        );

        setMessages((prev) => [...prev, assistantMessage]);
        
        // Speak response if enabled
        if (options.autoSpeak && speechSynthesisRef.current && fallbackResponse.message) {
          await speak(fallbackResponse.message);
        }
        
        setIsProcessing(false);
        return;
      }

      // Use backend API
      const response = await backendApi.sendMessage({
        message: text,
        files: files,
        session_id: backendApi.getSessionId() || undefined,
      });

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

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date(),
        is_clarifying_question: is_clarifying,
      };

      // Use ref to get latest options (avoid stale closure)
      const currentOptions = optionsRef.current;

      // Save to memory store
      await memoryStore.current.saveMessage(
        'assistant',
        response.message,
        assistantMessage.timestamp,
        assistantMessage.id,
        {
          sessionId: response.session_id,
          voiceUsed: currentOptions.selectedVoice,
        }
      );

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

      // Handle actions from backend (if any)
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
          const updatedMessage = response.message + actionResults;
          
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
          response.message = updatedMessage;
        }
      }

      // Speak the response if auto-speak is enabled
      if (currentOptions.autoSpeak && speechSynthesisRef.current && response.message) {
        setIsSpeaking(true);
        try {
          // Ensure voice is available and valid
          const voiceToUse = currentOptions.selectedVoice && currentOptions.selectedVoice.trim() !== '' 
            ? currentOptions.selectedVoice 
            : undefined;
          console.log('🔊 Speaking with voice:', voiceToUse || 'default');
          console.log('📋 Voice from options:', currentOptions.selectedVoice);
          
          await speechSynthesisRef.current.speak(response.message, {
            voice: voiceToUse,
            rate: currentOptions.voiceRate || 0.95,
            pitch: currentOptions.voicePitch || 1.0,
          });
          
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
          console.error('Speech synthesis error:', speakError);
        } finally {
          setIsSpeaking(false);
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  }, []); // Empty dependency - use optionsRef for latest values

  /**
   * Start voice input
   */
  const startListening = useCallback(() => {
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
  }, [isListening, handleUserInput]);

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
      const sessionMessages = await memoryStore.current.getSessionMessages(sessionId, 50);
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

