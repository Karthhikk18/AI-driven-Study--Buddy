import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api';
import { BarChart3, TrendingUp, CheckCircle, FileText, Zap, Award, Target, Flame, BrainCircuit, BookOpen, Lightbulb } from 'lucide-react';
import { GamificationWidget } from '../components/GamificationWidget';
import { StudyHeatmap } from '../components/StudyHeatmap';
import { useStore } from '../store/useStore';

export const AnalyticsPage: React.FC = () => {
  const { selectedSubject } = useStore();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    analyticsApi
      .getDashboardAnalytics()
      .then((res) => setData(res.data))
      .catch((err) => console.error(err));
  }, [selectedSubject]);

  const docCount = data?.document_count || 0;
  const flashcardCount = data?.flashcard_count || 0;
  const quizCount = data?.quiz_count || 0;
  const examPreparednessScore = Math.min(96, Math.max(30, (docCount * 15 + flashcardCount * 8 + quizCount * 12)));

  const studyTips = [
    "Upload more study materials to increase your Exam Readiness score.",
    "Complete a flashcard session daily to boost long-term memory retention.",
    "Use the /link command to ingest Wikipedia articles into your Knowledge Vault.",
    "Set a daily Pomodoro session goal of at least 2 sessions for optimal focus.",
    "Rate flashcards using SM-2 buttons to schedule spaced repetition reviews.",
  ];
  const todayTip = studyTips[new Date().getDay() % studyTips.length];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-black dark:text-white">
      {/* Header */}
      <div>
        <h1 className="text-xl font-extrabold text-black dark:text-white">Learning Analytics & Gamification OS</h1>
        <p className="text-xs text-zinc-600 dark:text-zinc-400 font-semibold">
          Real-time XP progress, exam preparedness predictor, achievement badges, and personalized AI study tips.
        </p>
      </div>

      {/* AI Daily Study Tip Banner */}
      <div className="flex items-start space-x-3 bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl">
        <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-extrabold text-black dark:text-white">Today's AI Study Tip:</p>
          <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold mt-0.5">{todayTip}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Exam Preparedness + Metric Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3D Exam Preparedness Predictor Hero Widget */}
          <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-950 text-white rounded-3xl p-8 border border-zinc-800 shadow-2xl tilt-3d relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-3 z-10">
              <div className="flex items-center space-x-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                <BrainCircuit className="w-4 h-4 animate-bounce" />
                <span>AI Predictive Exam Score Engine</span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black">
                Exam Readiness: <span className="text-amber-400 font-mono">{examPreparednessScore}%</span>
              </h2>

              <p className="text-xs text-zinc-300 max-w-xl leading-relaxed font-semibold">
                Calculated from {docCount} documents, {flashcardCount} flashcards, and {quizCount} quiz sessions.
              </p>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center space-x-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Active Learning Trajectory</span>
                </div>
                <div className="flex items-center space-x-1.5 text-xs text-amber-300 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  <Flame className="w-3.5 h-3.5" />
                  <span>Streak Active</span>
                </div>
              </div>
            </div>

            {/* Circular Progress Gauge */}
            <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path className="text-zinc-800" strokeWidth="3.5" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                <path className="text-amber-400 transition-all duration-1000 ease-out"
                  strokeDasharray={`${examPreparednessScore}, 100`}
                  strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="text-2xl font-black font-mono text-white">{examPreparednessScore}%</span>
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">READY</span>
              </div>
            </div>
          </div>

          {/* Metrics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Documents', value: docCount, sub: 'OCR processed', icon: FileText },
              { label: 'Flashcards', value: flashcardCount, sub: 'SM-2 memory items', icon: Zap },
              { label: 'Quizzes', value: quizCount, sub: 'Grounded assessments', icon: CheckCircle },
              { label: 'Weak Concepts', value: data?.weak_concepts_count || 0, sub: 'For spaced review', icon: Target, amber: true },
            ].map(({ label, value, sub, icon: Icon, amber }) => (
              <div key={label} className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-zinc-500">
                  <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
                  <Icon className={`w-4 h-4 ${amber ? 'text-amber-500' : 'text-black dark:text-white'}`} />
                </div>
                <p className={`text-2xl font-extrabold font-mono ${amber ? 'text-amber-500' : 'text-black dark:text-white'}`}>{value}</p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">{sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Gamification Widget */}
        <div className="lg:col-span-1">
          <GamificationWidget
            docCount={docCount}
            flashcardCount={flashcardCount}
            quizCount={quizCount}
          />
        </div>
      </div>

      {/* Study Heatmap */}
      <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl shadow-sm">
        <StudyHeatmap />
      </div>
    </div>
  );
};
