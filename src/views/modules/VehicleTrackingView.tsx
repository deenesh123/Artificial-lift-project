import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Navigation, 
  Compass, 
  Search, 
  Filter, 
  Fuel, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Wrench, 
  DollarSign, 
  FileText, 
  Layers, 
  RotateCcw, 
  ShieldCheck, 
  Activity, 
  Send, 
  ChevronRight, 
  Gauge, 
  Calendar,
  Zap,
  TrendingUp,
  X
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  FleetVehicle, 
  FleetVehicleStatus, 
  DriverProfile, 
  VehicleTrip, 
  VehicleMaintenancePlan, 
  FleetTransaction 
} from '../../types';
import { 
  FleetService, 
  INITIAL_FLEET_VEHICLES, 
  INITIAL_DRIVERS, 
  INITIAL_TRIPS, 
  INITIAL_MAINTENANCE_PLANS, 
  INITIAL_FLEET_TRANSACTIONS 
} from '../../services/fleetService';
import { StorageService } from '../../services/storageService';

export const VehicleTrackingView: React.FC = () => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'map' | 'vehicles' | 'drivers' | 'trips' | 'maintenance' | 'fuel'>('map');

  // Datasets from FleetService
  const [vehicles, setVehicles] = useState<FleetVehicle[]>(() => FleetService.getVehicles());
  const [drivers, setDrivers] = useState<DriverProfile[]>(() => FleetService.getDrivers());
  const [trips, setTrips] = useState<VehicleTrip[]>(() => FleetService.getTrips());
  const [maintenancePlans, setMaintenancePlans] = useState<VehicleMaintenancePlan[]>(() => FleetService.getMaintenancePlans());
  const [transactions, setTransactions] = useState<FleetTransaction[]>(() => FleetService.getTransactions());

  // Map & live selection
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('VEH-101');
  const [liveSimulation, setLiveSimulation] = useState<boolean>(true);

  // Search & Filters
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [vehicleStatusFilter, setVehicleStatusFilter] = useState<string>('All');
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<string>('All');
  const [driverSearch, setDriverSearch] = useState('');
  const [tripSearch, setTripSearch] = useState('');

  // Modals
  const [inspectVehicle, setInspectVehicle] = useState<FleetVehicle | null>(null);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<FleetVehicle | null>(null);
  const [deleteConfirmVehicle, setDeleteConfirmVehicle] = useState<FleetVehicle | null>(null);
  const [inspectDriver, setInspectDriver] = useState<DriverProfile | null>(null);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const wells = useMemo(() => StorageService.getWells(), []);

  const showToast = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3500);
  };

  // Selected vehicle for map HUD
  const selectedVehicle = useMemo(() => {
    return vehicles.find(v => v.id === selectedVehicleId) || vehicles[0];
  }, [vehicles, selectedVehicleId]);

  // Live simulation tick: modulates coordinates and speeds slightly for live feel
  useEffect(() => {
    if (!liveSimulation) return;
    const interval = setInterval(() => {
      setVehicles(prev => prev.map(v => {
        if (v.status === 'Moving') {
          const latDelta = (Math.random() - 0.48) * 0.0012;
          const lngDelta = (Math.random() - 0.48) * 0.0015;
          const speedDelta = Math.round((Math.random() - 0.5) * 3);
          return {
            ...v,
            speedMph: Math.max(25, Math.min(68, v.speedMph + speedDelta)),
            coordinates: {
              lat: Number((v.coordinates.lat + latDelta).toFixed(4)),
              lng: Number((v.coordinates.lng + lngDelta).toFixed(4)),
            },
            lastLocationUpdate: `${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
          };
        }
        return v;
      }));
    }, 4000);
    return () => clearInterval(interval);
  }, [liveSimulation]);

  // Filtered vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch = 
        v.name.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.unitCode.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.driver.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.assignedWellName.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
        v.id.toLowerCase().includes(vehicleSearch.toLowerCase());

      const matchStatus = vehicleStatusFilter === 'All' || v.status === vehicleStatusFilter;
      const matchType = vehicleTypeFilter === 'All' || v.type === vehicleTypeFilter;

      return matchSearch && matchStatus && matchType;
    });
  }, [vehicles, vehicleSearch, vehicleStatusFilter, vehicleTypeFilter]);

  // Filtered drivers
  const filteredDrivers = useMemo(() => {
    return drivers.filter(d => 
      d.name.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.badgeNumber.toLowerCase().includes(driverSearch.toLowerCase()) ||
      d.baseStation.toLowerCase().includes(driverSearch.toLowerCase()) ||
      (d.assignedVehicleCode && d.assignedVehicleCode.toLowerCase().includes(driverSearch.toLowerCase()))
    );
  }, [drivers, driverSearch]);

  // Filtered trips
  const filteredTrips = useMemo(() => {
    return trips.filter(t => 
      t.id.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.driverName.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.vehicleCode.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.origin.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.destination.toLowerCase().includes(tripSearch.toLowerCase()) ||
      t.purpose.toLowerCase().includes(tripSearch.toLowerCase())
    );
  }, [trips, tripSearch]);

  // Handle vehicle deletion
  const handleDeleteVehicle = (id: string) => {
    const updated = FleetService.deleteVehicle(id);
    setVehicles(updated);
    setDeleteConfirmVehicle(null);
    showToast(`Vehicle ${id} removed from fleet registry.`);
  };

  // CSV Export for Vehicles
  const handleExportVehiclesCSV = () => {
    const headers = ['ID', 'UnitCode', 'Name', 'Type', 'Driver', 'Status', 'SpeedMPH', 'FuelPct', 'OdometerMiles', 'AssignedWell', 'LocationArea', 'LicensePlate', 'VIN', 'NextMaintenance'];
    const rows = filteredVehicles.map(v => [
      v.id,
      v.unitCode,
      `"${v.name}"`,
      `"${v.type}"`,
      `"${v.driver}"`,
      v.status,
      v.speedMph,
      v.fuelPct,
      v.odometerMiles || 0,
      `"${v.assignedWellName || ''}"`,
      `"${v.locationArea}"`,
      v.licensePlate || '',
      v.vin || '',
      v.nextMaintenanceDate || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ALS_Fleet_Vehicles_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported Fleet Vehicle Registry to CSV.');
  };

  // CSV Import for Vehicles
  const handleImportVehiclesCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          showToast('Invalid CSV: No records found.');
          return;
        }
        showToast(`Imported ${lines.length - 1} fleet vehicle records.`);
      } catch {
        showToast('Failed to parse vehicle CSV.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Status Counts
  const movingCount = vehicles.filter(v => v.status === 'Moving').length;
  const idleCount = vehicles.filter(v => v.status === 'Idle').length;
  const stoppedCount = vehicles.filter(v => v.status === 'Stopped').length;
  const maintCount = vehicles.filter(v => v.status === 'Maintenance').length;
  const offlineCount = vehicles.filter(v => v.status === 'Offline').length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {notice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{notice}</span>
        </div>
      )}

      {/* Header Summary KPI Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">TOTAL FLEET</span>
          <span className="text-2xl font-bold font-mono text-white mt-1 block">{vehicles.length} Units</span>
          <span className="text-[10px] text-slate-500 font-mono">Heavy Rigs & Pickups</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">MOVING IN TRANSIT</span>
          <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">{movingCount}</span>
          <span className="text-[10px] text-cyan-500 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Live GPS Tracking
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">IDLE ON SITE</span>
          <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">{idleCount}</span>
          <span className="text-[10px] text-amber-500 font-mono">Telemetry Online</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">STOPPED AT PAD</span>
          <span className="text-2xl font-bold font-mono text-blue-400 mt-1 block">{stoppedCount}</span>
          <span className="text-[10px] text-blue-500 font-mono">Rigged Up / Servicing</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">MAINTENANCE</span>
          <span className="text-2xl font-bold font-mono text-rose-400 mt-1 block">{maintCount}</span>
          <span className="text-[10px] text-rose-500 font-mono">Shop Inspections</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
          <span className="text-xs text-slate-400 block font-mono">ACTIVE DRIVERS</span>
          <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {drivers.filter(d => d.status === 'Driving' || d.status === 'On Duty').length} / {drivers.length}
          </span>
          <span className="text-[10px] text-emerald-500 font-mono">HOS Compliant</span>
        </div>
      </div>

      {/* Main Suite Header & Module Tab Switcher */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Vehicle & Fleet Management Operations
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time field telemetry, schematic GIS dispatch radar, driver HOS logs, vehicle maintenance planner, and fuel accounting.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'map' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Live Map & Radar
          </button>
          <button
            onClick={() => setActiveTab('vehicles')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'vehicles' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Vehicle Registry ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'drivers' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Drivers ({drivers.length})
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'trips' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Trips ({trips.length})
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'maintenance' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Maintenance ({maintenancePlans.length})
          </button>
          <button
            onClick={() => setActiveTab('fuel')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'fuel' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fuel & Finance
          </button>
        </div>
      </div>

      {/* TAB 1: LIVE VEHICLE MAP & DISPATCH COCKPIT */}
      {activeTab === 'map' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Schematic Tactical Map Canvas (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Permian Basin Tactical Fleet Telemetry Grid</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  Coordinates bounds: 31.3°N - 32.2°N / 102.0°W - 103.8°W (Delaware & Midland Benches)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLiveSimulation(!liveSimulation)}
                  className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-colors ${
                    liveSimulation 
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' 
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                  }`}
                >
                  {liveSimulation ? 'GPS Simulation: ACTIVE' : 'GPS Simulation: PAUSED'}
                </button>
              </div>
            </div>

            {/* Interactive SVG Schematic Map */}
            <div className="relative w-full h-96 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center p-2 select-none">
              {/* Grid Background */}
              <div 
                className="absolute inset-0 opacity-15" 
                style={{ 
                  backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px), radial-gradient(#38bdf8 1px, #020617 1px)', 
                  backgroundSize: '30px 30px', 
                  backgroundPosition: '0 0, 15px 15px' 
                }} 
              />

              {/* Major Roads / Highways (Synthetic Lines) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-slate-800/80">
                {/* US Hwy 285 diagonal */}
                <line x1="10%" y1="90%" x2="70%" y2="10%" strokeWidth="3" strokeDasharray="6 4" stroke="#334155" />
                {/* Interstate 20 horizontal */}
                <line x1="5%" y1="45%" x2="95%" y2="40%" strokeWidth="3" strokeDasharray="8 4" stroke="#1e293b" />
                {/* FM 652 lateral */}
                <line x1="15%" y1="25%" x2="85%" y2="30%" strokeWidth="2" strokeDasharray="4 4" stroke="#1e293b" />

                {/* Connection lines from selected vehicle to assigned well pad */}
                {selectedVehicle && (
                  <line 
                    x1="45%" 
                    y1="38%" 
                    x2="65%" 
                    y2="28%" 
                    strokeWidth="2" 
                    stroke="#22d3ee" 
                    strokeDasharray="4 2" 
                    className="animate-pulse"
                  />
                )}
              </svg>

              {/* Well Pad Facilities Fixed Markers */}
              <div className="absolute top-10 left-16 flex items-center gap-1.5 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded bg-cyan-600/60 border border-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                  Phantom State Pad Bravo
                </span>
              </div>

              <div className="absolute top-24 right-20 flex items-center gap-1.5 pointer-events-none">
                <div className="w-2.5 h-2.5 rounded bg-cyan-600/60 border border-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800">
                  Red River Central Pad A
                </span>
              </div>

              <div className="absolute bottom-16 left-28 flex items-center gap-1.5 pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-400 flex items-center justify-center text-[8px] text-amber-200">
                  ★
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                  Pecos Base Depot
                </span>
              </div>

              <div className="absolute top-36 right-10 flex items-center gap-1.5 pointer-events-none">
                <div className="w-3 h-3 rounded-full bg-amber-500/40 border border-amber-400 flex items-center justify-center text-[8px] text-amber-200">
                  ★
                </div>
                <span className="text-[10px] font-mono text-amber-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-slate-800 font-bold">
                  Midland Ops Center
                </span>
              </div>

              {/* Dynamic Vehicle Markers positioned across coordinate space */}
              {vehicles.map((v, vIdx) => {
                const isSelected = v.id === selectedVehicleId;
                // Normalize lat (31.3 - 32.2) to Y % and lng (-103.8 - -102.0) to X %
                const xPercent = Math.max(8, Math.min(92, ((v.coordinates.lng - (-103.8)) / 1.8) * 100));
                const yPercent = Math.max(10, Math.min(88, 100 - (((v.coordinates.lat - 31.3) / 0.9) * 100)));

                const isMoving = v.status === 'Moving';
                const isMaintenance = v.status === 'Maintenance';
                const isIdle = v.status === 'Idle';

                return (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVehicleId(v.id)}
                    style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group transition-transform ${
                      isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                    }`}
                  >
                    <div className="relative flex items-center justify-center">
                      {/* Pulse circle for moving */}
                      {isMoving && (
                        <span className="absolute w-7 h-7 rounded-full bg-cyan-400/25 animate-ping" />
                      )}

                      {/* Main Icon Pill */}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-all border ${
                        isSelected 
                          ? 'bg-cyan-500 text-slate-950 border-white ring-2 ring-cyan-400' 
                          : isMoving 
                          ? 'bg-cyan-950 text-cyan-300 border-cyan-500' 
                          : isMaintenance
                          ? 'bg-rose-950 text-rose-300 border-rose-500'
                          : isIdle
                          ? 'bg-amber-950 text-amber-300 border-amber-500'
                          : 'bg-slate-800 text-slate-300 border-slate-600'
                      }`}>
                        <Truck className="w-3.5 h-3.5" />
                      </div>

                      {/* Unit Tag Label */}
                      <div className={`absolute top-7 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-md border ${
                        isSelected 
                          ? 'bg-cyan-400 text-slate-950 border-white' 
                          : 'bg-slate-900/90 text-slate-200 border-slate-700'
                      }`}>
                        {v.unitCode} {v.speedMph > 0 ? `(${v.speedMph}mph)` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Radar status footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                  Moving ({movingCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Idle ({idleCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  Stopped ({stoppedCount})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  Shop / Maint ({maintCount})
                </span>
              </div>
              <span className="text-[11px] text-slate-500">Live Telemetry refreshed every 4s</span>
            </div>
          </div>

          {/* Right Selected Vehicle HUD Card (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4 shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800">
                    {selectedVehicle.unitCode}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{selectedVehicle.id}</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedVehicle.status === 'Moving' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                  selectedVehicle.status === 'Idle' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                  selectedVehicle.status === 'Maintenance' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  {selectedVehicle.status}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mt-2.5 leading-snug">
                {selectedVehicle.name}
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Type: <strong className="text-slate-200">{selectedVehicle.type}</strong>
              </p>

              {/* Telemetry Gauge Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-mono">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">SPEED</span>
                  <span className="text-cyan-400 font-bold text-base">{selectedVehicle.speedMph} <span className="text-xs font-normal text-slate-400">mph</span></span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">FUEL LEVEL</span>
                  <span className="text-emerald-400 font-bold text-base">{selectedVehicle.fuelPct}%</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ODOMETER</span>
                  <span className="text-white font-bold">{selectedVehicle.odometerMiles?.toLocaleString()} mi</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">FUEL ECONOMY</span>
                  <span className="text-white font-bold">{selectedVehicle.avgMpg || 5.8} mpg</span>
                </div>
              </div>

              {/* Trip & Driver Assignment Details */}
              <div className="mt-4 p-3 bg-slate-950 rounded-lg border border-slate-800/80 space-y-2 text-xs font-sans">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[11px]">Assigned Driver:</span>
                  <span className="text-white font-bold">{selectedVehicle.driver}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[11px]">Current Location:</span>
                  <span className="text-cyan-300 font-mono text-[11px] truncate max-w-[180px]">{selectedVehicle.locationArea}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[11px]">Assigned Well Pad:</span>
                  <span className="text-white font-semibold">{selectedVehicle.assignedWellName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-mono text-[11px]">ETA / Status:</span>
                  <span className="text-amber-400 font-mono text-[11px]">{selectedVehicle.eta}</span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800/60 pt-2 text-[10px] text-slate-500 font-mono">
                  <span>GPS Lat/Lng:</span>
                  <span>{selectedVehicle.coordinates.lat}, {selectedVehicle.coordinates.lng}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  showToast(`Priority dispatch ping sent to ${selectedVehicle.driver} (${selectedVehicle.unitCode}).`);
                }}
                className="w-full py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-cyan-950 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Waypoint Dispatch</span>
              </button>

              <button
                onClick={() => setInspectVehicle(selectedVehicle)}
                className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Unit Dossier</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VEHICLE REGISTRY TABLE */}
      {activeTab === 'vehicles' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                placeholder="Search unit code, vehicle name, driver, or well..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Status:</span>
                <select
                  value={vehicleStatusFilter}
                  onChange={(e) => setVehicleStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="All">All Statuses</option>
                  <option value="Moving">Moving</option>
                  <option value="Idle">Idle</option>
                  <option value="Stopped">Stopped</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
                <span>Type:</span>
                <select
                  value={vehicleTypeFilter}
                  onChange={(e) => setVehicleTypeFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                >
                  <option value="All">All Types</option>
                  <option value="Heavy Pulling Crane">Heavy Pulling Crane</option>
                  <option value="Wireline Truck">Wireline Truck</option>
                  <option value="Slickline Unit">Slickline Unit</option>
                  <option value="Mobile Instrumentation Lab">Mobile Instrumentation Lab</option>
                  <option value="Chemical Tanker">Chemical Tanker</option>
                  <option value="Field Crew Pickup">Field Crew Pickup</option>
                  <option value="Cable Spooler">Cable Spooler</option>
                </select>
              </div>

              <button
                onClick={handleExportVehiclesCSV}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs border border-slate-700 cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>Import CSV</span>
                <input ref={fileInputRef} type="file" accept=".csv" onChange={handleImportVehiclesCSV} className="hidden" />
              </label>

              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Vehicle</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Unit Code</th>
                  <th className="px-3 py-2.5">Vehicle Description</th>
                  <th className="px-3 py-2.5">Equipment Type</th>
                  <th className="px-3 py-2.5">Assigned Driver</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Speed / Telemetry</th>
                  <th className="px-3 py-2.5">Fuel Level</th>
                  <th className="px-3 py-2.5">Odometer</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                      No vehicles found matching current search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map(veh => (
                    <tr key={veh.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-cyan-400">
                        {veh.unitCode}
                        <div className="text-[10px] text-slate-500 font-normal">{veh.id}</div>
                      </td>
                      <td className="px-3 py-2.5 font-sans">
                        <div className="font-semibold text-white">{veh.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{veh.locationArea}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300 font-sans">{veh.type}</td>
                      <td className="px-3 py-2.5 text-white font-sans">{veh.driver}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          veh.status === 'Moving' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                          veh.status === 'Idle' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          veh.status === 'Maintenance' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                          'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}>
                          {veh.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-bold text-white">
                        {veh.speedMph} mph
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full ${veh.fuelPct < 25 ? 'bg-rose-500' : veh.fuelPct < 50 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                              style={{ width: `${veh.fuelPct}%` }}
                            />
                          </div>
                          <span>{veh.fuelPct}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">
                        {veh.odometerMiles?.toLocaleString()} mi
                      </td>
                      <td className="px-3 py-2.5 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setInspectVehicle(veh)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-400 transition-colors"
                            title="Inspect Vehicle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingVehicle(veh)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
                            title="Edit Vehicle"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmVehicle(veh)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete Vehicle"
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
        </div>
      )}

      {/* TAB 3: DRIVER PROFILES */}
      {activeTab === 'drivers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={driverSearch}
                onChange={(e) => setDriverSearch(e.target.value)}
                placeholder="Search driver name, badge, base, or unit..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <span className="text-xs text-slate-400 font-mono">
              30 Certified Field Operators & CDL-A Specialists
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredDrivers.map(drv => (
              <div 
                key={drv.id} 
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-cyan-400 font-mono font-bold text-xs">{drv.badgeNumber}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      drv.status === 'Driving' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      drv.status === 'On Duty' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      drv.status === 'Rest / Sleeper' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {drv.status}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white font-sans">{drv.name}</h4>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{drv.cdlClass} • {drv.baseStation}</p>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block text-[9px]">SAFETY SCORE</span>
                      <span className="text-emerald-400 font-bold">{drv.safetyScore}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">HOS REMAINING</span>
                      <span className="text-cyan-300 font-bold">{drv.hosHoursRemaining} hrs</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">INCIDENT FREE</span>
                      <span className="text-white">{drv.incidentFreeDays} days</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[9px]">ASSIGNED UNIT</span>
                      <span className="text-amber-300 font-bold">{drv.assignedVehicleCode || 'Unassigned'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">{drv.phone}</span>
                  <button
                    onClick={() => setInspectDriver(drv)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1"
                  >
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: TRIP HISTORY */}
      {activeTab === 'trips' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={tripSearch}
                onChange={(e) => setTripSearch(e.target.value)}
                placeholder="Search trip ID, driver, vehicle, well, or purpose..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <span className="text-xs text-slate-400 font-mono">
              42 Synthetic Fleet Dispatch Trips Logged
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Trip ID</th>
                  <th className="px-3 py-2.5">Vehicle & Driver</th>
                  <th className="px-3 py-2.5">Transit Route (Origin → Destination)</th>
                  <th className="px-3 py-2.5">Operational Purpose</th>
                  <th className="px-3 py-2.5">Distance</th>
                  <th className="px-3 py-2.5">Duration</th>
                  <th className="px-3 py-2.5">Avg Speed</th>
                  <th className="px-3 py-2.5">Fuel Burn</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                {filteredTrips.map(trip => (
                  <tr key={trip.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-cyan-400">{trip.id}</td>
                    <td className="px-3 py-2.5 font-sans">
                      <div className="font-semibold text-white">{trip.vehicleCode}</div>
                      <div className="text-[10px] text-slate-400">{trip.driverName}</div>
                    </td>
                    <td className="px-3 py-2.5 font-sans">
                      <div className="text-slate-200">{trip.origin} → {trip.destination}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{trip.startTime}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 font-sans">{trip.purpose}</td>
                    <td className="px-3 py-2.5 font-bold text-white">{trip.distanceMiles} mi</td>
                    <td className="px-3 py-2.5 text-slate-400">{trip.durationMinutes} min</td>
                    <td className="px-3 py-2.5 text-slate-300">{trip.avgSpeedMph} mph</td>
                    <td className="px-3 py-2.5 text-amber-400">{trip.fuelUsedGal} gal</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        trip.status === 'In Progress' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                        trip.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MAINTENANCE PLANNER */}
      {activeTab === 'maintenance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Fleet Preventative Maintenance & DOT Inspection Scheduler
              </h3>
              <p className="text-xs text-slate-400">Track mandatory certifications, hydraulic flushes, and brake service schedules.</p>
            </div>

            <button
              onClick={() => setIsAddMaintenanceOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md shadow-cyan-950"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Schedule Service</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {maintenancePlans.map(maint => (
              <div key={maint.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-cyan-400 text-xs">{maint.id} • {maint.vehicleCode}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    maint.priority === 'Mandatory Safety' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    maint.priority === 'Urgent' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {maint.priority}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{maint.serviceType}</h4>
                  <p className="text-xs text-slate-300 mt-1 font-sans">{maint.notes}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900 rounded border border-slate-800 text-[11px] font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px]">DUE DATE</span>
                    <span className="text-white font-bold">{maint.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">DUE ODOMETER</span>
                    <span className="text-white">{maint.dueMiles.toLocaleString()} mi</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">EST. EXPENSE</span>
                    <span className="text-amber-400 font-bold">${maint.estimatedCostUsd}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">VENDOR</span>
                    <span className="text-slate-300 truncate block">{maint.serviceVendor}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    maint.status === 'In Service' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    maint.status === 'Scheduled' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {maint.status}
                  </span>

                  {maint.status !== 'Completed' && (
                    <button
                      onClick={() => {
                        const updated = maintenancePlans.map(p => p.id === maint.id ? { ...p, status: 'Completed' as const } : p);
                        setMaintenancePlans(updated);
                        FleetService.saveMaintenancePlans(updated);
                        showToast(`Marked ${maint.id} as Completed.`);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-sans font-semibold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: FUEL ANALYTICS & TRANSACTION LOG */}
      {activeTab === 'fuel' && (
        <div className="space-y-6">
          {/* Fuel Stats Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block font-mono">TOTAL DIESEL PURCHASED</span>
              <span className="text-2xl font-bold font-mono text-cyan-400 mt-1 block">18,420 Gal</span>
              <span className="text-[10px] text-slate-500 font-mono">Month-to-Date Volume</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block font-mono">FLEET AVERAGE MPG</span>
              <span className="text-2xl font-bold font-mono text-emerald-400 mt-1 block">7.2 MPG</span>
              <span className="text-[10px] text-emerald-500 font-mono">+0.4 MPG vs Target</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block font-mono">AVG DIESEL COST / GAL</span>
              <span className="text-2xl font-bold font-mono text-amber-400 mt-1 block">$3.78</span>
              <span className="text-[10px] text-slate-500 font-mono">Permian Cardlock Rate</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
              <span className="text-xs text-slate-400 block font-mono">MONTHLY FUEL EXPENSE</span>
              <span className="text-2xl font-bold font-mono text-white mt-1 block">$69,627</span>
              <span className="text-[10px] text-slate-500 font-mono">22 Units Tracked</span>
            </div>
          </div>

          {/* Transaction Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Fleet Transaction Log & Card Receipts
                </h3>
                <p className="text-xs text-slate-400">Audited cardlock diesel, DEF fluid, tolls, and scheduled mechanical maintenance charges.</p>
              </div>

              <span className="text-xs text-cyan-400 font-mono">7 Recent Purchases</span>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Txn ID</th>
                    <th className="px-3 py-2.5">Vehicle Unit</th>
                    <th className="px-3 py-2.5">Driver</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Location & Station</th>
                    <th className="px-3 py-2.5">Volume</th>
                    <th className="px-3 py-2.5">Amount (USD)</th>
                    <th className="px-3 py-2.5">Receipt Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/50">
                  {transactions.map(txn => (
                    <tr key={txn.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2.5 font-bold text-cyan-400">{txn.id}</td>
                      <td className="px-3 py-2.5 text-white font-bold">{txn.vehicleCode}</td>
                      <td className="px-3 py-2.5 font-sans text-slate-300">{txn.driverName}</td>
                      <td className="px-3 py-2.5">
                        <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                          {txn.type}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-400 font-sans">{txn.location}</td>
                      <td className="px-3 py-2.5 text-white">{txn.gallons ? `${txn.gallons} gal` : '—'}</td>
                      <td className="px-3 py-2.5 font-bold text-amber-400">${txn.amountUsd.toFixed(2)}</td>
                      <td className="px-3 py-2.5 text-slate-500 font-mono text-[11px]">{txn.receiptRef}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Vehicle Dossier Modal */}
      {inspectVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{inspectVehicle.unitCode} • {inspectVehicle.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{inspectVehicle.name}</h3>
              </div>
              <button onClick={() => setInspectVehicle(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[10px]">STATUS</span>
                <span className="text-cyan-400 font-bold">{inspectVehicle.status}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">SPEED</span>
                <span className="text-white font-bold">{inspectVehicle.speedMph} mph</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">FUEL CAPACITY</span>
                <span className="text-emerald-400 font-bold">{inspectVehicle.fuelPct}% ({inspectVehicle.fuelCapacityGal || 100} gal)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">ODOMETER</span>
                <span className="text-white">{inspectVehicle.odometerMiles?.toLocaleString()} mi</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Assigned Driver:</span>
                <span className="text-white font-semibold">{inspectVehicle.driver}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Target Well Asset:</span>
                <span className="text-cyan-300 font-semibold">{inspectVehicle.assignedWellName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Operating Location:</span>
                <span className="text-slate-200">{inspectVehicle.locationArea}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">License Plate:</span>
                <span className="text-white font-mono">{inspectVehicle.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">VIN:</span>
                <span className="text-slate-300 font-mono text-[11px]">{inspectVehicle.vin}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Next Maintenance Due:</span>
                <span className="text-amber-400 font-mono">{inspectVehicle.nextMaintenanceDate}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setInspectVehicle(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inspect Driver Modal */}
      {inspectDriver && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold">{inspectDriver.badgeNumber} • {inspectDriver.id}</span>
                <h3 className="text-base font-bold text-white mt-0.5">{inspectDriver.name}</h3>
              </div>
              <button onClick={() => setInspectDriver(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs font-sans text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800">
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">CDL License Class:</span>
                <span className="text-white font-bold">{inspectDriver.cdlClass} ({inspectDriver.licenseNumber})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Endorsements:</span>
                <span className="text-cyan-300 font-mono text-[11px]">{inspectDriver.endorsements.join(', ') || 'Standard'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Current Duty Status:</span>
                <span className="text-emerald-400 font-bold">{inspectDriver.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Safety Score:</span>
                <span className="text-white font-bold">{inspectDriver.safetyScore} / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">HOS Remaining:</span>
                <span className="text-amber-400 font-bold">{inspectDriver.hosHoursRemaining} Hours</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Total Career Miles:</span>
                <span className="text-white">{inspectDriver.totalMilesDriven.toLocaleString()} mi</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-mono">Base Facility Depot:</span>
                <span className="text-slate-200">{inspectDriver.baseStation}</span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setInspectDriver(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs"
              >
                Close Driver Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Vehicle Modal */}
      {deleteConfirmVehicle && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-900/60 rounded-xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-white text-sm">Decommission Fleet Vehicle?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to remove <span className="text-white font-bold">{deleteConfirmVehicle.unitCode} ({deleteConfirmVehicle.name})</span> from active fleet tracking?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmVehicle(null)}
                className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteVehicle(deleteConfirmVehicle.id)}
                className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white"
              >
                Decommission Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Vehicle Modal */}
      {isAddVehicleOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register New Fleet Vehicle</h3>
              <button onClick={() => setIsAddVehicleOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const unitCode = (form.elements.namedItem('unitCode') as HTMLInputElement).value;
                const name = (form.elements.namedItem('name') as HTMLInputElement).value;
                const type = (form.elements.namedItem('type') as HTMLSelectElement).value;
                const driver = (form.elements.namedItem('driver') as HTMLSelectElement).value;
                const status = (form.elements.namedItem('status') as HTMLSelectElement).value as FleetVehicleStatus;
                const locationArea = (form.elements.namedItem('locationArea') as HTMLInputElement).value;
                const licensePlate = (form.elements.namedItem('licensePlate') as HTMLInputElement).value;
                const vin = (form.elements.namedItem('vin') as HTMLInputElement).value;

                const newVeh: FleetVehicle = {
                  id: `VEH-${Math.floor(130 + Math.random() * 800)}`,
                  name,
                  unitCode,
                  type,
                  driver,
                  status,
                  assignedWellId: 'ALS-DEL-ESP-104',
                  assignedWellName: 'Phantom State 104-2H',
                  locationArea,
                  speedMph: status === 'Moving' ? 45 : 0,
                  fuelPct: 90,
                  fuelCapacityGal: 100,
                  odometerMiles: 15000,
                  lastLocationUpdate: `${new Date().toISOString().replace('T', ' ').slice(0, 19)} UTC`,
                  eta: status === 'Moving' ? '25 min' : 'On Site',
                  licensePlate,
                  vin,
                  coordinates: { lat: 31.8412, lng: -103.5821 },
                };

                const updated = FleetService.addVehicle(newVeh);
                setVehicles(updated);
                setIsAddVehicleOpen(false);
                showToast(`Vehicle ${newVeh.unitCode} added to fleet registry.`);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Unit Code</label>
                  <input name="unitCode" defaultValue="CRN-08" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Vehicle Type</label>
                  <select name="type" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Heavy Pulling Crane">Heavy Pulling Crane</option>
                    <option value="Wireline Truck">Wireline Truck</option>
                    <option value="Slickline Unit">Slickline Unit</option>
                    <option value="Mobile Instrumentation Lab">Mobile Instrumentation Lab</option>
                    <option value="Chemical Tanker">Chemical Tanker</option>
                    <option value="Field Crew Pickup">Field Crew Pickup</option>
                    <option value="Cable Spooler">Cable Spooler</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Vehicle Make / Model Description</label>
                <input name="name" defaultValue="Kenworth T880 Tri-Axle Heavy Pulling Unit" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Assigned Driver</label>
                  <select name="driver" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    {drivers.map(d => (
                      <option key={d.id} value={d.name}>{d.name} ({d.badgeNumber})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Initial Status</label>
                  <select name="status" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Moving">Moving</option>
                    <option value="Idle">Idle</option>
                    <option value="Stopped">Stopped</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Offline">Offline</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">License Plate</label>
                  <input name="licensePlate" defaultValue="TX-HVY-9988" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">VIN (17 Characters)</label>
                  <input name="vin" defaultValue="1NKDX4EX4JJ991042" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Initial Operating Location</label>
                <input name="locationArea" defaultValue="Pecos Base Facility Depot" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddVehicleOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Register Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Maintenance Modal */}
      {isAddMaintenanceOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Schedule Preventative Service</h3>
              <button onClick={() => setIsAddMaintenanceOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const vehicleCode = (form.elements.namedItem('vehicleCode') as HTMLSelectElement).value;
                const serviceType = (form.elements.namedItem('serviceType') as HTMLInputElement).value;
                const priority = (form.elements.namedItem('priority') as HTMLSelectElement).value as any;
                const dueDate = (form.elements.namedItem('dueDate') as HTMLInputElement).value;
                const dueMiles = Number((form.elements.namedItem('dueMiles') as HTMLInputElement).value);
                const estimatedCostUsd = Number((form.elements.namedItem('estimatedCostUsd') as HTMLInputElement).value);
                const serviceVendor = (form.elements.namedItem('serviceVendor') as HTMLInputElement).value;
                const notes = (form.elements.namedItem('notes') as HTMLTextAreaElement).value;

                const newPlan: VehicleMaintenancePlan = {
                  id: `MAINT-${Math.floor(500 + Math.random() * 400)}`,
                  vehicleId: 'VEH-101',
                  vehicleCode,
                  serviceType,
                  priority,
                  dueDate,
                  dueMiles,
                  estimatedCostUsd,
                  status: 'Scheduled',
                  serviceVendor,
                  notes,
                };

                const updated = [newPlan, ...maintenancePlans];
                setMaintenancePlans(updated);
                FleetService.saveMaintenancePlans(updated);
                setIsAddMaintenanceOpen(false);
                showToast(`Service order ${newPlan.id} scheduled for ${vehicleCode}.`);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-400 mb-1">Target Vehicle</label>
                <select name="vehicleCode" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono">
                  {vehicles.map(v => (
                    <option key={v.id} value={v.unitCode}>{v.unitCode} — {v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service Type</label>
                <input name="serviceType" defaultValue="Brake Inspection & Air Line Leak Check" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Priority</label>
                  <select name="priority" className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white">
                    <option value="Routine">Routine</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Mandatory Safety">Mandatory Safety</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Target Due Date</label>
                  <input name="dueDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white font-mono" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono">
                <div>
                  <label className="block text-slate-400 mb-1">Target Odometer</label>
                  <input name="dueMiles" type="number" defaultValue={75000} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Estimated Cost ($)</label>
                  <input name="estimatedCostUsd" type="number" defaultValue={850} required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Service Vendor</label>
                <input name="serviceVendor" defaultValue="Pecos Fleet Safety Center" required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Notes</label>
                <textarea name="notes" rows={2} defaultValue="Routine inspection to satisfy state DOT safety standards." required className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-white" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddMaintenanceOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  Confirm Service Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
