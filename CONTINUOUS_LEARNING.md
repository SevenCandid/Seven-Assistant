# 🧠 Continuous Learning System

## Overview

Seven AI Assistant now includes a **continuous learning** system that improves from user interactions. The system collects feedback, identifies patterns, and adapts to provide better responses over time.

## 🎯 Key Features

### 1. **User Feedback Collection**
- **Thumbs Up/Down**: Rate assistant responses with a single click
- **Correction Input**: Provide specific corrections when responses are incorrect
- **Context Preservation**: Feedback includes full conversation context

### 2. **Learning Insights**
- **Pattern Recognition**: Identifies recurring corrections
- **Frequency Tracking**: Tracks how often similar issues occur
- **Memory Integration**: Automatically applies insights to long-term memory

### 3. **Adaptive Responses**
- **Feedback Context**: Past corrections influence future responses
- **Mistake Avoidance**: Seven learns to avoid repeating errors
- **Continuous Improvement**: Gets smarter with each interaction

## 🚀 Usage

### Providing Feedback (UI)

After Seven responds:
1. **Thumbs Up** 👍: Good response, helps reinforce correct behavior
2. **Thumbs Down** 👎: Needs improvement
   - Optionally provide a correction: "You should have said..."
   - Skip correction if you just want to indicate poor quality

### Automatic Learning

The system automatically:
- Records all feedback with full context
- Identifies patterns in corrections (e.g., "User corrects 'X' to 'Y' repeatedly")
- Adds frequent corrections to LLM context
- Applies insights to memory after 2+ occurrences

## 📊 API Endpoints

### POST `/api/feedback/add`
Add user feedback (rating or correction).

**Request:**
```json
{
  "user_id": "user_123",
  "message_id": "msg_456",
  "feedback_type": "rating",  // or "correction"
  "rating": 1,  // 1 = thumbs up, -1 = thumbs down
  "correction": "The correct answer is...",  // optional
  "user_message": "Original user question",
  "assistant_response": "Seven's response"
}
```

**Response:**
```json
{
  "success": true,
  "feedback": {
    "id": 789,
    "user_id": "user_123",
    "created_at": "2024-01-01T12:00:00"
  }
}
```

### GET `/api/feedback/list/{user_id}`
Get feedback history for a user.

**Query Parameters:**
- `feedback_type` (optional): Filter by type ('rating' | 'correction')
- `limit` (optional): Max results (default: 50)

**Response:**
```json
{
  "success": true,
  "feedback": [
    {
      "id": 1,
      "user_id": "user_123",
      "message_id": "msg_456",
      "feedback_type": "rating",
      "rating": 1,
      "created_at": "2024-01-01T12:00:00"
    }
  ],
  "count": 1
}
```

### GET `/api/feedback/insights/{user_id}`
Get learning insights (patterns extracted from corrections).

**Query Parameters:**
- `min_frequency` (optional): Minimum occurrence count (default: 2)

**Response:**
```json
{
  "success": true,
  "insights": [
    {
      "id": 1,
      "user_id": "user_123",
      "insight_type": "correction",
      "pattern": "User asked about X",
      "correction": "Correct response is Y",
      "frequency": 3,
      "last_seen": "2024-01-01T12:00:00",
      "applied_to_memory": 1
    }
  ],
  "count": 1
}
```

### GET `/api/feedback/summary/{user_id}`
Get feedback statistics for a user.

**Response:**
```json
{
  "success": true,
  "total_feedback": 10,
  "positive_ratings": 7,
  "negative_ratings": 3,
  "corrections": 2,
  "learning_insights": 1
}
```

### POST `/api/feedback/apply-insights`
Manually apply learning insights to user memory.

**Request:**
```json
{
  "user_id": "user_123"
}
```

**Response:**
```json
{
  "success": true,
  "applied_count": 2,
  "message": "Applied 2 learning insights to memory"
}
```

## 🧠 How Learning Works

### 1. Feedback Collection
```
User gives thumbs down + correction
   ↓
System stores:
  - User message: "What's the capital of France?"
  - Assistant response: "The capital is Lyon"
  - Correction: "It's Paris"
  - Timestamp, context
```

### 2. Pattern Recognition
```
System checks for similar corrections:
  - Same or similar user messages
  - Same correction pattern
  
If found: Increment frequency counter
If new: Create new learning insight
```

### 3. Context Integration
```
When user sends new message:
  ↓
System retrieves learning insights
  ↓
Adds to LLM context:
  "USER FEEDBACK & CORRECTIONS:
   When asked about France's capital, correct answer is Paris.
   (Corrected 2 times)"
  ↓
LLM generates response with corrections in mind
```

### 4. Memory Application
```
After 2+ occurrences:
  ↓
System applies insight to long-term memory
  ↓
Marked as "applied_to_memory = 1"
  ↓
Persists across sessions
```

## 📈 Best Practices

### For Users

**Give Specific Corrections**
- ❌ Bad: "Wrong"
- ✅ Good: "The correct year is 2023, not 2024"

**Be Consistent**
- If you correct something once, correct it again if it happens
- Patterns need 2+ occurrences to become insights

**Use Thumbs Up Too**
- Positive feedback helps Seven understand what works
- Balances the learning process

### For Developers

**Monitor Feedback Quality**
```bash
curl http://localhost:5000/api/feedback/summary/user_123
```

**Review Learning Insights**
```bash
curl http://localhost:5000/api/feedback/insights/user_123
```

**Manually Apply Insights** (if needed)
```bash
curl -X POST http://localhost:5000/api/feedback/apply-insights \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123"}'
```

## 🔧 Database Schema

### `feedback` Table
```sql
CREATE TABLE feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    feedback_type TEXT NOT NULL,  -- 'rating' | 'correction' | 'clarification'
    rating INTEGER,  -- 1 or -1
    correction TEXT,
    user_message TEXT,
    assistant_response TEXT,
    context TEXT,  -- JSON
    created_at TEXT NOT NULL
);
```

### `learning_insights` Table
```sql
CREATE TABLE learning_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    insight_type TEXT NOT NULL,  -- 'correction'
    pattern TEXT,  -- User message pattern
    correction TEXT,  -- Correct response
    frequency INTEGER DEFAULT 1,
    last_seen TEXT NOT NULL,
    applied_to_memory INTEGER DEFAULT 0  -- Boolean
);
```

## 🛠️ Troubleshooting

### Feedback not working?

**Check backend:**
```bash
curl http://localhost:5000/api/feedback/summary/user_123
```

If error: Backend not running or feedback module not initialized

**Check logs:**
```bash
# Look for:
SUCCESS: Feedback system initialized
FEEDBACK: Recorded correction from user user_123
LEARNING: New correction pattern identified
```

### Corrections not being applied?

**Check insights:**
```bash
curl http://localhost:5000/api/feedback/insights/user_123?min_frequency=1
```

**Manually apply:**
```bash
curl -X POST http://localhost:5000/api/feedback/apply-insights \
  -H "Content-Type: application/json" \
  -d '{"user_id": "user_123"}'
```

**Check LLM context:**
- Look for "USER FEEDBACK & CORRECTIONS" in chat logs
- If not present, insights aren't being retrieved

### Thumbs up/down not appearing?

**Check console:**
- Open DevTools (F12)
- Look for errors related to `FeedbackButtons`

**Verify component:**
- Only shows on assistant messages
- Requires `userId` from `backendApi.getUserId()`

## 🔮 Future Enhancements

Planned features:
- [ ] Bulk feedback export
- [ ] Feedback analytics dashboard
- [ ] Community learning (shared insights across users)
- [ ] A/B testing for response improvements
- [ ] Automated insight application
- [ ] Feedback categories (accuracy, tone, helpfulness)
- [ ] Sentiment analysis on corrections

## 📚 Additional Resources

- `CONTINUOUS_LEARNING_QUICKSTART.md` - Quick setup guide
- `CONTINUOUS_LEARNING_IMPLEMENTATION.md` - Technical details
- Backend: `seven-ai-backend/core/feedback.py`
- Frontend: `src/ui/components/FeedbackButtons.tsx`

---

**Ready to start learning?** Give feedback and watch Seven improve! 🧠✨











