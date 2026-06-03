# -*- coding: utf-8 -*-
"""
seed_data.py — добавляет задачи для Mashq и темы в базу знаний.
Запуск: python seed_data.py
"""

import io
import json
import sys
import db

# Ensure stdout uses UTF-8 when running as a script
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

# ══════════════════════════════════════════════════════════════
#  HELPER
# ══════════════════════════════════════════════════════════════


def add_problems_if_missing(topic_id, problems):
    existing = db.get_problems(topic_id)
    existing_by_question = {p["question"]: p for p in existing}
    added = 0
    updated = 0
    for p in problems:
        existing_problem = existing_by_question.get(p["question"])
        if existing_problem:
            needs_update = False
            for field in ["question_uz", "answer_uz", "choices_uz", "hint_uz"]:
                if p.get(field) and not existing_problem.get(field):
                    needs_update = True
                    break
            if needs_update:
                db.update_problem_translations(existing_problem["id"], p)
                updated += 1
        else:
            db.add_problem(p)
            added += 1
    if updated:
        print(f"  {topic_id:25} updated translations: {updated}")
    return added


def topic_exists_by_title(title):
    topics = db.get_topics()
    return any(t["title"] == title for t in topics)


# ══════════════════════════════════════════════════════════════
#  ЗАДАЧИ ДЛЯ MASHQ
# ══════════════════════════════════════════════════════════════

PROBLEMS = {
    # ── Прямоугольный треугольник (right_triangle) ────────────
    "right_triangle": [
        {
            "topic_id": "right_triangle",
            "type": "input",
            "question": "Катеты прямоугольного треугольника равны 3 и 4. Найдите гипотенузу.",
            "question_uz": "Toʻgʻri burchakli uchburchakning katetlari 3 va 4. Gipotenuzani toping.",
            "answer": "5",
            "answer_uz": "5",
            "choices": None,
            "hint": "c = √(a² + b²) = √(9 + 16) = √25 = 5",
            "hint_uz": "c = √(a² + b²) = √(9 + 16) = √25 = 5",
        },
        {
            "topic_id": "right_triangle",
            "type": "input",
            "question": "Гипотенуза = 13, один катет = 5. Найдите второй катет.",
            "question_uz": "Gipotenuza 13, bir katet 5. Ikkinchi katetni toping.",
            "answer": "12",
            "answer_uz": "12",
            "choices": None,
            "hint": "b = √(c² - a²) = √(169 - 25) = √144 = 12",
            "hint_uz": "b = √(c² - a²) = √(169 - 25) = √144 = 12",
        },
        {
            "topic_id": "right_triangle",
            "type": "choice",
            "question": "Чему равно sin 30°?",
            "question_uz": "sin 30° qancha?",
            "answer": "0.5",
            "answer_uz": "0.5",
            "choices": json.dumps(["0.5", "√3/2", "1", "0"]),
            "choices_uz": json.dumps(["0.5", "√3/2", "1", "0"]),
            "hint": "sin 30° = 1/2 = 0.5 — одно из базовых значений.",
            "hint_uz": "sin 30° = 1/2 = 0.5 — asosiy qiymatlardan biri.",
        },
        {
            "topic_id": "right_triangle",
            "type": "input",
            "question": "В прямоугольном треугольнике катеты 6 и 8. Площадь = ?",
            "question_uz": "Toʻgʻri burchakli uchburchakda katetlar 6 va 8. Yuzani toping.",
            "answer": "24",
            "answer_uz": "24",
            "choices": None,
            "hint": "S = a·b/2 = 6·8/2 = 24",
            "hint_uz": "S = a·b/2 = 6·8/2 = 24",
        },
        {
            "topic_id": "right_triangle",
            "type": "choice",
            "question": "Сумма двух острых углов прямоугольного треугольника равна:",
            "question_uz": "Toʻgʻri burchakli uchburchakning ikkita o'tkir burchagi yigʻindisi teng:",
            "answer": "90°",
            "answer_uz": "90°",
            "choices": json.dumps(["90°", "180°", "45°", "60°"]),
            "choices_uz": json.dumps(["90°", "180°", "45°", "60°"]),
            "hint": "Сумма всех углов = 180°; прямой угол = 90°; значит α + β = 90°.",
            "hint_uz": "Barcha burchaklar yigʻindisi 180°; toʻgʻri burchak 90°; demak α + β = 90°.",
        },
    ],
    # ── Окружность и круг (circle) ────────────────────────────
    "circle": [
        {
            "topic_id": "circle",
            "type": "input",
            "question": "Радиус окружности равен 5. Найдите длину окружности (π ≈ 3.14).",
            "question_uz": "Aylananing radiusi 5. Aylana uzunligini toping (π ≈ 3.14).",
            "answer": "31.4",
            "answer_uz": "31.4",
            "choices": None,
            "hint": "C = 2πr = 2 · 3.14 · 5 = 31.4",
            "hint_uz": "C = 2πr = 2 · 3.14 · 5 = 31.4",
        },
        {
            "topic_id": "circle",
            "type": "input",
            "question": "Диаметр круга равен 10. Найдите площадь (π ≈ 3.14).",
            "question_uz": "Doiraning diametri 10. Maydonini toping (π ≈ 3.14).",
            "answer": "78.5",
            "answer_uz": "78.5",
            "choices": None,
            "hint": "r = 5; S = πr² = 3.14 · 25 = 78.5",
            "hint_uz": "r = 5; S = πr² = 3.14 · 25 = 78.5",
        },
        {
            "topic_id": "circle",
            "type": "input",
            "question": "Радиус круга r = 5. Найдите площадь (π ≈ 3.14), округлите до целых.",
            "question_uz": "Aylananing radiusi r = 5. Maydonini toping (π ≈ 3.14), butun songa yaxlitlang.",
            "answer": "79",
            "answer_uz": "79",
            "choices": None,
            "hint": "S = πr² = 3.14 · 25 = 78.5 → округление до целых: 79",
            "hint_uz": "S = πr² = 3.14 · 25 = 78.5 → butun songa yaxlitlash: 79",
        },
        {
            "topic_id": "circle",
            "type": "choice",
            "question": "Диаметр окружности d и радиус r связаны формулой:",
            "question_uz": "Aylana diametri d va radiusi r qanday formula bilan bog‘langan?",
            "answer": "d = 2r",
            "answer_uz": "d = 2r",
            "choices": json.dumps(["d = 2r", "d = r/2", "d = r²", "d = πr"]),
            "choices_uz": json.dumps(["d = 2r", "d = r/2", "d = r²", "d = πr"]),
            "hint": "Диаметр — отрезок через центр: d = 2r.",
            "hint_uz": "Diametr — markaz orqali oʻtuvchi kesma: d = 2r.",
        },
        {
            "topic_id": "circle",
            "type": "input",
            "question": "Длина окружности равна 62.8. Найдите радиус (π ≈ 3.14).",
            "question_uz": "Aylana uzunligi 62.8. Radiusni toping (π ≈ 3.14).",
            "answer": "10",
            "answer_uz": "10",
            "choices": None,
            "hint": "C = 2πr → r = C / (2π) = 62.8 / 6.28 = 10",
            "hint_uz": "C = 2πr → r = C / (2π) = 62.8 / 6.28 = 10",
        },
        {
            "topic_id": "circle",
            "type": "input",
            "question": "Площадь круга равна 28.26. Найдите радиус (π ≈ 3.14).",
            "question_uz": "Doira yuzasi 28.26. Radiusni toping (π ≈ 3.14).",
            "answer": "3",
            "answer_uz": "3",
            "choices": None,
            "hint": "S = πr² → r² = 28.26 / 3.14 = 9 → r = 3",
            "hint_uz": "S = πr² → r² = 28.26 / 3.14 = 9 → r = 3",
        },
    ],
    # ── Линейное уравнение (linear_eq) ───────────────────────
    "linear_eq": [
        {
            "topic_id": "linear_eq",
            "type": "input",
            "question": "Решите уравнение: 2x + 6 = 0",
            "question_uz": "Tenglamani yeching: 2x + 6 = 0",
            "answer": "-3",
            "answer_uz": "-3",
            "choices": None,
            "hint": "2x = -6 → x = -3",
            "hint_uz": "2x = -6 → x = -3",
        },
        {
            "topic_id": "linear_eq",
            "type": "input",
            "question": "Решите уравнение: 5x - 15 = 0",
            "question_uz": "Tenglamani yeching: 5x - 15 = 0",
            "answer": "3",
            "answer_uz": "3",
            "choices": None,
            "hint": "5x = 15 → x = 3",
            "hint_uz": "5x = 15 → x = 3",
        },
        {
            "topic_id": "linear_eq",
            "type": "choice",
            "question": "Уравнение 3x = 12 имеет решение:",
            "question_uz": "3x = 12 tenglamaning yechimi:",
            "answer": "x = 4",
            "answer_uz": "x = 4",
            "choices": json.dumps(["x = 4", "x = 3", "x = 9", "x = 36"]),
            "choices_uz": json.dumps(["x = 4", "x = 3", "x = 9", "x = 36"]),
            "hint": "x = 12 / 3 = 4",
            "hint_uz": "x = 12 / 3 = 4",
        },
        {
            "topic_id": "linear_eq",
            "type": "input",
            "question": "Решите уравнение: 7x + 14 = 0",
            "question_uz": "Tenglamani yeching: 7x + 14 = 0",
            "answer": "-2",
            "answer_uz": "-2",
            "choices": None,
            "hint": "7x = -14 → x = -2",
            "hint_uz": "7x = -14 → x = -2",
        },
        {
            "topic_id": "linear_eq",
            "type": "input",
            "question": "Решите уравнение: 4x - 4 = 12",
            "question_uz": "Tenglamani yeching: 4x - 4 = 12",
            "answer": "4",
            "answer_uz": "4",
            "choices": None,
            "hint": "4x = 16 → x = 4",
            "hint_uz": "4x = 16 → x = 4",
        },
    ],
    # ── Квадратное уравнение (quadratic_eq) ──────────────────
    "quadratic_eq": [
        {
            "topic_id": "quadratic_eq",
            "type": "input",
            "question": "Дискриминант уравнения x² - 5x + 6 = 0 равен:",
            "question_uz": "x² - 5x + 6 = 0 tenglamaning diskriminanti:",
            "answer": "1",
            "answer_uz": "1",
            "choices": None,
            "hint": "D = b² - 4ac = 25 - 24 = 1",
            "hint_uz": "D = b² - 4ac = 25 - 24 = 1",
        },
        {
            "topic_id": "quadratic_eq",
            "type": "choice",
            "question": "Уравнение x² - 5x + 6 = 0 имеет корни:",
            "question_uz": "x² - 5x + 6 = 0 tenglamaning ildizlari:",
            "answer": "x=2 и x=3",
            "answer_uz": "x=2 и x=3",
            "choices": json.dumps(
                ["x=2 и x=3", "x=1 и x=6", "x=-2 и x=-3", "x=5 и x=1"]
            ),
            "choices_uz": json.dumps(
                ["x=2 и x=3", "x=1 и x=6", "x=-2 и x=-3", "x=5 и x=1"]
            ),
            "hint": "D=1; x=(5±1)/2 → x=3 или x=2",
            "hint_uz": "D=1; x=(5±1)/2 → x=3 yoki x=2",
        },
        {
            "topic_id": "quadratic_eq",
            "type": "input",
            "question": "Найдите дискриминант: x² + 4x + 4 = 0",
            "question_uz": "Diskriminantni toping: x² + 4x + 4 = 0",
            "answer": "0",
            "answer_uz": "0",
            "choices": None,
            "hint": "D = 16 - 16 = 0 — один корень.",
            "hint_uz": "D = 16 - 16 = 0 — bitta ildiz.",
        },
        {
            "topic_id": "quadratic_eq",
            "type": "choice",
            "question": "При D < 0 квадратное уравнение имеет:",
            "question_uz": "D < 0 bo‘lsa kvadrat tenglama qanday ildizlarga ega?",
            "answer": "нет действительных корней",
            "answer_uz": "real ildizlar yo‘q",
            "choices": json.dumps(
                [
                    "нет действительных корней",
                    "один корень",
                    "два корня",
                    "бесконечно много",
                ]
            ),
            "choices_uz": json.dumps(
                ["real ildizlar yo‘q", "bitta ildiz", "ikki ildiz", "cheksiz ko‘p"]
            ),
            "hint": "Если дискриминант отрицательный — корней в ℝ нет.",
            "hint_uz": "Agar diskriminant manfiy bo‘lsa, ℝ da ildizlar yo‘q.",
        },
        {
            "topic_id": "quadratic_eq",
            "type": "input",
            "question": "Уравнение x² - 9 = 0. Положительный корень x = ?",
            "question_uz": "x² - 9 = 0 tenglama. Musbat ildiz x = ?",
            "answer": "3",
            "answer_uz": "3",
            "choices": None,
            "hint": "x² = 9 → x = ±3. Положительный: 3.",
            "hint_uz": "x² = 9 → x = ±3. Musbat: 3.",
        },
    ],
    # ── Арифметическая прогрессия (arith_prog) ───────────────
    "arith_prog": [
        {
            "topic_id": "arith_prog",
            "type": "input",
            "question": "Прогрессия: 2, 5, 8, 11, ... Разность d = ?",
            "question_uz": "Progressiya: 2, 5, 8, 11, ... Farq d = ?",
            "answer": "3",
            "answer_uz": "3",
            "choices": None,
            "hint": "d = a₂ - a₁ = 5 - 2 = 3",
            "hint_uz": "d = a₂ - a₁ = 5 - 2 = 3",
        },
        {
            "topic_id": "arith_prog",
            "type": "input",
            "question": "a₁ = 3, d = 4. Найдите a₅.",
            "question_uz": "a₁ = 3, d = 4. a₅ ni toping.",
            "answer": "19",
            "answer_uz": "19",
            "choices": None,
            "hint": "aₙ = a₁ + (n-1)d = 3 + 4·4 = 19",
            "hint_uz": "aₙ = a₁ + (n-1)d = 3 + 4·4 = 19",
        },
        {
            "topic_id": "arith_prog",
            "type": "choice",
            "question": "Формула n-го члена арифметической прогрессии:",
            "question_uz": "Aritmetik progressiyaning n-chi elementi formulasi:",
            "answer": "aₙ = a₁ + (n−1)d",
            "answer_uz": "aₙ = a₁ + (n−1)d",
            "choices": json.dumps(
                ["aₙ = a₁ + (n−1)d", "aₙ = a₁ · dⁿ", "aₙ = a₁ · (n−1)", "aₙ = a₁ + nd"]
            ),
            "choices_uz": json.dumps(
                ["aₙ = a₁ + (n−1)d", "aₙ = a₁ · dⁿ", "aₙ = a₁ · (n−1)", "aₙ = a₁ + nd"]
            ),
            "hint": "Каждый следующий член отличается на d.",
            "hint_uz": "Har bir keyingi inobat d ga farq qiladi.",
        },
        {
            "topic_id": "arith_prog",
            "type": "input",
            "question": "Сумма первых 5 членов: 1, 3, 5, 7, 9. S₅ = ?",
            "question_uz": "Birinchi 5 had: 1, 3, 5, 7, 9. S₅ = ?",
            "answer": "25",
            "answer_uz": "25",
            "choices": None,
            "hint": "Sₙ = n(a₁ + aₙ)/2 = 5·(1+9)/2 = 25",
            "hint_uz": "Sₙ = n(a₁ + aₙ)/2 = 5·(1+9)/2 = 25",
        },
        {
            "topic_id": "arith_prog",
            "type": "input",
            "question": "a₁ = 10, d = −2. Найдите a₄.",
            "question_uz": "a₁ = 10, d = −2. a₄ ni toping.",
            "answer": "4",
            "answer_uz": "4",
            "choices": None,
            "hint": "a₄ = 10 + (4-1)·(-2) = 10 - 6 = 4",
            "hint_uz": "a₄ = 10 + (4-1)·(-2) = 10 - 6 = 4",
        },
    ],
    # ── Тригонометрия — значения sin и cos (trig_values) ─────
    "trig_values": [
        {
            "topic_id": "trig_values",
            "type": "choice",
            "question": "sin 30° = ?",
            "question_uz": "sin 30° = ?",
            "answer": "1/2",
            "answer_uz": "1/2",
            "choices": json.dumps(["1/2", "√2/2", "√3/2", "1"]),
            "choices_uz": json.dumps(["1/2", "√2/2", "√3/2", "1"]),
            "hint": "sin 30° = 0.5 = 1/2 — стандартное значение.",
            "hint_uz": "sin 30° = 0.5 = 1/2 — standart qiymat.",
        },
        {
            "topic_id": "trig_values",
            "type": "choice",
            "question": "cos 60° = ?",
            "question_uz": "cos 60° = ?",
            "answer": "1/2",
            "answer_uz": "1/2",
            "choices": json.dumps(["1/2", "√3/2", "√2/2", "0"]),
            "choices_uz": json.dumps(["1/2", "√3/2", "√2/2", "0"]),
            "hint": "cos 60° = 1/2 — то же значение, что sin 30°.",
            "hint_uz": "cos 60° = 1/2 — sin 30° bilan bir xil qiymat.",
        },
        {
            "topic_id": "trig_values",
            "type": "choice",
            "question": "sin 45° = ?",
            "question_uz": "sin 45° = ?",
            "answer": "√2/2",
            "answer_uz": "√2/2",
            "choices": json.dumps(["√2/2", "1/2", "√3/2", "1"]),
            "choices_uz": json.dumps(["√2/2", "1/2", "√3/2", "1"]),
            "hint": "sin 45° = cos 45° = √2/2 ≈ 0.707",
            "hint_uz": "sin 45° = cos 45° = √2/2 ≈ 0.707",
        },
        {
            "topic_id": "trig_values",
            "type": "choice",
            "question": "cos 0° = ?",
            "question_uz": "cos 0° = ?",
            "answer": "1",
            "answer_uz": "1",
            "choices": json.dumps(["1", "0", "1/2", "√2/2"]),
            "choices_uz": json.dumps(["1", "0", "1/2", "√2/2"]),
            "hint": "При угле 0° точка на единичной окружности: (1, 0) → cos 0° = 1.",
            "hint_uz": "0° burchakda birlik aylana nuqtasi: (1,0) → cos 0° = 1.",
        },
        {
            "topic_id": "trig_values",
            "type": "choice",
            "question": "sin 90° = ?",
            "question_uz": "sin 90° = ?",
            "answer": "1",
            "answer_uz": "1",
            "choices": json.dumps(["1", "0", "1/2", "√3/2"]),
            "choices_uz": json.dumps(["1", "0", "1/2", "√3/2"]),
            "hint": "При 90° точка (0, 1) → sin 90° = 1.",
            "hint_uz": "90° da nuqta (0,1) → sin 90° = 1.",
        },
    ],
    # ── Тригонометрия — формулы (trig_formulas) ──────────────
    "trig_formulas": [
        {
            "topic_id": "trig_formulas",
            "type": "choice",
            "question": "Основное тригонометрическое тождество:",
            "question_uz": "Asosiy trigonometrik tenglik:",
            "answer": "sin²α + cos²α = 1",
            "answer_uz": "sin²α + cos²α = 1",
            "choices": json.dumps(
                [
                    "sin²α + cos²α = 1",
                    "sinα · cosα = 1",
                    "sin²α = cos²α",
                    "tgα = sinα + cosα",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "sin²α + cos²α = 1",
                    "sinα · cosα = 1",
                    "sin²α = cos²α",
                    "tgα = sinα + cosα",
                ]
            ),
            "hint": "Из теоремы Пифагора на единичной окружности: sin²α + cos²α = 1.",
            "hint_uz": "Yagona aylanada Pifagor teoremasidan: sin²α + cos²α = 1.",
        },
        {
            "topic_id": "trig_formulas",
            "type": "choice",
            "question": "tg α = ?",
            "question_uz": "tg α = ?",
            "answer": "sinα / cosα",
            "answer_uz": "sinα / cosα",
            "choices": json.dumps(
                ["sinα / cosα", "cosα / sinα", "sinα · cosα", "1 / sinα"]
            ),
            "choices_uz": json.dumps(
                ["sinα / cosα", "cosα / sinα", "sinα · cosα", "1 / sinα"]
            ),
            "hint": "tg α = sinα / cosα (тангенс — отношение синуса к косинусу).",
            "hint_uz": "tg α = sinα / cosα (tangent — sin va cos nisbatidir).",
        },
        {
            "topic_id": "trig_formulas",
            "type": "input",
            "question": "Если sinα = 0.6, найдите cosα (α — острый угол). Ответ округлите до 1 знака.",
            "question_uz": "Agar sinα = 0.6 bo‘lsa, cosα ni toping (α — o'tkir burchak). Javobni 1 xonagacha yaxlitlang.",
            "answer": "0.8",
            "answer_uz": "0.8",
            "choices": None,
            "hint": "cos²α = 1 - sin²α = 1 - 0.36 = 0.64 → cosα = 0.8",
            "hint_uz": "cos²α = 1 - sin²α = 1 - 0.36 = 0.64 → cosα = 0.8",
        },
        {
            "topic_id": "trig_formulas",
            "type": "choice",
            "question": "sin(α + β) = ?",
            "question_uz": "sin(α + β) = ?",
            "answer": "sinα·cosβ + cosα·sinβ",
            "answer_uz": "sinα·cosβ + cosα·sinβ",
            "choices": json.dumps(
                [
                    "sinα·cosβ + cosα·sinβ",
                    "sinα + sinβ",
                    "sinα·sinβ + cosα·cosβ",
                    "sinα·cosβ - cosα·sinβ",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "sinα·cosβ + cosα·sinβ",
                    "sinα + sinβ",
                    "sinα·sinβ + cosα·cosβ",
                    "sinα·cosβ - cosα·sinβ",
                ]
            ),
            "hint": "Формула сложения: sin(α + β) = sinα·cosβ + cosα·sinβ.",
            "hint_uz": "Yig‘indi formulası: sin(α + β) = sinα·cosβ + cosα·sinβ.",
        },
        {
            "topic_id": "trig_formulas",
            "type": "choice",
            "question": "ctg α = ?",
            "question_uz": "ctg α = ?",
            "answer": "cosα / sinα",
            "answer_uz": "cosα / sinα",
            "choices": json.dumps(
                ["cosα / sinα", "sinα / cosα", "1 / cosα", "cosα · sinα"]
            ),
            "choices_uz": json.dumps(
                ["cosα / sinα", "sinα / cosα", "1 / cosα", "cosα · sinα"]
            ),
            "hint": "ctg — котангенс: ctg α = cosα / sinα = 1 / tg α.",
            "hint_uz": "ctg — kotangens: ctg α = cosα / sinα = 1 / tg α.",
        },
    ],
    # ── Единичная окружность (unit_circle) ────────────────────
    "unit_circle": [
        {
            "topic_id": "unit_circle",
            "type": "choice",
            "question": "Радиус единичной окружности равен:",
            "question_uz": "Yagona aylananing radiusi teng:",
            "answer": "1",
            "answer_uz": "1",
            "choices": json.dumps(["1", "2", "π", "360"]),
            "choices_uz": json.dumps(["1", "2", "π", "360"]),
            "hint": "Единичная окружность — окружность с центром в O и радиусом 1.",
            "hint_uz": "Yagona aylana — markazi O va radiusi 1 bo‘lgan aylana.",
        },
        {
            "topic_id": "unit_circle",
            "type": "choice",
            "question": "Координата точки на единичной окружности при угле α: (x, y) = ?",
            "question_uz": "Yagona aylanadagi nuqtaning koordinatasi α burchakda: (x, y) = ?",
            "answer": "(cosα, sinα)",
            "answer_uz": "(cosα, sinα)",
            "choices": json.dumps(
                ["(cosα, sinα)", "(sinα, cosα)", "(α, α)", "(tgα, 1)"]
            ),
            "choices_uz": json.dumps(
                ["(cosα, sinα)", "(sinα, cosα)", "(α, α)", "(tgα, 1)"]
            ),
            "hint": "На единичной окружности: x = cosα, y = sinα.",
            "hint_uz": "Yagona aylanada: x = cosα, y = sinα.",
        },
        {
            "topic_id": "unit_circle",
            "type": "choice",
            "question": "Угол 180° в радианах равен:",
            "question_uz": "180° burchak radianlarda teng:",
            "answer": "π",
            "answer_uz": "π",
            "choices": json.dumps(["π", "2π", "π/2", "π/4"]),
            "choices_uz": json.dumps(["π", "2π", "π/2", "π/4"]),
            "hint": "180° = π радиан. Полный оборот 360° = 2π.",
            "hint_uz": "180° = π radian. To‘liq aylanish 360° = 2π.",
        },
        {
            "topic_id": "unit_circle",
            "type": "choice",
            "question": "Угол 90° в радианах равен:",
            "question_uz": "90° burchak radianlarda teng:",
            "answer": "π/2",
            "answer_uz": "π/2",
            "choices": json.dumps(["π/2", "π", "π/4", "2π"]),
            "choices_uz": json.dumps(["π/2", "π", "π/4", "2π"]),
            "hint": "90° = π/2 радиана.",
            "hint_uz": "90° = π/2 radian.",
        },
        {
            "topic_id": "unit_circle",
            "type": "choice",
            "question": "В каком квадранте синус отрицателен?",
            "question_uz": "Qaysi kvadrantda sinus manfiy?",
            "answer": "III и IV",
            "answer_uz": "III и IV",
            "choices": json.dumps(["III и IV", "I и II", "II и III", "I и IV"]),
            "choices_uz": json.dumps(["III и IV", "I и II", "II и III", "I и IV"]),
            "hint": "sinα = y-координата. Ниже оси x (III и IV квадранты) y < 0.",
            "hint_uz": "sinα = y koordinatasi. x o‘qidan pastda (III va IV kvadrantlar) y < 0.",
        },
    ],
    # ── Теоремы синусов и косинусов (sin_cos_theorems) ───────
    "sin_cos_theorems": [
        {
            "topic_id": "sin_cos_theorems",
            "type": "choice",
            "question": "Теорема косинусов: c² = ?",
            "question_uz": "Kosinuslar teoremasi: c² = ?",
            "answer": "a² + b² - 2ab·cosC",
            "answer_uz": "a² + b² - 2ab·cosC",
            "choices": json.dumps(
                ["a² + b² - 2ab·cosC", "a² + b²", "a² - b² + 2ab·cosC", "2ab·cosC"]
            ),
            "choices_uz": json.dumps(
                ["a² + b² - 2ab·cosC", "a² + b²", "a² - b² + 2ab·cosC", "2ab·cosC"]
            ),
            "hint": "Теорема косинусов обобщает теорему Пифагора: c² = a² + b² - 2ab·cosC.",
            "hint_uz": "Kosinuslar teoremasi Pifagor teoremasining umumlashmasi: c² = a² + b² - 2ab·cosC.",
        },
        {
            "topic_id": "sin_cos_theorems",
            "type": "choice",
            "question": "Теорема синусов: a/sinA = ?",
            "question_uz": "Sinuslar teoremasi: a/sinA = ?",
            "answer": "2R",
            "answer_uz": "2R",
            "choices": json.dumps(["2R", "R", "R/2", "πR"]),
            "choices_uz": json.dumps(["2R", "R", "R/2", "πR"]),
            "hint": "a/sinA = b/sinB = c/sinC = 2R, где R — радиус описанной окружности.",
            "hint_uz": "a/sinA = b/sinB = c/sinC = 2R, bu yerda R — tashqi aylananing radiusi.",
        },
        {
            "topic_id": "sin_cos_theorems",
            "type": "choice",
            "question": "В треугольнике c = 10, C = 90°. По теореме синусов 2R = ?",
            "question_uz": "Uchburchakda c = 10, C = 90°. Sinuslar teoremasiga ko‘ra 2R = ?",
            "answer": "10",
            "answer_uz": "10",
            "choices": json.dumps(["10", "5", "20", "100"]),
            "choices_uz": json.dumps(["10", "5", "20", "100"]),
            "hint": "c/sinC = 10/sin90° = 10/1 = 10 = 2R.",
            "hint_uz": "c/sinC = 10/sin90° = 10/1 = 10 = 2R.",
        },
        {
            "topic_id": "sin_cos_theorems",
            "type": "input",
            "question": "Треугольник: a=7, b=7, C=60°. По теореме косинусов c² = ?",
            "question_uz": "Uchburchak: a=7, b=7, C=60°. Kosinuslar teoremasiga ko‘ra c² = ?",
            "answer": "49",
            "answer_uz": "49",
            "choices": None,
            "hint": "c² = 49 + 49 - 2·7·7·cos60° = 98 - 98·0.5 = 98 - 49 = 49",
            "hint_uz": "c² = 49 + 49 - 2·7·7·cos60° = 98 - 98·0.5 = 98 - 49 = 49",
        },
        {
            "topic_id": "sin_cos_theorems",
            "type": "choice",
            "question": "При каком условии теорема косинусов превращается в теорему Пифагора?",
            "question_uz": "Qaysi shartda kosinuslar teoremasi Pifagor teoremasiga aylanadi?",
            "answer": "C = 90°",
            "answer_uz": "C = 90°",
            "choices": json.dumps(["C = 90°", "C = 0°", "A = B", "c = R"]),
            "choices_uz": json.dumps(["C = 90°", "C = 0°", "A = B", "c = R"]),
            "hint": "cos90° = 0, поэтому c² = a² + b² - 0 = a² + b².",
            "hint_uz": "cos90° = 0, shuning uchun c² = a² + b² - 0 = a² + b².",
        },
    ],
    # ── Линейная функция (linear_fn) ─────────────────────────
    "linear_fn": [
        {
            "topic_id": "linear_fn",
            "type": "input",
            "question": "y = 3x + 2. При x = 4, y = ?",
            "question_uz": "y = 3x + 2. x = 4 bo‘lganda y = ?",
            "answer": "14",
            "answer_uz": "14",
            "choices": None,
            "hint": "y = 3·4 + 2 = 12 + 2 = 14",
            "hint_uz": "y = 3·4 + 2 = 12 + 2 = 14",
        },
        {
            "topic_id": "linear_fn",
            "type": "choice",
            "question": "Угловой коэффициент функции y = -5x + 1 равен:",
            "question_uz": "y = -5x + 1 funksiyaning burchak koeffitsienti:",
            "answer": "-5",
            "answer_uz": "-5",
            "choices": json.dumps(["-5", "5", "1", "-1"]),
            "choices_uz": json.dumps(["-5", "5", "1", "-1"]),
            "hint": "В y = kx + b, k — угловой коэффициент. Здесь k = -5.",
            "hint_uz": "y = kx + b da k — burchak koeffitsienti. Bu yerda k = -5.",
        },
        {
            "topic_id": "linear_fn",
            "type": "input",
            "question": "y = 2x − 3. При каком x значение y = 0?",
            "question_uz": "y = 2x − 3. Qaysi x da y = 0?",
            "answer": "1.5",
            "answer_uz": "1.5",
            "choices": None,
            "hint": "0 = 2x - 3 → 2x = 3 → x = 1.5",
            "hint_uz": "0 = 2x - 3 → 2x = 3 → x = 1.5",
        },
        {
            "topic_id": "linear_fn",
            "type": "choice",
            "question": "Прямая y = kx + b пересекает ось y в точке:",
            "question_uz": "y = kx + b to‘g‘ri chiziq y o‘qini qaysi nuqtada kesadi?",
            "answer": "(0, b)",
            "answer_uz": "(0, b)",
            "choices": json.dumps(["(0, b)", "(b, 0)", "(k, 0)", "(0, k)"]),
            "choices_uz": json.dumps(["(0, b)", "(b, 0)", "(k, 0)", "(0, k)"]),
            "hint": "При x=0: y = b. Значит, пересечение с осью y — точка (0, b).",
            "hint_uz": "x=0 da y = b. Demak y o‘qi bilan kesishish nuqtasi (0, b).",
        },
        {
            "topic_id": "linear_fn",
            "type": "input",
            "question": "Функция y = 4x + 5. При x = −1, y = ?",
            "question_uz": "Funksiya y = 4x + 5. x = −1 bo‘lganda y = ?",
            "answer": "1",
            "answer_uz": "1",
            "choices": None,
            "hint": "y = 4·(−1) + 5 = −4 + 5 = 1",
            "hint_uz": "y = 4·(−1) + 5 = −4 + 5 = 1",
        },
    ],
    # ── Квадратичная функция / парабола (parabola) ────────────
    "parabola": [
        {
            "topic_id": "parabola",
            "type": "input",
            "question": "y = x² − 4x + 3. При x = 1, y = ?",
            "question_uz": "y = x² − 4x + 3. x = 1 bo‘lganda y = ?",
            "answer": "0",
            "answer_uz": "0",
            "choices": None,
            "hint": "y = 1 − 4 + 3 = 0",
            "hint_uz": "y = 1 − 4 + 3 = 0",
        },
        {
            "topic_id": "parabola",
            "type": "choice",
            "question": "Парабола y = ax² + bx + c направлена вниз при:",
            "question_uz": "y = ax² + bx + c параbolasi pastga qarab ochiladi qachon:",
            "answer": "a < 0",
            "answer_uz": "a < 0",
            "choices": json.dumps(["a < 0", "a > 0", "b < 0", "c < 0"]),
            "choices_uz": json.dumps(["a < 0", "a > 0", "b < 0", "c < 0"]),
            "hint": "При a > 0 ветви вверх; при a < 0 — вниз.",
            "hint_uz": "a > 0 da shoxi tepaga; a < 0 da pastga qarab ochiladi.",
        },
        {
            "topic_id": "parabola",
            "type": "input",
            "question": "y = x² − 6x + 5. Найдите x вершины параболы.",
            "question_uz": "y = x² − 6x + 5. Parabola tepasining x koordinatasini toping.",
            "answer": "3",
            "answer_uz": "3",
            "choices": None,
            "hint": "x₀ = -b/(2a) = 6/2 = 3",
            "hint_uz": "x₀ = -b/(2a) = 6/2 = 3",
        },
        {
            "topic_id": "parabola",
            "type": "choice",
            "question": "Вершина параболы y = (x − 3)² + 2 находится в точке:",
            "question_uz": "y = (x − 3)² + 2 parabola tepasining koordinatasi:",
            "answer": "(3, 2)",
            "answer_uz": "(3, 2)",
            "choices": json.dumps(["(3, 2)", "(−3, 2)", "(3, −2)", "(2, 3)"]),
            "choices_uz": json.dumps(["(3, 2)", "(−3, 2)", "(3, −2)", "(2, 3)"]),
            "hint": "В форме y = (x − x₀)² + y₀ вершина сразу: (x₀, y₀) = (3, 2).",
            "hint_uz": "y = (x − x₀)² + y₀ ko‘rinishida, tepa darhol (x₀, y₀) = (3, 2).",
        },
        {
            "topic_id": "parabola",
            "type": "input",
            "question": "y = 2x² − 8x + 6. При x = 0, y = ?",
            "question_uz": "y = 2x² − 8x + 6. x = 0 bo‘lganda y = ?",
            "answer": "6",
            "answer_uz": "6",
            "choices": None,
            "hint": "y = 0 − 0 + 6 = 6",
            "hint_uz": "y = 0 − 0 + 6 = 6",
        },
    ],
    # ── Натуральные числа (nat_numbers) ──────────────────────
    "nat_numbers": [
        {
            "topic_id": "nat_numbers",
            "type": "choice",
            "question": "Какое из чисел является натуральным?",
            "question_uz": "Qaysi son natural son?",
            "answer": "7",
            "answer_uz": "7",
            "choices": json.dumps(["7", "0", "-3", "1/2"]),
            "choices_uz": json.dumps(["7", "0", "-3", "1/2"]),
            "hint": "Натуральные числа: 1, 2, 3, 4, ... (начинаются с 1, без нуля и отрицательных).",
            "hint_uz": "Natural sonlar: 1, 2, 3, 4, ... (1 dan boshlanadi, 0 va manfiy yo‘q).",
        },
        {
            "topic_id": "nat_numbers",
            "type": "input",
            "question": "Наименьшее натуральное число равно:",
            "question_uz": "Eng kichik natural son teng:",
            "answer": "1",
            "answer_uz": "1",
            "choices": None,
            "hint": "Натуральный ряд начинается с 1.",
            "hint_uz": "Natural qator 1 dan boshlanadi.",
        },
        {
            "topic_id": "nat_numbers",
            "type": "choice",
            "question": "Является ли 0 натуральным числом?",
            "question_uz": "0 natural sonmi?",
            "answer": "Нет",
            "answer_uz": "Yo‘q",
            "choices": json.dumps(
                ["Нет", "Да", "Зависит от задачи", "В разных странах по-разному"]
            ),
            "choices_uz": json.dumps(
                ["Yo‘q", "Ha", "Vaziyatga bog‘liq", "Turli mamlakatlarda farq qiladi"]
            ),
            "hint": "В школьной программе России 0 ∉ ℕ. Натуральные: 1, 2, 3, ...",
            "hint_uz": "O‘quv dasturiga ko‘ra 0 ℕ ga kirmaydi. Natural: 1, 2, 3, ...",
        },
        {
            "topic_id": "nat_numbers",
            "type": "choice",
            "question": "Сколько натуральных чисел меньше 5?",
            "question_uz": "5 dan kichik nechta natural son bor?",
            "answer": "4",
            "answer_uz": "4",
            "choices": json.dumps(["4", "5", "3", "6"]),
            "choices_uz": json.dumps(["4", "5", "3", "6"]),
            "hint": "Натуральные числа меньше 5: 1, 2, 3, 4 — итого 4.",
            "hint_uz": "5 dan kichik natural sonlar: 1, 2, 3, 4 — jami 4.",
        },
        {
            "topic_id": "nat_numbers",
            "type": "choice",
            "question": "ℕ — это обозначение множества:",
            "question_uz": "ℕ — bu qaysi to‘plam belgisi?",
            "answer": "натуральных чисел",
            "answer_uz": "natural sonlar",
            "choices": json.dumps(
                [
                    "натуральных чисел",
                    "целых чисел",
                    "рациональных чисел",
                    "вещественных чисел",
                ]
            ),
            "choices_uz": json.dumps(
                ["natural sonlar", "butun sonlar", "ratsional sonlar", "real sonlar"]
            ),
            "hint": "ℕ = {1, 2, 3, ...} — натуральные числа.",
            "hint_uz": "ℕ = {1, 2, 3, ...} — natural sonlar.",
        },
    ],
    # ── Целые числа (integers) ────────────────────────────
    "integers": [
        {
            "topic_id": "integers",
            "type": "choice",
            "question": "Какое из чисел является целым, но не натуральным?",
            "question_uz": "Qaysi son butun, lekin natural emas?",
            "answer": "-5",
            "answer_uz": "-5",
            "choices": json.dumps(["-5", "3", "1/2", "0.7"]),
            "choices_uz": json.dumps(["-5", "3", "1/2", "0.7"]),
            "hint": "Целые числа ℤ включают натуральные, 0 и отрицательные целые.",
            "hint_uz": "Butun sonlar ℤ natural sonlar, 0 va manfiy butun sonlarni o‘z ichiga oladi.",
        },
        {
            "topic_id": "integers",
            "type": "choice",
            "question": "Множество ℤ содержит:",
            "question_uz": "ℤ to‘plamida nima bor?",
            "answer": "натуральные, 0 и отрицательные целые",
            "answer_uz": "natural sonlar, 0 va manfiy butun sonlar",
            "choices": json.dumps(
                [
                    "натуральные, 0 и отрицательные целые",
                    "только натуральные",
                    "только отрицательные",
                    "дроби",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "natural sonlar, 0 va manfiy butun sonlar",
                    "faqat natural",
                    "faqat manfiy",
                    "kasrlar",
                ]
            ),
            "hint": "ℤ = {..., -2, -1, 0, 1, 2, ...}.",
            "hint_uz": "ℤ = {..., -2, -1, 0, 1, 2, ...}.",
        },
        {
            "topic_id": "integers",
            "type": "input",
            "question": "Сумма (-7) + 7 = ?",
            "question_uz": "(-7) + 7 yig‘indisi = ?",
            "answer": "0",
            "answer_uz": "0",
            "choices": None,
            "hint": "Противоположные числа в сумме дают 0.",
            "hint_uz": "Teskari sonlar yig‘indisi 0 ga teng.",
        },
        {
            "topic_id": "integers",
            "type": "choice",
            "question": "Верно ли: ℕ ⊂ ℤ (натуральные числа — подмножество целых)?",
            "question_uz": "To‘g‘rimi: ℕ ⊂ ℤ (natural sonlar butun sonlarning qismi)?",
            "answer": "Да",
            "answer_uz": "Ha",
            "choices": json.dumps(["Да", "Нет", "Частично", "Только при x > 0"]),
            "choices_uz": json.dumps(["Ha", "Yo‘q", "Qisman", "Faqat x > 0 da"]),
            "hint": "Любое натуральное число является целым, поэтому ℕ ⊂ ℤ.",
            "hint_uz": "Har bir natural son butun son, shuning uchun ℕ ⊂ ℤ.",
        },
        {
            "topic_id": "integers",
            "type": "input",
            "question": "Произведение (-3) × (-4) = ?",
            "question_uz": "(-3) × (-4) ko‘paytmasi = ?",
            "answer": "12",
            "answer_uz": "12",
            "choices": None,
            "hint": "Минус на минус даёт плюс: (-3)×(-4) = 12.",
            "hint_uz": "Minusni minusga ko‘paytirish musbat beradi: (-3)×(-4) = 12.",
        },
    ],
    # ── Рациональные числа (rationals) ───────────────────
    "rationals": [
        {
            "topic_id": "rationals",
            "type": "choice",
            "question": "Рациональное число — это число вида:",
            "question_uz": "Ratsional son — bu qanday ko‘rinishdagi son?",
            "answer": "p/q, где p, q ∈ ℤ, q ≠ 0",
            "answer_uz": "p/q, bu yerda p, q ∈ ℤ, q ≠ 0",
            "choices": json.dumps(
                [
                    "p/q, где p, q ∈ ℤ, q ≠ 0",
                    "только целые числа",
                    "только дроби",
                    "числа с конечным числом знаков",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "p/q, bu yerda p, q ∈ ℤ, q ≠ 0",
                    "faqat butun sonlar",
                    "faqat kasrlar",
                    "cheklangan raqamli sonlar",
                ]
            ),
            "hint": "ℚ = {p/q | p, q ∈ ℤ, q ≠ 0}.",
            "hint_uz": "ℚ = {p/q | p, q ∈ ℤ, q ≠ 0}.",
        },
        {
            "topic_id": "rationals",
            "type": "choice",
            "question": "Является ли 0.75 рациональным числом?",
            "question_uz": "0.75 ratsional sonmi?",
            "answer": "Да, это 3/4",
            "answer_uz": "Ha, bu 3/4",
            "choices": json.dumps(
                ["Да, это 3/4", "Нет", "Только если округлить", "Зависит от контекста"]
            ),
            "choices_uz": json.dumps(
                ["Ha, bu 3/4", "Yo‘q", "Faqat yaxlitlasam", "Kontextga bog‘liq"]
            ),
            "hint": "0.75 = 75/100 = 3/4 — рациональное число.",
            "hint_uz": "0.75 = 75/100 = 3/4 — ratsional son.",
        },
        {
            "topic_id": "rationals",
            "type": "choice",
            "question": "Дробь 1/3 в десятичной записи:",
            "question_uz": "1/3 kasrining o‘nlik yozuvi qanday?",
            "answer": "0.333... (бесконечная периодическая)",
            "answer_uz": "0.333... (cheksiz davriy)",
            "choices": json.dumps(
                [
                    "0.333... (бесконечная периодическая)",
                    "0.33 (конечная)",
                    "3.0",
                    "0.3",
                ]
            ),
            "choices_uz": json.dumps(
                ["0.333... (cheksiz davriy)", "0.33 (cheklangan)", "3.0", "0.3"]
            ),
            "hint": "1/3 = 0.(3) — бесконечная периодическая дробь; она всё равно рациональна.",
            "hint_uz": "1/3 = 0.(3) — cheksiz davriy kasr; u baribir ratsional.",
        },
        {
            "topic_id": "rationals",
            "type": "choice",
            "question": "Верно ли: ℤ ⊂ ℚ?",
            "question_uz": "To‘g‘rimi: ℤ ⊂ ℚ?",
            "answer": "Да",
            "answer_uz": "Ha",
            "choices": json.dumps(
                ["Да", "Нет", "Частично", "Только для положительных"]
            ),
            "choices_uz": json.dumps(["Ha", "Yo‘q", "Qisman", "Faqat musbatlar uchun"]),
            "hint": "Любое целое n можно записать как n/1 ∈ ℚ, значит ℤ ⊂ ℚ.",
            "hint_uz": "Har bir butun n ni n/1 tarzda yozish mumkin, ya’ni ℤ ⊂ ℚ.",
        },
        {
            "topic_id": "rationals",
            "type": "input",
            "question": "Упростите дробь: 12/18 = ?/3",
            "question_uz": "12/18 kasrini soddalashtiring: ?/3",
            "answer": "2",
            "answer_uz": "2",
            "choices": None,
            "hint": "12/18 = 2/3; в числителе 2.",
            "hint_uz": "12/18 = 2/3; chislovchi 2.",
        },
    ],
    # ── Иррациональные числа (irrationals) ───────────────
    "irrationals": [
        {
            "topic_id": "irrationals",
            "type": "choice",
            "question": "Какое из чисел является иррациональным?",
            "question_uz": "Qaysi son irratsional?",
            "answer": "√2",
            "answer_uz": "√2",
            "choices": json.dumps(["√2", "4/5", "0.5", "7"]),
            "choices_uz": json.dumps(["√2", "4/5", "0.5", "7"]),
            "hint": "√2 нельзя записать в виде p/q — это иррациональное число.",
            "hint_uz": "√2 ni p/q tarzida yozib boʻlmaydi — bu irratsional sondir.",
        },
        {
            "topic_id": "irrationals",
            "type": "choice",
            "question": "Иррациональное число в десятичной форме:",
            "question_uz": "Irratsional son o‘nlik yozilishi:",
            "answer": "бесконечная непериодическая дробь",
            "answer_uz": "cheksiz nodavriy kasr",
            "choices": json.dumps(
                [
                    "бесконечная непериодическая дробь",
                    "конечная дробь",
                    "периодическая дробь",
                    "целое число",
                ]
            ),
            "choices_uz": json.dumps(
                ["cheksiz nodavriy kasr", "cheklangan kasr", "davriy kasr", "butun son"]
            ),
            "hint": "π = 3.14159... — бесконечна и непериодична.",
            "hint_uz": "π = 3.14159... — cheksiz va nodavriy.",
        },
        {
            "topic_id": "irrationals",
            "type": "choice",
            "question": "Число π ≈ 3.14159... является:",
            "question_uz": "π ≈ 3.14159... soni qanday?",
            "answer": "иррациональным",
            "answer_uz": "irratsional",
            "choices": json.dumps(
                ["иррациональным", "рациональным", "натуральным", "целым"]
            ),
            "choices_uz": json.dumps(["irratsional", "ratsional", "natural", "butun"]),
            "hint": "π доказано трансцендентным и иррациональным числом.",
            "hint_uz": "π transsendental va irratsional son ekanligi isbotlangan.",
        },
        {
            "topic_id": "irrationals",
            "type": "choice",
            "question": "Сумма рационального и иррационального числа:",
            "question_uz": "Ratsional va irratsional son yig‘indisi:",
            "answer": "иррациональное",
            "answer_uz": "irratsional",
            "choices": json.dumps(
                ["иррациональное", "рациональное", "натуральное", "зависит от чисел"]
            ),
            "choices_uz": json.dumps(
                ["irratsional", "ratsional", "natural", "sonlarga bog‘liq"]
            ),
            "hint": "Если a ∈ ℚ и b ∉ ℚ, то a + b ∉ ℚ.",
            "hint_uz": "Agar a ∈ ℚ va b ∉ ℚ bo‘lsa, a + b ∉ ℚ.",
        },
        {
            "topic_id": "irrationals",
            "type": "choice",
            "question": "Число e ≈ 2.718... (основание натурального логарифма) является:",
            "question_uz": "e ≈ 2.718... (natural logarifm asosiy soni) qanday son?",
            "answer": "иррациональным",
            "answer_uz": "irratsional",
            "choices": json.dumps(
                ["иррациональным", "рациональным", "целым", "натуральным"]
            ),
            "choices_uz": json.dumps(["irratsional", "ratsional", "butun", "natural"]),
            "hint": "e — трансцендентное иррациональное число.",
            "hint_uz": "e — transsendental irratsional sondir.",
        },
    ],
    # ── Вещественные числа (reals) ────────────────────────
    "reals": [
        {
            "topic_id": "reals",
            "type": "choice",
            "question": "Множество вещественных чисел ℝ включает:",
            "question_uz": "ℝ haqiqiy sonlar to‘plamiga nimalar kiradi?",
            "answer": "ℚ и иррациональные числа",
            "answer_uz": "ℚ va irratsional sonlar",
            "choices": json.dumps(
                [
                    "ℚ и иррациональные числа",
                    "только рациональные",
                    "только иррациональные",
                    "комплексные числа",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "ℚ va irratsional sonlar",
                    "faqat ratsional",
                    "faqat irratsional",
                    "kompleks sonlar",
                ]
            ),
            "hint": "ℝ = ℚ ∪ (иррациональные). Каждой точке на числовой прямой соответствует вещественное число.",
            "hint_uz": "ℝ = ℚ ∪ (irratsional). Har bir nuqta haqiqiy son bilan mos keladi.",
        },
        {
            "topic_id": "reals",
            "type": "choice",
            "question": "Верно ли: ℚ ⊂ ℝ?",
            "question_uz": "To‘g‘rimi: ℚ ⊂ ℝ?",
            "answer": "Да",
            "answer_uz": "Ha",
            "choices": json.dumps(
                ["Да", "Нет", "Только для положительных", "Только для целых"]
            ),
            "choices_uz": json.dumps(
                ["Ha", "Yo‘q", "Faqat musbatlar uchun", "Faqat butunlar uchun"]
            ),
            "hint": "Рациональные числа — подмножество вещественных: ℚ ⊂ ℝ.",
            "hint_uz": "Ratsional sonlar haqiqiy sonlar ichida: ℚ ⊂ ℝ.",
        },
        {
            "topic_id": "reals",
            "type": "choice",
            "question": "Каждой точке числовой прямой соответствует:",
            "question_uz": "Raqamlar chizig‘idagi har bir nuqtaga nima mos keladi?",
            "answer": "вещественное число",
            "answer_uz": "haqiqiy son",
            "choices": json.dumps(
                [
                    "вещественное число",
                    "рациональное число",
                    "натуральное число",
                    "комплексное число",
                ]
            ),
            "choices_uz": json.dumps(
                ["haqiqiy son", "ratsional son", "natural son", "kompleks son"]
            ),
            "hint": "Числовая прямая — геометрическая модель множества ℝ.",
            "hint_uz": "Raqamlar chizig‘i ℝ to‘plamining geometrik modeli.",
        },
        {
            "topic_id": "reals",
            "type": "choice",
            "question": "Правильный порядок вложенности множеств:",
            "question_uz": "To‘g‘ri to‘plamlar o‘zaro joylashuvi tartibi:",
            "answer": "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ",
            "answer_uz": "ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ",
            "choices": json.dumps(
                ["ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ", "ℤ ⊂ ℕ ⊂ ℚ ⊂ ℝ", "ℝ ⊂ ℚ ⊂ ℤ ⊂ ℕ", "ℕ ⊂ ℚ ⊂ ℤ ⊂ ℝ"]
            ),
            "choices_uz": json.dumps(
                ["ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ", "ℤ ⊂ ℕ ⊂ ℚ ⊂ ℝ", "ℝ ⊂ ℚ ⊂ ℤ ⊂ ℕ", "ℕ ⊂ ℚ ⊂ ℤ ⊂ ℝ"]
            ),
            "hint": "Каждое следующее множество шире предыдущего: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ.",
            "hint_uz": "Har bir keyingi to‘plam oldingisidan kengroq: ℕ ⊂ ℤ ⊂ ℚ ⊂ ℝ.",
        },
        {
            "topic_id": "reals",
            "type": "choice",
            "question": "Число √(-1) является вещественным числом?",
            "question_uz": "√(-1) soni haqiqiy sonmi?",
            "answer": "Нет",
            "answer_uz": "Yo‘q",
            "choices": json.dumps(
                ["Нет", "Да", "Только в особых случаях", "Зависит от определения"]
            ),
            "choices_uz": json.dumps(
                ["Yo‘q", "Ha", "Faqat alohida holatlarda", "Ta’rifga bog‘liq"]
            ),
            "hint": "Квадратный корень из отрицательного числа не является вещественным — это мнимая единица i.",
            "hint_uz": "Manfiy sonning kvadrat ildizi haqiqiy emas — bu i tasodifiy birlik.",
        },
    ],
    # ── Комплексные числа (complex_numbers) ───────────────
    "complex_numbers": [
        {
            "topic_id": "complex_numbers",
            "type": "choice",
            "question": "Мнимая единица i определяется как:",
            "question_uz": "Tasodifiy birlik i qanday aniqlanadi?",
            "answer": "i² = -1",
            "answer_uz": "i² = -1",
            "choices": json.dumps(["i² = -1", "i = -1", "i = √1", "i² = 1"]),
            "choices_uz": json.dumps(["i² = -1", "i = -1", "i = √1", "i² = 1"]),
            "hint": "i = √(-1), поэтому i² = -1.",
            "hint_uz": "i = √(-1), shuning uchun i² = -1.",
        },
        {
            "topic_id": "complex_numbers",
            "type": "choice",
            "question": "Комплексное число z = 3 + 4i: вещественная часть равна:",
            "question_uz": "z = 3 + 4i kompleks sonining haqiqiy qismi teng:",
            "answer": "3",
            "answer_uz": "3",
            "choices": json.dumps(["3", "4", "4i", "7"]),
            "choices_uz": json.dumps(["3", "4", "4i", "7"]),
            "hint": "z = a + bi: Re(z) = a = 3, Im(z) = b = 4.",
            "hint_uz": "z = a + bi: Re(z) = a = 3, Im(z) = b = 4.",
        },
        {
            "topic_id": "complex_numbers",
            "type": "input",
            "question": "Модуль комплексного числа z = 3 + 4i равен |z| = ?",
            "question_uz": "z = 3 + 4i kompleks sonining modulini toping: |z| = ?",
            "answer": "5",
            "answer_uz": "5",
            "choices": None,
            "hint": "|z| = √(3² + 4²) = √(9 + 16) = √25 = 5.",
            "hint_uz": "|z| = √(3² + 4²) = √(9 + 16) = √25 = 5.",
        },
        {
            "topic_id": "complex_numbers",
            "type": "choice",
            "question": "Комплексно сопряжённое к z = 2 + 5i:",
            "question_uz": "z = 2 + 5i orqali kompleks qo‘shni son:",
            "answer": "2 - 5i",
            "answer_uz": "2 - 5i",
            "choices": json.dumps(["2 - 5i", "-2 + 5i", "-2 - 5i", "2 + 5i"]),
            "choices_uz": json.dumps(["2 - 5i", "-2 + 5i", "-2 - 5i", "2 + 5i"]),
            "hint": "Сопряжённое z̄ = a - bi: меняем знак мнимой части.",
            "hint_uz": "Qo‘shni z̄ = a - bi: tasodifiy qismini belgisini o‘zgartiramiz.",
        },
        {
            "topic_id": "complex_numbers",
            "type": "choice",
            "question": "Сумма (1 + 2i) + (3 - i) = ?",
            "question_uz": "(1 + 2i) + (3 - i) yig‘indisi = ?",
            "answer": "4 + i",
            "answer_uz": "4 + i",
            "choices": json.dumps(["4 + i", "4 + 3i", "2 + i", "4 - i"]),
            "choices_uz": json.dumps(["4 + i", "4 + 3i", "2 + i", "4 - i"]),
            "hint": "Складываем вещественные и мнимые части: (1+3) + (2-1)i = 4 + i.",
            "hint_uz": "Haqiqiy va tasodifiy qismlarni qo‘shamiz: (1+3) + (2-1)i = 4 + i.",
        },
    ],
    # ── Проценты (percents) ───────────────────────────────
    "percents": [
        {
            "topic_id": "percents",
            "type": "input",
            "question": "Найдите 20% от числа 150.",
            "question_uz": "150 sonning 20% ini toping.",
            "answer": "30",
            "answer_uz": "30",
            "choices": None,
            "hint": "20% от 150 = 150 · 20 / 100 = 30.",
            "hint_uz": "150 · 20 / 100 = 30.",
        },
        {
            "topic_id": "percents",
            "type": "input",
            "question": "Число 80 — это 40% от какого числа?",
            "question_uz": "80 qaysi sonning 40% i?",
            "answer": "200",
            "answer_uz": "200",
            "choices": None,
            "hint": "X = 80 · 100 / 40 = 200.",
            "hint_uz": "X = 80 · 100 / 40 = 200.",
        },
        {
            "topic_id": "percents",
            "type": "input",
            "question": "Сколько процентов составляет 45 от 180?",
            "question_uz": "180 ning 45 tasi necha foiz?",
            "answer": "25",
            "answer_uz": "25",
            "choices": None,
            "hint": "P = 45 · 100 / 180 = 25%.",
            "hint_uz": "P = 45 · 100 / 180 = 25%.",
        },
        {
            "topic_id": "percents",
            "type": "input",
            "question": "Цена выросла с 500 до 600 руб. На сколько процентов?",
            "question_uz": "Narx 500 dan 600 gacha oshdi. Necha foizga?",
            "answer": "20",
            "answer_uz": "20",
            "choices": None,
            "hint": "Рост = 100/500 × 100 = 20%.",
            "hint_uz": "O‘sish = 100/500 × 100 = 20%.",
        },
        {
            "topic_id": "percents",
            "type": "choice",
            "question": "1% = ?",
            "question_uz": "1% = ?",
            "answer": "0.01",
            "answer_uz": "0.01",
            "choices": json.dumps(["0.01", "0.1", "1", "0.001"]),
            "choices_uz": json.dumps(["0.01", "0.1", "1", "0.001"]),
            "hint": "1% = 1/100 = 0.01.",
            "hint_uz": "1% = 1/100 = 0.01.",
        },
    ],
    # ── Производная (derivative) ──────────────────────────
    "derivative": [
        {
            "topic_id": "derivative",
            "type": "choice",
            "question": "Производная f'(x) константы c = ?",
            "question_uz": "c konstantaning hosilasi f'(x) = ?",
            "answer": "0",
            "answer_uz": "0",
            "choices": json.dumps(["0", "1", "c", "x"]),
            "choices_uz": json.dumps(["0", "1", "c", "x"]),
            "hint": "Производная константы всегда 0: (c)' = 0.",
            "hint_uz": "Konstantaning hosilasi har doim 0: (c)' = 0.",
        },
        {
            "topic_id": "derivative",
            "type": "choice",
            "question": "Производная функции f(x) = xⁿ равна:",
            "question_uz": "f(x) = xⁿ funksiyaning hosilasi qanday?",
            "answer": "n·xⁿ⁻¹",
            "answer_uz": "n·xⁿ⁻¹",
            "choices": json.dumps(["n·xⁿ⁻¹", "xⁿ⁺¹", "n·xⁿ", "(n-1)·xⁿ"]),
            "choices_uz": json.dumps(["n·xⁿ⁻¹", "xⁿ⁺¹", "n·xⁿ", "(n-1)·xⁿ"]),
            "hint": "(xⁿ)' = n·xⁿ⁻¹ — степенное правило.",
            "hint_uz": "(xⁿ)' = n·xⁿ⁻¹ — daraja qoidasidir.",
        },
        {
            "topic_id": "derivative",
            "type": "choice",
            "question": "f(x) = 3x². Чему равна f'(x)?",
            "question_uz": "f(x) = 3x². f'(x) qancha?",
            "answer": "6x",
            "answer_uz": "6x",
            "choices": json.dumps(["6x", "3x", "6x²", "x²"]),
            "choices_uz": json.dumps(["6x", "3x", "6x²", "x²"]),
            "hint": "(3x²)' = 3·2x = 6x.",
            "hint_uz": "(3x²)' = 3·2x = 6x.",
        },
        {
            "topic_id": "derivative",
            "type": "choice",
            "question": "Геометрический смысл производной f'(x₀) — это:",
            "question_uz": "f'(x₀) hosilasining geometrik ma'nosi nima?",
            "answer": "угловой коэффициент касательной",
            "answer_uz": "to‘g‘ri chiziqning burchak koeffitsienti",
            "choices": json.dumps(
                [
                    "угловой коэффициент касательной",
                    "площадь под графиком",
                    "значение функции",
                    "длина дуги",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "to‘g‘ri chiziqning burchak koeffitsienti",
                    "grafik ostidagi maydon",
                    "funksiya qiymati",
                    "ark uzunligi",
                ]
            ),
            "hint": "f'(x₀) = tg α, где α — угол наклона касательной к оси Ox.",
            "hint_uz": "f'(x₀) = tg α, bu yerda α — to‘g‘ri chiziqning Oxga nisbatan burilish burchagi.",
        },
        {
            "topic_id": "derivative",
            "type": "choice",
            "question": "Производная функции f(x) = sin x:",
            "question_uz": "f(x) = sin x funksiyaning hosilasi qanday?",
            "answer": "cos x",
            "answer_uz": "cos x",
            "choices": json.dumps(["cos x", "-cos x", "sin x", "-sin x"]),
            "choices_uz": json.dumps(["cos x", "-cos x", "sin x", "-sin x"]),
            "hint": "(sin x)' = cos x.",
            "hint_uz": "(sin x)' = cos x.",
        },
    ],
    # ── Интеграл (integral) ───────────────────────────────
    "integral": [
        {
            "topic_id": "integral",
            "type": "choice",
            "question": "∫xⁿ dx = ? (n ≠ -1)",
            "question_uz": "∫xⁿ dx = ? (n ≠ -1)",
            "answer": "xⁿ⁺¹/(n+1) + C",
            "answer_uz": "xⁿ⁺¹/(n+1) + C",
            "choices": json.dumps(
                ["xⁿ⁺¹/(n+1) + C", "n·xⁿ⁻¹ + C", "xⁿ + C", "xⁿ/(n-1) + C"]
            ),
            "choices_uz": json.dumps(
                ["xⁿ⁺¹/(n+1) + C", "n·xⁿ⁻¹ + C", "xⁿ + C", "xⁿ/(n-1) + C"]
            ),
            "hint": "Степень увеличивается на 1, делим на новую степень: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.",
            "hint_uz": "Daraja 1 ga oshadi, yangi darajaga bo‘linadi: ∫xⁿ dx = xⁿ⁺¹/(n+1) + C.",
        },
        {
            "topic_id": "integral",
            "type": "choice",
            "question": "∫cos x dx = ?",
            "question_uz": "∫cos x dx = ?",
            "answer": "sin x + C",
            "answer_uz": "sin x + C",
            "choices": json.dumps(
                ["sin x + C", "-sin x + C", "cos x + C", "-cos x + C"]
            ),
            "choices_uz": json.dumps(
                ["sin x + C", "-sin x + C", "cos x + C", "-cos x + C"]
            ),
            "hint": "Интеграл от косинуса — синус: ∫cos x dx = sin x + C.",
            "hint_uz": "Cosinusning integrali sin x + C ga teng.",
        },
        {
            "topic_id": "integral",
            "type": "choice",
            "question": "Геометрический смысл определённого интеграла ∫ₐᵇ f(x) dx:",
            "question_uz": "Aniqlangan integral ∫ₐᵇ f(x) dx ning geometrik ma’nosi:",
            "answer": "площадь под кривой от a до b",
            "answer_uz": "a dan b gacha egri ostidagi maydon",
            "choices": json.dumps(
                [
                    "площадь под кривой от a до b",
                    "длина дуги",
                    "объём тела",
                    "наклон касательной",
                ]
            ),
            "choices_uz": json.dumps(
                [
                    "a dan b gacha egri ostidagi maydon",
                    "ark uzunligi",
                    "jism hajmi",
                    "to‘g‘ri chiziqning qiyaligi",
                ]
            ),
            "hint": "Определённый интеграл вычисляет площадь криволинейной трапеции.",
            "hint_uz": "Aniqlangan integral egri ostidagi trapetsiyaning maydonini hisoblaydi.",
        },
        {
            "topic_id": "integral",
            "type": "choice",
            "question": "Формула Ньютона–Лейбница: ∫ₐᵇ f(x) dx = ?",
            "question_uz": "Nyuton–Leybnits formulasiga ko‘ra ∫ₐᵇ f(x) dx = ?",
            "answer": "F(b) - F(a)",
            "answer_uz": "F(b) - F(a)",
            "choices": json.dumps(
                ["F(b) - F(a)", "F(a) + F(b)", "f(b) - f(a)", "F(b) + C"]
            ),
            "choices_uz": json.dumps(
                ["F(b) - F(a)", "F(a) + F(b)", "f(b) - f(a)", "F(b) + C"]
            ),
            "hint": "F — первообразная f. ∫ₐᵇ f dx = F(b) - F(a).",
            "hint_uz": "F — f ning birinchi primitivi. ∫ₐᵇ f dx = F(b) - F(a).",
        },
        {
            "topic_id": "integral",
            "type": "choice",
            "question": "∫ 1 dx = ?",
            "question_uz": "∫ 1 dx = ?",
            "answer": "x + C",
            "answer_uz": "x + C",
            "choices": json.dumps(["x + C", "1 + C", "0", "C"]),
            "choices_uz": json.dumps(["x + C", "1 + C", "0", "C"]),
            "hint": "∫ 1 dx = ∫ x⁰ dx = x¹/1 + C = x + C.",
            "hint_uz": "∫ 1 dx = ∫ x⁰ dx = x¹/1 + C = x + C.",
        },
    ],
    # ── Геометрическая прогрессия (geom_prog) ─────────────────
    "geom_prog": [
        {
            "topic_id": "geom_prog",
            "type": "input",
            "question": "Прогрессия: 2, 6, 18, 54, ... Знаменатель q = ?",
            "question_uz": "Progressiya: 2, 6, 18, 54, ... Qaysi q qiymati?",
            "answer": "3",
            "answer_uz": "3",
            "choices": None,
            "hint": "q = a₂ / a₁ = 6 / 2 = 3",
            "hint_uz": "q = a₂ / a₁ = 6 / 2 = 3",
        },
        {
            "topic_id": "geom_prog",
            "type": "input",
            "question": "a₁ = 5, q = 2. Найдите a₄.",
            "question_uz": "a₁ = 5, q = 2. a₄ ni toping.",
            "answer": "40",
            "answer_uz": "40",
            "choices": None,
            "hint": "aₙ = a₁ · q^(n-1) = 5 · 2³ = 40",
            "hint_uz": "aₙ = a₁ · q^(n-1) = 5 · 2³ = 40",
        },
        {
            "topic_id": "geom_prog",
            "type": "choice",
            "question": "Формула n-го члена геометрической прогрессии:",
            "question_uz": "Geometrik progressiyaning n-chi had formulasi:",
            "answer": "aₙ = a₁ · q^(n−1)",
            "answer_uz": "aₙ = a₁ · q^(n−1)",
            "choices": json.dumps(
                ["aₙ = a₁ · q^(n−1)", "aₙ = a₁ + q^n", "aₙ = a₁ · n", "aₙ = q^n"]
            ),
            "choices_uz": json.dumps(
                ["aₙ = a₁ · q^(n−1)", "aₙ = a₁ + q^n", "aₙ = a₁ · n", "aₙ = q^n"]
            ),
            "hint": "Каждый член умножается на q: a₂=a₁q, a₃=a₁q², ...",
            "hint_uz": "Har bir had q ga ko‘paytiriladi: a₂=a₁q, a₃=a₁q², ...",
        },
        {
            "topic_id": "geom_prog",
            "type": "input",
            "question": "a₁ = 64, q = 0.5. Найдите a₃.",
            "question_uz": "a₁ = 64, q = 0.5. a₃ ni toping.",
            "answer": "16",
            "answer_uz": "16",
            "choices": None,
            "hint": "a₃ = 64 · (0.5)² = 64 · 0.25 = 16",
            "hint_uz": "a₃ = 64 · (0.5)² = 64 · 0.25 = 16",
        },
        {
            "topic_id": "geom_prog",
            "type": "choice",
            "question": "При |q| < 1 и бесконечном числе членов сумма прогрессии:",
            "question_uz": "|q| < 1 va cheksiz hadlar sonida progressiyaning yig‘indisi:",
            "answer": "S = a₁ / (1 − q)",
            "answer_uz": "S = a₁ / (1 − q)",
            "choices": json.dumps(
                ["S = a₁ / (1 − q)", "S = a₁ · q", "S = ∞", "S = a₁ / q"]
            ),
            "choices_uz": json.dumps(
                ["S = a₁ / (1 − q)", "S = a₁ · q", "S = ∞", "S = a₁ / q"]
            ),
            "hint": "Формула бесконечной убывающей ГП: S = a₁ / (1 − q).",
            "hint_uz": "Cheksiz kamayuvchi GP formulası: S = a₁ / (1 − q).",
        },
    ],
}


# ══════════════════════════════════════════════════════════════
#  БАЗА ЗНАНИЙ — ТЕМЫ 1–9 КЛАСС
# ══════════════════════════════════════════════════════════════

KB_TOPICS = [
    # ──────────────────────────────────────────────
    #  1 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Счёт до 100 и сравнение чисел",
        "content": (
            "Числа от 1 до 100 записываются цифрами. Каждое число больше предыдущего на 1.\n\n"
            "Сравнение:\n"
            "  > — больше    < — меньше    = — равно\n"
            "Пример: 47 > 39, потому что 4 > 3 (сравниваем десятки).\n\n"
            "Запись числом:\n"
            "  Двузначное число = десятки × 10 + единицы\n"
            "  Пример: 53 = 5 десятков + 3 единицы"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Числа",
        "grade": "1 класс",
        "difficulty": "easy",
    },
    {
        "title": "Сложение и вычитание (1 класс)",
        "content": (
            "Сложение: a + b = c (сумма)\n"
            "Вычитание: a − b = c (разность)\n\n"
            "Переместительный закон сложения: a + b = b + a\n"
            "Нельзя вычесть большее из меньшего (в начальной школе).\n\n"
            "Примеры:\n"
            "  12 + 35 = 47\n"
            "  80 − 24 = 56\n\n"
            "Проверка вычитания: 56 + 24 = 80 ✓"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Действия",
        "grade": "1 класс",
        "difficulty": "easy",
    },
    # ──────────────────────────────────────────────
    #  2 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Таблица умножения",
        "content": (
            "Умножение — сокращённое сложение одинаковых слагаемых.\n"
            "  a × b = b × a (переместительный закон)\n\n"
            "Ключевые факты:\n"
            "  Любое число × 0 = 0\n"
            "  Любое число × 1 = само число\n"
            "  9 × 9 = 81, 7 × 8 = 56, 6 × 7 = 42\n\n"
            "Деление — обратная операция умножения:\n"
            "  a × b = c  →  c ÷ b = a"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Действия",
        "grade": "2 класс",
        "difficulty": "easy",
    },
    {
        "title": "Длина, масса и время (2 класс)",
        "content": (
            "Единицы длины:\n"
            "  1 м = 100 см = 1000 мм\n"
            "  1 км = 1000 м\n\n"
            "Единицы массы:\n"
            "  1 кг = 1000 г\n"
            "  1 т = 1000 кг\n\n"
            "Единицы времени:\n"
            "  1 мин = 60 с\n"
            "  1 ч = 60 мин = 3600 с\n"
            "  1 сут = 24 ч\n"
            "  1 неделя = 7 суток\n"
            "  1 год = 12 месяцев = 365 дней"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Величины",
        "grade": "2 класс",
        "difficulty": "easy",
    },
    # ──────────────────────────────────────────────
    #  3 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Многозначные числа и письменные действия",
        "content": (
            "Многозначные числа записываются цифрами по разрядам:\n"
            "  единицы, десятки, сотни, тысячи, ...\n\n"
            "Письменное сложение/вычитание:\n"
            "  Записываем в столбик, выравниваем по разрядам.\n"
            "  Начинаем с единиц, учитываем перенос.\n\n"
            "Письменное умножение:\n"
            "  845 × 3 = 2535 (умножаем каждый разряд)\n\n"
            "Письменное деление:\n"
            "  846 ÷ 3 = 282 (делим по разрядам слева направо)"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Действия",
        "grade": "3 класс",
        "difficulty": "easy",
    },
    {
        "title": "Периметр и площадь фигур (3 класс)",
        "content": (
            "Периметр — сумма всех сторон фигуры.\n\n"
            "Квадрат:  P = 4a,    S = a²\n"
            "Прямоугольник:  P = 2(a + b),    S = a · b\n\n"
            "Единицы площади:\n"
            "  1 м² = 10 000 см²\n"
            "  1 км² = 1 000 000 м²\n\n"
            "Пример: прямоугольник 5 см × 3 см\n"
            "  P = 2·(5+3) = 16 см\n"
            "  S = 5·3 = 15 см²"
        ),
        "diagram": "none",
        "school_section": "Геометрия",
        "task_type": "Фигуры",
        "grade": "3 класс",
        "difficulty": "easy",
    },
    # ──────────────────────────────────────────────
    #  4 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Деление с остатком",
        "content": (
            "При делении a на b получаем:\n"
            "  a = b · q + r,  где 0 ≤ r < b\n"
            "q — неполное частное, r — остаток.\n\n"
            "Пример: 17 ÷ 5 = 3 (ост. 2)\n"
            "  Проверка: 5·3 + 2 = 17 ✓\n\n"
            "Деление на 2 без остатка → чётное число.\n"
            "Остаток всегда меньше делителя."
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Действия",
        "grade": "4 класс",
        "difficulty": "easy",
    },
    {
        "title": "Простые уравнения (4 класс)",
        "content": (
            "Уравнение — равенство с неизвестным (x, □, ?...).\n\n"
            "Правила нахождения неизвестного:\n"
            "  x + b = c  →  x = c − b\n"
            "  x − b = c  →  x = c + b\n"
            "  x · b = c  →  x = c ÷ b\n"
            "  x ÷ b = c  →  x = c · b\n\n"
            "Пример: x + 17 = 45\n"
            "  x = 45 − 17 = 28\n"
            "Проверка: 28 + 17 = 45 ✓"
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Уравнения",
        "grade": "4 класс",
        "difficulty": "easy",
    },
    # ──────────────────────────────────────────────
    #  5 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Натуральные числа и делимость",
        "content": (
            "Натуральные числа: 1, 2, 3, 4, ...\n\n"
            "Признаки делимости:\n"
            "  На 2: последняя цифра чётная (0,2,4,6,8)\n"
            "  На 3: сумма цифр делится на 3\n"
            "  На 5: последняя цифра 0 или 5\n"
            "  На 9: сумма цифр делится на 9\n"
            "  На 10: последняя цифра 0\n\n"
            "Простое число делится только на 1 и само себя.\n"
            "Составное число имеет делители, кроме 1 и себя.\n"
            "Простые до 20: 2, 3, 5, 7, 11, 13, 17, 19"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Числа",
        "grade": "5 класс",
        "difficulty": "easy",
    },
    {
        "title": "Обыкновенные дроби (5 класс)",
        "content": (
            "Дробь: a/b, где a — числитель, b — знаменатель (b ≠ 0).\n\n"
            "Основное свойство: a/b = (a·n)/(b·n)\n\n"
            "Сложение (одинаковые знаменатели):\n"
            "  a/b + c/b = (a+c)/b\n\n"
            "Умножение: (a/b)·(c/d) = (a·c)/(b·d)\n\n"
            "Деление: (a/b) ÷ (c/d) = (a·d)/(b·c)\n\n"
            "Правильная дробь: числитель < знаменатель (3/5)\n"
            "Неправильная: числитель ≥ знаменатель (7/3)\n"
            "Смешанное число: 2⅓ = 7/3"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Дроби",
        "grade": "5 класс",
        "difficulty": "medium",
    },
    {
        "title": "Десятичные дроби (5 класс)",
        "content": (
            "Десятичная дробь записывается через запятую:\n"
            "  3.75 = 3 + 7/10 + 5/100 = 375/100\n\n"
            "Сравнение: выравниваем количество цифр после запятой.\n\n"
            "Действия:\n"
            "  Сложение/вычитание — по разрядам.\n"
            "  Умножение: умножаем как целые, затем ставим запятую.\n"
            "  Деление: переносим запятую в делителе — становится целым.\n\n"
            "Перевод: 0.1 = 1/10, 0.01 = 1/100, 0.25 = 1/4"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Дроби",
        "grade": "5 класс",
        "difficulty": "medium",
    },
    # ──────────────────────────────────────────────
    #  6 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Отрицательные числа и числовая прямая",
        "content": (
            "Целые числа: ..., −3, −2, −1, 0, 1, 2, 3, ...\n\n"
            "Числовая прямая: отрицательные — левее нуля, положительные — правее.\n\n"
            "Модуль: |a| — расстояние от нуля (всегда ≥ 0)\n"
            "  |−5| = 5,   |3| = 3,   |0| = 0\n\n"
            "Сложение с разными знаками:\n"
            "  (−3) + 5 = 2   (вычесть модули, знак у большего)\n\n"
            "Умножение/деление:\n"
            "  (−) × (−) = (+)\n"
            "  (−) × (+) = (−)"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Числа",
        "grade": "6 класс",
        "difficulty": "medium",
    },
    {
        "title": "Проценты и пропорции",
        "content": (
            "Процент — одна сотая часть числа.\n"
            "  1% = 1/100 = 0.01\n\n"
            "Нахождение процента от числа:\n"
            "  P% от A = A · P / 100\n\n"
            "Нахождение числа по его проценту:\n"
            "  A = X · 100 / P\n\n"
            "Пропорция: a/b = c/d ↔ a·d = b·c\n\n"
            "Прямая пропорциональность: y = kx\n"
            "Обратная: y = k/x\n\n"
            "Примеры:\n"
            "  20% от 300 = 300·20/100 = 60\n"
            "  60 — это 20% от ? → 60·100/20 = 300"
        ),
        "diagram": "none",
        "school_section": "Арифметика",
        "task_type": "Проценты",
        "grade": "6 класс",
        "difficulty": "medium",
    },
    {
        "title": "Степени целых чисел (6 класс)",
        "content": (
            "aⁿ = a · a · ... · a (n раз)\n\n"
            "Свойства степеней:\n"
            "  aᵐ · aⁿ = aᵐ⁺ⁿ\n"
            "  aᵐ ÷ aⁿ = aᵐ⁻ⁿ   (a ≠ 0)\n"
            "  (aᵐ)ⁿ = aᵐⁿ\n"
            "  a⁰ = 1   (a ≠ 0)\n"
            "  a¹ = a\n\n"
            "Квадраты: 1, 4, 9, 16, 25, 36, 49, 64, 81, 100\n"
            "Кубы: 1, 8, 27, 64, 125"
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Степени",
        "grade": "6 класс",
        "difficulty": "medium",
    },
    # ──────────────────────────────────────────────
    #  7 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Алгебраические выражения и формулы",
        "content": (
            "Одночлен: произведение чисел и переменных. Пример: 3x²y\n"
            "Многочлен: сумма одночленов. Пример: x² − 5x + 6\n\n"
            "Сокращённые формулы умножения:\n"
            "  (a + b)² = a² + 2ab + b²\n"
            "  (a − b)² = a² − 2ab + b²\n"
            "  (a + b)(a − b) = a² − b²\n"
            "  (a + b)³ = a³ + 3a²b + 3ab² + b³\n\n"
            "Стандартный вид многочлена: степени убывают слева направо."
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Выражения",
        "grade": "7 класс",
        "difficulty": "medium",
    },
    {
        "title": "Линейные уравнения и системы (7 класс)",
        "content": (
            "Линейное уравнение: ax + b = 0 (a ≠ 0)\n"
            "  Решение: x = −b/a\n\n"
            "Система двух уравнений с двумя переменными:\n"
            "  ⎧ a₁x + b₁y = c₁\n"
            "  ⎩ a₂x + b₂y = c₂\n\n"
            "Методы решения:\n"
            "  Подстановка: выразить одну переменную, подставить в другое.\n"
            "  Сложение: сложить уравнения для исключения переменной.\n\n"
            "Система имеет одно, ноль или бесконечно много решений."
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Уравнения",
        "grade": "7 класс",
        "difficulty": "medium",
    },
    {
        "title": "Треугольники и параллельные прямые (7 класс)",
        "content": (
            "Сумма углов треугольника = 180°\n\n"
            "Внешний угол треугольника = сумма двух несмежных внутренних.\n\n"
            "Параллельные прямые, пересечённые секущей:\n"
            "  Накрест лежащие углы — равны\n"
            "  Соответственные углы — равны\n"
            "  Односторонние углы — в сумме 180°\n\n"
            "Признаки равенства треугольников:\n"
            "  I:   сторона-угол-сторона (СУС)\n"
            "  II:  угол-сторона-угол (УСУ)\n"
            "  III: сторона-сторона-сторона (ССС)"
        ),
        "diagram": "none",
        "school_section": "Геометрия",
        "task_type": "Фигуры",
        "grade": "7 класс",
        "difficulty": "medium",
    },
    # ──────────────────────────────────────────────
    #  8 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Квадратные уравнения (8 класс)",
        "content": (
            "ax² + bx + c = 0   (a ≠ 0)\n\n"
            "Дискриминант: D = b² − 4ac\n"
            "  D > 0: два корня   x₁,₂ = (−b ± √D) / (2a)\n"
            "  D = 0: один корень  x = −b / (2a)\n"
            "  D < 0: нет действительных корней\n\n"
            "Теорема Виета:\n"
            "  x₁ + x₂ = −b/a\n"
            "  x₁ · x₂ = c/a\n\n"
            "Неполные уравнения:\n"
            "  b = 0: ax² + c = 0 → x = ±√(−c/a)\n"
            "  c = 0: ax² + bx = 0 → x(ax + b) = 0"
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Уравнения",
        "grade": "8 класс",
        "difficulty": "medium",
    },
    {
        "title": "Функции и их свойства (8 класс)",
        "content": (
            "Функция y = f(x): каждому x из области определения (D) ставится единственное y.\n\n"
            "Основные функции:\n"
            "  Линейная:      y = kx + b   (D = ℝ)\n"
            "  Квадратичная:  y = ax² + bx + c\n"
            "  Обратная пропорциональность: y = k/x  (x ≠ 0)\n\n"
            "Свойства:\n"
            "  Возрастание: при x₁ < x₂ → f(x₁) < f(x₂)\n"
            "  Чётность: f(−x) = f(x)  (симметрична оси y)\n"
            "  Нечётность: f(−x) = −f(x)  (симметрична началу)\n"
            "  Нули функции: f(x) = 0"
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Функции",
        "grade": "8 класс",
        "difficulty": "medium",
    },
    {
        "title": "Четырёхугольники и теорема Пифагора (8 класс)",
        "content": (
            "Сумма углов любого четырёхугольника = 360°.\n\n"
            "Параллелограмм: противоположные стороны и углы равны.\n"
            "  S = a · h   (основание × высота)\n"
            "Ромб: все стороны равны; диагонали перпендикулярны.\n"
            "Прямоугольник: все углы 90°; диагонали равны.\n"
            "Трапеция: одна пара параллельных сторон (основания).\n"
            "  S = ½(a + b) · h\n\n"
            "Теорема Пифагора: a² + b² = c²\n"
            "Обратная: если a² + b² = c², то угол C = 90°."
        ),
        "diagram": "none",
        "school_section": "Геометрия",
        "task_type": "Фигуры",
        "grade": "8 класс",
        "difficulty": "medium",
    },
    # ──────────────────────────────────────────────
    #  9 КЛАСС
    # ──────────────────────────────────────────────
    {
        "title": "Многочлены и разложение на множители",
        "content": (
            "Многочлен — сумма одночленов.\n\n"
            "Разложение на множители:\n"
            "  Вынесение общего множителя: ab + ac = a(b + c)\n"
            "  Группировка: ax + ay + bx + by = (a+b)(x+y)\n"
            "  Формулы: a² − b² = (a−b)(a+b)\n"
            "           a² + 2ab + b² = (a+b)²\n\n"
            "Деление многочленов:\n"
            "  Делим старший член делимого на старший делителя.\n\n"
            "Корень многочлена P(x): значение x, при котором P(x) = 0."
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Выражения",
        "grade": "9 класс",
        "difficulty": "hard",
    },
    {
        "title": "Неравенства и системы неравенств (9 класс)",
        "content": (
            "Линейное неравенство: ax + b > 0\n\n"
            "Правила преобразования:\n"
            "  Прибавить/вычесть число — знак сохраняется.\n"
            "  Умножить/разделить на отрицательное — знак меняется.\n\n"
            "Квадратное неравенство: ax² + bx + c > 0\n"
            "  Решается через корни квадратного уравнения и знак a.\n\n"
            "Система неравенств: решение — пересечение решений каждого.\n\n"
            "Числовая ось: ○ — не входит, ● — входит в решение."
        ),
        "diagram": "none",
        "school_section": "Алгебра",
        "task_type": "Неравенства",
        "grade": "9 класс",
        "difficulty": "hard",
    },
    {
        "title": "Элементы тригонометрии (9 класс)",
        "content": (
            "Тригонометрические функции острого угла α в прямоугольном треугольнике:\n"
            "  sin α = противоположный катет / гипотенуза\n"
            "  cos α = прилежащий катет / гипотенуза\n"
            "  tg α = противоположный катет / прилежащий катет\n\n"
            "Основное тождество: sin²α + cos²α = 1\n\n"
            "Значения:\n"
            "  sin 30° = 1/2, cos 30° = √3/2\n"
            "  sin 45° = cos 45° = √2/2\n"
            "  sin 60° = √3/2, cos 60° = 1/2\n\n"
            "Теорема синусов: a/sinA = b/sinB = c/sinC = 2R\n"
            "Теорема косинусов: c² = a² + b² − 2ab·cosC"
        ),
        "diagram": "none",
        "school_section": "Геометрия",
        "task_type": "Тригонометрия",
        "grade": "9 класс",
        "difficulty": "hard",
    },
    {
        "title": "Статистика и вероятность (9 класс)",
        "content": (
            "Среднее арифметическое:\n"
            "  x̄ = (x₁ + x₂ + ... + xₙ) / n\n\n"
            "Медиана: значение в середине упорядоченного ряда.\n"
            "Мода: наиболее часто встречающееся значение.\n\n"
            "Вероятность события A:\n"
            "  P(A) = m / n, где m — благоприятных исходов, n — всего исходов.\n"
            "  0 ≤ P(A) ≤ 1\n\n"
            "Сложение вероятностей (несовместные события):\n"
            "  P(A или B) = P(A) + P(B)\n"
            "Умножение (независимые события):\n"
            "  P(A и B) = P(A) · P(B)"
        ),
        "diagram": "none",
        "school_section": "Статистика",
        "task_type": "Вероятность",
        "grade": "9 класс",
        "difficulty": "hard",
    },
    {
        "title": "Пространственные фигуры — объёмы и площади (9 класс)",
        "content": (
            "Призма: V = S_осн · h\n"
            "Куб: V = a³,  S_полн = 6a²\n"
            "Прямоугольный параллелепипед: V = a·b·c\n\n"
            "Пирамида: V = (1/3) · S_осн · h\n"
            "Конус: V = (1/3)πr²h,  S_бок = πrl  (l — образующая)\n"
            "Цилиндр: V = πr²h,  S_бок = 2πrh\n"
            "Шар: V = (4/3)πR³,  S = 4πR²\n\n"
            "Образующая конуса: l = √(r² + h²)\n"
            "Диагональ куба: d = a√3"
        ),
        "diagram": "none",
        "school_section": "Геометрия",
        "task_type": "Тела",
        "grade": "9 класс",
        "difficulty": "hard",
    },
]


# ══════════════════════════════════════════════════════════════
#  ЗАПУСК
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print("=== Добавление задач для Mashq ===")
    total_added = 0
    for topic_id, probs in PROBLEMS.items():
        n = add_problems_if_missing(topic_id, probs)
        current = len(db.get_problems(topic_id))
        print(f"  {topic_id:25} добавлено: {n:2d}  итого: {current}")
        total_added += n
    print(f"Всего задач добавлено: {total_added}")

    print()
    print("=== Добавление тем в базу знаний ===")
    kb_added = 0
    for topic in KB_TOPICS:
        if not topic_exists_by_title(topic["title"]):
            db.add_topic(topic)
            print(f'  + {topic["title"][:60]}')
            kb_added += 1
        else:
            print(f'  ~ уже есть: {topic["title"][:60]}')
    print(f"Тем добавлено: {kb_added}")
    print()
    print("Готово!")
