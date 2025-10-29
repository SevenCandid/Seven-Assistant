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
    <div className="fixed top-20 sm:top-24 right-2 sm:right-4 glass-dark px-2 py-1 sm:px-3 sm:py-2 flex items-center gap-2 animate-pulse z-40">
      <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
      <span className="text-xs text-gray-300">
        <span className="hidden sm:inline">Say "Seven" to activate 🎤</span>
        <span className="sm:hidden">Say "Seven" 🎤</span>
      </span>
    </div>
  );
};

