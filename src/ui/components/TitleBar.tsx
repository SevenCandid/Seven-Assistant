/**
 * Title Bar Component for Electron Frameless Window
 * Provides close, minimize, maximize buttons and sidebar toggle
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { backendApi } from '../../core/backendApi';

interface TitleBarProps {
  title?: string;
  className?: string;
  onShowSidebar?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  title = 'SEVEN',
  className = '',
  onShowSidebar,
}) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');

  useEffect(() => {
    // Check if running in Electron
    if (window.electron) {
      setIsElectron(true);

      // Check initial maximized state
      window.electron
        .isMaximized()
        .then((maximized) => {
          setIsMaximized(maximized);
        })
        .catch((error) => {
          console.error('Error checking maximized state:', error);
        });

      // Listen for maximize/unmaximize events
      window.electron.onWindowMaximized(() => {
        setIsMaximized(true);
      });
      window.electron.onWindowUnmaximized(() => {
        setIsMaximized(false);
      });
    }

    // Check backend status
    const checkBackendStatus = async () => {
      try {
        const isHealthy = await backendApi.checkHealth();
        setBackendStatus(isHealthy ? 'online' : 'offline');
      } catch (error) {
        setBackendStatus('offline');
      }
    };

    // Initial check
    checkBackendStatus();

    // Check every 5 seconds
    const statusInterval = setInterval(checkBackendStatus, 5000);

    return () => clearInterval(statusInterval);
  }, []);

  const handleMinimize = () => {
    if (window.electron) {
      window.electron.minimizeWindow();
    }
  };

  const handleMaximize = () => {
    if (window.electron) {
      window.electron.maximizeWindow();
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.closeWindow();
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 flex items-center justify-between h-8 sm:h-9 bg-gray-900/90 backdrop-blur-sm border-b border-cyan-500/20 z-50 ${className}`}
      style={{
        userSelect: 'none',
        WebkitAppRegion: isElectron ? 'drag' : undefined, // Make entire title bar draggable in Electron
      }}
    >
      {/* Left side - Sidebar Toggle */}
      {onShowSidebar && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onShowSidebar) {
              onShowSidebar();
            }
          }}
          className="flex items-center justify-center text-cyan-400 hover:text-cyan-300 transition-colors px-2 sm:px-4 h-full"
          style={{
            WebkitAppRegion: 'no-drag',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          title="Toggle sidebar"
          aria-label="Toggle sidebar"
          type="button"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
          </svg>
        </button>
      )}

      {/* Right side - Backend Status + Window Controls */}
      <div
        className="flex items-center gap-2 flex-shrink-0"
        style={{
          WebkitAppRegion: 'no-drag',
          pointerEvents: 'auto',
        }}
      >
        {/* Backend Status Indicator */}
        <div
          className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4"
          style={{
            WebkitAppRegion: 'no-drag',
            pointerEvents: 'auto',
          }}
        >
          <div
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors flex-shrink-0 ${
              backendStatus === 'online'
                ? 'bg-green-500 shadow-lg shadow-green-500/50'
                : backendStatus === 'offline'
                ? 'bg-red-500 shadow-lg shadow-red-500/50'
                : 'bg-yellow-500 shadow-lg shadow-yellow-500/50'
            } ${backendStatus === 'checking' ? 'animate-pulse' : ''}`}
          />
          <span
            className={`text-[9px] sm:text-xs font-mono truncate ${
              backendStatus === 'online'
                ? 'text-green-400'
                : backendStatus === 'offline'
                ? 'text-red-400'
                : 'text-yellow-400'
            }`}
          >
            <span className="hidden xs:inline">
              {backendStatus === 'online'
                ? 'ONLINE'
                : backendStatus === 'offline'
                ? 'OFFLINE'
                : 'CHECKING'}
            </span>
          </span>
        </div>

        {/* Window Controls (Electron only) */}
        {isElectron && (
          <div
            className="flex items-center flex-shrink-0"
            style={{
              WebkitAppRegion: 'no-drag',
              pointerEvents: 'auto',
            }}
          >
            {/* Minimize Button */}
            <button
              onClick={handleMinimize}
              className="w-9 h-8 sm:w-12 sm:h-8 flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
              style={{
                WebkitAppRegion: 'no-drag',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              title="Minimize"
              aria-label="Minimize"
              type="button"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>

            {/* Maximize/Restore Button */}
            <button
              onClick={handleMaximize}
              className="w-9 h-8 sm:w-12 sm:h-8 flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-400/10 transition-colors"
              style={{
                WebkitAppRegion: 'no-drag',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              title={isMaximized ? 'Restore' : 'Maximize'}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
              type="button"
            >
              {isMaximized ? (
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M4 8h4V4M16 4v4h4M20 16v-4h-4M8 20H4v-4" />
                </svg>
              ) : (
                <svg
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M4 4h16v16H4z" />
                </svg>
              )}
            </button>

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="w-9 h-8 sm:w-12 sm:h-8 flex items-center justify-center text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-colors"
              style={{
                WebkitAppRegion: 'no-drag',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
              title="Close"
              aria-label="Close"
              type="button"
            >
              <svg
                className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Middle - SEVEN Logo Centered */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center pointer-events-none"
        style={{
          zIndex: 1,
          height: '100%',
          top: 0,
        }}
      >
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="flex items-center justify-center cursor-pointer"
          style={{
            pointerEvents: 'auto',
            WebkitAppRegion: isElectron ? 'drag' : undefined,
          }}
        >
          <img
            src="/seven_logo.png"
            alt="SEVEN"
            className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
            style={{
              pointerEvents: 'auto',
            }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              if (target.parentElement) {
                target.parentElement.innerHTML =
                  '<span class="relative z-10 jarvis-text text-xl sm:text-2xl font-bold text-white">7</span>';
              }
            }}
          />
        </motion.div>
      </div>
    </div>
  );
};

