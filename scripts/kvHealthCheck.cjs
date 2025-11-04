#!/usr/bin/env node
// KV health check script
// Soporta:
//  - --url: chequear un único endpoint
//  - --base: chequear ambos endpoints (/api/kv-health y /api/kvHealth)
//  - --threshold <ms>: umbral de roundtripMs; si --strict, falla si se supera
//  - --strict: convertir en error cuando roundtripMs > threshold
//  - Salida resumida y exit code != 0 si hay fallo en algún endpoint

const http = require('http');
const https = require('https');

function getArg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const hasFlag = (name) => process.argv.includes(name);

const inputUrl = getArg('--url', null);
const base = getArg('--base', null);
const threshold = parseInt(getArg('--threshold', '1000'), 10);
const strict = hasFlag('--strict');

function fetchJson(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const started = Date.now();
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        const latencyMs = Date.now() - started;
        let json = null;
        let error = null;
        try {
          json = JSON.parse(data);
        } catch (e) {
          error = `Invalid JSON response: ${e.message}`;
        }
        resolve({ url, statusCode: res.statusCode, body: data, json, latencyMs, error });
      });
    });
    req.on('error', (err) => {
      resolve({ url, statusCode: 0, body: '', json: null, latencyMs: Date.now() - started, error: `Request failed: ${err.message}` });
    });
  });
}

async function main() {
  let urls = [];
  if (inputUrl) {
    urls = [inputUrl];
  } else if (base) {
    urls = [
      `${base.replace(/\/$/, '')}/api/kv-health`,
      `${base.replace(/\/$/, '')}/api/kvHealth`,
    ];
  } else {
    // Fallback por defecto: dominio público (se puede sobreescribir con --base o --url)
    urls = ['https://veo-free-creator.vercel.app/api/kv-health'];
  }

  const results = await Promise.all(urls.map(fetchJson));

  let failures = 0;
  for (const r of results) {
    const okFlag = r.json && r.json.ok === true;
    const roundtripMs = r.json && typeof r.json.roundtripMs === 'number' ? r.json.roundtripMs : null;
    const thresholdExceeded = roundtripMs != null && roundtripMs > threshold;
    const statusStr = okFlag ? 'OK' : 'FAIL';
    const statusCode = r.statusCode || 'ERR';
    const usingRedis = r.json && r.json.usingRedis;
    const usingKV = r.json && r.json.usingKV;
    console.log(`[KV Health] ${statusStr} | code=${statusCode} | url=${r.url} | usingKV=${usingKV} | usingRedis=${usingRedis} | setOk=${r.json?.setOk} | getOk=${r.json?.getOk} | roundtripMs=${roundtripMs} | latencyMs=${r.latencyMs}`);

    if (r.error) {
      console.error('  Error:', r.error);
      failures++;
      continue;
    }
    if (statusCode !== 200 || !okFlag) {
      failures++;
    }
    if (strict && thresholdExceeded) {
      console.error(`  Threshold exceeded: roundtripMs=${roundtripMs} > ${threshold}ms`);
      failures++;
    } else if (thresholdExceeded) {
      console.warn(`  Warning: roundtripMs=${roundtripMs} > ${threshold}ms`);
    }
  }

  const success = results.length - failures;
  console.log(`[Summary] checked=${results.length} success=${success} failures=${failures} threshold=${threshold}ms strict=${strict}`);
  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch((e) => {
  console.error('Unexpected error:', e);
  process.exitCode = 1;
});