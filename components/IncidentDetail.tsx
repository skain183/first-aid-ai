
import React from 'react';
import { IncidentRecord } from '../types';
import { 
  ArrowLeft, Calendar, ShieldAlert, Heart, Activity, 
  Thermometer, MapPin, CheckCircle, Info, MessageSquare, AlertTriangle 
} from 'lucide-react';

interface IncidentDetailProps {
  incident: IncidentRecord;
  onBack: () => void;
}

export const IncidentDetail: React.FC<IncidentDetailProps> = ({ incident, onBack }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">Incident Report</h2>
        <div className="w-10"></div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-6 pb-12">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Calendar className="w-4 h-4" />
            {formatDate(incident.timestamp)}
          </div>
          
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">{incident.injury_type}</h1>
              <p className="text-slate-500 flex items-center gap-1">
                <Activity className="w-4 h-4" /> {incident.body_location}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              incident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
              incident.severity === 'Severe' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {incident.severity}
            </span>
          </div>

          {incident.location && (
            <div className="bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100 flex items-start gap-3">
               <div className="p-2 bg-blue-100 rounded-full text-blue-600 shrink-0">
                 <MapPin className="w-4 h-4" />
               </div>
               <div>
                 <p className="text-xs font-bold text-slate-500 uppercase">Incident Location</p>
                 <p className="text-sm font-semibold text-slate-800">{incident.location.address}</p>
                 <p className="text-[10px] text-slate-400 mt-0.5">
                   GPS: {incident.location.latitude.toFixed(6)}, {incident.location.longitude.toFixed(6)} • Acc: {Math.round(incident.location.accuracy)}m
                 </p>
               </div>
            </div>
          )}

          {incident.injury_image && (
            <div className="rounded-2xl overflow-hidden border border-slate-100 mb-4 bg-slate-50 aspect-video flex items-center justify-center">
              <img 
                src={`data:image/jpeg;base64,${incident.injury_image}`} 
                alt="Captured Injury" 
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          <div className="bg-slate-50 p-4 rounded-xl">
             <h3 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
               <Info className="w-3 h-3" /> AI Analysis
             </h3>
             <p className="text-slate-700 text-sm leading-relaxed">{incident.ai_analysis}</p>
          </div>
        </div>

        {/* Vitals Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Conscious</span>
            <div className="flex items-center gap-2">
              <Heart className={`w-4 h-4 ${incident.patient_status.conscious ? 'text-green-500' : 'text-red-500'}`} />
              <span className="font-bold text-slate-800 text-sm">{incident.patient_status.conscious ? 'Yes' : 'No'}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Breathing</span>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-slate-800 text-sm">{incident.patient_status.breathing}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Bleeding</span>
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-slate-800 text-sm">{incident.patient_status.bleeding}</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <span className="text-[10px] text-slate-400 uppercase font-bold mb-2 block">Risk Level</span>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-purple-500" />
              <span className="font-bold text-slate-800 text-sm">{incident.risk_level}</span>
            </div>
          </div>
        </div>

        {/* Instructions Record */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> First Aid Protocol Used
          </h3>
          <div className="space-y-4">
            {incident.first_aid_instructions.map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-xs font-bold text-slate-500">
                  {idx + 1}
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dispatch Record */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Dispatch Record
          </h3>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            {incident.dispatch_status.dispatched ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
                  <CheckCircle className="w-4 h-4" /> Dispatched Successfully
                </div>
                <p className="text-xs text-slate-500 uppercase font-bold">Method: {incident.dispatch_status.dispatch_method}</p>
                <p className="text-sm text-slate-700">{incident.dispatch_status.dispatch_summary}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">No emergency services were dispatched for this incident.</p>
            )}
          </div>
        </div>

        {/* User Notes */}
        {incident.user_notes && (
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
            <h3 className="font-bold text-amber-800 mb-2 text-xs uppercase tracking-widest flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Initial Notes
            </h3>
            <p className="text-amber-900 text-sm italic">"{incident.user_notes}"</p>
          </div>
        )}
      </div>
    </div>
  );
};
