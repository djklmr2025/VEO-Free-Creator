
import React, { useState, useRef, useCallback } from 'react';
import { analyzeVideo } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './Button';
import { UploadIcon } from './Icons';

const MAX_FRAMES = 16;
const FRAME_CAPTURE_INTERVAL_S = 2;

const VideoAnalyzer: React.FC = () => {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setAnalysis(null);
      setError(null);
    }
  };

  const extractFrames = useCallback(async (): Promise<string[]> => {
    return new Promise((resolve, reject) => {
      if (!videoRef.current || !canvasRef.current || !videoFile) {
        return reject(new Error("Video or canvas element not ready."));
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const frames: string[] = [];
      let currentTime = 0;
      
      video.src = URL.createObjectURL(videoFile);
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const duration = video.duration;
        const interval = Math.max(FRAME_CAPTURE_INTERVAL_S, duration / MAX_FRAMES);

        video.onseeked = async () => {
          if (!ctx) return reject(new Error("Canvas context is null"));

          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
          const dataUrl = canvas.toDataURL('image/jpeg');
          frames.push(dataUrl.split(',')[1]); // get base64 part
          
          setProgress(Math.round((frames.length / Math.min(MAX_FRAMES, duration / interval)) * 100));

          currentTime += interval;

          if (currentTime <= duration && frames.length < MAX_FRAMES) {
            video.currentTime = currentTime;
          } else {
            URL.revokeObjectURL(video.src);
            resolve(frames);
          }
        };

        video.currentTime = 0; // Start seeking
      };

      video.onerror = (e) => {
        URL.revokeObjectURL(video.src);
        reject(new Error("Error loading video."));
      };
    });
  }, [videoFile]);

  const handleAnalyze = async () => {
    if (!videoFile || !prompt.trim()) {
      setError("Please upload a video and enter a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setProgress(0);

    try {
      const frames = await extractFrames();
      if (frames.length === 0) {
        throw new Error("Could not extract any frames from the video.");
      }
      
      const response = await analyzeVideo(prompt, frames);
      setAnalysis(response.text);

    } catch (err: any) {
      setError(err.message || "An unknown error occurred during analysis.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-1 text-white">Video Analysis</h2>
      <p className="text-gray-400 mb-6">Upload a video and ask Gemini Pro to extract key information.</p>
      
      <div className="space-y-4">
        <div>
            <label htmlFor="video-upload" className="block text-sm font-medium text-gray-300 mb-2">Upload Video</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                    <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                    <div className="flex text-sm text-gray-400">
                        <label htmlFor="video-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-gemini-blue hover:text-gemini-blue/80 focus-within:outline-none">
                            <span>{videoFile ? 'Change video' : 'Upload a file'}</span>
                            <input id="video-upload" name="video-upload" type="file" className="sr-only" accept="video/*" onChange={handleFileChange} disabled={isLoading} />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">{videoFile ? videoFile.name : 'MP4, MOV, AVI up to 50MB'}</p>
                </div>
            </div>
        </div>

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., What is the main subject of this video? Provide a summary."
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gemini-blue focus:outline-none transition"
          rows={3}
          disabled={isLoading}
        />
        <Button onClick={handleAnalyze} isLoading={isLoading} disabled={isLoading || !videoFile || !prompt}>
          {isLoading ? 'Analyzing...' : 'Analyze Video'}
        </Button>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
      
      {isLoading && (
          <div className="mt-4 w-full bg-gray-700 rounded-full h-2.5">
              <div className="bg-gemini-blue h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              <p className="text-center text-sm mt-1">{progress > 0 ? `Extracting frames: ${progress}%` : "Preparing..."}</p>
          </div>
      )}

      {analysis && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Analysis Result:</h3>
          <div className="prose prose-invert bg-gray-900/50 p-4 rounded-lg max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-gray-200">{analysis}</pre>
          </div>
        </div>
      )}

      {/* Hidden elements for processing */}
      <video ref={videoRef} style={{ display: 'none' }} muted playsInline />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default VideoAnalyzer;
