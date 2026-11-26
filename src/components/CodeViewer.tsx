import React, { useMemo, useState } from 'react';
import { Check, Copy, Download } from 'lucide-react';
import {
  FileLanguage,
  ProjectFile,
  countLines,
  formatBytes,
} from '../data/agentFiles';

interface CodeViewerProps {
  file: ProjectFile;
}

const PYTHON_KEYWORDS = new Set([
    'from',
    'import',
    'def',
    'class',
    'return',
    'if',
    'elif',
    'else',
    'for',
    'while',
    'in',
    'not',
    'and',
    'or',
    'try',
    'except',
    'finally',
    'with',
    'as',
    'raise',
    'pass',
    'continue',
    'break',
    'None',
    'True',
    'False',
    'lambda',
    'yield',
]);

const PYTHON_BUILTINS = new Set([
    'print',
    'str',
    'int',
    'dict',
    'list',
    'bool',
    'len',
    'max',
    'min',
    'sorted',
    'enumerate',
    'getattr',
    'setattr',
    'hasattr',
    'isinstance',
    'any',
    'Exception',
    'ValueError',
    'KeyboardInterrupt',
    'EOFError',
    'UnicodeDecodeError',
    'PermissionError',
    'ImportError',
]);

function renderPythonLine(line: string): React.ReactNode {
  if (!line) return '\u00A0';

  const trimmed = line.trimStart();
  if (trimmed.startsWith('#')) {
    return <span className="text-slate-400 italic">{line}</span>;
  }

  const tokens: React.ReactNode[] = [];
  const regex =
    /(#.*$|[furbFURB]?(?:"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\b[A-Za-z_][A-Za-z0-9_]*\b|\b\d+(?:\.\d+)?\b)/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(line)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('#')) {
      tokens.push(
        <span key={key++} className="text-slate-400 italic">
          {token}
        </span>
      );
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      /^[furbFURB]["']/.test(token)
    ) {
      tokens.push(
        <span key={key++} className="text-emerald-300">
          {token}
        </span>
      );
    } else if (/^\d/.test(token)) {
      tokens.push(
        <span key={key++} className="text-amber-300">
          {token}
        </span>
      );
    } else if (PYTHON_KEYWORDS.has(token)) {
      tokens.push(
        <span key={key++} className="text-sky-300 font-medium">
          {token}
        </span>
      );
    } else if (PYTHON_BUILTINS.has(token)) {
      tokens.push(
        <span key={key++} className="text-indigo-300">
          {token}
        </span>
      );
    } else {
      tokens.push(token);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < line.length) {
    tokens.push(line.slice(lastIndex));
  }

  return tokens;
}

function renderEnvLine(line: string): React.ReactNode {
  if (!line) return '\u00A0';
  if (line.trimStart().startsWith('#')) {
    return <span className="text-slate-400 italic">{line}</span>;
  }
  const eqIndex = line.indexOf('=');
  if (eqIndex === -1) return line;
  return (
    <>
      <span className="text-sky-300 font-medium">{line.slice(0, eqIndex)}</span>
      <span className="text-slate-400">=</span>
      <span className="text-emerald-300">{line.slice(eqIndex + 1)}</span>
    </>
  );
}

function renderMarkdownLine(line: string): React.ReactNode {
  if (!line) return '\u00A0';
  if (line.startsWith('#')) {
    return <span className="text-sky-300 font-semibold">{line}</span>;
  }
  if (line.startsWith('```')) {
    return <span className="text-slate-400">{line}</span>;
  }
  if (line.trimStart().startsWith('- ')) {
    return <span className="text-slate-100">{line}</span>;
  }
  return line;
}

function renderLine(line: string, language: FileLanguage): React.ReactNode {
  switch (language) {
    case 'python':
      return renderPythonLine(line);
    case 'env':
      return renderEnvLine(line);
    case 'markdown':
      return renderMarkdownLine(line);
    default:
      return line || '\u00A0';
  }
}

const LANGUAGE_LABELS: Record<FileLanguage, string> = {
  python: 'Python',
  markdown: 'Markdown',
  env: 'Переменные окружения',
  text: 'Зависимости',
};

export function CodeViewer({ file }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);

  const lines = useMemo(
    () => file.content.replace(/\n$/, '').split('\n'),
    [file.content]
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(file.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([file.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="flex flex-wrap items-start justify-between gap-4 px-6 py-4 border-b border-slate-200 bg-white shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="font-mono text-slate-700 font-medium">
              financial_agent/{file.path}
            </span>
            <span aria-hidden="true">·</span>
            <span>{LANGUAGE_LABELS[file.language]}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{countLines(file.content)} строк</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{formatBytes(file.content)}</span>
          </div>
          <p className="mt-1.5 text-sm text-slate-700 leading-relaxed">
            {file.summary}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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

          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            Скачать файл
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-slate-950 text-slate-100">
        <pre className="py-4 text-[13px] leading-6 font-mono">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, index) => (
                <tr key={index} className="hover:bg-slate-900/70">
                  <td className="w-12 select-none pr-4 pl-4 text-right text-slate-500 tabular-nums align-top">
                    {index + 1}
                  </td>
                  <td className="pr-6 text-slate-100 whitespace-pre">
                    {renderLine(line, file.language)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </pre>
      </div>
    </div>
  );
}
