import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  HardDrive, 
  Cpu, 
  Activity, 
  Zap, 
  Gauge, 
  Thermometer, 
  Clock, 
  Filter, 
  SlidersHorizontal, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle, 
  Maximize2 
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
  AreaChart, 
  Area 
} from 'recharts';
import { ScadaTagItem, TelemetryPoint } from '../../types';
import { ScadaService } from '../../services/scadaService';
import { StorageService } from '../../services/storageService';

export const ScadaDashboardView: React.FC = () => {
  const [tags, setTags] = useState<ScadaTagItem[]>(() => ScadaService.getTags());
  const [selectedWellId, setSelectedWellId] = useState<string>('ALS-DEL-ESP-104');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [activeChartTab, setActiveChartTab] = useState<'pressure' | 'electrical' | 'thermal' | 'production'>('pressure');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [drillDownTag, setDrillDownTag] = useState<ScadaTagItem | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);
  const selectedWell = wells.find(w => w.id === selectedWellId) || wells[0];

  // Telemetry time series for charts
  const telemetryData = useMemo(() => {
    return ScadaService.generateTelemetrySeries(selectedWellId, timeRange, selectedWell?.vfdFrequencyHz || 58.5);
  }, [selectedWellId, timeRange, selectedWell]);

  // Periodic polling simulation
  useEffect(() => {
    if (!autoPoll) return;
    const interval = setInterval(() => {
      setLastPollTime(new Date());
      setTags(prev => prev.map(t => {
        if (typeof t.currentValue === 'number') {
          const delta = (Math.random() - 0.5) * 0.4;
          return {
            ...t,
            currentValue: Math.round((t.currentValue + delta) * 10) / 10,
            lastUpdated: new Date().toISOString()
          };
        }
        return t;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [autoPoll]);

  // Filtered tags for the active well
  const wellTags = useMemo(() => {
    return tags.filter(t => {
      const matchWell = t.wellId === selectedWellId || t.wellName === selectedWell?.name;
      const matchSearch = t.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.register.toString().includes(searchTerm);
      return matchWell && matchSearch;
    });
  }, [tags, selectedWellId, selectedWell, searchTerm]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top SCADA Surveillance Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Live SCADA Surveillance Dashboard
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              LIVE TELEMETRY
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time telemetry acquisition across high-frequency downhole sensors, surface RTUs, and medium voltage VFD drives.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Well Asset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">Target Asset:</span>
            <select
              value={selectedWellId}
              onChange={(e) => setSelectedWellId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {wells.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.liftType})
                </option>
              ))}
            </select>
          </div>

          {/* Auto Poll Toggle */}
          <button
            onClick={() => setAutoPoll(!autoPoll)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium border transition-colors ${
              autoPoll 
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40 hover:bg-emerald-900/40' 
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoPoll ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span>{autoPoll ? 'Auto-Polling 4s' : 'Polling Paused'}</span>
          </button>
        </div>
      </div>

      {/* Instantaneous KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>INTAKE PRESS (PIP)</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {selectedWell?.intakePressurePsi ?? 840} <span className="text-xs font-normal text-slate-400">psi</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Normal Operating Range</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>DISCHARGE PRESS</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {selectedWell?.dischargePressurePsi ?? 2950} <span className="text-xs font-normal text-slate-400">psi</span>
          </div>
          <div className="text-[10px] text-cyan-400 font-mono mt-0.5">ΔP: {(selectedWell?.dischargePressurePsi ?? 2950) - (selectedWell?.intakePressurePsi ?? 840)} psi</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>DRIVE FREQUENCY</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
            {selectedWell?.vfdFrequencyHz ?? 58.5} <span className="text-xs font-normal text-slate-400">Hz</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Speed Trim Nominal</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>MOTOR CURRENT</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {selectedWell?.motorCurrentA ?? 52.4} <span className="text-xs font-normal text-slate-400">Amps</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Power: {selectedWell?.powerKw ?? 184} kW</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>MOTOR STATOR TEMP</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {selectedWell?.motorTempF ?? 198} <span className="text-xs font-normal text-slate-400">°F</span>
          </div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Class H Limit 300°F</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span>GROSS PRODUCTION</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono mt-1">
            {selectedWell?.currentBopd ?? 985} <span className="text-xs font-normal text-slate-400">BOPD</span>
          </div>
          <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Gross: {selectedWell?.grossFluidBpd ?? 2450} BPD</div>
        </div>
      </div>

      {/* Interactive Telemetry Chart Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Chart Metric Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveChartTab('pressure')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'pressure' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hydraulic Pressures
            </button>
            <button
              onClick={() => setActiveChartTab('electrical')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'electrical' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Electrical & Speed
            </button>
            <button
              onClick={() => setActiveChartTab('thermal')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'thermal' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Thermal & Vibration
            </button>
            <button
              onClick={() => setActiveChartTab('production')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                activeChartTab === 'production' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Fluid Production
            </button>
          </div>

          {/* Time-Range Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {(['1h', '6h', '24h', '7d', '30d'] as const).map(tr => (
              <button
                key={tr}
                onClick={() => setTimeRange(tr)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeRange === tr ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {tr}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'pressure' ? (
              <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="discharge" orientation="left" stroke="#38bdf8" tick={{ fontSize: 11 }} domain={['dataMin - 100', 'dataMax + 100']} />
                <YAxis yAxisId="intake" orientation="right" stroke="#a855f7" tick={{ fontSize: 11 }} domain={['dataMin - 50', 'dataMax + 50']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Line yAxisId="discharge" type="monotone" dataKey="dischargePressure" name="Discharge Head (psi)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line yAxisId="intake" type="monotone" dataKey="intakePressure" name="Intake PIP (psi)" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            ) : activeChartTab === 'electrical' ? (
              <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="hz" orientation="left" stroke="#22d3ee" tick={{ fontSize: 11 }} domain={[40, 70]} />
                <YAxis yAxisId="amps" orientation="right" stroke="#fbbf24" tick={{ fontSize: 11 }} domain={['dataMin - 5', 'dataMax + 5']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Line yAxisId="hz" type="monotone" dataKey="frequency" name="Drive Frequency (Hz)" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line yAxisId="amps" type="monotone" dataKey="motorCurrent" name="Phase Current (Amps)" stroke="#fbbf24" strokeWidth={2} dot={false} />
              </LineChart>
            ) : activeChartTab === 'thermal' ? (
              <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="temp" orientation="left" stroke="#f43f5e" tick={{ fontSize: 11 }} domain={['dataMin - 10', 'dataMax + 10']} />
                <YAxis yAxisId="vibe" orientation="right" stroke="#eab308" tick={{ fontSize: 11 }} domain={[0, 1.0]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Line yAxisId="temp" type="monotone" dataKey="motorTemp" name="Motor Stator Temp (°F)" stroke="#f43f5e" strokeWidth={2} dot={false} />
                <Line yAxisId="vibe" type="monotone" dataKey="vibration" name="Triaxial Vibration (g RMS)" stroke="#eab308" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <AreaChart data={telemetryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#10b981" tick={{ fontSize: 11 }} domain={['dataMin - 200', 'dataMax + 200']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Legend />
                <Area type="monotone" dataKey="flowRate" name="Liquid Flow Rate (BPD)" stroke="#10b981" fillOpacity={1} fill="url(#flowGrad)" strokeWidth={2} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Live Well Registers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
              <span>Synchronized SCADA Registers for {selectedWell?.name}</span>
              <span className="text-xs text-slate-400 font-normal">({wellTags.length} mapped tags)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Instantaneous telemetry registers streamed from RTU gateway. Last poll: {lastPollTime.toLocaleTimeString()}
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter well tags..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Register</th>
                <th className="px-3 py-2.5">Tag Identifier</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Engineering Value</th>
                <th className="px-3 py-2.5">Alarm Bounds</th>
                <th className="px-3 py-2.5">Status / Quality</th>
                <th className="px-3 py-2.5 text-right">Drilldown</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {wellTags.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-slate-500">
                    No registers mapped specifically to this well.
                  </td>
                </tr>
              ) : (
                wellTags.map(tag => (
                  <tr key={tag.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 text-cyan-400 font-bold">{tag.register}</td>
                    <td className="px-3 py-2.5">
                      <div className="text-white font-semibold">{tag.tagName}</div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-sm">{tag.description}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {tag.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-white font-bold text-sm">{tag.currentValue}</span>
                      <span className="text-slate-400 text-xs ml-1">{tag.unit}</span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      {tag.lowLimit != null && tag.highLimit != null 
                        ? `${tag.lowLimit} - ${tag.highLimit}` 
                        : 'Unset'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tag.quality === 'GOOD' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {tag.quality}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        onClick={() => setDrillDownTag(tag)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-sans transition-colors inline-flex items-center gap-1"
                      >
                        <Maximize2 className="w-3 h-3 text-cyan-400" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tag Inspection Drawer / Modal */}
      {drillDownTag && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  SCADA Tag Inspector — Reg {drillDownTag.register}
                </h3>
              </div>
              <button onClick={() => setDrillDownTag(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Holding Register:</span>
                  <span className="text-cyan-400 font-bold">{drillDownTag.register} (0x{(drillDownTag.register).toString(16).toUpperCase()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Live Engineering Value:</span>
                  <span className="text-white font-bold text-sm">{drillDownTag.currentValue} {drillDownTag.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Type Encoding:</span>
                  <span className="text-slate-300">{drillDownTag.dataType} (IEEE 754 Big-Endian)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Scale Factor:</span>
                  <span className="text-slate-300">{drillDownTag.scale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Protocol Protocol Binding:</span>
                  <span className="text-slate-300">Modbus TCP Port 502 / Slave ID 1</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Communication Quality:</span>
                  <span className="text-emerald-400 font-semibold">{drillDownTag.quality} (CRC Verified)</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Raw Packet Hex Dump:</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-emerald-400 font-mono">
                  [RX] 00 01 00 00 00 06 01 03 04 42 {Math.floor(Number(drillDownTag.currentValue) || 58).toString(16)} 00 00
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setDrillDownTag(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
