/* ============================================================
   MatematikaAI — app.js
   Tabs: Solver | Kalkulyator | Baza | Sozlamalar
   Canvas animations ported from PySide6 QPainter (Python)
   Interactive parameters per animation type
============================================================ */

'use strict';

// ── Utils ────────────────────────────────────────────────────
function $(id) { return document.getElementById(id); }

function setStatus(id, msg, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = 'status-bar' + (isError ? ' error' : '');
}

// ── State ────────────────────────────────────────────────────
let config  = { api_key: '', model: 'tilmoch' };
let kb      = [];
let history = [];

let activeKbIdx = -1;
let animTitle   = null;
let animT       = 0;

// User-controllable animation parameters
let animParams        = {};
let animParamDefaults = {};

// ── Animation parameter definitions ─────────────────────────
const ANIM_CONTROLS = {
  Pifagor: [
    { id: 'a', label: 'a  (katet)', value: 3,   min: 1,   max: 50,   step: 1   },
    { id: 'b', label: 'b  (katet)', value: 4,   min: 1,   max: 50,   step: 1   },
  ],
  Kvadrat: [
    { id: 'qa', label: 'a',         value: 1,   min: -9,  max: 9,    step: 1   },
    { id: 'qb', label: 'b',         value: -5,  min: -20, max: 20,   step: 1   },
    { id: 'qc', label: 'c',         value: 6,   min: -50, max: 50,   step: 1   },
  ],
  Aylana: [
    { id: 'r',  label: 'r  (radius)', value: 5, min: 0.5, max: 20,   step: 0.5 },
  ],
  burchak: [
    { id: 'a',  label: 'a  (en)',    value: 8,  min: 1,   max: 30,   step: 1   },
    { id: 'b',  label: 'b  (boy)',   value: 5,  min: 1,   max: 30,   step: 1   },
  ],
  Tezlik: [
    { id: 'v',  label: 'v  (km/h)', value: 60,  min: 1,   max: 1000, step: 1   },
    { id: 's',  label: 's  (km)',   value: 120, min: 1,   max: 9999, step: 1   },
  ],
  wave: [
    { id: 'amp',  label: 'A  (amplituda)', value: 1.0, min: 0.1, max: 3.0, step: 0.1 },
    { id: 'freq', label: 'f  (chastota)',  value: 3,   min: 1,   max: 12,  step: 1   },
  ],
};

// ════════════════════════════════════════════════════════════
//  TAB SWITCHING
// ════════════════════════════════════════════════════════════
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tab = btn.dataset.tab;
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $('panel-' + tab).classList.add('active');
    if (tab === 'kb') requestAnimationFrame(resizeCanvas);
  });
});

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  await loadConfig();
  await loadHistory();
  await loadKB();
  startAnimLoop();
});

// ════════════════════════════════════════════════════════════
//  CONFIG / SETTINGS
// ════════════════════════════════════════════════════════════
async function loadConfig() {
  try {
    const r = await fetch('/api/config');
    config   = await r.json();
    $('apiToken').value      = config.api_key        || '';
    $('openrouterKey').value = config.openrouter_key || '';
    const model = config.model || 'tilmoch';
    document.querySelectorAll('input[name=model]').forEach(radio => {
      radio.checked = radio.value === model;
    });
  } catch (_) {}
}

async function saveSettings() {
  const token      = $('apiToken').value.trim();
  const openrouterKey = $('openrouterKey').value.trim();
  const model         = document.querySelector('input[name=model]:checked')?.value || 'tilmoch';
  config = { api_key: token, openrouter_key: openrouterKey, model };
  try {
    await fetch('/api/config', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(config),
    });
    setStatus('settingsStatus', token ? '✅ Saqlandi!' : '⚠  Tahrirchi token bo\'sh');
  } catch (e) {
    setStatus('settingsStatus', 'Saqlash xatosi: ' + e.message, true);
  }
}

function toggleTokenVisibility() {
  const inp = $('apiToken');
  const btn = $('toggleToken');
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = 'Yashirish'; }
  else                         { inp.type = 'password'; btn.textContent = 'Ko\'rish';  }
}

function toggleOpenrouterVisibility() {
  const inp = $('openrouterKey');
  const btn = $('toggleOpenrouter');
  if (inp.type === 'password') { inp.type = 'text';     btn.textContent = 'Yashirish'; }
  else                         { inp.type = 'password'; btn.textContent = 'Ko\'rish';  }
}

// ════════════════════════════════════════════════════════════
//  HISTORY
// ════════════════════════════════════════════════════════════
async function loadHistory() {
  try {
    const r  = await fetch('/api/history');
    history  = await r.json();
    renderHistoryList();
  } catch (_) {}
}

function renderHistoryList() {
  const list = $('historyList');
  if (!history.length) {
    list.innerHTML = '<div class="history-empty">Tarix bo\'sh</div>';
    return;
  }
  list.innerHTML = [...history].reverse().map((h, i) => `
    <div class="history-item" onclick="loadHistoryItem(${history.length - 1 - i})">
      <div class="h-problem">${esc(h.problem.slice(0, 80))}</div>
      <div class="h-answer">${esc((h.solution || '').slice(0, 60))}</div>
    </div>
  `).join('');
}

function loadHistoryItem(i) {
  const h = history[i];
  $('problemInput').value = h.problem;
  showResult(h.solution);
}

async function clearHistory() {
  if (!confirm('Barcha tarixni o\'chirasizmi?')) return;
  try {
    await fetch('/api/history', { method: 'DELETE' });
    history = [];
    renderHistoryList();
  } catch (e) {
    alert('Xato: ' + e.message);
  }
}

// ════════════════════════════════════════════════════════════
//  SOLVER
// ════════════════════════════════════════════════════════════
function clearSolver() {
  $('problemInput').value = '';
  $('resultCard').style.display = 'none';
  $('resultBox').textContent    = '';
  setStatus('solverStatus', '');
}

function showResult(text) {
  $('resultBox').textContent    = text;
  $('resultCard').style.display = 'block';
}

async function solveClicked() {
  const problem = $('problemInput').value.trim();
  if (!problem) {
    setStatus('solverStatus', 'Masaleni kiriting!', true);
    return;
  }

  const openrouter_key = config.openrouter_key || '';
  if (!openrouter_key) {
    setStatus('solverStatus', 'Sozlamalar → OpenRouter API key kiriting!', true);
    return;
  }

  $('solveBtn').disabled = true;
  $('resultCard').style.display = 'none';
  setStatus('solverStatus', '⏳ Gemma AI yechmoqda...');

  try {
    const response = await fetch('/api/solve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        problem,
        openrouter_key,
        api_key: config.api_key || '',
        model: config.model || 'tilmoch',
      }),
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.status) setStatus('solverStatus', '⏳ ' + evt.status);
          if (evt.done) {
            showResult(evt.answer);
            setStatus('solverStatus', '✅ Tayyor!');
            const entry = { problem, solution: evt.answer };
            history.push(entry);
            renderHistoryList();
            await fetch('/api/history', {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify(entry),
            });
          }
        } catch (_) {}
      }
    }
  } catch (e) {
    setStatus('solverStatus', 'Xato: ' + e.message, true);
  } finally {
    $('solveBtn').disabled = false;
  }
}

// ════════════════════════════════════════════════════════════
//  CALCULATOR
// ════════════════════════════════════════════════════════════
function calcAppend(ch) { $('calcDisplay').value += ch; }
function calcClear()    { $('calcDisplay').value = ''; }
function calcDel()      { $('calcDisplay').value = $('calcDisplay').value.slice(0, -1); }

function calcEqual() {
  const expr = $('calcDisplay').value;
  try {
    if (!/^[0-9+\-*/.() %]+$/.test(expr)) throw new Error();
    const result = Function('"use strict"; return (' + expr + ')')();
    $('calcDisplay').value = isFinite(result) ? String(result) : 'Xato';
  } catch (_) {
    $('calcDisplay').value = 'Xato';
    setTimeout(() => { $('calcDisplay').value = ''; }, 1200);
  }
}

document.addEventListener('keydown', e => {
  if (!$('panel-calc').classList.contains('active')) return;
  if (e.key === 'Enter' || e.key === '=') calcEqual();
  else if (e.key === 'Backspace') calcDel();
  else if (e.key === 'Escape') calcClear();
  else if (/^[0-9+\-*/.()% ]$/.test(e.key)) calcAppend(e.key);
});

// ════════════════════════════════════════════════════════════
//  PHOTO SOLVER
// ════════════════════════════════════════════════════════════
let photoBase64  = null;
let photoMime    = 'image/jpeg';

function photoSelected(input) {
  const file = input.files[0];
  if (!file) return;
  photoMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    photoBase64 = dataUrl.split(',')[1];
    $('photoPreview').src             = dataUrl;
    $('photoPreview').style.display   = 'block';
    $('photoDropInner').style.display = 'none';
  };
  reader.readAsDataURL(file);
}

function clearPhoto() {
  photoBase64 = null;
  photoMime   = 'image/jpeg';
  $('photoInput').value              = '';
  $('photoPreview').style.display    = 'none';
  $('photoDropInner').style.display  = 'flex';
  $('photoResultCard').style.display = 'none';
  $('photoResultBox').textContent    = '';
  setStatus('photoStatus', '');
}

async function photoSolve() {
  if (!photoBase64) {
    setStatus('photoStatus', '⚠ Avval rasm yuklang', true);
    return;
  }
  if (!config.openrouter_key) {
    setStatus('photoStatus', '⚠ Sozlamalar → OpenRouter API key kiriting!', true);
    return;
  }

  const btn = $('photoSolveBtn');
  btn.disabled = true;
  setStatus('photoStatus', '⏳ Tayyorlanmoqda...');
  $('photoResultCard').style.display = 'none';

  try {
    const response = await fetch('/api/photo-solve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        image:      photoBase64,
        mime_type:  photoMime,
        openrouter_key: config.openrouter_key || '',
        api_key:    config.api_key    || '',
        model:      config.model      || 'tilmoch',
      }),
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let   buffer  = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const evt = JSON.parse(line.slice(6));
          if (evt.status) setStatus('photoStatus', '⏳ ' + evt.status);
          if (evt.done) {
            $('photoResultCard').style.display = 'block';
            const box = $('photoResultBox');
            box.innerHTML = marked.parse(evt.answer);
            if (typeof renderMathInElement !== 'undefined') {
              renderMathInElement(box, {
                delimiters: [
                  { left: '$$', right: '$$', display: true  },
                  { left: '$',  right: '$',  display: false },
                ],
                throwOnError: false,
              });
            }
            setStatus('photoStatus', '✅ Tayyor!');
          }
          if (evt.error) setStatus('photoStatus', evt.error, true);
        } catch (_) {}
      }
    }
  } catch (e) {
    setStatus('photoStatus', 'Xato: ' + e.message, true);
  } finally {
    btn.disabled = false;
  }
}

// Drag-and-drop for photo area
document.addEventListener('DOMContentLoaded', () => {
  const dropArea = $('photoDropArea');
  if (!dropArea) return;
  dropArea.addEventListener('dragover', e => {
    e.preventDefault();
    dropArea.classList.add('drag-over');
  });
  dropArea.addEventListener('dragleave', () => dropArea.classList.remove('drag-over'));
  dropArea.addEventListener('drop', e => {
    e.preventDefault();
    dropArea.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const dt = new DataTransfer();
      dt.items.add(file);
      const inp = $('photoInput');
      inp.files = dt.files;
      photoSelected(inp);
    }
  });
});

// ════════════════════════════════════════════════════════════
//  KNOWLEDGE BASE
// ════════════════════════════════════════════════════════════
async function loadKB() {
  try {
    const r = await fetch('/api/kb');
    kb       = await r.json();
    renderKBList();
    if (kb.length) selectFormula(0);
  } catch (_) {}
}

function renderKBList() {
  const list = $('kbList');
  list.innerHTML = kb.map((f, i) => `
    <div class="kb-item${i === activeKbIdx ? ' active' : ''}" onclick="selectFormula(${i})">
      <span class="kb-item-title">${esc(f.title)}</span>
      <button class="kb-delete" onclick="deleteFormula(event,${i})" title="O'chirish">×</button>
    </div>
  `).join('') || '<div class="history-empty">Formula yo\'q</div>';
}

function selectFormula(i) {
  activeKbIdx = i;
  const f = kb[i];
  $('kbDetail').textContent = f ? `${f.title}\n\n${f.content}` : '';
  animTitle = f ? f.title : null;
  animT     = 0;
  renderKBList();
  renderAnimControls(animTitle);
}

async function addFormula() {
  const title   = $('kbTitleInput').value.trim();
  const content = $('kbContentInput').value.trim();
  if (!title || !content) { alert('Nom va mazmunni to\'ldiring!'); return; }
  try {
    await fetch('/api/kb', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, content }),
    });
    $('kbTitleInput').value   = '';
    $('kbContentInput').value = '';
    await loadKB();
    selectFormula(kb.length - 1);
  } catch (e) { alert('Xato: ' + e.message); }
}

async function deleteFormula(e, i) {
  e.stopPropagation();
  try {
    await fetch('/api/kb/' + i, { method: 'DELETE' });
    if (activeKbIdx >= i) activeKbIdx = Math.max(0, activeKbIdx - 1);
    await loadKB();
    if (kb.length) selectFormula(Math.min(activeKbIdx, kb.length - 1));
    else { animTitle = null; $('kbDetail').textContent = ''; renderAnimControls(null); }
  } catch (e2) { alert('Xato: ' + e2.message); }
}

// ════════════════════════════════════════════════════════════
//  ANIMATION CONTROLS (interactive parameters)
// ════════════════════════════════════════════════════════════
function renderAnimControls(title) {
  const bar  = $('animControlsBar');
  const grid = $('animControls');
  animParams = {};
  animParamDefaults = {};

  // Match a control key against the title
  let key = null;
  if (title) {
    for (const k of Object.keys(ANIM_CONTROLS)) {
      if (k !== 'wave' && title.includes(k)) { key = k; break; }
    }
    if (!key) key = 'wave'; // fallback: wave controls for custom formulas
  }

  if (!key) { bar.style.display = 'none'; grid.innerHTML = ''; return; }

  bar.style.display = '';
  grid.innerHTML = ANIM_CONTROLS[key].map(ctrl => {
    animParams[ctrl.id]        = ctrl.value;
    animParamDefaults[ctrl.id] = ctrl.value;
    return `
      <div class="anim-param">
        <span class="anim-param-label">${esc(ctrl.label)}</span>
        <input type="number"
               id="param_${ctrl.id}"
               value="${ctrl.value}"
               min="${ctrl.min}"
               max="${ctrl.max}"
               step="${ctrl.step}"
               oninput="onParamChange()">
      </div>`;
  }).join('');
}

function onParamChange() {
  document.querySelectorAll('[id^="param_"]').forEach(inp => {
    const k   = inp.id.slice(6);   // strip 'param_'
    const val = parseFloat(inp.value);
    if (!isNaN(val)) animParams[k] = val;
  });
}

function resetAnimParams() {
  Object.assign(animParams, animParamDefaults);
  document.querySelectorAll('[id^="param_"]').forEach(inp => {
    const k = inp.id.slice(6);
    if (animParamDefaults[k] !== undefined) inp.value = animParamDefaults[k];
  });
}

// ════════════════════════════════════════════════════════════
//  CANVAS ANIMATION ENGINE
// ════════════════════════════════════════════════════════════
const canvas = $('animCanvas');
const ctx    = canvas.getContext('2d');

const ANIM_SPEED = {
  Pifagor: 0.004, Kvadrat: 0.005, Aylana: 0.005, burchak: 0.004, Tezlik: 0.005,
};

function resizeCanvas() {
  const parent = canvas.parentElement;
  canvas.width  = parent.clientWidth  - 32;
  canvas.height = parent.clientHeight - 82; // leave room for controls
}

window.addEventListener('resize', resizeCanvas);

function startAnimLoop() {
  resizeCanvas();
  let last = 0;
  function tick(ts) {
    const dt = Math.min((ts - last) / 1000, 0.05);
    last = ts;

    let speed = 0.005;
    if (animTitle) {
      for (const [key, spd] of Object.entries(ANIM_SPEED)) {
        if (animTitle.includes(key)) { speed = spd; break; }
      }
    }
    animT += speed * dt * 60;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#0d1017');
    grad.addColorStop(1, '#12151f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    if (!animTitle || !$('panel-kb').classList.contains('active')) {
      ctx.fillStyle = '#2a3060';
      ctx.font      = '14px Consolas, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('← Formula tanlang', W / 2, H / 2);
      ctx.textAlign = 'left';
      requestAnimationFrame(tick);
      return;
    }

    const t = animT;
    if      (animTitle.includes('Pifagor'))  drawPythagoras(W, H, t);
    else if (animTitle.includes('Kvadrat'))  drawParabola(W, H, t);
    else if (animTitle.includes('Aylana'))   drawCircleArea(W, H, t);
    else if (animTitle.includes('burchak'))  drawRectangle(W, H, t);
    else if (animTitle.includes('Tezlik'))   drawSpeed(W, H, t);
    else                                     drawWave(W, H, t);

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Canvas helpers ───────────────────────────────────────────
function rgba(r, g, b, a) { return `rgba(${r},${g},${b},${a.toFixed(3)})`; }
function hexA(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${(a / 255).toFixed(3)})`;
}

function setLine(color, width = 2, dash = []) {
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.setLineDash(dash);
}

function line(x1, y1, x2, y2) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
}

function circle(cx, cy, r, fill, stroke, sw) {
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  if (fill)   { ctx.fillStyle   = fill;   ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw || 2; ctx.stroke(); }
}

function arrow(x1, y1, x2, y2, color, width = 2) {
  ctx.save();
  setLine(color, width, []);
  line(x1, y1, x2, y2);
  const angle = Math.atan2(y2 - y1, x2 - x1), hs = 10;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - hs * Math.cos(angle - 0.4), y2 - hs * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - hs * Math.cos(angle + 0.4), y2 - hs * Math.sin(angle + 0.4));
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

function axes(cx, cy, W, H, color = '#2a3050') {
  arrow(20, cy, W - 10, cy, color, 1.5);
  arrow(cx, H - 20, cx, 10, color, 1.5);
}

function gridLines(cx, cy, step, W, H, color = '#1e2540') {
  ctx.save(); setLine(color, 0.5, []);
  let x = cx % step;
  while (x < W) { line(x, 0, x, H); x += step; }
  let y = cy % step;
  while (y < H) { line(0, y, W, y); y += step; }
  ctx.restore();
}

function label(text, x, y, color, size = 13, bold = true) {
  ctx.save();
  ctx.font      = `${bold ? 'bold ' : ''}${size}px Consolas, monospace`;
  ctx.fillStyle = color;
  ctx.setLineDash([]);
  ctx.fillText(text, x, y);
  ctx.restore();
}

function infoBox(x, y, w, h, lines) {
  ctx.save();
  ctx.fillStyle   = 'rgba(14,20,40,0.88)';
  ctx.strokeStyle = '#2a4070';
  ctx.lineWidth   = 1; ctx.setLineDash([]);
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8);
  ctx.fill(); ctx.stroke();
  let cy2 = y + 8;
  lines.forEach(([text, color, size]) => {
    cy2 += (size || 13) + 2;
    label(text, x + 10, cy2, color, size || 13, true);
    cy2 += 4;
  });
  ctx.restore();
}

function round2(v) { return Math.round(v * 100) / 100; }

// ════════════════════════════════════════════════════════════
//  ANIMATION 1 — Pifagor teoremasi
//  params: a (vertical leg), b (horizontal leg)
// ════════════════════════════════════════════════════════════
function drawPythagoras(W, H, t) {
  const userA = Math.max(0.5, animParams.a ?? 3);
  const userB = Math.max(0.5, animParams.b ?? 4);
  const userC = round2(Math.sqrt(userA * userA + userB * userB));

  // Scale so the larger side fits nicely
  const maxSide = Math.max(userA, userB);
  const sc      = Math.min(W * 0.52, H * 0.60) / maxSide;

  const ox = W * 0.16, oy = H * 0.85;
  const ax = ox,              ay = oy - userA * sc;
  const bx = ox + userB * sc, by = oy;

  const pulse    = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);
  const hypR = 255, hypG = Math.round(120 + 135 * pulse);
  const hypColor = `rgb(${hypR},${hypG},60)`;

  // Shaded squares on each leg (semi-transparent)
  function fillQuad(pts, hexColor, alpha) {
    ctx.save();
    ctx.fillStyle = hexA(hexColor, alpha);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    pts.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const sqA = userA * sc, sqB = userB * sc;
  fillQuad([[ox,oy],[ox-sqA,oy],[ox-sqA,ay],[ox,ay]], '#4a9eff', Math.round(22+18*pulse));
  fillQuad([[ox,oy],[bx,oy],    [bx,oy+sqB*0.6],[ox,oy+sqB*0.6]], '#56e39f', Math.round(22+18*pulse));

  ctx.save();
  setLine('#4a9eff', 1, [5, 5]); ctx.strokeRect(ox-sqA, ay, sqA, sqA);
  setLine('#56e39f', 1, [5, 5]); ctx.strokeRect(ox, oy, sqB, sqB * 0.6);
  ctx.restore();

  // Triangle sides
  ctx.save();
  setLine('#4a9eff', 2.5, []); line(ox, oy, ax, ay);
  setLine('#56e39f', 2.5, []); line(ox, oy, bx, by);
  setLine(hypColor,  3.0, []); line(ax, ay, bx, by);
  ctx.restore();

  // Right-angle mark
  const m = sc * 0.12;
  ctx.save(); setLine('#aaaaaa', 1.2, []);
  line(ox, oy - m, ox + m, oy - m);
  line(ox + m, oy - m, ox + m, oy);
  ctx.restore();

  // Side labels
  label('a', ox - 22, (oy + ay) / 2 + 5,  '#4a9eff', 15);
  label('b', (ox+bx)/2 - 4, oy + 28,      '#56e39f', 15);
  label('c', (ax+bx)/2 + 6, (ay+by)/2-10, hypColor,  15);

  // Formula & values box
  const D2 = round2(userA * userA + userB * userB);
  infoBox(W * 0.54, H * 0.10, 210, 80, [
    ['a²  +  b²  =  c²',                          '#e2e8f0', 15],
    [`${userA}² + ${userB}² = ${userC}²`,         '#8ab4f8', 12],
    [`${round2(userA*userA)} + ${round2(userB*userB)} = ${round2(D2)}`, '#56e39f', 11],
  ]);

  // Animated glowing dot along hypotenuse
  const frac = (t * 0.8) % 1;
  const dotx = ax + (bx - ax) * frac;
  const doty = ay + (by - ay) * frac;
  [[14,30],[10,60],[6,120]].forEach(([ro, al]) => {
    ctx.save();
    ctx.fillStyle = `rgba(${hypR},${hypG},60,${(al/255).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(dotx, doty, ro, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  });
  circle(dotx, doty, 4, '#ffffff');
}

// ════════════════════════════════════════════════════════════
//  ANIMATION 2 — Kvadrat tenglama (parabola)
//  params: qa, qb, qc  →  y = qa*x² + qb*x + qc
// ════════════════════════════════════════════════════════════
function drawParabola(W, H, t) {
  const qa = animParams.qa ?? 1;
  const qb = animParams.qb ?? -5;
  const qc = animParams.qc ?? 6;

  if (qa === 0) {
    label('a = 0 bo\'lishi mumkin emas', W/2 - 110, H/2, '#ff9060', 14);
    return;
  }

  const D  = qb*qb - 4*qa*qc;
  const xv = -qb / (2*qa);            // vertex x
  const yv = qc - qb*qb / (4*qa);    // vertex y

  let roots = [];
  if (D >= 0) {
    roots = [
      (-qb - Math.sqrt(D)) / (2*qa),
      (-qb + Math.sqrt(D)) / (2*qa),
    ].sort((a2, b2) => a2 - b2);
  }

  // Determine axis range around vertex
  const xSpan = Math.max(3, roots.length === 2 ? Math.abs(roots[1] - roots[0]) + 1 : 2) * 1.6;
  const xMin  = xv - xSpan, xMax = xv + xSpan;

  const cx = W / 2, cy = H / 2;
  const sx = (W - 80) / (xMax - xMin);

  // Compute y extent for vertical scaling
  const ys = [];
  for (let i = 0; i <= 60; i++) {
    const x = xMin + (xMax - xMin) * (i / 60);
    ys.push(qa * x*x + qb*x + qc);
  }
  const yMin = Math.min(...ys), yMax = Math.max(...ys);
  const ySpan = Math.max(Math.abs(yMax - yMin), 1);
  const sy = (H - 80) / ySpan;

  // Compute zero crossing for cy
  const cyOffset = cy + (yMin + yMax) / 2 * sy;

  function toS(x, y) {
    return [
      40 + (x - xMin) * sx,
      cyOffset - y * sy,
    ];
  }

  gridLines(cx, cyOffset, 50, W, H);
  axes(cx, cyOffset, W, H);

  // Shaded area under curve
  const xs = [];
  for (let i = 0; i <= 120; i++) xs.push(xMin + (xMax - xMin) * (i / 120));
  const pts = xs.map(x => toS(x, qa * x*x + qb*x + qc));
  const valid = pts.filter(([, py]) => py > 5 && py < H - 5);
  if (valid.length > 1) {
    ctx.save(); ctx.fillStyle = 'rgba(74,158,255,0.06)';
    ctx.beginPath(); ctx.moveTo(valid[0][0], valid[0][1]);
    valid.forEach(([px, py]) => ctx.lineTo(px, py));
    ctx.lineTo(valid[valid.length-1][0], cyOffset);
    ctx.lineTo(valid[0][0], cyOffset);
    ctx.closePath(); ctx.fill(); ctx.restore();
  }

  // Parabola with glow
  [[5,40],[3,90],[2,255]].forEach(([lw, al]) => {
    ctx.save(); setLine(`rgba(74,158,255,${(al/255).toFixed(2)})`, lw, []);
    ctx.beginPath();
    const drawPts = pts.filter(([, py]) => py > 4 && py < H - 4);
    if (drawPts.length) {
      ctx.moveTo(drawPts[0][0], drawPts[0][1]);
      drawPts.slice(1).forEach(([px, py]) => ctx.lineTo(px, py));
    }
    ctx.stroke(); ctx.restore();
  });

  // Roots with pulsing glow
  const pulse = Math.abs(Math.sin(t * Math.PI * 1.5));
  const rr = 255, rg = Math.round(80 + 175 * pulse);
  if (roots.length === 2) {
    roots.forEach(rx => {
      const [sx2, sy2] = toS(rx, 0);
      if (sy2 < 5 || sy2 > H - 5) return;
      [[12,40],[8,90]].forEach(([ro, al]) => {
        ctx.save(); ctx.fillStyle = `rgba(${rr},${rg},60,${(al*pulse/255).toFixed(2)})`;
        ctx.beginPath(); ctx.arc(sx2, sy2, ro, 0, Math.PI*2); ctx.fill(); ctx.restore();
      });
      circle(sx2, sy2, 5, `rgb(${rr},${rg},60)`);
      label(`x=${round2(rx)}`, sx2 - 12, sy2 + 20, '#e2e8f0', 11);
    });
  } else if (D < 0) {
    // No real roots indicator
    infoBox(W/2 - 90, H - 50, 180, 30, [['Real ildizlar yo\'q (D<0)', '#ff9060', 11]]);
  }

  // Vertex dot
  const [vsx, vsy] = toS(xv, yv);
  if (vsy > 5 && vsy < H - 5) {
    circle(vsx, vsy, 5, '#56e39f');
    label('min', vsx + 8, vsy + (qa > 0 ? -6 : 14), '#56e39f', 10);
  }

  // Formula box
  const Dval  = round2(D);
  const eqStr = `${qa === 1 ? '' : qa}x² ${qb >= 0 ? '+' : ''}${qb}x ${qc >= 0 ? '+' : ''}${qc} = 0`;
  infoBox(W - 225, 14, 218, roots.length===2 ? 72 : 52, [
    [eqStr,                                     '#8ab4f8', 13],
    [`D = ${qb}² − 4·${qa}·${qc} = ${Dval}`,  '#56e39f', 11],
    ...(roots.length===2 ? [
      [`x₁≈${round2(roots[0])}  x₂≈${round2(roots[1])}`, '#ff9060', 11],
    ] : []),
  ]);
}

// ════════════════════════════════════════════════════════════
//  ANIMATION 3 — Aylana maydoni
//  params: r (radius value in user units)
// ════════════════════════════════════════════════════════════
function drawCircleArea(W, H, t) {
  const maxR  = Math.min(W, H) * 0.30;
  const userR = Math.max(0.1, animParams.r ?? 5);
  const maxUserR = ANIM_CONTROLS.Aylana[0].max; // 20

  // Map user radius to pixel radius (use 90% of maxR at max user value)
  const pixR  = Math.min(maxR * 0.92, userR / maxUserR * maxR * 2.2);
  // Glow still pulses for visual appeal
  const pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI);
  const cx = W / 2, cy = H / 2;

  // Outer glow rings
  [[pixR+18,15],[pixR+10,30],[pixR+4,50]].forEach(([ro, al]) => {
    ctx.save(); ctx.fillStyle = `rgba(74,158,255,${(al*pulse/255).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(cx, cy, ro, 0, Math.PI*2); ctx.fill(); ctx.restore();
  });

  // Filled circle
  ctx.save();
  ctx.fillStyle   = `rgba(74,158,255,${((28+18*pulse)/255).toFixed(2)})`;
  ctx.strokeStyle = '#4a9eff'; ctx.lineWidth = 2.5; ctx.setLineDash([]);
  ctx.beginPath(); ctx.arc(cx, cy, pixR, 0, Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.restore();

  // Sector sweep
  const angle = t * 2 * Math.PI * 0.6;
  ctx.save(); ctx.fillStyle = 'rgba(86,227,159,0.12)';
  ctx.beginPath(); ctx.moveTo(cx, cy);
  ctx.arc(cx, cy, pixR, 0, -angle, true); ctx.closePath(); ctx.fill(); ctx.restore();

  // Rotating radius line
  const rx2 = cx + pixR * Math.cos(angle);
  const ry2 = cy - pixR * Math.sin(angle);
  ctx.save(); setLine('#56e39f', 2.2, []); line(cx, cy, rx2, ry2); ctx.restore();
  circle(cx, cy, 4, '#ffffff');

  // r label at midpoint of radius
  label('r', cx + (rx2-cx)*0.5 + 6, cy + (ry2-cy)*0.5 - 4, '#56e39f', 13);

  // Formula box — show exact values
  const area = round2(Math.PI * userR * userR);
  infoBox(12, H - 76, 210, 66, [
    ['S = π · r²',          '#e2e8f0', 15],
    [`r = ${userR}`,        '#4a9eff', 12],
    [`S = ${area}`,         '#56e39f', 12],
  ]);
}

// ════════════════════════════════════════════════════════════
//  ANIMATION 4 — To'g'ri burchak perimetri
//  params: a (width), b (height) in user units
// ════════════════════════════════════════════════════════════
function drawRectangle(W, H, t) {
  const userA = Math.max(1, animParams.a ?? 8);
  const userB = Math.max(1, animParams.b ?? 5);

  // Scale to canvas — fit inside 50% width, 42% height
  const maxPixW  = W * 0.50;
  const maxPixH  = H * 0.40;
  const scale    = Math.min(maxPixW / userA, maxPixH / userB);
  const a        = Math.round(userA * scale);
  const b        = Math.round(userB * scale);
  const x0       = Math.round((W - a) / 2);
  const y0       = Math.round((H - b) / 2);
  const off      = 22;

  // Rect fill
  ctx.save();
  ctx.fillStyle   = 'rgba(30,42,70,0.3)';
  ctx.strokeStyle = '#2a3550'; ctx.lineWidth = 1.5; ctx.setLineDash([]);
  ctx.fillRect(x0, y0, a, b); ctx.strokeRect(x0, y0, a, b);
  ctx.restore();

  // Dimension lines
  ctx.save(); setLine('#56e39f', 1.2, [5, 5]);
  line(x0, y0 - off, x0 + a, y0 - off);
  line(x0 + a + off, y0, x0 + a + off, y0 + b);
  ctx.restore();

  // Animated dot traversing perimeter with trail
  const perim = 2 * (a + b);
  const dist  = (t * perim * 0.6) % perim;

  function perimPt(d) {
    d = ((d % perim) + perim) % perim;
    if (d < a)        return [x0 + d,     y0];
    d -= a;
    if (d < b)        return [x0 + a,     y0 + d];
    d -= b;
    if (d < a)        return [x0 + a - d, y0 + b];
    d -= a;
    return [x0, y0 + b - d];
  }

  const trail = 70;
  for (let i = 0; i < trail; i++) {
    const [px, py] = perimPt(dist - i * perim / trail);
    const al       = Math.round(220 * Math.pow(1 - i / trail, 1.5));
    const sz       = Math.max(1, Math.round(6 * (1 - i / trail)));
    ctx.save(); ctx.fillStyle = `rgba(74,158,255,${(al/255).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }
  const [hx, hy] = perimPt(dist);
  [[12,50],[7,120]].forEach(([ro, al]) => {
    ctx.save(); ctx.fillStyle = `rgba(180,220,255,${(al/255).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(hx, hy, ro, 0, Math.PI*2); ctx.fill(); ctx.restore();
  });
  circle(hx, hy, 5, '#ffffff');

  // Labels on sides
  label(`a = ${userA}`, x0 + a/2 - 24, y0 - off - 6,    '#56e39f', 12);
  label(`b = ${userB}`, x0 + a + off + 6, y0 + b/2 + 5, '#4a9eff', 12);

  // Formula box
  const P = 2 * (userA + userB);
  infoBox(12, H - 74, 222, 64, [
    ['P = 2 · (a + b)',   '#e2e8f0', 14],
    [`a=${userA},  b=${userB}`, '#4a9eff', 11],
    [`P = 2·(${userA}+${userB}) = ${P}`, '#56e39f', 11],
  ]);
}

// ════════════════════════════════════════════════════════════
//  ANIMATION 5 — Tezlik (v = s / t)
//  params: v (speed km/h), s (distance km)
// ════════════════════════════════════════════════════════════
function drawSpeed(W, H, t) {
  const userV = Math.max(1, animParams.v ?? 60);
  const userS = Math.max(1, animParams.s ?? 120);
  const userT = round2(userS / userV);

  const yTr = H / 2;
  const xs  = Math.round(W * 0.08);
  const xe  = Math.round(W * 0.90);

  // Dashed track
  ctx.save(); setLine('#2a3560', 1.5, [6, 6]);
  line(xs, yTr, xe, yTr); ctx.restore();

  // A/B markers
  [xs, xe].forEach((xm, idx) => {
    ctx.save(); setLine('#3a4580', 1.5, []);
    line(xm, yTr - 14, xm, yTr + 14); ctx.restore();
    label(['A', 'B'][idx], xm - 7, yTr - 22, '#4a6090', 11);
  });

  // Moving ball
  const frac = (t * 0.55) % 1;
  const ox   = Math.round(xs + (xe - xs) * frac);

  // Shadow
  ctx.save(); ctx.fillStyle = 'rgba(74,158,255,0.2)';
  ctx.beginPath(); ctx.ellipse(ox+3, yTr+4, 17, 10, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();

  circle(ox, yTr, 15, '#4a9eff', '#8ab4f8', 2.5);
  ctx.save(); ctx.fillStyle = 'rgba(180,220,255,0.4)';
  ctx.beginPath(); ctx.ellipse(ox-4, yTr-5, 6, 5, 0, 0, Math.PI*2); ctx.fill(); ctx.restore();

  // Speed arrow
  arrow(ox+16, yTr, ox+66, yTr, '#56e39f', 2.2);
  label('v', ox+36, yTr-10, '#56e39f', 11);

  // Elapsed distance marker
  ctx.save(); setLine('#ff9060', 1.5, []);
  line(xs, yTr+36, ox, yTr+36);
  [xs, ox].forEach(xm => line(xm, yTr+30, xm, yTr+42)); ctx.restore();
  const sDone = round2(frac * userS);
  label(`s = ${sDone} km`, Math.round((xs+ox)/2) - 30, yTr+56, '#ff9060', 11);

  // Trailing particles
  for (let i = 0; i < 8; i++) {
    const px2 = ox - 20 - i * 12;
    if (px2 < xs) break;
    const al2 = Math.round(180 * Math.pow(1 - i/8, 2));
    const rsz = Math.max(2, Math.round(5*(1-i/8)));
    ctx.save(); ctx.fillStyle = `rgba(74,158,255,${(al2/255).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(px2, yTr+(i%2)*4-2, rsz, 0, Math.PI*2); ctx.fill(); ctx.restore();
  }

  // Formula box
  const tDone = round2(frac * userT);
  infoBox(12, H - 90, 230, 80, [
    ['v  =  s  /  t',             '#e2e8f0', 16],
    [`v = ${userV} km/h`,         '#4a9eff', 11],
    [`s = ${userS} km,  t = ${userT} h`, '#56e39f', 11],
    [`Ótken: ${sDone} km / ${tDone} h`, '#ff9060', 11],
  ]);
}

// ════════════════════════════════════════════════════════════
//  ANIMATION 6 — Generic wave  y = A·sin(f·x + φ)
//  params: amp (amplitude), freq (frequency)
// ════════════════════════════════════════════════════════════
function drawWave(W, H, t) {
  const userAmp  = Math.max(0.1, animParams.amp  ?? 1.0);
  const userFreq = Math.max(1,   Math.round(animParams.freq ?? 3));

  const cx  = W / 2, cy = H / 2;
  const amp = userAmp * H * 0.24;

  gridLines(cx, cy, 50, W, H);
  axes(cx, cy, W, H);

  const phase = t * 2 * Math.PI;

  // Wave with glow layers
  [[8,20],[5,50],[2.5,255]].forEach(([lw, al]) => {
    ctx.save(); setLine(`rgba(74,158,255,${(al/255).toFixed(2)})`, lw, []);
    ctx.beginPath();
    let first = true;
    for (let i = 0; i < W - 20; i++) {
      const px = 10 + i;
      const py = cy - amp * Math.sin(i * userFreq * Math.PI / (W - 20) + phase);
      if (py < 5 || py > H - 5) { first = true; continue; }
      if (first) { ctx.moveTo(px, py); first = false; }
      else         ctx.lineTo(px, py);
    }
    ctx.stroke(); ctx.restore();
  });

  // Moving dot on wave
  const xp = Math.round(W * 0.6);
  const yp = cy - amp * Math.sin((xp-10) * userFreq * Math.PI / (W-20) + phase);
  [[14,40],[9,100]].forEach(([ro, al]) => {
    ctx.save(); ctx.fillStyle = `rgba(192,132,252,${(al/255).toFixed(2)})`;
    ctx.beginPath(); ctx.arc(xp, yp, ro, 0, Math.PI*2); ctx.fill(); ctx.restore();
  });
  circle(xp, yp, 5, '#ffffff');

  // Formula box
  const phaseDeg = Math.round((phase % (2 * Math.PI)) / Math.PI * 180);
  infoBox(12, 12, 220, 64, [
    [`y = ${userAmp}·sin(${userFreq}x + φ)`, '#e2e8f0', 13],
    [`A = ${userAmp},  f = ${userFreq}`,      '#4a9eff', 11],
    [`φ = ${phaseDeg}°`,                      '#c084fc', 11],
  ]);
}

// ── Misc ─────────────────────────────────────────────────────
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
