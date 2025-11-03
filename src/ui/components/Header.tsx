/**
 * Header Component - Simple header with branding and menu button
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  onShowSidebar?: () => void;
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
  onMediaAnalyzed,
  onShowSidebar
}) => {
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

  // Check if running in Electron (has TitleBar)
  const isElectron = typeof window !== 'undefined' && window.electron;
  
  return (
    <>
      {/* Header - Adjusted for TitleBar when in Electron */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={`glass-dark p-3 sm:p-4 flex items-center justify-between border-b ${
          isDarkMode 
            ? 'border-cyan-500/30' 
            : 'border-gray-300'
        } relative overflow-hidden ${
          isElectron ? 'pt-10' : '' // Add top padding when TitleBar is present
        }`}
        style={{
          boxShadow: '0 4px 20px rgba(0, 230, 255, 0.1)'
        }}
      >
        {/* Animated scan line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse"></div>
        
        <div className="flex items-center gap-2 sm:gap-3 relative z-10">
          {/* Sidebar Toggle Button - Jarvis Style */}
          {onShowSidebar && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onShowSidebar}
              className="jarvis-button p-2"
              title="Toggle sidebar"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
              </svg>
            </motion.button>
          )}
          
          {/* SEVEN Logo - Circular Futuristic Holographic */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 360 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 flex items-center justify-center font-bold text-xl sm:text-2xl text-white cursor-pointer rounded-full shadow-lg relative overflow-hidden"
            style={{
              boxShadow: '0 0 20px rgba(0, 230, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
            }}
          >
            <span className="relative z-10 jarvis-text">7</span>
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent animate-pulse rounded-full"></div>
          </motion.div>
          
          <div>
            <motion.h1
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="jarvis-text text-lg sm:text-2xl font-bold tracking-wider"
            >
              SEVEN
            </motion.h1>
            <motion.p
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className={`text-xs ${isDarkMode ? 'text-cyan-400/70' : 'text-gray-600'} hidden sm:block font-mono`}
            >
              {platform.toUpperCase()} • AI ASSISTANT {autoSpeak && '• 🔊'} 
            </motion.p>
          </div>
        </div>
      </motion.div>
    </>
  );
};

