/* ============================================================
   MatematikaAI — app.js
   Tabs: Solver | Kalkulyator | Baza | Sozlamalar
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

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── State ────────────────────────────────────────────────────
let config  = { api_key: '', model: 'tilmoch' };
let history = [];
let currentUser = null; // { username, role } or null
let nerEntitiesHTML    = ''; // NER results storage (Russian)
let nerEntitiesKaaHTML = ''; // NER results storage (Karakalpak)

const ANON_LIMITS = { solver: 3, photo: 2 };
const REG_BONUS   = { solver: 5, photo: 5 };

function anonCount(key)       { return parseInt(localStorage.getItem('anon_' + key) || '0'); }
function anonIncr(key)        { localStorage.setItem('anon_' + key, anonCount(key) + 1); }
function anonBonusUsed(key)   { return localStorage.getItem('bonus_used_' + key) === '1'; }
function anonSetBonus(key)    { localStorage.setItem('bonus_used_' + key, '1'); }

function canUseFeature(key) {
  if (currentUser) return true;
  const limit = ANON_LIMITS[key] + (anonBonusUsed(key) ? 0 : 0);
  // bonus is given at registration — stored as extended_limit_<key>
  const extended = parseInt(localStorage.getItem('extended_' + key) || '0');
  return anonCount(key) < (ANON_LIMITS[key] + extended);
}
function showLimitModal(key) {
  const modal = $('limitModal');
  if (modal) {
    $('limitModalText').textContent = key === 'photo'
      ? `Вы использовали ${ANON_LIMITS.photo} бесплатных попыток фото-решателя. Зарегистрируйтесь чтобы получить ещё +${REG_BONUS.photo}.`
      : `Вы использовали ${ANON_LIMITS.solver} бесплатных попыток. Зарегистрируйтесь чтобы получить ещё +${REG_BONUS.solver}.`;
    modal.style.display = 'flex';
  }
}

// ════════════════════════════════════════════════════════════
//  TAB SWITCHING
// ════════════════════════════════════════════════════════════
function selectTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (btn) btn.classList.add('active');
  $('panel-' + tab).classList.add('active');
  document.querySelector('.app-shell').classList.remove('home-mode');
  localStorage.setItem('lastTab', tab);
  if (tab === 'admin' && currentUser?.role === 'admin') loadAdminPanel();
  if (tab === 'tasks') loadTasksTab();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => selectTab(btn.dataset.tab));
});

document.querySelectorAll('.home-card').forEach(card => {
  card.addEventListener('click', () => selectTab(card.dataset.tab));
});

function initHomeOrLastTab() {
  const lastTab   = localStorage.getItem('lastTab');
  const validTabs = ['solver', 'calc', 'kb', 'tasks', 'admin'];
  const tabValid  = lastTab
    && validTabs.includes(lastTab)
    && (lastTab !== 'admin' || currentUser?.role === 'admin');

  if (tabValid) {
    selectTab(lastTab);
  } else {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    $('panel-home').classList.add('active');
    document.querySelector('.app-shell').classList.add('home-mode');
  }
  document.documentElement.classList.remove('home-pending');
}


// ════════════════════════════════════════════════════════════
//  THEME
// ════════════════════════════════════════════════════════════
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const btn = $('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️ Светлая' : '🌙 Тёмная';
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function initTheme() {
  applyTheme(localStorage.getItem('theme') || 'dark');
}

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  await loadAuth();
  initHomeOrLastTab();
  await loadConfig();
  await loadHistory();
  kbInit();
});

// ════════════════════════════════════════════════════════════
//  CONFIG / SETTINGS
// ════════════════════════════════════════════════════════════
async function loadConfig() {
  try {
    const r = await fetch('/api/config');
    config = await r.json();
  } catch (_) {}
}

// ════════════════════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════════════════════

async function loadAuth() {
  try {
    const r    = await fetch('/api/auth/me');
    const data = await r.json();
    currentUser = data.authenticated ? { username: data.username, role: data.role } : null;
  } catch (_) {
    currentUser = null;
  }
  updateAuthUI();
}

function updateAuthUI() {
  const chip      = $('userChip');
  const loginBtn  = $('loginBtn');
  const adminTab  = $('adminTabBtn');
  const chipName  = $('userChipName');
  const suggestBtn = $('kbSuggestBtn');

  if (currentUser) {
    chip.style.display     = 'flex';
    loginBtn.style.display = 'none';
    chipName.textContent   = currentUser.username;
    if (adminTab)    adminTab.style.display   = currentUser.role === 'admin' ? '' : 'none';
    if (suggestBtn)  suggestBtn.style.display = '';
  } else {
    chip.style.display     = 'none';
    loginBtn.style.display = '';
    if (adminTab)    adminTab.style.display   = 'none';
    if (suggestBtn)  suggestBtn.style.display = 'none';
  }
}

function openAuthModal(tab = 'login') {
  $('authModal').style.display = 'flex';
  switchModalTab(tab);
}

function closeAuthModal(e) {
  if (e.target === $('authModal')) $('authModal').style.display = 'none';
}

function switchModalTab(tab) {
  $('loginForm').style.display    = tab === 'login'    ? 'flex' : 'none';
  $('registerForm').style.display = tab === 'register' ? 'flex' : 'none';
  $('modalTabLogin').classList.toggle('active',    tab === 'login');
  $('modalTabRegister').classList.toggle('active', tab === 'register');
  $('loginError').textContent    = '';
  $('registerError').textContent = '';
}

async function authLogin(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  const username = $('loginUsername').value.trim();
  const password = $('loginPassword').value;
  if (btn) btn.disabled = true;
  try {
    const r = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await r.json();
    if (!r.ok) { $('loginError').textContent = data.error; return; }
    currentUser = { username: data.username, role: data.role };
    $('authModal').style.display = 'none';
    updateAuthUI();
    await loadHistory();
  } catch {
    $('loginError').textContent = 'Ошибка сети. Попробуйте ещё раз.';
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function authRegister(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  const username   = $('regUsername').value.trim();
  const email      = $('regEmail').value.trim();
  const password   = $('regPassword').value;
  const first_name = $('regFirstName').value.trim();
  const last_name  = $('regLastName').value.trim();
  const phone      = $('regPhone').value.trim();
  if (btn) btn.disabled = true;
  try {
    const r = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, email, password, first_name, last_name, phone }),
    });
    const data = await r.json();
    if (!r.ok) { $('registerError').textContent = data.error; return; }
    currentUser = { username: data.username, role: data.role };
    localStorage.setItem('extended_solver', REG_BONUS.solver);
    localStorage.setItem('extended_photo',  REG_BONUS.photo);
    $('authModal').style.display = 'none';
    updateAuthUI();
    await loadHistory();
  } catch {
    $('registerError').textContent = 'Ошибка сети. Попробуйте ещё раз.';
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function authLogout() {
  await fetch('/api/auth/logout', { method: 'POST' });
  currentUser = null;
  updateAuthUI();
  await loadHistory();
}

// ════════════════════════════════════════════════════════════
//  KB SUGGEST
// ════════════════════════════════════════════════════════════

function openSuggestModal() {
  $('suggestError').textContent = '';
  $('suggestTitle').value       = '';
  $('suggestContent').value     = '';
  $('suggestModal').style.display = 'flex';
}

function closeSuggestModal(e) {
  if (e.target === $('suggestModal')) $('suggestModal').style.display = 'none';
}

async function submitSuggestion(e) {
  e.preventDefault();
  const btn = e.submitter || e.target.querySelector('[type=submit]');
  const title   = $('suggestTitle').value.trim();
  const content = $('suggestContent').value.trim();
  if (btn) btn.disabled = true;
  try {
    const r = await fetch('/api/kb/suggest', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ title, content }),
    });
    const data = await r.json();
    if (!r.ok) { $('suggestError').textContent = data.error; return; }
    $('suggestModal').style.display = 'none';
    alert('Предложение отправлено! Администратор рассмотрит его.');
  } catch {
    $('suggestError').textContent = 'Ошибка сети. Попробуйте ещё раз.';
  } finally {
    if (btn) btn.disabled = false;
  }
}

// ════════════════════════════════════════════════════════════
//  HISTORY
// ════════════════════════════════════════════════════════════
function _nerCacheKey(problem) {
  return problem.trim().slice(0, 200);
}

function _saveNerCache(problem, entities, entities_kaa) {
  if (!entities && !entities_kaa) return;
  try {
    const cache = JSON.parse(localStorage.getItem('ner_cache') || '{}');
    cache[_nerCacheKey(problem)] = { entities, entities_kaa };
    // Ограничиваем кеш до 50 записей
    const keys = Object.keys(cache);
    if (keys.length > 50) delete cache[keys[0]];
    localStorage.setItem('ner_cache', JSON.stringify(cache));
  } catch (_) {}
}

function _getNerCache(problem) {
  try {
    const cache = JSON.parse(localStorage.getItem('ner_cache') || '{}');
    return cache[_nerCacheKey(problem)] || {};
  } catch (_) { return {}; }
}

async function loadHistory() {
  try {
    const r  = await fetch('/api/history');
    const raw = await r.json();
    // Восстанавливаем entities из localStorage-кеша
    history = raw.map(h => {
      if (h.entities) return h;
      const cached = _getNerCache(h.problem);
      return { ...h, entities: cached.entities || '', entities_kaa: cached.entities_kaa || '' };
    });
    renderHistoryList();
  } catch (_) {}
}

function renderHistoryList() {
  const list = $('historyList');
  if (!history.length) {
    list.innerHTML = '<div class="history-empty">Tarix bo\'sh</div>';
    return;
  }
  list.innerHTML = [...history].reverse().map((h, i) => {
    const origIdx = history.length - 1 - i;
    const hid = h.id ?? origIdx;
    return `
    <div class="history-item" onclick="loadHistoryItem(${origIdx})">
      <div class="h-problem">${esc(h.problem.slice(0, 80))}</div>
      <div class="h-answer">${esc((h.solution || '').slice(0, 60))}</div>
      <button class="hist-del-btn" onclick="event.stopPropagation();deleteHistoryItem(${origIdx},${hid})" title="O'chirish">×</button>
    </div>`;
  }).join('');
}

async function deleteHistoryItem(origIdx, hid) {
  await fetch(`/api/history/${hid}`, { method: 'DELETE' });
  history.splice(origIdx, 1);
  renderHistoryList();
}

function loadHistoryItem(i) {
  const h = history[i];
  $('problemInput').value = h.problem;

  // Сбросить старый NER
  nerEntitiesHTML    = h.entities     || '';
  nerEntitiesKaaHTML = h.entities_kaa || '';
  const nerArea = $('nerArea');
  if (nerArea) nerArea.innerHTML = '';

  showResult(h.solution);

  if (nerEntitiesHTML) showNERContainer();
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
  nerEntitiesHTML    = '';
  nerEntitiesKaaHTML = '';
  const nerArea = $('nerArea');
  if (nerArea) nerArea.innerHTML = '';
  setStatus('solverStatus', '');
}

function showResult(text) {
  const resultBox = $('resultBox');
  resultBox.innerHTML = `<div class="notranslate" translate="no">${text}</div>`;
  $('resultCard').style.display = 'block';
  if (typeof renderMathInElement !== 'undefined') {
    renderMathInElement(resultBox, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false },
        { left: '\\(', right: '\\)', display: false },
        { left: '\\[', right: '\\]', display: true },
      ],
      throwOnError: false,
    });
  }
}

function showNERContainer() {
  if (!nerEntitiesHTML) return;

  const nerArea = $('nerArea');
  if (!nerArea) return;
  nerArea.innerHTML = '';

  const lang = _kbLang || localStorage.getItem('lang') || 'ru';
  let nerTitle = 'Tekstti strukturalıq analizlew (NER):';
  if (lang === 'uz') nerTitle = 'Matnning strukturaviy tahlili (NER):';
  else if (lang === 'kaa') nerTitle = 'Tekstti strukturalıq analizlew (NER):';

  const nerContainer = document.createElement('div');
  nerContainer.className = 'ner-container notranslate';
  nerContainer.setAttribute('translate', 'no');

  const titleElement = document.createElement('div');
  titleElement.className = 'ner-title';
  titleElement.textContent = nerTitle;
  nerContainer.appendChild(titleElement);

  const legend = document.createElement('div');
  legend.className = 'ner-legend';
  legend.innerHTML = `
    <span class="ner-legend-item value">■ VALUE</span>
    <span class="ner-legend-item unit">■ UNIT</span>
    <span class="ner-legend-item person">■ SUBJECT / PERSON</span>
  `;
  nerContainer.appendChild(legend);

  if (nerEntitiesHTML) {
    const contentEl = document.createElement('div');
    contentEl.className = 'ner-content';
    contentEl.innerHTML = nerEntitiesHTML;
    nerContainer.appendChild(contentEl);
  }


  nerArea.appendChild(nerContainer);
}

async function solveClicked() {
  const problem = $('problemInput').value.trim();
  if (!problem) {
    setStatus('solverStatus', 'Masaleni kiriting!', true);
    return;
  }
  if (!canUseFeature('solver')) { showLimitModal('solver'); return; }

  if (!config.has_openrouter) {
    setStatus('solverStatus', 'Server: OpenRouter API key sozlanmagan!', true);
    return;
  }

  $('solveBtn').disabled = true;
  $('resultCard').style.display = 'none';
  setStatus('solverStatus', '⏳ Gemma AI yechmoqda...');

  try {
    const response = await fetch('/api/solve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ problem, lang: 'kaa' }),
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
          if (evt.status)    setStatus('solverStatus', '⏳ ' + evt.status);
          if (evt.entities)  { nerEntitiesHTML = evt.entities; showNERContainer(); }
          if (evt.ai_answer) { showResult(evt.ai_answer); setStatus('solverStatus', '⏳ Tahrirchi tarjima qilmoqda...'); }
          if (evt.done) {
            if (evt.recognized_entities) {
              nerEntitiesHTML = evt.recognized_entities;
            }
            if (evt.entities_kaa !== undefined) {
              nerEntitiesKaaHTML = evt.entities_kaa || '';
            }
            if (evt.recognized_entities || evt.entities_kaa !== undefined) {
              showNERContainer();
            }
            anonIncr('solver');
            showResult(evt.answer);
            setStatus('solverStatus', '✅ Tayyar!');
            const entry = { problem, solution: evt.answer, entities: nerEntitiesHTML, entities_kaa: nerEntitiesKaaHTML };
            _saveNerCache(problem, nerEntitiesHTML, nerEntitiesKaaHTML);
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
  if (!canUseFeature('photo')) { showLimitModal('photo'); return; }
  if (!config.has_openrouter) {
    setStatus('photoStatus', '⚠ Server: OpenRouter API key sozlanmagan!', true);
    return;
  }

  const btn = $('photoSolveBtn');
  btn.disabled = true;
  setStatus('photoStatus', '⏳ Tayarlanıp atır...');
  $('photoResultCard').style.display = 'none';

  try {
    const response = await fetch('/api/photo-solve', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        image:     photoBase64,
        mime_type: photoMime,
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
            anonIncr('photo');
            $('photoResultCard').style.display = 'block';
            const box = $('photoResultBox');
            // Preprocess LaTeX delimiters: convert \[...\] -> $$...$$ and \(...\) -> $...$
            let processed = evt.answer
              .replace(/\\\[/g, '$$')
              .replace(/\\\]/g, '$$')
              .replace(/\\\(/g, '$')
              .replace(/\\\)/g, '$');

            // Normalize spaces next to delimiters so auto-render regex matches
            processed = processed
              .replace(/\$\$\s+/g, '$$')
              .replace(/\s+\$\$/g, '$$')
              .replace(/\$\s+/g, '$')
              .replace(/\s+\$/g, '$');

            box.innerHTML = marked.parse(processed, { gfm: true, breaks: true });

            if (typeof renderMathInElement !== 'undefined') {
              renderMathInElement(box, {
                delimiters: [
                  { left: '$$', right: '$$', display: true  },
                  { left: '$',  right: '$',  display: false },
                  { left: '\\(', right: '\\)', display: false },
                  { left: '\\[', right: '\\]', display: true  },
                ],
                throwOnError: false,
              });
            } else {
              console.warn('KaTeX auto-render not available when trying to render photo result');
            }
            setStatus('photoStatus', '✅ Tayyar!');
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
//  KNOWLEDGE BASE
// ════════════════════════════════════════════════════════════
let _kbActiveId   = null;
let _kbFilter     = '';
let _kbLang       = 'ru';
let _kbMetaFilter = { school_section: '', task_type: '', grade: '', difficulty: '' };


function kbT(t) {
  return _kbLang === 'uz' ? (t.title_uz || t.title) : t.title;
}
function kbCat(t) {
  return _kbLang === 'uz' ? (t.category_uz || t.category) : t.category;
}
function kbDesc(t) {
  return _kbLang === 'uz' ? (t.description_uz || t.description) : t.description;
}
function kbPropName(p) {
  return _kbLang === 'uz' ? (p.name_uz || p.name) : p.name;
}
function kbPropVal(p) {
  return _kbLang === 'uz' ? (p.val_uz || p.val) : p.val;
}

function kbSetLang(lang) {
  _kbLang = lang;
  document.getElementById('kbLangRus').classList.toggle('active', lang === 'ru');
  document.getElementById('kbLangUzb').classList.toggle('active', lang === 'uz');
  kbRenderNav(_kbFilter);
  if (_kbActiveId) kbSelect(_kbActiveId);
}

function kbSetMetaFilter(key, val) {
  _kbMetaFilter[key] = val;
  kbRenderNav(_kbFilter);
}

function kbToggleDiff(level) {
  _kbMetaFilter.difficulty = _kbMetaFilter.difficulty === level ? '' : level;
  document.querySelectorAll('.kb2-diff-btn').forEach(b => b.classList.remove('active'));
  if (_kbMetaFilter.difficulty) {
    document.querySelector(`.kb2-diff-btn.${_kbMetaFilter.difficulty}`)
            .classList.add('active');
  }
  kbRenderNav(_kbFilter);
}

function kbResetFilters() {
  _kbMetaFilter = { school_section: '', task_type: '', grade: '', difficulty: '' };
  const sel = id => { const el = $(id); if (el) el.value = ''; };
  sel('kbFilterSection'); sel('kbFilterType'); sel('kbFilterGrade');
  document.querySelectorAll('.kb2-diff-btn').forEach(b => b.classList.remove('active'));
  kbRenderNav(_kbFilter);
}

function kbInit() {
  kbRenderNav('');
  if (KB_DATA.length) kbSelect(KB_DATA[0].id);
}

function kbFilter(q) {
  _kbFilter = q.toLowerCase().trim();
  kbRenderNav(_kbFilter);
}

function kbRenderNav(q) {
  const nav = $('kbNav');
  if (!nav) return;

  let items = KB_DATA;

  const mf = _kbMetaFilter;
  if (mf.school_section) items = items.filter(t => t.school_section === mf.school_section);
  if (mf.task_type)      items = items.filter(t => t.task_type      === mf.task_type);
  if (mf.grade)          items = items.filter(t => t.grade          === mf.grade);
  if (mf.difficulty)     items = items.filter(t => t.difficulty     === mf.difficulty);

  if (q) {
    items = items.filter(t =>
      kbT(t).toLowerCase().includes(q) || kbCat(t).toLowerCase().includes(q)
    );
  }

  if (!items.length) {
    nav.innerHTML = '<div class="kb2-empty">Ничего не найдено</div>';
    return;
  }

  if (q) {
    nav.innerHTML = items.map(t => kbNavItem(t)).join('');
    return;
  }

  const categories = _kbLang === 'uz' ? KB_CATEGORIES_UZ : KB_CATEGORIES;
  let html = '';
  for (let i = 0; i < KB_CATEGORIES.length; i++) {
    const group = items.filter(t => t.category === KB_CATEGORIES[i]);
    if (!group.length) continue;
    html += `<div class="kb2-cat-header">${esc(categories[i])}</div>`;
    html += group.map(t => kbNavItem(t)).join('');
  }
  nav.innerHTML = html || '<div class="kb2-empty">Ничего не найдено</div>';
}

function kbNavItem(t) {
  const active = t.id === _kbActiveId ? ' active' : '';
  const badge  = t.difficulty
    ? `<span class="kb2-diff-badge ${t.difficulty}"></span>`
    : '';
  return `<div class="kb2-nav-item${active}" onclick="kbSelect('${t.id}')">${badge}${esc(kbT(t))}</div>`;
}

function kbSelect(id) {
  const topic = KB_DATA.find(t => t.id === id);
  if (!topic) return;
  _kbActiveId = id;

  // Update nav highlight
  document.querySelectorAll('.kb2-nav-item').forEach(el => {
    el.classList.toggle('active', el.textContent === kbT(topic));
  });

  // Render detail
  const detail = $('kbDetail');
  if (!detail) return;

  const props = (topic.properties || []).map(p =>
    `<div class="kb2-prop-row">
      <span class="kb2-prop-name">${esc(kbPropName(p))}</span>
      <span class="kb2-prop-val">${esc(kbPropVal(p))}</span>
    </div>`
  ).join('');

  detail.innerHTML = `
    <div class="kb2-detail-inner">
      <div class="kb2-detail-head">
        <span class="kb2-cat-badge">${esc(kbCat(topic))}</span>
        <h2 class="kb2-detail-title">${topic.difficulty ? `<span class="kb2-diff-badge ${topic.difficulty}"></span>` : ''}${esc(kbT(topic))}</h2>
        <div class="kb2-formula-box">${esc(topic.formula)}</div>
      </div>
      <div class="kb2-detail-body">
        <div class="kb2-desc">${esc(kbDesc(topic))}</div>
        ${props ? `<div class="kb2-props">${props}</div>` : ''}
      </div>
      ${topic.svg ? `<div class="kb2-diagram">${topic.svg}</div>` : ''}
    </div>
  `;
}


// ════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ════════════════════════════════════════════════════════════

async function loadAdminPanel() {
  try {
    // Load users
    const ru = await fetch('/api/admin/users');
    if (ru.ok) {
      const users = await ru.json();
      const ul = $('adminUsersList');
      if (ul) {
        ul.innerHTML = users.map(u => `
          <div class="admin-row">
            <span class="admin-row-name">${esc(u.username)}</span>
            <span class="suggestion-meta">${esc(u.email || '')}</span>
            <span class="role-badge ${u.role === 'admin' ? 'admin' : 'user'}">${esc(u.role)}</span>
            <div class="admin-row-actions">
              <button class="btn-ghost-sm" onclick="adminSetRole(${u.id}, '${u.role === 'admin' ? 'user' : 'admin'}')">
                ${u.role === 'admin' ? 'Разжаловать' : 'Сделать админом'}
              </button>
              <button class="btn-ghost-sm" onclick="adminDeleteUser(${u.id})">Удалить</button>
            </div>
          </div>
        `).join('') || '<div class="kb2-empty">Нет пользователей</div>';
      }
    }

    // Load suggestions
    const rs = await fetch('/api/kb/suggestions');
    if (rs.ok) {
      const suggestions = await rs.json();
      const sl = $('adminSuggestionsList');
      const badge = $('suggestionsBadge');
      if (badge) {
        const pending = suggestions.filter(s => s.status === 'pending');
        badge.textContent = pending.length || '';
        badge.style.display = pending.length ? '' : 'none';
      }
      if (sl) {
        sl.innerHTML = suggestions.map(s => `
          <div class="admin-row" style="flex-direction:column;align-items:flex-start">
            <div style="display:flex;align-items:center;gap:.5rem;width:100%">
              <span class="admin-row-name">${esc(s.title)}</span>
              <span class="suggestion-meta">от ${esc(s.username || '?')}</span>
              <div class="admin-row-actions">
                ${s.status === 'pending' ? `
                  <button class="btn-ghost-sm" onclick="adminApproveSuggestion(${s.id})">✓ Принять</button>
                  <button class="btn-ghost-sm" onclick="adminRejectSuggestion(${s.id})">✗ Отклонить</button>
                ` : `<span class="role-badge ${s.status === 'approved' ? 'admin' : 'user'}">${esc(s.status)}</span>`}
              </div>
            </div>
            <div class="suggestion-content">${esc(s.content)}</div>
          </div>
        `).join('') || '<div class="kb2-empty">Нет предложений</div>';
      }
    }
  } catch (e) {
    console.error('Admin panel load error:', e);
  }
}

async function adminApproveSuggestion(id) {
  await fetch(`/api/kb/suggestions/${id}/approve`, { method: 'POST' });
  loadAdminPanel();
}

async function adminRejectSuggestion(id) {
  await fetch(`/api/kb/suggestions/${id}/reject`, { method: 'POST' });
  loadAdminPanel();
}

async function adminSetRole(id, role) {
  await fetch(`/api/admin/users/${id}`, {
    method:  'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ role }),
  });
  loadAdminPanel();
}

async function adminDeleteUser(id) {
  if (!confirm('Удалить пользователя? Это действие нельзя отменить.')) return;
  await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
  loadAdminPanel();
}

// ════════════════════════════════════════════════════════════
//  MASHQ — Tasks / Training Tab
// ════════════════════════════════════════════════════════════

let _taskTopicIds = new Set();
let _taskCounts   = null;
let _taskProgress = {};
let _taskCurTopic = null;
let _taskProblems = [];
let _taskProbIdx  = 0;
let _taskCorrect  = 0;
let _taskAnswered = new Set();
let _tasksLang    = 'ru';

function _taskFieldText(item, field) {
  return _tasksLang === 'uz' ? (item[field + '_uz'] || item[field]) : item[field];
}

function _loadTaskProgress() {
  try { return JSON.parse(localStorage.getItem('mashq_progress') || '{}'); }
  catch { return {}; }
}

function _saveTaskProgress(topicId, correct, total) {
  const prog = _loadTaskProgress();
  const prev = prog[String(topicId)];
  if (!prev || correct > prev.correct) {
    prog[String(topicId)] = { correct, total };
    localStorage.setItem('mashq_progress', JSON.stringify(prog));
    _taskProgress = prog;
  }
}

async function loadTasksTab() {
  _taskProgress = _loadTaskProgress();
  const list = $('tasksTopicList');
  if (!list) return;
  try {
    let counts;
    if (typeof PROBLEMS_DATA !== 'undefined') {
      counts = {};
      for (const [topicId, problems] of Object.entries(PROBLEMS_DATA)) {
        counts[topicId] = problems.length;
      }
    } else {
      const r = await fetch('/api/problems/counts');
      counts = await r.json();
    }
    _taskCounts   = counts;
    _taskTopicIds = new Set(Object.keys(counts).map(String));
    renderTasksList(counts);
  } catch {
    list.innerHTML = `<div class="tasks-empty">${_tasksLang === 'uz' ? 'Yuklash muvaffaqiyatsiz yakunlandi' : 'Загрузка не удалась'}</div>`;
  }
}

function tasksSetLang(lang) {
  _tasksLang = lang;

  const ruBtn = $('tasksLangRu');
  const uzBtn = $('tasksLangUz');
  if (ruBtn) ruBtn.classList.toggle('active', lang === 'ru');
  if (uzBtn) uzBtn.classList.toggle('active', lang === 'uz');

  // Перерисовать список тем (с заголовками категорий)
  if (_taskCounts) {
    renderTasksList(_taskCounts);
  } else {
    loadTasksTab();
  }

  // Если открыт экран практики — перестроить
  const practiceScreen = $('tasks-screen-practice');
  if (practiceScreen && practiceScreen.style.display !== 'none' && _taskCurTopic) {
    buildPracticeScreen();
  }

  // Если открыт экран результатов — перерисовать
  const resultsScreen = $('tasks-screen-results');
  if (resultsScreen && resultsScreen.style.display !== 'none') {
    renderTaskResults(_taskCorrect, _taskProblems.length);
  }
}

function renderTasksList(counts) {
  const list = $('tasksTopicList');
  if (!list) return;

  let html = '';
  for (let i = 0; i < KB_CATEGORIES.length; i++) {
    const cat   = KB_CATEGORIES[i];
    const group = KB_DATA.filter(t =>
      t.category === cat && _taskTopicIds.has(String(t.id))
    );
    if (!group.length) continue;

    html += `<div class="tasks-cat-label">${esc(_tasksLang === 'uz' ? (KB_CATEGORIES_UZ[i] || cat) : cat)}</div>`;
    html += `<div class="tasks-cat-group">`;
    html += group.map(t => {
      const total   = counts[String(t.id)] || 0;
      const prog    = _taskProgress[String(t.id)] || { correct: 0, total };
      const correct = prog.correct;
      const pct     = total ? Math.round(correct / total * 100) : 0;
      const done    = correct >= total && total > 0;
      const dot     = t.difficulty || 'medium';
      return `
        <div class="tasks-topic-row" onclick="selectTopic('${t.id}')">
          <div class="tasks-topic-header">
            <span class="tasks-diff-dot ${dot}"></span>
            <div class="tasks-topic-name">${esc(_tasksLang === 'uz' ? (t.title_uz || t.title) : t.title)}</div>
          </div>
          <div class="tasks-topic-footer">
            <div class="tasks-progress-wrap">
              <div class="tasks-progress-bar">
                <div class="tasks-progress-fill" style="width:${pct}%"></div>
              </div>
              <span class="tasks-pct">${correct}/${total}</span>
            </div>
            <button class="tasks-start-btn${done ? ' done' : ''}">${done ? '✓' : '▶'}</button>
          </div>
        </div>`;
    }).join('');
    html += `</div>`;
  }

  list.innerHTML = html || `<div class="tasks-empty">${_tasksLang === 'uz' ? 'Bazada hozircha vazifalar yoʻq' : 'Задач пока нет в базе'}</div>`;
  showTasksScreen('list');
}

function showTasksScreen(name) {
  ['list', 'practice', 'results', 'translator'].forEach(s => {
    const el = $('tasks-screen-' + s);
    if (el) el.style.display = s === name ? '' : 'none';
  });
}

async function selectTopic(topicId) {
  _taskCurTopic = KB_DATA.find(t => String(t.id) === String(topicId));
  if (!_taskCurTopic) return;

  try {
    let problems;
    if (typeof PROBLEMS_DATA !== 'undefined' && PROBLEMS_DATA[topicId]) {
      problems = PROBLEMS_DATA[topicId];
    } else {
      const r = await fetch(`/api/problems/${topicId}`);
      problems = await r.json();
    }
    if (!problems.length) return;

    _taskProblems = [...problems].sort(() => Math.random() - 0.5);
    _taskProbIdx  = 0;
    _taskCorrect  = 0;
    _taskAnswered = new Set();

    buildPracticeScreen();
    showTasksScreen('practice');
  } catch { /* silently ignore */ }
}

function buildPracticeScreen() {
  const screen = $('tasks-screen-practice');
  if (!screen) return;

  const t     = _taskCurTopic;
  const total = _taskProblems.length;

  const dots = _taskProblems.map((_, i) =>
    `<span class="practice-dot" onclick="jumpToTaskProblem(${i})"></span>`
  ).join('');

  screen.innerHTML = `
    <div class="practice-header">
      <button class="practice-back-btn" onclick="showTasksScreen('list')">← ${_tasksLang === 'uz' ? 'Ortga' : 'Назад'}</button>
      <span class="practice-topic-name">${esc(_taskFieldText(t, 'title'))}</span>
      <div class="practice-dots" id="practiceDots">${dots}</div>
      <span class="practice-counter" id="practiceCounter">1 / ${total}</span>
    </div>
    <div class="practice-layout">
      <div class="practice-left">
        <div id="practiceQuestion" class="practice-question"></div>
        <div id="practiceAnswerArea"></div>
        <div class="practice-feedback" id="practiceFeedback" style="display:none"></div>
      </div>
      <div class="practice-right">
        <div class="practice-formula-box">${esc(t.formula || '—')}</div>
        <div class="practice-hint" id="practiceHint" style="display:none"></div>
      </div>
    </div>`;

  renderTaskProblem(0);
}

function renderTaskProblem(idx) {
  _taskProbIdx = idx;
  const p     = _taskProblems[idx];
  const total = _taskProblems.length;

  const dotsEl = $('practiceDots');
  if (dotsEl) {
    dotsEl.querySelectorAll('.practice-dot').forEach((d, i) => {
      d.classList.toggle('current',  i === idx);
      d.classList.toggle('answered', i !== idx && _taskAnswered.has(i));
    });
  }

  const counter = $('practiceCounter');
  if (counter) counter.textContent = `${idx + 1} / ${total}`;

  const feedback = $('practiceFeedback');
  if (feedback) { feedback.style.display = 'none'; feedback.textContent = ''; feedback.className = 'practice-feedback'; }
  const hint = $('practiceHint');
  if (hint) { hint.style.display = 'none'; hint.textContent = ''; }

  const qEl = $('practiceQuestion');
  if (qEl) qEl.textContent = _taskFieldText(p, 'question');

  const aEl = $('practiceAnswerArea');
  if (!aEl) return;

  if (_taskAnswered.has(idx)) {
    aEl.innerHTML = `<div class="practice-feedback correct" style="display:block">✓ ${_tasksLang === 'uz' ? 'Javob berildi' : 'Отвечено'}</div>`;
    return;
  }

  if (p.type === 'input') {
    aEl.innerHTML = `
      <div class="practice-input-row">
        <input type="text" class="practice-input" id="practiceInput" placeholder="${_tasksLang === 'uz' ? 'Javob...' : 'Ответ...'}">
        <button class="btn-primary" onclick="checkTaskInput()">${_tasksLang === 'uz' ? 'Tekseriw' : 'Проверить'}</button>
      </div>`;
  } else {
    const opts = (p.choices || []).map((ch, i) => {
      const label = _tasksLang === 'uz' && Array.isArray(p.choices_uz) ? (p.choices_uz[i] || ch) : ch;
      return `<button class="practice-choice-btn" data-val="${esc(label)}" onclick="checkTaskChoice(this)">${esc(label)}</button>`;
    }).join('');
    aEl.innerHTML = `<div class="practice-choice-grid">${opts}</div>`;
  }
}

// ════════════════════════════════════════════════════════════
// TRANSLATOR - Karakalpak tab
// ════════════════════════════════════════════════════════════

async function translatorTranslate() {
  const input = $('translatorInput');
  const output = $('translatorOutput');
  const status = $('translatorStatus');
  const sourceLang = $('translatorSourceLang');
  
  if (!input || !input.value.trim()) {
    if (status) status.textContent = '⚠️ Teksti kiriting!';
    return;
  }
  
  if (status) status.textContent = '⏳ Awdarmaqta...';
  
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        texts: [input.value.trim()],
        source_lang: sourceLang ? sourceLang.value : 'rus_Cyrl',
        target_lang: 'kaa_Latn',
        model: 'tilmoch'
      })
    });
    
    if (response.status === 200) {
      const data = await response.json();
      const translated = data.translations && data.translations[0] ? data.translations[0] : '';
      if (output) output.textContent = translated;
      if (status) status.textContent = '✅ Tamamlandi!';
    } else {
      const error = await response.json();
      if (status) status.textContent = '❌ Xatosi: ' + (error.error || 'Noma\'lum xatosi');
      if (output) output.textContent = '';
    }
  } catch (err) {
    if (status) status.textContent = '❌ Jáltanis xatosi: ' + err.message;
    if (output) output.textContent = '';
  }
}

function translatorCopy() {
  const output = $('translatorOutput');
  if (!output || !output.textContent.trim()) {
    alert('Awdarmá nátija jo\'k!');
    return;
  }
  
  navigator.clipboard.writeText(output.textContent).then(() => {
    alert('✓ Kóshirildi!');
  }).catch(() => {
    alert('❌ Kóshiriliba qatnalgan!');
  });
}

async function translateToKaa(texts) {
  try {
    const r = await fetch('/api/translate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ texts, source_lang: 'rus_Cyrl', target_lang: 'kaa_Latn', model: 'tilmoch' }),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return Array.isArray(data.translations) ? data.translations : null;
  } catch (_) {
    return null;
  }
}

function jumpToTaskProblem(idx) {
  renderTaskProblem(idx);
}

function _taskNormalize(s) {
  return String(s).trim().toLowerCase()
    .split(',').map(x => x.trim()).filter(Boolean).sort();
}

function checkTaskInput() {
  const p        = _taskProblems[_taskProbIdx];
  const input    = $('practiceInput');
  const feedback = $('practiceFeedback');
  if (!input || !feedback) return;
  if (input.classList.contains('correct') || input.classList.contains('wrong')) return;

  const given    = _taskNormalize(input.value);
  const expected = _taskNormalize(_taskFieldText(p, 'answer'));

  const correct = given.length === expected.length && given.every((v, i) => {
    const a = parseFloat(v), b = parseFloat(expected[i]);
    return !isNaN(a) && !isNaN(b) ? Math.abs(a - b) < 0.01 : v === expected[i];
  });

  input.className        = 'practice-input ' + (correct ? 'correct' : 'wrong');
  feedback.style.display = 'block';
  const feedbackRu       = correct
    ? (_tasksLang === 'uz' ? '✓ Toʻgʻri!' : '✓ Правильно!')
    : (_tasksLang === 'uz' ? '✗ Notoʻgʻri' : '✗ Неверно');
  feedback.textContent = feedbackRu;
  feedback.className   = 'practice-feedback ' + (correct ? 'correct' : 'wrong');

  if (correct) {
    _taskCorrect++;
    _taskAnswered.add(_taskProbIdx);
    showTaskNext();
  } else if (p.hint) {
    const hint = $('practiceHint');
    if (hint) { hint.textContent = _taskFieldText(p, 'hint'); hint.style.display = 'block'; }
  }

  if (_tasksLang === 'kaa') {
    const hintText    = (!correct && p.hint) ? _taskFieldText(p, 'hint') : '';
    const toTranslate = hintText ? [feedbackRu, hintText] : [feedbackRu];
    translateToKaa(toTranslate).then(translations => {
      if (!translations) return;
      feedback.textContent = translations[0] || feedbackRu;
      if (hintText && translations[1]) {
        const hint = $('practiceHint');
        if (hint) hint.textContent = translations[1];
      }
    });
  }
}

function checkTaskChoice(btn) {
  const p       = _taskProblems[_taskProbIdx];
  const correct = btn.dataset.val === _taskFieldText(p, 'answer');

  btn.closest('.practice-choice-grid').querySelectorAll('.practice-choice-btn').forEach(b => {
    b.disabled = true;
    if (b.dataset.val === _taskFieldText(p, 'answer')) b.classList.add('correct');
  });
  if (!correct) btn.classList.add('wrong');

  if (correct) {
    _taskCorrect++;
    _taskAnswered.add(_taskProbIdx);
    showTaskNext();
  } else if (p.hint) {
    const hint = $('practiceHint');
    const hintText = _taskFieldText(p, 'hint');
    if (hint) { hint.textContent = hintText; hint.style.display = 'block'; }
    if (_tasksLang === 'kaa') {
      translateToKaa([hintText]).then(translations => {
        if (translations && translations[0] && hint) hint.textContent = translations[0];
      });
    }
  }
}

function showTaskNext() {
  const aEl = $('practiceAnswerArea');
  if (!aEl) return;

  if (_taskProbIdx >= _taskProblems.length - 1) {
    setTimeout(() => finishSession(), 700);
    return;
  }

  if (aEl.querySelector('.practice-next-btn')) return;

  const btn = document.createElement('button');
  btn.className   = 'btn-ghost-sm practice-next-btn';
  btn.textContent = _tasksLang === 'uz' ? 'Keyingi →' : 'Следующая →';
  btn.onclick     = () => renderTaskProblem(_taskProbIdx + 1);
  aEl.appendChild(btn);
}

function finishSession() {
  if (!_taskCurTopic) return;
  _saveTaskProgress(String(_taskCurTopic.id), _taskCorrect, _taskProblems.length);
  renderTaskResults(_taskCorrect, _taskProblems.length);
  showTasksScreen('results');
}

function retryTasks() {
  _taskProblems = [..._taskProblems].sort(() => Math.random() - 0.5);
  _taskProbIdx  = 0;
  _taskCorrect  = 0;
  _taskAnswered = new Set();
  buildPracticeScreen();
  showTasksScreen('practice');
}

function renderTaskResults(correct, total) {
  const screen = $('tasks-screen-results');
  if (!screen) return;

  const pct   = total ? Math.round(correct / total * 100) : 0;
  const ratio = total ? correct / total : 0;
  const stars = correct === total && total > 0 ? 5
              : ratio >= 0.85 ? 4
              : ratio >= 0.70 ? 3
              : ratio >= 0.50 ? 2
              : 1;

  screen.innerHTML = `
    <div class="results-inner">
      <div class="results-stars">${'★'.repeat(stars)}${'☆'.repeat(5 - stars)}</div>
      <div class="results-topic-name">${esc(_taskFieldText(_taskCurTopic, 'title'))}</div>
      <div class="results-score">${correct} ${_tasksLang === 'uz' ? 'dan' : 'из'} ${total}</div>
      <div class="results-bar-wrap">
        <div class="results-bar-fill" style="width:${pct}%"></div>
      </div>
      <div class="results-pct">${pct}% ${_tasksLang === 'uz' ? 'toʻgʻri' : 'правильных'}</div>
      <div class="results-actions">
        <button class="btn-ghost" onclick="retryTasks()">${_tasksLang === 'uz' ? 'Yana bir bor' : 'Ещё раз'}</button>
        <button class="btn-primary" onclick="showTasksScreen('list');loadTasksTab()">${_tasksLang === 'uz' ? 'Boshqa mavzu' : 'Другая тема'}</button>
      </div>
    </div>`;
}
