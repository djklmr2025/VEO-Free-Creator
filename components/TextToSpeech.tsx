
import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { decode, decodeAudioData, getAudioContext, playAudio } from '../utils/audioUtils';
import Button from './Button';

const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];
const sampleText = 'Hello! I am a friendly AI assistant from Google. I can convert your text into natural-sounding speech.';

const TextToSpeech: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState(voices[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerateSpeech = async () => {
    if (!text.trim()) {
      setError('Please enter some text to generate speech.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const base64Audio = await generateSpeech(text, selectedVoice);
      const audioBytes = decode(base64Audio);
      const audioContext = getAudioContext();
      const audioBuffer = await decodeAudioData(audioBytes, audioContext, 24000, 1);
      playAudio(audioBuffer);
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred while generating speech.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div>
      <h2 className="text-3xl font-bold mb-1 text-white">Text to Speech</h2>
      <p className="text-gray-400 mb-6">Convert text into lifelike speech using Gemini.</p>
      
      <div className="space-y-4">
        <div className="flex items-center gap-4">
            <label htmlFor="voice-select" className="font-medium text-sm text-gray-300">Select a Voice:</label>
            <select
                id="voice-select"
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg p-2 focus:ring-2 focus:ring-gemini-blue focus:outline-none"
                disabled={isLoading}
            >
                {voices.map(voice => <option key={voice} value={voice}>{voice}</option>)}
            </select>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
          className="w-full p-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gemini-blue focus:outline-none transition"
          rows={8}
          disabled={isLoading}
        />
        
        <div className="flex items-center gap-4">
            <Button onClick={handleGenerateSpeech} isLoading={isLoading} disabled={isLoading || !text.trim()}>
              {isLoading ? 'Generating...' : 'Generate Speech'}
            </Button>
            <Button onClick={() => setText(sampleText)} disabled={isLoading} className="bg-gray-600 hover:bg-gray-500">
                Use Sample Text
            </Button>
        </div>
      </div>

      {error && <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}
    </div>
  );
};

export default TextToSpeech;
