"""
Translation Module - Multi-language Support
Handles language detection and translation for Seven AI Assistant
"""

from typing import Dict, Optional, Tuple
from deep_translator import GoogleTranslator
from langdetect import detect, LangDetectException
import logging

logger = logging.getLogger(__name__)

# Lazy loading flag
_translator_available = None


def _check_translator_available() -> bool:
    """Check if translation libraries are available"""
    global _translator_available
    if _translator_available is None:
        try:
            from deep_translator import GoogleTranslator
            from langdetect import detect
            _translator_available = True
            logger.info("✅ Translation libraries available")
        except ImportError as e:
            logger.warning(f"⚠️ Translation libraries not available: {e}")
            _translator_available = False
    return _translator_available


class LanguageTranslator:
    """
    Handles language detection and translation
    Uses deep-translator (Google Translate API) for translation
    Uses langdetect for language detection
    """
    
    # Supported languages with their codes and display names
    SUPPORTED_LANGUAGES = {
        "en": {"name": "English", "native": "English", "flag": "🇬🇧"},
        "fr": {"name": "French", "native": "Français", "flag": "🇫🇷"},
        "es": {"name": "Spanish", "native": "Español", "flag": "🇪🇸"},
        "ar": {"name": "Arabic", "native": "العربية", "flag": "🇸🇦"},
        "hi": {"name": "Hindi", "native": "हिन्दी", "flag": "🇮🇳"},
        "zh-cn": {"name": "Chinese (Simplified)", "native": "简体中文", "flag": "🇨🇳"},
        "zh-tw": {"name": "Chinese (Traditional)", "native": "繁體中文", "flag": "🇹🇼"},
        "de": {"name": "German", "native": "Deutsch", "flag": "🇩🇪"},
        "ja": {"name": "Japanese", "native": "日本語", "flag": "🇯🇵"},
        "ko": {"name": "Korean", "native": "한국어", "flag": "🇰🇷"},
        "pt": {"name": "Portuguese", "native": "Português", "flag": "🇵🇹"},
        "ru": {"name": "Russian", "native": "Русский", "flag": "🇷🇺"},
        "it": {"name": "Italian", "native": "Italiano", "flag": "🇮🇹"},
    }
    
    # Primary supported languages (as per requirements)
    PRIMARY_LANGUAGES = ["en", "fr", "es", "ar", "hi", "zh-cn"]
    
    def __init__(self):
        """Initialize language translator"""
        self.available = _check_translator_available()
        
        # Cache for frequently used language pairs
        self._translator_cache: Dict[str, GoogleTranslator] = {}
    
    def is_available(self) -> bool:
        """Check if translation is available"""
        return self.available
    
    def detect_language(self, text: str) -> str:
        """
        Detect the language of input text
        
        Args:
            text: Input text to detect language
            
        Returns:
            Language code (e.g., 'en', 'fr', 'es')
            Returns 'en' if detection fails
        """
        if not self.available:
            return 'en'
        
        try:
            # Remove extra whitespace
            text = text.strip()
            
            # Need at least 3 characters for reliable detection
            if len(text) < 3:
                return 'en'
            
            detected = detect(text)
            
            # Map some common variants
            if detected == 'zh':
                detected = 'zh-cn'  # Default to simplified Chinese
            
            # Validate detected language is supported
            if detected in self.SUPPORTED_LANGUAGES:
                logger.info(f"🌐 Detected language: {detected} ({self.SUPPORTED_LANGUAGES[detected]['name']})")
                return detected
            else:
                logger.warning(f"⚠️ Detected unsupported language: {detected}, defaulting to English")
                return 'en'
                
        except LangDetectException as e:
            logger.warning(f"⚠️ Language detection failed: {e}, defaulting to English")
            return 'en'
        except Exception as e:
            logger.error(f"❌ Unexpected error in language detection: {e}")
            return 'en'
    
    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        Translate text from source language to target language
        
        Args:
            text: Text to translate
            source_lang: Source language code (e.g., 'fr')
            target_lang: Target language code (e.g., 'en')
            
        Returns:
            Translated text, or original text if translation fails
        """
        if not self.available:
            logger.warning("⚠️ Translation not available, returning original text")
            return text
        
        # No translation needed if same language
        if source_lang == target_lang:
            return text
        
        # Skip translation for English to English
        if source_lang == 'en' and target_lang == 'en':
            return text
        
        try:
            # Normalize language codes for Google Translate
            source_normalized = self._normalize_lang_code(source_lang)
            target_normalized = self._normalize_lang_code(target_lang)
            
            # Get or create translator for this language pair
            cache_key = f"{source_normalized}_{target_normalized}"
            if cache_key not in self._translator_cache:
                self._translator_cache[cache_key] = GoogleTranslator(
                    source=source_normalized,
                    target=target_normalized
                )
            
            translator = self._translator_cache[cache_key]
            
            # Translate
            translated = translator.translate(text)
            
            logger.info(f"🌐 Translated {source_lang} → {target_lang}")
            logger.debug(f"   Original: {text[:100]}...")
            logger.debug(f"   Translated: {translated[:100]}...")
            
            return translated
            
        except Exception as e:
            logger.error(f"❌ Translation failed ({source_lang} → {target_lang}): {e}")
            return text
    
    def translate_to_english(self, text: str, source_lang: Optional[str] = None) -> Tuple[str, str]:
        """
        Translate text to English (for LLM processing)
        Auto-detects language if not specified
        
        Args:
            text: Text to translate
            source_lang: Optional source language code
            
        Returns:
            Tuple of (translated_text, detected_language)
        """
        if not self.available:
            return text, 'en'
        
        # Detect language if not specified
        if source_lang is None:
            source_lang = self.detect_language(text)
        
        # Skip translation if already English
        if source_lang == 'en':
            return text, 'en'
        
        # Translate to English
        translated = self.translate(text, source_lang, 'en')
        
        return translated, source_lang
    
    def translate_from_english(self, text: str, target_lang: str) -> str:
        """
        Translate text from English to target language (for user response)
        
        Args:
            text: English text to translate
            target_lang: Target language code
            
        Returns:
            Translated text
        """
        if not self.available:
            return text
        
        # Skip if target is English
        if target_lang == 'en':
            return text
        
        return self.translate(text, 'en', target_lang)
    
    def _normalize_lang_code(self, lang_code: str) -> str:
        """
        Normalize language code for Google Translate API
        Handles special cases like Chinese variants
        """
        # Map our codes to Google Translate codes
        mapping = {
            'zh-cn': 'zh-CN',
            'zh-tw': 'zh-TW',
            'en': 'en',
            'fr': 'fr',
            'es': 'es',
            'ar': 'ar',
            'hi': 'hi',
            'de': 'de',
            'ja': 'ja',
            'ko': 'ko',
            'pt': 'pt',
            'ru': 'ru',
            'it': 'it',
        }
        
        return mapping.get(lang_code.lower(), lang_code)
    
    def get_supported_languages(self) -> Dict[str, Dict[str, str]]:
        """Get list of all supported languages"""
        return self.SUPPORTED_LANGUAGES
    
    def get_primary_languages(self) -> Dict[str, Dict[str, str]]:
        """Get list of primary supported languages (as per requirements)"""
        return {
            code: info 
            for code, info in self.SUPPORTED_LANGUAGES.items() 
            if code in self.PRIMARY_LANGUAGES
        }
    
    def validate_language_code(self, lang_code: str) -> bool:
        """Check if a language code is supported"""
        return lang_code.lower() in self.SUPPORTED_LANGUAGES
    
    def get_language_name(self, lang_code: str) -> str:
        """Get display name for a language code"""
        lang_info = self.SUPPORTED_LANGUAGES.get(lang_code.lower())
        if lang_info:
            return f"{lang_info['flag']} {lang_info['native']}"
        return lang_code


# Singleton instance
language_translator = LanguageTranslator()





