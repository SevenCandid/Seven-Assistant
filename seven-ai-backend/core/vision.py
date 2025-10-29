"""
Seven AI Vision - Image and Video Analysis
Supports both offline (OpenCV, PyTesseract) and online (Groq Vision, OpenAI GPT-4 Vision) analysis
"""

import os
import io
import base64
import tempfile
from typing import Dict, List, Optional, Any, Tuple
from pathlib import Path
import cv2
import numpy as np
from PIL import Image
import pytesseract
import imagehash
from openai import OpenAI

class VisionAnalyzer:
    """Analyzes images and videos using local CV tools and cloud vision APIs"""
    
    def __init__(self, groq_api_key: Optional[str] = None, openai_api_key: Optional[str] = None):
        """
        Initialize vision analyzer
        
        Args:
            groq_api_key: Groq API key for cloud vision (optional)
            openai_api_key: OpenAI API key for GPT-4 Vision (optional)
        """
        self.groq_api_key = groq_api_key
        self.openai_api_key = openai_api_key
        
        # Initialize clients if keys available
        self.groq_client = None
        self.openai_client = None
        
        if groq_api_key:
            try:
                self.groq_client = OpenAI(
                    api_key=groq_api_key,
                    base_url="https://api.groq.com/openai/v1"
                )
                print("✅ Groq Vision client initialized")
            except Exception as e:
                print(f"⚠️ Failed to initialize Groq client: {e}")
        
        if openai_api_key:
            try:
                self.openai_client = OpenAI(api_key=openai_api_key)
                print("✅ OpenAI Vision client initialized")
            except Exception as e:
                print(f"⚠️ Failed to initialize OpenAI client: {e}")
        
        # Load Haar Cascade for face detection (comes with OpenCV)
        self.face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        print("✅ Vision Analyzer initialized (Offline + Online modes)")
    
    def analyze_image(self, 
                     image_data: bytes, 
                     mode: str = "auto",
                     prompt: Optional[str] = None) -> Dict[str, Any]:
        """
        Analyze an image with comprehensive detection
        
        Args:
            image_data: Raw image bytes
            mode: "offline", "online", or "auto" (default)
            prompt: Optional custom prompt for AI vision models
        
        Returns:
            Dictionary with analysis results
        """
        results = {
            "type": "image",
            "offline_analysis": {},
            "online_analysis": {},
            "mode_used": mode
        }
        
        try:
            # Always perform offline analysis (fast and free)
            results["offline_analysis"] = self._analyze_image_offline(image_data)
            
            # Perform online analysis if available and requested
            if mode in ["online", "auto"] and (self.groq_client or self.openai_client):
                results["online_analysis"] = self._analyze_image_online(image_data, prompt)
                results["mode_used"] = "hybrid" if mode == "auto" else "online"
            else:
                results["mode_used"] = "offline"
            
            # Combine results
            results["success"] = True
            results["summary"] = self._generate_summary(results)
            
        except Exception as e:
            results["success"] = False
            results["error"] = str(e)
            print(f"❌ Image analysis failed: {e}")
        
        return results
    
    def _analyze_image_offline(self, image_data: bytes) -> Dict[str, Any]:
        """Offline analysis using OpenCV and PyTesseract"""
        
        # Convert bytes to numpy array
        nparr = np.frombuffer(image_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("Failed to decode image")
        
        # Convert to PIL for some operations
        pil_img = Image.open(io.BytesIO(image_data))
        
        results = {
            "dimensions": {
                "width": img.shape[1],
                "height": img.shape[0],
                "channels": img.shape[2] if len(img.shape) > 2 else 1
            },
            "file_size": len(image_data),
            "format": pil_img.format,
            "mode": pil_img.mode
        }
        
        # 1. Face Detection
        results["faces"] = self._detect_faces(img)
        
        # 2. Text Detection (OCR)
        results["text"] = self._detect_text(pil_img)
        
        # 3. Color Analysis
        results["colors"] = self._analyze_colors(img)
        
        # 4. Object Detection (basic edge/contour detection)
        results["objects"] = self._detect_objects_basic(img)
        
        # 5. Image Hash (for similarity/duplicate detection)
        results["image_hash"] = str(imagehash.average_hash(pil_img))
        
        # 6. Brightness and Quality Metrics
        results["metrics"] = self._analyze_metrics(img)
        
        return results
    
    def _analyze_image_online(self, image_data: bytes, prompt: Optional[str] = None) -> Dict[str, Any]:
        """Online analysis using Groq Vision or OpenAI GPT-4 Vision"""
        
        # Encode image to base64
        base64_image = base64.b64encode(image_data).decode('utf-8')
        
        # Default prompt if none provided
        if not prompt:
            prompt = """Analyze this image and provide:
1. Main subjects/objects in the image
2. Scene description (location, setting)
3. Actions or activities happening
4. Notable details or features
5. Overall mood or atmosphere

Be concise but comprehensive."""
        
        results = {
            "provider": None,
            "description": None,
            "details": {}
        }
        
        try:
            # Skip Groq - vision not supported yet
            # Try OpenAI GPT-4 Vision directly
            if self.openai_client:
                try:
                    response = self.openai_client.chat.completions.create(
                        model="gpt-4o-mini",  # or gpt-4-vision-preview
                        messages=[
                            {
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": prompt},
                                    {
                                        "type": "image_url",
                                        "image_url": {
                                            "url": f"data:image/jpeg;base64,{base64_image}"
                                        }
                                    }
                                ]
                            }
                        ],
                        max_tokens=500
                    )
                    
                    results["provider"] = "openai"
                    results["description"] = response.choices[0].message.content
                    results["model"] = response.model
                    
                except Exception as e:
                    print(f"⚠️ OpenAI vision failed: {e}")
                    results["error"] = str(e)
        
        except Exception as e:
            results["error"] = str(e)
        
        return results
    
    def _detect_faces(self, img: np.ndarray) -> Dict[str, Any]:
        """Detect faces using Haar Cascade"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.1, 
            minNeighbors=5, 
            minSize=(30, 30)
        )
        
        return {
            "count": len(faces),
            "locations": [
                {
                    "x": int(x),
                    "y": int(y),
                    "width": int(w),
                    "height": int(h)
                }
                for (x, y, w, h) in faces
            ]
        }
    
    def _detect_text(self, pil_img: Image.Image) -> Dict[str, Any]:
        """Extract text using PyTesseract OCR"""
        try:
            # Try to detect text
            text = pytesseract.image_to_string(pil_img)
            text_clean = text.strip()
            
            # Get detailed data
            data = pytesseract.image_to_data(pil_img, output_type=pytesseract.Output.DICT)
            
            # Filter out low-confidence detections
            words = []
            for i, conf in enumerate(data['conf']):
                if int(conf) > 30:  # Confidence threshold
                    words.append({
                        "text": data['text'][i],
                        "confidence": int(conf),
                        "position": {
                            "x": int(data['left'][i]),
                            "y": int(data['top'][i]),
                            "width": int(data['width'][i]),
                            "height": int(data['height'][i])
                        }
                    })
            
            return {
                "found": len(text_clean) > 0,
                "full_text": text_clean,
                "word_count": len(text_clean.split()),
                "words": words[:50]  # Limit to first 50 words
            }
        except Exception as e:
            print(f"⚠️ OCR failed: {e}")
            return {
                "found": False,
                "error": "Tesseract not installed or configured",
                "full_text": "",
                "word_count": 0,
                "words": []
            }
    
    def _analyze_colors(self, img: np.ndarray) -> Dict[str, Any]:
        """Analyze dominant colors"""
        # Convert to RGB for color analysis
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        # Reshape to list of pixels
        pixels = img_rgb.reshape(-1, 3)
        
        # Calculate mean color
        mean_color = pixels.mean(axis=0)
        
        # Simple dominant color detection (most common color)
        unique, counts = np.unique(pixels, axis=0, return_counts=True)
        dominant_idx = counts.argmax()
        dominant_color = unique[dominant_idx]
        
        return {
            "mean": {
                "r": int(mean_color[0]),
                "g": int(mean_color[1]),
                "b": int(mean_color[2])
            },
            "dominant": {
                "r": int(dominant_color[0]),
                "g": int(dominant_color[1]),
                "b": int(dominant_color[2])
            }
        }
    
    def _detect_objects_basic(self, img: np.ndarray) -> Dict[str, Any]:
        """Basic object detection using contours"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)
        
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter significant contours
        significant = [c for c in contours if cv2.contourArea(c) > 500]
        
        return {
            "detected_regions": len(significant),
            "description": f"Found {len(significant)} distinct regions/objects"
        }
    
    def _analyze_metrics(self, img: np.ndarray) -> Dict[str, Any]:
        """Analyze image quality metrics"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Brightness
        brightness = np.mean(gray)
        
        # Contrast (standard deviation)
        contrast = np.std(gray)
        
        # Sharpness (Laplacian variance)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness = laplacian.var()
        
        return {
            "brightness": float(brightness),
            "contrast": float(contrast),
            "sharpness": float(sharpness),
            "quality": "good" if sharpness > 100 else "low"
        }
    
    def analyze_video(self, 
                     video_data: bytes,
                     mode: str = "auto",
                     sample_frames: int = 10) -> Dict[str, Any]:
        """
        Analyze a video by sampling frames
        
        Args:
            video_data: Raw video bytes
            mode: "offline", "online", or "auto"
            sample_frames: Number of frames to analyze
        
        Returns:
            Dictionary with video analysis results
        """
        results = {
            "type": "video",
            "frames_analyzed": 0,
            "frame_results": [],
            "summary": {}
        }
        
        try:
            # Save video temporarily
            with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as tmp:
                tmp.write(video_data)
                tmp_path = tmp.name
            
            # Open video
            cap = cv2.VideoCapture(tmp_path)
            
            if not cap.isOpened():
                raise ValueError("Failed to open video file")
            
            # Get video properties
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            results["video_properties"] = {
                "fps": fps,
                "total_frames": frame_count,
                "duration_seconds": duration,
                "width": int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
                "height": int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            }
            
            # Sample frames evenly across video
            frame_indices = np.linspace(0, frame_count - 1, min(sample_frames, frame_count), dtype=int)
            
            for frame_idx in frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
                ret, frame = cap.read()
                
                if ret:
                    # Convert frame to bytes
                    _, buffer = cv2.imencode('.jpg', frame)
                    frame_bytes = buffer.tobytes()
                    
                    # Analyze frame
                    frame_analysis = self.analyze_image(frame_bytes, mode=mode)
                    frame_analysis["frame_number"] = int(frame_idx)
                    frame_analysis["timestamp"] = frame_idx / fps if fps > 0 else 0
                    
                    results["frame_results"].append(frame_analysis)
                    results["frames_analyzed"] += 1
            
            cap.release()
            os.unlink(tmp_path)  # Clean up temp file
            
            # Generate video summary
            results["summary"] = self._generate_video_summary(results)
            results["success"] = True
            
        except Exception as e:
            results["success"] = False
            results["error"] = str(e)
            print(f"❌ Video analysis failed: {e}")
        
        return results
    
    def _generate_summary(self, results: Dict[str, Any]) -> str:
        """Generate human-readable summary from analysis results"""
        offline = results.get("offline_analysis", {})
        online = results.get("online_analysis", {})
        
        summary_parts = []
        
        # Dimensions
        if "dimensions" in offline:
            dims = offline["dimensions"]
            summary_parts.append(f"{dims['width']}x{dims['height']} {offline.get('format', 'image')}")
        
        # Faces
        if "faces" in offline and offline["faces"]["count"] > 0:
            count = offline["faces"]["count"]
            summary_parts.append(f"{count} face{'s' if count > 1 else ''} detected")
        
        # Text
        if "text" in offline and offline["text"]["found"]:
            word_count = offline["text"]["word_count"]
            summary_parts.append(f"{word_count} word{'s' if word_count != 1 else ''} of text")
        
        # Online description (only if meaningful)
        online_desc = online.get("description", "")
        if online_desc and not any(word in online_desc.lower() for word in ["not supported", "failed", "error"]):
            summary_parts.append(f"AI: {online_desc[:100]}...")
        
        return "; ".join(summary_parts) if summary_parts else "Image analyzed successfully"
    
    def _generate_video_summary(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary statistics for video analysis"""
        frames = results.get("frame_results", [])
        
        if not frames:
            return {}
        
        # Aggregate face detection across frames
        total_faces = sum(
            f.get("offline_analysis", {}).get("faces", {}).get("count", 0)
            for f in frames
        )
        
        # Aggregate text detection
        frames_with_text = sum(
            1 for f in frames
            if f.get("offline_analysis", {}).get("text", {}).get("found", False)
        )
        
        return {
            "total_faces_detected": total_faces,
            "frames_with_text": frames_with_text,
            "average_faces_per_frame": total_faces / len(frames) if frames else 0,
            "text_frequency": frames_with_text / len(frames) if frames else 0
        }


# Module-level functions for easy import
def create_vision_analyzer(groq_key: Optional[str] = None, openai_key: Optional[str] = None) -> VisionAnalyzer:
    """Factory function to create vision analyzer"""
    return VisionAnalyzer(groq_api_key=groq_key, openai_api_key=openai_key)

