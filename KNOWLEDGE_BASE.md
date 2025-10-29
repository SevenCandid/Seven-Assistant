# 📚 Knowledge Base & RAG System

## Overview

Seven AI Assistant now includes a **local Retrieval-Augmented Generation (RAG) system** that enables domain-specific knowledge storage and retrieval. This allows Seven to provide more accurate, informed responses based on your custom data.

## 🎯 Key Features

### 1. **Vector-Based Search**
- Uses **FAISS** (Facebook AI Similarity Search) for fast semantic search
- Embeddings generated with `sentence-transformers` (all-MiniLM-L6-v2)
- Works completely offline after setup

### 2. **Multiple Input Methods**
- **PDF Upload**: Extract text from PDF documents
- **Text Files**: Upload .txt or .md files
- **Manual Entry**: Type or paste knowledge directly

### 3. **Automatic Retrieval**
- When you ask a question, Seven searches the knowledge base first
- Top 3 most relevant entries are retrieved and added to context
- Only entries with >60% similarity are used

### 4. **Local Storage**
- Knowledge entries stored in `seven-ai-backend/data/knowledge.json`
- FAISS index stored in `seven-ai-backend/data/knowledge.index`
- No external APIs required - fully offline capable

## 📦 Installation

### Backend Dependencies

```bash
cd seven-ai-backend
pip install faiss-cpu sentence-transformers PyPDF2
```

**For GPU acceleration (optional):**
```bash
pip install faiss-gpu  # Instead of faiss-cpu
```

## 🚀 Usage

### Adding Knowledge via UI

1. **Open Settings** in Seven's interface
2. Navigate to **📚 Knowledge Base** section
3. Choose one of three methods:

#### Method 1: Upload Files
- Click **📤 Upload** tab
- Select PDF, TXT, or MD file
- Optionally provide a custom title
- Click **Upload File**

#### Method 2: Add Text Manually
- Click **✍️ Add Text** tab
- Enter a title (optional)
- Paste or type your knowledge content
- Click **Add Knowledge**

#### Method 3: Via API (Programmatic)

```python
import requests

# Add knowledge
response = requests.post('http://localhost:5000/api/knowledge/add', json={
    "content": "Seven AI Assistant uses FAISS for vector search.",
    "title": "FAISS Information",
    "source": "documentation"
})

# Query knowledge
response = requests.post('http://localhost:5000/api/knowledge/query', json={
    "query": "How does vector search work?",
    "top_k": 3,
    "min_similarity": 0.6
})
```

### Viewing & Managing Knowledge

In the **📖 View** tab:
- See all knowledge entries
- Delete individual entries (✕ button)
- Clear all entries (🗑️ Clear All)
- View source and creation date

## 🔧 API Endpoints

### POST `/api/knowledge/add`
Add knowledge entry manually.

**Request:**
```json
{
  "content": "Knowledge text content",
  "title": "Optional title",
  "source": "user",
  "metadata": {}
}
```

**Response:**
```json
{
  "success": true,
  "status": "added",
  "entry": { ... }
}
```

### POST `/api/knowledge/query`
Search knowledge base for relevant entries.

**Request:**
```json
{
  "query": "Your question here",
  "top_k": 3,
  "min_similarity": 0.6
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "id": "abc123",
      "title": "...",
      "content": "...",
      "similarity": 0.85,
      "rank": 1
    }
  ],
  "count": 3
}
```

### GET `/api/knowledge/all`
Get all knowledge entries.

### DELETE `/api/knowledge/delete`
Delete specific entry by ID.

**Request:**
```json
{
  "entry_id": "abc123"
}
```

### DELETE `/api/knowledge/clear`
Clear all knowledge entries.

### POST `/api/knowledge/upload`
Upload PDF/text file.

**Request:** FormData with file

### GET `/api/knowledge/stats`
Get knowledge base statistics.

**Response:**
```json
{
  "total_entries": 10,
  "index_size": 10,
  "dimension": 384,
  "model": "all-MiniLM-L6-v2",
  "available": true
}
```

## 🧠 How RAG Works in Seven

### Query Flow

1. **User sends message** to Seven
2. **Knowledge base search** runs in parallel
   - User's message is encoded to a vector
   - FAISS finds top 3 similar entries
   - Only entries with >60% similarity are kept
3. **Context assembly**
   - Retrieved knowledge is formatted
   - Added to LLM system prompt
4. **LLM generates response** using both:
   - Its base knowledge
   - Retrieved domain-specific knowledge

### Example

**Knowledge Entry:**
```
Title: Company Policy
Content: Employees can work remotely on Fridays after approval from managers.
```

**User Query:** "Can I work from home on Friday?"

**RAG Process:**
1. Query encoded to vector
2. Similarity calculated: 0.89 (89%)
3. Knowledge retrieved and added to context
4. Seven responds: "Yes! According to company policy, you can work remotely on Fridays with manager approval."

## 📊 Performance & Limitations

### Performance
- **Search Speed**: ~1-5ms for 100 entries
- **Embedding Speed**: ~50ms per document
- **Storage**: ~1KB per entry (text) + ~1.5KB per entry (FAISS)

### Limitations
- **Context Length**: Long documents are stored as-is. Consider chunking very large files.
- **Language**: Works best with English (model limitation)
- **Accuracy**: Semantic search may miss exact keyword matches
- **Updates**: Deleting entries requires full re-indexing

## 🔒 Privacy & Security

- ✅ **100% Local**: All data stored on your machine
- ✅ **No External APIs**: FAISS runs locally
- ✅ **Offline Capable**: Works without internet
- ✅ **Full Control**: Delete data anytime

## 🛠️ Troubleshooting

### "Knowledge base not available"
**Cause:** FAISS or sentence-transformers not installed

**Fix:**
```bash
pip install faiss-cpu sentence-transformers
```

### "PDF extraction failed"
**Cause:** Encrypted or image-based PDF

**Fix:**
- Use OCR tool to extract text first
- Or use text/markdown files instead

### Low Retrieval Quality
**Cause:** Minimum similarity threshold too high

**Fix:** Adjust `min_similarity` in `chat_routes.py`:
```python
knowledge_results = knowledge_base.query_knowledge(
    query=user_content,
    top_k=3,
    min_similarity=0.5  # Lower threshold
)
```

### Slow Search
**Cause:** Large knowledge base (1000+ entries)

**Fix:** Use FAISS GPU version:
```bash
pip uninstall faiss-cpu
pip install faiss-gpu
```

## 🎓 Best Practices

### 1. **Chunk Large Documents**
Instead of uploading a 100-page PDF as one entry, split into logical sections:
- One entry per chapter
- One entry per topic
- Keeps retrieval focused

### 2. **Use Descriptive Titles**
Good: "Q4 2024 Sales Report - Summary"
Bad: "Document1.pdf"

### 3. **Regular Cleanup**
- Remove outdated information
- Merge duplicate entries
- Keep knowledge base under 1000 entries for best performance

### 4. **Test Retrieval**
Use the `/api/knowledge/query` endpoint to test:
```bash
curl -X POST http://localhost:5000/api/knowledge/query \
  -H "Content-Type: application/json" \
  -d '{"query": "test query", "top_k": 5}'
```

## 🔮 Future Enhancements

Planned features:
- [ ] Document chunking for large files
- [ ] Multi-language support
- [ ] Metadata filtering (date, source, tags)
- [ ] Knowledge versioning
- [ ] Hybrid search (keyword + semantic)
- [ ] Auto-tagging and categorization

## 📚 Additional Resources

- [FAISS Documentation](https://github.com/facebookresearch/faiss)
- [sentence-transformers](https://www.sbert.net/)
- [RAG Explanation](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

**Need Help?** Check `KNOWLEDGE_QUICKSTART.md` for a quick tutorial or `KNOWLEDGE_IMPLEMENTATION_SUMMARY.md` for technical details.





