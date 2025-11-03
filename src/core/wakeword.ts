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
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: WakeWordConfig = {}) {
    this.wakeWord = config.wakeWord || 'seven';
    // Much lower threshold for higher sensitivity (0.35 = 65% similarity required)
    this.threshold = config.threshold || 0.35;
    
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

    // Set up result handler - check both interim and final results for better sensitivity
    this.recognition.onResult((result) => {
      const transcript = result.transcript.toLowerCase().trim();
      
      // Ignore empty transcripts - they cause false positives
      if (!transcript || transcript.length === 0) {
        return;
      }
      
      // Log all detected speech for debugging
      if (result.isFinal) {
        console.log('👂 Wake word listening... heard (final):', transcript);
      } else {
        console.log('👂 Wake word listening... heard (interim):', transcript);
      }
      
      // Check if wake word is detected in both interim and final results
      // This makes it much more sensitive - catches wake word earlier
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
      // Don't log abort errors - they're expected when stopping to start voice input
      if (error !== 'aborted') {
        console.error('Wake word detection error:', error);
      }
      if (this.onErrorCallback && error !== 'aborted') {
        this.onErrorCallback(error);
      }
      
      // Restart on error if active (but not if error was abort - that's intentional)
      if (this.isActive && error !== 'aborted') {
        setTimeout(() => {
          if (this.isActive) {
            this.start();
          }
        }, 1000);
      }
    });
    
    // Monitor for unexpected stops and restart if needed
    // This ensures wake word detector stays active even if speech recognition ends
    // Clear any existing interval first
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    this.checkInterval = setInterval(() => {
      if (this.isActive && this.recognition) {
        // Check if recognition is actually running
        const nativeRec = (this.recognition as any).recognition;
        if (nativeRec) {
          // readyState: 0=STOPPED, 1=STARTING, 2=CAPTURING, 3=PAUSED
          if (nativeRec.readyState === 0 && this.isActive) {
            // Recognition stopped but we're still active - restart it
            try {
              console.log('🔄 Wake word recognition stopped unexpectedly, restarting...');
              nativeRec.start();
            } catch (e) {
              const errorMsg = (e as Error).message || '';
              if (!errorMsg.includes('already started')) {
                // If we can't restart, try again after a delay
                setTimeout(() => {
                  if (this.isActive) {
                    this.start();
                  }
                }, 2000);
              }
            }
          }
        }
      } else {
        // No longer active, clear the interval
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
      }
    }, 3000); // Check every 3 seconds
    } catch (error) {
      console.warn('⚠️ Failed to initialize wake word detector:', error);
    }
  }

  /**
   * Check if transcript contains wake word
   * Made very sensitive to catch variations and partial matches
   */
  private containsWakeWord(transcript: string): boolean {
    const normalizedTranscript = transcript.toLowerCase().trim();
    const normalizedWakeWord = this.wakeWord.toLowerCase().trim();
    
    // Empty transcript cannot contain wake word - reject immediately
    if (!normalizedTranscript || normalizedTranscript.length === 0) {
      return false;
    }
    
    // Empty wake word is invalid
    if (!normalizedWakeWord || normalizedWakeWord.length === 0) {
      return false;
    }
    
    // Exact match (most reliable)
    if (normalizedTranscript === normalizedWakeWord) {
      return true;
    }

    // Contains full wake word phrase
    if (normalizedTranscript.includes(normalizedWakeWord)) {
      return true;
    }

    // Extract "seven" from wake word (most important part)
    const wakeWords = normalizedWakeWord.split(' ');
    const targetWord = wakeWords.includes('seven') ? 'seven' : wakeWords[wakeWords.length - 1]; // Use "seven" or last word
    
    // Check if transcript contains just "seven" (most sensitive)
    if (targetWord === 'seven') {
      // Direct match for "seven"
      if (normalizedTranscript.includes('seven')) {
        return true;
      }
      
      // Check individual words for "seven"
      const transcriptWords = normalizedTranscript.split(/\s+/).filter(w => w.length > 0);
      for (const word of transcriptWords) {
        // Skip empty words
        if (!word || word.length === 0) {
          continue;
        }
        
        // Exact match for "seven"
        if (word === 'seven' || word === 'sev' || word === '7') {
          return true;
        }
        
        // Very lenient similarity check for "seven" (only 35% threshold)
        const similarity = this.similarity(word, 'seven');
        if (similarity > this.threshold) {
          console.log(`🎯 Wake word match: "${word}" similar to "seven" (${(similarity * 100).toFixed(0)}%)`);
          return true;
        }
        
        // Check if word starts with "sev" (partial match)
        if (word.length >= 3 && word.startsWith('sev')) {
          console.log(`🎯 Wake word partial match: "${word}" starts with "sev"`);
          return true;
        }
      }
    }

    // For multi-word wake phrases (e.g., "hey seven"), check if ANY word matches
    if (wakeWords.length > 1) {
      const transcriptWords = normalizedTranscript.split(/\s+/).filter(w => w.length > 0);
      
      // Check if any wake word matches any transcript word with low threshold
      for (const wakeWord of wakeWords) {
        // Skip empty wake words
        if (!wakeWord || wakeWord.length === 0) {
          continue;
        }
        
        for (const transcriptWord of transcriptWords) {
          // Skip empty transcript words
          if (!transcriptWord || transcriptWord.length === 0) {
            continue;
          }
          
          const similarity = this.similarity(transcriptWord, wakeWord);
          if (similarity > this.threshold) {
            console.log(`🎯 Wake word match: "${transcriptWord}" similar to "${wakeWord}" (${(similarity * 100).toFixed(0)}%)`);
            // If target word ("seven") matches, accept immediately
            if (wakeWord === 'seven' || wakeWord === targetWord) {
              return true;
            }
            // For other words, require at least one good match
            if (similarity > 0.5) {
              return true;
            }
          }
        }
      }
    } else {
      // Single word wake word - very lenient matching
      const transcriptWords = normalizedTranscript.split(/\s+/).filter(w => w.length > 0);
      for (const transcriptWord of transcriptWords) {
        // Skip empty words
        if (!transcriptWord || transcriptWord.length === 0) {
          continue;
        }
        
        const similarity = this.similarity(transcriptWord, normalizedWakeWord);
        if (similarity > this.threshold) {
          console.log(`🎯 Wake word match: "${transcriptWord}" similar to "${normalizedWakeWord}" (${(similarity * 100).toFixed(0)}%)`);
          return true;
        }
        
        // Very lenient partial match - word starts with wake word or vice versa
        // Only check if both words have at least 3 characters
        if (normalizedWakeWord.length >= 3 && transcriptWord.length >= 3) {
          if (transcriptWord.startsWith(normalizedWakeWord.substring(0, 3))) {
            console.log(`🎯 Wake word prefix match: "${transcriptWord}" starts with "${normalizedWakeWord.substring(0, 3)}"`);
            return true;
          }
          if (transcriptWord.length >= 3 && normalizedWakeWord.startsWith(transcriptWord.substring(0, 3))) {
            console.log(`🎯 Wake word prefix match: "${normalizedWakeWord}" starts with "${transcriptWord.substring(0, 3)}"`);
            return true;
          }
        }
      }
    }

    return false;
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
      
      // Ensure the underlying recognition instance is in continuous mode
      // Access the native recognition instance to ensure continuous mode
      const nativeRecognition = (this.recognition as any).recognition;
      if (nativeRecognition) {
        nativeRecognition.continuous = true;
        nativeRecognition.interimResults = true;
      }
      
      // Start recognition - this will trigger auto-restart in continuous mode
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
  stop(silent: boolean = false) {
    if (this.recognition && this.isActive) {
      try {
        if (!silent) {
          console.log('🛑 Stopping wake word detection');
        }
        this.isActive = false;
        
        // Clear the check interval when stopping
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
        
        // Set isActive to false before stopping to prevent error callbacks
        // This prevents abort errors from propagating
        this.recognition.stop();
      } catch (error) {
        // Ignore errors when stopping - this is expected when stopping to start voice input
        if (!silent) {
          console.warn('⚠️ Error stopping wake word detector:', error);
        }
        this.isActive = false;
        
        // Clear interval even on error
        if (this.checkInterval) {
          clearInterval(this.checkInterval);
          this.checkInterval = null;
        }
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


