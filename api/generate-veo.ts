
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Handle only POST requests
  if (req.method !== 'POST') {
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

    // 2. Get request body parameters
    const { prompt } = (req.body as any) || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Bad request', details: 'Invalid or missing prompt.' });
    }

    // 3. Call the actual Google Gemini API
    const model = 'gemini-pro'; // Corrected model name to a valid, public model
    const upstreamUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    // 4. Construct the request body in the format required by the Gemini API.
    const requestBody = {
      "contents": [
        {
          "parts": [
            // Note: The prompt is enhanced to guide the model towards video generation.
            { "text": `Generate a short, high-quality video based on the following description: ${prompt}` }
          ]
        }
      ],
    };

    // 5. Make the real API call to Google
    const upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!upstreamResp.ok) {
      const errorText = await upstreamResp.text();
      // Forward the detailed error from the Google API to the client
      return res.status(upstreamResp.status).json({ error: 'Google API error', details: errorText });
    }

    const responseData = await upstreamResp.json();
    
    // 6. Return the successful response from Google back to the client.
    // The client-side will need to know how to handle this response structure.
    return res.status(200).json(responseData);

  } catch (err: any) {
    console.error(err); // Log the full error for server-side debugging.
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
}
