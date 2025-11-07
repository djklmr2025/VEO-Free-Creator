import type { VercelRequest, VercelResponse } from '@vercel/node';

// Serverless endpoint to validate a Google ID token using Google's tokeninfo endpoint
// Usage: POST /api/verify-google-id { idToken: string }
// It returns basic profile claims if valid and checks audience when configured.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const body = (req.body as any) || {};
    const idToken = String(body.idToken || '');
    if (!idToken) {
      return res.status(400).json({ ok: false, error: 'Missing idToken' });
    }

    const resp = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!resp.ok) {
      return res.status(400).json({ ok: false, error: 'Invalid token' });
    }

    const data = await resp.json();
    const audEnv = process.env.GOOGLE_OAUTH_CLIENT_ID || process.env.VITE_GOOGLE_OAUTH_CLIENT_ID;

    // Basic validations: issuer and audience (when configured)
    const issValid = data.iss === 'https://accounts.google.com' || data.iss === 'accounts.google.com';
    const audValid = audEnv ? data.aud === audEnv : true; // If audience is configured, enforce match
    const expValid = Number(data.exp || 0) * 1000 > Date.now();

    if (!issValid || !audValid || !expValid) {
      return res.status(401).json({ ok: false, error: 'Token validation failed', details: { issValid, audValid, expValid } });
    }

    // Return safe claims
    return res.status(200).json({
      ok: true,
      email: data.email,
      name: data.name,
      picture: data.picture,
      aud: data.aud,
      iss: data.iss,
      iat: data.iat,
      exp: data.exp,
    });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}

