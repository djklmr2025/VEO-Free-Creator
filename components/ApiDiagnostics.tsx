import React, { useEffect, useMemo, useState } from 'react';
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
  // Health checks (KV/Redis)
  { url: '/api/kv-health', method: 'GET' },
  { url: '/api/kvHealth', method: 'GET' },
  { url: '/api/autopilot?health=kv', method: 'GET' },
  { url: '/api/autopilot?health=redis', method: 'GET' },
  // Simple KV list/info endpoint (if available)
  { url: '/api/kv', method: 'GET' },
];

async function checkEndpoint(url: string, method: 'GET' | 'POST' = 'GET'): Promise<CheckResult> {
  const start = performance.now();
  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
      cache: 'no-store',
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
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [intervalMs, setIntervalMs] = useState<number>(15000);

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
      if (baseUrl && baseUrl.startsWith('http') && (typeof window === 'undefined' || baseUrl !== window.location.origin)) {
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

  // Auto refresh (ligero, adecuado para planes pequeños)
  useEffect(() => {
    if (!autoRefresh) return;
    let cancelled = false;
    // Ejecuta inmediatamente y luego programa intervalos
    (async () => {
      await runChecks();
    })();
    const id = setInterval(() => {
      if (!cancelled) {
        runChecks();
      }
    }, Math.max(3000, intervalMs));
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, intervalMs, baseUrl]);

  // Resumen simple
  const summary = useMemo(() => {
    if (!results.length) return null;
    const latencies = results.map(r => r.latencyMs || 0).filter(n => n > 0);
    const avgLatency = latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;
    const okCount = results.filter(r => (r.ok && (r.status ? r.status < 400 : true))).length;
    const total = results.length;
    const redisSignals = results.filter(r => /(kv-health|kvHealth|autopilot\?health=redis)/.test(r.url));
    // Detecta "ok" y, si está disponible, "usingRedis: true"
    const redisOk = redisSignals.some(r => {
      const ok = r.ok && (r.status ? r.status < 400 : true);
      const body = r.body;
      const usingRedis = body && typeof body === 'object' ? (body.usingRedis === true || body.redis === true) : false;
      return ok && (usingRedis || ok);
    });
    const lastChecked = results[0]?.checkedAt;
    return { avgLatency, okCount, total, redisOk, lastChecked };
  }, [results]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-1">🩺 API Diagnostics</h2>
      <p className="text-gray-400 mb-4">Panel ligero para ver estado en tiempo real de KV/Redis y latencias (pensado para planes de hasta ~30&nbsp;MB).</p>

      {/* Resumen */}
      {summary && (
        <div className="bg-gray-800/60 border border-gray-700 rounded-md p-4 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <div>
            <div className="text-gray-400">Latencia media</div>
            <div className="font-medium">{summary.avgLatency} ms</div>
          </div>
          <div>
            <div className="text-gray-400">Salud OK</div>
            <div className="font-medium">{summary.okCount}/{summary.total}</div>
          </div>
          <div>
            <div className="text-gray-400">Redis</div>
            <div className={`font-medium ${summary.redisOk ? 'text-green-400' : 'text-red-400'}`}>{summary.redisOk ? 'Online' : 'Offline'}</div>
          </div>
          <div>
            <div className="text-gray-400">Última comprobación</div>
            <div className="font-medium">{summary.lastChecked}</div>
          </div>
        </div>
      )}

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

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Button onClick={runChecks} disabled={loading} className="flex items-center gap-2">
          {loading ? <Spinner className="w-4 h-4" /> : null}
          Comprobar ahora
        </Button>
        <Button onClick={() => setResults([])} disabled={loading} variant="secondary">
          Limpiar resultados
        </Button>
        <div className="flex items-center gap-2 ml-auto text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
            />
            Auto-refresh
          </label>
          <select
            value={intervalMs}
            onChange={(e) => setIntervalMs(Number(e.target.value))}
            className="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-gray-200"
            aria-label="Intervalo"
          >
            <option value={5000}>5s</option>
            <option value={10000}>10s</option>
            <option value={15000}>15s</option>
            <option value={30000}>30s</option>
            <option value={60000}>60s</option>
          </select>
        </div>
      </div>

      {results.length === 0 ? (
        <div className="text-gray-400">Pulsa "Comprobar ahora" o activa Auto-refresh para iniciar las pruebas.</div>
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