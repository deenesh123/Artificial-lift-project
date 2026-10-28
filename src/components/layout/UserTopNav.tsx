import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Radio, 
  Workflow, 
  Activity, 
  Gauge, 
  Bell, 
  History, 
  CheckSquare, 
  AlertTriangle, 
  Sliders, 
  Truck, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Flame,
  CheckCircle2,
  X,
  Compass,
  Cpu,
  ShieldCheck
} from 'lucide-react';
import { OperationsService } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';
import { FleetService } from '../../services/fleetService';
import { INITIAL_CABLE_SHOP_ITEMS } from '../../data/cableShopData';
import { WellAsset } from '../../types';

interface UserTopNavProps {
  currentRoute: string;
  onSelectRoute: (routeId: string) => void;
  selectedAsset: WellAsset | null;
  onClearSelectedAsset: () => void;
  onSelectAssetId?: (id: string | null) => void;
}

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  tooltip: string;
}

interface NavCategory {
  category: string;
  items: NavItem[];
}

export const UserTopNav: React.FC<UserTopNavProps> = ({
  currentRoute,
  onSelectRoute,
  selectedAsset,
  onClearSelectedAsset,
  onSelectAssetId,
}) => {
  const [alarms, setAlarms] = useState(() => OperationsService.getAlarms());
  const [jobs, setJobs] = useState(() => OperationsService.getJobs());
  const [wellsCount, setWellsCount] = useState(() => StorageService.getWells().length);
  const [fleetCount, setFleetCount] = useState(() => FleetService.getVehicles().length);
  const [cableCount] = useState(INITIAL_CABLE_SHOP_ITEMS.length);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      setAlarms(OperationsService.getAlarms());
      setJobs(OperationsService.getJobs());
      setWellsCount(StorageService.getWells().length);
      setFleetCount(FleetService.getVehicles().length);
    };
    window.addEventListener('operations_update', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('fleet_update', handleUpdate);
    return () => {
      window.removeEventListener('operations_update', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('fleet_update', handleUpdate);
    };
  }, []);

  const activeAlarmsCount = alarms.filter(a => !a.acknowledged && a.resolutionStatus !== 'Resolved').length;
  const activeJobsCount = jobs.filter(j => j.stage !== 'Completed & Closed' && j.stage !== 'Cancelled / Deferred').length;

  // The 13 User Portal Modules accurately categorized according to Specification
  const navCategories: NavCategory[] = [
    {
      category: 'OVERVIEW',
      items: [
        {
          id: 'operations',
          label: 'Operations Dashboard',
          shortLabel: 'Operations',
          icon: LayoutDashboard,
          tooltip: 'Real-time Operations KPI & Fleet Surveillance Dashboard',
        },
        {
          id: 'asset-monitoring-user',
          label: 'Asset Monitoring',
          shortLabel: 'Assets',
          icon: Layers,
          badge: wellsCount,
          badgeColor: 'bg-cyan-950 text-cyan-300 border border-cyan-800',
          tooltip: 'Running & Down Asset Telemetry, Status & Sensor Registry',
        },
      ],
    },
    {
      category: 'MONITORING',
      items: [
        {
          id: 'scada-user',
          label: 'SCADA Monitoring',
          shortLabel: 'SCADA',
          icon: Radio,
          tooltip: 'Live Modbus SCADA Telemetry, Pad Registers & Historical Trends',
        },
        {
          id: 'digital-twin-user',
          label: 'Digital Twin',
          shortLabel: 'Digital Twin',
          icon: Workflow,
          tooltip: 'Hydraulic Nodal Analysis, Pressure Gradients & Wellbore Twin',
        },
      ],
    },
    {
      category: 'ARTIFICIAL LIFT',
      items: [
        {
          id: 'esp-user',
          label: 'ESP Performance',
          shortLabel: 'ESP Perf',
          icon: Activity,
          tooltip: 'ESP Affinity Law Curves, Motor Temp & Dynamic VFD Trim',
        },
        {
          id: 'pump-user',
          label: 'Pump Performance',
          shortLabel: 'Pumps',
          icon: Gauge,
          tooltip: 'Pump Curves, Multi-frequency H-Q Drawdown & Dynagraphs',
        },
      ],
    },
    {
      category: 'OPERATIONS',
      items: [
        {
          id: 'alarms-user',
          label: 'Alarm Center',
          shortLabel: 'Alarms',
          icon: Bell,
          badge: activeAlarmsCount,
          badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800 animate-pulse',
          tooltip: 'Active Operational Alarms, Thresholds & Acknowledgment',
        },
        {
          id: 'events-user',
          label: 'Event Center',
          shortLabel: 'Events',
          icon: History,
          tooltip: 'Real-time Operational Events Log & Handover Audit Trail',
        },
        {
          id: 'workflows-user',
          label: 'Job Workflows',
          shortLabel: 'Workflows',
          icon: CheckSquare,
          badge: activeJobsCount,
          badgeColor: 'bg-blue-950 text-blue-300 border border-blue-800',
          tooltip: 'Field Workovers, Chemical Flush & Rig Maintenance Jobs',
        },
        {
          id: 'failure-monitoring-user',
          label: 'Failure Monitoring',
          shortLabel: 'Failures',
          icon: AlertTriangle,
          tooltip: 'Root Cause Failure Analysis & Downhole MTBF Reliability',
        },
        {
          id: 'cable-shop-user',
          label: 'Cable Shop',
          shortLabel: 'Cable Shop',
          icon: Sliders,
          badge: cableCount,
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
          tooltip: '8-Stage ESP Cable Splicing, Armor Testing & HIPOT QA Tracking',
        },
      ],
    },
    {
      category: 'FLEET',
      items: [
        {
          id: 'fleet-user',
          label: 'Vehicle Tracking',
          shortLabel: 'Fleet',
          icon: Truck,
          badge: fleetCount,
          badgeColor: 'bg-slate-800 text-slate-300 border border-slate-700',
          tooltip: 'Field Logistics, GPS Truck Tracking & Fuel Telematics',
        },
      ],
    },
    {
      category: 'ANALYTICS',
      items: [
        {
          id: 'reports-user',
          label: 'Reports & Analytics',
          shortLabel: 'Reports',
          icon: FileText,
          tooltip: 'Basin Production Reports, Energy Intensity & CSV Export',
        },
      ],
    },
  ];

  // Scroll checking
  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 10);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
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
      const scrollAmount = direction === 'left' ? -240 : 240;
      el.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      setTimeout(checkScroll, 300);
    }
  };

  // Find active item label for breadcrumb
  const allItems = navCategories.flatMap(g => g.items);
  const activeItem = allItems.find(i => i.id === currentRoute) || allItems[0];

  return (
    <div className="bg-slate-900/95 border-b border-slate-800 shadow-md backdrop-blur-md sticky top-16 z-30 select-none">
      {/* Top Nav Rail */}
      <div className="relative flex items-center">
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            onClick={() => handleScroll('left')}
            className="absolute left-0 z-20 h-full px-1.5 bg-gradient-to-r from-slate-950 via-slate-900 to-transparent text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Scroll navigation left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {/* Scrollable Container with all categories & module items */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="flex-1 overflow-x-auto flex items-center px-4 py-1.5 gap-3 sm:gap-4 no-scrollbar scroll-smooth"
        >
          {navCategories.map((group, groupIdx) => (
            <div key={group.category} className="flex items-center gap-1 shrink-0">
              {/* Category Mini Tag */}
              <div className="hidden xl:flex items-center pr-1.5 border-r border-slate-800/80 mr-1">
                <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest px-1 py-0.5 rounded bg-slate-950/60">
                  {group.category}
                </span>
              </div>

              {/* Module Buttons in Group */}
              <div className="flex items-center gap-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRoute === item.id;

                  return (
                    <div key={item.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => onSelectRoute(item.id)}
                        onMouseEnter={() => setActiveTooltip(item.id)}
                        onMouseLeave={() => setActiveTooltip(null)}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            onSelectRoute(item.id);
                          }
                        }}
                        className={`px-2.5 py-1.5 rounded-lg text-xs flex items-center gap-2 transition-all cursor-pointer font-sans whitespace-nowrap ${
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

                      {/* Tooltip on hover */}
                      {activeTooltip === item.id && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 z-50 pointer-events-none px-2.5 py-1 rounded bg-slate-950 border border-slate-700 text-slate-200 text-[11px] whitespace-nowrap shadow-xl font-mono">
                          {item.tooltip}
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-t border-l border-slate-700 rotate-45" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Category Divider */}
              {groupIdx < navCategories.length - 1 && (
                <div className="h-4 w-px bg-slate-800/80 mx-1 shrink-0" />
              )}
            </div>
          ))}
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            onClick={() => handleScroll('right')}
            className="absolute right-0 z-20 h-full px-1.5 bg-gradient-to-l from-slate-950 via-slate-900 to-transparent text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            title="Scroll navigation right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sub-strip: Active Context, Quick Breadcrumb & Asset Focus Badge */}
      <div className="px-4 py-1.5 bg-slate-950/90 border-t border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span className="font-mono text-[10px] text-cyan-400 font-semibold uppercase tracking-wider">
            User Operations
          </span>
          <span className="text-slate-600">/</span>
          <span className="font-semibold text-white flex items-center gap-1.5">
            <activeItem.icon className="w-3.5 h-3.5 text-cyan-400" />
            <span>{activeItem.label}</span>
          </span>
          <span className="text-slate-600 hidden md:inline">·</span>
          <span className="text-[11px] text-slate-400 hidden md:inline font-mono">
            {activeItem.tooltip}
          </span>
        </div>

        {/* Selected Asset Indicator Strip */}
        <div className="flex items-center gap-2 self-end sm:self-auto font-mono text-[11px]">
          {selectedAsset ? (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-cyan-950/70 border border-cyan-700 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              <span>Target Well:</span>
              <span className="font-bold text-white">{selectedAsset.wellCode || selectedAsset.id}</span>
              <span className="text-slate-400 font-sans hidden lg:inline">({selectedAsset.name})</span>
              <button
                onClick={onClearSelectedAsset}
                className="ml-1 p-0.5 text-slate-400 hover:text-white rounded hover:bg-cyan-900 transition-colors"
                title="Clear selected asset filter and show all"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Fleet Scope:</span>
              <strong className="text-slate-200">All Monitored Assets ({wellsCount})</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
