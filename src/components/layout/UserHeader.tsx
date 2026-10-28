import React, { useState, useEffect, useRef } from 'react';
import { 
  Radio, 
  Bell, 
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
  Bot,
  Sparkles,
  Search,
  X,
  LineChart,
  BarChart3,
  Wrench,
  Fuel
} from 'lucide-react';
import { PortalType, UserProfile, WellAsset } from '../../types';
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

interface NavSubItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  badge?: number;
}

interface NavGroup {
  id: string;
  label: string;
  primaryRoute: string;
  icon: React.ElementType;
  memberRoutes: string[];
  badge?: number;
  badgeColor?: string;
  items: NavSubItem[];
}

export const UserHeader: React.FC<UserHeaderProps> = ({
  currentUser,
  currentRoute,
  onSelectRoute,
  selectedAsset,
  onClearSelectedAsset,
  onSelectPortal,
  onLogout,
  searchQuery = '',
  onSearchChange,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Dynamic counts for notification badges
  const [alarms, setAlarms] = useState(() => OperationsService.getAlarms());
  const [jobs, setJobs] = useState(() => OperationsService.getJobs());
  const [wellsCount, setWellsCount] = useState(() => StorageService.getWells().length);

  const navRef = useRef<HTMLDivElement>(null);

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

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAlarms = alarms.filter(a => !a.acknowledged && a.resolutionStatus !== 'Resolved');
  const activeJobsCount = jobs.filter(j => j.stage !== 'Completed & Closed' && j.stage !== 'Cancelled / Deferred').length;

  // 8 Grouped Categories matching Section 2 & 3 of user instructions
  const navGroups: NavGroup[] = [
    {
      id: 'overview',
      label: 'Overview',
      primaryRoute: 'operations',
      icon: LayoutDashboard,
      memberRoutes: ['operations'],
      items: [
        {
          id: 'operations',
          label: 'Operations Dashboard',
          description: 'Live field production, active lift status & 24h summary',
          icon: LayoutDashboard,
        },
        {
          id: 'asset-monitoring-user',
          label: 'Well Status Overview',
          description: 'Operational health across Permian & Delaware pads',
          icon: Layers,
          badge: wellsCount,
        },
      ],
    },
    {
      id: 'assets',
      label: 'Assets & Equipment',
      primaryRoute: 'asset-monitoring-user',
      icon: Layers,
      memberRoutes: ['asset-monitoring-user', 'devices-user', 'esp-user', 'pump-user'],
      badge: wellsCount,
      badgeColor: 'bg-slate-800 text-slate-300 border-slate-700',
      items: [
        {
          id: 'asset-monitoring-user',
          label: 'Asset Management',
          description: 'Pad & well registry, lift classification & operational state',
          icon: Layers,
        },
        {
          id: 'devices-user',
          label: 'Device Management',
          description: 'Downhole gauges, surface RTU & VFD motor drives',
          icon: Cpu,
        },
        {
          id: 'esp-user',
          label: 'ESP Management',
          description: 'Pump curves, depth pressure gradients & motor limits',
          icon: Activity,
        },
        {
          id: 'pump-user',
          label: 'Pump Management',
          description: 'Beam pump dynamometer cards, SPM & gearbox loading',
          icon: Gauge,
        },
      ],
    },
    {
      id: 'scada',
      label: 'SCADA & Monitoring',
      primaryRoute: 'scada-user',
      icon: Radio,
      memberRoutes: ['scada-user'],
      items: [
        {
          id: 'scada-user',
          label: 'SCADA Dashboard',
          description: 'Real-time telemetry gauges, intake/discharge pressures & temperatures',
          icon: Radio,
        },
        {
          id: 'devices-user',
          label: 'Device Monitoring',
          description: 'Multi-trend telemetry streams & high-frequency polling',
          icon: Cpu,
        },
        {
          id: 'esp-user',
          label: 'Depth Pressure Profiles',
          description: 'Pressure gradient curves vs depth and BHP tracking',
          icon: Activity,
        },
      ],
    },
    {
      id: 'digital-twin',
      label: 'Digital Twin',
      primaryRoute: 'digital-twin-user',
      icon: Workflow,
      memberRoutes: ['digital-twin-user'],
      items: [
        {
          id: 'digital-twin-user',
          label: 'Digital Twin Viewer',
          description: 'Physics-based multi-phase wellbore simulation & nodal analysis',
          icon: Workflow,
        },
        {
          id: 'esp-user',
          label: 'ESP Diagnostic Inspection',
          description: 'Head vs flow multi-frequency curves & BEP operating margins',
          icon: Activity,
        },
      ],
    },
    {
      id: 'operations-grp',
      label: 'Operations',
      primaryRoute: 'alarms-user',
      icon: Wrench,
      memberRoutes: ['alarms-user', 'events-user', 'workflows-user', 'cable-shop-user', 'failure-monitoring-user'],
      badge: unreadAlarms.length > 0 ? unreadAlarms.length : (activeJobsCount > 0 ? activeJobsCount : undefined),
      badgeColor: unreadAlarms.length > 0 ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-blue-950 text-blue-300 border-blue-800',
      items: [
        {
          id: 'alarms-user',
          label: 'Alarm Center',
          description: 'SIL-2 safety thresholds, active alarm acknowledgments & alarms history',
          icon: Bell,
          badge: unreadAlarms.length > 0 ? unreadAlarms.length : undefined,
        },
        {
          id: 'events-user',
          label: 'Event Center',
          description: 'Real-time telemetry event stream & chronological field audit log',
          icon: History,
        },
        {
          id: 'workflows-user',
          label: 'Job Workflows',
          description: 'Active field maintenance work orders, pull rigs & workover tracking',
          icon: CheckSquare,
          badge: activeJobsCount > 0 ? activeJobsCount : undefined,
        },
        {
          id: 'cable-shop-user',
          label: 'Cable Shop Operations',
          description: '9-Stage QA workflow, Hi-Pot certification & spool inventory',
          icon: Sliders,
        },
        {
          id: 'failure-monitoring-user',
          label: 'Failure Reason Monitoring',
          description: 'Reliability metrics, run-life tracking & root cause Pareto charts',
          icon: AlertTriangle,
        },
      ],
    },
    {
      id: 'fleet',
      label: 'Fleet',
      primaryRoute: 'fleet-user',
      icon: Truck,
      memberRoutes: ['fleet-user'],
      items: [
        {
          id: 'fleet-user',
          label: 'Vehicle Tracking',
          description: 'Real-time GPS telematics, service trucks & rig transport fleet',
          icon: Truck,
        },
        {
          id: 'fleet-user',
          label: 'Driver & Logistics',
          description: 'Hours of service, safety scores & maintenance schedules',
          icon: Fuel,
        },
      ],
    },
    {
      id: 'analytics',
      label: 'Analytics & Reports',
      primaryRoute: 'reports-user',
      icon: BarChart3,
      memberRoutes: ['reports-user'],
      items: [
        {
          id: 'reports-user',
          label: 'Reports & Analytics',
          description: 'Cumulative production, runtime histograms & custom exports',
          icon: FileText,
        },
        {
          id: 'failure-monitoring-user',
          label: 'Reliability Intelligence',
          description: 'Weibull failure curves, MTBF & component survival probability',
          icon: LineChart,
        },
      ],
    },
    {
      id: 'assistant',
      label: 'AI Assistant',
      primaryRoute: 'assistant-user',
      icon: Bot,
      memberRoutes: ['assistant-user'],
      items: [
        {
          id: 'assistant-user',
          label: 'ALS AI Assistant',
          description: 'Gemini-powered operations conversational intelligence & diagnostics',
          icon: Bot,
        },
        {
          id: 'assistant-user',
          label: 'Operational Insights',
          description: 'Instant multi-well telemetry queries, alarm triage & safety advisory',
          icon: Sparkles,
        },
      ],
    },
  ];

  const handleGroupClick = (group: NavGroup) => {
    // If clicking on already open dropdown, close it; otherwise open it
    if (openDropdown === group.id) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(group.id);
      setShowNotifications(false);
      setShowUserMenu(false);
    }
  };

  const handleSubItemSelect = (routeId: string) => {
    onSelectRoute(routeId);
    setOpenDropdown(null);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 shadow-md select-none" ref={navRef}>
      <div className="flex items-center justify-between px-3 lg:px-4 h-14 gap-2">
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
        {/* CENTER: Grouped Navigation (8 Categories)                 */}
        {/* ========================================================= */}
        <nav className="hidden md:flex items-center gap-0.5 lg:gap-1">
          {navGroups.map((group) => {
            const Icon = group.icon;
            const isGroupActive = group.memberRoutes.includes(currentRoute);
            const isOpen = openDropdown === group.id;

            return (
              <div key={group.id} className="relative">
                <button
                  type="button"
                  onClick={() => handleGroupClick(group)}
                  className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1.5 transition-all cursor-pointer font-sans whitespace-nowrap ${
                    isGroupActive
                      ? 'bg-cyan-950 text-cyan-200 border border-cyan-500/50 shadow-sm font-semibold'
                      : isOpen
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                  aria-expanded={isOpen}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isGroupActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className="text-[12px]">{group.label}</span>

                  {group.badge !== undefined && (
                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono font-bold leading-tight border ${group.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                      {group.badge}
                    </span>
                  )}

                  <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isOpen ? 'rotate-180 text-cyan-300' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 lg:w-72 bg-slate-900 border border-slate-700/80 rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span>{group.label}</span>
                      <button
                        onClick={() => handleSubItemSelect(group.primaryRoute)}
                        className="text-cyan-400 hover:text-cyan-300 capitalize text-[10px]"
                      >
                        Open Main →
                      </button>
                    </div>

                    <div className="py-1">
                      {group.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = currentRoute === subItem.id;

                        return (
                          <button
                            key={`${group.id}-${subItem.label}`}
                            type="button"
                            onClick={() => handleSubItemSelect(subItem.id)}
                            className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors cursor-pointer ${
                              isSubActive
                                ? 'bg-cyan-950/70 text-cyan-200 border-l-2 border-cyan-400'
                                : 'hover:bg-slate-800/80 text-slate-200'
                            }`}
                          >
                            <SubIcon className={`w-4 h-4 shrink-0 mt-0.5 ${isSubActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between text-xs font-semibold">
                                <span className={isSubActive ? 'text-cyan-300' : 'text-slate-100'}>{subItem.label}</span>
                                {subItem.badge !== undefined && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                                    {subItem.badge}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                                {subItem.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Mobile quick category button */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => handleGroupClick(navGroups[0])}
            className="px-2 py-1 text-xs bg-slate-800 text-slate-200 rounded border border-slate-700 flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-cyan-400" />
            <span>Modules</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SIDE: Search, Alarms Indicator, User Profile        */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Global Search Bar (Section 2: Item 3) */}
          {onSearchChange && (
            <div className={`relative hidden sm:flex items-center transition-all ${
              isSearchFocused ? 'w-56 lg:w-64' : 'w-40 lg:w-48'
            }`}>
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="Search wells, telemetry..."
                className="w-full bg-slate-950 text-slate-200 placeholder-slate-500 text-xs pl-8 pr-7 py-1.5 rounded-lg border border-slate-700 focus:border-cyan-500 focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => onSearchChange('')}
                  className="absolute right-2 text-slate-400 hover:text-white"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Active Alarms Notification Bell (Section 2: Item 4) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
                setOpenDropdown(null);
              }}
              className="relative p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 transition-colors cursor-pointer"
              title="Active Alarms"
            >
              <Bell className="w-4 h-4 text-cyan-400" />
              {unreadAlarms.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                  {unreadAlarms.length}
                </span>
              )}
            </button>

            {/* Notifications Flyout */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between">
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

          {/* User Profile Menu (Section 2: Item 5) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
                setOpenDropdown(null);
              }}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2 py-1.5 rounded-lg transition-colors text-left cursor-pointer"
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
                      <span>Clear Focused Well</span>
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
