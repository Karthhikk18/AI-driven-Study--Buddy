import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { analyticsApi, pageApi } from '../services/api';
import { FileText, Plus, Sparkles, Trash2, LayoutTemplate, GraduationCap, BookOpen, Search, Layers, Box } from 'lucide-react';
import { NotionBlockEditor } from '../components/NotionBlockEditor';

export const DashboardPage: React.FC = () => {
  const { user, selectedSubject, setUploadModalOpen } = useStore();
  const [analytics, setAnalytics] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);
  const [selectedPage, setSelectedPage] = useState<any | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const fetchDashboardData = async () => {
    try {
      const [anaRes, pageRes] = await Promise.all([
        analyticsApi.getDashboardAnalytics(),
        pageApi.listPages(selectedSubject?.id)
      ]);
      setAnalytics(anaRes.data);
      setPages(pageRes.data);
      if (pageRes.data.length > 0 && !selectedPage) {
        setSelectedPage(pageRes.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedSubject]);

  const handleCreatePage = async (title: string = 'Untitled Page', icon: string = '📄', blocks?: any[]) => {
    try {
      const res = await pageApi.createPage(selectedSubject?.id || 1, title, icon);
      setPages([...pages, res.data]);
      setSelectedPage(res.data);
      setNewTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyTemplate = (templateType: 'lecture' | 'exam' | 'research') => {
    if (templateType === 'lecture') {
      handleCreatePage('🎓 Weekly Lecture Notes', '🎓');
    } else if (templateType === 'exam') {
      handleCreatePage('📝 Exam Revision Prep', '📝');
    } else if (templateType === 'research') {
      handleCreatePage('🔬 Research Paper Breakdown', '🔬');
    }
  };

  const handleDeletePage = async (pageId: number) => {
    if (!window.confirm("Are you sure you want to delete this page?")) return;
    try {
      await pageApi.deletePage(pageId);
      const updated = pages.filter((p) => p.id !== pageId);
      setPages(updated);
      if (selectedPage?.id === pageId) {
        setSelectedPage(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 relative overflow-hidden text-black dark:text-white">
      {/* 3D Floating Mesh Orbs Background Animation */}
      <div className="absolute -top-20 -left-20 w-72 h-72 bg-gradient-to-tr from-purple-500/20 to-indigo-500/10 rounded-full blur-3xl animate-float-3d pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-gradient-to-br from-zinc-500/20 to-zinc-800/10 rounded-full blur-3xl animate-float-3d-delayed pointer-events-none" />

      {/* 3D Glassmorphism Hero Banner */}
      <div className="relative z-10 glass-panel border border-zinc-300 dark:border-zinc-800 rounded-3xl p-8 shadow-xl tilt-3d flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        <div>
          <div className="flex items-center space-x-2 text-black dark:text-white font-extrabold text-xs uppercase tracking-wider mb-2">
            <Box className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>3D Interactive AI Workspace Canvas</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-black dark:text-white">
            Welcome back, {user?.name || 'Karthikk'} 👋
          </h1>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 font-bold mt-1 max-w-xl leading-relaxed">
            Manage your study pages, 3D block canvas notes, and multi-database views in your intelligent study environment.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setUploadModalOpen(true)}
            className="px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black font-extrabold hover:scale-105 rounded-2xl text-xs shadow-xl flex items-center space-x-2 transition-all"
          >
            <Plus className="w-4 h-4 text-white dark:text-black" />
            <span className="text-white dark:text-black font-extrabold">+ Upload Material</span>
          </button>
        </div>
      </div>

      {/* 3D Page Template Cards */}
      <div className="space-y-3 relative z-10">
        <div className="flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-black dark:text-white">
          <Layers className="w-4 h-4 text-black dark:text-white" />
          <span>Study Page Templates (3D Cards):</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button
            onClick={() => handleApplyTemplate('lecture')}
            className="p-4 rounded-2xl bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 tilt-3d text-left space-y-1.5 shadow-md group"
          >
            <div className="flex items-center space-x-2 font-black text-xs text-black dark:text-white">
              <GraduationCap className="w-4 h-4 text-black dark:text-white group-hover:scale-110 transition-transform" />
              <span className="text-black dark:text-white font-extrabold">Weekly Lecture Notes</span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold truncate">Pre-formatted headings, callout boxes, and quiz blocks.</p>
          </button>

          <button
            onClick={() => handleApplyTemplate('exam')}
            className="p-4 rounded-2xl bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 tilt-3d text-left space-y-1.5 shadow-md group"
          >
            <div className="flex items-center space-x-2 font-black text-xs text-black dark:text-white">
              <BookOpen className="w-4 h-4 text-black dark:text-white group-hover:scale-110 transition-transform" />
              <span className="text-black dark:text-white font-extrabold">Exam Revision Prep</span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold truncate">Weak concepts list, flashcards checklist, & mock exam.</p>
          </button>

          <button
            onClick={() => handleApplyTemplate('research')}
            className="p-4 rounded-2xl bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 tilt-3d text-left space-y-1.5 shadow-md group"
          >
            <div className="flex items-center space-x-2 font-black text-xs text-black dark:text-white">
              <Search className="w-4 h-4 text-black dark:text-white group-hover:scale-110 transition-transform" />
              <span className="text-black dark:text-white font-extrabold">Research Paper Analysis</span>
            </div>
            <p className="text-[11px] text-zinc-700 dark:text-zinc-300 font-bold truncate">Methodology, key takeaways, & reference quotes.</p>
          </button>
        </div>
      </div>

      {/* Workspace Pages & Block Editor */}
      <div className="space-y-4 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-300 dark:border-zinc-800 pb-3">
          <div className="flex items-center space-x-2 overflow-x-auto pb-1">
            <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white mr-2">
              Workspace Pages:
            </span>
            {pages.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPage(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center space-x-1.5 flex-shrink-0 ${
                  selectedPage?.id === p.id
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-md scale-105'
                    : 'bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white text-black dark:text-white'
                }`}
              >
                <span>{p.icon || '📄'}</span>
                <span className="max-w-[120px] truncate">{p.title}</span>
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCreatePage(newTitle.trim() || 'Untitled Page');
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              placeholder="+ New Page Title..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl border bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 outline-none font-bold text-black dark:text-white"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black text-xs font-extrabold rounded-xl shadow-sm hover:scale-105 transition-transform"
            >
              Add Page
            </button>
          </form>
        </div>

        {/* Selected Page Block Canvas Editor */}
        {selectedPage ? (
          <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 rounded-3xl shadow-2xl relative p-2">
            <div className="absolute top-4 right-4 flex items-center space-x-2 z-20">
              <button
                onClick={() => handleDeletePage(selectedPage.id)}
                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 transition-colors text-xs font-bold flex items-center space-x-1"
                title="Delete Page"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Page</span>
              </button>
            </div>

            <NotionBlockEditor
              page={selectedPage}
              onPageUpdate={(updated) => {
                setPages(pages.map((p) => (p.id === updated.id ? updated : p)));
              }}
            />
          </div>
        ) : (
          <div className="p-12 text-center bg-white dark:bg-black rounded-3xl border border-zinc-300 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 font-bold space-y-2 shadow-inner">
            <FileText className="w-8 h-8 mx-auto text-black dark:text-white" />
            <p className="font-extrabold text-sm text-black dark:text-white">No workspace pages created yet.</p>
            <p className="text-zinc-700 dark:text-zinc-300 font-bold">Type a page title above and click "+ New Page" or choose a Study Template!</p>
          </div>
        )}
      </div>
    </div>
  );
};
