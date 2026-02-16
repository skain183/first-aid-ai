
import React, { useEffect, useState, useRef } from 'react';
import { InjuryReport, DispatchReport, LocationData } from '../types';
import { Phone, CheckCircle, Radio, MapPin, Send, MessageSquare, Mic, Volume2, Shield } from 'lucide-react';
import { saveDispatchLog, getUserProfile } from '../services/storage';

interface DispatchSimulationProps {
  report: InjuryReport;
  userLocation: LocationData | null;
  onComplete: () => void;
  onCancel: () => void;
  dispatchMeta: {
    type: 'ai_auto_triggered' | 'user_manual_triggered' | 'ai_recommended_user_confirmed';
    source: 'injury_care' | 'symptom_care' | 'live_chat' | 'manual_button';
  };
}

type CallState = 'DIALING' | 'CONNECTED' | 'TRANSMITTING' | 'COMPLETED';

export const DispatchSimulation: React.FC<DispatchSimulationProps> = ({ report, userLocation, onComplete, onCancel, dispatchMeta }) => {
  const [callState, setCallState] = useState<CallState>('DIALING');
  const [scriptProgress, setScriptProgress] = useState(0);
  const logSavedRef = useRef(false);

  // Load profile for number
  const userProfile = getUserProfile();
  const EMERGENCY_NUMBER = userProfile?.emergency_contact.number || "911"; 
  const CLEAN_NUMBER = EMERGENCY_NUMBER.replace(/[^0-9]/g, '');

  const generateScript = () => {
    const locString = userLocation ? `at ${userLocation.address}` : "Location pending";
    
    return `Automated Emergency Dispatch. 
    Priority 1 Medical Incident reported. 
    Location: ${locString}.
    Injury detected: ${report.injury_type}, severity level ${report.severity}. 
    Patient Vitals: Conscious ${report.conscious ? 'Positive' : 'Negative'}, Breathing ${report.breathing}. 
    Immediate medical unit required.`;
  };

  const generateWhatsAppMessage = () => {
    const locString = userLocation 
      ? `\n*Location:* ${userLocation.address}\n*Maps:* https://maps.google.com/?q=${userLocation.latitude},${userLocation.longitude}` 
      : `\n*Location:* Detecting...`;

    const text = `🚨 *EMERGENCY DISPATCH ALERT* 🚨
    
*Priority:* ${report.severity}
*Injury:* ${report.injury_type}
${locString}

*Patient Status:*
- Conscious: ${report.conscious ? 'Yes' : 'No'}
- Breathing: ${report.breathing}
- Bleeding: ${report.bleeding}

*System Analysis:* ${report.notes}
*Action:* ${report.recommended_response}

_Automated Dispatch System_`;
    return encodeURIComponent(text);
  };

  const handleRealCall = () => {
    window.open(`tel:${EMERGENCY_NUMBER}`);
  };

  const handleWhatsAppDispatch = () => {
    window.open(`https://wa.me/${CLEAN_NUMBER}?text=${generateWhatsAppMessage()}`, '_blank');
  };

  const handleLogDispatch = (status: 'executed' | 'canceled') => {
    if (logSavedRef.current && status === 'executed') return; 
    if (logSavedRef.current) return;

    const dispatchReport: DispatchReport = {
      dispatch_id: `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: userProfile?.user_id || "unknown",
      timestamp: new Date().toISOString(),
      trigger_type: dispatchMeta.type,
      trigger_source: dispatchMeta.source,
      dispatch_method: 'voice_simulation',
      dispatch_target: EMERGENCY_NUMBER,
      risk_level: report.risk_level,
      severity: report.severity,
      reason_for_dispatch: report.injury_type,
      ai_decision_summary: `System identified ${report.severity} severity. Automated protocol initiated.`,
      patient_status: {
        conscious: report.conscious,
        breathing: report.breathing,
        bleeding: report.bleeding,
        pain_level: "Unknown"
      },
      location: userLocation || {
        latitude: 0, longitude: 0, accuracy: 0, address: "Unknown", 
        city: "Unknown", country: "Unknown", timestamp: new Date().toISOString(), source: 'Manual'
      },
      dispatch_status: status === 'executed' ? 'executed' : 'canceled',
      user_canceled: status === 'canceled',
      cancellation_reason: status === 'canceled' ? 'User cancelled dispatch request' : null,
      system_tag: "Emergency Dispatch Record"
    };

    saveDispatchLog(dispatchReport);
    logSavedRef.current = true;
  };

  useEffect(() => {
    let ttsUtterance: SpeechSynthesisUtterance | null = null;

    const startSequence = async () => {
      // Step 1: Dialing
      await new Promise(r => setTimeout(r, 2000));
      setCallState('CONNECTED');

      // Step 2: Play Audio Script
      if ('speechSynthesis' in window) {
        const script = generateScript();
        ttsUtterance = new SpeechSynthesisUtterance(script);
        ttsUtterance.rate = 1.0;
        ttsUtterance.pitch = 1.0;
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google')) || voices[0];
        if (preferredVoice) ttsUtterance.voice = preferredVoice;

        ttsUtterance.onstart = () => {
          setCallState('TRANSMITTING');
          const duration = script.length * 50; 
          const interval = 100;
          let elapsed = 0;
          const progressTimer = setInterval(() => {
            elapsed += interval;
            setScriptProgress(Math.min(100, (elapsed / duration) * 100));
            if (elapsed >= duration) clearInterval(progressTimer);
          }, interval);
        };

        ttsUtterance.onend = () => {
          setCallState('COMPLETED');
          handleLogDispatch('executed'); 
        };

        window.speechSynthesis.speak(ttsUtterance);
      } else {
        // Fallback
        setTimeout(() => {
          setCallState('COMPLETED');
          handleLogDispatch('executed');
        }, 5000);
      }
    };

    startSequence();

    return () => {
      if (ttsUtterance) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900 text-white z-50 flex flex-col font-sans">
      
      {/* Status Bar */}
      <div className="bg-slate-800 p-4 pt-12 flex justify-between items-center shadow-md z-20">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-red-500" />
          <span className="font-bold tracking-wide uppercase text-sm">Emergency Dispatch</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono text-slate-400">SECURE CHANNEL</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Background Pulse */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
           <div className="w-[600px] h-[600px] border border-red-500 rounded-full animate-ping duration-[3s]"></div>
           <div className="w-[400px] h-[400px] border border-red-500 rounded-full animate-ping duration-[3s] delay-700 absolute"></div>
        </div>

        {/* Main Interface */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 space-y-8">
          
          {/* Connection Status */}
          <div className="text-center space-y-6">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-all duration-700 ${
              callState === 'DIALING' ? 'bg-slate-800 ring-4 ring-slate-700 animate-pulse' :
              callState === 'CONNECTED' || callState === 'TRANSMITTING' ? 'bg-red-600 ring-4 ring-red-900 shadow-[0_0_50px_rgba(220,38,38,0.4)]' :
              'bg-green-600 ring-4 ring-green-900 shadow-[0_0_50px_rgba(22,163,74,0.4)]'
            }`}>
              {callState === 'DIALING' && <Phone className="w-12 h-12 text-slate-400" />}
              {(callState === 'CONNECTED' || callState === 'TRANSMITTING') && <Volume2 className="w-12 h-12 text-white animate-pulse" />}
              {callState === 'COMPLETED' && <CheckCircle className="w-12 h-12 text-white" />}
            </div>
            
            <div>
              <h2 className="text-3xl font-black tracking-tight">{EMERGENCY_NUMBER}</h2>
              <p className={`text-xs font-bold uppercase tracking-[0.2em] mt-3 ${
                callState === 'DIALING' ? 'text-slate-400' : 
                callState === 'COMPLETED' ? 'text-green-400' : 'text-red-400'
              }`}>
                {callState === 'DIALING' && "Establishing Connection..."}
                {callState === 'CONNECTED' && "Channel Open"}
                {callState === 'TRANSMITTING' && "Transmitting Incident Data"}
                {callState === 'COMPLETED' && "Dispatch Confirmed"}
              </p>
            </div>
          </div>

          {/* Active Data Stream View */}
          <div className="w-full max-w-sm bg-slate-800/50 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
            <div className="bg-black/20 p-3 flex justify-between items-center border-b border-white/5">
               <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2">
                 <Send className="w-3 h-3" /> Packet Stream
               </span>
               <div className="flex gap-1">
                 {[...Array(3)].map((_, i) => (
                   <div key={i} className={`w-1.5 h-1.5 rounded-full ${callState === 'DIALING' ? 'bg-slate-600' : 'bg-green-500 animate-pulse'}`} style={{ animationDelay: `${i * 0.2}s` }}></div>
                 ))}
               </div>
            </div>
            <div className="p-4 space-y-3">
               <div className="flex justify-between items-start">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-red-500/20 rounded-lg">
                     <Shield className="w-4 h-4 text-red-500" />
                   </div>
                   <div>
                     <p className="text-xs text-slate-400 font-bold uppercase">Incident Type</p>
                     <p className="text-sm font-semibold text-white">{report.injury_type}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <p className="text-xs text-slate-400 font-bold uppercase">Priority</p>
                   <p className="text-sm font-bold text-red-400">{report.severity}</p>
                 </div>
               </div>
               
               <div className="h-px bg-white/10 w-full"></div>

               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-500/20 rounded-lg">
                   <MapPin className="w-4 h-4 text-blue-400" />
                 </div>
                 <div className="min-w-0">
                   <p className="text-xs text-slate-400 font-bold uppercase">Location Data</p>
                   <p className="text-xs text-white truncate">{userLocation ? userLocation.address : "Acquiring coordinates..."}</p>
                 </div>
               </div>
            </div>
          </div>

          {/* Actions */}
          {(callState === 'TRANSMITTING' || callState === 'COMPLETED') && (
            <div className="w-full max-w-sm grid grid-cols-2 gap-3 animate-fade-in-up">
              <button 
                onClick={handleRealCall}
                className="bg-white hover:bg-slate-100 text-slate-900 py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Phone className="w-5 h-5" />
                Voice Call
              </button>
              <button 
                onClick={handleWhatsAppDispatch}
                className="bg-green-600 hover:bg-green-500 text-white py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <MessageSquare className="w-5 h-5" />
                Send Data
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Footer */}
      <div className="p-6 bg-slate-900 border-t border-slate-800">
        {callState === 'COMPLETED' ? (
          <button 
            onClick={onComplete}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2"
          >
            Start First Aid Protocol <Shield className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              handleLogDispatch('canceled');
              onCancel();
            }}
            className="w-full py-4 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 text-red-400 rounded-xl font-semibold transition-all"
          >
            Abort Dispatch
          </button>
        )}
      </div>
    </div>
  );
};
