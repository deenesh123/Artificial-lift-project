import React, { useState, useMemo, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Flame, 
  Gauge, 
  Zap, 
  Thermometer, 
  Radio, 
  Sliders, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  RotateCw, 
  RefreshCw, 
  ChevronRight, 
  Eye, 
  TrendingUp, 
  AlertCircle,
  LayoutGrid,
  Table as TableIcon,
  X
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { WellAsset, WellStatus, AlarmItem } from '../../types';
import { DEMO_ALARMS, TELEMETRY_HISTORY } from '../../data/mockData';
import { StorageService } from '../../services/storageService';

interface UserAssetMonitoringViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (assetId: string | null) => void;
  onNavigateToRoute?: (routeId: string) => void;
}

export const UserAssetMonitoringView: React.FC<UserAssetMonitoringViewProps> = ({
  selectedAssetId,
  onSelectAssetId,
  onNavigateToRoute,
}) => {
  const [wells, setWells] = useState<WellAsset[]>(() => StorageService.getWells());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'DOWN' | 'WARNING'>('ALL');
  const [viewMode, setViewMode] = useState<'split' | 'grid' | 'table'>('split');
  const [vfdTrimHz, setVfdTrimHz] = useState<number>(58.5);
  const [isSimulating, setIsSimulating] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleStorage = () => {
      setWells(StorageService.getWells());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Split into running, down, warning
  const { runningWells, downWells, warningWells, totalBopd } = useMemo(() => {
    const running: WellAsset[] = [];
    const down: WellAsset[] = [];
    const warning: WellAsset[] = [];
    let bopdSum = 0;

    wells.forEach(w => {
      bopdSum += w.currentBopd || 0;
      if (w.status === 'Offline' || w.status === 'Critical') {
        down.push(w);
      } else if (w.status === 'Warning') {
        warning.push(w);
      } else {
        running.push(w);
      }
    });

    return { runningWells: running, downWells: down, warningWells: warning, totalBopd: bopdSum };
  }, [wells]);

  // Filtered wells based on search and status tabs
  const filteredWells = useMemo(() => {
    return wells.filter(well => {
      // Status filter
      if (statusFilter === 'RUNNING' && (well.status === 'Offline' || well.status === 'Critical' || well.status === 'Warning')) {
        return false;
      }
      if (statusFilter === 'DOWN' && well.status !== 'Offline' && well.status !== 'Critical') {
        return false;
      }
      if (statusFilter === 'WARNING' && well.status !== 'Warning') {
        return false;
      }

      // Search filter
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      const shortName = (well.wellCode || well.id).toLowerCase();
      const longName = well.name.toLowerCase();
      const id = well.id.toLowerCase();
      const pad = well.padName?.toLowerCase() || '';
      const basin = well.basin.toLowerCase();
      return shortName.includes(term) || longName.includes(term) || id.includes(term) || pad.includes(term) || basin.includes(term);
    });
  }, [wells, statusFilter, searchTerm]);

  // Determine active well
  const activeWell = useMemo(() => {
    if (selectedAssetId) {
      return wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId) || wells[0] || null;
    }
    return wells[0] || null;
  }, [wells, selectedAssetId]);

  // Helper for shutdown details
  const getDownInfo = (well: WellAsset) => {
    if (well.id === 'ALS-DEL-ESP-099') {
      return { reason: 'Electrical / Insulation Breakdown', downtime: 'Down: 2h 45m', tripCode: 'TRIP-E04' };
    }
    if (well.id === 'ALS-EF-ROD-019') {
      return { reason: 'Severe Fluid Pound Lockout', downtime: 'Down: 1h 20m', tripCode: 'PUMP-OFF' };
    }
    if (well.status === 'Critical') {
      return { reason: 'Drive Fault / Auto Safe Trip', downtime: 'Down: 4h 10m', tripCode: 'VFD-OVLT' };
    }
    return { reason: 'Scheduled Workover / Offline', downtime: 'Down: 3h 15m', tripCode: 'OFFLINE' };
  };

  const showNotice = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSelectWell = (well: WellAsset) => {
    if (onSelectAssetId) {
      onSelectAssetId(well.id);
    }
    showNotice(`Focused telemetry on asset ${well.wellCode || well.id} (${well.name})`);
  };

  const handleClearSelection = () => {
    if (onSelectAssetId) {
      onSelectAssetId(null);
    }
    showNotice('Returned to All Monitored Assets Overview');
  };

  // Generate synthetic trend data corresponding to active asset
  const trendData = useMemo(() => {
    if (!activeWell) return TELEMETRY_HISTORY;
    const basePip = activeWell.intakePressurePsi || 850;
    const baseTemp = activeWell.motorTempF || 195;
    const baseCurrent = activeWell.motorCurrentA || 52;
    const basePower = activeWell.powerKw || 180;

    return TELEMETRY_HISTORY.map((pt, i) => {
      const variation = Math.sin(i * 0.4) * 25;
      return {
        ...pt,
        intakePressurePsi: Math.round(basePip + variation),
        motorTempF: Math.round((baseTemp + variation * 0.2) * 10) / 10,
        motorCurrentA: Math.round((baseCurrent + variation * 0.1) * 10) / 10,
        powerKw: Math.round(basePower + variation * 0.5),
      };
    });
  }, [activeWell]);

  // Alarms for active well
  const activeWellAlarms = useMemo(() => {
    if (!activeWell) return [];
    return DEMO_ALARMS.filter(a => a.wellId === activeWell.id);
  }, [activeWell]);

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-[1600px] mx-auto select-none">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-28 right-8 z-50 bg-slate-900 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TOP KPI CONTROL ROOM STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Assets */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Monitored Assets</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">{wells.length}</span>
            <span className="text-[10px] text-slate-400">Pads: 4</span>
          </div>
          <div className="mt-1 text-[10px] text-cyan-400 font-mono">100% Modbus Polled</div>
        </div>

        {/* Running Assets */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'RUNNING' ? 'ALL' : 'RUNNING')}
          className={`bg-slate-900/90 border rounded-xl p-3.5 flex flex-col justify-between shadow-sm cursor-pointer transition-all ${
            statusFilter === 'RUNNING' ? 'border-emerald-500 bg-emerald-950/20 shadow-emerald-950/40' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-emerald-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Running (Normal)</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-300">{runningWells.length}</span>
            <span className="text-[10px] text-slate-400">
              {wells.length > 0 ? `${Math.round((runningWells.length / wells.length) * 100)}% uptime` : ''}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 font-mono">Telemetry Nominal</div>
        </div>

        {/* Down Assets */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'DOWN' ? 'ALL' : 'DOWN')}
          className={`bg-slate-900/90 border rounded-xl p-3.5 flex flex-col justify-between shadow-sm cursor-pointer transition-all ${
            statusFilter === 'DOWN' ? 'border-rose-500 bg-rose-950/20 shadow-rose-950/40' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-rose-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Down / Offline</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-300">{downWells.length}</span>
            <span className="text-[10px] text-rose-400 font-mono">Needs RTOC</span>
          </div>
          <div className="mt-1 text-[10px] text-rose-400/80 font-mono truncate">
            {downWells[0] ? `Trip: ${downWells[0].wellCode || downWells[0].id}` : 'None down'}
          </div>
        </div>

        {/* Warning Assets */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING')}
          className={`bg-slate-900/90 border rounded-xl p-3.5 flex flex-col justify-between shadow-sm cursor-pointer transition-all ${
            statusFilter === 'WARNING' ? 'border-amber-500 bg-amber-950/20 shadow-amber-950/40' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-amber-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Warning</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-300">{warningWells.length}</span>
            <span className="text-[10px] text-slate-400">Threshold Trip</span>
          </div>
          <div className="mt-1 text-[10px] text-amber-400 font-mono">Surveillance Watch</div>
        </div>

        {/* Fleet Production */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Total Basin Oil</span>
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-cyan-300">{totalBopd.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400">BOPD</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <ArrowUp className="w-3 h-3" />
            <span>+3.2% vs target</span>
          </div>
        </div>

        {/* Average Frequency & Health */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold uppercase tracking-wider text-[10px] font-mono">Fleet Lift Avg</span>
            <Gauge className="w-4 h-4 text-teal-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-white">57.4</span>
            <span className="text-[10px] text-slate-400">Hz Avg</span>
          </div>
          <div className="mt-1 text-[10px] text-teal-300 font-mono">Health: 91.8%</div>
        </div>
      </div>

      {/* SEARCH, STATUS TABS & VIEW TOGGLES */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search short name, well name, ID, pad..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs self-stretch md:self-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded font-medium transition-colors ${
              statusFilter === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({wells.length})
          </button>
          <button
            onClick={() => setStatusFilter('RUNNING')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              statusFilter === 'RUNNING' ? 'bg-emerald-950 text-emerald-300 font-semibold border border-emerald-800' : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Running ({runningWells.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('DOWN')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              statusFilter === 'DOWN' ? 'bg-rose-950 text-rose-300 font-semibold border border-rose-800' : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Down ({downWells.length})</span>
          </button>
          <button
            onClick={() => setStatusFilter('WARNING')}
            className={`px-3 py-1 rounded font-medium flex items-center gap-1.5 transition-colors ${
              statusFilter === 'WARNING' ? 'bg-amber-950 text-amber-300 font-semibold border border-amber-800' : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Warning ({warningWells.length})</span>
          </button>
        </div>

        {/* Layout Modes */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          {selectedAssetId && (
            <button
              onClick={handleClearSelection}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Focus</span>
            </button>
          )}

          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'split' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Split Master-Detail View"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'table' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Full Tabular Registry View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MAIN VIEW CONTENT: SPLIT OR TABLE */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: RUNNING & DOWN ASSETS LIST (5 COLS) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col max-h-[820px]">
            <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Asset Telemetry Register
                </span>
                <span className="text-[11px] text-cyan-400 font-mono">({filteredWells.length} Wells)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Select card to view details</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/80 p-2 space-y-2">
              {filteredWells.length > 0 ? (
                filteredWells.map((well) => {
                  const isSelected = activeWell?.id === well.id;
                  const isDown = well.status === 'Offline' || well.status === 'Critical';
                  const isWarning = well.status === 'Warning';
                  const downInfo = isDown ? getDownInfo(well) : null;

                  return (
                    <div
                      key={well.id}
                      onClick={() => handleSelectWell(well)}
                      className={`p-3 rounded-lg border transition-all cursor-pointer space-y-2.5 ${
                        isSelected
                          ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950/60'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-850/50'
                      }`}
                    >
                      {/* Top Header of Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-cyan-300">
                              {well.wellCode || well.id}
                            </span>
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                              well.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                              well.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                              well.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {well.status}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {well.liftType}
                            </span>
                          </div>
                          <div className="text-xs font-semibold text-white mt-0.5 font-sans">
                            {well.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Pad: {well.padName || 'Pad-01'} · Basin: {well.basin}
                          </div>
                        </div>

                        {/* Oil Rate Badge */}
                        <div className="text-right shrink-0">
                          <div className="text-sm font-bold font-mono text-emerald-400">
                            {well.currentBopd} <span className="text-[10px] text-slate-400 font-sans">BOPD</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Target: {well.targetBopd}
                          </div>
                        </div>
                      </div>

                      {/* If Down, display downtime and trip reason */}
                      {isDown && downInfo && (
                        <div className="p-2 rounded bg-rose-950/40 border border-rose-900/60 text-xs font-mono text-rose-300 flex items-center justify-between">
                          <span className="truncate">{downInfo.reason}</span>
                          <span className="text-rose-400 font-bold ml-2 shrink-0">{downInfo.downtime}</span>
                        </div>
                      )}

                      {/* Real-time Telemetry Envelope Badges */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 text-[10px] font-mono bg-slate-900 p-2 rounded border border-slate-800 text-slate-300">
                        <div>
                          <span className="text-slate-500 block text-[9px]">PIP</span>
                          <span className="font-semibold text-cyan-300">{well.intakePressurePsi} psi</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">PDP</span>
                          <span className="font-semibold text-slate-200">{well.dischargePressurePsi} psi</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Motor °F</span>
                          <span className={`font-semibold ${well.motorTempF > 215 ? 'text-rose-400' : 'text-slate-200'}`}>
                            {well.motorTempF}°F
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Speed</span>
                          <span className="font-semibold text-cyan-400">{well.vfdFrequencyHz} Hz</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Vibration</span>
                          <span className="font-semibold text-slate-200">{well.vibrationG}g</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[9px]">Health</span>
                          <span className="font-semibold text-emerald-400">{well.healthScore}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1">
                        <span>Updated: {well.updatedAt ? new Date(well.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Live (1s)'}</span>
                        <span className="text-cyan-400 hover:underline flex items-center gap-1 font-sans">
                          <span>{isSelected ? 'Viewing Telemetry' : 'Inspect Telemetry'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 font-sans">
                  No monitored assets found matching your search and status criteria.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: SELECTED ASSET TELEMETRY & LIVE CHARTS (7 COLS) */}
          <div className="lg:col-span-7 space-y-4">
            {activeWell ? (
              <>
                {/* Active Asset Banner */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold font-mono text-cyan-300">
                          {activeWell.wellCode || activeWell.id}
                        </span>
                        <span className="text-lg font-bold text-white font-sans">
                          — {activeWell.name}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-medium ${
                          activeWell.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          activeWell.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          activeWell.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {activeWell.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>ID: <strong className="text-white">{activeWell.id}</strong></span>
                        <span>·</span>
                        <span>Pad: <strong className="text-white">{activeWell.padName}</strong></span>
                        <span>·</span>
                        <span>Lift: <strong className="text-cyan-400">{activeWell.liftType}</strong></span>
                        <span>·</span>
                        <span>Depth: <strong className="text-white">{activeWell.totalDepthFt?.toLocaleString()} ft</strong></span>
                        <span>·</span>
                        <span>Run Life: <strong className="text-emerald-400">{activeWell.runLifeDays} Days</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {onNavigateToRoute && (
                        <button
                          onClick={() => onNavigateToRoute('operations')}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md transition-colors"
                        >
                          <Activity className="w-3.5 h-3.5" />
                          <span>Operations Dashboard</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Synthetic Telemetry Snapshot Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px] font-sans">Current Oil Production</span>
                      <span className="text-emerald-400 font-bold text-base">{activeWell.currentBopd} BOPD</span>
                      <span className="text-slate-500 text-[10px] block">Target: {activeWell.targetBopd} BOPD</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px] font-sans">Gross Fluid & Cut</span>
                      <span className="text-cyan-300 font-bold text-base">{activeWell.grossFluidBpd} BFPD</span>
                      <span className="text-slate-400 text-[10px] block">Water Cut: {activeWell.waterCutPct}%</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px] font-sans">Intake & Discharge</span>
                      <span className="text-cyan-400 font-bold text-base">
                        {activeWell.intakePressurePsi} / {activeWell.dischargePressurePsi}
                      </span>
                      <span className="text-slate-400 text-[10px] block">psi (diff: +{activeWell.dischargePressurePsi - activeWell.intakePressurePsi})</span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-slate-500 block text-[10px] font-sans">Motor Temp & Vib</span>
                      <span className={`font-bold text-base ${activeWell.motorTempF > 215 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {activeWell.motorTempF} °F
                      </span>
                      <span className="text-slate-400 text-[10px] block">Vibration: {activeWell.vibrationG}g</span>
                    </div>
                  </div>

                  {/* VFD Frequency Trim Control */}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded bg-cyan-950/60 border border-cyan-800 text-cyan-300">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white font-sans">
                          VFD Operating Frequency Trim
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Current Setting: <strong className="text-cyan-400">{vfdTrimHz.toFixed(1)} Hz</strong> (Nominal Range: 35.0 - 65.0 Hz)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-64">
                      <input
                        type="range"
                        min="35.0"
                        max="65.0"
                        step="0.5"
                        value={vfdTrimHz}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVfdTrimHz(val);
                          showNotice(`Trimmed ${activeWell.wellCode || activeWell.id} frequency to ${val.toFixed(1)} Hz`);
                        }}
                        className="w-full accent-cyan-500 bg-slate-800 rounded h-1.5 cursor-pointer"
                      />
                      <span className="font-mono text-xs font-bold text-cyan-300 shrink-0">{vfdTrimHz.toFixed(1)} Hz</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Telemetry Trend Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span>Live Telemetry Trend Stream — {activeWell.wellCode || activeWell.id}</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Downhole Intake Pressure (PIP) vs Motor Temperature (°F) vs Motor Current (A)
                      </p>
                    </div>

                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>1s Polling Rate</span>
                    </div>
                  </div>

                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="timestamp" stroke="#64748b" tick={{ fontSize: 10 }} />
                        <YAxis yAxisId="left" stroke="#38bdf8" tick={{ fontSize: 10 }} domain={['dataMin - 50', 'dataMax + 50']} />
                        <YAxis yAxisId="right" orientation="right" stroke="#f43f5e" tick={{ fontSize: 10 }} domain={['dataMin - 10', 'dataMax + 10']} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#090e17', borderColor: '#334155', fontSize: '11px', borderRadius: '8px' }}
                          labelStyle={{ color: '#94a3b8' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Line yAxisId="left" type="monotone" dataKey="intakePressurePsi" name="Intake Press (psi)" stroke="#38bdf8" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line yAxisId="right" type="monotone" dataKey="motorTempF" name="Motor Temp (°F)" stroke="#f43f5e" strokeWidth={2} dot={false} isAnimationActive={false} />
                        <Line yAxisId="left" type="monotone" dataKey="powerKw" name="Motor Power (kW)" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" dot={false} isAnimationActive={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Well-Specific Alarms & Alerts */}
                {activeWellAlarms.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white font-mono uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
                        <AlertCircle className="w-4 h-4" />
                        <span>Active Alarms for {activeWell.wellCode || activeWell.id}</span>
                      </span>
                      <span className="text-[11px] font-mono text-rose-300 bg-rose-950 px-2 py-0.5 rounded border border-rose-800">
                        {activeWellAlarms.length} Urgent / Critical
                      </span>
                    </div>

                    <div className="space-y-2">
                      {activeWellAlarms.map(a => (
                        <div key={a.id} className="p-2.5 rounded-lg bg-slate-950 border border-rose-900/40 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-rose-300 font-mono">{a.title}</div>
                            <div className="text-[11px] text-slate-400">{a.description}</div>
                          </div>
                          <span className="text-rose-400 font-mono font-bold shrink-0 ml-3">{a.currentValue}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500 font-sans">
                Select an asset from the left registry to load its detailed downhole telemetry dashboard.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* FULL TABULAR REGISTRY VIEW */
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800 select-none">
                <tr>
                  <th className="px-4 py-3">Asset Short Name</th>
                  <th className="px-4 py-3">Well Long Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Lift Type</th>
                  <th className="px-4 py-3 text-right">Oil Rate (BOPD)</th>
                  <th className="px-4 py-3 text-right">Intake Press (psi)</th>
                  <th className="px-4 py-3 text-right">Disch Press (psi)</th>
                  <th className="px-4 py-3 text-right">Motor Temp (°F)</th>
                  <th className="px-4 py-3 text-right">Speed (Hz)</th>
                  <th className="px-4 py-3 text-right">Vibration (g)</th>
                  <th className="px-4 py-3 text-right">Health Score</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                {filteredWells.map(w => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-bold text-cyan-300">
                      {w.wellCode || w.id}
                    </td>
                    <td className="px-4 py-3 font-sans text-white font-medium">
                      {w.name}
                      <span className="block text-[10px] text-slate-500 font-mono">{w.padName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-sans font-medium ${
                        w.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                        w.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        w.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-300">
                      {w.liftType}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {w.currentBopd}
                    </td>
                    <td className="px-4 py-3 text-right text-cyan-300">
                      {w.intakePressurePsi}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {w.dischargePressurePsi}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={w.motorTempF > 215 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                        {w.motorTempF}°F
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-cyan-400">
                      {w.vfdFrequencyHz}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">
                      {w.vibrationG}g
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-400">
                      {w.healthScore}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          handleSelectWell(w);
                          setViewMode('split');
                        }}
                        className="px-2.5 py-1 rounded text-[11px] font-sans font-medium bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
