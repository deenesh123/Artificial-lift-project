import React from 'react';
import { ShieldX, ArrowLeft, LogOut, Flame } from 'lucide-react';
import { UserProfile } from '../../types';

interface UnauthorizedAccessProps {
  currentUser: UserProfile;
  attemptedPortal?: string;
  onReturnToUserPortal: () => void;
  onSignOut: () => void;
}

export const UnauthorizedAccess: React.FC<UnauthorizedAccessProps> = ({
  currentUser,
  attemptedPortal = 'Admin Portal',
  onReturnToUserPortal,
  onSignOut,
}) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Banner */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-semibold text-rose-300">Security Exception (HTTP 403)</span>
          <span>— Role Authorization Boundary</span>
        </div>
        <span className="font-mono text-[11px] text-amber-300">DEMO SIMULATED DATA</span>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-rose-900/60 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-600 to-red-800 flex items-center justify-center shadow-lg shadow-rose-500/20 border border-rose-400/40">
              <ShieldX className="w-6 h-6 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="text-xl font-bold tracking-tight text-white font-mono">403 FORBIDDEN</div>
              <div className="text-[10px] font-semibold text-rose-400 tracking-wider uppercase">Restricted Resource</div>
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="text-lg font-bold text-white tracking-tight">
              Administrative Access Denied
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your account role does not possess the required administrative authorizations to access the <span className="text-rose-300 font-semibold">{attemptedPortal}</span> or system configuration modules.
            </p>
          </div>

          {/* User Role Dossier */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AUTHENTICATED USER</span>
              <span className="text-white font-bold">{currentUser.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ASSIGNED ROLE</span>
              <span className="text-cyan-300 font-bold">{currentUser.roleTitle}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">AUTHORIZED PORTALS</span>
              <span className="text-slate-300">{currentUser.allowedPortals.join(', ').toUpperCase()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">ACCESS RESTRICTION</span>
              <span className="text-rose-400 font-bold">Admin Privileges Not Granted</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <button
              onClick={onReturnToUserPortal}
              className="w-full py-2.5 px-4 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to User Operations Portal</span>
            </button>

            <button
              onClick={onSignOut}
              className="w-full py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium border border-slate-700 flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span>Sign Out of ALS</span>
            </button>
          </div>
        </div>
      </div>

      <footer className="py-3 px-6 text-center text-xs text-slate-600">
        ALS Enterprise Operations Platform · Real-time SCADA & Lift Optimization
      </footer>
    </div>
  );
};
