import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const usingKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const redisUrl = process.env.REDIS_URL || process.env.KV_REDIS_URL || process.env.VERCEL_REDIS_URL;
  const usingRedis = !usingKV && !!redisUrl;

  if (!usingKV && !usingRedis) {
    return res.status(200).json({
      ok: false,
      usingKV,
      usingRedis,
      reason: 'Missing KV_REST_API_* or REDIS_URL',
    });
  }

  const key = 'kv-health-check';
  const payload = { ts: Date.now() };

  const start = Date.now();
  let setOk = false;
  let getOk = false;
  let roundtripMs = 0;
  let lastError: string | undefined;

  try {
    if (usingKV) {
      const setResp = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ value: JSON.stringify(payload) }),
      });
      setOk = setResp.ok;

      const getResp = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
        headers: {
          'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
        },
      });
      if (getResp.ok) {
        const data = await getResp.json();
        if (data && typeof data.result === 'string') {
          const parsed = JSON.parse(data.result);
          getOk = !!parsed && typeof parsed.ts === 'number';
        }
      }

      roundtripMs = Date.now() - start;
    } else {
      const { createClient } = await import('redis');
      const client = createClient({ url: redisUrl! });
      client.on('error', (err) => console.error('Redis error:', err));
      await client.connect();
      const key = 'kv-health-check';
      const payload = { ts: Date.now() };
      await client.set(key, JSON.stringify(payload)).then(() => { setOk = true; });
      const raw = await client.get(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          getOk = !!parsed && typeof parsed.ts === 'number';
        } catch {}
      }
      roundtripMs = Date.now() - start;
      await client.disconnect();
    }
  } catch (err: any) {
    lastError = String(err?.message || err);
  }

  return res.status(200).json({
    ok: setOk && getOk,
    usingKV,
    usingRedis,
    setOk,
    getOk,
    roundtripMs,
    error: lastError,
  });
}