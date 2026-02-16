
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob, FunctionDeclaration, Type } from '@google/genai';
import { Mic, MicOff, Volume2, VolumeX, X, HeartPulse, Activity, MessageSquare, Square, LogOut, Loader2, Siren, TriangleAlert, Ban } from 'lucide-react';
import { SymptomReport, DispatchReport } from '../types';
import { generateSymptomReportFromTranscript } from '../services/gemini';
import { saveDispatchLog } from '../services/storage';

interface SymptomLiveModeProps {
  onClose: () => void;
  onEmergencyTrigger: (reason: string) => void;
  onReportGenerated: (report: SymptomReport) => void;
}

// Audio Utils Implementation (from guidelines)
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const dispatchFunction: FunctionDeclaration = {
  name: 'triggerEmergencyDispatch',
  parameters: {
    type: Type.OBJECT,
    description: 'Triggers emergency ambulance dispatch based on critical symptoms detected during conversation.',
    properties: {
      reason: {
        type: Type.STRING,
        description: 'The critical reason for the dispatch (e.g., chest pain, difficulty breathing, stroke signs).',
      },
    },
    required: ['reason'],
  },
};

export const SymptomLiveMode: React.FC<SymptomLiveModeProps> = ({ onClose, onEmergencyTrigger, onReportGenerated }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Emergency Dispatch State
  const [emergencyCountdown, setEmergencyCountdown] = useState<number | null>(null);
  const [emergencyReason, setEmergencyReason] = useState<string | null>(null);
  const [pendingToolCall, setPendingToolCall] = useState<{id: string, name: string} | null>(null);
  
  // Transcription state
  const [currentTurnUser, setCurrentTurnUser] = useState('');
  const [currentTurnAI, setCurrentTurnAI] = useState('');
  
  const conversationHistoryRef = useRef<string>("");
  const audioContextsRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const sessionRef = useRef<any>(null);

  // Timer for Auto-Dispatch
  useEffect(() => {
    if (emergencyCountdown === null) return;

    if (emergencyCountdown <= 0) {
      handleConfirmDispatch();
      return;
    }

    const timer = setTimeout(() => {
      setEmergencyCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [emergencyCountdown]);

  const handleConfirmDispatch = () => {
    if (pendingToolCall && sessionRef.current) {
       sessionRef.current.then((s: any) => s.sendToolResponse({
          functionResponses: { id: pendingToolCall.id, name: pendingToolCall.name, response: { result: "Dispatch initiated." } }
       }));
    }
    
    // Log the event
    conversationHistoryRef.current += `\n[SYSTEM: EMERGENCY DISPATCH EXECUTED - Reason: ${emergencyReason}]`;

    onEmergencyTrigger(emergencyReason || "Critical Symptoms Detected");
    forceClose();
  };

  const handleCancelDispatch = () => {
    if (pendingToolCall && sessionRef.current) {
       sessionRef.current.then((s: any) => s.sendToolResponse({
          functionResponses: { 
            id: pendingToolCall.id, 
            name: pendingToolCall.name, 
            response: { 
              result: "User explicitly CANCELED the dispatch. User wants to continue monitoring. Acknowledge this calmly and continue assessment." 
            } 
          }
       }));
    }
    
    // Log cancellation locally to persistent storage
    const dispatchReport: DispatchReport = {
      dispatch_id: `disp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      user_id: "demo_user_123",
      timestamp: new Date().toISOString(),
      trigger_type: 'ai_auto_triggered',
      trigger_source: 'live_chat',
      dispatch_method: 'voice_simulation',
      dispatch_target: "Emergency Services",
      risk_level: "Critical",
      severity: "Critical",
      reason_for_dispatch: emergencyReason || "Critical Symptoms Detected",
      ai_decision_summary: "AI detected critical urgency during live conversation.",
      patient_status: {
        conscious: true,
        breathing: "Unknown",
        bleeding: "Unknown",
        pain_level: "Unknown"
      },
      location: {
        latitude: 24.7136,
        longitude: 46.6753,
        accuracy: 10,
        address: "GPS: 24.7136° N, 46.6753° E (Simulated)",
        city: "Riyadh",
        country: "Saudi Arabia",
        timestamp: new Date().toISOString(),
        source: 'Manual'
      },
      dispatch_status: 'canceled',
      user_canceled: true,
      cancellation_reason: 'User canceled auto-dispatch countdown',
      system_tag: "Emergency Dispatch Record"
    };
    saveDispatchLog(dispatchReport);

    // Log cancellation in transcript
    conversationHistoryRef.current += `\n[SYSTEM: EMERGENCY DISPATCH CANCELED BY USER - Monitoring continues]\n`;

    setEmergencyCountdown(null);
    setEmergencyReason(null);
    setPendingToolCall(null);
  };

  useEffect(() => {
    const startSession = async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextsRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: Blob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              setCurrentTurnUser(prev => prev + text);
            }
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setCurrentTurnAI(prev => prev + text);
            }
            
            // Turn Complete - Log to history
            if (message.serverContent?.turnComplete) {
              // We need to capture the state values at this moment
              setCurrentTurnUser(prev => {
                if (prev) conversationHistoryRef.current += `User: ${prev}\n`;
                return '';
              });
              setCurrentTurnAI(prev => {
                if (prev) conversationHistoryRef.current += `AI: ${prev}\n`;
                return '';
              });
            }

            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const outCtx = audioContextsRef.current!.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => {
                try { s.stop(); } catch(e) {}
              });
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }

            if (message.toolCall) {
              for (const fc of message.toolCall.functionCalls) {
                if (fc.name === 'triggerEmergencyDispatch') {
                  const reason = (fc.args as any).reason;
                  
                  // Pause normal flow and trigger Emergency UI
                  setEmergencyReason(reason);
                  setPendingToolCall({ id: fc.id, name: fc.name });
                  setEmergencyCountdown(15); // Start 15s countdown
                }
              }
            }
          },
          onclose: () => setIsActive(false),
          onerror: () => setIsActive(false),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } },
          systemInstruction: 'You are a supportive First Aid Symptom care assistant. Monitor the user for critical symptoms. If you detect: Chest pain, Difficulty breathing, Severe bleeding, Stroke signs, or Unconsciousness, you MUST immediately call the "triggerEmergencyDispatch" tool. Be decisive but calm.',
          tools: [{ functionDeclarations: [dispatchFunction] }],
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        }
      });

      sessionRef.current = sessionPromise;
    };

    startSession();
    return () => forceClose();
  }, []);

  const forceClose = () => {
    // Stop all audio sources first
    sourcesRef.current.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    sourcesRef.current.clear();

    if (sessionRef.current) {
      sessionRef.current.then((s: any) => {
        try {
          s.close();
        } catch(e) {
          console.warn("Session close failed", e);
        }
      });
    }

    if (audioContextsRef.current) {
      const { input, output } = audioContextsRef.current;
      
      // Check if context is already closed to avoid errors
      if (input.state !== 'closed') {
        input.close().catch(e => console.warn("Input audio context close error", e));
      }
      if (output.state !== 'closed') {
        output.close().catch(e => console.warn("Output audio context close error", e));
      }
    }
  };

  const handleEndSession = async () => {
    // 1. Stop audio and close connection
    forceClose();
    setIsActive(false);
    setIsGeneratingReport(true);

    // 2. Append any remaining buffer text to transcript
    if (currentTurnUser) conversationHistoryRef.current += `User: ${currentTurnUser}\n`;
    if (currentTurnAI) conversationHistoryRef.current += `AI: ${currentTurnAI}\n`;

    // 3. Generate Report
    try {
      const report = await generateSymptomReportFromTranscript(conversationHistoryRef.current);
      onReportGenerated(report);
    } catch (e) {
      console.error("Failed to generate report", e);
      // Fallback close
      onClose();
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isGeneratingReport) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col items-center justify-center p-6 text-white font-sans">
        <Loader2 className="w-16 h-16 text-teal-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold mb-2">Generating Medical Report</h2>
        <p className="text-slate-400">Analyzing conversation data & creating summary...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900 z-[60] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden">
      
      {/* EMERGENCY OVERLAY */}
      {emergencyCountdown !== null && (
        <div className="absolute inset-0 z-50 bg-red-600/95 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in">
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-2xl animate-pulse">
              <Siren className="w-12 h-12 text-red-600" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight text-white">Critical Alert</h2>
              <p className="text-white/90 font-medium text-lg">{emergencyReason}</p>
            </div>

            <div className="bg-black/20 rounded-2xl p-6 w-full border border-white/20">
              <p className="text-sm font-bold uppercase tracking-widest text-white/60 mb-2">Auto-Dispatch In</p>
              <div className="text-6xl font-black font-mono tabular-nums text-white">
                {emergencyCountdown}s
              </div>
            </div>

            <button 
              onClick={handleCancelDispatch}
              className="w-full py-5 bg-white text-red-600 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 text-lg"
            >
              <Ban className="w-6 h-6" />
              CANCEL DISPATCH
            </button>
            
            <p className="text-xs text-white/60 font-medium">Press cancel if this is a false alarm.</p>
          </div>
        </div>
      )}

      {/* Normal Close Button (Disabled during countdown) */}
      <button 
        onClick={handleEndSession} 
        disabled={emergencyCountdown !== null}
        className="absolute top-6 right-6 p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all z-20 disabled:opacity-0"
      >
        <X className="w-6 h-6" />
      </button>

      <div className="text-center space-y-8 max-w-sm w-full">
        <div className="relative">
          <div className={`w-32 h-32 rounded-full mx-auto flex items-center justify-center border-4 transition-all duration-700 ${
            isConnecting ? 'border-slate-700' : 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.3)]'
          }`}>
            {isConnecting ? (
              <div className="w-10 h-10 border-4 border-slate-700 border-t-white rounded-full animate-spin"></div>
            ) : (
              <div className="relative">
                <Mic className={`w-12 h-12 text-blue-400 ${isActive ? 'animate-pulse' : ''}`} />
                {isActive && (
                   <div className="absolute -inset-4 border border-blue-400/30 rounded-full animate-[ping_2s_infinite]"></div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">
            {isConnecting ? 'Establishing Connection...' : 'Listening...'}
          </h3>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">
            {isConnecting ? 'Secure Medical Channel' : 'Care Professional Active'}
          </p>
        </div>

        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 h-48 flex flex-col gap-4 overflow-y-auto border border-white/5 relative">
          <div className="space-y-4 text-left">
             {currentTurnUser && (
               <div className="flex gap-2">
                 <Mic className="w-4 h-4 text-blue-400 shrink-0 mt-1" />
                 <p className="text-sm text-slate-300 italic">"{currentTurnUser}"</p>
               </div>
             )}
             {currentTurnAI && (
               <div className="flex gap-2">
                 <MessageSquare className="w-4 h-4 text-teal-400 shrink-0 mt-1" />
                 <p className="text-sm text-slate-200">{currentTurnAI}</p>
               </div>
             )}
             {!currentTurnUser && !currentTurnAI && !isConnecting && (
               <p className="text-xs text-slate-500 text-center mt-12">
                 Describe how you are feeling...
               </p>
             )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <Activity className="w-5 h-5 text-teal-500 mb-2" />
             <span className="text-[10px] uppercase font-bold text-slate-500">Vitals Monitoring</span>
             <span className="text-xs font-bold text-slate-200">Active</span>
           </div>
           <div className="bg-white/5 p-4 rounded-xl border border-white/5 flex flex-col items-center">
             <HeartPulse className="w-5 h-5 text-red-500 mb-2" />
             <span className="text-[10px] uppercase font-bold text-slate-500">Risk Assessment</span>
             <span className="text-xs font-bold text-slate-200">Running...</span>
           </div>
        </div>
      </div>

      <div className="absolute bottom-12 w-full px-8">
        <button 
          onClick={handleEndSession}
          disabled={emergencyCountdown !== null}
          className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl shadow-lg border border-slate-700 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-0"
        >
          <Square className="w-5 h-5 fill-current" />
          End Session
        </button>
      </div>
    </div>
  );
};
