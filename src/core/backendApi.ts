/**
 * Backend API Service
 * Handles all communication with the Seven AI Backend
 */

// Backend API configuration
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Types
export interface ChatRequest {
  message: string;
  session_id?: string;
  files?: FileAttachment[];
}

export interface ChatResponse {
  message: string;
  session_id: string;
  timestamp: string;
  actions?: any[];
}

export interface FileAttachment {
  name: string;
  type: string;
  size: number;
  data: string; // base64 for images, text content for documents
  preview?: string;
}

export interface MemoryItem {
  id: string;
  fact: string;
  category?: string;
  timestamp: string;
}

export interface SessionInfo {
  session_id: string;
  created_at: string;
  message_count: number;
  last_message_at: string;
}

/**
 * Backend API Client
 */
export class BackendApiClient {
  private baseUrl: string;
  private currentSessionId: string | null = null;

  constructor(baseUrl: string = BACKEND_URL) {
    this.baseUrl = baseUrl;
    console.log('🌐 Backend API initialized:', this.baseUrl);
  }

  /**
   * Check backend health
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
      });
      const data = await response.json();
      console.log('✅ Backend health check:', data);
      return response.ok;
    } catch (error) {
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Send a chat message to the backend
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      console.log('📤 Sending message to backend:', {
        messageLength: request.message.length,
        hasFiles: !!request.files?.length,
        sessionId: request.session_id || 'new',
      });

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: request.message,
          session_id: request.session_id || this.currentSessionId,
          files: request.files,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const data: ChatResponse = await response.json();
      
      // Store session ID for future messages
      if (data.session_id) {
        this.currentSessionId = data.session_id;
      }

      console.log('📥 Received response from backend:', {
        messageLength: data.message.length,
        sessionId: data.session_id,
        hasActions: !!data.actions?.length,
      });

      return data;
    } catch (error) {
      console.error('❌ Failed to send message to backend:', error);
      throw error;
    }
  }

  /**
   * Start a new chat session
   */
  async newSession(): Promise<{ session_id: string; message: string }> {
    try {
      console.log('🆕 Creating new session...');

      const response = await fetch(`${this.baseUrl}/api/new_chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        throw new Error(`Failed to create new session: ${response.status}`);
      }

      const data = await response.json();
      this.currentSessionId = data.session_id;

      console.log('✅ New session created:', data.session_id);
      return data;
    } catch (error) {
      console.error('❌ Failed to create new session:', error);
      throw error;
    }
  }

  /**
   * Get user memory (facts)
   */
  async getMemory(): Promise<MemoryItem[]> {
    try {
      console.log('📚 Fetching user memory...');

      const response = await fetch(`${this.baseUrl}/api/memory`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get memory: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Retrieved memory:', data.facts?.length || 0, 'facts');
      return data.facts || [];
    } catch (error) {
      console.error('❌ Failed to get memory:', error);
      throw error;
    }
  }

  /**
   * Clear user memory
   */
  async clearMemory(): Promise<void> {
    try {
      console.log('🗑️ Clearing user memory...');

      const response = await fetch(`${this.baseUrl}/api/memory`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to clear memory: ${response.status}`);
      }

      console.log('✅ Memory cleared');
    } catch (error) {
      console.error('❌ Failed to clear memory:', error);
      throw error;
    }
  }

  /**
   * Send SMS message
   */
  async sendSMS(phoneNumber: string, message: string): Promise<void> {
    try {
      console.log('📱 Sending SMS to:', phoneNumber);

      const response = await fetch(`${this.baseUrl}/api/send_sms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send SMS: ${response.status}`);
      }

      console.log('✅ SMS sent successfully');
    } catch (error) {
      console.error('❌ Failed to send SMS:', error);
      throw error;
    }
  }

  /**
   * Send WhatsApp message
   */
  async sendWhatsApp(phoneNumber: string, message: string): Promise<void> {
    try {
      console.log('📲 Sending WhatsApp to:', phoneNumber);

      const response = await fetch(`${this.baseUrl}/api/send_whatsapp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to send WhatsApp: ${response.status}`);
      }

      console.log('✅ WhatsApp sent successfully');
    } catch (error) {
      console.error('❌ Failed to send WhatsApp:', error);
      throw error;
    }
  }

  /**
   * Analyze media (image or video)
   */
  async analyzeMedia(file: File, mode: 'offline' | 'online' | 'auto' = 'auto'): Promise<any> {
    try {
      console.log('📸 Analyzing media:', file.name, 'mode:', mode);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('mode', mode);

      const response = await fetch(`${this.baseUrl}/api/analyze_media`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `Analysis failed: ${response.status}`);
      }

      const results = await response.json();
      console.log('✅ Media analyzed successfully');
      return results;
    } catch (error) {
      console.error('❌ Failed to analyze media:', error);
      throw error;
    }
  }

  /**
   * Analyze image from URL
   */
  async analyzeImageUrl(url: string, mode: 'offline' | 'online' | 'auto' = 'auto'): Promise<any> {
    try {
      console.log('📸 Analyzing image from URL:', url);

      const formData = new FormData();
      formData.append('url', url);
      formData.append('mode', mode);

      const response = await fetch(`${this.baseUrl}/api/analyze_image_url`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: response.statusText }));
        throw new Error(error.detail || `Analysis failed: ${response.status}`);
      }

      const results = await response.json();
      console.log('✅ Image from URL analyzed successfully');
      return results;
    } catch (error) {
      console.error('❌ Failed to analyze image from URL:', error);
      throw error;
    }
  }

  /**
   * Get vision service status
   */
  async getVisionStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/vision/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to get vision status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Failed to get vision status:', error);
      throw error;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Set session ID (for loading previous sessions)
   */
  setSessionId(sessionId: string | null): void {
    this.currentSessionId = sessionId;
    console.log('🔄 Session ID updated:', sessionId);
  }

  /**
   * Get or create user ID
   * Uses localStorage to persist user ID across sessions
   */
  getUserId(): string {
    const STORAGE_KEY = 'seven_user_id';
    
    // Try to get existing user ID
    let userId = localStorage.getItem(STORAGE_KEY);
    
    // If no user ID exists, create one
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(STORAGE_KEY, userId);
      console.log('🆔 Created new user ID:', userId);
    }
    
    return userId;
  }
}

// Export singleton instance
export const backendApi = new BackendApiClient();

