/**
 * Thinking Animation Component
 * Shows "Thinking..." with three bouncing dots when SEVEN is processing
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ThinkingAnimationProps {
  className?: string;
}

export const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({ 
  className = '' 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`flex items-center gap-2 ${className}`}
    >
      <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg glass-dark border border-cyan-500/20">
        <span className="text-xs sm:text-sm text-cyan-400/80 font-mono tracking-wider mr-2">
          THINKING
        </span>
        <div className="flex items-center gap-1.5">
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
          <motion.div
            className="w-2 h-2 bg-cyan-400 rounded-full"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.4,
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};



