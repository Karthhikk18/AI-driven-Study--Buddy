import React, { useState, useEffect } from 'react';
import { Trophy, Flame, Star, Zap, Award, Target, TrendingUp, Lock, CheckCircle } from 'lucide-react';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  xpReward: number;
}

interface GamificationWidgetProps {
  docCount: number;
  flashcardCount: number;
  quizCount: number;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({ docCount, flashcardCount, quizCount }) => {
  const [xp, setXp] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [level, setLevel] = useState<number>(1);

  useEffect(() => {
    // XP calculation based on activity
    const calculatedXP = (docCount * 150) + (flashcardCount * 30) + (quizCount * 200);
    setXp(calculatedXP);
    setLevel(Math.floor(calculatedXP / 500) + 1);

    // Streak from localStorage
    const savedStreak = parseInt(localStorage.getItem('sb_streak') || '1');
    const lastVisit = localStorage.getItem('sb_last_visit');
    const today = new Date().toDateString();
    if (lastVisit !== today) {
      localStorage.setItem('sb_last_visit', today);
      if (lastVisit === new Date(Date.now() - 86400000).toDateString()) {
        const newStreak = savedStreak + 1;
        localStorage.setItem('sb_streak', newStreak.toString());
        setStreak(newStreak);
      } else {
        localStorage.setItem('sb_streak', '1');
        setStreak(1);
      }
    } else {
      setStreak(savedStreak);
    }
  }, [docCount, flashcardCount, quizCount]);

  const badges: Badge[] = [
    { id: 'first_upload', name: 'First Upload', description: 'Uploaded your first document', icon: '📄', unlocked: docCount >= 1, xpReward: 150 },
    { id: 'flashcard_master', name: 'Flashcard Master', description: 'Generated 10+ flashcards', icon: '⚡', unlocked: flashcardCount >= 10, xpReward: 300 },
    { id: 'quiz_champion', name: 'Quiz Champion', description: 'Completed 3+ quizzes', icon: '🏆', unlocked: quizCount >= 3, xpReward: 600 },
    { id: 'knowledge_seeker', name: 'Knowledge Seeker', description: 'Uploaded 3+ documents', icon: '🔬', unlocked: docCount >= 3, xpReward: 450 },
    { id: 'streak_warrior', name: 'Streak Warrior', description: 'Maintained 3+ day study streak', icon: '🔥', unlocked: streak >= 3, xpReward: 200 },
    { id: 'ai_scholar', name: 'AI Scholar', description: 'Reached Level 5', icon: '🎓', unlocked: level >= 5, xpReward: 1000 },
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const xpToNext = 500 - (xp % 500);
  const xpProgress = ((xp % 500) / 500) * 100;

  return (
    <div className="space-y-4">
      {/* Level & XP Bar */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-950 to-black text-white rounded-3xl p-6 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center font-black text-xl shadow-lg">
              {level}
            </div>
            <div>
              <p className="font-black text-sm">Level {level} Scholar</p>
              <p className="text-[10px] text-zinc-400 font-bold">{xp.toLocaleString()} XP Total</p>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-1">
            <div className="flex items-center space-x-1.5 text-amber-400 font-black text-sm">
              <Flame className="w-4 h-4 animate-pulse" />
              <span>{streak} Day Streak</span>
            </div>
            <span className="text-[10px] text-zinc-400">{xpToNext} XP to Level {level + 1}</span>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div>
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 mb-1">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="w-full bg-zinc-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-700"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-1">
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <p className="text-base font-black">{docCount}</p>
            <p className="text-[9px] text-zinc-400 font-bold uppercase">Documents</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <p className="text-base font-black">{flashcardCount}</p>
            <p className="text-[9px] text-zinc-400 font-bold uppercase">Flashcards</p>
          </div>
          <div className="bg-white/5 rounded-xl p-2 text-center">
            <p className="text-base font-black">{quizCount}</p>
            <p className="text-[9px] text-zinc-400 font-bold uppercase">Quizzes</p>
          </div>
        </div>
      </div>

      {/* Achievements Badge Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-black uppercase tracking-wider text-black dark:text-white flex items-center space-x-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span>Achievements ({unlockedCount}/{badges.length})</span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-3 rounded-2xl border text-center space-y-1 transition-all ${
                badge.unlocked
                  ? 'bg-amber-500/10 border-amber-500/30 shadow-sm'
                  : 'bg-zinc-100 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-50'
              }`}
            >
              <div className="text-2xl">{badge.unlocked ? badge.icon : '🔒'}</div>
              <p className={`text-[11px] font-extrabold ${badge.unlocked ? 'text-black dark:text-white' : 'text-zinc-400'}`}>
                {badge.name}
              </p>
              <p className="text-[9px] text-zinc-500 leading-tight">{badge.description}</p>
              {badge.unlocked && (
                <span className="inline-block text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                  +{badge.xpReward} XP
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
