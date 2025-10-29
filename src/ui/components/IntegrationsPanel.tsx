/**
 * Integrations Panel Component
 * Manage external service connections
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface IntegrationStatus {
  google_calendar: boolean;
  gmail: boolean;
  youtube: boolean;
  x: boolean;
}

interface IntegrationsPanelProps {
  isDarkMode?: boolean;
}

export const IntegrationsPanel: React.FC<IntegrationsPanelProps> = ({ isDarkMode = true }) => {
  const [status, setStatus] = useState<IntegrationStatus>({
    google_calendar: false,
    gmail: false,
    youtube: false,
    x: false
  });
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  // Load integration status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/integrations/status');
      const data = await response.json();
      
      if (data.success || data.status) {
        setStatus(data.status || {
          google_calendar: false,
          gmail: false,
          youtube: false,
          x: false
        });
        setAvailableActions(data.available_actions || []);
      }
    } catch (error) {
      console.error('Failed to load integration status:', error);
      setStatusMessage('⚠️ Backend offline - integrations unavailable');
    } finally {
      setIsLoading(false);
    }
  };

  const integrations = [
    {
      id: 'google_calendar',
      name: 'Google Calendar',
      icon: '📅',
      description: 'Manage events and meetings',
      setupUrl: 'https://console.cloud.google.com/',
      enabled: status.google_calendar
    },
    {
      id: 'gmail',
      name: 'Gmail',
      icon: '📧',
      description: 'Send and read emails',
      setupUrl: 'https://console.cloud.google.com/',
      enabled: status.gmail
    },
    {
      id: 'youtube',
      name: 'YouTube',
      icon: '🎥',
      description: 'Search videos and content',
      setupUrl: 'https://console.cloud.google.com/',
      enabled: status.youtube
    },
    {
      id: 'x',
      name: 'X (Twitter)',
      icon: '✖️',
      description: 'Post tweets and read timeline',
      setupUrl: 'https://developer.twitter.com/',
      enabled: status.x
    }
  ];

  if (isLoading) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        <h3 className="text-lg font-bold mb-2">🔌 Integrations</h3>
        <p className="text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            🔌 Integrations
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Connect external services
          </p>
        </div>
        <button
          onClick={() => loadStatus()}
          className={`px-3 py-1 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-2 text-sm ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}
        >
          {statusMessage}
        </motion.div>
      )}

      {/* Setup Instructions */}
      <div className={`p-3 ${isDarkMode ? 'bg-blue-900 bg-opacity-20 border-blue-700' : 'bg-blue-100 border-blue-300'} border text-xs`}>
        <p className="font-semibold mb-2">📖 Setup Required</p>
        <ol className="space-y-1 list-decimal list-inside">
          <li>Get API keys from service providers</li>
          <li>Add keys to <code className={`px-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>seven-ai-backend/.env</code></li>
          <li>Restart backend</li>
          <li>Integrations will activate automatically</li>
        </ol>
        <p className="mt-2">
          See <code className={`px-1 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>ENV_SETUP_GUIDE.md</code> for detailed instructions
        </p>
      </div>

      {/* Integration Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {integrations.map((integration) => (
          <motion.div
            key={integration.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 border ${
              integration.enabled
                ? isDarkMode
                  ? 'bg-green-900 bg-opacity-20 border-green-700'
                  : 'bg-green-100 border-green-300'
                : isDarkMode
                ? 'bg-gray-800 border-gray-700'
                : 'bg-white border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{integration.icon}</span>
                <div>
                  <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {integration.name}
                  </h4>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {integration.description}
                  </p>
                </div>
              </div>
              <div className={`px-2 py-1 text-xs font-semibold ${
                integration.enabled
                  ? 'bg-green-500 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {integration.enabled ? '✓ Active' : '○ Inactive'}
              </div>
            </div>

            {!integration.enabled && (
              <a
                href={integration.setupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`block mt-2 px-3 py-1 text-xs text-center ${
                  isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
              >
                Get API Key →
              </a>
            )}
          </motion.div>
        ))}
      </div>

      {/* Available Actions */}
      {availableActions.length > 0 && (
        <div className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border`}>
          <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            🎯 Available Actions
          </h4>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => (
              <span
                key={action}
                className={`px-2 py-1 text-xs ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {action.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border text-xs`}>
        <h4 className={`font-semibold mb-2 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
          💡 How to Use
        </h4>
        <ul className={`space-y-1 list-disc list-inside ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          <li>Ask Seven: "Show my calendar events"</li>
          <li>Ask Seven: "Send an email to..."</li>
          <li>Ask Seven: "Search YouTube for..."</li>
          <li>Ask Seven: "Post a tweet saying..."</li>
        </ul>
      </div>
    </div>
  );
};





