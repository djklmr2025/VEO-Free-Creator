import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';
// Dynamic import to only load Redis client when needed

const TMP_PATH = path.join('/tmp', 'arkaios_autopilot.json');

async function readEnabled(): Promise<boolean> {
  try {
    // Try Vercel KV first if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        const response = await fetch(`${process.env.KV_REST_API_URL}/get/autopilot-state`, {
          headers: {
            'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.result) {
            const parsed = JSON.parse(data.result);
            return !!parsed.enabled;
          }
        }
      } catch (kvError) {
        console.warn('KV read failed, proceeding to Redis/file fallback:', kvError);
      }
    }

    // Try Redis if available
    if (process.env.REDIS_URL) {
      try {
        const { getRedis } = await import('../services/redisClient');
        const redis = await getRedis();
        const raw = await redis.get('autopilot-state');
        if (raw) {
          const data = JSON.parse(raw);
          return !!data.enabled;
        }
      } catch (redisError) {
        console.warn('Redis read failed, proceeding to file fallback:', redisError);
      }
    }

    // Fallback to file system
    if (fs.existsSync(TMP_PATH)) {
      const raw = fs.readFileSync(TMP_PATH, 'utf8');
      const data = JSON.parse(raw);
      return !!data.enabled;
    }
  } catch {}
  
  const envVal = process.env.AUTOPILOT_ENABLED;
  if (envVal === 'true') return true;
  if (envVal === 'false') return false;
  return true; // default ON
}

async function writeEnabled(enabled: boolean, forceStop = false): Promise<boolean> {
  try {
    const data = { 
      enabled: !!enabled, 
      forceStop: forceStop && !enabled,
      timestamp: new Date().toISOString()
    };
    
    // Try Vercel KV first if available
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        await fetch(`${process.env.KV_REST_API_URL}/set/autopilot-state`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.KV_REST_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ value: JSON.stringify(data) }),
        });
      } catch (kvError) {
        console.warn('KV write failed:', kvError);
      }
    } else if (process.env.REDIS_URL) {
      try {
        const { getRedis } = await import('../services/redisClient');
        const redis = await getRedis();
        await redis.set('autopilot-state', JSON.stringify(data));
      } catch (redisError) {
        console.warn('Redis write failed:', redisError);
      }
    }
    
    // Always write to file as backup
    fs.writeFileSync(TMP_PATH, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    // Optional health checks via query param: /api/autopilot?health=kv | redis
    if (req.query && (req.query as any).health === 'kv') {
      const usingKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
      if (!usingKV) {
        return res.status(200).json({ 
          ok: false, 
          usingKV, 
          reason: 'Missing KV_REST_API_URL or KV_REST_API_TOKEN',
          meta: {
            timestamp: new Date().toISOString(),
            vercel: {
              env: process.env.VERCEL_ENV,
              gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
              gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE,
              gitBranch: process.env.VERCEL_GIT_COMMIT_REF
            }
          }
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
        meta: {
          timestamp: new Date().toISOString(),
          vercel: {
            env: process.env.VERCEL_ENV,
            gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
            gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE,
            gitBranch: process.env.VERCEL_GIT_COMMIT_REF
          }
        }
      });
    }

    if (req.query && (req.query as any).health === 'redis') {
      const usingRedis = !!process.env.REDIS_URL;
      if (!usingRedis) {
        return res.status(200).json({ ok: false, usingRedis, reason: 'Missing REDIS_URL' });
      }
      try {
        const { getRedis } = await import('../services/redisClient');
        const redis = await getRedis();
        const key = 'kv-health-check';
        const payload = { ts: Date.now() };
        const start = Date.now();
        await redis.set(key, JSON.stringify(payload));
        const raw = await redis.get(key);
        let getOk = false;
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            getOk = !!parsed && typeof parsed.ts === 'number';
          } catch {}
        }
        const roundtripMs = Date.now() - start;
        return res.status(200).json({ ok: !!raw && getOk, usingRedis, roundtripMs });
      } catch (err: any) {
        return res.status(200).json({ ok: false, usingRedis: true, error: String(err?.message || err) });
      }
    }

    const enabled = await readEnabled();
    return res.status(200).json({ 
      enabled,
      meta: {
        timestamp: new Date().toISOString(),
        vercel: {
          env: process.env.VERCEL_ENV,
          gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA,
          gitCommitMessage: process.env.VERCEL_GIT_COMMIT_MESSAGE,
          gitBranch: process.env.VERCEL_GIT_COMMIT_REF
        }
      }
    });
  }

  if (req.method === 'POST') {
    try {
      const { enabled, forceStop } = req.body || {};
      const ok = await writeEnabled(!!enabled, !!forceStop);
      return res.status(ok ? 200 : 500).json({ 
        ok, 
        enabled: !!enabled, 
        forceStop: !!forceStop && !enabled 
      });
    } catch {
      return res.status(400).json({ ok: false, error: 'Invalid JSON' });
    }
  }

  return res.status(404).json({ error: 'Not found' });
}