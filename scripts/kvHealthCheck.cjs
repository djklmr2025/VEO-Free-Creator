#!/usr/bin/env node
const http = require('http');
const https = require('https');

function getArg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const url = getArg('--url', 'https://veo-free-creator.vercel.app/api/kv-health');
const client = url.startsWith('https') ? https : http;

const req = client.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const status = json.ok ? 'OK' : 'FAIL';
      console.log(`[KV Health] ${status} | usingKV=${json.usingKV} | setOk=${json.setOk} | getOk=${json.getOk} | roundtripMs=${json.roundtripMs}`);
      if (!json.ok) {
        if (json.error) console.error('Error:', json.error);
        process.exitCode = 1;
      }
    } catch (e) {
      console.error('Invalid JSON response:', e);
      console.error('Raw:', data);
      process.exitCode = 1;
    }
  });
});

req.on('error', (err) => {
  console.error('Request failed:', err.message);
  process.exitCode = 1;
});