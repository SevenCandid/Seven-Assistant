# 🚀 Seven AI Assistant - Quick Start Build Guide

Get up and running with builds in 5 minutes!

---

## 📦 Step 1: Install Dependencies

```bash
npm install
```

**Optional:** Add vite-plugin-electron if building desktop:
```bash
npm install --save-dev vite-plugin-electron vite-plugin-electron-renderer
```

---

## 🌐 Step 2: Build for Web (PWA)

The easiest and fastest option!

```bash
# Development
npm run dev

# Production build
npm run build:web
```

**Deploy:** Upload `dist/` folder to any static host (Vercel, Netlify, GitHub Pages, etc.)

**That's it!** Your PWA is ready. Users can install it directly from the browser.

---

## 💻 Step 3: Build Desktop App (Optional)

### Quick Desktop Build (Current OS)

```bash
npm run build:electron
```

This creates an installer in `release/` folder for your current OS.

### Platform-Specific Builds

```bash
# Windows (from any OS with wine/docker)
npm run build:electron:win

# macOS (requires macOS)
npm run build:electron:mac

# Linux (from any OS)
npm run build:electron:linux
```

**Note:** First build may take 5-10 minutes as it downloads Electron binaries.

### Without Icons (Quick Test)

Builds will work without icons, just skip the asset setup!

### With Icons (Production)

1. **Quick method:**
   ```bash
   node setup-build-assets.js
   ```
   Follow the instructions to add icons.

2. **Use online tool:**
   - Go to https://icon.kitchen/
   - Upload your 1024x1024 Seven logo
   - Download all formats
   - Place in `build/` folder

---

## 📱 Step 4: Build Mobile (Optional)

### Android

**Requirements:**
- Android Studio installed
- Android SDK (API 33+)

**Steps:**
```bash
# Build web first
npm run build:web

# Sync to Android project
npm run sync:android

# Open in Android Studio
npm run open:android
```

In Android Studio:
- Build > Build Bundle(s) / APK(s) > Build APK(s)
- Find APK in `android/app/build/outputs/apk/debug/`

### iOS

**Requirements:**
- macOS with Xcode
- Apple Developer Account

**Steps:**
```bash
# Build web first
npm run build:web

# Sync to iOS project
npm run sync:ios

# Open in Xcode
npm run open:ios
```

In Xcode:
- Select your team for signing
- Product > Build

---

## 🎯 Most Common Build Scenarios

### 1. Web App Only (Fastest)
```bash
npm install
npm run build:web
# Deploy dist/ folder
```

### 2. Web + Desktop
```bash
npm install
npm run build:web
npm run build:electron
# Installers in release/
```

### 3. Everything
```bash
npm install
npm run build:all
# Then build mobile in Android Studio/Xcode
```

---

## ⚡ Quick Commands Reference

| Task | Command |
|------|---------|
| **Development** | `npm run dev` |
| **Web build** | `npm run build:web` |
| **Desktop build** | `npm run build:electron` |
| **All platforms** | `npm run build:all` |
| **Setup assets** | `node setup-build-assets.js` |

---

## 🐛 Quick Troubleshooting

### Build Fails
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Missing Icons Error
```bash
# Setup build folder
node setup-build-assets.js

# Or skip icons for testing
# Builds work without them!
```

### Android Build Fails
```bash
# Set SDK location
export ANDROID_HOME=/path/to/Android/sdk

# Clean Android
cd android
./gradlew clean
cd ..
npm run sync:android
```

---

## 📚 Need More Details?

See **[BUILD.md](./BUILD.md)** for comprehensive documentation including:
- Icon generation
- Code signing
- Distribution
- App store publishing
- Advanced configuration

---

## ✅ Success Checklist

- [ ] `npm install` completed
- [ ] `npm run build:web` works
- [ ] Web app tested in browser
- [ ] (Optional) `npm run build:electron` creates installer
- [ ] (Optional) Mobile builds in Android Studio/Xcode

---

## 🎉 You're Done!

Your Seven AI Assistant is now built and ready to distribute!

**Next Steps:**
1. Test your builds
2. Deploy web version
3. Distribute desktop installers
4. Submit mobile apps to stores (optional)

For help: Open an issue on GitHub or check BUILD.md for detailed docs.














