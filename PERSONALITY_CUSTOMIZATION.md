# Personality Customization - Seven AI Assistant

## Overview

Seven AI Assistant now features **customizable personality and tone** options! Users can choose how Seven communicates, from warm and friendly to professional and formal, with live previews of each personality style.

## Available Personalities

### 😊 Friendly (Default)
**Description:** Warm, approachable, and conversational

**Tone:** Casual and warm

**Example Responses:**
- "Hey! I'd be happy to help you with that!"
- "That's a great question! Let me explain..."
- "No worries! We'll figure this out together."

**Best For:** Casual conversations, general assistance, everyday interactions

---

### 💼 Professional
**Description:** Formal, precise, and business-like

**Tone:** Professional and formal

**Example Responses:**
- "I would be pleased to assist you with this matter."
- "Allow me to provide you with the information you require."
- "I shall address your inquiry with precision."

**Best For:** Business communications, formal settings, professional environments

---

### 😄 Humorous
**Description:** Witty, playful, and entertaining

**Tone:** Witty and playful

**Example Responses:**
- "Well, well, well... looks like someone needs help! (I'm your AI, not a genie, but close enough!)"
- "That's a fantastic question! Let me put on my thinking cap... *beep boop* 🤓"
- "Ah, the age-old question! Almost as old as 'which came first, the chicken or the egg?'"

**Best For:** Entertainment, light-hearted conversations, fun interactions

---

###😌 Calm
**Description:** Soothing, patient, and reassuring

**Tone:** Calm and reassuring

**Example Responses:**
- "Take a deep breath. Let's work through this together, one step at a time."
- "No rush at all. I'm here whenever you're ready to continue."
- "Everything's going to be just fine. Let me help you understand this."

**Best For:** Stress relief, learning, when you need patience and understanding

---

### 💪 Confident
**Description:** Assertive, direct, and knowledgeable

**Tone:** Confident and assertive

**Example Responses:**
- "Here's exactly what you need to do."
- "The answer is clear: let me break it down for you."
- "I've got this covered. Trust me on this one."

**Best For:** Quick answers, decisive guidance, when you need authoritative help

## How It Works

### Architecture

#### Backend Components

**`personality.py`** - Personality presets
```python
Location: seven-ai-backend/core/personality.py
```

Defines 5 personalities with:
- Name and description
- Tone description
- System prompt instructions
- Emoji representation

**`personality_routes.py`** - API endpoints
```python
Location: seven-ai-backend/routes/personality_routes.py
```

Endpoints:
- `POST /api/personality/set` - Set personality
- `GET /api/personality/get/{user_id}` - Get preference
- `GET /api/personality/available` - List all
- `GET /api/personality/preview/{name}` - Preview examples

**Integration:**
- `chat_routes.py` - Loads personality per user
- `utils.py` - Includes personality in system prompt
- `memory.py` - Stores as user fact

#### Frontend Components

**`PersonalitySelector.tsx`**
```typescript
Location: src/ui/components/PersonalitySelector.tsx
```

Features:
- Grid layout with personality cards
- Live preview with example responses
- Visual selection feedback
- Persistent storage

**`Settings.tsx`** - Integrated in settings panel

## Usage

### For Users

#### 1. Open Settings
Click the ⚙️ icon in the header

#### 2. Find Personality Section
Scroll to "🎭 AI Personality & Tone"

#### 3. Choose Your Personality
- Click on any personality card
- Click "👁️ Preview" to see examples
- Selection saves automatically

#### 4. Start Chatting!
Seven will now use your chosen personality in all responses

### Example User Flow

**Step 1:** Select "Professional"
```
User: "Can you help me?"
Seven: "I would be pleased to assist you with this matter. What specifically do you require?"
```

**Step 2:** Switch to "Humorous"
```
User: "Can you help me?"
Seven: "Of course! Help is my middle name! (Actually it's 'AI', but you get the idea 😄)"
```

**Step 3:** Try "Calm"
```
User: "Can you help me?"
Seven: "Of course. Take your time and tell me what you need. I'm here to help, no rush."
```

## API Documentation

### Set Personality

**Endpoint:** `POST /api/personality/set`

**Request:**
```json
{
  "user_id": "user123",
  "personality": "professional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Personality set to 💼 Professional: Formal, precise, and business-like",
  "personality": "professional",
  "description": "💼 Professional: Formal, precise, and business-like"
}
```

### Get Personality

**Endpoint:** `GET /api/personality/get/{user_id}`

**Response:**
```json
{
  "success": true,
  "personality": "friendly",
  "description": "😊 Friendly: Warm, approachable, and conversational",
  "details": {
    "name": "Friendly",
    "description": "Warm, approachable, and conversational",
    "tone_description": "casual and warm",
    "emoji": "😊"
  }
}
```

### List Available

**Endpoint:** `GET /api/personality/available`

**Response:**
```json
{
  "success": true,
  "personalities": {
    "friendly": {...},
    "professional": {...},
    "humorous": {...},
    "calm": {...},
    "confident": {...}
  },
  "default": "friendly",
  "count": 5
}
```

### Preview Examples

**Endpoint:** `GET /api/personality/preview/professional`

**Response:**
```json
{
  "success": true,
  "personality": {
    "name": "Professional",
    "description": "Formal, precise, and business-like",
    "tone_description": "professional and formal",
    "emoji": "💼"
  },
  "examples": [
    "I would be pleased to assist you...",
    "Allow me to provide you with...",
    "I shall address your inquiry..."
  ]
}
```

## Storage & Persistence

### Backend Storage
- Saved to user_memory table as fact
- Format: `preferred_personality: friendly`
- Persists across sessions
- Syncs across devices (same user_id)

### Frontend Storage
- Also saved to localStorage
- Key: `preferredPersonality`
- Used as backup when offline
- Loaded on component mount

### Priority
1. Backend (if userId available)
2. localStorage (backup)
3. Default (Friendly)

## Integration with Other Features

### Works With:
- ✅ **Emotion Detection** - Personality + emotion = perfect tone
- ✅ **Multi-language** - Personality maintained in any language
- ✅ **Conversation Context** - Personality consistent across topics
- ✅ **Long-term Memory** - Personal facts considered
- ✅ **All LLM Providers** - Works with Groq, Ollama, etc.

### Context Stack:
```
Base System Prompt
  + Personality & Tone (NEW!)
  + Emotional Context
  + Conversation Context
  + User Memory
  + Translation Context
  = Perfect Communication Style
```

## Customization

### Adding New Personalities

Edit `personality.py`:

```python
PERSONALITIES = {
    "your_personality": Personality(
        name="Your Personality",
        description="Short description",
        tone_description="tone style",
        system_prompt="""Your instructions here...""",
        emoji="🎯"
    )
}
```

### Modifying Existing

Change system prompts in `personality.py`:

```python
"friendly": Personality(
    name="Friendly",
    system_prompt="""Your custom instructions here...""",
    # ...
)
```

## Best Practices

### For Users:
1. ✅ Try the preview before selecting
2. ✅ Match personality to your use case
3. ✅ Professional for work, Friendly for casual
4. ✅ Calm when stressed or learning
5. ✅ Humorous for entertainment

### For Developers:
1. ✅ Keep personality prompts focused
2. ✅ Test with various queries
3. ✅ Balance personality with helpfulness
4. ✅ Don't let personality override accuracy
5. ✅ Consider user context

## Examples in Action

### Friendly Personality
```
User: "I don't understand this code"
Seven: "No worries! Let's break it down together. Which part is confusing you?"
```

### Professional Personality
```
User: "I don't understand this code"
Seven: "I shall provide you with a detailed explanation. Please indicate which section requires clarification."
```

### Humorous Personality
```
User: "I don't understand this code"
Seven: "Ah, the eternal programmer struggle! Don't worry, even code needs an interpreter sometimes 😄 Let me decode this for you!"
```

### Calm Personality
```
User: "I don't understand this code"
Seven: "That's perfectly okay. Take a breath. We'll go through it slowly, one line at a time."
```

### Confident Personality
```
User: "I don't understand this code"
Seven: "Here's exactly what's happening: [explanation]. You've got this."
```

## Performance

- **Overhead**: Minimal (~5ms)
- **Storage**: ~500 bytes per user
- **Network**: One-time fetch
- **Processing**: Instant switching

## Troubleshooting

### Issue: Personality not applying

**Check:**
1. Personality saved? (check backend logs)
2. User ID correct?
3. Settings page refreshed?

**Solution:**
```bash
# Check backend logs for:
🎭 User's preferred personality: friendly
```

### Issue: Preview not showing

**Check:**
1. Backend running?
2. Network connection?
3. Console errors?

**Solution:**
Restart backend and try again

### Issue: Personality inconsistent

**Possible Causes:**
- LLM not following instructions perfectly
- Mixed signals from other contexts
- Model limitations

**Solutions:**
- Try different personality
- Check system prompt in backend logs
- Adjust personality prompt if needed

## Future Enhancements

### Planned:
1. **Custom Personalities**: User-defined personalities
2. **Personality Mixing**: Blend two personalities
3. **Context-Based**: Auto-switch based on topic
4. **Voice Matching**: Match voice tone to personality
5. **More Presets**: Add more personality options
6. **Personality Learning**: Adapt over time
7. **Mood-Based**: Switch based on user emotion

## Credits

- **Design**: Custom personality system
- **UI**: Framer Motion animations
- **Storage**: User memory integration
- **Backend**: FastAPI endpoints

## Support

For issues or questions:
1. Check Settings → Personality section
2. Try preview to verify selection
3. Check backend logs for personality loading
4. Review this documentation
5. Test with different personalities

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
**Personalities:** 5 presets available





