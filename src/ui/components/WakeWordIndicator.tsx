/**
 * Wake Word Indicator - Shows when wake word detection is active
 */

import React from 'react';

interface WakeWordIndicatorProps {
  isActive: boolean;
}

export const WakeWordIndicator: React.FC<WakeWordIndicatorProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="fixed top-10 sm:top-11 md:top-24 right-1 sm:right-2 md:right-4 glass-dark px-1.5 py-1 sm:px-2 sm:py-1 md:px-3 md:py-2 flex items-center gap-1.5 sm:gap-2 animate-pulse z-40 max-w-[calc(100%-2rem)]">
      <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-cyan-500 rounded-full animate-pulse flex-shrink-0"></div>
      <span className="text-[10px] sm:text-xs text-gray-300 truncate">
        <span className="hidden sm:inline">Say "Seven" to activate 🎤</span>
        <span className="sm:hidden">Say "Seven" 🎤</span>
      </span>
    </div>
  );
};

