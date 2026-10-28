import React, { useState } from 'react';
import { Activity, Gauge, Zap, AlertTriangle, CheckCircle2, Sliders, RefreshCw, Layers } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceArea } from 'recharts';

export const EspMonitoringView: React.FC = () => {
  const [selectedHz, setSelectedHz] = useState<number>(58.5);

  // Pump Head vs Capacity Curve (H-Q Curve) for 182-stage centrifugal pump
  const hqData = [
    { flowBpd: 500, headFt: 8400 * Math.pow(selectedHz / 60, 2), effPct: 42, hp: 140 },
    { flowBpd: 1000, headFt: 8100 * Math.pow(selectedHz / 60, 2), effPct: 58, hp: 165 },
    { flowBpd: 1500, headFt: 7600 * Math.pow(selectedHz / 60, 2), effPct: 69, hp: 185 },
    { flowBpd: 2000, headFt: 6950 * Math.pow(selectedHz / 60, 2), effPct: 74, hp: 205 }, // BEP ~2000-2400
    { flowBpd: 2450, headFt: 6200 * Math.pow(selectedHz / 60, 2), effPct: 72, hp: 218 }, // Current operating point
    { flowBpd: 3000, headFt: 5100 * Math.pow(selectedHz / 60, 2), effPct: 64, hp: 232 },
    { flowBpd: 3500, headFt: 3800 * Math.pow(selectedHz / 60, 2), effPct: 51, hp: 240 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              Electric Submersible Pump (ESP) Hydraulic Diagnostics
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Dynamic head-capacity performance curve, thrust bearing loading, and motor power factor monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Drive Frequency:</span>
          <select
            value={selectedHz}
            onChange={(e) => setSelectedHz(Number(e.target.value))}
            className="bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold text-xs rounded px-2.5 py-1"
          >
            <option value={50.0}>50.0 Hz</option>
            <option value={55.0}>55.0 Hz</option>
            <option value={58.5}>58.5 Hz (Active)</option>
            <option value={60.0}>60.0 Hz</option>
            <option value={62.5}>62.5 Hz</option>
          </select>
        </div>
      </div>

      {/* 4 Quick Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Operating Head</span>
          <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">6,200 ft TDH</span>
          <span className="text-[10px] text-slate-500 font-mono">182 Stages (34.1 ft/stg)</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Hydraulic Efficiency</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">72.4%</span>
          <span className="text-[10px] text-emerald-500 font-mono">Near BEP (74% Max)</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Thrust Bearing Regime</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">Balanced</span>
          <span className="text-[10px] text-slate-500 font-mono">Within Safe Recommended Range</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 block">Motor Thermal Margin</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">52 °F Margin</span>
          <span className="text-[10px] text-slate-500 font-mono">Current 198°F / Limit 250°F</span>
        </div>
      </div>

      {/* Pump Curve Chart */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-bold text-white">Head-Capacity & Efficiency Performance Curve</h4>
            <p className="text-xs text-slate-400">Cyan line represents total dynamic head; Green line represents hydraulic efficiency.</p>
          </div>
          <span className="text-xs font-mono text-cyan-400 font-semibold">Current Flow: 2,450 BFPD</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={hqData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="flowBpd" stroke="#64748B" tick={{ fontSize: 10 }} label={{ value: 'Gross Liquid Flow (BFPD)', position: 'insideBottom', offset: -4, fill: '#94A3B8', fontSize: 10 }} />
              <YAxis yAxisId="head" stroke="#06B6D4" tick={{ fontSize: 10 }} label={{ value: 'Total Dynamic Head (ft)', angle: -90, position: 'insideLeft', fill: '#06B6D4', fontSize: 10 }} />
              <YAxis yAxisId="eff" orientation="right" stroke="#10B981" tick={{ fontSize: 10 }} label={{ value: 'Efficiency %', angle: 90, position: 'insideRight', fill: '#10B981', fontSize: 10 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
              <Line yAxisId="head" type="monotone" dataKey="headFt" name="Total Head (ft)" stroke="#06B6D4" strokeWidth={2.5} dot />
              <Line yAxisId="eff" type="monotone" dataKey="effPct" name="Pump Efficiency (%)" stroke="#10B981" strokeWidth={2.5} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Downhole String Hardware BOM table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800">
          <h4 className="text-sm font-bold text-white">Downhole ESP Bill of Materials & Specifications</h4>
          <p className="text-xs text-slate-400">Deployed downhole component assembly catalog and metallurgy.</p>
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
                <td className="px-4 py-2.5 text-slate-300">ALS-538 Series 182-Stg</td>
                <td className="px-4 py-2.5 text-slate-400">Ni-Resist Type 1 Impellers / Tungsten Carbide Bushings</td>
                <td className="px-4 py-2.5 text-right text-cyan-400">3,500 BFPD Max</td>
                <td className="px-4 py-2.5 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300">Nominal</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans font-medium text-white">Gas Separator</td>
                <td className="px-4 py-2.5 text-slate-300">Vortex-AGS 400</td>
                <td className="px-4 py-2.5 text-slate-400">High-efficiency rotational separation rotor</td>
                <td className="px-4 py-2.5 text-right text-cyan-400">90% Free Gas Efficiency</td>
                <td className="px-4 py-2.5 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300">Nominal</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans font-medium text-white">Seal / Protector</td>
                <td className="px-4 py-2.5 text-slate-300">ALS Heavy-Duty Double Bag</td>
                <td className="px-4 py-2.5 text-slate-400">Aflas elastomer bladders + mechanical face seals</td>
                <td className="px-4 py-2.5 text-right text-cyan-400">12,000 lbf Thrust Capacity</td>
                <td className="px-4 py-2.5 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300">Nominal</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans font-medium text-white">Submersible Motor</td>
                <td className="px-4 py-2.5 text-slate-300">ALS-562 240HP Induction</td>
                <td className="px-4 py-2.5 text-slate-400">High-temperature synthetic dielectric oil filled</td>
                <td className="px-4 py-2.5 text-right text-cyan-400">3,850V / 52A FLA</td>
                <td className="px-4 py-2.5 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300">Nominal</span></td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-sans font-medium text-white">Downhole Cable</td>
                <td className="px-4 py-2.5 text-slate-300">#4 AWG Flat EPDM/Lead/Monel</td>
                <td className="px-4 py-2.5 text-slate-400">Lead barrier sheath against H2S gas permeation</td>
                <td className="px-4 py-2.5 text-right text-cyan-400">5 kV / 450 °F</td>
                <td className="px-4 py-2.5 text-center"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-300">Nominal</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
