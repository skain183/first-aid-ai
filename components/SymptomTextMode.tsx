import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Send, Sparkles, AlertCircle, Bot, User, StopCircle, Loader2, PhoneOutgoing, Lock } from 'lucide-react';
import { Chat } from '@google/genai';
import { startSymptomChat, generateSymptomReportFromTranscript } from '../services/gemini';
import { SymptomReport, LocationData } from '../types';
import { getUserProfile } from '../services/storage';

interface SymptomTextModeProps {
  onBack: () => void;
  onResult: (result: SymptomReport) => void;
  onCriticalDispatch: () => void;
  onKeyError: () => void;
  userLocation: LocationData | null;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isMildRisk?: boolean; // New flag for mild risk options
}

export const SymptomTextMode: React.FC<SymptomTextModeProps> = ({ onBack, onResult, onCriticalDispatch, onKeyError, userLocation }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isEmergencyLocked, setIsEmergencyLocked] = useState(false);
  const [isSystemOverload, setIsSystemOverload] = useState(false);
  
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Chat
    const initChat = async () => {
      const profile = getUserProfile();
      const context = `
        User Name: ${profile?.name || 'Unknown'}
        Age: ${profile?.age || 'Unknown'}
        Gender: ${profile?.gender || 'Unknown'}
        Medical History: ${profile?.medical_info.history || 'None'}
        Location: ${userLocation ? `${userLocation.city}, ${userLocation.country}` : 'Unknown'}
      `;

      try {
        const chat = startSymptomChat(context);
        chatSessionRef.current = chat;
        
        // Initial AI greeting
        const response = await chat.sendMessage({ message: "Start intake. Introduce yourself as the Triage Assistant and ask for the main symptom." });
        
        if (response.text) {
          addMessage('ai', response.text);
        }
      } catch (e: any) {
        console.error("Failed to init chat", e);
        
        const errorMsg = e.message || '';
        // Check for Quota Limit (429)
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
          setIsSystemOverload(true);
          addMessage('ai', "⚠️ SYSTEM ALERT: High traffic volume (Quota Exceeded). AI Triage is currently unavailable.\n\nIf you have a medical emergency, please call your local emergency services immediately.");
        } 
        // Check for API Key issues
        else if (errorMsg.includes('400') || errorMsg.includes('401') || errorMsg.includes('API_KEY')) {
          onKeyError();
          onBack();
        } else {
          addMessage('ai', "System Error: Unable to initialize triage assistant. Please try again or call emergency services.");
        }
      } finally {
        setIsInitializing(false);
      }
    };

    initChat();
  }, [userLocation, onKeyError, onBack]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addMessage = (role: 'user' | 'ai', text: string, isMildRisk: boolean = false) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      role,
      text,
      timestamp: new Date(),
      isMildRisk
    }]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading || isFinalizing || isEmergencyLocked || isSystemOverload) return;

    const userMsg = inputText.trim();
    setInputText('');
    addMessage('user', userMsg);
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) throw new Error("Chat session not active");

      const response = await chatSessionRef.current.sendMessage({ message: userMsg });
      const toolCalls = response.functionCalls;
      let mildRiskTriggered = false;
      let finalResponseText = response.text;

      // Check Tools
      if (toolCalls && toolCalls.length > 0) {
        for (const fc of toolCalls) {
          if (fc.name === 'triggerCriticalProtocol') {
            const reason = (fc.args as any).reason || "Critical condition detected by AI.";
            
            // STRICT EMERGENCY PROTOCOL:
            setIsEmergencyLocked(true);
            setIsLoading(false); 

            addMessage('ai', `⚠️ CRITICAL ALERT: ${reason}. Emergency protocol initiated. Consultation terminated.`);
            
            await chatSessionRef.current.sendMessage({
               message: [{
                 functionResponse: {
                   id: fc.id,
                   name: fc.name,
                   response: { result: "Dispatch initiated. Chat locked." }
                 }
               }] as any 
            });

            const tempReport: SymptomReport = {
                symptoms: [reason],
                risk_level: 'critical',
                urgency: 'immediate',
                severity: 'critical',
                emergency_required: true,
                recommended_action: "EMERGENCY DISPATCH INITIATED",
                care_instructions: ["Await ambulance", "Do not move if injured", "Keep calm"],
                monitoring_advice: ["Stay on line"],
                escalation_reason: reason,
                dispatch_triggered: true
            };
            onResult(tempReport); 
            
            setTimeout(() => {
              onCriticalDispatch(); 
            }, 800);
            return;
          } 
          else if (fc.name === 'suggestMildRiskOptions') {
            mildRiskTriggered = true;
            
            const toolResult = await chatSessionRef.current.sendMessage({
               message: [{
                 functionResponse: {
                   id: fc.id,
                   name: fc.name,
                   response: { result: "Options presented to user." }
                 }
               }] as any
            });
            finalResponseText = toolResult.text;
          }
        }
      }

      if (finalResponseText) {
        addMessage('ai', finalResponseText, mildRiskTriggered);
      }

    } catch (e: any) {
      console.error("Chat error", e);
      const errorMsg = e.message || '';
      
      if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
         setIsSystemOverload(true);
         addMessage('ai', "⚠️ Connection Lost: System quota exceeded. Please contact medical services directly.");
      } else if (errorMsg.includes('400') || errorMsg.includes('API_KEY')) {
         onKeyError();
      } else {
         addMessage('ai', "I'm having trouble processing that. Could you repeat?");
      }
    } finally {
      if (!isEmergencyLocked) setIsLoading(false);
    }
  };

  const handleEndConversation = async () => {
    if (isEmergencyLocked || isSystemOverload) {
      onBack();
      return;
    }

    setIsFinalizing(true);
    const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
    
    try {
      // Use fallback-enabled generator
      const report = await generateSymptomReportFromTranscript(transcript, userLocation);
      onResult(report);
    } catch (e: any) {
      // Should not be reached due to fallback, but just in case
      console.error("Report generation failed", e);
      if (e.message?.includes('API_KEY')) onKeyError();
      onBack();
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 font-sans">
      {/* Header */}
      <div className={`p-4 shadow-sm border-b flex items-center justify-between sticky top-0 z-10 ${isEmergencyLocked ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            disabled={isEmergencyLocked}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className={`text-sm font-bold flex items-center gap-2 ${isEmergencyLocked ? 'text-red-700' : 'text-slate-800'}`}>
              Medical Triage 
              {isEmergencyLocked && <span className="px-2 py-0.5 bg-red-600 text-white text-[10px] rounded-full uppercase tracking-wider animate-pulse">EMERGENCY MODE</span>}
              {!isEmergencyLocked && !isSystemOverload && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-[10px] rounded-full uppercase tracking-wider">AI Assistant</span>}
              {isSystemOverload && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full uppercase tracking-wider">OFFLINE</span>}
            </h2>
            <p className={`text-[10px] font-medium ${isEmergencyLocked ? 'text-red-500' : 'text-slate-400'}`}>
              {isEmergencyLocked ? 'Consultation Terminated' : isSystemOverload ? 'System Capacity Reached' : 'Professional Assessment'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleEndConversation}
          disabled={isFinalizing || isInitializing || (messages.length < 2 && !isEmergencyLocked && !isSystemOverload)}
          className={`text-xs font-bold px-3 py-2 rounded-lg transition-colors flex items-center gap-1 ${
            isEmergencyLocked 
              ? 'text-red-700 bg-red-100 hover:bg-red-200' 
              : 'text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed'
          }`}
        >
          <StopCircle className="w-4 h-4" /> {isEmergencyLocked || isSystemOverload ? 'Exit' : 'End'}
        </button>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {isInitializing && (
          <div className="flex justify-center pt-10">
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-teal-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Initializing Triage...</span>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col w-full ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-teal-600 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
              }`}>
                {msg.text}
              </div>
            </div>

            {/* Mild Risk Options */}
            {msg.isMildRisk && !isEmergencyLocked && !isSystemOverload && (
              <div className="ml-11 mt-3 flex gap-3 animate-fade-in">
                <button 
                  onClick={onCriticalDispatch}
                  className="px-4 py-2 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 hover:bg-red-100 transition-colors flex items-center gap-2"
                >
                  <PhoneOutgoing className="w-3 h-3" />
                  Request Dispatch
                </button>
                <button 
                  onClick={() => addMessage('user', 'I will continue the conversation.')}
                  className="px-4 py-2 bg-white text-slate-600 text-xs font-bold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Continue Chat
                </button>
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex w-full justify-start">
             <div className="flex max-w-[85%] gap-3">
               <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                 <Bot className="w-4 h-4" />
               </div>
               <div className="p-4 rounded-2xl bg-white border border-slate-200 rounded-tl-none shadow-sm flex items-center gap-1">
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></div>
                 <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></div>
               </div>
             </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isEmergencyLocked ? 'bg-red-50 border-red-100' : 'bg-white border-slate-100'}`}>
        {isEmergencyLocked ? (
          <div className="w-full py-4 bg-white border-2 border-red-100 rounded-xl flex flex-col items-center justify-center gap-2 text-red-600 shadow-sm">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">Chat Locked</span>
            </div>
            <p className="text-xs text-red-400 font-medium">Emergency protocol active. Please wait for dispatch.</p>
          </div>
        ) : isSystemOverload ? (
          <div className="w-full py-4 bg-amber-50 border border-amber-200 rounded-xl flex flex-col items-center justify-center gap-2 text-amber-700 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm font-bold uppercase tracking-wider">System Unavailable</span>
            </div>
            <p className="text-xs text-amber-600 font-medium px-4 text-center">API Quota Reached. Please use standard emergency contacts.</p>
          </div>
        ) : isFinalizing ? (
          <div className="w-full py-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-500 animate-pulse">
            <Sparkles className="w-5 h-5 text-teal-600" />
            <span className="text-sm font-bold">Generating Final Report...</span>
          </div>
        ) : (
          <div className="relative flex items-end gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your response..."
              className="w-full bg-slate-100 border-none rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-teal-500/20 focus:bg-white transition-all resize-none max-h-32 min-h-[50px]"
              rows={1}
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
              className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-full shadow-lg shadow-teal-100 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        )}
        {!isEmergencyLocked && (
          <div className="text-center mt-2">
            <p className="text-[10px] text-slate-400 font-medium">For immediate emergencies, call {getUserProfile()?.country_profile.emergency_number || '911'}.</p>
          </div>
        )}
      </div>
    </div>
  );
};