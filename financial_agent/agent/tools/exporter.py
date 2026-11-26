"""Инструмент экспорта финансовых метрик и оценки в CSV."""

from typing import Any
import pandas as pd

from agent.config import get_workspace_root
from agent.tools.workspace import resolve_safe_dir, sanitize_name

EVALUATION_COLUMNS = [
    "company_name",
    "period",
    "overall_score",
    "sentiment",
    "strengths",
    "risks",
    "conclusion",
]


def save_analysis_to_csv(
    company_name: str,
    period: str,
    financial_metrics: list[dict[str, Any]],
    evaluation: dict[str, Any],
    output_dir: str = ".",
) -> str:
    """Сохраняет метрики и оценку в два CSV-файла в папку, выбранную моделью."""
    try:
        target_dir = resolve_safe_dir(output_dir)
    except ValueError as exc:
        return f"ОШИБКА пути сохранения: {exc}"

    try:
        print(f"-> Сохранение таблиц в CSV (папка: {output_dir})...")
        target_dir.mkdir(parents=True, exist_ok=True)

        clean_company = sanitize_name(company_name, fallback="company")
        clean_period = sanitize_name(period, fallback="period")
        prefix = f"{clean_company}_{clean_period}"

        # 1. Таблица финансовых метрик
        metrics_df = pd.DataFrame(financial_metrics)
        metrics_path = target_dir / f"{prefix}_metrics.csv"
        metrics_df.to_csv(metrics_path, index=False, encoding="utf-8-sig")

        # 2. Таблица итоговой оценки
        eval_data = dict(evaluation)
        eval_data["company_name"] = company_name
        eval_data["period"] = period

        eval_df = pd.DataFrame([eval_data])
        ordered_cols = [c for c in EVALUATION_COLUMNS if c in eval_df.columns]
        eval_df = eval_df[ordered_cols]

        eval_path = target_dir / f"{prefix}_evaluation.csv"
        eval_df.to_csv(eval_path, index=False, encoding="utf-8-sig")

        workspace_root = get_workspace_root()
        rel_dir = target_dir.relative_to(workspace_root)
        display_dir = "." if str(rel_dir) == "." else str(rel_dir)
        rel_metrics = metrics_path.relative_to(workspace_root)
        rel_eval = eval_path.relative_to(workspace_root)

        print(f"-> Готово! Файлы сохранены в '{display_dir}'.")
        return (
            "УСПЕХ! Данные сохранены внутри текущей рабочей папки:\n"
            f"1) {rel_metrics}\n"
            f"2) {rel_eval}"
        )
    except Exception as exc:
        return f"ОШИБКА при сохранении CSV: {exc}"
