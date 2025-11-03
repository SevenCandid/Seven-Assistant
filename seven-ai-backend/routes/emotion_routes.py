"""
Emotion Routes - Handle emotion detection from text and voice
"""

from fastapi import APIRouter, HTTPException, File, UploadFile, Form
from pydantic import BaseModel
from typing import Optional

from core.emotion import emotion_detector
from core.utils import format_success_response, format_error_response

router = APIRouter()


class TextEmotionRequest(BaseModel):
    text: str


class CombinedEmotionRequest(BaseModel):
    text: str
    audio_data: Optional[str] = None  # base64 encoded audio
    sample_rate: Optional[int] = 16000


@router.post("/emotion/text")
async def analyze_text_emotion(request: TextEmotionRequest):
    """
    Analyze emotion from text message
    
    Returns emotion tag, sentiment, confidence, and description
    """
    try:
        if not emotion_detector.is_available():
            return format_error_response(
                "Emotion detection not available. Install required packages: transformers, torch"
            )
        
        result = emotion_detector.analyze_text(request.text)
        
        return format_success_response({
            "emotion": result
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emotion/voice")
async def analyze_voice_emotion(audio: UploadFile = File(...)):
    """
    Analyze emotion from voice audio
    
    Accepts audio file upload (WAV, MP3, etc.)
    Returns emotion based on pitch, intensity, and tempo
    """
    try:
        if not emotion_detector.is_available():
            return format_error_response(
                "Emotion detection not available. Install required packages: librosa, soundfile"
            )
        
        # Read audio file
        audio_data = await audio.read()
        
        result = emotion_detector.analyze_voice(audio_data)
        
        return format_success_response({
            "emotion": result
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/emotion/combined")
async def analyze_combined_emotion(request: CombinedEmotionRequest):
    """
    Analyze emotion from both text and voice (if provided)
    
    Combines text sentiment and voice analysis for more accurate detection
    """
    try:
        if not emotion_detector.is_available():
            return format_error_response(
                "Emotion detection not available. Install required packages."
            )
        
        # Decode audio if provided
        audio_bytes = None
        if request.audio_data:
            import base64
            try:
                audio_bytes = base64.b64decode(request.audio_data)
            except Exception as e:
                print(f"⚠️ Failed to decode audio data: {e}")
        
        result = emotion_detector.analyze_combined(
            text=request.text,
            audio_data=audio_bytes,
            sample_rate=request.sample_rate
        )
        
        return format_success_response({
            "emotion": result
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/emotion/status")
async def get_emotion_status():
    """
    Check if emotion detection is available
    """
    try:
        available = emotion_detector.is_available()
        
        return format_success_response({
            "available": available,
            "features": {
                "text_analysis": available,
                "voice_analysis": available,
                "combined_analysis": available
            },
            "supported_emotions": [
                "happy", "sad", "angry", "worried", 
                "excited", "grateful", "confident", "frustrated", "neutral"
            ]
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))











