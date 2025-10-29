"""
Integration Routes - External Services API
Google Calendar, Gmail, YouTube, X (Twitter)
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, List
from datetime import datetime

from core.integrations import integration_manager, google_calendar, gmail, youtube, x_integration
from core.utils import format_success_response, format_error_response

router = APIRouter()


# ===== Request Models =====

class SetCredentialsRequest(BaseModel):
    service: str  # 'google_calendar' | 'gmail'
    credentials: Dict


class ListCalendarEventsRequest(BaseModel):
    max_results: Optional[int] = 10
    days_ahead: Optional[int] = 7


class CreateCalendarEventRequest(BaseModel):
    summary: str
    start_time: str  # ISO format
    end_time: str  # ISO format
    description: Optional[str] = ""
    location: Optional[str] = ""


class SendEmailRequest(BaseModel):
    to: str
    subject: str
    body: str
    from_email: Optional[str] = None


class YouTubeSearchRequest(BaseModel):
    query: str
    max_results: Optional[int] = 10
    order: Optional[str] = "relevance"


class PostTweetRequest(BaseModel):
    text: str


# ===== Status & Setup =====

@router.get("/integrations/status")
async def get_integration_status():
    """
    Get status of all integrations
    """
    try:
        status = integration_manager.get_status()
        actions = integration_manager.get_available_actions()
        
        return format_success_response({
            "status": status,
            "available_actions": actions
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/integrations/set-credentials")
async def set_credentials(request: SetCredentialsRequest):
    """
    Set OAuth credentials for a service
    """
    try:
        if request.service == 'google_calendar':
            success = google_calendar.set_credentials(request.credentials)
        elif request.service == 'gmail':
            success = gmail.set_credentials(request.credentials)
        else:
            return format_error_response(f"Unknown service: {request.service}")
        
        if success:
            return format_success_response({
                "message": f"Credentials set for {request.service}"
            })
        else:
            return format_error_response("Failed to set credentials")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Google Calendar =====

@router.post("/integrations/calendar/events")
async def list_calendar_events(request: ListCalendarEventsRequest):
    """
    List upcoming calendar events
    """
    try:
        if not google_calendar.is_available():
            return format_error_response("Google Calendar not configured")
        
        from datetime import timedelta
        time_min = datetime.utcnow()
        time_max = time_min + timedelta(days=request.days_ahead)
        
        events = google_calendar.list_events(
            max_results=request.max_results,
            time_min=time_min,
            time_max=time_max
        )
        
        return format_success_response({
            "events": events,
            "count": len(events)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/integrations/calendar/create")
async def create_calendar_event(request: CreateCalendarEventRequest):
    """
    Create a new calendar event
    """
    try:
        if not google_calendar.is_available():
            return format_error_response("Google Calendar not configured")
        
        # Parse datetime strings
        start_time = datetime.fromisoformat(request.start_time.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(request.end_time.replace('Z', '+00:00'))
        
        event = google_calendar.create_event(
            summary=request.summary,
            start_time=start_time,
            end_time=end_time,
            description=request.description,
            location=request.location
        )
        
        if event:
            return format_success_response({
                "event": event,
                "message": "Event created successfully"
            })
        else:
            return format_error_response("Failed to create event")
    
    except ValueError as e:
        return format_error_response(f"Invalid datetime format: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== Gmail =====

@router.post("/integrations/gmail/send")
async def send_email(request: SendEmailRequest):
    """
    Send an email via Gmail
    """
    try:
        if not gmail.is_available():
            return format_error_response("Gmail not configured")
        
        success = gmail.send_email(
            to=request.to,
            subject=request.subject,
            body=request.body,
            from_email=request.from_email
        )
        
        if success:
            return format_success_response({
                "message": f"Email sent to {request.to}"
            })
        else:
            return format_error_response("Failed to send email")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/integrations/gmail/recent")
async def get_recent_emails(max_results: int = 10):
    """
    Get recent emails from inbox
    """
    try:
        if not gmail.is_available():
            return format_error_response("Gmail not configured")
        
        emails = gmail.list_recent_emails(max_results=max_results)
        
        return format_success_response({
            "emails": emails,
            "count": len(emails)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== YouTube =====

@router.post("/integrations/youtube/search")
async def search_youtube(request: YouTubeSearchRequest):
    """
    Search YouTube videos
    """
    try:
        if not youtube.is_available():
            return format_error_response("YouTube API not configured")
        
        videos = youtube.search_videos(
            query=request.query,
            max_results=request.max_results,
            order=request.order
        )
        
        return format_success_response({
            "videos": videos,
            "count": len(videos),
            "query": request.query
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ===== X (Twitter) =====

@router.post("/integrations/x/tweet")
async def post_tweet(request: PostTweetRequest):
    """
    Post a tweet on X (Twitter)
    """
    try:
        if not x_integration.is_available():
            return format_error_response("X (Twitter) API not configured")
        
        if len(request.text) > 280:
            return format_error_response("Tweet exceeds 280 characters")
        
        tweet = x_integration.post_tweet(request.text)
        
        if tweet:
            return format_success_response({
                "tweet": tweet,
                "message": "Tweet posted successfully"
            })
        else:
            return format_error_response("Failed to post tweet")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))





