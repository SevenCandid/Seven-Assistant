"""
Memory Routes - Manage user memory
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from core.memory import memory_manager
from core.utils import format_success_response, format_error_response

router = APIRouter()

class UpdateMemoryRequest(BaseModel):
    user_id: str
    memory_summary: str
    facts: List[str]

@router.get("/memory/{user_id}")
async def get_memory(user_id: str):
    """Get user's long-term memory"""
    try:
        memory = memory_manager.get_user_memory(user_id)
        
        return format_success_response({
            "user_id": user_id,
            "memory": memory
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/memory/update")
async def update_memory(request: UpdateMemoryRequest):
    """Update user's long-term memory"""
    try:
        memory_manager.update_user_memory(
            user_id=request.user_id,
            memory_summary=request.memory_summary,
            facts=request.facts
        )
        
        return format_success_response({
            "message": "Memory updated successfully",
            "user_id": request.user_id
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/memory/{user_id}")
async def clear_memory(user_id: str):
    """Clear user's long-term memory (preserves chat history)"""
    try:
        memory_manager.clear_user_memory(user_id)
        
        return format_success_response({
            "message": "Memory cleared successfully",
            "user_id": user_id
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a chat session and its messages"""
    try:
        memory_manager.delete_session(session_id)
        
        return format_success_response({
            "message": "Session deleted successfully",
            "session_id": session_id
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))







