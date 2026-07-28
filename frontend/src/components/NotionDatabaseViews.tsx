import React, { useState } from 'react';
import { Table, LayoutGrid, Kanban, CheckCircle2, Circle, Clock, Trash2, Plus, Tag, AlertCircle, Calendar } from 'lucide-react';

interface NotionTask {
  id: number;
  title: string;
  category: string;
  priority: string;
  due_date: string;
  completed: boolean;
}

interface NotionDatabaseViewsProps {
  tasks: NotionTask[];
  onToggleTask: (taskId: number) => void;
  onDeleteTask: (taskId: number) => void;
  onAddTask?: () => void;
}

export const NotionDatabaseViews: React.FC<NotionDatabaseViewsProps> = ({
  tasks,
  onToggleTask,
  onDeleteTask,
}) => {
  const [viewMode, setViewMode] = useState<'table' | 'board' | 'gallery'>('table');

  const todoTasks = tasks.filter((t) => !t.completed);
  const doneTasks = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-4">
      {/* Study Buddy Database View Switcher Bar */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2 text-xs">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setViewMode('table')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'table'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            <span>Table View</span>
          </button>

          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'board'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Board</span>
          </button>

          <button
            onClick={() => setViewMode('gallery')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              viewMode === 'gallery'
                ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Gallery View</span>
          </button>
        </div>

        <span className="text-zinc-400 font-mono text-[11px]">{tasks.length} database entries</span>
      </div>

      {/* 1. TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-black">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-10">Status</th>
                <th className="p-3">Title / Task Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 w-12 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-400">
                    No database items available.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
                    <td className="p-3">
                      <button onClick={() => onToggleTask(task.id)} className="text-zinc-400 hover:text-black dark:hover:text-white">
                        {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className={`p-3 font-semibold ${task.completed ? 'line-through text-zinc-400' : ''}`}>
                      {task.title}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px]">
                        {task.category}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          task.priority === 'High'
                            ? 'bg-red-500/10 text-red-500'
                            : task.priority === 'Medium'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-blue-500/10 text-blue-500'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-3 text-zinc-400 font-mono text-[11px]">{task.due_date}</td>
                    <td className="p-3 text-right">
                      <button onClick={() => onDeleteTask(task.id)} className="p-1 rounded hover:bg-red-500/10 text-zinc-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. KANBAN BOARD VIEW */}
      {viewMode === 'board' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* To-Do Column */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs uppercase tracking-wider">To Do</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-bold">
                {todoTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {todoTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-black p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2 hover:border-black dark:hover:border-white transition-colors cursor-pointer"
                  onClick={() => onToggleTask(t.id)}
                >
                  <p className="text-xs font-bold">{t.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">{t.category}</span>
                    <span className="font-semibold text-amber-500">Click to Complete →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Completed Column */}
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="font-bold text-xs uppercase tracking-wider">Completed</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-[10px] font-mono font-bold">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {doneTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-black p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2 opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => onToggleTask(t.id)}
                >
                  <p className="text-xs font-bold line-through text-zinc-400">{t.title}</p>
                  <div className="flex items-center justify-between text-[10px] text-zinc-400">
                    <span className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900">{t.category}</span>
                    <span className="text-emerald-500 font-bold">✓ Done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. GALLERY VIEW */}
      {viewMode === 'gallery' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl shadow-sm space-y-3 hover:border-black dark:hover:border-white transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                  {t.category}
                </span>
                <button onClick={() => onToggleTask(t.id)}>
                  {t.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4 text-zinc-400" />}
                </button>
              </div>

              <h4 className={`font-bold text-xs ${t.completed ? 'line-through text-zinc-400' : ''}`}>{t.title}</h4>

              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-[10px] text-zinc-400">
                <span>Priority: <strong className="text-black dark:text-white">{t.priority}</strong></span>
                <span>{t.due_date}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
