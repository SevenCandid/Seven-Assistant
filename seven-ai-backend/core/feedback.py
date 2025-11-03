"""
Feedback and Continuous Learning Module
Tracks user corrections and ratings to improve Seven's responses
"""

import sqlite3
import os
from typing import Dict, List, Optional
from datetime import datetime
import json


class FeedbackManager:
    """
    Manages user feedback, corrections, and continuous learning
    """
    
    def __init__(self, db_path: str = "./data/feedback.db"):
        """Initialize feedback database"""
        self.db_path = db_path
        
        # Create data directory if needed
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Initialize database
        self._initialize_database()
        print("SUCCESS: Feedback system initialized")
    
    def _initialize_database(self):
        """Create feedback tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Feedback table for ratings and corrections
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                message_id TEXT NOT NULL,
                feedback_type TEXT NOT NULL,
                rating INTEGER,
                correction TEXT,
                user_message TEXT,
                assistant_response TEXT,
                context TEXT,
                created_at TEXT NOT NULL
            )
        """)
        
        # Learning insights table for processed feedback
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS learning_insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                insight_type TEXT NOT NULL,
                pattern TEXT,
                correction TEXT,
                frequency INTEGER DEFAULT 1,
                last_seen TEXT NOT NULL,
                applied_to_memory INTEGER DEFAULT 0
            )
        """)
        
        conn.commit()
        conn.close()
    
    def add_feedback(
        self,
        user_id: str,
        message_id: str,
        feedback_type: str,
        rating: Optional[int] = None,
        correction: Optional[str] = None,
        user_message: Optional[str] = None,
        assistant_response: Optional[str] = None,
        context: Optional[Dict] = None
    ) -> Dict:
        """
        Add user feedback
        
        Args:
            user_id: User identifier
            message_id: Message being rated/corrected
            feedback_type: 'rating' | 'correction' | 'clarification'
            rating: 1 (thumbs up) or -1 (thumbs down)
            correction: User's correction text
            user_message: Original user message
            assistant_response: Seven's response
            context: Additional context
            
        Returns:
            Feedback record
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute("""
            INSERT INTO feedback (
                user_id, message_id, feedback_type, rating, correction,
                user_message, assistant_response, context, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_id,
            message_id,
            feedback_type,
            rating,
            correction,
            user_message,
            assistant_response,
            json.dumps(context) if context else None,
            datetime.now().isoformat()
        ))
        
        feedback_id = cursor.lastrowid
        conn.commit()
        conn.close()
        
        # Process feedback for learning
        if feedback_type == 'correction' and correction:
            self._process_correction(user_id, user_message, assistant_response, correction)
        
        print(f"FEEDBACK: Recorded {feedback_type} from user {user_id}")
        
        return {
            "id": feedback_id,
            "user_id": user_id,
            "message_id": message_id,
            "feedback_type": feedback_type,
            "rating": rating,
            "created_at": datetime.now().isoformat()
        }
    
    def _process_correction(
        self,
        user_id: str,
        user_message: str,
        assistant_response: str,
        correction: str
    ):
        """
        Process correction and extract learning insights
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Check if similar pattern exists
        cursor.execute("""
            SELECT id, frequency FROM learning_insights
            WHERE user_id = ? AND insight_type = 'correction'
            AND pattern LIKE ?
        """, (user_id, f"%{user_message[:50]}%"))
        
        existing = cursor.fetchone()
        
        if existing:
            # Update frequency
            cursor.execute("""
                UPDATE learning_insights
                SET frequency = frequency + 1,
                    last_seen = ?,
                    correction = ?
                WHERE id = ?
            """, (datetime.now().isoformat(), correction, existing[0]))
            print(f"LEARNING: Updated correction pattern (frequency: {existing[1] + 1})")
        else:
            # Create new insight
            cursor.execute("""
                INSERT INTO learning_insights (
                    user_id, insight_type, pattern, correction, last_seen
                ) VALUES (?, ?, ?, ?, ?)
            """, (
                user_id,
                'correction',
                user_message,
                correction,
                datetime.now().isoformat()
            ))
            print("LEARNING: New correction pattern identified")
        
        conn.commit()
        conn.close()
    
    def get_feedback(
        self,
        user_id: Optional[str] = None,
        feedback_type: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict]:
        """Get feedback records"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        query = "SELECT * FROM feedback WHERE 1=1"
        params = []
        
        if user_id:
            query += " AND user_id = ?"
            params.append(user_id)
        
        if feedback_type:
            query += " AND feedback_type = ?"
            params.append(feedback_type)
        
        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)
        
        cursor.execute(query, params)
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_learning_insights(
        self,
        user_id: str,
        min_frequency: int = 2
    ) -> List[Dict]:
        """
        Get learning insights for user
        
        Args:
            user_id: User identifier
            min_frequency: Minimum times pattern must occur
            
        Returns:
            List of learning insights
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        cursor.execute("""
            SELECT * FROM learning_insights
            WHERE user_id = ? AND frequency >= ?
            ORDER BY frequency DESC, last_seen DESC
        """, (user_id, min_frequency))
        
        rows = cursor.fetchall()
        conn.close()
        
        return [dict(row) for row in rows]
    
    def get_feedback_summary(self, user_id: str) -> Dict:
        """Get feedback summary for user"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Total feedback count
        cursor.execute("""
            SELECT COUNT(*) FROM feedback WHERE user_id = ?
        """, (user_id,))
        total_feedback = cursor.fetchone()[0]
        
        # Ratings breakdown
        cursor.execute("""
            SELECT rating, COUNT(*) FROM feedback
            WHERE user_id = ? AND feedback_type = 'rating'
            GROUP BY rating
        """, (user_id,))
        ratings = dict(cursor.fetchall())
        
        # Corrections count
        cursor.execute("""
            SELECT COUNT(*) FROM feedback
            WHERE user_id = ? AND feedback_type = 'correction'
        """, (user_id,))
        corrections_count = cursor.fetchone()[0]
        
        # Learning insights count
        cursor.execute("""
            SELECT COUNT(*) FROM learning_insights WHERE user_id = ?
        """, (user_id,))
        insights_count = cursor.fetchone()[0]
        
        conn.close()
        
        return {
            "total_feedback": total_feedback,
            "positive_ratings": ratings.get(1, 0),
            "negative_ratings": ratings.get(-1, 0),
            "corrections": corrections_count,
            "learning_insights": insights_count
        }
    
    def apply_insights_to_memory(self, user_id: str, memory_manager) -> int:
        """
        Apply learning insights to user memory
        
        Args:
            user_id: User identifier
            memory_manager: Memory manager instance
            
        Returns:
            Number of insights applied
        """
        insights = self.get_learning_insights(user_id, min_frequency=2)
        applied_count = 0
        
        for insight in insights:
            if insight['applied_to_memory']:
                continue
            
            # Add correction as a memory fact
            fact = f"correction_learned: {insight['pattern'][:100]} -> {insight['correction'][:100]}"
            
            # Store in memory
            memory_manager.add_memory(
                user_id=user_id,
                message="System: Learning from feedback",
                response=f"Learned: {insight['correction']}"
            )
            
            # Mark as applied
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE learning_insights
                SET applied_to_memory = 1
                WHERE id = ?
            """, (insight['id'],))
            conn.commit()
            conn.close()
            
            applied_count += 1
            print(f"LEARNING: Applied insight #{insight['id']} to memory")
        
        return applied_count
    
    def get_correction_context(self, user_id: str) -> str:
        """
        Get correction context for LLM prompt
        
        Returns formatted string of recent corrections
        """
        insights = self.get_learning_insights(user_id, min_frequency=1)
        
        if not insights:
            return ""
        
        context = "USER FEEDBACK & CORRECTIONS:\n\n"
        
        for i, insight in enumerate(insights[:5], 1):
            context += f"[Correction #{i}] Pattern: {insight['pattern'][:80]}\n"
            context += f"Correct response should be: {insight['correction'][:100]}\n"
            context += f"(Seen {insight['frequency']} times)\n\n"
        
        context += "Learn from these corrections and avoid repeating mistakes.\n"
        
        return context


# Singleton instance
feedback_manager = FeedbackManager()











