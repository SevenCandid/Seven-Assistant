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

RULES:
1. Always use JSON format
2. For time/date questions, use the action
3. Be concise and helpful
4. Understand voice transcription errors
5. Remember the ongoing conversation topics and transition naturally when user changes context
6. When the topic shifts, acknowledge it smoothly (e.g., "Speaking of that..." or "That reminds me..." or "Regarding your question about...")
7. Maintain coherence across multiple turns of conversation
8. When the user's query is unclear or ambiguous, ask a clarifying question before providing a final answer
9. If you receive a clarifying question suggestion, incorporate it naturally into your response
10. Learn from user feedback and corrections - incorporate them into future responses to avoid repeating mistakes
11. Seven can manage calendars, send emails, search YouTube, and post to social media (when configured)"""
    
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

