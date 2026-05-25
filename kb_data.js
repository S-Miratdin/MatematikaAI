'use strict';
/* ============================================================
   kb_data.js — School mathematics knowledge base
   24 topics, 5 categories, with SVG diagrams
============================================================ */

// ── SVG helpers ───────────────────────────────────────────────
function _axes(cx, cy, hw, hh, lblX = 'x', lblY = 'y') {
  return `
<line x1="${cx-hw}" y1="${cy}" x2="${cx+hw}" y2="${cy}" stroke="var(--text3)" stroke-width="1"/>
<polygon points="${cx+hw},${cy} ${cx+hw-7},${cy-3} ${cx+hw-7},${cy+3}" fill="var(--text3)"/>
<line x1="${cx}" y1="${cy+hh}" x2="${cx}" y2="${cy-hh}" stroke="var(--text3)" stroke-width="1"/>
<polygon points="${cx},${cy-hh} ${cx-3},${cy-hh+7} ${cx+3},${cy-hh+7}" fill="var(--text3)"/>
<text x="${cx+hw-4}" y="${cy-8}" fill="var(--text3)" font-size="11" font-family="sans-serif">${lblX}</text>
<text x="${cx+7}" y="${cy-hh+12}" fill="var(--text3)" font-size="11" font-family="sans-serif">${lblY}</text>`;
}

function _ticks(cx, cy, sx, sy, xr, yr) {
  let t = '';
  for (let x = -xr; x <= xr; x++) {
    if (x === 0) continue;
    const px = cx + x * sx;
    t += `<line x1="${px}" y1="${cy-3}" x2="${px}" y2="${cy+3}" stroke="var(--text3)" stroke-width="1"/>`;
    if (Math.abs(x) <= 3)
      t += `<text x="${px}" y="${cy+14}" fill="var(--text3)" font-size="10" font-family="monospace" text-anchor="middle">${x}</text>`;
  }
  for (let y = -yr; y <= yr; y++) {
    if (y === 0) continue;
    const py = cy - y * sy;
    if (py < 5 || py > 175) continue;
    t += `<line x1="${cx-3}" y1="${py}" x2="${cx+3}" y2="${py}" stroke="var(--text3)" stroke-width="1"/>`;
    t += `<text x="${cx-6}" y="${py+4}" fill="var(--text3)" font-size="10" font-family="monospace" text-anchor="end">${y}</text>`;
  }
  return t;
}

function _curve(fn, x1, x2, N, cx, cy, sx, sy) {
  const segs = [];
  let current = [];
  for (let i = 0; i <= N; i++) {
    const x = x1 + (x2 - x1) * i / N;
    const y = fn(x);
    if (!isFinite(y) || Math.abs(y) > 1e4) {
      if (current.length > 1) segs.push(current);
      current = [];
    } else {
      const px = cx + x * sx, py = cy - y * sy;
      current.push(`${px.toFixed(1)},${py.toFixed(1)}`);
    }
  }
  if (current.length > 1) segs.push(current);
  return segs.map(pts =>
    `<polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>`
  ).join('');
}

function _svg(body, w = 260, h = 180) {
  return `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">${body}</svg>`;
}

function _lbl(x, y, text, color = 'var(--accent)', size = 13, anchor = 'middle') {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="'DM Mono',monospace" font-weight="600" text-anchor="${anchor}">${text}</text>`;
}

function _dim(x, y, text, color = 'var(--text2)', size = 11) {
  return `<text x="${x}" y="${y}" fill="${color}" font-size="${size}" font-family="'DM Mono',monospace" text-anchor="middle">${text}</text>`;
}

function _rightAngle(px, py, size = 14) {
  return `<path d="M${px},${py-size} L${px+size},${py-size} L${px+size},${py}" fill="none" stroke="var(--text2)" stroke-width="1.3"/>`;
}

// ════════════════════════════════════════════════════════════
//  KNOWLEDGE BASE DATA
// ════════════════════════════════════════════════════════════
const KB_DATA = [

  // ─── ПЛАНИМЕТРИЯ ────────────────────────────────────────────

  {
    id: 'right_triangle',
    category: 'Геометрия',      category_uz: 'Geometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '7-8 класс', difficulty: 'easy',
    title: 'Прямоугольный треугольник',
    title_uz: "To'g'ri burchakli uchburchak",
    formula: 'a² + b² = c²',
    description: 'Теорема Пифагора: в прямоугольном треугольнике квадрат гипотенузы равен сумме квадратов катетов. Прямой угол обозначается символом ∟ и равен 90°. Стороны при прямом угле называются катетами (a, b), а сторона напротив — гипотенузой (c). Сумма острых углов: α + β = 90°.',
    description_uz: "Pifagor teoremasi: to'g'ri burchakli uchburchakda gipotenuza kvadrati katetlar kvadratlari yig'indisiga teng. To'g'ri burchak ∟ belgisi bilan belgilanadi va 90° ga teng. To'g'ri burchak yonidagi tomonlar kateter (a, b), qarama-qarshi tomon esa gipotenuza (c) deyiladi. O'tkir burchaklar yig'indisi: α + β = 90°.",
    properties: [
      { name: 'Площадь',         name_uz: 'Yuza',                        val: 'S = a·b / 2' },
      { name: 'Гипотенуза',      name_uz: 'Gipotenuza',                  val: 'c = √(a² + b²)' },
      { name: 'Высота к c',      name_uz: 'c ga balandlik',              val: 'h = a·b / c' },
      { name: 'sin α',           name_uz: 'sin α',                       val: 'sin α = a / c' },
      { name: 'cos α',           name_uz: 'cos α',                       val: 'cos α = b / c' },
    ],
    svg: _svg(`
      <polygon points="30,155 30,35 220,155" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      ${_rightAngle(30, 155)}
      <line x1="30" y1="35" x2="220" y2="155" stroke="var(--accent)" stroke-width="2.2"/>
      ${_lbl(16, 98, 'b', 'var(--green)')}
      ${_lbl(125, 173, 'a', 'var(--green)')}
      ${_lbl(136, 88, 'c', 'var(--accent)')}
      ${_dim(42, 52, 'α', 'var(--text2)', 12)}
      ${_dim(198, 152, 'β', 'var(--text2)', 12)}
    `),
  },

  {
    id: 'triangle',
    category: 'Геометрия',      category_uz: 'Geometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '7-8 класс', difficulty: 'easy',
    title: 'Произвольный треугольник',
    title_uz: 'Ixtiyoriy uchburchak',
    formula: 'S = ½ · a · h',
    description: 'Треугольник — многоугольник с тремя сторонами и тремя углами. Сумма углов треугольника всегда равна 180°. Площадь вычисляется через основание и высоту, опущенную на него. Медиана делит противоположную сторону пополам. Биссектриса делит угол пополам.',
    description_uz: "Uchburchak — uchta tomoni va uchta burchagi bor ko'pburchak. Uchburchak burchaklari yig'indisi doim 180° ga teng. Yuza asos va unga tushirilgan balandlik orqali hisoblanadi. Median qarama-qarshi tomonni ikkiga bo'ladi. Bissektrisa burchakni ikkiga bo'ladi.",
    properties: [
      { name: 'Сумма углов',     name_uz: "Burchaklar yig'indisi",  val: 'α + β + γ = 180°' },
      { name: 'Площадь',         name_uz: 'Yuza',                   val: 'S = ½·a·h_a' },
      { name: 'Формула Герона',  name_uz: 'Geron formulasi',        val: 'S = √(p(p-a)(p-b)(p-c))' },
      { name: 'Полупериметр',    name_uz: 'Yarim perimetr',         val: 'p = (a+b+c)/2' },
      { name: 'Периметр',        name_uz: 'Perimetr',               val: 'P = a + b + c' },
    ],
    svg: _svg(`
      <polygon points="30,155 130,30 220,155" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="130" y1="30" x2="130" y2="155" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="5,4"/>
      ${_lbl(125, 20, 'B')}
      ${_lbl(16, 160, 'A')}
      ${_lbl(226, 160, 'C')}
      ${_lbl(78, 100, 'c', 'var(--green)')}
      ${_lbl(180, 100, 'b', 'var(--green)')}
      ${_lbl(130, 173, 'a', 'var(--green)')}
      ${_dim(140, 95, 'h', 'var(--text2)')}
    `),
  },

  {
    id: 'circle',
    category: 'Геометрия',      category_uz: 'Geometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '7-8 класс', difficulty: 'easy',
    title: 'Окружность и круг',
    title_uz: 'Aylana va doira',
    formula: 'L = 2πr,  S = πr²',
    description: 'Окружность — замкнутая кривая, все точки которой равноудалены от центра. Расстояние от центра до любой точки окружности — радиус (r). Отрезок через центр, соединяющий две точки окружности — диаметр (d = 2r). Число π ≈ 3.14159…',
    description_uz: "Aylana — barcha nuqtalari markazdan teng masofada joylashgan yopiq egri chiziq. Markazdan aylanadagi istalgan nuqtaga bo'lgan masofa — radius (r). Markaz orqali o'tib aylanadagi ikki nuqtani bog'lovchi kesma — diametr (d = 2r). π ≈ 3.14159…",
    properties: [
      { name: 'Длина окружности', name_uz: 'Aylananing uzunligi',  val: 'L = 2πr = πd' },
      { name: 'Площадь круга',    name_uz: 'Doira yuzi',           val: 'S = πr²' },
      { name: 'Диаметр',          name_uz: 'Diametr',              val: 'd = 2r' },
      { name: 'Длина дуги',       name_uz: 'Yoy uzunligi',         val: 'l = πr·α/180°' },
      { name: 'Площадь сектора',  name_uz: 'Sektor yuzi',          val: 'S = πr²·α/360°' },
    ],
    svg: _svg(`
      <circle cx="130" cy="90" r="72" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8"/>
      <line x1="130" y1="90" x2="130" y2="18" stroke="var(--accent)" stroke-width="2"/>
      <line x1="58" y1="90" x2="202" y2="90" stroke="var(--green)" stroke-width="1.8" stroke-dasharray="6,3"/>
      <circle cx="130" cy="90" r="4" fill="var(--accent)"/>
      ${_lbl(148, 58, 'r', 'var(--accent)')}
      ${_lbl(165, 97, 'd', 'var(--green)')}
      ${_dim(130, 178, 'O', 'var(--text2)', 12)}
    `),
  },

  {
    id: 'rectangle',
    category: 'Геометрия',      category_uz: 'Geometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '5-6 класс', difficulty: 'easy',
    title: 'Прямоугольник',
    title_uz: "To'g'ri to'rtburchak",
    formula: 'S = a · b',
    description: 'Прямоугольник — четырёхугольник, у которого все углы прямые (90°). Противоположные стороны параллельны и равны. Диагонали прямоугольника равны и точкой пересечения делятся пополам. Квадрат — частный случай прямоугольника с равными сторонами.',
    description_uz: "To'g'ri to'rtburchak — barcha burchaklari to'g'ri (90°) bo'lgan to'rtburchak. Qarama-qarshi tomonlar parallel va teng. To'g'ri to'rtburchak diagonallari teng va kesishish nuqtasida ikkiga bo'linadi. Kvadrat — tomonlari teng to'g'ri to'rtburchakning maxsus holi.",
    properties: [
      { name: 'Площадь',    name_uz: 'Yuza',       val: 'S = a · b' },
      { name: 'Периметр',   name_uz: 'Perimetr',   val: 'P = 2(a + b)' },
      { name: 'Диагональ',  name_uz: 'Diagonal',   val: 'd = √(a² + b²)' },
      { name: 'Квадрат',    name_uz: 'Kvadrat',    val: 'a = b → S = a²,  d = a√2' },
    ],
    svg: _svg(`
      <rect x="35" y="45" width="190" height="105" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" rx="2"/>
      <line x1="35" y1="45" x2="225" y2="150" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="5,4"/>
      ${_rightAngle(35, 150, 12)}
      ${_lbl(130, 175, 'a', 'var(--green)')}
      ${_lbl(16, 100, 'b', 'var(--green)')}
      ${_lbl(148, 88, 'd', 'var(--text2)')}
    `),
  },

  {
    id: 'trapezoid',
    category: 'Геометрия',      category_uz: 'Geometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '7-8 класс', difficulty: 'medium',
    title: 'Трапеция',
    title_uz: 'Trapetsiya',
    formula: 'S = ½(a + b) · h',
    description: 'Трапеция — четырёхугольник, у которого ровно две стороны параллельны. Параллельные стороны называются основаниями (a и b). Расстояние между основаниями — высота (h). Средняя линия трапеции параллельна основаниям и равна их полусумме: m = (a + b)/2.',
    description_uz: "Trapetsiya — faqat ikkita tomoni parallel bo'lgan to'rtburchak. Parallel tomonlar asoslar (a va b) deyiladi. Asoslar orasidagi masofa — balandlik (h). Trapetsiyaning o'rta chizig'i asoslarga parallel va ularning yig'indisining yarmiga teng: m = (a + b)/2.",
    properties: [
      { name: 'Площадь',         name_uz: 'Yuza',                    val: 'S = (a + b)·h / 2' },
      { name: 'Средняя линия',   name_uz: "O'rta chiziq",            val: 'm = (a + b) / 2' },
      { name: 'Периметр',        name_uz: 'Perimetr',                val: 'P = a + b + c + d' },
      { name: 'Равнобедренная',  name_uz: 'Teng yonli trapetsiya',   val: 'c = d' },
    ],
    svg: _svg(`
      <polygon points="40,155 75,45 195,45 225,155" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="75" y1="45" x2="75" y2="155" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="5,4"/>
      ${_rightAngle(75, 155, 12)}
      ${_lbl(135, 38, 'b', 'var(--green)')}
      ${_lbl(133, 173, 'a', 'var(--green)')}
      ${_lbl(58, 102, 'h', 'var(--text2)')}
      ${_lbl(47, 100, 'c', 'var(--accent)')}
      ${_lbl(223, 100, 'd', 'var(--accent)')}
    `),
  },

  {
    id: 'parallelogram',
    category: 'Геометрия',      category_uz: 'Geometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '7-8 класс', difficulty: 'medium',
    title: 'Параллелограмм',
    title_uz: 'Parallelogramm',
    formula: 'S = a · h',
    description: 'Параллелограмм — четырёхугольник, у которого противоположные стороны параллельны попарно и равны. Диагонали параллелограмма точкой пересечения делятся пополам. Площадь равна произведению основания на высоту. Ромб — параллелограмм с равными сторонами.',
    description_uz: "Parallelogramm — qarama-qarshi tomonlari juft-juft parallel va teng bo'lgan to'rtburchak. Parallelogramm diagonallari kesishish nuqtasida ikkiga bo'linadi. Yuza asosning balandlikka ko'paytmasiga teng. Romb — tomonlari teng parallelogramm.",
    properties: [
      { name: 'Площадь',    name_uz: 'Yuza',       val: 'S = a · h = a·b·sin α' },
      { name: 'Периметр',   name_uz: 'Perimetr',   val: 'P = 2(a + b)' },
      { name: 'Ромб',       name_uz: 'Romb',       val: 'S = d₁·d₂ / 2 (диагонали)' },
      { name: 'Углы',       name_uz: 'Burchaklar', val: 'α + β = 180°' },
    ],
    svg: _svg(`
      <polygon points="50,155 95,45 220,45 175,155" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="95" y1="45" x2="95" y2="155" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="5,4"/>
      ${_rightAngle(95, 155, 12)}
      ${_lbl(157, 38, 'a', 'var(--green)')}
      ${_lbl(112, 173, 'a', 'var(--green)')}
      ${_lbl(65, 100, 'b', 'var(--accent)')}
      ${_lbl(78, 102, 'h', 'var(--text2)')}
    `),
  },

  // ─── СТЕРЕОМЕТРИЯ ────────────────────────────────────────────

  {
    id: 'cube',
    category: 'Стереометрия',   category_uz: 'Stereometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '9-10 класс', difficulty: 'medium',
    title: 'Куб',
    title_uz: 'Kub',
    formula: 'V = a³,  S = 6a²',
    description: 'Куб — правильный многогранник, все грани которого — квадраты. У куба 6 граней, 12 рёбер и 8 вершин. Все рёбра куба равны (длина a). Диагональ куба соединяет две противоположные вершины. Куб — частный случай прямоугольного параллелепипеда.',
    description_uz: "Kub — barcha yoqlari kvadratlardan iborat to'g'ri ko'pburchak. Kubning 6 ta yoqi, 12 ta qirrasi va 8 ta uchi bor. Kubning barcha qirralari teng (uzunlik a). Kub diagonali ikki qarama-qarshi uchni bog'laydi. Kub — to'g'ri burchakli parallelepiped ning maxsus holi.",
    properties: [
      { name: 'Объём',             name_uz: 'Hajm',            val: 'V = a³' },
      { name: 'Площадь пов-ти',   name_uz: 'Sirt yuzi',       val: 'S = 6a²' },
      { name: 'Диагональ куба',   name_uz: 'Kub diagonali',   val: 'd = a√3' },
      { name: 'Диагональ грани',  name_uz: "Yoq diagonali",   val: 'd₀ = a√2' },
    ],
    svg: _svg(`
      <polygon points="60,155 60,75 130,45 200,75 200,155 130,125" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <polygon points="60,75 130,45 200,75 130,105" fill="var(--surface3)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <polygon points="200,75 200,155 130,125 130,45" fill="var(--surface2)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <line x1="60" y1="155" x2="130" y2="125" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="4,3"/>
      <line x1="130" y1="125" x2="130" y2="45" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="4,3"/>
      <line x1="130" y1="125" x2="200" y2="155" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="4,3"/>
      ${_lbl(35, 118, 'a', 'var(--accent)')}
      ${_lbl(90, 50, 'a', 'var(--accent)')}
      ${_lbl(208, 120, 'a', 'var(--accent)')}
    `),
  },

  {
    id: 'cylinder',
    category: 'Стереометрия',   category_uz: 'Stereometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '9-10 класс', difficulty: 'medium',
    title: 'Цилиндр',
    title_uz: 'Silindr',
    formula: 'V = πr²h,  S = 2πr(r + h)',
    description: 'Цилиндр — тело вращения, образованное вращением прямоугольника вокруг одной из его сторон. Основания цилиндра — два равных круга радиуса r. Высота цилиндра (h) — расстояние между основаниями. При развёртке боковая поверхность образует прямоугольник.',
    description_uz: "Silindr — to'g'ri to'rtburchakni uning bir tomoni atrofida aylantirish natijasida hosil bo'lgan aylanish jismi. Silindr asoslari — r radiusli ikki teng aylana. Silindrning balandligi (h) — asoslar orasidagi masofa. Yoyilmada yon sirt to'g'ri to'rtburchak hosil qiladi.",
    properties: [
      { name: 'Объём',             name_uz: 'Hajm',          val: 'V = πr²h' },
      { name: 'Боковая пов-ть',   name_uz: 'Yon sirt',      val: 'S_б = 2πrh' },
      { name: 'Полная пов-ть',    name_uz: "To'liq sirt",   val: 'S = 2πr(r + h)' },
      { name: 'Осевое сечение',   name_uz: "O'q kesimi",    val: 'прямоугольник 2r × h' },
    ],
    svg: _svg(`
      <ellipse cx="130" cy="145" rx="80" ry="22" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8"/>
      <rect x="50" y="55" width="160" height="90" fill="var(--accent-soft)" stroke="none"/>
      <line x1="50" y1="55" x2="50" y2="145" stroke="var(--text2)" stroke-width="1.8"/>
      <line x1="210" y1="55" x2="210" y2="145" stroke="var(--text2)" stroke-width="1.8"/>
      <ellipse cx="130" cy="55" rx="80" ry="22" fill="var(--surface3)" stroke="var(--text2)" stroke-width="1.8"/>
      <line x1="130" y1="55" x2="210" y2="55" stroke="var(--accent)" stroke-width="1.8"/>
      <line x1="210" y1="55" x2="210" y2="145" stroke="var(--green)" stroke-width="1.8" stroke-dasharray="5,3"/>
      ${_lbl(170, 48, 'r', 'var(--accent)')}
      ${_lbl(222, 100, 'h', 'var(--green)')}
    `),
  },

  {
    id: 'cone',
    category: 'Стереометрия',   category_uz: 'Stereometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '9-10 класс', difficulty: 'medium',
    title: 'Конус',
    title_uz: 'Konus',
    formula: 'V = ⅓πr²h',
    description: 'Конус — тело вращения, образованное вращением прямоугольного треугольника вокруг катета. Основание конуса — круг радиуса r. Вершина конуса — точка, равноудалённая от всей окружности основания. Образующая (l) — отрезок от вершины до точки на окружности.',
    description_uz: "Konus — to'g'ri burchakli uchburchakni uning katetidan aylantirib hosil bo'lgan aylanish jismi. Konus asosi — r radiusli aylana. Konus uchi — asos aylanasidan teng masofada joylashgan nuqta. Yasovchi (l) — uchdan asos aylanasidagi nuqtaga tortilgan kesma.",
    properties: [
      { name: 'Объём',             name_uz: 'Hajm',          val: 'V = πr²h / 3' },
      { name: 'Боковая пов-ть',   name_uz: 'Yon sirt',      val: 'S_б = πrl' },
      { name: 'Образующая',       name_uz: 'Yasovchi',      val: 'l = √(r² + h²)' },
      { name: 'Полная пов-ть',    name_uz: "To'liq sirt",   val: 'S = πr(r + l)' },
    ],
    svg: _svg(`
      <ellipse cx="130" cy="148" rx="85" ry="22" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8"/>
      <line x1="45" y1="148" x2="130" y2="28" stroke="var(--text2)" stroke-width="1.8"/>
      <line x1="215" y1="148" x2="130" y2="28" stroke="var(--accent)" stroke-width="1.8"/>
      <line x1="130" y1="28" x2="130" y2="148" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <line x1="130" y1="148" x2="215" y2="148" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <circle cx="130" cy="28" r="3" fill="var(--accent)"/>
      ${_lbl(174, 158, 'r', 'var(--accent)')}
      ${_lbl(143, 92, 'h', 'var(--green)')}
      ${_lbl(184, 90, 'l', 'var(--text2)')}
    `),
  },

  {
    id: 'sphere',
    category: 'Стереометрия',   category_uz: 'Stereometriya',
    school_section: 'Геометрия', task_type: 'Фигуры', grade: '9-10 класс', difficulty: 'hard',
    title: 'Шар и сфера',
    title_uz: 'Shar va sfera',
    formula: 'V = 4/3·πr³,  S = 4πr²',
    description: 'Сфера — множество точек в пространстве, равноудалённых от одной точки (центра) на расстояние r. Шар — тело, ограниченное сферой. Любое сечение шара плоскостью — круг. Наибольшее сечение (через центр) — большой круг радиуса r.',
    description_uz: "Sfera — fazodagi bir nuqtadan (markazdan) r masofada joylashgan nuqtalar to'plami. Shar — sfera bilan chegaralangan jism. Sharning tekislik bilan istalgan kesimi — doira. Eng katta kesim (markaz orqali) — r radiusli katta aylana.",
    properties: [
      { name: 'Объём шара',      name_uz: 'Shar hajmi',        val: 'V = 4πr³ / 3' },
      { name: 'Площадь сферы',   name_uz: 'Sfera yuzi',        val: 'S = 4πr²' },
      { name: 'Диаметр',         name_uz: 'Diametr',           val: 'd = 2r' },
      { name: 'Объём полушара',  name_uz: 'Yarim shar hajmi',  val: 'V = 2πr³ / 3' },
    ],
    svg: _svg(`
      <circle cx="130" cy="90" r="78" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8"/>
      <ellipse cx="130" cy="90" rx="78" ry="20" fill="none" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="5,4"/>
      <line x1="130" y1="90" x2="208" y2="90" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="130" cy="90" r="3.5" fill="var(--accent)"/>
      ${_lbl(172, 85, 'r', 'var(--accent)')}
      ${_dim(130, 178, 'O', 'var(--text2)', 12)}
    `),
  },

  // ─── АЛГЕБРА ─────────────────────────────────────────────────

  {
    id: 'linear_eq',
    category: 'Алгебра',   category_uz: 'Algebra',
    school_section: 'Алгебра', task_type: 'Уравнения', grade: '7-8 класс', difficulty: 'easy',
    title: 'Линейное уравнение',
    title_uz: 'Chiziqli tenglama',
    formula: 'ax + b = 0  →  x = −b/a',
    description: 'Линейное уравнение с одним неизвестным — уравнение вида ax + b = 0, где a ≠ 0. Имеет ровно одно решение: x = −b/a. При a = 0 уравнение не имеет решений (если b ≠ 0) или имеет бесконечно много (если b = 0). Система двух линейных уравнений решается подстановкой или сложением.',
    description_uz: "Bir noma'lumli chiziqli tenglama — ax + b = 0 ko'rinishidagi tenglama, bu yerda a ≠ 0. Faqat bitta yechimi bor: x = −b/a. a = 0 bo'lsa tenglama yechimga ega emas (b ≠ 0 bo'lsa) yoki cheksiz ko'p yechimga ega (b = 0 bo'lsa). Ikki chiziqli tenglamalar sistemasi almashtirish yoki qo'shish usuli bilan yechiladi.",
    properties: [
      { name: 'Решение',          name_uz: 'Yechim',            val: 'x = −b / a,  a ≠ 0' },
      { name: 'Система 2×2',      name_uz: '2×2 sistema',       val: 'подстановка / сложение' },
      { name: 'Определитель',     name_uz: 'Determinant',       val: 'D = a₁b₂ − a₂b₁' },
      { name: 'Число решений',    name_uz: "Yechimlar soni",    val: '1 (a≠0), ∞ (a=b=0), 0 (a=0,b≠0)' },
    ],
    svg: _svg(`
      ${_axes(130, 120, 115, 105)}
      ${_ticks(130, 120, 28, 28, 4, 3)}
      ${_curve(x => -0.6*x + 1.5, -4, 4, 60, 130, 120, 28, 28)}
      ${_lbl(212, 50, 'y = ax+b', 'var(--accent)', 11)}
    `),
  },

  {
    id: 'quadratic_eq',
    category: 'Алгебра',   category_uz: 'Algebra',
    school_section: 'Алгебра', task_type: 'Уравнения', grade: '8-9 класс', difficulty: 'medium',
    title: 'Квадратное уравнение',
    title_uz: 'Kvadrat tenglama',
    formula: 'ax² + bx + c = 0',
    description: 'Квадратное уравнение — уравнение вида ax² + bx + c = 0, где a ≠ 0. Дискриминант D = b² − 4ac определяет количество корней: если D > 0 — два различных корня, D = 0 — один корень (двукратный), D < 0 — вещественных корней нет. По формуле Виета: x₁ + x₂ = −b/a, x₁·x₂ = c/a.',
    description_uz: "Kvadrat tenglama — ax² + bx + c = 0 ko'rinishidagi tenglama, bu yerda a ≠ 0. Diskriminant D = b² − 4ac ildizlar sonini aniqlaydi: D > 0 — ikki xil ildiz, D = 0 — bitta ildiz (ikki karra), D < 0 — haqiqiy ildiz yo'q. Viet formulasi: x₁ + x₂ = −b/a, x₁·x₂ = c/a.",
    properties: [
      { name: 'Дискриминант', name_uz: 'Diskriminant',       val: 'D = b² − 4ac' },
      { name: 'Корни',        name_uz: 'Ildizlar',           val: 'x₁,₂ = (−b ± √D) / 2a' },
      { name: 'Виет: сумма',  name_uz: "Viet: yig'indi",    val: 'x₁ + x₂ = −b/a' },
      { name: 'Виет: произв.',name_uz: "Viet: ko'paytma",   val: 'x₁ · x₂ = c/a' },
    ],
    svg: _svg(`
      ${_axes(130, 145, 115, 130)}
      ${_ticks(130, 145, 30, 25, 3, 4)}
      ${_curve(x => x*x - 2.5*x - 3, -2, 4.5, 80, 130, 145, 30, 25)}
      <circle cx="40" cy="145" r="4" fill="var(--green)"/>
      <circle cx="205" cy="145" r="4" fill="var(--green)"/>
      ${_lbl(40, 160, 'x₁', 'var(--green)', 11)}
      ${_lbl(205, 160, 'x₂', 'var(--green)', 11)}
      ${_lbl(215, 75, 'D>0', 'var(--text3)', 10)}
    `),
  },

  {
    id: 'arith_prog',
    category: 'Прогрессии',   category_uz: 'Progressiyalar',
    school_section: 'Алгебра', task_type: 'Прогрессии', grade: '9-10 класс', difficulty: 'medium',
    title: 'Арифметическая прогрессия',
    title_uz: 'Arifmetik progressiya',
    formula: 'aₙ = a₁ + (n−1)·d',
    description: 'Арифметическая прогрессия — последовательность, в которой каждый следующий член отличается от предыдущего на постоянное число d (разность прогрессии). Если d > 0 — возрастающая, d < 0 — убывающая, d = 0 — постоянная. Примеры: 2, 5, 8, 11… (d=3) и 10, 7, 4, 1… (d=−3).',
    description_uz: "Arifmetik progressiya — har bir keyingi had oldingiidan doimiy d (progressiya ayirmasi) ga farq qiladigan ketma-ketlik. d > 0 — o'suvchi, d < 0 — kamayuvchi, d = 0 — doimiy. Misollar: 2, 5, 8, 11… (d=3) va 10, 7, 4, 1… (d=−3).",
    properties: [
      { name: 'n-й член',       name_uz: 'n-chi had',              val: 'aₙ = a₁ + (n−1)d' },
      { name: 'Сумма n членов', name_uz: "n hadlar yig'indisi",    val: 'Sₙ = n(a₁ + aₙ)/2' },
      { name: 'Через разность', name_uz: 'Ayirma orqali',          val: 'Sₙ = n·a₁ + n(n−1)d/2' },
      { name: 'Средний член',   name_uz: "O'rtanchi had",          val: 'aₖ = (aₖ₋₁ + aₖ₊₁)/2' },
    ],
    svg: _svg(`
      ${_axes(30, 145, 10, 130)}
      <line x1="30" y1="145" x2="245" y2="145" stroke="var(--text3)" stroke-width="1"/>
      <polygon points="245,145 238,142 238,148" fill="var(--text3)"/>
      <text x="247" y="149" fill="var(--text3)" font-size="11" font-family="sans-serif">n</text>
      ${[1,2,3,4,5,6,7].map((n,i) => {
        const x = 48 + i * 30, h = 15 + i * 18, y = 145 - h;
        return `<rect x="${x-10}" y="${y}" width="20" height="${h}" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/>
                <text x="${x}" y="${y-5}" fill="var(--text2)" font-size="10" font-family="monospace" text-anchor="middle">a${n}</text>`;
      }).join('')}
      ${_dim(130, 172, 'd = const', 'var(--text3)', 10)}
    `),
  },

  {
    id: 'geom_prog',
    category: 'Прогрессии',   category_uz: 'Progressiyalar',
    school_section: 'Алгебра', task_type: 'Прогрессии', grade: '9-10 класс', difficulty: 'medium',
    title: 'Геометрическая прогрессия',
    title_uz: 'Geometrik progressiya',
    formula: 'bₙ = b₁ · qⁿ⁻¹',
    description: 'Геометрическая прогрессия — последовательность, в которой каждый следующий член получается умножением предыдущего на постоянное число q (знаменатель). При |q| > 1 — возрастает, при 0 < q < 1 — убывает к нулю. Применяется в расчётах процентов, вкладов, радиоактивного распада.',
    description_uz: "Geometrik progressiya — har bir keyingi had oldingiiga doimiy q (progressiya maxraji) ga ko'paytirib olinadigan ketma-ketlik. |q| > 1 bo'lsa — o'sadi, 0 < q < 1 bo'lsa — nolga kamayadi. Foizlar, omonat, radioaktiv parchalanish hisob-kitoblarida qo'llaniladi.",
    properties: [
      { name: 'n-й член',       name_uz: 'n-chi had',              val: 'bₙ = b₁ · qⁿ⁻¹' },
      { name: 'Сумма n членов', name_uz: "n hadlar yig'indisi",    val: 'Sₙ = b₁(qⁿ − 1)/(q − 1)' },
      { name: 'Бесконечная',    name_uz: 'Cheksiz qator',          val: 'S = b₁/(1−q), |q|<1' },
      { name: 'Средний член',   name_uz: "O'rtanchi had",          val: 'bₖ² = bₖ₋₁ · bₖ₊₁' },
    ],
    svg: _svg(`
      ${_axes(30, 155, 10, 140)}
      <line x1="30" y1="155" x2="245" y2="155" stroke="var(--text3)" stroke-width="1"/>
      <polygon points="245,155 238,152 238,158" fill="var(--text3)"/>
      <text x="247" y="159" fill="var(--text3)" font-size="11" font-family="sans-serif">n</text>
      ${[1,2,3,4,5,6].map((n,i) => {
        const x = 52 + i * 34, h = 6 * Math.pow(1.7, i), y = 155 - Math.min(h, 145);
        return `<rect x="${x-11}" y="${y}" width="22" height="${Math.min(h,145)}" fill="var(--accent-soft)" stroke="var(--accent)" stroke-width="1.5"/>
                <text x="${x}" y="${y-4}" fill="var(--text2)" font-size="10" font-family="monospace" text-anchor="middle">b${n}</text>`;
      }).join('')}
      ${_dim(130, 174, 'q = const', 'var(--text3)', 10)}
    `),
  },

  {
    id: 'powers',
    category: 'Степени',   category_uz: 'Darajalar',
    school_section: 'Алгебра', task_type: 'Степени', grade: '7-8 класс', difficulty: 'medium',
    title: 'Степени и корни',
    title_uz: 'Darajalar va ildizlar',
    formula: 'aⁿ,  √a = a^(1/2)',
    description: 'Степень aⁿ — произведение n множителей, каждый из которых равен a. Корень n-й степени — число, n-я степень которого равна a. Квадратный корень: √a = a^(½). Нулевая степень: a⁰ = 1 (a ≠ 0). Отрицательная: a⁻ⁿ = 1/aⁿ. Рациональная степень: aᵐ/ⁿ = ⁿ√(aᵐ).',
    description_uz: "aⁿ daraja — har biri a ga teng bo'lgan n ta ko'paytuvchi ko'paytmasi. n-darajali ildiz — n-darajasi a ga teng bo'lgan son. Kvadrat ildiz: √a = a^(½). Nol daraja: a⁰ = 1 (a ≠ 0). Manfiy daraja: a⁻ⁿ = 1/aⁿ. Ratsional daraja: aᵐ/ⁿ = ⁿ√(aᵐ).",
    properties: [
      { name: 'Произведение',  name_uz: "Ko'paytirish",      val: 'aᵐ · aⁿ = aᵐ⁺ⁿ' },
      { name: 'Деление',       name_uz: "Bo'lish",           val: 'aᵐ / aⁿ = aᵐ⁻ⁿ' },
      { name: 'Степень степ.', name_uz: 'Daraja darajasi',   val: '(aᵐ)ⁿ = aᵐⁿ' },
      { name: 'Корень',        name_uz: 'Ildiz',             val: '√(a·b) = √a·√b' },
      { name: 'Рацион. ст.',   name_uz: 'Ratsional daraja',  val: 'aᵐ/ⁿ = ⁿ√(aᵐ)' },
    ],
    svg: _svg(`
      <text x="130" y="50" text-anchor="middle" fill="var(--text2)" font-size="13" font-family="monospace">Свойства степеней</text>
      ${[
        ['aᵐ · aⁿ = aᵐ⁺ⁿ', 85],
        ['aᵐ / aⁿ = aᵐ⁻ⁿ', 110],
        ['(aᵐ)ⁿ  = aᵐⁿ', 135],
        ['(a·b)ⁿ = aⁿ·bⁿ', 160],
      ].map(([t, y]) =>
        `<text x="130" y="${y}" text-anchor="middle" fill="var(--accent)" font-size="14" font-family="monospace">${t}</text>`
      ).join('')}
    `),
  },

  // ─── ФУНКЦИИ ─────────────────────────────────────────────────

  {
    id: 'linear_fn',
    category: 'Функции',   category_uz: 'Funksiyalar',
    school_section: 'Алгебра', task_type: 'Функции', grade: '7-8 класс', difficulty: 'easy',
    title: 'Линейная функция',
    title_uz: 'Chiziqli funksiya',
    formula: 'y = kx + b',
    description: 'Линейная функция — функция вида y = kx + b. График — прямая линия. k — угловой коэффициент (наклон): при k > 0 функция возрастает, при k < 0 — убывает, при k = 0 — константа. b — значение при x = 0 (смещение по оси y). Нулём функции является x = −b/k.',
    description_uz: "Chiziqli funksiya — y = kx + b ko'rinishidagi funksiya. Grafigi — to'g'ri chiziq. k — burchak koeffitsiyenti (qiyalik): k > 0 bo'lsa funksiya o'sadi, k < 0 bo'lsa — kamayadi, k = 0 bo'lsa — doimiy. b — x = 0 dagi qiymat (y o'qi bo'yicha siljish). Funksiyaning noli x = −b/k.",
    properties: [
      { name: 'График',       name_uz: 'Grafik',      val: 'прямая линия' },
      { name: 'Наклон',       name_uz: 'Qiyalik',     val: 'k > 0: ↗,  k < 0: ↘,  k = 0: →' },
      { name: 'Нуль',         name_uz: 'Nol',         val: 'x₀ = −b/k' },
      { name: 'y при x=0',   name_uz: 'y when x=0',  val: 'y(0) = b' },
    ],
    svg: _svg(`
      ${_axes(130, 120, 115, 108)}
      ${_ticks(130, 120, 28, 28, 4, 3)}
      ${_curve(x => 0.8*x + 1.5, -4, 4, 60, 130, 120, 28, 28)}
      ${_curve(x => -0.5*x + 1, -4, 4, 60, 130, 120, 28, 28).replace(/stroke="var\(--accent\)"/g, 'stroke="var(--green)"')}
      ${_lbl(218, 55, 'k>0', 'var(--accent)', 10)}
      ${_lbl(218, 105, 'k<0', 'var(--green)', 10)}
      ${_dim(130, 176, 'y = kx + b', 'var(--text3)', 11)}
    `),
  },

  {
    id: 'parabola',
    category: 'Функции',   category_uz: 'Funksiyalar',
    school_section: 'Алгебра', task_type: 'Функции', grade: '9-10 класс', difficulty: 'medium',
    title: 'Квадратичная функция',
    title_uz: 'Kvadratik funksiya',
    formula: 'y = ax² + bx + c',
    description: 'График квадратичной функции — парабола. При a > 0 ветви направлены вверх (⋃), при a < 0 — вниз (⋂). Вершина параболы: x₀ = −b/(2a), y₀ = c − b²/(4a). Ось симметрии: x = −b/(2a). Чем больше |a|, тем «у́же» парабола. Нули функции — корни квадратного уравнения.',
    description_uz: "Kvadratik funksiya grafigi — parabola. a > 0 bo'lsa shoxlar yuqoriga (⋃), a < 0 bo'lsa — pastga (⋂). Parabolaning uchi: x₀ = −b/(2a), y₀ = c − b²/(4a). Simmetriya o'qi: x = −b/(2a). |a| qancha katta bo'lsa, parabola shuncha tor. Funksiyaning nollari — kvadrat tenglamaning ildizlari.",
    properties: [
      { name: 'Вершина (x)',  name_uz: 'Tepa (x)',   val: 'x₀ = −b / 2a' },
      { name: 'Вершина (y)',  name_uz: 'Tepa (y)',   val: 'y₀ = c − b²/4a' },
      { name: 'a > 0',        name_uz: 'a > 0',      val: 'ветви вверх ⋃, минимум' },
      { name: 'a < 0',        name_uz: 'a < 0',      val: 'ветви вниз ⋂, максимум' },
    ],
    svg: _svg(`
      ${_axes(130, 150, 115, 135)}
      ${_ticks(130, 150, 28, 28, 3, 4)}
      ${_curve(x => x*x - 3.5, -3.5, 3.5, 80, 130, 150, 28, 28)}
      <circle cx="130" cy="52" r="4" fill="var(--green)"/>
      ${_lbl(148, 50, 'вершина', 'var(--green)', 10)}
      ${_dim(130, 178, 'y = ax² + bx + c', 'var(--text3)', 11)}
    `),
  },

  {
    id: 'hyperbola',
    category: 'Функции',   category_uz: 'Funksiyalar',
    school_section: 'Алгебра', task_type: 'Функции', grade: '9-10 класс', difficulty: 'medium',
    title: 'Обратная пропорциональность',
    title_uz: 'Teskari mutanosiblik',
    formula: 'y = k / x',
    description: 'Функция y = k/x (при k ≠ 0) называется обратной пропорциональностью. График — гипербола с двумя ветвями. Функция не определена при x = 0. Оси координат — асимптоты гиперболы. При k > 0 — ветви в I и III четвертях, при k < 0 — во II и IV. Произведение xy = k = const.',
    description_uz: "y = k/x funksiyasi (k ≠ 0 da) teskari mutanosiblik deyiladi. Grafigi — ikki shoxli giperbola. Funksiya x = 0 da aniqlanmagan. Koordinata o'qlari — giperbolaning asimptotalari. k > 0 da — shoxlar I va III choraklarda, k < 0 da — II va IV choraklarda. xy = k = const ko'paytma.",
    properties: [
      { name: 'Область',     name_uz: 'Soha',         val: 'x ≠ 0,  y ≠ 0' },
      { name: 'k > 0',       name_uz: 'k > 0',        val: 'I и III четверти' },
      { name: 'k < 0',       name_uz: 'k < 0',        val: 'II и IV четверти' },
      { name: 'Асимптоты',   name_uz: 'Asimptotalar', val: 'x = 0 и y = 0' },
    ],
    svg: _svg(`
      ${_axes(130, 90, 115, 82)}
      ${_ticks(130, 90, 28, 28, 3, 2)}
      ${_curve(x => 2.5/x, 0.3, 4.2, 60, 130, 90, 28, 28)}
      ${_curve(x => 2.5/x, -4.2, -0.3, 60, 130, 90, 28, 28)}
      ${_dim(130, 183, 'y = k/x,  k > 0', 'var(--text3)', 11)}
    `),
  },

  {
    id: 'exp_fn',
    category: 'Функции',   category_uz: 'Funksiyalar',
    school_section: 'Алгебра', task_type: 'Функции', grade: '11 класс', difficulty: 'hard',
    title: 'Показательная функция',
    title_uz: "Ko'rsatkichli funksiya",
    formula: 'y = aˣ,  a > 0, a ≠ 1',
    description: 'Показательная функция y = aˣ определена для всех x. При a > 1 — возрастающая: при x → +∞ → +∞, при x → −∞ → 0. При 0 < a < 1 — убывающая. График проходит через точку (0;1), т.к. a⁰ = 1. Применяется в моделях роста и распада. Частный случай: y = eˣ (e ≈ 2.718).',
    description_uz: "Ko'rsatkichli funksiya y = aˣ barcha x lar uchun aniqlanган. a > 1 da — o'suvchi: x → +∞ da → +∞, x → −∞ da → 0. 0 < a < 1 da — kamayuvchi. Grafik (0;1) nuqtadan o'tadi, chunki a⁰ = 1. O'sish va parchalanish modellarida qo'llaniladi. Maxsus hol: y = eˣ (e ≈ 2.718).",
    properties: [
      { name: 'Область',     name_uz: 'Aniqlanish sohasi',  val: 'x ∈ (−∞; +∞)' },
      { name: 'Значения',    name_uz: 'Qiymatlar',          val: 'y ∈ (0; +∞)' },
      { name: 'При x = 0',  name_uz: 'x = 0 da',           val: 'y = a⁰ = 1' },
      { name: 'a > 1',       name_uz: "a > 1",              val: "o'sadi" },
      { name: '0 < a < 1',  name_uz: '0 < a < 1',          val: 'kamayadi' },
    ],
    svg: _svg(`
      ${_axes(90, 130, 80, 115)}
      ${_ticks(90, 130, 28, 28, 2, 3)}
      ${_curve(x => Math.pow(1.9, x), -3, 3.5, 80, 90, 130, 28, 28)}
      <circle cx="90" cy="102" r="4" fill="var(--green)"/>
      ${_lbl(104, 102, '(0;1)', 'var(--green)', 10)}
      ${_dim(90, 178, 'y = aˣ  (a > 1)', 'var(--text3)', 11)}
    `),
  },

  // ─── ТРИГОНОМЕТРИЯ ───────────────────────────────────────────

  {
    id: 'unit_circle',
    category: 'Тригонометрия',   category_uz: 'Trigonometriya',
    school_section: 'Тригонометрия', task_type: 'Функции', grade: '9-10 класс', difficulty: 'hard',
    title: 'Единичная окружность',
    title_uz: 'Birlik aylana',
    formula: 'sin²α + cos²α = 1',
    description: 'Единичная окружность — окружность с центром в начале координат и радиусом 1. Для угла α: cos α — абсцисса, sin α — ордината точки на окружности. Угол измеряется в радианах: π рад = 180°. Основное тригонометрическое тождество: sin²α + cos²α = 1. Знаки функций зависят от четверти.',
    description_uz: "Birlik aylana — koordinatalar boshida markazi va radiusi 1 bo'lgan aylana. α burchak uchun: cos α — abssissa, sin α — aylanadagi nuqtaning ordinatasi. Burchak radianlarda o'lchanadi: π rad = 180°. Asosiy trigonometrik tenglik: sin²α + cos²α = 1. Funksiyalar ishoralari chorakka bog'liq.",
    properties: [
      { name: 'cos α',       name_uz: 'cos α',         val: 'x-координата точки' },
      { name: 'sin α',       name_uz: 'sin α',         val: 'y-координата точки' },
      { name: 'tan α',       name_uz: 'tan α',         val: 'sin α / cos α' },
      { name: 'Тождество',   name_uz: 'Tenglik',       val: 'sin²α + cos²α = 1' },
      { name: '180°',        name_uz: '180°',          val: 'π радиан' },
    ],
    svg: _svg(`
      ${_axes(130, 92, 108, 85)}
      <circle cx="130" cy="92" r="72" fill="none" stroke="var(--text2)" stroke-width="1.5"/>
      <line x1="130" y1="92" x2="181" y2="43" stroke="var(--accent)" stroke-width="2"/>
      <line x1="181" y1="43" x2="181" y2="92" stroke="var(--green)" stroke-width="1.8" stroke-dasharray="4,3"/>
      <line x1="130" y1="92" x2="181" y2="92" stroke="var(--amber,#f0c040)" stroke-width="1.8" stroke-dasharray="4,3"/>
      <circle cx="181" cy="43" r="4" fill="var(--accent)"/>
      ${_lbl(157, 75, '1', 'var(--accent)')}
      ${_lbl(192, 70, 'sin', 'var(--green)', 11)}
      ${_lbl(157, 104, 'cos', 'var(--amber,#f0c040)', 11)}
      ${_lbl(155, 40, 'α', 'var(--text2)', 12)}
    `),
  },

  {
    id: 'trig_values',
    category: 'Тригонометрия',   category_uz: 'Trigonometriya',
    school_section: 'Тригонометрия', task_type: 'Функции', grade: '9-10 класс', difficulty: 'medium',
    title: 'Значения sin и cos',
    title_uz: 'sin va cos qiymatlari',
    formula: 'sin 30°=½,  cos 60°=½',
    description: 'Основные значения тригонометрических функций для стандартных углов нужно знать наизусть. Мнемоника для синуса: sin 0° = 0, sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2, sin 90° = 1. Косинус: cos α = sin(90°−α). Запомнить легко: sin 0→90° растёт от 0 до 1.',
    description_uz: "Standart burchaklar uchun trigonometrik funksiyalarning asosiy qiymatlarini yoddan bilish kerak. sin uchun mnemonika: sin 0° = 0, sin 30° = 1/2, sin 45° = √2/2, sin 60° = √3/2, sin 90° = 1. Kosinus: cos α = sin(90°−α). Eslab qolish oson: sin 0°→90° 0 dan 1 gacha o'sadi.",
    properties: [
      { name: 'sin 0°',   name_uz: 'sin 0°',   val: '0' },
      { name: 'sin 30°',  name_uz: 'sin 30°',  val: '1/2 = 0.5' },
      { name: 'sin 45°',  name_uz: 'sin 45°',  val: '√2/2 ≈ 0.707' },
      { name: 'sin 60°',  name_uz: 'sin 60°',  val: '√3/2 ≈ 0.866' },
      { name: 'sin 90°',  name_uz: 'sin 90°',  val: '1' },
    ],
    svg: _svg(`
      ${_axes(30, 90, 10, 80)}
      <line x1="30" y1="90" x2="248" y2="90" stroke="var(--text3)" stroke-width="1"/>
      <polygon points="248,90 241,87 241,93" fill="var(--text3)"/>
      <text x="250" y="94" fill="var(--text3)" font-size="11" font-family="sans-serif">α</text>
      ${_curve(x => Math.sin(x), 0, 6.3, 120, 30, 90, 35, 72)}
      ${_curve(x => Math.cos(x), 0, 6.3, 120, 30, 90, 35, 72).replace(/stroke="var\(--accent\)"/g, 'stroke="var(--green)"')}
      <text x="110" y="22" fill="var(--accent)" font-size="11" font-family="monospace">sin</text>
      <text x="158" y="22" fill="var(--green)" font-size="11" font-family="monospace">cos</text>
      ${['0','π/2','π','3π/2','2π'].map((l,i) => {
        const x = 30 + i * 55;
        return `<text x="${x}" y="104" fill="var(--text3)" font-size="9" font-family="monospace" text-anchor="middle">${l}</text>`;
      }).join('')}
    `),
  },

  {
    id: 'trig_formulas',
    category: 'Тригонометрия',   category_uz: 'Trigonometriya',
    school_section: 'Тригонометрия', task_type: 'Уравнения', grade: '11 класс', difficulty: 'hard',
    title: 'Формулы тригонометрии',
    title_uz: 'Trigonometriya formulalari',
    formula: 'sin(a±b) = sin a·cos b ± cos a·sin b',
    description: 'Формулы сложения позволяют вычислить тригонометрические функции суммы и разности углов. Формулы двойного угла: sin 2α = 2 sin α cos α, cos 2α = cos²α − sin²α. Формулы понижения степени: sin²α = (1−cos 2α)/2, cos²α = (1+cos 2α)/2. Используются для упрощения выражений и решения уравнений.',
    description_uz: "Qo'shish formulalari burchaklar yig'indisi va ayirmasi uchun trigonometrik funksiyalarni hisoblash imkonini beradi. Ikki burchak formulalari: sin 2α = 2 sin α cos α, cos 2α = cos²α − sin²α. Daraja pasaytirish formulalari: sin²α = (1−cos 2α)/2, cos²α = (1+cos 2α)/2. Ifodalarni soddalashtirish va tenglamalarni yechishda qo'llaniladi.",
    properties: [
      { name: 'Сложение',    name_uz: "Qo'shish",       val: 'sin(a+b) = sin·cos + cos·sin' },
      { name: 'Двойной угол',name_uz: 'Ikki burchak',   val: 'sin 2α = 2 sin α cos α' },
      { name: 'Двойной угол',name_uz: 'Ikki burchak',   val: 'cos 2α = cos²α − sin²α' },
      { name: 'tan',         name_uz: 'tan',             val: 'tan α = sin α / cos α' },
      { name: 'cot',         name_uz: 'cot',             val: 'cot α = cos α / sin α' },
    ],
    svg: _svg(`
      <text x="130" y="30" text-anchor="middle" fill="var(--text2)" font-size="12" font-family="monospace">Основные формулы</text>
      ${[
        ['sin²α + cos²α = 1', 58],
        ['sin(a+b) = sinа·cosb + cosа·sinb', 82],
        ['sin(a–b) = sinа·cosb – cosа·sinb', 102],
        ['cos 2α = cos²α – sin²α', 126],
        ['sin 2α = 2·sinα·cosα', 150],
        ['tan α = sin α / cos α', 170],
      ].map(([t, y]) =>
        `<text x="130" y="${y}" text-anchor="middle" fill="var(--accent)" font-size="11" font-family="monospace">${t}</text>`
      ).join('')}
    `),
  },

  {
    id: 'sin_cos_theorems',
    category: 'Тригонометрия',   category_uz: 'Trigonometriya',
    school_section: 'Тригонометрия', task_type: 'Фигуры', grade: '9-10 класс', difficulty: 'hard',
    title: 'Теоремы синусов и косинусов',
    title_uz: 'Sinuslar va kosinuslar teoremasi',
    formula: 'a/sin A = b/sin B = c/sin C = 2R',
    description: 'Теорема синусов: отношения сторон треугольника к синусам противолежащих углов равны диаметру описанной окружности. Применяется при известных двух углах и стороне. Теорема косинусов — обобщение теоремы Пифагора: a² = b² + c² − 2bc·cos A. При A = 90°: cos A = 0 и получается теорема Пифагора.',
    description_uz: "Sinuslar teoremasi: uchburchak tomonlarining qarama-qarshi burchaklar sinuslariga nisbatlari aylantirilgan aylana diametriga teng. Ikki burchak va tomon ma'lum bo'lganda qo'llaniladi. Kosinuslar teoremasi — Pifagor teoremасining umumlashmasi: a² = b² + c² − 2bc·cos A. A = 90° da: cos A = 0 va Pifagor teoremasi hosil bo'ladi.",
    properties: [
      { name: 'Теорема синусов',  name_uz: 'Sinuslar teoremasi',    val: 'a/sin A = 2R' },
      { name: 'Теорема косинусов',name_uz: 'Kosinuslar teoremasi',  val: 'a² = b² + c² − 2bc·cos A' },
      { name: 'При A = 90°',      name_uz: 'A = 90° da',           val: 'a² = b² + c² (Пифагор)' },
      { name: 'Радиус описанной', name_uz: 'Aylantirilgan radius',  val: 'R = a / (2 sin A)' },
    ],
    svg: _svg(`
      <polygon points="30,155 130,25 220,155" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx="127" cy="100" r="80" fill="none" stroke="var(--text3)" stroke-width="1" stroke-dasharray="4,3"/>
      ${_lbl(125, 18, 'B')}
      ${_lbl(14, 162, 'A')}
      ${_lbl(226, 162, 'C')}
      ${_lbl(68, 96, 'c', 'var(--green)')}
      ${_lbl(185, 96, 'b', 'var(--green)')}
      ${_lbl(130, 173, 'a', 'var(--green)')}
      ${_dim(220, 60, 'R', 'var(--text3)')}
    `),
  },


  // ─── АРИФМЕТИКА — ЧИСЛА ─────────────────────────────────────

  {
    id: 'nat_numbers',
    category: 'Арифметика', category_uz: 'Arifmetika',
    school_section: 'Арифметика', task_type: 'Числа', grade: '1-5 класс', difficulty: 'easy',
    title: 'Натуральные числа',
    title_uz: "Natural sonlar",
    formula: 'ℕ = {1, 2, 3, 4, 5, ...}',
    description: 'Натуральные числа — числа для счёта предметов: 1, 2, 3, ... Нуль не является натуральным. Множество натуральных чисел бесконечно. Наименьшее натуральное число — 1. Натуральные числа образуют основу всей математики.',
    description_uz: "Natural sonlar — predmetlarni sanash uchun ishlatiladigan sonlar: 1, 2, 3, ... Nol natural son emas. Natural sonlar to'plami cheksiz. Eng kichik natural son — 1.",
    properties: [
      { name: 'Обозначение',  name_uz: 'Belgisi',        val: 'ℕ = {1, 2, 3, ...}' },
      { name: 'Нуль',         name_uz: 'Nol',            val: '0 ∉ ℕ' },
      { name: 'Операции',     name_uz: 'Amallar',        val: '+, ×  (замкнуты)' },
      { name: 'Порядок',      name_uz: 'Tartib',         val: '1 < 2 < 3 < ...' },
      { name: 'Бесконечность',name_uz: 'Cheksizlik',     val: 'нет наибольшего элемента' },
    ],
    svg: _svg(`
      <line x1="20" y1="90" x2="240" y2="90" stroke="var(--text3)" stroke-width="1.5"/>
      <polygon points="240,90 233,86 233,94" fill="var(--text3)"/>
      ${[1,2,3,4,5].map((n,i) => {
        const x = 40 + i*40;
        return `<circle cx="${x}" cy="90" r="4" fill="var(--accent)"/>
                <text x="${x}" y="112" fill="var(--accent)" font-size="13" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">${n}</text>`;
      }).join('')}
      <text x="210" y="112" fill="var(--text3)" font-size="16" font-family="'DM Mono',monospace" text-anchor="middle">...</text>
      <text x="130" y="145" fill="var(--text2)" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle">ℕ = {1, 2, 3, 4, 5, ...}</text>
      <text x="130" y="165" fill="var(--green)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">счёт, сложение, умножение</text>
    `),
  },

  {
    id: 'integers',
    category: 'Арифметика', category_uz: 'Arifmetika',
    school_section: 'Арифметика', task_type: 'Числа', grade: '6 класс', difficulty: 'easy',
    title: 'Целые числа',
    title_uz: "Butun sonlar",
    formula: 'ℤ = {..., -2, -1, 0, 1, 2, ...}',
    description: 'Целые числа включают натуральные числа, нуль и отрицательные целые числа. Отрицательные числа появились для записи долгов, температуры ниже нуля, координат. ℕ ⊂ ℤ (натуральные — подмножество целых).',
    description_uz: "Butun sonlar natural sonlar, nol va manfiy butun sonlarni o'z ichiga oladi. ℕ ⊂ ℤ.",
    properties: [
      { name: 'Обозначение',   name_uz: 'Belgisi',      val: 'ℤ = {..., -1, 0, 1, ...}' },
      { name: 'ℕ ⊂ ℤ',        name_uz: 'ℕ ⊂ ℤ',       val: 'натуральные ⊂ целые' },
      { name: 'Нейтральный',   name_uz: 'Neytral',      val: '0 ∈ ℤ' },
      { name: 'Противоположный',name_uz: "Qarama-qarshi", val: '−a ∈ ℤ для любого a ∈ ℤ' },
      { name: 'Операции',      name_uz: 'Amallar',      val: '+, −, ×  (замкнуты)' },
    ],
    svg: _svg(`
      <line x1="10" y1="90" x2="250" y2="90" stroke="var(--text3)" stroke-width="1.5"/>
      <polygon points="250,90 243,86 243,94" fill="var(--text3)"/>
      ${[-3,-2,-1,0,1,2,3].map((n,i) => {
        const x = 35 + i*31;
        const col = n < 0 ? 'var(--red)' : n === 0 ? 'var(--text2)' : 'var(--accent)';
        return `<circle cx="${x}" cy="90" r="4" fill="${col}"/>
                <text x="${x}" y="112" fill="${col}" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">${n}</text>`;
      }).join('')}
      <text x="22" y="112" fill="var(--text3)" font-size="13" text-anchor="middle">...</text>
      <text x="228" y="112" fill="var(--text3)" font-size="13" text-anchor="middle">...</text>
      <text x="130" y="150" fill="var(--text2)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">ℕ ⊂ ℤ</text>
    `),
  },

  {
    id: 'rationals',
    category: 'Арифметика', category_uz: 'Arifmetika',
    school_section: 'Арифметика', task_type: 'Числа', grade: '5-6 класс', difficulty: 'medium',
    title: 'Рациональные числа',
    title_uz: "Ratsional sonlar",
    formula: 'ℚ = { p/q | p ∈ ℤ, q ∈ ℤ, q ≠ 0 }',
    description: 'Рациональное число — число, представимое в виде дроби p/q, где p и q целые, q ≠ 0. Все целые числа рациональны (5 = 5/1). Десятичные дроби рациональны, если конечны или периодичны. ℤ ⊂ ℚ.',
    description_uz: "Ratsional son — p/q ko'rinishidagi kasrlar, bu yerda p va q butun, q ≠ 0. ℤ ⊂ ℚ.",
    properties: [
      { name: 'Обозначение', name_uz: 'Belgisi',     val: 'ℚ = {p/q | q ≠ 0}' },
      { name: 'ℤ ⊂ ℚ',      name_uz: 'ℤ ⊂ ℚ',      val: 'целые — частный случай' },
      { name: 'Примеры',     name_uz: 'Misollar',    val: '1/2, -3/4, 0.75, 2' },
      { name: 'Дес. запись', name_uz: 'Oʻnlik',      val: 'конечная или периодичная' },
      { name: 'Плотность',   name_uz: 'Zichlik',     val: 'между любыми двумя — ещё одно' },
    ],
    svg: _svg(`
      <rect x="15" y="30" width="230" height="130" rx="10" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="130" y="50" fill="var(--accent)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">ℚ — рациональные</text>
      <rect x="40" y="65" width="180" height="80" rx="8" fill="none" stroke="var(--green)" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="130" y="82" fill="var(--green)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">ℤ — целые</text>
      <rect x="65" y="93" width="130" height="40" rx="6" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1.2"/>
      <text x="130" y="118" fill="var(--accent)" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">ℕ — натуральные</text>
      <text x="48" y="150" fill="var(--text2)" font-size="10" font-family="'DM Mono',monospace">1/2</text>
      <text x="185" y="150" fill="var(--text2)" font-size="10" font-family="'DM Mono',monospace">-3/4</text>
    `),
  },

  {
    id: 'irrationals',
    category: 'Арифметика', category_uz: 'Arifmetika',
    school_section: 'Арифметика', task_type: 'Числа', grade: '8 класс', difficulty: 'medium',
    title: 'Иррациональные числа',
    title_uz: "Irratsional sonlar",
    formula: '√2 = 1.41421356... (не периодична)',
    description: 'Иррациональное число нельзя представить в виде дроби p/q. Его десятичная запись бесконечна и не периодична. Примеры: √2, √3, π, e. Иррациональные числа не входят в ℚ, но входят в ℝ. Сумма и произведение иррациональных могут быть рациональными (√2 · √2 = 2).',
    description_uz: "Irratsional son p/q ko'rinishida ifodalab bo'lmaydi. Misollar: √2, √3, π, e.",
    properties: [
      { name: '√2 ≈',        name_uz: '√2 ≈',     val: '1.41421356...' },
      { name: 'π ≈',         name_uz: 'π ≈',      val: '3.14159265...' },
      { name: 'e ≈',         name_uz: 'e ≈',      val: '2.71828182...' },
      { name: 'Не входят',   name_uz: "Kirmaydi",  val: 'в ℚ' },
      { name: 'Входят',      name_uz: 'Kiradi',    val: 'в ℝ' },
    ],
    svg: _svg(`
      <line x1="20" y1="90" x2="240" y2="90" stroke="var(--text3)" stroke-width="1.5"/>
      <polygon points="240,90 233,86 233,94" fill="var(--text3)"/>
      ${[0,1,2,3].map(n => {
        const x = 30 + n * 60;
        return `<line x1="${x}" y1="84" x2="${x}" y2="96" stroke="var(--text3)" stroke-width="1.2"/>
                <text x="${x}" y="110" fill="var(--text2)" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle">${n}</text>`;
      }).join('')}
      <circle cx="115" cy="90" r="5" fill="var(--accent)" stroke="var(--accent)" stroke-width="1.5"/>
      <line x1="115" y1="70" x2="115" y2="85" stroke="var(--accent)" stroke-width="1.2" stroke-dasharray="3,2"/>
      <text x="115" y="65" fill="var(--accent)" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">√2</text>
      <circle cx="188" cy="90" r="5" fill="var(--red)" stroke="var(--red)" stroke-width="1.5"/>
      <line x1="188" y1="70" x2="188" y2="85" stroke="var(--red)" stroke-width="1.2" stroke-dasharray="3,2"/>
      <text x="188" y="65" fill="var(--red)" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">π</text>
      <text x="130" y="150" fill="var(--text2)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">бесконечная непериодическая дробь</text>
    `),
  },

  {
    id: 'reals',
    category: 'Арифметика', category_uz: 'Arifmetika',
    school_section: 'Арифметика', task_type: 'Числа', grade: '9 класс', difficulty: 'medium',
    title: 'Вещественные (действительные) числа',
    title_uz: "Haqiqiy sonlar",
    formula: 'ℝ = ℚ ∪ {иррациональные}',
    description: 'Вещественные числа — объединение рациональных и иррациональных. Каждой точке числовой прямой соответствует единственное вещественное число. Порядок вложений: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ. Операции +, −, ×, ÷ (на ненулевое) замкнуты в ℝ.',
    description_uz: "Haqiqiy sonlar — ratsional va irratsional sonlar birlashmasi. ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ.",
    properties: [
      { name: 'ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ', name_uz: 'ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ', val: 'иерархия множеств' },
      { name: 'Полнота',          name_uz: 'Toʻliqlik',       val: 'заполняет всю числовую ось' },
      { name: 'Операции',         name_uz: 'Amallar',         val: '+, −, ×, ÷ (÷ 0 запрещено)' },
      { name: 'Мощность',         name_uz: 'Qadriyat',        val: 'несчётное бесконечное' },
      { name: 'Запись',           name_uz: 'Yozilishi',       val: 'любая дес. запись (в т.ч. бесконечная)' },
    ],
    svg: _svg(`
      <ellipse cx="130" cy="95" rx="110" ry="68" fill="none" stroke="var(--accent)" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="130" y="30" fill="var(--accent)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">ℝ — вещественные</text>
      <ellipse cx="130" cy="100" rx="80" ry="48" fill="none" stroke="var(--green)" stroke-width="1.3" stroke-dasharray="4,3"/>
      <text x="130" y="60" fill="var(--green)" font-size="10" font-family="'DM Mono',monospace" text-anchor="middle">ℚ рациональные</text>
      <ellipse cx="130" cy="105" rx="54" ry="30" fill="none" stroke="var(--text2)" stroke-width="1.2" stroke-dasharray="3,3"/>
      <text x="130" y="88" fill="var(--text2)" font-size="10" font-family="'DM Mono',monospace" text-anchor="middle">ℤ целые</text>
      <ellipse cx="130" cy="110" rx="28" ry="14" fill="var(--accent-soft)" stroke="var(--text2)" stroke-width="1"/>
      <text x="130" y="114" fill="var(--accent)" font-size="10" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="600">ℕ</text>
      <text x="210" y="95" fill="var(--red)" font-size="10" font-family="'DM Mono',monospace">√2, π</text>
    `),
  },

  {
    id: 'complex_numbers',
    category: 'Арифметика', category_uz: 'Arifmetika',
    school_section: 'Алгебра', task_type: 'Числа', grade: '10-11 класс', difficulty: 'hard',
    title: 'Комплексные числа',
    title_uz: "Kompleks sonlar",
    formula: 'z = a + bi,  i² = −1',
    description: 'Комплексное число z = a + bi, где a — вещественная часть (Re z), b — мнимая часть (Im z), i — мнимая единица (i² = −1). Вещественные числа — частный случай (b = 0). Комплексные числа изображают на плоскости (ось x — вещественная, y — мнимая). ℝ ⊂ ℂ.',
    description_uz: "Kompleks son z = a + bi, bu yerda i² = −1. ℝ ⊂ ℂ.",
    properties: [
      { name: 'i² = −1',       name_uz: "i² = −1",        val: 'мнимая единица' },
      { name: 'Re(z)',          name_uz: 'Re(z)',           val: 'вещественная часть a' },
      { name: 'Im(z)',          name_uz: 'Im(z)',           val: 'мнимая часть b' },
      { name: 'Модуль',         name_uz: 'Modul',          val: '|z| = √(a² + b²)' },
      { name: 'Сопряжённое',    name_uz: "Koʻyinlik",      val: 'z̄ = a − bi' },
    ],
    svg: _svg(`
      ${_axes(130, 95, 100, 75, 'Re', 'Im')}
      ${_ticks(130, 95, 30, 30, 3, 2)}
      <circle cx="190" cy="35" r="5" fill="var(--accent)"/>
      <line x1="130" y1="95" x2="190" y2="35" stroke="var(--accent)" stroke-width="2" stroke-dasharray="4,2"/>
      <line x1="190" y1="35" x2="190" y2="95" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="3,3"/>
      <line x1="130" y1="35" x2="190" y2="35" stroke="var(--text3)" stroke-width="1.2" stroke-dasharray="3,3"/>
      ${_lbl(210, 35, 'z', 'var(--accent)', 13)}
      ${_lbl(200, 68, 'b', 'var(--green)', 11)}
      ${_lbl(160, 110, 'a', 'var(--green)', 11)}
      ${_lbl(155, 75, '|z|', 'var(--accent)', 10)}
    `),
  },

  // ─── ПРОЦЕНТЫ ────────────────────────────────────────────────

  {
    id: 'percents',
    category: 'Проценты', category_uz: 'Foizlar',
    school_section: 'Арифметика', task_type: 'Проценты', grade: '6-7 класс', difficulty: 'medium',
    title: 'Проценты — формулы и задачи',
    title_uz: "Foizlar — formulalar va masalalar",
    formula: 'P% от A = A · P ÷ 100',
    description: 'Процент (%) — одна сотая часть числа. Используется для сравнения, скидок, налогов, процентных ставок. Три основных типа задач: найти P% от числа A; найти число A, если известно P% от него; найти, сколько процентов одно число составляет от другого.',
    description_uz: "Foiz (%) — sonning yuzdan bir qismi. Uch asosiy masala turi: foizni topish, sonni topish, foiz nisbatini topish.",
    properties: [
      { name: 'P% от A',       name_uz: "A ning P foizi",   val: 'X = A · P / 100' },
      { name: 'A по P%',       name_uz: "P foiz boʻyicha A", val: 'A = X · 100 / P' },
      { name: 'P% (отношение)',name_uz: "Nisbat foizi",     val: 'P = X / A · 100' },
      { name: 'Рост на P%',    name_uz: "P foiz oʻsishi",  val: 'A_new = A · (1 + P/100)' },
      { name: 'Скидка P%',     name_uz: "P foiz chegirma", val: 'A_new = A · (1 − P/100)' },
    ],
    svg: _svg(`
      <rect x="20" y="70" width="220" height="40" rx="5" fill="var(--surface2)" stroke="var(--border)" stroke-width="1.5"/>
      <rect x="20" y="70" width="154" height="40" rx="5" fill="var(--accent)" opacity="0.7"/>
      <text x="97" y="96" fill="#fff" font-size="14" font-family="'DM Mono',monospace" text-anchor="middle" font-weight="700">70%</text>
      <text x="187" y="96" fill="var(--text3)" font-size="12" font-family="'DM Mono',monospace" text-anchor="middle">30%</text>
      <text x="130" y="140" fill="var(--text2)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">70% от 220 = 220 · 70 / 100 = 154</text>
      <text x="130" y="158" fill="var(--green)" font-size="11" font-family="'DM Mono',monospace" text-anchor="middle">1% от 220 = 2.2</text>
    `),
  },

  // ─── АНАЛИЗ ──────────────────────────────────────────────────

  {
    id: 'derivative',
    category: 'Анализ', category_uz: 'Analiz',
    school_section: 'Анализ', task_type: 'Производная', grade: '10-11 класс', difficulty: 'hard',
    title: 'Производная — основные правила',
    title_uz: "Hosilalar — asosiy qoidalar",
    formula: "f'(x) = lim[Δx→0] Δy/Δx",
    description: 'Производная f\'(x) — мгновенная скорость изменения функции. Геометрически — угловой коэффициент касательной к графику. Применяется для нахождения экстремумов, монотонности и исследования функций.',
    description_uz: "Hosila f'(x) — funksiyaning bir nuqtadagi o'zgarish tezligi. Geometrik ma'nosi — urinmaning burchak koeffitsienti.",
    properties: [
      { name: "(xⁿ)'",    name_uz: "(xⁿ)'",    val: "nxⁿ⁻¹" },
      { name: "(sin x)'", name_uz: "(sin x)'", val: "cos x" },
      { name: "(cos x)'", name_uz: "(cos x)'", val: "−sin x" },
      { name: "(eˣ)'",    name_uz: "(eˣ)'",    val: "eˣ" },
      { name: "(ln x)'",  name_uz: "(ln x)'",  val: "1/x" },
    ],
    svg: _svg(`
      ${_axes(130, 110, 100, 90, 'x', 'y')}
      ${_curve(x => x*x/20, -9, 9, 200, 130, 110, 13, 13)}
      <line x1="68" y1="110" x2="190" y2="50" stroke="var(--accent)" stroke-width="2"/>
      <circle cx="130" cy="82" r="4" fill="var(--accent)"/>
      ${_lbl(165, 42, "f'(x₀)", 'var(--accent)', 11)}
      ${_lbl(130, 73, 'x₀', 'var(--text2)', 10)}
    `),
  },

  {
    id: 'integral',
    category: 'Анализ', category_uz: 'Analiz',
    school_section: 'Анализ', task_type: 'Интеграл', grade: '10-11 класс', difficulty: 'hard',
    title: 'Интеграл — основные формулы',
    title_uz: "Integral — asosiy formulalar",
    formula: '∫f(x)dx = F(x) + C,  F\'(x) = f(x)',
    description: 'Первообразная F(x) — функция, производная которой равна f(x). Неопределённый интеграл: ∫f(x)dx = F(x) + C. Определённый интеграл: ∫[a,b] f(x)dx = F(b) − F(a) (площадь под кривой). Правило Ньютона–Лейбница.',
    description_uz: "Integral — hosilaga teskari amal. ∫f(x)dx = F(x) + C. Aniq integral maydonga teng.",
    properties: [
      { name: '∫xⁿdx',     name_uz: '∫xⁿdx',     val: 'xⁿ⁺¹/(n+1) + C' },
      { name: '∫sin x dx', name_uz: '∫sin x dx', val: '−cos x + C' },
      { name: '∫cos x dx', name_uz: '∫cos x dx', val: 'sin x + C' },
      { name: '∫eˣdx',     name_uz: '∫eˣdx',     val: 'eˣ + C' },
      { name: '∫(1/x)dx',  name_uz: '∫(1/x)dx',  val: 'ln|x| + C' },
    ],
    svg: _svg(`
      ${_axes(130, 120, 100, 90, 'x', 'y')}
      ${_curve(x => 0.15*(x+5)*(x-5)+15, -8, 8, 300, 130, 120, 13, 7)}
      <path d="M${130+(-4)*13},120 ${[-4,-3,-2,-1,0,1,2,3,4].map(x => {
        const y = 0.15*(x+5)*(x-5)+15;
        return `L${130+x*13},${120-y*7}`;
      }).join(' ')} L${130+4*13},120 Z" fill="var(--accent)" opacity="0.25"/>
      <line x1="${130-4*13}" y1="110" x2="${130-4*13}" y2="120" stroke="var(--text2)" stroke-width="1.5"/>
      <line x1="${130+4*13}" y1="70" x2="${130+4*13}" y2="120" stroke="var(--text2)" stroke-width="1.5"/>
      ${_lbl(130-4*13, 132, 'a', 'var(--text2)', 11)}
      ${_lbl(130+4*13, 132, 'b', 'var(--text2)', 11)}
      ${_lbl(130, 98, 'S', 'var(--accent)', 14)}
    `),
  },

];

// ── Category order ────────────────────────────────────────────
const KB_CATEGORIES = ['Арифметика', 'Геометрия', 'Алгебра', 'Функции', 'Тригонометрия', 'Прогрессии', 'Степени', 'Проценты', 'Анализ'];
const KB_CATEGORIES_UZ = ['Arifmetika', 'Geometriya', 'Algebra', 'Funksiyalar', 'Trigonometriya', 'Progressiyalar', 'Darajalar', 'Foizlar', 'Analiz'];
