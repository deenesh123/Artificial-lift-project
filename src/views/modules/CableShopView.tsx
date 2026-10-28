import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, 
  Search, 
  CheckCircle2, 
  Layers, 
  FileText, 
  Truck, 
  ArrowRight, 
  Zap, 
  FileSpreadsheet, 
  Plus, 
  Edit, 
  Upload, 
  Eye, 
  FileCheck, 
  X,
  Radio,
  ExternalLink,
  ShieldCheck,
  Disc,
  Clock,
  Printer
} from 'lucide-react';
import { CableShopItem, CableShopWorkflowStage, WellAsset } from '../../types';
import { CABLE_SHOP_STAGES, INITIAL_CABLE_SHOP_ITEMS } from '../../data/cableShopData';
import { StorageService } from '../../services/storageService';

interface CableShopViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (id: string | null) => void;
}

export const CableShopView: React.FC<CableShopViewProps> = ({
  selectedAssetId,
  onSelectAssetId,
}) => {
  const [items, setItems] = useState<CableShopItem[]>(() => {
    return StorageService.getCableShopItems ? StorageService.getCableShopItems() : INITIAL_CABLE_SHOP_ITEMS;
  });
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || 'CS-001');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('All');
  const [onlySelectedWell, setOnlySelectedWell] = useState<boolean>(false);
  const [activeCardTab, setActiveCardTab] = useState<'shipped-equipment' | 'documents'>('shipped-equipment');
  const [notice, setNotice] = useState<string | null>(null);

  // Modals
  const [advancingItem, setAdvancingItem] = useState<CableShopItem | null>(null);
  const [newStage, setNewStage] = useState<CableShopWorkflowStage>('Combined Spliced Cable Test');
  const [advanceNotes, setAdvanceNotes] = useState('');
  
  const [editingItem, setEditingItem] = useState<CableShopItem | null>(null);
  const [editForm, setEditForm] = useState({
    spooledToReelNumber: '',
    totalShippingLengthFt: 0,
    vendorPartNumber: '',
    testVoltageKv: 15.0,
    insulationResistanceMohm: 2400,
    notes: '',
  });

  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');

  const wells = useMemo(() => StorageService.getWells(), []);
  const targetWell: WellAsset | null = useMemo(() => {
    if (!selectedAssetId) return null;
    return wells.find(w => w.id === selectedAssetId || w.wellCode === selectedAssetId) || null;
  }, [wells, selectedAssetId]);

  // If selectedAssetId changes and corresponds to an item, highlight it
  useEffect(() => {
    if (selectedAssetId) {
      const match = items.find(i => 
        i.wellId === selectedAssetId || 
        (targetWell && (i.wellId === targetWell.id || (targetWell.wellCode && i.wellName?.toLowerCase().includes(targetWell.wellCode.toLowerCase()))))
      );
      if (match) {
        setSelectedItemId(match.id);
      }
    }
  }, [selectedAssetId, items, targetWell]);

  const selectedItem = useMemo(() => {
    return items.find(i => i.id === selectedItemId) || items[0];
  }, [items, selectedItemId]);

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (onlySelectedWell && targetWell) {
        const matchesWell = item.wellId === targetWell.id || 
          (targetWell.wellCode && item.wellId === targetWell.wellCode) || 
          (targetWell.wellCode && item.wellName?.toLowerCase().includes(targetWell.wellCode.toLowerCase()));
        if (!matchesWell) return false;
      }

      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        item.id.toLowerCase().includes(q) ||
        item.partName.toLowerCase().includes(q) ||
        (item.wellName && item.wellName.toLowerCase().includes(q)) ||
        (item.wellId && item.wellId.toLowerCase().includes(q)) ||
        item.spooledToReelNumber.toLowerCase().includes(q) ||
        item.currentSerialNumber.toLowerCase().includes(q);

      const matchesStage = stageFilter === 'All' || item.stage === stageFilter;
      const matchesMfg = manufacturerFilter === 'All' || item.manufacturer === manufacturerFilter;

      return matchesSearch && matchesStage && matchesMfg;
    });
  }, [items, onlySelectedWell, targetWell, searchTerm, stageFilter, manufacturerFilter]);

  const handleAdvanceStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advancingItem) return;

    const updated = items.map(item => {
      if (item.id === advancingItem.id) {
        return {
          ...item,
          stage: newStage,
          notes: advanceNotes ? `${item.notes || ''} [${new Date().toLocaleDateString()}] ${advanceNotes}` : item.notes,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setItems(updated);
    if (StorageService.saveCableShopItems) {
      StorageService.saveCableShopItems(updated);
    }
    showFeedback(`Reel ${advancingItem.spooledToReelNumber} transitioned to "${newStage}".`);
    setAdvancingItem(null);
    setAdvanceNotes('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const updated = items.map(item => {
      if (item.id === editingItem.id) {
        return {
          ...item,
          spooledToReelNumber: editForm.spooledToReelNumber.trim() || item.spooledToReelNumber,
          totalShippingLengthFt: Number(editForm.totalShippingLengthFt) || item.totalShippingLengthFt,
          vendorPartNumber: editForm.vendorPartNumber.trim() || item.vendorPartNumber,
          testVoltageKv: Number(editForm.testVoltageKv),
          insulationResistanceMohm: Number(editForm.insulationResistanceMohm),
          notes: editForm.notes.trim() || item.notes,
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setItems(updated);
    if (StorageService.saveCableShopItems) {
      StorageService.saveCableShopItems(updated);
    }
    showFeedback(`Saved reel specification updates for ${editingItem.id}.`);
    setEditingItem(null);
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !newDocName.trim()) return;

    const updated = items.map(item => {
      if (item.id === selectedItem.id) {
        return {
          ...item,
          certDocName: newDocName.trim(),
          updatedAt: new Date().toISOString(),
        };
      }
      return item;
    });

    setItems(updated);
    if (StorageService.saveCableShopItems) {
      StorageService.saveCableShopItems(updated);
    }
    showFeedback(`Attached QA certification "${newDocName}" to reel ${selectedItem.spooledToReelNumber}.`);
    setNewDocName('');
    setDocumentModalOpen(false);
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'PartName', 'WellID', 'WellName', 'Stage', 'Manufacturer', 'ReelNumber', 'LengthFt', 'TestVoltageKv', 'InsulationResistanceMohm', 'Continuity'];
    const rows = filteredItems.map(i => [
      i.id,
      `"${i.partName}"`,
      i.wellId || 'N/A',
      `"${i.wellName || 'N/A'}"`,
      `"${i.stage}"`,
      i.manufacturer,
      i.spooledToReelNumber,
      i.totalShippingLengthFt,
      i.testVoltageKv || 'N/A',
      i.insulationResistanceMohm || 'N/A',
      i.conductorContinuity || 'N/A'
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ALS_Cable_Shop_Spools_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showFeedback('Exported Cable Shop records to CSV.');
  };

  // Helper for 8-step pipeline
  const getStageStep = (stage: CableShopWorkflowStage) => {
    const found = CABLE_SHOP_STAGES.find(s => s.stage === stage);
    return found ? found.step : 1;
  };

  const currentStep = selectedItem ? getStageStep(selectedItem.stage) : 1;

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/60 text-cyan-200 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono">{notice}</span>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide font-mono">
              Cable Shop Operations &amp; Spool Logistics (Slide 16)
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
              8-STAGE QA WORKFLOW
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standardized ESP cable qualification: Hi-Pot DC testing, vulcanized splicing, reel banding, and well-pad delivery.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Selected Well Active Banner & Filter */}
      {targetWell && (
        <div className="bg-cyan-950/40 border border-cyan-500/40 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-slate-400">Target Asset Context:</span>
            <span className="font-bold text-white px-2 py-0.5 bg-slate-900 border border-cyan-700 rounded">
              {targetWell.wellCode || targetWell.id}
            </span>
            <span className="text-slate-300 font-sans">({targetWell.name})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setOnlySelectedWell(!onlySelectedWell)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                onlySelectedWell
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {onlySelectedWell ? 'Showing Only Target Well Spools' : 'Filter by Target Well'}
            </button>
            {onlySelectedWell && (
              <button
                onClick={() => setOnlySelectedWell(false)}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* 8-Stage Interactive Visual Pipeline Bar (PDF Page 16) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
              Selected Spool Workflow Pipeline
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-white font-mono font-semibold">
              Reel #{selectedItem.spooledToReelNumber} ({selectedItem.id})
            </span>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Current Stage: <strong className="text-emerald-400">{selectedItem.stage}</strong> (Step {currentStep} of 8)
          </span>
        </div>

        {/* Circular Stages Flow (Matching Slide 16) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {CABLE_SHOP_STAGES.map(s => {
            const isCompleted = s.step < currentStep;
            const isCurrent = s.step === currentStep;

            return (
              <div
                key={s.step}
                className={`flex flex-col items-center text-center p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 ring-1 ring-cyan-500/50 shadow-lg'
                    : isCompleted
                    ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-300'
                    : 'bg-slate-950/40 border-slate-800 text-slate-500'
                }`}
              >
                {/* Stage Circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs mb-1.5 ${
                  isCurrent 
                    ? 'bg-cyan-500 text-slate-950 shadow-md animate-pulse' 
                    : isCompleted 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {isCompleted ? '✓' : `0${s.step}`}
                </div>

                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  Step 0{s.step}
                </span>
                <span className="text-[11px] font-semibold leading-tight mt-0.5 text-slate-200 line-clamp-2">
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Shipped Equipment / Reel Inspector Card (Slide 16 Card Structure) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg space-y-4 p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
              <span>{selectedItem.stage}:</span>
              <span className="text-cyan-400 font-bold">{selectedItem.partName}</span>
            </h3>
          </div>

          {/* Sub-tabs: Shipped Equipment vs View/Add Documents */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveCardTab('shipped-equipment')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCardTab === 'shipped-equipment'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Shipped Equipment Details
            </button>
            <button
              onClick={() => setActiveCardTab('documents')}
              className={`px-3 py-1 rounded-md transition-colors ${
                activeCardTab === 'documents'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              View/Add Documents {selectedItem.certDocName && '•'}
            </button>
          </div>
        </div>

        {/* Action Buttons Row matching Slide 16 */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setEditingItem(selectedItem);
                setEditForm({
                  spooledToReelNumber: selectedItem.spooledToReelNumber,
                  totalShippingLengthFt: selectedItem.totalShippingLengthFt,
                  vendorPartNumber: selectedItem.vendorPartNumber,
                  testVoltageKv: selectedItem.testVoltageKv || 15.0,
                  insulationResistanceMohm: selectedItem.insulationResistanceMohm || 2400,
                  notes: selectedItem.notes || '',
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-cyan-400" />
              <span>Edit Reel Specs</span>
            </button>

            <button
              onClick={() => {
                setEditingItem(selectedItem);
                setEditForm({
                  spooledToReelNumber: `78-${Math.floor(1000 + Math.random() * 9000)}`,
                  totalShippingLengthFt: selectedItem.totalShippingLengthFt,
                  vendorPartNumber: selectedItem.vendorPartNumber,
                  testVoltageKv: selectedItem.testVoltageKv || 15.0,
                  insulationResistanceMohm: selectedItem.insulationResistanceMohm || 2400,
                  notes: selectedItem.notes || '',
                });
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Disc className="w-3.5 h-3.5 text-emerald-400" />
              <span>Spooled To Reel</span>
            </button>

            <button
              onClick={() => setDocumentModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Attach QA Certificate</span>
            </button>
          </div>

          <button
            onClick={() => {
              setAdvancingItem(selectedItem);
              setNewStage(selectedItem.stage);
            }}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-md"
          >
            <span>Advance Workflow Stage</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab 1: Shipped Equipment Details Table (Matching Slide 16 table layout) */}
        {activeCardTab === 'shipped-equipment' ? (
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">Part Name</th>
                  <th className="px-3 py-2.5">Recorded Date</th>
                  <th className="px-3 py-2.5">Vendor Part Number</th>
                  <th className="px-3 py-2.5">Current Serial Number</th>
                  <th className="px-3 py-2.5">Spooled To Reel Number</th>
                  <th className="px-3 py-2.5">Total Shipping Length (Feet)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
                <tr className="bg-slate-950/60">
                  <td className="px-3 py-3 font-semibold text-white flex items-center gap-1.5">
                    <span className="text-cyan-400">▼</span>
                    <span>{selectedItem.partName}</span>
                  </td>
                  <td className="px-3 py-3 text-slate-300">{selectedItem.recordedDate}</td>
                  <td className="px-3 py-3 text-slate-300">{selectedItem.vendorPartNumber}</td>
                  <td className="px-3 py-3 text-amber-300 font-bold">{selectedItem.currentSerialNumber}</td>
                  <td className="px-3 py-3 text-cyan-300 font-bold">{selectedItem.spooledToReelNumber}</td>
                  <td className="px-3 py-3 text-emerald-400 font-bold">{selectedItem.totalShippingLengthFt.toLocaleString()} ft</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          /* Tab 2: Document / QA Certification View */
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-white uppercase">
                Attached Quality Certifications &amp; Hi-Pot Logs
              </span>
              <button
                onClick={() => setDocumentModalOpen(true)}
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                <span>Upload New Document</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-white font-semibold block">
                      {selectedItem.certDocName || 'DC_Hipot_Test_Certificate_V4.pdf'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Step Voltage 15 kV · Insulation &gt; 2,400 MΩ · Certified
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => showFeedback(`Downloading ${selectedItem.certDocName || 'DC_Hipot_Test_Certificate_V4.pdf'}...`)}
                  className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 hover:text-white"
                >
                  View
                </button>
              </div>

              {selectedItem.invoiceNumber && (
                <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <div>
                      <span className="text-white font-semibold block">
                        Invoice: {selectedItem.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Amount: ${(selectedItem.invoiceAmountUsd || 34800).toLocaleString()} USD · Signed
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => showFeedback(`Downloading Invoice ${selectedItem.invoiceNumber}...`)}
                    className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 hover:text-white"
                  >
                    View
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* QA Diagnostic Tags & Remarks */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-950 p-3.5 rounded-lg border border-slate-800/80 text-xs font-mono">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Associated Well</span>
            <span className="text-white font-semibold">{selectedItem.wellId || 'Shop Inventory'}</span>
            <span className="text-slate-400 text-[10px] block truncate">{selectedItem.wellName || 'Unassigned Spool'}</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Hi-Pot Step Voltage</span>
            <span className="text-cyan-400 font-bold">{selectedItem.testVoltageKv ? `${selectedItem.testVoltageKv} kV DC` : '15.0 kV DC'}</span>
            <span className="text-slate-400 text-[10px] block">15-minute dwell pass</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Insulation Resistance</span>
            <span className="text-emerald-400 font-bold">{selectedItem.insulationResistanceMohm ? `${selectedItem.insulationResistanceMohm} MΩ` : '2,400 MΩ'}</span>
            <span className="text-slate-400 text-[10px] block">Threshold &gt; 1,000 MΩ</span>
          </div>

          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Conductor Continuity</span>
            <span className="text-emerald-300 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Phase Balanced</span>
            </span>
            <span className="text-slate-400 text-[10px] block">MLE spliced verified</span>
          </div>
        </div>
      </div>

      {/* Master Inventory Registry Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search part name, reel, well or serial..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="All">All 8 Stages</option>
              {CABLE_SHOP_STAGES.map(s => (
                <option key={s.stage} value={s.stage}>Step {s.step}: {s.label}</option>
              ))}
            </select>

            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="All">All Manufacturers</option>
              <option value="Baker Hughes">Baker Hughes</option>
              <option value="ChampionX">ChampionX</option>
              <option value="SLB">SLB</option>
              <option value="Levare">Levare</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Spool ID &amp; Cable Description</th>
                <th className="px-4 py-3">Associated Well</th>
                <th className="px-4 py-3">Current QA Stage</th>
                <th className="px-4 py-3">Reel / Length</th>
                <th className="px-4 py-3">Hi-Pot Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200 font-mono">
              {filteredItems.map(item => {
                const isSelected = selectedItemId === item.id;
                return (
                  <tr 
                    key={item.id} 
                    onClick={() => setSelectedItemId(item.id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-cyan-950/40 ring-1 ring-inset ring-cyan-500/40' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{item.id}</span>
                        <span className="text-[10px] text-slate-500">({item.manufacturer})</span>
                      </div>
                      <div className="text-slate-200 font-sans font-medium">{item.partName}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-xs">SN: {item.currentSerialNumber}</div>
                    </td>

                    <td className="px-4 py-3 font-sans">
                      <div className="text-white font-semibold font-mono">{item.wellId || 'Shop Stock'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.wellName || 'Unassigned'}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-800 text-slate-300 border border-slate-700">
                        {item.stage}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-300">{item.totalShippingLengthFt.toLocaleString()} ft</div>
                      <div className="text-[10px] text-slate-500 font-bold text-cyan-300">Reel #{item.spooledToReelNumber}</div>
                    </td>

                    <td className="px-4 py-3 font-sans">
                      {item.insulationResistanceMohm ? (
                        <div className="text-emerald-400 font-mono flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{item.insulationResistanceMohm} MΩ</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-[10px] font-mono">Pending Test</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdvancingItem(item);
                          setNewStage(item.stage);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-sans transition-colors"
                      >
                        Advance
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advance Stage Modal */}
      {advancingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Advance Cable Stage: {advancingItem.id}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Reel #{advancingItem.spooledToReelNumber} ({advancingItem.partName})
                </p>
              </div>
              <button onClick={() => setAdvancingItem(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAdvanceStage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Target 8-Stage Workflow Step:
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as CableShopWorkflowStage)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-mono"
                >
                  {CABLE_SHOP_STAGES.map(s => (
                    <option key={s.stage} value={s.stage}>
                      Step {s.step}: {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Inspector / QA Remarks:
                </label>
                <textarea
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                  placeholder="Record hi-pot step voltage, continuity verification, or carrier trailer dispatch notes..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdvancingItem(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Confirm Stage Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Reel Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Edit className="w-4 h-4 text-cyan-400" />
                  <span>Edit Reel Specifications: {editingItem.id}</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">{editingItem.partName}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 font-mono text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Spooled To Reel #</label>
                <input
                  type="text"
                  value={editForm.spooledToReelNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, spooledToReelNumber: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Total Shipping Length (Feet)</label>
                <input
                  type="number"
                  value={editForm.totalShippingLengthFt}
                  onChange={(e) => setEditForm(prev => ({ ...prev, totalShippingLengthFt: Number(e.target.value) }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Vendor Part Number</label>
                <input
                  type="text"
                  value={editForm.vendorPartNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, vendorPartNumber: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-400 block mb-1">Test Voltage (kV DC)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editForm.testVoltageKv}
                    onChange={(e) => setEditForm(prev => ({ ...prev, testVoltageKv: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Insulation Resistance (MΩ)</label>
                  <input
                    type="number"
                    value={editForm.insulationResistanceMohm}
                    onChange={(e) => setEditForm(prev => ({ ...prev, insulationResistanceMohm: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold font-sans"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Attach Document Modal */}
      {documentModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/50 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Attach QA Certificate / Doc</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">Reel #{selectedItem.spooledToReelNumber}</p>
              </div>
              <button onClick={() => setDocumentModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddDocument} className="space-y-4 font-sans text-xs">
              <div>
                <label className="text-slate-300 block mb-1.5 font-semibold">Document Title / File Name:</label>
                <input
                  type="text"
                  required
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  placeholder="e.g. BH_HiPot_Cert_VK0192_15kV.pdf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDocumentModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Upload &amp; Attach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
