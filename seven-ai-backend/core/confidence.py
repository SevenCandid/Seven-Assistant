"""
Confidence Scoring Module - Handle Ambiguous and Uncertain Queries
Uses sentence-transformers to detect query clarity and confidence
"""

from typing import Dict, List, Tuple, Optional
import numpy as np

# Try to import sentence-transformers (optional dependency)
try:
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("WARNING: sentence-transformers not available for confidence scoring")


class ConfidenceScorer:
    """
    Detects ambiguous queries and provides confidence scoring
    Uses cosine similarity to measure intent clarity
    """
    
    # Common query intents and example patterns
    INTENT_PATTERNS = {
        "greeting": [
            "hello", "hi", "hey", "good morning", "good afternoon", "good evening",
            "what's up", "how are you", "greetings"
        ],
        "time_query": [
            "what time is it", "current time", "what's the time", "time now",
            "tell me the time", "clock"
        ],
        "date_query": [
            "what date is it", "what's today's date", "current date", "today's date",
            "what day is it", "date today"
        ],
        "search": [
            "search for", "look up", "find information about", "google",
            "search the web", "look for"
        ],
        "calculation": [
            "calculate", "compute", "what is", "plus", "minus", "times", "divided by",
            "math problem", "solve"
        ],
        "weather": [
            "weather", "temperature", "forecast", "rain", "sunny", "cloudy",
            "hot", "cold", "climate"
        ],
        "reminder": [
            "remind me", "set reminder", "don't forget", "remember to",
            "create reminder", "schedule reminder"
        ],
        "note": [
            "take note", "write down", "remember this", "save this",
            "create note", "add note"
        ],
        "help": [
            "help", "how do i", "how to", "can you help", "assist me",
            "what can you do", "capabilities", "features"
        ]
    }
    
    # Confidence threshold (below this, ask clarifying question)
    CONFIDENCE_THRESHOLD = 0.7
    
    def __init__(self):
        """Initialize confidence scorer"""
        self.model = None
        self.intent_embeddings = {}
        
        if TRANSFORMERS_AVAILABLE:
            try:
                # Use a lightweight model for speed
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                self._precompute_intent_embeddings()
                print("SUCCESS: Confidence scorer initialized with sentence-transformers")
            except Exception as e:
                print(f"WARNING: Failed to load sentence-transformers model: {e}")
                self.model = None
    
    def _precompute_intent_embeddings(self):
        """Precompute embeddings for intent patterns"""
        if not self.model:
            return
        
        for intent, patterns in self.INTENT_PATTERNS.items():
            # Compute embedding for each pattern
            embeddings = self.model.encode(patterns)
            # Store average embedding for this intent
            self.intent_embeddings[intent] = np.mean(embeddings, axis=0)
    
    def is_available(self) -> bool:
        """Check if confidence scoring is available"""
        return self.model is not None
    
    def cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return float(dot_product / (norm1 * norm2))
    
    def detect_intent(self, query: str) -> Tuple[str, float]:
        """
        Detect query intent and confidence score
        
        Args:
            query: User's query text
            
        Returns:
            Tuple of (intent, confidence_score)
        """
        if not self.is_available():
            # Fallback to simple keyword matching
            return self._simple_intent_detection(query)
        
        try:
            # Encode the query
            query_embedding = self.model.encode([query])[0]
            
            # Compare with all intent embeddings
            best_intent = "unknown"
            best_similarity = 0.0
            
            for intent, intent_embedding in self.intent_embeddings.items():
                similarity = self.cosine_similarity(query_embedding, intent_embedding)
                if similarity > best_similarity:
                    best_similarity = similarity
                    best_intent = intent
            
            return best_intent, best_similarity
        
        except Exception as e:
            print(f"⚠️ Intent detection error: {e}")
            return self._simple_intent_detection(query)
    
    def _simple_intent_detection(self, query: str) -> Tuple[str, float]:
        """
        Simple keyword-based intent detection (fallback)
        
        Args:
            query: User's query text
            
        Returns:
            Tuple of (intent, confidence_score)
        """
        query_lower = query.lower()
        
        best_intent = "unknown"
        best_score = 0.0
        
        for intent, patterns in self.INTENT_PATTERNS.items():
            # Count matching keywords
            matches = sum(1 for pattern in patterns if pattern in query_lower)
            score = matches / len(patterns) if patterns else 0.0
            
            if score > best_score:
                best_score = score
                best_intent = intent
        
        # Adjust confidence based on query length and clarity
        if len(query.split()) < 2:
            best_score *= 0.5  # Very short queries are ambiguous
        
        return best_intent, best_score
    
    def is_ambiguous(self, query: str) -> bool:
        """
        Check if query is ambiguous (low confidence)
        
        Args:
            query: User's query text
            
        Returns:
            True if query is ambiguous, False otherwise
        """
        _, confidence = self.detect_intent(query)
        return confidence < self.CONFIDENCE_THRESHOLD
    
    def analyze_query(self, query: str) -> Dict:
        """
        Comprehensive query analysis
        
        Args:
            query: User's query text
            
        Returns:
            Dictionary with analysis results
        """
        intent, confidence = self.detect_intent(query)
        is_ambiguous = confidence < self.CONFIDENCE_THRESHOLD
        
        # Detect specific ambiguity reasons
        ambiguity_reasons = []
        
        if len(query.strip()) == 0:
            ambiguity_reasons.append("empty_query")
            is_ambiguous = True
            confidence = 0.0
        elif len(query.split()) < 3:
            ambiguity_reasons.append("too_short")
        elif "what" in query.lower() and "?" not in query:
            ambiguity_reasons.append("incomplete_question")
        elif query.lower() in ["it", "that", "this", "thing", "something"]:
            ambiguity_reasons.append("vague_reference")
        elif query.count("?") > 2:
            ambiguity_reasons.append("multiple_questions")
        
        return {
            "query": query,
            "intent": intent,
            "confidence": round(confidence, 3),
            "is_ambiguous": is_ambiguous,
            "needs_clarification": is_ambiguous,
            "ambiguity_reasons": ambiguity_reasons,
            "threshold": self.CONFIDENCE_THRESHOLD
        }
    
    def generate_clarifying_question(self, query: str, analysis: Optional[Dict] = None) -> str:
        """
        Generate appropriate clarifying question based on query analysis
        
        Args:
            query: User's query text
            analysis: Pre-computed analysis (optional)
            
        Returns:
            Clarifying question string
        """
        if analysis is None:
            analysis = self.analyze_query(query)
        
        reasons = analysis.get("ambiguity_reasons", [])
        intent = analysis.get("intent", "unknown")
        
        # Generate contextual clarifying questions
        if "empty_query" in reasons:
            return "I didn't catch that. Could you please tell me what you'd like to know?"
        
        if "too_short" in reasons:
            return f"I see you mentioned '{query}'. Can you provide more details about what you'd like to know?"
        
        if "vague_reference" in reasons:
            return "I'm not sure what you're referring to. Could you be more specific?"
        
        if "multiple_questions" in reasons:
            return "I noticed you have several questions. Which one would you like me to address first?"
        
        if "incomplete_question" in reasons:
            return f"I think you're asking about something, but I'm not quite sure. Could you rephrase your question?"
        
        # Intent-specific clarifying questions
        if intent == "search":
            return "I can help you search! What specifically would you like me to look for?"
        elif intent == "reminder":
            return "I can set a reminder for you. What should I remind you about, and when?"
        elif intent == "calculation":
            return "I can help with calculations. What would you like me to compute?"
        elif intent == "weather":
            return "I can check the weather. For which location and what timeframe?"
        
        # Generic clarifying question
        return "I want to help, but I need a bit more information. Can you clarify what you mean?"


# Singleton instance
confidence_scorer = ConfidenceScorer()

