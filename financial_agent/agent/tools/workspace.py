"""Утилиты работы с текущей директорией: обзор дерева и безопасное разрешение путей."""

from pathlib import Path
import re

from agent.config import get_workspace_root

IGNORED_ENTRIES = {
    ".git",
    ".venv",
    "venv",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
    "node_modules",
    ".idea",
    ".vscode",
}

INVALID_CHARS_PATTERN = re.compile(r'[<>:"/\\|?*«»]+')


def sanitize_name(value: str, fallback: str = "unnamed") -> str:
    """Очищает строку для безопасного использования в имени файла или папки."""
    cleaned = INVALID_CHARS_PATTERN.sub("", value.strip())
    cleaned = re.sub(r"\s+", "_", cleaned).strip("._")
    return cleaned or fallback


def resolve_safe_dir(relative_or_local_path: str) -> Path:
    """Разрешает путь вывода строго внутри текущей рабочей директории.

    Защищает от выхода за пределы рабочей папки (path traversal вроде '../').
    """
    workspace_root = get_workspace_root()
    raw = relative_or_local_path.strip().strip("\"'")

    if not raw or raw in {".", "./", ".\\"}:
        return workspace_root

    candidate = Path(raw)
    if candidate.is_absolute():
        resolved = candidate.resolve()
    else:
        parts = [
            sanitize_name(part)
            for part in candidate.parts
            if part not in {"", "."}
        ]
        if any(part == ".." for part in candidate.parts):
            raise ValueError(
                "Нельзя сохранять файлы за пределами текущей рабочей папки ('..')."
            )
        resolved = (workspace_root / Path(*parts)).resolve()

    try:
        resolved.relative_to(workspace_root)
    except ValueError as exc:
        raise ValueError(
            f"Путь '{relative_or_local_path}' выходит за пределы рабочей папки '{workspace_root}'."
        ) from exc

    return resolved


def list_workspace_directory(subpath: str = ".", max_depth: int = 2) -> str:
    """Возвращает дерево файлов и папок внутри текущей рабочей директории."""
    try:
        target_dir = resolve_safe_dir(subpath)
    except ValueError as exc:
        return f"ОШИБКА: {exc}"

    if not target_dir.exists():
        return f"ОШИБКА: Папка '{subpath}' не найдена в текущей директории."
    if not target_dir.is_dir():
        return f"ОШИБКА: '{subpath}' является файлом, а не папкой."

    depth_limit = max(1, min(max_depth, 3))
    workspace_root = get_workspace_root()
    rel_header = target_dir.relative_to(workspace_root)
    header_label = "." if str(rel_header) == "." else str(rel_header)

    lines = [f"Рабочая папка: {workspace_root}", f"Содержимое '{header_label}':"]

    def _walk(current: Path, level: int) -> None:
        if level > depth_limit:
            return
        try:
            entries = sorted(
                current.iterdir(),
                key=lambda item: (not item.is_dir(), item.name.lower()),
            )
        except PermissionError:
            lines.append(f"{'  ' * level}[нет доступа]")
            return

        visible = [e for e in entries if e.name not in IGNORED_ENTRIES]
        if not visible and level == 1:
            lines.append("  (папка пуста)")
            return

        for entry in visible[:40]:
            indent = "  " * level
            if entry.is_dir():
                lines.append(f"{indent}{entry.name}/")
                _walk(entry, level + 1)
            else:
                lines.append(f"{indent}{entry.name}")

        if len(visible) > 40:
            lines.append(f"{'  ' * level}... и еще {len(visible) - 40} элементов")

    _walk(target_dir, 1)
    print(f"-> Осмотрена структура папки: '{header_label}'.")
    return "\n".join(lines)
