import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Clock, 
  ShieldAlert, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  FileText, 
  Eye, 
  Wrench, 
  RotateCcw, 
  ChevronRight,
  HelpCircle,
  TrendingUp,
  X
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';
import { FailureIncident } from '../../types';
import { OperationsService, INITIAL_FAILURES } from '../../services/operationsService';
import { ROOT_CAUSE_PARETO } from '../../data/mockData';
import { StorageService } from '../../services/storageService';

export const FailureMonitoringView: React.FC = () => {
  const [failures, setFailures] = useState<FailureIncident[]>(() => OperationsService.getFailures());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedFailure, setSelectedFailure] = useState<FailureIncident | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingActionsTarget, setEditingActionsTarget] = useState<FailureIncident | null>(null);
  const [actionNotesInput, setActionNotesInput] = useState<string>('');
  const [actionStatusInput, setActionStatusInput] = useState<FailureIncident['resolutionStatus']>('Corrective Action Implemented');
  const [notice, setNotice] = useState<string | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Weibull cumulative survival probability curve (Days vs Survival %)
  const weibullData = [
    { days: 100, espSurvival: 99, rodSurvival: 99 },
    { days: 200, espSurvival: 96, rodSurvival: 98 },
    { days: 300, espSurvival: 91, rodSurvival: 97 },
    { days: 400, espSurvival: 82, rodSurvival: 94 },
    { days: 500, espSurvival: 69, rodSurvival: 90 }, // ESP MTBF threshold
    { days: 600, espSurvival: 52, rodSurvival: 85 },
    { days: 700, espSurvival: 38, rodSurvival: 78 },
    { days: 800, espSurvival: 24, rodSurvival: 68 }, // Rod MTBF
    { days: 900, espSurvival: 14, rodSurvival: 55 },
    { days: 1000, espSurvival: 8, rodSurvival: 42 },
  ];

  const filteredFailures = useMemo(() => {
    return failures.filter(f => {
      const matchSearch = 
        f.wellName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (f.reasonCode && f.reasonCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        f.failedComponent.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.rootCauseCategory.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'All' || f.rootCauseCategory === categoryFilter;
      const matchStatus = statusFilter === 'All' || f.resolutionStatus === statusFilter;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [failures, searchTerm, categoryFilter, statusFilter]);

  const handleUpdateCorrectiveAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActionsTarget) return;
    const updatedIncident: FailureIncident = {
      ...editingActionsTarget,
      correctiveActions: actionNotesInput,
      resolutionStatus: actionStatusInput,
      closedDate: actionStatusInput === 'Resolved' ? new Date().toISOString().slice(0, 10) : editingActionsTarget.closedDate,
    };
    const updated = OperationsService.updateFailure(updatedIncident);
    setFailures(updated);
    if (selectedFailure && selectedFailure.id === editingActionsTarget.id) {
      setSelectedFailure(updatedIncident);
    }
    showToast(`Updated RCA corrective actions for incident ${editingActionsTarget.id}.`);
    setEditingActionsTarget(null);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Well', 'LiftType', 'FailureDate', 'RunLifeDays', 'Category', 'ReasonCode', 'FailedComponent', 'EquipmentRef', 'DowntimeHours', 'DeferredBbl', 'CostImpactUSD', 'ResolutionStatus', 'RootCause', 'CorrectiveAction'];
    const rows = filteredFailures.map(f => [
      f.id,
      `"${f.wellName}"`,
      f.liftType,
      f.failureDate,
      f.runLifeDays,
      `"${f.rootCauseCategory}"`,
      f.reasonCode,
      `"${f.failedComponent}"`,
      `"${f.equipmentRef || ''}"`,
      f.downtimeHours || '',
      f.deferredProductionBbl || '',
      f.costImpactUsd,
      f.resolutionStatus,
      `"${(f.rootCauseFindings || '').replace(/"/g, '""')}"`,
      `"${(f.correctiveActions || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ALS_Failure_Analysis_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported Failure Analysis data to CSV.');
  };

  // Totals
  const totalCost = failures.reduce((sum, f) => sum + f.costImpactUsd, 0);
  const totalDeferredBbl = failures.reduce((sum, f) => sum + (f.deferredProductionBbl || 0), 0);
  const avgRunLife = Math.round(failures.reduce((sum, f) => sum + f.runLifeDays, 0) / failures.length) || 0;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{notice}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">ESP MEAN TIME TO FAILURE</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">542 Days</span>
          <span className="text-[10px] text-emerald-400 font-mono">+18% vs Permian Basin Avg</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">AVG RUN LIFE AT PULL</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{avgRunLife} Days</span>
          <span className="text-[10px] text-slate-500 font-mono">Across {failures.length} recorded pull incidents</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">YTD INTERVENTION COST</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            ${(totalCost / 1000).toFixed(0)}k
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Rig workover & teardown expenses</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">DEFERRED PRODUCTION</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
            {totalDeferredBbl.toLocaleString()} Bbl
          </span>
          <span className="text-[10px] text-rose-500 font-mono">Shut-in downtime volume</span>
        </div>
      </div>

      {/* Dual Analytical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pareto Root Cause Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Downhole Failure Root Cause Pareto
            </h3>
            <p className="text-xs text-slate-400">Classified root causes for lift failure events across Delaware & Midland basins.</p>
          </div>

          <div className="h-60 w-full bg-slate-950 p-2 rounded-lg border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ROOT_CAUSE_PARETO} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="cause" stroke="#64748b" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" domain={[0, 40]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Bar dataKey="pct" name="Failure Occurrence %" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weibull Cumulative Survival Curve */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
              Weibull Reliability & Cumulative Survival Curve
            </h3>
            <p className="text-xs text-slate-400">Operating run-life survival probability for ESP strings vs Sucker Rod Pumps.</p>
          </div>

          <div className="h-60 w-full bg-slate-950 p-2 rounded-lg border border-slate-800">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weibullData} margin={{ top: 10, right: 15, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="days" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Days In Hole', position: 'insideBottom', offset: -10, fontSize: 10, fill: '#64748b' }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="espSurvival" name="ESP Survival Rate (%)" stroke="#22d3ee" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="rodSurvival" name="Rod Pump Survival (%)" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Failure Log, Teardown Inspections & Corrective Actions
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Document teardown findings, identify root causes, calculate downtime impact, and track corrective action closeouts.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export RCA Log</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Report Failure Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by incident ID, reason code, well, component, or category..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Categories</option>
                <option value="Gas Locking">Gas Locking</option>
                <option value="Sand / Solids Erosion">Sand / Solids Erosion</option>
                <option value="Electrical Insulation Breakdown">Electrical Insulation Breakdown</option>
                <option value="Scale Deposition">Scale Deposition</option>
                <option value="Mechanical Wear">Mechanical Wear</option>
                <option value="Power Quality / Surge">Power Quality / Surge</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Statuses</option>
                <option value="Root Cause Analysis">Root Cause Analysis</option>
                <option value="Replacement In-Progress">Replacement In-Progress</option>
                <option value="Corrective Action Implemented">Corrective Action Implemented</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Failure Incident Cards */}
        <div className="space-y-3 pt-2">
          {filteredFailures.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-lg border border-slate-800">
              No failure incidents match current criteria.
            </div>
          ) : (
            filteredFailures.map(incident => {
              const isResolved = incident.resolutionStatus === 'Resolved';

              return (
                <div
                  key={incident.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isResolved 
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-80' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-cyan-400">{incident.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                          {incident.reasonCode}
                        </span>
                        <span className="text-white font-bold">{incident.wellName}</span>
                        <span className="text-slate-400">({incident.liftType})</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">Failed: {incident.failureDate}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-400 font-bold">Run Life: {incident.runLifeDays} days</span>
                        <span className="text-slate-600">•</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isResolved ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {incident.resolutionStatus}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                        <span>{incident.failedComponent} Failure — {incident.rootCauseCategory}</span>
                      </h4>

                      {/* Teardown findings */}
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 space-y-1.5 text-xs font-sans">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block">
                            Teardown Inspection & RCA Findings:
                          </span>
                          <p className="text-slate-200 mt-0.5 leading-relaxed">
                            {incident.rootCauseFindings || incident.notes}
                          </p>
                        </div>

                        {incident.correctiveActions && (
                          <div className="pt-1.5 border-t border-slate-800/60">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">
                              Corrective Actions Implemented:
                            </span>
                            <p className="text-slate-300 mt-0.5 leading-relaxed">
                              {incident.correctiveActions}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Metrics bar */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
                        <span>Equip: <strong className="text-slate-200">{incident.equipmentRef || 'Downhole String'}</strong></span>
                        <span>•</span>
                        <span>Downtime: <strong className="text-white">{incident.downtimeHours || 48} hours</strong></span>
                        <span>•</span>
                        <span>Deferred: <strong className="text-rose-400">{incident.deferredProductionBbl || 1500} Bbl</strong></span>
                        <span>•</span>
                        <span>Cost Impact: <strong className="text-amber-400">${incident.costImpactUsd.toLocaleString()}</strong></span>
                        {incident.assignedEngineer && (
                          <>
                            <span>•</span>
                            <span>RCA Lead: <strong className="text-cyan-300">{incident.assignedEngineer}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center font-sans text-xs">
                      <button
                        onClick={() => setSelectedFailure(incident)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>View Dossier</span>
                      </button>

                      <button
                        onClick={() => {
                          setEditingActionsTarget(incident);
                          setActionNotesInput(incident.correctiveActions || '');
                          setActionStatusInput(incident.resolutionStatus || 'Corrective Action Implemented');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white font-semibold transition-colors flex items-center gap-1 shadow-md shadow-cyan-950"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Update Actions</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Update Corrective Action Modal */}
      {editingActionsTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="w-4 h-4 text-cyan-400" />
                <span>Update Corrective Actions: {editingActionsTarget.id}</span>
              </h3>
              <button onClick={() => setEditingActionsTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateCorrectiveAction} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Failure Incident Details</label>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-white font-mono">
                  {editingActionsTarget.wellName} — {editingActionsTarget.reasonCode} ({editingActionsTarget.failedComponent})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Resolution Status</label>
                <select
                  value={actionStatusInput}
                  onChange={(e) => setActionStatusInput(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                >
                  <option value="Root Cause Analysis">Root Cause Analysis</option>
                  <option value="Replacement In-Progress">Replacement In-Progress</option>
                  <option value="Corrective Action Implemented">Corrective Action Implemented</option>
                  <option value="Resolved">Resolved & Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Corrective & Preventative Engineering Actions</label>
                <textarea
                  value={actionNotesInput}
                  onChange={(e) => setActionNotesInput(e.target.value)}
                  rows={4}
                  required
                  placeholder="Record modifications to downhole completion, metallurgy upgrade, chemical inhibitor, or VFD protective limits..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingActionsTarget(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Save Corrective Actions
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Failure Dossier Detail Drawer */}
      {selectedFailure && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">{selectedFailure.id}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-rose-400 font-bold">{selectedFailure.reasonCode}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-white font-bold">{selectedFailure.wellName}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {selectedFailure.failedComponent} Failure Dossier
                </h3>
              </div>
              <button onClick={() => setSelectedFailure(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Metrics Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">FAILURE DATE</span>
                <span className="text-white font-bold">{selectedFailure.failureDate}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">RUN LIFE IN HOLE</span>
                <span className="text-amber-400 font-bold">{selectedFailure.runLifeDays} Days</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL DOWNTIME</span>
                <span className="text-white">{selectedFailure.downtimeHours || 48} Hours</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">TOTAL EXPENSE</span>
                <span className="text-rose-400 font-bold">${selectedFailure.costImpactUsd.toLocaleString()}</span>
              </div>
            </div>

            {/* Teardown Report Content */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1 text-xs font-sans">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold block mb-1">
                  1. Root Cause Analysis Findings & Metallurgical Inspection
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {selectedFailure.rootCauseFindings || selectedFailure.notes}
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block mb-1">
                  2. Implemented Corrective Engineering Actions
                </span>
                <p className="text-slate-200 leading-relaxed">
                  {selectedFailure.correctiveActions || 'Corrective action plan currently under review with asset optimization committee.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedFailure(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log New Failure Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Report Downhole Lift Failure Incident</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const wellName = (form.elements.namedItem('wellName') as HTMLSelectElement).value;
                const rootCauseCategory = (form.elements.namedItem('rootCauseCategory') as HTMLSelectElement).value as any;
                const reasonCode = (form.elements.namedItem('reasonCode') as HTMLInputElement).value;
                const failedComponent = (form.elements.namedItem('failedComponent') as HTMLSelectElement).value as any;
                const runLifeDays = Number((form.elements.namedItem('runLifeDays') as HTMLInputElement).value);
                const costImpactUsd = Number((form.elements.namedItem('costImpactUsd') as HTMLInputElement).value);
                const downtimeHours = Number((form.elements.namedItem('downtimeHours') as HTMLInputElement).value);
                const deferredProductionBbl = Number((form.elements.namedItem('deferredProductionBbl') as HTMLInputElement).value);
                const rootCauseFindings = (form.elements.namedItem('rootCauseFindings') as HTMLTextAreaElement).value;
                const correctiveActions = (form.elements.namedItem('correctiveActions') as HTMLTextAreaElement).value;

                const newIncident: FailureIncident = {
                  id: `FAIL-2026-${Math.floor(100 + Math.random() * 899)}`,
                  wellId: 'ALS-DEL-ESP-104',
                  wellName,
                  liftType: 'ESP',
                  failureDate: new Date().toISOString().slice(0, 10),
                  runLifeDays,
                  rootCauseCategory,
                  reasonCode,
                  failedComponent,
                  equipmentRef: 'ESP-SYS Assembly',
                  costImpactUsd,
                  downtimeHours,
                  deferredProductionBbl,
                  rootCauseFindings,
                  correctiveActions,
                  resolutionStatus: 'Root Cause Analysis',
                  assignedEngineer: 'Carlos Reyes, PE',
                  notes: rootCauseFindings,
                };

                const updated = OperationsService.addFailure(newIncident);
                setFailures(updated);
                setIsAddModalOpen(false);
                showToast(`Failure incident ${newIncident.id} logged with reason code ${newIncident.reasonCode}.`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Failed Well Asset</label>
                  <select name="wellName" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    {wells.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Reason Code</label>
                  <input name="reasonCode" defaultValue="FAIL-GAS-SEP-02" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Root Cause Category</label>
                  <select name="rootCauseCategory" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Gas Locking">Gas Locking</option>
                    <option value="Sand / Solids Erosion">Sand / Solids Erosion</option>
                    <option value="Electrical Insulation Breakdown">Electrical Insulation Breakdown</option>
                    <option value="Scale Deposition">Scale Deposition</option>
                    <option value="Mechanical Wear">Mechanical Wear</option>
                    <option value="Power Quality / Surge">Power Quality / Surge</option>
                    <option value="Tubing Corrosion / Leak">Tubing Corrosion / Leak</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Failed Component</label>
                  <select name="failedComponent" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Motor">Motor</option>
                    <option value="Pump Impellers">Pump Impellers</option>
                    <option value="Gas Separator">Gas Separator</option>
                    <option value="MLE Cable">MLE Cable</option>
                    <option value="Thrust Bearing">Thrust Bearing</option>
                    <option value="Rod String">Rod String</option>
                    <option value="Check Valve">Check Valve</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Run Life (Days)</label>
                  <input name="runLifeDays" type="number" defaultValue={320} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Cost Impact ($)</label>
                  <input name="costImpactUsd" type="number" defaultValue={120000} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Downtime (Hours)</label>
                  <input name="downtimeHours" type="number" defaultValue={48} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Teardown / Inspection Findings</label>
                <textarea name="rootCauseFindings" rows={2} defaultValue="Visual inspection upon pulling revealed severe gas cavitation marks on lower 12 stages." required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Recommended Corrective Actions</label>
                <textarea name="correctiveActions" rows={2} defaultValue="Upgrade to active vortex gas separator and install automated casing vent valve." required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Record Failure Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
