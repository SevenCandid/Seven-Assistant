/**
 * Speech-to-Text and Text-to-Speech functionality
 * Cross-platform support for Web, Electron, and Capacitor
 */

import { detectPlatform } from './utils';

export interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

export interface SpeechRecognitionConfig {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
}

/**
 * Speech Recognition (STT) Class
 */
export class SpeechRecognition {
  private recognition: any = null;
  private isListening: boolean = false;
  private onResultCallback?: (result: SpeechRecognitionResult) => void;
  private onErrorCallback?: (error: string) => void;
  private platform: string = 'web';
  private config: SpeechRecognitionConfig = {};

  constructor(config: SpeechRecognitionConfig = {}) {
    this.initializeSync(config);
  }

  private initializeSync(config: SpeechRecognitionConfig) {
    // Store config for use in event handlers
    this.config = config;
    
    // Synchronous initialization for immediate availability
    const SpeechRecognitionAPI = 
      (window as any).SpeechRecognition || 
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      console.warn('Speech Recognition not supported in this browser');
      return;
    }

    this.recognition = new SpeechRecognitionAPI();
    this.recognition.continuous = config.continuous || false;
    this.recognition.interimResults = config.interimResults || true;
    this.recognition.lang = config.language || 'en-US';
    this.recognition.maxAlternatives = 3; // Get more alternatives for better accuracy
    
    // Check if we're online before initializing (speech API requires internet)
    if (!navigator.onLine) {
      console.warn('⚠️ No internet connection - speech recognition requires online connection');
      console.warn('💡 Connect to internet to use speech recognition, or use backend API for offline recognition');
    }
    
    // Improve recognition quality
    try {
      // These properties might not be available in all browsers
      (this.recognition as any).serviceURI = undefined; // Use default (most accurate)
    } catch (e) {
      // Ignore if not supported
    }

    // Set up handlers immediately

      this.recognition.onresult = (event: any) => {
        const last = event.results.length - 1;
        const result = event.results[last];
        const transcript = result[0].transcript;

        if (this.onResultCallback) {
          this.onResultCallback({
            transcript,
            confidence: result[0].confidence,
            isFinal: result.isFinal,
          });
        }
      };

      this.recognition.onerror = (event: any) => {
        console.log('🎤 Speech recognition error:', event.error);
        
        // Don't treat "no-speech" as a critical error - it happens when user hasn't spoken yet
        // In Electron, this can fire quickly (1-2 seconds), so we restart automatically
        if (event.error === 'no-speech') {
          console.log('ℹ️ No speech detected yet - continuing to listen...');
          
          // If we're still supposed to be listening (continuous mode), restart automatically
          if (this.isListening && this.recognition) {
            try {
              // Restart recognition after a brief delay to allow user to speak
              setTimeout(() => {
                if (this.isListening && this.recognition) {
                  console.log('🔄 Restarting speech recognition after silence...');
                  try {
                    this.recognition.start();
                  } catch (restartError) {
                    // Ignore "already started" errors
                    if (!(restartError as Error).message?.includes('already started')) {
                      console.warn('⚠️ Could not restart speech recognition:', restartError);
                    }
                  }
                }
              }, 500); // Wait 500ms before restarting
            } catch (e) {
              console.warn('⚠️ Error scheduling restart:', e);
            }
          } else {
            // Not in continuous mode or user stopped, just close
            this.isListening = false;
          }
          return; // Don't call error callback for no-speech
        }
        
        // Check if it's a network error and provide helpful guidance
        if (event.error === 'network' || event.error === 'network-error') {
          console.warn('⚠️ Network error in speech recognition');
          console.warn('💡 Speech recognition requires internet connection to Google servers');
          console.warn('💡 Tips:');
          console.warn('   - Check your internet connection');
          console.warn('   - Verify you can access google.com in a browser');
          console.warn('   - Check firewall/proxy settings');
          if (typeof window !== 'undefined' && (window as any).electron) {
            console.warn('   - In Electron: Network requests should be automatically allowed');
            console.warn('   - Try restarting the Electron app');
            console.warn('   - Check Windows Firewall/antivirus isn\'t blocking the app');
          }
          console.warn('   - Try using the backend API for offline speech recognition');
          if (!navigator.onLine) {
            console.warn('   - navigator.onLine reports offline');
            console.warn('   - If you believe you are online, this may be a false negative');
          }
        }
        
        // For other errors, notify the callback
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        console.log('🎤 Speech recognition ended');
        
        // If we're in continuous mode, always try to restart
        // This ensures wake word detection stays active
        if (this.recognition && this.config.continuous) {
          // Give a small delay before restarting to avoid rapid restart loops
          setTimeout(() => {
            // Check again if we should still be listening (continuous mode)
            if (this.recognition && this.config.continuous) {
              try {
                console.log('🔄 Auto-restarting continuous speech recognition...');
                // Set isListening to true before starting (for continuous mode)
                this.isListening = true;
                this.recognition.start();
              } catch (e) {
                // Ignore "already started" errors
                const errorMsg = (e as Error).message || '';
                if (errorMsg.includes('already started')) {
                  // Already started, keep listening state
                  this.isListening = true;
                } else {
                  console.warn('⚠️ Could not auto-restart speech recognition:', e);
                  // Only set to false if it's a real error (not aborted)
                  if (!errorMsg.includes('aborted')) {
                    // In continuous mode, we want to keep trying, so only set to false if it's a critical error
                    // Try again after a delay
                    setTimeout(() => {
                      if (this.config.continuous && this.recognition) {
                        this.start();
                      }
                    }, 2000);
                  }
                }
              }
            }
          }, 100);
        } else {
          // Not continuous or user stopped, update state
          this.isListening = false;
        }
      };
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    return this.recognition !== null;
  }

  /**
   * Start listening
   */
  start() {
    if (!this.recognition) {
      this.onErrorCallback?.('Speech recognition not initialized');
      return;
    }

    if (this.isListening) {
      return;
    }

    // Check internet connection before starting (speech API requires it)
    // navigator.onLine can be unreliable, so we do a quick network check
    const isOnline = navigator.onLine;
    
    if (!isOnline) {
      console.warn('⚠️ No internet connection detected - speech recognition requires online connection');
      console.warn('💡 navigator.onLine reports offline');
      
      // In Electron, sometimes navigator.onLine is false even when online
      // Try a quick connectivity test
      if (typeof window !== 'undefined' && (window as any).electron) {
        console.log('🔄 Electron detected - attempting connectivity test...');
        // Don't block, but log a warning
        // The actual error will come from the speech API if it truly can't connect
      }
      
      this.onErrorCallback?.('network');
      return;
    }

    try {
      this.recognition.start();
      this.isListening = true;
      console.log('🎤 Speech recognition started (requires internet connection)');
    } catch (error) {
      const errorMsg = (error as Error).message;
      console.error('❌ Failed to start speech recognition:', errorMsg);
      
      // Provide helpful error messages
      if (errorMsg.includes('network') || errorMsg.includes('Network')) {
        this.onErrorCallback?.('network');
      } else {
        this.onErrorCallback?.(errorMsg);
      }
    }
  }

  /**
   * Stop listening
   */
  stop() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  /**
   * Set result callback
   */
  onResult(callback: (result: SpeechRecognitionResult) => void) {
    this.onResultCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  /**
   * Check if currently listening
   */
  getIsListening(): boolean {
    return this.isListening;
  }
}

/**
 * Speech Synthesis (TTS) Class
 */
export class SevenSpeechSynthesis {
  private synth: globalThis.SpeechSynthesis | null = null;
  private platform: string = 'web';
  private voicesLoaded: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    this.platform = await detectPlatform();

    if ('speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      console.log('✅ Speech synthesis initialized');
      
      // Wait for voices to load (some browsers load them asynchronously)
      this.loadVoices();
      
      // Listen for voice changes
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          console.log('🔄 Voices changed event fired');
          this.loadVoices();
        };
      }
      
      // Load voices immediately and on user interaction (for autoplay policy)
      if (typeof document !== 'undefined') {
        // Create a user interaction handler to enable speech synthesis
        const enableSpeechOnInteraction = () => {
          console.log('👆 User interaction detected - enabling speech synthesis');
          this.loadVoices();
          
          // Try a silent test utterance to "unlock" speech synthesis (browsers require user gesture)
          try {
            if (this.synth) {
              const testUtterance = new SpeechSynthesisUtterance('');
              testUtterance.volume = 0; // Silent
              testUtterance.text = ''; // Empty
              this.synth.speak(testUtterance);
              this.synth.cancel(); // Immediately cancel
              console.log('✅ Speech synthesis unlocked via user interaction');
            }
          } catch (e) {
            console.warn('⚠️ Could not unlock speech synthesis:', e);
          }
          
          // Remove listeners after first interaction
          document.removeEventListener('click', enableSpeechOnInteraction);
          document.removeEventListener('keydown', enableSpeechOnInteraction);
          document.removeEventListener('touchstart', enableSpeechOnInteraction);
          document.removeEventListener('mousedown', enableSpeechOnInteraction);
        };
        
        // Listen for any user interaction to unlock speech
        document.addEventListener('click', enableSpeechOnInteraction, { once: true, passive: true });
        document.addEventListener('keydown', enableSpeechOnInteraction, { once: true, passive: true });
        document.addEventListener('touchstart', enableSpeechOnInteraction, { once: true, passive: true });
        document.addEventListener('mousedown', enableSpeechOnInteraction, { once: true, passive: true });
      }
      
      // Pre-warm speech synthesis to reduce delay on first use (after user interaction)
      // Note: Many browsers require user interaction before allowing speech synthesis
      setTimeout(() => {
        // Only pre-warm if we've had user interaction
        if (this.synth) {
          try {
            this.preWarmSpeechSynthesis();
          } catch (e) {
            console.warn('⚠️ Could not pre-warm speech synthesis (may need user interaction):', e);
          }
        }
      }, 2000);
    } else {
      console.error('❌ Speech synthesis not supported in this browser');
    }
  }

  /**
   * Pre-warm speech synthesis to reduce delay on first use
   */
  private preWarmSpeechSynthesis() {
    try {
      if (!this.synth) return;
      
      // Speak a very short silent utterance to initialize the engine
      const silent = new SpeechSynthesisUtterance('.');
      silent.volume = 0;
      silent.rate = 10; // Fast to finish quickly
      this.synth.speak(silent);
      console.log('🔥 Speech synthesis pre-warmed - reduced delay for first use');
    } catch (error) {
      console.warn('⚠️ Failed to pre-warm speech synthesis:', error);
    }
  }

  private loadVoices() {
    if (this.synth) {
      const voices = this.synth.getVoices();
      if (voices.length > 0) {
        this.voicesLoaded = true;
        console.log(`📱 Loaded ${voices.length} voices`);
        
        // Log available female AI voices for debugging
        const femaleVoices = voices.filter(v => {
          const name = v.name.toLowerCase();
          return name.includes('female') || 
                 name.includes('aria') || 
                 name.includes('jenny') ||
                 name.includes('samantha') ||
                 name.includes('karen') ||
                 name.includes('zira');
        });
        if (femaleVoices.length > 0) {
          console.log(`🎙️ Available female AI voices (${femaleVoices.length}):`, 
            femaleVoices.map(v => `${v.name} (${v.lang})`).join(', '));
        }
      }
    }
  }

  /**
   * Speak text
   */
  async speak(text: string, options: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: string;
  } = {}): Promise<void> {
    if (!this.synth) {
      throw new Error('Speech synthesis not supported');
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    // Ensure voices are loaded (critical for voice selection)
    this.loadVoices();
    
    // Wait a bit if voices aren't loaded yet (some browsers load asynchronously) - reduced delay
    if (!this.voicesLoaded) {
      await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 100ms to 50ms
      this.loadVoices();
    }
    
    return new Promise((resolve, reject) => {

      const utterance = new SpeechSynthesisUtterance(text);
      // Jarvis-like calm, confident, smooth voice settings
      utterance.rate = options.rate !== undefined ? options.rate : 0.9; // Calm and confident pace
      utterance.pitch = options.pitch !== undefined ? options.pitch : 1; // Neutral pitch for smooth, confident sound
      utterance.volume = options.volume !== undefined ? options.volume : 1; // Full volume

      // Ensure voices are loaded (critical for mobile)
      const voices = this.synth.getVoices();
      console.log(`📱 Total available voices: ${voices.length}`);
      
      // Find best female AI voice (Jarvis-like)
      let selectedVoice: SpeechSynthesisVoice | null = null;
      
      // Prioritized list of female AI voices that sound calm and confident
      const femaleAIVoices = [
        'Microsoft Aria Online (Natural)',
        'Microsoft Jenny Online (Natural)',
        'Samantha', // macOS/iOS - very smooth
        'Karen', // macOS/iOS
        'Tessa', // macOS/iOS
        'Allison', // macOS/iOS
        'Ava', // macOS/iOS
        'Susan', // macOS/iOS
        'Google UK English Female',
        'Google US English Female',
        'Zira', // Windows
        'Hazel', // Windows
        'female', // Generic match
      ];
      
      // Always auto-select best female Jarvis-like voice (no manual voice selection)
      // Ignore any passed voice parameter to ensure consistent female AI voice
      if (!selectedVoice) {
        console.log('🎙️ Auto-selecting best female AI voice...');
        
        // Try to find a female AI voice from our priority list
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
            console.log('✅ Selected female AI voice:', voice.name, '|', voice.lang);
            break;
          }
        }
        
        // If still no voice found, look for any voice that sounds female/AI-like
        if (!selectedVoice) {
          const femaleVoices = voices.filter(v => {
            const name = v.name.toLowerCase();
            return name.includes('female') || 
                   name.includes('aria') || 
                   name.includes('jenny') ||
                   name.includes('samantha') ||
                   name.includes('zira') ||
                   name.includes('hazel');
          });
          
          if (femaleVoices.length > 0) {
            // Prefer local voices (usually better quality)
            selectedVoice = femaleVoices.find(v => v.localService) || femaleVoices[0];
            console.log('✅ Selected female voice:', selectedVoice.name, '|', selectedVoice.lang);
          } else if (voices.length > 0) {
            // Fallback to first available voice
            selectedVoice = voices[0];
            console.log('📢 Using fallback voice:', selectedVoice.name, selectedVoice.lang);
          }
        }
      }
      
      // Set the voice - always use selected female Jarvis-like voice
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        console.log('🔊 Speaking with female Jarvis-like voice:', selectedVoice.name, '|', selectedVoice.lang, '|', selectedVoice.localService ? '[Local]' : '[Remote]');
      } else {
        console.warn('⚠️ No female AI voice available! Using system default.');
      }

      utterance.onend = () => {
        console.log('✅ Speech finished successfully');
        resolve();
      };
      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.error('❌ Speech synthesis error:', {
          error: event.error,
          type: event.type,
          charIndex: event.charIndex,
          utterance: text.substring(0, 100),
        });
        // Still resolve to not block the UI, but log the error for debugging
        resolve();
      };

      // Handle speech start event to verify it's working
      utterance.onstart = () => {
        console.log('🔊 Speech synthesis started successfully');
      };

      console.log('🎤 Starting speech synthesis with:', {
        text: text.substring(0, 50) + (text.length > 50 ? '...' : ''),
        textLength: text.length,
        rate: utterance.rate,
        pitch: utterance.pitch,
        volume: utterance.volume,
        voice: selectedVoice?.name || 'default',
        synthState: this.synth?.speaking ? 'speaking' : this.synth?.pending ? 'pending' : 'idle',
      });
      
      try {
        // Check if we're in a state where speech can start
        const synthState = {
          speaking: this.synth.speaking,
          pending: this.synth.pending,
          paused: this.synth.paused,
        };
        console.log('🎤 Speech synthesis state before speak:', synthState);
        
        this.synth.speak(utterance);
        
        // Verify speech started
        setTimeout(() => {
          const afterState = {
            speaking: this.synth?.speaking,
            pending: this.synth?.pending,
            paused: this.synth?.paused,
          };
          console.log('🎤 Speech synthesis state after speak:', afterState);
          
          if (!this.synth?.speaking && !this.synth?.pending && !this.synth?.paused) {
            console.warn('⚠️ Speech synthesis may have been blocked by browser autoplay policy');
            console.warn('💡 Browser requires user interaction before allowing speech synthesis');
            console.warn('💡 Try clicking anywhere on the page or sending a message first');
            
            // Try to provide helpful feedback
            if (typeof window !== 'undefined') {
              // Check if document has focus (indicates user interaction)
              console.log('📊 Document has focus:', document.hasFocus());
              console.log('📊 Active element:', document.activeElement?.tagName);
            }
          } else if (this.synth?.speaking || this.synth?.pending) {
            console.log('✅ Speech synthesis is active!');
          }
        }, 150);
      } catch (error) {
        console.error('❌ Failed to start speech synthesis:', error);
        console.error('Error details:', {
          message: (error as Error).message,
          stack: (error as Error).stack,
        });
        resolve(); // Resolve anyway to not block
      }
    });
  }

  /**
   * Stop speaking
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  /**
   * Get available voices sorted by quality (natural voices first)
   */
  getVoices(): SpeechSynthesisVoice[] {
    if (this.synth) {
      const voices = this.synth.getVoices();
      
      // Sort voices by naturalness - prefer certain high-quality voices
      const naturalVoiceNames = [
        // Google voices (usually high quality)
        'Google US English', 'Google UK English Female', 'Google UK English Male',
        // Microsoft natural voices
        'Microsoft Aria Online (Natural)', 'Microsoft Guy Online (Natural)', 
        'Microsoft Jenny Online (Natural)', 'Microsoft Mark',
        // Apple voices (iOS/Mac - very natural)
        'Samantha', 'Alex', 'Karen', 'Daniel', 'Moira', 'Tessa',
        'Ava', 'Allison', 'Susan', 'Vicki',
        // Enhanced voices
        'enhanced', 'premium', 'natural', 'neural'
      ];
      
      return voices.sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        
        // Prefer local voices (they're usually better quality)
        if (a.localService && !b.localService) return -1;
        if (!a.localService && b.localService) return 1;
        
        // Check if voice name contains quality keywords
        const aIsNatural = naturalVoiceNames.some(name => 
          aName.includes(name.toLowerCase())
        ) || aName.includes('enhanced') || aName.includes('premium') || aName.includes('neural');
        
        const bIsNatural = naturalVoiceNames.some(name => 
          bName.includes(name.toLowerCase())
        ) || bName.includes('enhanced') || bName.includes('premium') || bName.includes('neural');
        
        if (aIsNatural && !bIsNatural) return -1;
        if (!aIsNatural && bIsNatural) return 1;
        
        // Prefer en-US voices
        if (a.lang === 'en-US' && b.lang !== 'en-US') return -1;
        if (a.lang !== 'en-US' && b.lang === 'en-US') return 1;
        
        return 0;
      });
    }
    return [];
  }
  
  /**
   * Get recommended natural voices
   */
  getRecommendedVoices(): SpeechSynthesisVoice[] {
    const voices = this.getVoices();
    const recommended: SpeechSynthesisVoice[] = [];
    
    // Find the best voices
    const bestVoiceNames = [
      'Samantha', 'Alex', // iOS/Mac - very natural
      'Google US English', 'Google UK English Female',
      'Microsoft Aria Online (Natural)', 'Microsoft Jenny Online (Natural)',
      'Karen', 'Daniel', 'Moira' // iOS
    ];
    
    bestVoiceNames.forEach(name => {
      const voice = voices.find(v => v.name === name);
      if (voice) recommended.push(voice);
    });
    
    return recommended;
  }

  /**
   * Check if speaking
   */
  isSpeaking(): boolean {
    return this.synth ? this.synth.speaking : false;
  }
}

/**
 * Create speech recognition instance
 */
export const createSpeechRecognition = (config?: SpeechRecognitionConfig): SpeechRecognition => {
  return new SpeechRecognition(config);
};

/**
 * Create speech synthesis instance
 */
export const createSpeechSynthesis = (): SevenSpeechSynthesis => {
  return new SevenSpeechSynthesis();
};

