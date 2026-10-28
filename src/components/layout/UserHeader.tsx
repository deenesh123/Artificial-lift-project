import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  ShieldCheck, 
  User, 
  ChevronDown, 
  LogOut, 
  Check, 
  Clock, 
  Flame, 
  Radio, 
  X,
  Layers,
  Activity,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { PortalType, UserProfile, WellAsset } from '../../types';
import { DEMO_ALARMS } from '../../data/mockData';
import { DemoNoticeBanner } from './DemoNoticeBanner';

interface UserHeaderProps {
  currentUser: UserProfile;
  selectedAsset: WellAsset | null;
  onClearSelectedAsset: () => void;
  onSelectPortal?: (portal: PortalType) => void;
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToRoute: (routeId: string) => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  currentUser,
  selectedAsset,
  onClearSelectedAsset,
  onSelectPortal,
  onLogout,
  searchQuery,
  onSearchChange,
  onNavigateToRoute,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [utcTimeStr, setUtcTimeStr] = useState('');

  const unreadAlarms = DEMO_ALARMS.filter(a => !a.acknowledged);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' CST');
      setUtcTimeStr(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-cyan-900/40 shadow-lg">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 gap-3">
        {/* Zone 1: User Portal Brand & Operational Scope */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-700 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/40">
              <Radio className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">ALS</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-300 font-mono">
                  User Portal
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
                Field Operations & Telemetry Surveillance
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Selected Asset Context Badge */}
          <div className="hidden lg:flex items-center gap-2">
            {selectedAsset ? (
              <div className="flex items-center gap-2 bg-slate-950/90 border border-cyan-500/40 px-3 py-1.5 rounded-lg text-xs">
                <span className={`w-2 h-2 rounded-full ${
                  selectedAsset.status === 'Nominal' ? 'bg-emerald-400 animate-pulse' :
                  selectedAsset.status === 'Offline' ? 'bg-rose-500' : 'bg-amber-400'
                }`} />
                <span className="text-slate-400 text-[11px]">Selected Asset:</span>
                <span className="font-bold font-mono text-cyan-300">{selectedAsset.id}</span>
                <span className="text-slate-300 font-sans hidden xl:inline">({selectedAsset.name})</span>
                <button
                  onClick={onClearSelectedAsset}
                  className="ml-1 p-0.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Return to All Assets Overview"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-mono text-[11px] text-slate-400">Context:</span>
                <span className="font-semibold text-white">All Monitored Assets (16 Units)</span>
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Search & Live Clock */}
        <div className="flex-1 max-w-md hidden md:flex items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search assets (e.g. ALS-DEL-ESP-104), telemetry tags, alarms..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            {searchQuery && (
              <button 
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/70 px-2.5 py-1.5 rounded border border-slate-800 shrink-0">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || '12:00:00 CST'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{utcTimeStr}</span>
          </div>
        </div>

        {/* Zone 3: Controls, Switch to Admin (if authorized), Alarms, Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Client Presentation & Briefing Pack Quick Download (PART K) */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            <a
              href="/assets/ALS_Enterprise_Client_Presentation.pptx"
              download="ALS_Enterprise_Client_Presentation.pptx"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-800 transition-colors shadow-sm"
              title="Download 12-slide client presentation PowerPoint"
            >
              <span className="font-mono font-bold text-[10px] text-cyan-400">PPTX</span>
              <span>Client Slides</span>
            </a>
            <a
              href="/assets/ALS_Enterprise_Presenter_Guide_and_QA.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Open Presenter Script & 12 Client Q&As"
            >
              <span>Guide &amp; Q&amp;A</span>
            </a>
          </div>

          <DemoNoticeBanner compact />

          {/* Conditional Admin Portal Switcher */}
          {currentUser.allowedPortals?.includes('admin') && onSelectPortal && (
            <button
              onClick={() => onSelectPortal('admin')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              title="Switch to Administrator Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Admin Portal</span>
            </button>
          )}

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-md text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Active Alarms"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadAlarms.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                  {unreadAlarms.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Active Alarms</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                      {unreadAlarms.length} Unacknowledged
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      onNavigateToRoute('alarms-user');
                      setShowNotifications(false);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Alarm Center →
                  </button>
                </div>
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {unreadAlarms.map(alarm => (
                    <div 
                      key={alarm.id} 
                      onClick={() => {
                        onNavigateToRoute('alarms-user');
                        setShowNotifications(false);
                      }}
                      className="p-3 hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-rose-400 font-mono">{alarm.wellName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">{alarm.id}</span>
                      </div>
                      <p className="text-xs text-slate-200 line-clamp-1">{alarm.title}</p>
                      <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                        <span>{alarm.parameter}</span>
                        <span className="text-rose-300 font-mono font-medium">{alarm.currentValue}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-md transition-colors text-left"
            >
              <div className="w-6 h-6 rounded bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-white leading-tight">
                  {currentUser.name.split(' ')[0]}
                </div>
                <div className="text-[10px] text-cyan-400 leading-none truncate max-w-[110px]">
                  {currentUser.roleTitle.split(' ')[0]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800">
                  <div className="text-xs font-bold text-white">{currentUser.name}</div>
                  <div className="text-[11px] text-cyan-400">{currentUser.roleTitle}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-0.5">{currentUser.email}</div>
                  <div className="text-[10px] text-slate-500 mt-1">Field: {currentUser.fieldLocation}</div>
                </div>

                <div className="py-1">
                  {selectedAsset && (
                    <button
                      onClick={() => {
                        onClearSelectedAsset();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Clear Selected Asset Filter</span>
                    </button>
                  )}
                  {currentUser.allowedPortals?.includes('admin') && onSelectPortal && (
                    <button
                      onClick={() => {
                        onSelectPortal('admin');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs text-blue-300 hover:text-white hover:bg-slate-800 flex items-center gap-2"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span>Switch to Admin Portal</span>
                    </button>
                  )}
                </div>

                <div className="border-t border-slate-800 pt-1 px-2">
                  <button
                    onClick={onLogout}
                    className="w-full text-left px-2 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out & Return to Login</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
