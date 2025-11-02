import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

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
        console.warn('KV read failed, using file fallback:', kvError);
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
          body: JSON.stringify(data),
        });
      } catch (kvError) {
        console.warn('KV write failed, using file fallback:', kvError);
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
    const enabled = await readEnabled();
    return res.status(200).json({ enabled });
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