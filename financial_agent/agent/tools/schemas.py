"""JSON-схемы инструментов для передачи в OpenRouter / OpenAI API."""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "list_workspace_directory",
            "description": (
                "Показывает структуру папок и файлов внутри текущей рабочей директории агента. "
                "Используй этот инструмент перед сохранением результатов, чтобы выбрать оптимальную "
                "существующую папку или создать логичную новую подпапку."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "subpath": {
                        "type": "string",
                        "description": "Относительный путь подпапки внутри рабочей директории (по умолчанию '.').",
                    },
                    "max_depth": {
                        "type": "integer",
                        "description": "Глубина просмотра дерева каталогов от 1 до 3 (по умолчанию 2).",
                    },
                },
                "required": [],
            },
        },
    },
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
                        "description": "Полный или относительный путь к файлу отчета.",
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
            "description": (
                "Сохраняет результаты финансового анализа и оценку компании в два CSV-файла "
                "в выбранную моделью папку внутри текущей рабочей директории."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "output_dir": {
                        "type": "string",
                        "description": (
                            "Относительный путь к папке внутри текущей рабочей директории, "
                            "куда сохранить CSV-файлы (например, '.', 'reports/Сбер/2024' или 'analysis/Q3_2024'). "
                            "Выбирается моделью на основе структуры текущей папки и контекста отчета."
                        ),
                    },
                    "company_name": {
                        "type": "string",
                        "description": "Название компании.",
                    },
                    "period": {
                        "type": "string",
                        "description": "Отчетный период (например, '2024 год' или 'Q3 2024').",
                    },
                    "financial_metrics": {
                        "type": "array",
                        "description": "Список ключевых финансовых показателей.",
                        "items": {
                            "type": "object",
                            "properties": {
                                "metric": {
                                    "type": "string",
                                    "description": "Название показателя.",
                                },
                                "value": {
                                    "type": "string",
                                    "description": "Значение (число).",
                                },
                                "unit": {
                                    "type": "string",
                                    "description": "Единица измерения (млн руб, млрд $ и т.д.).",
                                },
                                "change_yoy": {
                                    "type": "string",
                                    "description": "Изменение год к году в % (или N/A).",
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
                        "description": "Оценка и выводы по отчету.",
                        "properties": {
                            "overall_score": {
                                "type": "string",
                                "description": "Оценка от 1 до 10.",
                            },
                            "sentiment": {
                                "type": "string",
                                "description": "Позитивный / Нейтральный / Негативный.",
                            },
                            "strengths": {
                                "type": "string",
                                "description": "Сильные стороны через точку с запятой.",
                            },
                            "risks": {
                                "type": "string",
                                "description": "Риски и слабые стороны через точку с запятой.",
                            },
                            "conclusion": {
                                "type": "string",
                                "description": "Итоговый вывод (2-3 предложения).",
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
                    "output_dir",
                    "company_name",
                    "period",
                    "financial_metrics",
                    "evaluation",
                ],
            },
        },
    },
]
