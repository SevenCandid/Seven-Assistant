/**
 * Offline Banner Component
 * Shows when the app is offline
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface OfflineBannerProps {
  isOnline: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline }) => {
  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-8 sm:top-9 left-0 right-0 bg-yellow-500 dark:bg-yellow-600 text-gray-900 dark:text-white px-4 py-2 text-center text-sm sm:text-base font-medium z-40"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <span>⚠️ Offline Mode - Some features may be limited</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};













