const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.AUTOPILOT_PORT || 8787;
const POLICY_PATH = path.join(__dirname, '..', '.trae-policy.json');
const STOP_FILE = path.join(__dirname, '..', 'STOP_AUTOPILOT');

function readPolicy() {
  try {
    const raw = fs.readFileSync(POLICY_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writePolicy(policy) {
  fs.writeFileSync(POLICY_PATH, JSON.stringify(policy, null, 2));
}

function setAutopilotEnabled(enabled, forceStop = false) {
  const policy = readPolicy() || {};
  policy.autopilot = !!enabled;
  policy.allow_auto_run = !!enabled;
  writePolicy(policy);
  if (enabled && !forceStop) {
    if (fs.existsSync(STOP_FILE)) {
      try { fs.unlinkSync(STOP_FILE); } catch (_) {}
    }
  } else {
    // Create STOP_AUTOPILOT file for global emergency stop
    try { 
      const stopMessage = forceStop ? 'EMERGENCY STOP - Created by UI force stop button' : 'Autopilot disabled';
      fs.writeFileSync(STOP_FILE, stopMessage); 
    } catch (_) {}
  }
  return policy;
}

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.url === '/api/autopilot' && req.method === 'GET') {
    const policy = readPolicy();
    const enabled = policy ? !!policy.autopilot : true;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ enabled, policy }));
  }

  if (req.url === '/api/autopilot' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const data = JSON.parse(body || '{}');
        const enabled = !!data.enabled;
        const forceStop = !!data.forceStop;
        const updated = setAutopilotEnabled(enabled, forceStop);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ 
          ok: true, 
          enabled: !!updated.autopilot, 
          forceStop: forceStop && !enabled 
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`[autopilot] server listening on http://localhost:${PORT}`);
});