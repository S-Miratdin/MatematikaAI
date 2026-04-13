# -*- coding: utf-8 -*-
# Flask backend for MatematikaAI — Qoraqalpoqcha
# Ollama -> Tahrirchi -> Karakalpak answer

from flask import Flask, request, jsonify, Response, send_from_directory
import json, os, requests, base64, tempfile

try:
    from pix2text import Pix2Text
    from sympy import sympify, solve
    from sympy.abc import x as sym_x
    _p2t = None   # lazy-init при первом запросе
    PIX2TEXT_OK = True
except ImportError:
    PIX2TEXT_OK = False

app = Flask(__name__, static_folder='.', static_url_path='')

# ─────────────────────────────────────────────
# FILES
# ─────────────────────────────────────────────
KB_FILE      = 'knowledge_base.json'
HISTORY_FILE = 'history.json'
CONFIG_FILE  = 'config.json'

def _mul_table():
    rows = []
    for a in range(1, 10):
        row = "  ".join(f"{a}×{b}={a*b:<3}" for b in range(1, 10))
        rows.append(row)
    return "\n".join(rows)

def _sq_cube_table():
    lines = ["n    n²     n³"]
    lines.append("─" * 20)
    for n in range(1, 10):
        lines.append(f"{n}    {n**2:<6} {n**3}")
    return "\n".join(lines)

def _add_table():
    header = "   " + "  ".join(f"+{b}" for b in range(1, 10))
    rows   = [header, "─" * len(header)]
    for a in range(1, 10):
        row = f"{a}  " + "   ".join(f"{a+b:<2}" for b in range(1, 10))
        rows.append(row)
    return "\n".join(rows)

def _div_table():
    lines = []
    for a in range(1, 10):
        parts = []
        for b in range(1, 10):
            val = a / b
            s   = f"{int(val)}" if val == int(val) else f"{val:.2f}".rstrip('0')
            parts.append(f"{a}÷{b}={s}")
        lines.append("  ".join(parts))
    return "\n".join(lines)

DEFAULT_KB = [
    # ── Formulalar ──────────────────────────────────────────
    {"title": "Kvadrat tenglama",          "content": "ax^2 + bx + c = 0\nD = b^2 - 4ac\nx = (-b +/- sqrt(D)) / 2a"},
    {"title": "Pifagor teoremasi",         "content": "a^2 + b^2 = c^2"},
    {"title": "Aylana maydoni",            "content": "S = pi * r^2"},
    {"title": "To'g'ri burchak perimetri", "content": "P = 2(a + b)"},
    {"title": "Tezlik",                    "content": "v = s / t"},
    # ── Arifmetika jadvallari ───────────────────────────────
    {"title": "Ko'paytirishlar jadvali",   "content": _mul_table()},
    {"title": "Kvadratlar va kublar",      "content": _sq_cube_table()},
    {"title": "Qo'shish jadvali",         "content": _add_table()},
    {"title": "Bo'lish jadvali",          "content": _div_table()},
]

# Titles of the arithmetic tables — used to keep KB in sync on startup
_ARITH_TITLES = {
    "Ko'paytirishlar jadvali",
    "Kvadratlar va kublar",
    "Qo'shish jadvali",
    "Bo'lish jadvali",
}

def _sync_arith_tables(kb: list) -> bool:
    """Add missing arithmetic tables to an existing KB.  Returns True if changed."""
    existing_titles = {e["title"] for e in kb}
    changed = False
    for entry in DEFAULT_KB:
        if entry["title"] in _ARITH_TITLES and entry["title"] not in existing_titles:
            kb.append(entry)
            changed = True
    return changed

def save_json(file, data):
    with open(file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def load_json(file, default):
    if not os.path.exists(file):
        save_json(file, default)
        return default
    try:
        with open(file, 'r', encoding='utf-8') as f:
            text = f.read().strip()
        return json.loads(text) if text else default
    except Exception:
        return default

# ─────────────────────────────────────────────
# TAHRIRCHI TRANSLATE
# ─────────────────────────────────────────────
TAHRIRCHI_URL = 'https://websocket.tahrirchi.uz/translate-v2'

def tahrirchi_translate(text, source_lang, target_lang, api_key, model='tilmoch'):
    if not api_key.strip():
        return text + '\n\n[Tahrirchi: API token kiritilmagan — tarjima bajarilmadi]'
    headers = {
        'Authorization': api_key.strip(),
        'Content-Type':  'application/json',
    }
    payload = {
        'text':        text,
        'source_lang': source_lang,
        'target_lang': target_lang,
        'model':       model,
    }
    try:
        resp = requests.post(TAHRIRCHI_URL, headers=headers, json=payload, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            return data.get('translated_text') or text
        else:
            return text + f'\n\n[Tahrirchi xato {resp.status_code}: {resp.text[:200]}]'
    except Exception as e:
        return text + f'\n\n[Tahrirchi ulanish xatosi: {e}]'

# ─────────────────────────────────────────────
# ROUTES — Static
# ─────────────────────────────────────────────
@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

# ─────────────────────────────────────────────
# ROUTES — Solve  (SSE streaming)
# ─────────────────────────────────────────────
@app.route('/api/solve', methods=['POST'])
def api_solve():
    data           = request.json or {}
    problem        = data.get('problem', '').strip()
    api_key        = data.get('api_key', '').strip()
    openrouter_key = data.get('openrouter_key', '').strip()
    model          = data.get('model', 'tilmoch')

    if not problem:
        return jsonify({'error': 'Masaleni kiriting'}), 400
    if not openrouter_key:
        return jsonify({'error': 'OpenRouter API key kiritilmagan'}), 400

    def generate():
        # ── Step 1: Gemma via OpenRouter ──
        yield f"data: {json.dumps({'status': 'Gemma AI yechmoqda...'})}\n\n"

        prompt = (
            "Ты помощник для решения школьных математических задач. "
            "Задача может быть написана на любом языке.\n"
            "Правила:\n"
            "- Отвечай ТОЛЬКО на русском языке.\n"
            "- Реши коротко и понятно, как для школьника.\n"
            "- Покажи простые арифметические шаги.\n"
            "- В конце напиши краткий ответ одним предложением.\n"
            "- НЕ пиши длинных объяснений — только решение и ответ.\n\n"
            f"Задача: {problem}"
        )
        try:
            r = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {openrouter_key}',
                    'Content-Type':  'application/json',
                },
                json={
                    'model':    'google/gemma-3-27b-it:free',
                    'messages': [{'role': 'user', 'content': prompt}],
                },
                timeout=60,
            )
            if r.status_code == 200:
                ai_answer = r.json()['choices'][0]['message']['content']
            else:
                ai_answer = f'OpenRouter xatosi {r.status_code}: {r.text[:200]}'
        except Exception as e:
            ai_answer = f'OpenRouter ulanish xatosi: {e}'

        if not ai_answer.strip():
            ai_answer = "AI bo'sh javob qaytardi."

        # ── Step 2: Tahrirchi ──
        yield f"data: {json.dumps({'status': 'Tahrirchi tarjima qilmoqda...'})}\n\n"

        kaa_answer = tahrirchi_translate(
            text        = ai_answer,
            source_lang = 'rus_Cyrl',
            target_lang = 'kaa_Latn',
            api_key     = api_key,
            model       = model,
        )

        yield f"data: {json.dumps({'done': True, 'answer': kaa_answer})}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )

# ─────────────────────────────────────────────
# ROUTES — Photo Solve  (SSE streaming)
# ─────────────────────────────────────────────
@app.route('/api/photo-solve', methods=['POST'])
def api_photo_solve():
    global _p2t
    data           = request.json or {}
    image_b64      = data.get('image', '').strip()
    mime_type      = data.get('mime_type', 'image/jpeg')
    openrouter_key = data.get('openrouter_key', '').strip()

    if not image_b64:
        return jsonify({'error': 'Rasm kerak'}), 400
    if not openrouter_key:
        return jsonify({'error': 'OpenRouter API key kiritilmagan'}), 400

    def generate():
        # ── Шаг 1: Сохраняем изображение во временный файл ──
        yield f"data: {json.dumps({'status': 'Rasm tayyorlanmoqda...'})}\n\n"

        ext = 'jpg' if 'jpeg' in mime_type else mime_type.split('/')[-1]
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=f'.{ext}', delete=False) as tmp:
                tmp.write(base64.b64decode(image_b64))
                tmp_path = tmp.name
        except Exception as e:
            yield f"data: {json.dumps({'done': True, 'answer': f'Rasm xatosi: {e}'})}\n\n"
            return

        formula = ''
        solution_str = ''

        # ── Шаг 2: OCR через pix2text ──
        if PIX2TEXT_OK:
            yield f"data: {json.dumps({'status': 'OCR: formula aniqlanmoqda...'})}\n\n"
            try:
                if _p2t is None:
                    _p2t = Pix2Text()
                formula = str(_p2t.recognize(tmp_path)).strip()
            except Exception as e:
                formula = ''
                yield f"data: {json.dumps({'status': f'OCR xatosi: {e}'})}\n\n"
        else:
            yield f"data: {json.dumps({'status': 'pix2text o\'rnatilmagan, LLM vision ishlatilmoqda...'})}\n\n"

        # Удаляем временный файл
        try:
            os.unlink(tmp_path)
        except Exception:
            pass

        # ── Шаг 3: SymPy — попытка решить алгебраически ──
        if PIX2TEXT_OK and formula:
            yield f"data: {json.dumps({'status': 'SymPy: masela yechilmoqda...'})}\n\n"
            try:
                expr     = sympify(formula)
                solution = solve(expr, sym_x)
                if solution:
                    solution_str = f'Algebraik yechim: x = {solution}'
            except Exception:
                solution_str = ''

        # ── Шаг 4: LLM — объяснение через OpenRouter ──
        yield f"data: {json.dumps({'status': 'AI izoh yozmoqda...'})}\n\n"

        if PIX2TEXT_OK and formula:
            # OCR сработал — отправляем текст задачи
            user_content = f'Реши задачу и объясни пошагово на русском языке:\n{formula}'
            if solution_str:
                user_content += f'\n\n(Автоматически найдено: {solution_str})'
            messages = [{'role': 'user', 'content': user_content}]
            llm_model = 'meta-llama/llama-3.1-8b-instruct:free'
        else:
            # pix2text не установлен — используем vision модель
            messages = [{
                'role': 'user',
                'content': [
                    {
                        'type': 'image_url',
                        'image_url': {'url': f'data:{mime_type};base64,{image_b64}'},
                    },
                    {
                        'type': 'text',
                        'text': 'Реши задачу на фото и объясни пошагово на русском языке.',
                    },
                ],
            }]
            llm_model = 'gemma-4-26b-a4b-it:free'

        try:
            r = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers={
                    'Authorization': f'Bearer {openrouter_key}',
                    'Content-Type': 'application/json',
                },
                json={'model': llm_model, 'messages': messages},
                timeout=60,
            )
            if r.status_code == 200:
                explanation = r.json()['choices'][0]['message']['content']
            else:
                explanation = f'OpenRouter xatosi {r.status_code}: {r.text[:300]}'
        except Exception as e:
            explanation = f'OpenRouter ulanish xatosi: {e}'

        # ── Итоговый ответ ──
        parts = []
        if formula:
            parts.append(f'📋 Formula: {formula}')
        if solution_str:
            parts.append(f'✅ {solution_str}')
        parts.append(f'\n💡 Izoh:\n{explanation}')

        yield f"data: {json.dumps({'done': True, 'answer': '\n'.join(parts)})}\n\n"

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={'Cache-Control': 'no-cache', 'X-Accel-Buffering': 'no'},
    )

# ─────────────────────────────────────────────
# ROUTES — Knowledge Base
# ─────────────────────────────────────────────
@app.route('/api/kb', methods=['GET'])
def get_kb():
    kb = load_json(KB_FILE, DEFAULT_KB)
    if _sync_arith_tables(kb):
        save_json(KB_FILE, kb)
    return jsonify(kb)

@app.route('/api/kb', methods=['POST'])
def add_kb():
    kb    = load_json(KB_FILE, DEFAULT_KB)
    entry = request.json or {}
    if not entry.get('title') or not entry.get('content'):
        return jsonify({'error': 'Nom va mazmun kerak'}), 400
    kb.append({'title': entry['title'], 'content': entry['content']})
    save_json(KB_FILE, kb)
    return jsonify({'ok': True})

@app.route('/api/kb/<int:idx>', methods=['DELETE'])
def delete_kb(idx):
    kb = load_json(KB_FILE, DEFAULT_KB)
    if 0 <= idx < len(kb):
        kb.pop(idx)
        save_json(KB_FILE, kb)
    return jsonify({'ok': True})

# ─────────────────────────────────────────────
# ROUTES — History
# ─────────────────────────────────────────────
@app.route('/api/history', methods=['GET'])
def get_history():
    return jsonify(load_json(HISTORY_FILE, []))

@app.route('/api/history', methods=['POST'])
def add_history():
    history = load_json(HISTORY_FILE, [])
    entry   = request.json or {}
    history.append(entry)
    save_json(HISTORY_FILE, history)
    return jsonify({'ok': True})

@app.route('/api/history', methods=['DELETE'])
def clear_history():
    save_json(HISTORY_FILE, [])
    return jsonify({'ok': True})

# ─────────────────────────────────────────────
# ROUTES — Config
# ─────────────────────────────────────────────
@app.route('/api/config', methods=['GET'])
def get_config():
    cfg = load_json(CONFIG_FILE, {'api_key': '', 'openrouter_key': '', 'model': 'tilmoch'})
    # Hugging Face Secrets (env vars) имеют приоритет над config.json
    if os.environ.get('TAHRIRCHI_API_KEY'):
        cfg['api_key'] = os.environ['TAHRIRCHI_API_KEY']
    if os.environ.get('OPENROUTER_API_KEY'):
        cfg['openrouter_key'] = os.environ['OPENROUTER_API_KEY']
    return jsonify(cfg)

@app.route('/api/config', methods=['POST'])
def save_config():
    config     = load_json(CONFIG_FILE, {'api_key': '', 'model': 'tilmoch'})
    new_config = request.json or {}
    config.update(new_config)
    save_json(CONFIG_FILE, config)
    return jsonify({'ok': True})

# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, threaded=True)
