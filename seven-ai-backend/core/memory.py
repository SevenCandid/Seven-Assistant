"""
Memory System - Persistent user memory across sessions
Uses SQLite for storage
"""

import sqlite3
import json
import os
from datetime import datetime
from typing import Dict, List, Optional
import uuid

DATABASE_PATH = os.getenv("DATABASE_PATH", "./data/memory.db")

def initialize_database():
    """Create database and tables if they don't exist"""
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Users table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # User memory table (long-term facts and summary)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            memory_summary TEXT,
            facts TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Chat sessions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chat_sessions (
            session_id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            title TEXT,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Chat messages table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    """)
    
    # Conversation context table (for topic tracking)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conversation_context (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            user_id TEXT NOT NULL,
            context_data TEXT NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (session_id) REFERENCES chat_sessions(session_id),
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            UNIQUE(session_id)
        )
    """)
    
    conn.commit()
    conn.close()
    print(f"✅ Database initialized at {DATABASE_PATH}")

class MemoryManager:
    def __init__(self):
        self.db_path = DATABASE_PATH
    
    def _get_connection(self):
        """Get database connection"""
        return sqlite3.connect(self.db_path)
    
    def create_user(self, user_id: Optional[str] = None) -> str:
        """Create a new user or return existing"""
        if not user_id:
            user_id = str(uuid.uuid4())
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute(
                "INSERT OR IGNORE INTO users (user_id) VALUES (?)",
                (user_id,)
            )
            conn.commit()
        finally:
            conn.close()
        
        return user_id
    
    def get_user_memory(self, user_id: str) -> Dict:
        """Get user's long-term memory"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT memory_summary, facts, updated_at
                FROM user_memory
                WHERE user_id = ?
                ORDER BY updated_at DESC
                LIMIT 1
            """, (user_id,))
            
            row = cursor.fetchone()
            
            if row:
                return {
                    "memory_summary": row[0],
                    "facts": json.loads(row[1]) if row[1] else [],
                    "updated_at": row[2]
                }
            else:
                return {
                    "memory_summary": "",
                    "facts": [],
                    "updated_at": None
                }
        finally:
            conn.close()
    
    def update_user_memory(self, user_id: str, memory_summary: str, facts: List[str]):
        """Update user's long-term memory"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            # Check if memory exists
            cursor.execute(
                "SELECT id FROM user_memory WHERE user_id = ?",
                (user_id,)
            )
            exists = cursor.fetchone()
            
            if exists:
                cursor.execute("""
                    UPDATE user_memory
                    SET memory_summary = ?, facts = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                """, (memory_summary, json.dumps(facts), user_id))
            else:
                cursor.execute("""
                    INSERT INTO user_memory (user_id, memory_summary, facts)
                    VALUES (?, ?, ?)
                """, (user_id, memory_summary, json.dumps(facts)))
            
            conn.commit()
        finally:
            conn.close()
    
    def create_chat_session(self, user_id: str, session_id: Optional[str] = None) -> str:
        """Create a new chat session"""
        if not session_id:
            session_id = str(uuid.uuid4())
        
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO chat_sessions (session_id, user_id)
                VALUES (?, ?)
            """, (session_id, user_id))
            conn.commit()
        finally:
            conn.close()
        
        return session_id
    
    def save_message(
        self,
        session_id: str,
        user_id: str,
        role: str,
        content: str
    ):
        """Save a message to the database"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                INSERT INTO messages (session_id, user_id, role, content)
                VALUES (?, ?, ?, ?)
            """, (session_id, user_id, role, content))
            conn.commit()
        finally:
            conn.close()
    
    def get_session_messages(
        self,
        session_id: str,
        limit: Optional[int] = 50
    ) -> List[Dict]:
        """Get messages from a chat session"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            query = """
                SELECT role, content, timestamp
                FROM messages
                WHERE session_id = ?
                ORDER BY timestamp DESC
            """
            
            if limit:
                query += f" LIMIT {limit}"
            
            cursor.execute(query, (session_id,))
            rows = cursor.fetchall()
            
            messages = [
                {
                    "role": row[0],
                    "content": row[1],
                    "timestamp": row[2]
                }
                for row in reversed(rows)  # Reverse to get chronological order
            ]
            
            return messages
        finally:
            conn.close()
    
    def get_user_sessions(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get user's recent chat sessions"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT session_id, created_at, title
                FROM chat_sessions
                WHERE user_id = ?
                ORDER BY created_at DESC
                LIMIT ?
            """, (user_id, limit))
            
            rows = cursor.fetchall()
            
            sessions = [
                {
                    "session_id": row[0],
                    "created_at": row[1],
                    "title": row[2] or "Untitled Chat"
                }
                for row in rows
            ]
            
            return sessions
        finally:
            conn.close()
    
    def clear_user_memory(self, user_id: str):
        """Clear all memory for a user (keep chat history)"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM user_memory WHERE user_id = ?", (user_id,))
            conn.commit()
        finally:
            conn.close()
    
    def delete_session(self, session_id: str):
        """Delete a chat session and its messages"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM chat_sessions WHERE session_id = ?", (session_id,))
            cursor.execute("DELETE FROM conversation_context WHERE session_id = ?", (session_id,))
            conn.commit()
        finally:
            conn.close()
    
    def save_conversation_context(self, session_id: str, user_id: str, context_data: Dict):
        """
        Save conversation context (topics, flow) for a session
        
        Args:
            session_id: Session identifier
            user_id: User identifier
            context_data: Dictionary containing conversation context
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            context_json = json.dumps(context_data)
            
            cursor.execute("""
                INSERT INTO conversation_context (session_id, user_id, context_data, updated_at)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(session_id) 
                DO UPDATE SET 
                    context_data = excluded.context_data,
                    updated_at = excluded.updated_at
            """, (session_id, user_id, context_json, datetime.now()))
            
            conn.commit()
        finally:
            conn.close()
    
    def get_conversation_context(self, session_id: str) -> Optional[Dict]:
        """
        Get conversation context for a session
        
        Args:
            session_id: Session identifier
            
        Returns:
            Dictionary with conversation context or None
        """
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT context_data 
                FROM conversation_context 
                WHERE session_id = ?
            """, (session_id,))
            
            row = cursor.fetchone()
            
            if row:
                return json.loads(row[0])
            return None
        finally:
            conn.close()
    
    def clear_conversation_context(self, session_id: str):
        """Clear conversation context for a session (for 'new topic' command)"""
        conn = self._get_connection()
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM conversation_context WHERE session_id = ?", (session_id,))
            conn.commit()
        finally:
            conn.close()

# Singleton instance
memory_manager = MemoryManager()



