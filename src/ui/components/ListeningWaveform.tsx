/**
 * Listening Waveform Component - Spinning "7" icon during listening
 */

import React from 'react';
import { motion } from 'framer-motion';

interface ListeningWaveformProps {
  isActive: boolean;
}

export const ListeningWaveform: React.FC<ListeningWaveformProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
      {/* Outer pulsing rings */}
      <motion.div
        className="absolute w-full h-full rounded-full border-2 border-primary-500"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0,
        }}
      />
      <motion.div
        className="absolute w-4/5 h-4/5 rounded-full border-2 border-primary-400"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
      <motion.div
        className="absolute w-3/5 h-3/5 rounded-full border-2 border-primary-300"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.3, 0.6],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1,
        }}
      />

          {/* Center spinning "7" */}
          <motion.div
            className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, rgb(var(--color-primary)), rgba(var(--color-primary), 0.7))`,
              boxShadow: '0 0 20px rgba(var(--color-primary), 0.5), 0 0 40px rgba(var(--color-primary), 0.3)'
            }}
            animate={{ 
              scale: [1, 1.08, 1],
              rotate: [0, 360]
            }}
            transition={{ 
              scale: {
                duration: 1.5, 
                repeat: Infinity, 
                ease: "easeInOut"
              },
              rotate: {
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }
            }}
          >
        {/* The "7" text */}
        <span className="text-6xl sm:text-7xl font-bold text-white" style={{ fontFamily: 'Arial, sans-serif', fontWeight: 900 }}>
          7
        </span>
      </motion.div>
    </div>
  );
};
