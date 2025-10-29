"""
Message Routes - SMS and WhatsApp messaging
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.messaging import messaging_manager
from core.voice import voice_manager
from core.utils import format_success_response, extract_phone_number
import base64

router = APIRouter()

class SMSRequest(BaseModel):
    to: str
    message: str
    from_number: Optional[str] = None

class WhatsAppRequest(BaseModel):
    to: str
    message: str
    from_number: Optional[str] = None

class VoiceInputRequest(BaseModel):
    audio_data: Optional[str] = None  # Base64 encoded audio
    language: str = "en-US"

class VoiceOutputRequest(BaseModel):
    text: str
    return_audio: bool = False

@router.post("/send_sms")
async def send_sms(request: SMSRequest):
    """Send SMS message via Twilio"""
    try:
        # Clean phone number
        to_number = extract_phone_number(request.to)
        
        result = await messaging_manager.send_sms(
            to=to_number,
            message=request.message,
            from_number=request.from_number
        )
        
        if result["success"]:
            return format_success_response(result)
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "SMS send failed"))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/send_whatsapp")
async def send_whatsapp(request: WhatsAppRequest):
    """Send WhatsApp message via Twilio"""
    try:
        # Clean phone number
        to_number = extract_phone_number(request.to)
        
        result = await messaging_manager.send_whatsapp(
            to=to_number,
            message=request.message,
            from_number=request.from_number
        )
        
        if result["success"]:
            return format_success_response(result)
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "WhatsApp send failed"))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice_input")
async def voice_input(request: VoiceInputRequest):
    """
    Convert speech to text (Speech Recognition)
    Can accept base64 audio data or use microphone
    """
    try:
        audio_bytes = None
        if request.audio_data:
            # Decode base64 audio
            audio_bytes = base64.b64decode(request.audio_data)
        
        result = await voice_manager.speech_to_text(
            audio_data=audio_bytes,
            language=request.language
        )
        
        if result["success"]:
            return format_success_response(result)
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "Speech recognition failed"))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/voice_output")
async def voice_output(request: VoiceOutputRequest):
    """
    Convert text to speech (TTS)
    Can return audio data or play directly
    """
    try:
        result = await voice_manager.text_to_speech(
            text=request.text,
            return_audio=request.return_audio
        )
        
        if result["success"]:
            return format_success_response(result)
        else:
            raise HTTPException(status_code=400, detail=result.get("error", "TTS failed"))
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/messaging/status")
async def get_messaging_status():
    """Get messaging service status"""
    try:
        status = messaging_manager.get_status()
        
        return format_success_response(status)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/voice/voices")
async def get_available_voices():
    """Get list of available TTS voices"""
    try:
        voices = voice_manager.get_available_voices()
        
        return format_success_response({
            "voices": voices,
            "count": len(voices)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))







