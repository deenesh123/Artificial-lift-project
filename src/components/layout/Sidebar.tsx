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
  Users, 
  FileText,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Sliders,
  Sparkles,
  Flame
} from 'lucide-react';
import { PortalType } from '../../types';
import { OperationsService } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';
import { FleetService } from '../../services/fleetService';
import { DEMO_VEHICLES } from '../../data/mockData';

interface SidebarProps {
  currentPortal: PortalType;
  currentRoute: string;
  onSelectRoute: (routeId: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  badgeColor?: string;
  group?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPortal,
  currentRoute,
  onSelectRoute,
  collapsed,
  onToggleCollapse,
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

  const adminNavItems: NavItem[] = [
    // Core
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'CORE ADMINISTRATION' },
    { id: 'assets', label: 'Asset Management', icon: Layers, badge: wellsCount, group: 'CORE ADMINISTRATION' },
    { id: 'devices', label: 'Device Management', icon: Cpu, group: 'CORE ADMINISTRATION' },
    
    // Automation & Twin
    { id: 'scada-admin', label: 'SCADA Management', icon: Radio, group: 'AUTOMATION & TWINS' },
    { id: 'digital-twin-admin', label: 'Digital Twin Management', icon: Workflow, group: 'AUTOMATION & TWINS' },
    
    // Artificial Lift Systems
    { id: 'esp-admin', label: 'ESP Management', icon: Activity, group: 'ARTIFICIAL LIFT' },
    { id: 'pump-admin', label: 'Pump Management', icon: Gauge, group: 'ARTIFICIAL LIFT' },
    
    // Alarms & Workflows
    { id: 'alarms-admin', label: 'Alarm Management', icon: Bell, badge: activeAlarmsCount, badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/60', group: 'OPERATIONS & RELIABILITY' },
    { id: 'events-admin', label: 'Event Management', icon: History, group: 'OPERATIONS & RELIABILITY' },
    { id: 'workflows', label: 'Job Workflow Management', icon: CheckSquare, badge: activeJobsCount, group: 'OPERATIONS & RELIABILITY' },
    { id: 'failure-monitoring-admin', label: 'Failure Reason Monitoring', icon: AlertTriangle, group: 'OPERATIONS & RELIABILITY' },
    { id: 'fleet', label: 'Vehicle & Fleet Management', icon: Truck, badge: fleetCount, group: 'OPERATIONS & RELIABILITY' },
    
    // Governance
    { id: 'users', label: 'User Management', icon: Users, group: 'SYSTEM & COMPLIANCE' },
    { id: 'reports-admin', label: 'Reports', icon: FileText, group: 'SYSTEM & COMPLIANCE' },
  ];

  const userNavItems: NavItem[] = [
    // Realtime Operations
    { id: 'operations', label: 'Operations Dashboard', icon: LayoutDashboard, group: 'SURVEILLANCE & TELEMETRY' },
    { id: 'devices-user', label: 'Device Monitoring', icon: Cpu, group: 'SURVEILLANCE & TELEMETRY' },
    { id: 'scada-user', label: 'SCADA Dashboard', icon: Radio, group: 'SURVEILLANCE & TELEMETRY' },
    { id: 'digital-twin-user', label: 'Digital Twin', icon: Workflow, group: 'SURVEILLANCE & TELEMETRY' },
    
    // Lift Engineering
    { id: 'esp-user', label: 'ESP Monitoring', icon: Activity, group: 'LIFT SPECIALTY' },
    { id: 'pump-user', label: 'Pump Dashboard', icon: Gauge, group: 'LIFT SPECIALTY' },
    
    // Operational Response
    { id: 'alarms-user', label: 'Alarm Center', icon: Bell, badge: activeAlarmsCount, badgeColor: 'bg-rose-900/60 text-rose-300 border border-rose-700/60', group: 'CONTROL & ACTIONS' },
    { id: 'events-user', label: 'Event Center', icon: History, group: 'CONTROL & ACTIONS' },
    { id: 'workflows-user', label: 'Job Workflows', icon: CheckSquare, badge: activeJobsCount, group: 'CONTROL & ACTIONS' },
    { id: 'failure-monitoring-user', label: 'Failure Monitoring', icon: AlertTriangle, group: 'CONTROL & ACTIONS' },
    { id: 'fleet-user', label: 'Vehicle Tracking', icon: Truck, badge: fleetCount, group: 'CONTROL & ACTIONS' },
    { id: 'reports-user', label: 'Reports & Analytics', icon: FileText, group: 'CONTROL & ACTIONS' },
  ];

  const navItems = currentPortal === 'admin' ? adminNavItems : userNavItems;

  // Group items
  const groups: { [key: string]: NavItem[] } = {};
  navItems.forEach(item => {
    const g = item.group || 'GENERAL';
    if (!groups[g]) groups[g] = [];
    groups[g].push(item);
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
            <span className={`w-2 h-2 rounded-full ${currentPortal === 'admin' ? 'bg-blue-500' : 'bg-cyan-400'}`} />
            <span className="text-slate-200 uppercase tracking-wider font-mono text-[11px]">
              {currentPortal === 'admin' ? 'Administration' : 'Field Operations'}
            </span>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-5">
        {Object.entries(groups).map(([groupTitle, items]) => (
          <div key={groupTitle} className="space-y-1">
            {!collapsed && (
              <div className="px-3 py-1 text-[10px] font-bold text-slate-500 tracking-wider font-mono">
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
                      ? currentPortal === 'admin'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
                  } ${collapsed ? 'justify-center px-0' : ''}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? (currentPortal === 'admin' ? 'text-blue-400' : 'text-cyan-400') : 'text-slate-400'}`} />
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
