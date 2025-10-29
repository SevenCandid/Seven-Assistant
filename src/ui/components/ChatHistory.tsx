/**
 * Chat History Component - Display and manage past conversations
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMemoryStore, ChatSession, StoredMessage } from '../../memory/memoryStore';

const memoryStore = getMemoryStore();

interface ChatHistoryProps {
  onClose: () => void;
  onLoadSession: (sessionId: string, messages: StoredMessage[]) => void;
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({ onClose, onLoadSession }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<StoredMessage[]>([]);
  const [viewingMessages, setViewingMessages] = useState(false);

  // Load all sessions on mount
  useEffect(() => {
    const loadSessions = async () => {
      try {
        const allSessions = await memoryStore.getAllSessions();
        setSessions(allSessions);
        console.log('📚 Loaded', allSessions.length, 'chat sessions');
      } catch (error) {
        console.error('Failed to load sessions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Load messages for a specific session
  const handleViewSession = async (sessionId: string) => {
    try {
      const messages = await memoryStore.getSessionMessages(sessionId);
      setSessionMessages(messages);
      setSelectedSession(sessionId);
      setViewingMessages(true);
      console.log('📖 Viewing session:', sessionId, 'with', messages.length, 'messages');
    } catch (error) {
      console.error('Failed to load session messages:', error);
    }
  };

  // Load a session into the main chat
  const handleLoadSessionClick = async (sessionId: string) => {
    try {
      console.log('🔄 Loading session from history:', sessionId);
      // Call the parent handler which will load the session
      onLoadSession(sessionId, []);
      // Close the modal
      onClose();
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  // Delete a session
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this conversation? This cannot be undone.')) {
      return;
    }

    try {
      await memoryStore.deleteSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
      console.log('🗑️ Deleted session:', sessionId);
      
      // If currently viewing this session, go back
      if (selectedSession === sessionId) {
        setViewingMessages(false);
        setSelectedSession(null);
        setSessionMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  // Format date/time for display
  const formatDate = (date: Date): string => {
    const d = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sessionDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (sessionDate.getTime() === today.getTime()) {
      return `Today, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (sessionDate.getTime() === today.getTime() - 86400000) {
      return `Yesterday, ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return d.toLocaleString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
  };

  // Get session title
  const getSessionTitle = (session: ChatSession): string => {
    return session.title || 'New Conversation';
  };

  if (viewingMessages && selectedSession) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[80vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b-2 border-primary-500 border-opacity-30">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  📖 Conversation Details
                </h2>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  {sessionMessages.length} messages
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleLoadSession(selectedSession, sessionMessages)}
                  className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm transition-colors"
                  title="Load this conversation"
                >
                  📂 Load
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewingMessages(false)}
                  className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
                  title="Back to list"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {sessionMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 ${
                  msg.role === 'user'
                    ? 'bg-primary-500 text-white ml-8'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white mr-8'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm flex-1 whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                  <span className="text-xs opacity-70 whitespace-nowrap">
                    {new Date(msg.timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl bg-white dark:bg-gray-900 shadow-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-primary-500 border-opacity-30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                💬 Chat History
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {sessions.length} conversations saved
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              title="Close"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="flex gap-1 justify-center mb-4">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <p className="text-gray-400 text-sm">Loading history...</p>
              </div>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-6xl mb-4">💭</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  No Conversations Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Start chatting to build your conversation history
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  whileHover={{ scale: 1.01 }}
                  className="bg-gray-50 dark:bg-gray-800 p-4 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 dark:text-white truncate">
                        {getSessionTitle(session)}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                        <span>📅 {formatDate(session.lastMessageAt)}</span>
                        <span>💬 {session.messageCount} message{session.messageCount !== 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🖱️ Clicked to load session:', session.id);
                          handleLoadSessionClick(session.id);
                        }}
                        className="p-2 bg-primary-500 hover:bg-primary-600 text-white transition-colors"
                        title="Open conversation"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19M8,9H16V19H8V9M13.5,10L10,13.5L11.5,15L15,11.5L13.5,10Z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewSession(session.id);
                        }}
                        className="p-2 bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                        title="View details"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17M12,4.5C7,4.5 2.73,7.61 1,12C2.73,16.39 7,19.5 12,19.5C17,19.5 21.27,16.39 23,12C21.27,7.61 17,4.5 12,4.5Z" />
                        </svg>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="p-2 bg-red-500 hover:bg-red-600 text-white transition-colors"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

