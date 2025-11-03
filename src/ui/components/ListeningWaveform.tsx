/**
 * Listening Waveform Component - Siri-style circular fluid wave visualization
 */

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ListeningWaveformProps {
  isActive: boolean;
}

export const ListeningWaveform: React.FC<ListeningWaveformProps> = ({ isActive }) => {
  const [waveData, setWaveData] = useState<number[]>([]);
  const [rotation, setRotation] = useState(0);

  // Generate wave points for circular visualization
  const wavePoints = 64;

  useEffect(() => {
    if (!isActive) {
      setWaveData([]);
      setRotation(0);
      return;
    }

    // Initialize wave data (amplitude values for each point around the circle)
    const initialWave = Array.from({ length: wavePoints }, () => Math.random() * 0.3 + 0.2);
    setWaveData(initialWave);

    // Animate wave continuously - create fluid frequency-like waves
    let animationFrame: number;
    let lastUpdate = Date.now();

    const updateWave = () => {
      const now = Date.now();
      lastUpdate = now;

      // Rotate the waveform (creates spinning effect)
      setRotation(prev => (prev + 0.5) % 360);

      // Update wave amplitudes to create fluid, frequency-like patterns
      const time = Date.now() / 1000;
      setWaveData(prev => {
        return prev.map((_, index) => {
          // Create multiple sine waves with different frequencies for fluid Siri-like effect
          const angle = (index / wavePoints) * Math.PI * 2;
          
          // Primary frequency wave
          const wave1 = Math.sin(angle * 2 + time * 2.5) * 0.2;
          // Secondary frequency wave
          const wave2 = Math.sin(angle * 4 + time * 3.5) * 0.15;
          // Tertiary frequency wave for complexity
          const wave3 = Math.sin(angle * 6 + time * 2) * 0.1;
          // Base amplitude
          const base = 0.35;
          
          // Combine waves for fluid frequency visualization (like audio frequency spectrum)
          const amplitude = Math.max(0.2, Math.min(0.9, base + wave1 + wave2 + wave3));
          
          // Add subtle randomness for organic feel
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
  }, [isActive]);

  if (!isActive) return null;

  // Calculate SVG path for circular wave
  const radius = 40;
  const centerX = 50;
  const centerY = 50;

  const generateWavePath = () => {
    if (waveData.length === 0) return '';

    const points: string[] = [];
    
    waveData.forEach((amplitude, index) => {
      const angle = (index / wavePoints) * Math.PI * 2;
      // Scale amplitude for more visible wave effect
      const distance = radius + (amplitude * radius * 0.6);
      const x = centerX + Math.cos(angle) * distance;
      const y = centerY + Math.sin(angle) * distance;
      
      if (index === 0) {
        points.push(`M ${x} ${y}`);
      } else if (index === 1) {
        points.push(`L ${x} ${y}`);
      } else {
        // Use smooth curves for fluid effect
        const prevAngle = ((index - 1) / wavePoints) * Math.PI * 2;
        const prevAmplitude = waveData[index - 1];
        const prevDistance = radius + (prevAmplitude * radius * 0.6);
        const prevX = centerX + Math.cos(prevAngle) * prevDistance;
        const prevY = centerY + Math.sin(prevAngle) * prevDistance;
        
        // Smooth curve using quadratic bezier
        const controlX = (prevX + x) / 2;
        const controlY = (prevY + y) / 2;
        points.push(`Q ${controlX} ${controlY} ${x} ${y}`);
      }
    });
    
    points.push('Z'); // Close the path
    return points.join(' ');
  };

  return (
    <div className="absolute bottom-12 sm:bottom-14 md:bottom-16 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
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
        className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
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
          {/* Outer glow ring */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius * 1.15}
            fill="none"
            stroke="rgba(0, 230, 255, 0.3)"
            strokeWidth="0.5"
            opacity={0.5}
          />
          
          {/* Main wave path */}
          <motion.path
            d={generateWavePath()}
            fill="url(#waveGradient)"
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
          
          {/* Center circle */}
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
          
          {/* Small "7" text in center */}
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
          
          {/* Gradient definition */}
          <defs>
            <radialGradient id="waveGradient" cx="50%" cy="50%">
              <stop offset="0%" stopColor="rgba(0, 230, 255, 1)" />
              <stop offset="50%" stopColor="rgba(59, 130, 246, 0.8)" />
              <stop offset="100%" stopColor="rgba(0, 230, 255, 0.6)" />
            </radialGradient>
          </defs>
        </svg>
        
        {/* Pulsing outer rings for depth */}
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
      </motion.div>
      
      {/* CSS for pulsing rings */}
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
    </div>
  );
};
