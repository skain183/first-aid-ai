
import React, { useState, useRef } from 'react';
import { UserProfile, CountryProfile } from '../types';
import { saveUserProfile } from '../services/storage';
import { COUNTRIES } from '../services/countries';
import { ArrowRight, User, MapPin, FileText, Phone, CheckCircle, Upload, Shield, AlertCircle, Search, ChevronRight } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    gender: 'Male',
    id_number: '',
    address: { country: '', city: '', full_address: '' },
    medical_info: { history: '', conditions: '', allergies: '', medications: '', files: [] },
    emergency_contact: { name: '', number: '' },
    consent_status: false,
    country_profile: undefined
  });
  
  const [idError, setIdError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileInputRef = useRef<HTMLInputElement>(null);

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updateNestedField = (section: keyof UserProfile, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as any),
        [field]: value
      }
    }));
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!/^\d*$/.test(val)) return; 
    if (val.length > 10) return;

    if (val.length > 0 && !['1', '2'].includes(val[0])) {
      setIdError("ID must start with 1 (Citizen) or 2 (Resident)");
    } else if (val.length === 10) {
      setIdError(null); 
    } else {
      setIdError("ID must be exactly 10 digits");
    }

    updateField('id_number', val);
  };

  const handleCountrySelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = COUNTRIES.find(c => c.country_name === e.target.value);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        country_profile: selected,
        address: { ...prev.address!, country: selected.country_name }
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({
          ...prev,
          medical_info: {
            ...prev.medical_info!,
            files: [...(prev.medical_info?.files || []), { name: file.name, data: base64 }]
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setFormData(prev => ({ ...prev, profile_image: base64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (formData.id_number?.length !== 10) {
        setIdError("ID must be exactly 10 digits");
        return;
      }
      if (!['1', '2'].includes(formData.id_number?.[0] || '')) {
        setIdError("Invalid ID start digit");
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.country_profile) {
        alert("Please select a valid country.");
        return;
      }
    }

    if (step < 5) setStep(step + 1);
    else handleSubmit();
  };

  const handleSubmit = () => {
    if (!formData.consent_status) {
      alert("Please agree to the data usage terms.");
      return;
    }

    const emergencyNumber = formData.emergency_contact?.number || formData.country_profile?.emergency_number || '911';
    const emergencyName = formData.emergency_contact?.name || 'Emergency Services';

    const fullProfile: UserProfile = {
      user_id: `user_${Date.now()}`,
      name: formData.name || 'Unknown',
      age: formData.age || '0',
      gender: formData.gender || 'Male',
      id_number: formData.id_number || '',
      country_profile: formData.country_profile || COUNTRIES[0],
      address: formData.address!,
      medical_info: formData.medical_info!,
      emergency_contact: {
        name: emergencyName,
        number: emergencyNumber
      },
      profile_image: formData.profile_image || null,
      account_created_at: new Date().toISOString(),
      last_updated: new Date().toISOString(),
      consent_status: formData.consent_status!
    };

    saveUserProfile(fullProfile);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-fade-in font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-white p-6 border-b border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Medical Profile Setup</h1>
              <p className="text-slate-500 text-sm">National Emergency Response System</p>
            </div>
            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-600">
              <Shield className="w-5 h-5" />
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                s <= step ? 'bg-teal-600' : 'bg-slate-200'
              }`}></div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-teal-600" /> Identity Verification
              </h2>
              
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Full Legal Name</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none transition-all text-slate-800 font-medium"
                  placeholder="Enter full name"
                  value={formData.name || ''}
                  onChange={e => updateField('name', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Age</label>
                  <input 
                    type="number" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all text-slate-800 font-medium"
                    placeholder="Years"
                    value={formData.age || ''}
                    onChange={e => updateField('age', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Gender</label>
                  <div className="relative">
                    <select 
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all text-slate-800 font-medium appearance-none"
                      value={formData.gender}
                      onChange={e => updateField('gender', e.target.value)}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                    <ChevronRight className="w-4 h-4 text-slate-400 absolute right-3 top-4 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">National ID Number</label>
                <div className="relative">
                  <input 
                    type="text" 
                    maxLength={10}
                    className={`w-full p-3.5 bg-slate-50 border rounded-xl focus:outline-none transition-all font-mono tracking-wider font-bold text-slate-800 ${
                      idError ? 'border-red-500 focus:border-red-500 bg-red-50' : 'border-slate-200 focus:border-teal-500'
                    }`}
                    placeholder="1XXXXXXXXX"
                    value={formData.id_number || ''}
                    onChange={handleIdChange}
                  />
                  {formData.id_number && !idError && (
                    <CheckCircle className="absolute right-3 top-3.5 w-5 h-5 text-teal-600" />
                  )}
                </div>
                {idError ? (
                  <p className="text-[11px] text-red-600 mt-1.5 font-medium flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {idError}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1.5">Official 10-digit identification number</p>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-teal-600" /> Residence & Location
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Country / Region</label>
                <div className="relative">
                  <select 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all appearance-none text-slate-800 font-medium"
                    value={formData.country_profile?.country_name || ''}
                    onChange={handleCountrySelect}
                  >
                    <option value="" disabled>Select country</option>
                    {COUNTRIES.sort((a,b) => a.country_name.localeCompare(b.country_name)).map((c) => (
                      <option key={c.country_code} value={c.country_name}>
                        {c.country_name} ({c.dial_code})
                      </option>
                    ))}
                  </select>
                  <Search className="absolute right-3 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {formData.country_profile && (
                  <div className="mt-2 p-3 bg-teal-50 rounded-xl flex items-center gap-3 border border-teal-100">
                     <div className="p-1.5 bg-white border border-teal-100 text-teal-800 rounded-lg font-bold text-xs shadow-sm">
                       {formData.country_profile.country_code}
                     </div>
                     <div className="text-xs text-teal-900">
                       <p><span className="font-semibold text-teal-700">Emergency Line:</span> <span className="font-mono text-lg font-bold align-middle ml-1">{formData.country_profile.emergency_number}</span></p>
                     </div>
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">City</label>
                <input 
                  type="text" 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all text-slate-800 font-medium"
                  placeholder="Current city"
                  value={formData.address?.city || ''}
                  onChange={e => updateNestedField('address', 'city', e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Residential Address</label>
                <textarea 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all h-24 resize-none text-slate-800 font-medium"
                  placeholder="Building, Street, District..."
                  value={formData.address?.full_address || ''}
                  onChange={e => updateNestedField('address', 'full_address', e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" /> Medical History
              </h2>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Chronic Conditions (Optional)</label>
                <textarea 
                  className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all h-20 resize-none text-slate-800"
                  placeholder="Diabetes, Hypertension, Asthma..."
                  value={formData.medical_info?.history || ''}
                  onChange={e => updateNestedField('medical_info', 'history', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Allergies</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all text-slate-800"
                    placeholder="e.g. Penicillin"
                    value={formData.medical_info?.allergies || ''}
                    onChange={e => updateNestedField('medical_info', 'allergies', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Medications</label>
                  <input 
                    type="text" 
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-teal-500 outline-none transition-all text-slate-800"
                    placeholder="Current meds"
                    value={formData.medical_info?.medications || ''}
                    onChange={e => updateNestedField('medical_info', 'medications', e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 hover:bg-slate-100 transition-colors">
                 <div className="flex items-center justify-between mb-2">
                   <span className="text-xs font-bold text-slate-500 uppercase">Attach Medical Records</span>
                   <button 
                     onClick={() => fileInputRef.current?.click()}
                     className="text-xs font-bold text-teal-600 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"
                   >
                     <Upload className="w-3 h-3" /> Upload
                   </button>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept=".pdf,.jpg,.png" />
                 </div>
                 <div className="space-y-2">
                   {formData.medical_info?.files.map((f, i) => (
                     <div key={i} className="flex items-center gap-2 bg-white p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 shadow-sm">
                       <FileText className="w-3 h-3 text-slate-400" />
                       <span className="truncate flex-1 font-medium">{f.name}</span>
                     </div>
                   ))}
                   {formData.medical_info?.files.length === 0 && (
                     <p className="text-center text-xs text-slate-400 py-3">No documents uploaded</p>
                   )}
                 </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="text-center">
                 <div className="w-24 h-24 bg-slate-100 rounded-full mx-auto mb-4 relative flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                    {formData.profile_image ? (
                      <img src={formData.profile_image} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-slate-300" />
                    )}
                    <button 
                      onClick={() => profileInputRef.current?.click()}
                      className="absolute bottom-0 w-full bg-slate-900/60 backdrop-blur-sm text-white text-[10px] py-1.5 font-bold text-center tracking-widest hover:bg-slate-900/80 transition-colors"
                    >
                      UPLOAD
                    </button>
                    <input type="file" ref={profileInputRef} className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
                 </div>
                 <h2 className="text-lg font-bold text-slate-800">Profile Photo</h2>
                 <p className="text-xs text-slate-500">Helps emergency responders identify you</p>
              </div>

              <div className="bg-red-50 p-5 rounded-2xl border border-red-100">
                <div className="flex items-center gap-2 mb-4 text-red-800">
                  <Phone className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-wide">Emergency Contact</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-red-800/60 uppercase block mb-1">Contact Name</label>
                    <input 
                      type="text" 
                      className="w-full p-3 bg-white border border-red-100 rounded-xl focus:border-red-400 outline-none transition-all text-sm font-medium text-slate-900"
                      placeholder="e.g. Parent, Spouse"
                      value={formData.emergency_contact?.name || ''}
                      onChange={e => updateNestedField('emergency_contact', 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-red-800/60 uppercase block mb-1">Phone Number</label>
                    <div className="relative">
                       <span className="absolute left-3 top-3 text-slate-400 text-sm font-mono font-medium">
                         {formData.country_profile?.dial_code || '+??'}
                       </span>
                       <input 
                          type="tel" 
                          className="w-full p-3 pl-14 bg-white border border-red-100 rounded-xl focus:border-red-400 outline-none transition-all text-sm font-medium text-slate-900"
                          placeholder="Number"
                          value={formData.emergency_contact?.number || ''}
                          onChange={e => updateNestedField('emergency_contact', 'number', e.target.value)}
                        />
                    </div>
                  </div>
                  <p className="text-[11px] text-red-600/70 font-medium italic">
                    * Default fallback: {formData.country_profile?.emergency_number || '911'} ({formData.country_profile?.country_name || 'National Service'})
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-fade-in text-center pt-4">
              <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-sm border border-teal-100">
                <Shield className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Registration Complete</h2>
                <p className="text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
                  Your medical profile has been encrypted and stored locally. It will only be accessed during emergency dispatch events.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl text-left border border-slate-200 mt-6">
                <div className="flex items-start gap-3">
                  <input 
                    type="checkbox" 
                    id="consent"
                    className="mt-1 w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    checked={formData.consent_status}
                    onChange={e => updateField('consent_status', e.target.checked)}
                  />
                  <label htmlFor="consent" className="text-xs text-slate-600 font-medium leading-relaxed">
                    I consent to the storage and processing of my personal data for the purpose of emergency medical assistance and AI-assisted dispatch. I understand this data is used to provide accurate information to emergency responders.
                  </label>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-6 border-t border-slate-100 flex justify-between bg-white items-center">
          {step > 1 ? (
            <button 
              onClick={() => setStep(step - 1)}
              className="px-6 py-3 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors"
            >
              Back
            </button>
          ) : <div></div>}
          
          <button 
            onClick={handleNext}
            disabled={step === 5 && !formData.consent_status}
            className={`px-8 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-teal-700 active:scale-95 transition-all shadow-lg shadow-teal-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none`}
          >
            {step === 5 ? 'Finish Setup' : 'Continue'}
            {step < 5 ? <ArrowRight className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
