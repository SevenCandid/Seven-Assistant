# Environment Setup Guide

## Backend `.env` Configuration

Create a file `seven-ai-backend/.env` with the following content:

```bash
# ===== LLM Providers =====
# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Groq (for fast inference)
GROQ_API_KEY=your_groq_api_key_here

# Grok (xAI)
GROK_API_KEY=your_grok_api_key_here

# Ollama (local models)
OLLAMA_BASE_URL=http://localhost:11434

# ===== Messaging Services =====
# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ===== External Integrations =====
# Google APIs (Calendar, Gmail)
GOOGLE_API_KEY=your_google_api_key_here

# YouTube Data API v3
YOUTUBE_API_KEY=your_youtube_api_key_here

# X (Twitter) API v2
X_API_KEY=your_x_api_key_here
X_API_SECRET=your_x_api_secret_here
X_ACCESS_TOKEN=your_x_access_token_here
X_ACCESS_SECRET=your_x_access_secret_here
X_BEARER_TOKEN=your_x_bearer_token_here

# ===== Server Configuration =====
PORT=5000
HOST=0.0.0.0
```

## Getting API Keys

### Google Calendar & Gmail
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable APIs: Calendar API, Gmail API
4. Create credentials (API Key + OAuth 2.0)
5. Add to `.env`

### YouTube
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create API Key
4. Add to `.env`

### X (Twitter)
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create an app
3. Get API Keys and Bearer Token
4. Add to `.env`

## Security Notes

- Never commit `.env` file to git
- Keep API keys secret
- Rotate keys regularly
- Use environment-specific keys (dev/prod)





