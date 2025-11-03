# 📱 SMS & WhatsApp Actions - Seven AI Assistant

Extended device actions to support SMS and WhatsApp messaging from voice commands!

---

## 🎯 New Actions Added

### 1️⃣ **send_sms** - Send SMS Messages

Opens the default SMS app with pre-filled recipient and message.

**Usage:**
```json
{
  "action": "send_sms",
  "data": {
    "recipient": "+233500000000",
    "message": "Hello from Seven!"
  }
}
```

**Parameters:**
- `recipient` (required): Phone number in any format (spaces, dashes, parentheses are automatically cleaned)
- `message` (required): Text message content

**Platform Support:**
- ✅ **Web/PWA:** Opens `sms:` URI → launches default SMS app
- ✅ **Mobile (Capacitor):** Opens native SMS app
- ✅ **Electron:** Uses shell.openExternal to launch SMS app
- ✅ **Works on:** iOS, Android, macOS (iMessage), Windows 10+ (with compatible app)

**Example Voice Commands:**
- "Send a text to John at +1234567890 saying I'll be late"
- "SMS mom at 555-1234 and tell her I'm on my way"
- "Text Sarah at +233241234567 with the message 'Meeting at 3pm'"

---

### 2️⃣ **open_whatsapp** - Open WhatsApp Chats

Opens WhatsApp Web or app with specified contact and optional pre-filled message.

**Usage:**
```json
{
  "action": "open_whatsapp",
  "data": {
    "phone": "+233500000000",
    "message": "Hey! How are you?"
  }
}
```

**Parameters:**
- `phone` (required): Phone number with country code (automatically cleaned)
- `message` (optional): Pre-filled message text

**Platform Support:**
- ✅ **Web/PWA:** Opens WhatsApp Web (`https://wa.me/`)
- ✅ **Mobile:** Opens WhatsApp app if installed
- ✅ **Electron:** Opens WhatsApp Web or desktop app
- ✅ **Works on:** All platforms with WhatsApp installed

**Example Voice Commands:**
- "Open WhatsApp chat with +233241234567"
- "WhatsApp John and say 'Are we still meeting tomorrow?'"
- "Send a WhatsApp to 555-1234 with message 'Check out this link'"

---

## 🔧 Implementation Details

### Phone Number Cleaning
Both actions automatically clean phone numbers:
- Removes spaces, dashes, parentheses: `(555) 123-4567` → `5551234567`
- SMS: Preserves `+` for country code
- WhatsApp: Removes `+` (wa.me format)

### SMS URI Scheme
```
sms:<phone>?body=<encoded-message>
```

Example:
```
sms:+233500000000?body=Hello%20from%20Seven!
```

### WhatsApp URL Scheme
```
https://wa.me/<phone>?text=<encoded-message>
```

Example:
```
https://wa.me/233500000000?text=Hey!%20How%20are%20you?
```

---

## 🤖 AI Integration

The AI model automatically triggers these actions when users make requests like:

**SMS Examples:**
- "Text my mom and tell her I'm coming home"
- "Send an SMS to 555-1234"
- "Message John at +1-555-123-4567"

**WhatsApp Examples:**
- "WhatsApp Sarah and ask if she's free"
- "Open WhatsApp with 233241234567"
- "Send a WhatsApp message to John"

The AI extracts:
1. **Phone number** from user input
2. **Message content** (if provided)
3. Formats proper JSON action

---

## 📊 Action Flow

### SMS Flow
```
User: "Text mom at 555-1234 saying I'll be late"
  ↓
AI extracts: recipient=555-1234, message="I'll be late"
  ↓
Generates: {"action": "send_sms", "data": {...}}
  ↓
ActionExecutor.sendSMS() called
  ↓
Opens: sms:5551234?body=I'll%20be%20late
  ↓
Device SMS app opens with pre-filled message
```

### WhatsApp Flow
```
User: "WhatsApp John at +233241234567"
  ↓
AI extracts: phone=+233241234567
  ↓
Generates: {"action": "open_whatsapp", "data": {...}}
  ↓
ActionExecutor.openWhatsApp() called
  ↓
Opens: https://wa.me/233241234567
  ↓
WhatsApp opens with John's chat
```

---

## 🧪 Testing

### Test SMS Action
```typescript
// In browser console or via voice command:
const executor = new ActionExecutor();
await executor.execute('send_sms', {
  recipient: '+233500000000',
  message: 'Test from Seven!'
});
```

### Test WhatsApp Action
```typescript
const executor = new ActionExecutor();
await executor.execute('open_whatsapp', {
  phone: '+233500000000',
  message: 'Hello via Seven AI!'
});
```

### Voice Testing
1. Start Seven: `npm run dev`
2. Click microphone or say "Seven"
3. Say: "Send a text to 555-1234 saying hello"
4. SMS app should open with pre-filled message

---

## 🔒 Security & Privacy

### Phone Number Validation
- No phone numbers are stored or transmitted to servers
- Numbers are only used locally to construct URI schemes
- All processing happens client-side

### User Control
- Users must confirm/send messages in their SMS/WhatsApp app
- Seven only **opens** the app with pre-filled content
- No messages are sent automatically without user interaction

### Platform Permissions
- **Web/PWA:** No special permissions needed (uses standard URI schemes)
- **Mobile:** May request SMS/WhatsApp app access on first use
- **Electron:** Uses system default handlers

---

## 🌍 International Support

### Phone Number Formats
Both actions support international formats:
- `+233 50 000 0000` (with country code)
- `(555) 123-4567` (US format)
- `555-1234` (local format)
- `+44 20 7946 0958` (UK format)

**Best Practice:** Always use country codes for reliability:
- ✅ `+233500000000`
- ✅ `+1 555 123 4567`
- ⚠️ `555-1234` (may not work internationally)

---

## ⚡ Performance

- **SMS:** Opens instantly (< 100ms)
- **WhatsApp:** Opens instantly (< 100ms)
- No network required for opening apps
- Message sending happens in user's app (not controlled by Seven)

---

## 🐛 Troubleshooting

### SMS Not Opening
**Issue:** SMS URI not recognized
**Solution:** 
- Desktop: Install a compatible SMS app (e.g., iMessage on Mac, Your Phone on Windows)
- Mobile: Ensure default SMS app is set
- Web: Use on mobile devices (limited desktop support)

### WhatsApp Not Opening
**Issue:** WhatsApp link doesn't work
**Solution:**
- Ensure WhatsApp is installed
- Check phone number includes country code
- Try WhatsApp Web: https://web.whatsapp.com

### Phone Number Not Recognized
**Issue:** "Invalid phone number" error
**Solution:**
- Include country code: `+233500000000`
- Remove letters/special characters
- Use digits, spaces, dashes, or parentheses only

---

## 📱 Platform Compatibility

| Platform | SMS Support | WhatsApp Support |
|----------|-------------|------------------|
| **iOS (Safari)** | ✅ Native | ✅ App/Web |
| **Android (Chrome)** | ✅ Native | ✅ App/Web |
| **Desktop (Chrome/Edge)** | ⚠️ Limited | ✅ Web |
| **macOS (Safari)** | ✅ iMessage | ✅ Web |
| **Windows 10+** | ⚠️ Your Phone app | ✅ Web |
| **Linux** | ❌ | ✅ Web |
| **Electron** | ✅ System default | ✅ System default |
| **Capacitor (Mobile)** | ✅ Native | ✅ Native |

✅ = Full support  
⚠️ = Partial support  
❌ = No support

---

## 🎨 Example Scenarios

### Scenario 1: Quick SMS
**User:** "Text dad I'm running late"

**AI Response:**
```json
{
  "response": "I'll help you text your dad. Opening SMS app...",
  "action": "send_sms",
  "data": {
    "recipient": "dad",
    "message": "I'm running late"
  }
}
```
*Note: AI should ask for phone number if "dad" isn't in context*

### Scenario 2: WhatsApp with Pre-filled Message
**User:** "WhatsApp John at +233241234567 and ask if he's free for lunch"

**AI Response:**
```json
{
  "response": "Opening WhatsApp to message John...",
  "action": "open_whatsapp",
  "data": {
    "phone": "+233241234567",
    "message": "Hey John! Are you free for lunch?"
  }
}
```

### Scenario 3: Just Open WhatsApp
**User:** "Open WhatsApp with mom's number 555-1234"

**AI Response:**
```json
{
  "response": "Opening WhatsApp chat...",
  "action": "open_whatsapp",
  "data": {
    "phone": "555-1234"
  }
}
```

---

## 🚀 Future Enhancements

Potential features for future versions:
- [ ] Contact name resolution (integrate with device contacts)
- [ ] Message templates
- [ ] Group chat support (WhatsApp)
- [ ] MMS support (media messages)
- [ ] Multiple recipients (group SMS)
- [ ] Telegram/Signal integration
- [ ] Message scheduling

---

## 📚 Related Documentation

- **Main Actions:** See `src/core/actions.ts`
- **Voice Commands:** See Seven AI documentation
- **Platform Detection:** See `src/core/utils.ts`
- **Electron Integration:** See electron main process handlers

---

## ✅ Action Summary

| Action | Purpose | Platforms | Required Data |
|--------|---------|-----------|---------------|
| `send_sms` | Send SMS | All* | recipient, message |
| `open_whatsapp` | Open WhatsApp | All | phone, message? |

*Limited on some desktop platforms

---

**Your Seven AI Assistant can now send SMS and open WhatsApp chats! 📱✨**

Test it out:
1. Say: "Seven, text John at 555-1234"
2. SMS app opens with pre-filled message
3. Review and send!














