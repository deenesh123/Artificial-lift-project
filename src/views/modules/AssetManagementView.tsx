import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle, 
  SlidersHorizontal,
  Flame,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  FileText,
  Clock,
  RotateCcw,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { WellAsset, LiftType, WellStatus } from '../../types';
import { StorageService } from '../../services/storageService';

export const AssetManagementView: React.FC = () => {
  const [wells, setWells] = useState<WellAsset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tableMode, setTableMode] = useState<'hierarchy' | 'operations'>('hierarchy');
  const [liftFilter, setLiftFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [basinFilter, setBasinFilter] = useState<string>('All');
  const [zoneFilter, setZoneFilter] = useState<string>('All');
  const [stationFilter, setStationFilter] = useState<string>('All');
  
  // Sorting
  const [sortField, setSortField] = useState<keyof WellAsset>('wellCode');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modals & Drawers
  const [selectedWell, setSelectedWell] = useState<WellAsset | null>(null);
  const [editingWell, setEditingWell] = useState<WellAsset | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingWell, setDeletingWell] = useState<WellAsset | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  
  // Notifications
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const schematicInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    const data = StorageService.getWells();
    setWells(data);
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filtered & Sorted Wells
  const filteredWells = useMemo(() => {
    return wells.filter(w => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        w.name.toLowerCase().includes(q) ||
        w.id.toLowerCase().includes(q) ||
        (w.wellCode && w.wellCode.toLowerCase().includes(q)) ||
        (w.zone && w.zone.toLowerCase().includes(q)) ||
        (w.oilStation && w.oilStation.toLowerCase().includes(q)) ||
        (w.plinth && w.plinth.toLowerCase().includes(q)) ||
        (w.assetCategory && w.assetCategory.toLowerCase().includes(q)) ||
        (w.assetType && w.assetType.toLowerCase().includes(q)) ||
        w.padName.toLowerCase().includes(q) ||
        w.basin.toLowerCase().includes(q) ||
        w.field.toLowerCase().includes(q) ||
        w.operator.toLowerCase().includes(q);

      const matchesLift = liftFilter === 'All' || w.liftType === liftFilter;
      const matchesStatus = statusFilter === 'All' || w.status === statusFilter;
      const matchesBasin = basinFilter === 'All' || w.basin.includes(basinFilter);
      const matchesZone = zoneFilter === 'All' || (w.zone && w.zone.toLowerCase().includes(zoneFilter.toLowerCase()));
      const matchesStation = stationFilter === 'All' || (w.oilStation && w.oilStation.toLowerCase().includes(stationFilter.toLowerCase()));

      return matchesSearch && matchesLift && matchesStatus && matchesBasin && matchesZone && matchesStation;
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
  }, [wells, searchTerm, liftFilter, statusFilter, basinFilter, zoneFilter, stationFilter, sortField, sortDirection]);

  // Paginated records
  const totalPages = Math.ceil(filteredWells.length / rowsPerPage) || 1;
  const paginatedWells = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredWells.slice(start, start + rowsPerPage);
  }, [filteredWells, currentPage, rowsPerPage]);

  const handleSort = (field: keyof WellAsset) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Validation
  const validateWellForm = (well: Partial<WellAsset>): boolean => {
    const errors: Record<string, string> = {};
    if (!well.id?.trim()) errors.id = 'Well ID is required (e.g. ALS-DEL-ESP-120)';
    if (!well.name?.trim()) errors.name = 'Well Name is required';
    if (!well.padName?.trim()) errors.padName = 'Pad Name is required';
    if (!well.basin?.trim()) errors.basin = 'Basin is required';
    if (!well.field?.trim()) errors.field = 'Field formation is required';
    if (!well.totalDepthFt || well.totalDepthFt <= 0) errors.totalDepthFt = 'Total depth must be greater than 0';
    if (well.waterCutPct !== undefined && (well.waterCutPct < 0 || well.waterCutPct > 100)) {
      errors.waterCutPct = 'Water cut must be between 0% and 100%';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save Add / Edit
  const handleSaveWell = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).trim();
    const name = (formData.get('name') as string).trim();
    const padName = (formData.get('padName') as string).trim();
    const basin = formData.get('basin') as string;
    const field = formData.get('field') as string;
    const liftType = formData.get('liftType') as LiftType;
    const status = formData.get('status') as WellStatus;
    const totalDepthFt = Number(formData.get('totalDepthFt'));
    const targetBopd = Number(formData.get('targetBopd'));
    const currentBopd = Number(formData.get('currentBopd'));
    const grossFluidBpd = Number(formData.get('grossFluidBpd'));
    const waterCutPct = Number(formData.get('waterCutPct'));
    const intakePressurePsi = Number(formData.get('intakePressurePsi'));
    const dischargePressurePsi = Number(formData.get('dischargePressurePsi'));
    const motorTempF = Number(formData.get('motorTempF'));
    const vfdFrequencyHz = Number(formData.get('vfdFrequencyHz'));

    const wellPayload: Partial<WellAsset> = {
      id,
      name,
      padName,
      basin,
      field,
      liftType,
      status,
      totalDepthFt,
      targetBopd,
      currentBopd,
      grossFluidBpd,
      waterCutPct,
      intakePressurePsi,
      dischargePressurePsi,
      motorTempF,
      vfdFrequencyHz,
    };

    if (!validateWellForm(wellPayload)) {
      return;
    }

    if (isAdding) {
      // Check if duplicate ID exists
      if (wells.some(w => w.id === id)) {
        setFormErrors({ id: `Well ID "${id}" already exists. Please choose a unique ID.` });
        return;
      }

      const newWell: WellAsset = {
        id,
        name,
        padName,
        basin,
        field,
        liftType,
        status,
        operator: 'ALS Operating Co.',
        spudDate: new Date().toISOString().slice(0, 10),
        totalDepthFt,
        casingSizeIn: 5.5,
        tubingSizeIn: 2.875,
        targetBopd,
        currentBopd,
        grossFluidBpd,
        waterCutPct,
        gasMcfd: Math.round(currentBopd * 1.5),
        intakePressurePsi,
        dischargePressurePsi,
        wellheadTempF: 115,
        motorTempF,
        vibrationG: 0.28,
        vfdFrequencyHz,
        motorCurrentA: Math.round(vfdFrequencyHz * 0.9 * 10) / 10,
        powerKw: Math.round(vfdFrequencyHz * 3.1),
        runLifeDays: 1,
        lastServiceDate: new Date().toISOString().slice(0, 10),
        healthScore: status === 'Nominal' ? 95 : status === 'Warning' ? 70 : 40,
        coordinates: { lat: 31.84 + Math.random() * 0.1, lng: -103.58 - Math.random() * 0.1 },
        schematicDocName: `${id}_Wellhead_Schematic.pdf`,
        updatedAt: new Date().toISOString(),
      };

      const updated = StorageService.addWell(newWell);
      setWells(updated);
      setIsAdding(false);
      showToast(`Asset "${name}" (${id}) registered successfully.`);
    } else if (editingWell) {
      const updatedWell: WellAsset = {
        ...editingWell,
        name,
        padName,
        basin,
        field,
        liftType,
        status,
        totalDepthFt,
        targetBopd,
        currentBopd,
        grossFluidBpd,
        waterCutPct,
        intakePressurePsi,
        dischargePressurePsi,
        motorTempF,
        vfdFrequencyHz,
        updatedAt: new Date().toISOString(),
      };

      const updated = StorageService.updateWell(updatedWell);
      setWells(updated);
      setEditingWell(null);
      showToast(`Asset "${name}" updated successfully.`);
    }
  };

  // Delete Action
  const handleConfirmDelete = () => {
    if (!deletingWell) return;
    const updated = StorageService.deleteWell(deletingWell.id);
    setWells(updated);
    showToast(`Asset "${deletingWell.name}" (${deletingWell.id}) was permanently deleted.`);
    setDeletingWell(null);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Asset Short Name',
      'Asset Long Name',
      'Asset Start Date',
      'Zone',
      'Oil Station',
      'Plinth',
      'Artificial Lift Type',
      'Asset Category',
      'Asset Type',
      'Asset Monitoring',
      'Well ID',
      'Pad Name',
      'Basin',
      'Field Formation',
      'Status',
      'Total Depth (ft)',
      'Target BOPD',
      'Current BOPD',
      'Gross Fluid (BFPD)',
      'Water Cut (%)',
      'Intake Pressure (psi)',
      'Discharge Pressure (psi)',
      'Motor Temp (°F)',
      'VFD Frequency (Hz)',
      'Run Life (Days)',
      'Last Updated',
    ];

    const rows = filteredWells.map(w => [
      `"${w.wellCode || w.id}"`,
      `"${w.name}"`,
      `"${w.spudDate || '2024-03-15'}"`,
      `"${w.zone || 'Western Zone'}"`,
      `"${w.oilStation || 'STN-01'}"`,
      `"${w.plinth || 'PLN-001'}"`,
      `"${w.liftType}"`,
      `"${w.assetCategory || 'Well'}"`,
      `"${w.assetType || 'ESP Production'}"`,
      '"Yes"',
      w.id,
      `"${w.padName}"`,
      `"${w.basin}"`,
      `"${w.field}"`,
      w.status,
      w.totalDepthFt,
      w.targetBopd,
      w.currentBopd,
      w.grossFluidBpd,
      w.waterCutPct,
      w.intakePressurePsi,
      w.dischargePressurePsi,
      w.motorTempF,
      w.vfdFrequencyHz,
      w.runLifeDays,
      w.updatedAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ALS_Asset_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredWells.length} assets to CSV.`);
  };

  // CSV Import
  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          showToast('CSV file is empty or missing data rows.', 'error');
          return;
        }

        let importedCount = 0;
        const newWells: WellAsset[] = [];

        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
          if (cols.length >= 6) {
            const [id, name, padName, basin, field, liftType, statusRaw, depthRaw, targetRaw, currentRaw] = cols;
            if (!id || !name) continue;

            const existingIndex = wells.findIndex(w => w.id === id);
            const importedWell: WellAsset = {
              id,
              name,
              padName: padName || 'Central Pad',
              basin: basin || 'Permian - Delaware',
              field: field || 'Wolfcamp A',
              liftType: (liftType as LiftType) || 'ESP',
              status: (statusRaw as WellStatus) || 'Nominal',
              operator: 'ALS Operating Co.',
              spudDate: new Date().toISOString().slice(0, 10),
              totalDepthFt: Number(depthRaw) || 10500,
              casingSizeIn: 5.5,
              tubingSizeIn: 2.875,
              targetBopd: Number(targetRaw) || 600,
              currentBopd: Number(currentRaw) || 580,
              grossFluidBpd: (Number(currentRaw) || 580) * 2.5,
              waterCutPct: 60,
              gasMcfd: (Number(currentRaw) || 580) * 1.4,
              intakePressurePsi: 800,
              dischargePressurePsi: 2800,
              wellheadTempF: 115,
              motorTempF: 195,
              vibrationG: 0.28,
              vfdFrequencyHz: 55.0,
              motorCurrentA: 50.0,
              powerKw: 170,
              runLifeDays: 100,
              lastServiceDate: new Date().toISOString().slice(0, 10),
              healthScore: 90,
              coordinates: { lat: 31.84, lng: -103.58 },
              schematicDocName: `${id}_Imported_Schematic.pdf`,
              updatedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
              StorageService.updateWell(importedWell);
            } else {
              StorageService.addWell(importedWell);
            }
            importedCount++;
          }
        }

        loadData();
        showToast(`Successfully imported ${importedCount} wells from CSV.`);
        setShowImportModal(false);
      } catch (err) {
        showToast('Failed to parse CSV file. Verify format.', 'error');
      }
    };
    reader.readAsText(file);
  };

  // Upload Schematic Simulation
  const handleUploadSchematic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedWell) return;
    const updated = {
      ...selectedWell,
      schematicDocName: file.name,
      updatedAt: new Date().toISOString(),
    };
    StorageService.updateWell(updated);
    setSelectedWell(updated);
    loadData();
    showToast(`Uploaded schematic "${file.name}" for ${selectedWell.name}.`);
  };

  // Download Schematic Simulation
  const handleDownloadSchematic = (docName?: string) => {
    const name = docName || 'Wellbore_Schematic.pdf';
    const fakeContent = `ALS - ARTIFICIAL LIFT SUITE\nEQUIPMENT SCHEMATIC SPECIFICATION\nAsset: ${selectedWell?.name} (${selectedWell?.id})\nDocument: ${name}\nStatus: DEMO SIMULATED DOCUMENT\nGenerated: ${new Date().toUTCString()}`;
    const blob = new Blob([fakeContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name.endsWith('.pdf') ? name.replace('.pdf', '.txt') : `${name}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded documentation "${name}".`);
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
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Well Asset & Field Registry
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {wells.length} Monitored Assets
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Enterprise database of producing wellbores, lift types, reservoir targets, and live completion parameters. Changes persist locally.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              StorageService.resetAllToDefaults();
              loadData();
              showToast('Restored all 4 modules to standard benchmark demo data.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700 font-medium transition-colors"
            title="Reset to 16 default realistic wells"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

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
            <span>Add Well Asset</span>
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by ID, name, pad, basin, or formation..."
            className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        {/* View Mode Switcher & Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Table Mode Toggle */}
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setTableMode('hierarchy')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                tableMode === 'hierarchy' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Hierarchy (Slide 24)
            </button>
            <button
              onClick={() => setTableMode('operations')}
              className={`px-3 py-1 rounded text-xs font-mono font-medium transition-colors ${
                tableMode === 'operations' ? 'bg-cyan-600 text-white font-bold shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Operations & Rates
            </button>
          </div>

          <select
            value={zoneFilter}
            onChange={(e) => {
              setZoneFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="All">All Zones</option>
            <option value="Western">Western Zone</option>
            <option value="Northern">Northern Zone</option>
            <option value="Central">Central Basin</option>
          </select>

          <select
            value={stationFilter}
            onChange={(e) => {
              setStationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="All">All Stations</option>
            <option value="STN-01">Station 01 (STN-01)</option>
            <option value="STN-02">Station 02 (STN-02)</option>
            <option value="STN-24">Station 24 (STN-24)</option>
          </select>

          <select
            value={liftFilter}
            onChange={(e) => {
              setLiftFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="All">All Lift Types</option>
            <option value="ESP">ESP</option>
            <option value="Rod Pump">Rod Pump</option>
            <option value="Gas Lift">Gas Lift</option>
            <option value="PCP">PCP</option>
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
            <option value="Nominal">Nominal</option>
            <option value="Warning">Warning</option>
            <option value="Critical">Critical</option>
            <option value="Offline">Offline</option>
            <option value="Testing">Testing</option>
          </select>

          <select
            value={basinFilter}
            onChange={(e) => {
              setBasinFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="All">All Basins</option>
            <option value="Delaware">Delaware Basin</option>
            <option value="Midland">Midland Basin</option>
            <option value="Eagle Ford">Eagle Ford</option>
            <option value="Bakken">Bakken</option>
          </select>

          {(searchTerm || liftFilter !== 'All' || statusFilter !== 'All' || basinFilter !== 'All' || zoneFilter !== 'All' || stationFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setLiftFilter('All');
                setStatusFilter('All');
                setBasinFilter('All');
                setZoneFilter('All');
                setStationFilter('All');
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
          {tableMode === 'hierarchy' ? (
            /* SLIDE 24 HIERARCHY & INFRASTRUCTURE REGISTRY TABLE */
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800 select-none">
                <tr>
                  <th onClick={() => handleSort('spudDate' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Asset Start Date</span>
                      {sortField === 'spudDate' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('zone' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Zone</span>
                      {sortField === 'zone' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('oilStation' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Oil Station</span>
                      {sortField === 'oilStation' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('plinth' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Plinth</span>
                      {sortField === 'plinth' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('liftType')} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Artificial Lift</span>
                      {sortField === 'liftType' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('assetCategory' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Asset Category</span>
                      {sortField === 'assetCategory' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('assetType' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Asset Type</span>
                      {sortField === 'assetType' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('wellCode' as any)} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Asset Short Name</span>
                      {sortField === 'wellCode' as any && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th onClick={() => handleSort('name')} className="px-3 py-3 cursor-pointer hover:text-white">
                    <div className="flex items-center gap-1">
                      <span>Asset Long Name</span>
                      {sortField === 'name' && (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />)}
                    </div>
                  </th>
                  <th className="px-3 py-3 text-center">Asset Monitoring</th>
                  <th className="px-3 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                {paginatedWells.length > 0 ? (
                  paginatedWells.map(well => (
                    <tr key={well.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                        {well.spudDate || '2024-03-15'}
                      </td>
                      <td className="px-3 py-2.5 font-sans text-slate-200 font-medium">
                        {well.zone || 'Western'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-cyan-300 font-bold">
                        {well.oilStation || 'STN-01'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-300">
                        {well.plinth || 'PLN-001'}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {well.liftType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-sans text-slate-300">
                        {well.assetCategory || 'Well'}
                      </td>
                      <td className="px-3 py-2.5 font-sans text-slate-400 text-[11px]">
                        {well.assetType || 'ESP Production'}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-bold text-cyan-400">
                        {well.wellCode || well.id}
                      </td>
                      <td className="px-3 py-2.5 font-sans text-white font-medium">
                        {well.name}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Yes (Monitored)
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedWell(well)}
                            title="View Details"
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setFormErrors({});
                              setEditingWell(well);
                            }}
                            title="Edit Well"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingWell(well)}
                            title="Delete Well"
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
                    <td colSpan={11} className="text-center py-8 text-slate-500 font-sans">
                      No matching well assets found in hierarchy registry. Try adjusting filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            /* OPERATIONS & PRODUCTION REGISTRY TABLE */
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800 select-none">
                <tr>
                  <th 
                    onClick={() => handleSort('id')} 
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Well ID & Pad</span>
                      {sortField === 'id' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('name')} 
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Well Name</span>
                      {sortField === 'name' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('basin')} 
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Basin / Field</span>
                      {sortField === 'basin' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('liftType')} 
                    className="px-4 py-3 cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Lift System</span>
                      {sortField === 'liftType' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('currentBopd')} 
                    className="px-4 py-3 text-right cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Oil Rate (BOPD)</span>
                      {sortField === 'currentBopd' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                    </div>
                  </th>
                  <th 
                    onClick={() => handleSort('intakePressurePsi')} 
                    className="px-4 py-3 text-right cursor-pointer hover:text-white"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Intake Press</span>
                      {sortField === 'intakePressurePsi' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
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
                {paginatedWells.length > 0 ? (
                  paginatedWells.map(well => (
                    <tr key={well.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-cyan-400 font-bold">{well.id}</div>
                        <div className="text-[10px] text-slate-400 font-sans">{well.padName}</div>
                      </td>
                      <td className="px-4 py-3 font-sans">
                        <div className="font-semibold text-white">{well.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Updated {well.updatedAt ? new Date(well.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-300">
                        <div>{well.basin}</div>
                        <div className="text-[10px] text-slate-500">{well.field}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 font-mono">
                          {well.liftType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span className="text-emerald-400 font-bold">{well.currentBopd.toLocaleString()}</span>
                        <span className="text-slate-500 text-[10px] block">/ {well.targetBopd} tgt</span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                        {well.intakePressurePsi} psi
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-300">
                        {well.runLifeDays} d
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                          well.status === 'Nominal' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
                          well.status === 'Warning' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                          well.status === 'Critical' ? 'bg-rose-950/80 text-rose-300 border border-rose-800' :
                          well.status === 'Testing' ? 'bg-blue-950/80 text-blue-300 border border-blue-800' :
                          'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {well.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 font-sans">
                          <button
                            onClick={() => setSelectedWell(well)}
                            title="View Details"
                            className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setFormErrors({});
                              setEditingWell(well);
                            }}
                            title="Edit Well"
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingWell(well)}
                            title="Delete Well"
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
                      No matching well assets found. Try adjusting search filters or import a dataset.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
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
              Showing {filteredWells.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
              {Math.min(currentPage * rowsPerPage, filteredWells.length)} of {filteredWells.length} assets
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

      {/* DETAIL DRAWER / MODAL */}
      {selectedWell && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-3xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tracking-tight">{selectedWell.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                    selectedWell.status === 'Nominal' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedWell.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    selectedWell.status === 'Critical' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {selectedWell.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: <span className="text-cyan-400 font-bold">{selectedWell.id}</span> · Pad: {selectedWell.padName} · Operator: {selectedWell.operator}
                </div>
              </div>

              <button 
                onClick={() => setSelectedWell(null)}
                className="text-slate-400 hover:text-white p-1 rounded font-mono"
              >
                ✕
              </button>
            </div>

            {/* Spec Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Basin & Field</span>
                <span className="text-white font-medium">{selectedWell.basin}</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedWell.field}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Total Depth (MD)</span>
                <span className="text-cyan-400 font-bold">{selectedWell.totalDepthFt.toLocaleString()} ft</span>
                <span className="text-slate-400 text-[10px] block font-sans">Casing: {selectedWell.casingSizeIn}"</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Artificial Lift Type</span>
                <span className="text-amber-400 font-bold">{selectedWell.liftType}</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedWell.vfdFrequencyHz} Hz</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Run Life Days</span>
                <span className="text-emerald-400 font-bold">{selectedWell.runLifeDays} Days</span>
                <span className="text-slate-400 text-[10px] block font-sans">Spud: {selectedWell.spudDate}</span>
              </div>
            </div>

            {/* Production & Downhole Telemetry */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 space-y-3">
              <h4 className="text-xs font-bold text-white font-sans uppercase tracking-wider">
                Production & Sensor Telemetry Snapshot
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans">Current Oil Rate</span>
                  <span className="text-emerald-400 font-bold text-sm">{selectedWell.currentBopd} BOPD</span>
                  <span className="text-slate-500 text-[10px] block">Target: {selectedWell.targetBopd}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans">Gross Fluid Rate</span>
                  <span className="text-cyan-300 font-bold text-sm">{selectedWell.grossFluidBpd} BFPD</span>
                  <span className="text-slate-500 text-[10px] block">Water Cut: {selectedWell.waterCutPct}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans">Intake / Discharge</span>
                  <span className="text-cyan-400 font-bold text-sm">{selectedWell.intakePressurePsi} / {selectedWell.dischargePressurePsi}</span>
                  <span className="text-slate-500 text-[10px] block">psi (diff: +{selectedWell.dischargePressurePsi - selectedWell.intakePressurePsi})</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] font-sans">Downhole Motor Temp</span>
                  <span className={`font-bold text-sm ${selectedWell.motorTempF > 220 ? 'text-rose-400' : 'text-slate-200'}`}>
                    {selectedWell.motorTempF} °F
                  </span>
                  <span className="text-slate-500 text-[10px] block">Vibration: {selectedWell.vibrationG}g</span>
                </div>
              </div>
            </div>

            {/* Document & Schematic Section */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Completion Diagram & Mechanical Schematic</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Attached: {selectedWell.schematicDocName || 'Default_Schematic.pdf'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={schematicInputRef}
                  onChange={handleUploadSchematic}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.csv,.txt"
                />
                <button
                  type="button"
                  onClick={() => schematicInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadSchematic(selectedWell.schematicDocName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
              <span>Last Modified: {selectedWell.updatedAt ? new Date(selectedWell.updatedAt).toUTCString() : 'Initial Record'}</span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => {
                    const toEdit = selectedWell;
                    setSelectedWell(null);
                    setEditingWell(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Edit Asset
                </button>
                <button
                  onClick={() => setSelectedWell(null)}
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
      {(isAdding || editingWell) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isAdding ? 'Register New Artificial Lift Asset' : `Edit Well Asset: ${editingWell?.name}`}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingWell(null);
                }}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveWell} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Well Asset ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    defaultValue={editingWell?.id || `ALS-PERM-ESP-${Math.floor(120 + Math.random() * 80)}`}
                    readOnly={!isAdding}
                    className={`w-full bg-slate-950 border ${formErrors.id ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white font-mono ${!isAdding ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {formErrors.id && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.id}</span>}
                </div>

                {/* Name */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Well Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingWell?.name || ''}
                    placeholder="e.g. Phantom State 106-4H"
                    className={`w-full bg-slate-950 border ${formErrors.name ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white`}
                  />
                  {formErrors.name && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.name}</span>}
                </div>

                {/* Pad Name */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Pad Name / Battery <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="padName"
                    defaultValue={editingWell?.padName || 'Phantom State Pad Bravo'}
                    className={`w-full bg-slate-950 border ${formErrors.padName ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white`}
                  />
                </div>

                {/* Basin */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Basin Region</label>
                  <select
                    name="basin"
                    defaultValue={editingWell?.basin || 'Permian - Delaware'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Permian - Delaware">Permian - Delaware</option>
                    <option value="Permian - Midland">Permian - Midland</option>
                    <option value="Eagle Ford">Eagle Ford</option>
                    <option value="Bakken">Bakken</option>
                  </select>
                </div>

                {/* Formation Field */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Formation Target</label>
                  <input
                    type="text"
                    name="field"
                    defaultValue={editingWell?.field || 'Wolfcamp A Upper'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white"
                  />
                </div>

                {/* Lift Type */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Artificial Lift System</label>
                  <select
                    name="liftType"
                    defaultValue={editingWell?.liftType || 'ESP'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="ESP">ESP (Electric Submersible Pump)</option>
                    <option value="Rod Pump">Rod Pump (SRP Beam Unit)</option>
                    <option value="Gas Lift">Gas Lift Continuous</option>
                    <option value="PCP">Progressing Cavity Pump (PCP)</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Operational Status</label>
                  <select
                    name="status"
                    defaultValue={editingWell?.status || 'Nominal'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Nominal">Nominal</option>
                    <option value="Warning">Warning</option>
                    <option value="Critical">Critical</option>
                    <option value="Offline">Offline</option>
                    <option value="Testing">Testing</option>
                  </select>
                </div>

                {/* Total Depth */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Total Depth (ft MD)</label>
                  <input
                    type="number"
                    name="totalDepthFt"
                    defaultValue={editingWell?.totalDepthFt || 11200}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Target BOPD */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Target Rate (BOPD)</label>
                  <input
                    type="number"
                    name="targetBopd"
                    defaultValue={editingWell?.targetBopd || 750}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Current BOPD */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Current Oil Rate (BOPD)</label>
                  <input
                    type="number"
                    name="currentBopd"
                    defaultValue={editingWell?.currentBopd || 720}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Gross Fluid */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Gross Fluid (BFPD)</label>
                  <input
                    type="number"
                    name="grossFluidBpd"
                    defaultValue={editingWell?.grossFluidBpd || 2000}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Water Cut */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Water Cut (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="waterCutPct"
                    defaultValue={editingWell?.waterCutPct ?? 62.5}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Intake Press */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Intake Pressure (psi)</label>
                  <input
                    type="number"
                    name="intakePressurePsi"
                    defaultValue={editingWell?.intakePressurePsi || 820}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Discharge Press */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Discharge Pressure (psi)</label>
                  <input
                    type="number"
                    name="dischargePressurePsi"
                    defaultValue={editingWell?.dischargePressurePsi || 2850}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Motor Temp */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Motor Winding Temp (°F)</label>
                  <input
                    type="number"
                    name="motorTempF"
                    defaultValue={editingWell?.motorTempF || 195}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* VFD Frequency */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">VFD Frequency (Hz)</label>
                  <input
                    type="number"
                    step="0.5"
                    name="vfdFrequencyHz"
                    defaultValue={editingWell?.vfdFrequencyHz || 58.0}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingWell(null);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md"
                >
                  {isAdding ? 'Register Asset' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingWell && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Asset Deletion</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete well asset <strong className="text-white">{deletingWell.name}</strong> (<span className="font-mono text-cyan-400">{deletingWell.id}</span>)?
            </p>
            <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded border border-rose-800/60 font-mono">
              Warning: This action will remove the asset from supervisory SCADA monitoring tables and persist to browser storage.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setDeletingWell(null)}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md"
              >
                Yes, Delete Asset
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
                <span>Import Assets from CSV</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload a comma-separated values (.csv) file containing well records. Existing well IDs will be updated; new IDs will be added.
            </p>

            <div className="p-4 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 text-center space-y-2">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="text-xs text-slate-300">Choose a CSV file from your computer</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Columns: ID, Name, Pad, Basin, Formation, LiftType, Status, Depth, TargetBopd, CurrentBopd
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
