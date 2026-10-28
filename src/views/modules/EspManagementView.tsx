import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
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
  Layers, 
  Zap, 
  Gauge, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { EspEquipment, EspStatus } from '../../types';
import { StorageService } from '../../services/storageService';

export const EspManagementView: React.FC = () => {
  const [esps, setEsps] = useState<EspEquipment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [materialFilter, setMaterialFilter] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof EspEquipment>('pumpSeries');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modals
  const [selectedEsp, setSelectedEsp] = useState<EspEquipment | null>(null);
  const [editingEsp, setEditingEsp] = useState<EspEquipment | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingEsp, setDeletingEsp] = useState<EspEquipment | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Notifications & Uploads
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const curveInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    const data = StorageService.getEsps();
    setEsps(data);
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const availableWells = useMemo(() => StorageService.getWells(), [esps]);

  // Filtered & Sorted
  const filteredEsps = useMemo(() => {
    return esps.filter(e => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        e.id.toLowerCase().includes(q) ||
        e.pumpSeries.toLowerCase().includes(q) ||
        e.wellName.toLowerCase().includes(q) ||
        e.wellId.toLowerCase().includes(q) ||
        e.impellerMaterial.toLowerCase().includes(q) ||
        e.separatorType.toLowerCase().includes(q) ||
        e.cableType.toLowerCase().includes(q);

      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      const matchesMaterial = materialFilter === 'All' || e.impellerMaterial.includes(materialFilter);

      return matchesSearch && matchesStatus && matchesMaterial;
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
  }, [esps, searchTerm, statusFilter, materialFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredEsps.length / rowsPerPage) || 1;
  const paginatedEsps = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredEsps.slice(start, start + rowsPerPage);
  }, [filteredEsps, currentPage, rowsPerPage]);

  const handleSort = (field: keyof EspEquipment) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Validation
  const validateForm = (esp: Partial<EspEquipment>): boolean => {
    const errors: Record<string, string> = {};
    if (!esp.id?.trim()) errors.id = 'ESP System ID is required (e.g. ESP-SYS-130)';
    if (!esp.pumpSeries?.trim()) errors.pumpSeries = 'Pump Series is required';
    if (!esp.wellId?.trim()) errors.wellId = 'Associated Well ID is required';
    if (!esp.stageCount || esp.stageCount <= 0) errors.stageCount = 'Stages must be > 0';
    if (!esp.motorHp || esp.motorHp <= 0) errors.motorHp = 'Motor HP must be > 0';
    if (!esp.totalHeadFt || esp.totalHeadFt <= 0) errors.totalHeadFt = 'Total dynamic head must be > 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEsp = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).trim();
    const pumpSeries = (formData.get('pumpSeries') as string).trim();
    const wellId = formData.get('wellId') as string;
    const matchedWell = availableWells.find(w => w.id === wellId);
    const wellName = matchedWell ? matchedWell.name : 'Unassigned Well';
    const status = formData.get('status') as EspStatus;
    const stageCount = Number(formData.get('stageCount'));
    const impellerMaterial = formData.get('impellerMaterial') as string;
    const motorHp = Number(formData.get('motorHp'));
    const totalHeadFt = Number(formData.get('totalHeadFt'));
    const motorVoltageV = Number(formData.get('motorVoltageV')) || 3850;
    const motorAmpsA = Number(formData.get('motorAmpsA')) || 52;
    const separatorType = formData.get('separatorType') as string;
    const sealChamber = formData.get('sealChamber') as string;
    const cableType = formData.get('cableType') as string;
    const cableLengthFt = Number(formData.get('cableLengthFt')) || 11500;
    const runLifeDays = Number(formData.get('runLifeDays')) || 0;
    const notes = (formData.get('notes') as string).trim();

    const payload: Partial<EspEquipment> = { id, pumpSeries, wellId, stageCount, motorHp, totalHeadFt };
    if (!validateForm(payload)) return;

    if (isAdding) {
      if (esps.some(item => item.id === id)) {
        setFormErrors({ id: `ESP System ID "${id}" already exists.` });
        return;
      }

      const newEsp: EspEquipment = {
        id,
        wellId,
        wellName,
        status,
        pumpSeries,
        stageCount,
        impellerMaterial,
        designFlowMinBpd: Math.round(stageCount * 8),
        designFlowMaxBpd: Math.round(stageCount * 20),
        bepFlowBpd: Math.round(stageCount * 13),
        totalHeadFt,
        motorHp,
        motorVoltageV,
        motorAmpsA,
        separatorType,
        sealChamber,
        cableType,
        cableLengthFt,
        runLifeDays,
        installationDate: new Date().toISOString().slice(0, 10),
        pumpCurveName: `${id}_H_Q_Curve.pdf`,
        updatedAt: new Date().toISOString(),
        notes,
      };

      const updated = StorageService.addEsp(newEsp);
      setEsps(updated);
      setIsAdding(false);
      showToast(`ESP System "${id}" registered for ${wellName}.`);
    } else if (editingEsp) {
      const updatedEsp: EspEquipment = {
        ...editingEsp,
        pumpSeries,
        wellId,
        wellName,
        status,
        stageCount,
        impellerMaterial,
        totalHeadFt,
        motorHp,
        motorVoltageV,
        motorAmpsA,
        separatorType,
        sealChamber,
        cableType,
        cableLengthFt,
        runLifeDays,
        notes,
        updatedAt: new Date().toISOString(),
      };

      const updated = StorageService.updateEsp(updatedEsp);
      setEsps(updated);
      setEditingEsp(null);
      showToast(`ESP System "${id}" updated successfully.`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingEsp) return;
    const updated = StorageService.deleteEsp(deletingEsp.id);
    setEsps(updated);
    showToast(`ESP System "${deletingEsp.id}" permanently deleted.`);
    setDeletingEsp(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Pump Series',
      'Well ID',
      'Well Name',
      'Status',
      'Stages',
      'Impeller Material',
      'BEP Flow (BPD)',
      'Total Head (ft)',
      'Motor HP',
      'Voltage (V)',
      'Amperage (A)',
      'Separator Type',
      'Seal Chamber',
      'Cable Type',
      'Cable Length (ft)',
      'Run Life (Days)',
      'Last Updated',
    ];

    const rows = filteredEsps.map(e => [
      e.id,
      `"${e.pumpSeries}"`,
      e.wellId,
      `"${e.wellName}"`,
      e.status,
      e.stageCount,
      `"${e.impellerMaterial}"`,
      e.bepFlowBpd,
      e.totalHeadFt,
      e.motorHp,
      e.motorVoltageV,
      e.motorAmpsA,
      `"${e.separatorType}"`,
      `"${e.sealChamber}"`,
      `"${e.cableType}"`,
      e.cableLengthFt,
      e.runLifeDays,
      e.updatedAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ALS_ESP_Equipment_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredEsps.length} ESP equipment systems to CSV.`);
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
            const [id, pumpSeries, wellId, wellName, statusRaw, stagesRaw, materialRaw, bepRaw, headRaw, hpRaw] = cols;
            if (!id || !pumpSeries) continue;

            const existingIndex = esps.findIndex(e => e.id === id);
            const importedEsp: EspEquipment = {
              id,
              pumpSeries,
              wellId: wellId || 'ALS-DEL-ESP-104',
              wellName: wellName || 'Phantom State 104-2H',
              status: (statusRaw as EspStatus) || 'Operating',
              stageCount: Number(stagesRaw) || 180,
              impellerMaterial: materialRaw || 'Ni-Resist Type 1',
              designFlowMinBpd: 1500,
              designFlowMaxBpd: 3500,
              bepFlowBpd: Number(bepRaw) || 2400,
              totalHeadFt: Number(headRaw) || 6200,
              motorHp: Number(hpRaw) || 240,
              motorVoltageV: 3850,
              motorAmpsA: 52,
              separatorType: 'Vortex Gas Separator',
              sealChamber: 'Double Chamber Bag',
              cableType: '#4 AWG Monel Armor',
              cableLengthFt: 11400,
              runLifeDays: 200,
              installationDate: new Date().toISOString().slice(0, 10),
              pumpCurveName: `${id}_Curve.pdf`,
              updatedAt: new Date().toISOString(),
              notes: 'Imported via CSV batch upload.',
            };

            if (existingIndex >= 0) {
              StorageService.updateEsp(importedEsp);
            } else {
              StorageService.addEsp(importedEsp);
            }
            count++;
          }
        }

        loadData();
        showToast(`Successfully imported ${count} ESP systems from CSV.`);
        setShowImportModal(false);
      } catch (err) {
        showToast('Failed to parse ESP CSV file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleUploadCurve = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEsp) return;
    const updated = {
      ...selectedEsp,
      pumpCurveName: file.name,
      updatedAt: new Date().toISOString(),
    };
    StorageService.updateEsp(updated);
    setSelectedEsp(updated);
    loadData();
    showToast(`Uploaded pump curve file "${file.name}".`);
  };

  const handleDownloadCurve = (docName?: string) => {
    const name = docName || 'Pump_Performance_Curve.pdf';
    const fakeContent = `ALS - ARTIFICIAL LIFT SUITE\nESP HEAD-CAPACITY (H-Q) CERTIFIED CURVE\nAssembly: ${selectedEsp?.pumpSeries} (${selectedEsp?.id})\nWellbore: ${selectedEsp?.wellName} (${selectedEsp?.wellId})\nStages: ${selectedEsp?.stageCount} | Motor: ${selectedEsp?.motorHp} HP\nStatus: DEMO SIMULATED DOCUMENT\nGenerated: ${new Date().toUTCString()}`;
    const blob = new Blob([fakeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name.endsWith('.pdf') ? name.replace('.pdf', '.txt') : `${name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded pump curve "${name}".`);
  };

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
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Electric Submersible Pump (ESP) String Inventory
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {esps.length} Submersible Strings
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Downhole centrifugal pump assemblies, impeller metallurgy, motor sizing, gas separator efficiency, and run-life tracking.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add ESP System</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
            placeholder="Search by ESP ID, series, well, impeller material, or cable..."
            className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
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
            <option value="Standby">Standby</option>
            <option value="Pulled / Failed">Pulled / Failed</option>
            <option value="Commissioning">Commissioning</option>
          </select>

          <select
            value={materialFilter}
            onChange={(e) => {
              setMaterialFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="All">All Metallurgy</option>
            <option value="Ni-Resist">Ni-Resist Type 1</option>
            <option value="Tungsten Carbide">Tungsten Carbide Reinforced</option>
            <option value="High Chrome">High Chrome Alloy</option>
            <option value="Coated">Fluoropolymer Coated</option>
          </select>

          {(searchTerm || statusFilter !== 'All' || materialFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('All');
                setMaterialFilter('All');
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
                    <span>ESP ID</span>
                    {sortField === 'id' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('pumpSeries')} 
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Pump Model & Series</span>
                    {sortField === 'pumpSeries' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
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
                  onClick={() => handleSort('stageCount')} 
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Stages</span>
                    {sortField === 'stageCount' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('motorHp')} 
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Motor HP</span>
                    {sortField === 'motorHp' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('totalHeadFt')} 
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Head (ft)</span>
                    {sortField === 'totalHeadFt' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('runLifeDays')} 
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Run Life</span>
                    {sortField === 'runLifeDays' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
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
              {paginatedEsps.length > 0 ? (
                paginatedEsps.map(esp => (
                  <tr key={esp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-cyan-400 font-bold">{esp.id}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(esp.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-white">{esp.pumpSeries}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{esp.impellerMaterial}</div>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-300">
                      <div>{esp.wellName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{esp.wellId}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-200">
                      {esp.stageCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-amber-400 font-bold">
                      {esp.motorHp} HP
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-cyan-400">
                      {esp.totalHeadFt.toLocaleString()} ft
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                      {esp.runLifeDays} d
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                        esp.status === 'Operating' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
                        esp.status === 'Warning' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                        esp.status === 'Standby' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                        esp.status === 'Commissioning' ? 'bg-blue-950/80 text-blue-300 border border-blue-800' :
                        'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}>
                        {esp.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          onClick={() => setSelectedEsp(esp)}
                          title="View ESP Assembly"
                          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setFormErrors({});
                            setEditingEsp(esp);
                          }}
                          title="Edit Assembly"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingEsp(esp)}
                          title="Delete Assembly"
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
                  <td colSpan={9} className="text-center py-8 text-slate-500 font-sans">
                    No matching ESP systems found.
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
              Showing {filteredEsps.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
              {Math.min(currentPage * rowsPerPage, filteredEsps.length)} of {filteredEsps.length} systems
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

      {/* DETAIL MODAL */}
      {selectedEsp && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tracking-tight">{selectedEsp.pumpSeries}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                    selectedEsp.status === 'Operating' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedEsp.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {selectedEsp.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: <span className="text-cyan-400 font-bold">{selectedEsp.id}</span> · Wellbore: {selectedEsp.wellName} ({selectedEsp.wellId})
                </div>
              </div>

              <button onClick={() => setSelectedEsp(null)} className="text-slate-400 hover:text-white font-mono p-1">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Total Dynamic Head</span>
                <span className="text-cyan-400 font-bold">{selectedEsp.totalHeadFt.toLocaleString()} ft</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedEsp.stageCount} Centrifugal Stages</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Submersible Motor</span>
                <span className="text-amber-400 font-bold">{selectedEsp.motorHp} HP</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedEsp.motorVoltageV}V / {selectedEsp.motorAmpsA}A</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Best Efficiency (BEP)</span>
                <span className="text-emerald-400 font-bold">{selectedEsp.bepFlowBpd.toLocaleString()} BFPD</span>
                <span className="text-slate-400 text-[10px] block font-sans">Range: {selectedEsp.designFlowMinBpd}–{selectedEsp.designFlowMaxBpd}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Run Life Days</span>
                <span className="text-white font-bold">{selectedEsp.runLifeDays} Days</span>
                <span className="text-slate-400 text-[10px] block font-sans">Installed: {selectedEsp.installationDate}</span>
              </div>
            </div>

            {/* Sub-Assembly Details */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Impeller Metallurgy:</span>
                <span className="text-white">{selectedEsp.impellerMaterial}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Gas Separation Sub:</span>
                <span className="text-cyan-300">{selectedEsp.separatorType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Seal / Protector Chamber:</span>
                <span className="text-white">{selectedEsp.sealChamber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 font-sans">Power Cable & Armor:</span>
                <span className="text-slate-300">{selectedEsp.cableType} ({selectedEsp.cableLengthFt.toLocaleString()} ft)</span>
              </div>
              {selectedEsp.notes && (
                <div className="pt-1 text-[11px] text-slate-400 font-sans">
                  <strong>Engineering Notes:</strong> {selectedEsp.notes}
                </div>
              )}
            </div>

            {/* Document / Curve Download Section */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Head-Capacity Certified Performance Curve (H-Q)</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Attached: {selectedEsp.pumpCurveName || 'ESP_Certified_Curve.pdf'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={curveInputRef}
                  onChange={handleUploadCurve}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.txt,.csv"
                />
                <button
                  type="button"
                  onClick={() => curveInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Curve</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadCurve(selectedEsp.pumpCurveName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
              <span>Last Modified: {new Date(selectedEsp.updatedAt).toUTCString()}</span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => {
                    const toEdit = selectedEsp;
                    setSelectedEsp(null);
                    setEditingEsp(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Edit ESP
                </button>
                <button
                  onClick={() => setSelectedEsp(null)}
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
      {(isAdding || editingEsp) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isAdding ? 'Register Downhole ESP Assembly' : `Edit ESP: ${editingEsp?.id}`}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingEsp(null);
                }}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEsp} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    ESP Assembly ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    defaultValue={editingEsp?.id || `ESP-SYS-${Math.floor(130 + Math.random() * 70)}`}
                    readOnly={!isAdding}
                    className={`w-full bg-slate-950 border ${formErrors.id ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white font-mono ${!isAdding ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {formErrors.id && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.id}</span>}
                </div>

                {/* Pump Series */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Pump Series & Designator <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="pumpSeries"
                    defaultValue={editingEsp?.pumpSeries || 'ALS-538 Series 182-Stage Ni-Resist'}
                    className={`w-full bg-slate-950 border ${formErrors.pumpSeries ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white`}
                  />
                  {formErrors.pumpSeries && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.pumpSeries}</span>}
                </div>

                {/* Associated Well */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Associated Wellbore</label>
                  <select
                    name="wellId"
                    defaultValue={editingEsp?.wellId || availableWells[0]?.id || ''}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    {availableWells.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.id} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Assembly Status</label>
                  <select
                    name="status"
                    defaultValue={editingEsp?.status || 'Operating'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Operating">Operating</option>
                    <option value="Warning">Warning</option>
                    <option value="Standby">Standby</option>
                    <option value="Pulled / Failed">Pulled / Failed</option>
                    <option value="Commissioning">Commissioning</option>
                  </select>
                </div>

                {/* Stage Count */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Impeller Stage Count</label>
                  <input
                    type="number"
                    name="stageCount"
                    defaultValue={editingEsp?.stageCount || 182}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Impeller Material */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Impeller Metallurgy</label>
                  <select
                    name="impellerMaterial"
                    defaultValue={editingEsp?.impellerMaterial || 'Ni-Resist Type 1 Impellers'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Ni-Resist Type 1 Impellers">Ni-Resist Type 1 Impellers</option>
                    <option value="Tungsten Carbide Bushing Reinforced">Tungsten Carbide Bushing Reinforced</option>
                    <option value="High Chrome Alloy with Sand Shields">High Chrome Alloy with Sand Shields</option>
                    <option value="Fluoropolymer Coated Ni-Resist">Fluoropolymer Coated Ni-Resist</option>
                  </select>
                </div>

                {/* Total Head */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Total Dynamic Head (ft)</label>
                  <input
                    type="number"
                    name="totalHeadFt"
                    defaultValue={editingEsp?.totalHeadFt || 6200}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Motor HP */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Submersible Motor (HP)</label>
                  <input
                    type="number"
                    name="motorHp"
                    defaultValue={editingEsp?.motorHp || 240}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Motor Voltage */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nameplate Voltage (V)</label>
                  <input
                    type="number"
                    name="motorVoltageV"
                    defaultValue={editingEsp?.motorVoltageV || 3850}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Motor Amperage */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Full Load Amperage (A)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="motorAmpsA"
                    defaultValue={editingEsp?.motorAmpsA || 52.4}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Gas Separator */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Separator Configuration</label>
                  <input
                    type="text"
                    name="separatorType"
                    defaultValue={editingEsp?.separatorType || 'Vortex-AGS 400 Rotary Gas Separator'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                {/* Seal Chamber */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Protector / Seal Chamber</label>
                  <input
                    type="text"
                    name="sealChamber"
                    defaultValue={editingEsp?.sealChamber || 'ALS Heavy-Duty Double Bag Aflas Tandem'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                {/* Cable Type */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Downhole Cable Specification</label>
                  <input
                    type="text"
                    name="cableType"
                    defaultValue={editingEsp?.cableType || '#4 AWG Flat EPDM/Lead/Monel Armor'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                {/* Cable Length */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Cable Length (ft)</label>
                  <input
                    type="number"
                    name="cableLengthFt"
                    defaultValue={editingEsp?.cableLengthFt || 11500}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Engineering Notes</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingEsp?.notes || ''}
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingEsp(null);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md"
                >
                  {isAdding ? 'Register ESP' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEsp && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm ESP Removal</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete ESP system <strong className="text-white">{deletingEsp.id}</strong> ({deletingEsp.pumpSeries}) on <span className="font-mono text-cyan-400">{deletingEsp.wellName}</span>?
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setDeletingEsp(null)}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md"
              >
                Yes, Delete System
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
                <span>Import ESP Systems from CSV</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload a comma-separated values (.csv) file of ESP equipment strings. Existing IDs will update; new ones will be registered.
            </p>

            <div className="p-4 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 text-center space-y-2">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="text-xs text-slate-300">Select an ESP catalog CSV file</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Headers: ID, PumpSeries, WellId, WellName, Status, Stages, Material, BEP, Head, MotorHp
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
