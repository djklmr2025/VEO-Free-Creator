import type { VercelRequest, VercelResponse } from '@vercel/node';
import fs from 'fs';
import path from 'path';

const TMP_PATH = path.join('/tmp', 'arkaios_autopilot.json');

function readEnabled(): boolean {
  try {
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

function writeEnabled(enabled: boolean, forceStop = false) {
  try {
    const data = { 
      enabled: !!enabled, 
      forceStop: forceStop && !enabled,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync(TMP_PATH, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method === 'GET') {
    const enabled = readEnabled();
    return res.status(200).json({ enabled });
  }

  if (req.method === 'POST') {
    try {
      const { enabled, forceStop } = req.body || {};
      const ok = writeEnabled(!!enabled, !!forceStop);
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