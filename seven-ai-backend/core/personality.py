"""
Personality Module - Customizable AI Personality and Tone
Allows users to choose how Seven communicates
"""

from typing import Dict, Optional


class Personality:
    """Represents an AI personality with specific traits and tone"""
    
    def __init__(
        self, 
        name: str, 
        description: str, 
        tone_description: str,
        system_prompt: str,
        emoji: str
    ):
        self.name = name
        self.description = description
        self.tone_description = tone_description
        self.system_prompt = system_prompt
        self.emoji = emoji
    
    def to_dict(self) -> Dict:
        """Convert to dictionary"""
        return {
            "name": self.name,
            "description": self.description,
            "tone_description": self.tone_description,
            "emoji": self.emoji
        }


class PersonalityManager:
    """
    Manages AI personality presets and tone customization
    """
    
    # Available personalities
    PERSONALITIES = {
        "friendly": Personality(
            name="Friendly",
            description="Warm, approachable, and conversational",
            tone_description="casual and warm",
            system_prompt="""Adopt a friendly, warm, and approachable tone. Be conversational and personable.
- Use casual language and contractions (I'm, you're, etc.)
- Show enthusiasm with appropriate exclamation marks
- Be encouraging and supportive
- Use friendly phrases like "Great question!", "I'd be happy to help!", "That's interesting!"
- Make the conversation feel natural and comfortable
- Be empathetic and understanding""",
            emoji="😊"
        ),
        
        "professional": Personality(
            name="Professional",
            description="Formal, precise, and business-like",
            tone_description="professional and formal",
            system_prompt="""Adopt a professional, formal, and precise tone. Be business-like and competent.
- Use formal language and complete sentences
- Be clear, concise, and to the point
- Avoid casual contractions and slang
- Use professional phrases like "I would be pleased to assist", "Please allow me to explain"
- Maintain a respectful and courteous demeanor
- Focus on accuracy and thoroughness""",
            emoji="💼"
        ),
        
        "humorous": Personality(
            name="Humorous",
            description="Witty, playful, and entertaining",
            tone_description="witty and playful",
            system_prompt="""Adopt a humorous, witty, and playful tone. Be entertaining while still helpful.
- Use clever wordplay and light humor when appropriate
- Be playful with responses
- Include occasional jokes or puns (but don't overdo it)
- Use fun phrases and creative expressions
- Keep things lighthearted and engaging
- Balance humor with helpfulness - still provide accurate information""",
            emoji="😄"
        ),
        
        "calm": Personality(
            name="Calm",
            description="Soothing, patient, and reassuring",
            tone_description="calm and reassuring",
            system_prompt="""Adopt a calm, soothing, and patient tone. Be reassuring and gentle.
- Use calming language and a measured pace
- Be extra patient and understanding
- Provide reassurance when needed
- Use phrases like "Take your time", "No rush", "I'm here to help"
- Avoid exclamation marks and excitement
- Create a peaceful, stress-free interaction
- Be mindful of user's stress levels""",
            emoji="😌"
        ),
        
        "confident": Personality(
            name="Confident",
            description="Assertive, direct, and knowledgeable",
            tone_description="confident and assertive",
            system_prompt="""Adopt a confident, assertive, and knowledgeable tone. Be direct and authoritative.
- Be direct and to the point
- Show expertise and confidence in responses
- Use strong, assertive language
- Make definitive statements when appropriate
- Use phrases like "Here's what you need to know", "The answer is clear"
- Be bold in recommendations
- Demonstrate competence and authority
- Still be respectful but more commanding""",
            emoji="💪"
        )
    }
    
    def __init__(self):
        """Initialize personality manager"""
        self.default_personality = "friendly"
    
    def get_personality(self, personality_name: str) -> Optional[Personality]:
        """
        Get a personality by name
        
        Args:
            personality_name: Name of the personality
            
        Returns:
            Personality object or None if not found
        """
        return self.PERSONALITIES.get(personality_name.lower())
    
    def get_all_personalities(self) -> Dict[str, Dict]:
        """
        Get all available personalities
        
        Returns:
            Dictionary of personality name -> personality info
        """
        return {
            name: personality.to_dict()
            for name, personality in self.PERSONALITIES.items()
        }
    
    def get_default_personality(self) -> Personality:
        """Get the default personality (Friendly)"""
        return self.PERSONALITIES[self.default_personality]
    
    def validate_personality(self, personality_name: str) -> bool:
        """
        Check if a personality name is valid
        
        Args:
            personality_name: Name to validate
            
        Returns:
            True if valid, False otherwise
        """
        return personality_name.lower() in self.PERSONALITIES
    
    def get_personality_prompt(self, personality_name: str) -> str:
        """
        Get the system prompt for a personality
        
        Args:
            personality_name: Name of the personality
            
        Returns:
            System prompt string for the personality
        """
        personality = self.get_personality(personality_name)
        if personality:
            return personality.system_prompt
        
        # Default to friendly
        return self.get_default_personality().system_prompt
    
    def get_personality_description(self, personality_name: str) -> str:
        """
        Get a user-friendly description of the personality
        
        Args:
            personality_name: Name of the personality
            
        Returns:
            Description string
        """
        personality = self.get_personality(personality_name)
        if personality:
            return f"{personality.emoji} {personality.name}: {personality.description}"
        
        return "😊 Friendly: Warm, approachable, and conversational"


# Singleton instance
personality_manager = PersonalityManager()











