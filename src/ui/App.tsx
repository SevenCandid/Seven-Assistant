/**
 * Main App Component
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { MessageList } from './components/MessageList';
import { InputArea } from './components/InputArea';
import { Settings } from './components/Settings';
import { WakeWordIndicator } from './components/WakeWordIndicator';
import { OfflineBanner } from './components/OfflineBanner';
import { ChatHistory } from './components/ChatHistory';
import { useAIAssistant } from './hooks/useAIAssistant';
import { detectPlatform } from '../core/utils';
import { initializeTheme, getAccentColor, setAccentColor } from '../core/theme';
import { getMemoryStore, StoredMessage } from '../memory/memoryStore';

export const App: React.FC = () => {
  const [platform, setPlatform] = useState<string>('web');
  const [llmProvider, setLlmProvider] = useState<'openai' | 'ollama' | 'grok' | 'groq'>('groq');
  const [llmModel, setLlmModel] = useState<string>('llama-3.1-8b-instant');
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true); // Enable voice by default!
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [wakeWordEnabled, setWakeWordEnabled] = useState<boolean>(true); // Enable wake word by default
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [continuousVoiceMode, setContinuousVoiceMode] = useState<boolean>(false);
  const [voiceRate, setVoiceRate] = useState<number>(0.9); // Slower for more natural sound
  const [voicePitch, setVoicePitch] = useState<number>(0.95); // Slightly lower for more natural tone
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [accentColor, setAccentColorState] = useState<string>('orange');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

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

  // Load saved settings from localStorage (voice, LLM provider, model)
  useEffect(() => {
    const savedVoice = localStorage.getItem('seven_selectedVoice');
    const savedContinuous = localStorage.getItem('seven_continuousVoiceMode');
    const savedRate = localStorage.getItem('seven_voiceRate');
    const savedPitch = localStorage.getItem('seven_voicePitch');
    const savedProvider = localStorage.getItem('seven_llmProvider');
    const savedModel = localStorage.getItem('seven_llmModel');
    
    if (savedVoice) {
      setSelectedVoice(savedVoice);
      console.log('📂 Loaded saved voice:', savedVoice);
    }
    if (savedContinuous) {
      setContinuousVoiceMode(savedContinuous === 'true');
      console.log('📂 Loaded continuous mode:', savedContinuous);
    }
    if (savedRate) {
      setVoiceRate(parseFloat(savedRate));
      console.log('📂 Loaded voice rate:', savedRate);
    }
    if (savedPitch) {
      setVoicePitch(parseFloat(savedPitch));
      console.log('📂 Loaded voice pitch:', savedPitch);
    }
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

  // Save voice settings to localStorage when they change
  useEffect(() => {
    if (selectedVoice) {
      localStorage.setItem('seven_selectedVoice', selectedVoice);
      console.log('💾 Saved voice to localStorage:', selectedVoice);
    }
  }, [selectedVoice]);

  useEffect(() => {
    localStorage.setItem('seven_continuousVoiceMode', continuousVoiceMode.toString());
  }, [continuousVoiceMode]);

  useEffect(() => {
    localStorage.setItem('seven_voiceRate', voiceRate.toString());
  }, [voiceRate]);

  useEffect(() => {
    localStorage.setItem('seven_voicePitch', voicePitch.toString());
  }, [voicePitch]);

  // Detect platform on mount
  useEffect(() => {
    detectPlatform().then(setPlatform);
  }, []);

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
    <div className={`h-screen flex flex-col ${isDarkMode ? 'dark' : 'light'}`}>
      {/* Header (Fixed/Sticky) */}
      <Header 
        onClearMessages={clearMessages}
        onNewChat={handleNewChat}
        platform={platform}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        autoSpeak={autoSpeak}
        onToggleVoice={() => setAutoSpeak(!autoSpeak)}
        onShowSettings={() => setShowSettings(!showSettings)}
        onShowHistory={() => setShowHistory(true)}
        onMediaAnalyzed={handleMediaAnalyzed}
      />

      {/* Add padding to account for fixed header */}
      <div className="h-16 sm:h-20"></div>

      {/* Offline Banner */}
      <OfflineBanner isOnline={isOnline} />

      {/* Settings Dropdown */}
          {showSettings && (
            <div className="relative">
              <Settings
                llmProvider={llmProvider}
                llmModel={llmModel}
                autoSpeak={autoSpeak}
                wakeWordEnabled={wakeWordEnabled}
                selectedVoice={selectedVoice}
                continuousVoiceMode={continuousVoiceMode}
                voiceRate={voiceRate}
                voicePitch={voicePitch}
                accentColor={accentColor}
                onProviderChange={setLlmProvider}
                onModelChange={setLlmModel}
                onAutoSpeakChange={setAutoSpeak}
                onWakeWordChange={setWakeWordEnabled}
                onVoiceChange={setSelectedVoice}
                onContinuousVoiceModeChange={setContinuousVoiceMode}
                onVoiceRateChange={setVoiceRate}
                onVoicePitchChange={setVoicePitch}
                onAccentColorChange={handleAccentColorChange}
                onSaveLlmSettings={saveLlmSettings}
                onClose={() => setShowSettings(false)}
              />
            </div>
          )}

      {/* Chat History Modal */}
      {showHistory && (
        <ChatHistory
          onClose={() => setShowHistory(false)}
          onLoadSession={handleLoadSession}
        />
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
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-3 h-3 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <p className="text-gray-400 text-sm">Loading conversation history...</p>
          </div>
        </div>
      ) : (
        <MessageList messages={messages} />
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
      />

      {/* Wake Word Indicator */}
      <WakeWordIndicator isActive={wakeWordEnabled} />
    </div>
  );
};

