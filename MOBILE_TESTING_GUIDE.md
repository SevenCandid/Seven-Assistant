# 📱 Mobile Testing Guide for Seven AI Assistant

## Quick Start - Test on Your Phone

### Option 1: Same WiFi Network (Easiest) ⭐

**Step 1: Get Your Computer's IP Address**

**On Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" - it will be something like `192.168.1.xxx`

**On Mac/Linux:**
```bash
ifconfig
# or
ip addr show
```
Look for your local IP (usually starts with `192.168.` or `10.0.`)

**Step 2: Start the Dev Server**
```bash
npm run dev:web
```

**Step 3: Access from Your Phone**

1. Make sure your phone is on the **same WiFi network** as your computer
2. Open a browser on your phone (Chrome, Safari, etc.)
3. Go to: `http://YOUR-IP-ADDRESS:5173`
   - Example: `http://192.168.1.100:5173`
4. The app should load!

**Troubleshooting Same WiFi:**
- Make sure Windows Firewall allows connections on port 5173
- Some routers block device-to-device communication (AP isolation)
- Try turning off VPN if you're using one

---

### Option 2: ngrok (Works Anywhere) 🌐

Use ngrok to create a public URL that works anywhere (even outside your WiFi).

**Step 1: Install ngrok**
```bash
# Download from https://ngrok.com/download
# Or use npm:
npm install -g ngrok

# Sign up at ngrok.com to get an auth token (free)
ngrok authtoken YOUR_AUTH_TOKEN
```

**Step 2: Start Your Dev Server**
```bash
npm run dev:web
# Server runs on localhost:5173
```

**Step 3: Create Public Tunnel**

Open a **new terminal** and run:
```bash
ngrok http 5173
```

You'll see output like:
```
Forwarding   https://abc123.ngrok.io -> http://localhost:5173
```

**Step 4: Open on Phone**

1. Copy the `https://abc123.ngrok.io` URL
2. Open it on your phone's browser
3. Your app is now accessible from anywhere!

**Benefits:**
- ✅ Works from anywhere (not just your WiFi)
- ✅ Secure HTTPS connection
- ✅ Great for testing with friends
- ✅ Required for speech recognition (needs HTTPS)

---

### Option 3: Build and Host (Production) 🚀

For a permanent mobile version:

**Step 1: Build the App**
```bash
npm run build
```

**Step 2: Host It**

**Using Vercel (Recommended):**
```bash
npm install -g vercel
vercel login
vercel
# Follow prompts to deploy
```

**Using Netlify:**
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

**Using GitHub Pages:**
1. Push your code to GitHub
2. Enable GitHub Pages in repo settings
3. Set source to `gh-pages` branch
4. Run: `npm run build && npm run deploy` (if configured)

Now you have a permanent URL accessible from anywhere!

---

## Mobile-Specific Features to Test

### 1. **Voice Input** 🎤
- Tap the microphone button
- Speak your message
- Should auto-stop after 2 seconds of silence
- Test "Hey Seven" wake word if enabled

### 2. **Touch Gestures** 👆
- Tap to open/close settings
- Swipe to scroll through chat history
- Long press on messages (if implemented)
- Pull to refresh (if implemented)

### 3. **Mobile Menu** 🍔
- Hamburger menu appears on mobile
- All features accessible
- Settings, History, New Chat buttons work
- Menu closes after selection

### 4. **Responsive Design** 📐
- App fills the screen properly
- Text is readable (not too small)
- Buttons are tap-able (not too tiny)
- Input area is accessible
- Keyboard doesn't cover input

### 5. **Notifications** 🔔
- Timer plugin notifications work
- Browser notification permission requested
- Notifications show when app is background

### 6. **Performance** ⚡
- App loads quickly
- Smooth scrolling
- No lag when typing
- Voice responds without delay
- Animations are smooth

---

## Vite Dev Server for Mobile

**Configure Vite for Mobile Access:**

Edit `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5173,
    strictPort: true,
  },
})
```

Then restart your dev server:
```bash
npm run dev:web
```

Now accessible from any device on your network!

---

## PWA Installation (Install on Home Screen)

### iOS (Safari)

1. Open the app in Safari
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **"Add"**
5. App icon appears on your home screen!

### Android (Chrome)

1. Open the app in Chrome
2. Tap the **menu** (three dots)
3. Tap **"Add to Home Screen"** or **"Install app"**
4. Tap **"Add"**
5. App icon appears on your home screen!

**Benefits:**
- ✅ Launches like a native app
- ✅ Full-screen mode (no browser UI)
- ✅ Offline capability (if service worker configured)
- ✅ Faster loading

---

## Debugging on Mobile

### Chrome DevTools (Android)

1. **On Phone:** Enable Developer Options and USB Debugging
2. **Connect phone** to computer via USB
3. **On Computer:** Open Chrome and go to `chrome://inspect`
4. **Select your device** and inspect the tab
5. Full DevTools with console, network, etc.!

### Safari DevTools (iOS)

1. **On iPhone:** Settings → Safari → Advanced → Enable "Web Inspector"
2. **On Mac:** Safari → Preferences → Advanced → Show Develop menu
3. **Connect iPhone** to Mac via USB
4. **On Mac:** Develop menu → [Your iPhone] → Select the page
5. Full Web Inspector available!

### Remote Console Logging

Add this to see logs on your computer:

```typescript
// In your main.tsx or App.tsx
if (window.location.hostname !== 'localhost') {
  const originalLog = console.log;
  console.log = (...args) => {
    originalLog(...args);
    // Send to your logging service or display on screen
  };
}
```

---

## Common Mobile Issues & Fixes

### Issue: "Can't connect to IP address"
**Fix:** 
- Ensure both devices on same WiFi
- Check firewall settings
- Try using ngrok instead

### Issue: "Microphone doesn't work"
**Fix:**
- Needs HTTPS (use ngrok)
- Grant microphone permission in browser
- Check browser compatibility

### Issue: "App looks zoomed in"
**Fix:**
Add to `index.html`:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
```

### Issue: "Keyboard covers input"
**Fix:**
The app should auto-scroll when keyboard appears. If not, add:
```css
.input-area {
  position: fixed;
  bottom: 0;
  bottom: env(safe-area-inset-bottom); /* iOS notch support */
}
```

### Issue: "Voice doesn't work offline"
**Fix:**
- Speech recognition requires internet
- Use online connection for voice features
- Text input works offline

---

## Testing Checklist ✅

**Connection:**
- [ ] App loads on mobile browser
- [ ] Can access from phone's WiFi
- [ ] HTTPS works (ngrok or production)

**Core Features:**
- [ ] Can send text messages
- [ ] Can receive AI responses
- [ ] Voice input works
- [ ] Voice output works (auto-speak)
- [ ] Settings panel opens and works

**Chat Features:**
- [ ] New Chat button creates new session
- [ ] Chat History shows past conversations
- [ ] Can load old conversations
- [ ] Can delete conversations
- [ ] Sessions have proper titles

**Plugins:**
- [ ] Notes plugin works
- [ ] Can save and retrieve notes
- [ ] Model selection persists

**UI/UX:**
- [ ] Mobile menu accessible
- [ ] All buttons are tap-able
- [ ] Text is readable
- [ ] Scrolling is smooth
- [ ] App is responsive

**PWA:**
- [ ] Can install on home screen
- [ ] Launches full-screen
- [ ] Icon displays correctly
- [ ] App name shows properly

---

## Performance Tips for Mobile

1. **Reduce Chat History Load:**
   - Only load last 20 messages initially
   - Lazy load older messages on scroll

2. **Optimize Images:**
   - Use WebP format for icons
   - Compress all assets

3. **Enable Service Worker:**
   - Cache static assets
   - Faster subsequent loads

4. **Minimize Re-renders:**
   - Use React.memo for message components
   - Optimize state updates

5. **Lazy Load Plugins:**
   - Load plugins on-demand
   - Reduce initial bundle size

---

## Production Deployment

**For Best Mobile Experience:**

1. **Enable HTTPS** (required for PWA and voice)
2. **Configure Service Worker** for offline support
3. **Add Web Manifest** with proper icons
4. **Set up Push Notifications** (optional)
5. **Optimize Bundle Size** (code splitting)

**Deploy Commands:**

```bash
# Build
npm run build

# Preview build locally
npm run preview

# Deploy to Vercel
vercel --prod

# Deploy to Netlify
netlify deploy --prod
```

---

## Quick Commands Reference

```bash
# Development
npm run dev:web                    # Start dev server (localhost only)
npm run dev:web -- --host 0.0.0.0  # Start dev server (network accessible)

# With ngrok
npm run dev:web                    # Terminal 1
ngrok http 5173                    # Terminal 2

# Production
npm run build                      # Build for production
npm run preview                    # Preview production build
vercel --prod                      # Deploy to Vercel
```

---

## 🎉 You're Ready!

**Recommended Testing Flow:**

1. Start with **Option 1** (Same WiFi) for quick testing
2. Use **ngrok** when you need HTTPS or remote access
3. Deploy to **Vercel/Netlify** for permanent hosting
4. Install as **PWA** for best mobile experience

**Need Help?**
- Check browser console for errors
- Use remote debugging tools
- Test on multiple devices/browsers
- Check network tab for failed requests

Happy mobile testing! 📱✨













