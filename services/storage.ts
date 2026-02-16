
import { IncidentRecord, InjuryReport, SymptomReport, DispatchReport, UserProfile, LocationData } from '../types';

const STORAGE_KEY = 'firstaid_ai_incident_history';
const DISPATCH_KEY = 'firstaid_ai_dispatch_history';
const PROFILE_KEY = 'firstaid_ai_user_profile';

// --- USER PROFILE ---

export const saveUserProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getUserProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const isProfileComplete = (): boolean => {
  return !!getUserProfile();
};

export const updateEmergencyContact = (name: string, number: string): void => {
  const profile = getUserProfile();
  if (profile) {
    profile.emergency_contact = { name, number };
    profile.last_updated = new Date().toISOString();
    saveUserProfile(profile);
  }
};

// --- INCIDENTS ---

export const saveIncident = (
  report: InjuryReport, 
  base64Image: string | null, 
  userDescription: string,
  location: LocationData | null,
  dispatchMethod: 'call' | 'whatsapp' | 'none' = 'none'
): IncidentRecord => {
  const history = getHistory();
  
  const newRecord: IncidentRecord = {
    incident_id: `inc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    location: location || undefined,
    injury_type: report.injury_type,
    severity: report.severity,
    body_location: report.body_location,
    injury_image: base64Image,
    ai_analysis: report.notes,
    first_aid_instructions: report.steps,
    risk_level: report.risk_level,
    urgency: report.urgency,
    patient_status: {
      conscious: report.conscious,
      breathing: report.breathing,
      bleeding: report.bleeding,
    },
    dispatch_status: {
      dispatched: dispatchMethod !== 'none',
      dispatch_method: dispatchMethod,
      dispatch_summary: dispatchMethod !== 'none' ? `Emergency dispatch triggered via ${dispatchMethod}` : 'No emergency dispatch triggered',
    },
    user_notes: userDescription,
    recovery_notes: '',
    follow_up_required: report.severity === 'Critical' || report.severity === 'Severe',
  };

  const updatedHistory = [newRecord, ...history];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  return newRecord;
};

export const saveSymptomIncident = (
  report: SymptomReport,
  transcriptSummary: string,
  location: LocationData | null
): IncidentRecord => {
  const history = getHistory();

  // Map SymptomReport to IncidentRecord structure
  // Some fields are approximated as SymptomReport doesn't have image/bleeding specific fields always
  const newRecord: IncidentRecord = {
    incident_id: `sym_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    location: location || undefined,
    injury_type: report.symptoms[0] || "General Symptom Assessment", // Use main symptom as type
    severity: report.severity.charAt(0).toUpperCase() + report.severity.slice(1), // Capitalize
    body_location: "Systemic/Reported",
    injury_image: null,
    ai_analysis: `Risk: ${report.risk_level}. Action: ${report.recommended_action}. \nContext: ${transcriptSummary.substring(0, 200)}...`,
    first_aid_instructions: report.care_instructions,
    risk_level: report.risk_level,
    urgency: report.urgency,
    patient_status: {
      conscious: true, // Assumed if chatting, unless critical
      breathing: report.emergency_required ? "Check Required" : "Stable",
      bleeding: "Unknown"
    },
    dispatch_status: {
      dispatched: report.dispatch_triggered,
      dispatch_method: report.dispatch_triggered ? 'call' : 'none',
      dispatch_summary: report.dispatch_triggered ? 'Emergency dispatch triggered by symptom severity.' : 'No dispatch.'
    },
    user_notes: "Symptom Assessment Session",
    recovery_notes: report.monitoring_advice.join('. '),
    follow_up_required: report.emergency_required || report.severity === 'severe'
  };

  const updatedHistory = [newRecord, ...history];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  return newRecord;
}

export const getHistory = (): IncidentRecord[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse history", e);
    return [];
  }
};

export const deleteIncident = (id: string): void => {
  const history = getHistory();
  const updatedHistory = history.filter(item => item.incident_id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
};

export const exportHistory = (): string => {
  const history = getHistory();
  const dispatchHistory = getDispatchHistory();
  return JSON.stringify({ incidents: history, dispatches: dispatchHistory }, null, 2);
};

// --- DISPATCH LOGGING ---

export const saveDispatchLog = (report: DispatchReport): void => {
  const history = getDispatchHistory();
  const updatedHistory = [report, ...history];
  localStorage.setItem(DISPATCH_KEY, JSON.stringify(updatedHistory));
};

export const getDispatchHistory = (): DispatchReport[] => {
  const data = localStorage.getItem(DISPATCH_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error("Failed to parse dispatch history", e);
    return [];
  }
};
