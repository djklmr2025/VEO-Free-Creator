import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-gemini-api-key');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const userKey = (req.headers['x-gemini-api-key'] as string | undefined) || undefined;
    const serviceKey = process.env.GEMINI_API_KEY;
    const apiKey = userKey || serviceKey;
    if (!apiKey) return res.status(500).json({ error: 'Missing API key' });

    const { prompt, aspectRatio, model, image } = (req.body as any) || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Invalid prompt' });
    }

    // TODO: Sustituye por la llamada real a la API de Veo/Gemini Video cuando esté disponible públicamente.
    // Ejemplo orientativo: POST a generativeai.googleapis.com con apiKey en cabecera.
    const upstreamUrl = '/api/generate-veo';
    const upstreamResp = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({ prompt, aspectRatio, model, image })
    });

    if (!upstreamResp.ok) {
      const text = await upstreamResp.text();
      return res.status(upstreamResp.status).json({ error: 'Upstream error', details: text });
    }

    const contentType = upstreamResp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await upstreamResp.json();
      return res.status(200).json(data);
    }

    // Si la respuesta es binaria (video), la reenviamos como base64 para facilitar su consumo en el cliente.
    const arrayBuffer = await upstreamResp.arrayBuffer();
    const buff = Buffer.from(arrayBuffer);
    const base64 = buff.toString('base64');
    return res.status(200).json({ videoBase64: base64, mimeType: upstreamResp.headers.get('content-type') || 'video/mp4' });
  } catch (err: any) {
    return res.status(500).json({ error: 'Server error', details: String(err?.message || err) });
  }
}
