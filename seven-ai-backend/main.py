"""
Seven AI Backend - Main Application
FastAPI server with cross-platform AI assistant capabilities
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import os
from dotenv import load_dotenv

from routes import chat_routes, memory_routes, message_routes, vision_routes, emotion_routes, language_routes, personality_routes, knowledge_routes, feedback_routes, integration_routes, dev_routes
from core.memory import initialize_database

# Load environment variables
load_dotenv()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize resources on startup"""
    print("🚀 Starting Seven AI Backend...")
    initialize_database()
    print("✅ Database initialized")
    print("🌐 Server ready!")
    yield
    print("👋 Shutting down Seven AI Backend...")

# Create FastAPI app
app = FastAPI(
    title="Seven AI Backend",
    description="Intelligent AI Assistant Backend with Memory, Voice, and Messaging",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",
        "http://localhost:3000",
        "http://192.168.*.*:5173",  # Local network
        "capacitor://localhost",  # Capacitor mobile
        "ionic://localhost",
        "*"  # Allow all for ngrok access
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chat_routes.router, prefix="/api", tags=["Chat"])
app.include_router(memory_routes.router, prefix="/api", tags=["Memory"])
app.include_router(message_routes.router, prefix="/api", tags=["Messaging"])
app.include_router(vision_routes.router, prefix="/api", tags=["Vision"])
app.include_router(emotion_routes.router, prefix="/api", tags=["Emotion"])
app.include_router(language_routes.router, prefix="/api", tags=["Language"])
app.include_router(personality_routes.router, prefix="/api", tags=["Personality"])
app.include_router(knowledge_routes.router, prefix="/api", tags=["Knowledge"])
app.include_router(feedback_routes.router, prefix="/api", tags=["Feedback"])
app.include_router(integration_routes.router, prefix="/api", tags=["Integrations"])
app.include_router(dev_routes.router, prefix="/api", tags=["Developer"])

@app.get("/")
async def root():
    """Root endpoint - Health check"""
    return {
        "status": "online",
        "service": "Seven AI Backend",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/api/chat",
            "new_chat": "/api/new_chat",
            "memory": "/api/memory",
            "send_sms": "/api/send_sms",
            "send_whatsapp": "/api/send_whatsapp",
            "voice_input": "/api/voice_input",
            "voice_output": "/api/voice_output",
            "analyze_media": "/api/analyze_media",
            "analyze_image_url": "/api/analyze_image_url",
            "vision_status": "/api/vision/status",
            "emotion_text": "/api/emotion/text",
            "emotion_voice": "/api/emotion/voice",
            "emotion_status": "/api/emotion/status",
            "language_set": "/api/language/set",
            "language_get": "/api/language/get/{user_id}",
            "language_supported": "/api/language/supported",
            "language_detect": "/api/language/detect",
            "language_translate": "/api/language/translate",
            "language_status": "/api/language/status",
            "personality_set": "/api/personality/set",
            "personality_get": "/api/personality/get/{user_id}",
            "personality_available": "/api/personality/available",
            "personality_preview": "/api/personality/preview/{personality_name}",
            "knowledge_add": "/api/knowledge/add",
            "knowledge_query": "/api/knowledge/query",
            "knowledge_all": "/api/knowledge/all",
            "knowledge_delete": "/api/knowledge/delete",
            "knowledge_clear": "/api/knowledge/clear",
            "knowledge_upload": "/api/knowledge/upload",
            "knowledge_stats": "/api/knowledge/stats",
            "feedback_add": "/api/feedback/add",
            "feedback_list": "/api/feedback/list/{user_id}",
            "feedback_insights": "/api/feedback/insights/{user_id}",
            "feedback_summary": "/api/feedback/summary/{user_id}",
            "feedback_apply": "/api/feedback/apply-insights",
            "integrations_status": "/api/integrations/status",
            "calendar_events": "/api/integrations/calendar/events",
            "calendar_create": "/api/integrations/calendar/create",
            "gmail_send": "/api/integrations/gmail/send",
            "gmail_recent": "/api/integrations/gmail/recent",
            "youtube_search": "/api/integrations/youtube/search",
            "x_tweet": "/api/integrations/x/tweet"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Seven AI Backend is running"}

if __name__ == "__main__":
    # Get port from environment or default to 5000
    port = int(os.getenv("PORT", 5000))
    
    print(f"""
    ================================================
         SEVEN AI BACKEND STARTED
    ================================================
      Local:   http://localhost:{port}
      Network: http://0.0.0.0:{port}
      
      API Docs: http://localhost:{port}/docs
      Health:   http://localhost:{port}/health
    ================================================
    
    To share globally with ngrok:
       ngrok http {port}
    """)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )


