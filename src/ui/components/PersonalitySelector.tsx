/**
 * Personality Selector Component
 * Allows users to choose AI personality and tone
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backendApi } from '../../core/backendApi';

interface Personality {
  name: string;
  description: string;
  tone_description: string;
  emoji: string;
}

interface PersonalitySelectorProps {
  userId?: string;
  isDarkMode?: boolean;
  onPersonalityChange?: (personality: string) => void;
}

export const PersonalitySelector: React.FC<PersonalitySelectorProps> = ({
  userId,
  isDarkMode = true,
  onPersonalityChange
}) => {
  const [personalities, setPersonalities] = useState<Record<string, Personality>>({});
  const [selectedPersonality, setSelectedPersonality] = useState<string>('friendly');
  const [previewExamples, setPreviewExamples] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState<string | false>(false);
  const [hasError, setHasError] = useState(false);

  // Load available personalities and user preference
  useEffect(() => {
    if (hasError) return; // Don't load if we have an error
    const loadPersonalities = async () => {
      try {
        setIsLoading(true);

        // Fallback personalities (set immediately)
        const fallbackPersonalities = {
          friendly: { name: 'Friendly', description: 'Warm and approachable', tone_description: 'casual and warm', emoji: '😊' },
          professional: { name: 'Professional', description: 'Formal and precise', tone_description: 'professional', emoji: '💼' },
          humorous: { name: 'Humorous', description: 'Witty and playful', tone_description: 'witty', emoji: '😄' },
          calm: { name: 'Calm', description: 'Soothing and patient', tone_description: 'calm', emoji: '😌' },
          confident: { name: 'Confident', description: 'Assertive and direct', tone_description: 'confident', emoji: '💪' }
        };
        
        setPersonalities(fallbackPersonalities);

        // Try to fetch from backend (but don't fail if it's down)
        try {
          const response = await fetch(`${backendApi.baseUrl}/personality/available`, {
            signal: AbortSignal.timeout(3000) // 3 second timeout
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.personalities) {
              setPersonalities(data.personalities);
            }
          }
        } catch (fetchError) {
          console.warn('Backend not available, using fallback personalities:', fetchError);
        }

        // Load user's current personality preference
        if (userId) {
          try {
            const userPersResponse = await fetch(`${backendApi.baseUrl}/personality/get/${userId}`, {
              signal: AbortSignal.timeout(3000)
            });
            
            if (userPersResponse.ok) {
              const userPersData = await userPersResponse.json();
              if (userPersData.success) {
                setSelectedPersonality(userPersData.personality);
                localStorage.setItem('preferredPersonality', userPersData.personality);
              }
            }
          } catch (fetchError) {
            console.warn('Could not load user personality from backend:', fetchError);
          }
        }
        
        // Always try localStorage as fallback
        const storedPers = localStorage.getItem('preferredPersonality');
        if (storedPers && !userId) {
          setSelectedPersonality(storedPers);
        }
      } catch (error) {
        console.error('Failed to load personalities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPersonalities();
  }, [userId]);

  // Load preview for selected personality
  const loadPreview = async (personality: string) => {
    try {
      const response = await fetch(`${backendApi.baseUrl}/personality/preview/${personality}`, {
        signal: AbortSignal.timeout(3000)
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.examples) {
          setPreviewExamples(data.examples);
          return;
        }
      }
      
      // Fallback examples if backend fails
      const fallbackExamples: Record<string, string[]> = {
        friendly: [
          "Hey! I'd be happy to help you with that!",
          "That's a great question! Let me explain...",
          "No worries! We'll figure this out together."
        ],
        professional: [
          "I would be pleased to assist you with this matter.",
          "Allow me to provide you with the information you require.",
          "I shall address your inquiry with precision."
        ],
        humorous: [
          "Well, well, well... looks like someone needs help! (I'm your AI, not a genie, but close enough!)",
          "That's a fantastic question! Let me put on my thinking cap... *beep boop* 🤓",
          "Ah, the age-old question! Almost as old as 'which came first, the chicken or the egg?'"
        ],
        calm: [
          "Take a deep breath. Let's work through this together, one step at a time.",
          "No rush at all. I'm here whenever you're ready to continue.",
          "Everything's going to be just fine. Let me help you understand this."
        ],
        confident: [
          "Here's exactly what you need to do.",
          "The answer is clear: let me break it down for you.",
          "I've got this covered. Trust me on this one."
        ]
      };
      
      setPreviewExamples(fallbackExamples[personality] || []);
    } catch (error) {
      console.error('Failed to load preview:', error);
      // Use fallback examples on error
      const fallbackExamples: Record<string, string[]> = {
        friendly: ["Hey! I'd be happy to help you with that!"],
        professional: ["I would be pleased to assist you with this matter."],
        humorous: ["Well, well, well... looks like someone needs help!"],
        calm: ["Take a deep breath. Let's work through this together."],
        confident: ["Here's exactly what you need to do."]
      };
      setPreviewExamples(fallbackExamples[personality] || ["Example response"]);
    }
  };

  const handlePersonalitySelect = async (personality: string) => {
    if (personality === selectedPersonality) {
      return;
    }

    setIsSaving(true);

    try {
      // Always save to localStorage first
      localStorage.setItem('preferredPersonality', personality);

      // Try to save to backend if userId is available (but don't fail if it doesn't work)
      if (userId) {
        try {
          const response = await fetch(`${backendApi.baseUrl}/personality/set`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId,
              personality: personality
            }),
            signal: AbortSignal.timeout(3000)
          });

          if (response.ok) {
            const data = await response.json();
            if (!data.success) {
              console.warn('Backend did not confirm personality change:', data.error);
            }
          }
        } catch (backendError) {
          console.warn('Could not save to backend, but localStorage saved:', backendError);
        }
      }

      // Update state
      setSelectedPersonality(personality);

      // Notify parent component
      if (onPersonalityChange) {
        onPersonalityChange(personality);
      }

      console.log(`🎭 Personality changed to: ${personality}`);
    } catch (error) {
      console.error('Failed to set personality:', error);
      // Don't show alert, just log - localStorage save should still work
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewClick = async (personality: string) => {
    if (previewExamples.length === 0 || showPreview !== personality) {
      await loadPreview(personality);
    }
    setShowPreview(showPreview === personality ? false : personality);
  };

  if (hasError) {
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-300' : 'bg-red-100 text-red-700'}`}>
        <p className="text-sm font-semibold">⚠️ Error loading personalities</p>
        <p className="text-xs mt-1">Using default settings. Please refresh the page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className="text-sm">Loading personalities...</span>
      </div>
    );
  }

  // Wrap entire component in try-catch
  try {
    return (
    <div className="space-y-3">
      {/* Personality Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(personalities).map(([key, personality]) => {
          const isSelected = selectedPersonality === key;
          
          return (
            <motion.div
              key={key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="relative"
            >
              <button
                onClick={() => handlePersonalitySelect(key)}
                disabled={isSaving}
                className={`
                  w-full p-4 text-left transition-all
                  ${isSelected
                    ? isDarkMode
                      ? 'bg-primary-500 bg-opacity-20 border-2 border-primary-500'
                      : 'bg-primary-100 border-2 border-primary-500'
                    : isDarkMode
                      ? 'bg-gray-800 border-2 border-gray-700 hover:border-primary-500'
                      : 'bg-gray-100 border-2 border-gray-300 hover:border-primary-500'
                  }
                  ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{personality.emoji}</span>
                      <span className={`font-bold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {personality.name}
                      </span>
                    </div>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {personality.description}
                    </p>
                  </div>
                  
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-primary-500"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </button>

              {/* Preview Button */}
              <button
                onClick={() => handlePreviewClick(key)}
                className={`
                  absolute bottom-2 right-2 px-2 py-1 text-xs
                  ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}
                  hover:bg-primary-500 hover:text-white
                  transition-colors
                `}
              >
                {showPreview === key ? '👁️ Hide' : '👁️ Preview'}
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Preview Panel */}
      <AnimatePresence>
        {showPreview && previewExamples.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`
              p-4 mt-3
              ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}
              border-2
            `}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">
                {personalities[showPreview]?.emoji}
              </span>
              <span className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                {personalities[showPreview]?.name} Preview
              </span>
            </div>
            
            <div className="space-y-2">
              {previewExamples.map((example, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-3
                    ${isDarkMode ? 'bg-gray-900 bg-opacity-50' : 'bg-white'}
                  `}
                >
                  <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {example}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Helper Text */}
      <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
        💡 Click "Preview" to see example responses in each personality
      </p>
    </div>
    );
  } catch (error) {
    console.error('PersonalitySelector render error:', error);
    return (
      <div className={`p-4 ${isDarkMode ? 'bg-red-900 bg-opacity-20 text-red-300' : 'bg-red-100 text-red-700'}`}>
        <p className="text-sm font-semibold">⚠️ Personality selector error</p>
        <p className="text-xs mt-1">Please check the console for details.</p>
      </div>
    );
  }
};

