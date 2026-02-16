
export type AppMode = 
  | 'ONBOARDING'
  | 'PROFILE'
  | 'IDLE' 
  | 'CAMERA' 
  | 'ANALYZING' 
  | 'REPORT' 
  | 'DISPATCH' 
  | 'GUIDANCE' 
  | 'HISTORY' 
  | 'HISTORY_DETAIL'
  | 'SYMPTOM_HOME'
  | 'SYMPTOM_TEXT'
  | 'SYMPTOM_LIVE'
  | 'SYMPTOM_REPORT';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
  city: string;
  country: string;
  timestamp: string;
  source: 'GPS' | 'Network' | 'Manual' | 'IP';
}

export interface CountryProfile {
  country_name: string;
  country_code: string; // ISO 2-char
  dial_code: string;
  emergency_number: string;
  region: string;
}

export interface UserProfile {
  user_id: string;
  name: string;
  age: string;
  gender: 'Male' | 'Female';
  id_number: string;
  country_profile: CountryProfile;
  address: {
    country: string;
    city: string;
    full_address: string;
  };
  medical_info: {
    history: string;
    conditions: string;
    allergies: string;
    medications: string;
    files: Array<{name: string, data: string}>; // base64
  };
  emergency_contact: {
    name: string;
    number: string;
  };
  profile_image: string | null; // base64
  account_created_at: string;
  last_updated: string;
  consent_status: boolean;
}

export interface InjuryReport {
  injury_type: string;
  severity: 'Mild' | 'Moderate' | 'Severe' | 'Critical';
  body_location: string;
  bleeding: 'None' | 'Controlled' | 'Active' | 'Severe' | 'Unknown';
  conscious: boolean;
  breathing: 'Normal' | 'Shallow' | 'Labored' | 'None' | 'Unknown';
  risk_level: 'Low' | 'Medium' | 'High' | 'Immediate Life Threat';
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  recommended_response: string;
  equipment_needed: string[];
  notes: string;
  steps: string[];
}

export interface SymptomReport {
  symptoms: string[];
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'low' | 'moderate' | 'high' | 'immediate';
  severity: 'mild' | 'moderate' | 'severe' | 'critical';
  emergency_required: boolean;
  recommended_action: string;
  care_instructions: string[];
  monitoring_advice: string[];
  escalation_reason: string;
  dispatch_triggered: boolean;
}

export interface DispatchStatus {
  step: 'CONNECTING' | 'SENDING_DATA' | 'ANALYZING_VITALS' | 'UNIT_DISPATCHED';
  eta: string | null;
}

export interface IncidentRecord {
  incident_id: string;
  timestamp: string;
  location?: LocationData;
  injury_type: string;
  severity: string;
  body_location: string;
  injury_image: string | null; // base64 string
  ai_analysis: string;
  first_aid_instructions: string[];
  risk_level: string;
  urgency: string;
  patient_status: {
    conscious: boolean;
    breathing: string;
    bleeding: string;
  };
  dispatch_status: {
    dispatched: boolean;
    dispatch_method: 'call' | 'whatsapp' | 'none';
    dispatch_summary: string;
  };
  user_notes: string;
  recovery_notes: string;
  follow_up_required: boolean;
}

export interface DispatchReport {
  dispatch_id: string;
  user_id: string;
  timestamp: string;
  trigger_type: 'ai_auto_triggered' | 'user_manual_triggered' | 'ai_recommended_user_confirmed';
  trigger_source: 'injury_care' | 'symptom_care' | 'live_chat' | 'manual_button';
  dispatch_method: 'call' | 'sms' | 'voice_simulation' | 'web_dispatch' | 'whatsapp';
  dispatch_target: string;
  risk_level: string;
  severity: string;
  reason_for_dispatch: string;
  ai_decision_summary: string;
  patient_status: {
    conscious: boolean;
    breathing: string;
    bleeding: string;
    pain_level: string;
  };
  location: LocationData;
  dispatch_status: 'executed' | 'canceled' | 'failed' | 'simulated';
  user_canceled: boolean;
  cancellation_reason: string | null;
  system_tag: string;
}
