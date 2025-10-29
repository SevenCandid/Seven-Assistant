# Emotional Intelligence Layer - Seven AI Assistant

## Overview

Seven AI Assistant now includes an **Emotional Intelligence** layer that detects user sentiment and emotions from text messages and voice tone, then adjusts its response accordingly to be more empathetic and contextually appropriate.

## Features

### 1. **Text Sentiment Analysis**
- Uses DistilBERT model fine-tuned on SST-2 dataset
- Detects emotions: happy, sad, angry, worried, excited, grateful, confident, frustrated, neutral
- Returns confidence scores for each detection

### 2. **Voice Emotion Detection** (Optional)
- Analyzes pitch, intensity, and tempo from voice audio
- Provides additional emotional context from vocal tone
- Combines with text analysis for more accurate detection

### 3. **Empathetic Response Generation**
- LLM receives emotion context in system prompt
- Adjusts tone and approach based on detected emotion
- Examples:
  - **Sad**: Responds with empathy, support, and gentleness
  - **Angry**: Remains calm, understanding, solution-oriented
  - **Excited**: Matches energy and enthusiasm
  - **Worried**: Provides reassurance and clear guidance

### 4. **Visual Emotion Indicators**
- Emotion badges displayed next to user messages
- Animated emoji indicators
- Confidence percentage shown
- Color-coded by emotion type

## Architecture

### Backend Components

#### 1. `emotion.py` - Core Emotion Detection Module
```
Location: seven-ai-backend/core/emotion.py
```

**Key Classes:**
- `EmotionDetector`: Main class for emotion detection
  - `analyze_text()`: Analyzes text sentiment
  - `analyze_voice()`: Analyzes voice audio features
  - `analyze_combined()`: Combines text and voice analysis
  - `get_emotion_prompt()`: Generates LLM prompt fragment

**Supported Emotions:**
| Emotion | Description | Detection Method |
|---------|-------------|------------------|
| happy | Cheerful and positive | High positive sentiment + keywords |
| sad | Down or melancholic | High negative sentiment + sadness keywords |
| angry | Frustrated or upset | High negative sentiment + anger keywords |
| worried | Anxious or concerned | Negative sentiment + worry keywords |
| excited | Enthusiastic and energetic | Very high positive + excitement keywords |
| grateful | Thankful and appreciative | Positive + gratitude keywords |
| confident | Assured and positive | Moderate positive sentiment |
| frustrated | Annoyed or irritated | Negative + frustration keywords |
| neutral | Calm and balanced | Low confidence or neutral sentiment |

#### 2. `emotion_routes.py` - API Endpoints
```
Location: seven-ai-backend/routes/emotion_routes.py
```

**Endpoints:**
- `POST /api/emotion/text` - Analyze text emotion
- `POST /api/emotion/voice` - Analyze voice emotion
- `POST /api/emotion/combined` - Analyze combined text + voice
- `GET /api/emotion/status` - Check emotion detection availability

#### 3. Integration with Chat System
```
Location: seven-ai-backend/routes/chat_routes.py
```

**Automatic Integration:**
- Every user message is automatically analyzed for emotion
- Emotion context is added to LLM system prompt
- Emotion data is returned with chat response

### Frontend Components

#### 1. `EmotionIndicator.tsx` - Visual Components
```
Location: src/ui/components/EmotionIndicator.tsx
```

**Components:**
- `<EmotionIndicator />`: Full emotion display with label
- `<EmotionBadge />`: Compact emoji badge for messages

**Features:**
- Animated emoji that pulses
- Color-coded backgrounds
- Confidence percentage
- Hover tooltips with details

#### 2. Integration with Message List
```
Location: src/ui/components/MessageList.tsx
```

**Display:**
- Emotion badges appear next to user messages
- Only shown when emotion is detected (not neutral)
- Inline with role indicator

#### 3. Hook Updates
```
Location: src/ui/hooks/useAIAssistant.ts
```

**Changes:**
- Added `EmotionData` interface
- Messages now include optional `emotion` field
- Emotion data automatically attached from backend response

## Usage

### Automatic Operation

The emotional intelligence layer works automatically with no code changes required:

1. User sends a message
2. Backend analyzes text for emotion
3. Emotion context added to LLM prompt
4. LLM responds with appropriate tone
5. Frontend displays emotion badge

### Example Flow

**User Message:** "I'm so frustrated with this bug! It's been hours!"

**Detected Emotion:**
```json
{
  "emotion": "frustrated",
  "sentiment": "negative",
  "confidence": 0.92,
  "description": "annoyed or irritated",
  "source": "text"
}
```

**System Prompt Addition:**
```
EMOTIONAL CONTEXT:
The user seems frustrated. Be patient, understanding, and solution-oriented. (Detected from message)
```

**AI Response:**
> "I understand how frustrating debugging can be, especially after hours of work. Let's tackle this together. Can you describe what the bug is doing? I'll help you find a solution."

### API Examples

#### Analyze Text Emotion

```bash
curl -X POST http://localhost:5000/api/emotion/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so happy today!"}'
```

**Response:**
```json
{
  "success": true,
  "emotion": {
    "emotion": "happy",
    "sentiment": "positive",
    "confidence": 0.95,
    "description": "cheerful and positive",
    "source": "text"
  }
}
```

#### Check Status

```bash
curl http://localhost:5000/api/emotion/status
```

**Response:**
```json
{
  "success": true,
  "available": true,
  "features": {
    "text_analysis": true,
    "voice_analysis": true,
    "combined_analysis": true
  },
  "supported_emotions": [
    "happy", "sad", "angry", "worried", 
    "excited", "grateful", "confident", "frustrated", "neutral"
  ]
}
```

## Dependencies

### Backend Requirements

Already included in `requirements.txt`:

```python
transformers==4.36.0  # Sentiment analysis models
torch==2.1.2          # PyTorch for transformers
librosa==0.10.1       # Audio analysis (pitch, intensity)
soundfile==0.12.1     # Audio file I/O
```

### Model Download

The DistilBERT model will be automatically downloaded on first use (approx. 250MB).

## Configuration

### Disabling Emotion Detection

If you want to disable emotion detection:

**Option 1: Backend Level**
```python
# In chat_routes.py, comment out emotion detection:
# emotion_data = emotion_detector.analyze_text(request.message)
```

**Option 2: Frontend Level**
```tsx
// In MessageList.tsx, hide emotion badges:
{/* message.role === 'user' && message.emotion && (
  <EmotionBadge emotion={message.emotion} />
) */}
```

### Adjusting Sensitivity

To adjust emotion detection sensitivity, modify thresholds in `emotion.py`:

```python
def _map_sentiment_to_emotion(self, sentiment: str, confidence: float, text: str) -> str:
    if sentiment == "POSITIVE":
        if confidence > 0.85:  # Adjust this threshold (default: 0.85)
            # ... emotion logic
```

## Performance

### Text Analysis
- **Speed**: ~100-200ms per message (CPU)
- **GPU**: ~20-50ms per message (if available)
- **Model Size**: ~250MB
- **Memory**: ~500MB RAM

### Voice Analysis
- **Speed**: ~200-500ms per audio clip
- **Audio Format**: WAV, MP3, OGG supported
- **Sample Rate**: 16000 Hz recommended

## Troubleshooting

### Issue: "Emotion detection not available"

**Solution:**
1. Check if transformers and torch are installed:
   ```bash
   pip install transformers torch
   ```

2. Verify model can download:
   ```python
   python -c "from transformers import pipeline; pipeline('sentiment-analysis')"
   ```

3. Check backend logs for detailed error messages

### Issue: Emotion always shows as "neutral"

**Possible Causes:**
- Model not loaded properly
- Text too short or ambiguous
- Confidence threshold too high

**Solution:**
- Check backend console for emotion detection logs
- Ensure text has clear emotional indicators
- Lower confidence thresholds in `emotion.py`

### Issue: Emotion badge not displaying

**Checklist:**
1. Check browser console for errors
2. Verify emotion data in message object
3. Ensure `EmotionIndicator.tsx` is imported correctly
4. Check if emotion is "neutral" (not displayed by default)

## Future Enhancements

### Potential Improvements:
1. **Fine-tune for conversations**: Custom training on conversational data
2. **Emotion history**: Track emotional patterns over sessions
3. **Emotional intelligence analytics**: Dashboard for emotion trends
4. **Multi-language support**: Emotion detection for other languages
5. **Custom emotion categories**: Add domain-specific emotions
6. **Emotion-based recommendations**: Suggest actions based on mood
7. **Voice emotion real-time**: Analyze during speech recognition

## Testing

### Manual Testing

1. **Test Happy Emotion:**
   - Send: "I'm so happy and excited about this project!"
   - Expected: 😊 or 🤩 emoji badge

2. **Test Sad Emotion:**
   - Send: "I'm feeling really down and sad today"
   - Expected: 😢 emoji badge + empathetic response

3. **Test Angry Emotion:**
   - Send: "This is so frustrating! I hate when this happens!"
   - Expected: 😠 or 😤 emoji badge + calm, solution-oriented response

4. **Test Neutral:**
   - Send: "What's the weather like?"
   - Expected: No emoji badge (neutral)

### API Testing

Use the test script:

```bash
# Test emotion detection
curl -X POST http://localhost:5000/api/emotion/text \
  -H "Content-Type: application/json" \
  -d '{"text": "I love this new feature!"}'
```

## Privacy Considerations

- **Local Processing**: Emotion detection runs on your server (not sent to external services)
- **No Data Storage**: Emotion data is not permanently stored (only in session)
- **Optional Feature**: Can be disabled without affecting core functionality
- **User Control**: Users can see what emotion was detected (transparent)

## Credits

- **DistilBERT Model**: Hugging Face Transformers
- **SST-2 Dataset**: Stanford Sentiment Treebank
- **Librosa**: Audio analysis library
- **Design**: Custom emotion indicator components

## Support

For issues or questions about the Emotional Intelligence feature:
1. Check logs in `seven-ai-backend` console
2. Review this documentation
3. Check GitHub issues
4. Contact the development team

---

**Last Updated:** October 26, 2025
**Version:** 1.0.0
**Status:** ✅ Production Ready





