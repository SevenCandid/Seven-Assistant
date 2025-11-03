# 🔧 Vision System Debugging Guide

## 🐛 Issue: Incomplete Analysis Data

If you see empty data like this:
```
**Image Properties:**

**Face Detection:**
- No faces detected

**Text Recognition (OCR):**
- No text detected
```

---

## 🔍 **Debug Steps**

### 1. **Check Browser Console**

**Open Console:**
- Press **F12** (or Right-click → Inspect)
- Click **Console** tab

**Look for:**
```
✅ Analysis results received: { ... }
📊 Full analysis results: { ... }
```

**If you see errors:**
- ❌ Red error messages indicate the problem
- Look for "Network Error", "CORS", or "500" errors

### 2. **Verify Backend is Running**

**Check backend status:**
```bash
curl http://localhost:5000/api/vision/status
```

**Should return:**
```json
{"status":"online","features":{...}}
```

**If not working:**
```bash
cd seven-ai-backend
.\venv\Scripts\activate
python main.py
```

### 3. **Test API Directly**

**Test with curl:**
```powershell
# Create test request
$file = [System.IO.File]::ReadAllBytes("C:\path\to\image.jpg")
$boundary = [System.Guid]::NewGuid().ToString()
$headers = @{"Content-Type" = "multipart/form-data; boundary=$boundary"}

# Use API test tool instead
curl -X POST http://localhost:5000/api/vision/status
```

**Or use the API docs:**
- Open: http://localhost:5000/docs
- Click `/api/analyze_media`
- Click "Try it out"
- Upload an image
- See response

---

## 🎯 **Common Issues & Fixes**

### Issue 1: Backend Not Running
**Symptom:** "Failed to fetch" or network error

**Fix:**
```bash
cd seven-ai-backend
.\venv\Scripts\activate
python main.py
```

### Issue 2: CORS Error
**Symptom:** CORS policy error in console

**Fix:** Already configured, but check backend logs for CORS issues

### Issue 3: Image Format Not Supported
**Symptom:** Analysis returns empty data

**Supported formats:**
- ✅ JPEG (.jpg, .jpeg)
- ✅ PNG (.png)
- ✅ GIF (.gif)
- ✅ BMP (.bmp)
- ✅ WEBP (.webp)

**Try:** Convert image to JPEG and retry

### Issue 4: Image Too Large
**Symptom:** "File too large" or timeout

**Fix:**
- Max size: 50MB
- Compress image before upload
- Use lower resolution

### Issue 5: Corrupted Image
**Symptom:** Backend error 500

**Fix:**
- Try a different image
- Open image in editor and re-save
- Check image opens normally in image viewer

---

## 🔬 **Enhanced Debugging (For Current Issue)**

### What Changed:
1. ✅ Added `console.log` to see full results
2. ✅ Added validation warnings
3. ✅ Better error messages
4. ✅ Fallback handling

### How to Debug Your Issue:

**Step 1: Open Browser Console (F12)**

**Step 2: Upload Image Again**

**Step 3: Look for These Logs:**
```
✅ Analysis results received: { ... }
📊 Full analysis results: { ... }
```

**Step 4: Check the Object Structure**

Click the arrow next to the log to expand it. You should see:
```javascript
{
  "success": true,
  "type": "image",
  "filename": "photo.jpg",
  "offline_analysis": {
    "dimensions": { ... },
    "faces": { ... },
    "colors": { ... },
    "metrics": { ... }
  }
}
```

**If `offline_analysis` is missing or empty:**
- Backend error occurred
- Check backend terminal for Python errors

**If `offline_analysis.dimensions` is missing:**
- Image failed to decode
- Check image format and integrity

---

## 🚨 **Backend Errors**

### Check Backend Terminal

Look for Python errors like:
```
❌ Image analysis failed: ...
```

**Common Backend Errors:**

1. **OpenCV Error:**
   ```
   Fix: pip install opencv-python --upgrade
   ```

2. **Pillow Error:**
   ```
   Fix: pip install pillow --upgrade
   ```

3. **Memory Error:**
   ```
   Fix: Try smaller image or restart backend
   ```

---

## ✅ **Verification Test**

**Test with known good image:**

1. **Download test image:**
   ```
   https://picsum.photos/800/600
   ```

2. **Upload to Seven**

3. **Should see:**
   ```
   **Image Properties:**
   - Resolution: 800x600 pixels
   - Format: JPEG
   - File Size: ~50 KB

   **Face Detection:**
   - Detected: 0-2 faces

   **Color Analysis:**
   - Average Color: RGB(...)
   - Dominant Color: RGB(...)

   **Quality Metrics:**
   - Brightness: .../255
   - Contrast: ...
   - Sharpness: ...
   ```

---

## 📝 **Report Issues**

If still not working, collect this info:

1. **Browser Console Output:**
   - Copy all errors (red text)
   - Copy the `✅ Analysis results received` object

2. **Backend Terminal Output:**
   - Copy any Python errors
   - Copy the request log lines

3. **Image Details:**
   - Format (JPEG, PNG, etc.)
   - Size (KB/MB)
   - Resolution (width x height)
   - Where from (camera, download, screenshot)

4. **System Info:**
   - Browser (Chrome, Firefox, Edge)
   - OS (Windows 10/11)
   - Backend status: `curl http://localhost:5000/health`

---

## 🎯 **Next Steps**

1. **Check browser console** for the full data object
2. **Share console output** if you need help
3. **Try different image** to isolate the issue
4. **Restart backend** if needed

---

**The enhanced error handling is now live!** Upload an image and check the console (F12) for detailed debug info. 🔍












