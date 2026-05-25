import json
import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "matmozg.db")
KB_FILE = os.path.join(BASE_DIR, "knowledge_base.json")

USE_SQLITE = os.path.exists(DB_FILE)


def _conn():
    c = sqlite3.connect(DB_FILE)
    c.row_factory = sqlite3.Row
    c.execute("PRAGMA foreign_keys = ON")
    return c


def _ensure_schema():
    with _conn() as c:
        c.execute("""CREATE TABLE IF NOT EXISTS topics (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            title          TEXT NOT NULL,
            content        TEXT NOT NULL,
            diagram        TEXT DEFAULT 'none',
            school_section TEXT,
            task_type      TEXT,
            grade          TEXT,
            difficulty     TEXT DEFAULT 'medium',
            sort_order     INTEGER DEFAULT 0
        )""")
        c.execute("""CREATE TABLE IF NOT EXISTS problems (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id    TEXT NOT NULL,
            question    TEXT NOT NULL,
            question_uz TEXT,
            type        TEXT NOT NULL CHECK(type IN ('input','choice')),
            answer      TEXT NOT NULL,
            answer_uz   TEXT,
            choices     TEXT,
            choices_uz  TEXT,
            hint        TEXT,
            hint_uz     TEXT
        )""")
        for col, default in [
            ("question_uz", "''"),
            ("answer_uz", "''"),
            ("choices_uz", "''"),
            ("hint_uz", "''"),
        ]:
            try:
                c.execute(
                    f"ALTER TABLE problems ADD COLUMN {col} TEXT DEFAULT {default}"
                )
            except Exception:
                pass
        c.execute("""CREATE TABLE IF NOT EXISTS users (
            id            INTEGER PRIMARY KEY AUTOINCREMENT,
            username      TEXT NOT NULL UNIQUE,
            email         TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role          TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin')),
            first_name    TEXT DEFAULT '',
            last_name     TEXT DEFAULT '',
            phone         TEXT DEFAULT '',
            created_at    TEXT NOT NULL DEFAULT (datetime('now'))
        )""")
        for col, default in [
            ("first_name", "''"),
            ("last_name", "''"),
            ("phone", "''"),
        ]:
            try:
                c.execute(f"ALTER TABLE users ADD COLUMN {col} TEXT DEFAULT {default}")
            except Exception:
                pass
        c.execute("""CREATE TABLE IF NOT EXISTS user_history (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            problem    TEXT NOT NULL,
            solution   TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )""")
        c.execute("""CREATE TABLE IF NOT EXISTS kb_suggestions (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title          TEXT NOT NULL,
            content        TEXT NOT NULL,
            diagram        TEXT DEFAULT 'none',
            school_section TEXT,
            task_type      TEXT,
            grade          TEXT,
            difficulty     TEXT DEFAULT 'medium',
            status         TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
            created_at     TEXT NOT NULL DEFAULT (datetime('now'))
        )""")


_ensure_schema()


# ── JSON helpers ──────────────────────────────────────────────


def _load_json():
    if not os.path.exists(KB_FILE):
        return []
    try:
        with open(KB_FILE, encoding="utf-8") as f:
            text = f.read().strip()
        return json.loads(text) if text else []
    except Exception:
        return []


def _save_json(data):
    with open(KB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


# ── Topics ────────────────────────────────────────────────────


def get_topics():
    if USE_SQLITE:
        with _conn() as c:
            rows = c.execute("SELECT * FROM topics ORDER BY sort_order, id").fetchall()
            return [dict(r) for r in rows]
    return _load_json()


def add_topic(entry: dict):
    if USE_SQLITE:
        with _conn() as c:
            c.execute(
                """INSERT INTO topics
                   (title, content, diagram, school_section, task_type, grade, difficulty)
                   VALUES (?,?,?,?,?,?,?)""",
                (
                    entry.get("title"),
                    entry.get("content"),
                    entry.get("diagram", "none"),
                    entry.get("school_section"),
                    entry.get("task_type"),
                    entry.get("grade"),
                    entry.get("difficulty", "medium"),
                ),
            )
    else:
        kb = _load_json()
        kb.append(entry)
        _save_json(kb)


def delete_topic(idx_or_id: int):
    if USE_SQLITE:
        with _conn() as c:
            c.execute("DELETE FROM topics WHERE id = ?", (idx_or_id,))
    else:
        kb = _load_json()
        if 0 <= idx_or_id < len(kb):
            kb.pop(idx_or_id)
            _save_json(kb)


def get_meta():
    if USE_SQLITE:
        with _conn() as c:

            def vals(col):
                return [
                    r[0]
                    for r in c.execute(
                        f"SELECT DISTINCT {col} FROM topics WHERE {col} IS NOT NULL"
                    ).fetchall()
                ]

            return {
                "school_sections": vals("school_section"),
                "task_types": vals("task_type"),
                "grades": vals("grade"),
            }
    kb = _load_json()
    return {
        "school_sections": list(
            {e.get("school_section") for e in kb if e.get("school_section")}
        ),
        "task_types": list({e.get("task_type") for e in kb if e.get("task_type")}),
        "grades": list({e.get("grade") for e in kb if e.get("grade")}),
    }


# ── Problems ──────────────────────────────────────────────────


def get_problems(topic_id: str):
    if not USE_SQLITE:
        return []
    with _conn() as c:
        rows = c.execute(
            "SELECT * FROM problems WHERE topic_id = ?", (topic_id,)
        ).fetchall()
        result = []
        for r in rows:
            d = dict(r)
            if d.get("choices"):
                d["choices"] = json.loads(d["choices"])
            if d.get("choices_uz"):
                d["choices_uz"] = json.loads(d["choices_uz"])
            result.append(d)
        return result


def get_problem_counts() -> dict:
    if not USE_SQLITE:
        return {}
    with _conn() as c:
        rows = c.execute(
            "SELECT topic_id, COUNT(*) as cnt FROM problems GROUP BY topic_id"
        ).fetchall()
        return {r["topic_id"]: r["cnt"] for r in rows}


def add_problem(entry: dict):
    if not USE_SQLITE:
        return
    choices = entry.get("choices")
    if isinstance(choices, list):
        choices = json.dumps(choices, ensure_ascii=False)
    choices_uz = entry.get("choices_uz")
    if isinstance(choices_uz, list):
        choices_uz = json.dumps(choices_uz, ensure_ascii=False)
    with _conn() as c:
        c.execute(
            """INSERT INTO problems (topic_id, question, question_uz, type, answer, answer_uz, choices, choices_uz, hint, hint_uz)
               VALUES (?,?,?,?,?,?,?,?,?,?)""",
            (
                str(entry["topic_id"]),
                entry["question"],
                entry.get("question_uz"),
                entry["type"],
                entry["answer"],
                entry.get("answer_uz"),
                choices,
                choices_uz,
                entry.get("hint"),
                entry.get("hint_uz"),
            ),
        )


def update_problem_translations(problem_id: int, entry: dict):
    if not USE_SQLITE:
        return
    choices_uz = entry.get("choices_uz")
    if isinstance(choices_uz, list):
        choices_uz = json.dumps(choices_uz, ensure_ascii=False)
    with _conn() as c:
        c.execute(
            """UPDATE problems
               SET question_uz = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE question_uz END,
                   answer_uz   = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE answer_uz END,
                   choices_uz  = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE choices_uz END,
                   hint_uz     = CASE WHEN ? IS NOT NULL AND ? != '' THEN ? ELSE hint_uz END
             WHERE id = ?""",
            (
                entry.get("question_uz"),
                entry.get("question_uz"),
                entry.get("question_uz"),
                entry.get("answer_uz"),
                entry.get("answer_uz"),
                entry.get("answer_uz"),
                choices_uz,
                choices_uz,
                choices_uz,
                entry.get("hint_uz"),
                entry.get("hint_uz"),
                entry.get("hint_uz"),
                problem_id,
            ),
        )


# ── Users ─────────────────────────────────────────────────────


def create_user(
    username: str,
    email: str,
    password_hash: str,
    first_name: str = "",
    last_name: str = "",
    phone: str = "",
) -> int | None:
    try:
        with _conn() as c:
            cur = c.execute(
                "INSERT INTO users (username, email, password_hash, first_name, last_name, phone) VALUES (?,?,?,?,?,?)",
                (username, email, password_hash, first_name, last_name, phone),
            )
            return cur.lastrowid
    except sqlite3.IntegrityError:
        return None


def get_user_by_id(user_id: int) -> dict | None:
    with _conn() as c:
        row = c.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
        return dict(row) if row else None


def get_user_by_username(username: str) -> dict | None:
    with _conn() as c:
        row = c.execute(
            "SELECT * FROM users WHERE username = ?", (username,)
        ).fetchone()
        return dict(row) if row else None


def get_all_users() -> list:
    with _conn() as c:
        rows = c.execute(
            "SELECT id, username, email, role, created_at FROM users ORDER BY id"
        ).fetchall()
        return [dict(r) for r in rows]


def update_user_role(user_id: int, role: str):
    if role not in ("user", "admin"):
        raise ValueError(f"Invalid role: {role!r}")
    with _conn() as c:
        c.execute("UPDATE users SET role = ? WHERE id = ?", (role, user_id))


def delete_user(user_id: int):
    with _conn() as c:
        c.execute("DELETE FROM users WHERE id = ?", (user_id,))


# ── User History ───────────────────────────────────────────────


def get_user_history(user_id: int) -> list:
    with _conn() as c:
        rows = c.execute(
            "SELECT id, problem, solution FROM user_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 100",
            (user_id,),
        ).fetchall()
        return [dict(r) for r in rows]


def delete_user_history_item(user_id: int, item_id: int):
    with _conn() as c:
        c.execute(
            "DELETE FROM user_history WHERE id = ? AND user_id = ?", (item_id, user_id)
        )


def add_user_history(user_id: int, problem: str, solution: str):
    with _conn() as c:
        c.execute(
            "INSERT INTO user_history (user_id, problem, solution) VALUES (?,?,?)",
            (user_id, problem, solution),
        )


def clear_user_history(user_id: int):
    with _conn() as c:
        c.execute("DELETE FROM user_history WHERE user_id = ?", (user_id,))


# ── KB Suggestions ────────────────────────────────────────────


def add_suggestion(user_id: int, entry: dict):
    with _conn() as c:
        c.execute(
            """INSERT INTO kb_suggestions
               (user_id, title, content, diagram, school_section, task_type, grade, difficulty)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                user_id,
                entry["title"],
                entry["content"],
                entry.get("diagram", "none"),
                entry.get("school_section"),
                entry.get("task_type"),
                entry.get("grade"),
                entry.get("difficulty", "medium"),
            ),
        )


def get_suggestions(status: str = "pending") -> list:
    with _conn() as c:
        rows = c.execute(
            """SELECT s.*, u.username FROM kb_suggestions s
               JOIN users u ON u.id = s.user_id
               WHERE s.status = ? ORDER BY s.created_at DESC""",
            (status,),
        ).fetchall()
        return [dict(r) for r in rows]


def update_suggestion_status(suggestion_id: int, status: str):
    if status not in ("pending", "approved", "rejected"):
        raise ValueError(f"Invalid status: {status!r}")
    with _conn() as c:
        c.execute(
            "UPDATE kb_suggestions SET status = ? WHERE id = ?", (status, suggestion_id)
        )
        if status == "approved":
            row = c.execute(
                "SELECT * FROM kb_suggestions WHERE id = ?", (suggestion_id,)
            ).fetchone()
            if row:
                d = dict(row)
                c.execute(
                    """INSERT INTO topics
                       (title, content, diagram, school_section, task_type, grade, difficulty)
                       VALUES (?,?,?,?,?,?,?)""",
                    (
                        d["title"],
                        d["content"],
                        d.get("diagram", "none"),
                        d.get("school_section"),
                        d.get("task_type"),
                        d.get("grade"),
                        d.get("difficulty", "medium"),
                    ),
                )
