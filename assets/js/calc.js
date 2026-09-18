/* Калькулятор материалов: интерфейс поверх формул из calc-formulas.js */
(function () {
  'use strict';

  const root = document.querySelector('[data-calc]');
  if (!root || !window.CALC) return;

  const { CATS, buildSheet } = window.CALC;
  const q = (s) => root.querySelector(s);
  const tabs = q('[data-calc-tabs]');
  const fieldsBox = q('[data-calc-fields]');
  const noteBox = q('[data-calc-note]');
  const titleBox = q('[data-calc-title]');
  const summaryBox = q('[data-calc-summary]');
  const rowsBox = q('[data-calc-rows]');
  const extrasBox = q('[data-calc-extras]');
  const status = q('[data-calc-status]');
  const tgUrl = root.dataset.tg;
  const email = root.dataset.email;
  const brand = root.dataset.brand || '';

  const ids = Object.keys(CATS);
  const params = new URLSearchParams(location.search);
  let current = ids.includes(params.get('task')) ? params.get('task') : ids[0];
  const values = {}; // { [cat]: { [field]: value } }

  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function getValue(cat, field) {
    const stored = (values[cat] || {})[field.id];
    return stored === undefined ? field.def : stored;
  }

  function sheet() {
    const fields = CATS[current].fields;
    const raw = (id) => {
      const f = fields.find((x) => x.id === id);
      return f ? getValue(current, f) : 0;
    };
    const n = (id) => {
      const x = parseFloat(String(raw(id)).replace(',', '.'));
      return isFinite(x) && x >= 0 ? x : 0;
    };
    const s = (id) => String(raw(id));
    return buildSheet(current, n, s);
  }

  /* ---------- Вкладки задач ---------- */
  tabs.innerHTML = ids.map((id) => `<button type="button" class="calc__tab" role="tab" data-cat="${id}" data-cursor="-fusion">${esc(CATS[id].title)}</button>`).join('');
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b || b.dataset.cat === current) return;
    current = b.dataset.cat;
    const url = new URL(location.href);
    url.searchParams.set('task', current);
    history.replaceState(null, '', url);
    renderFields();
    renderSheet();
    setStatus('');
  });

  /* ---------- Поля ---------- */
  function renderFields() {
    const cat = CATS[current];
    tabs.querySelectorAll('[data-cat]').forEach((b) => {
      const on = b.dataset.cat === current;
      b.classList.toggle('is-current', on);
      b.setAttribute('aria-selected', String(on));
    });
    titleBox.textContent = cat.title;
    noteBox.textContent = cat.note;
    fieldsBox.innerHTML = cat.fields.map((f) => {
      const id = `calc-${current}-${f.id}`;
      const value = getValue(current, f);
      const control = f.type === 'select'
        ? `<select class="calc__input calc__select" id="${id}" data-field="${f.id}">${f.options.map(([v, l]) => `<option value="${esc(v)}"${String(v) === String(value) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`
        : `<input class="calc__input" id="${id}" data-field="${f.id}" type="number" inputmode="decimal" min="0" step="${f.step || 1}" value="${esc(value)}">`;
      return `<div class="calc__field"><label class="calc__label" for="${id}">${esc(f.label)}</label>${control}</div>`;
    }).join('');
  }

  fieldsBox.addEventListener('input', (e) => {
    const el = e.target.closest('[data-field]');
    if (!el) return;
    values[current] = Object.assign({}, values[current], { [el.dataset.field]: el.value });
    el.classList.toggle('is-invalid', el.type === 'number' && el.value !== '' && !(parseFloat(el.value.replace(',', '.')) >= 0));
    renderSheet();
  });

  /* ---------- Ведомость ---------- */
  const rowHtml = (r) => `<div class="calc__row"><div class="calc__row-label">${esc(r.label)}</div><div class="calc__row-value">${esc(r.value)}</div></div>`;

  function renderSheet() {
    const built = sheet();
    summaryBox.textContent = built.summary;
    rowsBox.innerHTML = built.rows.map(rowHtml).join('');
    extrasBox.innerHTML = built.extras.map(rowHtml).join('');
  }

  function sheetText() {
    const built = sheet();
    const lines = [`Расчёт материалов с сайта «${brand}»`, CATS[current].title, built.summary, ''];
    built.rows.forEach((r) => lines.push(`— ${r.label}: ${r.value}`));
    lines.push('', 'Расходники:');
    built.extras.forEach((r) => lines.push(`— ${r.label}: ${r.value}`));
    lines.push('', 'Расчёт предварительный — прошу назвать стоимость работ и срок.');
    return lines.join('\n');
  }

  /* ---------- Действия ---------- */
  function setStatus(text, type = '') {
    status.textContent = text;
    status.className = `calc__status${type ? ` is-${type}` : ''}`;
  }

  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (__) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  root.querySelectorAll('[data-calc-act]').forEach((b) => {
    b.addEventListener('click', async () => {
      const act = b.dataset.calcAct;
      const text = sheetText();
      if (act === 'tg') {
        const ok = await copy(text);
        window.open(tgUrl, '_blank', 'noopener');
        setStatus(ok ? 'Ведомость скопирована — вставьте её в открывшийся чат Telegram.' : 'Откройте чат и перепишите расчёт — буфер обмена недоступен.', ok ? 'success' : 'error');
      }
      if (act === 'copy') {
        const ok = await copy(text);
        setStatus(ok ? 'Ведомость скопирована в буфер обмена.' : 'Не удалось скопировать — выделите ведомость вручную.', ok ? 'success' : 'error');
      }
      if (act === 'mail') {
        const subject = encodeURIComponent(`${brand} — расчёт: ${CATS[current].title}`);
        window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(text)}`;
      }
      if (act === 'print') window.print();
    });
  });

  renderFields();
  renderSheet();
})();
