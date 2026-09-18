// Серверная часть админки: вход, чтение и сохранение content.json, загрузка и удаление фото/видео.
// Локально (node serve.js) всё пишется в папку проекта.
// На Vercel — коммит в репозиторий GitHub, после чего Vercel пересобирает сайт (node build.js).
//
// Переменные окружения (задаются в Vercel → Settings → Environment Variables):
//   ADMIN_PASSWORD  — пароль входа в админку (обязательно)
//   GITHUB_TOKEN    — токен GitHub с правом записи в репозиторий (обязательно на Vercel)
//   GITHUB_REPO     — репозиторий в виде «логин/название» (обязательно на Vercel)
//   GITHUB_BRANCH   — ветка, по умолчанию main
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT = 'content.json';
const MEDIA_DIRS = ['assets/photo', 'assets/video', 'assets/img'];
const MAX_MEDIA = 12 * 1024 * 1024; // 12 МБ на файл
const TOKEN_TTL = 12 * 60 * 60 * 1000; // 12 часов
const EXT_OK = { '.jpg': 1, '.jpeg': 1, '.png': 1, '.webp': 1, '.svg': 1, '.mp4': 1 };

class PublicError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

/* ---------- Вход ---------- */
function secret() {
  const pass = process.env.ADMIN_PASSWORD;
  if (!pass) throw new PublicError('Админка не настроена: не задан ADMIN_PASSWORD.', 503);
  return pass;
}

function sign(exp) {
  return crypto.createHmac('sha256', secret()).update(String(exp)).digest('base64url');
}

function makeToken() {
  const exp = Date.now() + TOKEN_TTL;
  return `${exp}.${sign(exp)}`;
}

function checkToken(header) {
  const token = String(header || '').replace(/^Bearer\s+/i, '');
  const [exp, sig] = token.split('.');
  const expected = exp ? Buffer.from(sign(exp)) : null;
  const given = Buffer.from(sig || '');
  const ok = exp && sig && Number(exp) > Date.now() && given.length === expected.length && crypto.timingSafeEqual(given, expected);
  if (!ok) throw new PublicError('Сессия истекла. Войдите заново.', 401);
}

function checkPassword(value) {
  const pass = secret();
  const a = Buffer.from(String(value || ''));
  const b = Buffer.from(pass);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new PublicError('Неверный пароль.', 401);
}

/* ---------- Хранилище: GitHub (боевой сайт) ---------- */
const gh = {
  get available() {
    return !!(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
  },
  get base() {
    return `https://api.github.com/repos/${process.env.GITHUB_REPO}/contents/`;
  },
  get branch() {
    return process.env.GITHUB_BRANCH || 'main';
  },
  headers() {
    return {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'site-admin',
    };
  },
  async call(url, options = {}) {
    const r = await fetch(url, { ...options, headers: { ...this.headers(), ...(options.headers || {}) } });
    if (r.status === 404) return null;
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new PublicError(`GitHub: ${data.message || r.status}`, 502);
    return data;
  },
  async read(file) {
    const data = await this.call(`${this.base}${file}?ref=${this.branch}`);
    if (!data) return null;
    return { text: Buffer.from(data.content, 'base64').toString('utf8'), sha: data.sha };
  },
  async write(file, buffer, message) {
    const current = await this.call(`${this.base}${file}?ref=${this.branch}`);
    return this.call(`${this.base}${file}`, {
      method: 'PUT',
      body: JSON.stringify({
        message,
        content: Buffer.from(buffer).toString('base64'),
        branch: this.branch,
        ...(current && current.sha ? { sha: current.sha } : {}),
      }),
    });
  },
  async remove(file, message) {
    const current = await this.call(`${this.base}${file}?ref=${this.branch}`);
    if (!current) throw new PublicError('Файл не найден.', 404);
    return this.call(`${this.base}${file}`, {
      method: 'DELETE',
      body: JSON.stringify({ message, sha: current.sha, branch: this.branch }),
    });
  },
  async list(dir) {
    const data = await this.call(`${this.base}${dir}?ref=${this.branch}`);
    if (!Array.isArray(data)) return [];
    return data.filter((x) => x.type === 'file').map((x) => ({ path: `${dir}/${x.name}`, size: x.size }));
  },
};

/* ---------- Хранилище: файлы проекта (локальная разработка) ---------- */
const local = {
  full(file) {
    const full = path.resolve(ROOT, file);
    const rel = path.relative(ROOT, full).split(path.sep).join('/');
    if (rel.startsWith('..') || path.isAbsolute(rel)) throw new PublicError('Недопустимый путь.', 400);
    return full;
  },
  async read(file) {
    const full = this.full(file);
    if (!fs.existsSync(full)) return null;
    return { text: fs.readFileSync(full, 'utf8'), sha: null };
  },
  async write(file, buffer) {
    const full = this.full(file);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, buffer);
  },
  async remove(file) {
    const full = this.full(file);
    if (!fs.existsSync(full)) throw new PublicError('Файл не найден.', 404);
    fs.unlinkSync(full);
  },
  async list(dir) {
    const full = this.full(dir);
    if (!fs.existsSync(full)) return [];
    return fs.readdirSync(full)
      .filter((name) => EXT_OK[path.extname(name).toLowerCase()])
      .map((name) => ({ path: `${dir}/${name}`, size: fs.statSync(path.join(full, name)).size }));
  },
  // Локально страницы пересобираются сразу, чтобы изменения было видно после обновления вкладки
  rebuild() {
    try {
      require('child_process').execFileSync(process.execPath, [path.join(ROOT, 'build.js')], { cwd: ROOT });
      return true;
    } catch (_) {
      return false;
    }
  },
};

const store = () => (gh.available ? gh : local);

/* ---------- Проверка контента ---------- */
function validate(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) throw new PublicError('Контент повреждён.', 400);
  for (const key of ['site', 'media', 'nav', 'catalog', 'pages']) {
    if (!content[key]) throw new PublicError(`В контенте нет раздела «${key}» — сохранение отменено.`, 400);
  }
  const text = JSON.stringify(content);
  if (text.length > 2 * 1024 * 1024) throw new PublicError('Слишком большой файл контента.', 413);
  return text;
}

function safeMediaPath(file) {
  const clean = String(file || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const dir = clean.slice(0, clean.lastIndexOf('/'));
  const name = clean.slice(clean.lastIndexOf('/') + 1);
  if (!MEDIA_DIRS.includes(dir)) throw new PublicError('Файлы можно хранить только в assets/photo, assets/video и assets/img.', 400);
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.startsWith('.')) throw new PublicError('Недопустимое имя файла.', 400);
  if (!EXT_OK[path.extname(name).toLowerCase()]) throw new PublicError('Допустимы только jpg, png, webp, svg и mp4.', 400);
  return `${dir}/${name}`;
}

/* ---------- Действия ---------- */
const actions = {
  async login({ password }) {
    checkPassword(password);
    return { token: makeToken(), storage: gh.available ? 'github' : 'local' };
  },

  async content() {
    const file = await store().read(CONTENT);
    if (!file) throw new PublicError('Файл content.json не найден.', 404);
    return { content: JSON.parse(file.text), storage: gh.available ? 'github' : 'local' };
  },

  async save({ content }) {
    const text = validate(content);
    const pretty = JSON.stringify(JSON.parse(text), null, 2) + '\n';
    await store().write(CONTENT, Buffer.from(pretty, 'utf8'), 'Админка: обновление контента');
    if (gh.available) return { ok: true, message: 'Сохранено. Сайт пересоберётся на Vercel за 1–2 минуты.' };
    const built = local.rebuild();
    return { ok: true, message: built ? 'Сохранено, страницы пересобраны.' : 'Сохранено, но пересборка не удалась — запустите node build.js.' };
  },

  async media() {
    const lists = await Promise.all(MEDIA_DIRS.map((dir) => store().list(dir)));
    return { files: lists.flat().sort((a, b) => a.path.localeCompare(b.path)) };
  },

  async upload({ file, data }) {
    const target = safeMediaPath(file);
    const base64 = String(data || '').replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64, 'base64');
    if (!buffer.length) throw new PublicError('Пустой файл.', 400);
    if (buffer.length > MAX_MEDIA) throw new PublicError('Файл больше 12 МБ — сожмите его.', 413);
    await store().write(target, buffer, `Админка: загрузка ${target}`);
    return { ok: true, path: target };
  },

  async remove({ file }) {
    const target = safeMediaPath(file);
    await store().remove(target, `Админка: удаление ${target}`);
    return { ok: true };
  },
};

/* ---------- Точка входа ---------- */
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Метод не поддерживается.' });
  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  const action = actions[body.action];
  try {
    if (!action) throw new PublicError('Неизвестное действие.', 400);
    if (body.action !== 'login') checkToken((req.headers && (req.headers.authorization || req.headers.Authorization)) || '');
    return res.status(200).json(await action(body));
  } catch (e) {
    if (e instanceof PublicError) return res.status(e.status).json({ error: e.message });
    console.error(e);
    return res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
};
module.exports.PublicError = PublicError;
