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
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      if (!response.ok) {
        return false;
      }
      const data = await response.json();
      console.log('✅ Backend health check:', data);
      return true;
    } catch (error) {
      // Only log if it's not a network error (expected when backend is offline)
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        // Backend is offline - this is expected, don't log error
        return false;
      }
      console.error('❌ Backend health check failed:', error);
      return false;
    }
  }

  /**
   * Send a chat message to the backend
   */
  async sendMessage(request: ChatRequest): Promise<ChatResponse> {
    const requestStartTime = performance.now();
    try {
      console.log('📤 Sending message to backend:', {
        messageLength: request.message.length,
        hasFiles: !!request.files?.length,
        sessionId: request.session_id || 'new',
      });
      console.log(`⏱️ [TIMING] Backend API request started at ${new Date().toISOString()}`);

      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (2 minutes) - LLM responses can take time, especially with Ollama

      try {
        const fetchStartTime = performance.now();
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
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        
        const fetchDuration = performance.now() - fetchStartTime;
        console.log(`⏱️ [TIMING] Backend fetch took: ${fetchDuration.toFixed(2)}ms (${(fetchDuration / 1000).toFixed(2)}s)`);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const parseStartTime = performance.now();
      const data: ChatResponse = await response.json();
      const parseDuration = performance.now() - parseStartTime;
      console.log(`⏱️ [TIMING] JSON parsing took: ${parseDuration.toFixed(2)}ms`);
      
      // Store session ID for future messages
      if (data.session_id) {
        this.currentSessionId = data.session_id;
      }

      const totalDuration = performance.now() - requestStartTime;
      console.log(`⏱️ [TIMING] Total backend API time: ${totalDuration.toFixed(2)}ms (${(totalDuration / 1000).toFixed(2)}s)`);
      console.log('📥 Received response from backend:', {
        messageLength: data.message.length,
        sessionId: data.session_id,
        hasActions: !!data.actions?.length,
      });

        return data;
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: Backend took too long to respond. Please try again.');
        }
        throw error;
      }
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
   * Get recent Gmail emails (requires Gmail integration configured)
   */
  async getRecentEmails(maxResults: number = 1): Promise<{ emails: Array<{ id: string; from: string; subject: string; date: string; snippet: string }>; count: number }> {
    const res = await fetch(`${this.baseUrl}/api/integrations/gmail/recent?max_results=${maxResults}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch emails: ${res.status}`);
    }
    const data = await res.json();
    // Expected wrapper: { success, data: { emails, count }, error }
    if (data && data.success && data.data) {
      return { emails: data.data.emails || [], count: data.data.count || 0 };
    }
    // Fallback if backend returns raw
    return { emails: data.emails || [], count: data.count || 0 };
  }

  /**
   * Get user memory (facts)
   */
  async getMemory(): Promise<MemoryItem[]> {
    try {
      console.log('📚 Fetching user memory...');

      // Single user system - use default endpoint
      const response = await fetch(`${this.baseUrl}/api/memory`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Failed to get memory: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Retrieved memory:', data.memory?.facts?.length || 0, 'facts');
      return data.memory?.facts || [];
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
   * Get user ID - Single user system
   * Returns hardcoded single user ID for now
   */
  getUserId(): string {
    // Single user system - hardcoded user ID
    return 'seven_user';
  }
}

// Export singleton instance
const _backendApi = new BackendApiClient();
export const backendApi = _backendApi;
// Make baseUrl accessible for DeveloperConsole
Object.defineProperty(backendApi, 'baseUrl', {
  get() {
    return BACKEND_URL;
  },
  enumerable: true,
  configurable: false,
});




