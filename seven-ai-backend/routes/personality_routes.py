"""
Personality Routes - Handle personality and tone customization
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.personality import personality_manager
from core.memory import memory_manager
from core.utils import format_success_response, format_error_response

router = APIRouter()


class SetPersonalityRequest(BaseModel):
    user_id: str
    personality: str  # friendly, professional, humorous, calm, confident


class GetPersonalityRequest(BaseModel):
    user_id: str


@router.post("/personality/set")
async def set_personality(request: SetPersonalityRequest):
    """
    Set user's preferred AI personality/tone
    Saves to user memory for persistence
    """
    try:
        # Validate personality
        if not personality_manager.validate_personality(request.personality):
            available = list(personality_manager.PERSONALITIES.keys())
            return format_error_response(
                f"Invalid personality: {request.personality}. "
                f"Available: {', '.join(available)}"
            )
        
        # Create user if doesn't exist
        memory_manager.create_user(request.user_id)
        
        # Save personality preference to user memory
        memory_manager.save_user_fact(
            request.user_id,
            f"preferred_personality: {request.personality.lower()}",
            category="settings"
        )
        
        personality_desc = personality_manager.get_personality_description(request.personality)
        
        return format_success_response({
            "message": f"Personality set to {personality_desc}",
            "personality": request.personality.lower(),
            "description": personality_desc
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/personality/get/{user_id}")
async def get_personality(user_id: str):
    """
    Get user's preferred personality
    Returns 'friendly' if not set
    """
    try:
        # Get user facts
        user_memory = memory_manager.get_user_memory(user_id)
        facts = user_memory.get("facts", [])
        
        # Look for personality preference
        preferred_personality = "friendly"
        for fact in facts:
            if fact.startswith("preferred_personality:"):
                preferred_personality = fact.split(":")[-1].strip()
                break
        
        personality_desc = personality_manager.get_personality_description(preferred_personality)
        personality_obj = personality_manager.get_personality(preferred_personality)
        
        return format_success_response({
            "personality": preferred_personality,
            "description": personality_desc,
            "details": personality_obj.to_dict() if personality_obj else None
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/personality/available")
async def get_available_personalities():
    """
    Get list of all available personalities
    """
    try:
        personalities = personality_manager.get_all_personalities()
        
        return format_success_response({
            "personalities": personalities,
            "default": "friendly",
            "count": len(personalities)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/personality/preview/{personality_name}")
async def preview_personality(personality_name: str):
    """
    Preview a personality with example phrases
    """
    try:
        if not personality_manager.validate_personality(personality_name):
            return format_error_response(f"Invalid personality: {personality_name}")
        
        personality = personality_manager.get_personality(personality_name)
        
        # Example phrases for each personality
        examples = {
            "friendly": [
                "Hey! I'd be happy to help you with that!",
                "That's a great question! Let me explain...",
                "No worries! We'll figure this out together."
            ],
            "professional": [
                "I would be pleased to assist you with this matter.",
                "Allow me to provide you with the information you require.",
                "I shall address your inquiry with precision."
            ],
            "humorous": [
                "Well, well, well... looks like someone needs help! (I'm your AI, not a genie, but close enough!)",
                "That's a fantastic question! Let me put on my thinking cap... *beep boop* 🤓",
                "Ah, the age-old question! Almost as old as 'which came first, the chicken or the egg?'"
            ],
            "calm": [
                "Take a deep breath. Let's work through this together, one step at a time.",
                "No rush at all. I'm here whenever you're ready to continue.",
                "Everything's going to be just fine. Let me help you understand this."
            ],
            "confident": [
                "Here's exactly what you need to do.",
                "The answer is clear: let me break it down for you.",
                "I've got this covered. Trust me on this one."
            ]
        }
        
        return format_success_response({
            "personality": personality.to_dict(),
            "examples": examples.get(personality_name.lower(), []),
            "prompt": personality.system_prompt
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))











