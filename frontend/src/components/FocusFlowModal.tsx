import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Timer, Music, MicOff, Maximize2, Zap, Flame, BarChart2, Coffee } from 'lucide-react';

interface FocusFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SoundMode = 'off' | 'brown' | 'rain' | 'white';
type FocusPhase = 'focus' | 'break';

// Web Audio API ambient sound generator — no external files needed
function createAmbientSound(ctx: AudioContext, mode: SoundMode): AudioNode | null {
  if (mode === 'off') return null;

  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  if (mode === 'white') {
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
  } else if (mode === 'brown') {
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
  } else if (mode === 'rain') {
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      data[i] = (Math.random() * 2 - 1) * 0.3;
      if (Math.random() < 0.001) {
        for (let j = 0; j < 200 && i + j < bufferSize; j++) {
          data[i + j] += Math.exp(-j * 0.05) * (Math.random() * 2 - 1) * 0.8;
        }
      }
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = mode === 'white' ? 0.04 : mode === 'brown' ? 0.15 : 0.12;

  // Low-pass filter for warmth
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = mode === 'rain' ? 3000 : 1200;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
  return source;
}

function playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType = 'sine') {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export const FocusFlowModal: React.FC<FocusFlowModalProps> = ({ isOpen, onClose }) => {
  const [phase, setPhase] = useState<FocusPhase>('focus');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [soundMode, setSoundMode] = useState<SoundMode>('brown');
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [flowScore, setFlowScore] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const [breathePhase, setBreathePhase] = useState<'in' | 'out'>('in');
  const [customMinutes, setCustomMinutes] = useState(25);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundNodeRef = useRef<AudioNode | null>(null);
  const intervalRef = useRef<any>(null);
  const breatheRef = useRef<any>(null);

  const PHASE_DURATIONS = { focus: customMinutes * 60, break: 5 * 60 };

  const stopSound = useCallback(() => {
    if (soundNodeRef.current && 'stop' in soundNodeRef.current) {
      try { (soundNodeRef.current as AudioBufferSourceNode).stop(); } catch {}
    }
    soundNodeRef.current = null;
  }, []);

  const startSound = useCallback((mode: SoundMode) => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    stopSound();
    if (mode !== 'off') {
      soundNodeRef.current = createAmbientSound(audioCtxRef.current, mode);
    }
  }, [stopSound]);

  useEffect(() => {
    if (!isOpen) {
      stopSound();
      clearInterval(intervalRef.current);
      clearInterval(breatheRef.current);
      setIsRunning(false);
      setSecondsLeft(25 * 60);
      setShowSummary(false);
      setFlowScore(0);
    } else {
      // Start breathing animation
      breatheRef.current = setInterval(() => {
        setBreathePhase((p) => p === 'in' ? 'out' : 'in');
      }, 4000);
    }
    return () => {
      clearInterval(breatheRef.current);
    };
  }, [isOpen, stopSound]);

  useEffect(() => {
    if (isRunning && soundMode !== 'off') {
      startSound(soundMode);
    } else if (!isRunning) {
      stopSound();
    }
  }, [isRunning, soundMode, startSound, stopSound]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            if (audioCtxRef.current) {
              if (phase === 'focus') {
                playTone(audioCtxRef.current, 523, 0.5);
                setTimeout(() => playTone(audioCtxRef.current!, 659, 0.5), 600);
                setTimeout(() => playTone(audioCtxRef.current!, 784, 0.8), 1200);
              } else {
                playTone(audioCtxRef.current, 392, 0.5);
              }
            }
            if (phase === 'focus') {
              setSessionsCompleted((c) => c + 1);
              setFlowScore((sc) => sc + Math.floor(customMinutes * 4));
              setPhase('break');
              setSecondsLeft(PHASE_DURATIONS.break);
            } else {
              setPhase('focus');
              setSecondsLeft(PHASE_DURATIONS.focus);
              setShowSummary(true);
            }
            return 0;
          }
          if (isRunning) setFlowScore((sc) => sc + 1);
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, customMinutes]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const progress = 1 - secondsLeft / PHASE_DURATIONS[phase];
  const circumference = 2 * Math.PI * 90;

  const handleClose = () => {
    setShowSummary(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden select-none">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-900/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-900/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-zinc-900/50 rounded-full blur-3xl" />
      </div>

      {/* Breathe orb (background) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ opacity: isRunning ? 0.15 : 0.05 }}
      >
        <div
          className="rounded-full bg-gradient-to-br from-violet-500 to-indigo-600"
          style={{
            width: breathePhase === 'in' ? '500px' : '350px',
            height: breathePhase === 'in' ? '500px' : '350px',
            transition: 'all 4s ease-in-out',
          }}
        />
      </div>

      {/* Top controls */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-violet-400" />
          </div>
          <span className="text-white font-extrabold text-sm">Focus Flow</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${phase === 'focus' ? 'bg-violet-500/30 text-violet-300' : 'bg-emerald-500/30 text-emerald-300'}`}>
            {phase === 'focus' ? '🧠 Deep Work' : '☕ Break Time'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sound selector */}
          <div className="flex items-center space-x-1 bg-white/10 rounded-xl p-1">
            {(['off', 'brown', 'rain', 'white'] as SoundMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSoundMode(m)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${soundMode === m ? 'bg-white text-black' : 'text-white/60 hover:text-white'}`}
              >
                {m === 'off' ? <MicOff className="w-3 h-3" /> : m === 'brown' ? '🔥' : m === 'rain' ? '🌧️' : '🌊'}
              </button>
            ))}
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Timer */}
      <div className="relative z-10 flex flex-col items-center space-y-8">
        {/* Circular progress ring */}
        <div className="relative" style={{ width: 220, height: 220 }}>
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r="90" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
            <circle
              cx="110" cy="110" r="90"
              fill="none"
              stroke={phase === 'focus' ? '#8b5cf6' : '#10b981'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${progress * circumference} ${circumference}`}
              style={{ transition: 'stroke-dasharray 1s linear' }}
            />
          </svg>

          {/* Time display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-black font-mono text-white tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest mt-1">
              {phase === 'focus' ? 'Focus Time' : 'Break Time'}
            </span>
          </div>
        </div>

        {/* Breathe indicator */}
        {isRunning && (
          <div className="text-center space-y-1">
            <p className="text-white/40 text-xs font-semibold tracking-widest uppercase">
              {breathePhase === 'in' ? '↑ Breathe In' : '↓ Breathe Out'}
            </p>
          </div>
        )}

        {/* Start / Pause */}
        <button
          onClick={() => setIsRunning(!isRunning)}
          className={`px-10 py-4 rounded-2xl text-sm font-extrabold transition-all shadow-2xl ${
            isRunning
              ? 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
              : 'bg-white text-black hover:scale-105'
          }`}
        >
          {isRunning ? '⏸ Pause Session' : '▶ Start Focus Session'}
        </button>

        {/* Duration picker (only when not running) */}
        {!isRunning && (
          <div className="flex items-center space-x-3">
            <span className="text-white/40 text-xs font-semibold">Duration:</span>
            {[15, 25, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => { setCustomMinutes(m); setSecondsLeft(m * 60); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${customMinutes === m ? 'bg-violet-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center space-x-6 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 text-amber-400">
              <Flame className="w-4 h-4" />
              <span className="text-lg font-black">{sessionsCompleted}</span>
            </div>
            <p className="text-[10px] text-white/40 font-semibold">Sessions</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="flex items-center justify-center space-x-1 text-violet-400">
              <BarChart2 className="w-4 h-4" />
              <span className="text-lg font-black">{flowScore}</span>
            </div>
            <p className="text-[10px] text-white/40 font-semibold">Flow Score</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div>
            <div className="flex items-center justify-center space-x-1 text-emerald-400">
              <Timer className="w-4 h-4" />
              <span className="text-lg font-black">{sessionsCompleted * customMinutes}m</span>
            </div>
            <p className="text-[10px] text-white/40 font-semibold">Total Focus</p>
          </div>
        </div>
      </div>

      {/* Session Summary Overlay */}
      {showSummary && (
        <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 max-w-sm w-full mx-4 text-center space-y-6">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white">Session Complete! 🎉</h3>
              <p className="text-sm text-zinc-400 mt-1">Great work staying focused.</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-800 rounded-2xl p-3">
                <p className="text-xl font-black text-amber-400">{sessionsCompleted}</p>
                <p className="text-[10px] text-zinc-500 font-semibold">Sessions</p>
              </div>
              <div className="bg-zinc-800 rounded-2xl p-3">
                <p className="text-xl font-black text-violet-400">{flowScore}</p>
                <p className="text-[10px] text-zinc-500 font-semibold">Flow XP</p>
              </div>
              <div className="bg-zinc-800 rounded-2xl p-3">
                <p className="text-xl font-black text-emerald-400">{sessionsCompleted * customMinutes}m</p>
                <p className="text-[10px] text-zinc-500 font-semibold">Total</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => { setShowSummary(false); setSecondsLeft(PHASE_DURATIONS.focus); setPhase('focus'); }}
                className="flex-1 py-3 bg-white text-black font-extrabold rounded-xl text-sm hover:opacity-90 transition"
              >
                New Session
              </button>
              <button
                onClick={() => { setShowSummary(false); onClose(); }}
                className="flex-1 py-3 bg-zinc-800 text-white font-extrabold rounded-xl text-sm hover:bg-zinc-700 transition"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
