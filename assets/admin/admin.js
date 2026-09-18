/* Админка сайта: редактирование content.json — текстов, списков, фото и видео.
   Страницы сайта собираются из этого файла (build.js), поэтому правки видны на всех страницах сразу. */
(function () {
  'use strict';

  var API = 'api/admin';
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var token = sessionStorage.getItem('admin-token') || '';
  var content = null;
  var current = null;
  var dirty = false;

  /* ---------- Названия разделов и полей по-русски ---------- */
  var SECTIONS = [
    { group: 'Общее' },
    { key: 'site', title: 'Контакты и название', hint: 'Название, телефон, почта, Telegram и подписи, которые видны в шапке, меню и подвале.' },
    { key: 'media', title: 'Видео и фото шапки', hint: 'Видео главной страницы, заставка для него и подписи к фотографиям (alt).' },
    { key: 'nav', title: 'Меню сайта', hint: 'Пункты верхнего меню. Ссылка — имя файла страницы.' },
    { key: 'dropdown', title: 'Выпадающее меню «Каталог»', hint: 'Появляется при наведении на «Каталог» в шапке.' },
    { key: 'catalog', title: 'Каталог работ', hint: 'Категории для фильтра, карточки работ и фото для галерей.' },
    { key: 'slider', title: 'Блок «Варианты изделий»', hint: 'Слайдер, который повторяется на нескольких страницах.' },
    { key: 'directions', title: 'Блок «Направления работ»', hint: 'Блок с фото и списком направлений.' },
    { key: 'create', title: 'Блок «Создай своё»', hint: 'Форма визуализации: шаги, примеры и подписи.' },
    { key: 'aboutColumns', title: 'Лента фотографий', hint: 'Четыре колонки фото, которые едут при прокрутке.' },
    { key: 'process', title: 'Как рождается изделие', hint: 'Пункты процесса: показываются на страницах «Изделие» и «Направления».' },
    { group: 'Страницы' },
    { key: 'pages.index', title: 'Главная' },
    { key: 'pages.works', title: 'Каталог работ' },
    { key: 'pages.work', title: 'Страница изделия' },
    { key: 'pages.about', title: 'О нас' },
    { key: 'pages.team', title: 'Направления' },
    { key: 'pages.expertise', title: 'Экспертиза' },
    { key: 'pages.calculator', title: 'Калькулятор' },
    { key: 'pages.prices', title: 'Цены' },
    { key: 'pages.legal', title: 'Правовая информация' },
    { key: 'pages.privacy', title: 'Политика конфиденциальности' },
  ];

  var LABELS = {
    brand: 'Название сайта', phone: 'Телефон (как показывать)', phoneHref: 'Телефон для ссылки',
    email: 'Почта', telegram: 'Ник в Telegram', telegramUrl: 'Ссылка на Telegram',
    contactButton: 'Надпись на кнопке в шапке', telegramNote: 'Подпись под Telegram в подвале',
    telegramNoteMenu: 'Подпись под Telegram в меню', chips: 'Плашки в подвале', marquee: 'Бегущая строка',
    footerNote: 'Приписка в подвале', menuNote: 'Приписка в меню', loaderWord: 'Надпись на экране загрузки',
    heroVideo: 'Видео в шапке', heroPoster: 'Заставка видео', alts: 'Подписи к фотографиям (alt)',
    href: 'Ссылка', label: 'Надпись', title: 'Заголовок', text: 'Текст', lead: 'Вводная фраза',
    intro: 'Вступление', sur: 'Надзаголовок', button: 'Надпись на кнопке', buttonHref: 'Куда ведёт кнопка',
    photo: 'Фото', gallery: 'Галерея', cat: 'Категория', categories: 'Категории фильтра',
    items: 'Позиции', slides: 'Слайды', linkText: 'Надпись на ссылке в слайдере',
    galleryPool: 'Фото для маленьких галерей', categoriesTitle: 'Заголовок списка категорий',
    lastTitle: 'Заголовок «Последний проект»', lastProject: 'Последний проект',
    steps: 'Шаги', examples: 'Примеры описаний', fieldLabel: 'Подпись поля ввода',
    placeholder: 'Подсказка в поле ввода', dropTitle: 'Заголовок загрузки фото', dropText: 'Пояснение к загрузке фото',
    submit: 'Надпись на кнопке отправки', resultPlaceholder: 'Текст до появления картинки', note: 'Сноска под формой',
    description: 'Описание для поисковиков', h1: 'Главный заголовок', heroTitle: 'Заголовок в шапке',
    heroBaseline: 'Текст под заголовком', scrollHint: 'Подсказка «Листайте вниз»', aboutIntro: 'Фраза над лентой фото',
    resetFilter: 'Надпись «Сбросить фильтр»', loadMore: 'Надпись «Показать ещё»', visibleCount: 'Сколько работ видно сразу',
    heroPhoto: 'Фото в шапке', baseline: 'Текст под заголовком', tags: 'Метки', introTitle: 'Заголовок вступления',
    introText: 'Текст вступления', processTitle: 'Заголовок процесса', outroText: 'Заключительный текст',
    block1: 'Первый блок', block2: 'Второй блок', extra: 'Дополнение', list: 'Список',
    directionsPhoto: 'Фото блока «Направления работ»', normsTitle: 'Заголовок «Работаю по нормам»',
    normsRows: 'Строки бегущих норм', storySur: 'Надзаголовок раздела', storyTitle: 'Заголовок раздела',
    storyPhotos: 'Фотографии раздела (колонка слева)', storyText: 'Текст раздела', storyExtra: 'Дополнение к тексту',
    processNote: 'Приписка к процессу', columnsIntro: 'Фраза над лентой фото', loftSur: 'Надзаголовок «Металл + дерево»',
    loftTitle: 'Заголовок «Металл + дерево»', loftText: 'Текст «Металл + дерево»', loftButton: 'Надпись на кнопке',
    accordion: 'Список с фото (аккордеон)', calcTitle: 'Заголовок блока калькулятора', calcBaseline: 'Крупная фраза',
    calcText: 'Текст блока', calcButton: 'Надпись на кнопке', paramsTitle: 'Заголовок «Параметры»',
    sheetTitle: 'Заголовок ведомости', extrasTitle: 'Заголовок «Расходники»', extrasText: 'Пояснение к расходникам',
    bottomText: 'Текст под ведомостью', sendButton: 'Надпись на кнопке отправки', statusHint: 'Подсказка о буфере обмена',
    normsSur: 'Надзаголовок «Нормы»', norms: 'Список правил', normsButton: 'Надпись на кнопке',
    headWork: 'Заголовок колонки «Вид работ»', headPrice: 'Заголовок колонки «Стоимость»',
    defaultPrice: 'Текст в колонке «Стоимость»', calcLink: 'Надпись «Рассчитать материалы»',
    rows: 'Строки таблицы', special: 'Особые строки', work: 'Вид работ', price: 'Стоимость',
    task: 'Задача калькулятора (код)', ctaSur: 'Надзаголовок врезки', ctaTitle: 'Заголовок врезки',
    ctaText: 'Текст врезки', ctaButton1: 'Первая кнопка', ctaButton2: 'Вторая кнопка', facts: 'Короткие факты',
    blocks: 'Блоки текста', credit: 'Подпись разработчика в подвале', prefix: 'Текст перед названием',
    name: 'Название студии', url: 'Ссылка на студию (можно оставить пустой)',
    loftPhoto: 'Фото блока «Металл + дерево»', logo: 'Файл логотипа студии (если есть)',
  };

  var HINT_TEXT = 'Можно вставлять {phone}, {email}, {telegram}, {brand} — подставятся контакты, а <strong>…</strong> выделит слова.';

  /* ---------- Запросы к серверу ---------- */
  function api(action, data) {
    return fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(Object.assign({ action: action }, data || {})),
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (body) {
        if (!r.ok) throw new Error(body.error || 'Ошибка ' + r.status);
        return body;
      });
    });
  }

  function status(text, type) {
    var el = $('#status');
    el.textContent = text || '';
    el.className = 'bar__status' + (type ? ' is-' + type : '');
  }

  /* ---------- Работа со значениями по пути ---------- */
  function get(path) {
    return path.reduce(function (acc, key) { return acc == null ? acc : acc[key]; }, content);
  }
  function set(path, value) {
    var parent = get(path.slice(0, -1));
    parent[path[path.length - 1]] = value;
    markDirty();
  }
  function markDirty() {
    dirty = true;
    status('Есть несохранённые изменения');
  }

  var MEDIA_RE = /^assets\/[\w./-]+\.(jpg|jpeg|png|webp|svg|mp4)$/i;
  var isMedia = function (v) { return typeof v === 'string' && MEDIA_RE.test(v); };
  var isVideo = function (v) { return /\.mp4$/i.test(v || ''); };
  // Поля-файлы: значение уже указывает на файл либо ключ называется photo/video/poster
  var MEDIA_KEY = /^(photo|poster|video|logo)$|(Photo|Video|Poster|Logo)$/;
  var isMediaField = function (key, value) {
    return isMedia(value) || (value === '' && key.indexOf('/') < 0 && key.indexOf('.') < 0 && MEDIA_KEY.test(key));
  };
  var labelFor = function (key) {
    if (key.indexOf('assets/') === 0) return key.split('/').pop();
    return LABELS[key] || key;
  };

  /* ---------- Построение полей ---------- */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function textField(path, value, label) {
    var wrap = el('div', 'field');
    if (label) wrap.appendChild(el('label', 'field__label', label));
    var long = String(value).length > 70 || /<|\n/.test(String(value));
    var input = el(long ? 'textarea' : 'input', long ? 'field__area' : 'field__input');
    input.value = value;
    input.addEventListener('input', function () { set(path, input.value); });
    wrap.appendChild(input);
    if (long) wrap.appendChild(el('div', 'field__note', HINT_TEXT));
    return wrap;
  }

  function numberField(path, value, label) {
    var wrap = el('div', 'field');
    if (label) wrap.appendChild(el('label', 'field__label', label));
    var input = el('input', 'field__input');
    input.type = 'number';
    input.value = value;
    input.addEventListener('input', function () { set(path, Number(input.value)); });
    wrap.appendChild(input);
    return wrap;
  }

  function mediaField(path, value, label) {
    var wrap = el('div', 'field');
    if (label) wrap.appendChild(el('label', 'field__label', label));
    var box = el('div', 'media');
    var preview = el('div', 'media__preview');
    var side = el('div', 'media__side');
    var pathLine = el('div', 'media__path');

    function draw(v) {
      preview.innerHTML = '';
      preview.style.backgroundImage = '';
      if (!v) { preview.textContent = 'файл не выбран'; }
      else if (isVideo(v)) {
        var video = document.createElement('video');
        video.src = v; video.muted = true; video.loop = true; video.playsInline = true;
        video.autoplay = true;
        preview.appendChild(video);
      } else {
        preview.style.backgroundImage = 'url("' + v + '")';
      }
      pathLine.textContent = v || '—';
    }

    var pick = el('button', 'btn btn--mini', 'Выбрать файл');
    pick.type = 'button';
    pick.addEventListener('click', function () {
      openPicker(isVideo(value) ? 'video' : 'any', function (file) {
        value = file;
        set(path, file);
        draw(file);
      });
    });
    var clear = el('button', 'btn btn--mini btn--danger', 'Убрать');
    clear.type = 'button';
    clear.addEventListener('click', function () {
      value = '';
      set(path, '');
      draw('');
    });

    side.appendChild(pick);
    side.appendChild(clear);
    side.appendChild(pathLine);
    box.appendChild(preview);
    box.appendChild(side);
    wrap.appendChild(box);
    draw(value);
    return wrap;
  }

  // Заголовок карточки в списке: первое осмысленное поле
  function cardTitle(item, index) {
    if (typeof item === 'string') return item.slice(0, 60);
    var keys = ['title', 'label', 'work', 'sur', 'h1', 'text'];
    for (var i = 0; i < keys.length; i++) {
      if (item && item[keys[i]]) return String(item[keys[i]]).replace(/<[^>]+>/g, '').slice(0, 60);
    }
    return 'Пункт ' + (index + 1);
  }

  // Пустая копия элемента списка — чтобы «Добавить» создавал такую же структуру
  function blank(sample) {
    if (Array.isArray(sample)) return [];
    if (sample && typeof sample === 'object') {
      var out = {};
      Object.keys(sample).forEach(function (k) { out[k] = blank(sample[k]); });
      return out;
    }
    if (typeof sample === 'number') return 0;
    return '';
  }

  function listField(path, value, label, render) {
    var wrap = el('div', 'group');
    wrap.appendChild(el('h3', 'group__title', label));
    var body = el('div');
    wrap.appendChild(body);

    function redraw() {
      body.innerHTML = '';
      value.forEach(function (item, i) {
        body.appendChild(render(item, i, tools(i)));
      });
      var add = el('button', 'btn btn--mini list__add', '+ Добавить');
      add.type = 'button';
      add.addEventListener('click', function () {
        value.push(blank(value[0] != null ? value[0] : ''));
        markDirty();
        redraw();
      });
      body.appendChild(add);
    }

    function tools(i) {
      var box = el('div', 'card__tools');
      var up = el('button', 'btn btn--mini', '↑');
      up.type = 'button'; up.disabled = i === 0;
      up.addEventListener('click', function () { move(i, -1); });
      var down = el('button', 'btn btn--mini', '↓');
      down.type = 'button'; down.disabled = i === value.length - 1;
      down.addEventListener('click', function () { move(i, 1); });
      var del = el('button', 'btn btn--mini btn--danger', 'Удалить');
      del.type = 'button';
      del.addEventListener('click', function () {
        if (!confirm('Удалить этот пункт?')) return;
        value.splice(i, 1);
        markDirty();
        redraw();
      });
      box.appendChild(up); box.appendChild(down); box.appendChild(del);
      return box;
    }

    function move(i, dir) {
      var j = i + dir;
      var tmp = value[i];
      value[i] = value[j];
      value[j] = tmp;
      markDirty();
      redraw();
    }

    redraw();
    return wrap;
  }

  function renderValue(path, value, label) {
    var key = path[path.length - 1];

    if (Array.isArray(value)) {
      // Список строк или файлов
      if (value.every(function (v) { return typeof v === 'string'; })) {
        return listField(path, value, label, function (item, i, tools) {
          if (isMedia(item)) {
            var card = el('div', 'card');
            var head = el('div', 'card__head');
            head.appendChild(el('div', 'card__num', 'Файл ' + (i + 1)));
            head.appendChild(tools);
            card.appendChild(head);
            card.appendChild(mediaField(path.concat(i), item, ''));
            return card;
          }
          var row = el('div', 'row');
          var input = el(item.length > 70 || /<|\n/.test(item) ? 'textarea' : 'input', item.length > 70 || /<|\n/.test(item) ? 'field__area' : 'field__input');
          input.value = item;
          input.addEventListener('input', function () { value[i] = input.value; markDirty(); });
          row.appendChild(input);
          row.appendChild(tools);
          return row;
        });
      }
      // Список колонок (массив массивов)
      if (value.every(function (v) { return Array.isArray(v); })) {
        return listField(path, value, label, function (item, i, tools) {
          var card = el('div', 'card');
          var head = el('div', 'card__head');
          head.appendChild(el('div', 'card__num', 'Колонка ' + (i + 1)));
          head.appendChild(tools);
          card.appendChild(head);
          card.appendChild(renderValue(path.concat(i), item, 'Фотографии'));
          return card;
        });
      }
      // Список карточек
      return listField(path, value, label, function (item, i, tools) {
        var card = el('div', 'card');
        var head = el('div', 'card__head');
        head.appendChild(el('div', 'card__num', (i + 1) + '. ' + cardTitle(item, i)));
        head.appendChild(tools);
        card.appendChild(head);
        Object.keys(item).forEach(function (k) {
          card.appendChild(renderValue(path.concat(i, k), item[k], labelFor(k)));
        });
        return card;
      });
    }

    if (value && typeof value === 'object') {
      var group = el('div', 'group');
      group.appendChild(el('h3', 'group__title', label));
      Object.keys(value).forEach(function (k) {
        group.appendChild(renderValue(path.concat(k), value[k], labelFor(k)));
      });
      return group;
    }

    if (typeof value === 'number') return numberField(path, value, label);
    if (isMediaField(key, value)) return mediaField(path, value, label);
    return textField(path, value, label);
  }

  /* ---------- Разделы ---------- */
  function openSection(section) {
    current = section;
    Array.prototype.forEach.call(document.querySelectorAll('.side__btn'), function (b) {
      b.classList.toggle('is-active', b.dataset.key === section.key);
    });
    var main = $('#main');
    main.innerHTML = '';
    main.appendChild(el('h1', 'main__title', section.title));
    if (section.hint) main.appendChild(el('p', 'main__hint', section.hint));
    var path = section.key.split('.');
    main.appendChild(renderValue(path, get(path), section.title));
    main.scrollIntoView({ block: 'start' });
  }

  function buildSidebar() {
    var side = $('#side');
    side.innerHTML = '';
    SECTIONS.forEach(function (s) {
      if (s.group) { side.appendChild(el('div', 'side__group', s.group)); return; }
      if (get(s.key.split('.')) == null) return;
      var btn = el('button', 'side__btn', s.title);
      btn.type = 'button';
      btn.dataset.key = s.key;
      btn.addEventListener('click', function () { openSection(s); });
      side.appendChild(btn);
    });
  }

  /* ---------- Библиотека файлов ---------- */
  var pickerCb = null;
  function openPicker(kind, cb) {
    pickerCb = cb;
    $('#picker').hidden = false;
    loadMedia(kind);
  }
  function closePicker() {
    $('#picker').hidden = true;
    pickerCb = null;
  }

  function loadMedia(kind) {
    var grid = $('#picker-grid');
    grid.textContent = 'Загрузка…';
    api('media').then(function (r) {
      grid.innerHTML = '';
      r.files.filter(function (f) {
        return kind !== 'video' || isVideo(f.path);
      }).forEach(function (f) {
        var tile = el('div', 'tile');
        if (isVideo(f.path)) {
          var v = document.createElement('video');
          v.className = 'tile__img'; v.src = f.path; v.muted = true; v.playsInline = true;
          tile.appendChild(v);
        } else {
          var img = document.createElement('img');
          img.className = 'tile__img'; img.src = f.path; img.alt = ''; img.loading = 'lazy';
          tile.appendChild(img);
        }
        var body = el('div', 'tile__body');
        body.appendChild(el('div', 'tile__name', f.path.replace('assets/', '') + ' · ' + Math.round(f.size / 1024) + ' КБ'));
        var tools = el('div', 'tile__tools');
        var use = el('button', 'btn btn--mini btn--main', 'Выбрать');
        use.type = 'button';
        use.addEventListener('click', function () {
          if (pickerCb) pickerCb(f.path);
          closePicker();
        });
        var del = el('button', 'btn btn--mini btn--danger', 'Удалить');
        del.type = 'button';
        del.addEventListener('click', function () {
          if (!confirm('Удалить файл ' + f.path + '? Если он где-то используется, картинка пропадёт.')) return;
          api('remove', { file: f.path }).then(function () { loadMedia(kind); })
            .catch(function (e) { alert(e.message); });
        });
        tools.appendChild(use); tools.appendChild(del);
        body.appendChild(tools);
        tile.appendChild(body);
        grid.appendChild(tile);
      });
      if (!grid.children.length) grid.textContent = 'Файлов пока нет — загрузите первый.';
    }).catch(function (e) { grid.textContent = e.message; });
  }

  function uploadFiles(files) {
    var list = Array.prototype.slice.call(files);
    if (!list.length) return;
    var grid = $('#picker-grid');
    grid.textContent = 'Загрузка файлов…';
    list.reduce(function (chain, file) {
      return chain.then(function () {
        return new Promise(function (resolve, reject) {
          var reader = new FileReader();
          reader.onload = function () {
            var dir = /\.mp4$/i.test(file.name) ? 'assets/video' : (/\.svg$/i.test(file.name) ? 'assets/img' : 'assets/photo');
            var name = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/^-+|-+$/g, '');
            api('upload', { file: dir + '/' + name, data: reader.result }).then(resolve, reject);
          };
          reader.onerror = function () { reject(new Error('Не удалось прочитать файл.')); };
          reader.readAsDataURL(file);
        });
      });
    }, Promise.resolve()).then(function () {
      loadMedia('any');
    }).catch(function (e) {
      grid.textContent = e.message;
    });
  }

  /* ---------- Сохранение и вход ---------- */
  function loadContent() {
    return api('content').then(function (r) {
      content = r.content;
      dirty = false;
      $('#storage-badge').textContent = r.storage === 'github' ? 'сохранение в GitHub → Vercel' : 'локальный режим';
      buildSidebar();
      openSection(current || SECTIONS[1]);
      status('Загружено');
    });
  }

  function save() {
    var btn = $('#save');
    btn.disabled = true;
    status('Сохраняю…');
    api('save', { content: content }).then(function (r) {
      dirty = false;
      status(r.message, 'ok');
    }).catch(function (e) {
      status(e.message, 'err');
    }).then(function () { btn.disabled = false; });
  }

  function showApp() {
    $('#login').hidden = true;
    $('#app').hidden = false;
    loadContent().catch(function (e) {
      if (/Сессия/.test(e.message)) return logout();
      status(e.message, 'err');
    });
  }

  function logout() {
    token = '';
    sessionStorage.removeItem('admin-token');
    $('#app').hidden = true;
    $('#login').hidden = false;
  }

  $('#login-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var err = $('#login-error');
    err.textContent = '';
    api('login', { password: $('#password').value }).then(function (r) {
      token = r.token;
      sessionStorage.setItem('admin-token', token);
      $('#password').value = '';
      showApp();
    }).catch(function (ex) { err.textContent = ex.message; });
  });

  $('#save').addEventListener('click', save);
  $('#logout').addEventListener('click', function () {
    if (dirty && !confirm('Есть несохранённые изменения. Выйти?')) return;
    logout();
  });
  $('#reload').addEventListener('click', function () {
    if (dirty && !confirm('Вернуть последнюю сохранённую версию? Текущие правки пропадут.')) return;
    loadContent().catch(function (e) { status(e.message, 'err'); });
  });
  $('#picker-upload').addEventListener('change', function (e) { uploadFiles(e.target.files); e.target.value = ''; });
  Array.prototype.forEach.call(document.querySelectorAll('[data-picker-close]'), function (b) {
    b.addEventListener('click', closePicker);
  });
  $('#picker').addEventListener('click', function (e) { if (e.target === $('#picker')) closePicker(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('#picker').hidden) closePicker();
    if ((e.ctrlKey || e.metaKey) && e.key === 's' && !$('#app').hidden) { e.preventDefault(); save(); }
  });
  window.addEventListener('beforeunload', function (e) {
    if (!dirty) return;
    e.preventDefault();
    e.returnValue = '';
  });

  if (token) showApp();
})();
