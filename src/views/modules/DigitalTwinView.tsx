import React, { useState, useMemo, useEffect } from 'react';
import { 
  Workflow, 
  Sliders, 
  RefreshCw, 
  Layers, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Gauge, 
  Thermometer, 
  Zap, 
  Activity, 
  Eye, 
  ArrowDown, 
  RotateCcw, 
  Maximize2, 
  Cpu, 
  SlidersHorizontal, 
  Clock, 
  ChevronRight, 
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Settings
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
  ReferenceDot, 
  AreaChart, 
  Area 
} from 'recharts';
import { DigitalTwinModelConfig, TelemetryPoint } from '../../types';
import { DigitalTwinService, TwinComponentTelemetry } from '../../services/digitalTwinService';
import { StorageService } from '../../services/storageService';
import { ScadaService } from '../../services/scadaService';

export const DigitalTwinView: React.FC = () => {
  const wells = useMemo(() => StorageService.getWells(), []);
  const [selectedWellId, setSelectedWellId] = useState<string>('ALS-DEL-ESP-104');
  const [config, setConfig] = useState<DigitalTwinModelConfig>(() => DigitalTwinService.getConfig('ALS-DEL-ESP-104'));
  const [activeComponentId, setActiveComponentId] = useState<string>('comp-pump');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [analyticsTab, setAnalyticsTab] = useState<'nodal' | 'gradient' | 'trend' | 'thermal'>('nodal');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const selectedWell = wells.find(w => w.id === selectedWellId) || wells[0];

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Sync config when well selection changes
  useEffect(() => {
    setConfig(DigitalTwinService.getConfig(selectedWellId));
  }, [selectedWellId]);

  // Dynamic components calculated via affinity laws
  const components = useMemo(() => {
    return DigitalTwinService.getComponents(config);
  }, [config]);

  const activeComponent = useMemo(() => {
    return components.find(c => c.id === activeComponentId) || components[6];
  }, [components, activeComponentId]);

  // Nodal curves data
  const nodalData = useMemo(() => {
    return DigitalTwinService.getNodalCurveData(config);
  }, [config]);

  // Depth gradient data
  const gradientData = useMemo(() => {
    return DigitalTwinService.getDepthGradient(config);
  }, [config]);

  // Historical telemetry trend based on current frequency
  const telemetryData = useMemo(() => {
    return ScadaService.generateTelemetrySeries(selectedWellId, timeRange, config.vfdSpeedHz);
  }, [selectedWellId, timeRange, config.vfdSpeedHz]);

  // Handle frequency slider change (live physics recalculation)
  const handleFrequencyChange = (newHz: number) => {
    setConfig(prev => ({
      ...prev,
      vfdSpeedHz: newHz,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleReset = () => {
    const def = DigitalTwinService.resetConfig(selectedWellId);
    setConfig(def);
    showToast('Reset twin to baseline operating frequency (58.5 Hz).');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Workflow className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Digital Twin Equipment Viewer & Physics Cockpit
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PHYSICS SOLVER ACTIVE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time hydrodynamic and thermodynamic digital twin model of the downhole ESP completion, reservoir drawdown, and surface equipment.
          </p>
        </div>

        {/* Well Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Select Well:</span>
          <select
            value={selectedWellId}
            onChange={(e) => setSelectedWellId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.basin})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic VFD Speed Slider & Live Operating Point Banner */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 shadow-lg shadow-cyan-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Live VFD Drive Speed Modulation (Dynamic Affinity Law Recalculation)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Current Frequency:</span>
            <span className="text-cyan-400 font-bold text-base">{config.vfdSpeedHz.toFixed(1)} Hz</span>
            <button
              onClick={handleReset}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Reset to 58.5 Hz baseline"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 font-mono">45.0 Hz</span>
          <input
            type="range"
            min="45.0"
            max="65.0"
            step="0.5"
            value={config.vfdSpeedHz}
            onChange={(e) => handleFrequencyChange(parseFloat(e.target.value))}
            className="flex-1 accent-cyan-400 h-2 bg-slate-950 rounded-lg cursor-pointer"
          />
          <span className="text-xs text-slate-500 font-mono">65.0 Hz</span>
        </div>

        {/* Dynamic Key Results Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs font-mono pt-1">
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">SOLVED FLOW</span>
            <span className="text-emerald-400 font-bold text-sm">
              {Math.round(2450 * (config.vfdSpeedHz / 58.5))} <span className="text-xs font-normal text-slate-400">BPD</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">INTAKE PIP</span>
            <span className="text-purple-400 font-bold text-sm">
              {Math.max(250, Math.round(config.resPressurePsi - (2450 * (config.vfdSpeedHz / 58.5)) / config.productivityIndex))} <span className="text-xs font-normal text-slate-400">psi</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">DISCHARGE HEAD</span>
            <span className="text-cyan-400 font-bold text-sm">
              {Math.round(2950 * Math.pow(config.vfdSpeedHz / 58.5, 1.8))} <span className="text-xs font-normal text-slate-400">psi</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">MOTOR CURRENT</span>
            <span className="text-amber-400 font-bold text-sm">
              {Math.round(52.4 * Math.pow(config.vfdSpeedHz / 58.5, 1.5) * 10) / 10} <span className="text-xs font-normal text-slate-400">Amps</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">STATOR TEMP</span>
            <span className="text-rose-400 font-bold text-sm">
              {Math.round((180 + 18 * Math.pow(config.vfdSpeedHz / 58.5, 2)) * 10) / 10} <span className="text-xs font-normal text-slate-400">°F</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">MOTOR RPM</span>
            <span className="text-white font-bold text-sm">
              {Math.round(config.vfdSpeedHz * 60)} <span className="text-xs font-normal text-slate-400">RPM</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Digital Twin Interactive Workspace (Wellbore Schematic + Component Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Visual Wellbore Schematic (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Wellbore Architectural Schematic
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Click component to inspect</span>
          </div>

          {/* Interactive Component Stack */}
          <div className="space-y-2 flex-1 overflow-y-auto max-h-[720px] pr-1">
            {components.map((comp, idx) => {
              const isSelected = comp.id === activeComponentId;
              const isSurface = comp.category === 'Surface Power' || comp.category === 'Wellhead';
              const isDownhole = comp.category === 'Downhole Lift';
              const isRes = comp.category === 'Reservoir';

              return (
                <div
                  key={comp.id}
                  onClick={() => setActiveComponentId(comp.id)}
                  className={`cursor-pointer rounded-lg p-3 transition-all border relative flex items-center justify-between ${
                    isSelected 
                      ? 'bg-slate-800 border-cyan-400 shadow-md shadow-cyan-950 ring-1 ring-cyan-500/50' 
                      : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Left depth & indicator bar */}
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-10 rounded-full bg-slate-700 overflow-hidden flex flex-col justify-end">
                      <div 
                        className={`w-full ${
                          isSelected ? 'bg-cyan-400' : 
                          comp.status === 'Optimal' ? 'bg-emerald-500' : 'bg-amber-500'
                        }`} 
                        style={{ height: `${100 - comp.wearIndexPct}%` }}
                      />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white tracking-wide">
                          {comp.name}
                        </span>
                        {isSelected && (
                          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                        <span className="text-cyan-400">{comp.category}</span>
                        <span>•</span>
                        <span>Depth: {comp.depthFt} ft</span>
                        <span>•</span>
                        <span>Wear: {comp.wearIndexPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Status Badge */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px]">
                    <span className={`px-2 py-0.5 rounded font-semibold ${
                      comp.status === 'Optimal' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      comp.status === 'Warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {comp.status}
                    </span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Component Details & Multi-Tab Physics Analytics (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Active Component Telemetry Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase">{activeComponent.category}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-xs font-mono text-slate-400">Setting Depth: {activeComponent.depthFt} ft</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  {activeComponent.name}
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-xl">
                  {activeComponent.description}
                </p>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-slate-400 block">HEALTH INDEX</span>
                <span className="text-lg font-bold text-emerald-400">
                  {100 - activeComponent.wearIndexPct}%
                </span>
              </div>
            </div>

            {/* Specifications Bar */}
            <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80 text-xs font-mono flex items-center justify-between text-slate-300">
              <span className="text-slate-400">Specifications:</span>
              <span className="text-cyan-300 font-semibold">{activeComponent.specs}</span>
            </div>

            {/* Component Sensor Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {activeComponent.metrics.map((metric, mIdx) => (
                <div key={mIdx} className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-mono block truncate" title={metric.label}>
                    {metric.label}
                  </span>
                  <div className="text-base font-bold text-white font-mono mt-1">
                    {metric.value} <span className="text-xs font-normal text-slate-400">{metric.unit}</span>
                  </div>
                  {metric.normalMin != null && metric.normalMax != null && (
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      Target: {metric.normalMin} - {metric.normalMax} {metric.unit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Analytics Tabs (Nodal, Depth Gradient, Trend, Thermal) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
                <button
                  onClick={() => setAnalyticsTab('nodal')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    analyticsTab === 'nodal' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Nodal Analysis (IPR vs VLP)
                </button>
                <button
                  onClick={() => setAnalyticsTab('gradient')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    analyticsTab === 'gradient' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Wellbore Depth Gradient
                </button>
                <button
                  onClick={() => setAnalyticsTab('trend')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    analyticsTab === 'trend' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Time-Series Telemetry
                </button>
                <button
                  onClick={() => setAnalyticsTab('thermal')}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    analyticsTab === 'thermal' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Thermal Envelope
                </button>
              </div>

              {analyticsTab === 'trend' && (
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                  {(['1h', '6h', '24h', '7d'] as const).map(tr => (
                    <button
                      key={tr}
                      onClick={() => setTimeRange(tr)}
                      className={`px-2 py-0.5 rounded transition-colors ${
                        timeRange === tr ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tr}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Analytics Visualizer Canvas */}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {analyticsTab === 'nodal' ? (
                  <LineChart data={nodalData.points} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="flowRateBpd" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Gross Liquid (BPD)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 4200]} label={{ value: 'Pwf (psi)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="iprPwfPsi" name="IPR Reservoir Inflow (psi)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="vlpPwfPsi" name="VLP Tubing Lift (psi)" stroke="#ec4899" strokeWidth={2} dot={false} />
                    <ReferenceDot x={nodalData.operatingFlowRate} y={nodalData.operatingPwf} r={6} fill="#10b981" stroke="#ffffff" strokeWidth={2} />
                  </LineChart>
                ) : analyticsTab === 'gradient' ? (
                  <LineChart data={gradientData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="depthFt" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'True Vertical Depth (ft)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis yAxisId="p" orientation="left" stroke="#38bdf8" tick={{ fontSize: 11 }} label={{ value: 'Pressure (psi)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#38bdf8' }} />
                    <YAxis yAxisId="t" orientation="right" stroke="#f43f5e" tick={{ fontSize: 11 }} label={{ value: 'Temp (°F)', angle: 90, position: 'insideRight', fontSize: 10, fill: '#f43f5e' }} domain={[100, 250]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line yAxisId="p" type="monotone" dataKey="pressurePsi" name="Wellbore Pressure (psi)" stroke="#38bdf8" strokeWidth={2} />
                    <Line yAxisId="t" type="monotone" dataKey="tempF" name="Geothermal / Motor Temp (°F)" stroke="#f43f5e" strokeWidth={2} />
                  </LineChart>
                ) : analyticsTab === 'trend' ? (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="dis" orientation="left" stroke="#38bdf8" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="in" orientation="right" stroke="#a855f7" tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line yAxisId="dis" type="monotone" dataKey="dischargePressure" name="Discharge Pressure (psi)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line yAxisId="in" type="monotone" dataKey="intakePressure" name="Intake Pressure (psi)" stroke="#a855f7" strokeWidth={2} dot={false} />
                  </LineChart>
                ) : (
                  <AreaChart 
                    data={[
                      { rpm: 2700, temp: 172, maxLimit: 300 },
                      { rpm: 3000, temp: 180, maxLimit: 300 },
                      { rpm: 3300, temp: 188, maxLimit: 300 },
                      { rpm: 3510, temp: Math.round(180 + 18 * Math.pow(config.vfdSpeedHz / 58.5, 2)), maxLimit: 300 },
                      { rpm: 3750, temp: 218, maxLimit: 300 },
                      { rpm: 3900, temp: 236, maxLimit: 300 },
                    ]} 
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="rpm" stroke="#64748b" tick={{ fontSize: 11 }} label={{ value: 'Motor RPM', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[140, 320]} label={{ value: 'Temp (°F)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area type="monotone" dataKey="temp" name="Calculated Stator Winding Temp (°F)" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.2} strokeWidth={2} />
                    <Line type="monotone" dataKey="maxLimit" name="Class H Insulation Limit (300°F)" stroke="#ef4444" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
