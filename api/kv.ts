import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, route: '/api/kv' });
  }
  return res.status(405).json({ ok: false });
}