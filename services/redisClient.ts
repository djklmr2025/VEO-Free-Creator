import { createClient, RedisClientType } from 'redis';

let client: RedisClientType | null = null;

/**
 * Returns the configured Redis URL from environment.
 * Supports multiple env names to be compatible with different integrations.
 */
export function getRedisUrl(): string | undefined {
  return (
    process.env.REDIS_URL ||
    process.env.KV_REDIS_URL ||
    process.env.VERCEL_REDIS_URL ||
    undefined
  );
}

/**
 * Get a singleton Redis client using REDIS_URL.
 * Ensures we reuse the same connection across serverless invocations when possible.
 */
export async function getRedis(): Promise<RedisClientType> {
  if (client) return client;

  const url = getRedisUrl();
  if (!url) {
    throw new Error('Missing REDIS_URL');
  }

  client = createClient({ url });
  client.on('error', (err) => {
    console.error('Redis error:', err);
  });

  await client.connect();
  return client;
}

export async function redisHealthCheck() {
  const redis = await getRedis();
  const key = 'kv-health-check';
  const payload = { ts: Date.now() };

  const start = Date.now();
  let setOk = false;
  let getOk = false;
  let roundtripMs = 0;

  await redis.set(key, JSON.stringify(payload)).then(() => { setOk = true; });
  const raw = await redis.get(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      getOk = !!parsed && typeof parsed.ts === 'number';
    } catch {}
  }
  roundtripMs = Date.now() - start;

  return { ok: setOk && getOk, setOk, getOk, roundtripMs };
}