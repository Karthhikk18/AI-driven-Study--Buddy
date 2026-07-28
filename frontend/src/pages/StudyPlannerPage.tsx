import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { todoApi } from '../services/api';
import { NotionDatabaseViews } from '../components/NotionDatabaseViews';
import { Calendar, Plus, CheckCircle2, Play, Pause, RotateCcw, Timer, Flame } from 'lucide-react';

export const StudyPlannerPage: React.FC = () => {
  const { selectedSubject } = useStore();
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [category, setCategory] = useState('Homework');
  const [priority, setPriority] = useState('Medium');

  // Pomodoro Focus Timer State
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);

  const fetchTasks = async () => {
    try {
      const res = await todoApi.listTasks(selectedSubject?.id);
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedSubject]);

  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setCompletedSessions((prev) => prev + 1);
      alert("🎉 Pomodoro Session Completed! Take a 5-minute study break.");
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerSeconds]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await todoApi.createTask({
        subject_id: selectedSubject?.id || 1,
        title: newTitle.trim(),
        category,
        priority,
      });
      setTasks([...tasks, res.data]);
      setNewTitle('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId: number) => {
    try {
      await todoApi.toggleTask(taskId);
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    try {
      await todoApi.deleteTask(taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const totalCount = tasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-black dark:text-white">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold">Study Planner & Focus OS</h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Organize study schedules, track task progress, and run 25-minute Pomodoro focus sessions.
          </p>
        </div>

        {/* Pomodoro Timer Bar */}
        <div className="bg-white dark:bg-black border border-zinc-300 dark:border-zinc-800 px-4 py-2 rounded-2xl flex items-center space-x-4 shadow-md">
          <div className="flex items-center space-x-2">
            <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
            <span className="text-sm font-mono font-black">{formattedTime}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1.5 rounded-lg bg-black text-white dark:bg-white dark:text-black hover:scale-105 transition-all text-xs font-bold"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => {
                setIsTimerRunning(false);
                setTimerSeconds(25 * 60);
              }}
              className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-1 text-[10px] font-bold text-amber-500">
            <Flame className="w-3.5 h-3.5" />
            <span>{completedSessions} Sessions</span>
          </div>
        </div>
      </div>

      {/* Progress Bar & Task Creator */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl space-y-4 shadow-sm">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Task Completion Rate ({completedCount}/{totalCount})
          </span>
          <span className="font-mono font-bold text-black dark:text-white">{progressPercent}%</span>
        </div>

        <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-black dark:bg-white h-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Task Creator Form */}
        <form onSubmit={handleCreateTask} className="flex flex-col sm:flex-row items-center gap-2 pt-2">
          <input
            type="text"
            placeholder="Add new study task (e.g. Read Chapter 4)..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs rounded-xl px-3 py-2 outline-none font-bold"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs rounded-xl px-3 py-2 outline-none font-bold"
          >
            <option value="Homework">Homework</option>
            <option value="Exam Prep">Exam Prep</option>
            <option value="Research">Research</option>
            <option value="Reading">Reading</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs rounded-xl px-3 py-2 outline-none font-bold"
          >
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-black text-white dark:bg-white dark:text-black font-extrabold rounded-xl text-xs shadow-md flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </form>
      </div>

      {/* Notion Database Multi-Views Component */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-xl">
        <NotionDatabaseViews
          tasks={tasks}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
};
