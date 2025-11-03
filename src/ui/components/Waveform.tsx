/**
 * Waveform Visualization Component
 */

import React from 'react';

interface WaveformProps {
  isActive: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive }) => {
  if (!isActive) return null;

  return (
    <div className="waveform">
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
      <div className="wave-bar"></div>
    </div>
  );
};















