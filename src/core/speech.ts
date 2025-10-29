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

  constructor(config: SpeechRecognitionConfig = {}) {
    this.initializeSync(config);
  }

  private initializeSync(config: SpeechRecognitionConfig) {
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
        
        // Don't treat "no-speech" as a critical error (it's just silence)
        if (event.error === 'no-speech') {
          console.log('ℹ️ No speech detected (silence timeout)');
          // Just silently close, don't call error callback
          this.isListening = false;
          return;
        }
        
        // For other errors, notify the callback
        if (this.onErrorCallback) {
          this.onErrorCallback(event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
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

    try {
      this.recognition.start();
      this.isListening = true;
    } catch (error) {
      this.onErrorCallback?.((error as Error).message);
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
export class SpeechSynthesis {
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
      
      // Wait for voices to load (some browsers load them asynchronously)
      this.loadVoices();
      
      // Listen for voice changes
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => {
          this.loadVoices();
        };
      }
      
      // Pre-warm speech synthesis to reduce delay on first use
      setTimeout(() => this.preWarmSpeechSynthesis(), 1000);
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
        console.log(`Loaded ${voices.length} voices`);
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
    return new Promise((resolve, reject) => {
      if (!this.synth) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Cancel any ongoing speech
      this.synth.cancel();

      // Ensure voices are loaded
      if (!this.voicesLoaded) {
        this.loadVoices();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      // More natural speech parameters
      utterance.rate = options.rate || 0.9; // Slower for more natural sound
      utterance.pitch = options.pitch || 0.95; // Slightly lower pitch sounds more natural
      utterance.volume = options.volume || 1.0;

      // Ensure voices are loaded (critical for mobile)
      const voices = this.synth.getVoices();
      console.log(`📱 Total available voices: ${voices.length}`);
      
      // Set voice if specified
      if (options.voice && options.voice.trim() !== '') {
        console.log(`🔍 Looking for voice: "${options.voice}"`);
        
        // Try exact match first
        let selectedVoice = voices.find(v => v.name === options.voice);
        
        // If not found, try case-insensitive match
        if (!selectedVoice) {
          console.log('🔄 Trying case-insensitive search...');
          selectedVoice = voices.find(v => v.name.toLowerCase() === options.voice.toLowerCase());
        }
        
        // If still not found, try partial match
        if (!selectedVoice) {
          console.log('🔄 Trying partial match...');
          selectedVoice = voices.find(v => v.name.toLowerCase().includes(options.voice.toLowerCase()));
        }
        
        if (selectedVoice) {
          utterance.voice = selectedVoice;
          console.log('✅ Successfully set voice:', selectedVoice.name, '|', selectedVoice.lang, '|', selectedVoice.localService ? 'Local' : 'Remote');
        } else {
          console.error('❌ Voice not found:', options.voice);
          console.log('📋 Available voices on this device:');
          voices.slice(0, 10).forEach((v, i) => {
            console.log(`  ${i + 1}. "${v.name}" (${v.lang}) ${v.localService ? '[Local]' : '[Remote]'}`);
          });
          if (voices.length > 10) {
            console.log(`  ... and ${voices.length - 10} more`);
          }
        }
      } else {
        // Use default voice
        if (voices.length > 0) {
          console.log('📢 Using default voice:', voices[0].name, voices[0].lang);
        } else {
          console.warn('⚠️ No voices available!');
        }
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => {
        console.error('Speech error:', event);
        reject(event.error);
      };

      this.synth.speak(utterance);
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
export const createSpeechSynthesis = (): SpeechSynthesis => {
  return new SpeechSynthesis();
};

