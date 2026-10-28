import React, { useState } from 'react';
import { 
  Flame, 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowRight, 
  CheckCircle2, 
  Activity, 
  Cpu, 
  Workflow, 
  Zap, 
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  HelpCircle,
  X,
  ExternalLink,
  ShieldAlert,
  KeyRound,
  Radio,
  Sliders,
  Copy,
  Check
} from 'lucide-react';
import { UserProfile, UserRole } from '../../types';
import { DEMO_USERS } from '../../data/mockData';
import { AuthService } from '../../services/authService';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
  onGoogleLoginSuccess?: (user: UserProfile, isPending: boolean) => void;
}

interface DemoCredentialCard {
  id: string;
  roleTitle: string;
  category: 'Admin Portal' | 'User Portal' | 'Security Test';
  portalBadgeColor: string;
  username: string;
  email: string;
  password: string;
  description: string;
}

const CONFIGURED_DEMO_CREDENTIALS: DemoCredentialCard[] = [
  {
    id: 'admin',
    roleTitle: 'Admin — System & Asset Administrator',
    category: 'Admin Portal',
    portalBadgeColor: 'bg-blue-950 text-blue-300 border-blue-800',
    username: 'admin',
    email: 'admin@als-operations.demo',
    password: 'AdminDemo2026!',
    description: 'Full administrative rights to user management, SCADA registers, and asset provisioning.',
  },
  {
    id: 'field_eng',
    roleTitle: 'Field Operations Engineer',
    category: 'User Portal',
    portalBadgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    username: 'field_engineer',
    email: 'c.reyes@als-operations.demo',
    password: 'FieldDemo2026!',
    description: 'Field telemetry surveillance, VFD frequency tuning, pump curves, and job workflows.',
  },
  {
    id: 'surveillance',
    roleTitle: 'Surveillance Operator (RTOC)',
    category: 'User Portal',
    portalBadgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    username: 'surveillance_op',
    email: 'e.rostova@als-operations.demo',
    password: 'Surveillance2026!',
    description: '24/7 SCADA monitoring, alarm triage, and real-time downhole sensor surveillance.',
  },
  {
    id: 'executive',
    roleTitle: 'Executive Viewer (ESG & Economics)',
    category: 'User Portal',
    portalBadgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    username: 'executive_viewer',
    email: 'l.wu@als-operations.demo',
    password: 'ViewerDemo2026!',
    description: 'Read-only access to operational production dashboards, energy intensity, and analytics.',
  },
  {
    id: 'inactive',
    roleTitle: 'Deactivated Account (Security Test)',
    category: 'Security Test',
    portalBadgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    username: 'inactive_user',
    email: 'inactive.tech@als-operations.demo',
    password: 'Inactive2026!',
    description: 'Verifies the application blocks deactivated credentials with "Account Inactive".',
  },
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onGoogleLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'credentials' | 'demo_directory' | 'quick'>('credentials');
  
  // Credentials Form State
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('AdminDemo2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1-Click Demo Persona State
  const [selectedUser, setSelectedUser] = useState<UserProfile>(DEMO_USERS[0]);

  // Forgot Password Modal State
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Google OAuth Modal / Flow State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Populate credentials from reference card
  const handleApplyCredential = (card: DemoCredentialCard) => {
    setIdentifier(card.username);
    setPassword(card.password);
    setActiveTab('credentials');
    setErrorMessage(null);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Credentials Submit Handler
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const user = await AuthService.loginWithCredentials(identifier, password);
      setIsLoading(false);
      onLogin(user);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMessage(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  // 1-Click Quick Demo Submit
  const handleQuickSubmit = (user: UserProfile) => {
    setSelectedUser(user);
    onLogin(user);
  };

  // Google OAuth Flow Trigger
  const handleGoogleSignInClick = () => {
    setShowGoogleModal(true);
  };

  const handleExecuteGoogleAuth = async (mockEmail: string, mockName: string) => {
    setGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { user, isPending } = await AuthService.loginWithGoogle(mockEmail, mockName);
      setGoogleLoading(false);
      setShowGoogleModal(false);
      if (onGoogleLoginSuccess) {
        onGoogleLoginSuccess(user, isPending);
      } else {
        onLogin(user);
      }
    } catch (err: any) {
      setGoogleLoading(false);
      setErrorMessage(err.message || 'Google authentication failed.');
    }
  };

  // Password Reset Handler
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetMessage(null);
    setResetLoading(true);

    try {
      const msg = await AuthService.requestPasswordReset(resetIdentifier);
      setResetLoading(false);
      setResetMessage({ text: msg, type: 'success' });
    } catch (err: any) {
      setResetLoading(false);
      setResetMessage({ text: err.message || 'Password reset request failed.', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Demo Notification */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">ALS Enterprise Operations</span>
          <span>— Separate Admin & User Role-Based Authentication Gateway</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px] text-amber-300">
          <Activity className="w-3.5 h-3.5" />
          <span>DEMO SIMULATED CREDENTIALS</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
          
          {/* Left Brand & Architecture Story Panel (5 cols) with Dark Industrial Oilfield Visualization */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-between relative overflow-hidden">
            {/* Subtle background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              {/* Brand Lockup */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
                  <Flame className="w-7 h-7 text-white stroke-[2.2]" />
                </div>
                <div>
                  <div className="text-2xl font-bold tracking-tight text-white font-mono flex items-center gap-2">
                    <span>ALS</span>
                    <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-300">ENTERPRISE</span>
                  </div>
                  <div className="text-xs font-semibold text-cyan-400 tracking-wider uppercase font-mono">
                    Artificial Lift Suite
                  </div>
                </div>
              </div>

              <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight leading-snug">
                Intelligent Artificial Lift & Energy Operations
              </h2>

              <p className="mt-2 text-xs text-slate-300 leading-relaxed">
                Client-ready industrial telemetry cockpit for downhole ESP surveillance, beam pump dynamometer cards, SCADA registers, and digital twin simulation.
              </p>

              {/* Industrial Oilfield & Subsurface Vector Graphic */}
              <div className="my-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-inner">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pb-2 mb-2 border-b border-slate-800/70">
                  <span className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>PERMIAN BASIN REAL-TIME TELEMETRY</span>
                  </span>
                  <span className="text-[10px] text-emerald-400">POLL: 1000ms</span>
                </div>

                <svg viewBox="0 0 320 130" className="w-full h-auto text-slate-400 select-none">
                  {/* Sky/ground gradient backdrop */}
                  <defs>
                    <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#0B132B" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#030712" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="flowGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                      <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.3" />
                    </linearGradient>
                  </defs>

                  {/* Horizon line */}
                  <line x1="10" y1="52" x2="310" y2="52" stroke="#334155" strokeWidth="1.5" strokeDasharray="4 2" />
                  <text x="12" y="47" fill="#64748B" fontSize="8" fontFamily="monospace">SURFACE (0 FT)</text>

                  {/* Surface Pumpjack Schematic */}
                  <g transform="translate(35, 10)">
                    {/* Sampson Post */}
                    <polygon points="35,42 42,42 39,22 38,22" fill="#475569" stroke="#64748B" strokeWidth="0.8" />
                    <line x1="38.5" y1="22" x2="38.5" y2="42" stroke="#06B6D4" strokeWidth="0.6" />
                    {/* Walking Beam */}
                    <line x1="20" y1="18" x2="56" y2="26" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Horsehead */}
                    <path d="M 18,18 Q 14,24 16,30" stroke="#06B6D4" strokeWidth="2" fill="none" />
                    {/* Bridle & Polished Rod */}
                    <line x1="16" y1="30" x2="16" y2="42" stroke="#CBD5E1" strokeWidth="1" strokeDasharray="2 1" />
                    {/* Counterweight crank */}
                    <circle cx="50" cy="35" r="4" fill="#334155" stroke="#06B6D4" strokeWidth="1" />
                  </g>

                  {/* Surface Wellhead Christmas Tree (Center-Right) */}
                  <g transform="translate(145, 28)">
                    {/* Wellhead body */}
                    <rect x="0" y="8" width="16" height="16" rx="2" fill="#1E293B" stroke="#06B6D4" strokeWidth="1" />
                    {/* Valves */}
                    <line x1="-8" y1="16" x2="24" y2="16" stroke="#38BDF8" strokeWidth="2" />
                    <circle cx="-8" cy="16" r="2.5" fill="#0284C7" />
                    <circle cx="24" cy="16" r="2.5" fill="#0284C7" />
                    {/* Pressure Gauge */}
                    <circle cx="8" cy="4" r="3.5" fill="#0F172A" stroke="#38BDF8" strokeWidth="1" />
                    <line x1="8" y1="4" x2="10" y2="3" stroke="#22D3EE" strokeWidth="0.8" />
                    {/* Surface to Downhole Casing line */}
                    <line x1="8" y1="24" x2="8" y2="95" stroke="url(#flowGrad)" strokeWidth="3" />
                  </g>

                  {/* Subsurface Geological Formation & Downhole ESP Assembly */}
                  <g transform="translate(145, 52)">
                    {/* Casing String */}
                    <line x1="2" y1="0" x2="2" y2="72" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
                    <line x1="14" y1="0" x2="14" y2="72" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />

                    {/* Downhole ESP Unit at 8,200 ft */}
                    <rect x="4" y="38" width="8" height="24" rx="1.5" fill="#0369A1" stroke="#38BDF8" strokeWidth="1" />
                    {/* Intake ports */}
                    <circle cx="8" cy="43" r="1" fill="#38BDF8" />
                    <circle cx="8" cy="47" r="1" fill="#38BDF8" />
                    {/* Motor section */}
                    <rect x="5" y="52" width="6" height="8" fill="#1D4ED8" />

                    {/* Perforations / Inflow arrows */}
                    <path d="M -8,46 L 2,46 M -8,44 L -4,46 L -8,48" stroke="#10B981" strokeWidth="1" fill="none" />
                    <path d="M 24,46 L 14,46 M 24,44 L 20,46 L 24,48" stroke="#10B981" strokeWidth="1" fill="none" />

                    {/* Telemetry ping pulse */}
                    <circle cx="8" cy="45" r="7" stroke="#06B6D4" strokeWidth="0.8" fill="none" opacity="0.6" className="animate-ping" />
                  </g>

                  {/* Telemetry Readout callouts */}
                  <g transform="translate(200, 32)">
                    <rect x="0" y="0" width="112" height="42" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="0.8" />
                    <text x="6" y="12" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">IN-SITU TELEMETRY</text>
                    <text x="6" y="24" fill="#38BDF8" fontSize="8.5" fontWeight="bold" fontFamily="monospace">PIP: 1,420 PSI</text>
                    <text x="6" y="35" fill="#34D399" fontSize="8" fontFamily="monospace">T_MTR: 184°F · 58.2 Hz</text>
                  </g>

                  <g transform="translate(200, 80)">
                    <rect x="0" y="0" width="112" height="42" rx="4" fill="#0F172A" stroke="#334155" strokeWidth="0.8" />
                    <text x="6" y="12" fill="#94A3B8" fontSize="7.5" fontFamily="monospace">DIGITAL TWIN STATUS</text>
                    <text x="6" y="24" fill="#FBBF24" fontSize="8.5" fontWeight="bold" fontFamily="monospace">BHP: 2,180 PSI</text>
                    <text x="6" y="35" fill="#A7F3D0" fontSize="8" fontFamily="monospace">IPR EFF: 94.2% (VOGEL)</text>
                  </g>
                </svg>

                {/* Micro indicators bar */}
                <div className="grid grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-300">
                  <div className="text-center">
                    <div className="text-slate-500">WELLS</div>
                    <div className="font-bold text-white">20 Active</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500">LIFT TYPES</div>
                    <div className="font-bold text-cyan-300">ESP & Rod Pump</div>
                  </div>
                  <div className="text-center">
                    <div className="text-slate-500">SAFETY</div>
                    <div className="font-bold text-emerald-400">SIL-2 Gated</div>
                  </div>
                </div>
              </div>

              {/* Portal Division Explainer */}
              <div className="space-y-2.5">
                <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-900/60 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-900/50 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>Admin Governance</span>
                      <span className="text-[10px] font-mono text-blue-300">Super Admin</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Infrastructure config, SCADA register definitions, user provisioning, and role governance.
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-900/60 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-900/50 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white flex items-center gap-2">
                      <span>User Operations Cockpit</span>
                      <span className="text-[10px] font-mono text-cyan-300">Ops / RTOC / Exec</span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-normal">
                      Full operational suite: SCADA telemetry, Digital Twin, ESP & Pump diagnostics, Cable Shop & AI Assistant.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom note */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Enterprise RBAC Active</span>
              </span>
              <span className="text-cyan-300">v4.8 Client Ready</span>
            </div>
          </div>

          {/* Right Login / Persona Selection Panel (7 cols) */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between">
            <div>
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Portal Sign In
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sign in with username or email to access your assigned portal
                  </p>
                </div>

                {/* Tab switch */}
                <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('credentials');
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1 font-semibold rounded transition-colors ${
                      activeTab === 'credentials'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('demo_directory');
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1 font-semibold rounded transition-colors ${
                      activeTab === 'demo_directory'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Demo Accounts
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('quick');
                      setErrorMessage(null);
                    }}
                    className={`px-3 py-1 font-semibold rounded transition-colors ${
                      activeTab === 'quick'
                        ? 'bg-cyan-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1-Click Personas
                  </button>
                </div>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mb-4 p-3 rounded-lg bg-rose-950/80 border border-rose-800 text-xs text-rose-300 flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <div className="flex-1 font-sans">{errorMessage}</div>
                  <button onClick={() => setErrorMessage(null)} className="text-rose-400 hover:text-white">✕</button>
                </div>
              )}

              {activeTab === 'credentials' && (
                /* SECTION 1: CREDENTIALS (USERNAME/EMAIL & PASSWORD) */
                <div className="space-y-4">
                  {/* Google OAuth Quick Button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleGoogleSignInClick}
                      disabled={isLoading}
                      className="w-full py-2.5 px-4 rounded-lg bg-slate-950 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center justify-center gap-3 transition-all shadow-sm"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                      <span>Continue with Google OAuth</span>
                    </button>

                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-800" />
                      </div>
                      <div className="relative flex justify-center text-[10px] uppercase font-mono">
                        <span className="bg-slate-900 px-3 text-slate-500">or sign in with username or email</span>
                      </div>
                    </div>
                  </div>

                  {/* Username/Email & Password Form */}
                  <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Username or Enterprise Email
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="admin or field_engineer or user@company.com"
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-300">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setResetIdentifier(identifier);
                            setShowForgotPassword(true);
                          }}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••••••"
                          required
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-10 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors font-mono"
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

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-cyan-950/60 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-60"
                      >
                        {isLoading ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Authenticating Credentials...</span>
                          </>
                        ) : (
                          <>
                            <span>Sign In to Assigned Portal</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  {/* Active credentials preview helper */}
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-300 font-mono">Quick Switch:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('admin');
                          setPassword('AdminDemo2026!');
                        }}
                        className="text-blue-400 hover:underline font-mono"
                      >
                        admin
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIdentifier('field_engineer');
                          setPassword('FieldDemo2026!');
                        }}
                        className="text-cyan-400 hover:underline font-mono"
                      >
                        field_engineer
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('demo_directory')}
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>All Demo Credentials ➔</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'demo_directory' && (
                /* SECTION 2: VERIFIED DEMO ACCOUNTS DIRECTORY */
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase font-mono flex items-center justify-between">
                    <span>CONFIGURED DEMO ACCOUNTS (DEMO ONLY):</span>
                    <span className="text-[10px] text-amber-400">CLICK "FILL" TO AUTO-LOAD</span>
                  </div>

                  <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                    {CONFIGURED_DEMO_CREDENTIALS.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-xs font-bold text-white flex items-center gap-2">
                              <span>{card.roleTitle}</span>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${card.portalBadgeColor}`}>
                                {card.category}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">{card.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleApplyCredential(card)}
                            className="px-2.5 py-1 rounded text-xs font-mono bg-cyan-600 hover:bg-cyan-500 text-white font-medium shrink-0 transition-colors shadow-sm"
                          >
                            Fill ➔
                          </button>
                        </div>

                        <div className="bg-slate-900 rounded p-2 text-[11px] font-mono grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Username:</span>
                            <span className="text-cyan-300 font-bold">{card.username}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Password:</span>
                            <span className="text-amber-300 font-bold">{card.password}</span>
                          </div>
                          <div className="sm:col-span-2 flex items-center justify-between text-slate-400 text-[10px]">
                            <span>Alt Email: {card.email}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(`${card.username} / ${card.password}`, card.id)}
                              className="text-slate-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey === card.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey === card.id ? 'Copied' : 'Copy'}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'quick' && (
                /* SECTION 3: 1-CLICK DEMO PERSONAS FOR INSTANT TESTING */
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 tracking-wide uppercase font-mono flex items-center justify-between">
                    <span>SELECT OPERATIONAL DEMO PERSONA:</span>
                    <span className="text-[10px] text-cyan-400">{DEMO_USERS.length} ROLES</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                    {DEMO_USERS.map((user) => {
                      const isSelected = selectedUser.id === user.id;
                      const isAdmin = user.allowedPortals.includes('admin') && user.defaultPortal === 'admin';
                      return (
                        <div
                          key={user.id}
                          onClick={() => handleQuickSubmit(user)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/50'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                              isAdmin ? 'bg-blue-600 text-white' : 'bg-cyan-600 text-white'
                            }`}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{user.name}</span>
                                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                  isAdmin 
                                    ? 'bg-blue-950 text-blue-300 border-blue-800 font-semibold' 
                                    : 'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  {user.role.replace('_', ' ').toUpperCase()}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400 leading-tight mt-0.5">
                                {user.roleTitle}
                              </div>
                              <div className="text-[10px] font-mono mt-0.5 flex items-center gap-2">
                                <span className={isAdmin ? 'text-blue-400 font-semibold' : 'text-cyan-400 font-semibold'}>
                                  Routes to: {isAdmin ? 'Admin Portal' : 'User Portal'}
                                </span>
                                <span className="text-slate-600">•</span>
                                <span className="text-slate-400">@{user.username || user.email.split('@')[0]}</span>
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0 pl-2">
                            <span className="px-2.5 py-1 rounded text-[11px] font-mono bg-slate-800 hover:bg-cyan-600 text-cyan-300 hover:text-white transition-colors">
                              Launch ➔
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Security Assurance */}
            <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dual Portal RBAC Enforced</span>
              </span>
              <span>Session: 8 Hours (Encrypted)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Password Recovery
                </h4>
              </div>
              <button onClick={() => setShowForgotPassword(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              Enter your assigned username or enterprise email address to dispatch a password recovery token.
            </p>

            {resetMessage && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
                resetMessage.type === 'success'
                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                  : 'bg-rose-950/80 text-rose-300 border border-rose-800'
              }`}>
                {resetMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                )}
                <span>{resetMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Username or Corporate Email
                </label>
                <input
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="admin or user@company.com"
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5"
                >
                  {resetLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Dispatch Reset Token</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Google Sign In Integration & Test Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Google OAuth 2.0 Sign-In
                </h4>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-1 font-mono text-[11px]">
                <div className="text-cyan-400 font-bold">OAUTH 2.0 CONFIGURATION STATUS:</div>
                <div className="flex justify-between text-slate-400">
                  <span>Client ID:</span>
                  <span className="text-slate-200">VITE_GOOGLE_CLIENT_ID (Prepared)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Authorized Origin:</span>
                  <span className="text-slate-200">http://localhost:3000</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Redirect URI:</span>
                  <span className="text-slate-200">/auth/callback</span>
                </div>
              </div>

              <div className="text-xs font-semibold text-slate-400 font-mono uppercase pt-1">
                SELECT GOOGLE ACCOUNT TO AUTHENTICATE:
              </div>

              {/* Option 1: Unassigned Guest User (Triggers Account Pending Approval) */}
              <div
                onClick={() => handleExecuteGoogleAuth('engineer.guest@gmail.com', 'Alex Rivera (Guest)')}
                className="p-3 rounded-lg border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/40 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 font-mono">engineer.guest@gmail.com</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-900/60 text-amber-300 border border-amber-700">
                    Pending Role Assignment
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Authenticates as an unassigned Google contractor. Demonstrates the required <strong className="text-amber-300 font-medium">"Account Pending Approval"</strong> screen.
                </p>
              </div>

              {/* Option 2: Pre-Approved Google Admin */}
              <div
                onClick={() => handleExecuteGoogleAuth('admin@als-operations.demo', 'Sarah Jenkins')}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-blue-500/50 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">admin@als-operations.demo</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                    Administrator
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pre-linked corporate Google profile. Redirects to <strong className="text-blue-300">Admin Portal</strong>.
                </p>
              </div>

              {/* Option 3: Pre-Approved Google Field Engineer */}
              <div
                onClick={() => handleExecuteGoogleAuth('c.reyes@als-operations.demo', 'Carlos Reyes, PE')}
                className="p-3 rounded-lg border border-slate-800 bg-slate-950 hover:border-cyan-500/50 cursor-pointer transition-colors space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white font-mono">c.reyes@als-operations.demo</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Field Engineer
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Pre-linked corporate Google profile. Redirects to <strong className="text-cyan-300">User Operations Portal</strong>.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-3 px-6 text-center text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-400">ALS Platform</span>
          <span>·</span>
          <span>Artificial Lift Suite</span>
          <span>·</span>
          <span>Enterprise Gateway</span>
        </div>
        <div className="text-[11px] text-slate-400">
          Simulated demo environment for customer evaluation. Not connected to active SCADA/RTOC hardware.
        </div>
      </footer>
    </div>
  );
};
