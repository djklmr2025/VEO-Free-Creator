import React, { useState } from 'react';
import Button from './Button';
import { Spinner } from './Icons';
import { testVeoAccess, forceVeoCall } from '../services/geminiService';

interface VeoTesterProps {
  onTestComplete?: (method: string, result: any) => void;
}

const VeoTester: React.FC<VeoTesterProps> = ({ onTestComplete }) => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<{[key: string]: any}>({});

  const testAccess = async () => {
    setTesting(true);
    try {
      const accessResults = await testVeoAccess();
      setResults(accessResults);
      onTestComplete?.('access_test', accessResults);
    } catch (error) {
      const errorResult = { error: error.message };
      setResults(errorResult);
      onTestComplete?.('access_test', errorResult);
    } finally {
      setTesting(false);
    }
  };

  const testForceCall = async (method: 'direct' | 'puter' | 'universal') => {
    setTesting(true);
    try {
      const result = await forceVeoCall('Test video: a beautiful sunset over mountains', method);
      const successResult = { success: true, message: result };
      setResults(prev => ({ ...prev, [`force_${method}`]: successResult }));
      onTestComplete?.(method, successResult);
    } catch (error) {
      const errorResult = { success: false, error: error.message };
      setResults(prev => ({ ...prev, [`force_${method}`]: errorResult }));
      onTestComplete?.(method, errorResult);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-white mb-4">🧪 Veo 3 Access Tester</h3>
      <p className="text-gray-400 mb-4">Test different methods to access and force Veo 3 video generation</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Button
          onClick={testAccess}
          disabled={testing}
          className="flex items-center justify-center gap-2"
        >
          {testing ? <Spinner className="w-4 h-4" /> : null}
          Test Access
        </Button>
        
        <Button
          onClick={() => testForceCall('direct')}
          disabled={testing}
          className="flex items-center justify-center gap-2"
        >
          {testing ? <Spinner className="w-4 h-4" /> : null}
          Force Direct
        </Button>
        
        <Button
          onClick={() => testForceCall('puter')}
          disabled={testing}
          className="flex items-center justify-center gap-2"
        >
          {testing ? <Spinner className="w-4 h-4" /> : null}
          Force Puter
        </Button>
        
        <Button
          onClick={() => testForceCall('universal')}
          disabled={testing}
          className="flex items-center justify-center gap-2"
        >
          {testing ? <Spinner className="w-4 h-4" /> : null}
          Force Universal
        </Button>
      </div>
      
      {Object.keys(results).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-lg font-medium text-white">Test Results:</h4>
          {Object.entries(results).map(([method, result]) => (
            <div key={method} className={`p-3 rounded ${result.success !== false ? 'bg-green-900' : 'bg-red-900'}`}>
              <span className="font-medium capitalize">{method.replace('_', ' ')}:</span> 
              <span className="ml-2">
                {typeof result === 'boolean' 
                  ? (result ? '✅ Available' : '❌ Not Available')
                  : result.message || result.error || JSON.stringify(result)
                }
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VeoTester;