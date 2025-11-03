/**
 * Splash Screen Component
 * Shows during SEVEN initialization
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// Custom Waveform Component for Splash Screen
const SplashWaveform: React.FC = () => {
  const [waveData, setWaveData] = useState<number[]>([]);
  const [rotation, setRotation] = useState(0);
  const wavePoints = 64;

  useEffect(() => {
    const initialWave = Array.from({ length: wavePoints }, () => Math.random() * 0.3 + 0.2);
    setWaveData(initialWave);

    let animationFrame: number;
    let lastUpdate = Date.now();

    const updateWave = () => {
      const now = Date.now();
      lastUpdate = now;

      setRotation(prev => (prev + 0.5) % 360);

      const time = Date.now() / 1000;
      setWaveData(prev => {
        return prev.map((_, index) => {
          const angle = (index / wavePoints) * Math.PI * 2;
          const wave1 = Math.sin(angle * 2 + time * 2.5) * 0.2;
          const wave2 = Math.sin(angle * 4 + time * 3.5) * 0.15;
          const wave3 = Math.sin(angle * 6 + time * 2) * 0.1;
          const base = 0.35;
          const amplitude = Math.max(0.2, Math.min(0.9, base + wave1 + wave2 + wave3));
          const random = (Math.random() - 0.5) * 0.05;
          return amplitude + random;
        });
      });

      animationFrame = requestAnimationFrame(updateWave);
    };

    animationFrame = requestAnimationFrame(updateWave);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  const radius = 40;
  const centerX = 50;
  const centerY = 50;

  const generateWavePath = () => {
    if (waveData.length === 0) return '';

    const points: string[] = [];
    
    waveData.forEach((amplitude, index) => {
      const angle = (index / wavePoints) * Math.PI * 2;
      const distance = radius + (amplitude * radius * 0.6);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (index === 0) {
        points.push(`M ${x} ${y}`);
      } else if (index === 1) {
        points.push(`L ${x} ${y}`);
      } else {
        const prevAngle = ((index - 1) / wavePoints) * Math.PI * 2;
        const prevAmplitude = waveData[index - 1];
        const prevDistance = radius + (prevAmplitude * radius * 0.6);
        const prevX = centerX + Math.cos(prevAngle) * prevDistance;
        const prevY = centerY + Math.sin(prevAngle) * prevDistance;
        const controlX = (prevX + x) / 2;
        const controlY = (prevY + y) / 2;
        points.push(`Q ${controlX} ${controlY} ${x} ${y}`);
      }
    });
    
    points.push('Z');
    return points.join(' ');
  };

  return (
    <motion.div
      animate={{ 
        scale: [1, 1.05, 1],
        rotate: rotation,
      }}
      transition={{
        scale: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
        rotate: {
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        },
      }}
      className="w-full h-full"
      style={{
        filter: 'drop-shadow(0 0 30px rgba(0, 230, 255, 0.8))',
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          filter: 'drop-shadow(0 0 15px rgba(0, 230, 255, 0.6))',
        }}
      >
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 1.15}
          fill="none"
          stroke="rgba(0, 230, 255, 0.3)"
          strokeWidth="0.5"
          opacity={0.5}
        />
        
        <motion.path
          d={generateWavePath()}
          fill="url(#splashWaveGradient)"
          opacity={0.9}
          style={{
            filter: 'drop-shadow(0 0 12px rgba(0, 230, 255, 1))',
          }}
          animate={{
            opacity: [0.7, 0.95, 0.7],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <circle
          cx={centerX}
          cy={centerY}
          r={radius * 0.3}
          fill="rgba(0, 230, 255, 0.5)"
          style={{
            filter: 'drop-shadow(0 0 15px rgba(0, 230, 255, 0.8))',
          }}
        >
          <animate
            attributeName="r"
            values={`${radius * 0.3};${radius * 0.4};${radius * 0.3}`}
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.7;0.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="jarvis-text"
          fontSize="14"
          fill="rgba(255, 255, 255, 1)"
          fontWeight="bold"
          style={{
            filter: 'drop-shadow(0 0 6px rgba(0, 230, 255, 1))',
          }}
        >
          7
        </text>
        
        <defs>
          <radialGradient id="splashWaveGradient" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(0, 230, 255, 1)" />
            <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
            <stop offset="100%" stopColor="rgba(0, 230, 255, 0.6)" />
          </radialGradient>
        </defs>
      </svg>
      
      <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
        style={{
          animation: 'pulse-ring 2s ease-in-out infinite',
        }}
      />
      <div className="absolute inset-0 rounded-full border border-cyan-400/30"
        style={{
          animation: 'pulse-ring 2s ease-in-out infinite 0.5s',
        }}
      />
      
      <style>{`
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.15);
          }
        }
      `}</style>
    </motion.div>
  );
};

interface SplashScreenProps {
  message: string;
  isReconnecting?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  message,
  isReconnecting = false 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[9999] bg-[#0a0a15] flex items-center justify-center"
      style={{
        background: 'radial-gradient(circle at center, #0a0a15 0%, #000000 100%)',
      }}
    >
      {/* Animated grid background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 230, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 230, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          animation: 'grid-move 20s linear infinite',
        }}
      />

      <div className="relative z-10 text-center">
        {/* ListeningWaveform Logo - Always Active During Initialization */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-8 flex items-center justify-center"
        >
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 flex items-center justify-center">
            {/* Custom version for splash screen - larger and centered */}
            <SplashWaveform />
          </div>
        </motion.div>

        {/* Status Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-cyan-400 text-lg sm:text-xl font-mono tracking-wider mb-4"
        >
          {message}
        </motion.p>

        {/* Loading Indicator */}
        {isReconnecting ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 mt-4"
          >
            <motion.div
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-2 h-2 bg-cyan-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-2 mt-6"
          >
            <motion.div
              className="w-1.5 h-8 bg-cyan-400 rounded-full"
              animate={{
                height: [8, 16, 8],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0,
              }}
            />
            <motion.div
              className="w-1.5 h-8 bg-cyan-400 rounded-full"
              animate={{
                height: [12, 20, 12],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.2,
              }}
            />
            <motion.div
              className="w-1.5 h-8 bg-cyan-400 rounded-full"
              animate={{
                height: [8, 16, 8],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: 0.4,
              }}
            />
          </motion.div>
        )}

        {/* Subtle scan line */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          animate={{
            y: [0, 1000, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      </div>
    </motion.div>
  );
};

