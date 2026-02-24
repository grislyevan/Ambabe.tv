/**
 * Ambabe.tv — Karaoke queue server
 * Uses only Node built-ins; runs on macOS Big Sur+ (Node 14+).
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3847;
const PUBLIC_DIR = path.join(__dirname, 'public');
const QUEUE_FILE = path.join(__dirname, 'queue.json');
const HOST_PASSWORD = process.env.AMBABE_HOST_PASSWORD || '4321';
const HOST_COOKIE = 'ambabe_host';
const HOST_TOKEN = 'authenticated';

// In-memory queue: [ { id, name, addedAt }, ... ]
let queue = [];
let currentlySingingId = null;

function loadQueue() {
  try {
    const data = JSON.parse(fs.readFileSync(QUEUE_FILE, 'utf8'));
    if (Array.isArray(data)) {
      queue = data;
      currentlySingingId = null;
    } else {
      queue = Array.isArray(data.queue) ? data.queue : [];
      currentlySingingId = data.currentlySingingId && typeof data.currentlySingingId === 'string' ? data.currentlySingingId : null;
    }
  } catch (_) {
    queue = [];
    currentlySingingId = null;
  }
}

function saveQueue() {
  try {
    const out = { queue, currentlySingingId };
    fs.writeFileSync(QUEUE_FILE, JSON.stringify(out, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to save queue:', err.message);
  }
}

function queueForClient() {
  return queue.map((e) => ({ ...e, isCurrentlySinging: e.id === currentlySingingId }));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

function serveStatic(filePath, res) {
  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'application/octet-stream';
  const fullPath = path.join(PUBLIC_DIR, filePath);
  if (!fullPath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (_) {
        resolve({});
      }
    });
  });
}

function parseFormBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      const out = {};
      if (body) {
        body.split('&').forEach((pair) => {
          const i = pair.indexOf('=');
          if (i !== -1) {
            out[decodeURIComponent(pair.slice(0, i).replace(/\+/g, ' '))] =
              decodeURIComponent(pair.slice(i + 1).replace(/\+/g, ' '));
          }
        });
      }
      resolve(out);
    });
  });
}

function getCookie(req, name) {
  const raw = req.headers.cookie || '';
  const match = raw.match(new RegExp('(?:^|;\\s*)' + name.replace(/\W/g, '\\$&') + '=([^;]*)'));
  return match ? match[1] : null;
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  const pathname = url.pathname;

  // API: GET /api/queue
  if (req.method === 'GET' && pathname === '/api/queue') {
    sendJson(res, 200, queueForClient());
    return;
  }

  // API: POST /api/queue — add singer (body: { name })
  if (req.method === 'POST' && pathname === '/api/queue') {
    const body = await parseBody(req);
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      sendJson(res, 400, { error: 'Name is required' });
      return;
    }
    const entry = { id: generateId(), name, addedAt: Date.now() };
    queue.push(entry);
    saveQueue();
    sendJson(res, 201, queueForClient());
    return;
  }

  // API: PATCH /api/queue/reorder — body: { orderedIds: string[] }
  if (req.method === 'PATCH' && pathname === '/api/queue/reorder') {
    const body = await parseBody(req);
    const orderedIds = Array.isArray(body.orderedIds) ? body.orderedIds : [];
    const byId = new Map(queue.map((e) => [e.id, e]));
    const reordered = orderedIds.map((id) => byId.get(id)).filter(Boolean);
    const rest = queue.filter((e) => !byId.has(e.id) || !orderedIds.includes(e.id));
    queue = [...reordered, ...rest];
    saveQueue();
    sendJson(res, 200, queueForClient());
    return;
  }

  // API: PATCH /api/queue/currently-singing — body: { id: string | null }
  if (req.method === 'PATCH' && pathname === '/api/queue/currently-singing') {
    const body = await parseBody(req);
    const id = body.id === null || body.id === undefined ? null : String(body.id).trim();
    if (id !== null && !queue.some((e) => e.id === id)) {
      sendJson(res, 404, { error: 'Singer not in queue' });
      return;
    }
    currentlySingingId = id || null;
    saveQueue();
    sendJson(res, 200, queueForClient());
    return;
  }

  // API: POST /api/queue/:id/move-to-bottom — mark sung, move to end (rotation)
  if (req.method === 'POST' && pathname.endsWith('/move-to-bottom')) {
    const base = pathname.slice(0, -'/move-to-bottom'.length);
    const id = base.slice('/api/queue/'.length);
    if (!id) {
      sendJson(res, 400, { error: 'Id required' });
      return;
    }
    const idx = queue.findIndex((e) => e.id === id);
    if (idx === -1) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    const [entry] = queue.splice(idx, 1);
    queue.push(entry);
    if (currentlySingingId === id) currentlySingingId = null;
    saveQueue();
    sendJson(res, 200, queueForClient());
    return;
  }

  // API: DELETE /api/queue/:id — remove singer (host)
  if (req.method === 'DELETE' && pathname.startsWith('/api/queue/')) {
    const id = pathname.slice('/api/queue/'.length);
    if (!id) {
      sendJson(res, 400, { error: 'Id required' });
      return;
    }
    const before = queue.length;
    queue = queue.filter((e) => e.id !== id);
    if (queue.length === before) {
      sendJson(res, 404, { error: 'Not found' });
      return;
    }
    if (currentlySingingId === id) currentlySingingId = null;
    saveQueue();
    sendJson(res, 200, queueForClient());
    return;
  }

  // Host login: POST /host/auth
  if (req.method === 'POST' && pathname === '/host/auth') {
    parseFormBody(req).then((form) => {
      const password = (form.password || '').trim();
      if (password === HOST_PASSWORD) {
        res.writeHead(302, {
          'Location': '/host',
          'Set-Cookie': HOST_COOKIE + '=' + HOST_TOKEN + '; Path=/; HttpOnly; SameSite=Lax',
        });
        res.end();
      } else {
        res.writeHead(302, { 'Location': '/host?error=1' });
        res.end();
      }
    });
    return;
  }

  // Static files: / -> index.html, /host -> host.html (host is password-protected)
  if (req.method === 'GET') {
    if (pathname === '/' || pathname === '/index.html') {
      serveStatic('index.html', res);
      return;
    }
    if (pathname === '/host' || pathname === '/host.html') {
      if (getCookie(req, HOST_COOKIE) !== HOST_TOKEN) {
        serveStatic('login.html', res);
        return;
      }
      serveStatic('host.html', res);
      return;
    }
    if (pathname === '/qr') {
      serveStatic('qr.html', res);
      return;
    }
    const filePath = pathname.slice(1) || 'index.html';
    if (path.extname(filePath)) {
      serveStatic(filePath, res);
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

loadQueue();
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Ambabe.tv running at http://localhost:${PORT}`);
  console.log(`  Singers: http://localhost:${PORT}/`);
  console.log(`  Host:    http://localhost:${PORT}/host`);
});
