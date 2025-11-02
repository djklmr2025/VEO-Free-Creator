import React, { useState } from 'react';
import Button from './Button';
import { Spinner } from './Icons';
import { forceVeoCall } from '../services/geminiService';

const VeoForceCall: React.FC = () => {
  const [isForcing, setIsForcing] = useState(false);
  const [forceResult, setForceResult] = useState<string>('');
  const [prompt, setPrompt] = useState('A majestic eagle soaring over snow-capped mountains at sunset');
  const [forceMethod, setForceMethod] = useState<'direct' | 'puter' | 'universal'>('universal');

  const executeForceCall = async () => {
    setIsForcing(true);
    setForceResult('');
    
    try {
      const result = await forceVeoCall(prompt, forceMethod);
      setForceResult(`✅ Force call executed successfully: ${result}`);
    } catch (error) {
      setForceResult(`❌ Force call failed: ${error.message}`);
    } finally {
      setIsForcing(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-purple-900 to-blue-900 rounded-lg p-6 mb-6 border border-purple-500">
      <h3 className="text-xl font-semibold text-white mb-4">⚡ Force Veo 3 Call</h3>
      <p className="text-gray-300 mb-4">
        Advanced method to force a direct call to Veo 3.1 video generation, bypassing normal restrictions.
      </p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Force Method:
          </label>
          <select
            value={forceMethod}
            onChange={(e) => setForceMethod(e.target.value as 'direct' | 'puter' | 'universal')}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white"
          >
            <option value="universal">Universal (Try All Methods)</option>
            <option value="direct">Direct API Call</option>
            <option value="puter">Puter.js Force Call</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video Prompt to Force:
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white resize-none"
            rows={3}
            placeholder="Describe the video you want to force generate..."
          />
        </div>
        
        <Button
          onClick={executeForceCall}
          disabled={isForcing || !prompt.trim()}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
        >
          {isForcing ? <Spinner className="w-4 h-4" /> : '⚡'}
          {isForcing ? 'Forcing Veo 3 Call...' : `Force Veo 3 Call (${forceMethod})`}
        </Button>
        
        {forceResult && (
          <div className={`p-4 rounded-lg ${forceResult.includes('✅') ? 'bg-green-900' : 'bg-red-900'}`}>
            <h4 className="font-semibold text-white mb-2">Force Call Result:</h4>
            <p className="text-sm text-gray-200 whitespace-pre-wrap">{forceResult}</p>
          </div>
        )}
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <h4 className="font-semibold text-white mb-2">🔧 How Force Calling Works:</h4>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Universal:</strong> Tries direct API first, then Puter.js as fallback</li>
            <li>• <strong>Direct API:</strong> Uses official Gemini AI SDK with veo-3.1-fast-generate-preview</li>
            <li>• <strong>Puter.js:</strong> Forces call through Puter.js with specific Veo 3 commands</li>
            <li>• <strong>Bypass Restrictions:</strong> Uses urgent/direct command language</li>
            <li>• <strong>Model Specification:</strong> Explicitly requests veo-3.1-fast-generate-preview</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default VeoForceCall;