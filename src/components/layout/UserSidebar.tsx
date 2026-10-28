import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Cpu, 
  Radio, 
  Workflow, 
  Activity, 
  Gauge, 
  Bell, 
  History, 
  CheckSquare, 
  AlertTriangle, 
  Truck, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Sliders,
  LogOut,
  Flame,
  Zap,
  Cable
} from 'lucide-react';
import { OperationsService } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';
import { FleetService } from '../../services/fleetService';
import { INITIAL_CABLE_SHOP_ITEMS } from '../../data/cableShopData';

interface UserSidebarProps {
  currentRoute: string;
  onSelectRoute: (routeId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

interface UserNavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  group: string;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  currentRoute,
  onSelectRoute,
  collapsed,
  onToggleCollapse,
  onLogout,
}) => {
  const [alarms, setAlarms] = React.useState(() => OperationsService.getAlarms());
  const [jobs, setJobs] = React.useState(() => OperationsService.getJobs());
  const [wellsCount, setWellsCount] = React.useState(() => StorageService.getWells().length);
  const [fleetCount, setFleetCount] = React.useState(() => FleetService.getVehicles().length);

  React.useEffect(() => {
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

  // The 12 User Portal Modules from Specification
  const navItems: UserNavItem[] = [
    // Realtime Surveillance
    { id: 'operations', label: 'Operations Dashboard', icon: LayoutDashboard, group: 'SURVEILLANCE' },
    { id: 'asset-monitoring-user', label: 'Asset Monitoring', icon: Layers, badge: wellsCount, group: 'SURVEILLANCE' },
    { id: 'scada-user', label: 'SCADA Monitoring', icon: Radio, group: 'SURVEILLANCE' },
    { id: 'digital-twin-user', label: 'Digital Twin', icon: Workflow, group: 'SURVEILLANCE' },
    
    // Artificial Lift Systems
    { id: 'esp-user', label: 'ESP Performance', icon: Activity, group: 'ARTIFICIAL LIFT' },
    { id: 'pump-user', label: 'Pump Performance', icon: Gauge, group: 'ARTIFICIAL LIFT' },
    
    // Control & Actions
    { id: 'alarms-user', label: 'Alarm & Event Center', icon: Bell, badge: activeAlarmsCount, badgeColor: 'bg-rose-950 text-rose-300 border border-rose-800', group: 'OPERATIONS & RELIABILITY' },
    { id: 'failure-monitoring-user', label: 'Failure Reason Monitoring', icon: AlertTriangle, group: 'OPERATIONS & RELIABILITY' },
    { id: 'workflows-user', label: 'Operational Workflows', icon: CheckSquare, badge: activeJobsCount, group: 'OPERATIONS & RELIABILITY' },
    
    // Field Execution & Analytics
    { id: 'cable-shop-user', label: 'Cable Shop', icon: Sliders, badge: INITIAL_CABLE_SHOP_ITEMS.length, group: 'FIELD & ANALYTICS' },
    { id: 'fleet-user', label: 'Fleet Monitoring', icon: Truck, badge: fleetCount, group: 'FIELD & ANALYTICS' },
    { id: 'reports-user', label: 'Reports & Analytics', icon: FileText, group: 'FIELD & ANALYTICS' },
  ];

  // Group items
  const groups: { [key: string]: UserNavItem[] } = {};
  navItems.forEach(item => {
    if (!groups[item.group]) groups[item.group] = [];
    groups[item.group].push(item);
  });

  return (
    <aside 
      className={`relative bg-slate-950 border-r border-slate-800 transition-all duration-200 flex flex-col shrink-0 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Portal Branding Subheader */}
      <div className="h-12 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs font-semibold text-slate-400">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-cyan-200 uppercase tracking-wider font-mono text-[11px]">
              Field Operations
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
          title={collapsed ? 'Expand User Navigation' : 'Collapse User Navigation'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {Object.entries(groups).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 tracking-wider font-mono uppercase">
                {groupTitle}
              </div>
            )}
            {items.map(item => {
              const Icon = item.icon;
              const isActive = currentRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectRoute(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  {!collapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                  {!collapsed && item.badge !== undefined && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Sign Out Button */}
      <div className="p-2 border-t border-slate-900/90">
        <button
          onClick={onLogout}
          title={collapsed ? 'Sign Out & Return to Login' : undefined}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut className="w-4 h-4 shrink-0 text-rose-400" />
          {!collapsed && <span className="truncate">Sign Out</span>}
        </button>
      </div>

      {/* Footer System Status */}
      {!collapsed ? (
        <div className="p-3 border-t border-slate-900 bg-slate-950/70 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center justify-between font-mono">
            <span>Uptime:</span>
            <span className="text-emerald-400 font-semibold tabular-nums">99.88%</span>
          </div>
          <div className="flex items-center justify-between font-mono text-[10px] text-slate-500">
            <span>SCADA Polling:</span>
            <span className="text-cyan-400">1.0 sec (SIM)</span>
          </div>
        </div>
      ) : (
        <div className="p-2 border-t border-slate-900 text-center">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="System Nominal" />
        </div>
      )}
    </aside>
  );
};
