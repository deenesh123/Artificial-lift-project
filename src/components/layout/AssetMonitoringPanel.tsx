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
  RefreshCw
} from 'lucide-react';
import { WellAsset, AlarmItem } from '../../types';
import { DEMO_ALARMS } from '../../data/mockData';

interface AssetMonitoringPanelProps {
  wells: WellAsset[];
  selectedAssetId: string | null;
  onSelectAsset: (well: WellAsset | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export const AssetMonitoringPanel: React.FC<AssetMonitoringPanelProps> = ({
  wells,
  selectedAssetId,
  onSelectAsset,
  collapsed,
  onToggleCollapse,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [runningExpanded, setRunningExpanded] = useState(true);
  const [downExpanded, setDownExpanded] = useState(true);
  const [warningExpanded, setWarningExpanded] = useState(true);

  // Group wells by operational state
  const { runningWells, downWells, warningWells } = useMemo(() => {
    const running: WellAsset[] = [];
    const down: WellAsset[] = [];
    const warning: WellAsset[] = [];

    wells.forEach(well => {
      if (well.status === 'Offline') {
        down.push(well);
      } else if (well.status === 'Critical') {
        down.push(well);
      } else if (well.status === 'Warning') {
        warning.push(well);
      } else {
        running.push(well);
      }
    });

    return { runningWells: running, downWells: down, warningWells: warning };
  }, [wells]);

  // Filter wells by search term
  const filterWell = (w: WellAsset) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const shortName = (w.wellCode || w.id).toLowerCase();
    const fullName = w.name.toLowerCase();
    const id = w.id.toLowerCase();
    const basin = w.basin.toLowerCase();
    return shortName.includes(term) || fullName.includes(term) || id.includes(term) || basin.includes(term);
  };

  const filteredRunning = runningWells.filter(filterWell);
  const filteredDown = downWells.filter(filterWell);
  const filteredWarning = warningWells.filter(filterWell);

  // Helper to check for active alarms
  const getWellAlarmCount = (wellId: string) => {
    return DEMO_ALARMS.filter(a => a.wellId === wellId && !a.acknowledged).length;
  };

  // Helper for shutdown reason & downtime
  const getDownDetails = (well: WellAsset) => {
    if (well.id === 'ALS-DEL-ESP-099') {
      return { reason: 'Electrical / Insulation Breakdown', downtime: 'Down: 2h 45m' };
    }
    if (well.id === 'ALS-EF-ROD-019') {
      return { reason: 'Severe Fluid Pound Lockout', downtime: 'Down: 1h 20m' };
    }
    if (well.status === 'Critical') {
      return { reason: 'Drive Fault / Safe Trip', downtime: 'Down: 4h 10m' };
    }
    return { reason: 'Scheduled Workover / Offline', downtime: well.streamingAge || 'Down: 3h+' };
  };

  if (collapsed) {
    return (
      <div className="bg-slate-900 border-r border-slate-800 w-12 flex flex-col items-center py-3 select-none shrink-0 transition-all">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
          title="Expand Asset Monitoring Panel"
        >
          <PanelLeftOpen className="w-5 h-5" />
        </button>
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex flex-col items-center" title={`${runningWells.length} Running Assets`}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-emerald-300 mt-0.5">{runningWells.length}</span>
          </div>
          <div className="flex flex-col items-center" title={`${downWells.length} Down Assets`}>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-[10px] font-mono text-rose-300 mt-0.5">{downWells.length}</span>
          </div>
          <div className="flex flex-col items-center" title={`${warningWells.length} Warning Assets`}>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-[10px] font-mono text-amber-300 mt-0.5">{warningWells.length}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <aside className="w-72 md:w-80 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 select-none transition-all">
      {/* Header */}
      <div className="p-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Asset Monitoring
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Collapse Panel"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Counters Bar */}
      <div className="grid grid-cols-3 gap-1 px-3 py-2 bg-slate-950/60 border-b border-slate-800 text-center font-mono text-[11px]">
        <div className="bg-emerald-950/40 border border-emerald-900/50 rounded py-1">
          <div className="text-[10px] text-emerald-400 uppercase font-semibold">Running</div>
          <div className="text-sm font-bold text-emerald-300">{runningWells.length}</div>
        </div>
        <div className="bg-rose-950/40 border border-rose-900/50 rounded py-1">
          <div className="text-[10px] text-rose-400 uppercase font-semibold">Down</div>
          <div className="text-sm font-bold text-rose-300">{downWells.length}</div>
        </div>
        <div className="bg-amber-950/40 border border-amber-900/50 rounded py-1">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">Warning</div>
          <div className="text-sm font-bold text-amber-300">{warningWells.length}</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-2 border-b border-slate-800">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search short name or pad..."
            className="w-full bg-slate-950 border border-slate-700/80 rounded-md pl-8 pr-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>
      </div>

      {/* List Body */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* All Assets Selector Button */}
        <button
          onClick={() => onSelectAsset(null)}
          className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-semibold transition-all ${
            selectedAssetId === null
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-cyan-400" />
            <span>All Monitored Assets</span>
          </div>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
            {wells.length}
          </span>
        </button>

        {/* Group 1: Running Assets */}
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
            <div className="space-y-1 pl-1">
              {filteredRunning.length === 0 ? (
                <div className="text-[11px] text-slate-500 px-3 py-1 font-sans">No matching running assets</div>
              ) : (
                filteredRunning.map(well => {
                  const isSelected = selectedAssetId === well.id;
                  const alarmCount = getWellAlarmCount(well.id);
                  const shortName = well.wellCode || well.id;

                  return (
                    <button
                      key={well.id}
                      onClick={() => onSelectAsset(well)}
                      className={`w-full text-left p-2 rounded-md transition-all ${
                        isSelected
                          ? 'bg-cyan-950/70 border border-cyan-400 text-cyan-200 shadow-md shadow-cyan-950'
                          : 'bg-slate-950/40 hover:bg-slate-800/60 border border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-white">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          <span>{shortName}</span>
                        </div>
                        <div className="text-[11px] font-mono text-emerald-400 font-semibold">
                          {well.currentBopd > 0 ? `${well.currentBopd} BPD` : 'Streaming'}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-sans">
                        <span className="truncate max-w-[170px]">{well.name}</span>
                        {alarmCount > 0 && (
                          <span className="px-1 py-0.2 rounded bg-rose-950 text-rose-300 text-[9px] font-mono flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            {alarmCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Group 2: Down Assets */}
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
            <div className="space-y-1 pl-1">
              {filteredDown.length === 0 ? (
                <div className="text-[11px] text-slate-500 px-3 py-1 font-sans">No down assets</div>
              ) : (
                filteredDown.map(well => {
                  const isSelected = selectedAssetId === well.id;
                  const alarmCount = getWellAlarmCount(well.id);
                  const shortName = well.wellCode || well.id;
                  const downDetails = getDownDetails(well);

                  return (
                    <button
                      key={well.id}
                      onClick={() => onSelectAsset(well)}
                      className={`w-full text-left p-2 rounded-md transition-all ${
                        isSelected
                          ? 'bg-rose-950/70 border border-rose-400 text-rose-200 shadow-md shadow-rose-950'
                          : 'bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-rose-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          <span>{shortName}</span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-rose-950 text-rose-300 border border-rose-800">
                          DOWN
                        </span>
                      </div>
                      <div className="text-[11px] font-sans text-slate-300 mt-1 truncate">
                        {well.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="truncate max-w-[160px] text-rose-300/80">{downDetails.reason}</span>
                        <span>{downDetails.downtime}</span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Group 3: Warning / Cycling Assets */}
        {warningWells.length > 0 && (
          <div className="space-y-1">
            <button
              onClick={() => setWarningExpanded(!warningExpanded)}
              className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider hover:bg-slate-800/50 rounded transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Warning Assets</span>
                <span className="text-[10px] text-slate-400 font-normal font-sans">({filteredWarning.length})</span>
              </div>
              {warningExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>

            {warningExpanded && (
              <div className="space-y-1 pl-1">
                {filteredWarning.map(well => {
                  const isSelected = selectedAssetId === well.id;
                  const alarmCount = getWellAlarmCount(well.id);
                  const shortName = well.wellCode || well.id;

                  return (
                    <button
                      key={well.id}
                      onClick={() => onSelectAsset(well)}
                      className={`w-full text-left p-2 rounded-md transition-all ${
                        isSelected
                          ? 'bg-amber-950/70 border border-amber-400 text-amber-200 shadow-md'
                          : 'bg-amber-950/20 hover:bg-amber-950/40 border border-amber-900/50 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-amber-300">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          <span>{shortName}</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-400">
                          {well.currentBopd} BPD
                        </span>
                      </div>
                      <div className="text-[11px] font-sans text-slate-300 mt-1 truncate">
                        {well.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="text-amber-400/80">Motor Temp Alert</span>
                        {alarmCount > 0 && (
                          <span className="text-rose-400">{alarmCount} active alarm</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
