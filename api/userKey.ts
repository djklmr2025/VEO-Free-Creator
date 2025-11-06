import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// Simple KV/Redis wrapper using the same envs as kvHealth.ts
const hasKV = () => !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
const getRedisUrl = () => process.env.REDIS_URL || process.env.KV_REDIS_URL || process.env.VERCEL_REDIS_URL;

const hashId = (id: string) => crypto.createHash('sha256').update(id).digest('hex');

// Key namespace
const keyForUser = (userId: string) => `user:apikey:${hashId(userId)}`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const usingKV = hasKV();
  const redisUrl = getRedisUrl();
  const usingRedis = !usingKV && !!redisUrl;

  if (!usingKV && !usingRedis) {
    return res.status(200).json({ ok: false, reason: 'KV/Redis not configured' });
  }

  try {
    if (req.method === 'POST') {
      const { userId, apiKey, ttlSeconds } = (req.body as any) || {};
      if (!userId || !apiKey) {
        return res.status(400).json({ ok: false, error: 'Missing userId or apiKey' });
      }
      const key = keyForUser(String(userId));
      const payload = JSON.stringify({ apiKey, ts: Date.now() });

      if (usingKV) {
        const url = `${process.env.KV_REST_API_URL}/set/${key}`;
        const headers: Record<string,string> = {
          Authorization: `Bearer ${process.env.KV_REST_API_TOKEN!}`,
          'Content-Type': 'application/json',
        };
        const body: any = { value: payload };
        if (ttlSeconds && Number(ttlSeconds) > 0) body.ex = Number(ttlSeconds);
        const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
        return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
      } else {
        const { createClient } = await import('redis');
        const client = createClient({ url: redisUrl! });
        await client.connect();
        if (ttlSeconds && Number(ttlSeconds) > 0) {
          await client.set(key, payload, { EX: Number(ttlSeconds) });
        } else {
          await client.set(key, payload);
        }
        await client.disconnect();
        return res.status(200).json({ ok: true });
      }
    }

    if (req.method === 'GET') {
      const userId = String((req.query.userId as string) || '');
      if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
      const key = keyForUser(userId);

      if (usingKV) {
        const r = await fetch(`${process.env.KV_REST_API_URL}/get/${key}`, {
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN!}` },
        });
        if (!r.ok) return res.status(404).json({ ok: false });
        const data = await r.json();
        const raw = data?.result;
        if (!raw) return res.status(404).json({ ok: false });
        const parsed = JSON.parse(raw);
        return res.status(200).json({ ok: true, apiKey: parsed.apiKey, ts: parsed.ts });
      } else {
        const { createClient } = await import('redis');
        const client = createClient({ url: redisUrl! });
        await client.connect();
        const raw = await client.get(key);
        await client.disconnect();
        if (!raw) return res.status(404).json({ ok: false });
        const parsed = JSON.parse(raw);
        return res.status(200).json({ ok: true, apiKey: parsed.apiKey, ts: parsed.ts });
      }
    }

    if (req.method === 'DELETE') {
      const userId = String((req.query.userId as string) || '');
      if (!userId) return res.status(400).json({ ok: false, error: 'Missing userId' });
      const key = keyForUser(userId);
      if (usingKV) {
        const r = await fetch(`${process.env.KV_REST_API_URL}/del/${key}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.KV_REST_API_TOKEN!}` },
        });
        return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
      } else {
        const { createClient } = await import('redis');
        const client = createClient({ url: redisUrl! });
        await client.connect();
        const resDel = await client.del(key);
        await client.disconnect();
        return res.status(200).json({ ok: resDel > 0 });
      }
    }

    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

