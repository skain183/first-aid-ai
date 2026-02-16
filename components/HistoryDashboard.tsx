
import React, { useState, useMemo } from 'react';
import { IncidentRecord, DispatchReport } from '../types';
import { getHistory, deleteIncident, exportHistory, getDispatchHistory } from '../services/storage';
import { 
  Clock, Search, Filter, ChevronRight, Trash2, Download, 
  ArrowLeft, Calendar, MapPin, AlertCircle, FileText, PhoneOutgoing, ShieldAlert 
} from 'lucide-react';

interface HistoryDashboardProps {
  onViewDetail: (incident: IncidentRecord) => void;
  onBack: () => void;
}

export const HistoryDashboard: React.FC<HistoryDashboardProps> = ({ onViewDetail, onBack }) => {
  const [activeTab, setActiveTab] = useState<'incidents' | 'dispatches'>('incidents');
  const [history, setHistory] = useState<IncidentRecord[]>(() => getHistory());
  const [dispatchHistory, setDispatchHistory] = useState<DispatchReport[]>(() => getDispatchHistory());
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('All');

  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchesSearch = item.injury_type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.body_location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === 'All' || item.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [history, searchTerm, filterSeverity]);

  const filteredDispatches = useMemo(() => {
    return dispatchHistory.filter(item => {
      const matchesSearch = item.reason_for_dispatch.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSeverity = filterSeverity === 'All' || item.severity === filterSeverity;
      return matchesSearch && matchesSeverity;
    });
  }, [dispatchHistory, searchTerm, filterSeverity]);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this incident record?")) {
      deleteIncident(id);
      setHistory(getHistory());
    }
  };

  const handleExport = () => {
    const data = exportHistory();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firstaid_history_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-100 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-slate-800">Medical History</h2>
          </div>
          <button 
            onClick={handleExport}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg flex items-center gap-2 text-sm font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('incidents')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'incidents' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Incidents
          </button>
          <button 
            onClick={() => setActiveTab('dispatches')}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === 'dispatches' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Dispatch Logs
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-4 bg-white border-b border-slate-100 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder={activeTab === 'incidents' ? "Search by injury or location..." : "Search by dispatch reason..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {['All', 'Critical', 'Severe', 'Moderate', 'Mild'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterSeverity === sev 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* List Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        
        {activeTab === 'incidents' && (
          filteredHistory.length > 0 ? (
            filteredHistory.map((incident) => (
              <div 
                key={incident.incident_id}
                onClick={() => onViewDetail(incident)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-blue-200 active:scale-[0.98] transition-all group"
              >
                {/* Image Preview / Icon */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                  {incident.injury_image ? (
                    <img src={`data:image/jpeg;base64,${incident.injury_image}`} alt="Injury" className="w-full h-full object-cover" />
                  ) : (
                    <FileText className="w-6 h-6 text-slate-300" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                      incident.severity === 'Critical' ? 'bg-red-100 text-red-700' :
                      incident.severity === 'Severe' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {incident.severity}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3" /> {formatDate(incident.timestamp)}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 truncate text-sm">{incident.injury_type}</h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 truncate mt-0.5">
                    <MapPin className="w-3 h-3" /> {incident.body_location}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button 
                    onClick={(e) => handleDelete(incident.incident_id, e)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-300" />
                </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <Calendar className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No incident records found</p>
              <p className="text-xs mt-1">Scan an injury to start your history log</p>
            </div>
          )
        )}

        {activeTab === 'dispatches' && (
          filteredDispatches.length > 0 ? (
            filteredDispatches.map((dispatch) => (
              <div 
                key={dispatch.dispatch_id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-3 hover:border-blue-200 transition-all"
              >
                 <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        dispatch.dispatch_status === 'canceled' ? 'bg-slate-100 text-slate-400' : 'bg-red-100 text-red-600'
                      }`}>
                        <PhoneOutgoing className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{dispatch.reason_for_dispatch}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${
                            dispatch.dispatch_status === 'canceled' ? 'bg-slate-100 text-slate-500' : 'bg-green-100 text-green-700'
                          }`}>
                            {dispatch.dispatch_status}
                          </span>
                          <span className="text-[10px] text-slate-400">{formatDate(dispatch.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <ShieldAlert className={`w-5 h-5 ${
                      dispatch.risk_level === 'Critical' ? 'text-red-500' : 'text-orange-400'
                    }`} />
                 </div>
                 
                 <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-1">
                    <p><strong>Trigger:</strong> {dispatch.trigger_type.replace(/_/g, ' ')}</p>
                    <p><strong>Method:</strong> {dispatch.dispatch_method}</p>
                    {dispatch.user_canceled && <p className="text-red-500 font-bold">Canceled by user</p>}
                 </div>
              </div>
            ))
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center p-8">
              <PhoneOutgoing className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No dispatch logs found</p>
            </div>
          )
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
