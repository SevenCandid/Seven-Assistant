/**
 * Message List Component
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionBadge } from './EmotionIndicator';
import { FeedbackButtons } from './FeedbackButtons';
import { ThinkingAnimation } from './ThinkingAnimation';
import { ListeningWaveform } from './ListeningWaveform';
import { backendApi } from '../../core/backendApi';

interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string;
  preview?: string;
}

interface EmotionData {
  emotion: string;
  sentiment?: string;
  confidence?: number;
  description?: string;
  source?: string;
}

interface ConfidenceData {
  score: number;
  intent: string;
  is_ambiguous: boolean;
  needs_clarification: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  files?: FileAttachment[];
  emotion?: EmotionData;
  confidence?: ConfidenceData;
  is_clarifying_question?: boolean;
}

interface MessageListProps {
  messages: Message[];
  isProcessing?: boolean;
  isListening?: boolean;
}

/**
 * Format timestamp to show date and time
 */
const formatTimestamp = (timestamp: Date): string => {
  const now = new Date();
  const msgDate = new Date(timestamp);
  
  // Check if today
  const isToday = 
    msgDate.getDate() === now.getDate() &&
    msgDate.getMonth() === now.getMonth() &&
    msgDate.getFullYear() === now.getFullYear();
  
  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = 
    msgDate.getDate() === yesterday.getDate() &&
    msgDate.getMonth() === yesterday.getMonth() &&
    msgDate.getFullYear() === yesterday.getFullYear();
  
  const timeStr = msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (isToday) {
    return `Today, ${timeStr}`;
  } else if (isYesterday) {
    return `Yesterday, ${timeStr}`;
  } else {
    return msgDate.toLocaleString([], { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
};

export const MessageList: React.FC<MessageListProps> = ({ messages, isProcessing = false, isListening = false }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or when thinking
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isProcessing]);

  if (messages.length === 0) {
    // When listening starts, show only a large centered ListeningWaveform
    if (isListening) {
      return (
        <div className="flex-1 flex items-center justify-center pt-10 sm:pt-11">
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-72 lg:h-72 flex items-center justify-center relative">
            <ListeningWaveform isActive={true} />
          </div>
        </div>
      );
    }

    // Normal empty state with text and small waveform
    return (
      <div className="flex-1 flex items-end sm:items-center justify-center text-gray-400 p-4 pb-20 sm:pb-4 pt-10 sm:pt-11">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <div className="w-12 h-12 sm:w-20 sm:h-20 md:w-28 md:h-28 mx-auto mb-2 sm:mb-4 md:mb-6 flex items-center justify-center relative">
            <ListeningWaveform isActive={true} />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="jarvis-text text-xs sm:text-lg md:text-xl font-medium px-2"
          >
            INITIALIZING SEVEN AI...
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[9px] sm:text-xs md:text-sm mt-1 sm:mt-2 text-cyan-400/70 font-mono px-2"
          >
            System ready. How may I assist you today?
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-2 sm:mt-4 md:mt-6 text-[9px] sm:text-xs text-gray-600 space-y-0.5 sm:space-y-1 px-2"
          >
            <p>💬 Type a message or click the mic</p>
            <p>🎤 Say "Seven" to wake me up</p>
            <p className="hidden sm:block">🔌 I have plugins: weather, reminder, calculator</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-6 space-y-2 sm:space-y-3 md:space-y-4 pt-10 sm:pt-11">
      <AnimatePresence>
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: index * 0.05,
            }}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={`max-w-[92%] sm:max-w-[85%] md:max-w-[75%] px-2.5 py-2 sm:px-4 sm:py-2.5 md:px-5 md:py-3 rounded-lg shadow-lg relative overflow-hidden text-xs sm:text-sm md:text-base ${
                message.role === 'user'
                  ? 'glass bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-cyan-100 border border-cyan-400/30'
                  : 'glass-dark bg-gradient-to-br from-slate-800/60 to-slate-900/60 text-gray-100 border border-cyan-500/20'
              }`}
              style={{
                boxShadow: message.role === 'user' 
                  ? '0 0 20px rgba(0, 230, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
              }}
            >
              {/* Holographic shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              {/* Role indicator with emotion */}
              <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-[10px] sm:text-xs font-semibold opacity-80"
                >
                  {message.role === 'user' ? '👤 You' : '🤖 Seven'}
                </motion.span>
                {/* Show emotion indicator for user messages */}
                {message.role === 'user' && message.emotion && (
                  <EmotionBadge emotion={message.emotion} />
                )}
              </div>
              
              {/* File Attachments */}
              {message.files && message.files.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.files.map((file, fileIndex) => (
                    <motion.div
                      key={fileIndex}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * fileIndex }}
                      className={`${
                        message.role === 'user'
                          ? 'bg-white bg-opacity-20'
                          : 'bg-gray-700 bg-opacity-30'
                      } p-2 border border-white border-opacity-20`}
                    >
                      {file.preview ? (
                        // Image preview
                        <div>
                          <img
                            src={file.preview}
                            alt={file.name}
                            className="w-full max-w-xs mb-1 object-contain"
                          />
                          <p className="text-xs text-gray-300 truncate">{file.name}</p>
                        </div>
                      ) : (
                        // Document icon and name
                        <div className="flex items-center gap-2">
                          <svg className="w-6 h-6 text-primary-400 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-200 truncate font-medium">{file.name}</p>
                            <p className="text-xs text-gray-400">
                              {(file.size / 1024).toFixed(1)} KB • {file.type.split('/')[1]?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Message content */}
              {message.content && (
                <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-medium tracking-tight ${
                  message.role === 'user'
                    ? 'text-white'
                    : 'text-gray-900 dark:text-white'
                } ${message.files && message.files.length > 0 ? 'mt-2' : ''}`}>{message.content}</p>
              )}
              
              {/* Timestamp with date and time */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 0.3 }}
                className={`text-[10px] sm:text-xs mt-1 sm:mt-2 font-medium ${
                  message.role === 'user'
                    ? 'text-gray-300'
                    : 'text-gray-700 dark:text-gray-400'
                }`}
              >
                {formatTimestamp(message.timestamp)}
              </motion.p>

              {/* Feedback buttons for assistant messages */}
              {message.role === 'assistant' && (
                <FeedbackButtons
                  messageId={message.id}
                  userId={backendApi.getUserId()}
                  userMessage={messages[index - 1]?.content || ''}
                  assistantResponse={message.content}
                  onFeedbackSubmitted={(feedback) => {
                    console.log(`Feedback: ${feedback} for message ${message.id}`);
                  }}
                />
              )}
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {/* Thinking Animation - Shows when SEVEN is processing */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="flex justify-start mt-2"
        >
          <div className="glass-dark px-4 py-3 rounded-lg border border-cyan-500/20 relative overflow-hidden"
            style={{
              boxShadow: '0 0 15px rgba(0, 230, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
            }}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs sm:text-sm text-cyan-400/80 font-mono tracking-wider">
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
          </div>
        </motion.div>
      )}
      
      <div ref={messagesEndRef} />
    </div>
  );
};

