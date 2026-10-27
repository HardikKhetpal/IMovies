import React, { useState } from 'react';
import { Film, Lock, Mail, ArrowRight, Shield, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface LoginPageProps {
  onNavigate: (page: string, params?: any) => void;
  redirectParams?: any;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigate, redirectParams }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      await login(email, password);
      if (redirectParams?.redirect === 'seat-selection' && redirectParams?.showId) {
        onNavigate('seat-selection', { showId: redirectParams.showId });
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role: 'customer' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@imovies.com');
      setPassword('Admin@123');
    } else {
      setEmail('alex@example.com');
      setPassword('User@123');
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-[#e50914] flex items-center justify-center mx-auto shadow-lg shadow-red-600/30">
            <Film className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Sign In to IMovies</h1>
          <p className="text-xs text-gray-400">Access your cinema tickets, seat reservations, and loyalty perks</p>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="p-3 rounded-2xl bg-[#12151c] border border-white/10 space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block text-center">
            Instant Test Credentials
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleDemoFill('customer')}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-semibold border border-white/5 flex items-center justify-center space-x-1.5 transition"
            >
              <UserIcon className="w-3.5 h-3.5 text-blue-400" />
              <span>Demo Customer</span>
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/20 flex items-center justify-center space-x-1.5 transition"
            >
              <Shield className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo Admin</span>
            </button>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-[#12151c] border border-white/10 space-y-4 shadow-2xl">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-gray-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#181d26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-gray-300">Password</label>
              <span className="text-[11px] text-gray-500 hover:text-gray-300 cursor-pointer">Forgot?</span>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#181d26] border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#e50914]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#e50914] hover:bg-[#b80710] disabled:bg-gray-800 disabled:text-gray-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/30 transition flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-gray-400 pt-2">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={() => onNavigate('register')}
              className="text-[#e50914] font-bold hover:underline"
            >
              Sign Up
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};
