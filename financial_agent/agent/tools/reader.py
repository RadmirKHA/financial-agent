"""Инструмент чтения финансовых отчетов (PDF и TXT)."""

from pathlib import Path
import sys
from pypdf import PdfReader

from agent.config import get_workspace_root


def _locate_report_path(raw_path: str) -> Path:
    """Разрешает путь к файлу отчета (относительно рабочей папки или абсолютный)."""
    cleaned = raw_path.strip().strip("\"'")
    path = Path(cleaned)
    if path.is_absolute():
        return path
    return (get_workspace_root() / path).resolve()


def read_report_file(file_path: str) -> str:
    """Читает текст из PDF или текстового файла по указанному пути."""
    target = _locate_report_path(file_path)

    if not target.exists() or not target.is_file():
        return (
            f"ОШИБКА: Файл по пути '{file_path}' не найден. "
            "Проверьте правильность пути или вызовите list_workspace_directory."
        )

    try:
        print(f"-> Чтение файла: {target}...")
        if target.suffix.lower() == ".pdf":
            reader = PdfReader(str(target))
            total_pages = len(reader.pages)
            chunks: list[str] = []
            for index, page in enumerate(reader.pages, start=1):
                sys.stdout.write(
                    f"\r-> Обработка страниц PDF: {index}/{total_pages}"
                )
                sys.stdout.flush()
                chunks.append(page.extract_text() or "")
            print("\n-> Файл успешно прочитан.")
            return "\n".join(chunks)

        content = target.read_text(encoding="utf-8", errors="ignore")
        print("-> Файл успешно прочитан.")
        return content
    except KeyboardInterrupt:
        print()
        raise
    except Exception as exc:
        return f"ОШИБКА при чтении файла: {exc}"
