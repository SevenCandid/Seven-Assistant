# 🎥 Vision System - Command Reference

## 🚀 Quick Commands

### Start Everything
```bash
# Terminal 1: Backend (already running!)
cd seven-ai-backend
.\venv\Scripts\activate
python main.py

# Terminal 2: Frontend
npm run dev
```

### Test API
```bash
# Check vision status
curl http://localhost:5000/api/vision/status

# Check Tesseract OCR status
curl http://localhost:5000/api/vision/tesseract_status

# Analyze image from URL
curl -X POST http://localhost:5000/api/analyze_image_url `
  -F "url=https://picsum.photos/800/600" `
  -F "mode=offline"
```

## 📸 Using the UI

**Desktop:**
- Click **👁️ (Eye icon)** in header
- Upload file or use camera

**Mobile:**
- Tap **☰ (Menu)**
- Select **"Media Analysis"**

## 🔧 Optional: Install Tesseract OCR

**Windows:**
```
Download: https://github.com/UB-Mannheim/tesseract/wiki
Add to PATH: C:\Program Files\Tesseract-OCR
```

**Mac:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `VISION_QUICKSTART.md` | 5-minute quick start |
| `VISION_SYSTEM.md` | Complete documentation |
| `VISION_IMPLEMENTATION_SUMMARY.md` | What was built |
| `VISION_COMMANDS.md` | This file |

## 🎯 URLs

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API Docs**: http://localhost:5000/docs
- **Vision Status**: http://localhost:5000/api/vision/status

## ⚡ Pro Tips

1. **Offline mode** is fastest (no API calls)
2. **Auto mode** gives best results (tries online, falls back)
3. **Max file size**: 50MB
4. **Supported**: JPEG, PNG, GIF, MP4, WEBM
5. **Camera works** on both desktop and mobile

## 🎉 One-Line Test

```bash
Start-Sleep -Seconds 3; curl http://localhost:5000/api/vision/status
```

If you see `"status":"online"`, you're good to go! 🚀






