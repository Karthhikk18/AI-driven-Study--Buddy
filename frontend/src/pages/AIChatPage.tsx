import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { chatApi, agentApi } from '../services/api';
import { Send, Sparkles, BookOpen, Zap, Brain, FileText, Loader2, User, Bot } from 'lucide-react';
import { VoiceInputButton } from '../components/VoiceInputButton';

export const AIChatPage: React.FC = () => {
  const { selectedSubject } = useStore();
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('Intermediate');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = (text || input).trim();
    if (!query || isLoading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setIsLoading(true);
    try {
      const res = await chatApi.sendQuery(selectedSubject?.id || 1, query, mode);
      const answerText = res.data?.response || res.data?.answer || 'I could not find an answer in your notes.';
      setMessages((prev) => [...prev, { role: 'ai', content: answerText, sources: res.data?.sources || [] }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', content: '⚠️ Could not connect to Buddy AI. Please check the backend server.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: '📋 Summarize all materials', query: 'Summarize all uploaded study materials' },
    { label: '💡 Key Takeaways', query: 'What are the key takeaways from my documents?' },
    { label: '📝 Action Items', query: 'Extract all action items and study tasks' },
    { label: '🔍 Simplify for Beginner', query: 'Explain the core concepts in simple terms' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-56px)] text-black dark:text-white">
      {/* Chat Header */}
      <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-black dark:text-white">Buddy AI Chat</h2>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">100% grounded in your uploaded study materials</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">Mode:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs rounded-xl px-2 py-1 outline-none font-bold"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center space-x-2 overflow-x-auto">
        {quickPrompts.map((p) => (
          <button
            key={p.query}
            onClick={() => handleSend(p.query)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-black border border-zinc-300 dark:border-zinc-700 text-[11px] font-bold text-black dark:text-white hover:border-black dark:hover:border-white transition-all"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-black">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
            <div className="w-16 h-16 rounded-3xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center shadow-xl">
              <Sparkles className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-extrabold text-black dark:text-white">Ask Buddy AI Anything</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold max-w-xs">
              Type your question or use the mic button to speak. Answers are grounded 100% in your uploaded study materials.
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] space-y-1 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
              <div className={`flex items-center space-x-1.5 text-[10px] font-bold ${msg.role === 'user' ? 'text-zinc-500 flex-row-reverse space-x-reverse' : 'text-zinc-500'}`}>
                {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3 text-amber-500" />}
                <span>{msg.role === 'user' ? 'You' : 'Buddy AI'}</span>
              </div>
              <div className={`px-4 py-3 rounded-2xl text-xs leading-relaxed font-semibold whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-black text-white dark:bg-white dark:text-black rounded-tr-sm shadow-md'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-black dark:text-white border border-zinc-200 dark:border-zinc-800 rounded-tl-sm'
              }`}>
                {msg.content}
              </div>
              {msg.sources && msg.sources.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {msg.sources.slice(0, 3).map((src: string, si: number) => (
                    <span key={si} className="px-2 py-0.5 rounded text-[9px] bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold flex items-center space-x-1">
                      <FileText className="w-2.5 h-2.5" />
                      <span>{src}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center space-x-2">
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              <span className="text-xs font-bold text-zinc-500">Buddy AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center space-x-2">
          <VoiceInputButton onTranscript={(text) => { setInput(text); handleSend(text); }} />

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Buddy AI about your study materials... or use mic 🎙"
            className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white text-xs rounded-2xl px-4 py-2.5 outline-none font-semibold placeholder:text-zinc-400 focus:border-black dark:focus:border-white transition-colors"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-black text-white dark:bg-white dark:text-black rounded-xl hover:scale-105 transition-all disabled:opacity-40 shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
