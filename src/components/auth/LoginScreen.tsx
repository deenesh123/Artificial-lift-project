import React, { useState } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Workflow, 
  Zap, 
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { DEMO_USERS } from '../../data/mockData';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [selectedUser, setSelectedUser] = useState<UserProfile>(DEMO_USERS[0]);
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState('demo-als-2026');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'quick' | 'credentials'>('quick');

  const handleSelectRole = (user: UserProfile) => {
    setSelectedUser(user);
    setEmail(user.email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(selectedUser);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Demo Notification */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">ALS Prototype Environment</span>
          <span>— Client Presentation Mode</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300">
          <Activity className="w-3.5 h-3.5" />
          <span>DEMO SIMULATED DATA</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Left Brand & Story Panel (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 via-slate-950 to-blue-950/60 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between">
            <div>
              {/* Brand Lockup */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
                  <Flame className="w-7 h-7 text-white stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white font-mono">
                    ALS
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
                    Artificial Lift Suite
                  </div>
                </div>
              </div>

              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug">
                Intelligent Artificial Lift & Energy Operations Platform
              </h2>

              <p className="mt-3 text-xs lg:text-sm text-slate-300 leading-relaxed">
                Next-generation surveillance and autonomous optimization for high-value artificial lift assets: ESP systems, sucker rod beam pumps, gas lift networks, and progressing cavity pumps.
              </p>

              {/* Core Feature Pillars */}
              <div className="mt-6 space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                  <Activity className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">ESP Real-Time Surveillance</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      High-frequency downhole sensor telemetry, intake pressure tracking, motor temperature envelopes, and dynamic VFD speed trimming.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                  <Workflow className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Digital Twin & Dynamometer Analysis</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Nodal analysis pressure gradients, surface-to-downhole pump card reconstruction, and automated fluid pound detection.
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                  <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-semibold text-slate-200">Energy Intensity & Reliability</div>
                    <div className="text-[11px] text-slate-400 leading-normal">
                      Substation load tracking, kWh per lifted barrel optimization, Weibull survival curves, and failure root cause Pareto analytics.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-6 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Operational Basins:</span>
              <span className="font-mono text-slate-300">Permian · Eagle Ford · Bakken</span>
            </div>
          </div>

          {/* Right Login / Persona Selection Panel (7 cols) */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Operations Portal Access
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select a client demo persona or sign in with credentials
                  </p>
                </div>

                {/* Tab switch */}
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('quick')}
                    className={`px-3 py-1 font-semibold rounded transition-colors ${
                      activeTab === 'quick'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1-Click Demo Roles
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('credentials')}
                    className={`px-3 py-1 font-semibold rounded transition-colors ${
                      activeTab === 'credentials'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Credentials
                  </button>
                </div>
              </div>

              {activeTab === 'quick' ? (
                /* 1-Click Role Switcher List */
                <div className="space-y-4">
                  <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase font-mono">
                    CHOOSE OPERATIONAL DEMO PERSONA ({DEMO_USERS.length} AVAILABLE):
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto pr-1">
                    {DEMO_USERS.map((user) => {
                      const isSelected = selectedUser.id === user.id;
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleSelectRole(user)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                              isSelected
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{user.name}</span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                {user.roleTitle}
                              </div>
                              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                                Default: {user.defaultPortal === 'admin' ? 'Admin Portal' : 'User Portal'} · {user.fieldLocation}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            {isSelected ? (
                              <CheckCircle2 className="w-5 h-5 text-cyan-400" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-700" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Manual Credentials Form */
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-950/30 border border-blue-900/60 text-xs text-blue-300 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                    <div>
                      <strong>Demo Credentials:</strong> Any password works in this client presentation. You are currently logging in as{' '}
                      <span className="text-white font-semibold">{selectedUser.name}</span> ({selectedUser.roleTitle}).
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Enterprise Email / Account
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Launch / Login Action Button */}
            <div className="mt-6 pt-4 border-t border-slate-800 space-y-3">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99]"
              >
                <span>Launch {selectedUser.defaultPortal === 'admin' ? 'Admin Portal' : 'User Portal'} as {selectedUser.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Role-based demo authorization
                </span>
                <span>Role switching available inside platform</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">ALS Platform</span>
          <span>·</span>
          <span>Artificial Lift Suite</span>
          <span>·</span>
          <span>Prototype Presentation</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Simulated demo environment for customer evaluation. Not connected to active SCADA/RTOC hardware.
        </div>
      </footer>
    </div>
  );
};
