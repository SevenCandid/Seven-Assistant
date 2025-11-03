"""
Feedback Routes - Continuous Learning API
Handles user feedback, corrections, and ratings
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict

from core.feedback import feedback_manager
from core.memory import memory_manager
from core.utils import format_success_response, format_error_response

router = APIRouter()


class AddFeedbackRequest(BaseModel):
    user_id: str
    message_id: str
    feedback_type: str  # 'rating' | 'correction' | 'clarification'
    rating: Optional[int] = None  # 1 or -1
    correction: Optional[str] = None
    user_message: Optional[str] = None
    assistant_response: Optional[str] = None
    context: Optional[Dict] = None


class ApplyInsightsRequest(BaseModel):
    user_id: str


@router.post("/feedback/add")
async def add_feedback(request: AddFeedbackRequest):
    """
    Add user feedback (rating or correction)
    """
    try:
        # Validate feedback type
        if request.feedback_type not in ['rating', 'correction', 'clarification']:
            return format_error_response("Invalid feedback_type. Use: rating, correction, or clarification")
        
        # Validate rating if provided
        if request.rating is not None and request.rating not in [1, -1]:
            return format_error_response("Rating must be 1 (thumbs up) or -1 (thumbs down)")
        
        # Add feedback
        feedback = feedback_manager.add_feedback(
            user_id=request.user_id,
            message_id=request.message_id,
            feedback_type=request.feedback_type,
            rating=request.rating,
            correction=request.correction,
            user_message=request.user_message,
            assistant_response=request.assistant_response,
            context=request.context
        )
        
        return format_success_response({
            "feedback": feedback,
            "message": "Feedback recorded successfully"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feedback/list/{user_id}")
async def get_feedback(
    user_id: str,
    feedback_type: Optional[str] = None,
    limit: int = 50
):
    """
    Get feedback history for user
    """
    try:
        feedback = feedback_manager.get_feedback(
            user_id=user_id,
            feedback_type=feedback_type,
            limit=limit
        )
        
        return format_success_response({
            "feedback": feedback,
            "count": len(feedback)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feedback/insights/{user_id}")
async def get_insights(
    user_id: str,
    min_frequency: int = 2
):
    """
    Get learning insights for user
    """
    try:
        insights = feedback_manager.get_learning_insights(
            user_id=user_id,
            min_frequency=min_frequency
        )
        
        return format_success_response({
            "insights": insights,
            "count": len(insights)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/feedback/summary/{user_id}")
async def get_summary(user_id: str):
    """
    Get feedback summary for user
    """
    try:
        summary = feedback_manager.get_feedback_summary(user_id)
        
        return format_success_response(summary)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/feedback/apply-insights")
async def apply_insights(request: ApplyInsightsRequest):
    """
    Apply learning insights to user memory
    """
    try:
        applied_count = feedback_manager.apply_insights_to_memory(
            user_id=request.user_id,
            memory_manager=memory_manager
        )
        
        return format_success_response({
            "applied_count": applied_count,
            "message": f"Applied {applied_count} learning insights to memory"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/feedback/clear/{user_id}")
async def clear_feedback(user_id: str):
    """
    Clear all feedback for user
    """
    try:
        # This would need to be implemented in feedback_manager
        # For now, return a message
        return format_success_response({
            "message": "Feedback clearing not yet implemented"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))











