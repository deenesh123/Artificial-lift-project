import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Gauge, 
  Zap, 
  Flame, 
  Sliders, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw, 
  Play, 
  Pause, 
  Wrench, 
  ChevronRight,
  ShieldAlert,
  Info,
  Layers,
  Thermometer,
  RotateCw,
  Compass,
  Clock,
  Search,
  ArrowLeft,
  XCircle,
  Radio,
  FileSpreadsheet,
  TrendingUp,
  Battery,
  AlertCircle
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  BarChart,
  Bar
} from 'recharts';
import { 
  DEMO_WELLS, 
  DEMO_ALARMS, 
  DEMO_JOBS, 
  DEMO_EVENTS,
  TELEMETRY_HISTORY,
  WELLS_DOWN_24H_DATA,
  STATUS_SUMMARY_24H_DATA,
  FLEET_PRODUCTION_TREND
} from '../../data/mockData';
import { StorageService } from '../../services/storageService';
import { WellAsset, TelemetryPoint, OperationalEvent, AlarmItem } from '../../types';

interface UserOperationsDashboardProps {
  onNavigateToRoute: (routeId: string) => void;
  selectedAssetId?: string | null;
  onSelectAssetId?: (assetId: string | null) => void;
}

export const UserOperationsDashboard: React.FC<UserOperationsDashboardProps> = ({ 
  onNavigateToRoute,
  selectedAssetId: controlledAssetId,
  onSelectAssetId,
}) => {
  const [wellsList, setWellsList] = useState<WellAsset[]>(() => StorageService.getWells());
  
  // Internal selection if not controlled from parent
  const [internalSelectedWellId, setInternalSelectedWellId] = useState<string | null>(null);

  // Time filter for trend chart (PART 6.3)
  const [chartTimeRange, setChartTimeRange] = useState<'15m' | '1h' | '6h' | '12h' | '24h'>('1h');

  // Sub-tabs when on All Assets mode
  const [allAssetsTab, setAllAssetsTab] = useState<'fleet-overview' | 'wells-down-24h' | 'summary-24h'>('fleet-overview');

  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(TELEMETRY_HISTORY);
  const [vfdTrimHz, setVfdTrimHz] = useState<number>(58.5);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeAlarms, setActiveAlarms] = useState<AlarmItem[]>(DEMO_ALARMS);
  const [tableSearchTerm, setTableSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'DOWN' | 'WARNING'>('ALL');

  // Wells Down quick action states (PART B)
  const [dispatchedCrews, setDispatchedCrews] = useState<Record<string, string>>({});
  const [acknowledgedTrips, setAcknowledgedTrips] = useState<Record<string, boolean>>({});
  const [restartedWells, setRestartedWells] = useState<Record<string, boolean>>({});

  const handleDispatchCrew = (wellName: string, team: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    setDispatchedCrews(prev => ({ ...prev, [wellName]: `Dispatched (${time})` }));
    showNotice(`Emergency Field Crew dispatched to ${wellName}: Assigned ${team}. ETA 35 min.`);
  };

  const handleAcknowledgeWellTrip = (wellName: string) => {
    setAcknowledgedTrips(prev => ({ ...prev, [wellName]: true }));
    showNotice(`Trip condition acknowledged for ${wellName}. Interlock reset armed.`);
  };

  const handleInitiateRestart = (wellName: string) => {
    setRestartedWells(prev => ({ ...prev, [wellName]: true }));
    showNotice(`Initiating VFD pre-charge and soft-start ramp on ${wellName} at 45.0 Hz.`);
  };

  useEffect(() => {
    const handleStorage = () => {
      const data = StorageService.getWells();
      setWellsList(data);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Determine current active asset ID
  const activeAssetId = controlledAssetId !== undefined ? controlledAssetId : internalSelectedWellId;
  const isSingleAssetMode = activeAssetId !== null && activeAssetId !== undefined;

  const selectedWell: WellAsset = useMemo(() => {
    if (!activeAssetId) return wellsList[0] || DEMO_WELLS[0];
    return wellsList.find(w => w.id === activeAssetId || w.wellCode === activeAssetId) || wellsList[0] || DEMO_WELLS[0];
  }, [wellsList, activeAssetId]);

  // Alarms and events filtered strictly to selected well when in single asset mode
  const wellAlarms = useMemo(() => {
    return activeAlarms.filter(a => a.wellId === selectedWell.id && !a.acknowledged);
  }, [activeAlarms, selectedWell]);

  const wellJobs = useMemo(() => {
    return DEMO_JOBS.filter(j => j.wellId === selectedWell.id);
  }, [selectedWell]);

  const wellEvents: OperationalEvent[] = useMemo(() => {
    return DEMO_EVENTS.filter(e => e.wellId === selectedWell.id);
  }, [selectedWell]);

  // Sync VFD slider when well changes
  useEffect(() => {
    setVfdTrimHz(selectedWell.vfdFrequencyHz || 55.0);
  }, [selectedWell.id]);

  // Live telemetry pulse simulator
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const nextTime = new Date();
        const timeLabel = nextTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const speedRatio = vfdTrimHz / 58.5;
        const intakeFluct = (Math.random() - 0.5) * 4;
        const currentFluct = (Math.random() - 0.5) * 0.4;
        const tempFluct = (Math.random() - 0.5) * 0.3;

        const newPoint: TelemetryPoint = {
          time: timeLabel,
          intakePressure: Math.round((selectedWell.intakePressurePsi - (speedRatio - 1) * 60 + intakeFluct) * 10) / 10,
          dischargePressure: Math.round((selectedWell.dischargePressurePsi * Math.pow(speedRatio, 1.8) + intakeFluct * 2) * 10) / 10,
          motorTemp: Math.round((selectedWell.motorTempF + (speedRatio - 1) * 12 + tempFluct) * 10) / 10,
          frequency: vfdTrimHz,
          motorCurrent: Math.round((selectedWell.motorCurrentA * speedRatio + currentFluct) * 10) / 10,
          vibration: Math.round((selectedWell.vibrationG + (speedRatio > 1 ? 0.04 : -0.02)) * 100) / 100,
          flowRate: Math.round(selectedWell.currentBopd * speedRatio),
        };

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulating, vfdTrimHz, selectedWell]);

  const handleAcknowledgeAlarm = (alarmId: string) => {
    setActiveAlarms(prev =>
      prev.map(a => a.id === alarmId ? { ...a, acknowledged: true, acknowledgedBy: 'Field Operator (You)' } : a)
    );
    showNotice(`Alarm ${alarmId} acknowledged by control room.`);
  };

  const handleApplyVfdTrim = () => {
    showNotice(`VFD setpoint updated to ${vfdTrimHz.toFixed(1)} Hz. Drive acceleration ramp in progress.`);
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

  const handleSelectAsset = (assetId: string | null) => {
    if (onSelectAssetId) {
      onSelectAssetId(assetId);
    } else {
      setInternalSelectedWellId(assetId);
    }
  };

  const latestTelemetry = telemetry[telemetry.length - 1];

  // Fleet overview statistics
  const runningCount = wellsList.filter(w => w.status === 'Nominal' || w.status === 'Testing').length;
  const downCount = wellsList.filter(w => w.status === 'Offline' || w.status === 'Critical').length;
  const warningCount = wellsList.filter(w => w.status === 'Warning').length;
  const totalProductionBpd = wellsList.reduce((sum, w) => sum + (w.currentBopd || 0), 0);
  const avgHealth = Math.round(wellsList.reduce((sum, w) => sum + (w.healthScore || 0), 0) / (wellsList.length || 1));

  // Filtered wells for table
  const filteredWells = wellsList.filter(w => {
    const term = tableSearchTerm.toLowerCase();
    const shortName = (w.wellCode || w.id).toLowerCase();
    const name = w.name.toLowerCase();
    const basin = w.basin.toLowerCase();
    const matchesSearch = shortName.includes(term) || name.includes(term) || basin.includes(term);

    const isRunning = w.status === 'Nominal' || w.status === 'Testing';
    const isDown = w.status === 'Offline' || w.status === 'Critical';
    const isWarn = w.status === 'Warning';

    const matchesStatus = 
      statusFilter === 'ALL' ? true :
      statusFilter === 'RUNNING' ? isRunning :
      statusFilter === 'DOWN' ? isDown : isWarn;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="bg-cyan-950/90 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-cyan-400 hover:text-white font-mono text-xs">✕</button>
        </div>
      )}

      {/* ======================================================== */}
      {/* CASE 1: ASSET-SPECIFIC OPERATIONAL COCKPIT (PART 6)     */}
      {/* ======================================================== */}
      {isSingleAssetMode ? (
        <div className="space-y-6">
          {/* PART 6.1: Selected Asset Information Header */}
          <div className="bg-slate-900 border border-cyan-500/40 rounded-xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="text-sm font-mono font-bold px-2.5 py-1 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/60">
                    {selectedWell.wellCode || selectedWell.id}
                  </span>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {selectedWell.name}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                    selectedWell.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedWell.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    ● {selectedWell.status === 'Offline' ? 'DOWN' : selectedWell.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    Asset ID: {selectedWell.id}
                  </span>
                </div>

                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-1 font-sans">
                  <span>Basin: <strong className="text-slate-200">{selectedWell.basin}</strong></span>
                  <span>•</span>
                  <span>Field: <strong className="text-slate-200">{selectedWell.field}</strong></span>
                  <span>•</span>
                  <span>Pad: <strong className="text-slate-200">{selectedWell.padName}</strong></span>
                  <span>•</span>
                  <span>Lift: <strong className="text-cyan-400">{selectedWell.liftType}</strong></span>
                  <span>•</span>
                  <span>Run Life: <strong className="text-slate-200">{selectedWell.runLifeDays} Days</strong></span>
                </div>
              </div>

              {/* Controls on Right */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsSimulating(!isSimulating)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    isSimulating 
                      ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300' 
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isSimulating ? 'Live Telemetry' : 'Paused'}</span>
                </button>

                <button
                  onClick={() => handleSelectAsset(null)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition-colors"
                  title="Switch to All Assets Overview"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>All Assets Overview</span>
                </button>
              </div>
            </div>
          </div>

          {/* Active Alarm Alert Banner for Current Well (if any) */}
          {wellAlarms.length > 0 && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-rose-300 font-mono uppercase">
                      UNRESOLVED ALARM TRIP ({wellAlarms[0].severity})
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{wellAlarms[0].id}</span>
                  </div>
                  <p className="text-xs text-white font-medium mt-0.5">{wellAlarms[0].title}</p>
                  <p className="text-[11px] text-slate-300 mt-0.5">{wellAlarms[0].description}</p>
                </div>
              </div>

              <button
                onClick={() => handleAcknowledgeAlarm(wellAlarms[0].id)}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow shrink-0 transition-colors"
              >
                Acknowledge Alarm
              </button>
            </div>
          )}

          {/* PART 6.2: 14 High-Density Operational KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Production */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Production Rate</span>
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {selectedWell.currentBopd > 0 ? selectedWell.currentBopd : '0'} <span className="text-[10px] text-slate-400">BPD</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Target: {selectedWell.targetBopd} BPD</div>
            </div>

            {/* 2. Motor Current */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Motor Current</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {latestTelemetry?.motorCurrent ?? selectedWell.motorCurrentA} <span className="text-[10px] text-slate-400">A</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Nominal: ~52 A</div>
            </div>

            {/* 3. VFD Frequency */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>VFD Frequency</span>
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-cyan-300 font-mono mt-1 tabular-nums">
                {vfdTrimHz.toFixed(1)} <span className="text-[10px] text-slate-400">Hz</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Setpoint: 58.5 Hz</div>
            </div>

            {/* 4. PIP */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Intake Pressure (PIP)</span>
                <Gauge className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {latestTelemetry?.intakePressure ?? selectedWell.intakePressurePsi} <span className="text-[10px] text-slate-400">psi</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Min Envelope: 400</div>
            </div>

            {/* 5. Discharge Head */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Discharge Head</span>
                <Activity className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {latestTelemetry?.dischargePressure ?? selectedWell.dischargePressurePsi} <span className="text-[10px] text-slate-400">psi</span>
              </div>
              <div className="text-[10px] text-blue-400 font-mono mt-0.5">182 Stages</div>
            </div>

            {/* 6. Motor Temp */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Motor Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className={`text-lg font-bold font-mono mt-1 tabular-nums ${
                (latestTelemetry?.motorTemp ?? selectedWell.motorTempF) > 225 ? 'text-rose-400' : 'text-white'
              }`}>
                {latestTelemetry?.motorTemp ?? selectedWell.motorTempF} <span className="text-[10px] text-slate-400">°F</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Trip Limit: 250°F</div>
            </div>

            {/* 7. Vibration */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Vibration (RMS)</span>
                <Activity className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {latestTelemetry?.vibration ?? selectedWell.vibrationG} <span className="text-[10px] text-slate-400">G</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">&lt; 0.50 G Normal</div>
            </div>

            {/* 8. Power Kw */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Power Demand</span>
                <Zap className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {selectedWell.powerKw || 'N/A'} <span className="text-[10px] text-slate-400">kW</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">240 HP Rating</div>
            </div>

            {/* 9. A-Annulus Pressure */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>A-Annulus P</span>
                <Compass className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {selectedWell.aAnnulusPressureKgCm2 !== undefined ? `${selectedWell.aAnnulusPressureKgCm2}` : '50.2'} <span className="text-[10px] text-slate-400">kg/cm²</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Sealed Casing</div>
            </div>

            {/* 10. B-Annulus Pressure */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>B-Annulus P</span>
                <Compass className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {selectedWell.bAnnulusPressureKgCm2 !== undefined ? `${selectedWell.bAnnulusPressureKgCm2}` : '0.0'} <span className="text-[10px] text-slate-400">kg/cm²</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Surface Vent</div>
            </div>

            {/* 11. Flowline Pressure */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Flowline Press</span>
                <Gauge className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {selectedWell.flowlinePressureKgCm2 !== undefined ? `${selectedWell.flowlinePressureKgCm2}` : '8.13'} <span className="text-[10px] text-slate-400">kg/cm²</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">Manifold Header</div>
            </div>

            {/* 12. Flowline Temp */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>Flowline Temp</span>
                <Thermometer className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-lg font-bold text-white font-mono mt-1 tabular-nums">
                {selectedWell.flowlineTempC !== undefined ? `${selectedWell.flowlineTempC}` : '45.4'} <span className="text-[10px] text-slate-400">°C</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">~118°F Surface</div>
            </div>

            {/* 13. RTU Battery */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>RTU Battery</span>
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1 tabular-nums">
                {selectedWell.batteryVoltage !== undefined ? `${selectedWell.batteryVoltage} V` : '3.7 V'}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Nominal Charge</div>
            </div>

            {/* 14. ESP Health Score */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3">
              <div className="text-[10px] text-slate-400 font-medium flex items-center justify-between">
                <span>ESP Health</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-cyan-300 font-mono mt-1 tabular-nums">
                {selectedWell.healthScore}<span className="text-xs font-normal">/100</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">AI RunLife Score</div>
            </div>
          </div>

          {/* PART 6.3: Real-Time Telemetry Trend Chart & Time Range Selector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>Real-Time Multi-Parameter Sensor Telemetry</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Synchronized downhole sensor stream (Phoenix RTD &amp; Triaxial Gauge).
                  </p>
                </div>

                {/* Time Range Selector */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
                  {(['15m', '1h', '6h', '12h', '24h'] as const).map(tr => (
                    <button
                      key={tr}
                      onClick={() => setChartTimeRange(tr)}
                      className={`px-2.5 py-1 rounded transition-colors ${
                        chartTimeRange === tr
                          ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={telemetry} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} domain={['dataMin - 50', 'dataMax + 50']} />
                    <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 10 }} domain={[40, 70]} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} 
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="intakePressure" name="Intake P (psi)" stroke="#06b6d4" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="left" type="monotone" dataKey="dischargePressure" name="Discharge P (psi)" stroke="#3b82f6" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="motorCurrent" name="Current (A)" stroke="#f59e0b" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="right" type="monotone" dataKey="frequency" name="VFD (Hz)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* VFD Speed Optimization Control Bar */}
              <div className="mt-4 pt-3 border-t border-slate-800 bg-slate-950/70 rounded-lg p-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>VFD Speed Optimization Setpoint</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Adjust motor drive frequency to regulate fluid drawdown and dynamic level.
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setVfdTrimHz(prev => Math.max(45, Math.round((prev - 0.5) * 10) / 10))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <div className="px-3 py-1 rounded bg-slate-900 border border-slate-700 font-mono text-sm font-bold text-cyan-400 tabular-nums">
                        {vfdTrimHz.toFixed(1)} Hz
                      </div>
                      <button
                        onClick={() => setVfdTrimHz(prev => Math.min(65, Math.round((prev + 0.5) * 10) / 10))}
                        className="w-7 h-7 rounded bg-slate-800 hover:bg-slate-700 text-white font-mono text-xs flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={handleApplyVfdTrim}
                      className="px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
                    >
                      Apply Trim
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Downhole ESP Assembly Schematic (4 cols) */}
            <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
                  <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Downhole ESP Assembly</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Depth: {selectedWell.totalDepthFt.toLocaleString()} ft
                  </span>
                </div>

                <div className="space-y-2 py-1 text-xs">
                  <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-200 text-xs">Surface Wellhead & Tree</div>
                      <div className="text-[10px] text-slate-400">Flowline Temp: {selectedWell.wellheadTempF}°F</div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">Surface</span>
                  </div>

                  <div className="text-center font-mono text-[10px] text-slate-600 py-0.5">
                    ↓ 2-7/8" L-80 Production Tubing String ↓
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-blue-900/40 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-blue-300 text-xs">Discharge Head & Check Valve</div>
                      <div className="text-[10px] text-slate-400">Head: {selectedWell.dischargePressurePsi} psi</div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400">11,210 ft</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-cyan-800/50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-cyan-300 text-xs">Centrifugal Pump (182 Stages)</div>
                      <div className="text-[10px] text-slate-400">Ni-Resist Radial Impellers</div>
                    </div>
                    <span className="text-[10px] font-mono text-cyan-400">{vfdTrimHz.toFixed(1)} Hz</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-amber-900/50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-amber-300 text-xs">Submersible Motor (240 HP)</div>
                      <div className="text-[10px] text-slate-400">3,850 V · {selectedWell.motorCurrentA} A · {selectedWell.motorTempF}°F</div>
                    </div>
                    <span className="text-[10px] font-mono text-amber-400">240 HP</span>
                  </div>

                  <div className="p-2 rounded bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-emerald-300 text-xs">Phoenix Downhole Gauge Pod</div>
                      <div className="text-[10px] text-slate-400">P_intake, P_discharge, Temp, Vib</div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">Connected</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Assembly Run Life:</span>
                <span className="font-mono text-white font-semibold">{selectedWell.runLifeDays} Days On-Bottom</span>
              </div>
            </div>
          </div>

          {/* PART 6.4 & 6.5: Asset-Specific Alarm Table & Event History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Asset-Specific Alarms */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Asset Alarms ({wellAlarms.length})
                  </h4>
                </div>
                <button
                  onClick={() => onNavigateToRoute('alarms-user')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View in Alarm Center →
                </button>
              </div>

              <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                {wellAlarms.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active unresolved alarms for this asset. Operating within safe limits.
                  </div>
                ) : (
                  wellAlarms.map(alarm => (
                    <div key={alarm.id} className="p-3 hover:bg-slate-800/40 transition-colors text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-rose-400 font-bold">{alarm.id}</span>
                        <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800">
                          {alarm.severity}
                        </span>
                      </div>
                      <div className="font-semibold text-white">{alarm.title}</div>
                      <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono pt-1">
                        <span>Current: <strong className="text-white">{alarm.currentValue}</strong></span>
                        <button
                          onClick={() => handleAcknowledgeAlarm(alarm.id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-sans text-[10px]"
                        >
                          Acknowledge
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Asset-Specific Event History (PART 6.5) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Operational Event Log
                  </h4>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Autonomous & Manual</span>
              </div>

              <div className="divide-y divide-slate-800 max-h-60 overflow-y-auto">
                {wellEvents.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 space-y-2">
                    <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                      <div className="font-semibold text-white">VFD Frequency Trim Applied</div>
                      <div className="text-slate-400 text-[10px] font-mono mt-0.5">2026-10-28 06:05 UTC · System Operator</div>
                      <p className="text-slate-300 mt-1">Speed adjusted to {vfdTrimHz} Hz to regulate dynamic fluid level.</p>
                    </div>
                    <div className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-[11px]">
                      <div className="font-semibold text-white">Periodic Telemetry Handshake</div>
                      <div className="text-slate-400 text-[10px] font-mono mt-0.5">2026-10-28 05:00 UTC · Phoenix RTU</div>
                      <p className="text-slate-300 mt-1">Downhole gauge registers synchronized with zero packet loss.</p>
                    </div>
                  </div>
                ) : (
                  wellEvents.map(evt => (
                    <div key={evt.id} className="p-3 hover:bg-slate-800/40 transition-colors text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span className="text-cyan-400 font-bold">{evt.eventType}</span>
                        <span className="text-slate-500">{evt.timestamp}</span>
                      </div>
                      <p className="text-slate-200">{evt.description}</p>
                      <div className="text-[10px] text-slate-500">Authorized: {evt.user}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* CASE 2: ALL ASSETS FLEET OPERATIONAL VIEW (PART 6.6 & 7) */
        /* ======================================================== */
        <div className="space-y-6">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setAllAssetsTab('fleet-overview')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  allAssetsTab === 'fleet-overview'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Assets Operational Fleet</span>
              </button>

              <button
                onClick={() => setAllAssetsTab('wells-down-24h')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  allAssetsTab === 'wells-down-24h'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Wells Down (24H)</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">13 Down</span>
              </button>

              <button
                onClick={() => setAllAssetsTab('summary-24h')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
                  allAssetsTab === 'summary-24h'
                    ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>24-Hour Operational Summary</span>
              </button>
            </div>

            <span className="text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg">
              Fleet Units: <strong className="text-white">{wellsList.length} Wells</strong>
            </span>
          </div>

          {allAssetsTab === 'fleet-overview' && (
            <>
              {/* 10 Control-Room KPI Cards (PART B) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {/* 1. Total Monitored Wells */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Total Monitored</span>
                    <Layers className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-white">{wellsList.length}</span>
                    <span className="text-[10px] text-cyan-400 font-mono block mt-0.5">Permian & Eagle Ford</span>
                  </div>
                </div>

                {/* 2. Running Wells */}
                <div className="bg-slate-900 border border-emerald-900/60 bg-emerald-950/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-emerald-300">
                    <span className="font-medium">Running Wells</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-emerald-400">18</span>
                    <span className="text-[10px] text-emerald-300/80 font-mono block mt-0.5">Online Nominal</span>
                  </div>
                </div>

                {/* 3. Wells Down */}
                <div className="bg-slate-900 border border-rose-900/60 bg-rose-950/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-rose-300">
                    <span className="font-medium">Wells Down</span>
                    <XCircle className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-rose-400">0</span>
                    <span className="text-[10px] text-rose-300/80 font-mono block mt-0.5">Active Trips (Zero)</span>
                  </div>
                </div>

                {/* 4. Cycling Wells */}
                <div className="bg-slate-900 border border-blue-900/60 bg-blue-950/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-blue-300">
                    <span className="font-medium">Cycling Wells</span>
                    <RotateCw className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-blue-400">2</span>
                    <span className="text-[10px] text-blue-300/80 font-mono block mt-0.5">Intermittent / POC</span>
                  </div>
                </div>

                {/* 5. Wells with No Communication */}
                <div className="bg-slate-900 border border-amber-900/60 bg-amber-950/20 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-amber-300">
                    <span className="font-medium">No Comm</span>
                    <Radio className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-amber-400">1</span>
                    <span className="text-[10px] text-amber-300/80 font-mono block mt-0.5">Telemetry Offline</span>
                  </div>
                </div>

                {/* 6. Total Production in BPD */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Total Production</span>
                    <Flame className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-cyan-300">14,320</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">BPD Gross Fluid</span>
                  </div>
                </div>

                {/* 7. Active Alarms */}
                <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-rose-300">
                    <span className="font-medium">Active Alarms</span>
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-rose-400">3</span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Unacknowledged Trips</span>
                  </div>
                </div>

                {/* 8. Total Power Consumption */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Total Power</span>
                    <Zap className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-white">2,840 <span className="text-xs text-slate-400">kW</span></span>
                    <span className="text-[10px] text-slate-400 font-mono block mt-0.5">Grid & Gen Demand</span>
                  </div>
                </div>

                {/* 9. Average ESP Health */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">Avg ESP Health</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-emerald-400">88.4%</span>
                    <span className="text-[10px] text-emerald-300/80 font-mono block mt-0.5">Reliability Index</span>
                  </div>
                </div>

                {/* 10. 24-Hour Operational Summary */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-medium">24H Summary</span>
                    <Clock className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="mt-2">
                    <span className="text-2xl font-extrabold font-mono text-cyan-400">98.2%</span>
                    <span className="text-[10px] text-cyan-300/80 font-mono block mt-0.5">Uptime Availability</span>
                  </div>
                </div>
              </div>

              {/* Dedicated Wells Down Panel & Action Center (PART B) */}
              <div className="bg-slate-900 border border-rose-900/40 rounded-xl p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                        <span>Wells Down Panel & Field Intervention Queue</span>
                        <span className="text-[10px] text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800 font-mono normal-case">
                          3 Priority Interventions
                        </span>
                      </h3>
                      <p className="text-[11px] text-slate-400">Shutdown reasons, last operating times, active trip alarms, and assigned response crews.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAllAssetsTab('wells-down-24h')}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                    >
                      <span>Full 13 Incident Register</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      well: 'DEMO-WELL-001',
                      pad: 'Phantom State Pad Bravo',
                      reason: 'Drive stopped. Backspin Waiting (25 min remaining)',
                      lastOp: 'Today 05:00 UTC',
                      alarm: 'ALM-TRIP-01: Reverse Rotation Protective Lockout',
                      team: 'Permian Lift Surveillance Crew #2',
                    },
                    {
                      well: 'DEMO-WELL-002',
                      pad: 'Red River Federal Pad 4',
                      reason: 'Drive faulted. Reason: Fault, High Wellhead Temp (242°F)',
                      lastOp: 'Yesterday 12:21 UTC',
                      alarm: 'ALM-TRIP-02: Flowline Thermal Excursion',
                      team: 'Electrical Automation Team B',
                    },
                    {
                      well: 'DEMO-WELL-003',
                      pad: 'Clearfork Unit Pad 8',
                      reason: 'Drive faulted. Reason: External Emergency ESD Interlock',
                      lastOp: 'Yesterday 06:30 UTC',
                      alarm: 'ALM-TRIP-03: Facility ESD Loop Opened',
                      team: 'Wellhead Services Squad Alpha',
                    },
                  ].map(item => (
                    <div key={item.well} className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between space-y-2">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-xs text-cyan-300">{item.well}</span>
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            TRIPPED
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-medium mt-0.5">{item.pad}</div>
                        <div className="text-[10px] text-rose-300/90 font-mono mt-1">
                          Reason: {item.reason}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Last Op: <strong className="text-slate-300">{item.lastOp}</strong>
                        </div>
                        <div className="text-[10px] text-amber-300/80 font-mono mt-0.5">
                          Alarm: {item.alarm}
                        </div>
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                          Team: {item.team}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => handleDispatchCrew(item.well, item.team)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                            dispatchedCrews[item.well]
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                          }`}
                        >
                          {dispatchedCrews[item.well] || 'Dispatch Crew'}
                        </button>
                        <button
                          onClick={() => handleAcknowledgeWellTrip(item.well)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                            acknowledgedTrips[item.well]
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                              : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
                          }`}
                        >
                          {acknowledgedTrips[item.well] ? 'Trip Acked' : 'Ack Trip'}
                        </button>
                        <button
                          onClick={() => handleInitiateRestart(item.well)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                            restartedWells[item.well]
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                              : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          }`}
                        >
                          {restartedWells[item.well] ? 'Ramping...' : 'Restart'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fleet Production Trend Chart & Status Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span>Fleet Production Volume Trend (Last 7 Days)</span>
                      </h4>
                      <p className="text-xs text-slate-400">Total crude production across ESP, Rod Pump, PCP, and Gas Lift pad assets.</p>
                    </div>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={FLEET_PRODUCTION_TREND} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', fontSize: '11px', fontFamily: 'monospace' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="espBopd" name="ESP Production (BPD)" fill="#06b6d4" />
                        <Bar dataKey="rodPumpBopd" name="Rod Pump (BPD)" fill="#3b82f6" />
                        <Bar dataKey="gasLiftBopd" name="Gas Lift (BPD)" fill="#10b981" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Status Distribution Donut / Progress Breakdown */}
                <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Radio className="w-4 h-4 text-cyan-400" />
                      <span>Operational Status Distribution</span>
                    </h4>

                    <div className="space-y-4 py-2">
                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-emerald-400">Running Nominally</span>
                          <span className="text-white font-bold">{runningCount} / {wellsList.length}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(runningCount / wellsList.length) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-rose-400">Offline / Down</span>
                          <span className="text-white font-bold">{downCount} / {wellsList.length}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${(downCount / wellsList.length) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-mono mb-1">
                          <span className="text-amber-400">Warning / Tripped</span>
                          <span className="text-white font-bold">{warningCount} / {wellsList.length}</span>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(warningCount / wellsList.length) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Overall Fleet Uptime:</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {Math.round((runningCount / wellsList.length) * 100)}% Nominal
                    </span>
                  </div>
                </div>
              </div>

              {/* Complete Interactive All Assets Table (PART 8) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="relative w-full max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={tableSearchTerm}
                      onChange={(e) => setTableSearchTerm(e.target.value)}
                      placeholder="Search short name, pad, or formation..."
                      className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                    />
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    {(['ALL', 'RUNNING', 'DOWN', 'WARNING'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setStatusFilter(f)}
                        className={`px-3 py-1 rounded transition-colors ${
                          statusFilter === f 
                            ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40' 
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Asset Short Name</th>
                        <th className="px-4 py-3">Full Well Name</th>
                        <th className="px-4 py-3">Basin & Pad</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Production (BPD)</th>
                        <th className="px-4 py-3 text-right">PIP (psi)</th>
                        <th className="px-4 py-3 text-right">Motor Temp</th>
                        <th className="px-4 py-3 text-center">Health</th>
                        <th className="px-4 py-3 text-right">Cockpit Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                      {filteredWells.map(well => {
                        const isRunning = well.status === 'Nominal' || well.status === 'Testing';
                        const isDown = well.status === 'Offline' || well.status === 'Critical';
                        const isWarn = well.status === 'Warning';
                        const shortName = well.wellCode || well.id;

                        return (
                          <tr key={well.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="px-4 py-3 font-bold text-cyan-300 font-mono">
                              {shortName}
                            </td>
                            <td className="px-4 py-3 font-sans font-semibold text-white">
                              {well.name}
                            </td>
                            <td className="px-4 py-3 font-sans text-slate-400">
                              <div>{well.basin}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{well.padName}</div>
                            </td>
                            <td className="px-4 py-3">
                              {isRunning && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>Running</span>
                                </span>
                              )}
                              {isDown && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-rose-950/70 text-rose-300 border border-rose-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <span>Down</span>
                                </span>
                              )}
                              {isWarn && (
                                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-amber-950/70 text-amber-300 border border-amber-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                                  <span>Warning</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-white">
                              {well.currentBopd > 0 ? `${well.currentBopd} BPD` : '0'}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-300">
                              {well.intakePressurePsi} psi
                            </td>
                            <td className="px-4 py-3 text-right text-slate-300">
                              {well.motorTempF}°F
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="font-bold text-cyan-400">{well.healthScore}%</span>
                            </td>
                            <td className="px-4 py-3 text-right font-sans">
                              <button
                                onClick={() => handleSelectAsset(well.id)}
                                className="px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
                              >
                                View Cockpit →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Slide 25 Wells Down within 24 Hrs */}
          {allAssetsTab === 'wells-down-24h' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                    Wells Down within 24 Hrs.
                  </h3>
                  <p className="text-xs text-slate-400">Direct downhole trips, VFD fault reasons, and historical shutdown timestamps.</p>
                </div>
                <span className="text-xs font-mono text-rose-400 font-semibold">13 Recorded Incidents</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-3 py-2.5">Well Short Name</th>
                      <th className="px-3 py-2.5 text-center">Status</th>
                      <th className="px-3 py-2.5">Shutdown Cause</th>
                      <th className="px-3 py-2.5 font-mono">Last Op. Time</th>
                      <th className="px-3 py-2.5">Active Alarm / Trip Condition</th>
                      <th className="px-3 py-2.5">Assigned Responsible Team</th>
                      <th className="px-3 py-2.5 text-center">Quick Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                    {WELLS_DOWN_24H_DATA.map((row, idx) => {
                      const teams = [
                        'Permian Lift Surveillance Crew #2',
                        'Electrical Automation Team B',
                        'Wellhead Services Squad Alpha',
                        'Delaware Field Response Team 1',
                        'Eagle Ford Rig Crew 4',
                        'Midland Automation Support',
                        'Permian ESP Field Services',
                        'Delaware Chemical Unit 3',
                        'Pecos Workover Rig 14',
                        'Mobile Instrumentation Van 08',
                        'Wireline Truck Crew 204',
                        'Field Electrical Team #1',
                        'Pecos Facility Automation Crew'
                      ];
                      const alarms = [
                        'ALM-TRIP-01: Backspin Timer Active (25m)',
                        'ALM-TRIP-02: High Wellhead Temperature (242°F)',
                        'ALM-TRIP-03: External ESD Interlock Trip',
                        'ALM-TRIP-04: Drive Not Ready / Precharge Fault',
                        'ALM-TRIP-05: Manual Choke Relief Isolation',
                        'ALM-TRIP-06: Downhole Phase Loss Fault',
                        'ALM-TRIP-07: Underload Trip / Gas Lock',
                        'ALM-TRIP-08: High Vibration Protective Cutoff',
                        'ALM-TRIP-09: Overcurrent / Stalled Rotor',
                        'ALM-TRIP-10: Low Intake Pressure Limit Trip',
                        'ALM-TRIP-11: VFD Heat Sink Thermal Trip',
                        'ALM-TRIP-12: Surface RTU Telemetry Timeout',
                        'ALM-TRIP-13: Transformer Secondary Sag'
                      ];
                      const team = teams[idx % teams.length];
                      const alarm = alarms[idx % alarms.length];

                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-3 py-2.5 font-sans font-bold text-cyan-300">
                            <div>{row.well}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{row.manufacturer} · {row.opMode}</div>
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              {row.status}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-rose-300 font-sans max-w-xs" title={row.shutdownCause}>
                            <div className="font-medium text-xs text-rose-200">{row.shutdownCause}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">PIP: {row.pipPsi} psi · Freq: {row.freqHz} Hz</div>
                          </td>
                          <td className="px-3 py-2.5 text-slate-300 text-[11px] whitespace-nowrap font-mono">{row.shutdownTime}</td>
                          <td className="px-3 py-2.5 font-mono text-[11px] text-amber-300">
                            {alarm}
                          </td>
                          <td className="px-3 py-2.5 text-cyan-300 font-sans text-xs">
                            <div className="font-medium">{team}</div>
                            {dispatchedCrews[row.well] && (
                              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                ✓ {dispatchedCrews[row.well]}
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <div className="flex items-center justify-center gap-1.5 font-sans">
                              <button
                                onClick={() => handleDispatchCrew(row.well, team)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                                  dispatchedCrews[row.well]
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                    : 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700'
                                }`}
                                title="Dispatch field crew to well location"
                              >
                                {dispatchedCrews[row.well] ? 'Dispatched' : 'Dispatch'}
                              </button>
                              <button
                                onClick={() => handleAcknowledgeWellTrip(row.well)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                                  acknowledgedTrips[row.well]
                                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                                    : 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-slate-700'
                                }`}
                                title="Acknowledge trip and arm reset"
                              >
                                {acknowledgedTrips[row.well] ? 'Acked' : 'Ack'}
                              </button>
                              <button
                                onClick={() => handleInitiateRestart(row.well)}
                                className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${
                                  restartedWells[row.well]
                                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                                    : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                                }`}
                                title="Initiate VFD soft start ramp"
                              >
                                {restartedWells[row.well] ? 'Ramping' : 'Restart'}
                              </button>
                              <button
                                onClick={() => handleSelectAsset(row.well)}
                                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                                title="Open asset cockpit"
                              >
                                Diagnose
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slide 26 24-Hour Status Summary */}
          {allAssetsTab === 'summary-24h' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Wells with Alerts &amp; 24-Hour Cycle Activity
                  </h3>
                  <p className="text-xs text-slate-400">Detailed cycle counts, downtime accumulation, and run-life telemetry.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Well Short Name</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Runlife (days)</th>
                      <th className="px-4 py-2.5 text-right">Freq. (Hz)</th>
                      <th className="px-4 py-2.5">Operation Mode</th>
                      <th className="px-4 py-2.5 text-right">Motor Current (A)</th>
                      <th className="px-4 py-2.5 text-right">Motor Temp. (°F)</th>
                      <th className="px-4 py-2.5">Last Shutdown</th>
                      <th className="px-4 py-2.5 text-center">Cycle times</th>
                      <th className="px-4 py-2.5 text-right">Downtime (hrs)</th>
                      <th className="px-4 py-2.5 font-mono">Last Communication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-slate-200">
                    {STATUS_SUMMARY_24H_DATA.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-sans font-bold text-cyan-300">{row.well}</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === 'RUNNING' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}>
                            {row.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-white font-bold">{row.runlifeDays}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{row.freqHz}</td>
                        <td className="px-4 py-2.5 text-slate-300">{row.operationMode}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{row.motorCurrentA}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{row.motorTempF}</td>
                        <td className="px-4 py-2.5 text-amber-300 font-sans">{row.lastShutdown}</td>
                        <td className="px-4 py-2.5 text-center text-slate-300">{row.cycleTimes}</td>
                        <td className="px-4 py-2.5 text-right text-slate-300">{row.downtimeHrs}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-[11px]">{row.lastComm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
