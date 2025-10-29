# 🔌 External Integrations - Quick Start

Get Seven connected to your favorite services in 5 minutes!

## ⚡ Quick Setup

### Step 1: Choose Your Service

Pick the service you want to integrate first. **YouTube** is easiest to start with!

### Step 2: Get API Key

#### For YouTube (Easiest)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create/select a project
3. Click "Enable APIs" → Search "YouTube Data API v3" → Enable
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

#### For X (Twitter)
1. Go to [Twitter Developer Portal](https://developer.twitter.com/)
2. Sign in and create an app
3. Go to "Keys and Tokens"
4. Generate and copy Bearer Token

### Step 3: Add to Environment

Create/edit `seven-ai-backend/.env`:

```bash
# YouTube
YOUTUBE_API_KEY=your_youtube_api_key_here

# X (Twitter)
X_BEARER_TOKEN=your_x_bearer_token_here
```

### Step 4: Install Dependencies

```bash
cd seven-ai-backend
pip install google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### Step 5: Restart Backend

```bash
# Stop current backend (Ctrl+C)
python main.py
```

Look for:
```
SUCCESS: YouTube API configured
```

### Step 6: Test It!

Open Seven and ask:
> "Search YouTube for AI tutorials"

Seven will search and show you results! 🎉

## 🎯 Quick Tests

### YouTube Search
> User: "Find Python videos on YouTube"
> 
> Seven: "Here are some Python videos I found on YouTube..."
> (Shows list of videos with titles and links)

### X (Twitter) Post
> User: "Tweet: Hello from Seven AI!"
> 
> Seven: "Tweet posted successfully! [link]"

### Google Calendar (Requires OAuth)
> User: "Show my calendar events"
> 
> Seven: "Here are your upcoming events..."

## 📊 Check Status

### Via UI
1. Open Seven → Settings
2. Scroll to "🔌 Integrations"
3. See green "✓ Active" for configured services

### Via API
```bash
curl http://localhost:5000/api/integrations/status
```

**Response:**
```json
{
  "status": {
    "google_calendar": false,
    "gmail": false,
    "youtube": true,
    "x": true
  },
  "available_actions": [
    "search_youtube",
    "post_tweet"
  ]
}
```

## 🚀 Real-World Examples

### Example 1: YouTube Research

**Scenario:** Learning about a new technology

```
You: "Search YouTube for React hooks tutorials"
Seven: "Here are the top React hooks tutorials:
1. React Hooks Tutorial - 45 min
2. Learn React Hooks in 30 Minutes
3. React Hooks Crash Course
..."
```

### Example 2: Social Media Update

**Scenario:** Share a quick update

```
You: "Post a tweet saying 'Just finished a great project!'"
Seven: "Tweet posted! https://twitter.com/..."
```

### Example 3: Calendar Check

**Scenario:** Morning routine

```
You: "What's on my calendar today?"
Seven: "You have 3 events today:
- 9:00 AM: Team Standup
- 2:00 PM: Client Meeting
- 4:30 PM: Code Review"
```

## 💡 Pro Tips

### Tip 1: Start Simple
Begin with YouTube (no OAuth needed), then add X, then Google services.

### Tip 2: Test API Keys
Before adding to `.env`, test them with curl:

```bash
# Test YouTube API
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=YOUR_KEY"
```

### Tip 3: Secure Your Keys
- Never commit `.env` to git
- Use different keys for dev/prod
- Rotate keys regularly

### Tip 4: Check Logs
Backend logs show integration status:
```
INFO: YouTube API configured
SUCCESS: Integration initialized
```

## 🛠️ Troubleshooting

### Issue: "Service not configured"

**Check:**
```bash
# Verify .env file exists
cat seven-ai-backend/.env

# Check for your key
grep YOUTUBE_API_KEY seven-ai-backend/.env
```

**Fix:** Add missing key, restart backend

### Issue: "Invalid API key"

**Test key directly:**
```bash
curl "https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&key=YOUR_KEY"
```

**If error:** Generate new key from console

### Issue: Integration shows as inactive

**Solutions:**
1. Restart backend
2. Check `.env` syntax (no spaces around `=`)
3. Verify key is not expired
4. Check console logs for errors

## 📱 Using in Chat

### Natural Language
Seven understands natural requests:

```
✅ "Find cat videos on YouTube"
✅ "Tweet 'Hello world'"
✅ "Show my calendar"
✅ "What meetings do I have today?"
```

### Specific Requests
You can also be specific:

```
✅ "Search YouTube for [query]"
✅ "Post tweet: [text]"
✅ "List calendar events"
✅ "Send email to [email]"
```

## 🔜 Next Steps

Now that you have one integration working:

1. **Add more services**: Set up Google Calendar, Gmail
2. **Automate tasks**: "Every morning, show my calendar"
3. **Combine features**: "Search YouTube for [topic] and tweet the best video"
4. **Read full docs**: `EXTERNAL_INTEGRATIONS.md`

## 📚 Learn More

- Full documentation: `EXTERNAL_INTEGRATIONS.md`
- Environment setup: `ENV_SETUP_GUIDE.md`
- Technical details: `INTEGRATIONS_IMPLEMENTATION.md`

---

**Ready to connect?** Choose a service and get started! 🚀✨





