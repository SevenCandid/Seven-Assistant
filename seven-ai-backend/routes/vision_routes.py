"""
Vision API Routes - Image and Video Analysis Endpoints
"""

from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
from typing import Optional
import os
from dotenv import load_dotenv

from core.vision import create_vision_analyzer

load_dotenv()

router = APIRouter()

# Initialize vision analyzer (will use API keys from environment if available)
vision_analyzer = None

def get_vision_analyzer():
    """Lazy initialization of vision analyzer"""
    global vision_analyzer
    if vision_analyzer is None:
        groq_key = os.getenv("GROQ_API_KEY")
        openai_key = os.getenv("OPENAI_API_KEY")
        vision_analyzer = create_vision_analyzer(groq_key, openai_key)
    return vision_analyzer


@router.post("/analyze_media")
async def analyze_media(
    file: UploadFile = File(...),
    mode: str = Form("auto"),
    prompt: Optional[str] = Form(None),
    sample_frames: int = Form(10)
):
    """
    Analyze an image or video file
    
    Args:
        file: Image or video file to analyze
        mode: Analysis mode - "offline", "online", or "auto" (default)
        prompt: Optional custom prompt for AI vision models (images only)
        sample_frames: Number of frames to analyze for videos (default: 10)
    
    Returns:
        JSON response with analysis results
    """
    try:
        # Validate file type
        content_type = file.content_type or ""
        
        if not (content_type.startswith("image/") or content_type.startswith("video/")):
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type: {content_type}. Only images and videos are supported."
            )
        
        # Read file data
        file_data = await file.read()
        
        if len(file_data) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Validate file size (50MB limit)
        max_size = 50 * 1024 * 1024  # 50MB
        if len(file_data) > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is 50MB, got {len(file_data) / 1024 / 1024:.2f}MB"
            )
        
        # Get analyzer
        analyzer = get_vision_analyzer()
        
        # Analyze based on file type
        if content_type.startswith("image/"):
            print(f"📸 Analyzing image: {file.filename} ({len(file_data) / 1024:.2f}KB, mode={mode})")
            results = analyzer.analyze_image(file_data, mode=mode, prompt=prompt)
        
        elif content_type.startswith("video/"):
            print(f"🎥 Analyzing video: {file.filename} ({len(file_data) / 1024 / 1024:.2f}MB, mode={mode})")
            results = analyzer.analyze_video(file_data, mode=mode, sample_frames=sample_frames)
        
        else:
            raise HTTPException(status_code=400, detail="Unsupported media type")
        
        # Add metadata
        results["filename"] = file.filename
        results["content_type"] = content_type
        results["file_size_bytes"] = len(file_data)
        
        return JSONResponse(content=results)
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Media analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/analyze_image_url")
async def analyze_image_url(
    url: str = Form(...),
    mode: str = Form("auto"),
    prompt: Optional[str] = Form(None)
):
    """
    Analyze an image from a URL
    
    Args:
        url: Image URL
        mode: Analysis mode - "offline", "online", or "auto"
        prompt: Optional custom prompt for AI vision models
    
    Returns:
        JSON response with analysis results
    """
    try:
        import httpx
        
        # Download image
        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30.0)
            response.raise_for_status()
            
            image_data = response.content
        
        # Get analyzer
        analyzer = get_vision_analyzer()
        
        # Analyze image
        print(f"📸 Analyzing image from URL: {url} ({len(image_data) / 1024:.2f}KB, mode={mode})")
        results = analyzer.analyze_image(image_data, mode=mode, prompt=prompt)
        
        # Add metadata
        results["source_url"] = url
        results["file_size_bytes"] = len(image_data)
        
        return JSONResponse(content=results)
    
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {e}")
    except Exception as e:
        print(f"❌ URL analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/vision/status")
async def vision_status():
    """
    Check vision service status and available features
    
    Returns:
        JSON with vision service capabilities
    """
    try:
        analyzer = get_vision_analyzer()
        
        return {
            "status": "online",
            "features": {
                "offline_analysis": {
                    "available": True,
                    "capabilities": [
                        "Face detection (Haar Cascade)",
                        "Text recognition (OCR via PyTesseract)",
                        "Color analysis",
                        "Basic object detection (contours)",
                        "Image quality metrics",
                        "Image fingerprinting"
                    ]
                },
                "online_analysis": {
                    "groq": {
                        "available": analyzer.groq_client is not None,
                        "note": "Vision support may be limited"
                    },
                    "openai": {
                        "available": analyzer.openai_client is not None,
                        "models": ["gpt-4o-mini", "gpt-4-vision-preview"]
                    }
                },
                "video_analysis": {
                    "available": True,
                    "note": "Analyzes video by sampling frames"
                }
            },
            "limits": {
                "max_file_size_mb": 50,
                "supported_formats": {
                    "images": ["JPEG", "PNG", "GIF", "BMP", "WEBP"],
                    "videos": ["MP4", "AVI", "MOV", "WEBM"]
                }
            }
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


@router.get("/vision/tesseract_status")
async def tesseract_status():
    """
    Check if Tesseract OCR is properly installed
    
    Returns:
        JSON with Tesseract installation status
    """
    try:
        import pytesseract
        from PIL import Image
        import numpy as np
        
        # Create a simple test image
        test_img = Image.new('RGB', (100, 50), color='white')
        
        # Try to run OCR
        pytesseract.image_to_string(test_img)
        
        return {
            "installed": True,
            "status": "Tesseract OCR is properly configured",
            "note": "Text recognition is fully functional"
        }
    except pytesseract.TesseractNotFoundError:
        return {
            "installed": False,
            "status": "Tesseract OCR not found",
            "installation_instructions": {
                "windows": "Download from https://github.com/UB-Mannheim/tesseract/wiki and add to PATH",
                "mac": "brew install tesseract",
                "linux": "sudo apt-get install tesseract-ocr"
            },
            "note": "OCR features will not work until Tesseract is installed"
        }
    except Exception as e:
        return {
            "installed": False,
            "status": "Tesseract check failed",
            "error": str(e)
        }












