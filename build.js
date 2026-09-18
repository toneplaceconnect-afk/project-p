// Сборка сайта: node build.js
// Все тексты, списки и фото берутся из content.json — его редактирует админка (admin.html).
const fs = require('fs');
const path = require('path');

const OUT = __dirname;
const c = JSON.parse(fs.readFileSync(path.join(OUT, 'content.json'), 'utf8'));
const S = c.site;
const P = c.pages;

/* ---------- Подстановка контактов в тексты ---------- */
// В любом тексте можно писать {phone}, {email}, {telegram}, {brand} — подставится ссылка
function t(text = '') {
  return String(text)
    .split('{phone}').join(`<a href="${S.phoneHref}">${S.phone}</a>`)
    .split('{email}').join(`<a href="mailto:${S.email}">${S.email}</a>`)
    .split('{telegram}').join(`<a href="${S.telegramUrl}" target="_blank" rel="noopener">${S.telegram}</a>`)
    .split('{brand}').join(S.brand);
}
const attr = (v = '') => String(v).replace(/"/g, '&quot;');
// Подпись к фото (alt): из media.alts, иначе из заголовка блока
const alt = (src, fallback = '') => attr((c.media.alts || {})[src] || strip(fallback));
const strip = (v = '') => String(v).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

/* ---------- Иконки и логотип ---------- */
const ICON_CHEVRON = `<svg viewBox="0 0 8 12" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.4"><polyline points="1.5,1 6.5,6 1.5,11"/></svg>`;
const ICON_ARROW = `<svg viewBox="0 0 20 20" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.4"><line x1="4" y1="16" x2="16" y2="4"/><polyline points="6,4 16,4 16,14"/></svg>`;
const WHEEL = `<svg class="wheel" viewBox="0 0 100 60" width="100%" height="100%" fill="none" stroke="currentColor"><g class="wheel__spin"><circle cx="50" cy="50" r="44" stroke-width="3" stroke-dasharray="6 5"/><circle cx="50" cy="50" r="34" stroke-width="1.5"/></g></svg>`;
// Логотип: буква π — число «пи»: геометрия, разметка, расчёт.
// Начертание с засечками — в тон заголовочному шрифту сайта: перекладина с крючками,
// тонкая левая ножка с завитком, толстая правая с раструбом.
const PI_GLYPH = (fill = 'currentColor') => `<g fill="${fill}">
<path d="M8.5 12.4h47v6.9h-47z"/>
<path d="M11.7 19.3h4.9l-1 4.3c-.2.85-.65 1.25-1.45 1.25s-1.25-.4-1.45-1.25z"/>
<path d="M47.4 19.3h4.9l-1 4.3c-.2.85-.65 1.25-1.45 1.25s-1.25-.4-1.45-1.25z"/>
<path d="M20.6 19.3h4.8c0 13.2-.25 22.4-.75 27.6-.5 5.1-1.5 8.4-3 9.7-1.05.9-2.15.95-3.05.25-.8-.6-.9-1.6-.2-2.3.7-.7 1.65-.7 2.35-.05.3.28.5.6.62.98.42-1.25.72-3.4.9-6.5.32-5.3.5-15.2.33-29.68z"/>
<path d="M39.8 19.3h7.6c0 13.4.22 22.7.68 27.9.42 4.6 1.25 7.4 2.52 8.4l-1.5 2.4c-2.2-1.4-3.65-4.35-4.42-8.85-.8-4.7-1.15-14.6-1.28-29.85z"/>
</g>`;


// Знак студии-разработчика: инициалы. Если в content.json задан файл логотипа — вместо знака ставится он
const CREDIT_MARK = `<svg viewBox="0 0 28 28" width="100%" height="100%" fill="none" aria-hidden="true"><rect x=".7" y=".7" width="26.6" height="26.6" rx="7" stroke="currentColor" stroke-width="1.3" opacity=".55"/><text x="14" y="19.6" text-anchor="middle" font-family="Source Serif 4,Georgia,serif" font-size="13.5" font-weight="600" fill="currentColor">ТС</text></svg>`;

// Рамка подогнана под саму букву, чтобы знак не выглядел мелким в шапке
const LOGO_SMALL = `<svg viewBox="4 8 56 54" width="100%" height="100%" fill="none" role="img" aria-hidden="true">${PI_GLYPH()}</svg>`;
const LOGO_BIG = `<svg viewBox="0 0 350 160" width="100%" height="100%" fill="none" role="img" aria-hidden="true"><g transform="translate(113 2) scale(1.95)">${PI_GLYPH()}</g><text x="175" y="150" text-anchor="middle" fill="currentColor" font-family="'Source Serif 4',Georgia,serif" font-size="38" font-weight="300" letter-spacing="-1">${S.brand.replace(/^([^-–—\s]+)/, '<tspan font-weight="700">$1</tspan>')}</text></svg>`;
// Фавикон — только буква, без анимации: значок вкладки анимацию не показывает
const FAVICON = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="12" fill="#181818"/><g transform="translate(32 34.5) scale(.95) translate(-32 -34.5)">${PI_GLYPH('#f6e8bf')}</g></svg>`)}">`;

/* ---------- Общие блоки ---------- */
function btn(label, href = '#', extra = '') {
  return `<a class="btn-link" href="${href}" data-cursor="-fusion"><div class="btn ${extra}"><div class="btn__list"><div class="btn__text">${label}</div><div class="btn__icon">${ICON_CHEVRON}</div></div></div></a>`;
}

function topbar(current) {
  return `
<nav class="topbar" id="topbar">
  <section class="topbar__wrap">
    <div class="topbar__inner">
      <div class="topbar__left">
        <a class="brand" href="index.html" aria-label="${attr(S.brand)} — на главную" title="${attr(S.brand)}" data-top-item data-cursor="-fusion">${LOGO_SMALL}</a>
        
      </div>
      <div class="topbar__right">
        <div class="nav-links"><div class="nav-links__inner">
          <a class="topbar__works" href="works.html" data-open-dropdown aria-controls="dropdown-works" data-cursor="-hidden"><p class="link-u" data-top-item>Каталог •</p></a>
          ${c.nav.map((n) => `<a class="link-u${current === n.href ? ' is-current' : ''}" href="${n.href}" data-top-item data-cursor="-hidden">${n.label}</a>`).join('\n          ')}
        </div></div>
        <div class="topbar__menu" data-top-item>
          ${btn(S.contactButton, '#contact')}
          <div class="hamburger-wrap" data-cursor="-fusion"><button class="hamburger" type="button" data-open-menu aria-label="Открыть меню" aria-expanded="false"><span></span></button></div>
        </div>
      </div>
    </div>
  </section>
</nav>`;
}

function overlay(current) {
  const links = [{ href: 'works.html', label: 'Каталог работ' }, ...c.nav];
  return `
<div class="overlay" id="overlay" aria-hidden="true">
  <section class="overlay__header">
    <div class="topbar__inner">
      <div class="topbar__left"><a class="brand brand--overlay" href="index.html" data-cursor="-fusion">${LOGO_SMALL}</a></div>
      <div class="topbar__right topbar__right--end">
        <div class="topbar__menu">
          ${btn(S.contactButton, '#contact', 'btn--dark')}
          <div class="hamburger-wrap" data-cursor="-fusion"><button class="hamburger is-active" type="button" data-close-menu aria-label="Закрыть меню"><span></span></button></div>
        </div>
      </div>
    </div>
  </section>
  <section class="overlay__content">
    <div class="overlay__grid">
      <div class="overlay__left">
        ${links.map((n) => `<a class="overlay__link${current === n.href ? ' is-current' : ''}" href="${n.href}" data-split data-chars data-cursor="-fusion">${n.label}</a>`).join('\n        ')}
      </div>
      <div class="overlay__right">
        <a class="ocard" href="${S.phoneHref}" data-fade-up data-cursor="-hidden"><h3 class="ocard__title">Телефон</h3><div class="ocard__txt">${S.phone}</div></a>
        <a class="ocard" href="mailto:${S.email}" data-fade-up data-cursor="-hidden"><h3 class="ocard__title">Email</h3><div class="ocard__txt">${S.email}</div></a>
        <a class="ocard" href="${S.telegramUrl}" target="_blank" rel="noopener" data-fade-up data-cursor="-hidden"><h3 class="ocard__title">Telegram</h3><div class="ocard__txt">${S.telegram}<br>${S.telegramNoteMenu}</div></a>
      </div>
    </div>
  </section>
  <section class="overlay__footer">
    <div class="overlay__fgrid">
      <div class="overlay__social" data-fade-up>
        <a class="link-u" href="${S.telegramUrl}" target="_blank" rel="noopener" data-cursor="-hidden">Telegram</a>
        <a class="link-u" href="${S.phoneHref}" data-cursor="-hidden">Позвонить</a>
        <a class="link-u" href="mailto:${S.email}" data-cursor="-hidden">Написать на почту</a>
      </div>
      <div class="overlay__copy-col" data-fade-up><div class="overlay__copy">© <span class="js-year">2026</span> ${S.brand}. ${S.menuNote}</div></div>
    </div>
  </section>
</div>`;
}

function worksMenu() {
  const d = c.dropdown;
  return `
<section class="wmenu" id="dropdown-works" aria-hidden="true">
  <div class="wmenu__wrap">
    <div class="wmenu__grid">
      <div class="wmenu__left">
        <h2 class="wmenu__title" data-cursor="-fusion">${d.title}</h2>
        <div class="wmenu__txt">${t(d.text)}</div>
        ${btn(d.button, 'works.html')}
      </div>
      <div class="wmenu__center">
        <h3 class="wmenu__h3">${d.categoriesTitle}</h3>
        <div class="wmenu__list">
          ${c.catalog.categories.map((k) => `<div class="wmenu__item"><a href="works.html?cat=${encodeURIComponent(k)}">${k}</a></div>`).join('\n          ')}
        </div>
      </div>
      <div class="wmenu__right">
        <h3 class="wmenu__h3">${d.lastTitle}</h3>
        <div class="lastp">
          <div class="lastp__left"><a class="clickable-parent" href="${d.lastProject.href}" data-cursor-text="Смотреть"><h4 class="lastp__title" data-cursor="-fusion">${d.lastProject.title}</h4></a></div>
          <div class="lastp__img-wrap"><img class="lastp__img" src="${d.lastProject.photo}" alt="${alt(d.lastProject.photo, d.lastProject.title)}"></div>
        </div>
      </div>
    </div>
  </div>
</section>`;
}

// Подпись разработчика в подвале: знак студии и её название
function credit() {
  const cr = S.credit;
  if (!cr || !cr.name) return '';
  const mark = cr.logo
    ? `<img class="fcredit__logo" src="${cr.logo}" alt="${attr(cr.name)}">`
    : `<span class="fcredit__mark">${CREDIT_MARK}</span>`;
  const inner = `${mark}<span class="fcredit__txt">${cr.prefix} «<strong>${cr.name}</strong>»</span>`;
  return cr.url
    ? `<a class="fcredit" href="${cr.url}" target="_blank" rel="noopener" data-cursor="-hidden">${inner}</a>`
    : `<div class="fcredit">${inner}</div>`;
}

function footer() {
  return `
<div class="footer">
  <section class="footer__main">
    <div class="marquee" data-marquee data-cursor="-fusion-big">
      <div class="marquee__wrap">
        <div class="marquee__panel" data-marquee-panel><div class="marquee__text">${S.marquee}</div></div>
        <div class="marquee__panel" data-marquee-panel><div class="marquee__text">${S.marquee}</div></div>
      </div>
    </div>
    <div class="footer__contact" id="contact">
      <div class="footer__grid">
        <div class="footer__content">
          <a class="fcard" href="${S.phoneHref}" data-cursor="-fusion"><h3 class="fcard__title">Телефон</h3><div class="fcard__value">${S.phone}</div></a>
          <a class="fcard" href="mailto:${S.email}" data-cursor="-fusion"><h3 class="fcard__title">Email</h3><div class="fcard__value">${S.email}</div></a>
          <div class="footer__address">
            <a class="fcard" href="${S.telegramUrl}" target="_blank" rel="noopener" data-cursor="-fusion"><h3 class="fcard__title">Telegram</h3><div class="fcard__value fcard__value--lh">${S.telegram}<br>${S.telegramNote}</div></a>
            <div class="labels">
              ${S.chips.map((chip) => `<div class="labels__chip">${chip}</div>`).join('\n              ')}
            </div>
          </div>
        </div>
      </div>
      <div class="footer__logo-wrap"><a href="index.html" aria-label="${attr(S.brand)}"><div class="footer__logo" data-cursor="-fusion">${LOGO_BIG}</div></a></div>
      <div class="footer__mentions">
        <div class="footer__copy">© <span class="js-year">2026</span> ${S.brand}. ${S.footerNote}</div>
        ${credit()}
        <div class="footer__legal">
          <a class="link-u" href="legal.html">${P.legal.title}</a>
          <a class="link-u" href="privacy.html">${P.privacy.title}</a>
        </div>
      </div>
    </div>
  </section>
</div>`;
}

function loader(isHome) {
  if (isHome) {
    return `
<div class="loader loader--home" id="loader">
  <div class="loader__content">
    <div class="loader__wheel">${WHEEL}</div>
    <div class="loader__txt">
      <div class="loader__left"><div class="loader__word">${S.loaderWord}</div></div>
      <div><div class="loader__num"><span class="js-loader-num">0</span>%</div></div>
    </div>
  </div>
  <video class="loader__bg" src="${c.media.heroVideo}" poster="${c.media.heroPoster}" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>
</div>`;
  }
  return `<div class="loader loader--inner" id="loader"></div>`;
}

/* ---------- Секции, повторяющиеся на нескольких страницах ---------- */
function worksSlider({ transparent = false, anime = false, offset = 0 } = {}) {
  const sl = c.slider;
  const items = sl.slides.map((_, i) => sl.slides[(i + offset) % sl.slides.length]);
  return `
<section class="sf${transparent ? ' sf--transparent' : ''}"${anime ? ' data-anime-one' : ''}>
  <div class="container">
    <div class="sf__comp" data-works-slider>
      <div class="sf__list">
        <div class="sec-head">
          <div class="sec-head__sur">${sl.sur}</div>
          <h2 class="sec-head__title">${sl.title}</h2>
        </div>
        <div class="sf__body">
          <div class="swiper slist">
            <div class="swiper-wrapper">
              ${items.map((w) => `<div class="swiper-slide slist__slide" data-cursor="-fusion">
                <div class="slist__cats"><div class="slist__cat">${w.cat}</div></div>
                <a class="slist__title-link clickable-parent" href="${w.href || 'works.html'}"><h3 class="slist__title">${w.title}</h3></a>
                <div class="slist__intro">${w.intro}</div>
              </div>`).join('\n              ')}
            </div>
          </div>
          <div class="slist__bottom"><div class="slist__arrows">
            <a class="slist__arrow js-prev" href="#" data-cursor="-fusion" aria-label="Назад">←</a>
            <a class="slist__arrow js-next" href="#" data-cursor="-fusion" aria-label="Вперёд">→</a>
          </div></div>
        </div>
        <div class="sf__footer">${btn(sl.button, 'works.html')}</div>
      </div>
      <div class="sf__photo">
        <div class="sphoto__overflow"><div>
          <div class="swiper sphoto">
            <div class="swiper-wrapper">
              ${items.map((w) => `<div class="swiper-slide">
                <div class="sphoto__card">
                  <a class="sphoto__link" href="${w.href || 'works.html'}" data-cursor="-hidden"><div class="sphoto__btn"><div class="sphoto__btn-txt">${sl.linkText}</div><div class="sphoto__icon">${ICON_ARROW}</div></div></a>
                  <img class="sphoto__img" src="${w.photo}" alt="${attr(w.title)}" data-cursor-text="Листай">
                </div>
              </div>`).join('\n              ')}
            </div>
          </div>
        </div></div>
      </div>
    </div>
  </div>
</section>`;
}

// Блок «Направления работ»
function directionsBlock({ variant = '', photo } = {}) {
  const d = c.directions;
  const src = photo || d.photo || c.catalog.items[1].photo;
  return `
<section class="team${variant ? ' team--' + variant : ''}">
  <div class="container team__inner">
    <div class="sec-head">
      <div class="sec-head__sur">${d.sur}</div>
      <h2 class="sec-head__title">${d.title}</h2>
    </div>
    <div class="team__grid">
      <div class="team__left"><a class="team__img-wrap" href="team.html" data-cursor-text="Открыть"><img class="team__img" src="${src}" alt="${alt(src, d.sur)}"></a></div>
      <div class="team__right"><div class="team__right-wrap team__right-wrap--dirs">
        <div class="team__txt">${t(d.text)}</div>
        <ul class="dirs">
          ${d.items.map((i) => `<li class="dirs__item"><div class="dirs__title">${i.title}</div><div class="dirs__text">${i.text}</div></li>`).join('\n          ')}
        </ul>
        ${btn(d.button, '#contact')}
      </div></div>
    </div>
  </div>
</section>`;
}

// Блок «Создай своё»: описание + фото → визуализация через /api/generate-sketch
function createBlock({ anime = false } = {}) {
  const cr = c.create;
  return `
<section class="create" id="create"${anime ? ' data-anime-two' : ''}>
  <div class="container create__inner">
    <div class="create__grid">
      <div class="create__left">
        <div class="sec-head">
          <div class="sec-head__sur">${cr.sur}</div>
          <h2 class="sec-head__title">${cr.title}</h2>
        </div>
        <p class="create__lead">${t(cr.lead)}</p>
        <ol class="create__steps">
          ${cr.steps.map((s, i) => `<li class="create__step"><span class="create__step-num">${String(i + 1).padStart(2, '0')}</span><div><div class="create__step-title">${s.title}</div><div class="create__step-text">${s.text}</div></div></li>`).join('\n          ')}
        </ol>
      </div>
      <div class="create__right">
        <form class="cform" data-create data-email="${attr(S.email)}" data-tg="${attr(S.telegramUrl)}" data-brand="${attr(S.brand)}" novalidate>
          <div class="cform__head">
            <label class="cform__label" for="create-description">${cr.fieldLabel}</label>
            <div class="cform__count"><span data-create-count>0</span> / 3000</div>
          </div>
          <textarea class="cform__textarea" id="create-description" name="description" maxlength="3000" data-lenis-prevent data-cursor="-hidden"
            placeholder="${attr(cr.placeholder)}"></textarea>
          <div class="cform__examples">
            <span class="cform__examples-label">Примеры:</span>
            ${cr.examples.map((e) => `<button class="cform__chip" type="button" data-example="${attr(e.text)}" data-cursor="-fusion">${e.title}</button>`).join('\n            ')}
          </div>
          <div class="cform__submit-row">
            <button class="btn btn--solid cform__submit" type="submit" data-create-submit data-cursor="-fusion">
              <span class="btn__list"><span class="btn__text" data-create-submit-text>${cr.submit}</span><span class="btn__icon">${ICON_CHEVRON}</span></span>
            </button>
            <div class="cform__status" role="status" aria-live="polite" data-create-status></div>
          </div>
          <div class="cform__result" data-create-result>
            <div class="cform__placeholder">
              <div class="cform__placeholder-wheel">${WHEEL}</div>
              <div>${cr.resultPlaceholder}</div>
            </div>
          </div>
          <div class="cform__actions">
            <button class="cform__action" type="button" data-create-act="download" data-cursor="-fusion" disabled>↓ Скачать</button>
            <button class="cform__action" type="button" data-create-act="zoom" data-cursor="-fusion" disabled>⌕ Увеличить</button>
            <button class="cform__action cform__action--accent" type="button" data-create-act="tg" data-cursor="-fusion">↗ Отправить в Telegram</button>
            <button class="cform__action" type="button" data-create-act="mail" data-cursor="-fusion">✉ На почту</button>
          </div>
          <p class="cform__note">${t(cr.note)}</p>
        </form>
      </div>
    </div>
  </div>
</section>`;
}

function aboutColumns(introHtml) {
  const col = (list) => `<div class="about__col"><div class="about__column">${list.map((src) => `<div class="about__item"><img class="about__img" src="${src}" alt=""></div>`).join('')}</div></div>`;
  return `
<div class="about">
  <div class="about__intro">
    <div class="about__wheel">${WHEEL}</div>
    <h2 class="about__intro-txt">${introHtml}</h2>
  </div>
  <div class="about__columns">${c.aboutColumns.map(col).join('')}</div>
</div>`;
}

const processList = (sep = '<br>') => c.process.map((s, i) => `${i + 1}. ${s}`).join(sep);

/* ---------- Страницы ---------- */
const pages = {};

pages['index.html'] = {
  title: P.index.title,
  description: P.index.description,
  home: true,
  gears: 'wheels',
  body: `
<section class="hero hero--home" id="hero">
  <video class="hero__media" src="${c.media.heroVideo}" poster="${c.media.heroPoster}" autoplay muted loop playsinline preload="auto" aria-hidden="true"></video>
  <div class="hero__inner">
    <div class="hero__text">
      <h1 class="hero__title" data-title-fx data-cursor="-fusion-big">${P.index.heroTitle}</h1>
      <div class="hero__bottom">
        <div class="hero__baseline" data-baseline-fx>${t(P.index.heroBaseline)}</div>
        <a class="scroll-down" href="#first-section" data-cursor="-fusion-big" aria-label="${attr(strip(P.index.scrollHint).replace(/\s+/g, ' '))}"><p>${P.index.scrollHint}</p><span class="scroll-down__line" aria-hidden="true"></span></a>
      </div>
    </div>
  </div>
</section>
<section class="about-spacer" id="first-section"></section>
${aboutColumns(P.index.aboutIntro)}
${worksSlider({ transparent: true, anime: true })}
${directionsBlock({ variant: 'transparent' })}
${createBlock({ anime: true })}`,
};

pages['works.html'] = {
  title: P.works.title,
  description: P.works.description,
  body: `
<section class="works-head">
  <div class="container works-head__inner">
    <div class="sec-head works-head__head">
      <div class="works-head__text">
        <h1 class="page-title" data-split data-chars data-cursor="-fusion">${P.works.h1}</h1>
        <p class="works-head__lead" data-fade-up>${t(P.works.lead)}</p>
      </div>
      <form class="wfilter" onsubmit="return false">
        <div class="wfilter__wrap">
          ${c.catalog.categories.map((k) => `<label class="wcheck" data-fade-up data-cursor="-hidden"><input type="checkbox" value="${attr(k)}"><span class="wcheck__label">${k}</span><div class="wcheck__mark"></div></label>`).join('\n          ')}
        </div>
        <div class="btn btn--reset js-reset" data-fade-up data-cursor="-fusion"><div class="btn__list"><div class="btn__text">${P.works.resetFilter}</div><div class="btn__icon">${ICON_CHEVRON}</div></div></div>
      </form>
    </div>
  </div>
</section>
<section class="works">
  <div class="works__contain">
    <div class="works__list">
      ${c.catalog.items.map((w, i) => {
        const more = c.catalog.galleryPool.filter((p) => p !== w.photo);
        const pick = w.gallery && w.gallery.length ? w.gallery : [0, 1, 2, 3, 4].map((k) => more[(i * 2 + k) % more.length]);
        const href = w.href || '#contact';
        return `<div class="works__wrap${i >= (P.works.visibleCount || 10) ? ' is-hidden-more' : ''}" data-cat="${attr(w.cat)}">
        <div class="works__item">
          <div class="works__txt"><a class="works__link clickable-parent" href="${href}" data-cursor-text="${href.startsWith('#') ? 'Заказать' : 'Смотреть'}"><h2 class="works__title">${w.title}</h2><div class="works__desc">${w.text}</div></a></div>
          <div class="works__gallery">
            <div class="works__ci works__ci--featured"><img class="works__img" src="${w.photo}" alt="${attr(w.title)}"></div>
            <div class="works__more">${pick.filter(Boolean).map((p) => `<div class="works__ci"><img class="works__img" src="${p}" alt="" loading="lazy"></div>`).join('')}</div>
          </div>
        </div>
      </div>`;
      }).join('\n      ')}
    </div>
    <div class="works__pagination"><a class="load-more js-load-more" href="#" data-cursor="-fusion"><div class="load-more__txt">${P.works.loadMore}</div></a></div>
  </div>
</section>
${directionsBlock()}
${createBlock()}`,
};

pages['work.html'] = {
  title: P.work.title,
  description: P.work.description,
  body: `
<section class="hero hero--work" id="hero">
  <img class="hero__media hero__media--dim" src="${P.work.heroPhoto}" alt="">
  <div class="hero__inner hero__inner--work">
    <div class="whero">
      <div class="whero__left">
        <h1 class="page-title" data-split data-chars data-cursor="-fusion-big">${P.work.h1}</h1>
        <p class="whero__baseline" data-baseline-fx>${t(P.work.baseline)}</p>
      </div>
      <div class="whero__right">
        <div class="hero-filet"></div>
        <div class="whero__cats">${P.work.tags.map((tag) => `<div class="whero__cat">${tag}</div>`).join('')}</div>
      </div>
      <div class="whero__footer">
        <div class="hero-filet"></div>
        <a class="whero__down" href="#first-section" data-cursor="-fusion-big"><p>${P.work.scrollHint}</p></a>
      </div>
    </div>
  </div>
</section>
<section class="gallery" id="first-section">
  <div class="container">
    <div class="gallery__grid">
      <div class="gallery__content">
        <div class="gallery__txt">
          <h3>${P.work.introTitle}</h3>
          <p>${t(P.work.introText)}</p>
          <p><strong>${P.work.processTitle}</strong><br>${processList()}</p>
          <p>${t(P.work.outroText)}</p>
        </div>
      </div>
      <div class="gallery__list">
        ${P.work.gallery.map((src) => `<div class="gallery__item"><img src="${src}" alt="" loading="lazy"></div>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>
${worksSlider({ transparent: true, anime: true, offset: 1 })}`,
};

pages['about.html'] = {
  title: P.about.title,
  description: P.about.description,
  gears: 'object',
  body: `
<section class="hero hero--about">
  <div class="container ahero">
    <div class="ahero__grid">
      <div class="ahero__left">
        <h1 class="page-title" data-split data-chars>${P.about.h1}</h1>
        <div class="ahero__intro" data-fade-up>${t(P.about.intro)}</div>
      </div>
      <div class="ahero__right">
        <div class="ahero__baseline" data-fade-up>${P.about.baseline}</div>
      </div>
    </div>
  </div>
</section>
<section class="asec">
  <div class="container">
    <div class="asec__grid">
      <div class="asec__col-img"><div class="asec__img-wrap" data-parallax><img class="asec__img" src="${P.about.block1.photo}" alt="${alt(P.about.block1.photo, P.about.block1.title)}"></div></div>
      <div class="asec__col-txt">
        <h2 class="asec__title">${P.about.block1.title}</h2>
        <p class="asec__text">${t(P.about.block1.text)}<br><br>${c.directions.items.map((d) => `→ <strong>${d.title}</strong>: ${d.text}`).join('<br><br>')}<br><br>${P.about.block1.extra}</p>
        ${btn(P.about.block1.button, P.about.block1.buttonHref)}
      </div>
    </div>
    <img class="asec__svg" src="assets/img/line-art.svg" alt="">
  </div>
</section>
<section class="asec">
  <div class="container">
    <div class="asec__grid">
      <div class="asec__col-txt">
        <h2 class="asec__title">${P.about.block2.title}</h2>
        <p class="asec__text">${t(P.about.block2.text)}</p>
        <div><ul class="ptypes">
          ${P.about.block2.list.map((x) => `<li class="ptypes__item"><div class="ptypes__txt">${x}</div></li>`).join('\n          ')}
        </ul></div>
        ${btn(P.about.block2.button, P.about.block2.buttonHref)}
      </div>
      <div class="asec__col-img asec__col-img--right"><div class="asec__img-wrap" data-parallax><img class="asec__img" src="${P.about.block2.photo}" alt="${alt(P.about.block2.photo, P.about.block2.title)}"></div></div>
    </div>
    <img class="asec__svg" src="assets/img/line-art.svg" alt="">
  </div>
</section>
${directionsBlock({ variant: 'transparent', photo: P.about.directionsPhoto })}
<section class="partners">
  <div class="container"><div class="sec-head__sur">${P.about.normsTitle}</div></div>
  <div>
    ${P.about.normsRows.map((row, r) => `<div class="partners__row${r === 1 ? ' partners__row--rev' : ''}"><div class="partners__inner" data-partners="${r === 1 ? 'rev' : 'fwd'}">
      ${[0, 1].map(() => `<p class="partners__txt">${row.map((k) => `<span>${k}</span>`).join('')}</p>`).join('')}
    </div></div>`).join('\n    ')}
  </div>
</section>`,
};

pages['team.html'] = {
  title: P.team.title,
  description: P.team.description,
  gears: 'wheels',
  body: `
<div class="thero" id="hero-team">
  <h1 class="thero__title" data-split data-chars data-cursor="-fusion-big">${P.team.h1}</h1>
  <div class="thero__img-wrap" data-parallax><img class="thero__img" src="${P.team.heroPhoto}" alt="${alt(P.team.heroPhoto, P.team.title)}"></div>
</div>
<section class="story" data-anime-one>
  <div class="container story__inner">
    <div class="sec-head">
      <h2 class="sec-head__sur story__sur">${P.team.storySur}</h2>
      <div class="story__title" data-cursor="-fusion">${P.team.storyTitle}</div>
    </div>
    <div class="story__grid">
      <div class="story__col-left">
        ${(P.team.storyPhotos || []).map((src) => `<div class="story__img-wrap"><img class="story__img" src="${src}" alt="${alt(src, P.team.storySur)}"></div>`).join('\n        ')}
      </div>
      <div class="story__col-right">
        <p class="story__text">${t(P.team.storyText)}<br><br>${c.directions.items.map((d) => `<strong>${d.title}.</strong> ${d.text}`).join('<br><br>')}<br><br>${P.team.storyExtra}</p>
        <div class="story__person">
          <h3 class="story__inter" data-cursor="-fusion">${P.team.processTitle}</h3>
          <p class="story__text">${processList()}<br><br>${t(P.team.processNote)}</p>
        </div>
      </div>
    </div>
  </div>
</section>
<div class="about-spacer" data-anime-two></div>
${aboutColumns(P.team.columnsIntro)}
<section class="tsec">
  <div class="container tsec__inner">
    <div class="sec-head">
      <h2 class="sec-head__sur story__sur">${P.team.loftSur}</h2>
      <div class="story__title">${P.team.loftTitle}</div>
    </div>
    <div class="tsec__grid">
      <div class="tsec__col-img"><div class="tsec__img-wrap"><img class="tsec__img" src="${P.team.loftPhoto}" alt="${alt(P.team.loftPhoto, P.team.loftSur)}"></div></div>
      <div class="tsec__col">
        <p class="story__text">${t(P.team.loftText)}</p>
        <div class="tsec__footer">${btn(P.team.loftButton, 'works.html')}</div>
      </div>
    </div>
  </div>
</section>
${worksSlider({ transparent: true, anime: false })}`,
};

pages['expertise.html'] = {
  title: P.expertise.title,
  description: P.expertise.description,
  gears: 'object',
  body: `
<section class="hero hero--transparent">
  <div class="container ehero">
    <div class="ehero__title">
      <div class="ehero__title-in">
        <h1 class="page-title" data-split data-chars data-cursor="-fusion-big">${P.expertise.h1}</h1>
        <div class="ehero__intro" data-fade-up>${t(P.expertise.intro)}</div>
      </div>
    </div>
  </div>
</section>
<section class="elist">
  <div class="container">
    ${P.expertise.items.map((item, i) => `<div class="elist__item" data-list-item>
      <div class="elist__left"><div class="elist__left-wrap">
        <h2 class="elist__title" data-cursor="-fusion-big">${item.title}</h2>
        <p class="elist__num">${String(i + 1).padStart(2, '0')}</p>
      </div></div>
      <div class="elist__right"><p class="elist__txt"><strong>${item.lead}</strong> ${t(item.text)}</p></div>
    </div>`).join('\n    ')}
  </div>
</section>
<section class="moyens">
  <div class="container moyens__inner">
    <h2 data-cursor="-fusion">${P.expertise.calcTitle}</h2>
    <div class="moyens__grid">
      <div class="moyens__left"><h2 class="moyens__baseline">${P.expertise.calcBaseline}</h2></div>
      <div class="moyens__right"><div class="moyens__intro">${t(P.expertise.calcText)}</div><div class="moyens__cta">${btn(P.expertise.calcButton, 'calculator.html')}</div></div>
    </div>
  </div>
</section>
<ul class="acc" data-cursor="-fusion">
  ${P.expertise.accordion.map((a, i) => `<li class="acc__item${i === 0 ? ' selected' : ''}">
    <h3 class="acc__title">${a.title}</h3>
    <div class="acc__img-wrap"><img class="acc__img" src="${a.photo}" alt="${attr(a.title)}"></div>
  </li>`).join('\n  ')}
</ul>
${directionsBlock({ photo: P.expertise.directionsPhoto })}`,
};

pages['calculator.html'] = {
  title: P.calculator.title,
  description: P.calculator.description,
  scripts: ['assets/js/calc-formulas.js', 'assets/js/calc.js'],
  body: `
<section class="works-head calc-head">
  <div class="container works-head__inner">
    <div class="sec-head works-head__head">
      <div class="works-head__text">
        <h1 class="page-title" data-split data-chars data-cursor="-fusion">${P.calculator.h1}</h1>
        <p class="works-head__lead" data-fade-up>${t(P.calculator.lead)}</p>
      </div>
    </div>
  </div>
</section>
<section class="calc" data-calc data-tg="${attr(S.telegramUrl)}" data-email="${attr(S.email)}" data-brand="${attr(S.brand)}">
  <div class="container">
    <div class="calc__tabs" role="tablist" aria-label="Задача" data-calc-tabs></div>
    <div class="calc__grid">
      <div class="calc__params">
        <div class="sec-head__sur">${P.calculator.paramsTitle}</div>
        <h2 class="calc__title" data-calc-title></h2>
        <div class="calc__fields" data-calc-fields></div>
        <p class="calc__note" data-calc-note></p>
      </div>
      <div class="calc__sheet">
        <div class="calc__sheet-inner">
          <div class="calc__sheet-head">
            <div class="sec-head__sur">${P.calculator.sheetTitle}</div>
            <div class="calc__summary" data-calc-summary></div>
          </div>
          <div class="calc__rows" data-calc-rows></div>
          <div class="calc__extras-head">
            <div class="calc__extras-title">${P.calculator.extrasTitle}</div>
            <div class="calc__extras-text">${P.calculator.extrasText}</div>
          </div>
          <div class="calc__rows calc__rows--extras" data-calc-extras></div>
          <p class="calc__bottom">${t(P.calculator.bottomText)}</p>
          <div class="calc__actions">
            <button class="btn btn--solid calc__send" type="button" data-calc-act="tg" data-cursor="-fusion"><span class="btn__list"><span class="btn__text">${P.calculator.sendButton}</span><span class="btn__icon">${ICON_CHEVRON}</span></span></button>
            <button class="cform__action" type="button" data-calc-act="copy" data-cursor="-fusion">Скопировать</button>
            <button class="cform__action" type="button" data-calc-act="mail" data-cursor="-fusion">✉ На почту</button>
            <button class="cform__action" type="button" data-calc-act="print" data-cursor="-fusion">Распечатать</button>
          </div>
          <div class="calc__status" role="status" aria-live="polite" data-calc-status>${P.calculator.statusHint}</div>
        </div>
      </div>
    </div>
  </div>
</section>
<section class="calc-norms">
  <div class="container calc-norms__inner">
    <div class="sec-head">
      <div class="sec-head__sur">${P.calculator.normsSur}</div>
      <h2 class="sec-head__title">${P.calculator.normsTitle}</h2>
    </div>
    <ol class="calc-norms__list">
      ${P.calculator.norms.map((n, i) => `<li class="calc-norms__item"><span class="calc-norms__num">${String(i + 1).padStart(2, '0')}</span><span>${n}</span></li>`).join('')}
    </ol>
    <div>${btn(P.calculator.normsButton, 'expertise.html')}</div>
  </div>
</section>
${directionsBlock({ photo: P.calculator.directionsPhoto })}
${worksSlider()}`,
};

pages['prices.html'] = {
  title: P.prices.title,
  description: P.prices.description,
  body: `
<section class="works-head prices-head">
  <div class="container works-head__inner">
    <div class="sec-head works-head__head">
      <div class="works-head__text">
        <h1 class="page-title" data-split data-chars data-cursor="-fusion">${P.prices.h1}</h1>
        <p class="works-head__lead" data-fade-up>${t(P.prices.lead)}</p>
      </div>
    </div>
  </div>
</section>
<section class="prices">
  <div class="container">
    <div class="prices__grid">
      <div class="prices__table" role="table" aria-label="Стоимость работ">
        <div class="prices__row prices__row--head" role="row">
          <div role="columnheader">${P.prices.headWork}</div>
          <div role="columnheader">${P.prices.headPrice}</div>
        </div>
        ${P.prices.rows.map((r) => `<div class="prices__row" role="row">
          <div class="prices__work" role="cell">${r.work}${r.task ? `<a class="prices__calc" href="calculator.html?task=${r.task}" data-cursor="-fusion">${P.prices.calcLink}</a>` : ''}</div>
          <div class="prices__value" role="cell">${r.price || P.prices.defaultPrice}</div>
        </div>`).join('')}
        ${P.prices.special.map((r) => `<div class="prices__row prices__row--special" role="row">
          <div class="prices__work" role="cell">${r.work}</div>
          <div class="prices__value" role="cell">${r.price}</div>
        </div>`).join('')}
      </div>
      <aside class="prices__cta">
        <div class="sec-head__sur">${P.prices.ctaSur}</div>
        <h2 class="prices__cta-title">${P.prices.ctaTitle}</h2>
        <p class="prices__cta-text">${t(P.prices.ctaText)}</p>
        <div class="prices__cta-actions">
          ${btn(P.prices.ctaButton1, 'calculator.html', 'btn--solid')}
          ${btn(P.prices.ctaButton2, '#contact')}
        </div>
        <ul class="prices__facts">
          ${P.prices.facts.map((f) => `<li>${f}</li>`).join('\n          ')}
        </ul>
      </aside>
    </div>
  </div>
</section>
${directionsBlock({ photo: P.prices.directionsPhoto })}
${createBlock()}`,
};

function legalPage(page) {
  return `
<section class="legal">
  <div class="container legal__inner">
    <h1 class="legal__title">${page.title}</h1>
    <div class="legal__content">
      ${page.blocks.map((b) => `<div class="legal__bloc"><h2 class="legal__bloc-title">${b.title}</h2><p class="legal__text">${t(b.text)}</p></div>`).join('\n      ')}
    </div>
  </div>
</section>`;
}

pages['legal.html'] = { title: P.legal.title, description: P.legal.description, body: legalPage(P.legal) };
pages['privacy.html'] = { title: P.privacy.title, description: P.privacy.description, body: legalPage(P.privacy) };

/* ---------- Сборка ---------- */
const IMG = path.join(OUT, 'assets/img');
fs.mkdirSync(IMG, { recursive: true });
fs.writeFileSync(path.join(IMG, 'line-art.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="450" viewBox="0 0 450 450" fill="none" stroke="rgba(246,232,191,0.25)" stroke-width="1"><circle cx="225" cy="225" r="200"/><circle cx="225" cy="225" r="150" stroke-dasharray="4 6"/><line x1="25" y1="225" x2="425" y2="225"/><line x1="225" y1="25" x2="225" y2="425"/><rect x="120" y="120" width="210" height="210" transform="rotate(45 225 225)"/></svg>`);

// Размеры JPEG из заголовка файла — чтобы браузер резервировал место и страница не «прыгала» при загрузке
const sizeCache = new Map();
function imageSize(src) {
  if (sizeCache.has(src)) return sizeCache.get(src);
  let size = null;
  const file = path.join(OUT, src);
  if (/\.jpe?g$/i.test(src) && fs.existsSync(file)) {
    const b = fs.readFileSync(file);
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = b.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        size = { h: b.readUInt16BE(i + 5), w: b.readUInt16BE(i + 7) };
        break;
      }
      i += 2 + len;
    }
  } else if (/\.svg$/i.test(src) && fs.existsSync(file)) {
    const m = fs.readFileSync(file, 'utf8').match(/width="(\d+)"\s+height="(\d+)"/);
    if (m) size = { w: +m[1], h: +m[2] };
  }
  sizeCache.set(src, size);
  return size;
}

function enhanceImages(html) {
  let first = true;
  return html.replace(/<img\s([^>]*?)>/g, (tag, attrs) => {
    const src = (attrs.match(/src="([^"]+)"/) || [])[1];
    let extra = '';
    const size = src && imageSize(src);
    if (size && !/\swidth=/.test(' ' + attrs)) extra += ` width="${size.w}" height="${size.h}"`;
    if (!/decoding=/.test(attrs)) extra += ' decoding="async"';
    // Первое изображение страницы (обычно первый экран) грузится сразу, остальные — лениво
    if (!/loading=/.test(attrs) && !first) extra += ' loading="lazy"';
    first = false;
    return `<img ${attrs.trim()}${extra}>`;
  });
}

const V = 'assets/vendor';
for (const [file, p] of Object.entries(pages)) {
  const main = p.body + (p.home ? loader(true) : '');
  const needsSwiper = /class="swiper /.test(p.body);
  const head = [
    `<link rel="stylesheet" href="assets/css/style.css">`,
    needsSwiper ? `<link rel="stylesheet" href="${V}/swiper-bundle.min.css">` : '',
    `<link rel="stylesheet" href="assets/css/create.css">`,
    /data-calc/.test(p.body) ? `<link rel="stylesheet" href="assets/css/calc.css">` : '',
    /class="prices/.test(p.body) ? `<link rel="stylesheet" href="assets/css/prices.css">` : '',
    `<link rel="stylesheet" href="assets/css/mobile.css">`,
  ].filter(Boolean).join('\n');
  const scripts = [
    `${V}/gsap.min.js`,
    `${V}/ScrollTrigger.min.js`,
    p.home ? `${V}/CustomEase.min.js` : '',
    `${V}/lenis.min.js`,
    `${V}/split-type.min.js`,
    needsSwiper ? `${V}/swiper-bundle.min.js` : '',
    'assets/js/main.js',
    /data-create/.test(p.body) || /<video/.test(main) ? 'assets/js/create.js' : '',
    ...(p.scripts || []),
  ].filter(Boolean).map((src) => `<script src="${src}"></script>`).join('\n');

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${strip(p.title)} | ${S.brand}</title>
<meta name="description" content="${attr(strip(p.description || S.footerNote))}">
<meta name="theme-color" content="#181818">
${FAVICON}
<script>
  // Анимации появления включаются только при работающем JS; если скрипты не загрузились за 8 секунд — показываем страницу как есть
  document.documentElement.classList.add('js');
  setTimeout(function () {
    if (window.__siteReady) return;
    document.documentElement.classList.remove('js');
    var l = document.getElementById('loader');
    if (l) l.style.display = 'none';
  }, 8000);
</script>
<link rel="preload" href="assets/fonts/roboto-cyrillic-1.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/source-serif-4-cyrillic-5.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/fonts.css">
${head}
</head>
<body class="loading" data-page="${file.replace('.html', '')}"${p.gears ? ` data-gears="${p.gears}"` : ''}>
<div class="page">
<button class="to-top" type="button" aria-label="Наверх" data-to-top data-cursor="-fusion"><svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg></button>
${topbar(file)}
<main class="page-main" id="main">
${p.body}
</main>
${footer()}
${overlay(file)}
${worksMenu()}
${loader(!!p.home)}
</div>
${scripts}
</body>
</html>
`;
  const out = enhanceImages(html)
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(path.join(OUT, file), out);
  console.log('built', file);
}
