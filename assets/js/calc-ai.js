/* Калькулятор → раздел «Рассчитать с ИИ»: свободное описание задачи вместо полей с числами */
(function () {
  'use strict';

  const root = document.querySelector('[data-cai]');
  if (!root) return;

  const API = '/api/calc-ai';
  const q = (s) => root.querySelector(s);

  const toggle = q('[data-cai-toggle]');
  const panel = q('[data-cai-panel]');
  const task = q('[data-cai-task]');
  const submit = q('[data-cai-submit]');
  const submitText = q('[data-cai-submit-text]');
  const status = q('[data-cai-status]');
  const result = q('[data-cai-result]');
  const placeholderHtml = result.innerHTML;

  const calc = document.querySelector('[data-calc]');
  const tgUrl = (calc && calc.dataset.tg) || '';
  const email = (calc && calc.dataset.email) || '';

  let busy = false;
  let sheet = null;

  /* ---------- Раскрытие ---------- */
  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('is-open', open);
    panel.hidden = !open;
    if (open) setTimeout(() => task.focus(), 120);
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));

  /* ---------- Примеры ---------- */
  root.querySelectorAll('[data-cai-example]').forEach((chip) => {
    chip.addEventListener('click', () => {
      task.value = chip.dataset.caiExample;
      task.focus();
      setStatus('Пример подставлен — поправьте под свой объект и нажмите «Рассчитать материалы».');
    });
  });

  function setStatus(text, type = '') {
    status.textContent = text;
    status.className = `calc__status${type ? ` is-${type}` : ''}`;
  }
  function setBusy(on) {
    busy = on;
    submit.disabled = on;
    submitText.textContent = on ? 'Считаем…' : 'Рассчитать материалы';
  }

  /* ---------- Расчёт ---------- */
  async function run() {
    if (busy) return;
    const text = task.value.trim();
    if (!text) {
      setStatus('Опишите, что нужно посчитать.', 'error');
      task.focus();
      return;
    }
    setBusy(true);
    setStatus('Считаем материалы — обычно это занимает 10–30 секунд…');
    result.innerHTML = '<div class="cai__placeholder">Разбираем описание и подбираем материалы…</div>';

    try {
      if (location.protocol === 'file:') throw new Error('Расчёт работает, когда сайт открыт через сервер (node serve.js) или на хостинге.');
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task: text }),
      });
      let data = {};
      try { data = await res.json(); } catch (_) { /* ответ не JSON */ }
      if (!res.ok) throw new Error(data.error || 'Не удалось выполнить расчёт.');
      sheet = data;
      render(data);
      setStatus('Готово. Проверьте допущения — и отправьте ведомость мастеру.', 'success');
    } catch (err) {
      result.innerHTML = placeholderHtml;
      sheet = null;
      setStatus(`Ошибка: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  }
  submit.addEventListener('click', run);
  task.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') run();
  });

  /* ---------- Вывод ведомости ---------- */
  const rowsHtml = (rows) => rows.map((r) => `
    <div class="calc__row">
      <div class="calc__row-label">${esc(r.name)}${r.note ? `<span class="cai__rownote">${esc(r.note)}</span>` : ''}</div>
      <div class="calc__row-value">${esc(r.qty)}${r.unit ? ` <span class="cai__unit">${esc(r.unit)}</span>` : ''}</div>
    </div>`).join('');

  function render(d) {
    const parts = [`<div class="cai__sheet">`];
    parts.push(`<div class="cai__sheet-head"><div class="sec-head__sur">${esc(d.object || 'Ведомость')}</div>${d.summary ? `<div class="calc__summary">${esc(d.summary)}</div>` : ''}</div>`);
    parts.push(`<div class="calc__rows">${rowsHtml(d.rows)}</div>`);
    if (d.extras && d.extras.length) {
      parts.push(`<div class="calc__extras-head"><div class="calc__extras-title">Расходники</div></div>`);
      parts.push(`<div class="calc__rows calc__rows--extras">${rowsHtml(d.extras)}</div>`);
    }
    if (d.assumptions && d.assumptions.length) {
      parts.push(`<div class="cai__assumptions"><div class="calc__extras-title">${esc(root.dataset.caiAssumptions || 'Что принято в расчёте')}</div><ul class="cai__list">${d.assumptions.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`);
    }
    if (d.advice && d.advice.length) {
      parts.push(`<div class="cai__advice"><div class="calc__extras-title">Советы мастера</div><ul class="cai__list cai__list--advice">${d.advice.map((a) => `<li>${esc(a)}</li>`).join('')}</ul></div>`);
    }
    if (d.note) parts.push(`<p class="calc__bottom">${esc(d.note)}</p>`);
    parts.push(`<div class="calc__actions">
      <button class="btn btn--solid calc__send" type="button" data-cai-act="tg" data-cursor="-fusion"><span class="btn__list"><span class="btn__text">Отправить в Telegram</span></span></button>
      <button class="cform__action" type="button" data-cai-act="copy" data-cursor="-fusion">Скопировать</button>
      <button class="cform__action" type="button" data-cai-act="mail" data-cursor="-fusion">✉ На почту</button>
      <button class="cform__action" type="button" data-cai-act="save" data-cursor="-fusion">↓ Сохранить файлом</button>
      <button class="cform__action" type="button" data-cai-act="print" data-cursor="-fusion">⎙ Распечатать</button>
      <button class="cform__action cform__action--danger" type="button" data-cai-act="clear" data-cursor="-fusion">✕ Удалить</button>
    </div>`);
    parts.push(`</div>`);
    result.innerHTML = parts.join('');
    result.querySelectorAll('[data-cai-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.caiAct)));
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  }

  /* ---------- Действия с результатом ---------- */
  function asText() {
    if (!sheet) return '';
    const lines = [`Задача: ${task.value.trim()}`, ''];
    if (sheet.object) lines.push(sheet.object);
    if (sheet.summary) lines.push(sheet.summary);
    lines.push('', 'Материалы:');
    sheet.rows.forEach((r) => lines.push(`— ${r.name}: ${r.qty} ${r.unit}`.trim()));
    if (sheet.extras.length) {
      lines.push('', 'Расходники:');
      sheet.extras.forEach((r) => lines.push(`— ${r.name}: ${r.qty} ${r.unit}`.trim()));
    }
    if (sheet.assumptions.length) {
      lines.push('', 'Принято в расчёте:');
      sheet.assumptions.forEach((a) => lines.push(`— ${a}`));
    }
    if (sheet.advice && sheet.advice.length) {
      lines.push('', 'Советы мастера:');
      sheet.advice.forEach((a) => lines.push(`— ${a}`));
    }
    if (sheet.note) lines.push('', sheet.note);
    lines.push('', 'Расчёт предварительный, нужен замер.');
    return lines.join('\n');
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      ta.remove();
      return ok;
    }
  }

  async function act(name) {
    if (name === 'clear') {
      sheet = null;
      result.innerHTML = placeholderHtml;
      setStatus('Расчёт удалён. Поправьте описание и посчитайте заново.');
      return;
    }
    const text = asText();
    if (!text) return;
    if (name === 'copy') {
      setStatus(await copyText(text) ? 'Ведомость скопирована.' : 'Не удалось скопировать — выделите текст вручную.', 'success');
      return;
    }
    if (name === 'tg') {
      const copied = await copyText(text);
      if (tgUrl) window.open(tgUrl, '_blank', 'noopener');
      setStatus(copied ? 'Ведомость скопирована — вставьте её в чат Telegram.' : 'Откройте чат и опишите задачу.', 'success');
      return;
    }
    if (name === 'mail') {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent('Расчёт материалов с сайта')}&body=${encodeURIComponent(text)}`;
      return;
    }
    if (name === 'save') {
      // Сохранение файлом: работает без интернета и без почтовой программы
      const stamp = new Date().toISOString().slice(0, 10);
      const blob = new Blob(['\ufeff' + text], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `vedomost-${stamp}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      setStatus('Ведомость сохранена файлом в загрузки.', 'success');
      return;
    }
    if (name === 'print') {
      // На печать уходит только ведомость ИИ, без полей обычного калькулятора
      document.body.classList.add('is-print-ai');
      const off = () => document.body.classList.remove('is-print-ai');
      window.addEventListener('afterprint', off, { once: true });
      setTimeout(off, 4000);
      window.print();
    }
  }
})();
