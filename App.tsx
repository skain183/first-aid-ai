
import React, { useState, useEffect } from 'react';
import { CameraCapture } from './components/CameraCapture';
import { ReportCard } from './components/ReportCard';
import { DispatchSimulation } from './components/DispatchSimulation';
import { StepGuidance } from './components/StepGuidance';
import { HistoryDashboard } from './components/HistoryDashboard';
import { IncidentDetail } from './components/IncidentDetail';
import { SymptomCareHome } from './components/SymptomCareHome';
import { SymptomTextMode } from './components/SymptomTextMode';
import { SymptomLiveMode } from './components/SymptomLiveMode';
import { SymptomReportView } from './components/SymptomReportView';
import { Onboarding } from './components/Onboarding';
import { ProfileView } from './components/ProfileView';
import { DispatchCountdown } from './components/DispatchCountdown';
import { analyzeInjuryImage, analyzeSymptomText, generateSymptomReportFromTranscript } from './services/gemini';
import { saveIncident, saveSymptomIncident, isProfileComplete, getUserProfile, saveDispatchLog } from './services/storage';
import { getCurrentLocation } from './services/location';
import { AppMode, InjuryReport, IncidentRecord, SymptomReport, LocationData, DispatchReport } from './types';
import { Shield, Camera, Mic, Activity, AlertCircle, Clock, HeartPulse, Sparkles, User, MapPin, Stethoscope, ChevronRight } from 'lucide-react';

function App() {
  const [mode, setMode] = useState<AppMode>('IDLE');
  const [report, setReport] = useState<InjuryReport | null>(null);
  const [symptomReport, setSymptomReport] = useState<SymptomReport | null>(null);
  const [userDescription, setUserDescription] = useState<string>("");
  const [currentBase64Image, setCurrentBase64Image] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  // Dispatch System State
  const [dispatchCountdown, setDispatchCountdown] = useState<{ active: boolean; severity: string } | null>(null);
  const [dispatchMeta, setDispatchMeta] = useState<{
    type: 'ai_auto_triggered' | 'user_manual_triggered' | 'ai_recommended_user_confirmed';
    source: 'injury_care' | 'symptom_care' | 'live_chat' | 'manual_button';
  }>({ type: 'user_manual_triggered', source: 'manual_button' });

  // Initial Check for Onboarding
  useEffect(() => {
    if (!isProfileComplete()) {
      setMode('ONBOARDING');
    }
    refreshLocation();
  }, []);

  const refreshLocation = async () => {
    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (e) {
      console.warn("Location check failed initially:", e);
    }
  };

  const handleCapture = async (base64Image: string) => {
    setMode('ANALYZING');
    setCurrentBase64Image(base64Image);
    
    let loc = userLocation;
    if (!loc) {
      try {
        loc = await getCurrentLocation();
        setUserLocation(loc);
      } catch (e) { console.warn("Could not fetch location for analysis"); }
    }

    const result = await analyzeInjuryImage(base64Image, userDescription, loc);
    setReport(result);
    setMode('REPORT');

    // Save initial record
    saveIncident(result, base64Image, userDescription, loc, 'none');

    // Critical Logic: Trigger Safety Countdown
    if (result.severity === 'Critical' || result.severity === 'Severe') {
      handleDispatchTrigger('call', 'ai_auto_triggered', 'injury_care');
    }
  };

  const handleDispatchTrigger = (
    method: 'call' | 'whatsapp', 
    type: 'ai_auto_triggered' | 'user_manual_triggered' | 'ai_recommended_user_confirmed' = 'user_manual_triggered',
    source: 'injury_care' | 'symptom_care' | 'live_chat' | 'manual_button' = 'manual_button',
    skipCountdown: boolean = false
  ) => {
    setDispatchMeta({ type, source });
    
    if (skipCountdown) {
      // Execute Dispatch immediately (transition to Call Simulation)
      if (report) {
        saveIncident(report, currentBase64Image, userDescription, userLocation, method);
      }
      setMode('DISPATCH');
    } else {
      // Start Countdown Overlay
      setDispatchCountdown({ active: true, severity: report?.severity || 'Critical' });
    }
  };

  const handleCountdownConfirm = () => {
    setDispatchCountdown(null);
    handleDispatchTrigger('call', dispatchMeta.type, dispatchMeta.source, true);
  };

  const handleCountdownCancel = () => {
    setDispatchCountdown(null);
    
    // Log cancellation
    const cancelledDispatch: DispatchReport = {
      dispatch_id: `disp_cancel_${Date.now()}`,
      user_id: getUserProfile()?.user_id || "unknown",
      timestamp: new Date().toISOString(),
      trigger_type: dispatchMeta.type,
      trigger_source: dispatchMeta.source,
      dispatch_method: 'voice_simulation',
      dispatch_target: "Emergency Services",
      risk_level: report?.severity || 'Unknown',
      severity: report?.severity || 'Unknown',
      reason_for_dispatch: report?.injury_type || "Symptom Assessment",
      ai_decision_summary: "Dispatch cancelled by user during safety countdown.",
      patient_status: { conscious: true, breathing: "Unknown", bleeding: "Unknown", pain_level: "Unknown" },
      location: userLocation || { latitude: 0, longitude: 0, accuracy: 0, address: "Unknown", city: "", country: "", timestamp: "", source: "Manual" },
      dispatch_status: 'canceled',
      user_canceled: true,
      cancellation_reason: "User aborted countdown",
      system_tag: "Safety Gate Abort"
    };
    saveDispatchLog(cancelledDispatch);

    // EMERGENCY MODE RULE: No return to consultation.
    // If we were in text mode, move to report view.
    if (mode === 'SYMPTOM_TEXT') {
      setMode('SYMPTOM_REPORT');
    }
  };

  const resetApp = () => {
    setMode('IDLE');
    setReport(null);
    setSymptomReport(null);
    setUserDescription("");
    setCurrentBase64Image(null);
    setDispatchCountdown(null);
  };

  const viewHistoryDetail = (incident: IncidentRecord) => {
    setSelectedIncident(incident);
    setMode('HISTORY_DETAIL');
  };

  if (mode === 'ONBOARDING') {
    return <Onboarding onComplete={() => setMode('IDLE')} />;
  }

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col font-sans relative">
      
      {/* Dispatch Countdown Overlay */}
      {dispatchCountdown?.active && (
        <DispatchCountdown 
          severity={dispatchCountdown.severity}
          onConfirm={handleCountdownConfirm}
          onCancel={handleCountdownCancel}
        />
      )}

      {/* Top Bar */}
      {!['CAMERA', 'DISPATCH', 'HISTORY', 'HISTORY_DETAIL', 'SYMPTOM_LIVE', 'SYMPTOM_REPORT', 'PROFILE'].includes(mode) && (
        <header className="px-6 py-5 bg-white border-b border-slate-100 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={resetApp}>
            <div className="bg-red-600 rounded-lg p-1.5 text-white">
              <Shield className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 leading-none">Emergency</h1>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Response System</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setMode('HISTORY')}
              className="p-2.5 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-full transition-all"
            >
              <Clock className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setMode('PROFILE')}
              className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-teal-100 transition-all"
            >
              {getUserProfile()?.profile_image ? (
                <img src={getUserProfile()?.profile_image!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-5 h-5 text-slate-400" />
              )}
            </button>
          </div>
        </header>
      )}

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        
        {mode === 'PROFILE' && <ProfileView onBack={resetApp} />}

        {mode === 'IDLE' && (
          <div className="flex-1 flex flex-col p-6 animate-fade-in bg-slate-50">
            <div className="flex-1 flex flex-col justify-center space-y-8">
              <div className="space-y-2 text-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">How can we help?</h2>
                <p className="text-slate-500 text-sm">Select a service to proceed</p>
              </div>

              <button 
                onClick={() => setMode('CAMERA')}
                className="group w-full py-8 bg-white border border-red-100 rounded-3xl shadow-lg shadow-red-100/50 flex flex-col items-center justify-center gap-3 transition-all active:scale-[0.98] hover:border-red-200 relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center text-red-600 mb-1 group-hover:scale-110 transition-transform">
                   <Camera className="w-8 h-8" />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-slate-900">Report Injury</h3>
                  <span className="text-xs font-bold uppercase tracking-wider text-red-500 block mt-1">Emergency Assessment</span>
                </div>
              </button>

              <button 
                onClick={() => setMode('SYMPTOM_HOME')}
                className="group w-full py-6 bg-white border border-slate-200 rounded-3xl shadow-sm flex items-center px-6 gap-4 transition-all active:scale-[0.98] hover:border-teal-300 hover:shadow-md"
              >
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600">
                   <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="text-lg font-bold text-slate-900">Medical Consultation</h3>
                  <span className="text-xs text-slate-500">Symptom analysis & care</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </button>
            </div>
            
            <div className="w-full flex justify-center pb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${userLocation ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`}></div>
                {userLocation ? userLocation.city : "Acquiring Location..."}
              </div>
            </div>
          </div>
        )}

        {mode === 'SYMPTOM_HOME' && (
          <SymptomCareHome 
            onBack={resetApp}
            onSelectText={() => setMode('SYMPTOM_TEXT')}
            onSelectLive={() => setMode('SYMPTOM_LIVE')}
          />
        )}

        {mode === 'SYMPTOM_TEXT' && (
          <SymptomTextMode 
            onBack={() => setMode('SYMPTOM_HOME')}
            userLocation={userLocation}
            onResult={(res) => {
              setSymptomReport(res);
              saveSymptomIncident(res, "Text Assessment", userLocation);
              
              // BINDING: Map Critical Symptom Report to Injury Report for Global Dispatch Pipeline
              if (res.emergency_required || res.risk_level === 'critical' || res.dispatch_triggered) {
                 setReport({
                    injury_type: res.symptoms[0] || 'Critical Condition',
                    severity: 'Critical',
                    body_location: 'System Assessment',
                    bleeding: 'Unknown',
                    conscious: true,
                    breathing: 'Unknown',
                    risk_level: 'Immediate Life Threat',
                    urgency: 'Critical',
                    recommended_response: res.recommended_action || "Emergency dispatch initiated.",
                    equipment_needed: [],
                    notes: `AI Text Assessment Trigger: ${res.escalation_reason || 'Critical symptoms detected'}`,
                    steps: res.care_instructions
                 });
              }

              setMode('SYMPTOM_REPORT');
            }}
            onCriticalDispatch={() => {
              // EXECUTION RULE: Route through existing dispatch controller
              handleDispatchTrigger('call', 'ai_auto_triggered', 'symptom_care');
            }}
          />
        )}

        {mode === 'SYMPTOM_LIVE' && (
          <SymptomLiveMode 
            onClose={() => setMode('SYMPTOM_HOME')}
            onReportGenerated={(res) => {
              setSymptomReport(res);
              saveSymptomIncident(res, "Live Voice Conversation", userLocation);
              setMode('SYMPTOM_REPORT');
            }}
            onEmergencyTrigger={(reason) => {
              setReport({
                injury_type: `Emergency: ${reason}`,
                severity: 'Critical',
                body_location: 'System Detected',
                bleeding: 'Unknown',
                conscious: true,
                breathing: 'Unknown',
                risk_level: 'Immediate Life Threat',
                urgency: 'Critical',
                recommended_response: `Emergency symptoms detected: ${reason}.`,
                equipment_needed: ['None'],
                notes: `System detected critical symptoms during live conversation: ${reason}`,
                steps: ['Keep patient calm']
              });
              handleDispatchTrigger('call', 'ai_auto_triggered', 'live_chat');
            }}
          />
        )}

        {mode === 'SYMPTOM_REPORT' && symptomReport && (
          <SymptomReportView 
            report={symptomReport}
            onExit={resetApp}
            onDispatch={() => {
              // Convert symptom report to injury report format for dispatch
              setReport({
                injury_type: symptomReport.symptoms[0] || 'Unknown',
                severity: 'Critical',
                body_location: 'System Assessment',
                bleeding: 'Unknown',
                conscious: true,
                breathing: 'Unknown',
                risk_level: 'High',
                urgency: 'Immediate',
                recommended_response: 'Dispatch requested.',
                equipment_needed: [],
                notes: 'User requested dispatch from report.',
                steps: symptomReport.care_instructions
              });
              handleDispatchTrigger('call', 'user_manual_triggered', 'symptom_care');
            }}
          />
        )}

        {mode === 'CAMERA' && <CameraCapture onCapture={handleCapture} onCancel={resetApp} />}

        {mode === 'ANALYZING' && (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 text-white relative overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-b from-teal-500/10 to-transparent"></div>
             <div className="absolute top-0 left-0 w-full h-1 bg-teal-500 shadow-[0_0_20px_rgba(20,184,166,1)] animate-[scan_2s_ease-in-out_infinite]"></div>
             <div className="z-10 text-center space-y-4">
               <div className="w-16 h-16 border-4 border-teal-500 border-t-white rounded-full animate-spin mx-auto"></div>
               <h3 className="text-xl font-bold tracking-wide">Processing Medical Data...</h3>
               <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Secure Analysis</p>
             </div>
          </div>
        )}

        {mode === 'REPORT' && report && (
          <ReportCard 
            report={report} 
            onDispatch={() => handleDispatchTrigger('call', 'user_manual_triggered', 'injury_care')} 
            onStartGuide={() => setMode('GUIDANCE')} 
          />
        )}

        {mode === 'DISPATCH' && report && (
          <DispatchSimulation 
            report={report} 
            userLocation={userLocation}
            dispatchMeta={dispatchMeta}
            onComplete={() => setMode('GUIDANCE')} 
            onCancel={() => setMode('REPORT')}
          />
        )}

        {mode === 'GUIDANCE' && report && <StepGuidance report={report} onExit={resetApp} />}

        {mode === 'HISTORY' && <HistoryDashboard onViewDetail={viewHistoryDetail} onBack={resetApp} />}

        {mode === 'HISTORY_DETAIL' && selectedIncident && <IncidentDetail incident={selectedIncident} onBack={() => setMode('HISTORY')} />}

      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

export default App;
