# 🎤 Wake Word - Quick Test Guide

## ⚡ Quick Fix Applied

I've improved the wake word system to:
1. ✅ Prevent conflicts with manual voice input
2. ✅ Add detailed logging for debugging
3. ✅ Better error messages

---

## 🧪 Test It Now (2 Minutes)

### Step 1: Open Console (10 seconds)
```
Press F12
Click "Console" tab
Keep it open
```

### Step 2: Enable Wake Word (5 seconds)
```
1. Click ☰ (hamburger menu)
2. Click ⚙️ Settings
3. Find "👂 Wake Word"
4. Toggle ON
5. Close Settings
```

### Step 3: Check Console (5 seconds)
**Look for:**
```
👂 Starting wake word detection...
🎯 Listening for: "seven"
✅ Wake word detector started successfully
```

**If you see ❌ errors instead:**
- Check microphone permission (click padlock icon in address bar)
- Allow microphone
- Refresh page
- Try again

### Step 4: Say "Seven" (10 seconds)
```
Say clearly: "Seven"
Pause
Watch console
```

**Should see:**
```
👂 Wake word listening... heard: seven
✨ WAKE WORD DETECTED: seven
🎤 Activating voice input...
```

**If nothing happens:**
- Speak louder
- Try again
- Check microphone is working (Settings → Sound)

### Step 5: Voice Input Activates
```
🎤 Button turns red
"Speak now..." appears
Say your question
AI responds
```

---

## 🎯 What Wake Word Does

```
You: "Seven"
     ↓
👂 Wake word detected
     ↓
🎤 Voice input activates
     ↓
You: "What time is it?"
     ↓
🤖 AI responds
```

---

## ⚠️ Common Issues

### "I don't see any console messages"

**Fix:**
1. Refresh page (Ctrl+R)
2. Open console BEFORE enabling wake word
3. Try toggling wake word OFF then ON

### "Console shows error about microphone"

**Fix:**
1. Click padlock/info icon in address bar
2. Microphone → Allow
3. Refresh page (Ctrl+R)
4. Enable wake word again

### "Wake word worked once then stopped"

**This is normal!**
- Wake word activates voice input
- After AI responds, wake word re-enables
- Say "Seven" again for next query

### "Console shows 'heard: [something else]'"

**Microphone is working! Try:**
- Speak more clearly
- Say "Seven" (not "Hey Seven" or "Seven AI")
- Try a few times
- Check background noise

---

## 🔍 Console Messages Explained

| Message | Meaning | Action |
|---------|---------|--------|
| `✅ Wake word detector started` | Working! | Say "Seven" |
| `👂 heard: [text]` | Microphone works! | Keep trying |
| `✨ WAKE WORD DETECTED` | Success! | Voice activating |
| `❌ Failed to start` | Permission issue | Allow mic |
| `⚠️ not available` | Browser issue | Try Chrome |

---

## 💡 Pro Tips

1. **Wait for "✅ started" message before speaking**
2. **Say just "Seven" (not "Hey Seven")**
3. **Speak at normal volume, clearly**
4. **Wait 1 second between attempts**
5. **Check console after each attempt**

---

## 🆘 Still Not Working?

### Option 1: Use Manual Voice Button
Instead of wake word:
1. Click **🎤** button
2. Speak your question
3. Works the same way!

### Option 2: Enable Continuous Voice Mode
1. Settings → Continuous Voice Mode → ON
2. AI keeps listening after each response
3. No wake word needed!

### Option 3: Debug with Full Guide
See `WAKE_WORD_FIX.md` for:
- Detailed troubleshooting
- Browser compatibility
- Advanced debugging
- Permission issues

---

## 📊 Quick Checklist

Before testing, make sure:

- [ ] Console is open (F12)
- [ ] Wake word is enabled in Settings
- [ ] Console shows "✅ Wake word detector started"
- [ ] Microphone permission granted
- [ ] Using Chrome or Edge browser
- [ ] Not in Incognito/Private mode
- [ ] No other apps using microphone
- [ ] Background noise is minimal

---

## ✅ Success Looks Like

```
Console:
👂 Starting wake word detection...
🎯 Listening for: "seven"
✅ Wake word detector started successfully

[Say "Seven"]

👂 Wake word listening... heard: seven
✨ WAKE WORD DETECTED: seven
🎤 Activating voice input...

Screen:
🎤 Button turns RED
"Speak now..." appears
Voice input is active!
```

---

## 🎉 Test Result

After following the steps:

**✅ Working:** You see console logs and voice activates
- Great! Use wake word anytime
- Say "Seven" → Ask question → AI responds

**❌ Not Working:** No console logs or errors
- Use manual 🎤 button instead
- Enable Continuous Voice Mode
- Check `WAKE_WORD_FIX.md` for detailed debugging

---

**Try the test now and check your console!** 🔍

**Console Shortcut: F12 → Console tab**













