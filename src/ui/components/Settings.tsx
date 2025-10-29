/**
 * Settings Component
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ACCENT_COLORS } from '../../core/theme';
import { backendApi } from '../../core/backendApi';
import { LanguageSelector } from './LanguageSelector';
import { PersonalitySelector } from './PersonalitySelector';
import { KnowledgeManager } from './KnowledgeManager';
import { IntegrationsPanel } from './IntegrationsPanel';

interface SettingsProps {
  llmProvider: 'openai' | 'ollama' | 'grok' | 'groq';
  llmModel: string;
  autoSpeak: boolean;
  wakeWordEnabled: boolean;
  selectedVoice: string;
  continuousVoiceMode: boolean;
  voiceRate: number;
  voicePitch: number;
  accentColor: string;
  onProviderChange: (provider: 'openai' | 'ollama' | 'grok' | 'groq') => void;
  onModelChange: (model: string) => void;
  onAutoSpeakChange: (autoSpeak: boolean) => void;
  onWakeWordChange: (enabled: boolean) => void;
  onVoiceChange: (voice: string) => void;
  onContinuousVoiceModeChange: (enabled: boolean) => void;
  onVoiceRateChange: (rate: number) => void;
  onVoicePitchChange: (pitch: number) => void;
  onAccentColorChange: (color: string) => void;
  onSaveLlmSettings: () => void; // New prop for saving LLM settings
  onClose?: () => void; // New prop for closing settings
}

export const Settings: React.FC<SettingsProps> = ({
  llmProvider,
  llmModel,
  wakeWordEnabled,
  selectedVoice,
  continuousVoiceMode,
  voiceRate,
  voicePitch,
  accentColor,
  onProviderChange,
  onModelChange,
  onWakeWordChange,
  onVoiceChange,
  onContinuousVoiceModeChange,
  onVoiceRateChange,
  onVoicePitchChange,
  onAccentColorChange,
  onSaveLlmSettings,
  onClose,
}) => {
  const [voices, setVoices] = React.useState<SpeechSynthesisVoice[]>([]);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [testingVoice, setTestingVoice] = React.useState<string | null>(null);
  
  // Backend features state
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendMemory, setBackendMemory] = useState<any[]>([]);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<string>('');
  
  // Function to test a voice
  const testVoice = (voiceName: string) => {
    setTestingVoice(voiceName);
    
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance("Hello! This is how I sound. Do you like my voice?");
    
    // Set the voice
    const voices = synth.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = voiceRate;
    utterance.pitch = voicePitch;
    
    utterance.onend = () => {
      setTestingVoice(null);
    };
    
    utterance.onerror = () => {
      setTestingVoice(null);
    };
    
    synth.speak(utterance);
  };

  // Backend handler functions
  const checkBackendStatus = async () => {
    setBackendStatus('checking');
    const isHealthy = await backendApi.checkHealth();
    setBackendStatus(isHealthy ? 'online' : 'offline');
  };

  const loadBackendMemory = async () => {
    setLoadingMemory(true);
    try {
      const memory = await backendApi.getMemory();
      setBackendMemory(memory);
    } catch (error) {
      console.error('Failed to load backend memory:', error);
      setBackendMemory([]);
    } finally {
      setLoadingMemory(false);
    }
  };

  const clearBackendMemory = async () => {
    if (!confirm('Are you sure you want to clear all backend memory? This cannot be undone.')) {
      return;
    }
    try {
      await backendApi.clearMemory();
      setBackendMemory([]);
      alert('✅ Backend memory cleared successfully!');
    } catch (error) {
      console.error('Failed to clear backend memory:', error);
      alert('❌ Failed to clear backend memory. Make sure backend is running.');
    }
  };

  const sendSMS = async () => {
    if (!smsPhone || !smsMessage) {
      alert('Please enter both phone number and message');
      return;
    }
    setSendingMessage(true);
    setMessageStatus('Sending SMS...');
    try {
      await backendApi.sendSMS(smsPhone, smsMessage);
      setMessageStatus('✅ SMS sent successfully!');
      setSmsMessage('');
      setTimeout(() => setMessageStatus(''), 3000);
    } catch (error) {
      console.error('Failed to send SMS:', error);
      setMessageStatus('❌ Failed to send SMS. Check backend logs.');
      setTimeout(() => setMessageStatus(''), 3000);
    } finally {
      setSendingMessage(false);
    }
  };

  const sendWhatsApp = async () => {
    if (!smsPhone || !smsMessage) {
      alert('Please enter both phone number and message');
      return;
    }
    setSendingMessage(true);
    setMessageStatus('Sending WhatsApp...');
    try {
      await backendApi.sendWhatsApp(smsPhone, smsMessage);
      setMessageStatus('✅ WhatsApp sent successfully!');
      setSmsMessage('');
      setTimeout(() => setMessageStatus(''), 3000);
    } catch (error) {
      console.error('Failed to send WhatsApp:', error);
      setMessageStatus('❌ Failed to send WhatsApp. Check backend logs.');
      setTimeout(() => setMessageStatus(''), 3000);
    } finally {
      setSendingMessage(false);
    }
  };

  // Check backend status on mount
  useEffect(() => {
    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setVoices(voices);
      if (!selectedVoice && voices.length > 0) {
        onVoiceChange(voices[0].name);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    setTimeout(loadVoices, 100);
  }, [selectedVoice, onVoiceChange]);

  return (
    <div className="w-full border-b-2 border-primary-500 border-opacity-30 relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full bg-white dark:bg-gray-900 shadow-xl max-h-[70vh] overflow-y-auto relative"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#f97316 transparent'
        }}
      >
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-50 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 border-b border-primary-500 border-opacity-20 shadow-sm backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Settings</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Configure Seven AI</p>
              </div>
            </div>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-600 text-white transition-all shadow-md hover:shadow-lg"
                title="Close settings"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-sm">
          {/* LLM Provider - Auto-switches based on connectivity */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-2 font-semibold text-sm sm:text-base">
            🤖 AI Provider
          </label>
          <select
            value={llmProvider}
            onChange={(e) => onProviderChange(e.target.value as any)}
            className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 border-2 border-gray-300 dark:border-gray-600 text-sm sm:text-base"
          >
            <option value="groq">Groq (Online)</option>
            <option value="ollama">Ollama (Offline/Local)</option>
            {/* Future providers - Coming soon! */}
            {/* <option value="openai">OpenAI</option> */}
            {/* <option value="grok">Grok (xAI)</option> */}
            {/* <option value="anthropic">Anthropic Claude</option> */}
          </select>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Auto-switches to Ollama when offline
          </p>
        </div>

        {/* LLM Model */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-2 font-semibold text-sm sm:text-base">
            🎯 Model
          </label>
          
          {llmProvider === 'groq' ? (
            // Dropdown for Groq models
            <select
              value={llmModel}
              onChange={(e) => onModelChange(e.target.value)}
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 border-2 border-gray-300 dark:border-gray-600 text-sm sm:text-base"
            >
              <option value="llama-3.3-70b-versatile">⭐ Llama 3.3 70B - Best Quality (6k TPM)</option>
              <option value="llama-3.1-70b-versatile">Llama 3.1 70B - Balanced (6k TPM)</option>
              <option value="llama-3.1-8b-instant">⚡ Llama 3.1 8B - Fastest (6k TPM)</option>
              <option value="gemma2-9b-it">🚀 Gemma2 9B - Best Limits (15k TPM)</option>
            </select>
          ) : (
            // Text input for other providers
            <input
              type="text"
              value={llmModel}
              onChange={(e) => onModelChange(e.target.value)}
              placeholder={
                llmProvider === 'openai' ? 'gpt-4o-mini' :
                llmProvider === 'ollama' ? 'llama3.2' :
                'model-name'
              }
              className="w-full px-3 py-2.5 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-500 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 border-2 border-gray-300 dark:border-gray-600 text-sm sm:text-base"
            />
          )}
          
          {/* Save Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onSaveLlmSettings();
              setSaveSuccess(true);
              setTimeout(() => setSaveSuccess(false), 2000);
            }}
            className="mt-3 w-full px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm sm:text-base transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {saveSuccess ? '✓ Saved! Model Updated' : '💾 Save Model Settings'}
          </motion.button>
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-500 text-center">
            Changes apply instantly
          </p>
          
          <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            {llmProvider === 'groq' && (
              <div>
                <p className="font-medium mb-1">Available Groq models (Free Tier):</p>
                <ul className="space-y-0.5 ml-2 text-xs">
                  <li>• <strong>llama-3.3-70b-versatile</strong> ⭐ Best quality (6k TPM, 100k TPD)</li>
                  <li>• <strong>llama-3.1-8b-instant</strong> Fastest (6k TPM, 14.4k req/day)</li>
                  <li>• <strong>llama-3.1-70b-versatile</strong> Balanced (6k TPM, 14.4k req/day)</li>
                  <li>• <strong>gemma2-9b-it</strong> Good limits (15k TPM)</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  TPM = Tokens Per Minute | TPD = Tokens Per Day
                </p>
                <p className="text-xs text-orange-500 mt-1">
                  ⚠️ Rate limits apply - app waits 4s between requests
                </p>
              </div>
            )}
            {/* Future providers - OpenAI will be available in future updates */}
            {/* {llmProvider === 'openai' && (
              <div>
                <p className="font-medium mb-1">Popular OpenAI models:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• <strong>gpt-4o-mini</strong> (Recommended, cheap)</li>
                  <li>• <strong>gpt-4o</strong> (Most capable)</li>
                  <li>• <strong>gpt-3.5-turbo</strong> (Fast, affordable)</li>
                </ul>
              </div>
            )} */}
            {llmProvider === 'ollama' && (
              <div>
                <p className="font-medium mb-1">Recommended Ollama model:</p>
                <ul className="space-y-0.5 ml-2">
                  <li>• <strong>llama3.2</strong> (Works offline)</li>
                </ul>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  Requires Ollama running locally. Activates automatically when offline.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Voice Selection with Test Buttons */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-2 font-semibold text-sm sm:text-base">
            🎙️ Voice (Most Natural First)
          </label>
          
          {/* Voice List with Test Buttons */}
          <div className="space-y-2 max-h-60 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {/* Default Voice Option */}
            <div className="flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border-2 border-gray-300 dark:border-gray-600 hover:border-primary-500 transition-colors">
              <input
                type="radio"
                id="voice-default"
                name="voice"
                value=""
                checked={selectedVoice === ''}
                onChange={(e) => onVoiceChange(e.target.value)}
                className="w-4 h-4 text-primary-500"
              />
              <label htmlFor="voice-default" className="flex-1 text-sm cursor-pointer">
                <span className="font-medium">Default Voice</span>
                <span className="text-xs text-gray-500 ml-2">(System default)</span>
              </label>
            </div>
            
            {/* Available Voices with Test Buttons */}
            {voices.map((voice, index) => {
              const isRecommended = index < 5 && voice.localService;
              const isSelected = selectedVoice === voice.name;
              const isTesting = testingVoice === voice.name;
              
              return (
                <div 
                  key={voice.name}
                  className={`flex items-center gap-2 p-2 bg-white dark:bg-gray-900 border-2 transition-colors ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                  }`}
                >
                  <input
                    type="radio"
                    id={`voice-${voice.name}`}
                    name="voice"
                    value={voice.name}
                    checked={isSelected}
                    onChange={(e) => {
                      console.log('📱 Settings: Voice changed to:', e.target.value);
                      onVoiceChange(e.target.value);
                    }}
                    className="w-4 h-4 text-primary-500 flex-shrink-0"
                  />
                  <label htmlFor={`voice-${voice.name}`} className="flex-1 text-xs cursor-pointer min-w-0">
                    <div className="font-medium truncate">
                      {isRecommended ? '⭐ ' : ''}{voice.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      {voice.lang} • {voice.localService ? '[Local]' : '[Online]'}
                    </div>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => testVoice(voice.name)}
                    disabled={isTesting}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium transition-colors ${
                      isTesting
                        ? 'bg-orange-500 text-white'
                        : 'bg-primary-500 hover:bg-primary-600 text-white'
                    }`}
                    title="Test this voice"
                  >
                    {isTesting ? '🔊 Playing...' : '▶️ Test'}
                  </motion.button>
                </div>
              );
            })}
          </div>
          
          <div className="mt-3 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              💡 {selectedVoice || 'Default'} selected • {voices.length} voices available
            </p>
            <p className="text-xs text-green-600 dark:text-green-400">
              ⭐ = Most natural • [Local] = Better quality • ▶️ Test = Try before selecting
            </p>
            <p className="text-xs text-orange-500">
              📱 Mobile: Many voices may sound the same (browser limitation). Try ⭐ Enhanced voices!
            </p>
          </div>
        </div>

        {/* Voice Rate */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm sm:text-base">
            ⚡ Voice Speed: <span className="text-primary-500 font-bold">{voiceRate.toFixed(2)}x</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceRate}
            onChange={(e) => onVoiceRateChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>Slow</span>
            <span>Fast</span>
          </div>
        </div>

        {/* Voice Pitch */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm sm:text-base">
            🎵 Voice Pitch: <span className="text-primary-500 font-bold">{voicePitch.toFixed(2)}</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voicePitch}
            onChange={(e) => onVoicePitchChange(parseFloat(e.target.value))}
            className="w-full h-2 accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
            <span>Low</span>
            <span>High</span>
          </div>
        </div>

        {/* Personality Selector */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm sm:text-base">
            🎭 AI Personality & Tone
          </label>
          {(() => {
            try {
              return (
                <PersonalitySelector
                  userId={backendApi.getUserId()}
                  isDarkMode={true}
                  onPersonalityChange={(personality) => {
                    console.log(`🎭 Personality changed to: ${personality}`);
                  }}
                />
              );
            } catch (error) {
              console.error('PersonalitySelector error:', error);
              return (
                <div className="p-3 bg-red-100 dark:bg-red-900 bg-opacity-20 text-red-700 dark:text-red-300">
                  <p className="text-sm">⚠️ Personality selector temporarily unavailable</p>
                </div>
              );
            }
          })()}
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            Choose how Seven communicates with you
          </p>
        </div>

        {/* Language Selector */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
          <label className="block text-gray-900 dark:text-white mb-3 font-semibold text-sm sm:text-base">
            🌐 Language
          </label>
          <LanguageSelector
            userId={backendApi.getUserId()}
            isDarkMode={true}
            onLanguageChange={(lang) => {
              console.log(`🌐 Language changed to: ${lang}`);
            }}
          />
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Messages will be automatically translated
          </p>
        </div>

        {/* Accent Color Picker - Compact Squares */}
        <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 mb-3">
          <label className="block text-gray-900 dark:text-white mb-2 font-semibold text-sm">
            🎨 Theme Color
          </label>
          <div className="flex items-center gap-2 flex-wrap">
            {ACCENT_COLORS.map((color) => (
              <motion.button
                key={color.name}
                whileTap={{ scale: 0.9 }}
                onClick={() => onAccentColorChange(color.name)}
                className={`relative w-8 h-8 transition-all duration-300 ${
                  accentColor === color.name
                    ? 'ring-2 ring-offset-1 ring-offset-gray-100 dark:ring-offset-gray-900 scale-110'
                    : ''
                }`}
                style={{
                  backgroundColor: color.value,
                  boxShadow: accentColor === color.name 
                    ? `0 0 10px ${color.value}80, 0 2px 6px ${color.value}60`
                    : `0 1px 3px ${color.value}40`,
                  ringColor: color.value,
                  imageRendering: 'pixelated',
                }}
                title={color.label}
              >
                {accentColor === color.name && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg className="w-4 h-4 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Selected: <span className="font-semibold">{ACCENT_COLORS.find(c => c.name === accentColor)?.label || 'Orange'}</span>
          </p>
        </div>

        {/* Continuous Voice Mode Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600">
          <div>
            <span className="text-gray-900 dark:text-white font-bold text-sm sm:text-base block">
              🔄 Continuous Voice Mode
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-400">Auto-listen after response</span>
          </div>
          <button
            onClick={() => onContinuousVoiceModeChange(!continuousVoiceMode)}
            className={`relative inline-flex h-7 w-14 items-center transition-all duration-300 ${
              continuousVoiceMode ? 'bg-primary-500 shadow-lg shadow-primary-500/50' : 'bg-gray-400 dark:bg-gray-600'
            }`}
            style={{ borderRadius: '9999px' }}
          >
            <span
              className={`inline-block h-5 w-5 transform bg-white shadow-md transition-transform duration-300 ${
                continuousVoiceMode ? 'translate-x-8' : 'translate-x-1'
              }`}
              style={{ borderRadius: '9999px' }}
            />
          </button>
        </div>

        {/* Wake Word Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900 border-2 border-gray-300 dark:border-gray-600">
          <div className="flex-1">
            <span className="text-gray-900 dark:text-white font-bold text-sm sm:text-base block">
              👂 Wake Word ("Seven")
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Say "Seven" to activate voice input
            </p>
          </div>
          <button
            onClick={() => onWakeWordChange(!wakeWordEnabled)}
            className={`relative inline-flex h-7 w-14 items-center transition-all duration-300 ${
              wakeWordEnabled ? 'bg-primary-500 shadow-lg shadow-primary-500/50' : 'bg-gray-400 dark:bg-gray-600'
            }`}
            style={{ borderRadius: '9999px' }}
          >
            <span 
              className={`inline-block h-5 w-5 transform bg-white shadow-md transition-transform duration-300 ${
                wakeWordEnabled ? 'translate-x-8' : 'translate-x-1'
              }`}
              style={{ borderRadius: '9999px' }}
            />
          </button>
        </div>

        {/* Backend Features Section */}
        <div className="border-t-2 border-primary-500 border-opacity-30 pt-4 mt-4">
          <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            🌐 Backend Features
          </h4>

          {/* Backend Status */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base block">
                  Backend Status
                </span>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  http://localhost:5000
                </p>
              </div>
              <div className="flex items-center gap-2">
                {backendStatus === 'checking' && (
                  <span className="text-yellow-500 text-sm">⏳ Checking...</span>
                )}
                {backendStatus === 'online' && (
                  <span className="text-green-500 text-sm font-bold">✅ Online</span>
                )}
                {backendStatus === 'offline' && (
                  <span className="text-red-500 text-sm font-bold">❌ Offline</span>
                )}
                <button
                  onClick={checkBackendStatus}
                  className="px-2 py-1 bg-primary-500 hover:bg-primary-600 text-white text-xs transition-colors"
                  title="Refresh status"
                >
                  🔄
                </button>
              </div>
            </div>
          </div>

          {/* Memory Management */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 mb-4">
            <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base block mb-2">
              🧠 Backend Memory Management
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              View and manage AI's persistent memory stored in backend
            </p>
            <div className="flex gap-2 mb-3">
              <button
                onClick={loadBackendMemory}
                disabled={loadingMemory || backendStatus !== 'online'}
                className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white text-sm transition-colors"
              >
                {loadingMemory ? '⏳ Loading...' : '📖 Load Memory'}
              </button>
              <button
                onClick={clearBackendMemory}
                disabled={backendStatus !== 'online'}
                className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white text-sm transition-colors"
              >
                🗑️ Clear Memory
              </button>
            </div>
            {backendMemory.length > 0 && (
              <div className="mt-3 max-h-40 overflow-y-auto bg-white dark:bg-gray-900 p-2 border border-gray-300 dark:border-gray-600">
                <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {backendMemory.length} memory items:
                </p>
                {backendMemory.map((item, index) => (
                  <div key={index} className="text-xs text-gray-600 dark:text-gray-400 mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="font-semibold">{item.content}</p>
                    <p className="text-[10px] text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Knowledge Base Manager */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
            <KnowledgeManager isDarkMode={true} />
          </div>

          {/* External Integrations */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
            <IntegrationsPanel isDarkMode={true} />
          </div>

          {/* SMS / WhatsApp Testing */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700">
            <span className="text-gray-900 dark:text-white font-semibold text-sm sm:text-base block mb-2">
              📱 SMS & WhatsApp Testing
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Test SMS/WhatsApp functionality (requires Twilio setup)
            </p>
            <div className="space-y-2">
              <input
                type="tel"
                placeholder="Phone number (e.g., +1234567890)"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <textarea
                placeholder="Your message..."
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={sendSMS}
                  disabled={sendingMessage || backendStatus !== 'online' || !smsPhone || !smsMessage}
                  className="flex-1 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white text-sm transition-colors"
                >
                  {sendingMessage ? '📤 Sending...' : '📱 Send SMS'}
                </button>
                <button
                  onClick={sendWhatsApp}
                  disabled={sendingMessage || backendStatus !== 'online' || !smsPhone || !smsMessage}
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm transition-colors"
                >
                  {sendingMessage ? '📤 Sending...' : '📲 Send WhatsApp'}
                </button>
              </div>
              {messageStatus && (
                <p className={`text-xs font-semibold mt-2 ${messageStatus.includes('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {messageStatus}
                </p>
              )}
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2">
                ⚠️ Configure Twilio credentials in backend/.env to enable messaging
              </p>
            </div>
          </div>
        </div>
        </div>
      </motion.div>
    </div>
  );
};
