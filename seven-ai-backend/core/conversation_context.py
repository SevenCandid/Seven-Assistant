"""
Conversation Context Management
Tracks topics, maintains multi-turn context, and enables smooth transitions
"""

from typing import Dict, List, Optional, Tuple
from datetime import datetime
import json

# Lazy imports
_classifier = None
_summarizer = None


def _get_classifier():
    """Lazy load zero-shot classifier"""
    global _classifier
    if _classifier is None:
        try:
            from transformers import pipeline
            print("🧠 Loading topic classifier...")
            _classifier = pipeline(
                "zero-shot-classification",
                model="facebook/bart-large-mnli",
                device=-1  # CPU
            )
            print("✅ Topic classifier loaded")
        except Exception as e:
            print(f"⚠️ Failed to load classifier: {e}")
            _classifier = False
    return _classifier if _classifier is not False else None


class ConversationTopic:
    """Represents a conversation topic with context"""
    
    def __init__(self, topic: str, keywords: List[str], messages: List[str], confidence: float = 1.0):
        self.topic = topic
        self.keywords = keywords
        self.messages = messages  # Last few messages about this topic
        self.confidence = confidence
        self.start_time = datetime.now()
        self.last_updated = datetime.now()
        self.message_count = len(messages)
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for storage"""
        return {
            "topic": self.topic,
            "keywords": self.keywords,
            "messages": self.messages,
            "confidence": self.confidence,
            "start_time": self.start_time.isoformat(),
            "last_updated": self.last_updated.isoformat(),
            "message_count": self.message_count
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'ConversationTopic':
        """Create from dictionary"""
        topic = cls(
            topic=data["topic"],
            keywords=data["keywords"],
            messages=data["messages"],
            confidence=data["confidence"]
        )
        topic.start_time = datetime.fromisoformat(data["start_time"])
        topic.last_updated = datetime.fromisoformat(data["last_updated"])
        topic.message_count = data["message_count"]
        return topic
    
    def add_message(self, message: str, max_messages: int = 5):
        """Add a message to this topic"""
        self.messages.append(message)
        if len(self.messages) > max_messages:
            self.messages = self.messages[-max_messages:]  # Keep last N messages
        self.last_updated = datetime.now()
        self.message_count += 1
    
    def get_summary(self) -> str:
        """Get a summary of this topic"""
        return f"{self.topic} (discussed in {self.message_count} messages)"


class ConversationContext:
    """
    Manages conversation context, topic tracking, and smooth transitions
    """
    
    # Common conversation topics for classification
    DEFAULT_TOPICS = [
        "greeting",
        "weather",
        "technology",
        "programming",
        "personal_life",
        "work",
        "entertainment",
        "food",
        "travel",
        "health",
        "sports",
        "news",
        "education",
        "finance",
        "shopping",
        "general_conversation"
    ]
    
    def __init__(self):
        """Initialize conversation context manager"""
        self.available = self._check_available()
        
        # Current conversation state
        self.current_topics: List[ConversationTopic] = []  # Last 3 topics
        self.current_topic: Optional[ConversationTopic] = None
        self.topic_history: List[ConversationTopic] = []
        
    def _check_available(self) -> bool:
        """Check if topic detection is available"""
        try:
            from transformers import pipeline
            return True
        except ImportError:
            print("⚠️ Transformers not available for topic detection")
            return False
    
    def is_available(self) -> bool:
        """Check if context tracking is available"""
        return self.available
    
    def detect_topic(self, text: str, candidate_topics: Optional[List[str]] = None) -> Tuple[str, float, List[str]]:
        """
        Detect the main topic of the text
        
        Args:
            text: Input text to analyze
            candidate_topics: Optional list of topics to classify against
            
        Returns:
            Tuple of (topic, confidence, keywords)
        """
        if not self.available:
            return "general_conversation", 0.5, self._extract_simple_keywords(text)
        
        try:
            classifier = _get_classifier()
            if classifier is None:
                return "general_conversation", 0.5, self._extract_simple_keywords(text)
            
            topics = candidate_topics or self.DEFAULT_TOPICS
            
            # Classify
            result = classifier(text, topics, multi_label=False)
            
            main_topic = result['labels'][0]
            confidence = result['scores'][0]
            
            # Extract keywords
            keywords = self._extract_keywords(text, main_topic)
            
            print(f"📋 Detected topic: {main_topic} (confidence: {confidence:.2f})")
            
            return main_topic, confidence, keywords
            
        except Exception as e:
            print(f"⚠️ Topic detection failed: {e}")
            return "general_conversation", 0.5, self._extract_simple_keywords(text)
    
    def _extract_keywords(self, text: str, topic: str) -> List[str]:
        """Extract keywords from text"""
        # Simple keyword extraction (can be enhanced with NLP)
        words = text.lower().split()
        
        # Filter stop words
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'this', 'that', 'these', 'those'}
        
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Take top 5 unique keywords
        return list(set(keywords))[:5]
    
    def _extract_simple_keywords(self, text: str) -> List[str]:
        """Simple keyword extraction without ML"""
        words = text.lower().split()
        stop_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'}
        keywords = [w for w in words if w not in stop_words and len(w) > 3]
        return list(set(keywords))[:5]
    
    def update_context(self, user_message: str, assistant_message: str) -> Dict:
        """
        Update conversation context with new messages
        
        Args:
            user_message: User's message
            assistant_message: Assistant's response
            
        Returns:
            Dict with context information
        """
        # Detect topic
        topic, confidence, keywords = self.detect_topic(user_message)
        
        # Check if topic changed
        topic_changed = False
        if self.current_topic is None or self.current_topic.topic != topic:
            topic_changed = True
            
            # Save current topic to history
            if self.current_topic:
                self.topic_history.append(self.current_topic)
                self.current_topics.append(self.current_topic)
                
                # Keep only last 3 topics
                if len(self.current_topics) > 3:
                    self.current_topics = self.current_topics[-3:]
            
            # Create new topic
            self.current_topic = ConversationTopic(
                topic=topic,
                keywords=keywords,
                messages=[user_message],
                confidence=confidence
            )
            
            print(f"🔄 Topic changed to: {topic}")
        else:
            # Same topic, add message
            self.current_topic.add_message(user_message)
            self.current_topic.confidence = (self.current_topic.confidence + confidence) / 2
            print(f"📌 Continuing topic: {topic}")
        
        return {
            "current_topic": topic,
            "confidence": confidence,
            "keywords": keywords,
            "topic_changed": topic_changed,
            "topic_history": [t.get_summary() for t in self.current_topics[-3:]],
            "message_count": self.current_topic.message_count
        }
    
    def get_context_summary(self) -> str:
        """
        Get a summary of the current conversation context
        
        Returns:
            String summary for LLM prompt
        """
        if not self.current_topics:
            return ""
        
        summary_parts = []
        
        # Recent topics
        if len(self.current_topics) > 0:
            recent_topics = [t.topic for t in self.current_topics[-3:]]
            summary_parts.append(f"Recent topics: {', '.join(recent_topics)}")
        
        # Current topic with details
        if self.current_topic:
            keywords_str = ", ".join(self.current_topic.keywords[:3])
            summary_parts.append(
                f"Current topic: {self.current_topic.topic} "
                f"(keywords: {keywords_str}, {self.current_topic.message_count} messages)"
            )
        
        return " | ".join(summary_parts)
    
    def check_for_topic_reset(self, message: str) -> bool:
        """
        Check if user wants to start a new topic
        
        Args:
            message: User's message
            
        Returns:
            True if user wants to reset context
        """
        reset_phrases = [
            "new topic",
            "change topic",
            "different topic",
            "talk about something else",
            "let's talk about",
            "anyway",
            "by the way",
            "speaking of which",
            "on a different note"
        ]
        
        message_lower = message.lower()
        
        for phrase in reset_phrases:
            if phrase in message_lower:
                print(f"🔄 Topic reset triggered by: '{phrase}'")
                return True
        
        return False
    
    def reset_current_topic(self):
        """Reset current topic (user requested topic change)"""
        if self.current_topic:
            self.topic_history.append(self.current_topic)
            self.current_topics.append(self.current_topic)
            
            if len(self.current_topics) > 3:
                self.current_topics = self.current_topics[-3:]
        
        self.current_topic = None
        print("🔄 Current topic reset")
    
    def reset_all(self):
        """Reset all conversation context (new chat)"""
        self.current_topics = []
        self.current_topic = None
        self.topic_history = []
        print("🗑️ All conversation context reset")
    
    def get_transition_prompt(self) -> str:
        """
        Get prompt for smooth topic transitions
        
        Returns:
            Prompt text for LLM
        """
        if not self.current_topic or len(self.current_topics) < 2:
            return ""
        
        previous_topic = self.current_topics[-2] if len(self.current_topics) >= 2 else None
        
        if previous_topic and previous_topic.topic != self.current_topic.topic:
            return (
                f"Note: The conversation has shifted from '{previous_topic.topic}' to '{self.current_topic.topic}'. "
                f"Acknowledge this transition smoothly and naturally in your response."
            )
        
        return ""
    
    def to_dict(self) -> Dict:
        """Convert context to dictionary for storage"""
        return {
            "current_topics": [t.to_dict() for t in self.current_topics],
            "current_topic": self.current_topic.to_dict() if self.current_topic else None,
            "topic_count": len(self.topic_history)
        }
    
    def from_dict(self, data: Dict):
        """Load context from dictionary"""
        self.current_topics = [
            ConversationTopic.from_dict(t) for t in data.get("current_topics", [])
        ]
        
        if data.get("current_topic"):
            self.current_topic = ConversationTopic.from_dict(data["current_topic"])
        else:
            self.current_topic = None


# Singleton instance
conversation_context = ConversationContext()











