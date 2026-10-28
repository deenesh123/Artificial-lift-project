import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  AlertTriangle, 
  Activity, 
  Radio, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Clock, 
  PanelLeftClose, 
  PanelLeftOpen,
  Filter,
  RefreshCw,
  WifiOff,
  Gauge,
  TrendingUp,
  Sliders
} from 'lucide-react';
import { WellAsset, AlarmItem } from '../../types';
import { DEMO_ALARMS } from '../../data/mockData';

interface AssetMonitoringPanelProps {
  wells: WellAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (well: WellAsset | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

// Compact SVG mini sparkline for the asset card
const AssetMiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 48;
  const h = 18;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={w} height={h} className="shrink-0 overflow-visible opacity-90">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const AssetMonitoringPanel: React.FC<AssetMonitoringPanelProps> = ({
  wells,
  selectedAssetId,
  onSelectAsset,
  collapsed,
  onToggleCollapse,
  className = '',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'WARNING' | 'DOWN' | 'NO_COMM'>('ALL');
  
  const [runningExpanded, setRunningExpanded] = useState(true);
  const [warningExpanded, setWarningExpanded] = useState(true);
  const [downExpanded, setDownExpanded] = useState(true);
  const [noCommExpanded, setNoCommExpanded] = useState(true);

  // Group wells into the 4 mandatory PART A groups:
  // 1. Running
  // 2. Warning / Threat
  // 3. Down
  // 4. No Communication
  const { runningWells, warningWells, downWells, noCommWells } = useMemo(() => {
    const running: WellAsset[] = [];
    const warning: WellAsset[] = [];
    const down: WellAsset[] = [];
    const noComm: WellAsset[] = [];

    wells.forEach(well => {
      const isNotStreaming = well.streamingStatus === 'Not Streaming';
      
      if (isNotStreaming || well.status === 'Testing') {
        noComm.push(well);
      } else if (well.status === 'Offline' || well.status === 'Critical') {
        down.push(well);
      } else if (well.status === 'Warning' || (well.motorTempF && well.motorTempF > 225)) {
        warning.push(well);
      } else {
        running.push(well);
      }
    });

    return { 
      runningWells: running, 
      warningWells: warning, 
      downWells: down, 
      noCommWells: noComm 
    };
  }, [wells]);

  // Search filter
  const filterWell = (w: WellAsset) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const shortName = (w.wellCode || w.id).toLowerCase();
    const fullName = w.name.toLowerCase();
    const pad = (w.padName || '').toLowerCase();
    const basin = (w.basin || '').toLowerCase();
    const liftType = (w.liftType || '').toLowerCase();
    return shortName.includes(term) || fullName.includes(term) || pad.includes(term) || basin.includes(term) || liftType.includes(term);
  };

  const filteredRunning = runningWells.filter(filterWell);
  const filteredWarning = warningWells.filter(filterWell);
  const filteredDown = downWells.filter(filterWell);
  const filteredNoComm = noCommWells.filter(filterWell);

  const getWellAlarmCount = (wellId: string) => {
    return DEMO_ALARMS.filter(a => a.wellId === wellId && !a.acknowledged).length;
  };

  const getDownDetails = (well: WellAsset) => {
    if (well.id === 'ALS-DEL-ESP-099') {
      return { reason: 'Insulation Breakdown (0.3 MΩ)', downtime: 'Down: 2h 45m' };
    }
    if (well.id === 'ALS-EF-ROD-019') {
      return { reason: 'Severe Fluid Pound Lockout', downtime: 'Down: 1h 20m' };
    }
    if (well.status === 'Critical') {
      return { reason: 'High Vibration Overload Trip', downtime: 'Down: 4h 10m' };
    }
    return { reason: 'Surface Choke Maintenance', downtime: well.streamingAge || 'Down: 3h+' };
  };

  // Sparkline generator helper
  const getWellSparkline = (well: WellAsset) => {
    const base = well.currentBopd > 0 ? well.currentBopd : well.intakePressurePsi;
    return [
      Math.round(base * 0.94),
      Math.round(base * 0.98),
      Math.round(base * 1.03),
      Math.round(base * 0.97),
      Math.round(base * 1.01),
      Math.round(base * 0.99),
      Math.round(base)
    ];
  };

  // Collapsed Sidebar View (Desktop Icon-only)
  if (collapsed) {
    return (
      <div className={`bg-slate-900 border-r border-slate-800 w-12 flex flex-col items-center py-3 select-none shrink-0 transition-all z-20 ${className}`}>
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="Expand Well / Asset Selector"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>

        <div className="mt-4 flex flex-col items-center gap-3">
          <button 
            onClick={() => onSelectAsset(null)}
            className="p-1 rounded text-slate-400 hover:text-white"
            title="All Monitored Assets"
          >
            <Radio className="w-4 h-4 text-cyan-400" />
          </button>

          <div className="flex flex-col items-center" title={`${runningWells.length} Running Assets`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-300 mt-0.5">{runningWells.length}</span>
          </div>

          <div className="flex flex-col items-center" title={`${warningWells.length} Warning Assets`}>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-mono text-amber-300 mt-0.5">{warningWells.length}</span>
          </div>

          <div className="flex flex-col items-center" title={`${downWells.length} Down Assets`}>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-mono text-rose-300 mt-0.5">{downWells.length}</span>
          </div>

          <div className="flex flex-col items-center" title={`${noCommWells.length} No Comm Assets`}>
            <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-mono text-slate-400 mt-0.5">{noCommWells.length}</span>
          </div>
        </div>
      </div>
    );
  }

  // Expanded Left-Hand Asset Selector
  return (
    <aside className={`w-72 md:w-80 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none transition-all z-20 ${className}`}>
      {/* Header */}
      <div className="p-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Well &amp; Asset Selector
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Collapse Asset Panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Status Counters Bar (Running, Warning, Down, No Comm) */}
      <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/70 border-b border-slate-800 text-center font-mono text-[10px]">
        <button
          onClick={() => setStatusFilter(statusFilter === 'RUNNING' ? 'ALL' : 'RUNNING')}
          className={`rounded py-1 px-0.5 transition-colors border ${
            statusFilter === 'RUNNING' 
              ? 'bg-emerald-900/60 border-emerald-500 text-white' 
              : 'bg-emerald-950/30 border-emerald-900/40 text-emerald-300 hover:bg-emerald-950/50'
          }`}
        >
          <div className="text-[9px] text-emerald-400 uppercase font-semibold">Run</div>
          <div className="text-xs font-bold">{runningWells.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'WARNING' ? 'ALL' : 'WARNING')}
          className={`rounded py-1 px-0.5 transition-colors border ${
            statusFilter === 'WARNING' 
              ? 'bg-amber-900/60 border-amber-500 text-white' 
              : 'bg-amber-950/30 border-amber-900/40 text-amber-300 hover:bg-amber-950/50'
          }`}
        >
          <div className="text-[9px] text-amber-400 uppercase font-semibold">Warn</div>
          <div className="text-xs font-bold">{warningWells.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'DOWN' ? 'ALL' : 'DOWN')}
          className={`rounded py-1 px-0.5 transition-colors border ${
            statusFilter === 'DOWN' 
              ? 'bg-rose-900/60 border-rose-500 text-white' 
              : 'bg-rose-950/30 border-rose-900/40 text-rose-300 hover:bg-rose-950/50'
          }`}
        >
          <div className="text-[9px] text-rose-400 uppercase font-semibold">Down</div>
          <div className="text-xs font-bold">{downWells.length}</div>
        </button>

        <button
          onClick={() => setStatusFilter(statusFilter === 'NO_COMM' ? 'ALL' : 'NO_COMM')}
          className={`rounded py-1 px-0.5 transition-colors border ${
            statusFilter === 'NO_COMM' 
              ? 'bg-slate-800 border-slate-500 text-white' 
              : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
          }`}
        >
          <div className="text-[9px] text-slate-400 uppercase font-semibold">No Comm</div>
          <div className="text-xs font-bold">{noCommWells.length}</div>
        </button>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-800 bg-slate-900/50">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search well code, name or pad..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-8 pr-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* All Assets Selector Button */}
      <div className="p-2 border-b border-slate-800/60">
        <button
          onClick={() => onSelectAsset(null)}
          className={`w-full flex items-center justify-between p-2 rounded-lg text-xs font-semibold transition-all ${
            selectedAssetId === null
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/60 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>All Monitored Assets Overview</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {wells.length} Wells
          </span>
        </button>
      </div>

      {/* Scrollable Grouped Assets List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* GROUP 1: Running Assets */}
        {(statusFilter === 'ALL' || statusFilter === 'RUNNING') && (
          <div className="space-y-1">
            <button
              onClick={() => setRunningExpanded(!runningExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider hover:bg-slate-800/50 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Running Assets</span>
                <span className="text-[10px] text-slate-400 font-normal font-sans">({filteredRunning.length})</span>
              </div>
              {runningExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {runningExpanded && (
              <div className="space-y-1.5 pl-1">
                {filteredRunning.length === 0 ? (
                  <div className="text-[11px] text-slate-500 px-3 py-1 font-sans">No matching running assets</div>
                ) : (
                  filteredRunning.map(well => {
                    const isSelected = selectedAssetId === well.id || selectedAssetId === well.wellCode;
                    const alarmCount = getWellAlarmCount(well.id);
                    const shortName = well.wellCode || well.id;
                    const sparkData = getWellSparkline(well);

                    return (
                      <button
                        key={well.id}
                        onClick={() => onSelectAsset(well)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 shadow-md ring-1 ring-cyan-500/50'
                            : 'bg-slate-950/50 hover:bg-slate-800/60 border-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            <span>{shortName}</span>
                            <span className="text-[10px] font-normal text-slate-500">({well.liftType})</span>
                          </div>
                          <div className="text-[11px] font-mono text-emerald-400 font-bold">
                            {well.currentBopd > 0 ? `${well.currentBopd} BPD` : 'Streaming'}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-300 mt-1 font-sans">
                          <span className="truncate max-w-[155px]" title={well.name}>{well.name}</span>
                          <span className="text-[9px] font-mono text-slate-500">{well.streamingAge || '1m 15s'}</span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-800/60">
                          <span className="truncate text-slate-400">{well.padName || well.basin}</span>
                          <div className="flex items-center gap-1.5">
                            {alarmCount > 0 && (
                              <span className="px-1 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-mono">
                                {alarmCount} alm
                              </span>
                            )}
                            <AssetMiniSparkline data={sparkData} color="#10b981" />
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* GROUP 2: Warning / Threat Assets */}
        {(statusFilter === 'ALL' || statusFilter === 'WARNING') && warningWells.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setWarningExpanded(!warningExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider hover:bg-slate-800/50 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Warning / Threat</span>
                <span className="text-[10px] text-slate-400 font-normal font-sans">({filteredWarning.length})</span>
              </div>
              {warningExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {warningExpanded && (
              <div className="space-y-1.5 pl-1">
                {filteredWarning.map(well => {
                  const isSelected = selectedAssetId === well.id || selectedAssetId === well.wellCode;
                  const alarmCount = getWellAlarmCount(well.id);
                  const shortName = well.wellCode || well.id;
                  const sparkData = getWellSparkline(well);

                  return (
                    <button
                      key={well.id}
                      onClick={() => onSelectAsset(well)}
                      className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                        isSelected
                          ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-md ring-1 ring-amber-500/50'
                          : 'bg-amber-950/20 hover:bg-amber-950/40 border-amber-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{shortName}</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-amber-950 text-amber-300 border border-amber-800 uppercase font-bold">
                          WARNING
                        </span>
                      </div>

                      <div className="text-[11px] font-sans text-slate-200 mt-1 truncate" title={well.name}>
                        {well.name}
                      </div>

                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="text-amber-400/90 font-medium">Elevated Motor Temp ({well.motorTempF}°F)</span>
                        <span>{well.streamingAge || '1m 34s'}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-amber-900/40">
                        <span className="text-amber-300/80 font-mono">{well.currentBopd} BPD</span>
                        <AssetMiniSparkline data={sparkData} color="#f59e0b" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* GROUP 3: Down Assets */}
        {(statusFilter === 'ALL' || statusFilter === 'DOWN') && (
          <div className="space-y-1">
            <button
              onClick={() => setDownExpanded(!downExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono font-bold text-rose-400 uppercase tracking-wider hover:bg-slate-800/50 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Down Assets</span>
                <span className="text-[10px] text-slate-400 font-normal font-sans">({filteredDown.length})</span>
              </div>
              {downExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {downExpanded && (
              <div className="space-y-1.5 pl-1">
                {filteredDown.length === 0 ? (
                  <div className="text-[11px] text-slate-500 px-3 py-1 font-sans">0 Down Assets (All Operating)</div>
                ) : (
                  filteredDown.map(well => {
                    const isSelected = selectedAssetId === well.id || selectedAssetId === well.wellCode;
                    const shortName = well.wellCode || well.id;
                    const downDetails = getDownDetails(well);

                    return (
                      <button
                        key={well.id}
                        onClick={() => onSelectAsset(well)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-rose-950/80 border-rose-400 text-rose-200 shadow-md ring-1 ring-rose-500/50'
                            : 'bg-rose-950/20 hover:bg-rose-950/40 border-rose-900/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            <span>{shortName}</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800 font-bold uppercase">
                            DOWN
                          </span>
                        </div>

                        <div className="text-[11px] font-sans text-slate-300 mt-1 truncate" title={well.name}>
                          {well.name}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="truncate max-w-[150px] text-rose-300/80">{downDetails.reason}</span>
                          <span>{downDetails.downtime}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}

        {/* GROUP 4: No Communication Assets */}
        {(statusFilter === 'ALL' || statusFilter === 'NO_COMM') && (
          <div className="space-y-1">
            <button
              onClick={() => setNoCommExpanded(!noCommExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider hover:bg-slate-800/50 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-slate-500" />
                <span>No Communication</span>
                <span className="text-[10px] text-slate-500 font-normal font-sans">({filteredNoComm.length})</span>
              </div>
              {noCommExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {noCommExpanded && (
              <div className="space-y-1.5 pl-1">
                {filteredNoComm.length === 0 ? (
                  <div className="text-[11px] text-slate-500 px-3 py-1 font-sans">All RTU gateways responding</div>
                ) : (
                  filteredNoComm.map(well => {
                    const isSelected = selectedAssetId === well.id || selectedAssetId === well.wellCode;
                    const shortName = well.wellCode || well.id;

                    return (
                      <button
                        key={well.id}
                        onClick={() => onSelectAsset(well)}
                        className={`w-full text-left p-2.5 rounded-lg transition-all border ${
                          isSelected
                            ? 'bg-slate-800 border-slate-400 text-white shadow-md'
                            : 'bg-slate-950/40 hover:bg-slate-800/40 border-slate-800/80 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-300">
                            <WifiOff className="w-3 h-3 text-slate-500" />
                            <span>{shortName}</span>
                          </div>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-slate-800 text-slate-400 border border-slate-700 font-bold uppercase">
                            NO COMM
                          </span>
                        </div>

                        <div className="text-[11px] font-sans text-slate-400 mt-1 truncate">
                          {well.name}
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                          <span>Gateway Packet Drop</span>
                          <span>Last: 4h 12m</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
