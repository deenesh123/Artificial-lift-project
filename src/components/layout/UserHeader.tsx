import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  RotateCcw,
  LayoutDashboard,
  Layers,
  Cpu,
  Workflow,
  Activity,
  Gauge,
  History,
  CheckSquare,
  AlertTriangle,
  Sliders,
  Truck,
  FileText,
  ChevronLeft,
  ChevronRight,
  X,
  Bot,
  Sparkles
} from 'lucide-react';
import { PortalType, UserProfile, WellAsset } from '../../types';
import { DEMO_ALARMS } from '../../data/mockData';
import { OperationsService } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';

interface UserHeaderProps {
  currentUser: UserProfile;
  currentRoute: string;
  onSelectRoute: (routeId: string) => void;
  selectedAsset: WellAsset | null;
  onClearSelectedAsset: () => void;
  onSelectPortal?: (portal: PortalType) => void;
  onLogout: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

interface ModuleNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  badgeColor?: string;
  tooltip: string;
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  currentUser,
  currentRoute,
  onSelectRoute,
  selectedAsset,
  onClearSelectedAsset,
  onSelectPortal,
  onLogout,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Dynamic counts for notification badges
  const [alarms, setAlarms] = useState(() => OperationsService.getAlarms());
  const [jobs, setJobs] = useState(() => OperationsService.getJobs());
  const [wellsCount, setWellsCount] = useState(() => StorageService.getWells().length);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setAlarms(OperationsService.getAlarms());
      setJobs(OperationsService.getJobs());
      setWellsCount(StorageService.getWells().length);
    };
    window.addEventListener('operations_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('operations_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const unreadAlarms = alarms.filter(a => !a.acknowledged && a.resolutionStatus !== 'Resolved');
  const activeJobsCount = jobs.filter(j => j.stage !== 'Completed & Closed' && j.stage !== 'Cancelled / Deferred').length;

  // The 14 operational modules matching Section 2 & 3
  const moduleNavItems: ModuleNavItem[] = [
    {
      id: 'operations',
      label: 'Dashboard',
      icon: LayoutDashboard,
      tooltip: 'Operations Dashboard & 24h Summary',
    },
    {
      id: 'asset-monitoring-user',
      label: 'Assets',
      icon: Layers,
      badge: wellsCount,
      badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
      tooltip: 'Asset Monitoring & Status Registry',
    },
    {
      id: 'scada-user',
      label: 'SCADA',
      icon: Radio,
      tooltip: 'SCADA Dashboard & Gauge Telemetry',
    },
    {
      id: 'devices-user',
      label: 'Devices',
      icon: Cpu,
      tooltip: 'Device Monitoring & RTU Communication',
    },
    {
      id: 'digital-twin-user',
      label: 'Digital Twin',
      icon: Workflow,
      tooltip: 'Physics-Based Digital Twin & Wellbore Nodal Analysis',
    },
    {
      id: 'esp-user',
      label: 'ESP',
      icon: Activity,
      tooltip: 'ESP Performance & Depth Pressure Gradient',
    },
    {
      id: 'pump-user',
      label: 'Pumps',
      icon: Gauge,
      tooltip: 'Pump Performance & Dynamometer Analysis',
    },
    {
      id: 'alarms-user',
      label: 'Alarms',
      icon: Bell,
      badge: unreadAlarms.length > 0 ? unreadAlarms.length : undefined,
      badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse',
      tooltip: 'Alarm Center & Threshold Indicators',
    },
    {
      id: 'events-user',
      label: 'Events',
      icon: History,
      tooltip: 'Event Center & Operational Timeline',
    },
    {
      id: 'workflows-user',
      label: 'Jobs',
      icon: CheckSquare,
      badge: activeJobsCount > 0 ? activeJobsCount : undefined,
      badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800',
      tooltip: 'Job Workflows & Field Execution',
    },
    {
      id: 'failure-monitoring-user',
      label: 'Failures',
      icon: AlertTriangle,
      tooltip: 'Failure Monitoring & Reliability Intelligence',
    },
    {
      id: 'cable-shop-user',
      label: 'Cable Shop',
      icon: Sliders,
      tooltip: 'Cable Shop 8-Stage QA Workflow',
    },
    {
      id: 'fleet-user',
      label: 'Fleet',
      icon: Truck,
      tooltip: 'Vehicle & Field Fleet Logistics',
    },
    {
      id: 'reports-user',
      label: 'Reports',
      icon: FileText,
      tooltip: 'Reports & Production Analytics',
    },
    {
      id: 'assistant-user',
      label: 'AI Assistant',
      icon: Bot,
      tooltip: 'AI Operations Assistant & Telemetry Intelligence',
    },
  ];

  // Scroll checking
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 8);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const el = scrollContainerRef.current;
    if (el) {
      const scrollAmount = direction === 'left' ? -220 : 220;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 250);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md">
      <div className="flex items-center justify-between px-3 lg:px-5 h-14 gap-3">
        {/* ========================================================= */}
        {/* LEFT SIDE: Project Branding Only (Section 2)              */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-700 flex items-center justify-center shadow-md shadow-cyan-500/20 border border-cyan-400/30">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
          <span className="text-sm font-bold tracking-tight text-white font-mono whitespace-nowrap">
            ALS — Artificial Lift Suite
          </span>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE (MAIN): All 14 Operational Modules (Section 2 & 3) */}
        {/* ========================================================= */}
        <div className="flex-1 flex items-center min-w-0 relative px-1">
          {/* Left Scroll Button */}
          {canScrollLeft && (
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-0 z-20 h-full px-1 bg-gradient-to-r from-slate-900 via-slate-900/90 to-transparent text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Scroll modules left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Module Navigation Scroll Container */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex-1 overflow-x-auto flex items-center gap-1 xl:gap-1.5 no-scrollbar scroll-smooth py-1"
          >
            {moduleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;

              return (
                <div key={item.id} className="relative group shrink-0">
                  <button
                    type="button"
                    onClick={() => onSelectRoute(item.id)}
                    onMouseEnter={() => setActiveTooltip(item.id)}
                    onMouseLeave={() => setActiveTooltip(null)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all cursor-pointer font-sans whitespace-nowrap ${
                      isActive
                        ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/60 shadow-sm shadow-cyan-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-cyan-300'}`} />
                    <span className="text-[12px]">{item.label}</span>

                    {item.badge !== undefined && (
                      <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold leading-tight ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Accessible hover tooltip */}
                  {activeTooltip === item.id && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 z-50 pointer-events-none px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-[11px] whitespace-nowrap shadow-xl font-mono">
                      {item.tooltip}
                      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-t border-l border-slate-700 rotate-45" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Scroll Button */}
          {canScrollRight && (
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-0 z-20 h-full px-1 bg-gradient-to-l from-slate-900 via-slate-900/90 to-transparent text-slate-400 hover:text-white flex items-center justify-center transition-colors"
              title="Scroll modules right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* FAR RIGHT: Notifications & User Profile (Section 2 & 9)   */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Notifications Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Active Alarms"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadAlarms.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900">
                  {unreadAlarms.length}
                </span>
              )}
            </button>

            {/* Notifications Flyout */}
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
                      onSelectRoute('alarms-user');
                      setShowNotifications(false);
                    }}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Alarm Center →
                  </button>
                </div>
                <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
                  {unreadAlarms.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500 font-sans">
                      No unacknowledged alarms. All systems operating within baseline parameters.
                    </div>
                  ) : (
                    unreadAlarms.map(alarm => (
                      <div 
                        key={alarm.id} 
                        onClick={() => {
                          onSelectRoute('alarms-user');
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
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Menu */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2.5 py-1.5 rounded-lg transition-colors text-left"
              title={`${currentUser.name} (${currentUser.roleTitle})`}
            >
              <div className="w-6 h-6 rounded bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 text-xs font-bold font-mono">
                {currentUser.name.charAt(0)}
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
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
                      <span>Clear Selected Well Filter</span>
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
                    <span>Sign Out</span>
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
