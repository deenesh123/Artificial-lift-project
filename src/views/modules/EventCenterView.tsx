import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Plus, 
  AlertTriangle, 
  Activity, 
  Sliders, 
  Zap, 
  ChevronRight, 
  ShieldCheck, 
  FileText 
} from 'lucide-react';
import { OperationalEvent } from '../../types';
import { OperationsService } from '../../services/operationsService';
import { StorageService } from '../../services/storageService';

export const EventCenterView: React.FC = () => {
  const [events, setEvents] = useState<OperationalEvent[]>(() => OperationsService.getEvents());
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [severityFilter, setSeverityFilter] = useState<string>('All');
  const [subsystemFilter, setSubsystemFilter] = useState<string>('All');
  const [wellFilter, setWellFilter] = useState<string>('All');
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const filteredEvents = useMemo(() => {
    return events.filter(evt => {
      const matchSearch = 
        evt.wellName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        evt.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === 'All' || evt.eventType === typeFilter;
      const matchSeverity = severityFilter === 'All' || evt.severity === severityFilter;
      const matchSubsystem = subsystemFilter === 'All' || evt.subsystem === subsystemFilter;
      const matchWell = wellFilter === 'All' || evt.wellName === wellFilter;

      return matchSearch && matchType && matchSeverity && matchSubsystem && matchWell;
    });
  }, [events, searchTerm, typeFilter, severityFilter, subsystemFilter, wellFilter]);

  const handleExportCSV = () => {
    const headers = ['ID', 'Well', 'Timestamp', 'EventType', 'User', 'Severity', 'Subsystem', 'ParameterChanged', 'PreviousValue', 'NewValue', 'Description'];
    const rows = filteredEvents.map(e => [
      e.id,
      `"${e.wellName}"`,
      `"${e.timestamp}"`,
      `"${e.eventType}"`,
      `"${e.user}"`,
      e.severity,
      `"${e.subsystem || ''}"`,
      `"${e.parameterChanged || ''}"`,
      `"${e.previousValue || ''}"`,
      `"${e.newValue || ''}"`,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ALS_Operational_Events_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported operational event history to CSV.');
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
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Operational Events & Control Audit Trail
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Tamper-evident operational changelog capturing setpoint revisions, emergency trips, chemical batches, and surface choke maneuvers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
          <button
            onClick={() => setIsAddEventOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Field Event</span>
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
              placeholder="Search event ID, well name, user, or description..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Event Types</option>
                <option value="Setpoint Changed">Setpoint Changed</option>
                <option value="VFD Trip">VFD Trip</option>
                <option value="Auto-Restart">Auto-Restart</option>
                <option value="Well Shut-in">Well Shut-in</option>
                <option value="Chemical Treatment">Chemical Treatment</option>
                <option value="Sensor Calibration">Sensor Calibration</option>
                <option value="Choke Adjustment">Choke Adjustment</option>
                <option value="Emergency Shutdown">Emergency Shutdown</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Severities</option>
                <option value="Action">Action</option>
                <option value="Warning">Warning</option>
                <option value="Info">Info</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Subsystem:</span>
              <select
                value={subsystemFilter}
                onChange={(e) => setSubsystemFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Subsystems</option>
                <option value="ESP Surface Drive">ESP Surface Drive</option>
                <option value="Downhole Sensor">Downhole Sensor</option>
                <option value="Christmas Tree">Christmas Tree</option>
                <option value="SCADA Host">SCADA Host</option>
                <option value="Flowline">Flowline</option>
                <option value="Chemical Injection">Chemical Injection</option>
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

        {/* Event Timeline Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3 py-2.5">Event ID</th>
                <th className="px-3 py-2.5">Timestamp (UTC)</th>
                <th className="px-3 py-2.5">Well Asset</th>
                <th className="px-3 py-2.5">Classification</th>
                <th className="px-3 py-2.5">Subsystem</th>
                <th className="px-3 py-2.5">Audit Trail & Action</th>
                <th className="px-3 py-2.5">Responsible User</th>
                <th className="px-3 py-2.5">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No operational events match current criteria.
                  </td>
                </tr>
              ) : (
                filteredEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-cyan-400">{evt.id}</td>
                    <td className="px-3 py-2.5 text-slate-400 whitespace-nowrap">{evt.timestamp}</td>
                    <td className="px-3 py-2.5 font-semibold text-white font-sans">{evt.wellName}</td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-200 border border-slate-700">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{evt.subsystem || 'Artificial Lift'}</td>
                    <td className="px-3 py-2.5 font-sans">
                      <div className="text-slate-200">{evt.description}</div>
                      {evt.parameterChanged && (
                        <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                          {evt.parameterChanged}: <span className="text-slate-400">{evt.previousValue}</span> → <span className="text-white font-bold">{evt.newValue}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-[11px]">{evt.user}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        evt.severity === 'Action' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                        evt.severity === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {evt.severity}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Event Logging Modal */}
      {isAddEventOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Log Operational Field Event</h3>
              <button onClick={() => setIsAddEventOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const wellName = (form.elements.namedItem('wellName') as HTMLSelectElement).value;
                const eventType = (form.elements.namedItem('eventType') as HTMLSelectElement).value as any;
                const severity = (form.elements.namedItem('severity') as HTMLSelectElement).value as any;
                const subsystem = (form.elements.namedItem('subsystem') as HTMLSelectElement).value as any;
                const description = (form.elements.namedItem('description') as HTMLTextAreaElement).value;
                const parameterChanged = (form.elements.namedItem('parameterChanged') as HTMLInputElement).value;
                const previousValue = (form.elements.namedItem('previousValue') as HTMLInputElement).value;
                const newValue = (form.elements.namedItem('newValue') as HTMLInputElement).value;

                const newEvent: OperationalEvent = {
                  id: `EVT-${Math.floor(7100 + Math.random() * 800)}`,
                  wellId: 'ALS-DEL-ESP-104',
                  wellName,
                  timestamp: `${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
                  eventType,
                  severity,
                  subsystem,
                  description,
                  parameterChanged: parameterChanged || undefined,
                  previousValue: previousValue || undefined,
                  newValue: newValue || undefined,
                  user: 'Current Operator',
                };

                const updated = OperationsService.addEvent(newEvent);
                setEvents(updated);
                setIsAddEventOpen(false);
                showToast(`Operational event ${newEvent.id} recorded in audit trail.`);
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
                  <label className="block text-slate-400 mb-1">Event Type</label>
                  <select name="eventType" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Setpoint Changed">Setpoint Changed</option>
                    <option value="VFD Trip">VFD Trip</option>
                    <option value="Auto-Restart">Auto-Restart</option>
                    <option value="Well Shut-in">Well Shut-in</option>
                    <option value="Chemical Treatment">Chemical Treatment</option>
                    <option value="Sensor Calibration">Sensor Calibration</option>
                    <option value="Choke Adjustment">Choke Adjustment</option>
                    <option value="Emergency Shutdown">Emergency Shutdown</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Subsystem</label>
                  <select name="subsystem" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="ESP Surface Drive">ESP Surface Drive</option>
                    <option value="Downhole Sensor">Downhole Sensor</option>
                    <option value="Christmas Tree">Christmas Tree</option>
                    <option value="SCADA Host">SCADA Host</option>
                    <option value="Flowline">Flowline</option>
                    <option value="Chemical Injection">Chemical Injection</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Severity Flag</label>
                  <select name="severity" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Info">Info</option>
                    <option value="Warning">Warning</option>
                    <option value="Action">Action Required</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Parameter Name</label>
                  <input name="parameterChanged" placeholder="e.g. VFD Frequency" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Previous Value</label>
                  <input name="previousValue" placeholder="e.g. 58.5 Hz" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">New Value</label>
                  <input name="newValue" placeholder="e.g. 60.0 Hz" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description & Operational Context</label>
                <textarea name="description" rows={3} placeholder="Describe the physical reason or authorized procedure..." required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddEventOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Commit Event to Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
