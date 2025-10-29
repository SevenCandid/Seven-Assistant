# 🚀 Quick Start - Integrated Seven AI

## Start Servers (2 Terminals)

### Terminal 1 - Backend:
```powershell
cd seven-ai-backend
start-backend.bat
```
**Or manually:**
```powershell
cd seven-ai-backend
.\venv\Scripts\Activate.ps1
python main.py
```

### Terminal 2 - Frontend:
```bash
npm run dev
```

## Access

- **Frontend UI:** http://localhost:5173
- **Backend API Docs:** http://localhost:5000/docs
- **Backend Health:** http://localhost:5000/health

## Test Integration

1. **Open Frontend:** http://localhost:5173
2. **Open Browser Console** (F12)
3. **Send a message**
4. **Look for logs:**
   ```
   🔌 Sending message to backend API...
   📤 Sending message to backend
   📥 Received response from backend
   ```

## Features Working

✅ Chat with AI (via backend)  
✅ File uploads (documents)  
✅ New chat (synced sessions)  
✅ Chat history  
✅ Voice input/output  
✅ Theme customization  
✅ Auto-fallback if backend down  

## Troubleshooting

**Backend won't start?**
- Check if port 5000 is free: `netstat -ano | findstr :5000`
- Verify Groq API key in `seven-ai-backend/.env`

**Frontend can't reach backend?**
- Check backend is running: http://localhost:5000/health
- Check `.env` has `VITE_BACKEND_URL=http://localhost:5000`
- Restart frontend after `.env` changes

**Still using direct Groq?**
- Check console for "⚠️ Backend not available"
- Verify backend health endpoint works
- Check for CORS errors in console

## Files to Check

- Frontend config: `.env`
- Backend config: `seven-ai-backend/.env`  
- Frontend logs: Browser console (F12)
- Backend logs: Terminal running `python main.py`

---

**That's it! You're ready to use your integrated AI assistant!** 🎉







