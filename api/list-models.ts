
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Handle only GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 1. Get API Key
    const userKey = (req.headers['x-gemini-api-key'] as string | undefined) || undefined;
    const serviceKey = process.env.GEMINI_API_KEY;
    const apiKey = userKey || serviceKey;

    if (!apiKey) {
      return res.status(500).json({ error: 'Server error', details: 'GEMINI_API_KEY is not configured on the server.' });
    }

    // 2. Call the actual Google Gemini API to list models
    const upstreamUrl = `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`;

    // 3. Make the real API call to Google
    const upstreamResp = await fetch(upstreamUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!upstreamResp.ok) {
      const errorText = await upstreamResp.text();
      return res.status(upstreamResp.status).json({ error: 'Google API listModels error', details: errorText });
    }

    const responseData = await upstreamResp.json();

    // 4. Return the successful response from Google back to the client.
    return res.status(200).json(responseData);

  } catch (err: any) {
    console.error(err); // Log the full error for server-side debugging.
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
}
