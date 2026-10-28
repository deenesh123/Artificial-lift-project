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
  Maximize2,
  Pause,
  Play,
  Download,
  Flame,
  Layers,
  Sliders,
  Grid
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

// Circular Dial Gauge Component matching Slide 4
interface DialGaugeProps {
  title: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  color?: string;
  batteryVolt?: number;
}

const DialGauge: React.FC<DialGaugeProps> = ({
  title,
  value,
  unit,
  min,
  max,
  color = '#06b6d4',
  batteryVolt = 3.7
}) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  // Semi-circle circumference: r=38 => C = pi*r ≈ 119.38
  const dashOffset = 119.4 - (pct / 100) * 119.4;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between relative shadow-lg">
      <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider mb-2 text-center">
        {title} ({unit})
      </span>

      <div className="relative w-36 h-24 flex items-center justify-center">
        <svg className="w-36 h-28 -rotate-180" viewBox="0 0 100 60">
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke="#1e293b"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path
            d="M 12 50 A 38 38 0 0 1 88 50"
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeDasharray="119.4"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute top-9 flex flex-col items-center">
          <span className="text-xl font-bold font-mono text-white tracking-tight">
            {value.toFixed(2)}
          </span>
          <span className="text-[10px] font-mono text-slate-400">{title}</span>
        </div>
      </div>

      <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 mt-1">
        <span className="text-slate-500">Range: {min}-{max}</span>
        <span className="flex items-center gap-1.5 text-cyan-400">
          <span className="w-2.5 h-3.5 border border-cyan-500/80 rounded-xs flex items-center justify-center p-0.5">
            <span className="w-1.5 h-2 bg-cyan-400 rounded-xs" />
          </span>
          {batteryVolt}V
        </span>
      </div>
    </div>
  );
};

export const ScadaDashboardView: React.FC = () => {
  const [subTab, setSubTab] = useState<'cockpit' | 'pressure-temp' | 'live-grid' | 'quick-view' | 'registers'>('cockpit');
  const [tags, setTags] = useState<ScadaTagItem[]>(() => ScadaService.getTags());
  const [selectedWellId, setSelectedWellId] = useState<string>('ALS-DEL-ESP-104');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d'>('24h');
  const [activeChartTab, setActiveChartTab] = useState<'pressure' | 'electrical' | 'thermal' | 'production'>('pressure');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoPoll, setAutoPoll] = useState<boolean>(true);
  const [pollIntervalSec, setPollIntervalSec] = useState<number>(3);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const [drillDownTag, setDrillDownTag] = useState<ScadaTagItem | null>(null);
  const [streamingFilter, setStreamingFilter] = useState<'All' | 'Streaming' | 'Not Streaming'>('All');
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);
  const selectedWell = wells.find(w => w.id === selectedWellId || w.wellCode === selectedWellId) || wells[0];

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Telemetry time series for charts
  const telemetryData = useMemo(() => {
    return ScadaService.generateTelemetrySeries(selectedWell.id, timeRange, selectedWell?.vfdFrequencyHz || 58.5);
  }, [selectedWell.id, timeRange, selectedWell]);

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
    }, pollIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoPoll, pollIntervalSec]);

  // Filtered tags for the active well
  const wellTags = useMemo(() => {
    return tags.filter(t => {
      const matchWell = t.wellId === selectedWell.id || t.wellName === selectedWell?.name;
      const matchSearch = t.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.register.toString().includes(searchTerm);
      return matchWell && matchSearch;
    });
  }, [tags, selectedWell, searchTerm]);

  // Daily production trend data matching Slide 22
  const dailyProductionSeries = [
    { month: 'Apr 26', bfpd: 6800, bopd: 2800, waterCut: 58.8 },
    { month: 'May 26', bfpd: 8200, bopd: 3300, waterCut: 59.7 },
    { month: 'Jun 26', bfpd: 10400, bopd: 4100, waterCut: 60.5 },
    { month: 'Jul 26', bfpd: 9600, bopd: 3800, waterCut: 60.4 },
    { month: 'Aug 26', bfpd: 11200, bopd: 4400, waterCut: 60.7 },
    { month: 'Sep 26', bfpd: 10800, bopd: 4250, waterCut: 60.6 },
    { month: 'Oct 26', bfpd: 12430, bopd: 5432, waterCut: 56.3 },
  ];

  // Parameter multi-trends (1 Hour) matching Slide 4
  const oneHourTrends = [
    { time: '09:20', tubingPressure: 18.25, aAnnulus: 50.22, flowlinePressure: 8.13, flowlineTemp: 45.44 },
    { time: '09:25', tubingPressure: 18.40, aAnnulus: 50.15, flowlinePressure: 8.25, flowlineTemp: 45.50 },
    { time: '09:30', tubingPressure: 22.10, aAnnulus: 42.10, flowlinePressure: 14.20, flowlineTemp: 44.80 },
    { time: '09:35', tubingPressure: 26.50, aAnnulus: 34.20, flowlinePressure: 22.80, flowlineTemp: 43.90 },
    { time: '09:40', tubingPressure: 28.10, aAnnulus: 28.40, flowlinePressure: 24.10, flowlineTemp: 43.10 },
    { time: '09:45', tubingPressure: 19.80, aAnnulus: 18.20, flowlinePressure: 16.50, flowlineTemp: 42.40 },
    { time: '09:50', tubingPressure: 14.20, aAnnulus: 12.10, flowlinePressure: 9.80, flowlineTemp: 42.80 },
    { time: '09:55', tubingPressure: 16.50, aAnnulus: 8.40, flowlinePressure: 7.20, flowlineTemp: 43.50 },
    { time: '10:00', tubingPressure: 17.80, aAnnulus: 7.10, flowlinePressure: 7.90, flowlineTemp: 44.20 },
    { time: '10:05', tubingPressure: 18.10, aAnnulus: 6.80, flowlinePressure: 8.05, flowlineTemp: 45.10 },
    { time: '10:10', tubingPressure: 18.25, aAnnulus: 6.50, flowlinePressure: 8.13, flowlineTemp: 45.44 },
  ];

  const handleExportCSV = () => {
    const headers = ['Register', 'TagName', 'Description', 'DataType', 'Value', 'Unit', 'Quality', 'LastUpdated'];
    const rows = wellTags.map(t => [
      t.register,
      `"${t.tagName}"`,
      `"${t.description}"`,
      t.dataType,
      t.currentValue,
      t.unit,
      t.quality,
      t.lastUpdated,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCADA_Registers_${selectedWell?.wellCode || selectedWell?.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported SCADA tags to CSV.');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastNotice}</span>
        </div>
      )}

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
              value={selectedWell.id}
              onChange={(e) => setSelectedWellId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {wells.map(w => (
                <option key={w.id} value={w.id}>
                  {w.wellCode || w.id} — {w.name} ({w.liftType})
                </option>
              ))}
            </select>
          </div>

          {/* Polling Interval Select */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs font-mono">
            <span className="text-slate-400 text-[10px]">Rate:</span>
            <select
              value={pollIntervalSec}
              onChange={(e) => setPollIntervalSec(Number(e.target.value))}
              className="bg-transparent text-cyan-400 font-semibold focus:outline-none text-xs"
            >
              <option value={1} className="bg-slate-900">1s</option>
              <option value={3} className="bg-slate-900">3s</option>
              <option value={5} className="bg-slate-900">5s</option>
              <option value={10} className="bg-slate-900">10s</option>
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
            {autoPoll ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: `${pollIntervalSec * 2}s` }} />
                <span>Polling ({pollIntervalSec}s)</span>
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 text-amber-400" />
                <span>Polling Paused</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary SCADA Subtabs (Aligns with PDF Slides 3, 4, 17, 22, 27) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('cockpit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'cockpit' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>SCADA Cockpit & Production (Slide 22)</span>
          </button>

          <button
            onClick={() => setSubTab('pressure-temp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'pressure-temp' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Pressure & Temperature Gauges (Slide 4)</span>
          </button>

          <button
            onClick={() => setSubTab('live-grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'live-grid' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>ESP Well Live Status Grid (Slide 17)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">20 Wells</span>
          </button>

          <button
            onClick={() => setSubTab('quick-view')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'quick-view' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Real Time Quick View (Slide 27)</span>
          </button>

          <button
            onClick={() => setSubTab('registers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'registers' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Modbus Tags ({wellTags.length})</span>
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Registers</span>
        </button>
      </div>

      {/* VIEW 1: SCADA Cockpit & Production (Slide 22) */}
      {subTab === 'cockpit' && (
        <div className="space-y-6">
          {/* Top Gauge Readouts & Wellhead Schematic Surface Callouts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Daily Production Trend Chart (Slide 22) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Daily Production Trendz (BOPD / BFPD / Water Cut)
                  </h3>
                  <p className="text-xs text-slate-400">Total gross liquid vs oil cut allocation over historical quarters.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold">Updated: Just Now</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyProductionSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bfpdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="bopdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="fluid" stroke="#06b6d4" tick={{ fontSize: 10 }} label={{ value: 'Fluid (BPD)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10 }} />
                    <YAxis yAxisId="wc" orientation="right" stroke="#eab308" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area yAxisId="fluid" type="monotone" dataKey="bfpd" name="Production BFPD" stroke="#06b6d4" fill="url(#bfpdGrad)" strokeWidth={2} />
                    <Area yAxisId="fluid" type="monotone" dataKey="bopd" name="Production BOPD" stroke="#10b981" fill="url(#bopdGrad)" strokeWidth={2} />
                    <Line yAxisId="wc" type="monotone" dataKey="waterCut" name="Water Cut %" stroke="#eab308" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 5 cols: SCADA Surface Transmitter Callouts & Dials (Slide 22) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Downhole &amp; Surface Callouts
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Telemetry Stream OK
                </span>
              </div>

              {/* 3 Inline Dials */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">Intake Press</span>
                  <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">{selectedWell.intakePressurePsi}</span>
                  <span className="text-[9px] text-slate-500 font-mono">psig</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">Discharge Press</span>
                  <span className="text-lg font-bold font-mono text-purple-400 mt-0.5 block">{selectedWell.dischargePressurePsi}</span>
                  <span className="text-[9px] text-slate-500 font-mono">psig</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">Motor Temp</span>
                  <span className="text-lg font-bold font-mono text-rose-400 mt-0.5 block">{selectedWell.motorTempF}°</span>
                  <span className="text-[9px] text-slate-500 font-mono">°F</span>
                </div>
              </div>

              {/* Surface Wellhead SCADA Tag Readouts (Slide 22 Callouts) */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Voltage (V):</span>
                  <span className="text-white font-bold">2,241 V</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Current (A):</span>
                  <span className="text-amber-400 font-bold">{selectedWell.motorCurrentA} A</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Frequency (Hz):</span>
                  <span className="text-cyan-400 font-bold">{selectedWell.vfdFrequencyHz} Hz</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Vibration (G):</span>
                  <span className="text-white font-bold">{selectedWell.vibrationG} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wellhead Press (Pd):</span>
                  <span className="text-cyan-300 font-bold">3,114 psi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Intake Press (Pi):</span>
                  <span className="text-purple-300 font-bold">{selectedWell.intakePressurePsi} psi</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center border-t border-slate-800 pt-2 font-mono">
                Asset URI: <span className="text-cyan-400 font-bold">http://localhost:3000/#{selectedWell.wellCode || selectedWell.id}</span>
              </div>
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
                {selectedWell.intakePressurePsi} <span className="text-xs font-normal text-slate-400">psi</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Normal Operating Range</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>DISCHARGE PRESS</span>
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {selectedWell.dischargePressurePsi} <span className="text-xs font-normal text-slate-400">psi</span>
              </div>
              <div className="text-[10px] text-cyan-400 font-mono mt-0.5">ΔP: {selectedWell.dischargePressurePsi - selectedWell.intakePressurePsi} psi</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>DRIVE FREQUENCY</span>
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
              </div>
              <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                {selectedWell.vfdFrequencyHz} <span className="text-xs font-normal text-slate-400">Hz</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Speed Trim Nominal</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>MOTOR CURRENT</span>
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {selectedWell.motorCurrentA} <span className="text-xs font-normal text-slate-400">Amps</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Power: {selectedWell.powerKw} kW</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>MOTOR STATOR TEMP</span>
                <Thermometer className="w-3.5 h-3.5 text-rose-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {selectedWell.motorTempF} <span className="text-xs font-normal text-slate-400">°F</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Class H Limit 300°F</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
              <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
                <span>GROSS PRODUCTION</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {selectedWell.currentBopd} <span className="text-xs font-normal text-slate-400">BOPD</span>
              </div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">Gross: {selectedWell.grossFluidBpd} BPD</div>
            </div>
          </div>

          {/* Interactive Multi-Metric Telemetry Chart Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
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
                  Electrical &amp; Speed
                </button>
                <button
                  onClick={() => setActiveChartTab('thermal')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    activeChartTab === 'thermal' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Thermal &amp; Vibration
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
        </div>
      )}

      {/* VIEW 2: Pressure & Temperature Monitoring (Slide 4) */}
      {subTab === 'pressure-temp' && (
        <div className="space-y-6">
          {/* Header Controls for Slide 4 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Pressure &amp; Temperature Instrumentation Dial Cluster
              </h3>
              <p className="text-xs text-slate-400">
                Calibrated RTU circular telemetry gauges for {selectedWell.wellCode || selectedWell.id} ({selectedWell.name}).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Time Range:</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                {(['1H', '12H', '24H'] as const).map(tr => (
                  <button
                    key={tr}
                    onClick={() => showToast(`Updated trend window to ${tr}.`)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold"
                  >
                    {tr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 6 Circular Dial Gauges (Slide 4) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <DialGauge
              title="Tubing Pressure"
              value={selectedWell.tubingPressureKgCm2 || 18.25}
              unit="kg/cm²"
              min={0}
              max={100}
              color="#ec4899"
              batteryVolt={selectedWell.batteryVoltage || 3.7}
            />

            <DialGauge
              title="Flowline Pressure"
              value={selectedWell.flowlinePressureKgCm2 || 3.65}
              unit="kg/cm²"
              min={0}
              max={300}
              color="#3b82f6"
              batteryVolt={selectedWell.batteryVoltage || 3.7}
            />

            <DialGauge
              title="A-Annulus Pressure"
              value={selectedWell.aAnnulusPressureKgCm2 || 50.22}
              unit="kg/cm²"
              min={0}
              max={100}
              color="#06b6d4"
              batteryVolt={selectedWell.batteryVoltage || 3.7}
            />

            <DialGauge
              title="Flowline Temp"
              value={selectedWell.flowlineTempC || 45.44}
              unit="°C"
              min={0}
              max={100}
              color="#10b981"
              batteryVolt={selectedWell.batteryVoltage || 3.7}
            />

            <DialGauge
              title="Tubing Temp"
              value={selectedWell.wellheadTempF ? (selectedWell.wellheadTempF - 32) * 5/9 : 145.0}
              unit="°C"
              min={0}
              max={200}
              color="#f59e0b"
              batteryVolt={selectedWell.batteryVoltage || 3.7}
            />

            <DialGauge
              title="B-Annulus Pressure"
              value={selectedWell.bAnnulusPressureKgCm2 || 0}
              unit="kg/cm²"
              min={0}
              max={300}
              color="#6366f1"
              batteryVolt={selectedWell.batteryVoltage || 3.7}
            />
          </div>

          {/* Parameter Trends (Last 1 Hour) Chart matching Slide 4 & Slide 3 */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Parameter Trends (Last 1 Hour) — {selectedWell.wellCode || selectedWell.id}
                </h4>
                <p className="text-xs text-slate-400">High-resolution 5-minute telemetry trend for tubing, annulus, and flowline parameters.</p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-pink-400">Tubing: 18.25 kg/cm²</span>
                <span className="text-cyan-400">A-Annulus: 50.22 kg/cm²</span>
                <span className="text-blue-400">Flowline: 8.13 kg/cm²</span>
                <span className="text-emerald-400">Temp: 45.44 °C</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={oneHourTrends} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 60]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="tubingPressure" name="Tubing Pressure (kg/cm²)" stroke="#ec4899" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="aAnnulus" name="A-Annulus Pressure (kg/cm²)" stroke="#06b6d4" strokeWidth={2.5} dot />
                  <Line type="monotone" dataKey="flowlinePressure" name="Flowline Pressure (kg/cm²)" stroke="#3b82f6" strokeWidth={2} dot />
                  <Line type="monotone" dataKey="flowlineTemp" name="Flowline Temp (°C)" stroke="#10b981" strokeWidth={2} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: ESP Well Live Status Grid (Slide 17) */}
      {subTab === 'live-grid' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                ESP Well Live Status Grid (20 Monitored Units)
              </h3>
              <p className="text-xs text-slate-400">Synchronized surveillance matrix with heartbeat freshness indicators.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setStreamingFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                  streamingFilter === 'All' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                All Wells (20)
              </button>
              <button
                onClick={() => setStreamingFilter('Streaming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  streamingFilter === 'Streaming' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-300" />
                Streaming (19)
              </button>
              <button
                onClick={() => setStreamingFilter('Not Streaming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                  streamingFilter === 'Not Streaming' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Not Streaming (1)
              </button>
            </div>
          </div>

          {/* 20 Well Grid (Slide 17) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {wells.slice(0, 20).filter(w => {
              if (streamingFilter === 'Streaming') return w.streamingStatus !== 'Not Streaming';
              if (streamingFilter === 'Not Streaming') return w.streamingStatus === 'Not Streaming';
              return true;
            }).map((well, idx) => {
              const isStreaming = well.streamingStatus !== 'Not Streaming';
              const isSelected = selectedWell.id === well.id;
              const wellCode = well.wellCode || `DEMO-WELL-${String(idx + 1).padStart(3, '0')}`;

              return (
                <div
                  key={well.id}
                  onClick={() => {
                    setSelectedWellId(well.id);
                    showToast(`Selected well ${wellCode} (${well.name}).`);
                  }}
                  className={`p-4 rounded-xl cursor-pointer transition-all border text-center relative overflow-hidden flex flex-col justify-between h-32 ${
                    isSelected 
                      ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-xl shadow-cyan-950/50' 
                      : 'border-slate-800 hover:border-slate-700'
                  } ${
                    isStreaming 
                      ? 'bg-gradient-to-b from-emerald-900/60 to-emerald-950/80 border-emerald-700/50 hover:from-emerald-800/60' 
                      : 'bg-gradient-to-b from-rose-950/60 to-slate-950 border-rose-800/60'
                  }`}
                >
                  <div>
                    <span className="text-sm font-extrabold font-mono text-white block tracking-wide">
                      {wellCode}
                    </span>
                    <span className="text-[10px] text-slate-300 truncate block mt-0.5" title={well.name}>
                      {well.name}
                    </span>
                  </div>

                  <div>
                    <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-bold tracking-wide ${
                      isStreaming ? 'text-emerald-200 bg-emerald-950/90' : 'text-rose-200 bg-rose-950/90'
                    }`}>
                      {isStreaming ? 'Streaming' : 'Not Streaming'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-300 block mt-1">
                      Age: {well.streamingAge || '1 min 15 sec'}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 4: Real Time Quick View (Slide 27) */}
      {subTab === 'quick-view' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Real Time Quick View Sparkline Matrix (20 Monitored Units)
              </h3>
              <p className="text-xs text-slate-400">
                Synchronized 5-trace sparkline tiles: Frequency (Hz), Motor Current (A), PIP (psi), Motor Temp (°F), Fluid Temp (°F).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">Scale: 1x</span>
              <button
                onClick={() => showToast('Refreshed quick view sparklines for all 20 wells.')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-semibold"
              >
                Sync Traces
              </button>
            </div>
          </div>

          {/* Quick View Multi-Sparkline Tiles for 20 Wells (Slide 27) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wells.slice(0, 8).map((well, idx) => {
              const wellCode = well.wellCode || `DEMO-WELL-${String(idx + 1).padStart(3, '0')}`;
              const sparkData = [
                { t: '08:00', freq: 50.0, current: 30.0, pip: 450, motorTemp: 185, fluidTemp: 110 },
                { t: '10:00', freq: 58.5, current: 52.0, pip: 460, motorTemp: 194, fluidTemp: 115 },
                { t: '12:00', freq: 58.5, current: 52.4, pip: 465, motorTemp: 198, fluidTemp: 118 },
                { t: '14:00', freq: 58.5, current: 52.2, pip: 455, motorTemp: 197, fluidTemp: 117 },
                { t: '16:00', freq: 58.5, current: 52.1, pip: 458, motorTemp: 198, fluidTemp: 117 },
                { t: '18:00', freq: 55.0, current: 48.0, pip: 470, motorTemp: 192, fluidTemp: 114 },
                { t: '20:00', freq: 58.5, current: 52.4, pip: 462, motorTemp: 198, fluidTemp: 118 },
              ];

              return (
                <div
                  key={well.id}
                  onClick={() => {
                    setSelectedWellId(well.id);
                    setSubTab('cockpit');
                    showToast(`Opened telemetry cockpit for ${wellCode}.`);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-sm font-bold font-mono text-cyan-300">{wellCode}</span>
                    <span className="text-xs text-slate-400 font-sans">{well.name}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Streaming 30s</span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Freq (Hz)</span>
                      <span className="text-cyan-400 font-bold">{well.vfdFrequencyHz}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Current (A)</span>
                      <span className="text-amber-400 font-bold">{well.motorCurrentA}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PIP (psi)</span>
                      <span className="text-purple-400 font-bold">{well.intakePressurePsi}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Motor T (°F)</span>
                      <span className="text-rose-400 font-bold">{well.motorTempF}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Fluid T (°F)</span>
                      <span className="text-emerald-400 font-bold">{well.wellheadTempF}</span>
                    </div>
                  </div>

                  <div className="h-28 w-full bg-slate-950/60 rounded p-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                        <XAxis dataKey="t" stroke="#475569" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                        <Line type="monotone" dataKey="freq" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="pip" stroke="#a855f7" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="motorTemp" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 5: Live Well Registers Table */}
      {subTab === 'registers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                <span>Synchronized SCADA Registers for {selectedWell.wellCode || selectedWell.id}</span>
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
                  <th className="px-4 py-3">Register</th>
                  <th className="px-4 py-3">Tag Identifier</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Scale</th>
                  <th className="px-4 py-3 text-right">Engineering Value</th>
                  <th className="px-4 py-3 text-center">Quality</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {wellTags.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No matching SCADA registers found for this well.
                    </td>
                  </tr>
                ) : (
                  wellTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-cyan-400">{tag.register}</td>
                      <td className="px-4 py-2.5 text-white font-medium">{tag.tagName}</td>
                      <td className="px-4 py-2.5 text-slate-300 font-sans">{tag.description}</td>
                      <td className="px-4 py-2.5 text-slate-400">{tag.dataType}</td>
                      <td className="px-4 py-2.5 text-slate-400">{tag.scale}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-white">
                        {typeof tag.currentValue === 'number' ? tag.currentValue.toFixed(1) : tag.currentValue} {tag.unit}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tag.quality === 'GOOD' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          tag.quality === 'FAIR' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {tag.quality}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
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
      )}

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
