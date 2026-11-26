"""Реестр и диспетчер инструментов финансового агента."""

from typing import Any

from agent.tools.exporter import save_analysis_to_csv
from agent.tools.reader import read_report_file
from agent.tools.schemas import TOOLS
from agent.tools.workspace import list_workspace_directory


def execute_tool(func_name: str, func_args: dict[str, Any]) -> str:
    """Вызывает запрошенный моделью инструмент и возвращает текстовый результат."""
    if func_name == "list_workspace_directory":
        return list_workspace_directory(
            subpath=str(func_args.get("subpath", ".")),
            max_depth=int(func_args.get("max_depth", 2)),
        )

    if func_name == "read_report_file":
        return read_report_file(str(func_args.get("file_path", "")))

    if func_name == "save_analysis_to_csv":
        return save_analysis_to_csv(
            company_name=str(func_args.get("company_name", "Unknown")),
            period=str(func_args.get("period", "Unknown")),
            financial_metrics=func_args.get("financial_metrics", []),
            evaluation=func_args.get("evaluation", {}),
            output_dir=str(func_args.get("output_dir", ".")),
        )

    return f"ОШИБКА: Неизвестная функция '{func_name}'."


__all__ = ["TOOLS", "execute_tool"]
