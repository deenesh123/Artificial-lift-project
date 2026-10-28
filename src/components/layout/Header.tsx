import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Search, 
  ShieldCheck, 
  User, 
  ChevronDown, 
  Layers, 
  LogOut, 
  Check, 
  Compass, 
  Clock, 
  ExternalLink,
  Flame,
  Radio,
  X
} from 'lucide-react';
import { PortalType, UserProfile, UserRole } from '../../types';
import { DEMO_USERS, DEMO_ALARMS } from '../../data/mockData';
import { DemoNoticeBanner } from './DemoNoticeBanner';

interface HeaderProps {
  currentPortal: PortalType;
  onSelectPortal: (portal: PortalType) => void;
  currentUser: UserProfile;
  onChangeUser: (user: UserProfile) => void;
  onLogout: () => void;
  activeField: string;
  onChangeField: (field: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onNavigateToRoute: (routeId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPortal,
  onSelectPortal,
  currentUser,
  onChangeUser,
  onLogout,
  activeField,
  onChangeField,
  searchQuery,
  onSearchChange,
  onNavigateToRoute,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showFieldMenu, setShowFieldMenu] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [utcTimeStr, setUtcTimeStr] = useState('');

  // Unacknowledged alarms count
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

  const fields = [
    'Permian Basin — Delaware North',
    'Permian Basin — Midland Core',
    'Eagle Ford — South Trend',
    'Bakken — Williston Basin',
    'All Operating Basins',
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-lg">
      <div className="flex items-center justify-between px-4 lg:px-6 h-16 gap-4">
        {/* Zone 1: Brand & Basin Context */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/30">
              <Flame className="w-5 h-5 text-white stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-white font-mono">ALS</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Artificial Lift Suite
                </span>
              </div>
              <p className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
                Intelligent Artificial Lift & Energy Operations
              </p>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden md:block" />

          {/* Basin Field Selector */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowFieldMenu(!showFieldMenu)}
              className="flex items-center gap-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700/60 transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="max-w-[190px] truncate">{activeField}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showFieldMenu && (
              <div className="absolute left-0 mt-1 w-64 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-1 z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 border-b border-slate-800">
                  SELECT OPERATIONAL ASSET FIELD
                </div>
                {fields.map(f => (
                  <button
                    key={f}
                    onClick={() => {
                      onChangeField(f);
                      setShowFieldMenu(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                      activeField === f ? 'text-cyan-400 bg-slate-800/50 font-medium' : 'text-slate-300'
                    }`}
                  >
                    <span>{f}</span>
                    {activeField === f && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Search & Live Clock */}
        <div className="flex-1 max-w-md hidden lg:flex items-center gap-3">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search wells (e.g. ALS-DEL-104), alarms, work orders..."
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-md pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
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

          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 bg-slate-950/50 px-2.5 py-1.5 rounded border border-slate-800 shrink-0">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span>{timeStr || '12:00:00 CST'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">{utcTimeStr}</span>
          </div>
        </div>

        {/* Zone 3: Portal Switcher, Roles & Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <DemoNoticeBanner compact />

          {/* Portal Switcher Buttons */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              onClick={() => onSelectPortal('admin')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 ${
                currentPortal === 'admin'
                  ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
            <button
              onClick={() => onSelectPortal('user')}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1.5 ${
                currentPortal === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>User Portal</span>
            </button>
          </div>

          {/* Notifications Flyout */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-md text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="System Alarms & Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadAlarms.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                  {unreadAlarms.length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/60 border-b border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Active Alarms</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                      {unreadAlarms.length} Unacknowledged
                    </span>
                  </div>
                  <button 
                    onClick={() => {
                      onNavigateToRoute(currentPortal === 'admin' ? 'alarms-admin' : 'alarms-user');
                      setShowNotifications(false);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    View All Alarms
                  </button>
                </div>
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {unreadAlarms.map(alarm => (
                    <div 
                      key={alarm.id} 
                      onClick={() => {
                        onNavigateToRoute(currentPortal === 'admin' ? 'alarms-admin' : 'alarms-user');
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

          {/* Demo Role Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-3 py-1.5 rounded-md transition-colors text-left"
            >
              <div className="w-6 h-6 rounded bg-cyan-900/60 border border-cyan-700/50 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-200 leading-tight flex items-center gap-1.5">
                  <span>{currentUser.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-cyan-400 font-mono">({currentUser.roleTitle.split(' ')[0]})</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-none">Role Switcher</div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl py-2 z-50">
                <div className="px-3 py-1.5 border-b border-slate-800">
                  <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    SWITCH DEMO OPERATIONAL ROLE
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Toggle persona to test role-specific view permissions.
                  </p>
                </div>
                <div className="py-1 max-h-72 overflow-y-auto">
                  {DEMO_USERS.map(user => {
                    const isSelected = user.id === currentUser.id;
                    return (
                      <button
                        key={user.id}
                        onClick={() => {
                          onChangeUser(user);
                          setShowRoleMenu(false);
                          if (!user.allowedPortals.includes(currentPortal)) {
                            onSelectPortal(user.defaultPortal);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-slate-800 transition-colors ${
                          isSelected ? 'bg-cyan-950/40 text-cyan-300' : 'text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {isSelected && <span className="text-[10px] font-mono text-cyan-400">● Active</span>}
                          </div>
                          <div className="text-[11px] text-slate-400">{user.roleTitle}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Portals: {user.allowedPortals.join(' & ')}
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-slate-800 pt-2 px-3">
                  <button
                    onClick={onLogout}
                    className="w-full text-left py-1.5 text-xs text-rose-400 hover:text-rose-300 flex items-center gap-2"
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
