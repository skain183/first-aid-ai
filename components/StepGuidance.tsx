
import React, { useState, useEffect } from 'react';
import { InjuryReport } from '../types';
import { ChevronRight, ChevronLeft, Volume2, VolumeX, CheckCircle, Home, HelpCircle, ThumbsUp, ThumbsDown, Loader2, Sparkles } from 'lucide-react';
import { getAlternativesForStep } from '../services/gemini';

interface StepGuidanceProps {
  report: InjuryReport;
  onExit: () => void;
}

export const StepGuidance: React.FC<StepGuidanceProps> = ({ report, onExit }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [speaking, setSpeaking] = useState(false);
  const [alternative, setAlternative] = useState<string | null>(null);
  const [loadingAlt, setLoadingAlt] = useState(false);
  const [feedback, setFeedback] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    speakText(report.steps[0]);
    return () => cancelSpeech();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Reset state for new step
    setAlternative(null);
    setFeedback(null);
    speakText(report.steps[currentStep]);
  }, [currentStep, report.steps]);

  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const cancelSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  const toggleSpeech = () => {
    if (speaking) {
      cancelSpeech();
    } else {
      const textToSpeak = alternative ? `${report.steps[currentStep]}. Alternative: ${alternative}` : report.steps[currentStep];
      speakText(textToSpeak);
    }
  };

  const handleNeedHelp = async () => {
    setLoadingAlt(true);
    const altText = await getAlternativesForStep(report.injury_type, report.steps[currentStep]);
    setAlternative(altText);
    setLoadingAlt(false);
    speakText(`Alternative suggestion: ${altText}`);
  };

  const nextStep = () => {
    if (currentStep < report.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const progress = ((currentStep + 1) / report.steps.length) * 100;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
        <button onClick={onExit} className="p-2 hover:bg-slate-200 rounded-full">
          <Home className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex flex-col items-center">
          <span className="font-bold text-slate-700 text-sm">First Aid Guide</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{report.injury_type}</span>
        </div>
        <div className="w-9"></div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-100">
        <div 
          className="h-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <div className="flex-1 flex flex-col justify-center space-y-6">
          <div>
            <span className="text-xs font-bold text-blue-600 mb-2 uppercase tracking-widest block">
              Step {currentStep + 1} of {report.steps.length}
            </span>
            <h2 className="text-2xl font-bold text-slate-800 leading-tight">
              {report.steps[currentStep]}
            </h2>
          </div>
          
          {/* Feedback Question */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-sm font-semibold text-slate-600 mb-3 text-center">Is this method successful or helpful?</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={() => setFeedback('yes')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  feedback === 'yes' ? 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-100' : 'bg-white border-slate-200 text-slate-400 hover:border-green-200 hover:text-green-500'
                }`}
              >
                <ThumbsUp className="w-5 h-5" />
                <span className="font-bold text-sm">Yes</span>
              </button>
              <button 
                onClick={() => {
                  setFeedback('no');
                  if (!alternative) handleNeedHelp();
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all ${
                  feedback === 'no' ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100' : 'bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-500'
                }`}
              >
                <ThumbsDown className="w-5 h-5" />
                <span className="font-bold text-sm">No / Unclear</span>
              </button>
            </div>
          </div>

          {/* Alternatives/Help Area */}
          <div className="min-h-[100px]">
            {loadingAlt ? (
              <div className="flex flex-col items-center justify-center p-6 text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin" />
                <p className="text-xs font-medium uppercase tracking-wider">Asking AI for alternatives...</p>
              </div>
            ) : alternative ? (
              <div className="bg-amber-50 p-5 rounded-2xl border border-amber-100 animate-fade-in-up">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-amber-800 text-xs uppercase tracking-widest">AI Alternative</h3>
                </div>
                <p className="text-amber-900 text-sm leading-relaxed">
                  {alternative}
                </p>
              </div>
            ) : (
              <button 
                onClick={handleNeedHelp}
                className="w-full py-4 px-6 border-2 border-dashed border-slate-200 rounded-2xl flex items-center justify-center gap-3 text-slate-400 hover:border-blue-300 hover:text-blue-500 transition-all active:scale-[0.98]"
              >
                <HelpCircle className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-bold">Missing Equipment?</p>
                  <p className="text-[10px] uppercase font-bold opacity-60">Find household alternatives</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="p-6 border-t border-slate-100 bg-white">
        <div className="flex items-center justify-between gap-4 mb-6">
           <button 
             onClick={toggleSpeech}
             className={`p-4 rounded-full transition-all active:scale-90 ${
               speaking ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'
             }`}
           >
             {speaking ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
           </button>
           
           <div className="flex gap-2 flex-1 justify-end">
             <button 
               onClick={prevStep}
               disabled={currentStep === 0}
               className="p-4 rounded-full bg-slate-100 text-slate-600 disabled:opacity-30 active:scale-90 transition-transform"
             >
               <ChevronLeft className="w-6 h-6" />
             </button>
             <button 
               onClick={nextStep}
               disabled={currentStep === report.steps.length - 1}
               className="flex-1 max-w-[160px] py-4 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 transition-transform disabled:bg-slate-200 disabled:shadow-none"
             >
               {currentStep === report.steps.length - 1 ? (
                 <>Finish <CheckCircle className="w-5 h-5" /></>
               ) : (
                 <>Next Step <ChevronRight className="w-5 h-5" /></>
               )}
             </button>
           </div>
        </div>
        
        {currentStep === report.steps.length - 1 && (
           <button 
             onClick={onExit}
             className="w-full py-4 border-2 border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 active:scale-[0.98] transition-all"
           >
             Complete Session
           </button>
        )}
      </div>

      <style>{`
        .animate-fade-in-up {
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
