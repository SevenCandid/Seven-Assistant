"""
Language Routes - Handle language settings and preferences
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from core.translation import language_translator
from core.memory import memory_manager
from core.utils import format_success_response, format_error_response

router = APIRouter()


class SetLanguageRequest(BaseModel):
    user_id: str
    language: str  # Language code (e.g., 'fr', 'es', 'ar')


class TranslateRequest(BaseModel):
    text: str
    source_lang: Optional[str] = None  # Auto-detect if not provided
    target_lang: str = "en"


class DetectLanguageRequest(BaseModel):
    text: str


@router.post("/language/set")
async def set_language(request: SetLanguageRequest):
    """
    Set user's preferred language
    Saves to user memory for persistence
    """
    try:
        # Validate language code
        if not language_translator.validate_language_code(request.language):
            return format_error_response(
                f"Unsupported language code: {request.language}. "
                f"Supported: {', '.join(language_translator.SUPPORTED_LANGUAGES.keys())}"
            )
        
        # Create user if doesn't exist
        memory_manager.create_user(request.user_id)
        
        # Save language preference to user memory
        memory_manager.save_user_fact(
            request.user_id,
            f"preferred_language: {request.language}",
            category="settings"
        )
        
        lang_name = language_translator.get_language_name(request.language)
        
        return format_success_response({
            "message": f"Language set to {lang_name}",
            "language": request.language,
            "language_name": lang_name
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/language/get/{user_id}")
async def get_language(user_id: str):
    """
    Get user's preferred language
    Returns 'en' if not set
    """
    try:
        # Get user facts
        user_memory = memory_manager.get_user_memory(user_id)
        facts = user_memory.get("facts", [])
        
        # Look for language preference
        preferred_lang = "en"
        for fact in facts:
            if fact.startswith("preferred_language:"):
                preferred_lang = fact.split(":")[-1].strip()
                break
        
        lang_name = language_translator.get_language_name(preferred_lang)
        
        return format_success_response({
            "language": preferred_lang,
            "language_name": lang_name
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/language/supported")
async def get_supported_languages():
    """
    Get list of all supported languages
    """
    try:
        languages = language_translator.get_supported_languages()
        primary = language_translator.PRIMARY_LANGUAGES
        
        return format_success_response({
            "languages": languages,
            "primary_languages": primary,
            "total_count": len(languages)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/language/detect")
async def detect_language(request: DetectLanguageRequest):
    """
    Detect language of input text
    """
    try:
        if not language_translator.is_available():
            return format_error_response(
                "Language detection not available. Install: pip install deep-translator langdetect"
            )
        
        detected = language_translator.detect_language(request.text)
        lang_name = language_translator.get_language_name(detected)
        
        return format_success_response({
            "language": detected,
            "language_name": lang_name,
            "text_sample": request.text[:100]
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/language/translate")
async def translate_text(request: TranslateRequest):
    """
    Translate text between languages
    Auto-detects source language if not provided
    """
    try:
        if not language_translator.is_available():
            return format_error_response(
                "Translation not available. Install: pip install deep-translator langdetect"
            )
        
        # Detect source language if not provided
        source_lang = request.source_lang
        if not source_lang:
            source_lang = language_translator.detect_language(request.text)
        
        # Translate
        translated = language_translator.translate(
            request.text,
            source_lang,
            request.target_lang
        )
        
        return format_success_response({
            "original": request.text,
            "translated": translated,
            "source_lang": source_lang,
            "target_lang": request.target_lang,
            "source_name": language_translator.get_language_name(source_lang),
            "target_name": language_translator.get_language_name(request.target_lang)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/language/status")
async def get_translation_status():
    """
    Check if translation is available
    """
    try:
        available = language_translator.is_available()
        
        return format_success_response({
            "available": available,
            "supported_languages": list(language_translator.SUPPORTED_LANGUAGES.keys()),
            "primary_languages": language_translator.PRIMARY_LANGUAGES,
            "total_languages": len(language_translator.SUPPORTED_LANGUAGES)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))











