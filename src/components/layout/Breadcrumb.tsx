import React from 'react';
import { ChevronRight, Home, RefreshCw, Download, SlidersHorizontal } from 'lucide-react';
import { PortalType } from '../../types';

interface BreadcrumbProps {
  currentPortal: PortalType;
  currentRoute: string;
  onRefresh?: () => void;
  onExport?: () => void;
  onOpenFilter?: () => void;
}

const ROUTE_TITLES: { [key: string]: { section: string; title: string; subtitle: string } } = {
  // Admin
  overview: { section: 'Admin Portal', title: 'Executive Overview', subtitle: 'Enterprise lift performance, uptime metrics, and fleet energy intensity' },
  assets: { section: 'Asset Management', title: 'Well & Lease Registry', subtitle: 'Centralized registry of wellbores, completions, and artificial lift methods' },
  devices: { section: 'Device Management', title: 'Industrial Edge Devices', subtitle: 'VFD controllers, downhole gauges, RTUs, and telemetry transmitters' },
  'scada-admin': { section: 'SCADA Management', title: 'SCADA Host & Gateway Configuration', subtitle: 'Modbus TCP, OPC-UA servers, poll rates, and telemetry tag dictionaries' },
  'digital-twin-admin': { section: 'Digital Twin Management', title: 'Wellbore & Inflow Models', subtitle: 'Nodal analysis models, IPR/VLP calibrations, and PVT fluid properties' },
  'esp-admin': { section: 'ESP Management', title: 'ESP Inventory & Fleet Engineering', subtitle: 'Centrifugal pump catalogs, motor sizing, thrust chamber ratings, and pump curves' },
  'pump-admin': { section: 'Pump Management', title: 'Rod Pumping Systems Configuration', subtitle: 'Surface beam pumping units, downhole plunger sizes, and rod string tapers' },
  'alarms-admin': { section: 'Alarm Management', title: 'Alarm Master Setpoints', subtitle: 'ISA 18.2 trip thresholds, trip delays, deadbands, and notification trees' },
  'events-admin': { section: 'Event Management', title: 'Operations Audit Log', subtitle: 'Immutable log of setpoint overrides, trips, auto-restarts, and shift events' },
  workflows: { section: 'Job Workflow Management', title: 'Work Order & Rig Dispatch Board', subtitle: 'Service rigs, pulling units, chemical flushes, and workover scheduling' },
  'failure-monitoring-admin': { section: 'Failure Reason Monitoring', title: 'Root Cause & Run-Life Reliability', subtitle: 'Weibull survival probability, failure modes Pareto analysis, and MTBF benchmarks' },
  fleet: { section: 'Vehicle & Fleet Management', title: 'Field Logistics & Equipment Fleet', subtitle: 'Slickline trucks, acoustic echometer units, mobile labs, and GPS dispatch' },
  users: { section: 'User Management', title: 'Access Control & Persona Matrix', subtitle: 'Field roles, RBAC authorization, operator credentials, and multi-field scopes' },
  'reports-admin': { section: 'Reports', title: 'Executive & Compliance Reporting', subtitle: 'Production accounting, regulatory flaring metrics, and energy intensity audits' },

  // User
  operations: { section: 'Surveillance & Telemetry', title: 'Live Operations Cockpit', subtitle: 'Real-time telemetry, downhole sensor streams, and interactive VFD speed optimization' },
  'devices-user': { section: 'Surveillance & Telemetry', title: 'Field Device Telemetry', subtitle: 'Live telemetry diagnostics for surface VFD drives and downhole sensor pods' },
  'scada-user': { section: 'Surveillance & Telemetry', title: 'SCADA Real-Time Dashboard', subtitle: 'Live register monitoring, poll status, communication packets, and tag values' },
  'digital-twin-user': { section: 'Surveillance & Telemetry', title: 'Digital Twin Simulation', subtitle: 'Downhole pressure gradient, temperature profile, and live operating point analysis' },
  'esp-user': { section: 'Lift Specialty', title: 'ESP Diagnostic Surveillance', subtitle: 'Downhole pump operating point, head vs capacity curves, and motor load factor' },
  'pump-user': { section: 'Lift Specialty', title: 'Beam Pump Dynamometer Center', subtitle: 'Surface load vs position, downhole pump card, fluid pound analysis, and SPM tuning' },
  'alarms-user': { section: 'Control & Actions', title: 'Real-Time Alarm Center', subtitle: 'Active unacknowledged alarms, priority triage, setpoint trips, and silence controls' },
  'events-user': { section: 'Control & Actions', title: 'Field Operations Event Stream', subtitle: 'Sequential log of telemetry events, automated speed trims, and operator actions' },
  'workflows-user': { section: 'Control & Actions', title: 'Active Field Work Orders', subtitle: 'Operational work orders, slickline jobs, chemical flushes, and crew progress' },
  'failure-monitoring-user': { section: 'Control & Actions', title: 'Downhole Failure Surveillance', subtitle: 'Gas lock incidents, sand erosion alerts, scale build-up, and motor life tracking' },
  'fleet-user': { section: 'Control & Actions', title: 'Live Fleet Vehicle Tracker', subtitle: 'Real-time GPS tracking of field technicians, pulling cranes, and acoustic trucks' },
  'reports-user': { section: 'Control & Actions', title: 'Operational Analytics & Reports', subtitle: 'Well drawdown trends, energy efficiency (kWh/bbl), and production rollups' },
};

export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  currentPortal,
  currentRoute,
  onRefresh,
  onExport,
  onOpenFilter,
}) => {
  const meta = ROUTE_TITLES[currentRoute] || {
    section: currentPortal === 'admin' ? 'Administration' : 'Operations',
    title: currentRoute,
    subtitle: 'Module view',
  };

  return (
    <div className="bg-slate-900/60 border-b border-slate-800/80 px-4 lg:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span className="font-semibold text-slate-300">
            {currentPortal === 'admin' ? 'Admin Portal' : 'User Portal'}
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-slate-400">{meta.section}</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-cyan-400 font-medium">{meta.title}</span>
        </div>
        <div className="flex items-baseline gap-3 mt-1">
          <h1 className="text-lg lg:text-xl font-bold text-white tracking-tight">
            {meta.title}
          </h1>
          <p className="text-xs text-slate-400 hidden sm:block">
            {meta.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
        {onOpenFilter && (
          <button
            onClick={onOpenFilter}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-400" />
            <span>Filters</span>
          </button>
        )}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
            title="Refresh Simulated Telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Poll Now</span>
          </button>
        )}
        {onExport && (
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        )}
      </div>
    </div>
  );
};
