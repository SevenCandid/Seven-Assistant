# 🔌 External Service Integrations

## Overview

Seven AI Assistant now integrates with **Google Calendar**, **Gmail**, **YouTube**, and **X (Twitter)** to provide powerful automation and connectivity features.

## 🎯 Supported Services

### 1. **Google Calendar** 📅
- List upcoming events
- Create new events
- Manage meetings and reminders
- OAuth 2.0 authentication

### 2. **Gmail** 📧
- Send emails
- Read recent emails
- Full inbox integration
- OAuth 2.0 authentication

### 3. **YouTube** 🎥
- Search videos
- Get video details
- Find trending content
- API key authentication

### 4. **X (Twitter)** ✖️
- Post tweets
- Read timeline (coming soon)
- Manage social media
- Bearer token authentication

## 🚀 Quick Setup

### Step 1: Get API Credentials

#### Google Calendar & Gmail
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable APIs:
   - Google Calendar API
   - Gmail API
4. Create credentials:
   - **API Key** (for server-to-server)
   - **OAuth 2.0 Client ID** (for user data access)
5. Download OAuth credentials JSON

#### YouTube
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **YouTube Data API v3**
3. Create **API Key**
4. Copy the key

#### X (Twitter)
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Create an app
3. Generate:
   - API Key & Secret
   - Access Token & Secret
   - Bearer Token
4. Copy all credentials

### Step 2: Configure Backend

Create `seven-ai-backend/.env`:

```bash
# Google APIs
GOOGLE_API_KEY=your_google_api_key_here

# YouTube
YOUTUBE_API_KEY=your_youtube_api_key_here

# X (Twitter)
X_API_KEY=your_x_api_key
X_API_SECRET=your_x_api_secret
X_ACCESS_TOKEN=your_x_access_token
X_ACCESS_SECRET=your_x_access_secret
X_BEARER_TOKEN=your_x_bearer_token
```

See `ENV_SETUP_GUIDE.md` for detailed configuration.

### Step 3: Install Dependencies

```bash
cd seven-ai-backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Step 4: Restart Backend

```bash
cd seven-ai-backend
python main.py
```

Look for:
```
INFO: Google Calendar not configured
INFO: Gmail not configured
SUCCESS: YouTube API configured
INFO: X (Twitter) API not configured
```

### Step 5: Check Status in UI

1. Open Seven → Settings
2. Scroll to **🔌 Integrations**
3. See which services are active

## 💬 Usage Examples

### Google Calendar

**List Events:**
> "Show me my calendar events"
> "What's on my schedule today?"
> "What meetings do I have this week?"

**Create Events:**
> "Schedule a meeting tomorrow at 2 PM for 1 hour"
> "Add 'Team Standup' to my calendar on Friday at 9 AM"
> "Create an event called 'Lunch with Sarah' on Monday at 12:30 PM"

### Gmail

**Send Emails:**
> "Send an email to john@example.com saying 'Meeting confirmed for 3 PM'"
> "Email sarah@company.com with subject 'Project Update' and say 'The project is on track'"

**Read Emails:**
> "Show me my recent emails"
> "What emails did I receive today?"

### YouTube

**Search Videos:**
> "Search YouTube for Python tutorials"
> "Find videos about AI and machine learning"
> "Show me the latest tech news on YouTube"

### X (Twitter)

**Post Tweets:**
> "Tweet: Just launched an amazing new feature!"
> "Post on Twitter: Excited about AI progress"

## 📊 API Endpoints

### Integration Status

**GET** `/api/integrations/status`

**Response:**
```json
{
  "success": true,
  "status": {
    "google_calendar": true,
    "gmail": true,
    "youtube": true,
    "x": false
  },
  "available_actions": [
    "list_calendar_events",
    "create_calendar_event",
    "send_email",
    "search_youtube"
  ]
}
```

### Google Calendar

**POST** `/api/integrations/calendar/events`

List upcoming calendar events.

**Request:**
```json
{
  "max_results": 10,
  "days_ahead": 7
}
```

**Response:**
```json
{
  "success": true,
  "events": [
    {
      "id": "event123",
      "summary": "Team Meeting",
      "start": "2024-01-15T14:00:00Z",
      "end": "2024-01-15T15:00:00Z",
      "location": "Conference Room A",
      "description": "Weekly team sync"
    }
  ],
  "count": 1
}
```

**POST** `/api/integrations/calendar/create`

Create a new calendar event.

**Request:**
```json
{
  "summary": "Project Review",
  "start_time": "2024-01-16T10:00:00Z",
  "end_time": "2024-01-16T11:00:00Z",
  "description": "Q1 project review meeting",
  "location": "Zoom"
}
```

### Gmail

**POST** `/api/integrations/gmail/send`

Send an email.

**Request:**
```json
{
  "to": "recipient@example.com",
  "subject": "Meeting Confirmation",
  "body": "The meeting is confirmed for 2 PM tomorrow.",
  "from_email": "me"
}
```

**GET** `/api/integrations/gmail/recent?max_results=10`

Get recent emails from inbox.

**Response:**
```json
{
  "success": true,
  "emails": [
    {
      "id": "msg123",
      "from": "sender@example.com",
      "subject": "Project Update",
      "date": "Mon, 15 Jan 2024 10:30:00 GMT",
      "snippet": "Here's the latest update..."
    }
  ],
  "count": 1
}
```

### YouTube

**POST** `/api/integrations/youtube/search`

Search YouTube videos.

**Request:**
```json
{
  "query": "Python tutorials",
  "max_results": 10,
  "order": "relevance"
}
```

**Response:**
```json
{
  "success": true,
  "videos": [
    {
      "video_id": "dQw4w9WgXcQ",
      "title": "Python Tutorial for Beginners",
      "description": "Learn Python in 30 minutes",
      "channel": "Code Academy",
      "published_at": "2024-01-10T12:00:00Z",
      "thumbnail": "https://...",
      "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    }
  ],
  "count": 1,
  "query": "Python tutorials"
}
```

### X (Twitter)

**POST** `/api/integrations/x/tweet`

Post a tweet.

**Request:**
```json
{
  "text": "Excited to announce our new AI features! #AI #Innovation"
}
```

**Response:**
```json
{
  "success": true,
  "tweet": {
    "id": "1234567890",
    "text": "Excited to announce our new AI features! #AI #Innovation",
    "url": "https://twitter.com/i/web/status/1234567890"
  },
  "message": "Tweet posted successfully"
}
```

## 🔒 OAuth Flow (Google Services)

For Google Calendar and Gmail, OAuth 2.0 is required:

### 1. Initial Setup
```python
# In integrations.py
from google.oauth2.credentials import Credentials

credentials = Credentials.from_authorized_user_info({
    'client_id': 'your_client_id',
    'client_secret': 'your_client_secret',
    'refresh_token': 'your_refresh_token',
    'token': 'your_access_token'
})
```

### 2. Set Credentials via API
```bash
curl -X POST http://localhost:5000/api/integrations/set-credentials \
  -H "Content-Type: application/json" \
  -d '{
    "service": "google_calendar",
    "credentials": {
      "client_id": "...",
      "client_secret": "...",
      "refresh_token": "...",
      "token": "..."
    }
  }'
```

### 3. Credentials Persist
Credentials are stored in memory for the session. For persistent storage, implement a secure credential store.

## 🛠️ Troubleshooting

### Service Not Available

**Symptom:** "Service not configured" error

**Solutions:**
1. Check `.env` file has correct API keys
2. Restart backend: `python main.py`
3. Verify API keys are valid
4. Check service status: `/api/integrations/status`

### OAuth Errors (Google)

**Symptom:** "Invalid credentials" or "Token expired"

**Solutions:**
1. Regenerate OAuth tokens
2. Check token expiration
3. Refresh access token
4. Re-authorize application

### YouTube API Quota

**Symptom:** "Quota exceeded" error

**Solutions:**
1. Check daily quota usage
2. Request quota increase
3. Implement caching
4. Use alternative search methods

### X API Errors

**Symptom:** "Authentication failed"

**Solutions:**
1. Verify Bearer Token is correct
2. Check API access level (Basic, Pro)
3. Ensure app has write permissions
4. Check rate limits

## 📈 Rate Limits

| Service | Rate Limit | Notes |
|---------|------------|-------|
| Google Calendar | 1M requests/day | Per project |
| Gmail | 1B quota units/day | Complex calculation |
| YouTube | 10K units/day | 1 search = 100 units |
| X (Twitter) | Varies by tier | Basic: 1.5K tweets/month |

## 🔮 Future Enhancements

Planned features:
- [ ] Spotify integration
- [ ] Slack integration
- [ ] Google Drive file management
- [ ] Calendar conflict detection
- [ ] Email auto-reply
- [ ] Social media scheduling
- [ ] Multi-account support

## 📚 Additional Resources

- [Google Calendar API Docs](https://developers.google.com/calendar/api/v3/reference)
- [Gmail API Docs](https://developers.google.com/gmail/api/reference/rest)
- [YouTube Data API Docs](https://developers.google.com/youtube/v3/docs)
- [X API Docs](https://developer.twitter.com/en/docs/twitter-api)

---

**Ready to connect?** Set up your API keys and start automating! 🚀✨





