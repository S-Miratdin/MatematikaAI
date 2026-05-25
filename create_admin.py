#!/usr/bin/env python3
import getpass
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from werkzeug.security import generate_password_hash

import db as _db


def main():
    print("=== Создание Admin аккаунта ===")

    username = input("Логин: ").strip()
    if not username:
        print("Ошибка: логин не может быть пустым")
        sys.exit(1)

    if _db.get_user_by_username(username):
        print(f"Ошибка: пользователь '{username}' уже существует")
        sys.exit(1)

    email = input("Email: ").strip()
    if not email:
        print("Ошибка: email не может быть пустым")
        sys.exit(1)

    password = getpass.getpass("Пароль (мин. 6 символов): ")
    if len(password) < 6:
        print("Ошибка: пароль должен содержать минимум 6 символов")
        sys.exit(1)

    confirm = getpass.getpass("Подтвердите пароль: ")
    if password != confirm:
        print("Ошибка: пароли не совпадают")
        sys.exit(1)

    user_id = _db.create_user(username, email, generate_password_hash(password))
    if user_id is None:
        print("Ошибка: этот email уже используется")
        sys.exit(1)

    _db.update_user_role(user_id, "admin")
    print(f"\nAdmin аккаунт '{username}' успешно создан!")


if __name__ == "__main__":
    main()
