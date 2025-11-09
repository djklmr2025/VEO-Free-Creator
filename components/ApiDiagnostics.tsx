
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './Button';
import { Spinner } from './Icons';

const ApiDiagnostics: React.FC = () => {
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleListModels = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const headers: Record<string, string> = {};
      if (auth.apiKey) {
        headers['x-gemini-api-key'] = auth.apiKey;
      }

      const response = await fetch('/api/list-models', {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(`API Error (${response.status}): ${JSON.stringify(data, null, 2)}`);
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-6 p-4 border border-gray-700 rounded-lg bg-gray-800/50">
      <h3 className="text-lg font-semibold text-white mb-2">Diagnóstico de API</h3>
      <p className="text-sm text-gray-400 mb-4">
        Si tienes problemas, usa este botón para verificar qué modelos de Gemini son accesibles con tu clave de API actual.
      </p>
      <Button onClick={handleListModels} isLoading={isLoading} disabled={isLoading}>
        {isLoading ? 'Consultando...' : 'Listar Modelos Disponibles'}
      </Button>

      {error && (
        <div className="mt-4 p-3 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">
          <h4 className="font-bold mb-1">Error:</h4>
          <pre className="text-xs whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-900 text-gray-200 border border-gray-600 rounded-lg">
          <h4 className="font-bold mb-1">Modelos Disponibles (copia el nombre del modelo de texto):</h4>
          <pre className="text-xs whitespace-pre-wrap">{result}</pre>
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostics;
