# Frontend Integration Guide

Guide to connect Seven AI Backend with your Electron + Capacitor + React frontend.

---

## 🔗 Quick Integration

### 1. Update API Base URL

In your frontend code, update the API base URL:

```javascript
// src/config.ts or similar
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export { API_BASE_URL };
```

### 2. Create API Client

```javascript
// src/services/apiClient.ts
import { API_BASE_URL } from '../config';

class APIClient {
  private baseURL: string;
  private userId: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Load user ID from localStorage
    this.userId = localStorage.getItem('seven_user_id');
  }

  async chat(message: string, provider: 'auto' | 'groq' | 'ollama' = 'auto') {
    const response = await fetch(`${this.baseURL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: this.userId,
        session_id: this.sessionId,
        message,
        provider
      })
    });

    const data = await response.json();
    
    // Save user_id and session_id
    if (data.user_id) {
      this.userId = data.user_id;
      localStorage.setItem('seven_user_id', data.user_id);
    }
    if (data.session_id) {
      this.sessionId = data.session_id;
      localStorage.setItem('seven_session_id', data.session_id);
    }

    return data;
  }

  async newChat() {
    if (!this.userId) {
      throw new Error('No user ID available');
    }

    const response = await fetch(`${this.baseURL}/new_chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: this.userId
      })
    });

    const data = await response.json();
    this.sessionId = data.session_id;
    localStorage.setItem('seven_session_id', data.session_id);

    return data;
  }

  async getUserMemory() {
    if (!this.userId) return null;

    const response = await fetch(`${this.baseURL}/memory/${this.userId}`);
    return await response.json();
  }

  async sendSMS(to: string, message: string) {
    const response = await fetch(`${this.baseURL}/send_sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message })
    });

    return await response.json();
  }

  async sendWhatsApp(to: string, message: string) {
    const response = await fetch(`${this.baseURL}/send_whatsapp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, message })
    });

    return await response.json();
  }

  async getLLMStatus() {
    const response = await fetch(`${this.baseURL}/llm/status`);
    return await response.json();
  }
}

export const apiClient = new APIClient();
```

### 3. Update Chat Logic

Replace your existing LLM client logic with the API client:

```javascript
// src/hooks/useAIAssistant.ts (update)
import { apiClient } from '../services/apiClient';

const handleUserInput = async (message: string) => {
  try {
    setIsProcessing(true);
    
    // Add user message to UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    }]);

    // Get response from backend
    const response = await apiClient.chat(message);

    // Add assistant message to UI
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'assistant',
      content: response.message,
      timestamp: new Date()
    }]);

    // Optionally speak the response
    if (autoSpeak) {
      speakResponse(response.message);
    }

  } catch (error) {
    console.error('Chat error:', error);
    setError('Failed to get response');
  } finally {
    setIsProcessing(false);
  }
};
```

### 4. Add New Chat Button Handler

```javascript
const handleNewChat = async () => {
  try {
    const response = await apiClient.newChat();
    
    // Clear UI messages but keep user context
    setMessages([]);
    
    console.log('New chat started:', response.session_id);
    console.log('Memory preserved:', response.memory_summary);
  } catch (error) {
    console.error('Failed to start new chat:', error);
  }
};
```

---

## 🎤 Voice Integration (Optional)

The backend provides voice endpoints, but you can still use browser Web Speech API for better UX:

```javascript
// Keep using browser's Web Speech API for voice input
const recognition = new webkitSpeechRecognition();

// But send text to backend for processing
recognition.onresult = async (event) => {
  const transcript = event.results[0][0].transcript;
  
  // Send to backend
  const response = await apiClient.chat(transcript);
  
  // Speak response using browser TTS
  const utterance = new SpeechSynthesisUtterance(response.message);
  window.speechSynthesis.speak(utterance);
};
```

---

## 📱 SMS/WhatsApp Integration

Add buttons to send messages via backend:

```javascript
const handleSendSMS = async () => {
  const phoneNumber = prompt('Enter phone number:');
  const message = prompt('Enter message:');
  
  if (phoneNumber && message) {
    const result = await apiClient.sendSMS(phoneNumber, message);
    if (result.success) {
      alert('SMS sent successfully!');
    } else {
      alert(`Failed: ${result.error}`);
    }
  }
};

// Add to your UI
<button onClick={handleSendSMS}>📱 Send SMS</button>
```

---

## 🌐 Auto-Detect Online/Offline

Auto-switch between Groq (online) and Ollama (offline):

```javascript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Use auto provider (backend will choose)
const response = await apiClient.chat(message, 'auto');

// Or explicitly choose based on online status
const provider = isOnline ? 'groq' : 'ollama';
const response = await apiClient.chat(message, provider);
```

---

## 🔄 Syncing with Frontend Memory

If you want to migrate existing frontend memory to backend:

```javascript
async function migrateMemoryToBackend() {
  const frontendMemory = getMemoryStore(); // Your existing memory
  const facts = await frontendMemory.getUserFacts();
  
  // Send to backend
  await fetch(`${API_BASE_URL}/memory/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: apiClient.userId,
      memory_summary: "Migrated from frontend",
      facts: facts.map(f => f.content)
    })
  });
}
```

---

## 📊 Health Check & Status

Add status indicator to your UI:

```javascript
const [backendStatus, setBackendStatus] = useState('checking');
const [llmStatus, setLlmStatus] = useState(null);

useEffect(() => {
  const checkStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/../health`);
      if (response.ok) {
        setBackendStatus('online');
        
        // Check LLM status
        const llmData = await apiClient.getLLMStatus();
        setLlmStatus(llmData);
      } else {
        setBackendStatus('offline');
      }
    } catch {
      setBackendStatus('offline');
    }
  };
  
  checkStatus();
  const interval = setInterval(checkStatus, 30000); // Check every 30s
  
  return () => clearInterval(interval);
}, []);

// Display in UI
{backendStatus === 'online' ? '🟢 Backend Online' : '🔴 Backend Offline'}
{llmStatus?.providers.groq.available && '✓ Groq'}
{llmStatus?.providers.ollama.available && '✓ Ollama'}
```

---

## 🚀 Environment Variables

Create `.env` in your frontend:

```env
# Development
REACT_APP_API_URL=http://localhost:5000/api

# Production (with ngrok or deployed backend)
# REACT_APP_API_URL=https://your-backend.ngrok.io/api
```

---

## ✅ Testing Integration

1. **Start Backend**: `python main.py`
2. **Start Frontend**: `npm run dev`
3. **Test Chat**: Send a message and verify it reaches backend
4. **Check Console**: Look for API requests in browser dev tools
5. **Test New Chat**: Click "New Chat" and verify session changes
6. **Test Memory**: Restart frontend and verify conversation persists

---

## 🐛 Common Issues

### CORS Errors

Backend already has CORS configured, but if you see errors:
- Check that backend is running
- Verify `API_BASE_URL` is correct
- Check browser console for exact error

### 401/403 Errors

If you add authentication later:
```javascript
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${your_api_key}`
}
```

### Connection Refused

- Ensure backend is running on port 5000
- Check firewall settings
- Try `localhost` vs `127.0.0.1` vs `0.0.0.0`

---

## 📱 Mobile (Capacitor) Configuration

Update Capacitor config to allow backend access:

```javascript
// capacitor.config.ts
server: {
  url: 'http://192.168.1.100:5000', // Your computer's IP
  cleartext: true
}
```

Or use ngrok URL for internet access:

```javascript
const API_BASE_URL = 'https://abc123.ngrok.io/api';
```

---

**You're now fully integrated with the Python backend!** 🎉













