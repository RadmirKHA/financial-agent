import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CommandBlockProps {
  step: string;
  title: string;
  description: string;
  command: string;
}

function CommandBlock({ step, title, description, command }: CommandBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium">{step}</div>
          <h3 className="mt-0.5 text-base font-semibold text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{description}</p>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Скопировано
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              Копировать
            </>
          )}
        </button>
      </div>

      <pre className="bg-slate-950 text-slate-100 rounded-md px-4 py-3 text-xs font-mono overflow-x-auto leading-6">
        <code>{command}</code>
      </pre>
    </div>
  );
}

export function SetupView() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Запуск и работа с агентом
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Скачайте архив через кнопку «Скачать .zip» в правом верхнем углу, распакуйте его и выполните шаги ниже. Агент автоматически определяет папку, из которой он запущен.
        </p>
      </section>

      <section className="space-y-4">
        <CommandBlock
          step="Шаг 1"
          title="Создайте окружение и установите зависимости"
          description="Пакет python-dotenv опционален, но рекомендуется для удобной загрузки ключа из файла .env."
          command={`cd financial_agent
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt`}
        />

        <CommandBlock
          step="Шаг 2"
          title="Укажите ключ OpenRouter"
          description="Скопируйте шаблон .env.example в .env и впишите свой OPENROUTER_API_KEY."
          command={`cp .env.example .env
# Откройте .env и вставьте ваш ключ:
# OPENROUTER_API_KEY="sk-or-v1-..."`}
        />

        <CommandBlock
          step="Шаг 3"
          title="Запустите агента в нужной рабочей папке"
          description="Агент покажет текущую рабочую директорию и будет сохранять CSV-файлы только внутри нее. Нажатие Ctrl+C в любой момент завершит работу чисто без ошибки."
          command={`python main.py`}
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900">
          Как модель выбирает папку для вывода файлов
        </h2>
        <ol className="space-y-3 text-sm text-slate-600 list-decimal list-inside">
          <li>
            При запуске <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">agent/runner.py</code> передает текущую рабочую папку в системный контекст.
          </li>
          <li>
            Когда нужно сохранить анализ, модель вызывает <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">list_workspace_directory</code>, чтобы увидеть уже существующие каталоги (например, <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">reports/</code> или папку конкретной компании).
          </li>
          <li>
            На основе структуры папки, названия компании и периода модель передает относительный путь в параметр <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">output_dir</code> инструмента <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">save_analysis_to_csv</code>.
          </li>
          <li>
            Функция <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">resolve_safe_dir</code> проверяет, что путь не выходит за пределы текущей директории, создает недостающие подпапки и сохраняет оба CSV-файла.
          </li>
        </ol>
      </section>
    </div>
  );
}
