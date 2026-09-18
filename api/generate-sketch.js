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

const IMAGE_PROMPT_PREFIX = `Create ONE photorealistic commercial product photograph of the exact object described below.

OBJECT IDENTITY IS HARD: the object named after OBJECT: must remain exactly that object. Do not substitute a different product, machine, enclosure, sculpture, abstract form or generic object.

Preserve every explicit requirement. The visible silhouette, function, major components and proportions have priority. All specified materials, wood species, grain direction, metal color, coatings, fasteners and construction details must be visibly plausible. Use physically realistic scale, welded joints and load-bearing structure.

Show the whole object clearly in a professional three-quarter product view. Real camera optics, realistic perspective, natural material texture, believable reflections and shadows, high exposure, clean premium environment, shallow-to-moderate depth of field. The environment must remain secondary to the object.

NO text, labels, dimensions, arrows, logos, UI, diagrams, blueprints, CAD, wireframes, collage, split screen or inset views. ONE object, ONE photograph.

FINAL CHECK before rendering: object identity, silhouette, function, explicit materials, major components and construction must all match the specification.`;

const MAX_PROMPT = 3000;
const MAX_REFS = 2;

class PublicError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

function dataUrlToBlob(dataUrl, index) {
  const m = String(dataUrl || '').match(/^data:(image\/[a-z+.-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m) throw new PublicError(`Некорректный формат изображения №${index + 1}.`, 400);
  return new Blob([Buffer.from(m[2], 'base64')], { type: m[1] });
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
      max_tokens: 900,
    }),
  });
  if (!r.ok) throw new Error(`analysis HTTP ${r.status}`);
  const d = await r.json();
  const text = d?.result?.response || d?.result?.choices?.[0]?.message?.content || d?.choices?.[0]?.message?.content;
  if (!text) throw new Error('analysis returned no specification');
  // Модель может вернуть блок рассуждений — убираем его
  return String(text).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

async function generateImage(prompt, refs, accountId, token) {
  // FLUX.1 schnell — только текст (без референсных фото), запрос строго JSON.
  void refs;
  const r = await fetch(cfUrl(accountId, '@cf/black-forest-labs/flux-1-schnell'), {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, steps: 4, guidance: 6, width: 1024, height: 768 }),
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
  const refs = Array.isArray(body?.referenceImages) ? body.referenceImages : [];
  if (!brief) throw new PublicError('Опишите, что хотите изготовить.', 400);
  if (brief.length > MAX_PROMPT) throw new PublicError(`Описание слишком длинное. Максимум ${MAX_PROMPT} символов.`, 400);
  if (refs.length > MAX_REFS) throw new PublicError(`Можно приложить не больше ${MAX_REFS} изображений.`, 400);

  let spec = brief;
  let analyzed = false;
  try {
    spec = await analyzeBrief(brief, accountId, token);
    analyzed = true;
  } catch (e) {
    // Без повторного запроса: исходное описание — безопасный запасной вариант
    console.warn('Анализ описания недоступен, используется исходный текст:', e?.message || e);
  }

  const prompt = [IMAGE_PROMPT_PREFIX, 'VISUAL DESIGN SPECIFICATION:', spec, 'ORIGINAL CLIENT BRIEF — FINAL AUTHORITY:', brief].join('\n\n');
  const image = await generateImage(prompt, refs, accountId, token);
  return { images: [image], count: 1, referenceCount: refs.length, analyzed };
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
