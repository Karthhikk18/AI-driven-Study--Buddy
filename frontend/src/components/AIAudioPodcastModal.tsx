import React, { useState, useEffect } from 'react';
import { Volume2, Play, Pause, RotateCcw, X, Radio, Sparkles, FastForward } from 'lucide-react';

interface AIAudioPodcastModalProps {
  title: string;
  text: string;
  onClose: () => void;
}

export const AIAudioPodcastModal: React.FC<AIAudioPodcastModalProps> = ({ title, text, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [speechUtterance, setSpeechUtterance] = useState<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[#*`_~]/g, '').slice(0, 2000);
      const utterance = new SpeechSynthesisUtterance(
        `Welcome to your AI Study Buddy Audio Podcast for ${title}. Here is your executive summary overview. ${cleanText}`
      );
      utterance.rate = playbackRate;
      utterance.onend = () => setIsPlaying(false);
      setSpeechUtterance(utterance);
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text, title]);

  const handlePlayPause = () => {
    if (!('speechSynthesis' in window) || !speechUtterance) return;

    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else {
        speechUtterance.rate = playbackRate;
        window.speechSynthesis.speak(speechUtterance);
      }
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
    }
  };

  const handleSpeedChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      if (speechUtterance) {
        speechUtterance.rate = newRate;
        if (isPlaying) {
          window.speechSynthesis.speak(speechUtterance);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative text-black dark:text-white p-6 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-2xl bg-black text-white dark:bg-white dark:text-black flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 animate-pulse text-amber-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-black dark:text-white">AI Study Podcast Episode</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold truncate max-w-[260px]">{title}</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Animated Equalizer Waveform Bars */}
        <div className="bg-zinc-900 text-white dark:bg-zinc-900/80 p-6 rounded-2xl border border-zinc-800 flex flex-col items-center justify-center space-y-4 shadow-inner">
          <div className="flex items-center justify-center space-x-1.5 h-12">
            {[40, 75, 55, 90, 60, 80, 45, 95, 70, 50, 85, 65, 90, 40].map((h, i) => (
              <div
                key={i}
                className={`w-1.5 bg-amber-400 rounded-full transition-all duration-300 ${
                  isPlaying ? 'animate-bounce' : 'opacity-40'
                }`}
                style={{ height: isPlaying ? `${h}%` : '20%', animationDelay: `${i * 0.1}s` }}
              />
            ))}
          </div>

          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 flex items-center justify-center space-x-1">
              <Sparkles className="w-3 h-3" />
              <span>{isPlaying ? 'NOW PLAYING PODCAST' : 'PAUSED'}</span>
            </span>
            <p className="text-xs font-bold truncate max-w-xs">{title}</p>
          </div>
        </div>

        {/* Player Controls */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center space-x-2 text-xs font-bold">
            <FastForward className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-500">Speed:</span>
            {[1.0, 1.25, 1.5, 2.0].map((rate) => (
              <button
                key={rate}
                onClick={() => handleSpeedChange(rate)}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  playbackRate === rate
                    ? 'bg-black text-white dark:bg-white dark:text-black shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                {rate}x
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="p-2.5 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
              title="Reset Podcast"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-4 rounded-full bg-black text-white dark:bg-white dark:text-black hover:scale-105 shadow-xl transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
          </div>
        </div>

        {/* Scrollable Transcript */}
        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 max-h-36 overflow-y-auto text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 font-mono">
          <strong className="text-black dark:text-white font-bold block mb-1">Transcript Preview:</strong>
          {text}
        </div>

      </div>
    </div>
  );
};
