import React, { useState } from "react";
import { 
  Sliders, 
  User as UserIcon, 
  Shield, 
  Check, 
  RefreshCw, 
  Mail, 
  Zap, 
  Clock 
} from "lucide-react";
import { ProductivityProfile, User } from "../types";

interface SettingsViewProps {
  currentUser: User;
  profile: ProductivityProfile;
  onUpdateProfile: (updates: Partial<ProductivityProfile>) => Promise<void>;
}

export default function SettingsView({
  currentUser,
  profile,
  onUpdateProfile
}: SettingsViewProps) {
  const [peakHours, setPeakHours] = useState(profile.peakHours || "Morning (09:00 - 12:00)");
  const [focusDuration, setFocusDuration] = useState(profile.focusDuration || 25);
  const [currentEnergy, setCurrentEnergy] = useState<"Low" | "Medium" | "High">(profile.currentEnergy || "High");
  const [persona, setPersona] = useState<"professional" | "student" | "business">(profile.persona || "professional");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await onUpdateProfile({
        peakHours,
        focusDuration: Number(focusDuration),
        currentEnergy,
        persona
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Profile Parameters update Form */}
      <div className="lg:col-span-7 cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Productivity Alignment Matrix
          </h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
            Configure optimal bio-metric values to refine scheduling heuristics
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Productivity Persona</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPersona("professional")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  persona === "professional"
                    ? "bg-cyan-500/10 border-cyan-500 text-white"
                    : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold uppercase text-cyan-400">Working Pro</div>
                <div className="text-[10px] mt-1 text-gray-300 leading-normal">
                  Meetings, deep work protection, & conflict management.
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setPersona("student")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  persona === "student"
                    ? "bg-purple-500/10 border-purple-500 text-white"
                    : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold uppercase text-purple-400">Student Mode</div>
                <div className="text-[10px] mt-1 text-gray-300 leading-normal">
                  Syllabus deadlines, active recall, & milestone gamification.
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPersona("business")}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  persona === "business"
                    ? "bg-amber-500/10 border-amber-500 text-white"
                    : "bg-black/40 border-white/10 text-gray-400 hover:border-white/20"
                }`}
              >
                <div className="text-xs font-bold uppercase text-amber-400">Business Owner</div>
                <div className="text-[10px] mt-1 text-gray-300 leading-normal">
                  High-leverage top 3 actions, macro planning, & delegation tracking.
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Peak Cognitive Hours</label>
            <select
              value={peakHours}
              onChange={(e) => setPeakHours(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="Early Morning (06:00 - 09:00)">Early Morning (06:00 - 09:00)</option>
              <option value="Morning (09:00 - 12:00)">Morning (09:00 - 12:00)</option>
              <option value="Afternoon (12:00 - 15:00)">Afternoon (12:00 - 15:00)</option>
              <option value="Evening (15:00 - 18:00)">Evening (15:00 - 18:00)</option>
              <option value="Night (18:00 - 22:00)">Night (18:00 - 22:00)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Focus Interval Block (mins)</label>
              <input
                type="number"
                min="5"
                max="120"
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 uppercase tracking-widest block">Bio-Energy Levels</label>
              <select
                value={currentEnergy}
                onChange={(e) => setCurrentEnergy(e.target.value as any)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
              >
                <option value="Low">Low Energy State</option>
                <option value="Medium">Medium Energy State</option>
                <option value="High">High Energy State</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition shadow-[0_0_12px_rgba(6,182,212,0.15)] cursor-pointer"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Alignment Saved</span>
              </>
            ) : (
              <span>Compile Parameters</span>
            )}
          </button>
        </form>
      </div>

      {/* Account Info details panel */}
      <div className="lg:col-span-5 cyber-glass border border-white/5 rounded-2xl p-6 text-white font-mono space-y-4 bg-black/30">
        <div className="border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white flex items-center gap-1.5">
            <UserIcon className="w-4 h-4 text-purple-400" />
            User Identity Profile
          </h3>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">
            Decrypted credentials and security roles
          </p>
        </div>

        <div className="space-y-3.5">
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex gap-3 items-center">
            <UserIcon className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="block text-[9px] text-gray-500 uppercase">Registered Name:</span>
              <span className="text-xs text-white font-bold">{currentUser?.fullName || "Not set"}</span>
            </div>
          </div>

          <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex gap-3 items-center">
            <Mail className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="block text-[9px] text-gray-500 uppercase">Secure Email:</span>
              <span className="text-xs text-white font-bold">{currentUser?.email || "Not set"}</span>
            </div>
          </div>

          <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex gap-3 items-center">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="block text-[9px] text-gray-500 uppercase">Access Role & Level:</span>
              <span className="text-xs text-white font-bold uppercase">{currentUser?.role || "USER"} • LEVEL 1</span>
            </div>
          </div>

          <div className="p-3 bg-black/40 border border-white/5 rounded-xl flex gap-3 items-center">
            <Clock className="w-4 h-4 text-cyan-400 shrink-0" />
            <div>
              <span className="block text-[9px] text-gray-500 uppercase">Provider Login type:</span>
              <span className="text-xs text-emerald-400 font-bold uppercase">
                {currentUser?.authProvider === "google" ? "Google Account Authenticated" : "Secure Account Passkey"}
              </span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
