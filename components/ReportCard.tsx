
import React from 'react';
import { InjuryReport } from '../types';
import { AlertTriangle, Activity, Heart, ShieldAlert, Thermometer } from 'lucide-react';

interface ReportCardProps {
  report: InjuryReport;
  onDispatch: () => void;
  onStartGuide: () => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({ report, onDispatch, onStartGuide }) => {
  const isCritical = report.severity === 'Critical' || report.severity === 'Severe';
  
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto pb-24">
      
      {isCritical && (
        <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between text-sm font-bold shadow-md sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" />
            <span>SEVERITY WARNING</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-1 rounded">CHECK VITALS</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-b-3xl shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
          }`}>
            {report.severity} Priority
          </span>
          <span className="text-slate-400 text-xs font-medium">AI CONFIDENCE: 98%</span>
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">{report.injury_type}</h2>
        <p className="text-slate-500">{report.notes}</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Vitals Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <Heart className={`w-6 h-6 mb-2 ${report.conscious ? 'text-green-500' : 'text-red-500'}`} />
            <span className="text-xs text-slate-400 uppercase font-bold">Conscious</span>
            <span className="font-semibold text-slate-800">{report.conscious ? 'Yes' : 'No'}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <Activity className="w-6 h-6 mb-2 text-blue-500" />
            <span className="text-xs text-slate-400 uppercase font-bold">Breathing</span>
            <span className="font-semibold text-slate-800">{report.breathing}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <Thermometer className="w-6 h-6 mb-2 text-orange-500" />
            <span className="text-xs text-slate-400 uppercase font-bold">Bleeding</span>
            <span className="font-semibold text-slate-800">{report.bleeding}</span>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col items-center text-center">
            <ShieldAlert className="w-6 h-6 mb-2 text-purple-500" />
            <span className="text-xs text-slate-400 uppercase font-bold">Risk</span>
            <span className="font-semibold text-slate-800">{report.risk_level}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-4">
          <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Recommended Action
          </h3>
          <p className="text-red-800 text-sm mb-4 leading-relaxed">
            {report.recommended_response}
          </p>
          
          <div className="grid grid-cols-1 gap-3">
            <button 
              onClick={onDispatch}
              className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-lg shadow-red-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <div className="animate-pulse w-2 h-2 rounded-full bg-white"></div>
              EMERGENCY DISPATCH
            </button>
            <button 
              onClick={onStartGuide}
              className="w-full py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all"
            >
              Start First Aid Guide
            </button>
          </div>
        </div>

        {/* Equipment Needed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h3 className="text-sm font-bold text-slate-400 uppercase mb-3">Required Equipment</h3>
          <div className="flex flex-wrap gap-2">
            {report.equipment_needed.map((item, idx) => (
              <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full font-medium">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
