import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Gauge, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  RotateCcw, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Activity, 
  Sliders, 
  Zap, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PumpEquipment, PumpType, PumpStatus } from '../../types';
import { StorageService, INITIAL_PUMPS } from '../../services/storageService';

export const PumpDashboardView: React.FC = () => {
  const [pumps, setPumps] = useState<PumpEquipment[]>([]);
  const [activeTab, setActiveTab] = useState<'registry' | 'dyno'>('registry');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [fluidPoundFilter, setFluidPoundFilter] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof PumpEquipment>('unitModel');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modals
  const [selectedPump, setSelectedPump] = useState<PumpEquipment | null>(null);
  const [editingPump, setEditingPump] = useState<PumpEquipment | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingPump, setDeletingPump] = useState<PumpEquipment | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Notifications & Uploads
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dynoInputRef = useRef<HTMLInputElement>(null);

  // Dynamometer analysis state for the interactive card tab
  const [analyzedPumpId, setAnalyzedPumpId] = useState<string>('PMP-ROD-019');

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    const data = StorageService.getPumps();
    setPumps(data);
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const availableWells = useMemo(() => StorageService.getWells(), [pumps]);

  // Filtered & Sorted Pumps
  const filteredPumps = useMemo(() => {
    return pumps.filter(p => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        p.id.toLowerCase().includes(q) ||
        p.unitModel.toLowerCase().includes(q) ||
        p.wellName.toLowerCase().includes(q) ||
        p.wellId.toLowerCase().includes(q) ||
        p.rodStringTaper.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || p.pumpType === typeFilter;
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
      const matchesPound = fluidPoundFilter === 'All' || 
        (fluidPoundFilter === 'Pound' ? p.fluidPoundDetected : !p.fluidPoundDetected);

      return matchesSearch && matchesType && matchesStatus && matchesPound;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [pumps, searchTerm, typeFilter, statusFilter, fluidPoundFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredPumps.length / rowsPerPage) || 1;
  const paginatedPumps = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredPumps.slice(start, start + rowsPerPage);
  }, [filteredPumps, currentPage, rowsPerPage]);

  const handleSort = (field: keyof PumpEquipment) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Validation
  const validateForm = (p: Partial<PumpEquipment>): boolean => {
    const errors: Record<string, string> = {};
    if (!p.id?.trim()) errors.id = 'Pump ID is required (e.g. PMP-ROD-065)';
    if (!p.unitModel?.trim()) errors.unitModel = 'Pumping unit model is required';
    if (!p.wellId?.trim()) errors.wellId = 'Associated Well ID is required';
    if (p.strokeLengthIn !== undefined && p.strokeLengthIn < 0) errors.strokeLengthIn = 'Stroke length cannot be negative';
    if (p.spm !== undefined && p.spm <= 0) errors.spm = 'Speed (SPM/RPM) must be > 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSavePump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).trim();
    const unitModel = (formData.get('unitModel') as string).trim();
    const wellId = formData.get('wellId') as string;
    const matchedWell = availableWells.find(w => w.id === wellId);
    const wellName = matchedWell ? matchedWell.name : 'Unassigned Well';
    const pumpType = formData.get('pumpType') as PumpType;
    const status = formData.get('status') as PumpStatus;
    const strokeLengthIn = Number(formData.get('strokeLengthIn'));
    const spm = Number(formData.get('spm'));
    const gearboxRatingInLbs = Number(formData.get('gearboxRatingInLbs')) || 640000;
    const beamRatingLbs = Number(formData.get('beamRatingLbs')) || 36500;
    const plungerDiameterIn = Number(formData.get('plungerDiameterIn')) || 1.75;
    const pumpDepthFt = Number(formData.get('pumpDepthFt')) || 8500;
    const rodStringTaper = (formData.get('rodStringTaper') as string).trim() || '7/8" & 3/4" Grade D';
    const pprlLbs = Number(formData.get('pprlLbs')) || 21000;
    const mprlLbs = Number(formData.get('mprlLbs')) || 6500;
    const fillagePct = Number(formData.get('fillagePct')) || 85;
    const fluidPoundDetected = formData.get('fluidPoundDetected') === 'true';
    const motorHp = Number(formData.get('motorHp')) || 60;
    const notes = (formData.get('notes') as string).trim();

    const payload: Partial<PumpEquipment> = { id, unitModel, wellId, strokeLengthIn, spm };
    if (!validateForm(payload)) return;

    if (isAdding) {
      if (pumps.some(item => item.id === id)) {
        setFormErrors({ id: `Pump Equipment ID "${id}" already exists.` });
        return;
      }

      const newPump: PumpEquipment = {
        id,
        wellId,
        wellName,
        pumpType,
        status,
        unitModel,
        strokeLengthIn,
        spm,
        gearboxRatingInLbs,
        beamRatingLbs,
        plungerDiameterIn,
        pumpDepthFt,
        rodStringTaper,
        pprlLbs,
        mprlLbs,
        fillagePct,
        fluidPoundDetected,
        motorHp,
        installationDate: new Date().toISOString().slice(0, 10),
        dynamometerCardName: `${id}_Dyno_Card.csv`,
        updatedAt: new Date().toISOString(),
        notes,
      };

      const updated = StorageService.addPump(newPump);
      setPumps(updated);
      setIsAdding(false);
      showToast(`Pumping Unit "${unitModel}" (${id}) registered for ${wellName}.`);
    } else if (editingPump) {
      const updatedPump: PumpEquipment = {
        ...editingPump,
        unitModel,
        wellId,
        wellName,
        pumpType,
        status,
        strokeLengthIn,
        spm,
        gearboxRatingInLbs,
        beamRatingLbs,
        plungerDiameterIn,
        pumpDepthFt,
        rodStringTaper,
        pprlLbs,
        mprlLbs,
        fillagePct,
        fluidPoundDetected,
        motorHp,
        notes,
        updatedAt: new Date().toISOString(),
      };

      const updated = StorageService.updatePump(updatedPump);
      setPumps(updated);
      setEditingPump(null);
      showToast(`Pumping Unit "${id}" updated successfully.`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingPump) return;
    const updated = StorageService.deletePump(deletingPump.id);
    setPumps(updated);
    showToast(`Pumping Unit "${deletingPump.id}" permanently deleted.`);
    setDeletingPump(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Unit Model',
      'Well ID',
      'Well Name',
      'Pump Type',
      'Status',
      'Stroke Length (in)',
      'SPM / RPM',
      'Gearbox Rating (in-lb)',
      'Beam Rating (lb)',
      'Plunger Dia (in)',
      'Depth (ft)',
      'Rod String Taper',
      'PPRL (lb)',
      'MPRL (lb)',
      'Fillage (%)',
      'Fluid Pound',
      'Motor HP',
      'Last Updated',
    ];

    const rows = filteredPumps.map(p => [
      p.id,
      `"${p.unitModel}"`,
      p.wellId,
      `"${p.wellName}"`,
      p.pumpType,
      p.status,
      p.strokeLengthIn,
      p.spm,
      p.gearboxRatingInLbs,
      p.beamRatingLbs,
      p.plungerDiameterIn,
      p.pumpDepthFt,
      `"${p.rodStringTaper}"`,
      p.pprlLbs,
      p.mprlLbs,
      p.fillagePct,
      p.fluidPoundDetected ? 'YES' : 'NO',
      p.motorHp,
      p.updatedAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ALS_Pump_Equipment_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredPumps.length} pumping units to CSV.`);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          showToast('CSV is empty or missing data rows.', 'error');
          return;
        }

        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 6) {
            const [id, unitModel, wellId, wellName, typeRaw, statusRaw, strokeRaw, spmRaw, pprlRaw, mprlRaw, fillageRaw] = cols;
            if (!id || !unitModel) continue;

            const existingIndex = pumps.findIndex(p => p.id === id);
            const importedPump: PumpEquipment = {
              id,
              unitModel,
              wellId: wellId || 'ALS-MID-ROD-034',
              wellName: wellName || 'Clearfork Unit 34-8',
              pumpType: (typeRaw as PumpType) || 'Rod Pumping Unit (SRP)',
              status: (statusRaw as PumpStatus) || 'Operating',
              strokeLengthIn: Number(strokeRaw) || 144,
              spm: Number(spmRaw) || 5.0,
              gearboxRatingInLbs: 640000,
              beamRatingLbs: 36500,
              plungerDiameterIn: 1.75,
              pumpDepthFt: 8500,
              rodStringTaper: '7/8" & 3/4" Grade D',
              pprlLbs: Number(pprlRaw) || 20000,
              mprlLbs: Number(mprlRaw) || 6000,
              fillagePct: Number(fillageRaw) || 85,
              fluidPoundDetected: (Number(fillageRaw) || 85) < 50,
              motorHp: 60,
              installationDate: new Date().toISOString().slice(0, 10),
              dynamometerCardName: `${id}_Imported_Card.csv`,
              updatedAt: new Date().toISOString(),
              notes: 'Imported via CSV batch upload.',
            };

            if (existingIndex >= 0) {
              StorageService.updatePump(importedPump);
            } else {
              StorageService.addPump(importedPump);
            }
            count++;
          }
        }

        loadData();
        showToast(`Successfully imported ${count} pumping units from CSV.`);
        setShowImportModal(false);
      } catch (err) {
        showToast('Failed to parse pump CSV file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleUploadDynoCard = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPump) return;
    const updated = {
      ...selectedPump,
      dynamometerCardName: file.name,
      updatedAt: new Date().toISOString(),
    };
    StorageService.updatePump(updated);
    setSelectedPump(updated);
    loadData();
    showToast(`Uploaded dynamometer card "${file.name}".`);
  };

  const handleDownloadDynoCard = (docName?: string) => {
    const name = docName || 'Dynamometer_Card.csv';
    const fakeContent = `Position_In,Surface_Load_klb,Downhole_Load_klb\n0,12.4,8.2\n20,21.5,18.4\n40,24.8,18.6\n80,22.0,18.4\n120,19.5,18.0\n144,18.2,17.8\n100,11.2,16.5\n90,5.8,4.2\n60,6.2,4.1\n0,12.4,8.2`;
    const blob = new Blob([fakeContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name.endsWith('.csv') ? name : `${name}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded dynamometer card "${name}".`);
  };

  // Dynamometer Card Data for the Interactive Visualizer Tab
  const activeAnalyzedPump = pumps.find(p => p.id === analyzedPumpId) || pumps[0] || INITIAL_PUMPS[0];
  const isPound = activeAnalyzedPump.fluidPoundDetected || activeAnalyzedPump.fillagePct < 50;

  const dynoPoints = useMemo(() => {
    const stroke = activeAnalyzedPump.strokeLengthIn || 144;
    const pprl = (activeAnalyzedPump.pprlLbs || 22000) / 1000;
    const mprl = (activeAnalyzedPump.mprlLbs || 6000) / 1000;

    if (isPound) {
      return [
        { posIn: 0, surfaceLoad: mprl * 2, pumpLoad: mprl * 1.4 },
        { posIn: Math.round(stroke * 0.15), surfaceLoad: pprl * 0.88, pumpLoad: pprl * 0.75 },
        { posIn: Math.round(stroke * 0.3), surfaceLoad: pprl, pumpLoad: pprl * 0.76 },
        { posIn: Math.round(stroke * 0.6), surfaceLoad: pprl * 0.9, pumpLoad: pprl * 0.74 },
        { posIn: stroke, surfaceLoad: pprl * 0.75, pumpLoad: pprl * 0.72 },
        { posIn: Math.round(stroke * 0.85), surfaceLoad: pprl * 0.58, pumpLoad: pprl * 0.68 },
        // Severe fluid pound delayed impact drop
        { posIn: Math.round(stroke * 0.65), surfaceLoad: mprl, pumpLoad: mprl * 0.7 },
        { posIn: Math.round(stroke * 0.35), surfaceLoad: mprl * 1.05, pumpLoad: mprl * 0.68 },
        { posIn: 0, surfaceLoad: mprl * 2, pumpLoad: mprl * 1.4 },
      ];
    } else {
      return [
        { posIn: 0, surfaceLoad: mprl * 1.6, pumpLoad: mprl * 1.1 },
        { posIn: Math.round(stroke * 0.15), surfaceLoad: pprl * 0.9, pumpLoad: pprl * 0.78 },
        { posIn: Math.round(stroke * 0.3), surfaceLoad: pprl, pumpLoad: pprl * 0.8 },
        { posIn: Math.round(stroke * 0.6), surfaceLoad: pprl * 0.95, pumpLoad: pprl * 0.79 },
        { posIn: stroke, surfaceLoad: pprl * 0.85, pumpLoad: pprl * 0.75 },
        { posIn: Math.round(stroke * 0.7), surfaceLoad: mprl * 1.4, pumpLoad: mprl * 0.9 },
        { posIn: Math.round(stroke * 0.4), surfaceLoad: mprl * 1.1, pumpLoad: mprl * 0.85 },
        { posIn: Math.round(stroke * 0.1), surfaceLoad: mprl * 1.05, pumpLoad: mprl * 0.85 },
        { posIn: 0, surfaceLoad: mprl * 1.6, pumpLoad: mprl * 1.1 },
      ];
    }
  }, [activeAnalyzedPump, isPound]);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg text-xs flex items-center gap-3 shadow-2xl border ${
          toastMessage.type === 'error'
            ? 'bg-rose-950/95 border-rose-500/80 text-rose-200'
            : 'bg-emerald-950/95 border-emerald-500/80 text-emerald-200'
        }`}>
          {toastMessage.type === 'error' ? <AlertTriangle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75 font-mono">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Sucker Rod & PCP Pump Operations Management
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {pumps.length} Operating Units
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Beam pumping units, surface gearbox load factors, dynamometer cards, pump fillage, and fluid pound mitigation.
          </p>
        </div>

        {/* Action & Tab Switch */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('registry')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'registry' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Equipment Registry
            </button>
            <button
              onClick={() => setActiveTab('dyno')}
              className={`px-3 py-1 rounded transition-colors ${
                activeTab === 'dyno' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dynamometer Cockpit
            </button>
          </div>

          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => {
              setFormErrors({});
              setIsAdding(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Pump Unit</span>
          </button>
        </div>
      </div>

      {activeTab === 'registry' ? (
        /* REGISTRY TAB */
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex-1 max-w-md relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by Pump ID, model, well, or rod taper..."
                className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs">
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
              >
                <option value="All">All Pump Types</option>
                <option value="Rod Pumping Unit (SRP)">Rod Pumping Unit (SRP)</option>
                <option value="Progressing Cavity Pump (PCP)">Progressing Cavity Pump (PCP)</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
              >
                <option value="All">All Statuses</option>
                <option value="Operating">Operating</option>
                <option value="Warning">Warning</option>
                <option value="Critical">Critical</option>
                <option value="Pumping Off">Pumping Off</option>
                <option value="Idle / Standby">Idle / Standby</option>
              </select>

              <select
                value={fluidPoundFilter}
                onChange={(e) => {
                  setFluidPoundFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
              >
                <option value="All">All Fillage States</option>
                <option value="Pound">Fluid Pound Detected</option>
                <option value="Normal">Normal Fillage</option>
              </select>

              {(searchTerm || typeFilter !== 'All' || statusFilter !== 'All' || fluidPoundFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('All');
                    setStatusFilter('All');
                    setFluidPoundFilter('All');
                    setCurrentPage(1);
                  }}
                  className="text-xs text-cyan-400 hover:underline px-2 py-1 font-mono"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800 select-none">
                  <tr>
                    <th 
                      onClick={() => handleSort('id')} 
                      className="px-4 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Pump ID</span>
                        {sortField === 'id' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('unitModel')} 
                      className="px-4 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Pumping Unit Model</span>
                        {sortField === 'unitModel' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('wellName')} 
                      className="px-4 py-3 cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Associated Well</span>
                        {sortField === 'wellName' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('strokeLengthIn')} 
                      className="px-4 py-3 text-right cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Stroke / SPM</span>
                        {sortField === 'strokeLengthIn' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('pprlLbs')} 
                      className="px-4 py-3 text-right cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Peak Load (PPRL)</span>
                        {sortField === 'pprlLbs' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('fillagePct')} 
                      className="px-4 py-3 text-right cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <span>Fillage %</span>
                        {sortField === 'fillagePct' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('status')} 
                      className="px-4 py-3 text-center cursor-pointer hover:text-white"
                    >
                      <div className="flex items-center justify-center gap-1.5">
                        <span>Status</span>
                        {sortField === 'status' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                  {paginatedPumps.length > 0 ? (
                    paginatedPumps.map(pump => (
                      <tr key={pump.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-cyan-400 font-bold">{pump.id}</div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            {new Date(pump.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <div className="font-semibold text-white">{pump.unitModel}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{pump.pumpType} · {pump.rodStringTaper}</div>
                        </td>
                        <td className="px-4 py-3 font-sans text-slate-300">
                          <div>{pump.wellName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{pump.wellId}</div>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {pump.pumpType.includes('PCP') ? (
                            <span className="text-cyan-300">{pump.spm} RPM</span>
                          ) : (
                            <span>{pump.strokeLengthIn}" @ {pump.spm} SPM</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={pump.pprlLbs > 24000 ? 'text-amber-400 font-bold' : 'text-slate-200'}>
                            {(pump.pprlLbs / 1000).toFixed(1)} klb
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          <span className={`font-bold ${pump.fillagePct < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {pump.fillagePct}%
                          </span>
                          {pump.fluidPoundDetected && (
                            <span className="block text-[9px] text-rose-400 font-sans uppercase">Pound</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                            pump.status === 'Operating' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
                            pump.status === 'Warning' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                            pump.status === 'Critical' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                            pump.status === 'Pumping Off' ? 'bg-blue-950/80 text-blue-300 border border-blue-800' :
                            'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}>
                            {pump.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1 font-sans">
                            <button
                              onClick={() => {
                                setAnalyzedPumpId(pump.id);
                                setActiveTab('dyno');
                              }}
                              title="Analyze Dyno Card"
                              className="p-1 rounded text-cyan-400 hover:text-cyan-300 hover:bg-slate-800"
                            >
                              <Activity className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedPump(pump)}
                              title="View Details"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setFormErrors({});
                                setEditingPump(pump);
                              }}
                              title="Edit Unit"
                              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingPump(pump)}
                              title="Delete Unit"
                              className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-slate-500 font-sans">
                        No matching pumping units found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-200 rounded px-2 py-1"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={15}>15</option>
                  <option value={25}>25</option>
                </select>
                <span className="font-mono text-slate-500 ml-2">
                  Showing {filteredPumps.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
                  {Math.min(currentPage * rowsPerPage, filteredPumps.length)} of {filteredPumps.length} units
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
                >
                  Previous
                </button>
                <span className="font-mono px-2 text-slate-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40 hover:bg-slate-800"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* DYNAMOMETER COCKPIT TAB */
        <div className="space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-slate-400">SELECT BEAM PUMPING UNIT:</div>
              <select
                value={analyzedPumpId}
                onChange={(e) => setAnalyzedPumpId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-bold text-sm rounded px-3 py-1.5 mt-1"
              >
                {pumps.filter(p => !p.pumpType.includes('PCP')).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.wellName} — {p.unitModel} ({p.fluidPoundDetected ? 'FLUID POUND' : 'NORMAL'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleDownloadDynoCard(activeAnalyzedPump.dynamometerCardName)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Card Data</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Alert Banner if Fluid Pound */}
          {isPound && (
            <div className="bg-rose-950/40 border border-rose-800 rounded-xl p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-rose-300 font-mono">
                    DIAGNOSTIC: INCOMPLETE FILLAGE ({activeAnalyzedPump.fillagePct}%) / FLUID POUND DETECTED
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Severe load drop on downstroke at {Math.round((activeAnalyzedPump.strokeLengthIn || 144) * 0.65)}" position. Impact loading damages rod couplings and subsurface pump valves.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  const updated = {
                    ...activeAnalyzedPump,
                    fillagePct: 82,
                    fluidPoundDetected: false,
                    status: 'Operating' as PumpStatus,
                    spm: Math.max(3.8, Math.round((activeAnalyzedPump.spm - 0.8) * 10) / 10),
                    updatedAt: new Date().toISOString(),
                  };
                  StorageService.updatePump(updated);
                  setPumps(StorageService.getPumps());
                  showToast('Optimized Pump-Off Controller. Reduced SPM to eliminate fluid pound shock loading.');
                }}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow shrink-0"
              >
                Auto-Tune POC & Reduce SPM
              </button>
            </div>
          )}

          {/* 4 Pumping Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Peak Load (PPRL)</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {(activeAnalyzedPump.pprlLbs / 1000).toFixed(1)} klb
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Beam Limit: {(activeAnalyzedPump.beamRatingLbs / 1000).toFixed(1)} klb</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Min Load (MPRL)</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {(activeAnalyzedPump.mprlLbs / 1000).toFixed(1)} klb
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Rod Compression: Nominal</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Pump Fillage %</span>
              <span className={`text-xl font-bold font-mono mt-1 block ${isPound ? 'text-rose-400' : 'text-emerald-400'}`}>
                {activeAnalyzedPump.fillagePct}%
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Target: &gt; 80% Fillage</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block">Pumping Speed</span>
              <span className="text-xl font-bold font-mono text-cyan-400 mt-1 block">{activeAnalyzedPump.spm} SPM</span>
              <span className="text-[10px] text-slate-500 font-mono">Stroke: {activeAnalyzedPump.strokeLengthIn} Inches</span>
            </div>
          </div>

          {/* Dynamometer Card Chart */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">Surface Load vs Downhole Plunger Card</h4>
                <p className="text-xs text-slate-400">Blue line represents Surface Polished Rod Load (klb); Cyan line represents Calculated Downhole Pump Card.</p>
              </div>
              <span className="text-xs font-mono text-cyan-400 font-semibold">{activeAnalyzedPump.strokeLengthIn}" Full Travel</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dynoPoints} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="posIn" stroke="#64748B" tick={{ fontSize: 10 }} label={{ value: 'Polished Rod Travel (Inches)', position: 'insideBottom', offset: -4, fill: '#94A3B8', fontSize: 10 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 10 }} label={{ value: 'Rod Load (klb)', angle: -90, position: 'insideLeft', fill: '#94A3B8', fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Line type="linear" dataKey="surfaceLoad" name="Surface Polished Rod Card (klb)" stroke="#3B82F6" strokeWidth={2.5} dot />
                  <Line type="linear" dataKey="pumpLoad" name="Downhole Subsurface Pump Card (klb)" stroke="#06B6D4" strokeWidth={2.5} dot />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedPump && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tracking-tight">{selectedPump.unitModel}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                    selectedPump.status === 'Operating' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedPump.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    selectedPump.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedPump.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: <span className="text-cyan-400 font-bold">{selectedPump.id}</span> · Wellbore: {selectedPump.wellName} ({selectedPump.wellId})
                </div>
              </div>

              <button onClick={() => setSelectedPump(null)} className="text-slate-400 hover:text-white font-mono p-1">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Stroke Length</span>
                <span className="text-cyan-400 font-bold">{selectedPump.strokeLengthIn} Inches</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedPump.spm} SPM</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Peak Load (PPRL)</span>
                <span className="text-amber-400 font-bold">{(selectedPump.pprlLbs / 1000).toFixed(1)} klb</span>
                <span className="text-slate-400 text-[10px] block font-sans">Min: {(selectedPump.mprlLbs / 1000).toFixed(1)} klb</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Pump Fillage</span>
                <span className={`font-bold ${selectedPump.fillagePct < 50 ? 'text-rose-400' : 'text-emerald-400'}`}>{selectedPump.fillagePct}%</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedPump.fluidPoundDetected ? 'Pound Shock' : 'Smooth Flow'}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Gearbox Rating</span>
                <span className="text-white font-bold">{(selectedPump.gearboxRatingInLbs / 1000).toFixed(0)}k in-lb</span>
                <span className="text-slate-400 text-[10px] block font-sans">Beam: {selectedPump.beamRatingLbs.toLocaleString()} lb</span>
              </div>
            </div>

            {/* Sub-Assembly Details */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Subsurface Plunger:</span>
                <span className="text-white">{selectedPump.plungerDiameterIn}" Plunger @ {selectedPump.pumpDepthFt.toLocaleString()} ft Depth</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Sucker Rod String Taper:</span>
                <span className="text-cyan-300">{selectedPump.rodStringTaper}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Prime Mover Motor:</span>
                <span className="text-white">{selectedPump.motorHp} HP NEMA D High Slip</span>
              </div>
              {selectedPump.notes && (
                <div className="pt-1 text-[11px] text-slate-400 font-sans">
                  <strong>Notes:</strong> {selectedPump.notes}
                </div>
              )}
            </div>

            {/* Document Section */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Dynamometer Card Raw File</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Attached: {selectedPump.dynamometerCardName || 'Dyno_Card.csv'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={dynoInputRef}
                  onChange={handleUploadDynoCard}
                  className="hidden"
                  accept=".csv,.txt,.pdf"
                />
                <button
                  type="button"
                  onClick={() => dynoInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDynoCard(selectedPump.dynamometerCardName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
              <span>Last Modified: {new Date(selectedPump.updatedAt).toUTCString()}</span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => {
                    const toEdit = selectedPump;
                    setSelectedPump(null);
                    setEditingPump(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Edit Pump
                </button>
                <button
                  onClick={() => setSelectedPump(null)}
                  className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {(isAdding || editingPump) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isAdding ? 'Register Pumping Equipment Unit' : `Edit Pump Unit: ${editingPump?.id}`}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingPump(null);
                }}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePump} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Equipment ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    defaultValue={editingPump?.id || `PMP-ROD-${Math.floor(150 + Math.random() * 50)}`}
                    readOnly={!isAdding}
                    className={`w-full bg-slate-950 border ${formErrors.id ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white font-mono ${!isAdding ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {formErrors.id && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.id}</span>}
                </div>

                {/* Model */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Pumping Unit Model <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="unitModel"
                    defaultValue={editingPump?.unitModel || 'Lufkin Mark II M-640D-365-168'}
                    className={`w-full bg-slate-950 border ${formErrors.unitModel ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white`}
                  />
                  {formErrors.unitModel && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.unitModel}</span>}
                </div>

                {/* Associated Well */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Associated Wellbore</label>
                  <select
                    name="wellId"
                    defaultValue={editingPump?.wellId || availableWells[0]?.id || ''}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    {availableWells.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.id} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pump Type */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Pumping Technology</label>
                  <select
                    name="pumpType"
                    defaultValue={editingPump?.pumpType || 'Rod Pumping Unit (SRP)'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Rod Pumping Unit (SRP)">Rod Pumping Unit (SRP)</option>
                    <option value="Progressing Cavity Pump (PCP)">Progressing Cavity Pump (PCP)</option>
                    <option value="Hydraulic Piston Pump">Hydraulic Piston Pump</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Operating Status</label>
                  <select
                    name="status"
                    defaultValue={editingPump?.status || 'Operating'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Operating">Operating</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                    <option value="Pumping Off">Pumping Off</option>
                    <option value="Idle / Standby">Idle / Standby</option>
                  </select>
                </div>

                {/* Stroke Length */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Stroke Length (Inches)</label>
                  <input
                    type="number"
                    name="strokeLengthIn"
                    defaultValue={editingPump?.strokeLengthIn || 144}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* SPM */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Speed (SPM / RPM)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="spm"
                    defaultValue={editingPump?.spm || 5.2}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Fillage */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Pump Fillage (%)</label>
                  <input
                    type="number"
                    name="fillagePct"
                    defaultValue={editingPump?.fillagePct || 85}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Fluid Pound */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Fluid Pound Shock Detected</label>
                  <select
                    name="fluidPoundDetected"
                    defaultValue={editingPump?.fluidPoundDetected ? 'true' : 'false'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="false">No — Normal Pump Fillage</option>
                    <option value="true">Yes — Fluid Pound Active</option>
                  </select>
                </div>

                {/* Peak Load */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Peak Polished Rod Load (lb)</label>
                  <input
                    type="number"
                    name="pprlLbs"
                    defaultValue={editingPump?.pprlLbs || 22000}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Min Load */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Min Polished Rod Load (lb)</label>
                  <input
                    type="number"
                    name="mprlLbs"
                    defaultValue={editingPump?.mprlLbs || 6500}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Motor HP */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Motor Power (HP)</label>
                  <input
                    type="number"
                    name="motorHp"
                    defaultValue={editingPump?.motorHp || 60}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Rod String Taper / Notes</label>
                <input
                  type="text"
                  name="rodStringTaper"
                  defaultValue={editingPump?.rodStringTaper || '7/8" & 3/4" Grade D / Norris 97'}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingPump(null);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md"
                >
                  {isAdding ? 'Register Unit' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingPump && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Pump Unit Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete pumping unit <strong className="text-white">{deletingPump.unitModel}</strong> (<span className="font-mono text-cyan-400">{deletingPump.id}</span>) on {deletingPump.wellName}?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setDeletingPump(null)}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md"
              >
                Yes, Delete Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV IMPORT MODAL */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
                <span>Import Pump Units from CSV</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload a comma-separated values (.csv) file of rod pump or PCP equipment.
            </p>

            <div className="p-4 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 text-center space-y-2">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="text-xs text-slate-300">Choose a pump equipment CSV file</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Headers: ID, UnitModel, WellId, WellName, PumpType, Status, StrokeIn, SPM, PPRL, MPRL, Fillage
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
