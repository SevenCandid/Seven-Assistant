/**
 * Header Component - Dark/Light Mode with Voice Toggle and Mobile Menu
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from './ThemeToggle';
import { VoiceToggle } from './VoiceToggle';
import { MemoryStats } from './MemoryStats';
import { NewChatButton } from './NewChatButton';
import { FactsManager } from './FactsManager';
import { MediaCapture } from './MediaCapture';
import { Eye } from 'lucide-react';

interface HeaderProps {
  onClearMessages: () => void;
  onNewChat?: () => void;
  platform: string;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  autoSpeak: boolean;
  onToggleVoice: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
  onMediaAnalyzed?: (results: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onClearMessages,
  onNewChat,
  platform,
  isDarkMode,
  onToggleTheme,
  autoSpeak,
  onToggleVoice,
  onShowSettings,
  onShowHistory,
  onMediaAnalyzed
}) => {
  const [showMemoryStats, setShowMemoryStats] = useState(false);
  const [showFactsManager, setShowFactsManager] = useState(false);
  const [showMediaCapture, setShowMediaCapture] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Handle scroll for hide/show animation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show header (reappears immediately on any scroll)
      setIsVisible(true);
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      <MemoryStats 
        isOpen={showMemoryStats} 
        onClose={() => setShowMemoryStats(false)} 
      />
      <FactsManager
        isOpen={showFactsManager}
        onClose={() => setShowFactsManager(false)}
        isDarkMode={isDarkMode}
      />
      
      <AnimatePresence>
        {showMediaCapture && (
          <MediaCapture
            onMediaAnalyzed={(results) => {
              if (onMediaAnalyzed) {
                onMediaAnalyzed(results);
              }
              setShowMediaCapture(false);
            }}
            onClose={() => setShowMediaCapture(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Sticky Header Container with Scroll Animation */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : -100 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed top-0 left-0 right-0 z-30"
      >
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setShowMobileMenu(false)}
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 h-full w-64 glass-dark z-50 md:hidden border-l-2 border-primary-500 shadow-2xl`}
            >
              <div className="p-6">
                {/* Close Button */}
                <div className="flex justify-between items-center mb-8">
                  <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Menu
                  </h3>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowMobileMenu(false)}
                    className={`p-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                    </svg>
                  </motion.button>
                </div>

                {/* Menu Items */}
                <div className="space-y-3">
                  {/* Voice Toggle */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className={`flex items-center justify-between p-4 glass border border-primary-500 border-opacity-20`}
                  >
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      🔊 Voice Output
                    </span>
                    <VoiceToggle isEnabled={autoSpeak} onToggle={onToggleVoice} />
                  </motion.div>

                  {/* Theme Toggle */}
                  <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className={`flex items-center justify-between p-4 glass border border-primary-500 border-opacity-20`}
                  >
                    <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {isDarkMode ? '🌙' : '☀️'} Theme
                    </span>
                    <ThemeToggle isDark={isDarkMode} onToggle={onToggleTheme} />
                  </motion.div>

                  {/* New Chat */}
                  {onNewChat && (
                    <motion.button
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onNewChat();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 glass border border-primary-500 border-opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      New Chat
                    </motion.button>
                  )}

                  {/* Settings */}
                  {onShowSettings && (
                    <motion.button
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.25 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onShowSettings();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 glass border border-primary-500 border-opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
                      </svg>
                      Settings
                    </motion.button>
                  )}

                  {/* Chat History */}
                  {onShowHistory && (
                    <motion.button
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onShowHistory();
                        setShowMobileMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 p-4 glass border border-primary-500 border-opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z" />
                      </svg>
                      Chat History
                    </motion.button>
                  )}

                  {/* Facts Manager */}
                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowFactsManager(true);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 glass border border-primary-500 border-opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13.08,16H20V4H4V16H10M16.5,6C16.67,6 16.84,6.04 17,6.1V7C17,7.53 16.71,8 16.32,8.24C16.62,8.5 17,9.05 17,9.5V10C17,10.65 16.62,11.25 16,11.5V12A0.5,0.5 0 0,1 15.5,12.5H14.5A0.5,0.5 0 0,1 14,12V11.5C13.38,11.25 13,10.65 13,10V9.5C13,9.05 13.38,8.5 13.68,8.24C13.29,8 13,7.53 13,7V6.1C13.16,6.04 13.33,6 13.5,6H16.5M14,7V9H16V7H14M14,10V11H16V10H14Z" />
                    </svg>
                    Memory Facts
                  </motion.button>

                  {/* Media Analysis */}
                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowMediaCapture(true);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 glass border border-primary-500 border-opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}
                  >
                    <Eye className="w-5 h-5" />
                    Media Analysis
                  </motion.button>

                  {/* Memory Stats */}
                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowMemoryStats(true);
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 glass border border-primary-500 border-opacity-20 ${isDarkMode ? 'text-white' : 'text-gray-900'} font-medium`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
                    </svg>
                    Memory Stats
                  </motion.button>

                  {/* Clear Messages */}
                  <motion.button
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.45 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      onClearMessages();
                      setShowMobileMenu(false);
                    }}
                    className={`w-full flex items-center gap-3 p-4 glass border border-red-500 border-opacity-30 ${isDarkMode ? 'text-red-300' : 'text-red-600'} font-medium`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                    </svg>
                    Clear Conversation
                  </motion.button>
                </div>

                {/* Platform Info */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                  className="mt-8 pt-6 border-t border-primary-500 border-opacity-20"
                >
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-center`}>
                    {platform} • AI Assistant {autoSpeak && '🔊'}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="glass-dark p-3 sm:p-4 flex items-center justify-between border-b border-white border-opacity-10"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <motion.div
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center font-bold text-xl sm:text-2xl text-white glow-pulse cursor-pointer"
          >
            7
          </motion.div>
          <div>
            <motion.h1
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent`}
            >
              Seven
            </motion.h1>
            <motion.p
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} hidden sm:block`}
            >
              {platform} • AI Assistant {autoSpeak && '🔊'} 
            </motion.p>
          </div>
        </div>
        
        {/* Desktop Icons (hidden on mobile) */}
        <motion.div
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="hidden md:flex items-center gap-2"
        >
          {onNewChat && <NewChatButton onClick={onNewChat} isDarkMode={isDarkMode} />}
          <VoiceToggle isEnabled={autoSpeak} onToggle={onToggleVoice} />
          <ThemeToggle isDark={isDarkMode} onToggle={onToggleTheme} />
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMediaCapture(true)}
            className={`neuro-button px-3 py-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            title="Media Analysis"
          >
            <Eye className="w-5 h-5" />
          </motion.button>
          {onShowSettings && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onShowSettings}
              className={`neuro-button px-3 py-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
              title="Settings"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
              </svg>
            </motion.button>
          )}
          {onShowHistory && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onShowHistory}
              className={`neuro-button px-3 py-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
              title="Chat history"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,3C7.58,3 4,4.79 4,7C4,9.21 7.58,11 12,11C16.42,11 20,9.21 20,7C20,4.79 16.42,3 12,3M4,9V12C4,14.21 7.58,16 12,16C16.42,16 20,14.21 20,12V9C20,11.21 16.42,13 12,13C7.58,13 4,11.21 4,9M4,14V17C4,19.21 7.58,21 12,21C16.42,21 20,19.21 20,17V14C20,16.21 16.42,18 12,18C7.58,18 4,16.21 4,14Z" />
              </svg>
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowFactsManager(true)}
            className={`neuro-button px-3 py-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            title="Memory facts"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M9,22A1,1 0 0,1 8,21V18H4A2,2 0 0,1 2,16V4C2,2.89 2.9,2 4,2H20A2,2 0 0,1 22,4V16A2,2 0 0,1 20,18H13.9L10.2,21.71C10,21.9 9.75,22 9.5,22V22H9M10,16V19.08L13.08,16H20V4H4V16H10M16.5,6C16.67,6 16.84,6.04 17,6.1V7C17,7.53 16.71,8 16.32,8.24C16.62,8.5 17,9.05 17,9.5V10C17,10.65 16.62,11.25 16,11.5V12A0.5,0.5 0 0,1 15.5,12.5H14.5A0.5,0.5 0 0,1 14,12V11.5C13.38,11.25 13,10.65 13,10V9.5C13,9.05 13.38,8.5 13.68,8.24C13.29,8 13,7.53 13,7V6.1C13.16,6.04 13.33,6 13.5,6H16.5M14,7V9H16V7H14M14,10V11H16V10H14Z" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMemoryStats(true)}
            className={`neuro-button px-3 py-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            title="Memory stats"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8Z" />
            </svg>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClearMessages}
            className={`neuro-button px-4 py-2 font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}
            title="Clear conversation"
          >
            Clear
          </motion.button>
        </motion.div>

        {/* Mobile Hamburger Menu (visible on mobile only) */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowMobileMenu(true)}
          className="md:hidden neuro-button p-2"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
          </svg>
        </motion.button>
      </motion.div>
      </motion.div>
      {/* End Sticky Header Container */}
    </>
  );
};

