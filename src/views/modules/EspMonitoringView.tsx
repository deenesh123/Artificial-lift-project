import React, { useState, useMemo } from 'react';
import { 
  Activity, 
  Gauge, 
  Zap, 
  AlertTriangle, 
  CheckCircle2, 
  Sliders, 
  RefreshCw, 
  Layers, 
  FileText, 
  Plus, 
  Download, 
  Clock, 
  HelpCircle, 
  Calculator,
  ChevronRight,
  TrendingUp,
  Cpu
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
  ReferenceArea 
} from 'recharts';
import { StorageService } from '../../services/storageService';
import { 
  PUMP_HQ_MULTI_FREQ, 
  PUMP_BHP_CURVES, 
  IPR_DRAWDOWN_DATA, 
  PUMP_TORNADO_DATA 
} from '../../data/cableShopData';
import { EspSizingRequest } from '../../types';

export const EspMonitoringView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'health-check' | 'asset-performance' | 'sizing-design' | 'bom'>('health-check');
  const [selectedHz, setSelectedHz] = useState<number>(58.5);
  const [selectedWellId, setSelectedWellId] = useState<string>('ALS-DEL-ESP-104');
  const [notice, setNotice] = useState<string | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);
  const selectedWell = wells.find(w => w.id === selectedWellId) || wells[0];

  // Sizing Request State (Slide 23)
  const [sizingRequests, setSizingRequests] = useState<EspSizingRequest[]>(() => StorageService.getSizingRequests());
  const [sizingForm, setSizingForm] = useState({
    designRateStbd: 2450,
    frequencyHz: 60.0,
    whpPsig: 250,
    tdhFt: 6200,
    motorLoadHp: 218,
    pumpSpeedRpm: 3500,
    fluidLevelFt: 4200,
    intakePressurePsig: 840,
    pumpDepthFt: 9800,
    dischargePressurePsig: 2950,
    mixtureGradientPsiFt: 0.385,
    separationEfficiencyPct: 94,
    oilGravityApi: 41.2,
    waterSpecificGravity: 1.08,
    gasSpecificGravity: 0.78,
    bubblePointPressurePsig: 2150,
    watercutPct: 59.8,
    gorScfStb: 650,
    reservoirTempF: 210,
    wellTempF: 118,
    bottomholeTempF: 220,
  });

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const handleCreateSizingAFE = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: EspSizingRequest = {
      id: `SIZ-${Date.now().toString().slice(-4)}`,
      wellId: selectedWell.id,
      wellName: `${selectedWell.wellCode || selectedWell.id} (${selectedWell.name})`,
      requestDate: new Date().toISOString().slice(0, 10),
      status: 'Submitted',
      afeNumber: `AFE-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      ...sizingForm,
      recommendedPumpSeries: sizingForm.designRateStbd > 3000 ? 'Reda Maximus 675 Series' : 'Reda Maximus 538 Series',
      recommendedStages: Math.round(sizingForm.tdhFt / 34),
      recommendedMotorHp: Math.round(sizingForm.motorLoadHp * 1.2),
    };
    const updated = StorageService.addSizingRequest(newReq);
    setSizingRequests(updated);
    showToast(`Created AFE ${newReq.afeNumber} for ${newReq.recommendedPumpSeries} (${newReq.recommendedStages} stages).`);
  };

  // Depth pressure gradient data (Slide 28)
  const pressureGradientData = [
    { depthFt: 0, tubingPressure: 250, casingPressure: 150 },
    { depthFt: 2000, tubingPressure: 950, casingPressure: 190 },
    { depthFt: 4000, tubingPressure: 1680, casingPressure: 220 },
    { depthFt: 6000, tubingPressure: 2420, casingPressure: 260 },
    { depthFt: 8000, tubingPressure: 3150, casingPressure: 310 },
    { depthFt: 9800, tubingPressure: 3820, intakePressure: 840, casingPressure: 360 }, // ESP setting depth
    { depthFt: 11450, tubingPressure: 4420, casingPressure: 410 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{notice}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              ESP Engineering &amp; Hydraulic Performance Cockpit
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              DYNAMIC AFFINITY MODEL
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Multi-frequency H-Q pump curves, BHP operating limits, Vogel IPR drawdown, and ESP sizing request workflow.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">Select Asset:</span>
            <select
              value={selectedWell.id}
              onChange={(e) => setSelectedWellId(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-cyan-300 font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              {wells.map(w => (
                <option key={w.id} value={w.id}>
                  {w.wellCode || w.id} — {w.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">Operating Speed:</span>
            <select
              value={selectedHz}
              onChange={(e) => setSelectedHz(Number(e.target.value))}
              className="bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold text-xs rounded-lg px-2.5 py-1.5"
            >
              <option value={35.0}>35.0 Hz</option>
              <option value={45.0}>45.0 Hz</option>
              <option value={50.0}>50.0 Hz</option>
              <option value={55.0}>55.0 Hz</option>
              <option value={58.5}>58.5 Hz (Nominal)</option>
              <option value={60.0}>60.0 Hz</option>
              <option value={65.0}>65.0 Hz</option>
              <option value={70.0}>70.0 Hz</option>
              <option value={75.0}>75.0 Hz</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('health-check')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'health-check' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Pump Health Check (Slide 28)</span>
        </button>

        <button
          onClick={() => setActiveTab('asset-performance')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'asset-performance' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>Asset Performance &amp; Tornado Chart (Slide 29)</span>
        </button>

        <button
          onClick={() => setActiveTab('sizing-design')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'sizing-design' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>ESP Sizing &amp; Design Request (Slide 23)</span>
          <span className="px-1.5 py-0.2 rounded text-[10px] bg-cyan-950 text-cyan-300 font-mono">AFE Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('bom')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
            activeTab === 'bom' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Downhole Assembly Specifications</span>
        </button>
      </div>

      {/* TAB 1: Pump Health Check (Slide 28) */}
      {activeTab === 'health-check' && (
        <div className="space-y-6">
          {/* Top 5 KPI Callouts (Slide 28 Header Banner) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">HYDRAULIC EFFICIENCY</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">86.5%</span>
              <span className="text-[10px] text-emerald-500 font-mono">Optimal BEP Range</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">HEAD PER STAGE</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">34.1 ft</span>
              <span className="text-[10px] text-slate-500 font-mono">182 Active Stages</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">STAGE COUNT</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">182</span>
              <span className="text-[10px] text-slate-500 font-mono">Mixed Flow Ni-Resist</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">INTAKE PRESSURE</span>
              <span className="text-2xl font-bold font-mono text-purple-400 mt-1 block">{selectedWell.intakePressurePsi} psi</span>
              <span className="text-[10px] text-purple-400 font-mono">Above Bubble Point</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-center">
              <span className="text-[11px] text-slate-400 block font-mono">PRESSURE GRADIENT</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">0.894 psi/ft</span>
              <span className="text-[10px] text-slate-500 font-mono">Composite Fluid Mix</span>
            </div>
          </div>

          {/* 4 Quadrant Engineering Charts (Slide 28) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Multi-Frequency H-Q Pump Curves (35Hz to 75Hz) */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Pump Curves: {selectedWell.wellCode || selectedWell.id}
                  </h3>
                  <p className="text-xs text-slate-400">Multi-frequency Head vs Flowrate with Best Efficiency Point (BEP).</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold">Active: {selectedHz} Hz</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PUMP_HQ_MULTI_FREQ} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="flowBpd" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Gross Liquid (BFPD)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Head (ft)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="hz35" name="35 Hz" stroke="#475569" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="hz45" name="45 Hz" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="hz50" name="50 Hz" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="hz60" name="60 Hz (BEP)" stroke="#10b981" strokeWidth={2.5} dot />
                    <Line type="monotone" dataKey="hz65" name="65 Hz" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="hz75" name="75 Hz" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Pressure Gradient Curve */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Pressure Gradient: {selectedWell.wellCode || selectedWell.id}
                  </h3>
                  <p className="text-xs text-slate-400">True vertical depth vs hydrostatic tubing and casing pressure profile.</p>
                </div>
                <span className="text-xs font-mono text-purple-400 font-semibold">ESP Setting: 9,800 ft</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={pressureGradientData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="depthFt" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Depth (ft)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Pressure (psi)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="tubingPressure" name="Tubing Fluid Column (psi)" stroke="#06b6d4" strokeWidth={2} dot />
                    <Line type="monotone" dataKey="casingPressure" name="Casing Gas Head (psi)" stroke="#a855f7" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Break Horsepower (BHP) Curves */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Break Horsepower (BHP): {selectedWell.wellCode || selectedWell.id}
                  </h3>
                  <p className="text-xs text-slate-400">Shaft loading requirements vs gross flow across drive frequencies.</p>
                </div>
                <span className="text-xs font-mono text-amber-400 font-semibold">Motor Rating: 240 HP</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PUMP_BHP_CURVES} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="flowBpd" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Gross Liquid (BFPD)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Power (HP)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} domain={[0, 480]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="hz45" name="45 Hz" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="hz55" name="55 Hz" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="hz60" name="60 Hz (BEP)" stroke="#10b981" strokeWidth={2.5} dot />
                    <Line type="monotone" dataKey="hz70" name="70 Hz" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: IPR Drawdown Curve */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    IPR Drawdown Curve: {selectedWell.wellCode || selectedWell.id}
                  </h3>
                  <p className="text-xs text-slate-400">Vogel reservoir inflow performance vs bottomhole flowing pressure (BHP).</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">AOF: 3,550 BFPD</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={IPR_DRAWDOWN_DATA} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="liquidRate" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Liquid Flowrate (BPD)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'P_wf (psi)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="bottomholePressure" name="Inflow Performance (IPR)" stroke="#22d3ee" strokeWidth={2.5} dot />
                    <Line type="monotone" dataKey="operatingPoint" name="Current Operating Drawdown" stroke="#f43f5e" strokeWidth={0} dot={{ r: 6, fill: '#f43f5e' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Asset Performance & Tornado Chart (Slide 29) */}
      {activeTab === 'asset-performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 4 cols: Efficiency & Health Dials (Slide 29) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Efficiency Dial */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                  ESP Hydraulic Efficiency
                </span>
                <div className="relative w-44 h-32 flex items-center justify-center">
                  <svg className="w-44 h-36 -rotate-180" viewBox="0 0 100 60">
                    <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                    <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#10b981" strokeWidth="10" strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - 0.815)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute top-12 flex flex-col items-center">
                    <span className="text-3xl font-extrabold font-mono text-emerald-400 tracking-tight">81.5%</span>
                    <span className="text-[11px] font-mono text-slate-400">Operating BEP</span>
                  </div>
                </div>
                <div className="w-full flex justify-between text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-2.5 mt-2">
                  <span>Min: 30%</span>
                  <span>Rated: 70%</span>
                  <span>Max: 100%</span>
                </div>
              </div>

              {/* Health Score Dial */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col items-center justify-center text-center shadow-lg">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                  Composite Pump Health Score
                </span>
                <div className="relative w-44 h-32 flex items-center justify-center">
                  <svg className="w-44 h-36 -rotate-180" viewBox="0 0 100 60">
                    <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" />
                    <path d="M 12 50 A 38 38 0 0 1 88 50" fill="none" stroke="#06b6d4" strokeWidth="10" strokeDasharray="119.4" strokeDashoffset={119.4 * (1 - 0.869)} strokeLinecap="round" />
                  </svg>
                  <div className="absolute top-12 flex flex-col items-center">
                    <span className="text-3xl font-extrabold font-mono text-cyan-400 tracking-tight">86.9</span>
                    <span className="text-[11px] font-mono text-slate-400">Class A Asset</span>
                  </div>
                </div>
                <div className="w-full flex justify-between text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-2.5 mt-2">
                  <span>Critical: 30</span>
                  <span>Warning: 70</span>
                  <span>Nominal: 100</span>
                </div>
              </div>
            </div>

            {/* Right 8 cols: Pump Tornado Chart (Head vs Flowrate for 40-63 Hz) (Slide 29) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Pump Tornado Chart (Last 24 Hours)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hydraulic operating envelope across frequency sweeps: 40 Hz, 45 Hz, 50 Hz, 55 Hz, 60 Hz, 63 Hz.
                  </p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold">DEMO-PUMP-001</span>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={PUMP_TORNADO_DATA} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="flowBpd" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Flowrate (BPD)', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Head (PSI)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="hz40" name="40 Hz" stroke="#38bdf8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hz45" name="45 Hz" stroke="#22d3ee" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hz50" name="50 Hz" stroke="#34d399" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hz55" name="55 Hz" stroke="#fbbf24" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="hz60" name="60 Hz" stroke="#f43f5e" strokeWidth={2.5} dot={false} />
                    <Line type="monotone" dataKey="hz63" name="63 Hz" stroke="#e879f9" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESP Sizing & Design Request Form (Slide 23) */}
      {activeTab === 'sizing-design' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div>
                <h3 className="text-base font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-cyan-400" />
                  ESP Sizing Request &amp; Design Authorization Form
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Input reservoir, fluid PVT, and design targets to compute total dynamic head, stage count, and motor rating.
                </p>
              </div>

              <span className="px-3 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono text-xs font-semibold">
                Design Mode: Reda / Schlumberger Maximus
              </span>
            </div>

            <form onSubmit={handleCreateSizingAFE} className="space-y-6">
              {/* Group 1: Design Parameters (Slide 23) */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-3 border-b border-slate-800/80 pb-1">
                  1. Target Production &amp; Operating Conditions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Design Rate (STB/d):</label>
                    <input
                      type="number"
                      value={sizingForm.designRateStbd}
                      onChange={(e) => setSizingForm({ ...sizingForm, designRateStbd: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Target Frequency (Hz):</label>
                    <input
                      type="number"
                      step="0.5"
                      value={sizingForm.frequencyHz}
                      onChange={(e) => setSizingForm({ ...sizingForm, frequencyHz: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Well Head Pressure (psig):</label>
                    <input
                      type="number"
                      value={sizingForm.whpPsig}
                      onChange={(e) => setSizingForm({ ...sizingForm, whpPsig: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Total Dynamic Head (ft):</label>
                    <input
                      type="number"
                      value={sizingForm.tdhFt}
                      onChange={(e) => setSizingForm({ ...sizingForm, tdhFt: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-300 font-bold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Total Motor Load (hp):</label>
                    <input
                      type="number"
                      value={sizingForm.motorLoadHp}
                      onChange={(e) => setSizingForm({ ...sizingForm, motorLoadHp: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Pump Speed (rpm):</label>
                    <input
                      type="number"
                      value={sizingForm.pumpSpeedRpm}
                      onChange={(e) => setSizingForm({ ...sizingForm, pumpSpeedRpm: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Fluid Level (ft):</label>
                    <input
                      type="number"
                      value={sizingForm.fluidLevelFt}
                      onChange={(e) => setSizingForm({ ...sizingForm, fluidLevelFt: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Intake Pressure (psig):</label>
                    <input
                      type="number"
                      value={sizingForm.intakePressurePsig}
                      onChange={(e) => setSizingForm({ ...sizingForm, intakePressurePsig: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Pump Depth (ft):</label>
                    <input
                      type="number"
                      value={sizingForm.pumpDepthFt}
                      onChange={(e) => setSizingForm({ ...sizingForm, pumpDepthFt: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Discharge Pressure (psig):</label>
                    <input
                      type="number"
                      value={sizingForm.dischargePressurePsig}
                      onChange={(e) => setSizingForm({ ...sizingForm, dischargePressurePsig: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Mixture Gradient (psi/ft):</label>
                    <input
                      type="number"
                      step="0.001"
                      value={sizingForm.mixtureGradientPsiFt}
                      onChange={(e) => setSizingForm({ ...sizingForm, mixtureGradientPsiFt: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-semibold focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Separation Efficiency (%):</label>
                    <input
                      type="number"
                      value={sizingForm.separationEfficiencyPct}
                      onChange={(e) => setSizingForm({ ...sizingForm, separationEfficiencyPct: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-semibold focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Fluid Properties PVT (Slide 23) */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-3 border-b border-slate-800/80 pb-1">
                  2. Fluids &amp; PVT Parameters
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Oil Gravity (°API):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sizingForm.oilGravityApi}
                      onChange={(e) => setSizingForm({ ...sizingForm, oilGravityApi: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Water Specific Gravity:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sizingForm.waterSpecificGravity}
                      onChange={(e) => setSizingForm({ ...sizingForm, waterSpecificGravity: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Gas Specific Gravity:</label>
                    <input
                      type="number"
                      step="0.01"
                      value={sizingForm.gasSpecificGravity}
                      onChange={(e) => setSizingForm({ ...sizingForm, gasSpecificGravity: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bubble Point (psig):</label>
                    <input
                      type="number"
                      value={sizingForm.bubblePointPressurePsig}
                      onChange={(e) => setSizingForm({ ...sizingForm, bubblePointPressurePsig: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Watercut (%):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={sizingForm.watercutPct}
                      onChange={(e) => setSizingForm({ ...sizingForm, watercutPct: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">GOR (SCF/STB):</label>
                    <input
                      type="number"
                      value={sizingForm.gorScfStb}
                      onChange={(e) => setSizingForm({ ...sizingForm, gorScfStb: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Reservoir Temperature (Slide 23) */}
              <div>
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono mb-3 border-b border-slate-800/80 pb-1">
                  3. Thermal Regime &amp; Wellbore Temperatures
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
                  <div>
                    <label className="text-slate-400 block mb-1">Reservoir Temperature (°F):</label>
                    <input
                      type="number"
                      value={sizingForm.reservoirTempF}
                      onChange={(e) => setSizingForm({ ...sizingForm, reservoirTempF: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Wellhead Temperature (°F):</label>
                    <input
                      type="number"
                      value={sizingForm.wellTempF}
                      onChange={(e) => setSizingForm({ ...sizingForm, wellTempF: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="text-slate-400 block mb-1">Bottomhole Temperature (°F):</label>
                    <input
                      type="number"
                      value={sizingForm.bottomholeTempF}
                      onChange={(e) => setSizingForm({ ...sizingForm, bottomholeTempF: Number(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-rose-300 font-semibold focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <span className="text-xs font-mono text-slate-400">
                  Calculated Stages: <span className="text-cyan-400 font-bold">{Math.round(sizingForm.tdhFt / 34)} Stages</span> · Motor: <span className="text-amber-400 font-bold">{Math.round(sizingForm.motorLoadHp * 1.2)} HP</span>
                </span>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider font-mono shadow-lg transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Submit Sizing Request &amp; Generate AFE</span>
                </button>
              </div>
            </form>
          </div>

          {/* Historical Sizing Requests & Draft AFEs Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Sizing Request Records &amp; Approved AFEs
                </h4>
                <p className="text-xs text-slate-400">Completed engineering simulations and authorized equipment work orders.</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">{sizingRequests.length} Requests</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">AFE Number</th>
                    <th className="px-4 py-2.5">Well Name</th>
                    <th className="px-4 py-2.5 text-right">Target Rate</th>
                    <th className="px-4 py-2.5 text-right">TDH (ft)</th>
                    <th className="px-4 py-2.5">Recommended Pump</th>
                    <th className="px-4 py-2.5 text-center">Stages</th>
                    <th className="px-4 py-2.5 text-right">Motor HP</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                    <th className="px-4 py-2.5 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {sizingRequests.map(req => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-cyan-300">{req.afeNumber || req.id}</td>
                      <td className="px-4 py-2.5 font-sans font-medium text-white">{req.wellName}</td>
                      <td className="px-4 py-2.5 text-right">{req.designRateStbd.toLocaleString()} STB/d</td>
                      <td className="px-4 py-2.5 text-right">{req.tdhFt.toLocaleString()} ft</td>
                      <td className="px-4 py-2.5 text-amber-300 font-sans">{req.recommendedPumpSeries}</td>
                      <td className="px-4 py-2.5 text-center font-bold text-white">{req.recommendedStages}</td>
                      <td className="px-4 py-2.5 text-right text-emerald-400 font-bold">{req.recommendedMotorHp} HP</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right text-slate-400">{req.requestDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Downhole BOM Assembly Specifications */}
      {activeTab === 'bom' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Downhole ESP Assembly BOM &amp; Metallurgy Catalog
            </h4>
            <p className="text-xs text-slate-400">Deployed downhole component assembly catalog, serial tracking, and material specifications.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Sub-Assembly</th>
                  <th className="px-4 py-2.5">Part Model</th>
                  <th className="px-4 py-2.5">Metallurgy / Spec</th>
                  <th className="px-4 py-2.5 text-right">Rating</th>
                  <th className="px-4 py-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-white">Centrifugal Pump</td>
                  <td className="px-4 py-2.5 text-cyan-400">Maximus 538 Series / 182-Stg</td>
                  <td className="px-4 py-2.5">Ni-Resist Type 1 Impellers · Tungsten Carbide Bearings</td>
                  <td className="px-4 py-2.5 text-right text-white">3,500 BFPD / 6,500 ft</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">Operating</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-white">Rotary Gas Separator</td>
                  <td className="px-4 py-2.5 text-cyan-400">Vortex-V 538 Series</td>
                  <td className="px-4 py-2.5">13Cr Chrome Alloy · Hardened Inducer</td>
                  <td className="px-4 py-2.5 text-right text-white">92% Separation Efficiency</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">Operating</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-white">Seal / Protector Chamber</td>
                  <td className="px-4 py-2.5 text-cyan-400">Dual Elastomer Bag + Labyrinth</td>
                  <td className="px-4 py-2.5">Aflas Elastomer · High-Viscosity Dielectric Oil</td>
                  <td className="px-4 py-2.5 text-right text-white">12,000 lbs Thrust Rating</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">Operating</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-white">Induction Motor</td>
                  <td className="px-4 py-2.5 text-cyan-400">Dominator 562 Series 240HP</td>
                  <td className="px-4 py-2.5">Class H High-Temp Polyimide Stator Insulation</td>
                  <td className="px-4 py-2.5 text-right text-white">3,850 V / 48 A / 240 HP</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">Operating</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-sans font-medium text-white">Downhole Sensor (Phoenix)</td>
                  <td className="px-4 py-2.5 text-cyan-400">Phoenix Multi-Gauge Mk-IV</td>
                  <td className="px-4 py-2.5">Inconel 718 Pressure Enclosure</td>
                  <td className="px-4 py-2.5 text-right text-white">10,000 psi / 350 °F</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">Operating</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
