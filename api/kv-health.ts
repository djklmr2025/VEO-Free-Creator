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

  if (!usingKV) {
    return res.status(200).json({
      ok: false,
      usingKV,
      reason: 'Missing KV_REST_API_URL or KV_REST_API_TOKEN',
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
    // SET
    const setResp = await fetch(`${process.env.KV_REST_API_URL}/set/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value: JSON.stringify(payload) }),
    });
    setOk = setResp.ok;

    // GET
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
  } catch (err: any) {
    lastError = String(err?.message || err);
  }

  return res.status(200).json({
    ok: setOk && getOk,
    usingKV,
    setOk,
    getOk,
    roundtripMs,
    error: lastError,
  });
}