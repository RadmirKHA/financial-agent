"""Основной цикл интерактивного общения с финансовым агентом."""

import json
from typing import Any

from agent.config import (
    EXTRA_HEADERS,
    MODEL_NAME,
    create_client,
    get_workspace_root,
    has_valid_api_key,
)
from agent.prompts import SYSTEM_PROMPT
from agent.tools import TOOLS, execute_tool
from agent.ui import Spinner

EXIT_COMMANDS = {"выход", "exit", "quit"}


def _parse_tool_arguments(raw_args: str | None) -> dict[str, Any]:
    """Безопасно разбирает JSON-аргументы, переданные моделью."""
    if not raw_args:
        return {}
    try:
        parsed = json.loads(raw_args)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def run_chat_agent() -> None:
    """Запускает консольный чат с агентом и аккуратно обрабатывает Ctrl+C / EOF."""
    if not has_valid_api_key():
        print(
            "Ошибка: Укажите ваш реальный OPENROUTER_API_KEY в файле .env "
            "или переменных окружения."
        )
        return

    client = create_client()
    workspace_root = get_workspace_root()
    messages: list[Any] = [
        {
            "role": "system",
            "content": (
                f"{SYSTEM_PROMPT}\n"
                f"Текущая рабочая директория: {workspace_root}"
            ),
        }
    ]

    print(f"\nФинансовый ИИ-Агент запущен (Модель: {MODEL_NAME})")
    print(f"Рабочая папка: {workspace_root}")
    print(
        "Укажите путь к файлу отчета или задайте вопрос. "
        "Для выхода введите 'выход' или нажмите Ctrl+C.\n"
    )

    while True:
        try:
            user_input = input("Вы: ")
        except (KeyboardInterrupt, EOFError):
            print("\nРабота завершена.")
            return
        except UnicodeDecodeError:
            print("Ошибка кодировки ввода. Попробуйте еще раз.")
            continue

        cleaned_input = user_input.strip()
        if cleaned_input.lower() in EXIT_COMMANDS:
            print("Работа завершена.")
            return

        if not cleaned_input:
            continue

        messages.append({"role": "user", "content": cleaned_input})

        while True:
            try:
                with Spinner("Агент анализирует и формирует ответ"):
                    response = client.chat.completions.create(
                        model=MODEL_NAME,
                        messages=messages,
                        tools=TOOLS,
                        tool_choice="auto",
                        temperature=0.2,
                        extra_headers=EXTRA_HEADERS,
                    )
            except KeyboardInterrupt:
                print("\nРабота завершена.")
                return
            except Exception as exc:
                print(f"[Ошибка API]: {exc}\n")
                break

            response_message = response.choices[0].message
            messages.append(response_message)

            if response_message.tool_calls:
                try:
                    for tool_call in response_message.tool_calls:
                        func_name = tool_call.function.name
                        func_args = _parse_tool_arguments(
                            tool_call.function.arguments
                        )
                        result = execute_tool(func_name, func_args)
                        messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": tool_call.id,
                                "name": func_name,
                                "content": result,
                            }
                        )
                except KeyboardInterrupt:
                    print("\nРабота завершена.")
                    return
                continue

            print(f"\nАгент:\n{response_message.content or ''}\n")
            break
