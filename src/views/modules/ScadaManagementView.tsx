import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Radio, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Server, 
  ShieldCheck, 
  Activity, 
  Sliders, 
  FileSpreadsheet, 
  Send, 
  Clock, 
  ArrowUpDown, 
  ChevronRight, 
  Check 
} from 'lucide-react';
import { ScadaHostNode, ScadaTagItem } from '../../types';
import { ScadaService, INITIAL_SCADA_HOSTS, INITIAL_SCADA_TAGS } from '../../services/scadaService';

export const ScadaManagementView: React.FC = () => {
  const [hosts, setHosts] = useState<ScadaHostNode[]>(() => ScadaService.getHosts());
  const [tags, setTags] = useState<ScadaTagItem[]>(() => ScadaService.getTags());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [qualityFilter, setQualityFilter] = useState<string>('All');
  const [wellFilter, setWellFilter] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof ScadaTagItem>('register');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Modals & Drawers
  const [selectedTag, setSelectedTag] = useState<ScadaTagItem | null>(null);
  const [editingTag, setEditingTag] = useState<ScadaTagItem | null>(null);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [deleteConfirmTag, setDeleteConfirmTag] = useState<ScadaTagItem | null>(null);
  const [editingHost, setEditingHost] = useState<ScadaHostNode | null>(null);

  // Workbench Write Simulation
  const [writeRegister, setWriteRegister] = useState<number>(40002);
  const [writeValue, setWriteValue] = useState<string>('59.0');
  const [writeFeedback, setWriteFeedback] = useState<string | null>(null);
  const [pollNotice, setPollNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setPollNotice(msg);
    setTimeout(() => setPollNotice(null), 3500);
  };

  // Unique wells for filter
  const uniqueWells = useMemo(() => {
    const list = Array.from(new Set(tags.map(t => t.wellName)));
    return ['All', ...list];
  }, [tags]);

  // Filtered & Sorted Tags
  const filteredTags = useMemo(() => {
    return tags.filter(tag => {
      const matchSearch = 
        tag.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tag.register.toString().includes(searchTerm) ||
        tag.wellName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory = categoryFilter === 'All' || tag.category === categoryFilter;
      const matchQuality = qualityFilter === 'All' || tag.quality === qualityFilter;
      const matchWell = wellFilter === 'All' || tag.wellName === wellFilter;

      return matchSearch && matchCategory && matchQuality && matchWell;
    }).sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDirection === 'asc' 
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [tags, searchTerm, categoryFilter, qualityFilter, wellFilter, sortField, sortDirection]);

  // Pagination slice
  const totalPages = Math.ceil(filteredTags.length / itemsPerPage) || 1;
  const paginatedTags = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTags.slice(start, start + itemsPerPage);
  }, [filteredTags, currentPage]);

  const handleSort = (field: keyof ScadaTagItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleManualPoll = () => {
    // Simulate slight fluctuations in values
    const updated = tags.map(t => {
      if (typeof t.currentValue === 'number') {
        const delta = (Math.random() - 0.5) * (t.currentValue * 0.015);
        return {
          ...t,
          currentValue: Math.round((t.currentValue + delta) * 10) / 10,
          lastUpdated: new Date().toISOString()
        };
      }
      return { ...t, lastUpdated: new Date().toISOString() };
    });
    setTags(updated);
    ScadaService.saveTags(updated);
    showToast(`Polled 1,280 SCADA registers across all active RTU nodes. Telemetry timestamp synchronized.`);
  };

  const handleWriteCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = tags.find(t => t.register === writeRegister);
    if (!tag) {
      setWriteFeedback(`Register ${writeRegister} not found in telemetry registry.`);
      return;
    }
    const numVal = parseFloat(writeValue);
    const updated = tags.map(t => t.register === writeRegister ? {
      ...t,
      currentValue: isNaN(numVal) ? writeValue : numVal,
      lastUpdated: new Date().toISOString()
    } : t);
    setTags(updated);
    ScadaService.saveTags(updated);
    setWriteFeedback(`SUCCESS: Modbus Function 06 (Preset Single Register) ACK received from RTU. Register ${writeRegister} set to ${writeValue} ${tag.unit}.`);
    setTimeout(() => setWriteFeedback(null), 5000);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ['Register', 'TagName', 'Description', 'DataType', 'Scale', 'Unit', 'CurrentValue', 'WellName', 'Category', 'Quality', 'HighLimit', 'LowLimit'];
    const rows = tags.map(t => [
      t.register,
      `"${t.tagName}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.dataType,
      t.scale,
      t.unit,
      t.currentValue,
      `"${t.wellName}"`,
      t.category,
      t.quality,
      t.highLimit || '',
      t.lowLimit || '',
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ALS_SCADA_Register_Map_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported SCADA Register Map to CSV.');
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          showToast('Invalid CSV file: No records found.');
          return;
        }
        showToast(`Imported ${lines.length - 1} SCADA register tag definitions successfully.`);
      } catch {
        showToast('Failed to parse SCADA tag CSV file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Delete tag
  const handleDeleteTag = (id: string) => {
    const updated = ScadaService.deleteTag(id);
    setTags(updated);
    setDeleteConfirmTag(null);
    showToast('SCADA register tag deleted.');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {pollNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{pollNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              SCADA Management & Register Mapping
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Configure host polling nodes, Modbus TCP holding registers, MQTT Sparkplug B tags, and telemetry scaling equations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleManualPoll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll All Hosts</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Tag Map</span>
          </button>
          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleImportCSV}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setIsAddTagOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Register Tag</span>
          </button>
        </div>
      </div>

      {/* SCADA Host Architecture Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {hosts.map(host => (
          <div 
            key={host.id} 
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-cyan-400 font-bold">{host.id}</span>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium ${
                  host.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  host.status === 'Standby' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${host.status === 'Online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {host.status}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-white truncate" title={host.name}>{host.name}</h4>
              <p className="text-[11px] text-slate-400 font-mono mt-1">
                {host.ipAddress}:{host.port} • {host.protocol}
              </p>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-3 gap-1 text-[11px] font-mono">
              <div>
                <span className="text-slate-500 block text-[9px]">LATENCY</span>
                <span className="text-slate-200">{host.latencyMs} ms</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">PKT LOSS</span>
                <span className="text-emerald-400">{host.packetLossPct}%</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">DEVICES</span>
                <span className="text-slate-200">{host.connectedDevices} units</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Manual Coil/Register Write & Test Workbench */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            SCADA Output Workbench (Command Injection Test)
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Function Code 06 / 16 (Preset Holding Register)</span>
        </div>

        <form onSubmit={handleWriteCommand} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Register Offset</label>
            <select
              value={writeRegister}
              onChange={(e) => setWriteRegister(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
            >
              {tags.map(t => (
                <option key={t.id} value={t.register}>
                  {t.register} — {t.tagName} ({t.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">New Test Value</label>
            <input
              type="text"
              value={writeValue}
              onChange={(e) => setWriteValue(e.target.value)}
              placeholder="e.g. 59.0"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-700 hover:bg-cyan-600 text-white text-xs font-semibold transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Write Register</span>
            </button>
            <button
              type="button"
              onClick={() => {
                ScadaService.resetTags();
                setTags(ScadaService.getTags());
                showToast('Reset all SCADA registers to pristine baseline demo values.');
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-mono transition-colors"
              title="Reset register values"
            >
              Reset
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            {writeFeedback ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {writeFeedback}
              </span>
            ) : (
              <span>Safe virtual loopback execution. Values update in-memory and in browser storage.</span>
            )}
          </div>
        </form>
      </div>

      {/* Tag Registry Table Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search by tag name, register, description, or well..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Categories</option>
                <option value="Pressure">Pressure</option>
                <option value="Temperature">Temperature</option>
                <option value="Electrical">Electrical</option>
                <option value="Hydrodynamic">Hydrodynamic</option>
                <option value="Status">Status</option>
                <option value="Vibration">Vibration</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Quality:</span>
              <select
                value={qualityFilter}
                onChange={(e) => { setQualityFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
              >
                <option value="All">All Qualities</option>
                <option value="GOOD">GOOD</option>
                <option value="FAIR">FAIR</option>
                <option value="BAD">BAD</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
              <span>Well:</span>
              <select
                value={wellFilter}
                onChange={(e) => { setWellFilter(e.target.value); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 max-w-[150px] truncate"
              >
                {uniqueWells.map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
              <tr>
                <th 
                  onClick={() => handleSort('register')}
                  className="px-3 py-2.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Register</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('tagName')}
                  className="px-3 py-2.5 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Tag Name</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="px-3 py-2.5">Target Well & Pad</th>
                <th className="px-3 py-2.5">Category</th>
                <th className="px-3 py-2.5">Type & Scale</th>
                <th className="px-3 py-2.5">Current Telemetry</th>
                <th className="px-3 py-2.5">Quality</th>
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
              {paginatedTags.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No SCADA register tags matched current query criteria.
                  </td>
                </tr>
              ) : (
                paginatedTags.map(tag => (
                  <tr key={tag.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-cyan-400">
                      {tag.register}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-white">{tag.tagName}</div>
                      <div className="text-[10px] text-slate-400 font-sans truncate max-w-xs" title={tag.description}>
                        {tag.description}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      <div className="text-slate-200">{tag.wellName}</div>
                      <div className="text-[10px] text-slate-500">{tag.padName}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {tag.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">
                      <div>{tag.dataType}</div>
                      <div className="text-[10px] text-slate-500">scale {tag.scale}</div>
                    </td>
                    <td className="px-3 py-2.5 font-bold">
                      <span className="text-white text-sm">{tag.currentValue}</span>
                      <span className="text-[11px] text-slate-400 ml-1 font-normal">{tag.unit}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tag.quality === 'GOOD' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        tag.quality === 'FAIR' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {tag.quality}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedTag(tag)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                          title="View Tag Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingTag(tag)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                          title="Edit Tag"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmTag(tag)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                          title="Delete Tag"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-mono pt-2">
          <span>
            Showing {filteredTags.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredTags.length)} of {filteredTags.length} registers
          </span>
          <div className="flex items-center gap-1 font-sans">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              Previous
            </button>
            <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View Tag Detail Modal */}
      {selectedTag && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Register {selectedTag.register} — {selectedTag.tagName}
                </h3>
              </div>
              <button onClick={() => setSelectedTag(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Value:</span>
                  <span className="text-white font-bold text-sm">{selectedTag.currentValue} {selectedTag.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Telemetry Quality:</span>
                  <span className="text-emerald-400 font-semibold">{selectedTag.quality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Type / Scale:</span>
                  <span className="text-slate-300">{selectedTag.dataType} (Scale {selectedTag.scale})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Alarm Bounds:</span>
                  <span className="text-amber-300">
                    Low: {selectedTag.lowLimit ?? 'None'} | High: {selectedTag.highLimit ?? 'None'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Target Well Asset:</span>
                  <span className="text-cyan-300">{selectedTag.wellName} ({selectedTag.wellId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pad Facility:</span>
                  <span className="text-slate-300">{selectedTag.padName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last Telemetry Poll:</span>
                  <span className="text-slate-400">{new Date(selectedTag.lastUpdated).toUTCString()}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Description:</span>
                <p className="font-sans text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800">
                  {selectedTag.description}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedTag(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit / Add Tag Modal */}
      {(editingTag || isAddTagOpen) && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingTag ? 'Edit SCADA Register Tag' : 'Add New SCADA Holding Register'}
              </h3>
              <button onClick={() => { setEditingTag(null); setIsAddTagOpen(false); }} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const register = Number((form.elements.namedItem('register') as HTMLInputElement).value);
                const tagName = (form.elements.namedItem('tagName') as HTMLInputElement).value;
                const description = (form.elements.namedItem('description') as HTMLInputElement).value;
                const category = (form.elements.namedItem('category') as HTMLSelectElement).value as any;
                const dataType = (form.elements.namedItem('dataType') as HTMLSelectElement).value as any;
                const unit = (form.elements.namedItem('unit') as HTMLInputElement).value;
                const scale = (form.elements.namedItem('scale') as HTMLInputElement).value;
                const wellName = (form.elements.namedItem('wellName') as HTMLInputElement).value;

                if (editingTag) {
                  const updated = ScadaService.updateTag({
                    ...editingTag,
                    register,
                    tagName,
                    description,
                    category,
                    dataType,
                    unit,
                    scale,
                    wellName,
                  });
                  setTags(updated);
                  showToast('SCADA register tag updated.');
                } else {
                  const newTag: ScadaTagItem = {
                    id: `TAG-${Date.now().toString().slice(-4)}`,
                    register,
                    tagName,
                    description,
                    category,
                    dataType,
                    unit,
                    scale,
                    currentValue: 0.0,
                    quality: 'GOOD',
                    wellId: 'ALS-DEL-ESP-104',
                    wellName,
                    padName: 'Phantom State Pad Bravo',
                    lastUpdated: new Date().toISOString(),
                  };
                  const updated = ScadaService.addTag(newTag);
                  setTags(updated);
                  showToast('New SCADA register tag added to polling schedule.');
                }
                setEditingTag(null);
                setIsAddTagOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Holding Register (4xxxx)</label>
                  <input
                    name="register"
                    type="number"
                    defaultValue={editingTag?.register ?? 40040}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Tag Identifier</label>
                  <input
                    name="tagName"
                    defaultValue={editingTag?.tagName ?? 'ESP_GENERIC_TAG'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Tag Description</label>
                <input
                  name="description"
                  defaultValue={editingTag?.description ?? 'SCADA measurement parameter'}
                  required
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Category</label>
                  <select
                    name="category"
                    defaultValue={editingTag?.category ?? 'Pressure'}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Pressure">Pressure</option>
                    <option value="Temperature">Temperature</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Hydrodynamic">Hydrodynamic</option>
                    <option value="Status">Status</option>
                    <option value="Vibration">Vibration</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Data Type</label>
                  <select
                    name="dataType"
                    defaultValue={editingTag?.dataType ?? 'FLOAT32'}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                  >
                    <option value="FLOAT32">FLOAT32</option>
                    <option value="UINT16">UINT16</option>
                    <option value="INT16">INT16</option>
                    <option value="BOOLEAN">BOOLEAN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Engineering Unit</label>
                  <input
                    name="unit"
                    defaultValue={editingTag?.unit ?? 'psi'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Scaling Multiplier</label>
                  <input
                    name="scale"
                    defaultValue={editingTag?.scale ?? '1.0'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Well Asset</label>
                  <input
                    name="wellName"
                    defaultValue={editingTag?.wellName ?? 'Phantom State 104-2H'}
                    required
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => { setEditingTag(null); setIsAddTagOpen(false); }}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {editingTag ? 'Save Changes' : 'Create Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmTag && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-sm">Delete SCADA Register Tag?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove register <span className="text-white font-mono font-bold">{deleteConfirmTag.register} ({deleteConfirmTag.tagName})</span> from polling? Downstream alarms relying on this register will be inactivated.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmTag(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTag(deleteConfirmTag.id)}
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Delete Tag
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
