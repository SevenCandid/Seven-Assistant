# 🎥 Seven AI Vision System Documentation

## Overview

Seven AI now includes a comprehensive **Image and Video Recognition** system that allows you to:
- 📸 Upload images and videos
- 📷 Capture photos directly from your camera
- 🔍 Analyze media using offline (OpenCV, PyTesseract) and online (GPT-4 Vision) AI
- 💬 Get intelligent responses from Seven about your media

---

## Features

### Offline Analysis (Always Available)
- **Face Detection**: Detects faces using Haar Cascade (OpenCV)
- **Text Recognition (OCR)**: Extracts text from images using PyTesseract
- **Color Analysis**: Analyzes dominant colors and color distribution
- **Object Detection**: Basic edge and contour detection
- **Quality Metrics**: Brightness, contrast, sharpness analysis
- **Image Fingerprinting**: Creates unique hash for duplicate detection

### Online Analysis (Optional - Requires API Keys)
- **AI Vision Description**: Comprehensive scene understanding using GPT-4 Vision or Groq
- **Advanced Object Recognition**: Better accuracy for complex scenes
- **Context Understanding**: Understands activities, mood, and atmosphere

### Supported Formats
- **Images**: JPEG, PNG, GIF, BMP, WEBP
- **Videos**: MP4, AVI, MOV, WEBM (analyzed by sampling frames)
- **Max File Size**: 50MB

---

## Installation

### Backend Dependencies

Already installed if you followed the setup! The vision system requires:

```bash
cd seven-ai-backend
.\venv\Scripts\activate
pip install pillow opencv-python pytesseract imagehash numpy
```

### Tesseract OCR (Optional - for text recognition)

**Windows:**
1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run installer
3. Add to PATH: `C:\Program Files\Tesseract-OCR`

**Mac:**
```bash
brew install tesseract
```

**Linux:**
```bash
sudo apt-get install tesseract-ocr
```

**Verify Installation:**
```bash
curl http://localhost:5000/api/vision/tesseract_status
```

---

## Usage

### From the UI

#### Desktop
1. Click the **👁️ Eye icon** in the header
2. Choose:
   - **Upload Image/Video**: Select a file from your computer
   - **Use Camera**: Capture a photo directly

#### Mobile
1. Tap the **☰ Menu icon**
2. Select **Media Analysis**
3. Upload or capture media

### Analysis Modes

- **Offline** (default): Fast, free, works without internet
  - Face detection
  - Text recognition (OCR)
  - Color & quality analysis
  
- **Online**: More accurate, requires API keys
  - Uses GPT-4 Vision for comprehensive descriptions
  - Better at understanding context and complex scenes

- **Auto**: Tries online first, falls back to offline

---

## API Endpoints

### POST `/api/analyze_media`

Analyze an image or video file.

**Request:**
```bash
curl -X POST http://localhost:5000/api/analyze_media \
  -F "file=@image.jpg" \
  -F "mode=auto"
```

**Response:**
```json
{
  "success": true,
  "type": "image",
  "filename": "image.jpg",
  "mode_used": "offline",
  "offline_analysis": {
    "dimensions": {"width": 1920, "height": 1080},
    "faces": {
      "count": 2,
      "locations": [...]
    },
    "text": {
      "found": true,
      "full_text": "Hello World",
      "word_count": 2
    },
    "colors": {
      "mean": {"r": 120, "g": 130, "b": 140},
      "dominant": {"r": 100, "g": 110, "b": 120}
    },
    "metrics": {
      "brightness": 128.5,
      "contrast": 45.2,
      "sharpness": 234.1,
      "quality": "good"
    }
  },
  "summary": "1920x1080 JPEG; 2 faces detected; 2 words of text"
}
```

### POST `/api/analyze_image_url`

Analyze an image from a URL.

**Request:**
```bash
curl -X POST http://localhost:5000/api/analyze_image_url \
  -F "url=https://example.com/image.jpg" \
  -F "mode=online"
```

### GET `/api/vision/status`

Check vision service capabilities.

**Response:**
```json
{
  "status": "online",
  "features": {
    "offline_analysis": {
      "available": true,
      "capabilities": [
        "Face detection",
        "Text recognition (OCR)",
        "Color analysis",
        "Basic object detection",
        "Image quality metrics"
      ]
    },
    "online_analysis": {
      "openai": {
        "available": true,
        "models": ["gpt-4o-mini", "gpt-4-vision-preview"]
      }
    }
  },
  "limits": {
    "max_file_size_mb": 50,
    "supported_formats": {
      "images": ["JPEG", "PNG", "GIF", "BMP", "WEBP"],
      "videos": ["MP4", "AVI", "MOV", "WEBM"]
    }
  }
}
```

---

## Integration with Seven AI

When you analyze media, Seven automatically receives the results and can:

1. **Summarize findings**: "I detected 2 faces and found the text 'Hello World'"
2. **Answer questions**: "What's in this image?" → Detailed description
3. **Make suggestions**: Based on what it sees
4. **Remember context**: Uses findings in ongoing conversation

### Example Conversation

```
You: [Upload photo of a sunset]

Seven: I analyzed your photo! It's a beautiful 1920x1080 image showing warm 
colors (reds and oranges dominate). The brightness is quite high (210/255), 
suggesting golden hour lighting. The image has good sharpness and quality. 
Would you like me to tell you more about it?

You: What makes it a good photo?

Seven: The high contrast (68.2) and excellent sharpness (445) indicate a 
well-focused shot. The warm dominant colors (RGB: 255, 120, 80) create 
a pleasing aesthetic typical of golden hour photography. The composition 
appears balanced based on the edge detection analysis.
```

---

## Configuration

### Environment Variables

Add to `seven-ai-backend/.env`:

```env
# Required for offline mode (already set)
GROQ_API_KEY=your_groq_key

# Optional: For GPT-4 Vision (better accuracy)
OPENAI_API_KEY=your_openai_key

# Optional: Custom Tesseract path (Windows)
TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
```

### Frontend Configuration

The frontend automatically uses:
- `http://localhost:5000` for backend in development
- Set `VITE_BACKEND_URL` to customize

---

## Architecture

### Backend Components

1. **`core/vision.py`**: Vision analysis engine
   - `VisionAnalyzer` class
   - Offline analysis (OpenCV, PyTesseract)
   - Online analysis (GPT-4 Vision)

2. **`routes/vision_routes.py`**: API endpoints
   - `/api/analyze_media`
   - `/api/analyze_image_url`
   - `/api/vision/status`

3. **Dependencies**:
   - `opencv-python`: Computer vision
   - `pillow`: Image processing
   - `pytesseract`: OCR
   - `imagehash`: Image fingerprinting
   - `numpy`: Numerical operations

### Frontend Components

1. **`MediaCapture.tsx`**: Main UI component
   - File upload
   - Camera capture
   - Preview and analysis

2. **`Header.tsx`**: Integration point
   - Desktop eye icon button
   - Mobile menu option

3. **`App.tsx`**: Result handler
   - `handleMediaAnalyzed()`: Processes results
   - Sends to Seven for response

---

## Advanced Usage

### Custom Prompts (Online Mode)

When using online analysis, you can provide custom prompts:

```python
import requests

files = {'file': open('image.jpg', 'rb')}
data = {
    'mode': 'online',
    'prompt': 'Analyze this image for accessibility issues and suggest improvements'
}

response = requests.post(
    'http://localhost:5000/api/analyze_media',
    files=files,
    data=data
)

print(response.json())
```

### Video Frame Sampling

Control how many frames to analyze from videos:

```python
files = {'file': open('video.mp4', 'rb')}
data = {
    'mode': 'auto',
    'sample_frames': 20  # Analyze 20 frames (default: 10)
}

response = requests.post(
    'http://localhost:5000/api/analyze_media',
    files=files,
    data=data
)
```

---

## Troubleshooting

### Tesseract Not Found

**Error:** `OCR features will not work until Tesseract is installed`

**Solution:**
1. Install Tesseract (see Installation section)
2. Check status: `curl http://localhost:5000/api/vision/tesseract_status`
3. If still not found, set path in `.env`:
   ```
   TESSERACT_CMD=C:\Program Files\Tesseract-OCR\tesseract.exe
   ```

### Slow Analysis

**Issue:** Analysis takes too long

**Solutions:**
- Use `mode=offline` for faster results
- Reduce video `sample_frames` (default: 10)
- Compress large images before uploading

### Camera Not Working

**Error:** "Could not access camera"

**Solutions:**
1. Grant camera permissions in browser
2. Use HTTPS (required by some browsers)
3. Check if another app is using the camera

### File Size Limit

**Error:** "File too large"

**Solution:** 
- Max size is 50MB
- Compress videos using tools like HandBrake
- Resize images using image editors

---

## Performance

### Offline Analysis
- **Image (1920x1080)**: ~0.5-2 seconds
- **Video (1 minute, 10 frames)**: ~5-20 seconds

### Online Analysis (GPT-4 Vision)
- **Image**: ~2-5 seconds
- **Additional cost**: Uses OpenAI API credits

### Optimization Tips
1. **Pre-process images**: Resize before upload
2. **Use offline mode**: For real-time analysis
3. **Batch processing**: Analyze multiple at once
4. **Cache results**: Store analysis in database

---

## Examples

### Analyzing a Screenshot

```javascript
// Frontend
const handleScreenshot = async (screenshotBlob) => {
  const file = new File([screenshotBlob], 'screenshot.png');
  const results = await backendApi.analyzeMedia(file, 'offline');
  
  if (results.offline_analysis.text.found) {
    console.log('Text in screenshot:', results.offline_analysis.text.full_text);
  }
};
```

### Batch Analysis

```python
# Backend/Script
import glob
import requests

for image_path in glob.glob('images/*.jpg'):
    with open(image_path, 'rb') as f:
        response = requests.post(
            'http://localhost:5000/api/analyze_media',
            files={'file': f},
            data={'mode': 'offline'}
        )
        
        result = response.json()
        print(f"{image_path}: {result['summary']}")
```

---

## Security & Privacy

- **Local Processing**: Offline mode never sends data externally
- **API Keys**: Stored securely in `.env` (server-side only)
- **No Storage**: Images are analyzed in memory and not saved
- **CORS**: Configured for localhost and your domains only

---

## Future Enhancements

Planned features:
- [ ] Real-time video stream analysis
- [ ] Advanced object detection (YOLO)
- [ ] Facial recognition and comparison
- [ ] Automatic tagging and categorization
- [ ] Integration with memory system (remember analyzed images)
- [ ] Support for more formats (PDF, TIFF)

---

## Support

### Check System Status
```bash
# Vision service status
curl http://localhost:5000/api/vision/status

# Tesseract OCR status
curl http://localhost:5000/api/vision/tesseract_status

# Backend health
curl http://localhost:5000/health
```

### Common Issues

1. **Backend not running**: `cd seven-ai-backend && python main.py`
2. **Dependencies missing**: `pip install -r requirements.txt`
3. **Camera permissions**: Check browser settings

---

## Credits

Built with:
- **OpenCV**: Computer vision library
- **PyTesseract**: OCR engine
- **Pillow**: Image processing
- **OpenAI GPT-4 Vision**: Advanced AI analysis
- **React**: Frontend UI
- **FastAPI**: Backend framework

---

**Enjoy analyzing media with Seven AI! 🎥📸**












