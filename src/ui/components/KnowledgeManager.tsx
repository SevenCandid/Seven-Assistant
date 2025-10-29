/**
 * Knowledge Manager Component
 * Manage RAG knowledge base with file uploads
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { backendApi } from '../../core/backendApi';

interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  source: string;
  created_at: string;
  metadata?: Record<string, any>;
}

interface KnowledgeStats {
  total_entries: number;
  index_size: number;
  available: boolean;
}

interface KnowledgeManagerProps {
  isDarkMode?: boolean;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({ isDarkMode = true }) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [stats, setStats] = useState<KnowledgeStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const [textTitle, setTextTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'view'>('view');
  const [statusMessage, setStatusMessage] = useState('');

  // Load knowledge base data
  useEffect(() => {
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    setIsLoading(true);
    try {
      // Get stats
      const statsResponse = await fetch(`${backendApi.baseUrl}/knowledge/stats`);
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData);
      }

      // Get all entries
      const entriesResponse = await fetch(`${backendApi.baseUrl}/knowledge/all`);
      const entriesData = await entriesResponse.json();
      if (entriesData.success) {
        setEntries(entriesData.entries || []);
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
      setStatusMessage('⚠️ Knowledge base unavailable (install FAISS)');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setStatusMessage('⏳ Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      if (uploadTitle) {
        formData.append('title', uploadTitle);
      }

      const response = await fetch(`${backendApi.baseUrl}/knowledge/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage('✅ File uploaded successfully!');
        setSelectedFile(null);
        setUploadTitle('');
        await loadKnowledgeBase();
      } else {
        setStatusMessage(`❌ ${data.error || 'Upload failed'}`);
      }
    } catch (error) {
      setStatusMessage('❌ Upload failed. Check backend logs.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleTextSubmit = async () => {
    if (!textContent.trim()) return;

    setIsLoading(true);
    setStatusMessage('⏳ Adding knowledge...');

    try {
      const response = await fetch(`${backendApi.baseUrl}/knowledge/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: textContent,
          title: textTitle || undefined,
          source: 'manual',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage('✅ Knowledge added successfully!');
        setTextContent('');
        setTextTitle('');
        await loadKnowledgeBase();
      } else {
        setStatusMessage(`❌ ${data.error || 'Failed to add knowledge'}`);
      }
    } catch (error) {
      setStatusMessage('❌ Failed to add knowledge');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(''), 5000);
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Delete this knowledge entry?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${backendApi.baseUrl}/knowledge/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId }),
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage('✅ Entry deleted');
        await loadKnowledgeBase();
      } else {
        setStatusMessage('❌ Failed to delete');
      }
    } catch (error) {
      setStatusMessage('❌ Delete failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear ALL knowledge entries? This cannot be undone.')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${backendApi.baseUrl}/knowledge/clear`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setStatusMessage(`✅ Cleared ${data.count} entries`);
        await loadKnowledgeBase();
      }
    } catch (error) {
      setStatusMessage('❌ Clear failed');
    } finally {
      setIsLoading(false);
      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  if (!stats?.available) {
    return (
      <div className={`p-6 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
        <h3 className="text-lg font-bold mb-2">📚 Knowledge Base</h3>
        <p className="text-sm">Knowledge base unavailable. Install FAISS and sentence-transformers:</p>
        <code className="text-xs mt-2 block p-2 bg-gray-900 text-green-400">
          pip install faiss-cpu sentence-transformers PyPDF2
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
            📚 Knowledge Base
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {stats?.total_entries || 0} entries • RAG-powered
          </p>
        </div>
        <button
          onClick={() => loadKnowledgeBase()}
          className={`px-3 py-1 text-xs ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
          disabled={isLoading}
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

      {/* Tabs */}
      <div className="flex gap-2">
        {['view', 'upload', 'text'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-primary-500 text-white'
                : isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {tab === 'view' && '📖 View'}
            {tab === 'upload' && '📤 Upload'}
            {tab === 'text' && '✍️ Add Text'}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'view' && (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            {entries.length === 0 ? (
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No knowledge entries yet. Upload files or add text to teach Seven!
              </p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {entries.length} entries found
                  </p>
                  <button
                    onClick={handleClearAll}
                    className="text-xs text-red-500 hover:text-red-400"
                    disabled={isLoading}
                  >
                    🗑️ Clear All
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {entries.map((entry) => (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                          {entry.title}
                        </h4>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="text-red-500 hover:text-red-400 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                        {entry.content}
                      </p>
                      <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        Source: {entry.source} • {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}

        {activeTab === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Upload PDF, TXT, or MD files to add to knowledge base
            </p>
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className={`w-full text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
            />
            <input
              type="text"
              placeholder="Optional: Custom title"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              className={`w-full px-3 py-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-800 text-gray-200 border-gray-700'
                  : 'bg-white text-gray-800 border-gray-300'
              } border`}
            />
            <button
              onClick={handleFileUpload}
              disabled={!selectedFile || isLoading}
              className={`w-full py-2 px-4 text-sm font-medium ${
                selectedFile && !isLoading
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? '⏳ Uploading...' : '📤 Upload File'}
            </button>
          </motion.div>
        )}

        {activeTab === 'text' && (
          <motion.div
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-3"
          >
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Add knowledge manually by typing or pasting text
            </p>
            <input
              type="text"
              placeholder="Title (optional)"
              value={textTitle}
              onChange={(e) => setTextTitle(e.target.value)}
              className={`w-full px-3 py-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-800 text-gray-200 border-gray-700'
                  : 'bg-white text-gray-800 border-gray-300'
              } border`}
            />
            <textarea
              placeholder="Enter knowledge content here..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={6}
              className={`w-full px-3 py-2 text-sm ${
                isDarkMode
                  ? 'bg-gray-800 text-gray-200 border-gray-700'
                  : 'bg-white text-gray-800 border-gray-300'
              } border resize-none`}
            />
            <button
              onClick={handleTextSubmit}
              disabled={!textContent.trim() || isLoading}
              className={`w-full py-2 px-4 text-sm font-medium ${
                textContent.trim() && !isLoading
                  ? 'bg-primary-500 hover:bg-primary-600 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isLoading ? '⏳ Adding...' : '✍️ Add Knowledge'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};





