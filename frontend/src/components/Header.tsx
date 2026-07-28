import React from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, Sun, Moon, Plus, Zap } from 'lucide-react';

interface HeaderProps {
  onOpenFocusFlow?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenFocusFlow }) => {
  const { theme, toggleTheme, selectedSubject, setUploadModalOpen } = useStore();

  return (
    <header className="h-14 border-b border-zinc-300 dark:border-zinc-800 bg-white dark:bg-black px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      {/* Active Subject Title */}
      <div className="flex items-center space-x-3">
        <h2 className="text-sm font-extrabold truncate text-black dark:text-white">
          {selectedSubject ? selectedSubject.name : 'General Workspace'}
        </h2>
        <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white border border-zinc-300 dark:border-zinc-700">
          Active Subject
        </span>
      </div>

      {/* Center Buddy AI Global Command Trigger */}
      <div className="hidden md:flex items-center space-x-2 bg-zinc-100 dark:bg-zinc-900 px-3.5 py-1.5 rounded-xl border border-zinc-300 dark:border-zinc-700 cursor-pointer hover:border-black dark:hover:border-white transition-all group">
        <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
        <span className="text-xs font-extrabold text-black dark:text-white group-hover:text-black dark:group-hover:text-white">Buddy AI OS Agent</span>
        <span className="bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 px-1.5 py-0.5 rounded text-[10px] font-mono text-black dark:text-white font-bold">
          Ctrl+K
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-2">
        {/* Focus Flow Button */}
        {onOpenFocusFlow && (
          <button
            onClick={onOpenFocusFlow}
            className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all hover:shadow-md hover:scale-105"
            title="Open Focus Flow Mode"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Focus Flow</span>
          </button>
        )}

        <button
          onClick={() => setUploadModalOpen(true)}
          className="flex items-center space-x-1.5 bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-200 dark:text-black px-3.5 py-1.5 rounded-xl text-xs font-extrabold shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 text-white dark:text-black" />
          <span className="text-white dark:text-black font-extrabold hidden sm:inline">+ Upload Material</span>
          <span className="text-white dark:text-black font-extrabold sm:hidden">+</span>
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-black dark:text-white transition-colors"
          title="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-900" />}
        </button>
      </div>
    </header>
  );
};
