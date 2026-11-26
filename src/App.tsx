import { useMemo, useState } from 'react';
import JSZip from 'jszip';
import {
  ChevronDown,
  ChevronRight,
  Download,
  FileCode2,
  FileText,
  Folder,
  FolderOpen,
  Search,
} from 'lucide-react';
import { PROJECT_FILES, ProjectFile, countLines } from './data/agentFiles';
import { CodeViewer } from './components/CodeViewer';
import { ChangesView } from './components/ChangesView';
import { SetupView } from './components/SetupView';

type ActiveTab = 'files' | 'changes' | 'setup';

interface FolderGroup {
  id: string;
  label: string;
  depth: number;
  files: ProjectFile[];
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('files');
  const [selectedPath, setSelectedPath] = useState<string>('main.py');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const selectedFile = useMemo(
    () => PROJECT_FILES.find((f) => f.path === selectedPath) ?? PROJECT_FILES[0],
    [selectedPath]
  );

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return PROJECT_FILES;
    return PROJECT_FILES.filter(
      (f) =>
        f.path.toLowerCase().includes(q) ||
        f.summary.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const folderGroups = useMemo<FolderGroup[]>(() => {
    const rootFiles = filteredFiles.filter((f) => f.folder === '');
    const agentFiles = filteredFiles.filter((f) => f.folder === 'agent');
    const toolsFiles = filteredFiles.filter((f) => f.folder === 'agent/tools');

    const groups: FolderGroup[] = [];
    if (rootFiles.length > 0) {
      groups.push({ id: 'root', label: 'financial_agent/', depth: 0, files: rootFiles });
    }
    if (agentFiles.length > 0) {
      groups.push({ id: 'agent', label: 'agent/', depth: 1, files: agentFiles });
    }
    if (toolsFiles.length > 0) {
      groups.push({ id: 'agent/tools', label: 'agent/tools/', depth: 2, files: toolsFiles });
    }
    return groups;
  }, [filteredFiles]);

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  };

  const handleOpenFile = (path: string) => {
    setSelectedPath(path);
    setActiveTab('files');
  };

  const handleDownloadZip = async () => {
    if (isZipping) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const rootFolder = zip.folder('financial_agent');
      if (rootFolder) {
        for (const file of PROJECT_FILES) {
          rootFolder.file(file.path, file.content);
        }
      }
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'financial_agent.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-slate-50 text-slate-900">
      <header className="h-14 px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-8 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab('files')}
          className="text-base font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
        >
          Financial Agent
        </button>

        <nav className="flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('files')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'files'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Файлы проекта
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('changes')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'changes'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Что изменилось
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('setup')}
            className={`py-1 transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 ${
              activeTab === 'setup'
                ? 'text-slate-900 border-slate-900'
                : 'text-slate-500 border-transparent hover:text-slate-900'
            }`}
          >
            Запуск
          </button>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={isZipping}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            <Download className="w-3.5 h-3.5" />
            {isZipping ? 'Сборка архива...' : 'Скачать .zip'}
          </button>
        </div>
      </header>

      <main className="flex-1 min-h-0 flex">
        {activeTab === 'files' && (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row">
            <aside className="w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col shrink-0 max-h-64 md:max-h-none">
              <div className="p-3 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Поиск файла..."
                    aria-label="Поиск файла"
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div className="mt-2 px-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Структура проекта</span>
                  <span className="tabular-nums">{filteredFiles.length} файлов</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                {folderGroups.length === 0 ? (
                  <div className="px-3 py-6 text-center text-xs text-slate-500">
                    Файлы по запросу не найдены.
                  </div>
                ) : (
                  folderGroups.map((group) => {
                    const isCollapsed = Boolean(collapsedFolders[group.id]);
                    const folderPad =
                      group.depth === 0 ? 'pl-2' : group.depth === 1 ? 'pl-4' : 'pl-6';
                    const filePad =
                      group.depth === 0 ? 'pl-7' : group.depth === 1 ? 'pl-9' : 'pl-11';
                    return (
                      <div key={group.id} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => toggleFolder(group.id)}
                          className={`w-full flex items-center gap-1.5 py-1.5 pr-2 ${folderPad} text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer`}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          )}
                          {isCollapsed ? (
                            <Folder className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          ) : (
                            <FolderOpen className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span className="font-mono truncate">{group.label}</span>
                        </button>

                        {!isCollapsed && (
                          <div className="space-y-0.5">
                            {group.files.map((file) => {
                              const isSelected = file.path === selectedFile.path;
                              const Icon =
                                file.language === 'python' ? FileCode2 : FileText;
                              return (
                                <button
                                  key={file.path}
                                  type="button"
                                  onClick={() => setSelectedPath(file.path)}
                                  className={`w-full flex items-center justify-between gap-2 py-1.5 pr-2.5 ${filePad} text-xs rounded-md transition-colors cursor-pointer ${
                                    isSelected
                                      ? 'bg-slate-900 text-white font-medium'
                                      : 'text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    <Icon
                                      className={`w-3.5 h-3.5 shrink-0 ${
                                        isSelected ? 'text-sky-300' : 'text-slate-400'
                                      }`}
                                    />
                                    <span className="font-mono truncate">{file.name}</span>
                                  </span>
                                  <span
                                    className={`text-[11px] tabular-nums shrink-0 ${
                                      isSelected ? 'text-slate-300' : 'text-slate-400'
                                    }`}
                                  >
                                    {countLines(file.content)}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            <section className="flex-1 min-w-0 min-h-0">
              <CodeViewer file={selectedFile} />
            </section>
          </div>
        )}

        {activeTab === 'changes' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
            <ChangesView onSelectFile={handleOpenFile} />
          </div>
        )}

        {activeTab === 'setup' && (
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
            <SetupView />
          </div>
        )}
      </main>
    </div>
  );
}
