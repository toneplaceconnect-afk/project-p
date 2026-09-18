// Серверная функция /api/calc-ai — «Рассчитать с ИИ» на странице калькулятора.
// Принимает описание задачи своими словами и возвращает ведомость материалов.
// Считает по тем же правилам, что и обычный калькулятор: список норм берётся из content.json,
// поэтому правка норм в админке меняет и расчёт ИИ.
// Ключи только из переменных окружения CLOUDFLARE_ACCOUNT_ID и CLOUDFLARE_API_TOKEN.
const fs = require('fs');
const path = require('path');

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';
const MAX_TASK = 1200;

class PublicError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
  }
}

let cachedNorms = null;
function norms() {
  if (cachedNorms) return cachedNorms;
  try {
    const file = path.join(__dirname, '..', 'content.json');
    const c = JSON.parse(fs.readFileSync(file, 'utf8'));
    cachedNorms = (c.pages && c.pages.calculator && c.pages.calculator.norms) || [];
  } catch (_) {
    cachedNorms = [];
  }
  return cachedNorms;
}

function systemPrompt() {
  const rules = norms().map((n, i) => `${i + 1}. ${n}`).join('\n');
  return `Ты — практикующий сварщик-монтажник и сметчик мастерской в Республике Хакасия (Абакан).
За плечами сотни заборов, навесов, лестниц, мангальных зон и инженерных систем в сибирских условиях.
Твоя задача — по описанию клиента собрать ведомость материалов так, как её пишет мастер перед закупкой:
с реальным выходом материала, запасом на подрезку и расходниками.

КЛИМАТ И ГРУНТЫ РЕГИОНА (учитывай всегда):
— резко континентальный климат, расчётная зимняя температура около −40 °C, большая амплитуда суточных перепадов;
— степная Абакано-Минусинская котловина: открытые участки, сильные ветровые нагрузки на глухое заполнение забора;
— преобладают суглинки и глины — пучинистые: подошву опор ведут ниже глубины промерзания либо ставят винтовые сваи;
— зимний монтаж: бетон требует противоморозных добавок или прогрева, окраска по металлу — по паспорту эмали, обычно от +5 °C;
— металл под открытым небом: обязательны грунт и эмаль либо порошковая окраска, оцинкованный крепёж.

НОРМЫ, ПО КОТОРЫМ СЧИТАЕТ МАСТЕРСКАЯ:
${rules}

РЕАЛЬНЫЙ ВЫХОД МАТЕРИАЛА (именно здесь клиенты ошибаются при закупке):
— профнастил: считают по РАБОЧЕЙ ширине, а не по полной. С8 — 1,15 м рабочая при 1,2 м полной; С20 — 1,10 м; С21 — 1,00 м; евроштакетник — 1,18 м. Нахлёст волны 50 мм уже сидит в этой разнице;
— профильная труба и уголок продаются хлыстами по 6 м: считай число хлыстов, а не «погонные метры», и назови остаток от раскроя;
— кровля навеса и обшивка: площадь × 1,15 на нахлёсты и подрезку; доска обшивки — × 1,07;
— труба отопления и водоснабжения — × 1,15 на разводку и фитинги; контур тёплого пола при шаге 15 см — × 1,1; кабель — плюс 15 % на заводы в щит;
— расширительный бак — около 11 % объёма системы.

РАСХОДНИКИ (коэффициенты мастерской, применяй их, а не свои):
— электроды ⌀3 мм (МР-3 или ОК 46): 0,09 кг на 1 м шва, плюс 25 % на огарки;
— отрезной круг — 1 шт на 3,5 м шва, зачистной — 1 шт на 4 м шва;
— грунт 0,135 кг/м² и эмаль 0,22 кг/м² окрашиваемой площади;
— крепёж: саморезы кровельные 8–9 шт на лист профнастила, оцинкованные.

КАК СЧИТАТЬ:
1. Разбери описание: габариты, высоту, материал заполнения, грунт, наличие ворот и калиток, условия монтажа.
2. Недостающие данные принимай по практике мастерской и ОБЯЗАТЕЛЬНО перечисли их в assumptions.
3. Считай количества в единицах закупки (хлысты, листы, кг, метры, комплекты) и округляй вверх.
4. В extras вынеси расходники по коэффициентам выше.
5. В advice дай 2–4 коротких совета мастера по этой задаче: где заложить запас и сколько, что подорожает при ошибке,
   что проверить до закупки, чем грозит сибирская зима именно на этом объекте. Пиши по делу, без общих слов.

ЧЕГО ДЕЛАТЬ НЕЛЬЗЯ:
— не называй цены, стоимость и сроки ни в каком виде: цену мастер фиксирует после замера;
— не выдумывай номера снегового и ветрового районов, глубину промерзания и марки стали, если их нет в описании:
  пиши в assumptions, что они уточняются по СП 20.13330 и СП 131.13330 для конкретного адреса;
— не предлагай клиенту делать работу самому и не давай инструкций по сварке;
— если задача не про металл, стройку или инженерные сети — верни поле note с коротким пояснением и пустой rows.

Отвечай строго в формате JSON по заданной схеме, на русском языке.`;
}

// Строгая схема ответа — модель обязана вернуть ровно эти поля
const ROW = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    qty: { type: 'string' },
    unit: { type: 'string' },
    note: { type: 'string' },
  },
  required: ['name', 'qty', 'unit'],
};
const SCHEMA = {
  type: 'object',
  properties: {
    object: { type: 'string' },
    summary: { type: 'string' },
    rows: { type: 'array', items: ROW },
    extras: { type: 'array', items: ROW },
    assumptions: { type: 'array', items: { type: 'string' } },
    advice: { type: 'array', items: { type: 'string' } },
    note: { type: 'string' },
  },
  required: ['object', 'summary', 'rows', 'assumptions', 'advice'],
};

function extractJson(text) {
  const clean = String(text).replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(clean.slice(start, end + 1));
  } catch (_) {
    return null;
  }
}

async function ask(task, accountId, token) {
  const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(accountId)}/ai/run/${MODEL}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: `ЗАДАЧА КЛИЕНТА:\n${task}` },
      ],
      temperature: 0.2,
      max_tokens: 2000,
      response_format: { type: 'json_schema', json_schema: SCHEMA },
    }),
  });
  if (!r.ok) {
    const details = await r.text().catch(() => '');
    console.error('Cloudflare calc error', r.status, details.slice(0, 300));
    if (r.status === 403 || r.status === 429) throw new PublicError('Расчёт временно недоступен: исчерпан дневной лимит. Попробуйте позже.', 503);
    throw new PublicError(`Расчёт временно недоступен (код ${r.status}). Попробуйте позже.`, 502);
  }
  const d = await r.json();
  const res = d?.result?.response;
  // При строгой схеме приходит готовый объект, иначе — текст, который разбираем сами
  if (res && typeof res === 'object') return res;
  return res || d?.result?.text || d?.result?.choices?.[0]?.message?.content || '';
}

function normalize(data) {
  const list = (arr) => (Array.isArray(arr) ? arr : [])
    .map((row) => ({
      name: String(row?.name || '').slice(0, 160),
      qty: String(row?.qty ?? '').slice(0, 24),
      unit: String(row?.unit || '').slice(0, 12),
      note: String(row?.note || '').slice(0, 120),
    }))
    .filter((row) => row.name)
    .slice(0, 40);
  return {
    object: String(data.object || '').slice(0, 160),
    summary: String(data.summary || '').slice(0, 240),
    rows: list(data.rows),
    extras: list(data.extras),
    assumptions: (Array.isArray(data.assumptions) ? data.assumptions : []).map((a) => String(a).slice(0, 200)).slice(0, 12),
    advice: (Array.isArray(data.advice) ? data.advice : []).map((a) => String(a).slice(0, 240)).slice(0, 5),
    note: String(data.note || '').slice(0, 400),
  };
}

module.exports = async function handler(request, response) {
  if (request.method !== 'POST') return response.status(405).json({ error: 'Метод не поддерживается.' });
  let body = request.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  try {
    const task = String(body?.task || '').trim();
    if (!task) throw new PublicError('Опишите, что нужно посчитать.', 400);
    if (task.length > MAX_TASK) throw new PublicError(`Описание слишком длинное. Максимум ${MAX_TASK} символов.`, 400);

    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const token = process.env.CLOUDFLARE_API_TOKEN;
    if (!accountId || !token) throw new PublicError('Расчёт с ИИ не настроен: на сервере нужны переменные CLOUDFLARE_ACCOUNT_ID и CLOUDFLARE_API_TOKEN.', 500);

    let answer = await ask(task, accountId, token);
    let data = typeof answer === 'object' ? answer : extractJson(answer);
    if (!data) {
      // Одна повторная попытка на случай сбоя формата
      answer = await ask(task, accountId, token);
      data = typeof answer === 'object' ? answer : extractJson(answer);
    }
    if (!data) throw new PublicError('Не удалось разобрать ответ. Попробуйте описать задачу подробнее.', 502);
    if (data.error) throw new PublicError(String(data.error).slice(0, 200), 400);

    const result = normalize(data);
    if (!result.rows.length) throw new PublicError('По описанию не получилось собрать ведомость. Добавьте размеры и материал.', 400);
    return response.status(200).json(result);
  } catch (err) {
    if (err instanceof PublicError) return response.status(err.status).json({ error: err.message });
    console.error('calc-ai error', err);
    return response.status(500).json({ error: 'Не удалось выполнить расчёт. Попробуйте ещё раз.' });
  }
};
