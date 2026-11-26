"""Элементы консольного интерфейса (анимация загрузки)."""

import itertools
import sys
import threading


class Spinner:
    """Анимированный индикатор ожидания с мгновенной очисткой строки при выходе или Ctrl+C."""

    FRAMES = ("⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏")

    def __init__(self, message: str = "Агент думает") -> None:
        self.message = message
        self._stop_event = threading.Event()
        self._thread: threading.Thread | None = None

    def _clear_line(self) -> None:
        blank = " " * (len(self.message) + 12)
        sys.stdout.write(f"\r{blank}\r")
        sys.stdout.flush()

    def _animate(self) -> None:
        chars = itertools.cycle(self.FRAMES)
        while not self._stop_event.is_set():
            sys.stdout.write(f"\r{next(chars)} {self.message}...")
            sys.stdout.flush()
            self._stop_event.wait(0.1)
        self._clear_line()

    def __enter__(self) -> "Spinner":
        self._stop_event.clear()
        self._thread = threading.Thread(target=self._animate, daemon=True)
        self._thread.start()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> bool:
        self._stop_event.set()
        if self._thread is not None:
            self._thread.join(timeout=0.3)
        self._clear_line()
        # Не подавляем исключения (включая KeyboardInterrupt), чтобы верхний цикл корректно вышел
        return False
