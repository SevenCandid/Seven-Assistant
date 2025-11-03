"""
Knowledge Base Routes - RAG System API
Handles knowledge management and retrieval
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict
import PyPDF2
import io

from core.knowledge import knowledge_base
from core.utils import format_success_response, format_error_response

router = APIRouter()


class AddKnowledgeRequest(BaseModel):
    content: str
    title: Optional[str] = ""
    source: Optional[str] = "user"
    metadata: Optional[Dict] = None


class QueryKnowledgeRequest(BaseModel):
    query: str
    top_k: Optional[int] = 3
    min_similarity: Optional[float] = 0.5


class DeleteKnowledgeRequest(BaseModel):
    entry_id: str


@router.post("/knowledge/add")
async def add_knowledge(request: AddKnowledgeRequest):
    """
    Add knowledge entry to the knowledge base
    """
    try:
        if not knowledge_base.is_available():
            return format_error_response(
                "Knowledge base not available. Install FAISS and sentence-transformers."
            )
        
        result = knowledge_base.add_knowledge(
            content=request.content,
            title=request.title,
            source=request.source,
            metadata=request.metadata
        )
        
        return format_success_response(result)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/query")
async def query_knowledge(request: QueryKnowledgeRequest):
    """
    Query knowledge base for relevant entries
    """
    try:
        if not knowledge_base.is_available():
            return format_success_response({"results": []})
        
        results = knowledge_base.query_knowledge(
            query=request.query,
            top_k=request.top_k,
            min_similarity=request.min_similarity
        )
        
        return format_success_response({
            "results": results,
            "count": len(results)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/all")
async def get_all_knowledge():
    """
    Get all knowledge entries
    """
    try:
        if not knowledge_base.is_available():
            return format_success_response({"entries": []})
        
        entries = knowledge_base.get_all_knowledge()
        
        return format_success_response({
            "entries": entries,
            "count": len(entries)
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/knowledge/delete")
async def delete_knowledge(request: DeleteKnowledgeRequest):
    """
    Delete knowledge entry by ID
    """
    try:
        if not knowledge_base.is_available():
            return format_error_response("Knowledge base not available")
        
        deleted = knowledge_base.delete_knowledge(request.entry_id)
        
        if deleted:
            return format_success_response({"message": "Knowledge entry deleted"})
        else:
            return format_error_response("Knowledge entry not found")
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/knowledge/clear")
async def clear_knowledge():
    """
    Clear all knowledge entries
    """
    try:
        if not knowledge_base.is_available():
            return format_error_response("Knowledge base not available")
        
        count = knowledge_base.clear_all()
        
        return format_success_response({
            "message": f"Cleared {count} knowledge entries",
            "count": count
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/knowledge/stats")
async def get_knowledge_stats():
    """
    Get knowledge base statistics
    """
    try:
        stats = knowledge_base.get_stats()
        return format_success_response(stats)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/knowledge/upload")
async def upload_knowledge(
    file: UploadFile = File(...),
    title: Optional[str] = None
):
    """
    Upload PDF or text file to knowledge base
    Extracts text and adds to knowledge base
    """
    try:
        if not knowledge_base.is_available():
            return format_error_response(
                "Knowledge base not available. Install FAISS and sentence-transformers."
            )
        
        # Read file content
        content_bytes = await file.read()
        
        # Extract text based on file type
        if file.filename.endswith('.pdf'):
            # Extract text from PDF
            try:
                pdf_file = io.BytesIO(content_bytes)
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                
                text_content = ""
                for page in pdf_reader.pages:
                    text_content += page.extract_text() + "\n\n"
                
                if not text_content.strip():
                    return format_error_response("Could not extract text from PDF")
                
            except Exception as e:
                return format_error_response(f"PDF extraction failed: {str(e)}")
        
        elif file.filename.endswith(('.txt', '.md')):
            # Plain text or markdown
            text_content = content_bytes.decode('utf-8', errors='ignore')
        
        else:
            return format_error_response(
                "Unsupported file type. Use PDF, TXT, or MD files."
            )
        
        # Add to knowledge base
        result = knowledge_base.add_knowledge(
            content=text_content.strip(),
            title=title or file.filename,
            source=f"file: {file.filename}",
            metadata={"filename": file.filename, "size": len(content_bytes)}
        )
        
        return format_success_response({
            "message": f"Uploaded {file.filename}",
            "status": result["status"],
            "entry": result["entry"]
        })
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))











