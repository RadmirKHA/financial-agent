import io
import itertools
import json
import os
import sys
import threading
import time
from openai import OpenAI
import pandas as pd
from pypdf import PdfReader

# Принудительно включаем UTF-8 для консоли
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

# =====================================================================
# ГЛОБАЛЬНЫЕ НАСТРОЙКИ
# =====================================================================

OPENROUTER_API_KEY = ""  # Вставьте сюда ваш ключ
MODEL_NAME = "nvidia/nemotron-3-ultra-550b-a55b:free"

clean_api_key = (
    OPENROUTER_API_KEY.strip().encode("ascii", "ignore").decode("ascii")
)

client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=clean_api_key,
)

# =====================================================================
# АНИМАЦИЯ ЗАГРУЗКИ (СПИННЕР)
# =====================================================================


class Spinner:
    """Показывает анимированный индикатор работы в консоли, чтобы было видно, что агент не завис."""

    def __init__(self, message="Агент думает"):
        self.message = message
        self.stop_running = False
        self.thread = None

    def _animate(self):
        chars = itertools.cycle(
            ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
        )
        while not self.stop_running:
            sys.stdout.write(f"\r{next(chars)} {self.message}...")
            sys.stdout.flush()
            time.sleep(0.1)
        # Очищаем строку после завершения
        sys.stdout.write("\r" + " " * (len(self.message) + 10) + "\r")
        sys.stdout.flush()

    def __enter__(self):
        self.stop_running = False
        self.thread = threading.Thread(target=self._animate, daemon=True)
        self.thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.stop_running = True
        if self.thread:
            self.thread.join()


# =====================================================================
# БЛОК 1: ФУНКЦИИ-ИНСТРУМЕНТЫ АГЕНТА
# =====================================================================


def read_report_file(file_path):
    """Читает текст из PDF или текстового файла по указанному пути."""
    file_path = file_path.strip("\"'")

    if not os.path.exists(file_path):
        return f"ОШИБКА: Файл по пути '{file_path}' не найден. Проверьте правильность пути."

    try:
        print(f"-> Чтение файла: {file_path}...")
        if file_path.lower().endswith(".pdf"):
            reader = PdfReader(file_path)
            total_pages = len(reader.pages)
            text = ""
            for i, page in enumerate(reader.pages, 1):
                sys.stdout.write(
                    f"\r-> Обработка страниц PDF: {i}/{total_pages}"
                )
                sys.stdout.flush()
                text += (page.extract_text() or "") + "\n"
            print("\n-> Файл успешно прочитан.")
            return text
        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            print("-> Файл успешно прочитан.")
            return content
    except Exception as e:
        return f"ОШИБКА при чтении файла: {str(e)}"


def save_analysis_to_csv(company_name, period, financial_metrics, evaluation):
    """Сохраняет извлеченные метрики и оценку в два CSV файла."""
    try:
        print("-> Сохранение таблиц в CSV...")
        output_folder = "output"
        os.makedirs(output_folder, exist_ok=True)

        clean_company = (
            company_name.replace(" ", "_")
            .replace('"', "")
            .replace("«", "")
            .replace("»", "")
        )
        clean_period = period.replace(" ", "_")
        prefix = f"{clean_company}_{clean_period}"

        # 1. Сохраняем таблицу с финансовыми метриками
        metrics_df = pd.DataFrame(financial_metrics)
        metrics_path = os.path.join(output_folder, f"{prefix}_metrics.csv")
        metrics_df.to_csv(metrics_path, index=False, encoding="utf-8-sig")

        # 2. Сохраняем таблицу с оценкой
        eval_data = evaluation.copy()
        eval_data["company_name"] = company_name
        eval_data["period"] = period

        eval_df = pd.DataFrame([eval_data])
        cols = [
            "company_name",
            "period",
            "overall_score",
            "sentiment",
            "strengths",
            "risks",
            "conclusion",
        ]
        eval_df = eval_df[[c for c in cols if c in eval_df.columns]]

        eval_path = os.path.join(output_folder, f"{prefix}_evaluation.csv")
        eval_df.to_csv(eval_path, index=False, encoding="utf-8-sig")

        print(f"-> Готово! Файлы сохранены в папку '{output_folder}'.")
        return f"УСПЕХ! Данные успешно сохранены в файлы:\n1) {metrics_path}\n2) {eval_path}"
    except Exception as e:
        return f"ОШИБКА при сохранении CSV: {str(e)}"


# =====================================================================
# БЛОК 2: ОПИСАНИЕ ИНСТРУМЕНТОВ (JSON SCHEMA)
# =====================================================================

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "read_report_file",
            "description": "Читает финансовый отчет из локального файла (PDF или TXT) по указанному пути.",
            "parameters": {
                "type": "object",
                "properties": {
                    "file_path": {
                        "type": "string",
                        "description": "Полный или относительный путь к файлу отчета",
                    }
                },
                "required": ["file_path"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "save_analysis_to_csv",
            "description": "Сохраняет результаты финансового анализа и оценку компании в CSV файлы.",
            "parameters": {
                "type": "object",
                "properties": {
                    "company_name": {
                        "type": "string",
                        "description": "Название компании",
                    },
                    "period": {
                        "type": "string",
                        "description": "Отчетный период (например, '2024 год' или 'Q3 2024')",
                    },
                    "financial_metrics": {
                        "type": "array",
                        "description": "Список ключевых финансовых показателей",
                        "items": {
                            "type": "object",
                            "properties": {
                                "metric": {
                                    "type": "string",
                                    "description": "Название показателя",
                                },
                                "value": {
                                    "type": "string",
                                    "description": "Значение (число)",
                                },
                                "unit": {
                                    "type": "string",
                                    "description": "Единица измерения (млн руб, млрд $ и т.д.)",
                                },
                                "change_yoy": {
                                    "type": "string",
                                    "description": "Изменение год к году в % (или N/A)",
                                },
                            },
                            "required": [
                                "metric",
                                "value",
                                "unit",
                                "change_yoy",
                            ],
                        },
                    },
                    "evaluation": {
                        "type": "object",
                        "description": "Оценка и выводы по отчету",
                        "properties": {
                            "overall_score": {
                                "type": "string",
                                "description": "Оценка от 1 до 10",
                            },
                            "sentiment": {
                                "type": "string",
                                "description": "Позитивный / Нейтральный / Негативный",
                            },
                            "strengths": {
                                "type": "string",
                                "description": "Сильные стороны через точку с запятой",
                            },
                            "risks": {
                                "type": "string",
                                "description": "Риски и слабые стороны через точку с запятой",
                            },
                            "conclusion": {
                                "type": "string",
                                "description": "Итоговый вывод (2-3 предложения)",
                            },
                        },
                        "required": [
                            "overall_score",
                            "sentiment",
                            "strengths",
                            "risks",
                            "conclusion",
                        ],
                    },
                },
                "required": [
                    "company_name",
                    "period",
                    "financial_metrics",
                    "evaluation",
                ],
            },
        },
    },
]

SYSTEM_PROMPT = """
Ты — интерактивный ИИ-финансовый аналитик. Ты общаешься с пользователем в чате.
У тебя есть доступ к двум инструментам:
1. `read_report_file` — используй его, когда пользователь указывает путь к файлу, который нужно прочитать.
2. `save_analysis_to_csv` — используй его, когда нужно сохранить финансовые метрики и твою оценку в CSV файлы.

Если пользователь просит проанализировать файл и сразу сохранить в CSV — сначала вызови чтение файла, изучи текст, а затем вызови сохранение в CSV и напиши пользователю краткую сводку в чат.
Ты также можешь отвечать на любые уточняющие вопросы пользователя по прочитанному отчету.
"""

# =====================================================================
# БЛОК 3: ЦИКЛ ОБЩЕНИЯ С АГЕНТОМ (ЧАТ)
# =====================================================================


def run_chat_agent():
    if not clean_api_key or clean_api_key == "sk-or-v1-...":
        print(
            "Ошибка: Укажите ваш реальный OPENROUTER_API_KEY в начале скрипта."
        )
        return

    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    print(f"\nФинансовый ИИ-Агент запущен (Модель: {MODEL_NAME})")
    print(
        "Укажите путь к файлу отчета или задайте вопрос. Для выхода введите 'выход'.\n"
    )

    while True:
        try:
            user_input = input("Вы: ")
        except UnicodeDecodeError:
            print("Ошибка кодировки ввода. Попробуйте еще раз.")
            continue

        if user_input.lower().strip() in ["выход", "exit", "quit"]:
            print("Работа завершена.")
            break

        if not user_input.strip():
            continue

        messages.append({"role": "user", "content": user_input})

        while True:
            try:
                # Запускаем спиннер во время ожидания ответа от сети
                with Spinner("Агент анализирует и формирует ответ"):
                    response = client.chat.completions.create(
                        model=MODEL_NAME,
                        messages=messages,
                        tools=TOOLS,
                        tool_choice="auto",
                        temperature=0.2,
                        extra_headers={
                            "HTTP-Referer": "https://financial-agent.local",
                            "X-Title": "Interactive Financial Agent",
                        },
                    )
            except Exception as e:
                print(f"[Ошибка API]: {e}\n")
                break

            response_message = response.choices[0].message
            messages.append(response_message)

            # Если агент решил вызвать функцию (чтение файла или запись CSV)
            if response_message.tool_calls:
                for tool_call in response_message.tool_calls:
                    func_name = tool_call.function.name
                    func_args = json.loads(tool_call.function.arguments)

                    if func_name == "read_report_file":
                        result = read_report_file(
                            func_args.get("file_path", "")
                        )
                    elif func_name == "save_analysis_to_csv":
                        result = save_analysis_to_csv(
                            company_name=func_args.get(
                                "company_name", "Unknown"
                            ),
                            period=func_args.get("period", "Unknown"),
                            financial_metrics=func_args.get(
                                "financial_metrics", []
                            ),
                            evaluation=func_args.get("evaluation", {}),
                        )
                    else:
                        result = "Неизвестная функция"

                    messages.append(
                        {
                            "role": "tool",
                            "tool_call_id": tool_call.id,
                            "name": func_name,
                            "content": result,
                        }
                    )
                continue
            else:
                print(f"\nАгент:\n{response_message.content}\n")
                break


if __name__ == "__main__":
    run_chat_agent()