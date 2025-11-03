/**
 * Emotion Indicator Component
 * Displays user's detected emotion with animated visual feedback
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmotionData {
  emotion: string;
  sentiment?: string;
  confidence?: number;
  description?: string;
  source?: string;
}

interface EmotionIndicatorProps {
  emotion?: EmotionData;
  isDarkMode?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

// Emotion to emoji mapping
const EMOTION_EMOJIS: Record<string, string> = {
  happy: '😊',
  sad: '😢',
  angry: '😠',
  worried: '😟',
  excited: '🤩',
  grateful: '🙏',
  confident: '😎',
  frustrated: '😤',
  neutral: '😐'
};

// Emotion to color mapping (no border radius per user preference)
const EMOTION_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  happy: { 
    bg: 'from-yellow-400 to-orange-400', 
    text: 'text-yellow-800', 
    glow: 'shadow-yellow-500/50' 
  },
  sad: { 
    bg: 'from-blue-400 to-blue-600', 
    text: 'text-blue-900', 
    glow: 'shadow-blue-500/50' 
  },
  angry: { 
    bg: 'from-red-500 to-red-700', 
    text: 'text-red-900', 
    glow: 'shadow-red-500/50' 
  },
  worried: { 
    bg: 'from-purple-400 to-purple-600', 
    text: 'text-purple-900', 
    glow: 'shadow-purple-500/50' 
  },
  excited: { 
    bg: 'from-pink-400 to-pink-600', 
    text: 'text-pink-900', 
    glow: 'shadow-pink-500/50' 
  },
  grateful: { 
    bg: 'from-green-400 to-teal-500', 
    text: 'text-green-900', 
    glow: 'shadow-green-500/50' 
  },
  confident: { 
    bg: 'from-indigo-500 to-purple-600', 
    text: 'text-indigo-900', 
    glow: 'shadow-indigo-500/50' 
  },
  frustrated: { 
    bg: 'from-orange-500 to-red-500', 
    text: 'text-orange-900', 
    glow: 'shadow-orange-500/50' 
  },
  neutral: { 
    bg: 'from-gray-400 to-gray-500', 
    text: 'text-gray-800', 
    glow: 'shadow-gray-500/50' 
  }
};

export const EmotionIndicator: React.FC<EmotionIndicatorProps> = ({
  emotion,
  isDarkMode = true,
  size = 'medium',
  showLabel = true
}) => {
  if (!emotion || emotion.emotion === 'neutral') {
    return null;
  }

  const emotionType = emotion.emotion || 'neutral';
  const emoji = EMOTION_EMOJIS[emotionType] || EMOTION_EMOJIS.neutral;
  const colors = EMOTION_COLORS[emotionType] || EMOTION_COLORS.neutral;
  const confidence = emotion.confidence || 0;

  // Size variants
  const sizeClasses = {
    small: 'text-lg p-1',
    medium: 'text-2xl p-2',
    large: 'text-3xl p-3'
  };

  const labelSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="inline-flex items-center gap-2"
      >
        {/* Emotion Avatar */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.3 }}
          className={`
            bg-gradient-to-br ${colors.bg}
            ${sizeClasses[size]}
            flex items-center justify-center
            shadow-lg ${colors.glow}
            cursor-pointer
          `}
          title={`${emotionType} (${Math.round(confidence * 100)}% confident)\n${emotion.description || ''}`}
        >
          <motion.span
            animate={{ 
              scale: [1, 1.2, 1],
            }}
            transition={{ 
              repeat: Infinity, 
              duration: 2,
              ease: "easeInOut"
            }}
          >
            {emoji}
          </motion.span>
        </motion.div>

        {/* Label */}
        {showLabel && (
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col"
          >
            <span className={`
              ${labelSizeClasses[size]} 
              font-semibold 
              ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
              capitalize
            `}>
              {emotionType}
            </span>
            {confidence > 0 && (
              <span className={`
                text-xs 
                ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}
              `}>
                {Math.round(confidence * 100)}% sure
              </span>
            )}
          </motion.div>
        )}

        {/* Confidence bar (optional, subtle) */}
        {confidence > 0.5 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            className="absolute bottom-0 left-0 h-1 bg-white bg-opacity-30"
            style={{ width: `${confidence * 100}%` }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Mini version for inline display in messages
export const EmotionBadge: React.FC<{ emotion?: EmotionData }> = ({ emotion }) => {
  if (!emotion || emotion.emotion === 'neutral') {
    return null;
  }

  const emotionType = emotion.emotion || 'neutral';
  const emoji = EMOTION_EMOJIS[emotionType] || EMOTION_EMOJIS.neutral;

  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="inline-block ml-2 text-lg"
      title={`Feeling ${emotionType}`}
    >
      {emoji}
    </motion.span>
  );
};











