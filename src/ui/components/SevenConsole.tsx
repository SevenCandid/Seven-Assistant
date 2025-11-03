/**
 * Seven Console Component - Developer/System Information Console
 * Displays system status, conversation logs, and debugging information
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SevenConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SevenConsole: React.FC<SevenConsoleProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'system' | 'messages' | 'logs'>('system');
  const [logs, setLogs] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Load recent messages from memory store
    const loadMessages = async () => {
      try {
        const { getMemoryStore } = await import('../../memory/memoryStore');
        const memoryStore = getMemoryStore();
        const recentMessages = await memoryStore.getRecentMessages(10);
        setMessages(recentMessages);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50 sm:hidden"
          />
          
          {/* Console Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 w-full sm:w-[95vw] md:w-[90vw] max-w-2xl md:max-w-4xl h-[90vh] sm:h-[85vh] md:h-[80vh] glass-dark border-2 border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden flex flex-col"
            style={{
              boxShadow: '0 0 40px rgba(0, 230, 255, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-1 sm:p-2 md:p-4 flex items-center justify-between border-b border-cyan-500/30 flex-shrink-0">
              <div className="flex items-center gap-2">
                {/* Circular SEVEN Logo */}
                <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-600 flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-lg text-white rounded-full shadow-lg"
                  style={{
                    boxShadow: '0 0 20px rgba(0, 230, 255, 0.6), inset 0 0 20px rgba(255, 255, 255, 0.2)'
                  }}
                >
                  <span className="jarvis-text">7</span>
                </div>
                <h2 className="text-[10px] sm:text-xs md:text-lg font-mono text-cyan-400 font-bold tracking-wider">
                  SEVEN CONSOLE
                </h2>
              </div>
              <button
                onClick={onClose}
                className="p-1 sm:p-1.5 md:p-2 hover:bg-cyan-500/20 rounded transition-colors touch-manipulation"
                style={{ minWidth: '32px', minHeight: '32px' }}
                title="Close console"
              >
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLine="currentColor" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-cyan-500/20 flex-shrink-0 px-1 sm:px-2 gap-0.5 sm:gap-1">
              {(['system', 'messages', 'logs'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[8px] sm:text-[10px] md:text-xs font-mono transition-colors touch-manipulation ${
                    activeTab === tab
                      ? 'bg-cyan-500/30 text-cyan-300 border-b-2 border-cyan-500'
                      : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'
                  }`}
                  style={{ minHeight: '32px' }}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-1 sm:p-2 md:p-4 space-y-2 sm:space-y-3">
              {activeTab === 'system' && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-[8px] sm:text-xs font-mono">
                    <div className="text-cyan-400 mb-1">SYSTEM STATUS</div>
                    <div className="text-gray-300 space-y-1">
                      <div>Platform: Web</div>
                      <div>Backend: Connected</div>
                      <div>Memory: IndexedDB</div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'messages' && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-[8px] sm:text-xs font-mono text-cyan-400 mb-2">
                    RECENT MESSAGES ({messages.length})
                  </div>
                  {messages.length > 0 ? (
                    messages.map((msg, idx) => (
                      <div key={idx} className="text-[8px] sm:text-xs font-mono p-2 bg-gray-900/50 rounded border border-cyan-500/20">
                        <div className="text-cyan-300 mb-1">
                          {msg.role === 'user' ? 'USER' : 'ASSISTANT'}
                        </div>
                        <div className="text-gray-300">{msg.content?.substring(0, 100)}...</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-gray-400 text-[8px] sm:text-xs">No messages yet</div>
                  )}
                </div>
              )}

              {activeTab === 'logs' && (
                <div className="space-y-2 sm:space-y-3">
                  <div className="text-[8px] sm:text-xs font-mono text-cyan-400 mb-2">
                    SYSTEM LOGS
                  </div>
                  <div className="text-gray-400 text-[8px] sm:text-xs">
                    Logs will appear here...
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-1 sm:p-2 border-t border-cyan-500/20 flex-shrink-0 text-[8px] sm:text-[10px] text-gray-400 font-mono">
              Press Ctrl+Shift+S to toggle • ESC to close
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};


