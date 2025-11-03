/**
 * Input Area Component - Gemini-style Collapsible Design
 */

import React, { useState, KeyboardEvent, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ListeningWaveform } from './ListeningWaveform';

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 or text content
  preview?: string; // for image previews
}

interface InputAreaProps {
  onSendMessage: (message: string, files?: FileAttachment[]) => void;
  onStartListening: () => void;
  onStopListening: () => void;
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  onStopSpeaking?: () => void;
  hasMessages?: boolean; // To determine if we're on a new chat page
}

export const InputArea: React.FC<InputAreaProps> = ({
  onSendMessage,
  onStartListening,
  onStopListening,
  isListening,
  isProcessing,
  isSpeaking,
  onStopSpeaking,
  hasMessages = true,
}) => {
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<FileAttachment[]>([]);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const uploadMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(event.target as Node)) {
        setShowUploadMenu(false);
      }
    };

    if (showUploadMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUploadMenu]);

  const handleSend = () => {
    if ((inputText.trim() || attachedFiles.length > 0) && !isProcessing) {
      // User interaction detected - this should unlock speech synthesis
      // Try to "unlock" speech synthesis on send (browser autoplay policy)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        try {
          // Silent test utterance to unlock speech synthesis
          const unlockUtterance = new SpeechSynthesisUtterance('');
          unlockUtterance.volume = 0;
          window.speechSynthesis.speak(unlockUtterance);
          window.speechSynthesis.cancel();
          console.log('🔓 Speech synthesis unlocked via send button click');
        } catch (e) {
          console.warn('Could not unlock speech synthesis:', e);
        }
      }
      
      onSendMessage(inputText, attachedFiles.length > 0 ? attachedFiles : undefined);
      setInputText('');
      setAttachedFiles([]);
      setIsFocused(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'image' | 'document') => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: FileAttachment[] = [];
    let hasImages = false;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} is too large. Max size is 10MB.`);
        continue;
      }

      // Validate file type based on selection
      const isImage = file.type.startsWith('image/');
      const isPDF = file.type === 'application/pdf';
      const isText = file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md');

      if (fileType === 'image' && !isImage) {
        alert(`File ${file.name} is not an image. Please select image files only.`);
        continue;
      }

      if (fileType === 'document' && !isPDF && !isText) {
        alert(`File ${file.name} is not a supported document. Supported: PDF, TXT, MD files.`);
        continue;
      }
      
      if (isImage) hasImages = true;

      try {
        if (isImage) {
          // Read image as base64
          const base64 = await readFileAsBase64(file);
          newAttachments.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
            preview: base64,
          });
        } else if (isText) {
          // Read text file content
          const text = await readFileAsText(file);
          newAttachments.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: text,
          });
        } else if (isPDF) {
          // Read PDF as base64 (will parse later)
          const base64 = await readFileAsBase64(file);
          newAttachments.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
          });
        }
      } catch (error) {
        console.error('Error reading file:', error);
        alert(`Failed to read file ${file.name}`);
      }
    }

    setAttachedFiles([...attachedFiles, ...newAttachments]);
    
    // Show warning if images are attached and using Groq (no vision support)
    if (hasImages && newAttachments.length > 0) {
      console.warn('⚠️ Note: For best image analysis, OpenAI provider is recommended. Groq currently has limited image support.');
    }
    
    // Reset file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (documentInputRef.current) {
      documentInputRef.current.value = '';
    }
    
    // Close dropdown
    setShowUploadMenu(false);
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const removeAttachment = (index: number) => {
    setAttachedFiles(attachedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Simple click to toggle (not hold)
  const handleVoiceToggle = () => {
    if (isListening) {
      console.log('🛑 User clicked to stop recording');
      onStopListening();
    } else {
      console.log('🎤 User clicked to start recording');
      if (!isProcessing && !isSpeaking) {
        onStartListening();
      }
    }
  };

  return (
    <div className="relative bg-transparent p-2">
      {/* Siri-style Listening Waveform - positioned just above input button */}
      {/* Hide on new chat page when listening (handled by MessageList) */}
      {/* Hide when speaking (speaking waveform is displayed separately) */}
      {hasMessages && !isSpeaking && <ListeningWaveform isActive={isListening} />}
      
      {/* Listening Card (if needed for other UI) */}
      {isListening && false && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="absolute bottom-full left-0 right-0 mb-3 glass-dark p-5 sm:p-7 mx-2 sm:mx-4 z-40 border-2 border-cyan-500/50"
          style={{
            boxShadow: '0 0 30px rgba(0, 230, 255, 0.4), 0 0 60px rgba(0, 230, 255, 0.2)'
          }}
        >
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <motion.p
                className="text-primary-400 font-bold text-base sm:text-lg"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🎤 Listening...
              </motion.p>
            </div>
            
            <motion.p
              className="mt-3 text-gray-700 dark:text-gray-300 text-xs sm:text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              Speak naturally • Stops after 3s silence
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={onStopListening}
              className="mt-5 neuro-button px-8 py-3 text-sm sm:text-base text-white font-bold bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-2 border-red-500 transition-all duration-300"
            >
              ⏹️ Stop Recording
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Speaking Indicator - Use ListeningWaveform component */}
      {isSpeaking && !isListening && (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 transform -translate-x-1/2 z-40 pointer-events-none flex flex-col items-center">
          <ListeningWaveform isActive={true} />
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
            className="mt-2 flex items-center gap-2.5 pointer-events-auto"
          >
            <span className="text-xs sm:text-sm text-cyan-400/90 font-mono tracking-wider">Speaking...</span>
              <motion.button
              whileHover={{ scale: 1.1, opacity: 0.8 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                if (onStopSpeaking) {
                  onStopSpeaking();
                }
              }}
              className="text-cyan-400/60 hover:text-cyan-400 transition-colors p-1 touch-manipulation"
              style={{ minWidth: '32px', minHeight: '32px' }}
                title="Stop speaking"
              >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h12v12H6z" />
              </svg>
              </motion.button>
        </motion.div>
        </div>
      )}

      {/* File Attachments Preview */}
      <AnimatePresence>
        {attachedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex flex-wrap gap-2"
          >
            {attachedFiles.map((file, index) => (
              <motion.div
                key={index}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="relative glass-dark p-2 border border-primary-500 border-opacity-30 max-w-[150px]"
              >
                {file.preview ? (
                  // Image preview
                  <img 
                    src={file.preview} 
                    alt={file.name}
                    className="w-full h-20 object-cover mb-1"
                  />
                ) : (
                  // File icon
                  <div className="w-full h-20 flex items-center justify-center bg-gray-700 mb-1">
                    <svg className="w-10 h-10 text-primary-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                )}
                <p className="text-xs text-gray-300 truncate" title={file.name}>
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => removeAttachment(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white flex items-center justify-center transition-colors"
                  title="Remove file"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* File Upload Dropdown (Outside overflow container) */}
      <AnimatePresence>
        {showUploadMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 left-4 glass-dark border-2 border-cyan-500/50 overflow-hidden shadow-2xl"
            style={{ 
              boxShadow: '0 0 30px rgba(0, 230, 255, 0.4)',
              backdropFilter: 'blur(20px)', 
              WebkitBackdropFilter: 'blur(20px)',
              minWidth: '200px',
              zIndex: 9999,
              borderRadius: '12px'
            }}
          >
            <div
              onClick={() => {
                console.log('Image upload clicked');
                fileInputRef.current?.click();
                setShowUploadMenu(false);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-primary-500 hover:bg-opacity-20 border-b border-white border-opacity-10"
            >
              <svg className="w-5 h-5 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.5,13.5L11,16.5L14.5,12L19,18H5M21,19V5C21,3.89 20.1,3 19,3H5A2,2 0 0,0 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Upload Image</p>
                <p className="text-xs text-gray-400">JPG, PNG, GIF, WEBP</p>
              </div>
            </div>
            
            <div
              onClick={() => {
                console.log('Document upload clicked');
                documentInputRef.current?.click();
                setShowUploadMenu(false);
              }}
              className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all hover:bg-primary-500 hover:bg-opacity-20"
            >
              <svg className="w-5 h-5 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-bold text-white">Upload Document</p>
                <p className="text-xs text-gray-400">PDF, TXT, MD</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gemini-style Collapsible Input Area */}
      <motion.div 
        animate={{ 
          height: isFocused || attachedFiles.length > 0 || inputText ? 'auto' : '54px'
        }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="glass-dark relative overflow-hidden mb-2 sm:mb-4 mx-auto max-w-[95vw] sm:max-w-[90vw] md:max-w-3xl px-1 sm:px-2 md:px-4"
        style={{
          borderRadius: '22px',
          border: '1px solid rgba(0, 230, 255, 0.3)',
          boxShadow: '0 0 30px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Animated scan line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
        <div className="flex items-end gap-2 p-1.5">
          {/* File Upload Button */}
          <div className="relative flex-shrink-0" ref={uploadMenuRef}>
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileSelect(e, 'image')}
              className="hidden"
              id="image-upload"
            />
            <input
              ref={documentInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md,text/*"
              onChange={(e) => handleFileSelect(e, 'document')}
              className="hidden"
              id="document-upload"
            />
            
            {/* Plus Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                setShowUploadMenu(!showUploadMenu);
              }}
              className="w-10 h-10 flex items-center justify-center text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all jarvis-button"
              title="Upload files"
              style={{ borderRadius: '20px' }}
            >
              <motion.svg
                animate={{ rotate: showUploadMenu ? 45 : 0 }}
                transition={{ duration: 0.2 }}
                className="w-6 h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M19,13H13V19H11V13H5V11H11V5H13V11H19V13Z" />
              </motion.svg>
              {attachedFiles.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 text-white text-xs flex items-center justify-center font-bold rounded-full">
                  {attachedFiles.length}
                </span>
              )}
            </motion.button>
          </div>

          {/* Text Input - Auto-expanding */}
        <motion.textarea
            ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={attachedFiles.length > 0 ? "Add message..." : "Ask Seven..."}
          disabled={isProcessing || isListening}
            className="flex-1 px-2 sm:px-4 py-2 sm:py-2.5 bg-transparent text-xs sm:text-sm md:text-base text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500/40 rounded-xl resize-none transition-all"
            rows={isFocused || inputText ? 2 : 1}
            style={{ maxHeight: '100px', overflow: 'auto' }}
        />

          {/* Microphone Button - Glowing when listening */}
          <motion.button
            whileHover={{ scale: isListening ? 1.05 : 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVoiceToggle}
            disabled={isProcessing || isSpeaking}
            className={`relative flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-cyan-500/40 touch-manipulation ${
              isListening
                ? 'text-cyan-300'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
            style={{ 
              borderRadius: '22px',
              minWidth: '44px',
              minHeight: '44px'
            }}
            title={isListening ? 'Stop recording' : 'Start recording'}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
          >
            {/* Glowing ring when listening */}
            {isListening && (
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    '0 0 10px rgba(0, 230, 255, 0.5)',
                    '0 0 20px rgba(0, 230, 255, 0.8), 0 0 30px rgba(0, 230, 255, 0.4)',
                    '0 0 10px rgba(0, 230, 255, 0.5)',
                  ],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{
                  background: 'radial-gradient(circle, rgba(0, 230, 255, 0.2), transparent)',
                }}
              />
            )}
            
            {isListening ? (
              <motion.svg
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="relative z-10 w-5 h-5 sm:w-6 sm:h-6"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </motion.svg>
            ) : (
              <svg className="relative z-10 w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
              </svg>
            )}
          </motion.button>

          {/* Send Button - Icon only, no background */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={(!inputText.trim() && attachedFiles.length === 0) || isProcessing || isListening}
            className={`flex-shrink-0 w-11 h-11 sm:w-10 sm:h-10 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-500/30 touch-manipulation ${
              (inputText.trim() || attachedFiles.length > 0) && !isProcessing && !isListening
                ? 'text-cyan-500 hover:text-cyan-600'
                : 'text-gray-400 dark:text-gray-600'
            }`}
            style={{ borderRadius: '22px', minWidth: '44px', minHeight: '44px' }}
            title="Send message"
            aria-label="Send message"
          >
            <motion.svg
              whileHover={{ x: 2 }}
              className="w-5 h-5 sm:w-6 sm:h-6"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </motion.svg>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};
