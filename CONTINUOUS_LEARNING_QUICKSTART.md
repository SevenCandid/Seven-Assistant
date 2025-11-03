# 🧠 Continuous Learning - Quick Start

Get Seven learning from your feedback in 2 minutes!

## ⚡ Quick Setup

### Already Done!
The continuous learning system is **automatically enabled** when you start the backend. No additional setup required!

## 🎯 Quick Test

### Step 1: Start Backend
```bash
cd seven-ai-backend
python main.py
```

Look for:
```
SUCCESS: Feedback system initialized
```

### Step 2: Ask Seven Something

In the UI, ask:
> "What's 2 + 2?"

Seven responds:
> "2 + 2 equals 4"

### Step 3: Give Feedback

You'll see thumbs up 👍 and thumbs down 👎 buttons below Seven's response.

**Try thumbs down:**
1. Click 👎
2. A correction box appears
3. Enter: "You should also mention that this is basic arithmetic"
4. Click "Submit Correction"

### Step 4: Ask Again

Ask the same or similar question:
> "What is 3 + 3?"

Seven now incorporates your feedback!

## 📊 Check Your Feedback

### View Summary
```bash
curl http://localhost:5000/api/feedback/summary/$(cat <<< 'user_YOUR_ID')
```

Or in browser:
```
http://localhost:5000/api/feedback/summary/user_1234567890_abc
```

### View Insights
```bash
curl http://localhost:5000/api/feedback/insights/user_1234567890_abc
```

##  Real-World Example

### Scenario: Company Name Correction

**1. Seven gets it wrong:**
> User: "What's our company name?"
> Seven: "I don't have that information"
>
> User clicks 👎
> User enters correction: "Our company name is Acme Corp"

**2. Seven learns the pattern:**
- Correction stored
- Learning insight created
- Frequency: 1

**3. User asks again:**
> User: "Who do we work for?"
>
> Seven now knows: "You work for Acme Corp"

**4. After 2+ corrections:**
- Insight applied to long-term memory
- Persists across sessions
- Available in all future conversations

## 💡 Pro Tips

### Tip 1: Be Specific
```
❌ "Wrong"
✅ "The meeting is on Thursday, not Friday"
```

### Tip 2: Use Thumbs Up Too
Positive reinforcement helps Seven understand what works:
```
Seven: "Would you like me to schedule that?"
You: 👍 (Great question!)
```

### Tip 3: Correct Consistently
If Seven makes the same mistake twice, correct it both times. The system needs 2+ occurrences to create a strong learning insight.

### Tip 4: Check Insights
See what Seven has learned:
```bash
curl http://localhost:5000/api/feedback/insights/YOUR_USER_ID?min_frequency=1
```

## 🧪 Advanced Testing

### Test Pattern Recognition

**Give the same correction twice:**

1. Ask: "What's my manager's name?"
   - Seven: "I don't know"
   - You: 👎 "My manager is Sarah Johnson"

2. Ask: "Who's my boss?"
   - Seven: "I don't have that info"
   - You: 👎 "My manager is Sarah Johnson"

3. Ask: "Who do I report to?"
   - Seven should now mention Sarah Johnson!

### Test Memory Integration

```bash
# Apply insights to memory
curl -X POST http://localhost:5000/api/feedback/apply-insights \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID"}'

# Check result
curl http://localhost:5000/api/feedback/insights/YOUR_USER_ID
```

### Test Feedback Context

Check logs when asking a question:
```
FEEDBACK: Retrieved correction context for user
```

This means Seven is using past corrections!

## 📱 Using in the UI

### Desktop
1. Chat with Seven
2. See 👍👎 below each response
3. Click to rate
4. For 👎, optionally add correction

### Mobile
Works the same! Buttons are touch-friendly.

## 🛠️ Troubleshooting

### Issue: Buttons not showing
**Check console (F12):**
```javascript
console.log('FeedbackButtons loaded:', !!window.FeedbackButtons);
```

**Solution:** Refresh the page

### Issue: Feedback not saving
**Test directly:**
```bash
curl -X POST http://localhost:5000/api/feedback/add \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "message_id": "test_msg",
    "feedback_type": "rating",
    "rating": 1
  }'
```

**Expected:**
```json
{
  "success": true,
  "feedback": {
    "id": 1
  }
}
```

### Issue: Corrections not being used
**Check insights:**
```bash
curl http://localhost:5000/api/feedback/insights/YOUR_USER_ID?min_frequency=1
```

**If empty:** You need to give at least 2 similar corrections

**If not empty:** Check chat logs for "FEEDBACK: Retrieved correction context"

## 🚀 Next Steps

Now that it works:

1. **Use it regularly**: The more feedback, the smarter Seven gets
2. **Check insights weekly**: See what patterns emerge
3. **Share with team**: Everyone's feedback improves the system
4. **Read full docs**: `CONTINUOUS_LEARNING.md` for advanced features

## 📚 Learn More

- Full documentation: `CONTINUOUS_LEARNING.md`
- Technical details: `CONTINUOUS_LEARNING_IMPLEMENTATION.md`
- API reference: See `/api/feedback/*` endpoints

---

**Start giving feedback and watch Seven get smarter!** 🧠✨











