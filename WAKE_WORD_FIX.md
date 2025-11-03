# 🎤 Wake Word Fix & Debug Guide

## ✅ What I Fixed

### 1. **Improved Wake Word Management**
- Wake word detector now properly stops when you're actively listening
- Only runs when NOT using voice input (prevents conflicts)
- Auto-restarts when listening stops

### 2. **Enhanced Logging**
- Added detailed console logs to track wake word activity
- Shows what the wake word detector is hearing
- Displays clear error messages with troubleshooting tips

### 3. **Better Error Handling**
- Identifies common issues (permissions, browser conflicts)
- Provides helpful hints for fixing problems
- Gracefully handles speech recognition conflicts

---

## 🔍 How to Debug Wake Word

### Step 1: Open Browser Console

1. **Press F12** (or right-click → Inspect)
2. Click **Console** tab
3. Keep it open while testing

### Step 2: Enable Wake Word

1. Open Settings (⚙️)
2. Find "Wake Word" toggle
3. Turn it **ON**
4. Watch console for messages

### Step 3: Test Wake Word

1. Say **"Seven"** (just the word "Seven")
2. Watch for console messages
3. Voice input should activate

---

## 👀 What to Look For in Console

### ✅ Success Messages

```
👂 Starting wake word detection...
🎯 Listening for: "seven"
💡 Make sure microphone permission is granted
✅ Wake word detector started successfully

👂 Wake word listening... heard: seven
✨ WAKE WORD DETECTED: seven
🎤 Activating voice input...
```

### ❌ Error Messages

**No Speech Recognition:**
```
⚠️ Wake word detection: Speech recognition not available
💡 Tip: Wake word requires microphone permission...
```

**Microphone Permission:**
```
❌ Failed to start wake word detection
💡 Possible causes:
   - Microphone permission not granted
   - Another speech recognition instance is running
   - Browser doesn't support continuous speech recognition
```

---

## 🐛 Common Issues & Fixes

### Issue 1: Wake Word Not Detecting

**Problem:** You say "Seven" but nothing happens

**Solutions:**

#### A. Check Microphone Permission

**Chrome:**
1. Click padlock/info icon in address bar
2. Click "Site settings"
3. Find "Microphone"
4. Select "Allow"
5. Refresh page

**Edge:**
1. Click padlock icon
2. "Permissions for this site"
3. Microphone → "Allow"
4. Refresh page

**Firefox:**
1. Click padlock icon
2. "Connection secure" → "More information"
3. "Permissions" tab
4. Microphone → "Allow"
5. Refresh page

#### B. Test Microphone

1. Say something else (not "seven")
2. Check console for: `👂 Wake word listening... heard: [your words]`
3. If you don't see this, microphone isn't working

#### C. Check Browser Support

**Supported:**
- ✅ Chrome/Edge (Windows, Mac, Android)
- ✅ Safari (Mac, iOS - with limitations)
- ⚠️ Firefox (limited support)

**Not Supported:**
- ❌ Incognito/Private mode (some browsers)
- ❌ HTTP sites (requires HTTPS or localhost)

---

### Issue 2: Wake Word Sometimes Works

**Problem:** Wake word works randomly or stops working

**Cause:** Speech recognition can only have ONE instance running at a time

**Solutions:**

1. **Don't use manual voice button and wake word together**
   - If voice input is active (🎤 button red), wake word is disabled
   - Wait for voice input to finish

2. **Check for conflicts**
   - Close other apps/tabs using microphone
   - Only one instance of Seven AI should be open

3. **Restart wake word**
   - Toggle wake word OFF then ON in Settings
   - Watch console for restart messages

---

### Issue 3: Wake Word Starts But Doesn't Hear

**Problem:** Console shows "started" but doesn't hear anything

**Solutions:**

1. **Check Microphone Level**
   - Windows: Settings → System → Sound → Input device
   - Mac: System Preferences → Sound → Input
   - Speak and watch level indicator move

2. **Test in Quiet Environment**
   - Background noise can interfere
   - Speak clearly and loudly
   - Try: "Seven" (pause) "Seven" (pause) "Seven"

3. **Check Default Microphone**
   - Make sure correct mic is selected in OS
   - Headset mic vs laptop mic
   - Refresh page after changing

---

### Issue 4: Permission Denied

**Problem:** Console shows "not-allowed" or "permission denied"

**Solutions:**

1. **Browser blocked it**
   - Look for blocked icon in address bar
   - Click it and allow microphone
   - Refresh page

2. **System blocked it**
   - **Windows:** Settings → Privacy → Microphone → Allow apps
   - **Mac:** System Preferences → Security & Privacy → Microphone
   - **Check browser is allowed**

3. **Try localhost or HTTPS**
   - HTTP sites may block microphone
   - Use `http://localhost:5173` instead of IP address
   - Or use HTTPS

---

## 🧪 Testing Steps

### Quick Test

1. **Enable wake word** in Settings
2. **Check console** for "✅ Wake word detector started"
3. **Say "Seven"** clearly
4. **Watch console** for "✨ WAKE WORD DETECTED"
5. **Voice input activates** (🎤 button turns red)

### Full Test

```
1. Open app: http://localhost:5173
2. Open console (F12)
3. Open Settings (⚙️)
4. Enable "Wake Word" toggle
5. Close Settings
6. Say "Seven"
7. Check console:
   👂 Wake word listening... heard: seven
   ✨ WAKE WORD DETECTED: seven
   🎤 Activating voice input...
8. Voice input should be active now
9. Say your question
10. AI responds
```

---

## 🎯 Wake Word Behavior

### When Wake Word is ON

| Situation | Wake Word Status | Why |
|-----------|------------------|-----|
| App idle | 🟢 Listening | Ready for "Seven" |
| Manual voice active | 🔴 Disabled | Prevents conflict |
| AI processing | 🔴 Disabled | Prevents interference |
| AI speaking | 🔴 Disabled | Prevents false triggers |
| After AI speaks | 🟢 Listening* | Ready again |

*If continuous voice mode is OFF

### When Continuous Voice Mode is ON

- Wake word is **disabled** during continuous mode
- Continuous mode keeps listening automatically
- No need for wake word activation

---

## 💡 Pro Tips

### 1. Best Environment
- Quiet room
- Clear pronunciation
- 2-3 feet from microphone
- No background music/TV

### 2. Best Practice
- Say "Seven" clearly and pause
- Wait 1 second after saying it
- If doesn't work, try again
- Check console each time

### 3. Alternatives
- Use **🎤 Voice button** instead
- Enable **Continuous Voice Mode**
- Use **keyboard input**

### 4. Mobile Considerations
- Mobile browsers have stricter speech recognition limits
- Wake word may not work on all mobile browsers
- Manual voice button is more reliable on mobile
- iOS Safari has best support on mobile

---

## 🔧 Advanced Debugging

### Enable Verbose Logging

Already enabled! Just open console (F12) and you'll see:
- 👂 What wake word detector hears
- ✨ When wake word is detected
- 🛑 When it stops/starts
- ❌ Any errors

### Check Speech Recognition API

```javascript
// Paste in console:
if ('webkitSpeechRecognition' in window) {
  console.log('✅ Speech Recognition supported');
} else if ('SpeechRecognition' in window) {
  console.log('✅ Speech Recognition supported');
} else {
  console.log('❌ Speech Recognition NOT supported');
}
```

### Test Microphone Access

```javascript
// Paste in console:
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(() => console.log('✅ Microphone access granted'))
  .catch(err => console.error('❌ Microphone error:', err));
```

---

## 📊 Browser Compatibility

| Browser | Wake Word Support | Notes |
|---------|-------------------|-------|
| Chrome | ✅ Excellent | Best support |
| Edge | ✅ Excellent | Chromium-based |
| Safari | ⚠️ Limited | May have delays |
| Firefox | ⚠️ Limited | Experimental |
| Mobile Chrome | ⚠️ Limited | Battery impact |
| Mobile Safari | ⚠️ Limited | iOS restrictions |

---

## 🆘 Still Not Working?

### Try This

1. **Restart Browser**
   - Close ALL browser windows
   - Open fresh
   - Try again

2. **Restart Backend**
   ```powershell
   cd seven-ai-backend
   .\venv\Scripts\Activate.ps1
   python main.py
   ```

3. **Restart Frontend**
   ```powershell
   cd seven-ai-assistant
   npm run dev
   ```

4. **Check Console Logs**
   - Look for any red errors
   - Share them if asking for help

5. **Try Different Browser**
   - Chrome is recommended
   - Edge also works well

---

## ✅ Expected Console Output

### When Working Correctly

```
🎯 Starting wake word detector...
🎯 Listening for: "seven"
💡 Make sure microphone permission is granted
✅ Wake word detector started successfully

[You say "Seven"]

👂 Wake word listening... heard: seven
✨ WAKE WORD DETECTED: seven
🎤 Activating voice input...
✨ Wake word "Seven" detected!
🎤 Starting voice input...
Voice recognition started. Speak now...
```

### When Permission Issue

```
❌ Failed to start wake word detection: NotAllowedError
💡 Possible causes:
   - Microphone permission not granted
   - Another speech recognition instance is running
   - Browser doesn't support continuous speech recognition
```

**Fix:** Grant microphone permission in browser settings

### When Browser Not Supported

```
⚠️ Wake word detection: Speech recognition not available
💡 Tip: Wake word requires microphone permission and browser support
```

**Fix:** Use Chrome or Edge browser

---

## 🎤 Alternative: Manual Voice Button

If wake word doesn't work, use the manual voice button:

1. Click **🎤** button in chat input
2. Speak your message
3. Click **🛑** to stop
4. AI processes and responds

---

## 📝 Summary

### What Was Fixed
- ✅ Wake word now stops when manually listening (prevents conflicts)
- ✅ Added detailed logging for debugging
- ✅ Better error messages with solutions
- ✅ Auto-restart when conditions are right

### What You Need
- ✅ Microphone permission granted
- ✅ Supported browser (Chrome/Edge recommended)
- ✅ Wake word enabled in Settings
- ✅ NOT actively using voice input manually
- ✅ Clear pronunciation of "Seven"

### How to Test
1. Open console (F12)
2. Enable wake word in Settings
3. Say "Seven" clearly
4. Watch for logs showing detection
5. Voice input should activate

---

**If still having issues, check the console logs and share them for further debugging!** 🔍













