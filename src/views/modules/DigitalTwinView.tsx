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
  Settings,
  Flame,
  Info
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
import { DigitalTwinModelConfig, TelemetryPoint, WellAsset } from '../../types';
import { DigitalTwinService, TwinComponentTelemetry } from '../../services/digitalTwinService';
import { StorageService } from '../../services/storageService';
import { ScadaService } from '../../services/scadaService';

interface DigitalTwinViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (assetId: string | null) => void;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  selectedAssetId: controlledAssetId,
  onSelectAssetId
}) => {
  const wells = useMemo(() => StorageService.getWells(), []);
  const [selectedWellId, setSelectedWellId] = useState<string>(controlledAssetId || 'ALS-DEL-ESP-104');
  const [activeSchematicView, setActiveSchematicView] = useState<'downhole-wellbore' | 'surface-wellhead'>('downhole-wellbore');
  const [config, setConfig] = useState<DigitalTwinModelConfig>(() => DigitalTwinService.getConfig(selectedWellId));
  const [activeComponentId, setActiveComponentId] = useState<string>('comp-pump');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [analyticsTab, setAnalyticsTab] = useState<'nodal' | 'gradient' | 'trend' | 'thermal'>('nodal');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Sync selected well if controlled from left-hand asset selector
  useEffect(() => {
    if (controlledAssetId) {
      setSelectedWellId(controlledAssetId);
    }
  }, [controlledAssetId]);

  const selectedWell: WellAsset = useMemo(() => {
    return wells.find(w => w.id === selectedWellId || w.wellCode === selectedWellId) || wells[0];
  }, [wells, selectedWellId]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Sync config when well selection changes
  useEffect(() => {
    setConfig(DigitalTwinService.getConfig(selectedWell.id));
  }, [selectedWell.id]);

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
    return ScadaService.generateTelemetrySeries(selectedWell.id, timeRange, config.vfdSpeedHz);
  }, [selectedWell.id, timeRange, config.vfdSpeedHz]);

  // Live frequency change recalculation
  const handleFrequencyChange = (newHz: number) => {
    setConfig(prev => ({
      ...prev,
      vfdSpeedHz: newHz,
      updatedAt: new Date().toISOString()
    }));
  };

  const handleReset = () => {
    const def = DigitalTwinService.resetConfig(selectedWell.id);
    setConfig(def);
    showToast('Reset digital twin to baseline nominal operating frequency (58.5 Hz).');
  };

  // Calculated dynamic operating parameters
  const solvedFlowBpd = Math.round(2450 * (config.vfdSpeedHz / 58.5));
  const intakePressurePsi = Math.max(250, Math.round(config.resPressurePsi - solvedFlowBpd / config.productivityIndex));
  const dischargePressurePsi = Math.round(2950 * Math.pow(config.vfdSpeedHz / 58.5, 1.8));
  const motorTempF = Math.round((180 + 18 * Math.pow(config.vfdSpeedHz / 58.5, 2)) * 10) / 10;
  const motorCurrentA = Math.round(52.4 * Math.pow(config.vfdSpeedHz / 58.5, 1.5) * 10) / 10;
  const thpPsi = Math.round(245 * (solvedFlowBpd / 2450));
  const flowlinePsi = Math.round(115.6 * (solvedFlowBpd / 2450));

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {toastMsg && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <Workflow className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              Digital Twin Equipment Architecture &amp; Physics Solver
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PHYSICS SOLVER ACTIVE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time hydrodynamic and thermodynamic digital twin model for <strong className="text-cyan-300">{selectedWell.wellCode || selectedWell.id}</strong> ({selectedWell.name}).
          </p>
        </div>

        {/* Well Asset Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Asset:</span>
          <select
            value={selectedWell.id}
            onChange={(e) => {
              setSelectedWellId(e.target.value);
              if (onSelectAssetId) onSelectAssetId(e.target.value);
              showToast(`Loaded digital twin model for ${e.target.value}.`);
            }}
            className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
          >
            {wells.map(w => (
              <option key={w.id} value={w.id}>
                {w.wellCode || w.id} — {w.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dynamic VFD Speed Modulation Slider & Key Solved Parameters */}
      <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-4 shadow-lg shadow-cyan-950/20 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Live VFD Drive Speed Modulation (Dynamic Affinity Law Recalculation)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Current Speed:</span>
            <span className="text-cyan-400 font-bold text-sm">{config.vfdSpeedHz.toFixed(1)} Hz</span>
            <button
              onClick={handleReset}
              className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono pt-1">
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">SOLVED FLOWRATE</span>
            <span className="text-emerald-400 font-bold text-sm">
              {solvedFlowBpd} <span className="text-xs font-normal text-slate-400">BPD</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">INTAKE (PIP)</span>
            <span className="text-purple-400 font-bold text-sm">
              {intakePressurePsi} <span className="text-xs font-normal text-slate-400">psi</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">DISCHARGE HEAD</span>
            <span className="text-cyan-400 font-bold text-sm">
              {dischargePressurePsi} <span className="text-xs font-normal text-slate-400">psi</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">PHASE CURRENT</span>
            <span className="text-amber-400 font-bold text-sm">
              {motorCurrentA} <span className="text-xs font-normal text-slate-400">Amps</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">STATOR TEMP</span>
            <span className="text-rose-400 font-bold text-sm">
              {motorTempF} <span className="text-xs font-normal text-slate-400">°F</span>
            </span>
          </div>
          <div className="bg-slate-950/80 p-2 rounded border border-slate-800">
            <span className="text-slate-500 block text-[10px]">MOTOR SPEED</span>
            <span className="text-white font-bold text-sm">
              {Math.round(config.vfdSpeedHz * 60)} <span className="text-xs font-normal text-slate-400">RPM</span>
            </span>
          </div>
        </div>
      </div>

      {/* Schematic Mode Selector (PART D: Downhole ESP Wellbore vs Surface Wellhead / Christmas Tree) */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveSchematicView('downhole-wellbore')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
            activeSchematicView === 'downhole-wellbore'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>1. Downhole ESP Wellbore Cross-Section</span>
        </button>

        <button
          onClick={() => setActiveSchematicView('surface-wellhead')}
          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all ${
            activeSchematicView === 'surface-wellhead'
              ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Gauge className="w-4 h-4 text-cyan-400" />
          <span>2. Surface Wellhead / Christmas Tree Schematic</span>
        </button>
      </div>

      {/* VIEW 1: DOWNHOLE ESP WELLBORE CROSS-SECTION (PART D.1) */}
      {activeSchematicView === 'downhole-wellbore' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Interactive Visual Wellbore Schematic (6 cols) */}
          <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Downhole ESP Cross-Sectional Model
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Click component to inspect</span>
            </div>

            {/* Illustrative SVG Cross-Sectional Wellbore Diagram */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="w-full text-center text-[10px] font-mono text-slate-500 mb-2">
                ILLUSTRATIVE DOWNHOLE COMPLETION SCHEMATIC (NOT TO PHYSICAL ENGINEERING SCALE)
              </div>

              <svg viewBox="0 0 460 620" className="w-full max-w-md h-auto select-none">
                {/* Geological Rock Formation Strata */}
                <rect x="10" y="20" width="130" height="580" fill="#0f172a" opacity="0.6" />
                <rect x="320" y="20" width="130" height="580" fill="#0f172a" opacity="0.6" />

                {/* Outer Casing String 5.5" */}
                <rect x="140" y="40" width="180" height="540" fill="#1e293b" stroke="#334155" strokeWidth="2" rx="4" />
                <line x1="148" y1="40" x2="148" y2="580" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 3" />
                <line x1="312" y1="40" x2="312" y2="580" stroke="#475569" strokeWidth="1.5" strokeDasharray="6 3" />

                {/* Inner Production Tubing 2-7/8" */}
                <rect x="200" y="40" width="60" height="340" fill="#090d16" stroke="#06b6d4" strokeWidth="2" />
                <text x="230" y="110" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">Tubing 2-7/8"</text>

                {/* Downhole Cable Strapped along Tubing */}
                <path d="M 268 40 L 268 470" stroke="#f59e0b" strokeWidth="3" strokeDasharray="10 4" />
                <text x="274" y="160" fill="#f59e0b" fontSize="8" fontFamily="monospace">#4 AWG Cable</text>

                {/* Surface Wellhead (0 ft) */}
                <g 
                  className="cursor-pointer group"
                  onClick={() => setActiveComponentId('comp-wellhead')}
                >
                  <rect x="170" y="15" width="120" height="28" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" rx="3" />
                  <text x="230" y="32" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    Surface Wellhead (0 ft)
                  </text>
                </g>

                {/* Pressure & Temp Callout 1: Wellhead THP */}
                <g className="cursor-pointer" onClick={() => setActiveComponentId('comp-wellhead')}>
                  <rect x="20" y="35" width="115" height="36" fill="#0f172a" stroke="#ec4899" strokeWidth="1.5" rx="4" />
                  <text x="26" y="50" fill="#ec4899" fontSize="9" fontWeight="bold" fontFamily="monospace">THP: {thpPsi} psi</text>
                  <text x="26" y="63" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Wellhead T: 118°F</text>
                  <line x1="135" y1="52" x2="170" y2="40" stroke="#ec4899" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                {/* Fluid Flow Arrows up Tubing */}
                <path d="M 230 360 L 230 330" stroke="#10b981" strokeWidth="2" markerEnd="url(#arrow)" />
                <path d="M 230 250 L 230 220" stroke="#10b981" strokeWidth="2" />
                <path d="M 230 140 L 230 110" stroke="#10b981" strokeWidth="2" />

                {/* ESP Pump Section (Depth 10,050 ft) */}
                <g 
                  className="cursor-pointer group"
                  onClick={() => setActiveComponentId('comp-pump')}
                >
                  <rect 
                    x="195" y="340" width="70" height="70" 
                    fill={activeComponentId === 'comp-pump' ? '#083344' : '#164e63'} 
                    stroke={activeComponentId === 'comp-pump' ? '#22d3ee' : '#0891b2'} 
                    strokeWidth="2.5" rx="4" 
                  />
                  <text x="230" y="365" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">ESP PUMP</text>
                  <text x="230" y="380" fill="#67e8f9" fontSize="8" fontFamily="monospace" textAnchor="middle">182 Stages</text>
                  <text x="230" y="394" fill="#a5f3fc" fontSize="8" fontFamily="monospace" textAnchor="middle">~10,050 ft</text>
                </g>

                {/* Callout 2: Pump Discharge (PDP) */}
                <g className="cursor-pointer" onClick={() => setActiveComponentId('comp-discharge')}>
                  <rect x="330" y="325" width="115" height="36" fill="#0f172a" stroke="#a855f7" strokeWidth="1.5" rx="4" />
                  <text x="336" y="340" fill="#c084fc" fontSize="9" fontWeight="bold" fontFamily="monospace">PDP: {dischargePressurePsi} psi</text>
                  <text x="336" y="353" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Head: 6,200 ft</text>
                  <line x1="330" y1="345" x2="265" y2="350" stroke="#a855f7" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                {/* Gas Separator / Intake Sub (Depth 10,180 ft) */}
                <g 
                  className="cursor-pointer group"
                  onClick={() => setActiveComponentId('comp-separator')}
                >
                  <rect 
                    x="198" y="415" width="64" height="35" 
                    fill={activeComponentId === 'comp-separator' ? '#14532d' : '#166534'} 
                    stroke={activeComponentId === 'comp-separator' ? '#4ade80' : '#22c55e'} 
                    strokeWidth="2" rx="3" 
                  />
                  <text x="230" y="430" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">GAS SEPARATOR</text>
                  <text x="230" y="442" fill="#bbf7d0" fontSize="8" fontFamily="monospace" textAnchor="middle">Intake Port (PIP)</text>
                </g>

                {/* Callout 3: Pump Intake (PIP) */}
                <g className="cursor-pointer" onClick={() => setActiveComponentId('comp-separator')}>
                  <rect x="20" y="410" width="115" height="36" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" rx="4" />
                  <text x="26" y="425" fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">PIP: {intakePressurePsi} psi</text>
                  <text x="26" y="438" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Intake T: 142.8°F</text>
                  <line x1="135" y1="428" x2="198" y2="430" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                {/* Protector / Seal Section (Depth 10,220 ft) */}
                <g 
                  className="cursor-pointer group"
                  onClick={() => setActiveComponentId('comp-protector')}
                >
                  <rect 
                    x="202" y="455" width="56" height="30" 
                    fill={activeComponentId === 'comp-protector' ? '#4c1d95' : '#5b21b6'} 
                    stroke={activeComponentId === 'comp-protector' ? '#c084fc' : '#8b5cf6'} 
                    strokeWidth="2" rx="3" 
                  />
                  <text x="230" y="470" fill="#ffffff" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">SEAL SECTION</text>
                  <text x="230" y="480" fill="#ddd6fe" fontSize="8" fontFamily="monospace" textAnchor="middle">Triple Bag Barrier</text>
                </g>

                {/* Downhole PMM Motor (Depth 10,320 ft) */}
                <g 
                  className="cursor-pointer group"
                  onClick={() => setActiveComponentId('comp-motor')}
                >
                  <rect 
                    x="196" y="490" width="68" height="55" 
                    fill={activeComponentId === 'comp-motor' ? '#7f1d1d' : '#991b1b'} 
                    stroke={activeComponentId === 'comp-motor' ? '#f87171' : '#ef4444'} 
                    strokeWidth="2.5" rx="4" 
                  />
                  <text x="230" y="510" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PMM MOTOR</text>
                  <text x="230" y="524" fill="#fca5a5" fontSize="8" fontFamily="monospace" textAnchor="middle">240 HP • 3,850V</text>
                  <text x="230" y="538" fill="#fee2e2" fontSize="8" fontFamily="monospace" textAnchor="middle">{motorCurrentA} Amps</text>
                </g>

                {/* Callout 4: Motor Stator Temp */}
                <g className="cursor-pointer" onClick={() => setActiveComponentId('comp-motor')}>
                  <rect x="330" y="495" width="115" height="36" fill="#0f172a" stroke="#f43f5e" strokeWidth="1.5" rx="4" />
                  <text x="336" y="510" fill="#fb7185" fontSize="9" fontWeight="bold" fontFamily="monospace">Motor T: {motorTempF}°F</text>
                  <text x="336" y="523" fill="#cbd5e1" fontSize="8" fontFamily="monospace">Current: {motorCurrentA} A</text>
                  <line x1="330" y1="515" x2="265" y2="515" stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                {/* Downhole Phoenix Quartz Sensor (Depth 10,380 ft) */}
                <g 
                  className="cursor-pointer group"
                  onClick={() => setActiveComponentId('comp-gauge')}
                >
                  <rect 
                    x="208" y="550" width="44" height="24" 
                    fill={activeComponentId === 'comp-gauge' ? '#042f2e' : '#115e59'} 
                    stroke={activeComponentId === 'comp-gauge' ? '#2dd4bf' : '#14b8a6'} 
                    strokeWidth="2" rx="2" 
                  />
                  <text x="230" y="563" fill="#ffffff" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">PHOENIX</text>
                  <text x="230" y="571" fill="#99f6e4" fontSize="7" fontFamily="monospace" textAnchor="middle">Gauge Sub</text>
                </g>

                {/* Perforation Zone & Inflow Arrows (10,800 - 11,450 ft) */}
                <g>
                  {/* Perforation holes */}
                  {[582, 588, 594, 600].map(y => (
                    <React.Fragment key={y}>
                      <circle cx="148" cy={y} r="2.5" fill="#f59e0b" />
                      <circle cx="312" cy={y} r="2.5" fill="#f59e0b" />
                      <line x1="120" y1={y} x2="145" y2={y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                      <line x1="340" y1={y} x2="315" y2={y} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                    </React.Fragment>
                  ))}
                  <text x="230" y="598" fill="#f59e0b" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                    PERFORATION INFLOW ZONE (~11,450 FT)
                  </text>
                </g>
              </svg>
            </div>
          </div>

          {/* Right Column: Deep Component Inspector & Engineering Diagnostics (6 cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
              {/* Component Card Header */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/50 uppercase">
                      {activeComponent.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      activeComponent.status === 'Optimal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}>
                      ● {activeComponent.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wide mt-1.5 font-sans">
                    {activeComponent.name}
                  </h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Depth: <strong className="text-white">{activeComponent.depthFt.toLocaleString()} ft</strong> • Wear Index: <strong className="text-cyan-400">{activeComponent.wearIndexPct}%</strong>
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-mono block">Component ID</span>
                  <span className="text-xs font-bold text-slate-300 font-mono">{activeComponent.id}</span>
                </div>
              </div>

              {/* Description & Engineering Specs */}
              <div className="space-y-2 text-xs font-sans">
                <div>
                  <span className="text-[10px] uppercase font-mono text-slate-500 block">Description &amp; Operation</span>
                  <p className="text-slate-300 mt-0.5 leading-relaxed">{activeComponent.description}</p>
                </div>

                <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 block font-semibold">Technical Specifications</span>
                  <p className="text-white font-mono text-xs mt-0.5">{activeComponent.specs}</p>
                </div>
              </div>

              {/* Dynamic Real-Time Component Telemetry Readouts */}
              <div className="space-y-2">
                <span className="text-[11px] uppercase font-mono text-slate-400 font-semibold block">
                  Synchronized Telemetry Parameters
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {activeComponent.metrics.map((m, idx) => (
                    <div key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block truncate">{m.label}</span>
                      <div className="text-sm font-bold text-white mt-0.5">
                        {m.value} <span className="text-[10px] text-cyan-400 font-normal">{m.unit}</span>
                      </div>
                      {m.normalMin !== undefined && m.normalMax !== undefined && (
                        <span className="text-[9px] text-slate-500 block mt-0.5">
                          Band: {m.normalMin}–{m.normalMax} {m.unit}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Equipment Switcher Buttons */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
                Select Downhole Component:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {components.filter(c => c.category === 'Downhole Lift' || c.category === 'Wellhead').map(c => (
                  <button
                    key={c.id}
                    onClick={() => setActiveComponentId(c.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      activeComponentId === c.id
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {c.name.split('(')[0].trim()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SURFACE WELLHEAD / CHRISTMAS TREE SCHEMATIC (PART D.2) */}
      {activeSchematicView === 'surface-wellhead' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Surface Christmas Tree Diagram (7 cols) */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Surface Christmas Tree &amp; Wellhead Schematic (API 6A 5K)
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Interactive Pressure Transmitters</span>
            </div>

            {/* SVG Industrial Christmas Tree Schematic */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
              <svg viewBox="0 0 520 460" className="w-full max-w-lg h-auto select-none">
                {/* Surface Ground Line */}
                <line x1="20" y1="380" x2="500" y2="380" stroke="#475569" strokeWidth="3" strokeDasharray="6 3" />
                <text x="40" y="400" fill="#64748b" fontSize="10" fontFamily="monospace">GROUND SURFACE LEVEL (0 FT)</text>

                {/* Conductor & Casing Head Housing */}
                <rect x="220" y="340" width="80" height="40" fill="#1e293b" stroke="#64748b" strokeWidth="2" />
                <text x="260" y="365" fill="#cbd5e1" fontSize="9" fontFamily="monospace" textAnchor="middle">Casing Head</text>

                {/* Tubing Head Spool */}
                <rect x="225" y="290" width="70" height="50" fill="#0f172a" stroke="#06b6d4" strokeWidth="2" />
                <text x="260" y="318" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">Tubing Spool</text>

                {/* Lower Master Valve */}
                <rect x="235" y="240" width="50" height="50" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <polygon points="245,250 275,280 275,250 245,280" fill="#10b981" />
                <text x="290" y="270" fill="#94a3b8" fontSize="8" fontFamily="monospace">Lower Master</text>

                {/* Upper Master Valve (Hydraulic ESD) */}
                <rect x="235" y="180" width="50" height="50" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <polygon points="245,190 275,220 275,190 245,220" fill="#10b981" />
                <text x="290" y="210" fill="#94a3b8" fontSize="8" fontFamily="monospace">Upper Master (SSV)</text>

                {/* Flow Cross / Tee */}
                <rect x="235" y="130" width="50" height="50" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="260" cy="155" r="8" fill="#06b6d4" />

                {/* Swab Valve & Tree Cap (Top) */}
                <rect x="240" y="80" width="40" height="50" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <rect x="235" y="60" width="50" height="20" fill="#475569" stroke="#64748b" strokeWidth="2" rx="2" />
                <text x="260" y="74" fill="#ffffff" fontSize="8" fontFamily="monospace" textAnchor="middle">Tree Cap</text>

                {/* Production Wing Valve (Right Branch) */}
                <rect x="285" y="135" width="50" height="40" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <polygon points="295,142 325,168 325,142 295,168" fill="#10b981" />
                <text x="310" y="125" fill="#94a3b8" fontSize="8" fontFamily="monospace" textAnchor="middle">Wing Valve</text>

                {/* Production Choke Valve */}
                <rect x="350" y="130" width="45" height="50" fill="#0f172a" stroke="#f59e0b" strokeWidth="2" rx="3" />
                <text x="372" y="152" fill="#f59e0b" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle">CHOKE</text>
                <text x="372" y="165" fill="#fde68a" fontSize="8" fontFamily="monospace" textAnchor="middle">32/64"</text>

                {/* Surface Flowline Outflow to Coriolis Meter */}
                <line x1="395" y1="155" x2="490" y2="155" stroke="#06b6d4" strokeWidth="4" />
                <text x="445" y="145" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">To Header →</text>

                {/* Annulus A Valve & Port (Left Branch) */}
                <line x1="225" y1="315" x2="150" y2="315" stroke="#3b82f6" strokeWidth="3" />
                <rect x="110" y="298" width="40" height="34" fill="#1e293b" stroke="#3b82f6" strokeWidth="1.5" rx="2" />
                <text x="130" y="318" fill="#60a5fa" fontSize="8" fontFamily="monospace" textAnchor="middle">Ann A</text>

                {/* Annulus B Valve & Port (Far Left Branch) */}
                <line x1="220" y1="360" x2="130" y2="360" stroke="#8b5cf6" strokeWidth="3" />
                <rect x="90" y="345" width="40" height="30" fill="#1e293b" stroke="#8b5cf6" strokeWidth="1.5" rx="2" />
                <text x="110" y="364" fill="#c084fc" fontSize="8" fontFamily="monospace" textAnchor="middle">Ann B</text>

                {/* Real-Time Surface Callout 1: Tubing Head Pressure (THP) */}
                <g>
                  <rect x="70" y="90" width="135" height="42" fill="#0f172a" stroke="#ec4899" strokeWidth="1.5" rx="4" />
                  <text x="76" y="106" fill="#ec4899" fontSize="9" fontWeight="bold" fontFamily="monospace">TUBING HEAD (THP)</text>
                  <text x="76" y="122" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">{thpPsi} psi</text>
                  <line x1="205" y1="110" x2="235" y2="150" stroke="#ec4899" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                {/* Real-Time Surface Callout 2: Flowline Pressure & Temp */}
                <g>
                  <rect x="360" y="200" width="145" height="52" fill="#0f172a" stroke="#06b6d4" strokeWidth="1.5" rx="4" />
                  <text x="366" y="216" fill="#06b6d4" fontSize="9" fontWeight="bold" fontFamily="monospace">FLOWLINE HEADER</text>
                  <text x="366" y="232" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">{flowlinePsi} psi</text>
                  <text x="366" y="244" fill="#94a3b8" fontSize="8" fontFamily="monospace">Flowline Temp: 113.8 °F</text>
                  <line x1="430" y1="200" x2="430" y2="155" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" />
                </g>

                {/* Real-Time Surface Callout 3: Annulus A Casing Pressure */}
                <g>
                  <rect x="15" y="240" width="135" height="42" fill="#0f172a" stroke="#3b82f6" strokeWidth="1.5" rx="4" />
                  <text x="21" y="256" fill="#60a5fa" fontSize="9" fontWeight="bold" fontFamily="monospace">A-ANNULUS (CASING)</text>
                  <text x="21" y="272" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">{selectedWell.aAnnulusPressureKgCm2 ? Math.round(selectedWell.aAnnulusPressureKgCm2 * 14.22) : 714} psi</text>
                  <line x1="100" y1="282" x2="110" y2="310" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
                </g>
              </svg>
            </div>
          </div>

          {/* Right Column: Surface Telemetry & Valve Status Table (5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                Surface Transmitter Telemetry Array
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Calibrated transmitters wired to Pad Bravo Solar RTU Gateway.
              </p>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tubing Head Pressure (THP)</span>
                  <span className="text-pink-400 font-bold text-base">{thpPsi} psi</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                  NORMAL
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Flowline Header Pressure</span>
                  <span className="text-cyan-400 font-bold text-base">{flowlinePsi} psi</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                  NORMAL
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">A-Annulus Casing Pressure</span>
                  <span className="text-blue-400 font-bold text-base">
                    {selectedWell.aAnnulusPressureKgCm2 ? Math.round(selectedWell.aAnnulusPressureKgCm2 * 14.22) : 714} psi
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                  SEAL OK
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">B-Annulus Intermediate Pressure</span>
                  <span className="text-purple-400 font-bold text-base">0.0 psi</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                  ISOLATED
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Flowline Surface Temperature</span>
                  <span className="text-teal-400 font-bold text-base">113.8 °F</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 text-[10px] font-bold border border-emerald-800">
                  NORMAL
                </span>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block text-[11px]">Adjustable Choke Orifice</span>
                  <span className="text-amber-400 font-bold text-base">32/64 in (50% Open)</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 text-[10px] font-bold border border-cyan-800">
                  LOCKED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Physics Nodal Analysis & Depth Gradient Charts */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setAnalyticsTab('nodal')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                analyticsTab === 'nodal' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Nodal Analysis (IPR vs VLP)
            </button>
            <button
              onClick={() => setAnalyticsTab('gradient')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                analyticsTab === 'gradient' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Wellbore Depth Gradient
            </button>
            <button
              onClick={() => setAnalyticsTab('trend')}
              className={`px-3 py-1.5 rounded-md transition-colors ${
                analyticsTab === 'trend' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Time-Series Telemetry
            </button>
          </div>

          <span className="text-xs font-mono text-cyan-400 font-semibold">
            Operating Point: {nodalData.operatingFlowRate} BPD @ {nodalData.operatingPwf} psi
          </span>
        </div>

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
              <LineChart layout="vertical" data={gradientData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  type="number" 
                  domain={[0, 4500]}
                  stroke="#38bdf8" 
                  tick={{ fontSize: 10 }} 
                  label={{ value: 'Wellbore Pressure (psi)', position: 'insideBottom', offset: -2, fill: '#38bdf8', fontSize: 10 }} 
                />
                <YAxis 
                  dataKey="depthFt" 
                  type="number" 
                  reversed={true} 
                  domain={[0, 12000]} 
                  ticks={[0, 2500, 5500, 9800, 10200, 11450]}
                  stroke="#64748b" 
                  tick={{ fontSize: 10 }} 
                  label={{ value: 'True Vertical Depth (ft TVD)', angle: -90, position: 'insideLeft', offset: 5, fill: '#94a3b8', fontSize: 10 }} 
                />
                <Tooltip 
                  formatter={(val: any, name: any) => [`${val} psi`, name]}
                  labelFormatter={(depth) => `Depth: ${depth} ft TVD`}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} 
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Line type="monotone" dataKey="pressurePsi" name="Wellbore Pressure (psi)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            ) : (
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
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
