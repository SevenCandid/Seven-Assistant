/**
 * Message List Component
 */

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EmotionBadge } from './EmotionIndicator';
import { FeedbackButtons } from './FeedbackButtons';
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

export const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              rotate: [0, 5, -5, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-3xl sm:text-4xl font-bold text-white glow-pulse"
          >
            7
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl font-medium text-gray-300"
          >
            Hey there! I'm Seven
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-xs sm:text-sm mt-2 text-gray-500"
          >
            Your intelligent AI assistant. Ask me anything!
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4 sm:mt-6 text-xs text-gray-600 space-y-1"
          >
            <p>💬 Type a message or click the mic</p>
            <p>🎤 Say "Seven" to wake me up</p>
            <p>🔌 I have plugins: weather, reminder, calculator</p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4">
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
              className={`max-w-[85%] sm:max-w-[75%] px-3 py-2 sm:px-5 sm:py-3 ${
                message.role === 'user'
                  ? 'message-user text-white'
                  : 'message-assistant text-gray-200'
              }`}
            >
              {/* Role indicator with emotion */}
              <div className="flex items-center gap-2 mb-1 sm:mb-2">
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-xs font-semibold opacity-80"
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
                <p className={`text-xs sm:text-sm whitespace-pre-wrap leading-relaxed font-medium ${
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
                className={`text-xs mt-1 sm:mt-2 font-medium ${
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
      <div ref={messagesEndRef} />
    </div>
  );
};

