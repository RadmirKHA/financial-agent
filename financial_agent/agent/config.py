"""Конфигурация API, модели и рабочей директории агента."""

import os
from pathlib import Path
from openai import OpenAI

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None

# Загружаем переменные окружения из .env (если установлен python-dotenv и файл существует)
if load_dotenv is not None:
    load_dotenv()

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL_NAME = "nvidia/nemotron-3-ultra-550b-a55b:free"

MODEL_NAME = os.getenv("MODEL_NAME", DEFAULT_MODEL_NAME).strip() or DEFAULT_MODEL_NAME

# Рекомендуется задавать ключ через .env (OPENROUTER_API_KEY=...),
# но при необходимости его можно указать и здесь.
OPENROUTER_API_KEY = ""
_raw_api_key = os.getenv("OPENROUTER_API_KEY") or OPENROUTER_API_KEY
API_KEY = _raw_api_key.strip().encode("ascii", "ignore").decode("ascii")

EXTRA_HEADERS = {
    "HTTP-Referer": "https://financial-agent.local",
    "X-Title": "Interactive Financial Agent",
}


def get_workspace_root() -> Path:
    """Возвращает текущую рабочую папку, в которой запущен агент."""
    return Path.cwd().resolve()


def has_valid_api_key() -> bool:
    """Проверяет, указан ли непустой ключ OpenRouter."""
    return bool(API_KEY) and API_KEY not in {
        "sk-or-v1-...",
        "sk-or-v1-your-key-here",
    }


def create_client() -> OpenAI:
    """Создает клиент OpenAI, настроенный на OpenRouter."""
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=API_KEY,
    )
