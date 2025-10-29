/**
 * Memory Store - Persistent message storage with IndexedDB and localStorage fallback
 */

export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId?: string; // Track which session this message belongs to
  metadata?: {
    action?: string;
    actionData?: any;
    voiceUsed?: string;
  };
}

export interface UserFact {
  id: string;
  fact: string;
  category?: 'personal' | 'preference' | 'context' | 'other';
  confidence?: number; // 0-1, how confident we are about this fact
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  lastMessageAt: Date;
  messageCount: number;
}

const DB_NAME = 'SevenMemoryDB';
const DB_VERSION = 3; // Incremented to ensure sessionId index exists
const STORE_NAME = 'messages';
const FACTS_STORE_NAME = 'facts';
const SESSIONS_STORE_NAME = 'sessions';
const BACKUP_KEY = 'seven_messages_backup';
const FACTS_KEY = 'seven_facts_backup';

/**
 * Memory Store Class - handles all message persistence
 */
export class MemoryStore {
  private db: IDBDatabase | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('⚠️ IndexedDB not available, using localStorage fallback');
        this.isInitialized = true;
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('❌ Failed to open IndexedDB:', request.error);
        this.isInitialized = true; // Use localStorage fallback
        resolve();
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('✅ IndexedDB initialized');
        
        // Migrate from localStorage if exists
        this.migrateFromLocalStorage();
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        const oldVersion = event.oldVersion;
        console.log('🔧 Upgrading database from version', oldVersion, 'to', DB_VERSION);

        // Create or update messages object store with indexes
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('role', 'role', { unique: false });
          store.createIndex('sessionId', 'sessionId', { unique: false });
          console.log('📦 Created messages object store with all indexes');
        } else {
          // Store exists, ensure sessionId index exists
          const transaction = event.target.transaction;
          const store = transaction.objectStore(STORE_NAME);
          
          if (!store.indexNames.contains('sessionId')) {
            store.createIndex('sessionId', 'sessionId', { unique: false });
            console.log('✨ Added missing sessionId index to existing messages store');
          }
          
          if (!store.indexNames.contains('timestamp')) {
            store.createIndex('timestamp', 'timestamp', { unique: false });
            console.log('✨ Added missing timestamp index to existing messages store');
          }
          
          if (!store.indexNames.contains('role')) {
            store.createIndex('role', 'role', { unique: false });
            console.log('✨ Added missing role index to existing messages store');
          }
          
          console.log('✅ Messages store indexes verified/updated');
        }

        // Create facts object store
        if (!db.objectStoreNames.contains(FACTS_STORE_NAME)) {
          const factsStore = db.createObjectStore(FACTS_STORE_NAME, { keyPath: 'id' });
          factsStore.createIndex('category', 'category', { unique: false });
          factsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          console.log('📦 Created facts object store');
        }

        // Create sessions object store
        if (!db.objectStoreNames.contains(SESSIONS_STORE_NAME)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE_NAME, { keyPath: 'id' });
          sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
          sessionsStore.createIndex('lastMessageAt', 'lastMessageAt', { unique: false });
          console.log('📦 Created sessions object store');
        }
      };
    });
  }

  /**
   * Migrate messages from old localStorage to IndexedDB
   */
  private async migrateFromLocalStorage(): Promise<void> {
    try {
      const oldMessages = localStorage.getItem('seven_messages');
      if (oldMessages && this.db) {
        const messages = JSON.parse(oldMessages);
        console.log('🔄 Migrating', messages.length, 'messages from localStorage to IndexedDB');
        
        for (const msg of messages) {
          await this.saveMessage(msg.role, msg.content, new Date(msg.timestamp), msg.id);
        }
        
        // Keep backup but remove main key
        localStorage.setItem(BACKUP_KEY, oldMessages);
        localStorage.removeItem('seven_messages');
        console.log('✅ Migration complete');
      }
    } catch (error) {
      console.error('Failed to migrate from localStorage:', error);
    }
  }

  /**
   * Wait for DB to be initialized
   */
  private async waitForInit(): Promise<void> {
    if (this.isInitialized) return;
    
    return new Promise((resolve) => {
      const check = setInterval(() => {
        if (this.isInitialized) {
          clearInterval(check);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * Save a message to storage
   */
  async saveMessage(
    role: 'user' | 'assistant',
    content: string,
    timestamp: Date = new Date(),
    id?: string,
    metadata?: any,
    sessionId?: string
  ): Promise<string> {
    await this.waitForInit();

    // Get or create current session
    const currentSessionId = sessionId || this.getCurrentSessionId() || await this.createSession().then(s => s.id);

    const message: StoredMessage = {
      id: id || `${Date.now()}-${role}`,
      role,
      content,
      timestamp,
      sessionId: currentSessionId,
      metadata,
    };

    // Try IndexedDB first
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(message);

        request.onsuccess = () => {
          console.log('💾 Saved to IndexedDB:', message.id);
          // Update session metadata - pass user message if it's a user message
          const firstUserMessage = role === 'user' ? content : undefined;
          this.updateSession(currentSessionId, timestamp, firstUserMessage);
          resolve(message.id);
        };

        request.onerror = () => {
          console.error('Failed to save to IndexedDB:', request.error);
          // Fallback to localStorage
          this.saveToLocalStorage(message);
          resolve(message.id);
        };
      });
    } else {
      // Fallback to localStorage
      this.saveToLocalStorage(message);
      return message.id;
    }
  }

  /**
   * Save to localStorage (fallback)
   */
  private saveToLocalStorage(message: StoredMessage): void {
    try {
      const existing = localStorage.getItem(BACKUP_KEY);
      const messages = existing ? JSON.parse(existing) : [];
      messages.push(message);
      
      // Keep only last 100 messages in localStorage (size limit)
      const trimmed = messages.slice(-100);
      localStorage.setItem(BACKUP_KEY, JSON.stringify(trimmed));
      console.log('💾 Saved to localStorage (fallback)');
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 10): Promise<StoredMessage[]> {
    await this.waitForInit();

    // Try IndexedDB first
    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('timestamp');
        
        // Get all messages ordered by timestamp
        const request = index.openCursor(null, 'prev'); // Descending order
        const messages: StoredMessage[] = [];

        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor && messages.length < limit) {
            messages.push(cursor.value);
            cursor.continue();
          } else {
            // Reverse to get chronological order
            resolve(messages.reverse());
          }
        };

        request.onerror = () => {
          console.error('Failed to read from IndexedDB:', request.error);
          // Fallback to localStorage
          resolve(this.getFromLocalStorage(limit));
        };
      });
    } else {
      // Fallback to localStorage
      return this.getFromLocalStorage(limit);
    }
  }

  /**
   * Get from localStorage (fallback)
   */
  private getFromLocalStorage(limit: number): StoredMessage[] {
    try {
      const stored = localStorage.getItem(BACKUP_KEY);
      if (!stored) return [];
      
      const messages = JSON.parse(stored);
      // Convert timestamp strings back to Date objects
      const parsed = messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
      
      return parsed.slice(-limit);
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  }

  /**
   * Get all messages (for export/backup)
   */
  async getAllMessages(): Promise<StoredMessage[]> {
    await this.waitForInit();

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const messages = request.result;
          // Sort by timestamp
          messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          console.log('📚 Retrieved', messages.length, 'messages from IndexedDB');
          resolve(messages);
        };

        request.onerror = () => {
          console.error('Failed to get all messages:', request.error);
          resolve(this.getFromLocalStorage(1000)); // Get up to 1000
        };
      });
    } else {
      return this.getFromLocalStorage(1000);
    }
  }

  /**
   * Get message count
   */
  async getMessageCount(): Promise<number> {
    await this.waitForInit();

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.count();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(0);
        };
      });
    } else {
      try {
        const stored = localStorage.getItem(BACKUP_KEY);
        return stored ? JSON.parse(stored).length : 0;
      } catch {
        return 0;
      }
    }
  }

  /**
   * Clear all history
   */
  async clearHistory(): Promise<void> {
    await this.waitForInit();

    // Clear IndexedDB
    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('🗑️ Cleared IndexedDB');
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to clear IndexedDB:', request.error);
          resolve();
        };
      });
    }

    // Clear localStorage backup
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem('seven_messages'); // Old key
    console.log('🗑️ Cleared localStorage');
  }

  /**
   * Export messages as JSON
   */
  async exportMessages(): Promise<string> {
    const messages = await this.getAllMessages();
    return JSON.stringify(messages, null, 2);
  }

  /**
   * Import messages from JSON
   */
  async importMessages(jsonData: string): Promise<number> {
    try {
      const messages = JSON.parse(jsonData);
      let imported = 0;

      for (const msg of messages) {
        await this.saveMessage(
          msg.role,
          msg.content,
          new Date(msg.timestamp),
          msg.id,
          msg.metadata
        );
        imported++;
      }

      console.log('📥 Imported', imported, 'messages');
      return imported;
    } catch (error) {
      console.error('Failed to import messages:', error);
      throw error;
    }
  }

  /**
   * Search messages by content
   */
  async searchMessages(query: string, limit: number = 20): Promise<StoredMessage[]> {
    const allMessages = await this.getAllMessages();
    const lowerQuery = query.toLowerCase();
    
    return allMessages
      .filter(msg => msg.content.toLowerCase().includes(lowerQuery))
      .slice(-limit);
  }

  /**
   * Get messages by date range
   */
  async getMessagesByDateRange(startDate: Date, endDate: Date): Promise<StoredMessage[]> {
    const allMessages = await this.getAllMessages();
    
    return allMessages.filter(msg => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= startDate && msgDate <= endDate;
    });
  }

  // ==================== USER FACTS MANAGEMENT ====================

  /**
   * Save a user fact
   */
  async saveFact(
    fact: string,
    category: 'personal' | 'preference' | 'context' | 'other' = 'other',
    confidence: number = 0.8
  ): Promise<string> {
    await this.waitForInit();

    const factObj: UserFact = {
      id: `fact-${Date.now()}`,
      fact,
      category,
      confidence,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([FACTS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(FACTS_STORE_NAME);
        const request = store.put(factObj);

        request.onsuccess = () => {
          console.log('💡 Saved fact:', factObj.fact);
          resolve(factObj.id);
        };

        request.onerror = () => {
          console.error('Failed to save fact:', request.error);
          this.saveFactToLocalStorage(factObj);
          resolve(factObj.id);
        };
      });
    } else {
      this.saveFactToLocalStorage(factObj);
      return factObj.id;
    }
  }

  private saveFactToLocalStorage(fact: UserFact): void {
    try {
      const existing = localStorage.getItem(FACTS_KEY);
      const facts = existing ? JSON.parse(existing) : [];
      facts.push(fact);
      localStorage.setItem(FACTS_KEY, JSON.stringify(facts));
    } catch (error) {
      console.error('Failed to save fact to localStorage:', error);
    }
  }

  /**
   * Get all user facts
   */
  async getAllFacts(): Promise<UserFact[]> {
    await this.waitForInit();

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([FACTS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(FACTS_STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result);
        };

        request.onerror = () => {
          resolve(this.getFactsFromLocalStorage());
        };
      });
    } else {
      return this.getFactsFromLocalStorage();
    }
  }

  private getFactsFromLocalStorage(): UserFact[] {
    try {
      const stored = localStorage.getItem(FACTS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Get facts formatted for LLM prompt
   */
  async getFactsForPrompt(): Promise<string> {
    const facts = await this.getAllFacts();
    
    if (facts.length === 0) {
      return '';
    }

    // Sort by confidence (highest first) and limit to top 20
    const topFacts = facts
      .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
      .slice(0, 20)
      .map(f => f.fact);

    return `You remember the following about the user: ${topFacts.join('; ')}.`;
  }

  /**
   * Delete a fact
   */
  async deleteFact(factId: string): Promise<void> {
    await this.waitForInit();

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([FACTS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(FACTS_STORE_NAME);
        const request = store.delete(factId);

        request.onsuccess = () => {
          console.log('🗑️ Deleted fact:', factId);
          resolve();
        };

        request.onerror = () => {
          resolve();
        };
      });
    }
  }

  /**
   * Clear all facts
   */
  async clearFacts(): Promise<void> {
    await this.waitForInit();

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([FACTS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(FACTS_STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log('🗑️ Cleared all facts');
          resolve();
        };

        request.onerror = () => {
          resolve();
        };
      });
    }

    localStorage.removeItem(FACTS_KEY);
  }

  // ==================== CHAT SESSIONS MANAGEMENT ====================

  /**
   * Create a new chat session
   */
  async createSession(title?: string): Promise<ChatSession> {
    await this.waitForInit();

    const session: ChatSession = {
      id: `session-${Date.now()}`,
      title: title || 'New Conversation',
      createdAt: new Date(),
      lastMessageAt: new Date(),
      messageCount: 0,
    };

    if (this.db) {
      await new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([SESSIONS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SESSIONS_STORE_NAME);
        const request = store.put(session);

        request.onsuccess = () => {
          console.log('💬 Created new session:', session.id);
          resolve();
        };

        request.onerror = () => {
          resolve();
        };
      });
    }

    // Store current session ID in localStorage for quick access
    localStorage.setItem('seven_current_session', session.id);
    return session;
  }

  /**
   * Get current session ID
   */
  getCurrentSessionId(): string | null {
    return localStorage.getItem('seven_current_session');
  }

  /**
   * Set current session
   */
  setCurrentSession(sessionId: string): void {
    localStorage.setItem('seven_current_session', sessionId);
  }

  /**
   * Get all sessions
   */
  async getAllSessions(): Promise<ChatSession[]> {
    await this.waitForInit();

    if (this.db) {
      return new Promise((resolve) => {
        const transaction = this.db!.transaction([SESSIONS_STORE_NAME], 'readonly');
        const store = transaction.objectStore(SESSIONS_STORE_NAME);
        const index = store.index('lastMessageAt');
        const request = index.openCursor(null, 'prev');
        const sessions: ChatSession[] = [];

        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            sessions.push(cursor.value);
            cursor.continue();
          } else {
            resolve(sessions);
          }
        };

        request.onerror = () => {
          resolve([]);
        };
      });
    }

    return [];
  }

  /**
   * Get messages for a specific session
   */
  async getSessionMessages(sessionId: string, limit?: number): Promise<StoredMessage[]> {
    console.log('🔍 getSessionMessages called with sessionId:', sessionId, 'limit:', limit);
    await this.waitForInit();
    console.log('✅ waitForInit completed, db status:', this.db ? 'Available' : 'Not available');

    if (this.db) {
      console.log('📂 Using IndexedDB to fetch messages...');
      return new Promise((resolve, reject) => {
        try {
          const transaction = this.db!.transaction([STORE_NAME], 'readonly');
          const store = transaction.objectStore(STORE_NAME);
          
          // Check if sessionId index exists
          if (store.indexNames.contains('sessionId')) {
            console.log('✅ Using sessionId index for efficient query');
            const index = store.index('sessionId');
            const request = index.getAll(sessionId);

            request.onsuccess = () => {
              let messages = request.result;
              console.log('📦 Raw messages retrieved:', messages.length);
              console.log('📝 First message sample:', messages.length > 0 ? {
                id: messages[0].id,
                role: messages[0].role,
                sessionId: messages[0].sessionId,
                content: messages[0].content.substring(0, 50) + '...'
              } : 'No messages');
              
              messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              
              if (limit) {
                console.log('✂️ Applying limit:', limit, 'from', messages.length, 'messages');
                messages = messages.slice(-limit);
              }
              
              console.log('✅ Returning', messages.length, 'messages for session:', sessionId);
              resolve(messages);
            };

            request.onerror = () => {
              console.error('❌ IndexedDB request error:', request.error);
              console.log('🔄 Returning empty array due to error');
              resolve([]);
            };
          } else {
            // Fallback: Index doesn't exist, scan all messages (slower but works)
            console.warn('⚠️ sessionId index not found, using fallback method (slower)');
            console.log('💡 This will be fixed on next page refresh with database upgrade');
            const request = store.getAll();

            request.onsuccess = () => {
              let messages = request.result;
              console.log('📦 Retrieved all messages:', messages.length);
              
              // Filter by sessionId manually
              messages = messages.filter((msg: StoredMessage) => msg.sessionId === sessionId);
              console.log('🔍 Filtered to', messages.length, 'messages for session:', sessionId);
              
              messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              
              if (limit) {
                messages = messages.slice(-limit);
              }
              
              console.log('✅ Returning', messages.length, 'messages for session:', sessionId);
              resolve(messages);
            };

            request.onerror = () => {
              console.error('❌ IndexedDB request error:', request.error);
              resolve([]);
            };
          }
          
          transaction.onerror = () => {
            console.error('❌ Transaction error:', transaction.error);
          };
        } catch (error) {
          console.error('❌ Exception in getSessionMessages:', error);
          reject(error);
        }
      });
    } else {
      console.warn('⚠️ IndexedDB not available, returning empty array');
      console.log('💡 Tip: Check if IndexedDB is supported in this browser');
    }

    return [];
  }

  /**
   * Delete a session and all its messages
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.waitForInit();

    if (this.db) {
      // Delete session
      await new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([SESSIONS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SESSIONS_STORE_NAME);
        const request = store.delete(sessionId);

        request.onsuccess = () => resolve();
        request.onerror = () => resolve();
      });

      // Delete all messages in this session
      await new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('sessionId');
        const request = index.openCursor(sessionId);

        request.onsuccess = (event: any) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      });

      console.log('🗑️ Deleted session:', sessionId);
    }
  }

  /**
   * Update session metadata (last message time, count)
   */
  async updateSession(sessionId: string, lastMessageAt: Date, firstUserMessage?: string): Promise<void> {
    await this.waitForInit();

    if (this.db) {
      await new Promise<void>((resolve) => {
        const transaction = this.db!.transaction([SESSIONS_STORE_NAME], 'readwrite');
        const store = transaction.objectStore(SESSIONS_STORE_NAME);
        const getRequest = store.get(sessionId);

        getRequest.onsuccess = () => {
          const session = getRequest.result;
          if (session) {
            session.lastMessageAt = lastMessageAt;
            session.messageCount = (session.messageCount || 0) + 1;
            
            // Update title with first user message if this is the first message
            if (firstUserMessage && session.messageCount === 1 && session.title === 'New Conversation') {
              // Use first 50 characters of first user message as title
              session.title = firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? '...' : '');
            }
            
            store.put(session);
          }
          resolve();
        };

        getRequest.onerror = () => resolve();
      });
    }
  }
}

/**
 * Create singleton instance
 */
let memoryStoreInstance: MemoryStore | null = null;

export const getMemoryStore = (): MemoryStore => {
  if (!memoryStoreInstance) {
    memoryStoreInstance = new MemoryStore();
  }
  return memoryStoreInstance;
};

export const createMemoryStore = (): MemoryStore => {
  return new MemoryStore();
};

