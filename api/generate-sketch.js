// Серверная функция /api/generate-sketch (Vercel и локальный serve.js).
// Конвейер: Cloudflare Workers AI — один вызов анализа описания + один вызов генерации (FLUX.1 schnell, быстрая).
// Ключи берутся только из переменных окружения CLOUDFLARE_ACCOUNT_ID и CLOUDFLARE_API_TOKEN.

const DESIGN_ANALYST_PROMPT = `You are the semantic design-analysis stage of a professional product visualization system.

Read the CLIENT BRIEF and return a concise English VISUAL DESIGN SPECIFICATION for an image generator.

Rules:
1. The client's requested object is the absolute identity of the image. Never replace it with another familiar object.
2. Preserve every explicit dimension, proportion, material, color, finish, component, joint, fastener, function and use condition.
3. Interpret spelling mistakes and informal Russian wording by intended meaning.
4. Do not invent distinctive features. If something is unspecified, keep it neutral.
5. Use practical metalwork/furniture manufacturing knowledge only to make the minimum neutral assumptions needed for a coherent, physically buildable object.
6. The result must be in English because it will be passed to the image model.
7. Do not write marketing copy, explanations or alternatives.

Return ONLY a compact specification in this exact format:
OBJECT: ...
FUNCTION: ...
FORM: ...
COMPONENTS: ...
DIMENSIONS: ...
MATERIALS: ...
COLORS AND FINISHES: ...
CONSTRUCTION: ...
ENVIRONMENT: ...
STYLE: ...`;

// Лимит промпта у FLUX.1 schnell — 2048 символов. Постоянную часть держим короткой,
// чтобы описание изделия (главное) и слова заказчика влезали целиком.
const PROMPT_LIMIT = 2000;
const IMAGE_STYLE = `Photorealistic commercial product photograph. Show the whole object in a three-quarter view, correct scale and proportions, welded joints and load-bearing structure, natural wood grain and metal finish, believable light, shadows and reflections, clean premium setting, moderate depth of field. Keep the object exactly as described: do not swap it for another product and do not invent extra parts. No text, labels, dimensions, arrows, logos, blueprints, CAD, collage, split screen or inset views. ONE object, ONE photograph.`;

// Собираем промпт по бюджету символов: сначала объект, затем стиль, и только потом — остаток описания
function buildImagePrompt(spec, brief, analyzed) {
  const head = 'Product to photograph:';
  const body = String(analyzed ? spec : brief).trim();
  const tail = analyzed ? '' : '\n\nThe description above is in Russian: follow its meaning literally.';
  const room = PROMPT_LIMIT - head.length - IMAGE_STYLE.length - tail.length - 8;
  let text = body;
  if (text.length > room) {
    // режем по строкам: OBJECT, FUNCTION и FORM важнее хвоста спецификации
    const lines = text.split('\n');
    text = '';
    for (const line of lines) {
      if ((text + line).length + 1 > room) break;
      text += (text ? '\n' : '') + line;
    }
    if (!text) text = body.slice(0, room);
  }
  return [head, text, IMAGE_STYLE].join('\n\n') + tail;
}

const MAX_PROMPT = 3000;

class PublicError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function cfUrl(accountId, model) {
  return `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${model}`;
}

async function analyzeBrief(brief, accountId, token) {
  const r = await fetch(cfUrl(accountId, '@cf/qwen/qwen3-30b-a3b-fp8'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: DESIGN_ANALYST_PROMPT },
        { role: 'user', content: `CLIENT BRIEF:\n${brief}` },
      ],
      temperature: 0.1,
      max_tokens: 2500,
    }),
  });
  if (!r.ok) throw new Error(`analysis HTTP ${r.status}`);
  const d = await r.json();
  const text = d?.result?.response || d?.result?.text || d?.result?.choices?.[0]?.message?.content || d?.choices?.[0]?.message?.content;
  if (!text) {
    console.warn('analysis empty, result keys:', Object.keys(d?.result || {}));
    throw new Error('analysis returned no specification');
  }
  // Модель может вернуть блок рассуждений — убираем его
  return String(text).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function generateImage(prompt, accountId, token) {
  const r = await fetch(cfUrl(accountId, '@cf/black-forest-labs/flux-1-schnell'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, steps: 4 }),
  });
  if (!r.ok) {
    const details = await r.text().catch(() => '');
    console.error('Cloudflare image error', r.status, details.slice(0, 500));
    if (r.status === 403 || r.status === 429) {
      throw new PublicError('Сервис генерации временно недоступен: исчерпан дневной лимит. Попробуйте позже.', 503);
    }
    throw new PublicError(`Сервис генерации временно недоступен (код ${r.status}). Попробуйте позже.`, 502);
  }
  const d = await r.json();
  const image = d?.result?.image;
  if (!image) throw new PublicError('Сервис генерации не вернул изображение. Попробуйте ещё раз.', 502);
  return `data:image/jpeg;base64,${image}`;
}

async function generateSketch(body) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !token) {
    throw new PublicError('Генерация не настроена: на сервере нужны переменные CLOUDFLARE_ACCOUNT_ID и CLOUDFLARE_API_TOKEN.', 500);
  }

  const brief = String(body?.prompt || '').trim();
  if (!brief) throw new PublicError('Опишите, что хотите изготовить.', 400);
  if (brief.length > MAX_PROMPT) throw new PublicError(`Описание слишком длинное. Максимум ${MAX_PROMPT} символов.`, 400);

  let spec = brief;
  let analyzed = false;
  try {
    spec = await analyzeBrief(brief, accountId, token);
    analyzed = true;
  } catch (first) {
    // Одна повторная попытка: модель-рассуждатель иногда отдаёт пустой ответ
    try {
      spec = await analyzeBrief(brief, accountId, token);
      analyzed = true;
    } catch (e) {
      console.warn('Анализ описания недоступен, используется исходный текст:', e?.message || e, '| первая попытка:', first?.message || first);
    }
  }

  const prompt = buildImagePrompt(spec, brief, analyzed);
  const image = await generateImage(prompt, accountId, token);
  return { images: [image], count: 1, analyzed };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается.' });
  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  try {
    const result = await generateSketch(body || {});
    return response.status(200).json(result);
  } catch (err) {
    if (err instanceof PublicError) return response.status(err.status).json({ error: err.message });
    console.error('generate-sketch error', err);
    return response.status(500).json({ error: 'Не удалось создать визуализацию. Попробуйте ещё раз.' });
  }
};
