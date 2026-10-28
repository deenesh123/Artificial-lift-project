import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Cpu, 
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
  RefreshCw, 
  Radio, 
  Wifi, 
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { DeviceItem, DeviceType, DeviceStatus, CommunicationProtocol } from '../../types';
import { StorageService } from '../../services/storageService';

export const DeviceManagementView: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [protocolFilter, setProtocolFilter] = useState<string>('All');

  // Sorting
  const [sortField, setSortField] = useState<keyof DeviceItem>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);

  // Modals
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [editingDevice, setEditingDevice] = useState<DeviceItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingDevice, setDeletingDevice] = useState<DeviceItem | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);

  // Notifications & Uploads
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const datasheetInputRef = useRef<HTMLInputElement>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = () => {
    const data = StorageService.getDevices();
    setDevices(data);
  };

  useEffect(() => {
    loadData();
    const handleStorageChange = () => loadData();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const availableWells = useMemo(() => StorageService.getWells(), [devices]);

  // Filtered & Sorted
  const filteredDevices = useMemo(() => {
    return devices.filter(d => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = 
        d.name.toLowerCase().includes(q) ||
        d.id.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.wellName.toLowerCase().includes(q) ||
        d.wellId.toLowerCase().includes(q) ||
        d.ipAddress.includes(q) ||
        d.serialNumber.toLowerCase().includes(q);

      const matchesType = typeFilter === 'All' || d.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
      const matchesProtocol = protocolFilter === 'All' || d.protocol === protocolFilter;

      return matchesSearch && matchesType && matchesStatus && matchesProtocol;
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
  }, [devices, searchTerm, typeFilter, statusFilter, protocolFilter, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(filteredDevices.length / rowsPerPage) || 1;
  const paginatedDevices = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredDevices.slice(start, start + rowsPerPage);
  }, [filteredDevices, currentPage, rowsPerPage]);

  const handleSort = (field: keyof DeviceItem) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Form Validation
  const validateForm = (dev: Partial<DeviceItem>): boolean => {
    const errors: Record<string, string> = {};
    if (!dev.id?.trim()) errors.id = 'Device ID is required (e.g. DEV-VFD-115)';
    if (!dev.name?.trim()) errors.name = 'Device Name is required';
    if (!dev.model?.trim()) errors.model = 'Model is required';
    if (!dev.ipAddress?.trim()) errors.ipAddress = 'IP Address is required';
    if (!dev.wellId?.trim()) errors.wellId = 'Associated Well ID is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveDevice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = (formData.get('id') as string).trim();
    const name = (formData.get('name') as string).trim();
    const type = formData.get('type') as DeviceType;
    const model = (formData.get('model') as string).trim();
    const serialNumber = (formData.get('serialNumber') as string).trim() || `SN-2024-ALS-${Math.floor(10000 + Math.random() * 90000)}`;
    const wellId = formData.get('wellId') as string;
    const matchedWell = availableWells.find(w => w.id === wellId);
    const wellName = matchedWell ? matchedWell.name : 'Unassigned Well';
    const ipAddress = (formData.get('ipAddress') as string).trim();
    const protocol = formData.get('protocol') as CommunicationProtocol;
    const status = formData.get('status') as DeviceStatus;
    const firmware = (formData.get('firmware') as string).trim() || 'v1.0.0';

    const payload: Partial<DeviceItem> = { id, name, model, ipAddress, wellId };
    if (!validateForm(payload)) return;

    if (isAdding) {
      if (devices.some(d => d.id === id)) {
        setFormErrors({ id: `Device ID "${id}" is already registered.` });
        return;
      }

      const newDevice: DeviceItem = {
        id,
        name,
        type,
        wellId,
        wellName,
        model,
        serialNumber,
        ipAddress,
        protocol,
        status,
        latencyMs: status === 'Offline' ? 0 : Math.round(12 + Math.random() * 25),
        firmware,
        lastHeartbeat: '1s ago',
        installationDate: new Date().toISOString().slice(0, 10),
        macAddress: `00:1B:44:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}:${Math.floor(10 + Math.random() * 89)}`,
        calibrationDueDate: '2027-06-30',
        datasheetName: `${id}_Datasheet.pdf`,
        updatedAt: new Date().toISOString(),
      };

      const updated = StorageService.addDevice(newDevice);
      setDevices(updated);
      setIsAdding(false);
      showToast(`Device "${name}" (${id}) registered successfully.`);
    } else if (editingDevice) {
      const updatedDevice: DeviceItem = {
        ...editingDevice,
        name,
        type,
        wellId,
        wellName,
        model,
        serialNumber,
        ipAddress,
        protocol,
        status,
        firmware,
        latencyMs: status === 'Offline' ? 0 : editingDevice.latencyMs || 18,
        updatedAt: new Date().toISOString(),
      };

      const updated = StorageService.updateDevice(updatedDevice);
      setDevices(updated);
      setEditingDevice(null);
      showToast(`Device "${name}" updated successfully.`);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingDevice) return;
    const updated = StorageService.deleteDevice(deletingDevice.id);
    setDevices(updated);
    showToast(`Device "${deletingDevice.name}" (${deletingDevice.id}) removed permanently.`);
    setDeletingDevice(null);
  };

  const handleExportCSV = () => {
    const headers = [
      'ID',
      'Name',
      'Type',
      'Model',
      'Serial Number',
      'Well ID',
      'Well Name',
      'IP Address',
      'Protocol',
      'Status',
      'Latency (ms)',
      'Firmware',
      'MAC Address',
      'Calibration Due',
      'Last Updated',
    ];

    const rows = filteredDevices.map(d => [
      d.id,
      `"${d.name}"`,
      d.type,
      `"${d.model}"`,
      `"${d.serialNumber}"`,
      d.wellId,
      `"${d.wellName}"`,
      d.ipAddress,
      d.protocol,
      d.status,
      d.latencyMs,
      d.firmware,
      d.macAddress,
      d.calibrationDueDate,
      d.updatedAt,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ALS_Device_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${filteredDevices.length} edge devices to CSV.`);
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
            const [id, name, type, model, serialNumber, wellId, wellName, ipAddress, protocol, statusRaw] = cols;
            if (!id || !name) continue;

            const existingIndex = devices.findIndex(d => d.id === id);
            const importedDevice: DeviceItem = {
              id,
              name,
              type: (type as DeviceType) || 'VFD Inverter',
              model: model || 'Standard Industrial Unit',
              serialNumber: serialNumber || `SN-${id}`,
              wellId: wellId || 'ALS-DEL-ESP-104',
              wellName: wellName || 'Phantom State 104-2H',
              ipAddress: ipAddress || '10.14.32.100',
              protocol: (protocol as CommunicationProtocol) || 'Modbus TCP',
              status: (statusRaw as DeviceStatus) || 'Online',
              latencyMs: 20,
              firmware: 'v3.2.0',
              lastHeartbeat: '1s ago',
              installationDate: new Date().toISOString().slice(0, 10),
              macAddress: '00:1B:44:88:22:11',
              calibrationDueDate: '2027-06-30',
              datasheetName: `${id}_Imported_Datasheet.pdf`,
              updatedAt: new Date().toISOString(),
            };

            if (existingIndex >= 0) {
              StorageService.updateDevice(importedDevice);
            } else {
              StorageService.addDevice(importedDevice);
            }
            count++;
          }
        }

        loadData();
        showToast(`Successfully imported ${count} devices from CSV.`);
        setShowImportModal(false);
      } catch (err) {
        showToast('Failed to parse device CSV file.', 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleUploadDatasheet = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedDevice) return;
    const updated = {
      ...selectedDevice,
      datasheetName: file.name,
      updatedAt: new Date().toISOString(),
    };
    StorageService.updateDevice(updated);
    setSelectedDevice(updated);
    loadData();
    showToast(`Uploaded datasheet "${file.name}" for ${selectedDevice.name}.`);
  };

  const handleDownloadDatasheet = (docName?: string) => {
    const name = docName || 'Device_Datasheet.pdf';
    const fakeContent = `ALS - ARTIFICIAL LIFT SUITE\nDEVICE TECHNICAL SPECIFICATION SHEET\nDevice: ${selectedDevice?.name} (${selectedDevice?.id})\nModel: ${selectedDevice?.model}\nProtocol: ${selectedDevice?.protocol} · IP: ${selectedDevice?.ipAddress}\nStatus: DEMO SIMULATED DOCUMENT\nGenerated: ${new Date().toUTCString()}`;
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
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Industrial Edge Devices & Hardware Registry
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              {devices.length} Configured Units
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Surveillance of surface VFD controllers, downhole Phoenix multi-sensor pods, cellular RTUs, and Coriolis flowmeters.
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Device</span>
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
            placeholder="Search by device ID, model, IP address, serial, or well..."
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
            <option value="All">All Device Types</option>
            <option value="VFD Inverter">VFD Inverter</option>
            <option value="Downhole Phoenix Gauge">Downhole Phoenix Gauge</option>
            <option value="RTU Gateway">RTU Gateway</option>
            <option value="Coriolis Mass Meter">Coriolis Mass Meter</option>
            <option value="Rod Pump Controller">Rod Pump Controller</option>
            <option value="Wellhead Transmitter">Wellhead Transmitter</option>
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
            <option value="Online">Online</option>
            <option value="Warning">Warning</option>
            <option value="Offline">Offline</option>
            <option value="Maintenance">Maintenance</option>
          </select>

          <select
            value={protocolFilter}
            onChange={(e) => {
              setProtocolFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-950 border border-slate-700 text-slate-300 rounded px-2.5 py-1.5"
          >
            <option value="All">All Protocols</option>
            <option value="Modbus TCP">Modbus TCP</option>
            <option value="MQTT">MQTT</option>
            <option value="HART">HART</option>
            <option value="WirelessHART">WirelessHART</option>
          </select>

          {(searchTerm || typeFilter !== 'All' || statusFilter !== 'All' || protocolFilter !== 'All') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('All');
                setStatusFilter('All');
                setProtocolFilter('All');
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
                    <span>Device ID & Model</span>
                    {sortField === 'id' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('name')} 
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Device Description</span>
                    {sortField === 'name' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
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
                  onClick={() => handleSort('type')} 
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Type</span>
                    {sortField === 'type' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('ipAddress')} 
                  className="px-4 py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1.5">
                    <span>IP & Protocol</span>
                    {sortField === 'ipAddress' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
                  </div>
                </th>
                <th 
                  onClick={() => handleSort('latencyMs')} 
                  className="px-4 py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>Latency</span>
                    {sortField === 'latencyMs' ? (sortDirection === 'asc' ? <ArrowUp className="w-3 h-3 text-cyan-400" /> : <ArrowDown className="w-3 h-3 text-cyan-400" />) : <ArrowUpDown className="w-3 h-3 opacity-40" />}
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
              {paginatedDevices.length > 0 ? (
                paginatedDevices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-cyan-400 font-bold">{device.id}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{device.model}</div>
                    </td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-semibold text-white">{device.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        SN: {device.serialNumber} · Updated {new Date(device.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-sans text-slate-300">
                      <div>{device.wellName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{device.wellId}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 font-sans">
                        {device.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{device.ipAddress}</div>
                      <div className="text-[10px] text-slate-400 font-sans">{device.protocol}</div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {device.status === 'Offline' ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span className={device.latencyMs > 50 ? 'text-amber-400' : 'text-emerald-400'}>
                          {device.latencyMs} ms
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-sans font-medium ${
                        device.status === 'Online' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800' :
                        device.status === 'Warning' ? 'bg-amber-950/80 text-amber-300 border border-amber-800' :
                        device.status === 'Maintenance' ? 'bg-blue-950/80 text-blue-300 border border-blue-800' :
                        'bg-rose-950/80 text-rose-300 border border-rose-800'
                      }`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1 font-sans">
                        <button
                          onClick={() => setSelectedDevice(device)}
                          title="View Details"
                          className="p-1 rounded text-slate-400 hover:text-cyan-400 hover:bg-slate-800"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setFormErrors({});
                            setEditingDevice(device);
                          }}
                          title="Edit Device"
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingDevice(device)}
                          title="Delete Device"
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
                    No matching devices found.
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
              Showing {filteredDevices.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}–
              {Math.min(currentPage * rowsPerPage, filteredDevices.length)} of {filteredDevices.length} devices
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
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-white tracking-tight">{selectedDevice.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium font-sans ${
                    selectedDevice.status === 'Online' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    selectedDevice.status === 'Warning' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}>
                    {selectedDevice.status}
                  </span>
                </div>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  ID: <span className="text-cyan-400 font-bold">{selectedDevice.id}</span> · Model: {selectedDevice.model} · Serial: {selectedDevice.serialNumber}
                </div>
              </div>

              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-white font-mono p-1">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Associated Well</span>
                <span className="text-white font-medium">{selectedDevice.wellName}</span>
                <span className="text-slate-400 text-[10px] block font-mono">{selectedDevice.wellId}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">IP & Protocol</span>
                <span className="text-cyan-400 font-bold">{selectedDevice.ipAddress}</span>
                <span className="text-slate-400 text-[10px] block font-sans">{selectedDevice.protocol}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">MAC Address</span>
                <span className="text-slate-300">{selectedDevice.macAddress}</span>
                <span className="text-slate-500 text-[10px] block font-sans">Ethernet Card</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Firmware Build</span>
                <span className="text-white">{selectedDevice.firmware}</span>
                <span className="text-slate-500 text-[10px] block font-sans">OS Kernel 5.4</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Polling Latency</span>
                <span className="text-emerald-400 font-bold">{selectedDevice.latencyMs} ms</span>
                <span className="text-slate-500 text-[10px] block font-sans">Poll: {selectedDevice.lastHeartbeat}</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 font-sans block text-[10px]">Calibration Due</span>
                <span className="text-amber-400">{selectedDevice.calibrationDueDate}</span>
                <span className="text-slate-500 text-[10px] block font-sans">ISO 9001 Cycle</span>
              </div>
            </div>

            {/* Attached Datasheet */}
            <div className="bg-slate-950/80 rounded-lg border border-slate-800 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Hardware Datasheet & Wiring Diagram</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Attached: {selectedDevice.datasheetName || 'Default_Datasheet.pdf'}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={datasheetInputRef}
                  onChange={handleUploadDatasheet}
                  className="hidden"
                  accept=".pdf,.png,.jpg,.txt,.doc"
                />
                <button
                  type="button"
                  onClick={() => datasheetInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Datasheet</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadDatasheet(selectedDevice.datasheetName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-500 font-mono">
              <span>Last Modified: {new Date(selectedDevice.updatedAt).toUTCString()}</span>
              <div className="flex items-center gap-2 font-sans">
                <button
                  onClick={() => {
                    const toEdit = selectedDevice;
                    setSelectedDevice(null);
                    setEditingDevice(toEdit);
                  }}
                  className="px-3.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Edit Device
                </button>
                <button
                  onClick={() => setSelectedDevice(null)}
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
      {(isAdding || editingDevice) && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {isAdding ? 'Register Industrial Edge Device' : `Edit Device: ${editingDevice?.name}`}
              </h3>
              <button 
                onClick={() => {
                  setIsAdding(false);
                  setEditingDevice(null);
                }}
                className="text-slate-400 hover:text-white font-mono"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDevice} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* ID */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Device Identifier <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="id"
                    defaultValue={editingDevice?.id || `DEV-VFD-${Math.floor(120 + Math.random() * 80)}`}
                    readOnly={!isAdding}
                    className={`w-full bg-slate-950 border ${formErrors.id ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white font-mono ${!isAdding ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                  {formErrors.id && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.id}</span>}
                </div>

                {/* Name */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Device Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingDevice?.name || ''}
                    placeholder="e.g. Danfoss VLT Drive Pad Charlie"
                    className={`w-full bg-slate-950 border ${formErrors.name ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white`}
                  />
                  {formErrors.name && <span className="text-[11px] text-rose-400 mt-0.5 block">{formErrors.name}</span>}
                </div>

                {/* Device Type */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Device Category</label>
                  <select
                    name="type"
                    defaultValue={editingDevice?.type || 'VFD Inverter'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="VFD Inverter">VFD Inverter</option>
                    <option value="Downhole Phoenix Gauge">Downhole Phoenix Gauge</option>
                    <option value="RTU Gateway">RTU Gateway</option>
                    <option value="Coriolis Mass Meter">Coriolis Mass Meter</option>
                    <option value="Rod Pump Controller">Rod Pump Controller</option>
                    <option value="Wellhead Transmitter">Wellhead Transmitter</option>
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Hardware Model</label>
                  <input
                    type="text"
                    name="model"
                    defaultValue={editingDevice?.model || 'ATV6100-3850V'}
                    className={`w-full bg-slate-950 border ${formErrors.model ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white`}
                  />
                </div>

                {/* Serial */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Serial Number</label>
                  <input
                    type="text"
                    name="serialNumber"
                    defaultValue={editingDevice?.serialNumber || `SN-2024-DEV-${Math.floor(10000 + Math.random() * 90000)}`}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>

                {/* Associated Well */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Associated Well Asset</label>
                  <select
                    name="wellId"
                    defaultValue={editingDevice?.wellId || availableWells[0]?.id || ''}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                  >
                    {availableWells.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.id} — {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* IP Address */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">IP Address</label>
                  <input
                    type="text"
                    name="ipAddress"
                    defaultValue={editingDevice?.ipAddress || '10.14.32.115'}
                    className={`w-full bg-slate-950 border ${formErrors.ipAddress ? 'border-rose-500' : 'border-slate-700'} rounded px-3 py-1.5 text-white font-mono`}
                  />
                </div>

                {/* Protocol */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">SCADA Protocol</label>
                  <select
                    name="protocol"
                    defaultValue={editingDevice?.protocol || 'Modbus TCP'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Modbus TCP">Modbus TCP</option>
                    <option value="MQTT">MQTT</option>
                    <option value="OPC-UA">OPC-UA</option>
                    <option value="HART">HART</option>
                    <option value="WirelessHART">WirelessHART</option>
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Telemetry Status</label>
                  <select
                    name="status"
                    defaultValue={editingDevice?.status || 'Online'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white"
                  >
                    <option value="Online">Online</option>
                    <option value="Warning">Warning</option>
                    <option value="Offline">Offline</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                {/* Firmware */}
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Firmware Version</label>
                  <input
                    type="text"
                    name="firmware"
                    defaultValue={editingDevice?.firmware || 'v4.2.18'}
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setEditingDevice(null);
                  }}
                  className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md"
                >
                  {isAdding ? 'Register Device' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDevice && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-800/80 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Confirm Device Removal</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete device <strong className="text-white">{deletingDevice.name}</strong> (<span className="font-mono text-cyan-400">{deletingDevice.id}</span>)?
            </p>
            <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2.5 rounded border border-rose-800/60 font-mono">
              Warning: Modbus and telemetry polling for this hardware IP ({deletingDevice.ipAddress}) will be disconnected.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800 text-xs">
              <button
                onClick={() => setDeletingDevice(null)}
                className="px-4 py-2 rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-md"
              >
                Yes, Delete Device
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
                <span>Import Devices from CSV</span>
              </h3>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white font-mono">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Upload a comma-separated (.csv) file of edge devices. Matching IDs will be updated; new IDs will be added to the registry.
            </p>

            <div className="p-4 rounded-lg border-2 border-dashed border-slate-700 bg-slate-950 text-center space-y-2">
              <Upload className="w-8 h-8 text-cyan-400 mx-auto" />
              <div className="text-xs text-slate-300">Select a device inventory CSV file</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".csv"
                className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-500 cursor-pointer"
              />
            </div>

            <div className="text-[11px] text-slate-500 font-mono">
              Required headers: ID, Name, Type, Model, Serial, WellId, WellName, IP, Protocol, Status
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
