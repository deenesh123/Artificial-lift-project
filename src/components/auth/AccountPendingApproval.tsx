import React, { useState } from 'react';
import { ShieldAlert, Clock, LogOut, RefreshCw, Flame, CheckCircle2 } from 'lucide-react';
import { UserProfile } from '../../types';
import { AuthService } from '../../services/authService';

interface AccountPendingApprovalProps {
  user: UserProfile;
  onSignOut: () => void;
  onApproved: (updatedUser: UserProfile) => void;
}

export const AccountPendingApproval: React.FC<AccountPendingApprovalProps> = ({
  user,
  onSignOut,
  onApproved,
}) => {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage(null);
    await new Promise(r => setTimeout(r, 600));

    const users = AuthService.getUsers();
    const current = users.find(u => u.id === user.id);
    setChecking(false);

    if (current && current.status === 'active') {
      setStatusMessage('Congratulations! Your account role has been approved by an Administrator.');
      setTimeout(() => onApproved(current), 1000);
    } else {
      setStatusMessage('Account status is still pending review by the Systems Administrator.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Demo Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-semibold text-slate-200">ALS Identity & Authorization Gateway</span>
          <span>— Role Assignment Enforced</span>
        </div>
        <span className="font-mono text-[11px] text-amber-300">DEMO SIMULATED DATA</span>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur relative overflow-hidden">
          {/* Subtle gradient wash */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
              <Flame className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white font-mono">ALS</div>
              <div className="text-[10px] font-semibold text-cyan-400 tracking-wider uppercase">Artificial Lift Suite</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              <Clock className="w-3.5 h-3.5" />
              <span>Account Pending Administrator Approval</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Access Request Under Review
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your Google identity has been authenticated successfully. However, enterprise security policy requires an authorized Operations Administrator to assign your operational role and field permissions prior to granting platform access.
            </p>
          </div>

          {/* Identity Dossier */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AUTHENTICATED IDENTITY</span>
              <span className="text-white font-bold">{user.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">EMAIL ACCOUNT</span>
              <span className="text-cyan-300">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AUTHENTICATION PROVIDER</span>
              <span className="text-emerald-400">Google OAuth 2.0</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">CURRENT STATUS</span>
              <span className="text-amber-400 font-bold">Pending Role Provisioning</span>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.includes('Congratulations')
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-400" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking Status...' : 'Re-Check Approval Status'}</span>
            </button>

            <button
              onClick={onSignOut}
              className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out & Return to Login</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 text-center font-sans">
            Need urgent access? Contact your RTOC Operations Supervisor or email <span className="text-cyan-400">admin@als-operations.demo</span>
          </div>
        </div>
      </div>

      <footer className="py-3 px-6 text-center text-xs text-slate-600">
        ALS Enterprise Operations Platform · Real-time SCADA & Lift Optimization
      </footer>
    </div>
  );
};
