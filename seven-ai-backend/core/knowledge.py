"""
Knowledge Base Module - Local RAG System
Uses FAISS for vector similarity search and local JSON storage
"""

import os
import json
import numpy as np
from typing import List, Dict, Optional, Tuple
from datetime import datetime
import hashlib

# Try to import FAISS and sentence transformers
try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    print("WARNING: FAISS not available - knowledge base disabled")

try:
    from sentence_transformers import SentenceTransformer
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    TRANSFORMERS_AVAILABLE = False
    print("WARNING: sentence-transformers not available - knowledge base disabled")


class KnowledgeBase:
    """
    Local RAG system using FAISS for vector search
    Stores knowledge entries with embeddings for semantic retrieval
    """
    
    def __init__(self, data_dir: str = "./data"):
        """Initialize knowledge base"""
        self.data_dir = data_dir
        self.knowledge_file = os.path.join(data_dir, "knowledge.json")
        self.index_file = os.path.join(data_dir, "knowledge.index")
        
        self.model = None
        self.index = None
        self.knowledge_entries = []
        self.dimension = 384  # Dimension for all-MiniLM-L6-v2
        
        # Create data directory if it doesn't exist
        os.makedirs(data_dir, exist_ok=True)
        
        # Initialize model and index
        if TRANSFORMERS_AVAILABLE and FAISS_AVAILABLE:
            try:
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                self._load_or_create_index()
                print("SUCCESS: Knowledge base initialized with FAISS")
            except Exception as e:
                print(f"WARNING: Failed to initialize knowledge base: {e}")
                self.model = None
        else:
            print("WARNING: Knowledge base requires FAISS and sentence-transformers")
    
    def is_available(self) -> bool:
        """Check if knowledge base is available"""
        return self.model is not None and self.index is not None
    
    def _load_or_create_index(self):
        """Load existing FAISS index or create new one"""
        # Load knowledge entries
        if os.path.exists(self.knowledge_file):
            with open(self.knowledge_file, 'r', encoding='utf-8') as f:
                self.knowledge_entries = json.load(f)
            print(f"LOADED: {len(self.knowledge_entries)} knowledge entries")
        else:
            self.knowledge_entries = []
            self._save_knowledge()
        
        # Load or create FAISS index
        if os.path.exists(self.index_file) and len(self.knowledge_entries) > 0:
            try:
                self.index = faiss.read_index(self.index_file)
                print(f"LOADED: FAISS index with {self.index.ntotal} vectors")
            except Exception as e:
                print(f"WARNING: Failed to load FAISS index: {e}")
                self._create_new_index()
        else:
            self._create_new_index()
    
    def _create_new_index(self):
        """Create new FAISS index"""
        self.index = faiss.IndexFlatL2(self.dimension)
        print("CREATED: New FAISS index")
        
        # Re-index existing knowledge if any
        if len(self.knowledge_entries) > 0:
            self._reindex_all()
    
    def _save_knowledge(self):
        """Save knowledge entries to JSON"""
        with open(self.knowledge_file, 'w', encoding='utf-8') as f:
            json.dump(self.knowledge_entries, f, indent=2, ensure_ascii=False)
    
    def _save_index(self):
        """Save FAISS index to file"""
        if self.index is not None:
            faiss.write_index(self.index, self.index_file)
    
    def _reindex_all(self):
        """Re-index all knowledge entries"""
        if not self.model or not self.knowledge_entries:
            return
        
        # Create new index
        self.index = faiss.IndexFlatL2(self.dimension)
        
        # Encode all entries
        texts = [entry['content'] for entry in self.knowledge_entries]
        embeddings = self.model.encode(texts)
        
        # Add to index
        self.index.add(np.array(embeddings).astype('float32'))
        self._save_index()
        
        print(f"REINDEXED: {len(self.knowledge_entries)} entries")
    
    def _generate_id(self, content: str) -> str:
        """Generate unique ID for knowledge entry"""
        return hashlib.md5(content.encode()).hexdigest()[:16]
    
    def add_knowledge(
        self, 
        content: str, 
        title: str = "", 
        source: str = "user",
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Add knowledge entry to the knowledge base
        
        Args:
            content: The knowledge content/text
            title: Optional title for the entry
            source: Source of knowledge (user, document, etc.)
            metadata: Additional metadata
            
        Returns:
            Dictionary with entry details
        """
        if not self.is_available():
            raise Exception("Knowledge base not available")
        
        # Generate ID
        entry_id = self._generate_id(content)
        
        # Check if already exists
        existing = next((e for e in self.knowledge_entries if e['id'] == entry_id), None)
        if existing:
            return {"status": "exists", "entry": existing}
        
        # Create embedding
        embedding = self.model.encode([content])[0]
        
        # Create entry
        entry = {
            "id": entry_id,
            "title": title or content[:50] + "...",
            "content": content,
            "source": source,
            "created_at": datetime.now().isoformat(),
            "metadata": metadata or {}
        }
        
        # Add to knowledge base
        self.knowledge_entries.append(entry)
        
        # Add embedding to FAISS index
        self.index.add(np.array([embedding]).astype('float32'))
        
        # Save
        self._save_knowledge()
        self._save_index()
        
        print(f"ADDED: Knowledge - {entry['title']}")
        
        return {"status": "added", "entry": entry}
    
    def query_knowledge(
        self, 
        query: str, 
        top_k: int = 3,
        min_similarity: float = 0.5
    ) -> List[Dict]:
        """
        Query knowledge base for relevant entries
        
        Args:
            query: Query text
            top_k: Number of top results to return
            min_similarity: Minimum similarity threshold (0-1)
            
        Returns:
            List of relevant knowledge entries with scores
        """
        if not self.is_available() or len(self.knowledge_entries) == 0:
            return []
        
        # Encode query
        query_embedding = self.model.encode([query])[0]
        
        # Search in FAISS
        k = min(top_k, len(self.knowledge_entries))
        distances, indices = self.index.search(
            np.array([query_embedding]).astype('float32'), 
            k
        )
        
        # Convert distances to similarity scores
        # FAISS returns L2 distances, convert to cosine similarity approximation
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx >= 0 and idx < len(self.knowledge_entries):
                # Convert L2 distance to similarity score (0-1)
                # Lower distance = higher similarity
                similarity = 1.0 / (1.0 + distance)
                
                if similarity >= min_similarity:
                    entry = self.knowledge_entries[idx].copy()
                    entry['similarity'] = float(similarity)
                    entry['rank'] = i + 1
                    results.append(entry)
        
        print(f"FOUND: {len(results)} relevant entries for: {query[:50]}...")
        
        return results
    
    def get_all_knowledge(self) -> List[Dict]:
        """Get all knowledge entries"""
        return self.knowledge_entries.copy()
    
    def delete_knowledge(self, entry_id: str) -> bool:
        """
        Delete knowledge entry by ID
        
        Args:
            entry_id: ID of entry to delete
            
        Returns:
            True if deleted, False if not found
        """
        if not self.is_available():
            return False
        
        # Find and remove entry
        entry = next((e for e in self.knowledge_entries if e['id'] == entry_id), None)
        if not entry:
            return False
        
        self.knowledge_entries = [e for e in self.knowledge_entries if e['id'] != entry_id]
        
        # Re-index (FAISS doesn't support deletion, need to rebuild)
        self._reindex_all()
        self._save_knowledge()
        
        print(f"DELETED: Knowledge - {entry['title']}")
        
        return True
    
    def clear_all(self) -> int:
        """
        Clear all knowledge entries
        
        Returns:
            Number of entries deleted
        """
        if not self.is_available():
            return 0
        
        count = len(self.knowledge_entries)
        self.knowledge_entries = []
        
        # Create new empty index
        self._create_new_index()
        self._save_knowledge()
        self._save_index()
        
        print(f"CLEARED: {count} knowledge entries")
        
        return count
    
    def get_stats(self) -> Dict:
        """Get knowledge base statistics"""
        return {
            "total_entries": len(self.knowledge_entries),
            "index_size": self.index.ntotal if self.index else 0,
            "dimension": self.dimension,
            "model": "all-MiniLM-L6-v2" if self.model else None,
            "available": self.is_available()
        }
    
    def format_knowledge_context(self, results: List[Dict]) -> str:
        """
        Format knowledge results for LLM context
        
        Args:
            results: List of knowledge entries from query_knowledge
            
        Returns:
            Formatted string for LLM prompt
        """
        if not results:
            return ""
        
        context = "KNOWLEDGE BASE (Retrieved Information):\n\n"
        
        for i, entry in enumerate(results, 1):
            context += f"[Knowledge #{i}] {entry['title']}\n"
            context += f"Content: {entry['content']}\n"
            context += f"Source: {entry['source']}\n"
            context += f"Relevance: {entry.get('similarity', 0):.2%}\n\n"
        
        context += "Use this knowledge to provide accurate, informed responses.\n"
        
        return context


# Singleton instance
knowledge_base = KnowledgeBase()

