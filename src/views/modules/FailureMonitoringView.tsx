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
  TrendingUp, 
  X,
  Truck,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Check,
  Cpu
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { FailureIncident, CableShopItem, CableShopWorkflowStage } from '../../types';
import { OperationsService } from '../../services/operationsService';
import { ROOT_CAUSE_PARETO } from '../../data/mockData';
import { StorageService } from '../../services/storageService';
import { 
  CABLE_SHOP_STAGES, 
  CABLE_FAILURE_REASONS_TABLE, 
  CABLE_FAILURE_BY_REASON, 
  CABLE_RUN_DAYS_HISTOGRAM, 
  CABLE_INSTALL_COUNT_DISTRIBUTION, 
  MANUFACTURER_FAILURE_REASONS 
} from '../../data/cableShopData';

interface FailureMonitoringViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (id: string | null) => void;
}

export const FailureMonitoringView: React.FC<FailureMonitoringViewProps> = ({
  selectedAssetId,
  onSelectAssetId,
}) => {
  // Navigation Tabs: Analytics (Slides 11-15), Cable Shop Operations (Slide 16), RCA & Teardown Log
  const [mainTab, setMainTab] = useState<'analytics' | 'cable-shop' | 'rca-teardown'>('analytics');

  // Cable Shop State
  const [cableShopItems, setCableShopItems] = useState<CableShopItem[]>(() => StorageService.getCableShopItems());
  const [activeStageFilter, setActiveStageFilter] = useState<string>('All');
  const [cableSearchTerm, setCableSearchTerm] = useState('');
  const [inspectSpool, setInspectSpool] = useState<CableShopItem | null>(null);
  const [docModalSpool, setDocModalSpool] = useState<CableShopItem | null>(null);
  const [isAddSpoolOpen, setIsAddSpoolOpen] = useState(false);
  const [newSpoolForm, setNewSpoolForm] = useState({
    partName: 'Cable/Cable/MLE',
    wellName: 'DEMO-WELL-001',
    vendorPartNumber: '1000261368 / 4 EPDM GAL',
    currentSerialNumber: 'SN-EPDM-9041A',
    spooledToReelNumber: '78-0261',
    totalShippingLengthFt: 4200,
    manufacturer: 'Baker Hughes',
    classification: 'New' as const,
    testVoltageKv: 15.0,
    insulationResistanceMohm: 2800,
  });

  // Failure Analytics State (Slides 11-15)
  const [failureTableSearch, setFailureTableSearch] = useState('');
  const [mfgFilter, setMfgFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [warehouseFilter, setWarehouseFilter] = useState('All');
  const [selectedDonutReason, setSelectedDonutReason] = useState<string | null>(null);

  // RCA Teardown Log State
  const [failures, setFailures] = useState<FailureIncident[]>(() => OperationsService.getFailures());
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedFailure, setSelectedFailure] = useState<FailureIncident | null>(null);
  const [editingActionsTarget, setEditingActionsTarget] = useState<FailureIncident | null>(null);
  const [actionNotesInput, setActionNotesInput] = useState<string>('');
  const [actionStatusInput, setActionStatusInput] = useState<FailureIncident['resolutionStatus']>('Corrective Action Implemented');
  const [notice, setNotice] = useState<string | null>(null);

  const wells = useMemo(() => StorageService.getWells(), []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Weibull curve
  const weibullData = [
    { days: 100, espSurvival: 99, rodSurvival: 99 },
    { days: 200, espSurvival: 96, rodSurvival: 98 },
    { days: 300, espSurvival: 91, rodSurvival: 97 },
    { days: 400, espSurvival: 82, rodSurvival: 94 },
    { days: 500, espSurvival: 69, rodSurvival: 90 },
    { days: 600, espSurvival: 52, rodSurvival: 85 },
    { days: 700, espSurvival: 38, rodSurvival: 78 },
    { days: 800, espSurvival: 24, rodSurvival: 68 },
    { days: 900, espSurvival: 14, rodSurvival: 55 },
    { days: 1000, espSurvival: 8, rodSurvival: 42 },
  ];

  // Stage Advancement in Cable Shop (Slide 16)
  const handleAdvanceStage = (item: CableShopItem) => {
    const currentIndex = CABLE_SHOP_STAGES.findIndex(s => s.stage === item.stage);
    if (currentIndex >= 0 && currentIndex < CABLE_SHOP_STAGES.length - 1) {
      const nextStage = CABLE_SHOP_STAGES[currentIndex + 1].stage;
      const updated = StorageService.advanceCableShopStage(item.id, nextStage);
      setCableShopItems(updated);
      showToast(`Advanced spool ${item.spooledToReelNumber} to stage "${nextStage}".`);
    } else {
      showToast(`Spool ${item.spooledToReelNumber} is at final stage (${item.stage}).`);
    }
  };

  // Add new spool
  const handleCreateSpool = (e: React.FormEvent) => {
    e.preventDefault();
    const item: CableShopItem = {
      id: `CS-${Date.now().toString().slice(-4)}`,
      recordedDate: new Date().toISOString().slice(0, 10),
      stage: 'Equipment Selection',
      conductorContinuity: 'Pass',
      notes: `New reel prepared for delivery. Test voltage ${newSpoolForm.testVoltageKv}kV passed.`,
      updatedAt: new Date().toISOString(),
      ...newSpoolForm,
    };
    const updated = StorageService.addCableShopItem(item);
    setCableShopItems(updated);
    setIsAddSpoolOpen(false);
    showToast(`Registered new spool Reel #${item.spooledToReelNumber} in Cable Shop.`);
  };

  // Filtered Cable Shop Items
  const filteredCableShopItems = useMemo(() => {
    return cableShopItems.filter(item => {
      const matchStage = activeStageFilter === 'All' || item.stage === activeStageFilter;
      const q = cableSearchTerm.toLowerCase();
      const matchSearch = 
        item.spooledToReelNumber.toLowerCase().includes(q) ||
        item.partName.toLowerCase().includes(q) ||
        item.currentSerialNumber.toLowerCase().includes(q) ||
        (item.wellName && item.wellName.toLowerCase().includes(q)) ||
        item.manufacturer.toLowerCase().includes(q);
      return matchStage && matchSearch;
    });
  }, [cableShopItems, activeStageFilter, cableSearchTerm]);

  // Filtered Failure Reason Table Records (Slide 11)
  const filteredFailureTable = useMemo(() => {
    return CABLE_FAILURE_REASONS_TABLE.filter(r => {
      const q = failureTableSearch.toLowerCase();
      const matchSearch = 
        r.wellName.toLowerCase().includes(q) ||
        r.currentSerialNumber.toLowerCase().includes(q) ||
        r.jobId.toLowerCase().includes(q) ||
        r.failureCause.toLowerCase().includes(q);
      const matchMfg = mfgFilter === 'All' || r.manufacturer === mfgFilter;
      const matchClass = classFilter === 'All' || r.classification === classFilter;
      const matchWarehouse = warehouseFilter === 'All' || r.warehouseName === warehouseFilter;
      const matchDonut = !selectedDonutReason || r.failureCause.toLowerCase().includes(selectedDonutReason.toLowerCase());
      return matchSearch && matchMfg && matchClass && matchWarehouse && matchDonut;
    });
  }, [failureTableSearch, mfgFilter, classFilter, warehouseFilter, selectedDonutReason]);

  // Export CSV for Slide 11 Failure Reason Table
  const handleExportFailureTableCSV = () => {
    const headers = ['PartName', 'WellName', 'JobId', 'Manufacturer', 'CurrentSerialNumber', 'ShortDescription', 'Classification', 'WarehouseName', 'FailureCause'];
    const rows = filteredFailureTable.map(r => [
      r.partName,
      r.wellName,
      r.jobId,
      r.manufacturer,
      r.currentSerialNumber,
      `"${r.shortDescription}"`,
      r.classification,
      r.warehouseName,
      `"${r.failureCause}"`
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ALS_Failure_Reasons_Slide11_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Failure Reason Table to CSV.');
  };

  // Export CSV for Cable Shop (Slide 16)
  const handleExportCableShopCSV = () => {
    const headers = ['PartName', 'RecordedDate', 'VendorPartNumber', 'CurrentSerialNumber', 'SpooledToReelNumber', 'TotalShippingLengthFt', 'Stage', 'Manufacturer', 'Classification', 'TestVoltageKv', 'InsulationResistanceMohm', 'ConductorContinuity', 'InvoiceNumber', 'InvoiceAmountUSD'];
    const rows = filteredCableShopItems.map(i => [
      `"${i.partName}"`,
      i.recordedDate,
      `"${i.vendorPartNumber}"`,
      `"${i.currentSerialNumber}"`,
      i.spooledToReelNumber,
      i.totalShippingLengthFt,
      `"${i.stage}"`,
      i.manufacturer,
      i.classification,
      i.testVoltageKv || '',
      i.insulationResistanceMohm || '',
      i.conductorContinuity || '',
      i.invoiceNumber || '',
      i.invoiceAmountUsd || '',
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ALS_Cable_Shop_Reels_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported Cable Shop records to CSV.');
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notice */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Failure Analytics &amp; Cable Shop Reliability Center
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              PDF-ALIGNED RELIABILITY
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Pareto root cause distribution, manufacturer tear-down statistics, cable run-life histograms, and 8-stage spool shop logistics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">Total Cables Tracked:</span>
          <span className="text-sm font-bold font-mono text-cyan-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            2,899 Reels
          </span>
        </div>
      </div>

      {/* Primary Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => setMainTab('analytics')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              mainTab === 'analytics' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart className="w-3.5 h-3.5" />
            <span>Failure Reason Analytics (Slides 11-15)</span>
          </button>

          <button
            onClick={() => setMainTab('cable-shop')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              mainTab === 'cable-shop' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Cable Shop 8-Stage Workflow (Slide 16)</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
              {cableShopItems.length} Spools
            </span>
          </button>

          <button
            onClick={() => setMainTab('rca-teardown')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              mainTab === 'rca-teardown' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Root Cause Analysis &amp; Teardowns</span>
          </button>
        </div>

        {mainTab === 'analytics' && (
          <button
            onClick={handleExportFailureTableCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Failure Table</span>
          </button>
        )}

        {mainTab === 'cable-shop' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCableShopCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Spools CSV</span>
            </button>
            <button
              onClick={() => setIsAddSpoolOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Cable Spool</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: FAILURE REASON ANALYTICS (Slides 11 - 15) */}
      {mainTab === 'analytics' && (
        <div className="space-y-6">
          {/* Top 4 Summary KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-mono">TOTAL CABLES MONITORED</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">2,899</span>
              <span className="text-[10px] text-slate-500 font-mono">Delaware, Midland &amp; Bakken</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-mono">PRIMARY FAILURE MODE</span>
              <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">Electrical (53.8%)</span>
              <span className="text-[10px] text-rose-500 font-mono">1,550 recorded incidents</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-mono">MEDIAN RUN DAYS AT PULL</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">542 Days</span>
              <span className="text-[10px] text-emerald-400 font-mono">+14% vs Permian benchmark</span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block font-mono">MAX INSTALL COUNT</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">&gt; 10 Cycles</span>
              <span className="text-[10px] text-slate-500 font-mono">20 heavy-duty reels reused</span>
            </div>
          </div>

          {/* Slide 11: Failure Reason Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl space-y-3 p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  Failure Reason Table (Slide 11)
                </h3>
                <p className="text-xs text-slate-400">Component classification, well assignment, and teardown failure root causes.</p>
              </div>

              {/* Filters for Slide 11 Table */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Search well or serial..."
                  value={failureTableSearch}
                  onChange={(e) => setFailureTableSearch(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                />

                <select
                  value={mfgFilter}
                  onChange={(e) => setMfgFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-1 font-mono"
                >
                  <option value="All">All Mfg</option>
                  <option value="Baker Hughes">Baker Hughes</option>
                  <option value="Levare">Levare</option>
                  <option value="SLB">SLB</option>
                </select>

                <select
                  value={warehouseFilter}
                  onChange={(e) => setWarehouseFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2 py-1 font-mono"
                >
                  <option value="All">All Yards</option>
                  <option value="Warehouse 1">Warehouse 1</option>
                  <option value="Warehouse 2">Warehouse 2</option>
                  <option value="Warehouse 3">Warehouse 3</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2.5">Part Name</th>
                    <th className="px-3 py-2.5">Well Name</th>
                    <th className="px-3 py-2.5 font-mono">Job ID</th>
                    <th className="px-3 py-2.5">Manufacturer</th>
                    <th className="px-3 py-2.5 font-mono">Current Serial #</th>
                    <th className="px-3 py-2.5">Short Description</th>
                    <th className="px-3 py-2.5 text-center">Class</th>
                    <th className="px-3 py-2.5">Warehouse</th>
                    <th className="px-3 py-2.5">Failure Cause</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                  {filteredFailureTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2 font-sans font-medium text-white">{row.partName}</td>
                      <td className="px-3 py-2 font-bold text-cyan-300">{row.wellName}</td>
                      <td className="px-3 py-2 text-slate-400">{row.jobId}</td>
                      <td className="px-3 py-2 text-slate-300 font-sans">{row.manufacturer}</td>
                      <td className="px-3 py-2 text-amber-300">{row.currentSerialNumber}</td>
                      <td className="px-3 py-2 text-slate-400">{row.shortDescription}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-1.5 py-0.2 rounded text-[10px] ${
                          row.classification === 'New' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {row.classification}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-400 font-sans">{row.warehouseName}</td>
                      <td className="px-3 py-2 text-rose-300 font-sans">{row.failureCause}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Slide 12 (Donut Chart) & Slide 13 (Run Days Histogram) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Slide 12: Count of Cables by Failure Reason (Donut Chart) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Count of Cables by Failure Reason (Slide 12)
                  </h3>
                  <p className="text-xs text-slate-400">Total Count: 2,899 · Click slice to filter table.</p>
                </div>
                {selectedDonutReason && (
                  <button
                    onClick={() => setSelectedDonutReason(null)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    Clear Filter
                  </button>
                )}
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={CABLE_FAILURE_BY_REASON}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                      onClick={(entry) => setSelectedDonutReason(entry?.name ?? null)}
                      cursor="pointer"
                    >
                      {CABLE_FAILURE_BY_REASON.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} layout="horizontal" verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono border-t border-slate-800/80 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Electrical:</span>
                  <span className="text-rose-400 font-bold">1,550 (53.8%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tech Limit:</span>
                  <span className="text-cyan-400 font-bold">776 (26.9%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mechanical:</span>
                  <span className="text-purple-400 font-bold">208 (7.2%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Shorts:</span>
                  <span className="text-amber-400 font-bold">70 (2.4%)</span>
                </div>
              </div>
            </div>

            {/* Slide 13: Run Days vs Count of Cables (Histogram) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Run Days vs Count of Cables (Slide 13)
                  </h3>
                  <p className="text-xs text-slate-400">Total Count: 2,643 · Cumulative length tracked in feet.</p>
                </div>
                <span className="text-xs font-mono text-emerald-400 font-semibold">Peak: 0-499d (1,070)</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CABLE_RUN_DAYS_HISTOGRAM} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="range" stroke="#64748b" tick={{ fontSize: 9 }} angle={-25} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-lg text-xs font-mono">
                              <span className="text-cyan-400 font-bold block">{data.range} Days</span>
                              <span className="text-white block">Count: {data.count} ({data.pct}%)</span>
                              <span className="text-slate-400 block">Length: {data.lengthFt.toLocaleString()} ft</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" name="Count of Cables" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Slide 14 (Install Count) & Slide 15 (Failure Reasons by Manufacturer) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Slide 14: Install Count vs Count of Cables */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Install Count vs Count of Cables (Slide 14)
                  </h3>
                  <p className="text-xs text-slate-400">Number of historical run cycles before failure or retirement.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold">Total: 2,643</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={CABLE_INSTALL_COUNT_DISTRIBUTION} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="installCount" stroke="#64748b" tick={{ fontSize: 10 }} label={{ value: 'Install Limit Cycles', position: 'insideBottom', offset: -2, fill: '#64748b', fontSize: 10 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 p-2 rounded shadow-lg text-xs font-mono">
                              <span className="text-cyan-400 font-bold block">{data.installCount} Cycles</span>
                              <span className="text-white block">Count: {data.count} ({data.pct}%)</span>
                              <span className="text-slate-400 block">Length: {data.lengthFt.toLocaleString()} ft</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" name="Count of Cables" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Slide 15: Failure Reasons by Manufacturer */}
            <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Failure Reasons by Manufacturer (Slide 15)
                  </h3>
                  <p className="text-xs text-slate-400">Teardown cable failure breakdown by vendor brand.</p>
                </div>
                <span className="text-xs font-mono text-rose-400 font-semibold">Total Count: 241</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={MANUFACTURER_FAILURE_REASONS}
                    margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis type="number" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="manufacturer" stroke="#64748b" tick={{ fontSize: 10 }} width={80} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Bar dataKey="electrical" name="Electrical Failure" stackId="a" fill="#f87171" />
                    <Bar dataKey="mechanical" name="Mechanical Wear" stackId="a" fill="#38bdf8" />
                    <Bar dataKey="corrosion" name="Armor Corrosion" stackId="a" fill="#fb923c" />
                    <Bar dataKey="damage" name="Handling / Clamp Damage" stackId="a" fill="#a855f7" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CABLE SHOP 8-STAGE WORKFLOW (Slide 16) */}
      {mainTab === 'cable-shop' && (
        <div className="space-y-6">
          {/* 8-Stage Interactive Chevron Workflow (Slide 16) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  Cable Shop Eight-Stage Operational Lifecycle
                </h3>
                <p className="text-xs text-slate-400">Click any stage to filter inventory spools or monitor work order progression.</p>
              </div>
              <button
                onClick={() => setActiveStageFilter('All')}
                className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold ${
                  activeStageFilter === 'All' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
                }`}
              >
                Show All Stages ({cableShopItems.length})
              </button>
            </div>

            {/* Stepper Grid (Slide 16) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {CABLE_SHOP_STAGES.map((s) => {
                const count = cableShopItems.filter(i => i.stage === s.stage).length;
                const isSelected = activeStageFilter === s.stage;

                return (
                  <div
                    key={s.step}
                    onClick={() => setActiveStageFilter(s.stage)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between text-center relative overflow-hidden ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-400 shadow-lg scale-102'
                        : 'bg-slate-950/80 border-slate-800 hover:border-emerald-600/50 text-slate-300'
                    }`}
                  >
                    <div className="w-7 h-7 mx-auto rounded-full bg-slate-900 border border-emerald-500/40 flex items-center justify-center text-xs font-bold text-emerald-400 font-mono mb-2">
                      {s.step}
                    </div>

                    <span className="text-[11px] font-semibold leading-tight line-clamp-2">
                      {s.label}
                    </span>

                    <span className={`text-[10px] font-mono mt-2 px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-emerald-950 text-white' : 'bg-slate-900 text-emerald-400'
                    }`}>
                      {count} Spool{count !== 1 ? 's' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipped Equipment & Spool Inventory Records Table (Slide 16) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  {activeStageFilter === 'All' ? 'Master Cable Shop Inventory' : `${activeStageFilter} Queue`}
                </h3>
                <p className="text-xs text-slate-400">Total spool length, test certifications, vendor part mappings, and invoice reconciliation.</p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search reel, part or serial..."
                    value={cableSearchTerm}
                    onChange={(e) => setCableSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-8 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Part Name</th>
                    <th className="px-4 py-2.5">Recorded Date</th>
                    <th className="px-4 py-2.5">Vendor Part #</th>
                    <th className="px-4 py-2.5">Current Serial #</th>
                    <th className="px-4 py-2.5 font-bold text-cyan-400">Spooled To Reel #</th>
                    <th className="px-4 py-2.5 text-right">Length (Feet)</th>
                    <th className="px-4 py-2.5 text-center">Stage</th>
                    <th className="px-4 py-2.5 text-center">Test Status</th>
                    <th className="px-4 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                  {filteredCableShopItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500 font-sans">
                        No cable spools currently in this workflow stage.
                      </td>
                    </tr>
                  ) : (
                    filteredCableShopItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-2.5 font-sans font-medium text-white max-w-xs truncate" title={item.partName}>
                          {item.partName}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">{item.recordedDate}</td>
                        <td className="px-4 py-2.5 text-slate-400 text-[11px] max-w-xs truncate" title={item.vendorPartNumber}>
                          {item.vendorPartNumber}
                        </td>
                        <td className="px-4 py-2.5 text-amber-300 font-bold max-w-xs truncate" title={item.currentSerialNumber}>
                          {item.currentSerialNumber}
                        </td>
                        <td className="px-4 py-2.5 font-bold text-cyan-300 text-sm">
                          {item.spooledToReelNumber}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-white">
                          {item.totalShippingLengthFt.toLocaleString()} ft
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                            {item.stage}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {item.testVoltageKv ? `${item.testVoltageKv}kV Pass` : 'Tested'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setDocModalSpool(item)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-sans transition-colors"
                              title="View Test Certificate & Documents"
                            >
                              Documents
                            </button>
                            <button
                              onClick={() => handleAdvanceStage(item)}
                              className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-[10px] font-sans font-bold transition-colors flex items-center gap-1"
                              title="Advance to next workflow stage"
                            >
                              <span>Next Stage</span>
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RCA & TEARDOWN LOG */}
      {mainTab === 'rca-teardown' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pareto Root Cause Bar Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Downhole Failure Root Cause Pareto
                </h3>
                <p className="text-xs text-slate-400">Classified root causes for lift failure events across Delaware &amp; Midland basins.</p>
              </div>

              <div className="h-60 w-full bg-slate-950 p-2 rounded-lg border border-slate-800">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ROOT_CAUSE_PARETO} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="reason" stroke="#64748b" tick={{ fontSize: 9 }} angle={-20} textAnchor="end" />
                    <YAxis stroke="#64748b" tick={{ fontSize: 10 }} unit="%" domain={[0, 40]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Bar dataKey="percentage" name="Failure Occurrence %" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Weibull Cumulative Survival Curve */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Weibull Reliability &amp; Cumulative Survival Curve
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

          {/* Incidents Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Detailed Failure Teardown &amp; Root Cause Records
                </h3>
                <p className="text-xs text-slate-400">Formal engineering teardowns, metallurgical analysis, and corrective actions.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2.5">Incident ID</th>
                    <th className="px-4 py-2.5">Well</th>
                    <th className="px-4 py-2.5">Lift Type</th>
                    <th className="px-4 py-2.5">Failed Component</th>
                    <th className="px-4 py-2.5">Root Cause Category</th>
                    <th className="px-4 py-2.5 text-right">Run Life (days)</th>
                    <th className="px-4 py-2.5 text-right">Cost ($)</th>
                    <th className="px-4 py-2.5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {failures.map(f => (
                    <tr key={f.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-2.5 font-bold text-cyan-300">{f.id}</td>
                      <td className="px-4 py-2.5 font-sans font-medium text-white">{f.wellName}</td>
                      <td className="px-4 py-2.5 text-slate-400">{f.liftType}</td>
                      <td className="px-4 py-2.5 text-amber-300 font-sans">{f.failedComponent}</td>
                      <td className="px-4 py-2.5 text-rose-300 font-sans">{f.rootCauseCategory}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-white">{f.runLifeDays}d</td>
                      <td className="px-4 py-2.5 text-right text-slate-300">${f.costImpactUsd.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-sans font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {f.resolutionStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: Add Cable Spool to Cable Shop */}
      {isAddSpoolOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Register New Cable Spool / Reel
                </h3>
              </div>
              <button onClick={() => setIsAddSpoolOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateSpool} className="space-y-4 text-xs font-mono">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Part Name:</label>
                  <input
                    type="text"
                    value={newSpoolForm.partName}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, partName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Spooled To Reel #:</label>
                  <input
                    type="text"
                    value={newSpoolForm.spooledToReelNumber}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, spooledToReelNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-cyan-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Manufacturer:</label>
                  <select
                    value={newSpoolForm.manufacturer}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, manufacturer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  >
                    <option value="Baker Hughes">Baker Hughes</option>
                    <option value="ChampionX">ChampionX</option>
                    <option value="Levare">Levare</option>
                    <option value="SLB">SLB</option>
                    <option value="Valiant">Valiant</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Total Shipping Length (ft):</label>
                  <input
                    type="number"
                    value={newSpoolForm.totalShippingLengthFt}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, totalShippingLengthFt: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Vendor Part #:</label>
                  <input
                    type="text"
                    value={newSpoolForm.vendorPartNumber}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, vendorPartNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Serial Number:</label>
                  <input
                    type="text"
                    value={newSpoolForm.currentSerialNumber}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, currentSerialNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-amber-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Hipot Test Voltage (kV):</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newSpoolForm.testVoltageKv}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, testVoltageKv: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Insulation Resist (MΩ):</label>
                  <input
                    type="number"
                    value={newSpoolForm.insulationResistanceMohm}
                    onChange={(e) => setNewSpoolForm({ ...newSpoolForm, insulationResistanceMohm: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-emerald-400 font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddSpoolOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold font-mono"
                >
                  Save Spool Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: View Test Certificate / Documents (Slide 16) */}
      {docModalSpool && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  Test Certification — Reel #{docModalSpool.spooledToReelNumber}
                </h3>
              </div>
              <button onClick={() => setDocModalSpool(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2.5 text-xs font-mono">
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Certificate Document:</span>
                <span className="text-cyan-400 font-bold">{docModalSpool.certDocName || `Cert_Reel_${docModalSpool.spooledToReelNumber}.pdf`}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Test DC Hi-Pot:</span>
                <span className="text-emerald-400 font-bold">{docModalSpool.testVoltageKv || 15.0} kV Passed (15 min)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Insulation Resistance:</span>
                <span className="text-emerald-400 font-bold">{docModalSpool.insulationResistanceMohm || 2400} MΩ @ 1000V</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Conductor Continuity:</span>
                <span className="text-emerald-400 font-bold">Phase A, B, C Balanced (&lt; 0.65 Ω/kft)</span>
              </div>
              <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                <span className="text-slate-400">Workflow Stage:</span>
                <span className="text-white font-bold">{docModalSpool.stage}</span>
              </div>
              {docModalSpool.invoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Invoice Reference:</span>
                  <span className="text-amber-400 font-bold">{docModalSpool.invoiceNumber} (${docModalSpool.invoiceAmountUsd?.toLocaleString()})</span>
                </div>
              )}
            </div>

            <div className="p-3 bg-cyan-950/40 border border-cyan-800/60 rounded-lg text-[11px] text-cyan-200">
              {docModalSpool.notes || 'Full API RP 11S5 / IEEE 1017 inspection standards certified for high-temperature ESP downhole applications.'}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setDocModalSpool(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
