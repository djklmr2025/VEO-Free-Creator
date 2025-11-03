
import React, { useState, useEffect, useRef } from 'react';
import { generateImage } from '../services/geminiService';
import Button from './Button';

type ImageGeneratorProps = {
  defaultPrompt?: string;
  autoGenerate?: boolean;
};

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ defaultPrompt, autoGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasAutoRunRef = useRef(false);

  const handleGenerate = async (overridePrompt?: string) => {
    const finalPrompt = overridePrompt ?? prompt;
    if (!finalPrompt.trim()) {
      setError("Please enter a prompt.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setImageUrl(null);

    try {
      const response = await generateImage(finalPrompt);
      if (response.generatedImages && response.generatedImages.length > 0) {
        const base64Image = response.generatedImages[0].image.imageBytes;
        setImageUrl(`data:image/jpeg;base64,${base64Image}`);
      } else {
        throw new Error("Image generation failed to return an image.");
      }
    } catch (err: any) {
      setError(err.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  // Sync prompt from external defaultPrompt
  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt);
    }
  }, [defaultPrompt]);

  // Auto-generate once when instructed
  useEffect(() => {
    if (autoGenerate && defaultPrompt && !hasAutoRunRef.current) {
      hasAutoRunRef.current = true;
      const run = async () => {
        await new Promise(r => setTimeout(r, 0));
        handleGenerate(defaultPrompt);
      };
      run();
    }
  }, [autoGenerate, defaultPrompt]);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-1 text-white">Image Generation</h2>
      <p className="text-gray-400 mb-6">Create stunning images from text with Imagen 4.</p>
      
      <div className="space-y-4">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A photorealistic image of a futuristic city at sunset"
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gemini-blue focus:outline-none transition"
          rows={3}
          disabled={isLoading}
        />
        <Button onClick={handleGenerate} isLoading={isLoading} disabled={isLoading || !prompt}>
          {isLoading ? 'Generating...' : 'Generate Image'}
        </Button>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="mt-6 flex justify-center items-center h-64 bg-gray-900/50 rounded-lg">
          <div className="w-64 h-64 bg-gray-700 animate-pulse rounded-md"></div>
        </div>
      )}
      
      {imageUrl && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Generated Image:</h3>
          <img src={imageUrl} alt={prompt} className="w-full max-w-lg mx-auto rounded-lg shadow-lg" />
        </div>
      )}
    </div>
  );
};

export default ImageGenerator;
