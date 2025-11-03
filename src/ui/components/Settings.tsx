/**
 * Settings Component - Jarvis-style futuristic UI
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backendApi } from '../../core/backendApi';
import { LanguageSelector } from './LanguageSelector';
import { KnowledgeManager } from './KnowledgeManager';
import { IntegrationsPanel } from './IntegrationsPanel';

interface SettingsProps {
  llmProvider: 'openai' | 'ollama' | 'grok' | 'groq';
  llmModel: string;
  autoSpeak: boolean;
  wakeWordEnabled: boolean;
  continuousVoiceMode: boolean;
  onProviderChange: (provider: 'openai' | 'ollama' | 'grok' | 'groq') => void;
  onModelChange: (model: string) => void;
  onAutoSpeakChange: (autoSpeak: boolean) => void;
  onWakeWordChange: (enabled: boolean) => void;
  onContinuousVoiceModeChange: (enabled: boolean) => void;
  onSaveLlmSettings: () => void;
  onClose?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  llmProvider,
  llmModel,
  autoSpeak,
  wakeWordEnabled,
  continuousVoiceMode,
  onProviderChange,
  onModelChange,
  onAutoSpeakChange,
  onWakeWordChange,
  onContinuousVoiceModeChange,
  onSaveLlmSettings,
  onClose,
}) => {
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  
  // Backend features state
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [backendMemory, setBackendMemory] = useState<any[]>([]);
  const [loadingMemory, setLoadingMemory] = useState(false);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState<string>('');
  

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


  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node) && onClose) {
        onClose();
      }
    };

    if (onClose) {
      // Add event listener after component mounts
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [onClose]);

  // Prevent body scroll when settings is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Settings Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-2 md:p-4 pointer-events-none">
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          data-settings-modal
          className="w-full max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl max-h-[95vh] sm:max-h-[90vh] md:max-h-[85vh] glass-dark border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col pointer-events-auto rounded-lg sm:rounded-xl"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 30px rgba(0, 230, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
          }}
        >
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-50 glass-dark border-b border-cyan-500/30 backdrop-blur-xl flex-shrink-0">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 rounded-full flex items-center justify-center font-bold text-base sm:text-lg text-white shadow-lg relative overflow-hidden"
                style={{
                  boxShadow: '0 0 15px rgba(0, 230, 255, 0.6), inset 0 0 15px rgba(255, 255, 255, 0.2)'
                }}
              >
                <span className="relative z-10 jarvis-text">7</span>
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent animate-pulse rounded-full"></div>
              </div>
              <div>
                <h3 className="text-sm sm:text-lg font-bold text-cyan-300 font-mono tracking-wider">SETTINGS</h3>
                <p className="text-[10px] sm:text-xs text-cyan-400/70 font-mono hidden sm:block">Configure SEVEN AI Systems</p>
              </div>
            </div>
            {onClose && (
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(239, 68, 68, 0.2)' }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all rounded"
                title="Close settings"
                aria-label="Close settings"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </motion.button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-2 sm:space-y-3 md:space-y-4">
          {/* LLM Provider - Auto-switches based on connectivity */}
          <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg"
            style={{
              boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <label className="block text-cyan-300 mb-3 font-bold text-sm font-mono tracking-wider">
              🤖 AI PROVIDER
            </label>
            <select
              value={llmProvider}
              onChange={(e) => onProviderChange(e.target.value as any)}
              className="w-full px-4 py-2.5 glass-dark border border-cyan-500/30 text-cyan-100 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
              style={{
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                boxShadow: '0 0 10px rgba(0, 230, 255, 0.2)'
              }}
            >
              <option value="groq" className="bg-gray-900 text-cyan-100">Groq (Online)</option>
              <option value="ollama" className="bg-gray-900 text-cyan-100">Ollama (Offline/Local)</option>
            </select>
            <p className="mt-2 text-xs text-cyan-400/70 font-mono">
              Auto-switches to Ollama when offline
            </p>
          </div>

          {/* LLM Model */}
          <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg"
            style={{
              boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <label className="block text-cyan-300 mb-3 font-bold text-sm font-mono tracking-wider">
              🎯 MODEL
            </label>
          
            {llmProvider === 'groq' ? (
              // Display current Groq model (read-only)
              <div className="w-full px-4 py-2.5 glass-dark border border-cyan-500/30 text-cyan-100 font-mono text-sm flex items-center justify-between"
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 0 10px rgba(0, 230, 255, 0.2)'
                }}
              >
                <span className="text-cyan-200">⚡ {llmModel}</span>
                <span className="text-xs text-cyan-400/60 font-mono">CURRENT</span>
              </div>
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
                className="w-full px-4 py-2.5 glass-dark border border-cyan-500/30 text-cyan-100 placeholder-cyan-400/50 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm"
                style={{
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  boxShadow: '0 0 10px rgba(0, 230, 255, 0.2)'
                }}
              />
            )}
            
            {/* Save Button */}
            <motion.button
              whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(0, 230, 255, 0.4)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onSaveLlmSettings();
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 2000);
              }}
              className="mt-3 w-full px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold text-sm font-mono tracking-wider transition-all shadow-lg"
              style={{
                boxShadow: saveSuccess ? '0 0 20px rgba(0, 230, 255, 0.6)' : '0 0 15px rgba(0, 230, 255, 0.3)'
              }}
            >
              {saveSuccess ? '✓ SAVED' : '💾 SAVE MODEL SETTINGS'}
            </motion.button>
            <p className="mt-2 text-xs text-cyan-400/70 font-mono text-center">
              Changes apply instantly
            </p>
            
            <div className="mt-3 text-xs text-cyan-400/60 font-mono">
              {llmProvider === 'groq' && (
                <div>
                  <p className="font-medium mb-2 text-cyan-300">Current Model:</p>
                  <p className="text-xs text-cyan-400/70">
                    ⚡ <strong>{llmModel}</strong> - Fastest response time (6k TPM)
                  </p>
                </div>
              )}
              {llmProvider === 'ollama' && (
                <div>
                  <p className="font-medium mb-2 text-cyan-300">Recommended Ollama model:</p>
                  <ul className="space-y-1 ml-2">
                    <li>• <strong>llama3.2</strong> (Works offline)</li>
                  </ul>
                  <p className="text-xs text-cyan-400/60 mt-2">
                    Requires Ollama running locally. Activates automatically when offline.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Voice Toggles */}
          <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg space-y-3"
            style={{
              boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <label className="block text-cyan-300 mb-3 font-bold text-sm font-mono tracking-wider">
              🔊 VOICE SETTINGS
            </label>

            {/* Auto-Speak Toggle */}
            <div className="flex items-center justify-between p-3 glass-dark border border-cyan-500/20 rounded">
              <div className="flex-1">
                <span className="text-cyan-200 font-bold text-sm font-mono block">
                  AUTO-SPEAK RESPONSES
                </span>
                <p className="text-xs text-cyan-400/60 font-mono mt-1">
                  SEVEN will speak responses out loud
                </p>
              </div>
              <button
                onClick={() => onAutoSpeakChange(!autoSpeak)}
                className={`relative inline-flex h-7 w-14 items-center transition-all duration-300 ${
                  autoSpeak ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-gray-600'
                }`}
                style={{ borderRadius: '9999px' }}
              >
                <span 
                  className={`inline-block h-5 w-5 transform bg-white shadow-md transition-transform duration-300 ${
                    autoSpeak ? 'translate-x-8' : 'translate-x-1'
                  }`}
                  style={{ borderRadius: '9999px' }}
                />
              </button>
            </div>

            {/* Continuous Voice Mode Toggle */}
            <div className="flex items-center justify-between p-3 glass-dark border border-cyan-500/20 rounded">
              <div className="flex-1">
                <span className="text-cyan-200 font-bold text-sm font-mono block">
                  CONTINUOUS VOICE MODE
                </span>
                <p className="text-xs text-cyan-400/60 font-mono mt-1">
                  Auto-listen after response
                </p>
              </div>
              <button
                onClick={() => onContinuousVoiceModeChange(!continuousVoiceMode)}
                className={`relative inline-flex h-7 w-14 items-center transition-all duration-300 ${
                  continuousVoiceMode ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-gray-600'
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
            <div className="flex items-center justify-between p-3 glass-dark border border-cyan-500/20 rounded">
              <div className="flex-1">
                <span className="text-cyan-200 font-bold text-sm font-mono block">
                  WAKE WORD ("SEVEN")
                </span>
                <p className="text-xs text-cyan-400/60 font-mono mt-1">
                  Say "Seven" to activate voice input
                </p>
              </div>
              <button
                onClick={() => onWakeWordChange(!wakeWordEnabled)}
                className={`relative inline-flex h-7 w-14 items-center transition-all duration-300 ${
                  wakeWordEnabled ? 'bg-cyan-500 shadow-lg shadow-cyan-500/50' : 'bg-gray-600'
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
          </div>

          {/* Language Selector */}
          <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg"
            style={{
              boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <label className="block text-cyan-300 mb-3 font-bold text-sm font-mono tracking-wider">
              🌐 LANGUAGE
            </label>
            <LanguageSelector
              userId={backendApi.getUserId()}
              isDarkMode={true}
              onLanguageChange={(lang) => {
                console.log(`🌐 Language changed to: ${lang}`);
              }}
            />
            <p className="mt-2 text-xs text-cyan-400/70 font-mono">
              Messages will be automatically translated
            </p>
          </div>

          {/* Backend Features Section */}
          <div className="border-t-2 border-cyan-500/30 pt-4 mt-4">
            <h4 className="text-base sm:text-lg font-bold text-cyan-300 font-mono tracking-wider mb-4 flex items-center gap-2">
              🌐 BACKEND FEATURES
            </h4>

            {/* Backend Status */}
            <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg mb-4"
              style={{
                boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-cyan-300 font-bold text-sm font-mono block">
                    BACKEND STATUS
                  </span>
                  <p className="text-xs text-cyan-400/60 font-mono mt-1">
                    http://localhost:5000
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {backendStatus === 'checking' && (
                    <span className="text-yellow-400 text-sm font-mono">⏳ CHECKING...</span>
                  )}
                  {backendStatus === 'online' && (
                    <span className="text-green-400 text-sm font-bold font-mono">✅ ONLINE</span>
                  )}
                  {backendStatus === 'offline' && (
                    <span className="text-red-400 text-sm font-bold font-mono">❌ OFFLINE</span>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={checkBackendStatus}
                    className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-mono transition-colors border border-cyan-500/30 rounded"
                    title="Refresh status"
                  >
                    🔄
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Memory Management */}
            <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg mb-4"
              style={{
                boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <span className="text-cyan-300 font-bold text-sm font-mono block mb-3">
                🧠 BACKEND MEMORY MANAGEMENT
              </span>
              <p className="text-xs text-cyan-400/60 font-mono mb-3">
                View and manage AI's persistent memory stored in backend
              </p>
              <div className="flex gap-2 mb-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadBackendMemory}
                  disabled={loadingMemory || backendStatus !== 'online'}
                  className="flex-1 px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-cyan-300 text-sm font-mono transition-colors border border-cyan-500/30 rounded"
                >
                  {loadingMemory ? '⏳ LOADING...' : '📖 LOAD MEMORY'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearBackendMemory}
                  disabled={backendStatus !== 'online'}
                  className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-red-400 text-sm font-mono transition-colors border border-red-500/30 rounded"
                >
                  🗑️ CLEAR MEMORY
                </motion.button>
              </div>
              {backendMemory.length > 0 && (
                <div className="mt-3 max-h-40 overflow-y-auto glass-dark p-3 border border-cyan-500/20 rounded">
                  <p className="text-xs font-bold text-cyan-300 font-mono mb-2">
                    {backendMemory.length} MEMORY ITEMS:
                  </p>
                  {backendMemory.map((item, index) => (
                    <div key={index} className="text-xs text-cyan-400/70 font-mono mb-2 pb-2 border-b border-cyan-500/20">
                      <p className="font-semibold text-cyan-200">{item.content}</p>
                      <p className="text-[10px] text-cyan-400/50 mt-1">{new Date(item.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Knowledge Base Manager */}
            <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg mb-4"
              style={{
                boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <KnowledgeManager isDarkMode={true} />
            </div>

            {/* External Integrations */}
            <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg mb-4"
              style={{
                boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <IntegrationsPanel isDarkMode={true} />
            </div>

            {/* SMS / WhatsApp Testing */}
            <div className="glass-dark p-4 border border-cyan-500/20 rounded-lg"
              style={{
                boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              <span className="text-cyan-300 font-bold text-sm font-mono block mb-3">
                📱 SMS & WHATSAPP TESTING
              </span>
              <p className="text-xs text-cyan-400/60 font-mono mb-3">
                Test SMS/WhatsApp functionality (requires Twilio setup)
              </p>
              <div className="space-y-2">
                <input
                  type="tel"
                  placeholder="Phone number (e.g., +1234567890)"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="w-full px-3 py-2 glass-dark border border-cyan-500/30 text-cyan-100 placeholder-cyan-400/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 rounded"
                  style={{
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                />
                <textarea
                  placeholder="Your message..."
                  value={smsMessage}
                  onChange={(e) => setSmsMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 glass-dark border border-cyan-500/30 text-cyan-100 placeholder-cyan-400/50 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none rounded"
                  style={{
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                  }}
                />
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={sendSMS}
                    disabled={sendingMessage || backendStatus !== 'online' || !smsPhone || !smsMessage}
                    className="flex-1 px-3 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-green-400 text-sm font-mono transition-colors border border-green-500/30 rounded"
                  >
                    {sendingMessage ? '📤 SENDING...' : '📱 SEND SMS'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={sendWhatsApp}
                    disabled={sendingMessage || backendStatus !== 'online' || !smsPhone || !smsMessage}
                    className="flex-1 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:bg-gray-600/50 disabled:cursor-not-allowed text-green-400 text-sm font-mono transition-colors border border-green-600/30 rounded"
                  >
                    {sendingMessage ? '📤 SENDING...' : '📲 SEND WHATSAPP'}
                  </motion.button>
                </div>
                {messageStatus && (
                  <p className={`text-xs font-bold font-mono mt-2 ${messageStatus.includes('✅') ? 'text-green-400' : 'text-red-400'}`}>
                    {messageStatus}
                  </p>
                )}
                <p className="text-[10px] text-cyan-400/50 font-mono mt-2">
                  ⚠️ Configure Twilio credentials in backend/.env to enable messaging
                </p>
              </div>
            </div>
          </div>
        </div>
        </motion.div>
      </div>
    </>
  );
};
