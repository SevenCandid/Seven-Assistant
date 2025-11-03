# 🚀 Seven AI Assistant - Build & Packaging Guide

Complete guide to building and packaging Seven for all platforms.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Build Commands](#build-commands)
3. [Platform-Specific Builds](#platform-specific-builds)
4. [Icon & Asset Requirements](#icon--asset-requirements)
5. [Distribution](#distribution)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

### Required Software

- **Node.js** 18+ (20+ recommended)
- **npm** or **yarn**

### Platform-Specific Requirements

#### Windows
- Windows 10/11
- No additional requirements for building

#### macOS
- macOS 10.13+ 
- Xcode Command Line Tools (for iOS builds)
- Apple Developer Account (for code signing & distribution)

#### Linux
- Ubuntu 18.04+ or equivalent
- `fuse`, `libfuse2` (for AppImage)

#### Android
- **Android Studio** installed
- **Android SDK** (API 33+)
- **Java JDK** 17+
- Configure `ANDROID_HOME` environment variable

#### iOS
- **macOS** required
- **Xcode** 14+ 
- **CocoaPods** installed
- Apple Developer Account

---

## 🛠️ Build Commands

### Web (PWA)

```bash
# Development
npm run dev:web

# Production build
npm run build:web

# Preview production build
npm run preview
```

**Output:** `dist/` folder ready for web hosting

---

### Desktop (Electron)

```bash
# Development
npm run dev:electron

# Build for current platform
npm run build:electron

# Build for specific platforms
npm run build:electron:win    # Windows (NSIS + Portable)
npm run build:electron:mac    # macOS (DMG + ZIP)
npm run build:electron:linux  # Linux (AppImage + DEB + RPM)
```

**Output:** `release/` folder with installers

**Installers Created:**
- **Windows:** `.exe` (NSIS installer) + portable `.exe`
- **macOS:** `.dmg` (disk image) + `.zip` (universal binary)
- **Linux:** `.AppImage`, `.deb`, `.rpm`

---

### Mobile (Capacitor)

#### Android

```bash
# Sync web build to Android
npm run sync:android

# Build Android APK/AAB
npm run build:android

# Run on connected device/emulator
npm run run:android

# Open in Android Studio
npm run open:android
```

**Manual Build in Android Studio:**
1. Run `npm run open:android`
2. Build > Build Bundle(s) / APK(s)
3. Generate Signed Bundle/APK for release

**Output:** 
- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/bundle/release/app-release.aab`

#### iOS

```bash
# Sync web build to iOS
npm run sync:ios

# Build iOS
npm run build:ios

# Run on simulator/device
npm run run:ios

# Open in Xcode
npm run open:ios
```

**Manual Build in Xcode:**
1. Run `npm run open:ios`
2. Select target device/simulator
3. Product > Archive (for distribution)
4. Distribute to App Store or TestFlight

**Output:** IPA file via Xcode

---

### Build All Platforms

```bash
npm run build:all
```

Builds web, desktop, and prepares mobile projects (requires platform tools).

---

## 🎨 Icon & Asset Requirements

### Required Assets Structure

```
build/
├── icon.ico              # Windows icon (256x256)
├── icon.icns             # macOS icon (512x512)
├── icons/                # Linux icons
│   ├── 16x16.png
│   ├── 32x32.png
│   ├── 48x48.png
│   ├── 64x64.png
│   ├── 128x128.png
│   ├── 256x256.png
│   └── 512x512.png
├── dmg-background.png    # macOS DMG background (540x380)
└── splash.png            # Mobile splash screen (2732x2732)

android/app/src/main/res/
├── mipmap-hdpi/         # 72x72
├── mipmap-mdpi/         # 48x48
├── mipmap-xhdpi/        # 96x96
├── mipmap-xxhdpi/       # 144x144
└── mipmap-xxxhdpi/      # 192x192

ios/App/App/Assets.xcassets/
└── AppIcon.appiconset/   # All iOS icon sizes
```

### Generating Icons

#### Quick Method (Web Tool)
Use **https://realfavicongenerator.net/** or **https://icon.kitchen/**

#### From Source (Node.js)
```bash
# Open icon generator
npm run dev
# Navigate to http://localhost:5173/generate-icons.html
# Download all icons
```

#### Capacitor Icons & Splash
```bash
# Install capacitor assets tool
npm install -g @capacitor/assets

# Generate from source (requires resources/ folder)
npx capacitor-assets generate --iconBackgroundColor '#ff7b00' --splashBackgroundColor '#0a0a0f'
```

**Source Images:**
- `resources/icon.png` - 1024x1024 PNG (transparent background)
- `resources/splash.png` - 2732x2732 PNG

---

## 📦 Distribution

### Web (PWA)

Deploy `dist/` folder to any static host:

**Recommended Hosts:**
- **Vercel:** `vercel deploy`
- **Netlify:** `netlify deploy --prod`
- **GitHub Pages:** Push `dist/` to `gh-pages` branch
- **Firebase:** `firebase deploy`

**Environment Variables:**
```bash
VITE_OPENAI_API_KEY=your_key
VITE_USE_OLLAMA=false
```

---

### Desktop (Electron)

#### Auto-Update Setup

1. **GitHub Releases** (Recommended)
   - Tag release: `git tag v1.0.0`
   - Push: `git push --tags`
   - electron-builder publishes to GitHub Releases

2. **Update server URL:**
   ```json
   "publish": {
     "provider": "github",
     "owner": "your-username",
     "repo": "seven-ai-assistant"
   }
   ```

#### Manual Distribution
- Upload installers to your website
- Users download and install

#### Code Signing

**Windows:**
```bash
# Set certificate path
export CSC_LINK=/path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password

npm run build:electron:win
```

**macOS:**
```bash
# Use Apple Developer ID
export APPLEID=your@email.com
export APPLEIDPASS=app-specific-password

npm run build:electron:mac
```

---

### Mobile (Android)

#### Google Play Store

1. Build release AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

2. Sign with keystore:
   ```bash
   # Generate keystore (first time only)
   keytool -genkey -v -keystore seven-release.keystore -alias seven -keyalg RSA -keysize 2048 -validity 10000
   ```

3. Configure `android/app/build.gradle`:
   ```gradle
   android {
     signingConfigs {
       release {
         storeFile file("seven-release.keystore")
         storePassword "password"
         keyAlias "seven"
         keyPassword "password"
       }
     }
   }
   ```

4. Upload AAB to Google Play Console

#### Direct APK Distribution
- Build debug APK: `npm run build:android`
- Share APK file directly (enable "Unknown sources" required)

---

### Mobile (iOS)

#### App Store

1. Open Xcode: `npm run open:ios`
2. Product > Archive
3. Window > Organizer
4. Distribute App > App Store Connect
5. Upload to TestFlight/App Store
6. Submit for review in App Store Connect

#### TestFlight (Beta)
- Same as App Store, select TestFlight in distribution
- Add testers via email in App Store Connect

---

## 🐛 Troubleshooting

### Build Fails

**Error: electron-builder not found**
```bash
npm install --save-dev electron-builder
```

**Error: Cannot find module 'vite-plugin-electron'**
```bash
npm install --save-dev vite-plugin-electron vite-plugin-electron-renderer
```

### Icon Errors

**Error: icon.ico not found**
- Create `build/` folder
- Add icons using generator or manual creation
- See [Icon Requirements](#icon--asset-requirements)

### Android Build Fails

**Error: SDK location not found**
```bash
# Add to android/local.properties
sdk.dir=/path/to/Android/sdk

# Or set environment variable
export ANDROID_HOME=/path/to/Android/sdk
```

**Error: Gradle build failed**
```bash
cd android
./gradlew clean
cd ..
npm run build:android
```

### iOS Build Fails

**Error: CocoaPods not installed**
```bash
sudo gem install cocoapods
cd ios/App
pod install
cd ../..
```

**Error: Code signing failed**
- Open Xcode: `npm run open:ios`
- Select target > Signing & Capabilities
- Select your team and provisioning profile

### Capacitor Sync Issues

**Error: Capacitor not initialized**
```bash
npx cap init "Seven AI Assistant" "com.seven.assistant"
npm run sync:mobile
```

---

## 📊 Build Outputs Summary

| Platform | Command | Output Location | File Type |
|----------|---------|-----------------|-----------|
| **Web** | `build:web` | `dist/` | Static files |
| **Windows** | `build:electron:win` | `release/` | `.exe` (NSIS + Portable) |
| **macOS** | `build:electron:mac` | `release/` | `.dmg`, `.zip` |
| **Linux** | `build:electron:linux` | `release/` | `.AppImage`, `.deb`, `.rpm` |
| **Android** | `build:android` | `android/app/build/` | `.apk`, `.aab` |
| **iOS** | (via Xcode) | Xcode Organizer | `.ipa` |

---

## 🚀 Quick Start (Production)

```bash
# 1. Install dependencies
npm install

# 2. Build for all platforms
npm run build:all

# 3. Desktop installers will be in release/
# 4. Web build will be in dist/
# 5. Mobile projects ready for native builds
```

---

## 📝 Release Checklist

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md`
- [ ] Test all platforms
- [ ] Generate/verify icons and assets
- [ ] Configure code signing (if applicable)
- [ ] Build all platforms
- [ ] Test installers/packages
- [ ] Tag release: `git tag v1.0.0`
- [ ] Push: `git push --tags`
- [ ] Create GitHub Release
- [ ] Upload installers
- [ ] Submit to app stores (if applicable)
- [ ] Update website/documentation

---

## 🎉 Success!

Your Seven AI Assistant is now packaged and ready for distribution across all platforms! 

For support, issues, or contributions, visit: https://github.com/your-username/seven-ai-assistant














