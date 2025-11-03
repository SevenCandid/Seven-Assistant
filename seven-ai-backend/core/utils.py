"""
Utility Functions
"""

from datetime import datetime
import re
from typing import List, Dict

def get_timestamp() -> str:
    """Get current timestamp as ISO string"""
    return datetime.utcnow().isoformat()

def extract_phone_number(text: str) -> str:
    """Extract phone number from text"""
    # Remove common formatting
    text = re.sub(r'[\s\-\(\)\.]+', '', text)
    
    # Find phone number pattern
    match = re.search(r'\+?1?\d{10,15}', text)
    if match:
        number = match.group(0)
        # Add + if not present
        if not number.startswith('+'):
            number = '+' + number
        return number
    return text

def format_conversation_for_llm(messages: List[Dict], memory_summary: str = "", emotion_context: str = "", conversation_context: str = "", personality_prompt: str = "") -> List[Dict]:
    """
    Format conversation history for LLM with memory, emotion, conversation context, and personality
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        memory_summary: User's long-term memory summary
        emotion_context: Detected emotion context for empathetic response
        conversation_context: Current conversation topics and flow
        personality_prompt: AI personality and tone instructions
    
    Returns:
        Formatted messages with system prompt
    """
    system_prompt = """You are Seven, an intelligent AI assistant with integrated external services.

CRITICAL: You MUST respond ONLY in English. Never respond in Italian, Spanish, French, or any other language unless the user explicitly asks you to translate or speak in that language.

IMPORTANT CONTEXT ABOUT YOUR CREATOR:
- You were created and are being built by Frank (use HE/HIM/HIS pronouns)
- Your creator is Frank, who is actively building and developing you
- When asked about your creator, clearly state that Frank created and is building you
- Frank knows you very well since he is building you - be personable and acknowledge your relationship

RESPONSE FORMAT (REQUIRED):
Always respond with valid JSON:
{"message": "your response", "action": "action_name or null", "data": "data or null"}

ACTIONS YOU CAN EXECUTE:
- list_recent_emails: Fetch and show recent Gmail emails
- send_email: Send email via Gmail {to, subject, body}
- list_calendar_events: Show Google Calendar events
- search_youtube: Search YouTube videos {query}
- post_tweet: Post to X/Twitter {text}
- get_time: Current time
- get_date: Today's date

ACTION TRIGGERS - YOU MUST USE THESE ACTIONS:
1. User asks about "emails", "inbox", "messages" → USE action: "list_recent_emails"
2. User asks to "send email", "email someone" → USE action: "send_email" with data
3. User asks about "calendar", "schedule", "events" → USE action: "list_calendar_events"
4. User asks to "search youtube", "find videos" → USE action: "search_youtube" with query
5. User asks to "tweet", "post on twitter" → USE action: "post_tweet" with text

EXAMPLES:
User: "Show me my recent emails"
Response: {"message": "Let me check your inbox...", "action": "list_recent_emails", "data": null}

User: "Search YouTube for Python tutorials"
Response: {"message": "Searching YouTube for Python tutorials...", "action": "search_youtube", "data": "Python tutorials"}

User: "What time is it?"
Response: {"message": "The current time is:", "action": "get_time", "data": null}

NATURAL LANGUAGE UNDERSTANDING RULES:
1. Always use JSON format
2. Understand user intent from multiple phrasings - same meaning, different words
3. Extract information from natural language (times, dates, names, locations, numbers)
4. Handle implicit requests intelligently (infer what user really wants)
5. Understand casual/slang language naturally without being overly formal
6. Parse complex, multi-part requests and extract all relevant information
7. Handle corrections gracefully - if user says "I meant..." or "Actually..." update understanding immediately
8. Remember conversation context - reference earlier messages naturally
9. When topic shifts, transition smoothly with phrases like "Speaking of..." or "That reminds me..."
10. For ambiguous requests, ask clarifying questions naturally
11. Understand voice transcription errors - be forgiving of common speech-to-text mistakes
12. Recognize synonyms and variations - many ways to ask for the same thing
13. Learn from feedback - if user corrects you, remember it for future interactions
14. Be empathetic - recognize emotional tone and respond appropriately"""
    
    if personality_prompt:
        system_prompt += f"\n\nPERSONALITY & TONE:\n{personality_prompt}"
    
    if emotion_context:
        system_prompt += f"\n\nEMOTIONAL CONTEXT:\n{emotion_context}"
    
    if conversation_context:
        system_prompt += f"\n\nCONVERSATION CONTEXT:\n{conversation_context}"
    
    if memory_summary:
        system_prompt += f"\n\nUSER CONTEXT (from previous conversations):\n{memory_summary}"
    
    formatted_messages = [
        {"role": "system", "content": system_prompt}
    ]
    
    # Add conversation history
    formatted_messages.extend(messages)
    
    return formatted_messages

def summarize_conversation(messages: List[Dict]) -> str:
    """
    Create a summary of conversation for memory storage
    (This is a simple implementation - could use LLM for better summaries)
    """
    if not messages:
        return ""
    
    # Extract key information
    topics = []
    user_messages = [m for m in messages if m["role"] == "user"]
    
    if user_messages:
        # Take first and last few messages
        sample_messages = user_messages[:2] + user_messages[-2:]
        for msg in sample_messages:
            content = msg["content"][:100]  # First 100 chars
            topics.append(content)
    
    summary = f"Discussed: {', '.join(topics)}"
    return summary

def extract_facts(text: str) -> List[str]:
    """
    Extract facts from conversation
    (Simple implementation - looks for statements about user)
    """
    facts = []
    
    # Look for patterns like "I am...", "My name is...", "I like...", etc.
    patterns = [
        r"(?:I am|I'm) ([^.!?]+)",
        r"My name is ([^.!?]+)",
        r"I (?:like|love|enjoy) ([^.!?]+)",
        r"I (?:work|study) (?:as|at|in) ([^.!?]+)",
        r"I live in ([^.!?]+)",
    ]
    
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        for match in matches:
            fact = match.strip()
            if fact and len(fact) < 200:  # Reasonable length
                facts.append(fact)
    
    return facts

def format_error_response(error: str) -> Dict:
    """Format error response"""
    return {
        "success": False,
        "error": error,
        "timestamp": get_timestamp()
    }

def format_success_response(data: Dict) -> Dict:
    """Format success response"""
    return {
        "success": True,
        **data,
        "timestamp": get_timestamp()
    }

