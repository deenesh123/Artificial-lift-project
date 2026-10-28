import React, { useState, useEffect, useMemo } from 'react';
import { 
  Workflow, 
  Sliders, 
  RefreshCw, 
  Layers, 
  Compass, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Save, 
  RotateCcw, 
  Cpu, 
  Gauge, 
  Zap, 
  Play, 
  HelpCircle, 
  ChevronRight,
  TrendingUp,
  Activity
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceDot } from 'recharts';
import { DigitalTwinModelConfig } from '../../types';
import { DigitalTwinService, DEFAULT_TWIN_CONFIG } from '../../services/digitalTwinService';
import { StorageService } from '../../services/storageService';

export const DigitalTwinManagementView: React.FC = () => {
  const wells = useMemo(() => StorageService.getWells(), []);
  const [selectedWellId, setSelectedWellId] = useState<string>('ALS-DEL-ESP-104');
  const [config, setConfig] = useState<DigitalTwinModelConfig>(() => DigitalTwinService.getConfig('ALS-DEL-ESP-104'));
  const [activeScenario, setActiveScenario] = useState<'baseline' | 'speed_ramp' | 'gas_slug' | 'water_breakthrough'>('baseline');
  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Sync config when well selection changes
  useEffect(() => {
    setConfig(DigitalTwinService.getConfig(selectedWellId));
    setActiveScenario('baseline');
  }, [selectedWellId]);

  // Handle Scenario Overrides
  const activeSimConfig = useMemo(() => {
    const base = { ...config };
    if (activeScenario === 'speed_ramp') {
      base.vfdSpeedHz = Math.min(65, base.vfdSpeedHz + 4.5);
    } else if (activeScenario === 'gas_slug') {
      base.gasOilRatioScfBbl = base.gasOilRatioScfBbl * 1.8;
      base.casingPressurePsi = base.casingPressurePsi + 80;
    } else if (activeScenario === 'water_breakthrough') {
      base.waterCutPct = Math.min(95, base.waterCutPct + 25);
    }
    return base;
  }, [config, activeScenario]);

  // Dynamic nodal curves based on solver
  const nodalData = useMemo(() => {
    return DigitalTwinService.getNodalCurveData(activeSimConfig);
  }, [activeSimConfig]);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    DigitalTwinService.saveConfig({ ...config, updatedAt: new Date().toISOString() });
    showToast(`Physics model calibrated and saved for ${selectedWellId}.`);
  };

  const handleReset = () => {
    const def = DigitalTwinService.resetConfig(selectedWellId);
    setConfig(def);
    setActiveScenario('baseline');
    showToast(`Reset physics calibration to field benchmark defaults.`);
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Digital_Twin_Calibration_${config.wellId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported Digital Twin Physics Model parameters to JSON.');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Workflow className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Digital Twin Physics & Reservoir Calibration
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Configure multiphase inflow performance relationships (IPR), vertical lift performance (VLP), and downhole hydraulic solvers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Well Asset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-mono">Calibrating Well:</span>
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

          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Model</span>
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>
        </div>
      </div>

      {/* Main Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Calibration Form (7 cols) */}
        <form onSubmit={handleSaveConfig} className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Reservoir & ESP Hydraulic Parameters</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">
              Last saved: {new Date(config.updatedAt).toLocaleTimeString()}
            </span>
          </div>

          {/* Reservoir Inflow Section */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wide flex items-center gap-1">
              <span>1. Reservoir Inflow & Fluid Characteristics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Static Pres. (Pr, psi)</label>
                <input
                  type="number"
                  value={config.resPressurePsi}
                  onChange={(e) => setConfig({ ...config, resPressurePsi: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Productivity Index (PI)</label>
                <input
                  type="number"
                  step="0.05"
                  value={config.productivityIndex}
                  onChange={(e) => setConfig({ ...config, productivityIndex: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Water Cut (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.waterCutPct}
                  onChange={(e) => setConfig({ ...config, waterCutPct: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Gas-Oil Ratio (scf/bbl)</label>
                <input
                  type="number"
                  value={config.gasOilRatioScfBbl}
                  onChange={(e) => setConfig({ ...config, gasOilRatioScfBbl: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">API Gravity (°API)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.fluidGravityApi}
                  onChange={(e) => setConfig({ ...config, fluidGravityApi: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Casing Pressure (psi)</label>
                <input
                  type="number"
                  value={config.casingPressurePsi}
                  onChange={(e) => setConfig({ ...config, casingPressurePsi: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* ESP Artificial Lift Section */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="text-xs font-bold text-cyan-400 font-mono uppercase tracking-wide flex items-center gap-1">
              <span>2. Downhole ESP Configuration</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div>
                <label className="block text-slate-400 mb-1">Pump Stages</label>
                <input
                  type="number"
                  value={config.pumpStages}
                  onChange={(e) => setConfig({ ...config, pumpStages: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pump Depth (ft)</label>
                <input
                  type="number"
                  value={config.espDepthFt}
                  onChange={(e) => setConfig({ ...config, espDepthFt: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Motor Rating (HP)</label>
                <input
                  type="number"
                  value={config.motorRatingHp}
                  onChange={(e) => setConfig({ ...config, motorRatingHp: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">VFD Base Speed (Hz)</label>
                <input
                  type="number"
                  step="0.1"
                  value={config.vfdSpeedHz}
                  onChange={(e) => setConfig({ ...config, vfdSpeedHz: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-400 font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Surface Choke (/64")</label>
                <input
                  type="number"
                  value={config.chokeSize64ths}
                  onChange={(e) => setConfig({ ...config, chokeSize64ths: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Multiphase Solver</label>
                <select
                  value={config.solverMethod}
                  onChange={(e) => setConfig({ ...config, solverMethod: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                >
                  <option value="Vogel-BeggsBrill">Vogel - Beggs & Brill</option>
                  <option value="Darcy-HagedornBrown">Darcy - Hagedorn & Brown</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <span className="text-xs text-slate-400 font-mono">
              Auto-solves bottomhole flowing pressure ($P_w_f$) and nodal lift point.
            </span>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-950 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Recalibrate Model</span>
            </button>
          </div>
        </form>

        {/* Right: What-If Sandbox & Nodal Curve Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* What-If Sandbox Controller */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>What-If Operational Scenario Sandbox</span>
              </h4>
              <span className="text-[10px] text-cyan-400 font-mono">Interactive</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setActiveScenario('baseline')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeScenario === 'baseline' 
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold">1. Baseline Normal</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Operating at steady calibrated setpoints.</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveScenario('speed_ramp')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeScenario === 'speed_ramp' 
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-amber-300">2. VFD Speed Trim (+4.5 Hz)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">Increases drawdown & production rate.</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveScenario('gas_slug')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeScenario === 'gas_slug' 
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-rose-300">3. Gas Slug Inflow</div>
                <div className="text-[10px] text-slate-400 mt-0.5">GOR spikes 80%, simulated intake gas lock.</div>
              </button>

              <button
                type="button"
                onClick={() => setActiveScenario('water_breakthrough')}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  activeScenario === 'water_breakthrough' 
                    ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-indigo-300">4. Water Breakthrough</div>
                <div className="text-[10px] text-slate-400 mt-0.5">+25% water cut increases hydrostatic head.</div>
              </button>
            </div>
          </div>

          {/* Dynamic Nodal Curve Chart */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Solved Nodal Inflow vs Lift Curves
                </h4>
                <div className="text-[11px] text-slate-400 font-mono">
                  Operating Point: <span className="text-emerald-400 font-bold">{nodalData.operatingFlowRate} BPD</span> @ <span className="text-cyan-400 font-bold">{nodalData.operatingPwf} psi</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                {activeSimConfig.solverMethod}
              </span>
            </div>

            <div className="h-56 w-full bg-slate-950 rounded-lg p-2 border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={nodalData.points} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="flowRateBpd" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Flow (BPD)', position: 'insideBottomRight', offset: -5, fontSize: 10, fill: '#64748b' }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 4200]} label={{ value: 'Pwf (psi)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                  <Line type="monotone" dataKey="iprPwfPsi" name="IPR (Reservoir Inflow)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="vlpPwfPsi" name="VLP (Tubing + ESP Lift)" stroke="#ec4899" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-400">
              <div>
                <span>RESERVOIR DRAWDOWN:</span>
                <span className="text-white font-bold block text-xs">
                  {activeSimConfig.resPressurePsi - nodalData.operatingPwf} psi
                </span>
              </div>
              <div>
                <span>HYDRAULIC EFFICIENCY:</span>
                <span className="text-emerald-400 font-bold block text-xs">
                  {Math.round(74 * (activeSimConfig.vfdSpeedHz / 58.5))}% BEP Match
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
