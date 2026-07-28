import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { quizApi } from '../services/api';
import { Award, ArrowRight, Loader2, Sparkles } from 'lucide-react';

export const QuizPage: React.FC = () => {
  const { selectedSubject, subjects } = useStore();
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [quiz, setQuiz] = useState<any>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const activeSubjectId = selectedSubject?.id || (subjects.length > 0 ? subjects[0].id : 1);

  const handleGenerate = async () => {
    setLoading(true);
    setQuiz(null);
    setResult(null);
    setUserAnswers([]);

    try {
      const res = await quizApi.generateQuiz(activeSubjectId, difficulty);
      setQuiz(res.data);
      setUserAnswers(new Array(res.data.questions?.length || 0).fill(-1));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optionIndex: number) => {
    const updated = [...userAnswers];
    updated[qIndex] = optionIndex;
    setUserAnswers(updated);
  };

  const handleSubmit = async () => {
    if (!quiz) return;
    try {
      const res = await quizApi.submitAnswers(quiz.id, userAnswers);
      setResult(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Adaptive Practice Assessment</h1>
          <p className="text-xs text-notion-lightMuted dark:text-notion-darkMuted">
            AI-generated exam questions based on your course documents. Mistake logs are automatically tracked into your Student Learning Memory.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={difficulty}
            onChange={(e: any) => setDifficulty(e.target.value)}
            className="bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder rounded-xl px-3 py-2 text-xs font-semibold outline-none"
          >
            <option value="Easy">Easy Level</option>
            <option value="Medium">Medium Level</option>
            <option value="Hard">Hard Exam Level</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center space-x-2 bg-notion-accent hover:bg-notion-accentHover text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-md disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? 'Generating...' : 'Start Assessment'}</span>
          </button>
        </div>
      </div>

      {!quiz && !result && (
        <div className="text-center py-16 bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder rounded-2xl p-8 space-y-3">
          <Sparkles className="w-10 h-10 text-notion-accent mx-auto" />
          <h3 className="text-base font-semibold">Ready for Practice Assessment</h3>
          <p className="text-xs text-notion-lightMuted dark:text-notion-darkMuted max-w-md mx-auto mb-3">
            Select your difficulty level and click "Start Assessment" to generate a personalized practice test from your notes.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-4 py-2 bg-notion-accent text-white text-xs font-semibold rounded-xl"
          >
            {loading ? 'Generating Assessment...' : 'Start Assessment Now'}
          </button>
        </div>
      )}

      {/* Quiz Body */}
      {quiz && !result && (
        <div className="space-y-6 bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder rounded-2xl p-6">
          <div className="flex items-center justify-between border-b border-notion-lightBorder dark:border-notion-darkBorder pb-4">
            <h2 className="text-base font-bold">{quiz.title}</h2>
            <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-notion-accent font-semibold uppercase">
              {quiz.difficulty}
            </span>
          </div>

          <div className="space-y-6">
            {quiz.questions?.map((q: any, qIdx: number) => (
              <div key={qIdx} className="space-y-3 p-4 bg-notion-lightBg dark:bg-notion-darkBg rounded-xl border border-notion-lightBorder dark:border-notion-darkBorder">
                <p className="text-xs font-semibold text-notion-lightText dark:text-notion-darkText">
                  {qIdx + 1}. {q.question}
                </p>

                <div className="space-y-2">
                  {q.options?.map((opt: string, optIdx: number) => {
                    const isSelected = userAnswers[qIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectAnswer(qIdx, optIdx)}
                        className={`w-full text-left p-3 rounded-lg text-xs transition-all border ${
                          isSelected
                            ? 'bg-notion-accent text-white border-notion-accent font-medium shadow-sm'
                            : 'bg-notion-lightSurface dark:bg-notion-darkSurface border-notion-lightBorder dark:border-notion-darkBorder hover:border-notion-accent'
                        }`}
                      >
                        <span className="font-bold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-notion-lightBorder dark:border-notion-darkBorder flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-md flex items-center space-x-2"
            >
              <span>Submit & Evaluate</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div className="bg-notion-lightSurface dark:bg-notion-darkSurface border border-notion-lightBorder dark:border-notion-darkBorder rounded-2xl p-8 text-center space-y-4 shadow-xl">
          <Award className="w-14 h-14 text-amber-400 mx-auto" />
          <h2 className="text-2xl font-bold">Assessment Results</h2>
          <div className="text-4xl font-extrabold text-notion-accent">{result.score}%</div>
          <p className="text-xs text-notion-lightMuted dark:text-notion-darkMuted">
            You scored {result.correct_count} out of {result.total_questions} questions correctly. Any incorrect answers have been saved to your Student Memory log.
          </p>
          <button
            onClick={handleGenerate}
            className="px-6 py-2.5 bg-notion-accent text-white text-xs font-semibold rounded-xl shadow-md"
          >
            Take Another Assessment
          </button>
        </div>
      )}
    </div>
  );
};
