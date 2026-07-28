import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { agentApi, quizApi, documentApi } from '../services/api';
import { Sparkles, Command, Send, X, FileText, Download, Zap, BookOpen, ChevronRight, Loader2, Trash2, HelpCircle, CheckSquare, Lightbulb, UploadCloud, FolderPlus } from 'lucide-react';

export const NotionAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const { selectedSubject, subjects, setSubjects, setSelectedSubject, setActiveTab, setUploadModalOpen } = useStore();

  const activeSubjectId = selectedSubject?.id || (subjects.length > 0 ? subjects[0].id : 1);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const slashCommands = [
    { cmd: '/summarize', label: 'Summarize all uploaded materials & course notes', icon: FileText },
    { cmd: '/actionitems', label: 'Extract action items & key study tasks', icon: CheckSquare },
    { cmd: '/keytakeaways', label: 'Extract core key takeaways & concepts', icon: Lightbulb },
    { cmd: '/simplify', label: 'Explain course concepts for beginners', icon: HelpCircle },
    { cmd: '/flashcards', label: 'Generate 100% document-grounded flashcards', icon: Zap },
    { cmd: '/quiz', label: 'Generate interactive assessment test', icon: BookOpen },
    { cmd: '/exportpdf', label: 'Export workspace summary as PDF document', icon: Download },
    { cmd: '/exportjpeg', label: 'Export workspace summary as HD JPEG card', icon: Download },
    { cmd: '/upload', label: 'Open document upload & OCR processing modal', icon: UploadCloud },
    { cmd: '/createsubject', label: 'Create a new subject folder in workspace', icon: FolderPlus },
    { cmd: '/navigate', label: 'Switch OS pages (Vault, Flashcards, Quiz)', icon: ChevronRight },
    { cmd: '/clear', label: 'Delete all uploaded materials and reset DB', icon: Trash2 },
  ];

  const handleExecute = async (cmdText: string) => {
    if (!cmdText.trim() || isLoading) return;

    const currentCmd = cmdText.trim();
    setIsLoading(true);
    setShowSlashMenu(false);

    try {
      const res = await agentApi.sendCommand(currentCmd, activeSubjectId, 'Intermediate');
      const actionData = res.data;

      setHistory((prev) => [
        ...prev,
        {
          command: currentCmd,
          response: actionData.message,
          action: actionData.action,
          file_url: actionData.file_url,
          filename: actionData.filename,
          sources: actionData.sources,
        },
      ]);
      setCommand('');

      // OS Action Execution Handlers
      if (actionData.action === 'open_upload_modal') {
        setIsOpen(false);
        setUploadModalOpen(true);
      } else if (actionData.action === 'delete_documents') {
        setTimeout(() => {
          setIsOpen(false);
          setActiveTab('vault');
        }, 1200);
      } else if (actionData.action === 'create_subject') {
        const subjsRes = await documentApi.getSubjects();
        setSubjects(subjsRes.data);
        if (subjsRes.data.length > 0) {
          setSelectedSubject(subjsRes.data[subjsRes.data.length - 1]);
        }
      } else if (actionData.action === 'navigate' && actionData.target) {
        setTimeout(() => {
          setIsOpen(false);
          setActiveTab(actionData.target);
        }, 800);
      } else if (actionData.action === 'generate_flashcards') {
        setTimeout(() => {
          setIsOpen(false);
          setActiveTab('flashcards');
        }, 1000);
      } else if (actionData.action === 'generate_quiz') {
        setTimeout(() => {
          setIsOpen(false);
          setActiveTab('quiz');
        }, 1000);
      } else if (actionData.action === 'export_file' && actionData.file_url) {
        const link = document.createElement('a');
        link.href = actionData.file_url;
        link.download = actionData.filename || 'export';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Buddy AI Launcher */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-black text-white dark:bg-white dark:text-black px-4 py-2.5 rounded-full shadow-2xl hover:scale-105 transition-all flex items-center space-x-2 text-xs font-bold border border-zinc-700 dark:border-zinc-300 group"
      >
        <Sparkles className="w-4 h-4 animate-pulse text-amber-300 dark:text-amber-500" />
        <span>Buddy AI OS</span>
        <span className="bg-zinc-800 text-zinc-200 dark:bg-zinc-200 dark:text-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-mono border border-zinc-700 dark:border-zinc-300">
          Ctrl+K
        </span>
      </button>

      {/* Buddy AI Command Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col relative animate-in fade-in zoom-in-95 duration-200 text-black dark:text-white">
            
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-black dark:text-white">Buddy AI OS Agent</h3>
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    Autonomous OS Control • Type <code className="bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white px-1.5 py-0.5 rounded font-mono font-bold">/</code> for all commands
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* History Output Stream */}
            <div className="max-h-[45vh] overflow-y-auto p-4 space-y-4 text-xs">
              {history.length === 0 ? (
                <div className="py-8 text-center text-zinc-600 dark:text-zinc-300 space-y-3">
                  <Command className="w-8 h-8 mx-auto text-black dark:text-white opacity-80" />
                  <p className="font-bold text-sm text-black dark:text-white">What would you like Buddy AI OS to do?</p>
                  <p className="text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto">
                    Type <span className="font-mono text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">/</span> to explore commands:{' '}
                    <span className="font-mono text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">/summarize</span>,{' '}
                    <span className="font-mono text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">/actionitems</span>,{' '}
                    <span className="font-mono text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">/flashcards</span>,{' '}
                    <span className="font-mono text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">/quiz</span>,{' '}
                    <span className="font-mono text-black dark:text-white font-bold bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-300 dark:border-zinc-700">/exportpdf</span>.
                  </p>
                </div>
              ) : (
                history.map((h, idx) => (
                  <div key={idx} className="space-y-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <div className="flex items-center space-x-2 font-mono text-[11px] font-bold text-black dark:text-white">
                      <Command className="w-3.5 h-3.5" />
                      <span>{h.command}</span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 whitespace-pre-wrap leading-relaxed text-black dark:text-white">
                      {h.response}
                    </div>

                    {h.file_url && (
                      <a
                        href={h.file_url}
                        download={h.filename}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black font-semibold text-[11px] shadow"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {h.filename}</span>
                      </a>
                    )}
                  </div>
                ))
              )}

              {isLoading && (
                <div className="flex items-center space-x-2 text-black dark:text-white p-2 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Buddy AI executing OS action...</span>
                </div>
              )}
            </div>

            {/* Slash Command Autocomplete Menu */}
            {showSlashMenu && (
              <div className="max-h-48 overflow-y-auto border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-2 space-y-1">
                {slashCommands.map((sc, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCommand(sc.cmd);
                      setShowSlashMenu(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-left text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <sc.icon className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
                      <span className="font-bold text-black dark:text-white font-mono bg-zinc-200 dark:bg-zinc-800 px-1.5 py-0.5 rounded">{sc.cmd}</span>
                      <span className="text-zinc-600 dark:text-zinc-300 truncate">{sc.label}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Command Input Field */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleExecute(command);
                }}
                className="flex items-center space-x-2"
              >
                <Command className="w-4 h-4 text-black dark:text-white flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Command Buddy AI (type / to select any command)..."
                  value={command}
                  onChange={(e) => {
                    setCommand(e.target.value);
                    if (e.target.value.startsWith('/')) setShowSlashMenu(true);
                    else setShowSlashMenu(false);
                  }}
                  className="flex-1 bg-transparent outline-none text-xs font-semibold text-black dark:text-white placeholder:text-zinc-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!command.trim() || isLoading}
                  className="px-4 py-1.5 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-lg text-xs font-bold disabled:opacity-50 flex items-center space-x-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Run</span>
                </button>
              </form>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
