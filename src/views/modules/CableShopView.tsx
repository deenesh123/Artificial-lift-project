import React, { useState } from 'react';
import { 
  Sliders, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  Layers, 
  FileText, 
  Truck, 
  ChevronRight, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  FileSpreadsheet, 
  Plus, 
  AlertCircle,
  ExternalLink,
  RotateCcw,
  Tag,
  Calendar
} from 'lucide-react';
import { CableShopItem, CableShopWorkflowStage } from '../../types';
import { CABLE_SHOP_STAGES, INITIAL_CABLE_SHOP_ITEMS } from '../../data/cableShopData';
import { StorageService } from '../../services/storageService';

export const CableShopView: React.FC = () => {
  const [items, setItems] = useState<CableShopItem[]>(() => {
    return StorageService.getCableShopItems ? StorageService.getCableShopItems() : INITIAL_CABLE_SHOP_ITEMS;
  });
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || 'CS-001');
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('All');
  const [manufacturerFilter, setManufacturerFilter] = useState<string>('All');
  const [notice, setNotice] = useState<string | null>(null);

  // Modal for advancing stage
  const [advancingItem, setAdvancingItem] = useState<CableShopItem | null>(null);
  const [newStage, setNewStage] = useState<CableShopWorkflowStage>('Combined Spliced Cable Test');
  const [advanceNotes, setAdvanceNotes] = useState('');

  const selectedItem = items.find(i => i.id === selectedItemId) || items[0];

  const showFeedback = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.wellName && item.wellName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.wellId && item.wellId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.currentSerialNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStage = stageFilter === 'All' || item.stage === stageFilter;
    const matchesMfg = manufacturerFilter === 'All' || item.manufacturer === manufacturerFilter;

    return matchesSearch && matchesStage && matchesMfg;
  });

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
    showFeedback(`Spool ${advancingItem.id} transitioned to "${newStage}".`);
    setAdvancingItem(null);
    setAdvanceNotes('');
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

  // Stage step index helper
  const getStageStep = (stage: CableShopWorkflowStage) => {
    const found = CABLE_SHOP_STAGES.find(s => s.stage === stage);
    return found ? found.step : 1;
  };

  const currentStep = selectedItem ? getStageStep(selectedItem.stage) : 1;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {notice && (
        <div className="bg-cyan-950/90 border border-cyan-500 text-cyan-200 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>{notice}</span>
          </div>
          <button onClick={() => setNotice(null)} className="font-mono text-xs hover:text-white">✕</button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">
              ESP Cable Shop & Splicing Workflow Center
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Standardized 8-stage operational QA/QC tracking for downhole power cables, MLEs, field splices, Hi-Pot electrical resistance testing, and spooling dispatch to well pads.
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

      {/* 4 Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Cable Spools</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{items.length}</div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Permian & Eagle Ford Shops</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Active In Testing</div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">
            {items.filter(i => i.stage.includes('Test')).length}
          </div>
          <div className="text-[10px] text-cyan-400/80 mt-1 font-mono">Hi-Pot / Insulation QA</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Dispatched to Pads</div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
            {items.filter(i => i.stage === 'Shipped Equipment').length}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-1 font-mono">En Route or Staged</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-mono text-slate-400 uppercase font-semibold">Total Cable Footage</div>
          <div className="text-2xl font-bold font-mono text-blue-400 mt-1">
            {items.reduce((acc, i) => acc + i.totalShippingLengthFt, 0).toLocaleString()} <span className="text-xs font-normal">ft</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1 font-mono">Avg 4,200 ft / Spool</div>
        </div>
      </div>

      {/* Selected Spool Pipeline Detail (8-Stage Tracker) */}
      {selectedItem && (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-xl p-5 space-y-5 shadow-lg">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {selectedItem.id}
                </span>
                <h4 className="text-sm font-bold text-white">{selectedItem.partName}</h4>
              </div>
              <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-3 font-mono">
                <span>Associated Asset: <strong className="text-white">{selectedItem.wellId || 'Unassigned'}</strong> {selectedItem.wellName && `(${selectedItem.wellName})`}</span>
                <span>•</span>
                <span>Manufacturer: <strong className="text-slate-300">{selectedItem.manufacturer}</strong></span>
                <span>•</span>
                <span>Reel: <strong className="text-cyan-400">{selectedItem.spooledToReelNumber}</strong></span>
              </div>
            </div>

            <button
              onClick={() => {
                setAdvancingItem(selectedItem);
                setNewStage(selectedItem.stage);
              }}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>Advance Workflow Stage</span>
            </button>
          </div>

          {/* Visual 8-Step Progress Pipeline */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Operational 8-Stage Progress Tracker
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {CABLE_SHOP_STAGES.map(s => {
                const isPassed = s.step < currentStep;
                const isCurrent = s.step === currentStep;
                return (
                  <div
                    key={s.step}
                    className={`p-2.5 rounded-lg border text-left transition-all ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-md ring-1 ring-cyan-400/50'
                        : isPassed
                        ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                      <span>Step {s.step}</span>
                      {isPassed && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                      {isCurrent && <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />}
                    </div>
                    <div className="text-[11px] font-semibold leading-tight line-clamp-2">
                      {s.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* QA Testing Dossier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs font-mono">
            <div>
              <span className="text-slate-500 block text-[10px]">ELECTRICAL TEST VOLTAGE</span>
              <span className="text-white font-bold text-sm">{selectedItem.testVoltageKv ? `${selectedItem.testVoltageKv} kV DC` : 'N/A'}</span>
              <span className="text-slate-400 text-[10px] block mt-0.5">Step Voltage Hi-Pot</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">INSULATION RESISTANCE</span>
              <span className="text-emerald-400 font-bold text-sm">{selectedItem.insulationResistanceMohm ? `${selectedItem.insulationResistanceMohm} MΩ` : 'N/A'}</span>
              <span className="text-slate-400 text-[10px] block mt-0.5">Threshold &gt; 1,000 MΩ</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">CONDUCTOR CONTINUITY</span>
              <span className="text-cyan-300 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{selectedItem.conductorContinuity || 'Pass (Verified)'}</span>
              </span>
            </div>
          </div>

          {selectedItem.notes && (
            <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-slate-500 font-mono text-[10px] block uppercase mb-1">QA Shop Notes & Certification</span>
              <span>{selectedItem.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Spools Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-800 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search part name, serial, well short name..."
              className="w-full bg-slate-950 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Stages (8)</option>
              {CABLE_SHOP_STAGES.map(s => (
                <option key={s.stage} value={s.stage}>{s.label}</option>
              ))}
            </select>

            <select
              value={manufacturerFilter}
              onChange={(e) => setManufacturerFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
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
                <th className="px-4 py-3">Spool ID & Cable Description</th>
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
                      isSelected ? 'bg-cyan-950/40' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-400">{item.id}</span>
                        <span className="text-[10px] text-slate-500">({item.manufacturer})</span>
                      </div>
                      <div className="text-slate-200 font-sans font-medium">{item.partName}</div>
                      <div className="text-[10px] text-slate-500">SN: {item.currentSerialNumber}</div>
                    </td>

                    <td className="px-4 py-3 font-sans">
                      <div className="text-white font-semibold font-mono">{item.wellId || 'Unassigned Stock'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{item.wellName}</div>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-sans bg-slate-800 text-slate-300 border border-slate-700">
                        {item.stage}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-slate-300">{item.totalShippingLengthFt.toLocaleString()} ft</div>
                      <div className="text-[10px] text-slate-500">Reel #{item.spooledToReelNumber}</div>
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
            <div>
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Advance Cable Stage: {advancingItem.id}</span>
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                {advancingItem.partName} (Reel #{advancingItem.spooledToReelNumber})
              </p>
            </div>

            <form onSubmit={handleAdvanceStage} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Target 8-Stage Workflow Step:
                </label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value as CableShopWorkflowStage)}
                  className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
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
    </div>
  );
};
