import React, { useState, useMemo } from 'react';
import { 
  Bell, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  VolumeX, 
  Volume2, 
  Check, 
  ChevronRight, 
  UserCheck, 
  MessageSquare, 
  Plus, 
  Download, 
  RotateCcw, 
  Eye, 
  Clock, 
  X, 
  Shield, 
  User, 
  Send 
} from 'lucide-react';
import { AlarmItem, AlarmSeverity, AlarmResolutionStatus } from '../../types';
import { OperationsService, INITIAL_ALARMS } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';

interface AlarmCenterViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (id: string | null) => void;
}

export const AlarmCenterView: React.FC<AlarmCenterViewProps> = ({
  selectedAssetId,
  onSelectAssetId,
}) => {
  const [alarms, setAlarms] = useState<AlarmItem[]>(() => OperationsService.getAlarms());
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [wellFilter, setWellFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [notice, setNotice] = useState<string | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);

  React.useEffect(() => {
    if (selectedAssetId) {
      const match = wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId);
      if (match) {
        setWellFilter(match.name);
      }
    } else {
      setWellFilter('All');
    }
  }, [selectedAssetId, wells]);

  // Modals
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmItem | null>(null);
  const [assignAlarmTarget, setAssignAlarmTarget] = useState<AlarmItem | null>(null);
  const [assignedEngineerName, setAssignedEngineerName] = useState<string>('Carlos Reyes, PE');
  const [commentAlarmTarget, setCommentAlarmTarget] = useState<AlarmItem | null>(null);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [resolveAlarmTarget, setResolveAlarmTarget] = useState<AlarmItem | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');
  const [suppressAlarmTarget, setSuppressAlarmTarget] = useState<AlarmItem | null>(null);
  const [suppressReason, setSuppressReason] = useState<string>('Planned Maintenance Window');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Filtered alarms
  const filteredAlarms = useMemo(() => {
    return alarms.filter(a => {
      const matchSearch = 
        a.wellName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.assignedEngineer && a.assignedEngineer.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchSeverity = severityFilter === 'All' || a.severity === severityFilter;
      const matchCategory = categoryFilter === 'All' || a.category === categoryFilter;
      const matchWell = wellFilter === 'All' || a.wellName === wellFilter;

      let matchStatus = true;
      if (statusFilter === 'Unacknowledged') {
        matchStatus = !a.acknowledged;
      } else if (statusFilter === 'Acknowledged') {
        matchStatus = a.acknowledged && a.resolutionStatus !== 'Resolved';
      } else if (statusFilter === 'Resolved') {
        matchStatus = a.resolutionStatus === 'Resolved';
      } else if (statusFilter === 'Suppressed') {
        matchStatus = a.resolutionStatus === 'Suppressed';
      }

      return matchSearch && matchSeverity && matchCategory && matchWell && matchStatus;
    });
  }, [alarms, searchTerm, severityFilter, categoryFilter, wellFilter, statusFilter]);

  // Acknowledge single
  const handleAcknowledge = (id: string) => {
    const updated = OperationsService.acknowledgeAlarm(id, 'Current Operator (RTOC)');
    setAlarms(updated);
    showToast(`Alarm ${id} acknowledged and logged in audit history.`);
  };

  // Acknowledge all
  const handleAcknowledgeAll = () => {
    const updated = alarms.map(a => ({
      ...a,
      acknowledged: true,
      acknowledgedBy: 'Supervisor Batch Ack',
      acknowledgedAt: new Date().toISOString()
    }));
    setAlarms(updated);
    OperationsService.saveAlarms(updated);
    showToast('All active alarms acknowledged.');
  };

  // Assign Engineer
  const handleConfirmAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignAlarmTarget) return;
    const updated = OperationsService.assignAlarm(assignAlarmTarget.id, assignedEngineerName);
    setAlarms(updated);
    showToast(`Alarm ${assignAlarmTarget.id} assigned to ${assignedEngineerName}.`);
    setAssignAlarmTarget(null);
  };

  // Add Comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAlarmTarget || !newCommentText.trim()) return;
    const updated = OperationsService.addAlarmComment(
      commentAlarmTarget.id,
      newCommentText.trim(),
      'Carlos Reyes, PE',
      'Senior Optimization Engineer'
    );
    setAlarms(updated);
    setCommentAlarmTarget(updated.find(a => a.id === commentAlarmTarget.id) || null);
    setNewCommentText('');
    showToast('Operational comment added to alarm thread.');
  };

  // Resolve Alarm
  const handleConfirmResolution = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveAlarmTarget) return;
    const updated = OperationsService.resolveAlarm(
      resolveAlarmTarget.id,
      resolveNotes || 'Issue addressed and equipment running within normal operating parameters.',
      'Carlos Reyes, PE'
    );
    setAlarms(updated);
    showToast(`Alarm ${resolveAlarmTarget.id} marked as Resolved.`);
    setResolveAlarmTarget(null);
    setResolveNotes('');
  };

  // Suppress Alarm
  const handleConfirmSuppress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppressAlarmTarget) return;
    const updated = OperationsService.suppressAlarm(suppressAlarmTarget.id, suppressReason);
    setAlarms(updated);
    showToast(`Alarm ${suppressAlarmTarget.id} shelved/suppressed.`);
    setSuppressAlarmTarget(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['ID', 'WellName', 'LiftType', 'Severity', 'Category', 'Title', 'Parameter', 'CurrentValue', 'SetpointLimit', 'Timestamp', 'Acknowledged', 'AssignedEngineer', 'ResolutionStatus'];
    const rows = filteredAlarms.map(a => [
      a.id,
      `"${a.wellName}"`,
      a.liftType,
      a.severity,
      a.category,
      `"${a.title.replace(/"/g, '""')}"`,
      `"${a.parameter}"`,
      `"${a.currentValue}"`,
      `"${a.setpointLimit}"`,
      a.timestamp,
      a.acknowledged ? 'YES' : 'NO',
      a.assignedEngineer || 'Unassigned',
      a.resolutionStatus || 'Active',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ALS_Alarms_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported alarm dataset to CSV.');
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

      {/* Header Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">TOTAL ALARMS</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{alarms.length}</span>
          <span className="text-[10px] text-slate-500 font-mono">ISA 18.2 Priority Matrix</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">URGENT (P1)</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">
            {alarms.filter(a => a.severity === 'Urgent').length}
          </span>
          <span className="text-[10px] text-rose-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            Immediate Action
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">HIGH (P2)</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {alarms.filter(a => a.severity === 'High').length}
          </span>
          <span className="text-[10px] text-amber-500 font-mono">Thermal / Vibration</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">UNACKNOWLEDGED</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">
            {alarms.filter(a => !a.acknowledged).length}
          </span>
          <span className="text-[10px] text-cyan-500 font-mono">Pending Operator Review</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">RESOLVED YESTERDAY/TODAY</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {alarms.filter(a => a.resolutionStatus === 'Resolved').length}
          </span>
          <span className="text-[10px] text-emerald-500 font-mono">Audited & Closed</span>
        </div>
      </div>

      {/* Control Action Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Real-Time Alarm Matrix & Dispatch Center
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Operational alarm management, field dispatch assignments, discussion log threads, and setpoint auditing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
              soundEnabled ? 'bg-cyan-950/60 border-cyan-600/40 text-cyan-300' : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Audible Alert: ON' : 'Muted'}</span>
          </button>

          <button
            onClick={handleAcknowledgeAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acknowledge All</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Simulate Alarm</span>
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
              placeholder="Search by alarm ID, well, title, parameter, engineer..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Severities</option>
                <option value="Urgent">Urgent (P1)</option>
                <option value="High">High (P2)</option>
                <option value="Medium">Medium (P3)</option>
                <option value="Low">Low (P4)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Categories</option>
                <option value="Thermal">Thermal</option>
                <option value="Electrical">Electrical</option>
                <option value="Hydrodynamic">Hydrodynamic</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Communication">Communication</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All States</option>
                <option value="Unacknowledged">Unacknowledged</option>
                <option value="Acknowledged">Acknowledged / Active</option>
                <option value="Resolved">Resolved</option>
                <option value="Suppressed">Suppressed</option>
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

        {/* Alarm List Items */}
        <div className="space-y-2.5 pt-2">
          {filteredAlarms.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs bg-slate-950 rounded-lg border border-slate-800">
              No alarms found matching current filter criteria.
            </div>
          ) : (
            filteredAlarms.map(alarm => {
              const isUrgent = alarm.severity === 'Urgent';
              const isHigh = alarm.severity === 'High';
              const isResolved = alarm.resolutionStatus === 'Resolved';
              const isSuppressed = alarm.resolutionStatus === 'Suppressed';

              return (
                <div
                  key={alarm.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isResolved 
                      ? 'bg-slate-950/60 border-slate-800/80 opacity-70' 
                      : isSuppressed
                      ? 'bg-slate-950/80 border-slate-700/60 opacity-60'
                      : isUrgent 
                      ? 'bg-rose-950/20 border-rose-600/40 hover:border-rose-500' 
                      : isHigh 
                      ? 'bg-amber-950/20 border-amber-600/40 hover:border-amber-500' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left: ID & Main details */}
                    <div className="space-y-1 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-cyan-400">{alarm.id}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-white font-bold">{alarm.wellName}</span>
                        <span className="text-slate-400">({alarm.liftType})</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{alarm.timestamp}</span>

                        {/* Severity Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isUrgent ? 'bg-rose-900/60 text-rose-300 border border-rose-700/60' :
                          isHigh ? 'bg-amber-900/60 text-amber-300 border border-amber-700/60' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {alarm.severity}
                        </span>

                        {/* Category Badge */}
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-sans border border-slate-700">
                          {alarm.category}
                        </span>

                        {/* Status Badge */}
                        {isResolved ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            Resolved
                          </span>
                        ) : isSuppressed ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-700 text-slate-300 font-bold">
                            Suppressed
                          </span>
                        ) : alarm.acknowledged ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Ack: {alarm.acknowledgedBy}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse font-bold">
                            Unacknowledged
                          </span>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-white tracking-wide">
                        {alarm.title}
                      </h4>
                      <p className="text-xs text-slate-300 font-sans leading-relaxed">
                        {alarm.description}
                      </p>

                      {/* Telemetry parameter row */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-xs font-mono text-slate-400">
                        <span>Parameter: <strong className="text-white">{alarm.parameter}</strong></span>
                        <span>•</span>
                        <span>Value: <strong className="text-amber-400">{alarm.currentValue}</strong></span>
                        <span>•</span>
                        <span>Trip Limit: <strong className="text-rose-400">{alarm.setpointLimit}</strong></span>
                        {alarm.assignedEngineer && (
                          <>
                            <span>•</span>
                            <span className="text-cyan-300 flex items-center gap-1 font-sans">
                              <User className="w-3 h-3" />
                              Assigned: {alarm.assignedEngineer}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-center font-sans text-xs">
                      {!alarm.acknowledged && (
                        <button
                          onClick={() => handleAcknowledge(alarm.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors flex items-center gap-1 shadow-lg shadow-emerald-950"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Acknowledge</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setAssignAlarmTarget(alarm);
                          setAssignedEngineerName(alarm.assignedEngineer || 'Carlos Reyes, PE');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 border border-slate-700"
                        title="Assign to Engineer"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Assign</span>
                      </button>

                      <button
                        onClick={() => setCommentAlarmTarget(alarm)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 border border-slate-700"
                        title="View & Add Comments"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                        <span>Log ({alarm.comments?.length || 0})</span>
                      </button>

                      {!isResolved && (
                        <button
                          onClick={() => setResolveAlarmTarget(alarm)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 border border-slate-700"
                          title="Mark Resolved"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Resolve</span>
                        </button>
                      )}

                      {!isSuppressed && !isResolved && (
                        <button
                          onClick={() => setSuppressAlarmTarget(alarm)}
                          className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-[11px]"
                          title="Shelve / Suppress"
                        >
                          Shelve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Assign Engineer Modal */}
      {assignAlarmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-cyan-400" />
                <span>Assign Alarm: {assignAlarmTarget.id}</span>
              </h3>
              <button onClick={() => setAssignAlarmTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmAssignment} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Target Alarm</label>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-white font-mono">
                  {assignAlarmTarget.title} ({assignAlarmTarget.wellName})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Responsible Engineer</label>
                <select
                  value={assignedEngineerName}
                  onChange={(e) => setAssignedEngineerName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                >
                  <option value="Carlos Reyes, PE">Carlos Reyes, PE (Senior Artificial Lift Engineer)</option>
                  <option value="David Chen">David Chen (Downhole Equipment Specialist)</option>
                  <option value="Elena Rostova">Elena Rostova (SCADA Surveillance Controller)</option>
                  <option value="Marcus Vance">Marcus Vance (Permian Asset Operations Director)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAssignAlarmTarget(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Assign Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Discussion & Audit Log Modal */}
      {commentAlarmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-mono">
                  <MessageSquare className="w-4 h-4 text-amber-400" />
                  <span>Discussion & Log: {commentAlarmTarget.id}</span>
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">{commentAlarmTarget.title}</div>
              </div>
              <button onClick={() => setCommentAlarmTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Comment Thread List */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {!commentAlarmTarget.comments || commentAlarmTarget.comments.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs font-mono">
                  No operational discussion entries logged yet.
                </div>
              ) : (
                commentAlarmTarget.comments.map(c => (
                  <div key={c.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-cyan-400 font-bold">{c.author} <span className="text-slate-500 font-normal font-sans">({c.authorRole})</span></span>
                      <span className="text-slate-500">{c.timestamp}</span>
                    </div>
                    <p className="text-slate-200 font-sans leading-relaxed">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* New Comment Input */}
            <form onSubmit={handleAddComment} className="pt-3 border-t border-slate-800 space-y-2">
              <label className="block text-[11px] font-mono text-slate-400">Add Field Observation / Action Log:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type investigation note or setpoint override..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Alarm Modal */}
      {resolveAlarmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Resolve Alarm: {resolveAlarmTarget.id}</span>
              </h3>
              <button onClick={() => setResolveAlarmTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmResolution} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Alarm Details</label>
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800 text-white font-mono">
                  {resolveAlarmTarget.title} ({resolveAlarmTarget.wellName})
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Corrective Action Taken & Resolution Notes</label>
                <textarea
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  rows={3}
                  placeholder="Describe field adjustments, setpoint trims, or mechanical repairs made to resolve the condition..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-sans focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResolveAlarmTarget(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Mark Resolved
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Suppress Modal */}
      {suppressAlarmTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Shelve / Suppress Alarm: {suppressAlarmTarget.id}</span>
              </h3>
              <button onClick={() => setSuppressAlarmTarget(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleConfirmSuppress} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Reason for Temporary Suppression</label>
                <select
                  value={suppressReason}
                  onChange={(e) => setSuppressReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
                >
                  <option value="Planned Maintenance Window">Planned Maintenance Window</option>
                  <option value="Sensor Recalibration in Progress">Sensor Recalibration in Progress</option>
                  <option value="Transient Hydrodynamic Slug Handling">Transient Hydrodynamic Slug Handling</option>
                  <option value="Choke Step Testing Protocol">Choke Step Testing Protocol</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSuppressAlarmTarget(null)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                >
                  Suppress Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Synthetic Alarm Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Simulate New Operational Alarm</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const wellName = (form.elements.namedItem('wellName') as HTMLSelectElement).value;
                const severity = (form.elements.namedItem('severity') as HTMLSelectElement).value as AlarmSeverity;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
                const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                const parameter = (form.elements.namedItem('parameter') as HTMLInputElement).value;
                const currentValue = (form.elements.namedItem('currentValue') as HTMLInputElement).value;
                const setpointLimit = (form.elements.namedItem('setpointLimit') as HTMLInputElement).value;

                const newAlarm: AlarmItem = {
                  id: `ALM-${Math.floor(1000 + Math.random() * 9000)}`,
                  wellId: 'ALS-DEL-ESP-104',
                  wellName,
                  liftType: 'ESP',
                  severity,
                  category,
                  title,
                  description,
                  parameter,
                  currentValue,
                  setpointLimit,
                  timestamp: `${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
                  acknowledged: false,
                  resolutionStatus: 'Active',
                  comments: []
                };

                const updated = [newAlarm, ...alarms];
                setAlarms(updated);
                OperationsService.saveAlarms(updated);
                setIsCreateModalOpen(false);
                showToast(`New ${severity} alarm ${newAlarm.id} injected into operational matrix.`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Target Well</label>
                  <select name="wellName" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    {wells.map(w => (
                      <option key={w.id} value={w.name}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Severity Level</label>
                  <select name="severity" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Urgent">Urgent (P1)</option>
                    <option value="High">High (P2)</option>
                    <option value="Medium">Medium (P3)</option>
                    <option value="Low">Low (P4)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select name="category" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Thermal">Thermal</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Hydrodynamic">Hydrodynamic</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Communication">Communication</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Monitored Parameter</label>
                  <input name="parameter" defaultValue="Intake Pressure (PIP)" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Alarm Title</label>
                <input name="title" defaultValue="High Downhole Vibration Anomaly" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Root Description</label>
                <textarea name="description" rows={2} defaultValue="Sensor telemetry indicates threshold breach exceeding safe operational envelope." required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Current Telemetry Value</label>
                  <input name="currentValue" defaultValue="0.74 g RMS" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Trip Setpoint Limit</label>
                  <input name="setpointLimit" defaultValue="Warning > 0.50 g" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  Inject Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
