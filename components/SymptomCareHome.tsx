
import React from 'react';
import { MessageSquare, Mic, ArrowLeft, HeartPulse, Info, Activity } from 'lucide-react';

interface SymptomCareHomeProps {
  onBack: () => void;
  onSelectText: () => void;
  onSelectLive: () => void;
}

export const SymptomCareHome: React.FC<SymptomCareHomeProps> = ({ onBack, onSelectText, onSelectLive }) => {
  return (
    <div className="flex-1 flex flex-col p-6 animate-fade-in bg-slate-50 h-full">
      <div className="mb-8 flex items-center gap-3">
        <button onClick={onBack} className="p-2 hover:bg-white bg-white/50 rounded-full text-slate-600 transition-colors shadow-sm">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">Medical Consultation</h2>
      </div>

      <div className="mb-8">
        <div className="w-16 h-16 bg-white border border-slate-100 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <Activity className="w-8 h-8 text-teal-600" />
        </div>
        <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Symptom Assessment</h3>
        <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
          Select a method to communicate your condition. Our AI medical system will assess urgency and provide care protocols.
        </p>
      </div>

      <div className="space-y-4">
        <button 
          onClick={onSelectText}
          className="w-full p-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-5 hover:border-teal-500 hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-teal-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-teal-100 group-hover:text-teal-600 transition-colors z-10 border border-slate-100">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="z-10">
            <h4 className="font-bold text-slate-800 text-lg">Text Assessment</h4>
            <p className="text-xs text-slate-500 mt-1">Describe symptoms in detail</p>
          </div>
        </button>

        <button 
          onClick={onSelectLive}
          className="w-full p-6 bg-white border border-slate-100 rounded-2xl flex items-center gap-5 hover:border-blue-500 hover:shadow-md transition-all text-left group relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-blue-50/50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors z-10 border border-slate-100">
            <Mic className="w-5 h-5" />
          </div>
          <div className="z-10">
            <h4 className="font-bold text-slate-800 text-lg">Voice Consultation</h4>
            <p className="text-xs text-slate-500 mt-1">Real-time AI voice interface</p>
          </div>
        </button>
      </div>

      <div className="mt-auto pt-8">
        <div className="p-4 bg-white border border-slate-200 rounded-xl flex gap-3 items-start shadow-sm">
          <Info className="w-5 h-5 text-slate-400 shrink-0" />
          <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
            This automated system identifies potential medical risks but does not replace a doctor. If you experience critical symptoms, contact emergency services immediately.
          </p>
        </div>
      </div>
    </div>
  );
};
