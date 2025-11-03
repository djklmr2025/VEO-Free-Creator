import type { VercelRequest, VercelResponse } from '@vercel/node';

// Secure proxy to fetch generated video without exposing the GEMINI_API_KEY to the client
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const uri = (req.query.uri as string) || '';
  if (!uri) {
    return res.status(400).json({ error: 'Missing uri parameter' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server API key not configured' });
  }

  try {
    // Append the API key safely on the server side
    const url = uri.includes('?') ? `${uri}&key=${apiKey}` : `${uri}?key=${apiKey}`;
    const videoRes = await fetch(url);
    if (!videoRes.ok) {
      const text = await videoRes.text();
      return res.status(videoRes.status).json({ error: `Upstream error: ${videoRes.statusText}`, details: text });
    }

    const contentType = videoRes.headers.get('content-type') || 'video/mp4';
    const buffer = Buffer.from(await videoRes.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(buffer);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to proxy video', details: err?.message || String(err) });
  }
}