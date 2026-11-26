import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { PROJECT_FILES, countLines } from '../data/agentFiles';

interface ChangesViewProps {
  onSelectFile: (path: string) => void;
}

const SAMPLE_PATHS = [
  'reports/Сбер/2024',
  'анализ/Q3 2024',
  '.',
  'ПАО «Газпром»/отчетность',
  '../outside_folder',
  '/etc/passwd',
];

const WORKSPACE_ROOT = '/home/user/finances';

function simulateResolveSafeDir(input: string): {
  ok: boolean;
  resolved: string;
  relative: string;
  message: string;
} {
  const raw = input.trim().replace(/^["']|["']$/g, '');

  if (!raw || raw === '.' || raw === './' || raw === '.\\') {
    return {
      ok: true,
      resolved: WORKSPACE_ROOT,
      relative: '.',
      message: 'Файлы сохранятся прямо в корень текущей рабочей папки.',
    };
  }

  const normalizedSlashes = raw.replace(/\\/g, '/');

  if (normalizedSlashes.startsWith('/') || /^[A-Za-z]:\//.test(normalizedSlashes)) {
    if (normalizedSlashes.startsWith(`${WORKSPACE_ROOT}/`) || normalizedSlashes === WORKSPACE_ROOT) {
      const rel = normalizedSlashes.slice(WORKSPACE_ROOT.length).replace(/^\/+/, '') || '.';
      return {
        ok: true,
        resolved: normalizedSlashes,
        relative: rel,
        message: 'Абсолютный путь находится внутри текущей рабочей директории.',
      };
    }
    return {
      ok: false,
      resolved: '',
      relative: '',
      message: `Путь '${raw}' выходит за пределы рабочей папки '${WORKSPACE_ROOT}'.`,
    };
  }

  const rawParts = normalizedSlashes.split('/').filter((p) => p !== '' && p !== '.');
  if (rawParts.some((part) => part === '..')) {
    return {
      ok: false,
      resolved: '',
      relative: '',
      message: "Нельзя сохранять файлы за пределами текущей рабочей папки ('..').",
    };
  }

  const sanitizedParts = rawParts
    .map((part) =>
      part
        .replace(/[<>:"/\\|?*«»]+/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
    )
    .filter(Boolean);

  if (sanitizedParts.length === 0) {
    return {
      ok: true,
      resolved: WORKSPACE_ROOT,
      relative: '.',
      message: 'После очистки имени путь свелся к корню текущей папки.',
    };
  }

  const relative = sanitizedParts.join('/');
  return {
    ok: true,
    resolved: `${WORKSPACE_ROOT}/${relative}`,
    relative,
    message: 'Подпапка будет создана автоматически внутри рабочей директории.',
  };
}

export function ChangesView({ onSelectFile }: ChangesViewProps) {
  const [testPath, setTestPath] = useState('reports/Сбер/2024');
  const simulation = useMemo(() => simulateResolveSafeDir(testPath), [testPath]);

  const pythonFiles = PROJECT_FILES.filter((f) => f.language === 'python');
  const totalPythonLines = pythonFiles.reduce((acc, f) => acc + countLines(f.content), 0);

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Что изменилось после рефакторинга
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed">
          Исходный однофайловый скрипт на 371 строку разбит на модульный пакет Python с разделением ответственности, безопасным завершением по Ctrl+C и динамическим выбором директории вывода.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="text-xs text-slate-500">Модульность</div>
            <div className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
              1 файл → {pythonFiles.length} модулей
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Конфигурация, промпты, спиннер, цикл диалога и каждый инструмент вынесены в отдельные файлы ({totalPythonLines} строк кода всего).
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="text-xs text-slate-500">Завершение по Ctrl+C</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              Без traceback и ошибок
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Перехват <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">KeyboardInterrupt</code> и <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">EOFError</code> на вводе, API-вызовах и чтении PDF + мгновенная очистка строки спиннера.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5">
            <div className="text-xs text-slate-500">Выбор папки вывода</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">
              Автовыбор внутри папки
            </div>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Модель осматривает текущую директорию через <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">list_workspace_directory</code> и сама передает <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">output_dir</code> в экспорт CSV.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Проверка защиты путей вывода (resolve_safe_dir)
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Протестируйте, как <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">agent/tools/workspace.py</code> обрабатывает параметр <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">output_dir</code>, который выбирает модель. Выход за пределы текущей папки блокируется.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1">
              <span className="block text-xs font-medium text-slate-600 mb-1.5">
                Значение output_dir от модели
              </span>
              <input
                type="text"
                value={testPath}
                onChange={(e) => setTestPath(e.target.value)}
                placeholder="Например: reports/Сбер/2024"
                className="w-full px-3 py-2 text-sm font-mono text-slate-900 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 mr-1">Примеры:</span>
            {SAMPLE_PATHS.map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setTestPath(sample)}
                className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors cursor-pointer whitespace-nowrap ${
                  testPath === sample
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sample}
              </button>
            ))}
          </div>

          <div
            className={`p-4 rounded-md border text-sm ${
              simulation.ok
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-rose-50/70 border-rose-200 text-rose-950'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {simulation.ok ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-700 mt-0.5 shrink-0" />
              )}
              <div className="space-y-1 min-w-0">
                <div className="font-medium">
                  {simulation.ok ? 'Путь разрешен' : 'Путь заблокирован (ValueError)'}
                </div>
                <p className="text-xs opacity-90">{simulation.message}</p>
                {simulation.ok && (
                  <div className="pt-1 font-mono text-xs text-emerald-900 break-all">
                    Итоговая папка: {simulation.resolved}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Карта разбиения по файлам
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Нажмите на любой файл, чтобы сразу открыть его исходный код.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
                  <th className="py-3 px-4 font-medium">Файл</th>
                  <th className="py-3 px-4 font-medium">Назначение и изменения</th>
                  <th className="py-3 px-4 font-medium text-right">Строк</th>
                  <th className="py-3 px-4 font-medium text-right">Переход</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {PROJECT_FILES.map((file) => (
                  <tr
                    key={file.path}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs font-medium text-slate-900 whitespace-nowrap">
                      {file.path}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {file.changeNote}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs text-slate-500 tabular-nums whitespace-nowrap">
                      {countLines(file.content)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectFile(file.path)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900 cursor-pointer"
                      >
                        Открыть
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
