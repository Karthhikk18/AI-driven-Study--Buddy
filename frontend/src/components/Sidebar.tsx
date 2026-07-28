import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { documentApi, subjectInsightsApi } from '../services/api';
import {
  LayoutDashboard,
  Database,
  Sparkles,
  Zap,
  BookOpen,
  Calendar,
  BarChart3,
  Plus,
  LogOut,
  FolderOpen,
  Brain,
  Swords,
  ChevronDown,
  ChevronRight,
  FileText,
  Target,
  TrendingUp,
  Timer,
  Loader2,
} from 'lucide-react';

interface SidebarProps {
  onOpenFocusFlow?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenFocusFlow }) => {
  const { user, logout, subjects, setSubjects, selectedSubject, setSelectedSubject, setUploadModalOpen, activeTab, setActiveTab } = useStore();
  const [newSubjName, setNewSubjName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchSubjects = async () => {
    try {
      const res = await documentApi.getSubjects();
      setSubjects(res.data);
      if (res.data.length > 0 && !selectedSubject) {
        setSelectedSubject(res.data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchInsights = async (subjectId: number) => {
    setLoadingInsights(true);
    setInsights(null);
    try {
      const res = await subjectInsightsApi.getInsights(subjectId);
      setInsights(res.data);
    } catch {
      setInsights({
        document_count: 0,
        flashcard_count: 0,
        quiz_count: 0,
        weak_concepts: [],
        last_activity: null,
        summary: 'Upload study materials to get an AI-generated subject summary.',
      });
    } finally {
      setLoadingInsights(false);
    }
  };

  const handleSelectSubject = (subj: any) => {
    setSelectedSubject(subj);
    if (insightsOpen) {
      fetchInsights(subj.id);
    }
  };

  const handleToggleInsights = () => {
    const next = !insightsOpen;
    setInsightsOpen(next);
    if (next && selectedSubject) {
      fetchInsights(selectedSubject.id);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;
    try {
      const res = await documentApi.createSubject(newSubjName.trim());
      setSubjects([...subjects, res.data]);
      setSelectedSubject(res.data);
      setNewSubjName('');
      setIsAdding(false);
    } catch (err) {
      console.error(err);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'vault', label: 'Knowledge Vault', icon: Database },
    { id: 'chat', label: 'Buddy AI Chat', icon: Sparkles },
    { id: 'flashcards', label: 'Flashcards', icon: Zap },
    { id: 'quiz', label: 'Quiz & Practice', icon: BookOpen },
    { id: 'mindmap', label: 'Concept Mind Map', icon: Brain },
    { id: 'battle', label: 'Study Battle', icon: Swords },
    { id: 'planner', label: 'Study Planner', icon: Calendar },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  ];

  return (
    <aside className="w-64 border-r border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black flex flex-col h-screen sticky top-0 z-20 transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-zinc-300 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-xs shadow-sm">
            OS
          </div>
          <div>
            <h1 className="font-extrabold text-xs tracking-tight text-black dark:text-white">AI Study Buddy</h1>
            <span className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold font-mono">Buddy AI OS</span>
          </div>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={() => setUploadModalOpen(true)}
          className="w-full bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black py-2.5 px-3 rounded-xl text-xs font-extrabold shadow-md flex items-center justify-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4 text-white dark:text-black" />
          <span className="text-white dark:text-black font-extrabold">+ Upload Material</span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              activeTab === item.id
                ? item.id === 'battle'
                  ? 'bg-gradient-to-r from-red-500/10 to-amber-500/10 text-red-600 dark:text-red-400 border-l-2 border-red-500 font-extrabold shadow-sm'
                  : item.id === 'mindmap'
                  ? 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-l-2 border-violet-500 font-extrabold shadow-sm'
                  : 'bg-zinc-100 text-black dark:bg-zinc-900 dark:text-white font-extrabold border-l-2 border-black dark:border-white shadow-sm'
                : 'text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white'
            }`}
          >
            <item.icon className={`w-4 h-4 flex-shrink-0 ${
              item.id === 'battle' && activeTab === 'battle' ? 'text-red-500' :
              item.id === 'mindmap' && activeTab === 'mindmap' ? 'text-violet-500' : ''
            }`} />
            <span className="truncate">{item.label}</span>
            {item.id === 'battle' && <span className="ml-auto text-[9px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">NEW</span>}
            {item.id === 'mindmap' && <span className="ml-auto text-[9px] font-black bg-violet-500 text-white px-1.5 py-0.5 rounded-full">AI</span>}
          </button>
        ))}

        {/* Focus Flow button */}
        {onOpenFocusFlow && (
          <button
            onClick={onOpenFocusFlow}
            className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-black dark:hover:text-white mt-1"
          >
            <Timer className="w-4 h-4 flex-shrink-0 text-violet-500" />
            <span className="truncate">Focus Flow Mode</span>
            <span className="ml-auto text-[9px] font-black bg-violet-500 text-white px-1.5 py-0.5 rounded-full">⚡</span>
          </button>
        )}

        {/* Subjects Section */}
        <div className="pt-4 pb-2">
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
              Subjects
            </span>
            <button
              onClick={() => setIsAdding(true)}
              className="text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white p-0.5 rounded"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAdding && (
            <form onSubmit={handleCreateSubject} className="px-3 mb-2">
              <input
                type="text"
                placeholder="Subject name..."
                value={newSubjName}
                onChange={(e) => setNewSubjName(e.target.value)}
                className="w-full px-2 py-1 text-xs border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-black dark:text-white outline-none font-bold"
                autoFocus
              />
            </form>
          )}

          <div className="space-y-0.5">
            {subjects.map((subj) => (
              <div key={subj.id}>
                <button
                  onClick={() => handleSelectSubject(subj)}
                  className={`w-full flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    selectedSubject?.id === subj.id
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white font-extrabold'
                      : 'text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white font-semibold'
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate flex-1">{subj.name}</span>
                  {selectedSubject?.id === subj.id && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleInsights(); }}
                      className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      title="Show Subject Insights"
                    >
                      {insightsOpen && selectedSubject?.id === subj.id ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </button>

                {/* Smart Insights Panel */}
                {selectedSubject?.id === subj.id && insightsOpen && (
                  <div className="mx-3 mb-2 mt-0.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2.5 animate-slide-down text-[10px]">
                    {loadingInsights ? (
                      <div className="flex items-center justify-center py-3">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                      </div>
                    ) : insights ? (
                      <>
                        {/* Stats row */}
                        <div className="grid grid-cols-3 gap-1.5">
                          <div className="bg-white dark:bg-black rounded-lg p-1.5 text-center border border-zinc-200 dark:border-zinc-800">
                            <div className="font-black text-black dark:text-white">{insights.document_count || 0}</div>
                            <div className="text-zinc-500">Docs</div>
                          </div>
                          <div className="bg-white dark:bg-black rounded-lg p-1.5 text-center border border-zinc-200 dark:border-zinc-800">
                            <div className="font-black text-black dark:text-white">{insights.flashcard_count || 0}</div>
                            <div className="text-zinc-500">Cards</div>
                          </div>
                          <div className="bg-white dark:bg-black rounded-lg p-1.5 text-center border border-zinc-200 dark:border-zinc-800">
                            <div className="font-black text-amber-500">{insights.weak_concepts?.length || 0}</div>
                            <div className="text-zinc-500">Weak</div>
                          </div>
                        </div>

                        {/* AI Summary */}
                        {insights.summary && (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1 text-violet-500 font-bold">
                              <Sparkles className="w-3 h-3" />
                              <span>AI Summary</span>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{insights.summary}</p>
                          </div>
                        )}

                        {/* Quick actions */}
                        <div className="space-y-1">
                          <div className="font-bold text-zinc-500 uppercase tracking-wider" style={{ fontSize: 9 }}>Quick Actions</div>
                          <div className="grid grid-cols-2 gap-1">
                            {[
                              { label: 'Mind Map', tab: 'mindmap', icon: Brain, color: 'text-violet-500' },
                              { label: 'Battle', tab: 'battle', icon: Swords, color: 'text-red-500' },
                              { label: 'Flashcards', tab: 'flashcards', icon: Zap, color: 'text-amber-500' },
                              { label: 'Analytics', tab: 'analytics', icon: TrendingUp, color: 'text-emerald-500' },
                            ].map(({ label, tab, icon: Icon, color }) => (
                              <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center space-x-1 px-2 py-1.5 rounded-lg bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors font-semibold`}
                              >
                                <Icon className={`w-3 h-3 ${color} flex-shrink-0`} />
                                <span className="text-black dark:text-white truncate">{label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {insights.last_activity && (
                          <p className="text-zinc-400 text-center" style={{ fontSize: 9 }}>
                            Last active: {new Date(insights.last_activity).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-zinc-300 dark:border-zinc-800 flex items-center justify-between text-xs">
        <div className="truncate">
          <p className="font-extrabold text-xs truncate text-black dark:text-white">{user?.name || 'Student'}</p>
          <p className="text-[10px] text-zinc-700 dark:text-zinc-300 font-bold truncate">{user?.email || ''}</p>
        </div>
        <button
          onClick={logout}
          className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
          title="Logout"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
