
import React, { useState } from 'react';
import { editImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/fileUtils';
import Button from './Button';
import { UploadIcon } from './Icons';
import { Modality } from '@google/genai';

const ImageEditor: React.FC = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setEditedImageUrl(null);
      setError(null);
      const base64 = await fileToBase64(file);
      setImageBase64(base64);
    }
  };

  const handleEdit = async () => {
    if (!imageBase64 || !imageFile || !prompt.trim()) {
      setError("Please upload an image and enter an editing prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await editImage(prompt, imageBase64, imageFile.type);
      
      const imagePart = response.candidates?.[0]?.content?.parts?.find(part => part.inlineData);
      
      if (imagePart && imagePart.inlineData) {
        const base64Data = imagePart.inlineData.data;
        const mimeType = imagePart.inlineData.mimeType;
        setEditedImageUrl(`data:${mimeType};base64,${base64Data}`);
      } else {
        throw new Error("Editing failed to return a new image.");
      }

    } catch (err: any) {
      setError(err.message || "An unknown error occurred during editing.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-1 text-white">Image Editing</h2>
      <p className="text-gray-400 mb-6">Upload an image and tell Gemini what changes to make.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Upload Image</h3>
            {!imageFile && (
                 <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-600 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                        <UploadIcon className="mx-auto h-12 w-12 text-gray-500" />
                        <div className="flex text-sm text-gray-400">
                            <label htmlFor="image-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-gemini-blue hover:text-gemini-blue/80 focus-within:outline-none">
                                <span>Upload a file</span>
                                <input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                </div>
            )}
            {imageBase64 && (
                <div>
                    <img src={`data:${imageFile?.type};base64,${imageBase64}`} alt="Original" className="w-full rounded-lg shadow-md" />
                     <button onClick={() => {setImageFile(null); setImageBase64(null);}} className="text-sm text-gemini-blue mt-2">Change image</button>
                </div>
            )}
        </div>
        
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Describe Your Edit</h3>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Add a retro filter"
              className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gemini-blue focus:outline-none transition"
              rows={3}
              disabled={isLoading || !imageBase64}
            />
            <Button onClick={handleEdit} isLoading={isLoading} disabled={isLoading || !imageBase64 || !prompt}>
              {isLoading ? 'Editing...' : 'Edit Image'}
            </Button>
        </div>
      </div>
      
      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

      {(isLoading || editedImageUrl) && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Edited Image:</h3>
          <div className="flex justify-center items-center">
            {isLoading ? 
                <div className="w-full max-w-lg h-96 bg-gray-700 animate-pulse rounded-md"></div> :
                <img src={editedImageUrl!} alt="Edited" className="w-full max-w-lg rounded-lg shadow-lg" />
            }
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageEditor;
