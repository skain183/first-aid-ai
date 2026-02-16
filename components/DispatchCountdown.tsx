
import React, { useEffect, useState } from 'react';
import { Siren, X, Phone, ShieldAlert } from 'lucide-react';

interface DispatchCountdownProps {
  onConfirm: () => void;
  onCancel: () => void;
  severity: string;
}

export const DispatchCountdown: React.FC<DispatchCountdownProps> = ({ onConfirm, onCancel, severity }) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onConfirm]);

  const progress = (timeLeft / 10) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-red-900/95 backdrop-blur-xl text-white p-6 animate-fade-in">
      {/* Background Pulse Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/30 rounded-full animate-ping duration-[2s]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center space-y-8">
        
        {/* Icon & Title */}
        <div className="space-y-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <Siren className="w-12 h-12 text-red-600" />
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight">Emergency Dispatch</h2>
            <p className="text-white/80 font-bold mt-1 text-lg">{severity} Condition Detected</p>
          </div>
        </div>

        {/* Timer UI */}
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="white"
              strokeWidth="8"
              strokeDasharray="553"
              strokeDashoffset={553 - (553 * progress) / 100}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-6xl font-black font-mono tabular-nums">{timeLeft}</span>
            <span className="text-xs font-bold uppercase tracking-widest mt-1">Seconds</span>
          </div>
        </div>

        <div className="text-sm font-medium bg-black/20 px-4 py-2 rounded-lg border border-white/10">
          Contacting Emergency Services Automatically
        </div>

        {/* Cancel Action */}
        <button 
          onClick={onCancel}
          className="w-full py-5 bg-white text-red-600 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg hover:bg-slate-100"
        >
          <X className="w-6 h-6" />
          CANCEL DISPATCH
        </button>
        
        <p className="text-xs text-white/60 font-medium max-w-xs">
          Press cancel immediately if this is a false alarm or simulation.
        </p>
      </div>
    </div>
  );
};
