import React, { useState } from 'react';
import Button from './Button';
import { Spinner } from './Icons';

type CheckResult = {
  url: string;
  method: string;
  status?: number;
  ok?: boolean;
  latencyMs?: number;
  body?: any;
  error?: string;
  checkedAt?: string;
};

const endpoints: { url: string; method?: 'GET' | 'POST' }[] = [
  { url: '/api/autopilot?health=kv', method: 'GET' },
  { url: '/api/kv-health', method: 'GET' },
  { url: '/api/kvHealth', method: 'GET' },
  { url: '/api/kv', method: 'GET' },
];

async function checkEndpoint(url: string, method: 'GET' | 'POST' = 'GET'): Promise<CheckResult> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
    });
    const latencyMs = Math.round(performance.now() - start);
    let body: any = null;
    const contentType = res.headers.get('Content-Type') || '';
    try {
      if (contentType.includes('application/json')) {
        body = await res.json();
      } else {
        body = await res.text();
      }
    } catch (e) {
      body = '[no body]';
    }
    return {
      url,
      method,
      status: res.status,
      ok: res.ok,
      latencyMs,
      body,
      checkedAt: new Date().toLocaleString(),
    };
  } catch (error: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      url,
      method,
      ok: false,
      latencyMs,
      error: error?.message || 'Network error',
      checkedAt: new Date().toLocaleString(),
    };
  }
}

const ResultCard: React.FC<{ result: CheckResult }> = ({ result }) => {
  const isOk = result.ok && (result.status ? result.status < 400 : true);
  return (
    <div className={`p-4 rounded-md border ${isOk ? 'border-green-500 bg-green-900/20' : 'border-red-500 bg-red-900/20'}`}>
      <div className="flex items-center justify-between">
        <div className="font-mono text-sm text-gray-200">
          <span className="mr-2">{result.method}</span>
          <span>{result.url}</span>
        </div>
        <div className="text-xs text-gray-400">{result.checkedAt}</div>
      </div>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
        <div>
          <span className="text-gray-400">Status:</span> <span className="font-medium">{result.status ?? '—'}</span>
        </div>
        <div>
          <span className="text-gray-400">OK:</span> <span className="font-medium">{String(isOk)}</span>
        </div>
        <div>
          <span className="text-gray-400">Latency:</span> <span className="font-medium">{result.latencyMs} ms</span>
        </div>
        <div>
          <span className="text-gray-400">Error:</span> <span className="font-medium">{result.error ?? '—'}</span>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-gray-400 text-xs mb-1">Body</div>
        <pre className="bg-gray-800 rounded p-3 text-xs overflow-x-auto whitespace-pre-wrap break-all">
{typeof result.body === 'string' ? result.body : JSON.stringify(result.body, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const ApiDiagnostics: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CheckResult[]>([]);
  const [baseUrl, setBaseUrl] = useState<string>(typeof window !== 'undefined' ? window.location.origin : '');

  const runChecks = async () => {
    setLoading(true);
    try {
      const out: CheckResult[] = [];
      // Comprueba en el mismo origen (rutas relativas)
      for (const ep of endpoints) {
        // eslint-disable-next-line no-await-in-loop
        const r = await checkEndpoint(ep.url, ep.method || 'GET');
        out.push(r);
      }
      // Si hay un dominio absoluto especificado, comprueba también allí
      if (baseUrl && baseUrl.startsWith('http')) {
        for (const ep of endpoints) {
          const absUrl = `${baseUrl}${ep.url}`;
          // eslint-disable-next-line no-await-in-loop
          const rAbs = await checkEndpoint(absUrl, ep.method || 'GET');
          out.push(rAbs);
        }
      }
      setResults(out);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-2">🩺 API Diagnostics</h2>
      <p className="text-gray-400 mb-4">Comprueba el estado de las APIs en este origen y opcionalmente contra un dominio absoluto (producción/preview).</p>

      <div className="bg-gray-800/60 border border-gray-700 rounded-md p-4 mb-4">
        <label className="block text-sm text-gray-300 mb-2" htmlFor="base-url">Dominio absoluto (opcional)</label>
        <input
          id="base-url"
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://veo-free-creator.vercel.app"
          className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          <Button onClick={() => setBaseUrl('https://veo-free-creator.vercel.app')} variant="secondary">Usar Producción</Button>
          <Button onClick={() => setBaseUrl('https://veo-free-creator-dghj2r8o5-arkaios-projects.vercel.app')} variant="secondary">Usar Preview</Button>
          <Button onClick={() => setBaseUrl(window.location.origin)} variant="secondary">Usar este origen</Button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Button onClick={runChecks} disabled={loading} className="flex items-center gap-2">
          {loading ? <Spinner className="w-4 h-4" /> : null}
          Comprobar todas
        </Button>
        <Button onClick={() => setResults([])} disabled={loading} variant="secondary">
          Limpiar resultados
        </Button>
      </div>

      {results.length === 0 ? (
        <div className="text-gray-400">Pulsa "Comprobar todas" para iniciar las pruebas.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {results.map((r) => (
            <ResultCard key={`${r.method}-${r.url}-${r.checkedAt}`} result={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ApiDiagnostics;