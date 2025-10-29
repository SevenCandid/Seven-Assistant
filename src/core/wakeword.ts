/**
 * Wake Word Detection Module
 * Detects "Hey Seven" to activate the assistant
 */

import { createSpeechRecognition, SpeechRecognition } from './speech';

export interface WakeWordConfig {
  wakeWord?: string;
  threshold?: number;
  continuous?: boolean;
}

export class WakeWordDetector {
  private recognition: SpeechRecognition | null = null;
  private wakeWord: string;
  private threshold: number;
  private isActive: boolean = false;
  private onWakeWordCallback?: () => void;
  private onErrorCallback?: (error: string) => void;

  constructor(config: WakeWordConfig = {}) {
    this.wakeWord = config.wakeWord || 'hey seven';
    this.threshold = config.threshold || 0.7;
    
    // Small delay to ensure speech recognition is available
    setTimeout(() => this.initialize(config), 100);
  }

  private initialize(config: WakeWordConfig) {
    try {
      // Create continuous speech recognition for wake word detection
      this.recognition = createSpeechRecognition({
        continuous: config.continuous !== undefined ? config.continuous : true,
        interimResults: true,
      });

      if (!this.recognition) {
        console.warn('⚠️ Speech recognition not available for wake word detection');
        return;
      }

    // Set up result handler
    this.recognition.onResult((result) => {
      const transcript = result.transcript.toLowerCase().trim();
      console.log('👂 Wake word listening... heard:', transcript);
      
      // Check if wake word is detected
      if (this.containsWakeWord(transcript)) {
        console.log('✨ WAKE WORD DETECTED:', transcript);
        console.log('🎤 Activating voice input...');
        if (this.onWakeWordCallback) {
          this.onWakeWordCallback();
        }
      }
    });

    // Set up error handler
    this.recognition.onError((error) => {
      console.error('Wake word detection error:', error);
      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
      
      // Restart on error if active
      if (this.isActive) {
        setTimeout(() => this.start(), 1000);
      }
    });
    } catch (error) {
      console.warn('⚠️ Failed to initialize wake word detector:', error);
    }
  }

  /**
   * Check if transcript contains wake word
   */
  private containsWakeWord(transcript: string): boolean {
    // Exact match
    if (transcript === this.wakeWord) {
      return true;
    }

    // Contains wake word
    if (transcript.includes(this.wakeWord)) {
      return true;
    }

    // Fuzzy match - check individual words
    const wakeWords = this.wakeWord.split(' ');
    const transcriptWords = transcript.split(' ');
    
    let matches = 0;
    for (const wakeWord of wakeWords) {
      if (transcriptWords.some(word => this.similarity(word, wakeWord) > this.threshold)) {
        matches++;
      }
    }

    return matches === wakeWords.length;
  }

  /**
   * Calculate similarity between two strings (simple Levenshtein-based)
   */
  private similarity(s1: string, s2: string): number {
    const longer = s1.length > s2.length ? s1 : s2;
    const shorter = s1.length > s2.length ? s2 : s1;
    
    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  /**
   * Calculate Levenshtein distance
   */
  private levenshteinDistance(s1: string, s2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= s2.length; i++) {
      for (let j = 1; j <= s1.length; j++) {
        if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[s2.length][s1.length];
  }

  /**
   * Start wake word detection
   */
  start() {
    if (!this.recognition) {
      console.warn('⚠️ Wake word detection: Speech recognition not available');
      console.warn('💡 Tip: Wake word requires microphone permission and browser support for continuous speech recognition');
      if (this.onErrorCallback) {
        this.onErrorCallback('Wake word detection not initialized');
      }
      return;
    }

    if (this.isActive) {
      console.log('⚠️ Wake word detector already active');
      return;
    }

    try {
      console.log('👂 Starting wake word detection...');
      console.log(`🎯 Listening for: "${this.wakeWord}"`);
      console.log('💡 Make sure microphone permission is granted');
      this.isActive = true;
      this.recognition.start();
      console.log('✅ Wake word detector started successfully');
    } catch (error) {
      const errorMessage = (error as Error).message || '';
      // If already started, just update state
      if (errorMessage.includes('already started')) {
        console.log('⚠️ Wake word recognition already started, updating state only');
        this.isActive = true;
      } else {
        console.error('❌ Failed to start wake word detection:', error);
        console.error('💡 Possible causes:');
        console.error('   - Microphone permission not granted');
        console.error('   - Another speech recognition instance is running');
        console.error('   - Browser doesn\'t support continuous speech recognition');
        this.isActive = false;
        if (this.onErrorCallback) {
          this.onErrorCallback(errorMessage);
        }
      }
    }
  }

  /**
   * Stop wake word detection
   */
  stop() {
    if (this.recognition && this.isActive) {
      try {
        console.log('🛑 Stopping wake word detection');
        this.isActive = false;
        this.recognition.stop();
      } catch (error) {
        console.warn('⚠️ Error stopping wake word detector:', error);
        this.isActive = false;
      }
    }
  }

  /**
   * Set wake word detected callback
   */
  onWakeWord(callback: () => void) {
    this.onWakeWordCallback = callback;
  }

  /**
   * Set error callback
   */
  onError(callback: (error: string) => void) {
    this.onErrorCallback = callback;
  }

  /**
   * Check if actively listening for wake word
   */
  isListening(): boolean {
    return this.isActive;
  }

  /**
   * Change wake word
   */
  setWakeWord(wakeWord: string) {
    this.wakeWord = wakeWord.toLowerCase().trim();
    console.log('Wake word changed to:', this.wakeWord);
  }
}

/**
 * Create wake word detector instance
 */
export const createWakeWordDetector = (config?: WakeWordConfig): WakeWordDetector => {
  return new WakeWordDetector(config);
};


