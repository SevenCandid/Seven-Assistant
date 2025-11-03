# 🚂 Railway Deployment Guide

This guide will help you deploy the Seven AI Backend to Railway.

## 📋 Prerequisites

1. A GitHub account
2. Your project pushed to GitHub
3. A Railway account (sign up at https://railway.app - it's free!)

## 🎁 Railway Free Tier

- **$5/month in credits** (enough for small apps)
- Automatic deployments from GitHub
- Free SSL/HTTPS certificates
- Environment variables support
- Persistent storage
- Free tier is perfect for development/testing

## 🚀 Deployment Steps

### Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign in with GitHub

### Step 2: Deploy from GitHub

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository (`Seven-Assistant`)
4. Select the **`seven-ai-backend`** folder as the root
5. Railway will automatically detect Python and start building

### Step 3: Configure Environment Variables

In Railway dashboard, go to your project → **Variables** tab:

Add these required variables:

```env
# Required: Get free API key from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Optional: For CORS (add your Vercel frontend URL)
CORS_ORIGINS=https://your-app.vercel.app,http://localhost:5173

# Optional: Set environment
ENV=production

# Port is automatically set by Railway (PORT)
```

**Important:**
- Replace `your_groq_api_key_here` with your actual Groq API key
- Replace `your-app.vercel.app` with your actual Vercel frontend URL
- Add `http://localhost:5173` for local development

### Step 4: Generate Domain

1. In Railway dashboard → **Settings** tab
2. Click **"Generate Domain"**
3. Railway will provide a public URL like: `your-app.railway.app`

### Step 5: Update Frontend

Update your frontend environment variable to point to Railway:

1. Go to your Vercel project settings
2. Add environment variable:
   - **Name**: `VITE_BACKEND_URL`
   - **Value**: `https://your-app.railway.app` (your Railway URL)

Or update `src/core/backendApi.ts`:

```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://your-app.railway.app';
```

### Step 6: Verify Deployment

1. Check Railway logs for successful deployment
2. Visit: `https://your-app.railway.app/health`
3. Should see: `{"status": "healthy", "message": "Seven AI Backend is running"}`
4. Visit: `https://your-app.railway.app/docs` for API documentation

## 🔧 Troubleshooting

### Build Fails

- Check Railway logs for errors
- Verify `requirements.txt` has all dependencies
- Make sure Python version is compatible (3.10+)

### Backend Not Responding

- Check environment variables are set correctly
- Verify PORT is set (Railway sets this automatically)
- Check logs in Railway dashboard

### CORS Errors

- Make sure `CORS_ORIGINS` includes your frontend URL
- Or set `CORS_ORIGINS=*` to allow all origins (less secure)

### Database Issues

- Railway provides persistent storage automatically
- Database files are stored in `/data` folder
- They persist across deployments

## 💰 Costs

- **Free tier**: $5/month credits
- **Usage**: ~$0.10-0.50/month for small backend (depends on traffic)
- **Sleep**: Apps sleep after 30 days of inactivity (free tier)
- **Upgrade**: $5/month for always-on

## 🎉 You're Done!

Your backend should now be live at `https://your-app.railway.app`

**Next Steps:**
1. Test the API: `https://your-app.railway.app/docs`
2. Update frontend to use Railway URL
3. Test full integration

## 📚 Useful Links

- Railway Docs: https://docs.railway.app
- Railway Dashboard: https://railway.app/dashboard
- API Docs: `https://your-app.railway.app/docs`

---

**Made with ❤️ for Seven AI**

