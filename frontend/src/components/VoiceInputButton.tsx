import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Zap, Volume2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({ onTranscript }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const current = Array.from(event.results)
          .map((r: any) => r[0].transcript)
          .join('');
        setTranscript(current);
        if (event.results[0].isFinal) {
          onTranscript(current);
          setIsListening(false);
          setTranscript('');
        }
      };

      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!isSupported || !recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setTranscript('');
    }
  };

  if (!isSupported) return null;

  return (
    <div className="relative flex items-center">
      {isListening && transcript && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-black text-white dark:bg-white dark:text-black text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-xl whitespace-nowrap max-w-[200px] truncate border border-zinc-800 dark:border-zinc-200">
          🎙 {transcript}
        </div>
      )}
      <button
        onClick={toggleListening}
        title={isListening ? 'Stop Listening' : 'Ask Buddy AI by Voice'}
        className={`p-2.5 rounded-xl transition-all ${
          isListening
            ? 'bg-red-500 text-white shadow-lg animate-pulse scale-110'
            : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black border border-zinc-200 dark:border-zinc-700'
        }`}
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>
    </div>
  );
};
