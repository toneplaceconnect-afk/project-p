// Локальный сервер сайта: node serve.js
// Отдаёт статические файлы и обрабатывает POST /api/generate-sketch.
// Ключи Cloudflare читаются из файла .env рядом с этим скриптом (см. .env.example).
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;

// Минимальная загрузка .env без зависимостей
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const PORT = process.env.PORT || 5178;
const MAX_BODY = 6 * 1024 * 1024;
const MAX_BODY_ADMIN = 20 * 1024 * 1024; // админка грузит фото и видео
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.json': 'application/json; charset=utf-8', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const generateSketch = require('./api/generate-sketch');
const adminApi = require('./api/admin');

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
}

function handleApi(req, res, handler, limit) {
  let size = 0;
  const chunks = [];
  req.on('data', (c) => {
    size += c.length;
    if (size > limit) {
      sendJson(res, 413, { error: 'Слишком большой запрос. Уменьшите фото.' });
      req.destroy();
      return;
    }
    chunks.push(c);
  });
  req.on('end', () => {
    if (res.writableEnded) return;
    let body = {};
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (_) { /* пустое тело */ }
    const shim = {
      status(code) { this.code = code; return this; },
      json(data) { sendJson(res, this.code || 200, data); },
    };
    handler({ method: req.method, body, headers: req.headers }, shim).catch((e) => {
      console.error(e);
      if (!res.writableEnded) sendJson(res, 500, { error: 'Внутренняя ошибка сервера.' });
    });
  });
}

// Служебные файлы проекта не отдаём браузеру
const PRIVATE = /^(\.|api\/|node_modules\/|build\.js$|serve\.js$)/;

http.createServer((req, res) => {
  let urlPath;
  try {
    urlPath = decodeURIComponent(req.url.split('?')[0]);
  } catch (_) {
    res.writeHead(400);
    return res.end('Bad request');
  }
  if (urlPath === '/api/generate-sketch' || urlPath === '/api/admin') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Метод не поддерживается.' });
    const admin = urlPath === '/api/admin';
    return handleApi(req, res, admin ? adminApi : generateSketch, admin ? MAX_BODY_ADMIN : MAX_BODY);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }
  const rel = urlPath === '/' ? 'index.html' : urlPath.replace(/^\/+/, '');
  const file = path.resolve(ROOT, rel);
  const inside = path.relative(ROOT, file).split(path.sep).join('/');
  if (inside.startsWith('..') || path.isAbsolute(inside) || urlPath.includes('\0') || PRIVATE.test(inside)) {
    res.writeHead(403);
    return res.end();
  }
  fs.stat(file, (err, stat) => {
    if (err || !stat.isFile()) { res.writeHead(404); return res.end('Not found'); }
    const headers = {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Accept-Ranges': 'bytes',
    };
    // Частичная загрузка (Range) — без неё Safari не воспроизводит видео
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || '');
    if (range && (range[1] || range[2])) {
      let start = range[1] ? parseInt(range[1], 10) : stat.size - parseInt(range[2], 10);
      let end = range[1] && range[2] ? parseInt(range[2], 10) : stat.size - 1;
      start = Math.max(0, start);
      end = Math.min(end, stat.size - 1);
      if (start > end) {
        res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
        return res.end();
      }
      res.writeHead(206, { ...headers, 'Content-Range': `bytes ${start}-${end}/${stat.size}`, 'Content-Length': end - start + 1 });
      if (req.method === 'HEAD') return res.end();
      return fs.createReadStream(file, { start, end }).pipe(res);
    }
    res.writeHead(200, { ...headers, 'Content-Length': stat.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
}).listen(PORT, () => {
  const ready = process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN;
  console.log(`http://localhost:${PORT}`);
  console.log(ready ? 'Генерация эскизов: ключи Cloudflare найдены.' : 'Генерация эскизов: ключи не заданы — создайте .env по образцу .env.example.');
});
