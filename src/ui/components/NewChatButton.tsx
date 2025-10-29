/**
 * New Chat Button - Create a fresh chat session while preserving memory
 */

import React from 'react';
import { motion } from 'framer-motion';

interface NewChatButtonProps {
  onClick: () => void;
  isDarkMode: boolean;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick, isDarkMode }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`neuro-button px-3 py-2 sm:px-4 sm:py-2 font-medium text-xs sm:text-sm flex items-center gap-2 ${
        isDarkMode ? 'text-gray-200' : 'text-gray-700'
      }`}
      title="Start a new chat (keeps memory)"
    >
      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 4v16m8-8H4"
        />
      </svg>
      <span className="hidden sm:inline">New Chat</span>
    </motion.button>
  );
};








