import mainPy from '@/financial_agent/main.py?raw';
import requirementsTxt from '@/financial_agent/requirements.txt?raw';
import envExample from '@/financial_agent/.env.example?raw';
import readmeMd from '@/financial_agent/README.md?raw';
import agentInitPy from '@/financial_agent/agent/__init__.py?raw';
import configPy from '@/financial_agent/agent/config.py?raw';
import promptsPy from '@/financial_agent/agent/prompts.py?raw';
import uiPy from '@/financial_agent/agent/ui.py?raw';
import runnerPy from '@/financial_agent/agent/runner.py?raw';
import toolsInitPy from '@/financial_agent/agent/tools/__init__.py?raw';
import schemasPy from '@/financial_agent/agent/tools/schemas.py?raw';
import workspacePy from '@/financial_agent/agent/tools/workspace.py?raw';
import readerPy from '@/financial_agent/agent/tools/reader.py?raw';
import exporterPy from '@/financial_agent/agent/tools/exporter.py?raw';

export type FileLanguage = 'python' | 'markdown' | 'env' | 'text';

export interface ProjectFile {
  path: string;
  name: string;
  folder: string;
  language: FileLanguage;
  summary: string;
  changeNote: string;
  content: string;
}

export const PROJECT_FILES: ProjectFile[] = [
  {
    path: 'main.py',
    name: 'main.py',
    folder: '',
    language: 'python',
    summary: 'Точка входа: настройка UTF-8 в консоли и глобальный перехват Ctrl+C / EOF.',
    changeNote: 'Вынесена точка входа с безопасным выходом (код 0) без traceback при Ctrl+C.',
    content: mainPy,
  },
  {
    path: 'agent/config.py',
    name: 'config.py',
    folder: 'agent',
    language: 'python',
    summary: 'Загрузка API-ключа и модели из .env, создание клиента OpenRouter и определение рабочей папки.',
    changeNote: 'Отделена конфигурация, добавлена функция get_workspace_root() и поддержка .env.',
    content: configPy,
  },
  {
    path: 'agent/prompts.py',
    name: 'prompts.py',
    folder: 'agent',
    language: 'python',
    summary: 'Системный промпт с правилами осмотра текущей директории и выбора папки для CSV.',
    changeNote: 'Добавлены инструкции по вызову list_workspace_directory и выбору output_dir.',
    content: promptsPy,
  },
  {
    path: 'agent/ui.py',
    name: 'ui.py',
    folder: 'agent',
    language: 'python',
    summary: 'Анимированный спиннер с мгновенной остановкой через threading.Event и очисткой строки.',
    changeNote: 'Заменен time.sleep на Event.wait — при Ctrl+C спиннер мгновенно стирает строку.',
    content: uiPy,
  },
  {
    path: 'agent/runner.py',
    name: 'runner.py',
    folder: 'agent',
    language: 'python',
    summary: 'Главный цикл диалога, обработка команд выхода, Ctrl+C и вызов инструментов.',
    changeNote: 'Перехват KeyboardInterrupt и EOFError на вводе, запросе к API и выполнении инструментов.',
    content: runnerPy,
  },
  {
    path: 'agent/__init__.py',
    name: '__init__.py',
    folder: 'agent',
    language: 'python',
    summary: 'Инициализация пакета agent и экспорт run_chat_agent.',
    changeNote: 'Оформлен полноценный Python-пакет.',
    content: agentInitPy,
  },
  {
    path: 'agent/tools/workspace.py',
    name: 'workspace.py',
    folder: 'agent/tools',
    language: 'python',
    summary: 'Обзор дерева текущей папки (list_workspace_directory) и защита путей от выхода наружу.',
    changeNote: 'Новый модуль: позволяет модели видеть структуру папки и безопасно валидирует output_dir.',
    content: workspacePy,
  },
  {
    path: 'agent/tools/exporter.py',
    name: 'exporter.py',
    folder: 'agent/tools',
    language: 'python',
    summary: 'Сохранение метрик и оценки в два CSV-файла в выбранную моделью подпапку.',
    changeNote: 'Убрана жесткая папка "output" — теперь путь задается моделью через output_dir.',
    content: exporterPy,
  },
  {
    path: 'agent/tools/reader.py',
    name: 'reader.py',
    folder: 'agent/tools',
    language: 'python',
    summary: 'Чтение финансовых отчетов из PDF и TXT с чистым прерыванием по Ctrl+C.',
    changeNote: 'Вынесен в отдельный модуль, добавлено корректное разрешение относительных путей.',
    content: readerPy,
  },
  {
    path: 'agent/tools/schemas.py',
    name: 'schemas.py',
    folder: 'agent/tools',
    language: 'python',
    summary: 'JSON-схемы трех инструментов для function calling в OpenRouter / OpenAI API.',
    changeNote: 'Добавлена схема list_workspace_directory и обязательный параметр output_dir в save_analysis_to_csv.',
    content: schemasPy,
  },
  {
    path: 'agent/tools/__init__.py',
    name: '__init__.py',
    folder: 'agent/tools',
    language: 'python',
    summary: 'Единый диспетчер execute_tool() для маршрутизации вызовов модели.',
    changeNote: 'Диспетчеризация инструментов отделена от цикла чата.',
    content: toolsInitPy,
  },
  {
    path: 'requirements.txt',
    name: 'requirements.txt',
    folder: '',
    language: 'text',
    summary: 'Список зависимостей проекта для быстрой установки через pip.',
    changeNote: 'Зафиксированы минимальные версии openai, pandas, pypdf и python-dotenv.',
    content: requirementsTxt,
  },
  {
    path: '.env.example',
    name: '.env.example',
    folder: '',
    language: 'env',
    summary: 'Шаблон переменных окружения для OPENROUTER_API_KEY и MODEL_NAME.',
    changeNote: 'Ключ API вынесен из исходного кода в .env.',
    content: envExample,
  },
  {
    path: 'README.md',
    name: 'README.md',
    folder: '',
    language: 'markdown',
    summary: 'Документация структуры проекта и инструкция по запуску.',
    changeNote: 'Добавлено краткое описание архитектуры и команд запуска.',
    content: readmeMd,
  },
];

export function countLines(text: string): number {
  if (!text) return 0;
  return text.replace(/\n$/, '').split('\n').length;
}

export function formatBytes(text: string): string {
  const bytes = new TextEncoder().encode(text).length;
  if (bytes < 1024) return `${bytes} Б`;
  return `${(bytes / 1024).toFixed(1)} КБ`;
}
