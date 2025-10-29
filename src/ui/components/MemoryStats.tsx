/**
 * Memory Stats Component - Shows memory storage statistics
 */

import React, { useState, useEffect } from 'react';
import { getMemoryStore } from '../../memory/memoryStore';

interface MemoryStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemoryStats: React.FC<MemoryStatsProps> = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState({
    totalMessages: 0,
    userMessages: 0,
    assistantMessages: 0,
    storageType: 'Loading...',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const memoryStore = getMemoryStore();
      const allMessages = await memoryStore.getAllMessages();
      
      const userCount = allMessages.filter(m => m.role === 'user').length;
      const assistantCount = allMessages.filter(m => m.role === 'assistant').length;
      
      // Check storage type
      const hasIndexedDB = !!window.indexedDB;
      
      setStats({
        totalMessages: allMessages.length,
        userMessages: userCount,
        assistantMessages: assistantCount,
        storageType: hasIndexedDB ? 'IndexedDB (Fast)' : 'localStorage (Fallback)',
      });
    } catch (error) {
      console.error('Failed to load memory stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const memoryStore = getMemoryStore();
      const json = await memoryStore.exportMessages();
      
      // Download as JSON file
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `seven-memory-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log('✅ Exported conversation history');
    } catch (error) {
      console.error('Failed to export:', error);
    }
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      
      try {
        const text = await file.text();
        const memoryStore = getMemoryStore();
        const count = await memoryStore.importMessages(text);
        
        alert(`✅ Imported ${count} messages!`);
        loadStats(); // Refresh stats
      } catch (error) {
        console.error('Failed to import:', error);
        alert('❌ Failed to import. Please check the file format.');
      }
    };
    
    input.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
      <div className="settings-panel max-w-md w-full p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-200">💾 Memory Statistics</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 text-2xl"
            title="Close"
          >
            ×
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="glass p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Storage Type:</span>
                  <span className="text-orange-400 font-medium">{stats.storageType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Messages:</span>
                  <span className="text-gray-200 font-bold">{stats.totalMessages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Your Messages:</span>
                  <span className="text-blue-400">{stats.userMessages}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Seven's Responses:</span>
                  <span className="text-green-400">{stats.assistantMessages}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 glass p-3">
                <p>💡 <strong>IndexedDB</strong> stores unlimited messages locally in your browser.</p>
                <p className="mt-2">🔒 All data is stored on your device and never sent anywhere.</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExport}
                className="flex-1 neuro-button px-4 py-2 text-sm text-orange-400 hover:text-orange-300"
              >
                📤 Export
              </button>
              <button
                onClick={handleImport}
                className="flex-1 neuro-button px-4 py-2 text-sm text-orange-400 hover:text-orange-300"
              >
                📥 Import
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full neuro-button px-4 py-2 text-gray-200 font-medium"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
};








