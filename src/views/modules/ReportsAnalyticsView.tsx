/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALS — Artificial Lift Suite
 * Reports & Analytics View with Synthetic Telemetry Engine
 * 
 * ALL OPERATIONAL AND TELEMETRY DATA SHOWN IS DEMO SIMULATED DATA.
 * No connection to real SCADA equipment or physical oilfield wells.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  StepForward,
  Download,
  FileText,
  Activity,
  Gauge,
  Thermometer,
  Zap,
  TrendingUp,
  AlertTriangle,
  Truck,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  Calendar,
  Sparkles,
  Maximize2,
  Printer,
  X,
  Sliders,
  Database,
  Info
} from 'lucide-react';
import {
  telemetryEngine,
  SyntheticTelemetryRecord,
  EngineState,
  MONITORED_EQUIPMENT,
  EquipmentOption
} from '../../services/telemetryEngine';

interface ReportsAnalyticsViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (id: string | null) => void;
}

export const ReportsAnalyticsView: React.FC<ReportsAnalyticsViewProps> = ({
  selectedAssetId,
  onSelectAssetId,
}) => {
  // Engine State
  const [engineState, setEngineState] = useState<EngineState>(telemetryEngine.getState());
  const [lastTickRecord, setLastTickRecord] = useState<SyntheticTelemetryRecord | undefined>();
  const [tickCounter, setTickCounter] = useState<number>(0);

  // Filters
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>(() => selectedAssetId || 'ALL');
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '14d' | '30d' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState<string>('2026-10-01');
  const [customEnd, setCustomEnd] = useState<string>('2026-10-28');

  React.useEffect(() => {
    if (selectedAssetId) {
      setSelectedEquipmentId(selectedAssetId);
    }
  }, [selectedAssetId]);
  const [searchTableQuery, setSearchTableQuery] = useState<string>('');
  const [tablePage, setTablePage] = useState<number>(1);
  const rowsPerPage = 15;

  // Active Tab
  type AnalyticsTab = 
    | 'report-center'
    | 'overview' 
    | 'pressure-temp' 
    | 'flow-prod' 
    | 'electrical-mech' 
    | 'health-perf' 
    | 'alarms-failures' 
    | 'fleet-logistics' 
    | 'raw-telemetry';

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('report-center');

  // Slide 5 Report Center state
  interface GeneratedReport {
    id: string;
    name: string;
    template: string;
    dateRange: string;
    generatedAt: string;
    generatedBy: string;
    fileSize: string;
    status: 'Completed' | 'In Progress' | 'Failed';
  }

  const [reports, setReports] = useState<GeneratedReport[]>([
    { id: 'RPT-2026-104', name: 'Monthly Field Production Audit', template: 'Production Summary', dateRange: '2026/Oct/01 - 2026/Oct/31', generatedAt: '2026-10-28 07:15 UTC', generatedBy: 'Carlos Reyes, PE', fileSize: '2.4 MB', status: 'Completed' },
    { id: 'RPT-2026-103', name: 'ESP Hydraulic Stress & P&T Profiler', template: 'Pressure & Temperature Report', dateRange: '2026/Oct/01 - 2026/Oct/31', generatedAt: '2026-10-28 06:40 UTC', generatedBy: 'Sarah Jenkins', fileSize: '4.1 MB', status: 'Completed' },
    { id: 'RPT-2026-102', name: 'Q4 Vogel Inflow Drawdown Analysis', template: 'Well Performance Report', dateRange: '2026/Oct/01 - 2026/Oct/31', generatedAt: '2026-10-28 05:20 UTC', generatedBy: 'David Chen', fileSize: '1.8 MB', status: 'Completed' },
    { id: 'RPT-2026-101', name: 'Delaware Basin 20-Well Health Matrix', template: 'Equipment Health Report', dateRange: '2026/Oct/01 - 2026/Oct/31', generatedAt: '2026-10-28 04:10 UTC', generatedBy: 'Automated Scheduler', fileSize: '3.6 MB', status: 'Completed' },
    { id: 'RPT-2026-100', name: 'Real-Time Telemetry Multi-Register Dump', template: 'Custom Telemetry Report', dateRange: '2026/Oct/27 - 2026/Oct/28', generatedAt: '2026-10-28 07:45 UTC', generatedBy: 'Elena Rostova', fileSize: '840 KB', status: 'In Progress' },
    { id: 'RPT-2026-099', name: 'Northern Zone Remote Gateway Diagnostics', template: 'Pressure & Temperature Report', dateRange: '2026/Oct/15 - 2026/Oct/20', generatedAt: '2026-10-27 22:15 UTC', generatedBy: 'SCADA Gateway', fileSize: '—', status: 'Failed' },
  ]);
  const [reportFilter, setReportFilter] = useState<string>('All');
  const [reportSearch, setReportSearch] = useState<string>('');
  const [reportDateRange, setReportDateRange] = useState<string>('2026/Oct/01 - 2026/Oct/31');
  const [viewingReport, setViewingReport] = useState<GeneratedReport | null>(null);

  // UI state
  const [notice, setNotice] = useState<string | null>(null);
  const [showExecutiveReportModal, setShowExecutiveReportModal] = useState<boolean>(false);
  const [playbackSpeedSelect, setPlaybackSpeedSelect] = useState<number>(engineState.playbackSpeedMs);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Subscribe to Telemetry Engine
  useEffect(() => {
    const unsubscribe = telemetryEngine.subscribe((newState, latestRecord) => {
      setEngineState(newState);
      setLastTickRecord(latestRecord);
      setTickCounter(prev => prev + 1);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  // Fetch filtered telemetry data based on current selections
  const telemetryData = useMemo(() => {
    // We pass tickCounter so useMemo recalculates when the engine ticks
    void tickCounter;
    return telemetryEngine.getTelemetry(
      selectedEquipmentId,
      timeRange,
      customStart,
      customEnd
    );
  }, [selectedEquipmentId, timeRange, customStart, customEnd, tickCounter]);

  // Downsample data if too dense for charts to maintain high 60fps rendering
  const chartSampledData = useMemo(() => {
    if (telemetryData.length <= 160) return telemetryData;
    const step = Math.ceil(telemetryData.length / 120);
    return telemetryData.filter((_, idx) => idx % step === 0 || idx === telemetryData.length - 1);
  }, [telemetryData]);

  // Aggregate summary statistics
  const summaryKpis = useMemo(() => {
    if (telemetryData.length === 0) {
      return {
        avgBopd: 0,
        avgGrossFluid: 0,
        avgWaterCut: 0,
        avgPip: 0,
        avgPdp: 0,
        avgMotorTemp: 0,
        avgHealthScore: 0,
        avgEfficiency: 0,
        avgVibration: 0,
        totalAlarms: 0,
        criticalAlarms: 0,
        totalFleetFuel: 0,
        totalFleetTrips: 0,
        avgFleetUtil: 0,
        totalHours: 0,
      };
    }

    let sumBopd = 0;
    let sumGross = 0;
    let sumWaterCut = 0;
    let sumPip = 0;
    let sumPdp = 0;
    let sumMotorTemp = 0;
    let sumHealth = 0;
    let sumEff = 0;
    let sumVib = 0;
    let alarmCount = 0;
    let criticalCount = 0;
    let sumFuel = 0;
    let sumTrips = 0;
    let sumUtil = 0;

    for (const d of telemetryData) {
      sumBopd += d.oilFlowBopd;
      sumGross += d.grossFluidBpd;
      sumWaterCut += d.waterCutPct;
      sumPip += d.intakePressurePsi;
      sumPdp += d.dischargePressurePsi;
      sumMotorTemp += d.motorTempF;
      sumHealth += d.espHealthScore;
      sumEff += d.pumpEfficiencyPct;
      sumVib += d.vibrationRmsG;
      if (d.hasAlarm) alarmCount++;
      if (d.alarmSeverity === 'Critical' || d.alarmSeverity === 'High') criticalCount++;
      sumFuel += d.fleetFuelGallons;
      sumTrips += d.fleetTripsCount;
      sumUtil += d.fleetUtilizationPct;
    }

    const n = telemetryData.length;
    return {
      avgBopd: Math.round(sumBopd / n),
      avgGrossFluid: Math.round(sumGross / n),
      avgWaterCut: Number((sumWaterCut / n).toFixed(1)),
      avgPip: Math.round(sumPip / n),
      avgPdp: Math.round(sumPdp / n),
      avgMotorTemp: Number((sumMotorTemp / n).toFixed(1)),
      avgHealthScore: Number((sumHealth / n).toFixed(1)),
      avgEfficiency: Number((sumEff / n).toFixed(1)),
      avgVibration: Number((sumVib / n).toFixed(2)),
      totalAlarms: alarmCount,
      criticalAlarms: criticalCount,
      totalFleetFuel: Math.round(sumFuel),
      totalFleetTrips: sumTrips,
      avgFleetUtil: Number((sumUtil / n).toFixed(1)),
      totalHours: n,
    };
  }, [telemetryData]);

  // Failure reasons breakdown for 30d synthetic timeline
  const failureReasonsData = useMemo(() => [
    { reason: 'Thermal Overload / Motor Scale', count: 4, downtimeHours: 38, pct: 31 },
    { reason: 'Gas Interference / Lock', count: 3, downtimeHours: 19, pct: 23 },
    { reason: 'Radial Bearing Solids Wear', count: 3, downtimeHours: 26, pct: 23 },
    { reason: 'MLE Cable Insulation Degradation', count: 2, downtimeHours: 42, pct: 15 },
    { reason: 'VFD Harmonics / Line Surge', count: 1, downtimeHours: 8, pct: 8 },
  ], []);

  // Alarm severity distribution
  const alarmDistribution = useMemo(() => {
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    for (const r of telemetryData) {
      if (r.alarmSeverity === 'Critical') critical++;
      else if (r.alarmSeverity === 'High') high++;
      else if (r.alarmSeverity === 'Medium') medium++;
      else if (r.alarmSeverity === 'Low') low++;
    }
    return [
      { name: 'Critical', count: critical, fill: '#ef4444' },
      { name: 'High', count: high, fill: '#f97316' },
      { name: 'Medium', count: medium, fill: '#eab308' },
      { name: 'Low', count: low, fill: '#06b6d4' },
    ];
  }, [telemetryData]);

  // Filtered table rows with pagination
  const filteredTableRows = useMemo(() => {
    let list = telemetryData;
    if (searchTableQuery.trim()) {
      const q = searchTableQuery.toLowerCase();
      list = list.filter(r => 
        r.equipmentName.toLowerCase().includes(q) ||
        r.equipmentId.toLowerCase().includes(q) ||
        r.hourLabel.toLowerCase().includes(q) ||
        (r.alarmTitle && r.alarmTitle.toLowerCase().includes(q))
      );
    }
    // Reverse chronologically for the audit table
    return [...list].reverse();
  }, [telemetryData, searchTableQuery]);

  const totalPages = Math.ceil(filteredTableRows.length / rowsPerPage) || 1;
  const currentTableData = useMemo(() => {
    const start = (tablePage - 1) * rowsPerPage;
    return filteredTableRows.slice(start, start + rowsPerPage);
  }, [filteredTableRows, tablePage]);

  // Export handlers
  const handleExportCsv = useCallback(() => {
    const selectedName = selectedEquipmentId === 'ALL' 
      ? 'All_Equipment' 
      : (MONITORED_EQUIPMENT.find(e => e.id === selectedEquipmentId)?.name.replace(/\s+/g, '_') || selectedEquipmentId);
    
    const csvData = telemetryEngine.exportCsv(telemetryData, selectedName);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ALS_Telemetry_${selectedName}_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(`Exported ${telemetryData.length.toLocaleString()} telemetry rows to CSV.`);
  }, [telemetryData, selectedEquipmentId, timeRange]);

  // Simulation Controls
  const togglePlayPause = () => {
    if (engineState.isRunning) {
      telemetryEngine.pause();
      showToast('Telemetry simulation paused.');
    } else {
      telemetryEngine.resume();
      showToast('Telemetry simulation resumed.');
    }
  };

  const toggleAccelerated = () => {
    const nextVal = !engineState.isAccelerated;
    telemetryEngine.setAccelerated(nextVal);
    showToast(`Simulation mode: ${nextVal ? 'Accelerated Demo Mode (2.5s / hr)' : 'Real-Time Wall Clock Sync'}`);
  };

  const handleStepForward = () => {
    const added = telemetryEngine.advanceOneHour();
    if (added) {
      showToast('Advanced simulation by +1 virtual hour.');
    } else {
      showToast('Virtual hour already generated (duplicate suppressed).');
    }
  };

  const handleReset = () => {
    if (window.confirm('Reset synthetic telemetry buffer? This will reload 30 days (720 hours) of clean baseline data.')) {
      telemetryEngine.reset();
      setTablePage(1);
      showToast('Synthetic telemetry buffer reset to 30-day baseline.');
    }
  };

  const handleSpeedChange = (speedMs: number) => {
    setPlaybackSpeedSelect(speedMs);
    telemetryEngine.setSpeed(speedMs);
    showToast(`Playback cycle speed set to ${(speedMs / 1000).toFixed(1)}s per simulated hour.`);
  };

  const formattedVirtualTime = useMemo(() => {
    const date = new Date(engineState.currentVirtualTime);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    }) + ' UTC';
  }, [engineState.currentVirtualTime]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Toast Notification */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/60 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2 font-mono animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* TOP HEADER & SIMULATION ENGINE COCKPIT */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden backdrop-blur">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title & Demarcation */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2.5">
                <Activity className="w-6 h-6 text-cyan-400" />
                <span>Reports & Telemetry Analytics Suite</span>
              </h2>
              {/* Mandatory DEMO SIMULATED DATA badge */}
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                DEMO SIMULATED DATA
              </span>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/40">
                30-Day Historical Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Deterministic oilfield physics engine generating continuous hourly downhole telemetry, mechanical vibration, 
              pump curve efficiency, thermal gradients, and field fleet logistics. Not connected to physical SCADA equipment.
            </p>
          </div>

          {/* Real-time Telemetry Engine Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 shadow-inner">
            {/* Live Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-900 border border-slate-800">
              <span className={`w-2.5 h-2.5 rounded-full ${engineState.isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <div className="text-[11px] font-mono leading-none">
                <span className="text-slate-400 block text-[9px] uppercase tracking-wider">Engine Status</span>
                <span className={engineState.isRunning ? 'text-emerald-300 font-semibold' : 'text-amber-300 font-semibold'}>
                  {engineState.isRunning ? (engineState.isAccelerated ? 'RUNNING (ACCEL)' : 'RUNNING (CLOCK)') : 'PAUSED'}
                </span>
              </div>
            </div>

            {/* Play / Pause */}
            <button
              onClick={togglePlayPause}
              title={engineState.isRunning ? 'Pause Engine Simulation' : 'Resume Engine Simulation'}
              className={`p-2 rounded text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                engineState.isRunning
                  ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}
            >
              {engineState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
              <span className="hidden sm:inline">{engineState.isRunning ? 'Pause' : 'Resume'}</span>
            </button>

            {/* Step 1 Hour */}
            <button
              onClick={handleStepForward}
              title="Advance 1 Simulated Hour"
              className="p-2 rounded text-xs font-semibold flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <StepForward className="w-4 h-4" />
              <span className="hidden sm:inline">+1 Hr</span>
            </button>

            {/* Accelerated Mode Toggle */}
            <button
              onClick={toggleAccelerated}
              title="Toggle Accelerated Demo Mode"
              className={`p-2 rounded text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                engineState.isAccelerated
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <FastForward className="w-4 h-4" />
              <span className="hidden md:inline">Demo Mode</span>
            </button>

            {/* Speed Selector */}
            {engineState.isAccelerated && (
              <select
                value={playbackSpeedSelect}
                onChange={(e) => handleSpeedChange(Number(e.target.value))}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-xs rounded px-2 py-1.5 font-mono cursor-pointer hover:border-cyan-500 focus:outline-none"
                title="Simulation speed per virtual hour"
              >
                <option value={1500}>1.5s / hr</option>
                <option value={2500}>2.5s / hr (Default)</option>
                <option value={5000}>5.0s / hr</option>
              </select>
            )}

            {/* Reset */}
            <button
              onClick={handleReset}
              title="Reset 30-Day Buffer to Baseline"
              className="p-2 rounded text-xs font-semibold flex items-center gap-1 bg-slate-800 hover:bg-red-950/40 text-slate-300 hover:text-red-300 border border-slate-700 hover:border-red-500/30 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Engine Telemetry Strip & Clock Information */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 font-mono">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Simulated Clock:</span>
              <strong className="text-white">{formattedVirtualTime}</strong>
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span>
              Total Buffer: <strong className="text-cyan-300">{engineState.totalPointsGenerated.toLocaleString()}</strong> hourly points
            </span>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span>
              Deduplication Guard: <strong className="text-emerald-400">{engineState.duplicatesBlocked}</strong> duplicate calls prevented
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400/80 animate-ping" />
            <span className="text-[11px] text-cyan-300/80">Monotonic Hourly Keys Enforced</span>
          </div>
        </div>
      </div>

      {/* FILTER & EXPORT ACTION TOOLBAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-lg">
        {/* Left: Equipment & Time Range Filters */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Equipment selector */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Equipment:</span>
            </label>
            <select
              value={selectedEquipmentId}
              onChange={(e) => setSelectedEquipmentId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 font-medium focus:border-cyan-500 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Equipment (Fleet Rollup & Aggregate)</option>
              {MONITORED_EQUIPMENT.map(eq => (
                <option key={eq.id} value={eq.id}>
                  {eq.name} ({eq.liftType} • {eq.id})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['24h', '7d', '14d', '30d', 'custom'] as const).map(rangeKey => (
              <button
                key={rangeKey}
                onClick={() => setTimeRange(rangeKey)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  timeRange === rangeKey
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {rangeKey === '24h' && '24 Hours'}
                {rangeKey === '7d' && '7 Days'}
                {rangeKey === '14d' && '14 Days'}
                {rangeKey === '30d' && '30 Days'}
                {rangeKey === 'custom' && 'Custom'}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs if custom is selected */}
          {timeRange === 'custom' && (
            <div className="flex items-center gap-2 font-mono text-xs">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <span className="text-slate-500">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-slate-200 rounded px-2.5 py-1.5 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Right: Export & Report Generation Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCsv}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setShowExecutiveReportModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all"
          >
            <FileText className="w-4 h-4" />
            <span>Executive Audit Report</span>
          </button>
        </div>
      </div>

      {/* ANALYTICS SUITE NAVIGATION TABS */}
      <div className="flex overflow-x-auto no-scrollbar gap-1 border-b border-slate-800 pb-px">
        {[
          { id: 'report-center', label: 'Report Center (Slide 5)', icon: FileText },
          { id: 'overview', label: 'Executive Rollup & KPIs', icon: Activity },
          { id: 'pressure-temp', label: 'Pressures & Temperatures', icon: Gauge },
          { id: 'flow-prod', label: 'Flow & Production Rates', icon: TrendingUp },
          { id: 'electrical-mech', label: 'Electrical & Vibration', icon: Zap },
          { id: 'health-perf', label: 'ESP Health & Pump Curve', icon: Sparkles },
          { id: 'alarms-failures', label: 'Alarms & Failures (MTBF)', icon: AlertTriangle },
          { id: 'fleet-logistics', label: 'Fleet & Fuel Utilization', icon: Truck },
          { id: 'raw-telemetry', label: 'Telemetry Audit Table', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AnalyticsTab)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all ${
                isActive
                  ? 'border-cyan-400 text-cyan-300 bg-slate-900/50 rounded-t-lg'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 0: REPORT CENTER (Slide 5) */}
      {activeTab === 'report-center' && (
        <div className="space-y-6">
          {/* Slide 5: Header Bar & Date Range Selector */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white tracking-wide font-mono">
                  Report Generation & Engineering Archives (Slide 5)
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                On-demand automated report templates, scheduled exports, and regulatory compliance audit records.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>Date Range:</span>
              </span>
              <select
                value={reportDateRange}
                onChange={(e) => {
                  setReportDateRange(e.target.value);
                  showToast(`Selected report generation window: ${e.target.value}`);
                }}
                className="bg-slate-950 border border-slate-700 text-cyan-300 rounded px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="2026/Oct/01 - 2026/Oct/31">2026/Oct/01 - 2026/Oct/31 (Current Month)</option>
                <option value="2026/Sep/01 - 2026/Sep/30">2026/Sep/01 - 2026/Sep/30 (Previous Month)</option>
                <option value="2026/Q3 (Jul - Sep)">2026/Q3 (Jul - Sep)</option>
                <option value="2026/YTD (Jan - Oct)">2026/YTD (Jan - Oct)</option>
              </select>
            </div>
          </div>

          {/* Slide 5: 4 Report Statistics Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Total Reports</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-white">48</span>
                <span className="text-xs font-mono text-slate-400">Archived</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-cyan-500 h-1.5 rounded-full" style={{ width: '100%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block">Historical engineering reports</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Completed</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-emerald-400">42</span>
                <span className="text-xs font-mono text-emerald-400 font-semibold">87.5%</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '87.5%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block">Successfully generated & verified</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">In Progress</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-amber-400">4</span>
                <span className="text-[10px] font-mono text-amber-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Rendering
                </span>
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: '25%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block">Active compute queues</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Failed / Errored</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold font-mono text-rose-400">2</span>
                <span className="text-xs font-mono text-rose-400">4.1%</span>
              </div>
              <div className="mt-2 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-rose-500 h-1.5 rounded-full" style={{ width: '15%' }} />
              </div>
              <span className="text-[10px] text-slate-400 mt-1.5 block">Gateway telemetry timeout</span>
            </div>
          </div>

          {/* Slide 5: Report Generation Trend Bar Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Weekly Report Generation Activity & Category Breakdown (Slide 5)
                </h4>
              </div>
              <span className="text-xs font-mono text-slate-400">{reportDateRange}</span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    { week: 'Week 1 (Oct 1-7)', production: 10, pressureTemp: 4, wellPerf: 2, equipmentHealth: 1 },
                    { week: 'Week 2 (Oct 8-14)', production: 12, pressureTemp: 3, wellPerf: 3, equipmentHealth: 2 },
                    { week: 'Week 3 (Oct 15-21)', production: 14, pressureTemp: 5, wellPerf: 4, equipmentHealth: 3 },
                    { week: 'Week 4 (Oct 22-28)', production: 12, pressureTemp: 4, wellPerf: 3, equipmentHealth: 2 },
                  ]}
                  margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="production" name="Production Summary" fill="#06b6d4" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="pressureTemp" name="Pressure & Temp" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="wellPerf" name="Well Performance" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="equipmentHealth" name="Equipment Health" fill="#f59e0b" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Slide 5: Report Templates Gallery */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Report Templates Gallery (Slide 5)
                </h4>
                <p className="text-xs text-slate-400">Select an operational engineering template to generate automated datasets and printable audit summaries.</p>
              </div>
              <span className="text-xs font-mono text-cyan-400">5 Templates Available</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  id: 'tpl-1',
                  name: 'Production Summary',
                  category: 'Production & Reservoir',
                  desc: 'Daily & weekly fluid rates, BOPD, BFPD, water cut %, target variances, and gas production.',
                  color: 'cyan',
                  icon: TrendingUp,
                },
                {
                  id: 'tpl-2',
                  name: 'Pressure & Temp Report',
                  category: 'Hydraulics & Thermal',
                  desc: 'Intake PIP, discharge PDP, tubing/casing pressure gradient, and downhole motor thermal logs.',
                  color: 'blue',
                  icon: Gauge,
                },
                {
                  id: 'tpl-3',
                  name: 'Well Performance Report',
                  category: 'Inflow & Nodal',
                  desc: 'Vogel IPR drawdown, BEP operating delta, run-life MTBF, and kWh per lifted barrel economics.',
                  color: 'emerald',
                  icon: Sparkles,
                },
                {
                  id: 'tpl-4',
                  name: 'Equipment Health Report',
                  category: 'Vibration & Mechanical',
                  desc: 'Pump affinity efficiency score, RMS vibration envelopes, motor winding insulation, and wear factor.',
                  color: 'amber',
                  icon: ShieldCheck,
                },
                {
                  id: 'tpl-5',
                  name: 'Custom Telemetry Report',
                  category: 'SCADA Export',
                  desc: 'Operator-selected Modbus register tags, sampling intervals, and time-stamped raw telemetry.',
                  color: 'purple',
                  icon: Database,
                },
              ].map(tpl => {
                const Icon = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 space-y-3 flex flex-col justify-between hover:border-cyan-500/50 transition-all group"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40 transition-colors">
                          <Icon className="w-4 h-4 text-cyan-400" />
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{tpl.category}</span>
                      </div>
                      <h5 className="text-xs font-bold text-white mt-2 font-mono group-hover:text-cyan-300 transition-colors">
                        {tpl.name}
                      </h5>
                      <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                        {tpl.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        const newReport: GeneratedReport = {
                          id: `RPT-2026-${Math.floor(110 + Math.random() * 880)}`,
                          name: `${tpl.name} (${reportDateRange.split(' ')[0]})`,
                          template: tpl.name,
                          dateRange: reportDateRange,
                          generatedAt: `${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC`,
                          generatedBy: 'Current Operator (RTOC)',
                          fileSize: `${(1.2 + Math.random() * 3.4).toFixed(1)} MB`,
                          status: 'Completed',
                        };
                        setReports([newReport, ...reports]);
                        showToast(`Generated new report ${newReport.id}: "${newReport.name}"`);
                      }}
                      className="w-full py-1.5 px-2 rounded bg-slate-900 hover:bg-cyan-600 border border-slate-700 hover:border-cyan-500 text-xs text-cyan-300 hover:text-white font-semibold transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Generate Now</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Slide 5: Recent Reports Table with Search & Status Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Recent Generated Reports & Download Archives (Slide 5)
                </h4>
                <p className="text-xs text-slate-400">Download CSV raw datasets, inspect printable summaries, or review generation history.</p>
              </div>

              {/* Search & Status Filter */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search reports..."
                    className="bg-slate-950 border border-slate-700 rounded pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1 text-xs"
                >
                  <option value="All">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Report ID</th>
                    <th className="px-3 py-2.5">Report Title</th>
                    <th className="px-3 py-2.5">Template Type</th>
                    <th className="px-3 py-2.5">Date Range</th>
                    <th className="px-3 py-2.5">Generated At</th>
                    <th className="px-3 py-2.5">Generated By</th>
                    <th className="px-3 py-2.5">File Size</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {reports
                    .filter(r => {
                      const matchSearch = r.name.toLowerCase().includes(reportSearch.toLowerCase()) || r.id.toLowerCase().includes(reportSearch.toLowerCase());
                      const matchFilter = reportFilter === 'All' || r.status === reportFilter;
                      return matchSearch && matchFilter;
                    })
                    .map(rpt => (
                      <tr key={rpt.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-3 py-2.5 font-bold text-cyan-400">{rpt.id}</td>
                        <td className="px-3 py-2.5 text-white font-sans font-semibold">{rpt.name}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans">{rpt.template}</td>
                        <td className="px-3 py-2.5 text-slate-400 font-mono text-[11px] whitespace-nowrap">{rpt.dateRange}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">{rpt.generatedAt}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans">{rpt.generatedBy}</td>
                        <td className="px-3 py-2.5 text-slate-400 font-mono">{rpt.fileSize}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold border ${
                            rpt.status === 'Completed' ? 'bg-emerald-950 text-emerald-300 border-emerald-800' :
                            rpt.status === 'In Progress' ? 'bg-amber-950 text-amber-300 border-amber-800' :
                            'bg-rose-950 text-rose-300 border-rose-800'
                          }`}>
                            {rpt.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                // Generate CSV export for this report
                                const headers = ['Timestamp', 'Well_Name', 'Lift_Type', 'Intake_Pressure_psi', 'Discharge_Pressure_psi', 'Oil_BOPD', 'Gross_BFPD', 'Water_Cut_Pct', 'Motor_Temp_F', 'VFD_Hz', 'Status'];
                                const demoRows = [
                                  ['2026-10-28 07:00:00 UTC', 'Phantom State 104-2H', 'ESP', 840, 2950, 985, 2450, 59.8, 198, 58.5, 'Nominal'],
                                  ['2026-10-28 07:00:00 UTC', 'Red River Federal 82-4H', 'ESP', 620, 2640, 1120, 3100, 63.8, 215, 61.2, 'Nominal'],
                                  ['2026-10-28 07:00:00 UTC', 'Silver Spur 99-1H', 'ESP', 790, 2810, 840, 2200, 61.8, 192, 57.0, 'Nominal'],
                                  ['2026-10-28 07:00:00 UTC', 'War Admiral 112-1H', 'ESP', 880, 3100, 1280, 3600, 64.4, 204, 62.5, 'Nominal'],
                                  ['2026-10-28 07:00:00 UTC', 'Canyon Creek 19-3H', 'Rod Pump', 450, 1850, 340, 980, 65.3, 168, 52.0, 'Warning'],
                                ];
                                const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...demoRows.map(r => r.join(','))].join('\n');
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement('a');
                                link.setAttribute('href', encodedUri);
                                link.setAttribute('download', `${rpt.id}_${rpt.template.replace(/\s+/g, '_')}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                showToast(`Downloaded CSV for ${rpt.id}.`);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono border border-slate-700 transition-colors flex items-center gap-1"
                              title="Download Report CSV"
                            >
                              <Download className="w-3 h-3" />
                              <span>CSV</span>
                            </button>
                            <button
                              onClick={() => setViewingReport(rpt)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] border border-slate-700 transition-colors"
                              title="Inspect Summary"
                            >
                              Summary
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Printable Report Summary Modal */}
          {viewingReport && (
            <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{viewingReport.id} • {viewingReport.template}</span>
                    <h3 className="text-base font-bold text-white mt-0.5">{viewingReport.name}</h3>
                  </div>
                  <button onClick={() => setViewingReport(null)} className="text-slate-400 hover:text-white">✕</button>
                </div>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[11px]">
                    <div>
                      <span className="text-slate-500 block text-[10px]">DATE RANGE</span>
                      <span className="text-white font-bold">{viewingReport.dateRange}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">GENERATED BY</span>
                      <span className="text-cyan-300">{viewingReport.generatedBy}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">FILE SIZE</span>
                      <span className="text-white">{viewingReport.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">STATUS</span>
                      <span className="text-emerald-400 font-bold">{viewingReport.status}</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                    <h5 className="font-bold text-white uppercase text-[11px] tracking-wide font-mono">Executive Summary Extract:</h5>
                    <p className="text-slate-300 leading-relaxed">
                      This report compiles verified telemetry archives from 20 monitored artificial lift wellbores in the Delaware and Midland basins. Operating efficiency for the reporting period averaged 91.4% with an overall fleet uptime of 99.88%. Total lifted fluid reached 48,200 BFPD across monitored ESP and sucker rod systems with mean water cut at 62.4%.
                    </p>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span>Verification Hash: SHA256-ALS-9981-D9F4</span>
                      <span className="text-emerald-400">✓ Digital Signature Valid</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      window.print();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
                  >
                    <Printer className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Print Report</span>
                  </button>
                  <button
                    onClick={() => setViewingReport(null)}
                    className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1: EXECUTIVE OVERVIEW & KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 8 Core Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Avg Oil Production</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-white">
                {summaryKpis.avgBopd.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">BOPD</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Gross Fluid: {summaryKpis.avgGrossFluid.toLocaleString()} BPD</span>
                <span className="text-emerald-400">+2.4% m/m</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Mean Intake Pressure (PIP)</span>
                <Gauge className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-cyan-300">
                {summaryKpis.avgPip}{' '}
                <span className="text-xs font-normal text-slate-400">psi</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Discharge (PDP): {summaryKpis.avgPdp} psi</span>
                <span className="text-cyan-400">Stable</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Motor Winding Temp</span>
                <Thermometer className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-amber-300">
                {summaryKpis.avgMotorTemp}°F
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Trip Threshold: 240°F</span>
                <span className={summaryKpis.avgMotorTemp > 230 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                  {summaryKpis.avgMotorTemp > 230 ? 'Near Limit' : 'Within Spec'}
                </span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Mean ESP Health Score</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-purple-300">
                {summaryKpis.avgHealthScore}%
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Pump Efficiency: {summaryKpis.avgEfficiency}%</span>
                <span className="text-purple-400">30d Model</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Downhole Vibration RMS</span>
                <Zap className="w-4 h-4 text-blue-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-blue-300">
                {summaryKpis.avgVibration}{' '}
                <span className="text-xs font-normal text-slate-400">g</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Limit: &lt; 0.80 g</span>
                <span className="text-emerald-400">Normal</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Alarms in Period</span>
                <AlertTriangle className="w-4 h-4 text-orange-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-orange-300">
                {summaryKpis.totalAlarms}
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Critical / High: {summaryKpis.criticalAlarms}</span>
                <span className="text-orange-400">Tracked</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Fleet Fuel Burn</span>
                <Truck className="w-4 h-4 text-teal-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-teal-300">
                {summaryKpis.totalFleetFuel.toLocaleString()}{' '}
                <span className="text-xs font-normal text-slate-400">gal</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>Trips: {summaryKpis.totalFleetTrips}</span>
                <span className="text-teal-400">Ultra-Low Diesel</span>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-md">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Average Fleet Utilization</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="mt-2 text-2xl font-bold font-mono text-indigo-300">
                {summaryKpis.avgFleetUtil}%
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>25 Active Fleet Units</span>
                <span className="text-indigo-400">Midland Hub</span>
              </div>
            </div>
          </div>

          {/* Synchronized Master Production & Pressure Trend Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Integrated Production & Intake Pressure (PIP) Synchronized Timeline</span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    DEMO SIMULATED DATA
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous hourly correlation between downhole pump intake pressure (psi) and surface oil flow rate (BOPD).
                </p>
              </div>
              <div className="text-xs font-mono text-slate-400">
                Showing {chartSampledData.length} sampled hourly increments
              </div>
            </div>

            <div className="h-80 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis
                    dataKey="hourLabel"
                    stroke="#64748b"
                    fontSize={10}
                    tickMargin={8}
                    interval={Math.ceil(chartSampledData.length / 8)}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="#06b6d4"
                    fontSize={10}
                    domain={['auto', 'auto']}
                    unit=" bpd"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#a855f7"
                    fontSize={10}
                    domain={['auto', 'auto']}
                    unit=" psi"
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', color: '#f8fafc' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="oilFlowBopd"
                    name="Oil Flow Rate (BOPD)"
                    fill="#06b6d4"
                    fillOpacity={0.15}
                    stroke="#06b6d4"
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="intakePressurePsi"
                    name="Intake Pressure PIP (psi)"
                    stroke="#c084fc"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="gasFlowMcfd"
                    name="Associated Gas (MCFD)"
                    stroke="#f59e0b"
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                    dot={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRESSURES & TEMPERATURE DYNAMICS */}
      {activeTab === 'pressure-temp' && (
        <div className="space-y-6">
          {/* Pressure Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-cyan-400" />
                  <span>Downhole & Wellhead Pressure Multi-Gradient (PIP, PDP, Tubing, Casing)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Total hydraulic differential across the artificial lift stage with annulus casing pressure.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={['auto', 'auto']} unit=" psi" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="dischargePressurePsi" name="Discharge Pressure PDP (psi)" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="tubingPressurePsi" name="Tubing Head Pressure (psi)" stroke="#f97316" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="intakePressurePsi" name="Intake Pressure PIP (psi)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="casingPressurePsi" name="Casing Annulus Pressure (psi)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Temperature Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-amber-400" />
                  <span>Thermal Gradient & Motor Winding Temperature Trend</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous RTD downhole thermal monitoring with 240°F high-temp trip ceiling.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis stroke="#94a3b8" fontSize={10} domain={[60, 260]} unit=" °F" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <ReferenceLine y={240} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Critical Trip (240°F)', fill: '#ef4444', fontSize: 10, position: 'top' }} />
                  <Line type="monotone" dataKey="motorTempF" name="Motor Winding Temp (°F)" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="intakeTempF" name="Downhole Intake Fluid (°F)" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="wellheadTempF" name="Wellhead / Surface (°F)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FLOW & PRODUCTION RATES */}
      {activeTab === 'flow-prod' && (
        <div className="space-y-6">
          {/* Stacked Flow Rate Area Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Three-Phase Production Composition (Oil, Water, Gas)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Gross fluid recovery distribution with synthetic Coriolis meter and test separator allocation.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis stroke="#94a3b8" fontSize={10} unit=" bpd" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="oilFlowBopd" name="Net Clean Oil (BOPD)" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="waterFlowBwpd" name="Produced Water (BWPD)" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Water Cut & Gas Flow Line Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Water Cut % & Associated Natural Gas (MCFD)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Secondary water breakthrough dynamics and gas-oil ratio (GOR) fluctuations.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis yAxisId="left" stroke="#38bdf8" fontSize={10} domain={[40, 90]} unit=" %" />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} unit=" mcf" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="waterCutPct" name="Water Cut (%)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="gasFlowMcfd" name="Gas Flow (MCFD)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ELECTRICAL & MECHANICAL DYNAMICS */}
      {activeTab === 'electrical-mech' && (
        <div className="space-y-6">
          {/* Current & Voltage & Power Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Motor Electrical Draw (Current A, Power kW, Frequency Hz)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Downhole induction motor electrical load signature and VFD inverter speed.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis yAxisId="left" stroke="#06b6d4" fontSize={10} unit=" A" domain={['auto', 'auto']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#eab308" fontSize={10} unit=" kW" domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="motorCurrentA" name="Motor Current (Amps)" stroke="#06b6d4" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="powerKw" name="Power Consumption (kW)" stroke="#eab308" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="vfdFrequencyHz" name="VFD Frequency (Hz)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tri-Axial Vibration & Pump RPM Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Downhole Tri-Axial Vibration (X, Y, Z, RMS g-force) & Pump RPM</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Spectral vibration monitoring to detect impeller unbalance, pump gas cavitation, or bearing wear.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis yAxisId="left" stroke="#f43f5e" fontSize={10} domain={[0, 1.2]} unit=" g" />
                  <YAxis yAxisId="right" orientation="right" stroke="#8b5cf6" fontSize={10} domain={[2500, 3600]} unit=" rpm" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <ReferenceLine yAxisId="left" y={0.8} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'Vibration Trip Level (0.80 g)', fill: '#ef4444', fontSize: 10 }} />
                  <Line yAxisId="left" type="monotone" dataKey="vibrationRmsG" name="Vibration RMS (g)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="vibrationX" name="X-Radial (g)" stroke="#fb7185" strokeWidth={1} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="vibrationY" name="Y-Radial (g)" stroke="#fda4af" strokeWidth={1} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="pumpRpm" name="Pump Shaft Speed (RPM)" stroke="#8b5cf6" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: ESP HEALTH & PUMP PERFORMANCE CURVE */}
      {activeTab === 'health-perf' && (
        <div className="space-y-6">
          {/* Health Score Degradation Timeline */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>30-Day ESP Predictive Health Index (%) & Insulation Resistance (MΩ)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Multivariate predictive ML degradation curve incorporating winding dielectric loss and impeller abrasion.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis yAxisId="left" stroke="#c084fc" fontSize={10} domain={[40, 100]} unit=" %" />
                  <YAxis yAxisId="right" orientation="right" stroke="#38bdf8" fontSize={10} domain={[0, 220]} unit=" MΩ" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="espHealthScore" name="ESP Health Score (%)" stroke="#c084fc" strokeWidth={2.5} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="pumpEfficiencyPct" name="Pump Hydraulic Efficiency (%)" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="insulationResistanceMohm" name="Cable/Motor Insulation (MΩ)" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pump Operating Point vs Best Efficiency Point (BEP) Analysis Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Operating Point on Hydraulic Pump Curve</span>
              </h4>
              <p className="text-xs text-slate-400">
                Comparison of actual operating rate against the manufacturer Best Efficiency Point (BEP).
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Manufacturer BEP Flow Rate:</span>
                  <span className="text-cyan-300 font-bold">2,200 BPD</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Current Gross Operating Rate:</span>
                  <span className="text-emerald-300 font-bold">{summaryKpis.avgGrossFluid.toLocaleString()} BPD</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">BEP Deviation Index:</span>
                  <span className="text-purple-300 font-bold">+5.2% (Recommended Zone)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Downthrust / Upthrust Condition:</span>
                  <span className="text-emerald-400 font-bold">Balanced Downthrust (Optimal)</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Reliability & Run-Life Prognostics</span>
              </h4>
              <p className="text-xs text-slate-400">
                Statistical Weibull model projections for equipment replacement planning.
              </p>

              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Mean Time Between Failures (MTBF):</span>
                  <span className="text-white font-bold">642 Days</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Current Operational Run Life:</span>
                  <span className="text-cyan-300 font-bold">412 Days</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Estimated Remaining Useful Life (RUL):</span>
                  <span className="text-amber-300 font-bold">230 Days (~7.6 Months)</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">Next Scheduled Inspection Window:</span>
                  <span className="text-slate-300 font-bold">Q2 2027</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ALARMS & FAILURES (MTBF) */}
      {activeTab === 'alarms-failures' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Alarm Severity Breakdown */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span>Telemetry Alarm Events by Severity Level</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Frequency of trip setpoints breached during the selected time period.
                </p>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={alarmDistribution} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    />
                    <Bar dataKey="count" name="Incidents" radius={[4, 4, 0, 0]}>
                      {alarmDistribution.map((entry, index) => (
                        <Bar key={`cell-${index}`} dataKey="count" fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Failure Root Causes */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-red-400" />
                  <span>Basin Failure Reason Codes & Downtime Hours (30d)</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Post-mortem teardown root cause classification and deferred barrel impacts.
                </p>
              </div>

              <div className="space-y-2.5 pt-2">
                {failureReasonsData.map(f => (
                  <div key={f.reason} className="p-2.5 rounded bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div>
                      <div className="font-semibold text-white">{f.reason}</div>
                      <div className="text-[11px] text-slate-400">
                        {f.count} Incidents • {f.downtimeHours} hrs total downtime
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-red-400 font-bold">{f.pct}%</span>
                      <div className="text-[10px] text-slate-500">of failures</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: FLEET & FUEL LOGISTICS */}
      {activeTab === 'fleet-logistics' && (
        <div className="space-y-6">
          {/* Active Fleet & Fuel Burn Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Truck className="w-4 h-4 text-teal-400" />
                  <span>Fleet Vehicle Deployment & Hourly Diesel Consumption (Gallons)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Field service truck logistics correlated with well site maintenance dispatches.
                </p>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                DEMO SIMULATED DATA
              </span>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartSampledData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                  <XAxis dataKey="hourLabel" stroke="#64748b" fontSize={10} interval={Math.ceil(chartSampledData.length / 8)} />
                  <YAxis yAxisId="left" stroke="#2dd4bf" fontSize={10} domain={[10, 26]} unit=" units" />
                  <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" fontSize={10} domain={[10, 80]} unit=" gal" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                    labelStyle={{ color: '#38bdf8', fontFamily: 'monospace' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line yAxisId="left" type="monotone" dataKey="fleetActiveVehicles" name="Active Field Trucks" stroke="#2dd4bf" strokeWidth={2} dot={false} />
                  <Line yAxisId="right" type="monotone" dataKey="fleetFuelGallons" name="Hourly Fuel Burn (gal)" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line yAxisId="left" type="monotone" dataKey="fleetTripsCount" name="Wellhead Dispatches" stroke="#818cf8" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: RAW TELEMETRY AUDIT TABLE */}
      {activeTab === 'raw-telemetry' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-0">
          {/* Table Header & Search */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>30-Day Historical Hourly Telemetry Log ({filteredTableRows.length.toLocaleString()} Records)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Granular hourly register audit for downhole diagnostics and CSV export.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search well or tag..."
                  value={searchTableQuery}
                  onChange={(e) => { setSearchTableQuery(e.target.value); setTablePage(1); }}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-cyan-500 font-mono w-48 sm:w-60"
                />
              </div>

              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-3.5 py-2.5">Timestamp</th>
                  <th className="px-3.5 py-2.5">Well Asset</th>
                  <th className="px-3.5 py-2.5 text-right">PIP (psi)</th>
                  <th className="px-3.5 py-2.5 text-right">PDP (psi)</th>
                  <th className="px-3.5 py-2.5 text-right">Motor (°F)</th>
                  <th className="px-3.5 py-2.5 text-right">Net Oil (BOPD)</th>
                  <th className="px-3.5 py-2.5 text-right">Water Cut %</th>
                  <th className="px-3.5 py-2.5 text-right">Current (A)</th>
                  <th className="px-3.5 py-2.5 text-right">Vib RMS (g)</th>
                  <th className="px-3.5 py-2.5 text-right">Health %</th>
                  <th className="px-3.5 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-200 font-mono">
                {currentTableData.map(row => (
                  <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-3.5 py-2 text-slate-300 whitespace-nowrap">{row.hourLabel}</td>
                    <td className="px-3.5 py-2 whitespace-nowrap">
                      <div className="font-semibold text-white">{row.equipmentName}</div>
                      <div className="text-[10px] text-slate-500">{row.equipmentId}</div>
                    </td>
                    <td className="px-3.5 py-2 text-right text-cyan-300 font-semibold">{row.intakePressurePsi}</td>
                    <td className="px-3.5 py-2 text-right text-slate-300">{row.dischargePressurePsi}</td>
                    <td className={`px-3.5 py-2 text-right font-semibold ${row.motorTempF > 230 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {row.motorTempF}°F
                    </td>
                    <td className="px-3.5 py-2 text-right text-emerald-300 font-semibold">{row.oilFlowBopd}</td>
                    <td className="px-3.5 py-2 text-right text-slate-400">{row.waterCutPct}%</td>
                    <td className="px-3.5 py-2 text-right text-cyan-300">{row.motorCurrentA}</td>
                    <td className={`px-3.5 py-2 text-right font-semibold ${row.vibrationRmsG > 0.6 ? 'text-red-400' : 'text-slate-400'}`}>
                      {row.vibrationRmsG}
                    </td>
                    <td className="px-3.5 py-2 text-right text-purple-300">{row.espHealthScore}%</td>
                    <td className="px-3.5 py-2 text-center">
                      {row.hasAlarm ? (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          {row.alarmSeverity}
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Nominal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
            <div>
              Showing page {tablePage} of {totalPages} ({filteredTableRows.length} total records)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={tablePage === 1}
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                Prev
              </button>
              <button
                disabled={tablePage >= totalPages}
                onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded bg-slate-800 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EXECUTIVE PDF / AUDIT REPORT MODAL */}
      {showExecutiveReportModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-cyan-400 font-bold tracking-wider text-xs uppercase">ALS ARTIFICIAL LIFT SUITE</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    DEMO SIMULATED AUDIT REPORT
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mt-1">
                  Executive Production & Equipment Reliability Audit (30-Day Rollup)
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Report ID: ALS-AUDIT-2026-Q4-0891 • Generated {new Date().toUTCString()}
                </p>
              </div>
              <button
                onClick={() => setShowExecutiveReportModal(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Executive Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs">
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Cumulative Oil Lifted</span>
                <span className="text-white font-bold text-base">{(summaryKpis.avgBopd * 30).toLocaleString()} bbls</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Avg Intake Pressure</span>
                <span className="text-cyan-300 font-bold text-base">{summaryKpis.avgPip} psi</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Fleet Energy Intensity</span>
                <span className="text-amber-300 font-bold text-base">4.8 kWh / bbl</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] uppercase block">Mean System Health</span>
                <span className="text-purple-300 font-bold text-base">{summaryKpis.avgHealthScore}%</span>
              </div>
            </div>

            {/* Findings & Engineering Notes */}
            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono">
                1. Operational Surveillance & Downhole Health Summary
              </h4>
              <p>
                During the 30-day monitoring window (720 hourly SCADA scans), downhole ESP assemblies maintained an 
                average hydraulic uptime efficiency of <strong>{summaryKpis.avgEfficiency}%</strong>. Intake pressures 
                remained stable across the Permian Delaware assets with no sustained cavitation or severe fluid pound events.
              </p>
              <p>
                Well <strong>Red River Federal 82-4H</strong> exhibited elevated motor winding temperatures (peaking at 238.6°F) 
                consistent with scale deposition on the motor shroud. Slickline inspection and scale inhibitor chemical flush 
                are scheduled to prevent dielectric breakdown.
              </p>

              <h4 className="font-bold text-white text-sm uppercase tracking-wider font-mono pt-2">
                2. Fleet Logistics & Environmental Stewardship
              </h4>
              <p>
                Field logistical operations recorded <strong>{summaryKpis.totalFleetTrips}</strong> wellhead trips and 
                <strong> {summaryKpis.totalFleetFuel.toLocaleString()} gallons</strong> of fuel consumption with 
                average fleet utilization of <strong>{summaryKpis.avgFleetUtil}%</strong>.
              </p>
            </div>

            {/* Verification Sign-offs */}
            <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-4 font-mono text-xs">
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">ENGINEERING APPROVAL</span>
                <div className="font-bold text-white mt-1">Carlos Reyes, PE</div>
                <div className="text-slate-400 text-[11px]">Sr. Artificial Lift Optimization Engineer</div>
                <div className="text-emerald-400 text-[10px] mt-1">✓ Digital Signature Verified (SHA-256)</div>
              </div>
              <div className="p-3 bg-slate-950 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">OPERATIONS DIRECTORY</span>
                <div className="font-bold text-white mt-1">Marcus Vance</div>
                <div className="text-slate-400 text-[11px]">Permian Asset Operations Director</div>
                <div className="text-emerald-400 text-[10px] mt-1">✓ Verified For Field Deployment</div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowExecutiveReportModal(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
