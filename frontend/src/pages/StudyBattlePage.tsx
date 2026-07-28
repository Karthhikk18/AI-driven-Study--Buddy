import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { quizApi } from '../services/api';
import { Swords, Zap, Timer, CheckCircle2, XCircle, Trophy, Flame, Brain, ChevronRight, Loader2, Star } from 'lucide-react';

const QUESTION_TIME = 15;
const COMBO_BONUS_THRESHOLD = 3;

function playBeep(freq: number, duration: number = 0.15, type: OscillatorType = 'square') {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), 500);
  } catch {}
}

function playCorrect() {
  playBeep(523, 0.1, 'sine');
  setTimeout(() => playBeep(659, 0.1, 'sine'), 120);
  setTimeout(() => playBeep(784, 0.2, 'sine'), 240);
}

function playWrong() {
  playBeep(220, 0.3, 'sawtooth');
}

function playCombo() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => playBeep(f, 0.1, 'sine'), i * 80));
}

function playTick() {
  playBeep(1200, 0.05, 'square');
}

export const StudyBattlePage: React.FC = () => {
  const { selectedSubject } = useStore();
  const [phase, setPhase] = useState<'lobby' | 'battle' | 'results'>('lobby');
  const [difficulty, setDifficulty] = useState('Medium');
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);
  const [selected, setSelected] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);
  const [answers, setAnswers] = useState<{ correct: boolean; time: number }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [weakConcepts, setWeakConcepts] = useState<string[]>([]);
  const [animClass, setAnimClass] = useState('');
  const timerRef = useRef<any>(null);

  const currentQuestion = questions[currentQ];

  const stopTimer = () => clearInterval(timerRef.current);

  const advanceQuestion = (answeredCorrectly: boolean, timeUsed: number) => {
    const newAnswers = [...answers, { correct: answeredCorrectly, time: timeUsed }];
    setAnswers(newAnswers);

    setTimeout(() => {
      setSelected(null);
      setIsCorrect(null);
      setAnimClass('');
      if (currentQ + 1 >= questions.length) {
        // End battle
        const finalScore = newAnswers.reduce((acc, a) => {
          if (!a.correct) return acc;
          const timeBonus = Math.max(0, QUESTION_TIME - a.time);
          return acc + 100 + timeBonus * 10;
        }, 0);
        setScore(finalScore);
        setXpEarned(Math.floor(finalScore / 10));
        const incorrectIndices = newAnswers
          .map((a, i) => (!a.correct ? i : -1))
          .filter((i) => i >= 0);
        setWeakConcepts(incorrectIndices.map((i) => questions[i]?.question?.substring(0, 40) + '...' || 'Unknown'));
        setPhase('results');
      } else {
        setCurrentQ((q) => q + 1);
        setTimeLeft(QUESTION_TIME);
      }
    }, 1000);
  };

  useEffect(() => {
    if (phase !== 'battle' || selected !== null) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 4 && t > 1) playTick();
        if (t <= 1) {
          clearInterval(timerRef.current);
          playWrong();
          setIsCorrect(false);
          setAnimClass('animate-shake');
          const timeUsed = QUESTION_TIME;
          setCombo(0);
          advanceQuestion(false, timeUsed);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, currentQ, selected]);

  const handleAnswer = (optionIdx: number) => {
    if (selected !== null) return;
    stopTimer();
    const timeUsed = QUESTION_TIME - timeLeft;
    setSelected(optionIdx);

    const correct = optionIdx === currentQuestion.correct_index;
    setIsCorrect(correct);

    if (correct) {
      const newCombo = combo + 1;
      setCombo(newCombo);
      if (newCombo >= COMBO_BONUS_THRESHOLD) {
        playCombo();
        setAnimClass('animate-pulse-fast');
      } else {
        playCorrect();
        setAnimClass('animate-bounce-once');
      }
    } else {
      setCombo(0);
      playWrong();
      setAnimClass('animate-shake');
    }

    advanceQuestion(correct, timeUsed);
  };

  const handleStartBattle = async () => {
    setIsLoading(true);
    setCurrentQ(0);
    setScore(0);
    setXpEarned(0);
    setCombo(0);
    setAnswers([]);
    setSelected(null);
    setIsCorrect(null);
    try {
      const res = await quizApi.generateQuiz(selectedSubject?.id || 1, difficulty);
      const qs = typeof res.data.questions === 'string' ? JSON.parse(res.data.questions) : res.data.questions;
      setQuestions(qs);
      setPhase('battle');
      setTimeLeft(QUESTION_TIME);
    } catch {
      // Demo fallback
      setQuestions([
        { question: 'What is spaced repetition?', options: ['A random method', 'A memory technique using timed intervals', 'Only for languages', 'A teaching style'], correct_index: 1 },
        { question: 'What does the SM-2 algorithm optimize?', options: ['Speed reading', 'Review scheduling', 'Note-taking', 'Essay writing'], correct_index: 1 },
        { question: 'What is active recall?', options: ['Reading notes passively', 'Testing yourself on material', 'Highlighting text', 'Watching lectures'], correct_index: 1 },
        { question: 'What is the Pomodoro technique?', options: ['25-min focus + 5-min break cycles', 'An Italian study method', 'Speed reading', 'Mind mapping'], correct_index: 0 },
        { question: 'What is a knowledge vault?', options: ['A physical filing cabinet', 'A centralized digital knowledge store', 'A type of exam', 'A lecture hall'], correct_index: 1 },
      ]);
      setPhase('battle');
      setTimeLeft(QUESTION_TIME);
    } finally {
      setIsLoading(false);
    }
  };

  const correctCount = answers.filter((a) => a.correct).length;
  const accuracy = answers.length > 0 ? Math.round((correctCount / answers.length) * 100) : 0;

  // --- LOBBY ---
  if (phase === 'lobby') {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-3 pt-4">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <Swords className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-black dark:text-white">Study Battle Mode</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-semibold max-w-sm mx-auto">
            Race against the clock! Answer questions fast for combo multipliers and max XP. Test your knowledge under pressure.
          </p>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-6 space-y-4 border border-zinc-800">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-zinc-300">Battle Rules</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Timer, label: `${QUESTION_TIME}s per question`, color: 'text-amber-400' },
              { icon: Zap, label: '100 XP base per correct', color: 'text-yellow-400' },
              { icon: Flame, label: `${COMBO_BONUS_THRESHOLD}+ streak = Combo Bonus`, color: 'text-red-400' },
              { icon: Star, label: 'Speed bonus on fast answers', color: 'text-violet-400' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center space-x-2 bg-zinc-800 rounded-xl p-3">
                <Icon className={`w-4 h-4 ${color} flex-shrink-0`} />
                <span className="text-xs font-semibold text-zinc-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Select Difficulty</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'Easy', label: 'Easy', emoji: '🟢', desc: 'Fundamentals' },
              { id: 'Medium', label: 'Medium', emoji: '🟡', desc: 'Core Knowledge' },
              { id: 'Hard', label: 'Hard', emoji: '🔴', desc: 'Expert Level' },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                className={`p-4 rounded-2xl border-2 text-center transition-all ${
                  difficulty === d.id
                    ? 'border-black dark:border-white bg-black text-white dark:bg-white dark:text-black'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                <div className="text-2xl mb-1">{d.emoji}</div>
                <div className="text-xs font-extrabold">{d.label}</div>
                <div className="text-[10px] font-semibold opacity-60">{d.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleStartBattle}
          disabled={isLoading}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-amber-500 text-white font-extrabold text-lg rounded-2xl hover:opacity-90 transition-all shadow-2xl flex items-center justify-center space-x-3 disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
          <span>{isLoading ? 'Preparing Battle...' : '⚡ Start Battle!'}</span>
        </button>
      </div>
    );
  }

  // --- BATTLE ---
  if (phase === 'battle' && currentQuestion) {
    const timerPct = (timeLeft / QUESTION_TIME) * 100;
    const timerColor = timeLeft > 8 ? 'bg-emerald-500' : timeLeft > 4 ? 'bg-amber-500' : 'bg-red-500';

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {/* Battle HUD */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl">
              <Zap className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-extrabold text-amber-500">{score} XP</span>
            </div>
            {combo >= COMBO_BONUS_THRESHOLD && (
              <div className="flex items-center space-x-1.5 bg-red-500/10 border border-red-500/20 px-3 py-1.5 rounded-xl animate-pulse">
                <Flame className="w-4 h-4 text-red-500" />
                <span className="text-sm font-extrabold text-red-500">x{combo} COMBO!</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-zinc-500">{currentQ + 1}/{questions.length}</span>
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-extrabold text-sm ${
                timeLeft <= 5 ? 'bg-red-500/10 text-red-500 border border-red-500/20 animate-pulse' : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white'
              }`}
            >
              <Timer className="w-4 h-4" />
              <span className="font-mono">{timeLeft}s</span>
            </div>
          </div>
        </div>

        {/* Timer bar */}
        <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${timerColor}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>

        {/* Question card */}
        <div className={`bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-2 shadow-xl ${animClass}`}>
          <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <Brain className="w-3.5 h-3.5" />
            <span>Question {currentQ + 1}</span>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-900">{difficulty}</span>
          </div>
          <h2 className="text-lg font-extrabold text-black dark:text-white leading-relaxed">
            {currentQuestion.question}
          </h2>
        </div>

        {/* Answer options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((opt: string, i: number) => {
            let cls = 'bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white hover:shadow-md';
            if (selected !== null) {
              if (i === currentQuestion.correct_index) {
                cls = 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500 shadow-emerald-200 dark:shadow-emerald-900/50 shadow-lg';
              } else if (i === selected && !isCorrect) {
                cls = 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500';
              } else {
                cls = 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 opacity-50';
              }
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={`p-4 rounded-2xl text-left transition-all duration-200 ${cls}`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-extrabold flex-shrink-0 ${
                    selected !== null && i === currentQuestion.correct_index
                      ? 'bg-emerald-500 text-white'
                      : selected !== null && i === selected && !isCorrect
                      ? 'bg-red-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400'
                  }`}>
                    {selected !== null && i === currentQuestion.correct_index ? <CheckCircle2 className="w-4 h-4" /> :
                      selected !== null && i === selected && !isCorrect ? <XCircle className="w-4 h-4" /> :
                      String.fromCharCode(65 + i)}
                  </div>
                  <span className="text-sm font-semibold text-black dark:text-white">{opt}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // --- RESULTS ---
  if (phase === 'results') {
    const grade = accuracy >= 90 ? '🏆 S Rank' : accuracy >= 75 ? '⭐ A Rank' : accuracy >= 60 ? '✅ B Rank' : '📚 C Rank';
    const gradeColor = accuracy >= 90 ? 'text-amber-500' : accuracy >= 75 ? 'text-emerald-500' : accuracy >= 60 ? 'text-blue-500' : 'text-zinc-500';

    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div className="bg-gradient-to-br from-zinc-900 to-black text-white rounded-3xl p-8 text-center space-y-4 border border-zinc-800 shadow-2xl">
          <Trophy className="w-12 h-12 text-amber-400 mx-auto animate-bounce" />
          <h2 className="text-2xl font-black">Battle Complete!</h2>
          <div className={`text-4xl font-black ${gradeColor}`}>{grade}</div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-zinc-800 rounded-2xl p-4">
              <div className="text-2xl font-black text-amber-400">{xpEarned}</div>
              <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">XP Earned</div>
            </div>
            <div className="bg-zinc-800 rounded-2xl p-4">
              <div className="text-2xl font-black text-emerald-400">{accuracy}%</div>
              <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">Accuracy</div>
            </div>
            <div className="bg-zinc-800 rounded-2xl p-4">
              <div className="text-2xl font-black text-violet-400">{correctCount}/{questions.length}</div>
              <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">Correct</div>
            </div>
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-2">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">Question Breakdown</h3>
          {questions.map((q, i) => {
            const ans = answers[i];
            return (
              <div key={i} className={`flex items-start space-x-3 p-3 rounded-xl border ${ans?.correct ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900'}`}>
                {ans?.correct ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-black dark:text-white truncate">{q.question}</p>
                  {!ans?.correct && <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓ {q.options[q.correct_index]}</p>}
                </div>
                <span className="text-[10px] font-mono text-zinc-400 flex-shrink-0">{ans?.time}s</span>
              </div>
            );
          })}
        </div>

        {weakConcepts.length > 0 && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-amber-500">
              <Brain className="w-4 h-4" />
              <span className="text-xs font-extrabold">Concepts to Review</span>
            </div>
            {weakConcepts.map((c, i) => (
              <div key={i} className="flex items-center space-x-2 text-xs text-zinc-600 dark:text-zinc-400">
                <ChevronRight className="w-3 h-3 flex-shrink-0" />
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPhase('lobby')}
          className="w-full py-4 bg-gradient-to-r from-red-500 to-amber-500 text-white font-extrabold text-sm rounded-2xl hover:opacity-90 transition-all shadow-xl flex items-center justify-center space-x-2"
        >
          <Swords className="w-5 h-5" />
          <span>Battle Again!</span>
        </button>
      </div>
    );
  }

  return null;
};
