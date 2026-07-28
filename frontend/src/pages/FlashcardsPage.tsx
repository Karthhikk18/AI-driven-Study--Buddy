import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';
import { quizApi } from '../services/api';
import { Zap, RefreshCw, RotateCw, CheckCircle2, BookOpen, ChevronLeft, ChevronRight, Brain, Clock } from 'lucide-react';

export const FlashcardsPage: React.FC = () => {
  const { selectedSubject } = useStore();
  const [cards, setCards] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cardIntervals, setCardIntervals] = useState<Record<number, string>>({});

  const fetchCards = async () => {
    try {
      const res = await quizApi.getFlashcards(selectedSubject?.id || 1);
      setCards(res.data);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [selectedSubject]);

  const handleGenerateCards = async () => {
    setIsGenerating(true);
    try {
      const res = await quizApi.generateFlashcards(selectedSubject?.id || 1);
      setCards(res.data);
      setCurrentIndex(0);
      setIsFlipped(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRateCard = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    const intervals = { again: 'Review in 1 Day', hard: 'Review in 2 Days', good: 'Review in 4 Days', easy: 'Review in 7 Days' };
    setCardIntervals((prev) => ({ ...prev, [currentIndex]: intervals[rating] }));
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % maxIndex);
    }, 200);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % maxIndex);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + maxIndex) % maxIndex);
    }, 150);
  };

  const maxIndex = cards.length > 0 ? cards.length : 1;
  const currentCard = cards[currentIndex] || {
    question: "What key concepts are documented in your study materials?",
    answer: "Click 'Generate 3D Flashcards' to extract 100% document-grounded flashcards.",
    topic: "General Study Material"
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center space-x-2 text-black dark:text-white font-bold text-xs uppercase tracking-wider mb-1">
            <Zap className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>SM-2 Spaced Repetition Flashcards OS</span>
          </div>
          <h1 className="text-xl font-bold">Document Flashcards</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Rate card recall difficulty to optimize SM-2 memory scheduling algorithms.
          </p>
        </div>

        <button
          onClick={handleGenerateCards}
          disabled={isGenerating}
          className="px-4 py-2 bg-black text-white dark:bg-white dark:text-black hover:opacity-90 rounded-xl text-xs font-bold shadow-md flex items-center space-x-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating...' : 'Generate 3D Flashcards'}</span>
        </button>
      </div>

      {/* 3D Flashcard Deck Container */}
      <div className="perspective-1000 py-4">
        <div
          onClick={() => setIsFlipped(!isFlipped)}
          className={`w-full min-h-[320px] rounded-3xl border border-zinc-300 dark:border-zinc-800 shadow-2xl p-8 cursor-pointer preserve-3d transition-transform duration-700 relative glass-panel ${
            isFlipped ? 'rotate-y-180 bg-zinc-950 text-white dark:bg-white dark:text-black' : 'bg-white text-black dark:bg-zinc-950 dark:text-white'
          }`}
        >
          {/* FRONT SIDE */}
          <div className={`w-full h-full flex flex-col justify-between space-y-6 ${isFlipped ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                #{currentCard.topic}
              </span>
              <div className="flex items-center space-x-2">
                {cardIntervals[currentIndex] && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{cardIntervals[currentIndex]}</span>
                  </span>
                )}
                <span className="text-xs font-mono font-bold text-zinc-400">
                  Card {currentIndex + 1} of {cards.length || 1}
                </span>
              </div>
            </div>

            <div className="text-center py-8 space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">QUESTION</span>
              <h2 className="text-lg md:text-xl font-bold leading-relaxed max-w-2xl mx-auto">
                {currentCard.question}
              </h2>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs text-zinc-400 font-semibold">
              <RotateCw className="w-4 h-4 animate-spin-slow" />
              <span>Click card to flip in 3D</span>
            </div>
          </div>

          {/* BACK SIDE (Rotated 180deg) */}
          <div className={`w-full h-full flex flex-col justify-between space-y-6 absolute inset-0 p-8 rotate-y-180 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400">
                ✓ Document Excerpt & Answer
              </span>
              <span className="text-xs font-mono font-bold opacity-60">
                Card {currentIndex + 1} of {cards.length || 1}
              </span>
            </div>

            <div className="py-4 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">EXCERPT</span>
              <p className="text-sm md:text-base leading-relaxed font-mono whitespace-pre-wrap">
                {currentCard.answer}
              </p>
            </div>

            <div className="flex items-center justify-center space-x-2 text-xs opacity-60 font-semibold">
              <Brain className="w-4 h-4" />
              <span>Rate recall difficulty below to schedule memory interval</span>
            </div>
          </div>
        </div>
      </div>

      {/* SM-2 Spaced Repetition Rating Buttons */}
      <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-center space-x-1">
          <Brain className="w-3.5 h-3.5 text-amber-500" />
          <span>SM-2 Memory Rating Controls:</span>
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            onClick={() => handleRateCard('again')}
            className="py-2.5 px-3 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-xs font-bold hover:bg-red-500/20 transition-all flex flex-col items-center"
          >
            <span>Again</span>
            <span className="text-[9px] font-mono opacity-75">1 Day</span>
          </button>

          <button
            onClick={() => handleRateCard('hard')}
            className="py-2.5 px-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 transition-all flex flex-col items-center"
          >
            <span>Hard</span>
            <span className="text-[9px] font-mono opacity-75">2 Days</span>
          </button>

          <button
            onClick={() => handleRateCard('good')}
            className="py-2.5 px-3 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs font-bold hover:bg-blue-500/20 transition-all flex flex-col items-center"
          >
            <span>Good</span>
            <span className="text-[9px] font-mono opacity-75">4 Days</span>
          </button>

          <button
            onClick={() => handleRateCard('easy')}
            className="py-2.5 px-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold hover:bg-emerald-500/20 transition-all flex flex-col items-center"
          >
            <span>Easy</span>
            <span className="text-[9px] font-mono opacity-75">7 Days</span>
          </button>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between text-xs font-bold">
        <button
          onClick={handlePrev}
          className="px-4 py-2 rounded-xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-colors flex items-center space-x-1.5 shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Card</span>
        </button>

        <button
          onClick={handleNext}
          className="px-4 py-2 rounded-xl bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-colors flex items-center space-x-1.5 shadow-md"
        >
          <span>Next Card</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
