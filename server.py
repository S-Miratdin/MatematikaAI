import base64
import json
import os
import re
import tempfile
import time
from collections import defaultdict

import requests
from flask import Flask, Response, jsonify, request, send_from_directory
from flask_login import current_user, login_required

from auth import admin_required, auth_bp, init_login_manager

try:
    from pix2text import Pix2Text
    from sympy import solve
    from sympy.abc import x as sym_x
    from sympy.parsing.sympy_parser import (
        implicit_multiplication_application,
        parse_expr,
        standard_transformations,
    )

    _SYMPY_TRANSFORMS = standard_transformations + (
        implicit_multiplication_application,
    )
    _SYMPY_LOCALS = {"x": sym_x}
    _p2t = None
    PIX2TEXT_OK = True
except ImportError:
    PIX2TEXT_OK = False

import db as _db

app = Flask(__name__, static_folder=".", static_url_path="")
app.config["MAX_CONTENT_LENGTH"] = 10 * 1024 * 1024  # 10 MB
app.secret_key = os.environ.get("SECRET_KEY", "dev-key-set-SECRET_KEY-in-production")
app.config["REMEMBER_COOKIE_DURATION"] = 60 * 60 * 24 * 30  # 30 days

init_login_manager(app)
app.register_blueprint(auth_bp)

# ── Rate limiting (in-memory, per IP) ────────────────────────
_rate_store: dict = defaultdict(list)
_RATE_LIMIT = 15
_RATE_WINDOW = 60


def _rate_ok(ip: str) -> bool:
    now = time.time()
    window = [t for t in _rate_store[ip] if now - t < _RATE_WINDOW]
    _rate_store[ip] = window
    if len(window) >= _RATE_LIMIT:
        return False
    _rate_store[ip].append(now)
    return True


# ── Security headers ─────────────────────────────────────────
@app.after_request
def add_security_headers(response):
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


@app.before_request
def rate_limit_auth():
    if request.path in ("/api/auth/login", "/api/auth/register"):
        ip = request.remote_addr or "unknown"
        if not _rate_ok(ip):
            return jsonify({"error": "Слишком много попыток, подождите"}), 429


# ─────────────────────────────────────────────
# FILES
# ─────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
KB_FILE = os.path.join(BASE_DIR, "knowledge_base.json")
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")


def _server_keys() -> dict:
    cfg = load_json(
        CONFIG_FILE, {"api_key": "", "openrouter_key": "", "model": "tilmoch"}
    )
    if os.environ.get("TAHRIRCHI_API_KEY"):
        cfg["api_key"] = os.environ["TAHRIRCHI_API_KEY"]
    if os.environ.get("OPENROUTER_API_KEY"):
        cfg["openrouter_key"] = os.environ["OPENROUTER_API_KEY"]
    return cfg


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
    rows = [header, "─" * len(header)]
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
            s = f"{int(val)}" if val == int(val) else f"{val:.2f}".rstrip("0")
            parts.append(f"{a}÷{b}={s}")
        lines.append("  ".join(parts))
    return "\n".join(lines)


DEFAULT_KB = [
    # ── Formulalar ──────────────────────────────────────────
    {
        "title": "Kvadrat tenglama",
        "content": "ax^2 + bx + c = 0\nD = b^2 - 4ac\nx = (-b +/- sqrt(D)) / 2a",
    },
    {"title": "Pifagor teoremasi", "content": "a^2 + b^2 = c^2"},
    {"title": "Aylana maydoni", "content": "S = pi * r^2"},
    {"title": "To'g'ri burchak perimetri", "content": "P = 2(a + b)"},
    {"title": "Tezlik", "content": "v = s / t"},
    # ── Arifmetika jadvallari ───────────────────────────────
    {"title": "Ko'paytirishlar jadvali", "content": _mul_table()},
    {"title": "Kvadratlar va kublar", "content": _sq_cube_table()},
    {"title": "Qo'shish jadvali", "content": _add_table()},
    {"title": "Bo'lish jadvali", "content": _div_table()},
]


def save_json(file, data):
    with open(file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def load_json(file, default):
    if not os.path.exists(file):
        save_json(file, default)
        return default
    try:
        with open(file, "r", encoding="utf-8") as f:
            text = f.read().strip()
        return json.loads(text) if text else default
    except Exception:
        return default


# ─────────────────────────────────────────────
# TAHRIRCHI TRANSLATE
# ─────────────────────────────────────────────
TAHRIRCHI_URL = "https://websocket.tahrirchi.uz/translate-v2"


_MATH_PROTECT_RE = re.compile(r"[A-Za-z0-9\+\-\*/\^=×÷√π∞≤≥≠<>()[\]{}]+")
_MATH_FUNCTION_RE = re.compile(r"\b(?:sqrt|sin|cos|tan|log|ln|exp|arcsin|arccos|arctan|abs|mod|pi|e)\b", re.IGNORECASE)


def _mask_math_text(text):
    placeholders = []

    def repl(match):
        token = match.group(0)
        if re.search(r"[0-9\+\-\*/\^=×÷√π∞≤≥≠<>]", token) or _MATH_FUNCTION_RE.search(token):
            placeholder = f"__MATH_PROT_{len(placeholders)}__"
            placeholders.append(token)
            return placeholder
        return token

    return _MATH_PROTECT_RE.sub(repl, text), placeholders


def _restore_math_text(text, placeholders):
    for idx, original in enumerate(placeholders):
        text = text.replace(f"__MATH_PROT_{idx}__", original)
    return text

_LATEX_FRAC_RE = re.compile(r"\\frac\{([^}]+)\}\{([^}]+)\}")


def _normalize_formula_text(text):
    text = (text or "").strip()
    if not text:
        return text
    text = _LATEX_FRAC_RE.sub(r"(\1/\2)", text)
    text = text.replace("\\times", "*")
    text = text.replace("\\cdot", "*")
    text = text.replace("\\left", "")
    text = text.replace("\\right", "")
    text = text.replace("[", "").replace("]", "")
    return re.sub(r"\s+", " ", text).strip()


def _wrap_math_inline(text):
    text = (text or "").strip()
    if not text:
        return text
    if text.startswith("$") and text.endswith("$"):
        return text
    return f"${text}$"


def tahrirchi_translate(text, source_lang, target_lang, api_key, model="tilmoch"):
    if not api_key.strip():
        return text + "\n\n[Tahrirchi: API token kirgizilmegen - awdarma orınlanbadı]"

    masked_text, placeholders = _mask_math_text(text)
    headers = {
        "Authorization": api_key.strip(),
        "Content-Type": "application/json",
    }
    payload = {
        "text": masked_text,
        "source_lang": source_lang,
        "target_lang": target_lang,
        "model": model,
    }
    try:
        resp = requests.post(TAHRIRCHI_URL, headers=headers, json=payload, timeout=30)
        if resp.status_code == 200:
            data = resp.json()
            translated = data.get("translated_text") or masked_text
            return _restore_math_text(translated, placeholders)
        else:
            return _restore_math_text(masked_text, placeholders) + f"\n\n[Tahrirchi qáte {resp.status_code}: {resp.text[:200]}]"
    except Exception as e:
        return _restore_math_text(masked_text, placeholders) + f"\n\n[Tahrirchi jalǵanıw qátesi: {e}]"


@app.route("/api/translate", methods=["POST"])
def api_translate():
    data = request.json or {}
    texts = data.get("texts", [])
    if isinstance(texts, str):
        texts = [texts]
    if not isinstance(texts, list):
        return jsonify({"error": "Invalid texts payload"}), 400

    keys = _server_keys()
    api_key = keys.get("api_key", "").strip()
    if not api_key:
        return jsonify({"error": "Tahrirchi API key server tárepinen sazlanbaǵan"}), 400

    source_lang = data.get("source_lang", "rus_Cyrl")
    target_lang = data.get("target_lang", "uz_Latn")
    translations = []
    for text in texts:
        if not text:
            translations.append("")
            continue
        translations.append(
            tahrirchi_translate(
                text,
                source_lang,
                target_lang,
                api_key,
                model=data.get("model", "tilmoch"),
            )
        )
    return jsonify({"translations": translations})


# ─────────────────────────────────────────────
# ROUTES — Static
# ─────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/config.json")
def block_config_json():
    return "", 403


# ─────────────────────────────────────────────
# ROUTES — Solve  (SSE streaming)
# ─────────────────────────────────────────────
@app.route("/api/solve", methods=["POST"])
def api_solve():
    ip = request.remote_addr or "unknown"
    if not _rate_ok(ip):
        return jsonify({"error": "Sorawlar júdá kóp, biraz kútiń"}), 429

    data = request.json or {}
    problem = data.get("problem", "").strip()

    if not problem:
        return jsonify({"error": "Masaleni kiriting"}), 400

    keys = _server_keys()
    openrouter_key = keys.get("openrouter_key", "").strip()
    api_key = keys.get("api_key", "").strip()
    model = keys.get("model", "tilmoch")

    if not openrouter_key:
        return (
            jsonify({"error": "OpenRouter API key server tárepinen sazlanbaǵan"}),
            400,
        )

    def generate():
        # ── Step 1: GPT OpenRouter ──
        yield f"data: {json.dumps({'status': 'GPT AI sheship atır...'})}\n\n"

        prompt = (
            "Ты — опытный школьный учитель математики. Твоя задача — решать текстовые и алгебраические задачи для учеников с 4 по 11 класс. Всегда пиши ответ на русском языке. Сначала проанализируй условие, затем распиши решение по шагам (с простыми пояснениями для ребенка), а в конце выведи четкий финальный ответ. "
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
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "openai/gpt-4o-mini",
                    "messages": [{"role": "user", "content": prompt}],
                },
                timeout=60,
            )
            is_success = False
            if r.status_code == 200:
                ai_answer = r.json()["choices"][0]["message"]["content"]
                is_success = True
            else:
                ai_answer = f"OpenRouter xatosi {r.status_code}: {r.text[:200]}"
        except Exception as e:
            ai_answer = f"OpenRouter ulanish xatosi: {e}"
            is_success = False

        if not ai_answer.strip():
            ai_answer = "AI bo'sh javob qaytardi."
            is_success = False

        # ── Step 2: Show AI answer immediately, then translate ──
        yield f"data: {json.dumps({'ai_answer': ai_answer})}\n\n"

        if not is_success or not api_key.strip():
            yield f"data: {json.dumps({'done': True, 'answer': ai_answer})}\n\n"
            return

        yield f"data: {json.dumps({'status': 'Tahrirchi awdarmaqta...'})}\n\n"

        kaa_answer = tahrirchi_translate(
            text=ai_answer,
            source_lang="rus_Cyrl",
            target_lang="kaa_Latn",
            api_key=api_key,
            model=model,
        )

        yield f"data: {json.dumps({'done': True, 'answer': kaa_answer})}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─────────────────────────────────────────────
# ROUTES — Photo Solve  (SSE streaming)
# ─────────────────────────────────────────────
@app.route("/api/photo-solve", methods=["POST"])
def api_photo_solve():
    ip = request.remote_addr or "unknown"
    if not _rate_ok(ip):
        return jsonify({"error": "Sorawlar júdá kóp, biraz kútiń"}), 429

    global _p2t
    data = request.json or {}
    image_b64 = data.get("image", "").strip()
    mime_type = data.get("mime_type", "image/jpeg")

    if not image_b64:
        return jsonify({"error": "Rasm kerak"}), 400

    keys = _server_keys()
    openrouter_key = keys.get("openrouter_key", "").strip()
    api_key = keys.get("api_key", "").strip()
    model = keys.get("model", "tilmoch")

    if not openrouter_key:
        return (
            jsonify({"error": "OpenRouter API key server tárepinen sazlanbaǵan"}),
            400,
        )

    def generate():
        # ── Шаг 1: Сохраняем изображение во временный файл ──
        global _p2t
        yield f"data: {json.dumps({'status': 'Súwret tayarlanbaqta...'})}\n\n"

        ext = "jpg" if "jpeg" in mime_type else mime_type.split("/")[-1]
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=f".{ext}", delete=False) as tmp:
                tmp.write(base64.b64decode(image_b64))
                tmp_path = tmp.name
        except Exception as e:
            yield f"data: {json.dumps({'done': True, 'answer': f'Súwret qátesi: {e}'})}\n\n"
            return

        formula = ""
        solution_str = ""

        # ── Шаг 2: OCR через pix2text ──
        if PIX2TEXT_OK:
            yield f"data: {json.dumps({'status': 'OCR: formula anıqlanbaqta...'})}\n\n"
            try:
                if _p2t is None:
                    _p2t = Pix2Text()
                formula = _normalize_formula_text(str(_p2t.recognize(tmp_path)))
            except Exception as e:
                formula = ""
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
            yield f"data: {json.dumps({'status': 'SymPy: másele sheshilmekte...'})}\n\n"
            try:
                expr = parse_expr(
                    formula, local_dict=_SYMPY_LOCALS, transformations=_SYMPY_TRANSFORMS
                )
                solution = solve(expr, sym_x)
                if solution:
                    if isinstance(solution, (list, tuple, set)):
                        solution_items = list(solution)
                        if len(solution_items) == 1:
                            solution_text = str(solution_items[0])
                        else:
                            solution_text = ", ".join(str(item) for item in solution_items)
                    else:
                        solution_text = str(solution)
                    solution_str = f"Algebralıq sheshim: x = {solution_text}"
            except Exception:
                solution_str = ""

        # ── Шаг 4: LLM — объяснение через OpenRouter ──
        yield f"data: {json.dumps({'status': 'AI túsinik jazbaqta...'})}\n\n"

        if PIX2TEXT_OK and formula:
            # OCR сработал — отправляем текст задачи
            user_content = (
                "Sen tajribali matematika o'qituvchisisan. Vazifang 4-11 sinf o'quvchilari uchun matnli va algebraik masalalarni yechish. "
                "Javobni faqat o'zbek tilida yoz. Avval shartni tahlil qil, keyin bosqichma-bosqich yechimni tushuntir, oxirida aniq natijani keltir:\n"
                f"{formula}"
            )
            if solution_str:
                user_content += f"\n\n(Avtomatik ravishda topilgan: {solution_str})"
            messages = [{"role": "user", "content": user_content}]
            llm_model = "openai/gpt-4o-mini"
        else:
            # pix2text не установлен — используем vision модель
            messages = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{image_b64}"
                            },
                        },
                        {
                            "type": "text",
                            "text": "Rasmda ko'rsatilgan masalani o'zbek tilida yech va qisqacha tushuntir.",
                        },
                    ],
                }
            ]
            llm_model = "openai/gpt-4o-mini"

        try:
            r = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {openrouter_key}",
                    "Content-Type": "application/json",
                },
                json={"model": llm_model, "messages": messages},
                timeout=60,
            )
            if r.status_code == 200:
                explanation = r.json()["choices"][0]["message"]["content"]
            else:
                explanation = f"OpenRouter xatosi {r.status_code}: {r.text[:300]}"
        except Exception as e:
            explanation = f"OpenRouter ulanish xatosi: {e}"

        # ── Итоговый ответ ──
        parts = []
        if formula:
            parts.append(f"📋 Formula: {_wrap_math_inline(formula)}")
        if solution_str:
            parts.append(f"✅ {_wrap_math_inline(solution_str)}")
        parts.append(f"\n💡 Túsindirme:\n{explanation}")

        yield f"data: {json.dumps({'done': True, 'answer': '\n'.join(parts)})}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─────────────────────────────────────────────
# ROUTES — Knowledge Base
# ─────────────────────────────────────────────
@app.route("/api/kb", methods=["GET"])
def get_kb():
    return jsonify(_db.get_topics())


@app.route("/api/kb/meta", methods=["GET"])
def get_kb_meta():
    return jsonify(_db.get_meta())


@app.route("/api/kb", methods=["POST"])
@admin_required
def add_kb():
    entry = request.json or {}
    if not entry.get("title") or not entry.get("content"):
        return jsonify({"error": "Nom va mazmun kerak"}), 400
    _db.add_topic(entry)
    return jsonify({"ok": True})


@app.route("/api/kb/<int:idx>", methods=["DELETE"])
@admin_required
def delete_kb(idx):
    _db.delete_topic(idx)
    return jsonify({"ok": True})


# ─────────────────────────────────────────────
# ROUTES — Problems
# ─────────────────────────────────────────────
@app.route("/api/problems/counts", methods=["GET"])
def get_problem_counts():
    return jsonify(_db.get_problem_counts())


@app.route("/api/problems/<string:topic_id>", methods=["GET"])
def get_problems(topic_id):
    return jsonify(_db.get_problems(topic_id))


@app.route("/api/problems", methods=["POST"])
def add_problem():
    entry = request.json or {}
    required = ("topic_id", "question", "type", "answer")
    if not all(entry.get(k) for k in required):
        return jsonify({"error": "topic_id, question, type, answer required"}), 400
    if entry["type"] not in ("input", "choice"):
        return jsonify({"error": "type must be 'input' or 'choice'"}), 400
    _db.add_problem(entry)
    return jsonify({"ok": True})


# ─────────────────────────────────────────────
# ROUTES — History
# ─────────────────────────────────────────────
@app.route("/api/history", methods=["GET"])
def get_history():
    if current_user.is_authenticated:
        return jsonify(_db.get_user_history(int(current_user.id)))
    return jsonify(load_json(HISTORY_FILE, []))


@app.route("/api/history", methods=["POST"])
def add_history():
    entry = request.json or {}
    if current_user.is_authenticated:
        _db.add_user_history(
            int(current_user.id),
            entry.get("problem", ""),
            entry.get("solution", "") or entry.get("answer", ""),
        )
    else:
        history = load_json(HISTORY_FILE, [])
        history.append(entry)
        if len(history) > 200:
            history = history[-200:]
        save_json(HISTORY_FILE, history)
    return jsonify({"ok": True})


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    if current_user.is_authenticated:
        _db.clear_user_history(int(current_user.id))
    else:
        save_json(HISTORY_FILE, [])
    return jsonify({"ok": True})


@app.route("/api/history/<int:hid>", methods=["DELETE"])
def delete_history_item(hid):
    if current_user.is_authenticated:
        _db.delete_user_history_item(int(current_user.id), hid)
    else:
        hist = load_json(HISTORY_FILE, [])
        if 0 <= hid < len(hist):
            hist.pop(hid)
            save_json(HISTORY_FILE, hist)
    return jsonify({"ok": True})


# ─────────────────────────────────────────────
# ROUTES — Config
# ─────────────────────────────────────────────
@app.route("/api/config", methods=["GET"])
def get_config():
    cfg = _server_keys()
    return jsonify(
        {
            "has_tahrirchi": bool(cfg.get("api_key", "").strip()),
            "has_openrouter": bool(cfg.get("openrouter_key", "").strip()),
            "model": cfg.get("model", "tilmoch"),
        }
    )


@app.route("/api/config", methods=["POST"])
@admin_required
def save_config():
    config = load_json(CONFIG_FILE, {"api_key": "", "model": "tilmoch"})
    new_config = request.json or {}
    _ALLOWED_CONFIG = {"api_key", "openrouter_key", "model"}
    config.update({k: v for k, v in new_config.items() if k in _ALLOWED_CONFIG})
    save_json(CONFIG_FILE, config)
    return jsonify({"ok": True})


# ─────────────────────────────────────────────
# ROUTES — KB Suggestions
# ─────────────────────────────────────────────
@app.route("/api/kb/suggest", methods=["POST"])
@login_required
def suggest_kb():
    entry = request.json or {}
    if not entry.get("title") or not entry.get("content"):
        return jsonify({"error": "Нужны title и content"}), 400
    _db.add_suggestion(int(current_user.id), entry)
    return jsonify({"ok": True})


@app.route("/api/kb/suggestions", methods=["GET"])
@admin_required
def get_kb_suggestions():
    return jsonify(_db.get_suggestions("pending"))


@app.route("/api/kb/suggestions/<int:sid>/approve", methods=["POST"])
@admin_required
def approve_suggestion(sid):
    _db.update_suggestion_status(sid, "approved")
    return jsonify({"ok": True})


@app.route("/api/kb/suggestions/<int:sid>/reject", methods=["POST"])
@admin_required
def reject_suggestion(sid):
    _db.update_suggestion_status(sid, "rejected")
    return jsonify({"ok": True})


# ─────────────────────────────────────────────
# ROUTES — Admin: Users
# ─────────────────────────────────────────────
@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_get_users():
    return jsonify(_db.get_all_users())


@app.route("/api/admin/users/<int:uid>", methods=["PATCH"])
@admin_required
def admin_update_user(uid):
    data = request.json or {}
    role = data.get("role")
    if role not in ("user", "admin"):
        return jsonify({"error": "role должна быть 'user' или 'admin'"}), 400
    _db.update_user_role(uid, role)
    return jsonify({"ok": True})


@app.route("/api/admin/users/<int:uid>", methods=["DELETE"])
@admin_required
def admin_delete_user(uid):
    if uid == int(current_user.id):
        return jsonify({"error": "Нельзя удалить свой аккаунт"}), 400
    _db.delete_user(uid)
    return jsonify({"ok": True})


# ─────────────────────────────────────────────
# ENTRY POINT
# ─────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    app.run(host="0.0.0.0", port=port, threaded=True)
