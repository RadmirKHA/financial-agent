"""Точка входа для запуска финансового ИИ-агента."""

import io
import sys

from agent.runner import run_chat_agent


def configure_console_encoding() -> None:
    """Принудительно включает UTF-8 для корректного вывода кириллицы в консоли."""
    for stream_name in ("stdout", "stderr"):
        stream = getattr(sys, stream_name, None)
        if stream is None:
            continue

        if hasattr(stream, "reconfigure"):
            try:
                stream.reconfigure(encoding="utf-8")
                continue
            except Exception:
                pass

        if hasattr(stream, "buffer"):
            setattr(
                sys,
                stream_name,
                io.TextIOWrapper(stream.buffer, encoding="utf-8"),
            )


def main() -> int:
    configure_console_encoding()
    try:
        run_chat_agent()
        return 0
    except (KeyboardInterrupt, EOFError):
        print("\nРабота завершена.")
        return 0


if __name__ == "__main__":
    sys.exit(main())
