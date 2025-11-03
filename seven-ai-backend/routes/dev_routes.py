"""
Developer Routes - Endpoints for developer console
Provides context, mood, and system information
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Optional
import sqlite3
from core.memory import memory_manager
from core.emotion import emotion_detector
from core.conversation_context import conversation_context
from core.utils import format_success_response, format_error_response

router = APIRouter()


@router.get("/context")
async def get_context():
    """
    Get recent conversation logs (last 10 messages across all sessions)
    For developer console display
    """
    try:
        # Access the memory manager's connection method
        conn = sqlite3.connect(memory_manager.db_path)
        cursor = conn.cursor()
        
        try:
            # Single user system - get last 10 messages for default user
            default_user_id = "seven_user"
            cursor.execute("""
                SELECT 
                    m.id,
                    m.session_id,
                    m.user_id,
                    m.role,
                    m.content,
                    m.timestamp
                FROM messages m
                WHERE m.user_id = ?
                ORDER BY m.timestamp DESC
                LIMIT 10
            """, (default_user_id,))
            
            rows = cursor.fetchall()
            
            logs = []
            for row in rows:
                logs.append({
                    "id": str(row[0]),
                    "session_id": row[1],
                    "user_id": row[2],
                    "role": row[3],
                    "content": row[4],
                    "timestamp": row[5]
                })
            
            # Reverse to show oldest first
            logs.reverse()
            
            return format_success_response({
                "logs": logs,
                "count": len(logs)
            })
            
        finally:
            conn.close()
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/mood")
async def get_mood():
    """
    Get current mood/emotion state
    For developer console display
    Returns the most recent emotion detection result if available
    """
    try:
        # Check if emotion detector is available
        if not emotion_detector.is_available():
            return format_success_response({
                "mood": None,
                "available": False,
                "message": "Emotion detection not available"
            })
        
        # Get conversation context for recent emotion data
        # Note: In a real implementation, you might want to store the last detected
        # emotion in the database. For now, we return a message indicating
        # that mood detection is available but needs recent conversation.
        
        # Try to get last emotion from context if available
        # This is a simplified version - in production you'd store this in DB
        return format_success_response({
            "mood": {
                "emotion": "neutral",  # Default
                "sentiment": "neutral",
                "confidence": 0.5,
                "description": "No recent emotion data available. Emotion detection is active and will analyze messages as they come in.",
                "available": True
            },
            "available": True
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


