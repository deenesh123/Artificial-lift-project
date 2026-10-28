import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Layers, 
  Cpu, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  Truck, 
  SlidersHorizontal, 
  Download, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  Wrench,
  FileSpreadsheet,
  RefreshCw,
  Info,
  ChevronRight
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { 
  DEMO_WELLS, 
  DEMO_ALARMS, 
  DEMO_EVENTS, 
  DEMO_JOBS, 
  FLEET_PRODUCTION_TREND 
} from '../../data/mockData';
import { StorageService } from '../../services/storageService';
import { WellAsset } from '../../types';

interface AdminOverviewProps {
  onNavigateToRoute: (routeId: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({ onNavigateToRoute }) => {
  const [alarms, setAlarms] = useState(DEMO_ALARMS);
  const [wells, setWells] = useState<WellAsset[]>(() => StorageService.getWells());
  const [selectedLiftFilter, setSelectedLiftFilter] = useState<string>('All');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      setWells(StorageService.getWells());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setAlarms(prev =>
      prev.map(a => a.id === alarmId ? { ...a, acknowledged: true, acknowledgedBy: 'Admin (You)' } : a)
    );
    showNotice(`Alarm ${alarmId} acknowledged successfully.`);
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Calculations
  const totalWells = 428;
  const activeLiftWells = 392;
  const totalBopd = 84650;
  const uptimePct = 98.4;
  const fleetEnergyMwh = 1130;
  const unreadAlarms = alarms.filter(a => !a.acknowledged);

  const healthData = [
    { name: 'Nominal', value: 351, color: '#10B981' },
    { name: 'Warning', value: 51, color: '#F59E0B' },
    { name: 'Critical', value: 17, color: '#EF4444' },
    { name: 'Offline / Testing', value: 9, color: '#64748B' },
  ];

  const liftTypeBreakdown = [
    { type: 'Electric Submersible Pump (ESP)', count: 312, bopd: 64350, share: '76.0%' },
    { type: 'Rod Pumping Units (SRP)', count: 68, bopd: 11520, share: '13.6%' },
    { type: 'Continuous Gas Lift', count: 34, bopd: 6950, share: '8.2%' },
    { type: 'Progressing Cavity Pump (PCP)', count: 14, bopd: 1830, share: '2.2%' },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-emerald-400 hover:text-white font-mono text-xs">✕</button>
        </div>
      )}

      {/* Top Banner Context */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/50 to-slate-900 border border-slate-800 rounded-xl p-4 lg:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[11px] font-mono font-semibold">
              ADMINISTRATIVE FLEET PORTAL
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-400">Permian, Eagle Ford & Bakken Assets</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
            Artificial Lift Enterprise Operations Cockpit
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Supervisory monitoring of 428 artificial lift wellbores, automated SCADA telemetry poll status, and operational energy intensity across North American producing basins.
          </p>
        </div>

        {/* Quick actions strip */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => showNotice('Initiated automatic fleet SCADA diagnostic scan.')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Fleet Diagnostics</span>
          </button>
          <button
            onClick={() => onNavigateToRoute('fleet')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fleet Radar</span>
          </button>
          <button
            onClick={() => onNavigateToRoute('workflows')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Dispatch Crew</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Top KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Fleet & Uptime */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Active Lift Wells</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {activeLiftWells} <span className="text-xs font-normal text-slate-500">/ {totalWells}</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{uptimePct}%</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>312 ESP · 68 Rod · 48 Other</span>
            <span className="text-emerald-400 font-mono">Uptime Nominal</span>
          </div>
        </div>

        {/* Card 2: Total Lifted Oil Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Daily Lifted Production</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              84,650 <span className="text-xs font-normal text-slate-500">BOPD</span>
            </div>
            <div className="flex items-center text-xs font-semibold text-emerald-400">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+1.2% Target</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Gross Liquid: 248,500 BPD</span>
            <span className="font-mono text-slate-300">65.9% Water Cut</span>
          </div>
        </div>

        {/* Card 3: Energy Intensity */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">Fleet Power & Energy</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              1,130 <span className="text-xs font-normal text-slate-500">MWh/d</span>
            </div>
            <div className="text-xs font-mono text-cyan-400">
              13.35 kWh/bbl
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Peak Demand: 49.2 MW</span>
            <span className="text-emerald-400 font-mono">-4% vs Baseline</span>
          </div>
        </div>

        {/* Card 4: Open Alarms & Dispatched Units */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-medium">System Alarm Center</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {unreadAlarms.length} <span className="text-xs font-normal text-rose-400">Active</span>
            </div>
            <div className="text-xs font-semibold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
              1 Urgent
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{DEMO_JOBS.length} Active Work Orders</span>
            <button 
              onClick={() => onNavigateToRoute('alarms-admin')}
              className="text-cyan-400 hover:underline flex items-center gap-0.5"
            >
              Triage <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Charts Row (2 columns: 8 cols & 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Production by Lift Method Chart (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Fleet Lifted Production by Artificial Lift System (BOPD)</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  Last 7 Days
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-method artificial lift output across Permian Delaware, Midland, and Eagle Ford.
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-mono text-[11px]">Filter:</span>
              {['All', 'ESP', 'Rod Pump', 'Gas Lift'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setSelectedLiftFilter(filter)}
                  className={`px-2 py-0.5 rounded text-xs transition-colors ${
                    selectedLiftFilter === filter
                      ? 'bg-cyan-600 text-white font-semibold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={FLEET_PRODUCTION_TREND} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEsp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorRod" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="colorGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748B" tick={{ fontSize: 11 }} domain={['dataMin - 5000', 'dataMax + 5000']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#E2E8F0' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="espBopd" name="ESP Production" stroke="#06B6D4" fillOpacity={1} fill="url(#colorEsp)" />
                <Area type="monotone" dataKey="rodPumpBopd" name="Rod Pump (SRP)" stroke="#3B82F6" fillOpacity={1} fill="url(#colorRod)" />
                <Area type="monotone" dataKey="gasLiftBopd" name="Gas Lift" stroke="#10B981" fillOpacity={1} fill="url(#colorGas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Asset Health Distribution & Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center justify-between">
              <span>Asset Health Distribution</span>
              <span className="text-[10px] font-mono text-emerald-400">428 Monitored</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time classification based on downhole telemetry parameters.
            </p>

            <div className="h-44 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={healthData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {healthData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-2 pt-3 border-t border-slate-800 text-xs">
            {healthData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <div className="font-mono text-slate-200 tabular-nums">
                  {item.value} wells <span className="text-slate-500 text-[10px]">({Math.round(item.value / 428 * 100)}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Artificial Lift Fleet Summary Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Artificial Lift Method Performance & Capacity Rollup
            </h3>
            <p className="text-xs text-slate-400">
              Aggregated operational metrics by equipment technology across all asset groups.
            </p>
          </div>
          <button 
            onClick={() => onNavigateToRoute('assets')}
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
          >
            <span>Open Asset Registry</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950/70 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Lift Method</th>
                <th className="px-4 py-3 text-right">Well Count</th>
                <th className="px-4 py-3 text-right">Daily Oil (BOPD)</th>
                <th className="px-4 py-3 text-right">Production Share</th>
                <th className="px-4 py-3 text-right">Energy Consumption</th>
                <th className="px-4 py-3 text-right">Avg Run Life</th>
                <th className="px-4 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono">
              {liftTypeBreakdown.map((row, idx) => (
                <tr key={row.type} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-sans font-medium text-white flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400" />
                    <span>{row.type}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.count}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-emerald-400 font-semibold">
                    {row.bopd.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">{row.share}</td>
                  <td className="px-4 py-3 text-right tabular-nums text-amber-300">
                    {idx === 0 ? '14.2 kWh/bbl' : idx === 1 ? '11.8 kWh/bbl' : idx === 2 ? '10.5 kWh/bbl' : '15.1 kWh/bbl'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                    {idx === 0 ? '512 Days' : idx === 1 ? '820 Days' : idx === 2 ? '940 Days' : '480 Days'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-sans">
                      Nominal
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2-Column Split: Active Alarms Triage & Recent Operational Events */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Alarms Triage */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                High-Priority Alarm Center
              </h3>
            </div>
            <button 
              onClick={() => onNavigateToRoute('alarms-admin')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>View All ({alarms.length})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {alarms.slice(0, 3).map((alarm) => (
              <div 
                key={alarm.id}
                className={`p-3.5 rounded-lg border transition-all ${
                  alarm.acknowledged 
                    ? 'bg-slate-950/40 border-slate-800/80 opacity-75' 
                    : alarm.severity === 'Urgent'
                    ? 'bg-rose-950/20 border-rose-800/60'
                    : 'bg-amber-950/20 border-amber-800/60'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                      alarm.severity === 'Urgent' ? 'bg-rose-900 text-rose-200' : 'bg-amber-900 text-amber-200'
                    }`}>
                      {alarm.severity}
                    </span>
                    <span className="font-semibold text-white font-mono">{alarm.wellName}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({alarm.liftType})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{alarm.id}</span>
                </div>

                <p className="text-xs text-slate-300 font-medium">{alarm.title}</p>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{alarm.description}</p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <div className="text-slate-400">
                    Current: <strong className="text-rose-400 font-mono">{alarm.currentValue}</strong>
                  </div>

                  {alarm.acknowledged ? (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Acked by {alarm.acknowledgedBy || 'Operator'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleAcknowledgeAlarm(alarm.id)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Events & Audit Log */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Operational Audit & Supervisory Stream
              </h3>
            </div>
            <button 
              onClick={() => onNavigateToRoute('events-admin')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Audit Trail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {DEMO_EVENTS.slice(0, 4).map((evt) => (
              <div key={evt.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-cyan-300 font-mono">{evt.wellName}</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      {evt.eventType}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">{evt.timestamp.slice(11, 19)}</span>
                </div>
                <p className="text-xs text-slate-300">{evt.description}</p>
                <div className="mt-1.5 text-[10px] text-slate-500 font-mono">
                  Initiated by: <span className="text-slate-400">{evt.user}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
