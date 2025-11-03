"""
Chat Routes - Handle chat messages and sessions
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict
import uuid

from core.llm import llm_client
from core.memory import memory_manager
from core.emotion import emotion_detector
from core.translation import language_translator
from core.conversation_context import conversation_context, ConversationContext
from core.personality import personality_manager
from core.confidence import confidence_scorer
from core.knowledge import knowledge_base
from core.feedback import feedback_manager
from core.integrations import integration_manager, gmail, google_calendar, youtube, x_integration
from core.utils import format_conversation_for_llm, format_success_response, format_error_response
from datetime import datetime, timedelta

router = APIRouter()


async def execute_action(action: str, data: any, user_id: str) -> dict:
    """
    Execute detected actions from LLM response
    
    Args:
        action: Action type (e.g., 'list_calendar_events', 'send_email')
        data: Action parameters
        user_id: User ID for context
        
    Returns:
        Action result dict
    """
    try:
        # Gmail actions
        if action == 'list_recent_emails':
            if not gmail.is_available():
                return {"message": "📧 Gmail not configured. Please set up Gmail in Settings → Integrations."}
            
            emails = gmail.list_recent_emails(max_results=5)
            if not emails:
                return {"message": "📧 No recent emails found or Gmail not connected properly."}
            
            result = "📧 Recent emails:\n\n"
            for i, email in enumerate(emails, 1):
                result += f"{i}. **{email['subject']}**\n"
                result += f"   From: {email['from']}\n"
                result += f"   {email['snippet'][:100]}...\n\n"
            
            return {"message": result, "emails": emails}
        
        elif action == 'send_email':
            if not gmail.is_available():
                return {"message": "📧 Gmail not configured. Please set up Gmail in Settings → Integrations."}
            
            if not data or not isinstance(data, dict):
                return {"message": "❌ Email data missing. Please provide recipient, subject, and body."}
            
            to = data.get('to', '')
            subject = data.get('subject', '')
            body = data.get('body', '')
            
            if not all([to, subject, body]):
                return {"message": "❌ Missing email details. Need: to, subject, and body."}
            
            success = gmail.send_email(to=to, subject=subject, body=body)
            if success:
                return {"message": f"✅ Email sent successfully to {to}!"}
            else:
                return {"message": f"❌ Failed to send email to {to}."}
        
        # Calendar actions
        elif action == 'list_calendar_events':
            if not google_calendar.is_available():
                return {"message": "📅 Google Calendar not configured. Please set up Calendar in Settings → Integrations."}
            
            days_ahead = 7
            if data and isinstance(data, dict):
                days_ahead = data.get('days_ahead', 7)
            
            time_min = datetime.utcnow()
            time_max = time_min + timedelta(days=days_ahead)
            
            events = google_calendar.list_events(max_results=10, time_min=time_min, time_max=time_max)
            if not events:
                return {"message": f"📅 No events found in the next {days_ahead} days."}
            
            result = f"📅 Upcoming events (next {days_ahead} days):\n\n"
            for i, event in enumerate(events, 1):
                start = event.get('start', 'N/A')
                result += f"{i}. **{event['summary']}**\n"
                result += f"   When: {start}\n"
                if event.get('location'):
                    result += f"   Where: {event['location']}\n"
                result += "\n"
            
            return {"message": result, "events": events}
        
        elif action == 'create_calendar_event':
            if not google_calendar.is_available():
                return {"message": "📅 Google Calendar not configured. Please set up Calendar in Settings → Integrations."}
            
            if not data or not isinstance(data, dict):
                return {"message": "❌ Event data missing. Please provide title, start time, and end time."}
            
            # This would need proper datetime parsing
            return {"message": "📅 Calendar event creation is not yet implemented in the action handler."}
        
        # YouTube actions
        elif action == 'search_youtube':
            if not youtube.is_available():
                return {"message": "🎥 YouTube API not configured. Please set up YouTube in Settings → Integrations."}
            
            query = data if isinstance(data, str) else data.get('query', '') if isinstance(data, dict) else ''
            if not query:
                return {"message": "❌ Search query missing."}
            
            videos = youtube.search_videos(query=query, max_results=5)
            if not videos:
                return {"message": f"🎥 No videos found for '{query}'."}
            
            result = f"🎥 YouTube results for '{query}':\n\n"
            for i, video in enumerate(videos, 1):
                result += f"{i}. **{video['title']}**\n"
                result += f"   by {video['channel']}\n"
                result += f"   {video['url']}\n\n"
            
            return {"message": result, "videos": videos}
        
        # X (Twitter) actions
        elif action == 'post_tweet':
            if not x_integration.is_available():
                return {"message": "✖️ X (Twitter) API not configured. Please set up X in Settings → Integrations."}
            
            text = data if isinstance(data, str) else data.get('text', '') if isinstance(data, dict) else ''
            if not text:
                return {"message": "❌ Tweet text missing."}
            
            tweet = x_integration.post_tweet(text=text)
            if tweet:
                return {"message": f"✅ Tweet posted! {tweet['url']}", "tweet": tweet}
            else:
                return {"message": "❌ Failed to post tweet."}
        
        else:
            # Unknown action
            return None
    
    except Exception as e:
        print(f"❌ Action execution error: {e}")
        return {"message": f"❌ Error: {str(e)}"}


class FileAttachment(BaseModel):
    name: str
    type: str
    size: int
    data: str  # base64 for images, text content for documents
    preview: Optional[str] = None

class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    message: str
    provider: str = "auto"  # 'auto', 'groq', or 'ollama'
    files: Optional[List[FileAttachment]] = None

class NewChatRequest(BaseModel):
    user_id: Optional[str] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    """
    Handle chat message
    - Creates user if needed
    - Creates session if needed
    - Loads user memory
    - Gets LLM response
    - Saves to memory
    """
    try:
        # Single user system - use hardcoded user ID
        if not request.user_id:
            request.user_id = "seven_user"
        
        # Ensure user exists in database
        try:
            memory_manager.create_user(request.user_id)
        except:
            pass  # User may already exist
        
        # Create or get session
        if not request.session_id:
            request.session_id = memory_manager.create_chat_session(request.user_id)
        
        # Get user's long-term memory and language preference
        user_memory = memory_manager.get_user_memory(request.user_id)
        memory_summary = user_memory.get("memory_summary", "")
        
        # Get user's preferred language and personality
        user_language = "en"  # Default to English
        user_personality = "friendly"  # Default personality
        facts = user_memory.get("facts", [])
        for fact in facts:
            if fact.startswith("preferred_language:"):
                user_language = fact.split(":")[-1].strip()
                print(f"🌐 User's preferred language: {user_language}")
            elif fact.startswith("preferred_personality:"):
                user_personality = fact.split(":")[-1].strip()
                print(f"🎭 User's preferred personality: {user_personality}")
        
        # Get recent conversation history from this session
        recent_messages = memory_manager.get_session_messages(
            request.session_id,
            limit=5  # Last 5 messages to keep token count low
        )
        
        # Format messages for LLM
        conversation = [
            {"role": msg["role"], "content": msg["content"]}
            for msg in recent_messages
        ]
        
        # Prepare user message content
        user_content = request.message
        original_message = request.message  # Keep original for saving to memory
        
        # Translate message to English if needed (for LLM processing)
        # DISABLED: Force English-only responses unless user explicitly requests translation
        detected_language = 'en'  # Always English for now
        # Don't auto-detect or translate - force English for better consistency
        user_language = 'en'  # Override to English
        user_content = request.message  # Use original message without translation
        
        # Handle file attachments
        if request.files and len(request.files) > 0:
            print(f"📎 Processing {len(request.files)} file attachment(s)")
            
            # Add file information to message content
            file_info = "\n\n[Attached Files]\n"
            for file in request.files:
                if file.type.startswith('image/'):
                    # For images, just mention them (vision models complex to integrate quickly)
                    file_info += f"📷 Image: {file.name} ({file.size} bytes)\n"
                    file_info += f"   (Image analysis coming soon - vision model integration pending)\n"
                else:
                    # For text/documents, include content
                    file_info += f"📄 Document: {file.name}\n"
                    file_info += f"   Content:\n{file.data}\n\n"
            
            user_content += file_info
        
        # Add current user message
        conversation.append({"role": "user", "content": user_content})
        
        # Load conversation context for this session
        session_context = ConversationContext()
        saved_context = memory_manager.get_conversation_context(request.session_id)
        if saved_context:
            session_context.from_dict(saved_context)
            print(f"📚 Loaded conversation context for session: {request.session_id}")
        
        # Check for "new topic" command
        if session_context.check_for_topic_reset(request.message):
            session_context.reset_current_topic()
            memory_manager.clear_conversation_context(request.session_id)
            print("🔄 User requested new topic")
        
        # Skip slow analysis features for faster responses - run in parallel or skip
        # Analyze query confidence (detect ambiguous queries) - DISABLED for speed
        confidence_analysis = None
        clarifying_context = ""
        # if confidence_scorer.is_available():
        #     try:
        #         confidence_analysis = confidence_scorer.analyze_query(request.message)
        #         print(f"🎯 Query confidence: {confidence_analysis['confidence']:.2f} (intent: {confidence_analysis['intent']})")
        #         
        #         if confidence_analysis['needs_clarification']:
        #             clarifying_question = confidence_scorer.generate_clarifying_question(
        #                 request.message, 
        #                 confidence_analysis
        #             )
        #             clarifying_context = f"CLARIFICATION NEEDED: The user's query is unclear (confidence: {confidence_analysis['confidence']:.2f}). Consider asking: '{clarifying_question}'"
        #             print(f"❓ Low confidence detected - suggesting clarification")
        #     except Exception as e:
        #         print(f"⚠️ Confidence analysis failed: {e}")
        
        # Detect emotion from user message - DISABLED for speed
        emotion_data = None
        emotion_context_prompt = ""
        # if emotion_detector.is_available():
        #     try:
        #         emotion_data = emotion_detector.analyze_text(request.message)
        #         emotion_context_prompt = emotion_detector.get_emotion_prompt(emotion_data)
        #         print(f"😊 Detected emotion: {emotion_data.get('emotion', 'neutral')} (confidence: {emotion_data.get('confidence', 0)})")
        #     except Exception as e:
        #         print(f"⚠️ Emotion detection failed: {e}")
        
        # Get conversation context summary for LLM (keep - fast)
        context_summary = session_context.get_context_summary()
        transition_prompt = session_context.get_transition_prompt()
        
        # Query knowledge base for relevant information - DISABLED for speed
        knowledge_context = ""
        knowledge_results = []
        # if knowledge_base.is_available():
        #     try:
        #         knowledge_results = knowledge_base.query_knowledge(
        #             query=user_content,
        #             top_k=3,
        #             min_similarity=0.6
        #         )
        #         if knowledge_results:
        #             knowledge_context = knowledge_base.format_knowledge_context(knowledge_results)
        #             print(f"KNOWLEDGE: Retrieved {len(knowledge_results)} entries")
        #     except Exception as e:
        #         print(f"WARNING: Knowledge retrieval failed: {e}")
        
        # Get user corrections and feedback context - DISABLED for speed
        feedback_context = ""
        # try:
        #     feedback_context = feedback_manager.get_correction_context(request.user_id)
        #     if feedback_context:
        #         print(f"FEEDBACK: Retrieved correction context for user")
        # except Exception as e:
        #     print(f"WARNING: Feedback retrieval failed: {e}")
        
        # Combine conversation context with transition hint, clarifying context, knowledge, and feedback
        conversation_context_text = context_summary
        if transition_prompt:
            conversation_context_text += f"\n{transition_prompt}"
        if clarifying_context:
            conversation_context_text += f"\n\n{clarifying_context}"
        if knowledge_context:
            conversation_context_text += f"\n\n{knowledge_context}"
        if feedback_context:
            conversation_context_text += f"\n\n{feedback_context}"
        
        # Get personality prompt
        personality_prompt = personality_manager.get_personality_prompt(user_personality)
        
        # Format with all context (memory, emotion, conversation, personality)
        llm_messages = format_conversation_for_llm(
            conversation, 
            memory_summary, 
            emotion_context_prompt,
            conversation_context_text,
            personality_prompt
        )
        
        # Get LLM response with faster settings
        llm_response = await llm_client.chat(
            messages=llm_messages,
            provider=request.provider,
            temperature=0.7,
            max_tokens=150  # Further reduced for faster responses
        )
        
        raw_message = llm_response["message"]
        
        # DISABLED: Don't translate response - always respond in English
        # Translation is disabled to ensure consistent English responses
        # Users can explicitly request translation if needed
        
        # Parse JSON response
        try:
            import json
            parsed_response = json.loads(raw_message)
            assistant_message = parsed_response.get("message", raw_message)
            action = parsed_response.get("action")
            action_data = parsed_response.get("data")
        except (json.JSONDecodeError, AttributeError):
            # If not JSON or malformed, use raw message
            print(f"⚠️ Non-JSON response from LLM: {raw_message[:100]}...")
            assistant_message = raw_message
            action = None
            action_data = None
        
        # Save user message (original message in user's language)
        memory_manager.save_message(
            session_id=request.session_id,
            user_id=request.user_id,
            role="user",
            content=original_message
        )
        
        # Save assistant response
        memory_manager.save_message(
            session_id=request.session_id,
            user_id=request.user_id,
            role="assistant",
            content=assistant_message
        )
        
        # Update conversation context with this exchange
        context_update = session_context.update_context(
            user_message=original_message,
            assistant_message=assistant_message
        )
        
        # Save updated conversation context
        memory_manager.save_conversation_context(
            session_id=request.session_id,
            user_id=request.user_id,
            context_data=session_context.to_dict()
        )
        
        print(f"💬 Context updated: {context_update.get('current_topic')} "
              f"(topic changed: {context_update.get('topic_changed')})")
        
        # Execute action if detected and handle integrations
        action_result = None
        if action:
            try:
                action_result = await execute_action(action, action_data, request.user_id)
                if action_result:
                    print(f"✅ Action executed: {action}")
                    # Append action result to assistant message
                    if isinstance(action_result, dict) and action_result.get('message'):
                        assistant_message += f"\n\n{action_result['message']}"
                    elif isinstance(action_result, str):
                        assistant_message += f"\n\n{action_result}"
            except Exception as e:
                print(f"❌ Action execution failed: {e}")
                action_result = f"⚠️ Failed to execute action: {str(e)}"
        
        # Prepare actions list for frontend
        actions = []
        if action:
            actions.append({
                "type": action,
                "data": action_data,
                "result": action_result
            })
        
        # Prepare response with emotion data
        response_data = {
            "message": assistant_message,
            "user_id": request.user_id,
            "session_id": request.session_id,
            "provider": llm_response["provider"],
            "model": llm_response["model"],
            "actions": actions
        }
        
        # Add emotion data if detected
        if emotion_data:
            response_data["emotion"] = emotion_data
        
        # Add language information
        response_data["language"] = {
            "detected": detected_language,
            "user_preference": user_language,
            "translated": detected_language != 'en' or user_language != 'en'
        }
        
        # Add conversation context information
        response_data["conversation"] = {
            "current_topic": context_update.get("current_topic"),
            "topic_changed": context_update.get("topic_changed"),
            "topic_history": context_update.get("topic_history", []),
            "message_count": context_update.get("message_count", 1)
        }
        
        # Add confidence analysis if available
        if confidence_analysis:
            response_data["confidence"] = {
                "score": confidence_analysis.get("confidence"),
                "intent": confidence_analysis.get("intent"),
                "is_ambiguous": confidence_analysis.get("is_ambiguous"),
                "needs_clarification": confidence_analysis.get("needs_clarification")
            }
        
        return format_success_response(response_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/new_chat")
async def new_chat(request: NewChatRequest):
    """
    Start a new chat session while keeping user memory
    """
    try:
        # Single user system - use hardcoded user ID
        if not request.user_id:
            request.user_id = "seven_user"
        
        # Ensure user exists in database
        try:
            memory_manager.create_user(request.user_id)
        except:
            pass  # User may already exist
        
        # Create new session
        session_id = memory_manager.create_chat_session(request.user_id)
        
        # Get user memory (preserved)
        user_memory = memory_manager.get_user_memory(request.user_id)
        
        return format_success_response({
            "session_id": session_id,
            "user_id": request.user_id,
            "message": "New chat session created. Your memory is preserved.",
            "memory_summary": user_memory.get("memory_summary", ""),
            "facts_count": len(user_memory.get("facts", []))
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions/{user_id}")
async def get_user_sessions(user_id: str, limit: int = 10):
    """Get user's recent chat sessions"""
    try:
        sessions = memory_manager.get_user_sessions(user_id, limit)
        
        return format_success_response({
            "sessions": sessions,
            "count": len(sessions)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/session/{session_id}/messages")
async def get_session_messages(session_id: str, limit: int = 50):
    """Get messages from a specific session"""
    try:
        messages = memory_manager.get_session_messages(session_id, limit)
        
        return format_success_response({
            "messages": messages,
            "count": len(messages),
            "session_id": session_id
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/llm/status")
async def get_llm_status():
    """Get status of LLM providers"""
    try:
        status = llm_client.get_status()
        
        return format_success_response({
            "providers": status,
            "recommended": "groq" if status["groq"]["available"] else "ollama"
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

