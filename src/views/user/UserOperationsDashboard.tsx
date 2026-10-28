import React, { useState, useEffect } from 'react';
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
  Compass
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
import { 
  DEMO_WELLS, 
  DEMO_ALARMS, 
  DEMO_JOBS, 
  TELEMETRY_HISTORY 
} from '../../data/mockData';
import { StorageService } from '../../services/storageService';
import { WellAsset, TelemetryPoint } from '../../types';

interface UserOperationsDashboardProps {
  onNavigateToRoute: (routeId: string) => void;
}

export const UserOperationsDashboard: React.FC<UserOperationsDashboardProps> = ({ onNavigateToRoute }) => {
  const [wellsList, setWellsList] = useState<WellAsset[]>(() => StorageService.getWells());
  const [selectedWellId, setSelectedWellId] = useState<string>(() => StorageService.getWells()[0]?.id || DEMO_WELLS[0].id);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [telemetry, setTelemetry] = useState<TelemetryPoint[]>(TELEMETRY_HISTORY);
  const [vfdTrimHz, setVfdTrimHz] = useState<number>(58.5);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [activeAlarms, setActiveAlarms] = useState(DEMO_ALARMS);

  useEffect(() => {
    const handleStorage = () => {
      const data = StorageService.getWells();
      setWellsList(data);
      if (!data.some(w => w.id === selectedWellId) && data.length > 0) {
        setSelectedWellId(data[0].id);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [selectedWellId]);

  const selectedWell: WellAsset = wellsList.find(w => w.id === selectedWellId) || wellsList[0] || DEMO_WELLS[0];
  const wellAlarms = activeAlarms.filter(a => a.wellId === selectedWell.id && !a.acknowledged);
  const wellJobs = DEMO_JOBS.filter(j => j.wellId === selectedWell.id);

  // Sync VFD slider when well changes
  useEffect(() => {
    setVfdTrimHz(selectedWell.vfdFrequencyHz || 55.0);
  }, [selectedWellId]);

  // Live telemetry pulse simulator
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setTelemetry(prev => {
        const last = prev[prev.length - 1];
        const nextTime = new Date();
        const timeLabel = nextTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

        // Calculate slight fluctuations based on VFD trim
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

  const latestTelemetry = telemetry[telemetry.length - 1];

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

      {/* Well Selector & Live Telemetry Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Left: Well Selector */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              ACTIVE WELLHEAD UNDER SURVEILLANCE
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <select
                value={selectedWellId}
                onChange={(e) => setSelectedWellId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-semibold text-sm rounded px-2.5 py-1 focus:outline-none focus:border-cyan-500"
              >
                {wellsList.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.liftType} — {w.status})
                  </option>
                ))}
              </select>

              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                selectedWell.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                selectedWell.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                selectedWell.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                'bg-slate-800 text-slate-400'
              }`}>
                {selectedWell.status}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Telemetry Stream State & Mode */}
        <div className="flex items-center gap-3 self-end md:self-center">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">
              Poll Rate: 1.0s · Phoenix Downhole Sensor
            </span>
            <button
              onClick={() => setIsSimulating(!isSimulating)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                isSimulating 
                  ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {isSimulating ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Streaming Live</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Stream Paused</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* Active Alarm Alert Banner for Current Well (if any) */}
      {wellAlarms.length > 0 && (
        <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
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

      {/* 6 High-Density Live Telemetry Parameter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: Intake Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Intake Pressure</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
            {latestTelemetry?.intakePressure ?? selectedWell.intakePressurePsi} <span className="text-xs font-normal text-slate-400">psi</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Setpoint: 850 psi</span>
            <span className="text-emerald-400 font-mono">Normal</span>
          </div>
        </div>

        {/* Metric 2: Discharge Pressure */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Discharge Head</span>
            <Activity className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
            {latestTelemetry?.dischargePressure ?? selectedWell.dischargePressurePsi} <span className="text-xs font-normal text-slate-400">psi</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Diff: +{Math.round((latestTelemetry?.dischargePressure || selectedWell.dischargePressurePsi) - (latestTelemetry?.intakePressure || selectedWell.intakePressurePsi))} psi</span>
            <span className="text-blue-400 font-mono">182 Stg</span>
          </div>
        </div>

        {/* Metric 3: Motor Current */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Motor Amperage</span>
            <Zap className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
            {latestTelemetry?.motorCurrent ?? selectedWell.motorCurrentA} <span className="text-xs font-normal text-slate-400">A</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>FLA: 58.0 A max</span>
            <span className="text-amber-400 font-mono">{Math.round(((latestTelemetry?.motorCurrent || selectedWell.motorCurrentA) / 58) * 100)}% Load</span>
          </div>
        </div>

        {/* Metric 4: Downhole Motor Temp */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Motor Temp (RTD)</span>
            <Thermometer className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
            {latestTelemetry?.motorTemp ?? selectedWell.motorTempF} <span className="text-xs font-normal text-slate-400">°F</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Max Trip: 250 °F</span>
            <span className={(latestTelemetry?.motorTemp || selectedWell.motorTempF) > 225 ? 'text-rose-400 font-mono' : 'text-emerald-400 font-mono'}>
              {(latestTelemetry?.motorTemp || selectedWell.motorTempF) > 225 ? 'High' : 'Normal'}
            </span>
          </div>
        </div>

        {/* Metric 5: Vibration RMS */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Vibration (Triaxial)</span>
            <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
            {latestTelemetry?.vibration ?? selectedWell.vibrationG} <span className="text-xs font-normal text-slate-400">g</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Warn: &gt;0.50 g</span>
            <span className={(latestTelemetry?.vibration || selectedWell.vibrationG) > 0.5 ? 'text-amber-400 font-mono' : 'text-emerald-400 font-mono'}>
              {(latestTelemetry?.vibration || selectedWell.vibrationG) > 0.5 ? 'Elevated' : 'Nominal'}
            </span>
          </div>
        </div>

        {/* Metric 6: Liquid & Oil Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>Calculated Flow</span>
            <Flame className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="mt-1 text-xl font-bold text-white font-mono tabular-nums">
            {latestTelemetry?.flowRate ?? selectedWell.currentBopd} <span className="text-xs font-normal text-slate-400">BOPD</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 flex items-center justify-between">
            <span>WC: {selectedWell.waterCutPct}%</span>
            <span className="text-cyan-400 font-mono">{selectedWell.grossFluidBpd} BFPD</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Trends Chart (8 cols) & Downhole ESP String Physical Visualizer (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Multi-parameter Live Sensor Trend (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                <span>Real-Time Sensor Telemetry Stream</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedWell.name}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Downhole intake & discharge pressure correlation with motor current and temperature.
              </p>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Simulated Pulse</span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetry} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="time" stroke="#64748B" tick={{ fontSize: 10 }} />
                <YAxis yAxisId="press" stroke="#06B6D4" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <YAxis yAxisId="current" orientation="right" stroke="#F59E0B" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Line yAxisId="press" type="monotone" dataKey="intakePressure" name="Intake Press (psi)" stroke="#06B6D4" strokeWidth={2} dot={false} />
                <Line yAxisId="press" type="monotone" dataKey="dischargePressure" name="Discharge Press (psi)" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line yAxisId="current" type="monotone" dataKey="motorCurrent" name="Motor Current (A)" stroke="#F59E0B" strokeWidth={2} dot={false} />
                <Line yAxisId="current" type="monotone" dataKey="motorTemp" name="Motor Temp (°F)" stroke="#EF4444" strokeWidth={2} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive VFD Frequency Control Strip */}
          <div className="mt-4 pt-4 border-t border-slate-800 bg-slate-950/60 rounded-lg p-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Variable Frequency Drive (VFD) Speed Optimization</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Adjust motor drive frequency to optimize reservoir drawdown and dynamic fluid level.
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
                  Apply Speed Setpoint
                </button>
              </div>
            </div>

            <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between font-mono">
              <span>Min safe speed: 45.0 Hz (Motor cooling limit)</span>
              <span>Max allowed: 65.0 Hz (Thrust bearing load limit)</span>
            </div>
          </div>
        </div>

        {/* Right: Downhole ESP String Schematic (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
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

            {/* Vertical Stack Schematic */}
            <div className="space-y-2 py-1 text-xs">
              
              {/* Surface Wellhead */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">Surface Wellhead & Tree</div>
                  <div className="text-[10px] text-slate-400">Flowline Temp: {selectedWell.wellheadTempF}°F</div>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                  Surface
                </span>
              </div>

              {/* Tubing string connector */}
              <div className="text-center font-mono text-[10px] text-slate-600 py-0.5">
                ↓ 2-7/8" L-80 Production Tubing String ↓
              </div>

              {/* Discharge Sub */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-blue-900/40 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-blue-300 text-xs">Discharge Head & Check Valve</div>
                  <div className="text-[10px] text-slate-400">Head: {selectedWell.dischargePressurePsi} psi</div>
                </div>
                <span className="text-[10px] font-mono text-blue-400">11,210 ft</span>
              </div>

              {/* Multi-stage Centrifugal Pump */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-cyan-800/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-cyan-300 text-xs">Centrifugal Pump (182 Stages)</div>
                  <div className="text-[10px] text-slate-400">Radial Flow Ni-Resist Impellers</div>
                </div>
                <span className="text-[10px] font-mono text-cyan-400">{vfdTrimHz} Hz</span>
              </div>

              {/* Gas Separator */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">Vortex Gas Separator</div>
                  <div className="text-[10px] text-slate-400">Sep Efficiency: ~88%</div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Intake</span>
              </div>

              {/* Seal / Protector Chamber */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200 text-xs">Protector / Thrust Chamber</div>
                  <div className="text-[10px] text-slate-400">High-load Kingsbury thrust bearing</div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400">Barrier OK</span>
              </div>

              {/* Submersible Induction Motor */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-amber-900/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-amber-300 text-xs">Downhole Motor (240 HP)</div>
                  <div className="text-[10px] text-slate-400">3,850 V · {selectedWell.motorCurrentA} A · {selectedWell.motorTempF}°F</div>
                </div>
                <span className="text-[10px] font-mono text-amber-400">240 HP</span>
              </div>

              {/* Phoenix Downhole Gauge */}
              <div className="p-2.5 rounded bg-slate-950/80 border border-emerald-900/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-emerald-300 text-xs">Phoenix Downhole Sensor Pod</div>
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

      {/* Wellpad Information & Active Work Orders Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Well Specification Summary */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-white mb-2 flex items-center justify-between">
            <span>Wellbore Completion Specs</span>
            <span className="text-[10px] font-mono text-cyan-400">{selectedWell.id}</span>
          </div>
          <div className="space-y-1.5 text-xs text-slate-300 font-mono">
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Basin / Formation:</span>
              <span>{selectedWell.basin} · {selectedWell.field}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Total Measured Depth:</span>
              <span>{selectedWell.totalDepthFt.toLocaleString()} ft MD</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Casing / Tubing:</span>
              <span>{selectedWell.casingSizeIn}" / {selectedWell.tubingSizeIn}"</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/80">
              <span className="text-slate-400 font-sans">Spud Date:</span>
              <span>{selectedWell.spudDate}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-sans">Health Score:</span>
              <span className="text-emerald-400 font-bold">{selectedWell.healthScore}/100</span>
            </div>
          </div>
        </div>

        {/* Assigned Field Crew / Jobs */}
        <div className="lg:col-span-2 bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-white flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-cyan-400" />
              <span>Assigned Field Work Orders ({wellJobs.length})</span>
            </div>
            <button
              onClick={() => onNavigateToRoute('workflows-user')}
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <span>Work Order Center</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {wellJobs.length > 0 ? (
            <div className="space-y-2">
              {wellJobs.map(job => (
                <div key={job.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{job.title}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                        {job.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Assigned: {job.assignedCrew} · Est: {job.estimatedHours} hrs · Vehicle: {job.assignedVehicleId || 'N/A'}
                    </div>
                  </div>
                  <button 
                    onClick={() => onNavigateToRoute('workflows-user')}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 rounded-lg border border-slate-800/60">
              No active work orders dispatched for this wellsite. Equipment operating in autonomous surveillance mode.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
