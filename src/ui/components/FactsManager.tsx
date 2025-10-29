/**
 * Facts Manager - View and manage user facts that Seven remembers
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getMemoryStore, UserFact } from '../../memory/memoryStore';

interface FactsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const FactsManager: React.FC<FactsManagerProps> = ({ isOpen, onClose, isDarkMode }) => {
  const [facts, setFacts] = useState<UserFact[]>([]);
  const [newFact, setNewFact] = useState('');
  const [category, setCategory] = useState<'personal' | 'preference' | 'context' | 'other'>('other');
  const [isLoading, setIsLoading] = useState(false);

  const memoryStore = getMemoryStore();

  // Load facts when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFacts();
    }
  }, [isOpen]);

  const loadFacts = async () => {
    setIsLoading(true);
    try {
      const allFacts = await memoryStore.getAllFacts();
      setFacts(allFacts);
    } catch (error) {
      console.error('Failed to load facts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddFact = async () => {
    if (!newFact.trim()) return;

    try {
      await memoryStore.saveFact(newFact.trim(), category);
      setNewFact('');
      setCategory('other');
      await loadFacts();
    } catch (error) {
      console.error('Failed to add fact:', error);
    }
  };

  const handleDeleteFact = async (factId: string) => {
    try {
      await memoryStore.deleteFact(factId);
      await loadFacts();
    } catch (error) {
      console.error('Failed to delete fact:', error);
    }
  };

  const handleClearAllFacts = async () => {
    if (!confirm('Are you sure you want to clear all facts? This cannot be undone.')) {
      return;
    }

    try {
      await memoryStore.clearFacts();
      await loadFacts();
    } catch (error) {
      console.error('Failed to clear facts:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className={`glass ${isDarkMode ? 'glass-dark' : ''} max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col border-2 border-primary-500 border-opacity-30`}
        >
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                  💡 Memory Facts
                </h2>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                  What Seven remembers about you
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
                </svg>
              </motion.button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
            {/* Add New Fact */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Add New Fact
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newFact}
                  onChange={(e) => setNewFact(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddFact()}
                  placeholder="e.g., User's name is Frank"
                  className={`flex-1 px-3 py-2 glass border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500`}
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className={`px-3 py-2 glass border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500`}
                >
                  <option value="personal">Personal</option>
                  <option value="preference">Preference</option>
                  <option value="context">Context</option>
                  <option value="other">Other</option>
                </select>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddFact}
                  className="neuro-button px-4 py-2 bg-primary-500 text-white font-medium text-sm"
                >
                  Add
                </motion.button>
              </div>
            </div>

            {/* Facts List */}
            {isLoading ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Loading facts...
              </div>
            ) : facts.length === 0 ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                <p className="text-4xl mb-2">🤔</p>
                <p>No facts recorded yet.</p>
                <p className="text-xs mt-2">Facts will be automatically learned from conversations.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {facts
                  .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                  .map((fact) => (
                    <motion.div
                      key={fact.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-start gap-3 p-3 glass border border-gray-300 dark:border-gray-700 hover:border-primary-500 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white break-words">
                          {fact.fact}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-600 dark:text-gray-400">
                          <span className="px-2 py-0.5 bg-primary-500 bg-opacity-20 text-primary-600 dark:text-primary-400">
                            {fact.category || 'other'}
                          </span>
                          {fact.confidence && (
                            <span>
                              {Math.round(fact.confidence * 100)}% confident
                            </span>
                          )}
                          <span>•</span>
                          <span>{new Date(fact.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDeleteFact(fact.id)}
                        className="text-red-500 hover:text-red-600 p-1"
                        title="Delete fact"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" />
                        </svg>
                      </motion.button>
                    </motion.div>
                  ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 sm:p-6 border-t border-gray-300 dark:border-gray-700 flex justify-between items-center">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {facts.length} fact{facts.length !== 1 ? 's' : ''} stored
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearAllFacts}
              disabled={facts.length === 0}
              className={`neuro-button px-4 py-2 text-red-500 font-medium text-sm ${
                facts.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Clear All
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};








