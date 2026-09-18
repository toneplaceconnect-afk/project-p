/* Формулы калькулятора материалов — перенесены из проекта «Проект-Сварка» без изменений расчётов */
/* eslint-disable */
const CATS = {
  fence: {
    title: 'Забор из профнастила',
    note: 'Шаг столбов подбирается автоматически по высоте и грунту. Заглубление — по правилу «1/3» с запасом на пучинистый грунт.',
    fields: [
      { id: 'len', label: 'Длина забора (периметр), м', type: 'number', def: 40, step: 0.5 },
      { id: 'h', label: 'Высота забора, м', type: 'select', def: '2', options: [['1.5', '1,5'], ['1.8', '1,8'], ['2', '2,0'], ['2.2', '2,2'], ['2.5', '2,5']] },
      { id: 'sheet', label: 'Марка профнастила', type: 'select', def: '1.10', options: [['1.15', 'С8 — 1150 мм'], ['1.10', 'С20 — 1100 мм'], ['1.00', 'С21 — 1000 мм'], ['1.18', 'Евроштакетник — 1180 мм']] },
      { id: 'soil', label: 'Тип грунта', type: 'select', def: 'heavy', options: [['light', 'Песчаный, каменистый'], ['heavy', 'Суглинок, глина (пучинистый)']] },
      { id: 'post', label: 'Труба на столбы', type: 'select', def: '60', options: [['60', '60×60'], ['80', '80×80']] },
      { id: 'lag', label: 'Труба на лаги', type: 'select', def: '40x20', options: [['40x20', '40×20'], ['40x25', '40×25']] }
    ]
  },
  gate: {
    title: 'Ворота и калитка',
    note: 'Створка свыше 6 м² усиливается диагональю. Петли — 3 шт. на тяжёлую створку.',
    fields: [
      { id: 'gates', label: 'Ворота, шт', type: 'number', def: 1, step: 1 },
      { id: 'gw', label: 'Ширина проёма ворот, м', type: 'number', def: 3.5, step: 0.1 },
      { id: 'wickets', label: 'Калитки, шт', type: 'number', def: 1, step: 1 },
      { id: 'ww', label: 'Ширина калитки, м', type: 'number', def: 0.9, step: 0.05 },
      { id: 'h', label: 'Высота, м', type: 'select', def: '2', options: [['1.8', '1,8'], ['2', '2,0'], ['2.2', '2,2']] },
      { id: 'fill', label: 'Заполнение', type: 'select', def: '1.10', options: [['1.10', 'Профнастил С20'], ['1.18', 'Евроштакетник'], ['0', 'Без заполнения (каркас)']] },
      { id: 'auto', label: 'Автоматика на ворота', type: 'select', def: 'no', options: [['no', 'Не нужна'], ['yes', 'Привод + пульты']] }
    ]
  },
  canopy: {
    title: 'Навес или козырёк',
    note: 'Обрешётка: 0,7 м под поликарбонат, 1,5 м под профнастил. Шаг стропил уменьшен против таблиц производителей — снеговая нагрузка региона выше средней.',
    fields: [
      { id: 'len', label: 'Длина навеса, м', type: 'number', def: 6, step: 0.5 },
      { id: 'w', label: 'Вылет (ширина), м', type: 'number', def: 4, step: 0.5 },
      { id: 'h', label: 'Высота стойки, м', type: 'number', def: 2.5, step: 0.1 },
      { id: 'roof', label: 'Кровля', type: 'select', def: 'poly', options: [['poly', 'Поликарбонат 8 мм'], ['prof', 'Профнастил С21']] },
      { id: 'soil', label: 'Тип грунта', type: 'select', def: 'heavy', options: [['light', 'Песчаный, каменистый'], ['heavy', 'Суглинок, глина (пучинистый)']] }
    ]
  },
  gazebo: {
    title: 'Беседка (металл + дерево)',
    note: 'Каркас из профильной трубы, обшивка и пол — дерево по наличию или ваше собственное. Кровля считается с уклоном 15 %.',
    fields: [
      { id: 'a', label: 'Размер A, м', type: 'number', def: 3, step: 0.5 },
      { id: 'b', label: 'Размер B, м', type: 'number', def: 4, step: 0.5 },
      { id: 'h', label: 'Высота стойки, м', type: 'number', def: 2.4, step: 0.1 },
      { id: 'floor', label: 'Пол', type: 'select', def: 'yes', options: [['yes', 'Деревянный настил'], ['no', 'Без пола (на плиту)']] },
      { id: 'wall', label: 'Обшивка стен', type: 'select', def: 'half', options: [['half', 'До половины высоты'], ['full', 'Полная обшивка'], ['none', 'Открытая']] },
      { id: 'roof', label: 'Кровля', type: 'select', def: 'prof', options: [['prof', 'Профнастил'], ['poly', 'Поликарбонат']] }
    ]
  },
  bbq: {
    title: 'Мангальная зона / уличная кухня',
    note: 'Столешница под открытый огонь — лист от 3 мм. Огнеупорная обшивка считается по площади задней стенки и пода.',
    fields: [
      { id: 'len', label: 'Длина зоны, м', type: 'number', def: 2.4, step: 0.1 },
      { id: 'd', label: 'Глубина, м', type: 'number', def: 0.7, step: 0.05 },
      { id: 'h', label: 'Высота рабочей поверхности, м', type: 'number', def: 0.9, step: 0.05 },
      { id: 'top', label: 'Столешница', type: 'select', def: 'steel', options: [['steel', 'Лист 3 мм по всей длине'], ['mix', 'Металл у мангала + дерево']] },
      { id: 'canopy', label: 'Навес над зоной', type: 'select', def: 'yes', options: [['yes', 'Нужен'], ['no', 'Не нужен']] }
    ]
  },
  stairs: {
    title: 'Лестница металл + дерево',
    note: 'Шаг ступени 17–19 см. Косоур — профильная труба, проступи — дерево по наличию или ваше собственное.',
    fields: [
      { id: 'h', label: 'Высота этажа, м', type: 'number', def: 2.8, step: 0.05 },
      { id: 'w', label: 'Ширина марша, м', type: 'number', def: 0.9, step: 0.05 },
      { id: 'kos', label: 'Косоур', type: 'select', def: '2', options: [['2', 'Два боковых'], ['1', 'Один центральный']] },
      { id: 'rail', label: 'Перила', type: 'select', def: 'both', options: [['one', 'С одной стороны'], ['both', 'С двух сторон'], ['none', 'Без перил']] },
      { id: 'wood', label: 'Материал ступеней', type: 'select', def: 'pine', options: [['pine', 'Сосна или кедр 40 мм'], ['oak', 'Лиственница 40 мм'], ['shield', 'Мебельный щит 40 мм']] }
    ]
  },
  furniture: {
    title: 'Каталог изделий',
    note: 'Каркас — труба 40×20 или 50×25, столешница и полки — дерево по наличию или ваше собственное. Окраска считается по площади поверхности трубы.',
    fields: [
      { id: 'type', label: 'Изделие', type: 'select', def: 'table', options: [['table', 'Стол'], ['shelf', 'Стеллаж'], ['bench', 'Скамья'], ['bar', 'Барная стойка']] },
      { id: 'w', label: 'Ширина, см', type: 'number', def: 140, step: 5 },
      { id: 'd', label: 'Глубина, см', type: 'number', def: 70, step: 5 },
      { id: 'hh', label: 'Высота, см', type: 'number', def: 75, step: 5 },
      { id: 'shelves', label: 'Полок / уровней, шт', type: 'number', def: 1, step: 1 },
      { id: 'wood', label: 'Дерево', type: 'select', def: 'pine', options: [['pine', 'Сосна или кедр 40 мм'], ['oak', 'Лиственница 40 мм'], ['shield', 'Мебельный щит 28 мм'], ['ply', 'Фанера 18 мм']] }
    ]
  },
  heating: {
    title: 'Отопление',
    note: 'Мощность котла — 1,5–2,0 кВт на 10 м² (резко-континентальный климат), +25 % при контуре ГВС. Итоговая мощность уточняется теплотехническим расчётом по СП 50.',
    fields: [
      { id: 's', label: 'Отапливаемая площадь, м²', type: 'number', def: 120, step: 5 },
      { id: 'floors', label: 'Этажность', type: 'number', def: 1, step: 1 },
      { id: 'ch', label: 'Высота потолков, м', type: 'number', def: 2.7, step: 0.1 },
      { id: 'rooms', label: 'Комнат с радиаторами, шт', type: 'number', def: 6, step: 1 },
      { id: 'rad', label: 'Радиаторы', type: 'select', def: 'bi', options: [['bi', 'Биметалл ≈180 Вт/секция'], ['al', 'Алюминий ≈185 Вт/секция'], ['cast', 'Чугун ≈160 Вт/секция']] },
      { id: 'sys', label: 'Тип системы', type: 'select', def: 'two', options: [['two', 'Двухтрубная'], ['one', 'Однотрубная'], ['col', 'Коллекторная (лучевая)']] },
      { id: 'floor', label: 'Тёплый пол, м²', type: 'number', def: 0, step: 5 },
      { id: 'dhw', label: 'Контур ГВС от котла', type: 'select', def: 'yes', options: [['yes', 'Нужен'], ['no', 'Не нужен']] }
    ]
  },
  water: {
    title: 'Водоснабжение',
    note: 'Диаметр магистрали 25–32 мм до 10 точек разбора, свыше — 32–40 мм. Фитинги считаются с коэффициентом 2,5 на точку.',
    fields: [
      { id: 'src', label: 'Источник', type: 'select', def: 'well', options: [['well', 'Скважина'], ['pit', 'Колодец'], ['city', 'Центральный водопровод']] },
      { id: 'points', label: 'Точек водоразбора, шт', type: 'number', def: 7, step: 1 },
      { id: 'dist', label: 'Среднее расстояние до точки, м', type: 'number', def: 8, step: 1 },
      { id: 'floors', label: 'Этажность', type: 'number', def: 1, step: 1 },
      { id: 'heater', label: 'Водонагреватель', type: 'select', def: 'tank', options: [['tank', 'Накопительный'], ['flow', 'Проточный'], ['no', 'Не нужен']] },
      { id: 'people', label: 'Проживающих, чел', type: 'number', def: 4, step: 1 },
      { id: 'filter', label: 'Фильтрация', type: 'select', def: 'two', options: [['one', 'Грубая очистка'], ['two', 'Грубая + тонкая'], ['three', 'С умягчением']] }
    ]
  },
  power: {
    title: 'Электрика и щит',
    note: 'Кабель ВВГнг-LS: 3×2,5 на розеточные группы, 3×1,5 на свет, 3×4 на котёл и насос. Метраж — с запасом 15 % на заводы в щит.',
    fields: [
      { id: 'sockets', label: 'Розеток, шт', type: 'number', def: 18, step: 1 },
      { id: 'lights', label: 'Светильников и выключателей, шт', type: 'number', def: 14, step: 1 },
      { id: 'dist', label: 'Среднее расстояние до щита, м', type: 'number', def: 12, step: 1 },
      { id: 'heavy', label: 'Мощных потребителей (котёл, насос, бойлер), шт', type: 'number', def: 3, step: 1 },
      { id: 'ground', label: 'Контур заземления', type: 'select', def: 'yes', options: [['yes', 'Нужен'], ['no', 'Уже есть']] },
      { id: 'hidden', label: 'Проводка', type: 'select', def: 'pipe', options: [['pipe', 'В гофре / кабель-канале'], ['wall', 'Скрытая в штробе']] }
    ]
  }
};

function buildSheet(currentCat, n, s) {
        const f1 = (x) => x.toFixed(1).replace('.', ',');
    const f2 = (x) => x.toFixed(2).replace('.', ',');
    const i0 = (x) => String(Math.round(x));
    const up = Math.ceil;
    const rows = [], extras = [];
    let seam = 0, paint = 0, summary = CATS[currentCat].title;

    const R = (label, value) => rows.push({ label, value });
    const cut = (m) => m;

    if (currentCat === 'fence') {
      const P = n('len'), H = n('h'), W = n('sheet'), heavy = s('soil') === 'heavy';
      const step = (H > 2.2 || heavy) ? 2.25 : 2.75;
      const posts = P > 0 ? up(P / step) + 1 : 0;
      const depth = Math.max(H / 3, heavy ? 1.5 : 1.0);
      const postM = posts * (H + depth + 0.05);
      const lagRows = H > 2.2 ? 3 : 2;
      const lagM = P * lagRows * 1.05;
      const sheets = P > 0 && W > 0 ? up(P / W) : 0;
      const area = sheets * W * H;
      const screws = (4 * lagRows + 2) * sheets;
      const lagPer = s('lag') === '40x25' ? 0.13 : 0.12;
      const postPer = s('post') === '80' ? 0.32 : 0.24;
      summary = 'Забор ' + f1(P) + ' м, высота ' + f1(H) + ' м, ' + (heavy ? 'пучинистый грунт' : 'лёгкий грунт');
      R('Столбы ' + (s('post') === '80' ? '80×80' : '60×60'), posts + ' шт');
      R('Труба на столбы', f1(postM) + ' м');
      R('Заглубление столба', f1(depth) + ' м');
      R('Труба на лаги (' + lagRows + ' ряда)', f1(lagM) + ' м');
      R('Профнастил', sheets + ' листов');
      R('Площадь профнастила', f1(area) + ' м²');
      R('Саморезы кровельные 5,5×19', screws + ' шт');
      R('Заглушки на столбы', posts + ' шт');
      seam = posts * lagRows * 2 * lagPer + posts * postPer;
      paint = postM * postPer * 0.75 + lagM * lagPer;
    }

    if (currentCat === 'gate') {
      const g = Math.round(n('gates')), gw = n('gw'), w = Math.round(n('wickets')), ww = n('ww'), H = n('h'), fill = n('fill');
      const leafW = gw / 2;
      const frame = g * 2 * (2 * H + 2 * leafW) + w * (2 * H + 2 * ww);
      const diag = g * 2 * (leafW * H > 6 ? Math.sqrt(H * H + leafW * leafW) : 0) + w * Math.sqrt(H * H + ww * ww);
      const posts = g * 2 + w;
      const depth = Math.max(H / 3, 1.5) + 0.2;
      const postM = posts * (H + depth + 0.05);
      const sheets = fill > 0 ? up((g * gw + w * ww) / fill) : 0;
      summary = g + ' ворот (' + f1(gw) + ' м) и ' + w + ' калиток, высота ' + f1(H) + ' м';
      R('Столбы усиленные 80×80', posts + ' шт');
      R('Труба на столбы', f1(postM) + ' м');
      R('Труба 40×25 на рамы створок', f1(frame) + ' м');
      R('Труба на диагонали жёсткости', f1(diag) + ' м');
      R('Петли усиленные', (g * 6 + w * 3) + ' шт');
      R('Замок, ручки, шпингалет', (g + w) + ' компл');
      if (sheets) { R('Заполнение, листов', sheets + ' шт'); R('Саморезы', (sheets * 12) + ' шт'); }
      if (s('auto') === 'yes' && g > 0) R('Привод с пультами', g + ' компл');
      seam = frame * 0.14 + diag * 0.14 + posts * 0.32;
      paint = (frame + diag) * 0.13 + postM * 0.32 * 0.75;
    }

    if (currentCat === 'canopy') {
      const L = n('len'), W = n('w'), H = n('h'), poly = s('roof') === 'poly', heavy = s('soil') === 'heavy';
      const postStep = 2.0;
      const posts = (up(L / postStep) + 1) * 2;
      const depth = Math.max(H / 3, heavy ? 1.5 : 1.0);
      const postM = posts * (H + depth + 0.05);
      const rafterStep = 1.0;
      const rafters = up(L / rafterStep) + 1;
      const rafterM = rafters * (W * 1.04);
      const battenStep = poly ? 0.7 : 1.5;
      const battenM = (up(W / battenStep) + 1) * L;
      const beltM = L * 2 + W * 2;
      const area = L * W * 1.05;
      const sheets = poly ? up(area / (2.1 * 6)) : up(L / 1.0);
      summary = 'Навес ' + f1(L) + ' × ' + f1(W) + ' м, стойка ' + f1(H) + ' м';
      R('Стойки 80×80', posts + ' шт');
      R('Труба на стойки', f1(postM) + ' м');
      R('Обвязка по верху стоек', f1(beltM) + ' м');
      R('Стропила 60×40 (' + rafters + ' шт)', f1(rafterM) + ' м');
      R('Обрешётка 40×20, шаг ' + f1(battenStep) + ' м', f1(battenM) + ' м');
      R('Площадь кровли', f1(area) + ' м²');
      R(poly ? 'Поликарбонат 8 мм, листов 2,1×6 м' : 'Профнастил, листов', sheets + ' шт');
      if (poly) { R('Термошайбы', i0(area * 5.5) + ' шт'); R('Профиль соединительный / торцевой', f1(L + W * 2) + ' м'); }
      else R('Саморезы кровельные', i0(area * 7) + ' шт');
      seam = (rafterM + battenM + beltM) * 0.14 + posts * 0.32;
      paint = postM * 0.32 * 0.75 + (rafterM * 0.2 + battenM * 0.12 + beltM * 0.32);
    }

    if (currentCat === 'gazebo') {
      const A = n('a'), B = n('b'), H = n('h'), poly = s('roof') === 'poly';
      const posts = 4 + (A > 3 ? 2 : 0) + (B > 3 ? 2 : 0);
      const depth = 1.2;
      const postM = posts * (H + depth + 0.05);
      const beltM = (A + B) * 2 * 2;
      const roofArea = A * B * 1.15;
      const rafters = up(B / 0.9) + 1;
      const rafterM = rafters * A * 1.05;
      const battenM = (up(A / (poly ? 0.7 : 1.5)) + 1) * B;
      const wallH = s('wall') === 'full' ? H : (s('wall') === 'half' ? H / 2 : 0);
      const wallArea = wallH * ((A + B) * 2 - 1.0);
      const floorArea = s('floor') === 'yes' ? A * B : 0;
      summary = 'Беседка ' + f1(A) + ' × ' + f1(B) + ' м, высота ' + f1(H) + ' м';
      R('Стойки 80×80', posts + ' шт');
      R('Труба на стойки', f1(postM) + ' м');
      R('Обвязка верх и низ 60×40', f1(beltM) + ' м');
      R('Стропила (' + rafters + ' шт)', f1(rafterM) + ' м');
      R('Обрешётка 40×20', f1(battenM) + ' м');
      R('Кровля, площадь', f1(roofArea) + ' м²');
      R(poly ? 'Поликарбонат, листов 2,1×6 м' : 'Профнастил, листов', (poly ? up(roofArea / 12.6) : up(A / 1.0)) + ' шт');
      if (wallArea > 0) { R('Обшивка стен, площадь', f1(wallArea) + ' м²'); R('Доска 20×120 мм', f1(wallArea / 0.12 * 1.07) + ' м'); }
      if (floorArea > 0) { R('Настил пола, площадь', f1(floorArea) + ' м²'); R('Доска пола 35 мм', f2(floorArea * 0.035 * 1.08) + ' м³'); }
      R('Крепёж: уголки, саморезы по дереву', i0((wallArea + floorArea) * 22 + 60) + ' шт');
      seam = (beltM + rafterM + battenM) * 0.14 + posts * 0.32;
      paint = postM * 0.32 * 0.75 + (beltM * 0.2 + rafterM * 0.2 + battenM * 0.12);
    }

    if (currentCat === 'bbq') {
      const L = n('len'), D = n('d'), H = n('h'), mix = s('top') === 'mix', canopy = s('canopy') === 'yes';
      const frameM = (L + D) * 2 * 2 + 4 * H + up(L / 0.6) * D;
      const steelArea = mix ? L * D * 0.55 : L * D;
      const woodArea = mix ? L * D * 0.45 : 0;
      const fireArea = L * (H * 0.8) + L * D * 0.5;
      const canopyPosts = canopy ? 2 : 0;
      const canopyM = canopy ? (L + D) * 2 + canopyPosts * 2.4 + up(L / 1.0) * D : 0;
      summary = 'Мангальная зона ' + f1(L) + ' × ' + f1(D) + ' м';
      R('Труба 60×40 на каркас', f1(frameM) + ' м');
      R('Лист 3 мм на столешницу', f1(steelArea) + ' м²');
      if (woodArea > 0) R('Дерево на рабочую зону', f1(woodArea) + ' м²');
      R('Огнеупорная обшивка (кирпич/плитка)', f1(fireArea) + ' м²');
      R('Лист 4 мм на под мангала', f1(L * D * 0.5) + ' м²');
      if (canopy) { R('Навес: труба на каркас и стойки', f1(canopyM) + ' м'); R('Кровля навеса', f1(L * (D + 0.4) * 1.05) + ' м²'); }
      R('Дымосборник / зонт, лист 2 мм', f1(L * 0.8) + ' м²');
      seam = frameM * 0.2 + steelArea * 3 + canopyM * 0.14;
      paint = frameM * 0.2 + steelArea * 2 + canopyM * 0.16;
    }

    if (currentCat === 'stairs') {
      const H = n('h'), W = n('w');
      const rise = 0.18;
      const steps = up(H / rise);
      const run = 0.28;
      const length = Math.sqrt(Math.pow(steps * run, 2) + H * H);
      const kos = s('kos') === '1' ? 1 : 2;
      const kosM = length * kos * 1.05;
      const bracketM = steps * (W * 0.9 + 0.4);
      const railSides = s('rail') === 'both' ? 2 : (s('rail') === 'one' ? 1 : 0);
      const railM = railSides * length * 1.05;
      const balusters = railSides * (up(length / 1.0) + 1);
      const woodArea = steps * W * 0.3;
      const woodName = s('wood') === 'oak' ? 'лиственница 40 мм' : (s('wood') === 'shield' ? 'щит 40 мм' : 'сосна или кедр 40 мм');
      summary = 'Лестница на высоту ' + f1(H) + ' м, марш ' + f1(W) + ' м';
      R('Ступеней', steps + ' шт');
      R('Косоур 100×50 (' + kos + ' шт)', f1(kosM) + ' м');
      R('Кобылки и площадки под ступени', f1(bracketM) + ' м');
      R('Проступи, ' + woodName, f1(woodArea) + ' м²');
      R('Объём древесины', f2(woodArea * 0.04) + ' м³');
      if (railM > 0) { R('Поручень и стойки перил', f1(railM) + ' м'); R('Балясины / заполнение', balusters + ' шт'); }
      R('Болты М10 на ступени', (steps * 4) + ' шт');
      R('Анкеры крепления косоура', (kos * 6) + ' шт');
      seam = kosM * 0.3 + bracketM * 0.16 + railM * 0.14;
      paint = kosM * 0.3 + bracketM * 0.16 + railM * 0.14;
    }

    if (currentCat === 'furniture') {
      const t = s('type'), W = n('w') / 100, D = n('d') / 100, H = n('hh') / 100, sh = Math.max(1, Math.round(n('shelves')));
      const legs = t === 'bench' ? 4 : (t === 'shelf' ? 4 : 4);
      const frameM = legs * H + (W + D) * 2 * (t === 'shelf' ? sh : 1) + (t === 'shelf' ? 0 : (W + D)) + W * 2 * 0.5;
      const woodArea = t === 'shelf' ? W * D * sh : W * D;
      const thick = s('wood') === 'ply' ? 0.018 : (s('wood') === 'shield' ? 0.028 : 0.04);
      const names = { table: 'Стол', shelf: 'Стеллаж', bench: 'Скамья', bar: 'Барная стойка' };
      summary = names[t] + ' ' + i0(W * 100) + '×' + i0(D * 100) + '×' + i0(H * 100) + ' см';
      R('Труба 40×20 / 50×25 на каркас', f1(frameM) + ' м');
      R('Опор (ножек)', legs + ' шт');
      R('Площадь дерева', f2(woodArea) + ' м²');
      R('Объём древесины', f2(woodArea * thick) + ' м³');
      R('Мебельные болты / уголки', i0(legs * 4 + sh * 8) + ' шт');
      R('Подпятники регулируемые', legs + ' шт');
      R('Масло или лак по дереву', f2(woodArea * 0.12) + ' л');
      seam = frameM * 0.12;
      paint = frameM * 0.12;
      extras.push({ label: 'Порошковая окраска каркаса', value: f1(frameM * 0.12) + ' м²' });
    }

    if (currentCat === 'heating') {
      const S = n('s'), floors = Math.max(1, Math.round(n('floors'))), rooms = Math.max(1, Math.round(n('rooms')));
      const секция = s('rad') === 'cast' ? 160 : (s('rad') === 'al' ? 185 : 180);
      const dhw = s('dhw') === 'yes';
      let kw = (S / 10) * 1.75;
      if (dhw) kw *= 1.25;
      const need = S * 100;
      const sections = up(need / секция);
      const sys = s('sys');
      const pipeM = sys === 'col' ? rooms * 2 * (Math.sqrt(S) * 0.9) * 1.15 : Math.sqrt(S) * 4 * floors * 1.4 * (sys === 'two' ? 2 : 1);
      const volume = pipeM * 0.35 + sections * 0.4 + 30;
      const tank = volume * 0.11;
      const floorArea = n('floor');
      summary = 'Дом ' + i0(S) + ' м², ' + floors + ' эт., ' + rooms + ' комнат' + (dhw ? ', с ГВС' : '');
      R('Мощность котла', f1(kw) + ' кВт');
      R('Секций радиаторов, всего', sections + ' шт');
      R('В среднем на комнату', up(sections / rooms) + ' секций');
      R('Труба отопления', f1(pipeM) + ' м');
      R('Фитинги, тройники, уголки', i0(pipeM * 0.9 + rooms * 6) + ' шт');
      R('Краны шаровые на радиаторы', (rooms * 2 + 4) + ' шт');
      R('Термоголовки', rooms + ' шт');
      R('Кронштейны радиаторов', (rooms * 3) + ' шт');
      R('Расширительный бак', i0(tank) + ' л');
      R('Насос циркуляционный', (sys === 'col' ? 2 : 1) + ' шт');
      R('Группа безопасности и фильтр', '1 компл');
      if (sys === 'col') R('Коллектор с расходомерами', rooms + ' контуров');
      if (floorArea > 0) {
        R('Тёплый пол: труба 16 мм, шаг 15 см', f1(floorArea / 0.15 * 1.1) + ' м');
        R('Тёплый пол: маты и лента', f1(floorArea) + ' м²');
      }
      extras.push({ label: 'Теплоизоляция трубы', value: f1(pipeM * 0.6) + ' м' });
      extras.push({ label: 'ФУМ-лента, паста, лён', value: i0(pipeM / 6) + ' компл' });
      extras.push({ label: 'Крепёж трубы (клипсы)', value: i0(pipeM * 2.2) + ' шт' });
      extras.push({ label: 'Теплоноситель', value: i0(volume) + ' л' });
    }

    if (currentCat === 'water') {
      const pts = Math.max(1, Math.round(n('points'))), dist = n('dist'), floors = Math.max(1, Math.round(n('floors'))), people = Math.max(1, Math.round(n('people')));
      const pipeM = pts * dist * 1.15 + floors * 6;
      const mainD = pts > 10 ? '32–40 мм' : '25–32 мм';
      const fittings = up(pts * 2.5);
      const acc = pts <= 5 ? 24 : (pts <= 10 ? 50 : 100);
      const src = s('src');
      const heater = s('heater');
      summary = (src === 'well' ? 'Скважина' : src === 'pit' ? 'Колодец' : 'Центральный ввод') + ', ' + pts + ' точек, ' + floors + ' эт.';
      R('Труба магистрали ' + mainD, f1(pipeM * 0.45) + ' м');
      R('Труба отводов 16–20 мм', f1(pipeM * 0.55) + ' м');
      R('Фитинги, тройники, уголки', fittings + ' шт');
      R('Краны шаровые на точки', (pts + 3) + ' шт');
      R('Коллектор распределительный', (pts > 6 ? 2 : 1) + ' шт');
      if (src !== 'city') { R('Насос (скважинный / станция)', '1 шт'); R('Гидроаккумулятор', acc + ' л'); R('Кабель питания насоса и трос', f1(dist * 1.5 + floors * 4) + ' м'); }
      if (src === 'well') R('Обсадная труба и головка', '1 компл');
      R('Фильтры', (s('filter') === 'three' ? 3 : s('filter') === 'two' ? 2 : 1) + ' ступени');
      if (heater === 'tank') R('Бойлер накопительный', i0(Math.max(50, people * 40)) + ' л');
      if (heater === 'flow') R('Проточный водонагреватель', '1 шт (6–8 кВт)');
      R('Смесители и подводка', pts + ' компл');
      extras.push({ label: 'ФУМ-лента и уплотнители', value: i0(fittings / 5) + ' компл' });
      extras.push({ label: 'Утеплитель на ввод', value: f1(dist + 4) + ' м' });
      extras.push({ label: 'Крепёж трубы (клипсы)', value: i0(pipeM * 2) + ' шт' });
    }

    if (currentCat === 'power') {
      const so = Math.max(0, Math.round(n('sockets'))), li = Math.max(0, Math.round(n('lights'))), dist = n('dist'), hv = Math.max(0, Math.round(n('heavy')));
      const groupsSo = up(so / 6), groupsLi = up(li / 8);
      const cable25 = so * dist * 0.55 * 1.15 + groupsSo * dist;
      const cable15 = li * dist * 0.5 * 1.15 + groupsLi * dist;
      const cable4 = hv * dist * 1.15;
      const breakers = groupsSo + groupsLi + hv + 1;
      summary = so + ' розеток, ' + li + ' точек света, ' + hv + ' мощных потребителей';
      R('Кабель ВВГнг 3×2,5 (розетки)', f1(cable25) + ' м');
      R('Кабель ВВГнг 3×1,5 (свет)', f1(cable15) + ' м');
      if (cable4 > 0) R('Кабель ВВГнг 3×4 (котёл, насос)', f1(cable4) + ' м');
      R('Групп розеток / света', groupsSo + ' / ' + groupsLi);
      R('Автоматы в щит', breakers + ' шт');
      R('УЗО или дифавтоматы', (groupsSo + hv) + ' шт');
      R('Щит на модулей', up((breakers + groupsSo + hv + 2) * 1.3) + ' мод');
      R('Подрозетники', (so + li) + ' шт');
      R('Розетки и выключатели', (so + li) + ' шт');
      if (s('hidden') === 'pipe') R('Гофра или кабель-канал', f1((cable25 + cable15 + cable4) * 0.9) + ' м');
      else R('Штробление под кабель', f1((cable25 + cable15) * 0.5) + ' м');
      if (s('ground') === 'yes') { R('Контур заземления: уголок 50×5', '9 м'); R('Полоса 40×4 на обвязку', '6 м'); }
      extras.push({ label: 'Гильзы, клеммы Wago', value: i0((so + li) * 3) + ' шт' });
      extras.push({ label: 'Дюбель-хомуты и крепёж', value: i0((cable25 + cable15) * 2) + ' шт' });
      extras.push({ label: 'Маркировка и изолента', value: '1 компл' });
      seam = s('ground') === 'yes' ? 9 * 0.2 : 0;
      paint = 0;
    }

    if (seam > 0) {
      extras.unshift({ label: 'Суммарная длина швов', value: f1(seam) + ' м' });
      extras.push({ label: 'Электроды ⌀3 мм (МР-3 / ОК 46)', value: '≈ ' + f1(seam * 0.09 * 1.25) + ' кг' });
      extras.push({ label: 'Диски отрезные / зачистные', value: up(seam / 3.5) + ' + ' + up(seam / 4) + ' шт' });
    }
    if (paint > 0) {
      extras.push({ label: 'Площадь окраски', value: f1(paint) + ' м²' });
      extras.push({ label: 'Грунт + эмаль по металлу', value: f1(paint * 0.135) + ' кг + ' + f1(paint * 0.22) + ' кг' });
    }
    if (!extras.length) extras.push({ label: 'Расходники по этой категории', value: 'по смете после замера' });

    return { rows, extras, summary, cut };
  }

window.CALC = { CATS, buildSheet };
