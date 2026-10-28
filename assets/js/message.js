/* Подвал: ссылка «Отправить сообщение» раскрывает сверху вниз окно с текстом.
   Сообщение уходит на /api/send-message и пересылается в Telegram-бота. */
(function () {
  'use strict';

  const root = document.querySelector('[data-msg]');
  if (!root) return;

  const API = '/api/send-message';
  const toggle = root.querySelector('[data-msg-toggle]');
  const panel = root.querySelector('[data-msg-panel]');
  const form = root.querySelector('[data-msg-form]');
  const textarea = form.querySelector('[data-msg-text]');
  const contact = form.querySelector('[data-msg-contact]');
  const trap = form.querySelector('[data-msg-trap]');
  const counter = form.querySelector('[data-msg-count]');
  const submit = form.querySelector('[data-msg-submit]');
  const submitText = form.querySelector('[data-msg-submit-text]');
  const status = form.querySelector('[data-msg-status]');
  const submitLabel = submitText.textContent;

  let busy = false;
  let closeTimer = 0;

  function setStatus(text, type) {
    status.textContent = text;
    status.className = 'cform__status' + (type ? ' is-' + type : '');
  }

  // Высота страницы меняется — просим плавный скролл и анимации пересчитать размеры
  function refreshLayout() {
    if (window.__lenis && typeof window.__lenis.resize === 'function') window.__lenis.resize();
    if (window.ScrollTrigger && typeof window.ScrollTrigger.refresh === 'function') window.ScrollTrigger.refresh();
  }

  function setOpen(open) {
    clearTimeout(closeTimer);
    root.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.setAttribute('aria-hidden', open ? 'false' : 'true');
    const done = () => {
      refreshLayout();
      if (open) {
        // Окно раскрылось — показываем его целиком и ставим курсор в поле
        textarea.focus({ preventScroll: true });
        if (window.__lenis && typeof window.__lenis.scrollTo === 'function') {
          window.__lenis.scrollTo(root, { offset: -120, duration: 1 });
        }
      }
    };
    setTimeout(done, 560);
  }

  toggle.addEventListener('click', () => setOpen(!root.classList.contains('is-open')));

  textarea.addEventListener('input', () => {
    counter.textContent = textarea.value.length;
    if (status.classList.contains('is-error')) setStatus('');
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const message = textarea.value.trim();
    if (!message) {
      setStatus('Напишите сообщение.', 'error');
      textarea.focus();
      return;
    }
    busy = true;
    submit.disabled = true;
    submit.classList.add('is-busy');
    submitText.textContent = 'Отправляем…';
    setStatus('');
    try {
      const r = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          contact: contact.value.trim(),
          website: trap.value,
          page: location.pathname,
        }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || 'Не удалось отправить сообщение. Попробуйте ещё раз.');
      textarea.value = '';
      counter.textContent = '0';
      setStatus('Сообщение отправлено. Спасибо, скоро ответим!', 'success');
      closeTimer = setTimeout(() => { setOpen(false); setStatus(''); }, 4000);
    } catch (err) {
      setStatus(err && err.message && err.name !== 'TypeError' ? err.message : 'Нет связи с сервером. Проверьте интернет и попробуйте ещё раз.', 'error');
    } finally {
      busy = false;
      submit.disabled = false;
      submit.classList.remove('is-busy');
      submitText.textContent = submitLabel;
    }
  });
})();
