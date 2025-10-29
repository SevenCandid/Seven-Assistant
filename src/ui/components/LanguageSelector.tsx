/**
 * Language Selector Component
 * Allows users to select their preferred language
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backendApi } from '../../core/backendApi';

interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

interface LanguageSelectorProps {
  userId?: string;
  isDarkMode?: boolean;
  onLanguageChange?: (language: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  userId,
  isDarkMode = true,
  onLanguageChange
}) => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load supported languages and user preference
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setIsLoading(true);

        // Fetch supported languages
        const response = await fetch(`${backendApi.baseUrl}/language/supported`);
        const data = await response.json();

        if (data.success && data.languages) {
          // Convert to array format
          const langArray: Language[] = data.primary_languages.map((code: string) => ({
            code,
            name: data.languages[code].name,
            native: data.languages[code].native,
            flag: data.languages[code].flag
          }));

          setLanguages(langArray);
        }

        // Load user's current language preference
        if (userId) {
          const userLangResponse = await fetch(`${backendApi.baseUrl}/language/get/${userId}`);
          const userLangData = await userLangResponse.json();
          
          if (userLangData.success) {
            setSelectedLanguage(userLangData.language);
            // Store in localStorage as backup
            localStorage.setItem('preferredLanguage', userLangData.language);
          }
        } else {
          // Load from localStorage if no userId
          const storedLang = localStorage.getItem('preferredLanguage');
          if (storedLang) {
            setSelectedLanguage(storedLang);
          }
        }
      } catch (error) {
        console.error('Failed to load languages:', error);
        // Fallback to basic languages
        setLanguages([
          { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
          { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
          { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
          { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
          { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
          { code: 'zh-cn', name: 'Chinese', native: '简体中文', flag: '🇨🇳' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguages();
  }, [userId]);

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === selectedLanguage) {
      setIsOpen(false);
      return;
    }

    setIsSaving(true);

    try {
      // Save to backend if userId is available
      if (userId) {
        const response = await fetch(`${backendApi.baseUrl}/language/set`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: userId,
            language: languageCode
          })
        });

        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to set language');
        }
      }

      // Always save to localStorage
      localStorage.setItem('preferredLanguage', languageCode);

      // Update state
      setSelectedLanguage(languageCode);
      setIsOpen(false);

      // Notify parent component
      if (onLanguageChange) {
        onLanguageChange(languageCode);
      }

      console.log(`🌐 Language changed to: ${languageCode}`);
    } catch (error) {
      console.error('Failed to set language:', error);
      alert('Failed to change language. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        <span className="text-sm">Loading languages...</span>
      </div>
    );
  }

  // Safety check: if no languages loaded, show error
  if (languages.length === 0) {
    return (
      <div className={`p-3 text-sm ${isDarkMode ? 'text-gray-400 bg-gray-800' : 'text-gray-600 bg-gray-100'}`}>
        ⚠️ Languages unavailable (backend offline)
      </div>
    );
  }

  const selectedLang = languages.find(l => l.code === selectedLanguage) || languages[0];

  return (
    <div className="relative">
      {/* Current Language Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSaving}
        className={`
          flex items-center gap-2 px-4 py-2
          neuro-button
          ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}
          ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className="text-xl">{selectedLang.flag}</span>
        <span className="text-sm font-medium">{selectedLang.native}</span>
        <motion.svg
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </motion.button>

      {/* Language Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40"
            />

            {/* Dropdown Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`
                absolute top-full mt-2 left-0 z-50
                min-w-[200px] max-h-[400px] overflow-y-auto
                glass
                ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                border-2
                shadow-xl
              `}
            >
              <div className="p-2 space-y-1">
                {languages.map((lang, index) => (
                  <motion.button
                    key={lang.code}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleLanguageSelect(lang.code)}
                    disabled={isSaving}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2
                      text-left transition-colors
                      ${isDarkMode 
                        ? 'hover:bg-white hover:bg-opacity-10' 
                        : 'hover:bg-gray-200'
                      }
                      ${lang.code === selectedLanguage
                        ? isDarkMode
                          ? 'bg-primary-500 bg-opacity-20'
                          : 'bg-primary-100'
                        : ''
                      }
                      ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-2xl">{lang.flag}</span>
                    <div className="flex-1">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        {lang.native}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {lang.name}
                      </div>
                    </div>
                    {lang.code === selectedLanguage && (
                      <motion.svg
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-5 h-5 text-primary-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </motion.button>
                ))}
              </div>

              {/* Footer */}
              <div className={`
                border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}
                p-2
              `}>
                <p className={`text-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-600'}`}>
                  Messages will be translated automatically
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

