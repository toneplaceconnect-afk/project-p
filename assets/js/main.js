/* Анимации и интерактив сайта */
(function () {
  'use strict';

  gsap.registerPlugin(ScrollTrigger);
  if (window.CustomEase) gsap.registerPlugin(CustomEase);
  gsap.config({ nullTargetWarn: false });

  const page = document.body.dataset.page;
  const isHome = page === 'index';
  const DESKTOP = '(min-width: 992px)';
  const MOBILE = '(max-width: 991px)';
  const mm = gsap.matchMedia();
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

  /* ---------- Высота вьюпорта и год ---------- */
  const setVh = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  setVh();
  window.addEventListener('resize', setVh);
  $$('.js-year').forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Разбивка текста ---------- */
  $$('[data-split]').forEach((el) => new SplitType(el, { types: 'words, chars', tagName: 'span' }));
  gsap.set('[data-chars] .char', { yPercent: 100 });
  gsap.set('[data-chars]', { autoAlpha: 1 });
  gsap.set('[data-fade-up]', { yPercent: 50, autoAlpha: 0 });

  /* ---------- Плавный скролл ---------- */
  const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.7, smoothWheel: true, gestureOrientation: 'vertical' });
  window.__lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  $$('a[href^="#"]').forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    if (!id) return;
    a.addEventListener('click', (e) => {
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: 0, duration: 2, easing: (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2) });
    });
  });

  /* ---------- Скрытие шапки при скролле вниз ---------- */
  const topbar = $('#topbar');
  let lastDir = 0;
  lenis.on('scroll', ({ direction, scroll }) => {
    if (!direction || direction === lastDir) return;
    lastDir = direction;
    if (direction > 0 && scroll > 10) gsap.to(topbar, { y: -112, duration: 0.4, ease: 'power2.out', overwrite: true });
    else gsap.to(topbar, { y: 0, duration: 0.3, ease: 'none', overwrite: true });
  });

  /* ---------- Якорь из адреса страницы ---------- */
  function scrollToHash() {
    const id = decodeURIComponent(location.hash.slice(1));
    const target = id && document.getElementById(id);
    if (!target) return;
    lenis.start();
    lenis.scrollTo(target, { offset: 0, duration: 1.4, easing: (x) => 1 - Math.pow(1 - x, 3) });
  }

  /* ---------- Лоадер ---------- */
  function homeLoader() {
    const num = $('.js-loader-num');
    let counter = { value: 0 };
    let duration = 3;
    try {
      if (sessionStorage.getItem('visited') !== null) {
        duration = 1;
        counter = { value: 75 };
      }
      sessionStorage.setItem('visited', 'true');
    } catch (e) { /* хранилище недоступно */ }

    if (!location.hash) window.scrollTo(0, 0);
    lenis.stop();
    const ease = !window.CustomEase ? 'power2.inOut' : CustomEase.create('loaderEase', 'M0,0,C0,0,0.13,0.34,0.238,0.442,0.305,0.506,0.322,0.514,0.396,0.54,0.478,0.568,0.468,0.56,0.522,0.584,0.572,0.606,0.61,0.719,0.714,0.826,0.798,0.912,1,1,1,1');
    gsap.to(counter, {
      value: 100,
      duration,
      ease,
      onUpdate: () => (num.textContent = Math.round(counter.value)),
      onComplete: () => {
        gsap.timeline({ onStart: homeHeader })
          .to('#loader', { '--clip': '0%', duration: 2, ease: 'expo.out' }, 0)
          .to('.loader__content', { y: -100, opacity: 0, duration: 0.5, ease: 'expo.inOut' }, '<')
          .set('#loader', { display: 'none' })
          .call(scrollToHash, null, '-=1.2');
      },
    });
  }

  function homeHeader() {
    const title = $('[data-title-fx]');
    const split = new SplitType(title, { types: 'lines' });
    gsap.timeline({ onStart: () => lenis.start() })
      .from(split.lines, { y: '100%', duration: 1, delay: 0.2, stagger: 0.1, ease: 'expo.out' }, 0)
      .from(title, { y: 150, duration: 2, delay: 0.2, ease: 'expo.out' }, 0)
      .from('[data-top-item]', { y: 50, autoAlpha: 0, duration: 2, stagger: { each: 0.1 }, ease: 'expo.out' }, '0+=25%')
      .from('[data-baseline-fx]', { y: 150, opacity: 0, duration: 3, ease: 'expo.out' }, '<+=10%');

    mm.add('(min-width: 991px)', () => {
      const media = $('.hero__media');
      gsap.to(media, { opacity: 0, scale: 1.3, scrollTrigger: { trigger: media, start: 'bottom bottom', end: 'bottom top', scrub: true } });
    });
  }

  function innerLoader() {
    const loader = $('#loader');
    if (!location.hash) window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
      gsap.set(loader, { autoAlpha: 1, yPercent: 0 });
      gsap.timeline({ onStart: innerHeader })
        .to(loader, { yPercent: -100, duration: 1.5, ease: 'expo.inOut' }, 0)
        .to(loader, { autoAlpha: 0, duration: 0.5, ease: 'expo.inOut' }, '+=1')
        .call(scrollToHash, null, 1);
    }, 500);
  }

  function innerHeader() {
    const tl = gsap.timeline();
    const scope = page === 'works' || page === 'calculator' || page === 'prices' ? '.works-head' : page === 'team' ? '#hero-team' : page === 'legal' || page === 'privacy' ? '.legal' : '.hero';
    tl.to(`${scope} [data-chars] .char`, { yPercent: 0, duration: 2, ease: 'power4.out', stagger: 0.03 }, 0)
      .from(`${scope} [data-chars]`, { y: 150, duration: 2, delay: 0.2, ease: 'expo.out' }, 0)
      .from('.topbar [data-top-item]', { y: 50, autoAlpha: 0, duration: 2, stagger: { each: 0.1 }, ease: 'expo.out' }, '0+=25%')
      .to(`${scope} [data-fade-up]`, { yPercent: 0, autoAlpha: 1, duration: page === 'works' || page === 'calculator' || page === 'prices' ? 2 : 3, stagger: { each: 0.1 }, ease: 'expo.out' }, '<+=10%');
    if ($('[data-baseline-fx]')) tl.from('[data-baseline-fx]', { y: 150, opacity: 0, duration: 3, ease: 'expo.out' }, '<');
  }

  /* ---------- Курсор ---------- */
  mm.add(`${DESKTOP} and (pointer: fine)`, () => {
    // Поведение как у референса: точка догоняет мышь (speed 0.6, expo.out), лёгкий «skew» по скорости,
    // состояния -pointer (ссылки и кнопки), -text (подпись в круге), -hidden, -active.
    const cursor = document.createElement('div');
    cursor.className = 'cursor -hidden';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML = '<div class="cursor__inner"><div class="cursor__text"></div></div>';
    document.body.appendChild(cursor);
    const inner = cursor.querySelector('.cursor__inner');
    const text = cursor.querySelector('.cursor__text');
    const SPEED = 0.6;
    const SKEWING = 0.1;
    const xTo = gsap.quickTo(cursor, 'x', { duration: SPEED, ease: 'expo.out' });
    const yTo = gsap.quickTo(cursor, 'y', { duration: SPEED, ease: 'expo.out' });
    let last = { x: 0, y: 0 };
    let visible = false;
    let hovered = null;
    let customStates = [];

    const onMove = (e) => {
      if (!visible) {
        visible = true;
        gsap.set(cursor, { x: e.clientX, y: e.clientY });
        cursor.classList.remove('-hidden');
      }
      xTo(e.clientX);
      yTo(e.clientY);
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      const dist = Math.min(Math.hypot(dx, dy) * SKEWING * 0.04, 0.25);
      gsap.to(inner, {
        rotate: (Math.atan2(dy, dx) * 180) / Math.PI,
        scaleX: 1 + dist,
        scaleY: 1 - dist,
        duration: SPEED,
        ease: 'expo.out',
        overwrite: 'auto',
      });
    };

    const clearStates = () => {
      cursor.classList.remove('-text', '-pointer', ...customStates);
      customStates = [];
      text.textContent = '';
    };
    const applyStates = (el) => {
      clearStates();
      if (!el) return;
      if (el.matches('a,button')) cursor.classList.add('-pointer');
      const label = el.closest('[data-cursor-text]');
      if (label && label.dataset.cursorText) {
        text.textContent = label.dataset.cursorText;
        cursor.classList.add('-text');
      }
      const stateEl = el.closest('[data-cursor]');
      if (stateEl) {
        customStates = stateEl.dataset.cursor.split(/\s+/).filter(Boolean);
        cursor.classList.add(...customStates);
      }
    };
    const onOver = (e) => {
      const el = e.target.closest('[data-cursor-text],[data-cursor],a,button');
      if (el === hovered) return;
      hovered = el;
      applyStates(el);
    };
    const onDown = () => cursor.classList.add('-active');
    const onUp = () => cursor.classList.remove('-active');
    const onLeave = () => {
      visible = false;
      cursor.classList.add('-hidden');
    };
    const onEnter = () => {
      if (visible) cursor.classList.remove('-hidden');
    };
    window.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);
    document.documentElement.addEventListener('mouseleave', onLeave);
    document.documentElement.addEventListener('mouseenter', onEnter);
    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      cursor.remove();
    };
  });

  /* ---------- Полноэкранное меню ---------- */
  (function overlayMenu() {
    const overlay = $('#overlay');
    if (!overlay) return;
    let isOpen = false;
    gsap.set(overlay, { y: '-101vh', display: 'flex' });
    const tl = gsap.timeline({ paused: true });
    mm.add('(min-width: 991px)', () => {
      tl.clear();
      gsap.set('.overlay [data-chars] .char', { yPercent: 100 });
      gsap.set('.overlay [data-fade-up]', { yPercent: 50, autoAlpha: 0 });
      tl.to(overlay, { duration: 1, ease: 'power4.out', y: 0, autoAlpha: 1 }, 0)
        .to('.overlay [data-chars] .char', { yPercent: 0, duration: 0.5, ease: 'power4.out', stagger: 0.01 }, '<+=20%')
        .to('.overlay [data-fade-up]', { autoAlpha: 1, yPercent: 0, duration: 0.5, ease: 'power4.out', stagger: 0.1 }, '<+=30%');
    });
    mm.add('(max-width: 990px)', () => {
      tl.clear();
      gsap.set('.overlay [data-chars] .char', { yPercent: 0 });
      gsap.set('.overlay [data-chars]', { autoAlpha: 1 });
      gsap.set('.overlay [data-fade-up]', { yPercent: 0, autoAlpha: 1 });
      tl.to(overlay, { duration: 1, ease: 'power4.out', y: 0, autoAlpha: 1 }, 0);
    });
    const openBtn = $('[data-open-menu]');
    const closeBtn = $('[data-close-menu]');
    const setState = (open) => {
      isOpen = open;
      [openBtn, closeBtn].forEach((b) => b.setAttribute('aria-expanded', String(open)));
      overlay.setAttribute('aria-hidden', String(!open));
      document.documentElement.classList.toggle('menu-open', open);
      if (open) { tl.timeScale(1).play(); lenis.stop(); } else { tl.timeScale(2).reverse(); lenis.start(); }
    };
    [openBtn, closeBtn].forEach((b) => b.addEventListener('click', () => setState(!isOpen)));
    $$('a[href^="#"]', overlay).forEach((a) => a.addEventListener('click', () => isOpen && setState(false)));
  })();

  /* ---------- Выпадающее меню «Проекты» ---------- */
  (function worksDropdown() {
    const dropdown = $('#dropdown-works');
    const triggers = $$('[data-open-dropdown]');
    if (!dropdown || !triggers.length) return;
    let isOpen = false;
    gsap.set(dropdown, { y: '-101vh', display: 'flex', autoAlpha: 0 });
    mm.add('(min-width: 991px)', () => {
      // Меню держится, пока курсор на ссылке «Каталог» или на самом меню,
      // и закрывается с небольшой задержкой — чтобы успеть перевести мышь на пункты.
      const CLOSE_DELAY = 260;
      let closeTimer;
      const open = () => {
        clearTimeout(closeTimer);
        if (isOpen) return;
        isOpen = true;
        triggers.forEach((t) => t.setAttribute('aria-expanded', 'true'));
        dropdown.setAttribute('aria-hidden', 'false');
        gsap.to(dropdown, { duration: 0.8, ease: 'power4.out', y: 0, autoAlpha: 1, overwrite: true });
      };
      const closeNow = () => {
        clearTimeout(closeTimer);
        if (!isOpen) return;
        isOpen = false;
        triggers.forEach((t) => t.setAttribute('aria-expanded', 'false'));
        dropdown.setAttribute('aria-hidden', 'true');
        gsap.to(dropdown, { duration: 0.6, ease: 'power4.in', y: '-101vh', autoAlpha: 0, overwrite: true });
      };
      const closeSoon = () => {
        clearTimeout(closeTimer);
        closeTimer = setTimeout(closeNow, CLOSE_DELAY);
      };
      const onKey = (e) => { if (e.key === 'Escape') closeNow(); };
      const listeners = [];
      const bind = (el, type, fn) => { el.addEventListener(type, fn); listeners.push(() => el.removeEventListener(type, fn)); };

      [...triggers, dropdown].forEach((el) => {
        bind(el, 'mouseenter', open);
        bind(el, 'mouseleave', closeSoon);
        bind(el, 'focusin', open);
      });
      // Клик по ссылке внутри меню закрывает его сразу
      $$('a', dropdown).forEach((a) => bind(a, 'click', closeNow));
      bind(document, 'keydown', onKey);
      bind(document.documentElement, 'mouseleave', closeSoon);
      lenis.on('scroll', closeSoon);

      return () => {
        clearTimeout(closeTimer);
        listeners.forEach((off) => off());
        lenis.off('scroll', closeSoon);
        closeNow();
      };
    });
  })();

  /* ---------- Параллакс изображений ---------- */
  $$('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { y: -150 }, { y: 150, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.5 } });
  });

  /* ---------- Бегущая строка в футере ---------- */
  $$('[data-marquee]').forEach((comp) => {
    const panels = $$('[data-marquee-panel]', comp);
    const tl = gsap.timeline({ repeat: -1, onReverseComplete: () => tl.progress(1) });
    const build = () => {
      tl.clear();
      tl.fromTo(panels, { xPercent: 0 }, { xPercent: -100, ease: 'none', duration: panels[0].offsetWidth / 100 });
    };
    build();
    let dir = 1;
    ScrollTrigger.create({
      trigger: 'body', start: 'top top', end: 'bottom bottom',
      onUpdate: (self) => {
        if (dir !== self.direction) { dir = self.direction; tl.timeScale(dir); }
      },
    });
    let resizeTimer;
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      if (window.innerWidth === lastWidth) return; // мобильная адресная строка меняет только высоту
      lastWidth = window.innerWidth;
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => { const p = tl.progress(); build(); tl.progress(p); }, 200);
    });
  });

  /* ---------- Бегущие строки партнёров ---------- */
  $$('[data-partners]').forEach((row) => {
    const rev = row.dataset.partners === 'rev';
    gsap.fromTo(row, { x: 0 }, { x: rev ? '124.1vw' : '-124.1vw', duration: 60, ease: 'none', repeat: -1 });
  });

  /* ---------- Колонки изображений ---------- */
  (function aboutColumns() {
    const section = $('.about');
    if (!section) return;
    const showcase = $('.sf') || $('.tsec');
    const columns = $('.about__columns', section);
    const intro = $('.about__intro', section);
    const images = $$('.about__img', section);
    const items = $$('.about__item', section);

    const distanceFromCenter = (el) => {
      const cx = el.offsetLeft + el.offsetWidth / 2;
      const cy = el.offsetTop + el.offsetHeight / 2;
      return Math.hypot(cx - window.innerWidth / 2, cy - window.innerHeight / 2);
    };
    const offsetFor = (el, maxMove = 600, maxDist = 5000) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + el.offsetWidth / 2;
      const cy = r.top + el.offsetHeight / 2;
      const vx = window.innerWidth / 2;
      const vy = window.innerHeight / 2;
      const amount = Math.max(maxMove - distanceFromCenter(el) * (maxMove / maxDist), 0);
      const angle = Math.atan2(Math.abs(vy - cy), Math.abs(vx - cx));
      const dx = Math.abs(Math.cos(angle) * amount);
      const dy = Math.abs(Math.sin(angle) * amount);
      return { x: cx < vx ? -dx : dx, y: cy < vy ? -dy : dy };
    };

    const startY = () => (isHome ? 0 : ($('.about-spacer').offsetTop - window.innerHeight));
    const endTrig = { trigger: showcase, start: () => startY(), end: 'top top', scrub: true };

    gsap.timeline({ scrollTrigger: { start: () => startY(), end: 'max', scrub: true } })
      .fromTo(section, { scale: 0.7 }, { scale: 1, ease: 'none' }, 0)
      .fromTo(images, { scale: 1 }, { scale: 1.4, ease: 'none' }, 0);
    gsap.fromTo(columns, { opacity: 0 }, { opacity: 1, ease: 'power4.inOut', yoyo: true, repeat: 1, scrollTrigger: endTrig });
    gsap.fromTo(intro, { opacity: 0 }, { opacity: 1, ease: 'power4.inOut', yoyo: true, repeat: 1, scrollTrigger: { ...endTrig } });
    gsap.to(items, { ease: 'none', x: (i, el) => offsetFor(el).x, y: (i, el) => offsetFor(el).y, scrollTrigger: { ...endTrig } });
  })();

  /* ---------- Слайдер проектов ---------- */
  if (window.Swiper) $$('[data-works-slider]').forEach((comp) => {
    const list = new Swiper($('.slist', comp), {
      slidesPerView: 1,
      speed: 500,
      loop: true,
      loopedSlides: 4,
      direction: 'vertical',
      allowTouchMove: false,
      navigation: { nextEl: $('.js-next', comp), prevEl: $('.js-prev', comp), disabledClass: 'is-disabled' },
      slideActiveClass: 'is-active',
      slideDuplicateActiveClass: 'is-active',
    });
    const photo = new Swiper($('.sphoto', comp), {
      slidesPerView: 1,
      speed: 500,
      loop: true,
      loopedSlides: 4,
      keyboard: true,
      effect: 'coverflow',
      grabCursor: true,
      centeredSlides: true,
      coverflowEffect: { rotate: 0, scale: 0.8, slideShadows: false },
    });
    list.controller.control = photo;
    photo.controller.control = list;
    $$('.slist__arrow', comp).forEach((a) => a.addEventListener('click', (e) => e.preventDefault()));
  });

  /* ---------- Аккордеон ---------- */
  (function accordion() {
    const items = $$('.acc__item');
    if (!items.length) return;
    let current = null;
    items.forEach((item) => {
      const title = $('.acc__title', item);
      let open = false;
      item.open = () => {
        if (open) return;
        open = true;
        if (current) current.close();
        current = item;
        item.setAttribute('aria-expanded', 'true');
        item.className = 'acc__item selected no-hover';
        gsap.to(item, { width: '100%', duration: 1, ease: 'power1.inOut', overwrite: true });
        gsap.to(title, { autoAlpha: 1, duration: 0.5, ease: 'power1.inOut', overwrite: true });
      };
      item.close = () => {
        if (!open) return;
        open = false;
        current = null;
        item.setAttribute('aria-expanded', 'false');
        item.className = 'acc__item can-hover';
        gsap.to(item, { width: '12.5rem', duration: 1, ease: 'power1.inOut', overwrite: true });
        gsap.to(title, { autoAlpha: 0, duration: 0.5, ease: 'power1.inOut', overwrite: true });
      };
      item.addEventListener('mouseenter', () => (open ? item.close() : item.open()));
    });
    mm.add(DESKTOP, () => items[0].open());
    mm.add(MOBILE, () => { items.forEach((i) => gsap.set(i, { clearProps: 'width' })); gsap.set($$('.acc__title'), { autoAlpha: 1 }); });
  })();

  /* ---------- Появление элементов списка ---------- */
  if ($('[data-list-item]')) {
    gsap.set('[data-list-item]', { y: 200 });
    ScrollTrigger.batch('[data-list-item]', {
      onEnter: (b) => gsap.to(b, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 1.5, ease: 'power3', overwrite: true }),
      onLeave: (b) => gsap.set(b, { autoAlpha: 0, y: -50, overwrite: true }),
      onEnterBack: (b) => gsap.to(b, { autoAlpha: 1, y: 0, stagger: 0.1, duration: 1.5, ease: 'power3', overwrite: true }),
      onLeaveBack: (b) => gsap.set(b, { autoAlpha: 0, y: 200, overwrite: true }),
    });
  }

  /* ---------- Фильтр и «Показать ещё» ---------- */
  (function worksFilter() {
    const list = $('.works__list');
    if (!list) return;
    const items = $$('.works__wrap', list);
    const boxes = $$('.wcheck input');
    const more = $('.js-load-more');
    const pagination = $('.works__pagination');
    let expanded = false;

    const apply = () => {
      const active = boxes.filter((b) => b.checked).map((b) => b.value);
      items.forEach((it, i) => {
        const matches = !active.length || active.includes(it.dataset.cat);
        it.classList.toggle('is-filtered', !matches);
        it.classList.toggle('is-hidden-more', !active.length && !expanded && i >= 10);
      });
      pagination.classList.toggle('is-done', expanded || active.length > 0);
      ScrollTrigger.refresh();
    };
    boxes.forEach((b) => b.addEventListener('change', apply));
    $('.js-reset').addEventListener('click', () => { boxes.forEach((b) => (b.checked = false)); apply(); });
    more.addEventListener('click', (e) => { e.preventDefault(); expanded = true; apply(); });

    const cat = new URLSearchParams(location.search).get('cat');
    if (cat) boxes.forEach((b) => (b.checked = b.value === cat));
    apply();
  })();

  /* ---------- Фон: шестерни из контурных линий (SVG) ---------- */
  // Главная и «Направления»: три шестерни в зацеплении появляются вместе с блоком [data-anime-one]
  // и уходят перед [data-anime-two]. «О нас» и «Экспертиза»: одна крупная шестерня справа.
  mm.add(DESKTOP, () => {
    const mode = document.body.dataset.gears;
    if (!mode) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const NS = 'http://www.w3.org/2000/svg';

    // Контур шестерни: зубья по окружности, ступица и облегчающие отверстия
    function gearPath(teeth, r, depth, holes) {
      const inner = r - depth;
      const step = (Math.PI * 2) / teeth;
      let d = '';
      for (let i = 0; i < teeth; i++) {
        const a = i * step;
        [[inner, a], [inner, a + step * 0.18], [r, a + step * 0.32], [r, a + step * 0.68], [inner, a + step * 0.82]].forEach(([rr, ang], k) => {
          d += (i === 0 && k === 0 ? 'M' : 'L') + (Math.cos(ang) * rr).toFixed(2) + ' ' + (Math.sin(ang) * rr).toFixed(2);
        });
      }
      d += 'Z';
      const circle = (cx, cy, cr) => `M${(cx + cr).toFixed(2)} ${cy.toFixed(2)}A${cr} ${cr} 0 1 0 ${(cx - cr).toFixed(2)} ${cy.toFixed(2)}A${cr} ${cr} 0 1 0 ${(cx + cr).toFixed(2)} ${cy.toFixed(2)}`;
      d += circle(0, 0, r * 0.16);
      for (let i = 0; i < holes; i++) {
        const ang = (i / holes) * Math.PI * 2;
        d += circle(Math.cos(ang) * inner * 0.55, Math.sin(ang) * inner * 0.55, inner * 0.2);
      }
      return d;
    }

    const specs = mode === 'wheels'
      ? [{ t: 28, r: 150, x: 0, y: 0, dir: 1, h: 6 }, { t: 16, r: 88, x: 228, y: -38, dir: -1, h: 5, ph: 6 }, { t: 10, r: 55, x: 195, y: 128, dir: 1, h: 0, ph: 11 }]
      : [{ t: 36, r: 210, x: 0, y: 0, dir: 1, h: 8 }];

    const wrap = document.createElement('div');
    wrap.className = `gears gears--${mode}`;
    wrap.setAttribute('aria-hidden', 'true');
    const stage = document.createElement('div');
    stage.className = 'gears__stage';
    wrap.appendChild(stage);
    const layers = [];
    ['back', 'front'].forEach((side) => {
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('viewBox', '-260 -260 620 520');
      svg.setAttribute('class', `gears__layer gears__layer--${side}`);
      const nodes = specs.map((g) => {
        const grp = document.createElementNS(NS, 'g');
        grp.setAttribute('transform', `translate(${g.x} ${g.y})`);
        const path = document.createElementNS(NS, 'path');
        path.setAttribute('d', gearPath(g.t, g.r, g.r * 0.14, g.h));
        path.setAttribute('fill-rule', 'evenodd');
        grp.appendChild(path);
        svg.appendChild(grp);
        return { path, g };
      });
      stage.appendChild(svg);
      layers.push(nodes);
    });
    $('.page-main').appendChild(wrap);

    const state = { opacity: 0, spin: 0 };
    if (mode === 'wheels' && $('[data-anime-one]')) {
      gsap.set(stage, { xPercent: -95, yPercent: 8, rotateY: 35, rotateX: 18 });
      gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '[data-anime-one]', start: 'top 90%', end: 'top 10%', scrub: 1 } })
        .to(stage, { xPercent: -30, yPercent: 4, rotateY: 22 }, 0)
        .to(state, { opacity: 0.32 }, 0);
      const endTrigger = $('[data-anime-two]');
      if (endTrigger) {
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: '[data-anime-one]', start: 'bottom 60%', endTrigger, end: 'top 70%', scrub: 1 } })
          .to(stage, { xPercent: -24, yPercent: -10, rotateY: 8, rotateX: 12 }, 0);
        gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: endTrigger, start: 'top 95%', end: 'top 45%', scrub: 1 } })
          .to(state, { opacity: 0 }, 0)
          .to(stage, { xPercent: -90, yPercent: -18 }, 0);
      }
    } else {
      gsap.set(stage, { xPercent: 42, yPercent: 0, rotateY: -35, rotateX: 14 });
      gsap.to(state, { opacity: 0.16, duration: 2, delay: 1.5 });
    }
    gsap.to(state, { spin: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 1 } });

    const mouse = { x: 0, y: 0 };
    const onMouse = (e) => { mouse.x = e.clientX / window.innerWidth - 0.5; mouse.y = e.clientY / window.innerHeight - 0.5; };
    window.addEventListener('mousemove', onMouse);
    const par = { x: 0, y: 0 };
    let time = 0;
    let shown = null;

    const tick = (t, dt) => {
      const visible = state.opacity > 0.002;
      if (visible !== shown) { shown = visible; wrap.style.visibility = visible ? 'visible' : 'hidden'; }
      if (!visible) return; // скрытые шестерни не пересчитываем
      wrap.style.opacity = state.opacity.toFixed(3);
      time += reduced ? 0 : dt / 1000;
      par.x += (mouse.x * 18 - par.x) * 0.05;
      par.y += (mouse.y * 18 - par.y) * 0.05;
      wrap.style.transform = `translate3d(${par.x.toFixed(1)}px, ${par.y.toFixed(1)}px, 0)`;
      layers.forEach((nodes) => nodes.forEach(({ path, g }) => {
        const angle = ((time * 8 + state.spin * 900) * g.dir * 28) / g.t + (g.ph || 0);
        path.setAttribute('transform', `rotate(${angle.toFixed(2)})`);
      }));
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.removeEventListener('mousemove', onMouse);
      wrap.remove();
    };
  });

  /* ---------- Старт ---------- */
  document.body.classList.remove('loading');
  window.__siteReady = true;
  if (isHome) homeLoader();
  else innerLoader();
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

/* Кнопка «Наверх»: появляется после первого экрана, прокручивает плавно */
(function () {
  'use strict';
  const btn = document.querySelector('[data-to-top]');
  if (!btn) return;
  let shown = false;
  const update = (y) => {
    const on = y > window.innerHeight * 0.8;
    if (on !== shown) {
      shown = on;
      btn.classList.toggle('is-visible', on);
    }
  };
  if (window.__lenis) window.__lenis.on('scroll', ({ scroll }) => update(scroll));
  window.addEventListener('scroll', () => update(window.scrollY), { passive: true });
  update(window.scrollY);
  btn.addEventListener('click', () => {
    if (window.__lenis) window.__lenis.scrollTo(0, { duration: 1.6, easing: (x) => 1 - Math.pow(1 - x, 4) });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
    btn.blur();
  });
})();
