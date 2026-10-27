import React, { useState } from 'react';
import { User, Mail, Phone, Shield, Ticket, CreditCard, Award, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface ProfilePageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate }) => {
  const { user, updateProfile, logout } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!user) {
    onNavigate('login');
    return null;
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateProfile(name, phone);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Account Profile</h1>
          <p className="text-xs text-gray-400 mt-1">Manage personal contact details and cinema membership tier</p>
        </div>

        <button
          onClick={() => {
            logout();
            onNavigate('home');
          }}
          className="px-4 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-400 text-xs font-semibold border border-red-600/20 transition self-start sm:self-auto"
        >
          Sign Out of Account
        </button>
      </div>

      {/* Membership Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#181d26] via-[#1f2737] to-[#12151c] border border-white/15 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#b80710] to-[#e50914] flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-red-600/30">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-bold text-white">{user.name}</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/10 text-gray-300">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            <div className="flex items-center space-x-2 text-xs text-amber-400 font-semibold mt-2">
              <Award className="w-4 h-4" />
              <span>IMovies Premiere Gold Club</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onNavigate('my-bookings')}
          className="px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-[#b80710] text-white font-bold text-xs flex items-center space-x-2 transition self-start sm:self-auto"
        >
          <Ticket className="w-4 h-4" />
          <span>View Ticket History</span>
        </button>
      </div>

      {/* Edit Information Form */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12151c] border border-white/10 space-y-6">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-base font-bold text-white">Contact & Profile Settings</h3>
          <p className="text-xs text-gray-400 mt-0.5">Keep your phone and name updated for booking SMS alerts</p>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Profile details updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300">Mobile Phone</label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-[#181d26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#e50914]"
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Email Address (Registered)</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-[#181d26]/50 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
