/**
 * MediaCapture Component - Upload and capture images/videos
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Image as ImageIcon, Video, Eye, Loader } from 'lucide-react';

interface MediaCaptureProps {
  onMediaAnalyzed: (results: any) => void;
  onClose: () => void;
}

export const MediaCapture: React.FC<MediaCaptureProps> = ({ onMediaAnalyzed, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [mode, setMode] = useState<'offline' | 'online' | 'auto'>('auto');
  const [showCamera, setShowCamera] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCameraCapture = async () => {
    try {
      console.log('📷 Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      console.log('✅ Camera access granted');
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video metadata to load
        await new Promise((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log('✅ Video metadata loaded');
              resolve(true);
            };
          }
        });
        
        await videoRef.current.play();
        console.log('✅ Camera preview started');
      }
    } catch (error) {
      console.error('❌ Failed to access camera:', error);
      
      let errorMessage = 'Could not access camera.';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions in your browser settings.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please check your device has a camera.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }
      
      alert(errorMessage);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      console.error('❌ Video or canvas ref not available');
      alert('Camera not ready. Please wait a moment and try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error('❌ Video stream not ready (dimensions: 0x0)');
      alert('Camera is still loading. Please wait a moment and try again.');
      return;
    }
    
    const context = canvas.getContext('2d');

    if (!context) {
      console.error('❌ Could not get canvas context');
      alert('Canvas error. Please try again.');
      return;
    }

    console.log(`📸 Capturing photo: ${video.videoWidth}x${video.videoHeight}`);

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) {
        console.error('❌ Failed to create blob from canvas');
        alert('Failed to capture photo. Please try again.');
        return;
      }

      console.log('✅ Photo captured successfully:', blob.size, 'bytes');

      const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
      setSelectedFile(file);
      setPreview(URL.createObjectURL(blob));

      // Stop camera
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowCamera(false);
  };

  const analyzeMedia = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setAnalysisResults(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('mode', mode);

      const response = await fetch('http://localhost:5000/api/analyze_media', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const results = await response.json();
      console.log('✅ Analysis results received:', results);
      
      // Validate results
      if (!results.offline_analysis) {
        console.error('⚠️ Warning: No offline_analysis in results');
      }
      
      setAnalysisResults(results);
      onMediaAnalyzed(results);

    } catch (error) {
      console.error('❌ Media analysis error:', error);
      
      // Show detailed error
      let errorMessage = 'Analysis failed';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      alert(`${errorMessage}\n\nPlease check:\n1. Backend is running (http://localhost:5000)\n2. Browser console for details`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Main Panel */}
      <motion.div
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-xl shadow-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Media Analysis
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Camera View */}
          {showCamera && (
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-lg"
                autoPlay
                playsInline
              />
              <canvas ref={canvasRef} className="hidden" />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={capturePhoto}
                  className="flex-1 py-3 px-6 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition"
                >
                  📸 Capture Photo
                </button>
                <button
                  onClick={stopCamera}
                  className="py-3 px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Upload Options */}
          {!showCamera && !selectedFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload File */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition group"
              >
                <Upload className="w-12 h-12 mb-4 text-gray-400 group-hover:text-primary-500 transition" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-500 transition">
                  Upload Image/Video
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  PNG, JPEG, GIF, MP4, WEBM
                </span>
              </button>

              {/* Use Camera */}
              <button
                onClick={handleCameraCapture}
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition group"
              >
                <Camera className="w-12 h-12 mb-4 text-gray-400 group-hover:text-primary-500 transition" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-500 transition">
                  Use Camera
                </span>
                <span className="text-sm text-gray-500 mt-2">
                  Capture photo directly
                </span>
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Preview */}
          {preview && selectedFile && !showCamera && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                {selectedFile.type.startsWith('image/') ? (
                  <img src={preview} alt="Preview" className="w-full max-h-96 object-contain" />
                ) : (
                  <video src={preview} controls className="w-full max-h-96" />
                )}
              </div>

              {/* Analysis Mode */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Analysis Mode:
                </span>
                <div className="flex gap-2">
                  {(['offline', 'online', 'auto'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        mode === m
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={analyzeMedia}
                  disabled={isAnalyzing}
                  className="flex-1 py-3 px-6 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Eye className="w-5 h-5" />
                      Analyze Media
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreview(null);
                    setAnalysisResults(null);
                  }}
                  className="py-3 px-6 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition"
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {analysisResults && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-4"
            >
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Analysis Results
              </h3>

              {/* Summary */}
              {analysisResults.summary && (
                <div className="p-4 bg-white dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {analysisResults.summary}
                  </p>
                </div>
              )}

              {/* Offline Analysis */}
              {analysisResults.offline_analysis && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                    Local Analysis:
                  </h4>
                  
                  {/* Faces */}
                  {analysisResults.offline_analysis.faces?.count > 0 && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        👤 Found {analysisResults.offline_analysis.faces.count} face(s)
                      </span>
                    </div>
                  )}

                  {/* Text */}
                  {analysisResults.offline_analysis.text?.found && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="text-sm text-green-700 dark:text-green-300 font-medium">
                        📝 Text Detected ({analysisResults.offline_analysis.text.word_count} words)
                      </span>
                      {analysisResults.offline_analysis.text.full_text && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          "{analysisResults.offline_analysis.text.full_text.substring(0, 200)}..."
                        </p>
                      )}
                    </div>
                  )}

                  {/* Metrics */}
                  {analysisResults.offline_analysis.metrics && (
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary-500">
                          {Math.round(analysisResults.offline_analysis.metrics.brightness)}
                        </div>
                        <div className="text-xs text-gray-500">Brightness</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary-500">
                          {Math.round(analysisResults.offline_analysis.metrics.contrast)}
                        </div>
                        <div className="text-xs text-gray-500">Contrast</div>
                      </div>
                      <div className="p-3 bg-white dark:bg-gray-700 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary-500 capitalize">
                          {analysisResults.offline_analysis.metrics.quality}
                        </div>
                        <div className="text-xs text-gray-500">Quality</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Online Analysis */}
              {analysisResults.online_analysis?.description && (
                <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    AI Description:
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {analysisResults.online_analysis.description}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

