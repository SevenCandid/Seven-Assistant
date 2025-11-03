"""
Voice System - Speech Recognition (STT) and Text-to-Speech (TTS)
"""

import speech_recognition as sr
import pyttsx3
import os
from typing import Optional, Dict
import base64
import io

class VoiceManager:
    def __init__(self):
        self.recognizer = sr.Recognizer()
        self.tts_engine = None
        self.voice_rate = int(os.getenv("VOICE_RATE", 150))
        self.voice_volume = float(os.getenv("VOICE_VOLUME", 0.9))
        
        # Initialize TTS engine
        try:
            self.tts_engine = pyttsx3.init()
            self.tts_engine.setProperty('rate', self.voice_rate)
            self.tts_engine.setProperty('volume', self.voice_volume)
        except Exception as e:
            print(f"⚠️ TTS engine initialization failed: {e}")
    
    async def speech_to_text(
        self,
        audio_data: bytes = None,
        language: str = "en-US"
    ) -> Dict:
        """
        Convert speech to text
        
        Args:
            audio_data: Audio bytes (WAV format) or None for microphone
            language: Language code for recognition
        
        Returns:
            Dict with 'text' and 'confidence'
        """
        try:
            if audio_data:
                # Convert bytes to AudioData
                audio = sr.AudioData(audio_data, 16000, 2)
            else:
                # Record from microphone
                with sr.Microphone() as source:
                    print("🎤 Listening...")
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                    audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=10)
            
            # Use Google Speech Recognition (free)
            text = self.recognizer.recognize_google(audio, language=language)
            
            return {
                "success": True,
                "text": text,
                "language": language
            }
        
        except sr.WaitTimeoutError:
            return {
                "success": False,
                "error": "No speech detected (timeout)"
            }
        except sr.UnknownValueError:
            return {
                "success": False,
                "error": "Could not understand audio"
            }
        except sr.RequestError as e:
            return {
                "success": False,
                "error": f"Speech recognition service error: {e}"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Speech recognition error: {str(e)}"
            }
    
    async def text_to_speech(
        self,
        text: str,
        return_audio: bool = False
    ) -> Dict:
        """
        Convert text to speech
        
        Args:
            text: Text to speak
            return_audio: If True, return audio bytes instead of playing
        
        Returns:
            Dict with success status and optional audio data
        """
        try:
            if not self.tts_engine:
                return {
                    "success": False,
                    "error": "TTS engine not available"
                }
            
            if return_audio:
                # Save to bytes buffer
                audio_buffer = io.BytesIO()
                self.tts_engine.save_to_file(text, audio_buffer)
                self.tts_engine.runAndWait()
                
                audio_data = audio_buffer.getvalue()
                audio_base64 = base64.b64encode(audio_data).decode('utf-8')
                
                return {
                    "success": True,
                    "audio": audio_base64,
                    "format": "wav"
                }
            else:
                # Play directly
                self.tts_engine.say(text)
                self.tts_engine.runAndWait()
                
                return {
                    "success": True,
                    "message": "Speech played successfully"
                }
        
        except Exception as e:
            return {
                "success": False,
                "error": f"TTS error: {str(e)}"
            }
    
    def set_voice_properties(self, rate: Optional[int] = None, volume: Optional[float] = None):
        """Update voice properties"""
        if self.tts_engine:
            if rate:
                self.tts_engine.setProperty('rate', rate)
                self.voice_rate = rate
            if volume:
                self.tts_engine.setProperty('volume', volume)
                self.voice_volume = volume
    
    def get_available_voices(self) -> list:
        """Get list of available TTS voices"""
        if self.tts_engine:
            voices = self.tts_engine.getProperty('voices')
            return [
                {
                    "id": voice.id,
                    "name": voice.name,
                    "languages": voice.languages if hasattr(voice, 'languages') else []
                }
                for voice in voices
            ]
        return []

# Singleton instance
voice_manager = VoiceManager()













