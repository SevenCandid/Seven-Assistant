# 📱 Your Mobile Testing Setup

## Your IP Address: `192.168.43.8`

## Quick Start (2 Steps)

### Step 1: Start the Server
In your terminal (where you are now):
```bash
npm run dev:web
```

Wait for it to say "Local: http://localhost:5173"

### Step 2: Open on Your Phone
1. Make sure your phone is connected to the **same WiFi network** (the one with gateway 192.168.43.1)
2. Open any browser on your phone (Chrome, Safari, etc.)
3. Type this URL:
```
http://192.168.43.8:5173
```
4. Press Enter
5. The app should load!

## If It Doesn't Work

### Option A: Configure Vite for Network Access

Create or edit `vite.config.ts` in your project root:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Listen on all network interfaces
    port: 5173,
  },
})
```

Then restart the dev server:
```bash
npm run dev:web
```

### Option B: Use ngrok (Easier, Works Everywhere)

**Install ngrok:**
```bash
npm install -g ngrok
```

**Sign up at ngrok.com** (free) and get your auth token, then:
```bash
ngrok authtoken YOUR_AUTH_TOKEN
```

**Run both:**
```bash
# Terminal 1:
npm run dev:web

# Terminal 2 (new terminal):
ngrok http 5173
```

You'll get a URL like `https://abc123.ngrok.io` - open that on your phone!

**Benefits of ngrok:**
- ✅ Works from anywhere (not just your WiFi)
- ✅ HTTPS enabled (required for voice features)
- ✅ No firewall issues
- ✅ Can share with others

## Testing Checklist

Once it loads on your phone:

- [ ] Send a text message
- [ ] Try voice input (microphone button)
- [ ] Open settings
- [ ] Try "New Chat" button
- [ ] Open Chat History
- [ ] Click on a past conversation
- [ ] Test the mobile menu (hamburger icon)

## Install as App (Optional)

### iPhone:
1. Open in Safari
2. Tap Share button (box with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"
5. App icon appears on home screen!

### Android:
1. Open in Chrome
2. Tap menu (three dots)
3. Tap "Add to Home Screen" or "Install app"
4. Tap "Add"
5. Launches like a native app!

## Troubleshooting

### "This site can't be reached"
- Verify both devices on same WiFi
- Make sure dev server is running
- Try using ngrok instead
- Check Windows Firewall (may need to allow port 5173)

### Voice doesn't work
- Voice features require HTTPS
- Use ngrok to get HTTPS URL
- Or deploy to production (Vercel/Netlify)

### Keyboard covers input
- This is normal, the app should auto-scroll
- Try landscape mode for more space

## Your Network Info

```
WiFi Network: 192.168.43.x
Your Computer: 192.168.43.8
Gateway: 192.168.43.1
Access URL: http://192.168.43.8:5173
```

## Quick Commands

```bash
# Start dev server
npm run dev:web

# Check if server is accessible
# (Open in browser): http://192.168.43.8:5173

# With ngrok (easier):
npm run dev:web              # Terminal 1
ngrok http 5173              # Terminal 2
# Use the https URL from ngrok
```

---

**Try it now!** Run `npm run dev:web` and open `http://192.168.43.8:5173` on your phone!







