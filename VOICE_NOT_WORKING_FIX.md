# 🎤 Voice Input Not Working - Complete Fix Guide

## 🚨 Problem

- Clicking microphone button does nothing
- Voice not being picked up
- No response when speaking

---

## ⚡ Quick Diagnostic (30 Seconds)

### Step 1: Open Console
```
Press F12
Click "Console" tab
Keep it open
```

### Step 2: Click Microphone Button
```
Click 🎤 button
Watch console
```

### Step 3: What Do You See?

#### ✅ If you see:
```
🎤 Starting voice input...
Voice recognition started. Speak now...
```
**→ Microphone is initializing!** Proceed to Step 4

#### ❌ If you see:
```
❌ Microphone permission denied
not-allowed
```
**→ Permission issue!** Jump to **Fix 1: Microphone Permission**

#### ❌ If you see:
```
⚠️ Speech recognition not available
```
**→ Browser issue!** Jump to **Fix 2: Browser Compatibility**

#### 😐 If you see nothing:
**→ JavaScript error!** Jump to **Fix 3: Refresh & Reload**

### Step 4: Speak
```
Say something (anything)
Watch console for:
🎤 Speech detected: "your words"
```

#### ✅ If you see your words:
**Microphone is working!** Just speak louder or wait longer

#### ❌ If you see nothing:
**Microphone not picking up audio** → Jump to **Fix 4: Microphone Settings**

---

## 🔧 Fix 1: Microphone Permission

### Chrome / Edge

**Method 1: Address Bar**
1. Click the **🔒 padlock** or **ⓘ info icon** in address bar
2. Click **"Site settings"**
3. Find **"Microphone"**
4. Change to **"Allow"**
5. **Refresh page** (Ctrl + R)
6. Try microphone button again

**Method 2: Settings**
1. Click **⋮** (three dots) → Settings
2. Search for **"microphone"**
3. Click **"Site settings"**
4. Click **"Microphone"**
5. Find `http://localhost:5173`
6. Change to **"Allow"**
7. **Refresh page**

### Safari (Mac)

1. Safari → **Preferences** → **Websites**
2. Click **"Microphone"** in left sidebar
3. Find `localhost:5173`
4. Change to **"Allow"**
5. **Refresh page**

### Firefox

1. Click **🔒** in address bar
2. Click **"Connection Secure"** → **"More Information"**
3. Click **"Permissions"** tab
4. Find **"Use the Microphone"**
5. Uncheck **"Use Default"**
6. Check **"Allow"**
7. **Refresh page**

### System-Level Permission (Windows)

1. **Windows Settings** → **Privacy**
2. Click **"Microphone"**
3. Turn ON **"Allow apps to access your microphone"**
4. Scroll down to **"Choose which apps can access"**
5. Find your browser (Chrome/Edge/Firefox)
6. Turn it **ON**
7. **Restart browser**
8. Try again

### System-Level Permission (Mac)

1. **System Preferences** → **Security & Privacy**
2. Click **"Privacy"** tab
3. Click **"Microphone"** in left sidebar
4. Check the box next to your browser
5. **Restart browser**
6. Try again

---

## 🔧 Fix 2: Browser Compatibility

### Recommended Browsers

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Excellent | Best choice |
| Edge | ✅ Excellent | Best choice |
| Safari | ⚠️ Limited | Works but limited |
| Firefox | ⚠️ Limited | May not work well |
| Opera | ✅ Good | Chromium-based |
| Brave | ✅ Good | May need permission |

### Test Browser Support

1. **Open Console** (F12)
2. **Paste this code** and press Enter:
```javascript
if ('webkitSpeechRecognition' in window) {
  console.log('✅ Speech Recognition SUPPORTED');
} else if ('SpeechRecognition' in window) {
  console.log('✅ Speech Recognition SUPPORTED');
} else {
  console.log('❌ Speech Recognition NOT SUPPORTED');
  console.log('💡 Try Chrome or Edge browser');
}
```

3. **Check result**:
   - ✅ SUPPORTED → Good! Move to next fix
   - ❌ NOT SUPPORTED → Switch to Chrome or Edge

### Important Requirements

- ✅ **HTTPS** or **localhost** (not HTTP with IP address)
- ✅ **Not Incognito/Private mode**
- ✅ **Desktop browser** (mobile has limitations)
- ✅ **Internet connection** (speech recognition needs it)

---

## 🔧 Fix 3: Refresh & Reload

### Hard Refresh

Sometimes the app gets stuck. Do a hard refresh:

**Windows:**
```
Ctrl + Shift + R
```
or
```
Ctrl + F5
```

**Mac:**
```
Cmd + Shift + R
```

### Clear Cache & Reload

1. **Press F12** (open console)
2. **Right-click the refresh button** 🔄
3. Select **"Empty Cache and Hard Reload"**
4. Wait for page to reload
5. Try microphone again

### Full Restart

If still not working:

**Step 1: Stop Everything**
```
Close ALL browser tabs
Close browser completely
```

**Step 2: Restart Backend**
```powershell
# In terminal, press Ctrl+C to stop backend
# Then restart:
cd seven-ai-backend
.\venv\Scripts\Activate.ps1
python main.py
```

**Step 3: Restart Frontend**
```powershell
# In another terminal, press Ctrl+C
# Then restart:
cd seven-ai-assistant
npm run dev
```

**Step 4: Open Fresh**
```
Open browser
Go to: http://localhost:5173
Click 🎤
Try speaking
```

---

## 🔧 Fix 4: Microphone Settings

### Test Microphone in Windows

1. **Windows Settings** → **System** → **Sound**
2. Scroll to **"Input"**
3. Select your **microphone**
4. Click **"Test your microphone"**
5. **Speak** and watch the blue bar move
6. If bar doesn't move → microphone broken/muted
7. If bar moves → microphone works!

### Test Microphone in Mac

1. **System Preferences** → **Sound**
2. Click **"Input"** tab
3. Select your **microphone**
4. **Speak** and watch input level bars
5. If bars don't move → microphone issue
6. If bars move → microphone works!

### Check Microphone Level

**Windows:**
1. Right-click **speaker icon** in taskbar
2. Click **"Open Sound settings"**
3. Scroll to **"Input"**
4. Make sure level is **50-100%**
5. Click **"Device properties"**
6. Make sure **NOT muted**

**Mac:**
1. System Preferences → Sound → Input
2. Drag **Input volume** to 75-100%
3. Make sure microphone is selected

### Check Default Microphone

If you have multiple microphones:
1. Windows Sound Settings → Input
2. **Select the correct microphone**
3. Try built-in laptop mic first
4. Then try external/headset mic
5. **Refresh browser** after changing

---

## 🔧 Fix 5: Test Microphone in Browser

### Direct Test

1. **Open Console** (F12)
2. **Paste this code** and press Enter:
```javascript
navigator.mediaDevices.getUserMedia({ audio: true })
  .then((stream) => {
    console.log('✅ MICROPHONE WORKING!');
    console.log('Stream:', stream);
    stream.getTracks().forEach(track => track.stop());
  })
  .catch((err) => {
    console.error('❌ MICROPHONE ERROR:', err);
    console.error('Error name:', err.name);
    console.error('Error message:', err.message);
  });
```

3. **Check result**:

**✅ Success:**
```
✅ MICROPHONE WORKING!
Stream: MediaStream {...}
```
→ Microphone is accessible! Issue is in the app

**❌ NotAllowedError:**
```
❌ MICROPHONE ERROR: NotAllowedError
Error name: NotAllowedError
Error message: Permission denied
```
→ Grant permission (see Fix 1)

**❌ NotFoundError:**
```
❌ MICROPHONE ERROR: NotFoundError
Error name: NotFoundError
Error message: Requested device not found
```
→ No microphone detected (check connections)

**❌ NotReadableError:**
```
❌ MICROPHONE ERROR: NotReadableError
Error name: NotReadableError
Error message: Could not start audio source
```
→ Microphone in use by another app (close other apps)

---

## 🔧 Fix 6: Other Apps Using Microphone

### Check What's Using Microphone

**Windows 10/11:**
1. Look for **microphone icon** in system tray
2. Hover to see which app is using it
3. **Close that app**
4. Try Seven AI again

**Close Common Apps:**
- Discord
- Zoom
- Teams
- Skype
- OBS
- Any recording software
- Other browser tabs with microphone access

---

## 🔧 Fix 7: Network Connection

Speech recognition **requires internet**. Check connection:

1. Make sure you're online
2. Try loading a website
3. Check WiFi/Ethernet connection
4. If offline → Voice won't work
5. Backend will show offline banner

---

## 🎯 Step-by-Step Complete Test

### Full Diagnostic Procedure

**1. Check Browser**
- [ ] Using Chrome or Edge
- [ ] Not in Incognito mode
- [ ] On http://localhost:5173 (not IP address)

**2. Check Permissions**
- [ ] Click padlock in address bar
- [ ] Microphone is "Allow"
- [ ] Refresh page after changing

**3. Check System**
- [ ] Windows/Mac microphone permission granted to browser
- [ ] Microphone level is 50-100%
- [ ] Microphone not muted
- [ ] Correct microphone selected

**4. Check Console**
- [ ] Press F12 to open console
- [ ] No red errors showing
- [ ] Click 🎤 button
- [ ] See "Voice recognition started"

**5. Speak**
- [ ] Speak clearly and loudly
- [ ] Watch console for "🎤 Speech detected"
- [ ] Wait 3 seconds after speaking
- [ ] Should see "Processing input"

---

## 💡 Alternative: Use Text Input

While debugging voice:

1. **Type your questions** in the text box
2. Press **Enter** to send
3. AI responds normally
4. No voice needed!

---

## 🆘 Emergency Restart Script

If nothing works, do this complete restart:

```powershell
# 1. Close browser completely

# 2. Stop backend (Ctrl+C in its terminal)

# 3. Stop frontend (Ctrl+C in its terminal)

# 4. Restart backend:
cd C:\Users\uppsa\seven-ai-assistant\seven-ai-backend
.\venv\Scripts\Activate.ps1
python main.py

# Wait for: "🤖 SEVEN AI BACKEND STARTED 🤖"

# 5. Open NEW terminal, restart frontend:
cd C:\Users\uppsa\seven-ai-assistant
npm run dev

# Wait for: "Local: http://localhost:5173"

# 6. Open browser:
# Go to: http://localhost:5173

# 7. Open console (F12)

# 8. Click microphone button

# 9. Grant permission if asked

# 10. Speak
```

---

## 📊 Troubleshooting Flowchart

```
Click 🎤 button
       ↓
  Console shows what?
       ↓
┌──────┴──────────────────────────┐
│                                 │
"Permission denied"        "Started. Speak now"
       ↓                           ↓
   Fix 1: Grant             Speak loudly
   Permission                      ↓
       ↓                   Console shows words?
   Refresh page                    │
       ↓                ┌──────────┴──────────┐
Try microphone      YES ✅              NO ❌
   again              Working!         Fix 4: Check
                                       microphone
                                       settings
```

---

## 📝 What to Share If Still Broken

If STILL not working after all fixes, share these:

**1. Console Errors:**
- Press F12
- Click Console tab
- Click microphone button
- **Screenshot all red errors**

**2. Browser Info:**
- What browser? (Chrome/Edge/Safari/Firefox)
- What version? (Help → About)

**3. System Info:**
- Windows or Mac?
- Laptop or desktop?
- Built-in mic or external?

**4. Test Results:**
- Did browser microphone test work? (Fix 5)
- Does microphone work in other apps?
- Any console messages at all?

---

## ✅ Expected Working Behavior

When everything works correctly:

```
1. Click 🎤 button
2. Console: "🎤 Starting voice input..."
3. Console: "Voice recognition started. Speak now..."
4. Button turns RED
5. "Listening..." appears
6. You speak
7. Console: "🎤 Speech detected: your words"
8. Wait 3 seconds of silence
9. Console: "Processing input..."
10. AI responds
```

---

**Try Fix 1 (Microphone Permission) first - it's the most common issue!** 🔑













