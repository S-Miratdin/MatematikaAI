from functools import wraps

from flask import Blueprint, jsonify, request
from flask_login import (
    LoginManager,
    UserMixin,
    current_user,
    login_required,
    login_user,
    logout_user,
)
from werkzeug.security import check_password_hash, generate_password_hash

import db as _db

_DUMMY_HASH = generate_password_hash("timing-protection-dummy")

auth_bp = Blueprint("auth", __name__)
login_manager = LoginManager()


class User(UserMixin):
    def __init__(self, row: dict):
        self.id = str(row["id"])
        self.username = row["username"]
        self.email = row["email"]
        self.role = row["role"]


def init_login_manager(app):
    login_manager.init_app(app)

    @login_manager.unauthorized_handler
    def unauthorized():
        return jsonify({"error": "Authentication required"}), 401

    @login_manager.user_loader
    def load_user(user_id):
        row = _db.get_user_by_id(int(user_id))
        return User(row) if row else None


def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not current_user.is_authenticated:
            return jsonify({"error": "Authentication required"}), 401
        if current_user.role != "admin":
            return jsonify({"error": "Admin only"}), 403
        return f(*args, **kwargs)

    return decorated


# ── Auth routes ───────────────────────────────────────────────


@auth_bp.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip()
    password = data.get("password", "")
    first_name = data.get("first_name", "").strip()
    last_name = data.get("last_name", "").strip()
    phone = data.get("phone", "").strip()
    if not username or not email or not password:
        return jsonify({"error": "Нужны username, email и password"}), 400
    if len(password) < 6:
        return jsonify({"error": "Пароль должен содержать минимум 6 символов"}), 400
    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({"error": "Некорректный email"}), 400
    user_id = _db.create_user(
        username, email, generate_password_hash(password), first_name, last_name, phone
    )
    if user_id is None:
        return jsonify({"error": "Логин или email уже занят"}), 409
    row = _db.get_user_by_id(user_id)
    user = User(row)
    login_user(user, remember=True)
    return jsonify({"ok": True, "username": user.username, "role": user.role})


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json or {}
    username = data.get("username", "").strip()
    password = data.get("password", "")
    if not username or not password:
        return jsonify({"error": "Нужны username и password"}), 400
    row = _db.get_user_by_username(username)
    candidate_hash = row["password_hash"] if row else _DUMMY_HASH
    if not check_password_hash(candidate_hash, password) or not row:
        return jsonify({"error": "Неверный логин или пароль"}), 401
    user = User(row)
    login_user(user, remember=True)
    return jsonify({"ok": True, "username": user.username, "role": user.role})


@auth_bp.route("/api/auth/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    return jsonify({"ok": True})


@auth_bp.route("/api/auth/me", methods=["GET"])
def me():
    if not current_user.is_authenticated:
        return jsonify({"authenticated": False})
    return jsonify(
        {
            "authenticated": True,
            "username": current_user.username,
            "role": current_user.role,
        }
    )
