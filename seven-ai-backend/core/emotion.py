"""
Emotional Intelligence Module
Detects user sentiment and emotion from text and voice
"""

import os
from typing import Dict, Optional, Tuple
import numpy as np

# Lazy import transformers and librosa to avoid loading on startup
_sentiment_pipeline = None
_librosa = None


def _get_sentiment_pipeline():
    """Lazy load sentiment analysis pipeline"""
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        try:
            from transformers import pipeline
            print("🧠 Loading sentiment analysis model...")
            _sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=-1  # Use CPU
            )
            print("✅ Sentiment model loaded")
        except Exception as e:
            print(f"❌ Failed to load sentiment model: {e}")
            _sentiment_pipeline = False
    return _sentiment_pipeline if _sentiment_pipeline is not False else None


def _get_librosa():
    """Lazy load librosa"""
    global _librosa
    if _librosa is None:
        try:
            import librosa
            _librosa = librosa
        except Exception as e:
            print(f"❌ Failed to load librosa: {e}")
            _librosa = False
    return _librosa if _librosa is not False else None


class EmotionDetector:
    """
    Detects user emotions from text and voice
    """
    
    # Emotion mapping from sentiment to more nuanced emotions
    EMOTION_MAP = {
        "POSITIVE": ["happy", "excited", "grateful", "confident"],
        "NEGATIVE": ["sad", "angry", "frustrated", "worried"]
    }
    
    # Emotion descriptions for LLM context
    EMOTION_DESCRIPTIONS = {
        "happy": "cheerful and positive",
        "sad": "down or melancholic",
        "angry": "frustrated or upset",
        "worried": "anxious or concerned",
        "excited": "enthusiastic and energetic",
        "grateful": "thankful and appreciative",
        "confident": "assured and positive",
        "frustrated": "annoyed or irritated",
        "neutral": "calm and balanced"
    }
    
    def __init__(self):
        """Initialize emotion detector"""
        self.sentiment_available = False
        self.voice_analysis_available = False
        
    def is_available(self) -> bool:
        """Check if emotion detection is available"""
        pipeline = _get_sentiment_pipeline()
        return pipeline is not None
    
    def analyze_text(self, text: str) -> Dict[str, any]:
        """
        Analyze text sentiment and derive emotion
        
        Args:
            text: User's text message
            
        Returns:
            Dict with emotion, sentiment, confidence, and description
        """
        try:
            pipeline = _get_sentiment_pipeline()
            if pipeline is None:
                return self._default_emotion()
            
            # Get sentiment from model
            result = pipeline(text[:512])[0]  # Limit text length
            sentiment = result['label']  # POSITIVE or NEGATIVE
            confidence = result['score']
            
            # Map to emotion based on sentiment and confidence
            emotion = self._map_sentiment_to_emotion(sentiment, confidence, text)
            
            return {
                "emotion": emotion,
                "sentiment": sentiment.lower(),
                "confidence": round(confidence, 2),
                "description": self.EMOTION_DESCRIPTIONS.get(emotion, "neutral"),
                "source": "text"
            }
            
        except Exception as e:
            print(f"❌ Text emotion analysis error: {e}")
            return self._default_emotion()
    
    def analyze_voice(self, audio_data: bytes, sample_rate: int = 16000) -> Dict[str, any]:
        """
        Analyze voice audio for emotional cues (pitch, intensity, tempo)
        
        Args:
            audio_data: Raw audio bytes
            sample_rate: Audio sample rate
            
        Returns:
            Dict with emotion, pitch, intensity, and description
        """
        try:
            librosa = _get_librosa()
            if librosa is None:
                return self._default_emotion()
            
            import io
            import soundfile as sf
            
            # Convert bytes to numpy array
            audio_array, sr = sf.read(io.BytesIO(audio_data))
            
            # Extract audio features
            pitch_features = self._extract_pitch(audio_array, sr, librosa)
            intensity = self._extract_intensity(audio_array, librosa)
            tempo = self._extract_tempo(audio_array, sr, librosa)
            
            # Infer emotion from audio features
            emotion = self._infer_emotion_from_voice(
                pitch_features['mean'],
                pitch_features['variance'],
                intensity,
                tempo
            )
            
            return {
                "emotion": emotion,
                "pitch_mean": round(pitch_features['mean'], 2),
                "pitch_variance": round(pitch_features['variance'], 2),
                "intensity": round(intensity, 2),
                "tempo": round(tempo, 2),
                "description": self.EMOTION_DESCRIPTIONS.get(emotion, "neutral"),
                "source": "voice"
            }
            
        except Exception as e:
            print(f"❌ Voice emotion analysis error: {e}")
            return self._default_emotion()
    
    def analyze_combined(self, text: str, audio_data: Optional[bytes] = None, 
                        sample_rate: int = 16000) -> Dict[str, any]:
        """
        Combine text and voice analysis for more accurate emotion detection
        
        Args:
            text: User's text message
            audio_data: Optional voice audio bytes
            sample_rate: Audio sample rate
            
        Returns:
            Dict with combined emotion analysis
        """
        text_result = self.analyze_text(text)
        
        if audio_data:
            voice_result = self.analyze_voice(audio_data, sample_rate)
            
            # Combine results (prioritize voice if confidence is high)
            if voice_result.get('intensity', 0) > 0.6:
                combined_emotion = voice_result['emotion']
                source = "voice+text"
            else:
                combined_emotion = text_result['emotion']
                source = "text"
            
            return {
                "emotion": combined_emotion,
                "text_sentiment": text_result['sentiment'],
                "text_confidence": text_result['confidence'],
                "voice_intensity": voice_result.get('intensity', 0),
                "voice_pitch": voice_result.get('pitch_mean', 0),
                "description": self.EMOTION_DESCRIPTIONS.get(combined_emotion, "neutral"),
                "source": source
            }
        
        return text_result
    
    def _map_sentiment_to_emotion(self, sentiment: str, confidence: float, text: str) -> str:
        """Map sentiment to specific emotion based on confidence and keywords"""
        text_lower = text.lower()
        
        if sentiment == "POSITIVE":
            # High confidence positive emotions
            if confidence > 0.85:
                if any(word in text_lower for word in ["thanks", "thank you", "grateful", "appreciate"]):
                    return "grateful"
                if any(word in text_lower for word in ["!", "amazing", "awesome", "great", "excellent"]):
                    return "excited"
                return "happy"
            elif confidence > 0.65:
                return "confident"
            else:
                return "neutral"
        
        elif sentiment == "NEGATIVE":
            # High confidence negative emotions
            if confidence > 0.85:
                if any(word in text_lower for word in ["angry", "mad", "furious", "hate"]):
                    return "angry"
                if any(word in text_lower for word in ["worried", "anxious", "scared", "afraid", "nervous"]):
                    return "worried"
                if any(word in text_lower for word in ["frustrated", "annoyed", "irritated"]):
                    return "frustrated"
                return "sad"
            elif confidence > 0.65:
                return "worried"
            else:
                return "neutral"
        
        return "neutral"
    
    def _extract_pitch(self, audio: np.ndarray, sr: int, librosa) -> Dict[str, float]:
        """Extract pitch features from audio"""
        try:
            # Use librosa to extract pitch
            pitches, magnitudes = librosa.piptrack(y=audio, sr=sr)
            
            # Get mean pitch (filter out zeros)
            pitch_values = pitches[pitches > 0]
            if len(pitch_values) > 0:
                pitch_mean = float(np.mean(pitch_values))
                pitch_variance = float(np.var(pitch_values))
            else:
                pitch_mean = 0.0
                pitch_variance = 0.0
            
            return {
                "mean": pitch_mean,
                "variance": pitch_variance
            }
        except Exception as e:
            print(f"⚠️ Pitch extraction error: {e}")
            return {"mean": 0.0, "variance": 0.0}
    
    def _extract_intensity(self, audio: np.ndarray, librosa) -> float:
        """Extract intensity (RMS energy) from audio"""
        try:
            rms = librosa.feature.rms(y=audio)
            intensity = float(np.mean(rms))
            return intensity
        except Exception as e:
            print(f"⚠️ Intensity extraction error: {e}")
            return 0.0
    
    def _extract_tempo(self, audio: np.ndarray, sr: int, librosa) -> float:
        """Extract tempo from audio"""
        try:
            tempo, _ = librosa.beat.beat_track(y=audio, sr=sr)
            return float(tempo)
        except Exception as e:
            print(f"⚠️ Tempo extraction error: {e}")
            return 0.0
    
    def _infer_emotion_from_voice(self, pitch_mean: float, pitch_variance: float,
                                  intensity: float, tempo: float) -> str:
        """
        Infer emotion from voice features
        
        High pitch + high intensity = excited/angry
        Low pitch + low intensity = sad
        High variance = emotional/excited
        Low variance + moderate = calm/confident
        """
        if intensity < 0.3:
            return "sad"
        
        if pitch_mean > 200 and intensity > 0.6:
            if pitch_variance > 1000:
                return "angry"
            return "excited"
        
        if pitch_mean < 150 and intensity < 0.5:
            return "sad"
        
        if pitch_variance > 2000 and intensity > 0.7:
            return "frustrated"
        
        if intensity > 0.5 and tempo > 120:
            return "excited"
        
        if pitch_variance < 500 and intensity > 0.4:
            return "confident"
        
        return "neutral"
    
    def _default_emotion(self) -> Dict[str, any]:
        """Return default neutral emotion"""
        return {
            "emotion": "neutral",
            "sentiment": "neutral",
            "confidence": 0.0,
            "description": "calm and balanced",
            "source": "default"
        }
    
    def get_emotion_prompt(self, emotion_data: Dict[str, any]) -> str:
        """
        Generate a system prompt fragment for the LLM based on detected emotion
        
        Args:
            emotion_data: Result from analyze_text, analyze_voice, or analyze_combined
            
        Returns:
            String to be added to system prompt
        """
        emotion = emotion_data.get('emotion', 'neutral')
        description = emotion_data.get('description', 'neutral')
        source = emotion_data.get('source', 'unknown')
        
        if emotion == "neutral":
            return ""
        
        # Create empathetic prompt
        prompts = {
            "happy": "The user seems happy and cheerful. Match their positive energy and be encouraging.",
            "sad": "The user seems down or sad. Be empathetic, supportive, and gentle in your response.",
            "angry": "The user seems frustrated or upset. Be calm, understanding, and help them find solutions.",
            "worried": "The user seems anxious or concerned. Be reassuring, patient, and provide clear guidance.",
            "excited": "The user seems excited and enthusiastic. Share their energy and be encouraging.",
            "grateful": "The user seems grateful and appreciative. Acknowledge their thanks warmly.",
            "confident": "The user seems confident and assured. Match their positive tone and be supportive.",
            "frustrated": "The user seems frustrated. Be patient, understanding, and solution-oriented."
        }
        
        base_prompt = prompts.get(emotion, "")
        
        # Add detection source context
        if source == "voice":
            return f"{base_prompt} (Detected from voice tone)"
        elif source == "text":
            return f"{base_prompt} (Detected from message)"
        elif source == "voice+text":
            return f"{base_prompt} (Detected from voice and text)"
        
        return base_prompt


# Singleton instance
emotion_detector = EmotionDetector()











