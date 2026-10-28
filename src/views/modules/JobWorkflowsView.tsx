import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Search, 
  Filter, 
  Wrench, 
  Clock, 
  CheckCircle2, 
  Truck, 
  ChevronRight, 
  ArrowRight, 
  Edit, 
  Eye, 
  Check, 
  X, 
  User, 
  Calendar, 
  Layers, 
  Activity, 
  ShieldCheck, 
  History, 
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { WorkOrderJob, JobWorkflowType, JobWorkflowStage, JobAuditRecord } from '../../types';
import { OperationsService, INITIAL_JOBS } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';

const WORKFLOW_STAGES: JobWorkflowStage[] = [
  'Draft / Requested',
  'Pending Engineering Review',
  'Scheduled & Mobilizing',
  'On-Site Execution',
  'Quality & Testing',
  'Completed & Closed',
];

interface JobWorkflowsViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (id: string | null) => void;
}

export const JobWorkflowsView: React.FC<JobWorkflowsViewProps> = ({
  selectedAssetId,
  onSelectAssetId,
}) => {
  const [jobs, setJobs] = useState<WorkOrderJob[]>(() => OperationsService.getJobs());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [wellFilter, setWellFilter] = useState<string>('All');

  const wells = useMemo(() => StorageService.getWells(), []);

  useEffect(() => {
    if (selectedAssetId) {
      const match = wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId);
      if (match) {
        setWellFilter(match.id);
      }
    } else {
      setWellFilter('All');
    }
  }, [selectedAssetId, wells]);

  // Modals
  const [selectedJob, setSelectedJob] = useState<WorkOrderJob | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<WorkOrderJob | null>(null);
  const [stageTransitionJob, setStageTransitionJob] = useState<WorkOrderJob | null>(null);
  const [targetStage, setTargetStage] = useState<JobWorkflowStage>('On-Site Execution');
  const [transitionNotes, setTransitionNotes] = useState<string>('');
  const [closeJobTarget, setCloseJobTarget] = useState<WorkOrderJob | null>(null);
  const [completionNotes, setCompletionNotes] = useState<string>('');
  const [actualHoursInput, setActualHoursInput] = useState<number>(16);
  const [notice, setNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Filtered jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(j => {
      const matchSearch = 
        j.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        j.wellName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (j.responsibleEngineer && j.responsibleEngineer.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (j.equipmentRef && j.equipmentRef.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchType = typeFilter === 'All' || j.type === typeFilter;
      const matchStage = stageFilter === 'All' || j.stage === stageFilter;
      const matchPriority = priorityFilter === 'All' || j.priority === priorityFilter;
      const matchWell = wellFilter === 'All' || j.wellName === wellFilter;

      return matchSearch && matchType && matchStage && matchPriority && matchWell;
    });
  }, [jobs, searchTerm, typeFilter, stageFilter, priorityFilter, wellFilter]);

  // Handle stage transition
  const handleConfirmTransition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageTransitionJob) return;
    const updated = OperationsService.updateJobStage(
      stageTransitionJob.id,
      targetStage,
      stageTransitionJob.responsibleEngineer || 'Carlos Reyes, PE',
      transitionNotes || `Progressed to ${targetStage}`
    );
    setJobs(updated);
    if (selectedJob && selectedJob.id === stageTransitionJob.id) {
      setSelectedJob(updated.find(j => j.id === stageTransitionJob.id) || null);
    }
    showToast(`Work order ${stageTransitionJob.id} transitioned to stage "${targetStage}".`);
    setStageTransitionJob(null);
    setTransitionNotes('');
  };

  // Handle job close
  const handleConfirmClose = (e: React.FormEvent) => {
    e.preventDefault();
    if (!closeJobTarget) return;
    const updated = OperationsService.closeJob(
      closeJobTarget.id,
      completionNotes || 'All work completed, pressure tested, and signed off.',
      actualHoursInput,
      closeJobTarget.responsibleEngineer || 'Carlos Reyes, PE'
    );
    setJobs(updated);
    if (selectedJob && selectedJob.id === closeJobTarget.id) {
      setSelectedJob(updated.find(j => j.id === closeJobTarget.id) || null);
    }
    showToast(`Work order ${closeJobTarget.id} completed and closed.`);
    setCloseJobTarget(null);
    setCompletionNotes('');
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

      {/* Header Summary KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">ACTIVE WORK ORDERS</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">
            {jobs.filter(j => j.stage !== 'Completed & Closed' && j.stage !== 'Cancelled / Deferred').length}
          </span>
          <span className="text-[10px] text-slate-500 font-mono">Cable, MLE & ESP Workflows</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">ON-SITE EXECUTION</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
            {jobs.filter(j => j.stage === 'On-Site Execution').length}
          </span>
          <span className="text-[10px] text-cyan-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Rig / Crew Dispatched
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">SCHEDULED & MOBILIZING</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {jobs.filter(j => j.stage === 'Scheduled & Mobilizing').length}
          </span>
          <span className="text-[10px] text-amber-500 font-mono">En Route To Pad</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">COMPLETED YTD</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {jobs.filter(j => j.stage === 'Completed & Closed').length}
          </span>
          <span className="text-[10px] text-emerald-500 font-mono">Quality Tested & Signed Off</span>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Artificial Lift Job & Workover Lifecycle Management
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Stage gates and multi-role audit trail for Cable, MLE, ESP Installation, Replacement, and Downhole Diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Work Order</span>
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
              placeholder="Search work order ID, well, title, engineer, equipment..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Job Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Types</option>
                <option value="Cable">Cable</option>
                <option value="MLE">MLE</option>
                <option value="ESP Installation">ESP Installation</option>
                <option value="ESP Replacement">ESP Replacement</option>
                <option value="Inspection">Inspection</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Troubleshooting">Troubleshooting</option>
                <option value="Workover Rig">Workover Rig</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Stage:</span>
              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Stages</option>
                {WORKFLOW_STAGES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Priority:</span>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Priorities</option>
                <option value="Immediate">Immediate (P1)</option>
                <option value="High">High</option>
                <option value="Normal">Normal</option>
                <option value="Scheduled">Scheduled</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Well:</span>
              <select
                value={wellFilter}
                onChange={(e) => setWellFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 max-w-[140px] truncate"
              >
                <option value="All">All Wells</option>
                {wells.map(w => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Work Order Cards */}
        <div className="space-y-3 pt-2">
          {filteredJobs.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-lg border border-slate-800">
              No work order jobs matched current filter criteria.
            </div>
          ) : (
            filteredJobs.map(job => {
              const currentStageIdx = WORKFLOW_STAGES.indexOf(job.stage || 'Draft / Requested');
              const isClosed = job.stage === 'Completed & Closed';

              return (
                <div
                  key={job.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isClosed 
                      ? 'bg-slate-950/60 border-slate-800 opacity-80' 
                      : job.priority === 'Immediate'
                      ? 'bg-rose-950/15 border-rose-600/40 hover:border-rose-500'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top metadata */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-cyan-400">{job.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
                          {job.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          job.priority === 'Immediate' ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60' :
                          job.priority === 'High' ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {job.priority} Priority
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-white font-bold">{job.wellName}</span>
                      </div>

                      <h3 className="text-base font-bold text-white tracking-wide">
                        {job.title}
                      </h3>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
                        {job.notes}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
                        {job.equipmentRef && (
                          <span>Equip Ref: <strong className="text-cyan-300">{job.equipmentRef}</strong></span>
                        )}
                        <span>•</span>
                        <span>Lead Engineer: <strong className="text-white">{job.responsibleEngineer || 'Carlos Reyes, PE'}</strong></span>
                        <span>•</span>
                        <span>Assigned Crew: <strong className="text-slate-200">{job.assignedCrew}</strong></span>
                        {job.assignedVehicleId && (
                          <>
                            <span>•</span>
                            <span className="text-amber-300 flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              Vehicle: {job.assignedVehicleId}
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>Est: {job.estimatedHours}h {job.actualHours ? `(Actual: ${job.actualHours}h)` : ''}</span>
                      </div>
                    </div>

                    {/* Stage transition controls */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center font-sans text-xs">
                      <button
                        onClick={() => setSelectedJob(job)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Audit History</span>
                      </button>

                      {!isClosed && (
                        <>
                          <button
                            onClick={() => {
                              setStageTransitionJob(job);
                              const nextIdx = Math.min(WORKFLOW_STAGES.length - 1, currentStageIdx + 1);
                              setTargetStage(WORKFLOW_STAGES[nextIdx]);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-md shadow-cyan-950"
                          >
                            <span>Progress Stage</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setCloseJobTarget(job);
                              setActualHoursInput(job.estimatedHours);
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-md shadow-emerald-950"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Signoff & Close</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Stage Gate Progression Stepper Bar */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80">
                    <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-[10px] font-mono">
                      {WORKFLOW_STAGES.map((stg, sIdx) => {
                        const isDone = sIdx <= currentStageIdx;
                        const isCurrent = sIdx === currentStageIdx;

                        return (
                          <div
                            key={stg}
                            className={`p-2 rounded-lg border text-center transition-colors ${
                              isCurrent
                                ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200 font-bold ring-1 ring-cyan-500/40'
                                : isDone
                                ? 'bg-slate-950 border-emerald-500/40 text-emerald-300'
                                : 'bg-slate-950/50 border-slate-800/80 text-slate-600'
                            }`}
                          >
                            <div className="text-[9px] uppercase tracking-wider text-slate-500">Step {sIdx + 1}</div>
                            <div className="truncate mt-0.5">{stg}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Progress Stage Modal */}
      {stageTransitionJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span>Transition Stage: {stageTransitionJob.id}</span>
              </h3>
              <button onClick={() => setStageTransitionJob(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmTransition} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Current Stage</label>
                <div className="p-2 bg-slate-950 rounded border border-slate-800 text-slate-300 font-mono">
                  {stageTransitionJob.stage || 'Draft / Requested'}
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">New Workflow Stage</label>
                <select
                  value={targetStage}
                  onChange={(e) => setTargetStage(e.target.value as JobWorkflowStage)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                >
                  {WORKFLOW_STAGES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Stage Progression Audit Notes</label>
                <textarea
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                  rows={3}
                  required
                  placeholder="Record mobilization milestone, rig readiness, or pressure test results..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStageTransitionJob(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Confirm Stage Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Job Signoff Modal */}
      {closeJobTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Job Completion Signoff: {closeJobTarget.id}</span>
              </h3>
              <button onClick={() => setCloseJobTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmClose} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Work Order</label>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-white font-mono">
                  {closeJobTarget.title} ({closeJobTarget.wellName})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Actual Crew Execution Hours</label>
                <input
                  type="number"
                  value={actualHoursInput}
                  onChange={(e) => setActualHoursInput(Number(e.target.value))}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Final Engineering & Quality Signoff Notes</label>
                <textarea
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  rows={3}
                  required
                  placeholder="Confirm Megger electrical insulation test, pressure integrity, and baseline telemetry sync..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCloseJobTarget(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Signoff & Close Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History & Detail Drawer */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-cyan-400 font-bold">{selectedJob.id}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-slate-300">{selectedJob.type}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-emerald-400 font-bold">{selectedJob.stage}</span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedJob.title}</h3>
              </div>
              <button onClick={() => setSelectedJob(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* General Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">WELL ASSET</span>
                <span className="text-white font-bold">{selectedJob.wellName}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">EQUIPMENT REF</span>
                <span className="text-cyan-300">{selectedJob.equipmentRef || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">LEAD ENGINEER</span>
                <span className="text-white">{selectedJob.responsibleEngineer || 'Carlos Reyes, PE'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SCHEDULED DATE</span>
                <span className="text-slate-200">{selectedJob.scheduledDate}</span>
              </div>
            </div>

            {/* Audit History Timeline */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-cyan-400" />
                <span>Stage Progression Audit Log</span>
              </h4>

              <div className="space-y-2">
                {!selectedJob.auditHistory || selectedJob.auditHistory.length === 0 ? (
                  <div className="p-4 text-center text-slate-500 text-xs font-mono">
                    No stage audit records recorded.
                  </div>
                ) : (
                  selectedJob.auditHistory.map((aud, aIdx) => (
                    <div key={aud.id || aIdx} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs font-sans space-y-1">
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <span className="text-cyan-400 font-bold">{aud.stage}</span>
                        <span className="text-slate-500">{aud.timestamp}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{aud.notes}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Authorized by: <strong className="text-slate-300">{aud.user}</strong>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Work Order Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Create Artificial Lift Work Order</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const wellName = (form.elements.namedItem('wellName') as HTMLSelectElement).value;
                const type = (form.elements.namedItem('type') as HTMLSelectElement).value as JobWorkflowType;
                const priority = (form.elements.namedItem('priority') as HTMLSelectElement).value as any;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const equipmentRef = (form.elements.namedItem('equipmentRef') as HTMLInputElement).value;
                const responsibleEngineer = (form.elements.namedItem('responsibleEngineer') as HTMLSelectElement).value;
                const assignedCrew = (form.elements.namedItem('assignedCrew') as HTMLInputElement).value;
                const estimatedHours = Number((form.elements.namedItem('estimatedHours') as HTMLInputElement).value);
                const scheduledDate = (form.elements.namedItem('scheduledDate') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                const newJob: WorkOrderJob = {
                  id: `JOB-2026-${Math.floor(100 + Math.random() * 899)}`,
                  wellId: 'ALS-DEL-ESP-104',
                  wellName,
                  title,
                  type,
                  priority,
                  status: 'Scheduled',
                  stage: 'Draft / Requested',
                  responsibleEngineer,
                  assignedCrew,
                  equipmentRef,
                  createdDate: new Date().toISOString().slice(0, 10),
                  scheduledDate,
                  estimatedHours,
                  notes,
                };

                const updated = OperationsService.createJob(newJob);
                setJobs(updated);
                setIsCreateOpen(false);
                showToast(`Work order ${newJob.id} drafted successfully.`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Well Asset</label>
                  <select name="wellName" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    {wells.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Workflow Job Type</label>
                  <select name="type" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Cable">Cable (Armored Power Cable Re-banding)</option>
                    <option value="MLE">MLE (Motor Lead Extension Inspection)</option>
                    <option value="ESP Installation">ESP Installation (New Completion)</option>
                    <option value="ESP Replacement">ESP Replacement (Pull & Replace)</option>
                    <option value="Inspection">Inspection (Mechanical/Acoustic)</option>
                    <option value="Maintenance">Maintenance (Preventative)</option>
                    <option value="Troubleshooting">Troubleshooting (Root Cause Diagnostic)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Work Order Title</label>
                <input name="title" defaultValue="Scheduled Downhole ESP Assembly Inspection" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Equipment Reference / Tag</label>
                  <input name="equipmentRef" defaultValue="ESP-SYS-104 / Monel Cable" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select name="priority" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Immediate">Immediate (P1 Emergency)</option>
                    <option value="Scheduled">Scheduled</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Responsible Engineer</label>
                  <select name="responsibleEngineer" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Carlos Reyes, PE">Carlos Reyes, PE</option>
                    <option value="David Chen">David Chen</option>
                    <option value="Marcus Vance">Marcus Vance</option>
                    <option value="Elena Rostova">Elena Rostova</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Field Crew</label>
                  <input name="assignedCrew" defaultValue="ESP Service Team Alpha" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Scheduled Date</label>
                  <input name="scheduledDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Estimated Duration (Hours)</label>
                <input name="estimatedHours" type="number" defaultValue={24} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Detailed Scope of Work & Procedures</label>
                <textarea name="notes" rows={3} defaultValue="Conduct complete visual, electrical Megger, and acoustic tests on downhole assembly." required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Create Work Order Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
