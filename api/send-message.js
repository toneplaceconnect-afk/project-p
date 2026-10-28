// Серверная функция /api/send-message (Vercel и локальный serve.js).
// Пересылает сообщение из формы в подвале сайта в Telegram-бота.
// Ключи берутся только из переменных окружения TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID.

const MAX_MESSAGE = 2000;
const MAX_CONTACT = 200;

// Простая защита от спама: не больше 5 сообщений с одного адреса за 10 минут.
// Память живёт, пока работает экземпляр функции, — этого достаточно для базовой защиты.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (list.length >= MAX_PER_WINDOW) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((t) => now - t < WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

class PublicError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

const clean = (v, max) => String(v == null ? '' : v).replace(/\u0000/g, '').trim().slice(0, max);

async function sendMessage(body, ip) {
  // Скрытое поле-ловушка: человек его не видит, а простые боты заполняют.
  // Отвечаем «успехом», чтобы бот не пытался обойти защиту.
  if (clean(body?.website, 200)) return { ok: true };

  const message = clean(body?.message, MAX_MESSAGE + 1);
  if (!message) throw new PublicError('Напишите сообщение.', 400);
  if (message.length > MAX_MESSAGE) throw new PublicError(`Сообщение слишком длинное. Максимум ${MAX_MESSAGE} символов.`, 400);
  const contact = clean(body?.contact, MAX_CONTACT);
  const page = clean(body?.page, 200);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error('send-message: не заданы TELEGRAM_BOT_TOKEN и/или TELEGRAM_CHAT_ID');
    throw new PublicError('Отправка пока не настроена. Напишите нам в Telegram или позвоните.', 500);
  }

  if (tooMany(ip)) throw new PublicError('Слишком много сообщений. Попробуйте позже.', 429);

  // Обычный текст без разметки: ничего не нужно экранировать, пользовательский текст не может сломать сообщение
  const lines = ['Новое сообщение с сайта', '', message, '', `Контакт для ответа: ${contact || 'не указан'}`];
  if (page) lines.push(`Страница: ${page}`);
  const text = lines.join('\n');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: controller.signal,
    });
    if (!r.ok) {
      const details = await r.json().catch(() => ({}));
      // В лог — только код и описание от Telegram, без адреса запроса, где лежит токен
      console.error('send-message: Telegram вернул', r.status, details?.description || '');
      throw new PublicError('Не удалось отправить сообщение. Попробуйте позже или напишите в Telegram.', 502);
    }
  } catch (err) {
    if (err instanceof PublicError) throw err;
    console.error('send-message: запрос к Telegram не выполнен:', err?.name || 'error');
    throw new PublicError('Не удалось отправить сообщение. Попробуйте позже или напишите в Telegram.', 502);
  } finally {
    clearTimeout(timer);
  }
  return { ok: true };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается.' });
  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  const forwarded = String(request.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  const ip = forwarded || request.headers?.['x-real-ip'] || 'local';
  try {
    const result = await sendMessage(body || {}, ip);
    return response.status(200).json(result);
  } catch (err) {
    if (err instanceof PublicError) return response.status(err.status).json({ error: err.message });
    console.error('send-message error', err?.name || 'error');
    return response.status(500).json({ error: 'Не удалось отправить сообщение. Попробуйте позже.' });
  }
};
