
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { getUserProfile, saveUserProfile } from '../services/storage';
import { User, MapPin, FileText, Phone, Camera, Save, ArrowLeft, Shield, Globe } from 'lucide-react';

interface ProfileViewProps {
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ onBack }) => {
  const [profile, setProfile] = useState<UserProfile | null>(getUserProfile());
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const handleSave = () => {
    saveUserProfile(profile);
    setIsEditing(false);
  };

  const updateField = (section: keyof UserProfile | null, field: string, value: any) => {
    if (!profile) return;
    
    if (section) {
      setProfile({
        ...profile,
        [section]: {
          ...(profile[section] as any),
          [field]: value
        }
      });
    } else {
      setProfile({ ...profile, [field]: value });
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile(prev => prev ? ({ ...prev, profile_image: reader.result as string }) : null);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="h-full bg-slate-50 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-100 flex items-center justify-between sticky top-0 z-20">
        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-slate-800">My Profile</h2>
        <button 
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`p-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all ${
            isEditing ? 'bg-blue-600 text-white px-4' : 'text-blue-600 hover:bg-blue-50'
          }`}
        >
          {isEditing ? (
             <>
               <Save className="w-4 h-4" /> Save
             </>
          ) : 'Edit'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex items-center gap-6">
          <div className="relative">
             <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden border-2 border-white shadow-lg">
               {profile.profile_image ? (
                 <img src={profile.profile_image} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-slate-300">
                   <User className="w-10 h-10" />
                 </div>
               )}
             </div>
             {isEditing && (
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-md hover:bg-blue-700"
               >
                 <Camera className="w-3 h-3" />
               </button>
             )}
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
          </div>
          <div>
            {isEditing ? (
              <input 
                className="text-xl font-bold text-slate-900 border-b border-slate-200 focus:border-blue-500 outline-none w-full mb-1"
                value={profile.name}
                onChange={e => updateField(null, 'name', e.target.value)}
              />
            ) : (
              <h1 className="text-xl font-bold text-slate-900">{profile.name}</h1>
            )}
            <p className="text-sm text-slate-500 font-mono tracking-widest">ID: {profile.id_number}</p>
          </div>
        </div>

        {/* Region & Emergency Number Info */}
        <div className="bg-green-50 rounded-3xl p-6 border border-green-100 flex items-start gap-3">
          <div className="p-2 bg-green-100 rounded-lg text-green-700">
             <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1">
             <h3 className="text-xs font-bold text-green-800 uppercase mb-1">Region Setting</h3>
             <p className="text-sm font-bold text-green-900">{profile.country_profile?.country_name || profile.address.country}</p>
             <p className="text-xs text-green-700 mt-1">
               Emergency Number: <span className="font-mono font-bold">{profile.country_profile?.emergency_number}</span>
             </p>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-red-50 rounded-3xl p-6 border border-red-100">
          <h3 className="text-xs font-bold text-red-700 uppercase mb-4 flex items-center gap-2">
            <Phone className="w-4 h-4" /> Emergency Contact
          </h3>
          <div className="space-y-3">
             <div>
               <label className="text-[10px] font-bold text-red-400 uppercase">Name</label>
               {isEditing ? (
                 <input 
                   className="w-full bg-white p-2 rounded-lg border border-red-100 text-sm focus:border-red-400 outline-none"
                   value={profile.emergency_contact.name}
                   onChange={e => updateField('emergency_contact', 'name', e.target.value)}
                 />
               ) : (
                 <p className="font-semibold text-slate-800">{profile.emergency_contact.name}</p>
               )}
             </div>
             <div>
               <label className="text-[10px] font-bold text-red-400 uppercase">Phone</label>
               {isEditing ? (
                 <input 
                   className="w-full bg-white p-2 rounded-lg border border-red-100 text-sm focus:border-red-400 outline-none"
                   value={profile.emergency_contact.number}
                   onChange={e => updateField('emergency_contact', 'number', e.target.value)}
                 />
               ) : (
                 <p className="font-semibold text-slate-800 font-mono">{profile.emergency_contact.number}</p>
               )}
             </div>
          </div>
        </div>

        {/* Medical Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Medical Information
          </h3>
          
          <div className="space-y-4">
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase">Conditions</label>
               {isEditing ? (
                 <textarea 
                   className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm focus:border-blue-400 outline-none resize-none h-20"
                   value={profile.medical_info.conditions}
                   onChange={e => updateField('medical_info', 'conditions', e.target.value)}
                 />
               ) : (
                 <p className="text-sm text-slate-700 leading-relaxed">{profile.medical_info.conditions || "None listed"}</p>
               )}
             </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Allergies</label>
                 {isEditing ? (
                   <input 
                     className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-sm"
                     value={profile.medical_info.allergies}
                     onChange={e => updateField('medical_info', 'allergies', e.target.value)}
                   />
                 ) : (
                   <p className="text-sm text-slate-700">{profile.medical_info.allergies || "None"}</p>
                 )}
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Medications</label>
                 {isEditing ? (
                   <input 
                     className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-sm"
                     value={profile.medical_info.medications}
                     onChange={e => updateField('medical_info', 'medications', e.target.value)}
                   />
                 ) : (
                   <p className="text-sm text-slate-700">{profile.medical_info.medications || "None"}</p>
                 )}
               </div>
             </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 uppercase mb-4 flex items-center gap-2">
            <MapPin className="w-4 h-4" /> Location
          </h3>
          <div className="space-y-3">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase">City</label>
                 {isEditing ? (
                   <input 
                     className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-sm"
                     value={profile.address.city}
                     onChange={e => updateField('address', 'city', e.target.value)}
                   />
                 ) : (
                   <p className="text-sm text-slate-700">{profile.address.city}</p>
                 )}
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase">Country</label>
                 {isEditing ? (
                   <input 
                     className="w-full bg-slate-50 p-2 rounded-lg border border-slate-200 text-sm"
                     value={profile.address.country}
                     onChange={e => updateField('address', 'country', e.target.value)}
                   />
                 ) : (
                   <p className="text-sm text-slate-700">{profile.address.country}</p>
                 )}
               </div>
             </div>
             <div>
               <label className="text-[10px] font-bold text-slate-400 uppercase">Address</label>
               {isEditing ? (
                 <textarea 
                   className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm focus:border-blue-400 outline-none resize-none"
                   value={profile.address.full_address}
                   onChange={e => updateField('address', 'full_address', e.target.value)}
                 />
               ) : (
                 <p className="text-sm text-slate-700">{profile.address.full_address}</p>
               )}
             </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 rounded-2xl flex gap-3">
           <Shield className="w-5 h-5 text-slate-400 shrink-0" />
           <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
             Your data is encrypted and stored locally on your device. It is used to provide accurate AI assessments and emergency dispatch information.
           </p>
        </div>

      </div>
    </div>
  );
};
