/* Блок «Создай своё»: описание + фото → визуализация через /api/generate-sketch */
(function () {
  'use strict';

  const form = document.querySelector('[data-create]');
  if (!form) return;

  const API = '/api/generate-sketch';
  const q = (s) => form.querySelector(s);

  const textarea = q('#create-description');
  const counter = q('[data-create-count]');
  const submit = q('[data-create-submit]');
  const submitText = q('[data-create-submit-text]');
  const status = q('[data-create-status]');
  const result = q('[data-create-result]');
  const placeholderHtml = result.innerHTML;
  const email = form.dataset.email;
  const tgUrl = form.dataset.tg;
  const brand = form.dataset.brand || '';

  let image = '';
  let busy = false;

  /* ---------- Состояния ---------- */
  function setStatus(text, type = '') {
    status.textContent = text;
    status.className = `cform__status${type ? ` is-${type}` : ''}`;
  }
  function setBusy(on) {
    busy = on;
    submit.disabled = on;
    submit.classList.toggle('is-busy', on);
    submitText.textContent = on ? 'Создаём…' : 'Создать визуализацию';
    form.classList.toggle('is-busy', on);
  }
  function setImage(src) {
    image = src;
    form.querySelectorAll('[data-create-act="download"],[data-create-act="zoom"]').forEach((b) => (b.disabled = !src));
  }
  function updateCount() {
    counter.textContent = textarea.value.length;
  }

  /* ---------- Текст ---------- */
  textarea.addEventListener('input', () => {
    updateCount();
    if (status.classList.contains('is-error')) setStatus('');
  });
  form.querySelectorAll('[data-example]').forEach((chip) => {
    chip.addEventListener('click', () => {
      textarea.value = chip.dataset.example;
      updateCount();
      textarea.focus();
      setStatus('Пример подставлен — поправьте под себя и нажмите «Создать визуализацию».');
    });
  });

  /* ---------- Генерация ---------- */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (busy) return;
    const prompt = textarea.value.trim();
    if (!prompt) {
      setStatus('Сначала опишите, что хотите изготовить.', 'error');
      textarea.focus();
      return;
    }
    setBusy(true);
    setImage('');
    setStatus('Создаём визуализацию — обычно это занимает 20–60 секунд…');
    result.classList.add('is-loading');
    result.innerHTML = '<div class="cform__loader"><div class="cform__loader-bar"></div><div>Анализируем описание и рисуем изделие…</div></div>';

    try {
      if (location.protocol === 'file:') throw new Error('Генерация работает, когда сайт открыт через сервер (node serve.js) или на хостинге.');
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, count: 1 }),
      });
      let data = {};
      try { data = await res.json(); } catch (_) { /* ответ не JSON */ }
      if (!res.ok) throw new Error(data.error || (res.status === 404 ? 'Сервер генерации не найден. Запустите сайт через node serve.js или разместите на Vercel.' : 'Не удалось создать визуализацию.'));
      const src = data.images && data.images[0];
      if (!src) throw new Error('Визуализация не получена. Попробуйте ещё раз.');

      result.classList.remove('is-loading');
      result.innerHTML = '';
      const img = new Image();
      img.alt = 'Визуализация изделия по вашему описанию';
      img.src = src;
      img.className = 'cform__image';
      img.dataset.cursorText = 'Увеличить';
      img.addEventListener('click', () => openZoom(image));
      result.appendChild(img);
      setImage(src);
      setStatus('Готово. Скачайте визуализацию или отправьте её мастеру.', 'success');
    } catch (err) {
      result.classList.remove('is-loading');
      result.innerHTML = placeholderHtml;
      setStatus(`Ошибка: ${err.message}`, 'error');
    } finally {
      setBusy(false);
    }
  });

  /* ---------- Действия с результатом ---------- */
  function brief() {
    const text = textarea.value.trim();
    return [`${brand} — заявка «Создай своё»`, '', text || '(описание не заполнено)', '', image ? 'Визуализация создана на сайте, прикладываю изображение.' : ''].join('\n').trim();
  }

  async function dataUrlToFile(url, name) {
    const blob = await (await fetch(url)).blob();
    return new File([blob], name, { type: blob.type || 'image/jpeg' });
  }

  function download() {
    if (!image) return;
    const a = document.createElement('a');
    a.href = image;
    a.download = 'proekt-svarka-vizualizaciya.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (_) {
      return false;
    }
  }

  function requireText() {
    if (textarea.value.trim()) return true;
    setStatus('Опишите изделие — это описание уйдёт мастеру вместе с визуализацией.', 'error');
    textarea.focus();
    return false;
  }

  async function sendTelegram() {
    if (!requireText()) return;
    // На телефоне — системное меню «Поделиться» сразу с картинкой
    if (image && navigator.share) {
      try {
        const file = await dataUrlToFile(image, 'proekt-svarka-vizualizaciya.jpg');
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ title: brand, text: brief(), files: [file] });
          return;
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
    }
    const copied = await copyText(brief());
    if (image) download();
    window.open(tgUrl, '_blank', 'noopener');
    setStatus(
      `${copied ? 'Текст заявки скопирован — вставьте его в чат.' : 'Откройте чат и опишите задачу.'}${image ? ' Визуализация скачана — прикрепите файл к сообщению.' : ''}`,
      'success',
    );
  }

  function sendMail() {
    if (!requireText()) return;
    if (image) download();
    const subject = encodeURIComponent(`${brand} — заявка «Создай своё»`);
    const body = encodeURIComponent(brief());
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    if (image) setStatus('Визуализация скачана — прикрепите файл к письму.', 'success');
  }

  form.querySelectorAll('[data-create-act]').forEach((b) => {
    b.addEventListener('click', () => {
      const act = b.dataset.createAct;
      if (act === 'download') download();
      if (act === 'zoom') openZoom(image);
      if (act === 'tg') sendTelegram();
      if (act === 'mail') sendMail();
    });
  });

  /* ---------- Просмотр с увеличением ---------- */
  let zoom = null;
  let zoomImg = null;
  let scale = 1;
  let x = 0;
  let y = 0;

  const apply = () => { zoomImg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`; };

  function closeZoom() {
    if (!zoom) return;
    zoom.classList.remove('is-open');
    document.documentElement.classList.remove('cz-open');
    if (window.__lenis) window.__lenis.start();
  }

  function buildZoom() {
    zoom = document.createElement('div');
    zoom.className = 'czoom';
    zoom.setAttribute('role', 'dialog');
    zoom.setAttribute('aria-label', 'Визуализация');
    zoom.innerHTML = `
      <div class="czoom__bar">
        <div class="czoom__title">Визуализация</div>
        <div class="czoom__ui">
          <button type="button" data-z="out" aria-label="Уменьшить">−</button>
          <button type="button" data-z="reset">100%</button>
          <button type="button" data-z="in" aria-label="Увеличить">+</button>
          <button type="button" data-z="download" aria-label="Скачать">↓</button>
          <button type="button" data-z="close" aria-label="Закрыть">×</button>
        </div>
      </div>
      <div class="czoom__stage"><img class="czoom__img" draggable="false" alt="Увеличенная визуализация"></div>`;
    document.body.appendChild(zoom);
    zoomImg = zoom.querySelector('.czoom__img');
    const stage = zoom.querySelector('.czoom__stage');

    zoom.querySelector('[data-z="close"]').onclick = closeZoom;
    zoom.querySelector('[data-z="download"]').onclick = download;
    zoom.querySelector('[data-z="out"]').onclick = () => { scale = Math.max(0.5, scale - 0.25); apply(); };
    zoom.querySelector('[data-z="in"]').onclick = () => { scale = Math.min(4, scale + 0.25); apply(); };
    zoom.querySelector('[data-z="reset"]').onclick = () => { scale = 1; x = y = 0; apply(); };
    stage.addEventListener('click', (e) => { if (e.target === stage) closeZoom(); });

    let drag = false;
    let sx = 0;
    let sy = 0;
    zoomImg.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      drag = true;
      sx = e.clientX - x;
      sy = e.clientY - y;
      zoomImg.classList.add('is-dragging');
    });
    window.addEventListener('mousemove', (e) => { if (drag) { x = e.clientX - sx; y = e.clientY - sy; apply(); } });
    window.addEventListener('mouseup', () => { drag = false; zoomImg.classList.remove('is-dragging'); });
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      scale = Math.max(0.5, Math.min(4, scale + (e.deltaY < 0 ? 0.2 : -0.2)));
      apply();
    }, { passive: false });

    let pinch = 0;
    let tdrag = false;
    zoomImg.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) { tdrag = true; sx = e.touches[0].clientX - x; sy = e.touches[0].clientY - y; }
      if (e.touches.length === 2) {
        tdrag = false;
        pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      }
    }, { passive: true });
    zoomImg.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length === 1 && tdrag) { x = e.touches[0].clientX - sx; y = e.touches[0].clientY - sy; apply(); }
      if (e.touches.length === 2 && pinch) {
        const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
        scale = Math.max(0.5, Math.min(4, scale * (d / pinch)));
        pinch = d;
        apply();
      }
    }, { passive: false });
    zoomImg.addEventListener('touchend', () => { tdrag = false; pinch = 0; }, { passive: true });
  }

  function openZoom(src) {
    if (!src) return;
    if (!zoom) buildZoom();
    zoomImg.src = src;
    scale = 1;
    x = y = 0;
    apply();
    zoom.classList.add('is-open');
    document.documentElement.classList.add('cz-open');
    if (window.__lenis) window.__lenis.stop();
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeZoom(); });

  updateCount();
  setImage('');
})();

/* Фоновые видео: запуск, если браузер не стартовал автовоспроизведение */
(function () {
  'use strict';
  const videos = Array.from(document.querySelectorAll('video[autoplay]'));
  if (!videos.length) return;
  const play = () => videos.forEach((v) => {
    v.muted = true;
    if (v.paused) {
      const p = v.play();
      if (p && p.catch) p.catch(() => {});
    }
  });
  play();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) play(); });
  ['touchstart', 'click', 'scroll'].forEach((ev) => window.addEventListener(ev, play, { once: true, passive: true }));
})();
