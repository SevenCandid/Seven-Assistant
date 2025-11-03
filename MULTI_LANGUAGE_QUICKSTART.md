# Multi-Language Support - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Translation Packages (1 minute)

```bash
cd seven-ai-backend
pip install deep-translator langdetect
```

**Or install all requirements:**
```bash
pip install -r requirements.txt
```

### Step 2: Start the Backend (30 seconds)

```bash
python main.py
```

**Expected Output:**
```
🚀 Starting Seven AI Backend...
✅ Database initialized
✅ Translation libraries available
🌐 Server ready!
```

### Step 3: Start the Frontend (30 seconds)

```bash
# In project root
npm run dev
```

### Step 4: Select Your Language (1 minute)

1. Click **Settings** (⚙️ icon)
2. Scroll to **🌐 Language** section
3. Click the language button (shows current language)
4. Select your language from dropdown
5. Done!

### Step 5: Test It! (2 minutes)

#### Test 1: French 🇫🇷
1. Select **Français** in settings
2. Type: "Bonjour, comment ça va?"
3. Expected: AI responds in French

#### Test 2: Spanish 🇪🇸
1. Select **Español** in settings
2. Type: "Hola, ¿cómo estás?"
3. Expected: AI responds in Spanish

#### Test 3: Chinese 🇨🇳
1. Select **简体中文** in settings
2. Type: "你好，最近怎么样？"
3. Expected: AI responds in Chinese

#### Test 4: Auto-Detection
1. Select **English** in settings
2. Type in any language (e.g., "Bonjour")
3. Expected: AI auto-detects and responds in that language

## 📊 Verify It's Working

### Backend Console
Look for these logs:
```
🌐 User's preferred language: fr
🌐 Detected language: fr (French)
🌐 Translated to English: Hello, how are you?
🌐 Translated response to fr
```

### Frontend Display
- ✅ Language dropdown shows your language with flag
- ✅ Selected language is highlighted
- ✅ Messages appear in your language

### API Test
```bash
curl -X POST http://localhost:5000/api/language/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "target_lang": "fr"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "original": "Hello world",
  "translated": "Bonjour le monde",
  "source_lang": "en",
  "target_lang": "fr"
}
```

## 🌐 Supported Languages

**Primary Languages (as per requirements):**
- 🇬🇧 English
- 🇫🇷 French (Français)
- 🇪🇸 Spanish (Español)
- 🇸🇦 Arabic (العربية)
- 🇮🇳 Hindi (हिन्दी)
- 🇨🇳 Chinese (简体中文)

**Additional Languages:**
- 🇹🇼 Chinese Traditional (繁體中文)
- 🇩🇪 German (Deutsch)
- 🇯🇵 Japanese (日本語)
- 🇰🇷 Korean (한국어)
- 🇵🇹 Portuguese (Português)
- 🇷🇺 Russian (Русский)
- 🇮🇹 Italian (Italiano)

## 🔧 Troubleshooting

### Issue: "Translation not available"

**Quick Fix:**
```bash
pip install deep-translator langdetect
python main.py
```

### Issue: Wrong language detected

**Solution:** Manually select language in settings
- Short messages may be misdetected
- Mixed language text confuses detector
- Solution: Use longer, clear messages

### Issue: Language not saving

**Checklist:**
- ✅ Backend running? (check http://localhost:5000)
- ✅ Settings showing "Backend Status: Online"?
- ✅ Browser console has no errors? (F12)

**Quick Fix:**
1. Restart backend
2. Clear browser cache (Ctrl+Shift+Del)
3. Select language again

### Issue: Slow responses

**Cause:** Translation adds ~200-400ms overhead

**Solutions:**
- First message slower (loads translator)
- Subsequent messages faster (cached)
- Use English for fastest responses
- This is normal for translation

## 💡 Tips & Tricks

### For Best Translation:
1. ✅ Use complete sentences
2. ✅ Avoid slang or idioms
3. ✅ Use punctuation
4. ✅ Keep messages clear and simple

### For Better Detection:
1. ✅ Messages should be >3 characters
2. ✅ Use consistent language
3. ✅ Avoid mixing languages in one message
4. ✅ Let auto-detection work for you

### For Voice Input:
1. ✅ Speak clearly in your language
2. ✅ Translation works with voice too!
3. ✅ Voice input + translation = powerful combo

## 📱 Mobile Support

- ✅ Language selector fully responsive
- ✅ Touch-friendly dropdown
- ✅ Works on all devices
- ✅ RTL languages supported (Arabic, Hebrew)

## 🎯 What Gets Translated

**Translated:**
- ✅ Your messages to AI
- ✅ AI responses to you
- ✅ Voice input/output

**NOT Translated (yet):**
- ❌ UI elements (buttons, labels)
- ❌ Error messages
- ❌ System notifications
- ❌ Settings text

## 🚀 Common Use Cases

### 1. International Users
```
Set your native language → Chat naturally → AI responds in your language
```

### 2. Learning a Language
```
Set target language → Practice conversations → Get responses in that language
```

### 3. Mixed Language Household
```
Each user sets their preference → Everyone chats in their language → Happy family!
```

### 4. Business/Professional
```
Clients in different countries → Chat in their language → Professional communication
```

## 📚 Learn More

- **Full Documentation**: See `MULTI_LANGUAGE_SUPPORT.md`
- **API Reference**: http://localhost:5000/docs (when backend running)
- **Supported Languages**: http://localhost:5000/api/language/supported

## 🎉 You're Ready!

Multi-language support is now active! Seven AI Assistant can now:
- 🌐 Detect your language automatically
- 🗣️ Respond in your native language
- 🔄 Switch languages on the fly
- 💾 Remember your preference

**Chat in your language, naturally! 😊**

---

**Questions?** Check `MULTI_LANGUAGE_SUPPORT.md` for detailed documentation
**Issues?** Review troubleshooting section above
**Feedback?** Translation quality improves with use!











