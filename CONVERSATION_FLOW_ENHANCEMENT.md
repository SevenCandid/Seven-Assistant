# Conversation Flow Enhancement - Seven AI Assistant

## Overview

Seven AI Assistant now features **intelligent conversation flow** with multi-turn context tracking, topic detection, and smooth transitions between subjects. The AI maintains awareness of ongoing topics and adapts naturally when conversations shift.

## Key Features

### 🎯 Multi-Turn Context Management
- Tracks conversation topics automatically
- Maintains last 3 topics for reference
- Understands when topics change
- Provides smooth transitions between subjects

### 🔍 Topic Detection
- Uses zero-shot classification (BART model)
- Detects 16 conversation categories
- Confidence scoring for accuracy
- Keyword extraction per topic

### 💬 Natural Transitions
- Acknowledges topic shifts smoothly
- Uses transitional phrases naturally
- Maintains conversation coherence
- Remembers context across turns

### 🔄 "New Topic" Command
- User can manually reset context
- Keeps long-term memory intact
- Clears current topic only
- Enables fresh conversation start

## Architecture

### Backend Components

#### 1. `conversation_context.py` - Topic Tracking Engine

```python
Location: seven-ai-backend/core/conversation_context.py
```

**Key Classes:**

**`ConversationTopic`**: Represents a single topic
- Stores topic name, keywords, messages
- Tracks confidence and timing
- Maintains message history
- Generates summaries

**`ConversationContext`**: Manages overall conversation flow
- `detect_topic()`: Identifies conversation topic
- `update_context()`: Updates after each exchange
- `get_context_summary()`: Generates context for LLM
- `check_for_topic_reset()`: Detects "new topic" commands
- `reset_current_topic()`: Clears current context
- `get_transition_prompt()`: Generates smooth transitions

**Supported Topics:**
- greeting
- weather
- technology
- programming
- personal_life
- work
- entertainment
- food
- travel
- health
- sports
- news
- education
- finance
- shopping
- general_conversation

#### 2. `memory.py` - Context Persistence

**New Methods:**
- `save_conversation_context()`: Stores topic data
- `get_conversation_context()`: Loads saved context
- `clear_conversation_context()`: Removes for "new topic"

**New Table:**
```sql
CREATE TABLE conversation_context (
    id INTEGER PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    context_data TEXT NOT NULL,
    updated_at TIMESTAMP,
    UNIQUE(session_id)
)
```

#### 3. `utils.py` - Enhanced System Prompt

**Updated `format_conversation_for_llm()`:**
- Added `conversation_context` parameter
- Includes topic awareness in system prompt
- Instructs LLM on smooth transitions
- Maintains coherence across turns

**New Rules in System Prompt:**
```
5. Remember the ongoing conversation topics and transition naturally when user changes context
6. When the topic shifts, acknowledge it smoothly (e.g., "Speaking of that..." or "That reminds me...")
7. Maintain coherence across multiple turns of conversation
```

#### 4. `chat_routes.py` - Integration

**Conversation Flow:**
1. Load conversation context from database
2. Check for "new topic" command
3. Detect emotion (existing feature)
4. Generate conversation context summary
5. Add transition prompts if topic changed
6. Send to LLM with full context
7. Update conversation context
8. Save back to database
9. Return with context metadata

## How It Works

### Example Conversation Flow

**Turn 1:**
```
User: "What's the weather like today?"
→ Topic detected: weather
→ Context: First message, no transition needed
AI: "I can help you check the weather. What city are you in?"
```

**Turn 2:**
```
User: "San Francisco"
→ Topic detected: weather (same topic)
→ Context: Continuing weather discussion (2 messages)
AI: "Let me check San Francisco weather for you..."
```

**Turn 3:**
```
User: "By the way, can you help me with Python?"
→ Topic detected: programming (NEW TOPIC!)
→ Context: Recent topics: weather, programming
→ Transition: Moving from weather to programming
AI: "Of course! Speaking of which, I'd be happy to help with Python. What specifically would you like to know?"
```

### Topic Change Detection

The system detects topic changes through:
1. **Zero-shot classification** - Compares message to 16 topic categories
2. **Confidence threshold** - High confidence indicates clear topic
3. **Keyword analysis** - Extracts relevant keywords per topic
4. **History tracking** - Compares to previous topics

### Smooth Transitions

When a topic changes, Seven:
1. Detects the shift automatically
2. Generates transition prompt for LLM
3. LLM acknowledges naturally (e.g., "Regarding your question about...")
4. Maintains conversation flow

## Usage

### Automatic Operation

**No configuration needed!** The system works automatically:

1. **Start chatting** - Topics tracked automatically
2. **Change subjects** - Smooth transitions happen naturally
3. **Use "new topic"** - Reset context manually if desired

### "New Topic" Command

Users can manually reset context:

**Trigger Phrases:**
- "new topic"
- "change topic"
- "different topic"
- "talk about something else"
- "let's talk about"
- "anyway"
- "by the way"
- "speaking of which"
- "on a different note"

**Example:**
```
User: "new topic - tell me about machine learning"
→ Context reset
→ Previous topics saved to history
→ Fresh start on new subject
AI: "Sure! Let's talk about machine learning. What aspect interests you?"
```

## API Response Data

### Conversation Metadata

Every chat response includes:

```json
{
  "conversation": {
    "current_topic": "programming",
    "topic_changed": true,
    "topic_history": [
      "weather (discussed in 2 messages)",
      "programming (discussed in 1 messages)"
    ],
    "message_count": 1
  }
}
```

### Context Information

Backend logs show:
```
📚 Loaded conversation context for session: abc123
📋 Detected topic: programming (confidence: 0.89)
🔄 Topic changed to: programming
💬 Context updated: programming (topic changed: True)
```

## Configuration

### Topic Categories

To add custom topics, edit `conversation_context.py`:

```python
DEFAULT_TOPICS = [
    "greeting",
    "weather",
    "your_custom_topic",  # Add here
    ...
]
```

### Reset Phrases

To add custom "new topic" phrases, edit `check_for_topic_reset()`:

```python
reset_phrases = [
    "new topic",
    "your_custom_phrase",  # Add here
    ...
]
```

### Context History

Change number of tracked topics (default: 3):

```python
# In update_context() method
if len(self.current_topics) > 3:  # Change this number
    self.current_topics = self.current_topics[-3:]
```

## Performance

### Topic Detection Speed
- **Classification**: ~200-500ms (first time)
- **Cached**: ~50-100ms (subsequent)
- **Keyword Extraction**: ~5-10ms
- **Total Overhead**: ~250-600ms per message

### Optimization
- Lazy loading of classifier model
- Model loaded once and cached
- Context stored in database
- Minimal memory footprint

### Model Size
- **facebook/bart-large-mnli**: ~1.6GB
- Downloads automatically on first use
- Cached in `~/.cache/huggingface/`

## Troubleshooting

### Issue: Topic detection not working

**Solution:**
1. Check if transformers installed:
   ```bash
   pip list | grep transformers
   ```

2. Install if missing:
   ```bash
   pip install transformers torch
   ```

3. Restart backend:
   ```bash
   python main.py
   ```

**Look for:**
```
🧠 Loading topic classifier...
✅ Topic classifier loaded
```

### Issue: Wrong topic detected

**Possible Causes:**
- Very short messages
- Ambiguous content
- Mixed topics in one message

**Solutions:**
- Use longer, clearer messages
- Stick to one topic per message
- Check backend logs for confidence scores
- Low confidence (< 0.5) means uncertain

### Issue: No smooth transitions

**Check:**
- Topic actually changed? (see logs)
- LLM receiving transition prompt?
- System prompt includes transition rules?

**Debug:**
```
💬 Context updated: {topic} (topic changed: {bool})
```

### Issue: Context not persisting

**Checklist:**
1. Database initialized? (check `data/memory.db`)
2. Session ID consistent?
3. No errors saving context?
4. Check backend logs for save confirmation

## Best Practices

### For Users:
1. ✅ Be clear when changing topics
2. ✅ Use "new topic" for major shifts
3. ✅ Let natural transitions happen
4. ✅ Provide context in messages

### For Developers:
1. ✅ Monitor topic detection logs
2. ✅ Track confidence scores
3. ✅ Test with various conversation flows
4. ✅ Handle context load failures gracefully
5. ✅ Clear context on new chat sessions

## Examples

### Example 1: Natural Topic Flow

```
User: "What's the weather?"
AI: "I can help with that! What city?"
Context: weather (1 msg)

User: "Los Angeles"
AI: "Let me check LA weather..."
Context: weather (2 msgs)

User: "Actually, can you help me code?"
AI: "Sure! Moving on from weather, I'd be happy to help with coding. What are you working on?"
Context: weather → programming
```

### Example 2: Multiple Topic Shifts

```
User: "Tell me about Python"
Context: programming (1 msg)

User: "What about React?"
Context: programming (2 msgs)

User: "By the way, what's for dinner?"
AI: "Ha! Shifting gears from programming to food - what kind of cuisine do you like?"
Context: programming → food
```

### Example 3: Manual Reset

```
User: "We've been talking about tech for a while"
Context: technology (5 msgs)

User: "new topic - let's discuss travel"
AI: "Absolutely! Fresh topic - travel. Where would you like to go?"
Context: RESET → travel (1 msg)
```

## Integration with Other Features

### Works With:
- ✅ Emotion Detection - Topics + emotions = richer context
- ✅ Multi-language - Topics detected in any language
- ✅ Long-term Memory - Personal context preserved
- ✅ Voice Input - Topics tracked from speech
- ✅ All LLM Providers - Works with Groq, Ollama, etc.

### Context Layers:
```
System Prompt
    ↓
+ Emotional Context
    ↓
+ Conversation Context (topics)
    ↓
+ User Memory (long-term)
    ↓
+ Translation Context
    ↓
= Rich, Context-Aware Response
```

## Future Enhancements

### Planned Features:
1. **Topic Recommendations**: Suggest related topics
2. **Conversation Summaries**: Auto-generate after N messages
3. **Topic Branching**: Handle multi-threaded conversations
4. **Custom Topic Models**: Train on domain-specific data
5. **Visualization**: Show topic flow in UI
6. **Topic Bookmarks**: Save and return to topics
7. **Cross-Session Topics**: Track across sessions

## Credits

- **BART Model**: Facebook AI (facebook/bart-large-mnli)
- **Transformers**: Hugging Face
- **Zero-Shot Classification**: Task framework
- **Design**: Custom conversation flow engine

## Support

For issues or questions:
1. Check backend logs for topic detection
2. Verify transformers package installed
3. Review this documentation
4. Test with clear topic changes
5. Check database for stored context

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready
**Model:** facebook/bart-large-mnli (1.6GB)











