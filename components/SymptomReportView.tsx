
import React from 'react';
import { SymptomReport } from '../types';
import { ShieldAlert, Heart, Clock, CheckCircle, Info, Home, AlertTriangle, ArrowRight, Activity, FileText } from 'lucide-react';

interface SymptomReportViewProps {
  report: SymptomReport;
  onExit: () => void;
  onDispatch: () => void;
}

export const SymptomReportView: React.FC<SymptomReportViewProps> = ({ report, onExit, onDispatch }) => {
  const isUrgent = report.risk_level === 'critical' || report.risk_level === 'high';

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto font-sans">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onExit} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <Home className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold text-slate-800">Medical Report</h2>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">ID: {Date.now().toString().slice(-6)}</span>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Hero Section */}
      <div className={`p-8 text-white ${
        report.risk_level === 'critical' ? 'bg-red-700' : 
        report.risk_level === 'high' ? 'bg-orange-600' : 'bg-teal-700'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
            {report.urgency} Urgency
          </span>
          <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest backdrop-blur-sm border border-white/10">
            {report.risk_level} Risk
          </span>
        </div>
        <h1 className="text-3xl font-bold leading-tight mb-3">
          {report.emergency_required ? 'Immediate Attention Required' : 'Clinical Assessment Complete'}
        </h1>
        <p className="text-white/90 text-sm font-medium leading-relaxed max-w-md">
          {report.recommended_action}
        </p>
      </div>

      <div className="p-5 space-y-6 -mt-6">
        {/* Identified Symptoms */}
        <div className="bg-white p-6 rounded-2xl shadow-md shadow-slate-200/50 border border-slate-100">
           <h3 className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
             <Activity className="w-4 h-4" /> Clinical Observations
           </h3>
           <div className="flex flex-wrap gap-2">
             {report.symptoms.map((s, i) => (
               <span key={i} className="px-3 py-1.5 bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200">
                 {s}
               </span>
             ))}
           </div>
        </div>

        {/* Emergency Escalation */}
        {report.emergency_required && (
          <div className="bg-red-50 p-6 rounded-2xl border border-red-100">
            <h3 className="text-red-800 font-bold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> Medical Escalation Protocol
            </h3>
            <p className="text-red-700 text-sm font-medium mb-6 leading-relaxed">
              {report.escalation_reason}
            </p>
            <button 
              onClick={onDispatch}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-200 flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
            >
              INITIATE EMERGENCY DISPATCH
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Care Instructions */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" /> Treatment Protocol
          </h3>
          <div className="space-y-5">
            {report.care_instructions.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center shrink-0 text-xs font-bold text-teal-700 border border-teal-100">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-700 font-medium leading-relaxed pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Monitoring Advice */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
          <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest">
            <Clock className="w-4 h-4" /> Monitoring
          </h3>
          <ul className="space-y-3">
            {report.monitoring_advice.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm text-slate-600 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0"></span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        {/* Warning */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl text-slate-500 flex gap-4 items-start shadow-sm">
          <Info className="w-5 h-5 shrink-0 mt-0.5 text-slate-400" />
          <p className="text-[11px] leading-relaxed font-medium">
            This report is generated by an automated medical intelligence system. It is not a substitute for professional medical diagnosis or treatment. If your condition deteriorates, seek professional care immediately.
          </p>
        </div>

        <div className="pb-8">
           <button 
             onClick={onExit}
             className="w-full py-4 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl active:scale-[0.98] transition-all hover:bg-slate-50"
           >
             Close Report
           </button>
        </div>
      </div>
    </div>
  );
};
