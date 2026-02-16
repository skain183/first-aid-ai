
import { GoogleGenAI, Type, FunctionDeclaration, Chat } from "@google/genai";
import { InjuryReport, SymptomReport, LocationData } from "../types";

const SYSTEM_INSTRUCTION = `
You are a Professional First Aid AI Assistant. 
Your goal is to analyze images of injuries and provide a structured JSON assessment.
Prioritize safety. If the injury looks critical, mark it as Critical.
If the image is unclear, provide a safe assessment based on visible indicators.
`;

// Helper to determine if error is strictly an API Key / Auth issue (triggering re-selection)
// vs a transient or quota issue (triggering fallback)
const isAuthError = (error: any) => {
  const msg = error.toString();
  // 400: Bad Request (often invalid key param)
  // 401: Unauthorized
  // 403: Forbidden (can be billing, but we treat as auth/config issue usually)
  // We explicitly exclude 429 (Quota) from this check so it falls back to safety protocol instead of key reset
  return (
    (msg.includes('400') || msg.includes('401') || msg.includes('API_KEY')) && 
    !msg.includes('429') && 
    !msg.includes('RESOURCE_EXHAUSTED')
  );
};

export async function analyzeInjuryImage(base64Image: string, userDescription: string, location?: LocationData | null): Promise<InjuryReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `User Location: ${location.city}, ${location.country}.` : "";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
          {
            text: `Analyze this injury. User description: "${userDescription}". ${locationContext} Provide the JSON report.`,
          },
        ],
      },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            injury_type: { type: Type.STRING },
            severity: { 
              type: Type.STRING, 
              enum: ['Mild', 'Moderate', 'Severe', 'Critical'] 
            },
            body_location: { type: Type.STRING },
            bleeding: { 
              type: Type.STRING, 
              enum: ['None', 'Controlled', 'Active', 'Severe', 'Unknown'] 
            },
            conscious: { type: Type.BOOLEAN },
            breathing: { 
              type: Type.STRING, 
              enum: ['Normal', 'Shallow', 'Labored', 'None', 'Unknown'] 
            },
            risk_level: { 
              type: Type.STRING, 
              enum: ['Low', 'Medium', 'High', 'Immediate Life Threat'] 
            },
            urgency: { 
              type: Type.STRING, 
              enum: ['Low', 'Medium', 'High', 'Critical'] 
            },
            recommended_response: { type: Type.STRING },
            equipment_needed: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            notes: { type: Type.STRING },
            steps: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: [
            "injury_type", "severity", "body_location", "bleeding", 
            "conscious", "breathing", "risk_level", "urgency", 
            "recommended_response", "equipment_needed", "notes", "steps"
          ]
        }
      },
    });

    const text = response.text || "";
    return JSON.parse(text) as InjuryReport;
  } catch (error: any) {
    console.error("AI Analysis failed:", error);
    
    // Only throw if it's a configuration/key error. 
    // If it's quota (429) or network, return fallback.
    if (isAuthError(error)) {
      throw error;
    }

    return {
      injury_type: "Analysis Unavailable",
      severity: "Severe", // Default to high severity for safety
      body_location: "Unknown",
      bleeding: "Unknown",
      conscious: true,
      breathing: "Unknown",
      risk_level: "High",
      urgency: "High",
      recommended_response: "System could not verify injury severity due to high traffic. Treat as potential emergency.",
      equipment_needed: ["First Aid Kit", "Phone"],
      notes: "AI Service Unavailable (Quota/Network). Defaulting to safety protocol.",
      steps: ["Ensure scene safety", "Call Emergency Services if in doubt", "Keep patient calm", "Monitor vitals", "Apply pressure if bleeding"]
    };
  }
}

export async function analyzeSymptomText(description: string, location?: LocationData | null): Promise<SymptomReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `User Location: ${location.city}, ${location.country}.` : "";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user reports the following symptoms: "${description}". ${locationContext} Perform a professional medical symptom assessment. Provide structured JSON.`,
      config: {
        systemInstruction: "You are a Medical Symptom Intelligence Module. Classify symptoms, assess risk, and provide care instructions. Never diagnose, only provide guidance and urgency levels. If life-threatening symptoms (chest pain, stroke signs, breathing difficulty) are found, set emergency_required to true.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            risk_level: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
            urgency: { type: Type.STRING, enum: ['low', 'moderate', 'high', 'immediate'] },
            severity: { type: Type.STRING, enum: ['mild', 'moderate', 'severe', 'critical'] },
            emergency_required: { type: Type.BOOLEAN },
            recommended_action: { type: Type.STRING },
            care_instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            monitoring_advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            escalation_reason: { type: Type.STRING },
            dispatch_triggered: { type: Type.BOOLEAN }
          },
          required: ["symptoms", "risk_level", "urgency", "severity", "emergency_required", "recommended_action", "care_instructions"]
        }
      },
    });

    return JSON.parse(response.text || "{}") as SymptomReport;
  } catch (error: any) {
    console.error("Symptom analysis failed:", error);
    if (isAuthError(error)) {
      throw error;
    }
    // Fallback for 429
    return {
      symptoms: ["Unanalyzed Symptoms"],
      risk_level: "high",
      urgency: "high",
      severity: "moderate",
      emergency_required: false,
      recommended_action: "AI Assessment unavailable. Please consult a doctor or call emergency services if symptoms are severe.",
      care_instructions: ["Monitor symptoms closely", "Seek professional medical advice"],
      monitoring_advice: ["Check for worsening condition"],
      escalation_reason: "System overload/Quota exceeded",
      dispatch_triggered: false
    };
  }
}

export async function generateSymptomReportFromTranscript(transcript: string, location?: LocationData | null): Promise<SymptomReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const locationContext = location ? `User Location: ${location.city}, ${location.country}.` : "";

  if (!transcript.trim()) {
    return {
      symptoms: ["No specific symptoms recorded"],
      risk_level: "low",
      urgency: "low",
      severity: "mild",
      emergency_required: false,
      recommended_action: "Monitor condition. Start a new session if symptoms persist.",
      care_instructions: ["Rest and hydrate", "Observe for changes"],
      monitoring_advice: ["Check if symptoms return"],
      escalation_reason: "",
      dispatch_triggered: false
    };
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze the following first-aid conversation transcript and generate a structured medical symptom report: 
      
      TRANSCRIPT:
      "${transcript}"
      
      CONTEXT:
      ${locationContext}
      
      Provide structured JSON.`,
      config: {
        systemInstruction: "You are a Medical Incident Reporter. specificy symptoms, risk, and care instructions based on the conversation log. Never diagnose. Provide a professional summary report.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
            risk_level: { type: Type.STRING, enum: ['low', 'medium', 'high', 'critical'] },
            urgency: { type: Type.STRING, enum: ['low', 'moderate', 'high', 'immediate'] },
            severity: { type: Type.STRING, enum: ['mild', 'moderate', 'severe', 'critical'] },
            emergency_required: { type: Type.BOOLEAN },
            recommended_action: { type: Type.STRING },
            care_instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            monitoring_advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            escalation_reason: { type: Type.STRING },
            dispatch_triggered: { type: Type.BOOLEAN }
          },
          required: ["symptoms", "risk_level", "urgency", "severity", "emergency_required", "recommended_action", "care_instructions"]
        }
      },
    });

    return JSON.parse(response.text || "{}") as SymptomReport;
  } catch (error: any) {
    console.error("Transcript analysis failed:", error);
    if (isAuthError(error)) {
      throw error;
    }
    
    // Fallback Report for 429 errors
    return {
      symptoms: ["Transcript recorded", "Analysis pending"],
      risk_level: "medium", // Default to medium risk for safety
      urgency: "moderate",
      severity: "moderate",
      emergency_required: false,
      recommended_action: "Automated report generation failed due to high system load. Please review transcript or consult a professional.",
      care_instructions: ["If symptoms persist, seek medical attention", "Keep patient comfortable"],
      monitoring_advice: ["Watch for changes in consciousness or breathing"],
      escalation_reason: "Report generation quota exceeded",
      dispatch_triggered: false
    };
  }
}

export async function getAlternativesForStep(injuryType: string, stepText: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `The user is dealing with a "${injuryType}" and is currently on this first aid step: "${stepText}". 
      They are missing equipment or having trouble. 
      Provide a concise, helpful alternative (e.g. if missing cotton, suggest clean cloth). 
      Keep it brief (max 2 sentences).`,
      config: {
        systemInstruction: "You are a First Aid assistant giving quick household alternatives for medical supplies.",
        temperature: 0.7,
      },
    });
    return response.text || "Try using any clean, lint-free cloth available to protect the area.";
  } catch (error) {
    console.error("Failed to get alternatives:", error);
    return "If standard supplies are missing, use the cleanest available cloth or bandage substitute.";
  }
}

export const criticalTriggerTool: FunctionDeclaration = {
  name: 'triggerCriticalProtocol',
  description: 'IMMEDIATELY call this if the user describes life-threatening symptoms (e.g., chest pain, difficulty breathing, stroke signs, severe bleeding, unconsciousness) OR if the user explicitly requests an ambulance, emergency services, or 911.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'The specific critical symptom or request detected.',
      }
    },
    required: ['reason']
  }
};

export const mildRiskTool: FunctionDeclaration = {
  name: 'suggestMildRiskOptions',
  description: 'Call this when symptoms indicate a MILD or MODERATE risk that is NOT life-threatening but may require medical attention. This presents the user with a choice to dispatch or continue.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      reason: {
        type: Type.STRING,
        description: 'Why this is considered a potential risk.',
      }
    },
    required: ['reason']
  }
};

export const startSymptomChat = (contextString: string): Chat => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are a Professional Medical Triage Assistant.
      Your goal is to assess the user's symptoms via a structured conversation to determine severity and provide guidance.
      
      CONTEXT:
      ${contextString}

      PROTOCOL:
      1. **Intake Phase**: Ask about main symptoms, onset time, and severity (1-10).
      2. **Assessment Phase**: Ask specific follow-up questions to rule out red flags.
      3. **Triage & Tools**:
         - **CRITICAL / RED FLAG** (Chest pain, Stroke, Unconscious, Severe Bleeding, User Requests Ambulance): Call \`triggerCriticalProtocol\` IMMEDIATELY. Do not hesitate.
         - **MODERATE / MILD RISK** (Persistent pain, high fever, potential fracture): Call \`suggestMildRiskOptions\`.
         - **NORMAL / LOW RISK**: Provide self-care advice directly in text.
      
      BEHAVIOR:
      - Be calm, professional, and concise.
      - Ask one question at a time.
      - Do not diagnose diseases. Assess risk/urgency.
      `,
      tools: [{ functionDeclarations: [criticalTriggerTool, mildRiskTool] }],
    }
  });
};
