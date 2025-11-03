# Seven AI Backend

**Python backend for Seven AI** - An intelligent, cross-platform personal assistant with persistent memory, voice capabilities, and messaging integration.

---

## 🚀 Features

- ✅ **Persistent Memory** - Remembers users across all chat sessions
- ✅ **Multi-Session Support** - Start new chats while keeping user memory
- ✅ **Voice Recognition (STT)** - Speech-to-text using Google Speech API
- ✅ **Voice Synthesis (TTS)** - Text-to-speech with pyttsx3
- ✅ **SMS & WhatsApp** - Send messages via Twilio
- ✅ **Dual LLM Support** - Groq (online) + Ollama (offline)
- ✅ **Auto-Switching** - Automatically uses best available LLM
- ✅ **RESTful API** - FastAPI with automatic documentation
- ✅ **Cross-Platform** - Works with web, desktop (Electron), and mobile (Capacitor)

---

## 📋 Requirements

- Python 3.10 or higher
- pip (Python package manager)
- Optional: Ollama (for offline mode)
- Optional: Twilio account (for SMS/WhatsApp)
- Optional: ngrok (for global sharing)

---

## 🛠️ Installation

### 1. Clone or Create Project

```bash
cd seven-ai-backend
```

### 2. Create Virtual Environment (Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Required: Get free API key from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Optional: For offline mode (requires Ollama installed)
OLLAMA_URL=http://localhost:11434

# Optional: For SMS/WhatsApp (requires Twilio account)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 🎯 Quick Start

### Start the Server

```bash
python main.py
```

The server will start at:
- **Local**: http://localhost:5000
- **Network**: http://0.0.0.0:5000
- **API Docs**: http://localhost:5000/docs

### Test the API

```bash
# Health check
curl http://localhost:5000/health

# Send a chat message
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, Seven!",
    "provider": "auto"
  }'
```

---

## 📡 API Endpoints

### Chat Endpoints

#### `POST /api/chat`
Send a chat message with auto-memory management

**Request:**
```json
{
  "user_id": "optional-user-id",
  "session_id": "optional-session-id",
  "message": "Hello, Seven!",
  "provider": "auto"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hello! How can I help you today?",
  "user_id": "generated-uuid",
  "session_id": "session-uuid",
  "provider": "groq",
  "model": "llama-3.1-8b-instant"
}
```

#### `POST /api/new_chat`
Start a new chat session (keeps user memory)

**Request:**
```json
{
  "user_id": "user-uuid"
}
```

#### `GET /api/sessions/{user_id}`
Get user's recent chat sessions

#### `GET /api/session/{session_id}/messages`
Get messages from a specific session

#### `GET /api/llm/status`
Check status of LLM providers (Groq/Ollama)

---

### Memory Endpoints

#### `GET /api/memory/{user_id}`
Get user's long-term memory

#### `POST /api/memory/update`
Update user's memory summary and facts

#### `DELETE /api/memory/{user_id}`
Clear user's memory (keeps chat history)

#### `DELETE /api/session/{session_id}`
Delete a chat session and its messages

---

### Messaging Endpoints

#### `POST /api/send_sms`
Send SMS message

**Request:**
```json
{
  "to": "+1234567890",
  "message": "Hello from Seven AI!"
}
```

#### `POST /api/send_whatsapp`
Send WhatsApp message

**Request:**
```json
{
  "to": "+1234567890",
  "message": "Hello from Seven AI!"
}
```

#### `GET /api/messaging/status`
Get messaging service status

---

### Voice Endpoints

#### `POST /api/voice_input`
Convert speech to text (STT)

**Request:**
```json
{
  "audio_data": "base64-encoded-audio",
  "language": "en-US"
}
```

#### `POST /api/voice_output`
Convert text to speech (TTS)

**Request:**
```json
{
  "text": "Hello! This is Seven speaking.",
  "return_audio": true
}
```

#### `GET /api/voice/voices`
Get list of available TTS voices

---

## 🌍 Global Access with ngrok

Share your backend globally (no hosting needed):

### 1. Install ngrok

Download from: https://ngrok.com/download

### 2. Authenticate (one-time)

```bash
ngrok authtoken your_auth_token
```

### 3. Start ngrok

```bash
ngrok http 5000
```

You'll get a public URL like: `https://abc123.ngrok.io`

### 4. Update Frontend

Update your frontend to use the ngrok URL:

```javascript
const API_URL = "https://abc123.ngrok.io/api";
```

---

## 🔧 Configuration

### LLM Providers

**Groq (Online - Free Tier)**
1. Get API key: https://console.groq.com
2. Add to `.env`: `GROQ_API_KEY=your_key`
3. Supports: llama-3.1-8b-instant, llama-3.3-70b-versatile

**Ollama (Offline - Local)**
1. Install: https://ollama.com/download
2. Pull model: `ollama pull llama3.2`
3. Ensure it's running: `ollama serve`

### Twilio Messaging

1. Create account: https://www.twilio.com/try-twilio
2. Get credentials from dashboard
3. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

**Without Twilio**: Messages will be logged to console for testing.

---

## 🏗️ Project Structure

```
seven-ai-backend/
│
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── .env                    # Configuration (create from .env.example)
│
├── core/
│   ├── llm.py             # Groq + Ollama integration
│   ├── memory.py          # SQLite persistent memory
│   ├── voice.py           # Speech recognition & synthesis
│   ├── messaging.py       # Twilio SMS & WhatsApp
│   └── utils.py           # Helper functions
│
├── routes/
│   ├── chat_routes.py     # Chat endpoints
│   ├── memory_routes.py   # Memory management
│   └── message_routes.py  # Messaging & voice
│
└── data/
    └── memory.db          # SQLite database (auto-created)
```

---

## 🔗 Frontend Integration

Update your frontend to use the backend API:

```javascript
// Example: Chat request
async function sendMessage(message) {
  const response = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: message,
      provider: 'auto'  // Auto-select Groq or Ollama
    })
  });
  
  const data = await response.json();
  return data.message;
}

// Example: Send SMS
async function sendSMS(phoneNumber, message) {
  const response = await fetch('http://localhost:5000/api/send_sms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: phoneNumber,
      message: message
    })
  });
  
  return await response.json();
}
```

---

## 🧪 Testing

### Test with curl

```bash
# Chat
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What can you do?"}'

# Get Memory
curl http://localhost:5000/api/memory/test-user-123

# LLM Status
curl http://localhost:5000/api/llm/status
```

### Test with Python

```python
import requests

# Chat
response = requests.post('http://localhost:5000/api/chat', json={
    'message': 'Hello, Seven!',
    'provider': 'auto'
})
print(response.json())
```

---

## 🐛 Troubleshooting

### Port Already in Use

```bash
# Change port in .env
PORT=5001
```

### Groq API Not Working

- Check API key is correct
- Verify internet connection
- Check rate limits

### Ollama Not Available

```bash
# Start Ollama
ollama serve

# Pull model
ollama pull llama3.2
```

### Database Errors

```bash
# Delete and recreate database
rm data/memory.db
python main.py  # Will auto-recreate
```

---

## 📚 API Documentation

Interactive API docs available at:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

---

## 🚀 Deployment

### Local Network Access

Already configured! Server listens on `0.0.0.0:5000`

### Global Access (ngrok)

```bash
ngrok http 5000
```

### Production Deployment

For production, consider:
- **Heroku**: `heroku create your-app`
- **Railway**: `railway up`
- **Docker**: Create Dockerfile
- **VPS**: Deploy with systemd service

---

## 📝 License

This project is part of Seven AI - an open-source AI assistant.

---

## 🤝 Support

For issues or questions:
1. Check API docs: http://localhost:5000/docs
2. Review logs in terminal
3. Test with curl/Postman

---

**Made with ❤️ for Seven AI**













