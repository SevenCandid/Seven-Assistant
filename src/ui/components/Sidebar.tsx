/**
 * Sidebar Component - ChatGPT-style sidebar
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onShowSidebar?: () => void;
  isDarkMode: boolean;
  autoSpeak: boolean;
  onToggleVoice: () => void;
  onToggleTheme: () => void;
  onNewChat?: () => void;
  onShowSettings?: () => void;
  onShowHistory?: () => void;
  onShowMediaCapture?: () => void;
  onShowFactsManager?: () => void;
  onShowMemoryStats?: () => void;
  onClearMessages: () => void;
  sessions?: Array<{ id: string; title: string; lastMessageAt: Date; messageCount: number; createdAt: Date }>;
  onSelectSession?: (sessionId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  isDarkMode,
  autoSpeak,
  onToggleVoice,
  onToggleTheme,
  onNewChat,
  onShowSettings,
  onShowHistory,
  onShowMediaCapture,
  onShowFactsManager,
  onShowMemoryStats,
  onClearMessages,
  sessions = [],
  onSelectSession,
}) => {
  // In Electron, don't treat as mobile even if window is narrow
  const isElectron = typeof window !== 'undefined' && (window as any).electron;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640 && !isElectron;
  const isTablet = typeof window !== 'undefined' && window.innerWidth >= 640 && window.innerWidth < 1024;
  
  // Determine sidebar width based on screen size
  const sidebarWidth = isMobile ? '100%' : (isTablet ? '240px' : '260px');
  
  return (
    <>
      {/* Sidebar Overlay (Mobile only) */}
      <AnimatePresence>
        {isOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-30 sm:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Panel */}
      <motion.div
        initial={false}
        animate={{
          x: isOpen ? 0 : `-${isMobile ? '100%' : (isTablet ? '240px' : '260px')}`,
        }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 300,
        }}
        className={`fixed left-0 top-8 sm:top-9 bottom-0 ${
          isDarkMode ? 'bg-gray-950' : 'bg-gray-100'
        } z-40 flex flex-col overflow-hidden border-r ${
          isDarkMode ? 'border-gray-800' : 'border-gray-200'
        } shadow-lg`}
        style={{
          width: sidebarWidth,
          maxWidth: sidebarWidth,
        }}
      >
        {/* Header with New Chat button */}
        <div className="p-2 sm:p-3 flex-shrink-0">
          {onNewChat && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewChat}
              className={`w-full flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary-500/40 touch-manipulation transition-colors ${
                isDarkMode
                  ? 'border-gray-700 hover:bg-gray-800 text-white'
                  : 'border-gray-300 hover:bg-white text-gray-900'
              }`}
              style={{ minHeight: '44px' }}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </svg>
              <span className="font-medium text-xs sm:text-sm">New chat</span>
            </motion.button>
          )}
        </div>

        {/* Menu Items - Chat History */}
        <div
          className="flex-1 overflow-y-auto px-2 sm:px-3 space-y-0.5 sm:space-y-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: `${isDarkMode ? '#374151 #1F2937' : '#D1D5DB #F3F4F6'}`,
          }}
        >
          {/* Chat History Label */}
          <div
            className={`text-[10px] sm:text-xs font-semibold px-2 sm:px-3 py-1.5 sm:py-2 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}
          >
            Chats
          </div>
          
          {/* Chat Sessions */}
          {sessions && sessions.length > 0 ? (
            sessions.map((s) => (
              <motion.button
                key={s.id}
                whileHover={{ backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }}
                onClick={() => onSelectSession && onSelectSession(s.id)}
                className={`w-full text-left p-2 sm:p-2.5 rounded-lg transition-colors ring-1 ring-transparent hover:ring-white/10 touch-manipulation ${
                  isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
                }`}
                title={new Date(s.lastMessageAt).toLocaleString()}
                style={{ minHeight: '44px' }}
              >
                <span className="text-xs sm:text-sm line-clamp-1">
                  {s.title || 'Untitled chat'}
                </span>
                <span
                  className={`block text-[9px] sm:text-[10px] mt-0.5 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {s.messageCount || 0} messages
                </span>
              </motion.button>
            ))
          ) : (
            <div
              className={`text-[10px] sm:text-xs px-2 sm:px-3 py-2 ${
                isDarkMode ? 'text-gray-500' : 'text-gray-500'
              }`}
            >
              No chats yet
            </div>
          )}
        </div>

        {/* Footer - Menu Items */}
        <div
          className={`p-2 sm:p-2.5 border-t flex-shrink-0 space-y-0.5 sm:space-y-1 ${
            isDarkMode ? 'border-gray-800' : 'border-gray-200'
          }`}
        >
          {/* Settings */}
          {onShowSettings && (
            <motion.button
              whileHover={{ backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }}
              onClick={onShowSettings}
              className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 touch-manipulation ${
                isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
              }`}
              style={{ minHeight: '44px' }}
            >
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.21,8.95 2.27,9.22 2.46,9.37L4.57,11C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.21,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.67 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z" />
              </svg>
              <span className="truncate">Settings</span>
            </motion.button>
          )}

          {/* Toggle Theme */}
          <motion.button
            whileHover={{ backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }}
            onClick={onToggleTheme}
            className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 touch-manipulation ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            style={{ minHeight: '44px' }}
          >
            <span className="text-base sm:text-lg flex-shrink-0">{isDarkMode ? '🌙' : '☀️'}</span>
            <span className="truncate">{isDarkMode ? 'Dark mode' : 'Light mode'}</span>
          </motion.button>

          {/* Toggle Voice */}
          <motion.button
            whileHover={{ backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }}
            onClick={onToggleVoice}
            className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 touch-manipulation ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            style={{ minHeight: '44px' }}
          >
            <span className="text-base sm:text-lg flex-shrink-0">{autoSpeak ? '🔊' : '🔇'}</span>
            <span className="truncate">{autoSpeak ? 'Voice on' : 'Voice off'}</span>
          </motion.button>

          {/* Close Sidebar */}
          <motion.button
            whileHover={{ backgroundColor: isDarkMode ? '#374151' : '#F3F4F6' }}
            onClick={onClose}
            className={`w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg text-xs sm:text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/40 touch-manipulation ${
              isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-700 hover:text-gray-900'
            }`}
            style={{ minHeight: '44px' }}
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M15.41,16.58L10.83,12L15.41,7.41L14,6L8,12L14,18L15.41,16.58Z" />
            </svg>
            <span className="truncate">Close sidebar</span>
          </motion.button>
        </div>
      </motion.div>
    </>
  );
};

