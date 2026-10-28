import React, { useState, useMemo, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  Filter, 
  Activity, 
  Wifi, 
  Radio, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Zap, 
  SlidersHorizontal, 
  Gauge, 
  Clock, 
  Maximize2, 
  Terminal, 
  Send, 
  Battery, 
  Signal, 
  ChevronRight,
  TrendingUp,
  X
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DeviceItem, DeviceStatus, CommunicationProtocol, DeviceType } from '../../types';
import { StorageService } from '../../services/storageService';

export const DeviceMonitoringView: React.FC = () => {
  const [devices, setDevices] = useState<DeviceItem[]>(() => StorageService.getDevices());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [protocolFilter, setProtocolFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [selectedDevice, setSelectedDevice] = useState<DeviceItem | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3500);
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter(dev => {
      const matchSearch = 
        dev.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.wellName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dev.serialNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'All' || dev.status === statusFilter;
      const matchProtocol = protocolFilter === 'All' || dev.protocol === protocolFilter;
      const matchType = typeFilter === 'All' || dev.type === typeFilter;

      return matchSearch && matchStatus && matchProtocol && matchType;
    });
  }, [devices, searchTerm, statusFilter, protocolFilter, typeFilter]);

  // Generate historical data for the selected drilldown device
  const deviceHistoryData = useMemo(() => {
    if (!selectedDevice) return [];
    const count = timeRange === '1h' ? 20 : timeRange === '6h' ? 24 : timeRange === '24h' ? 24 : 28;
    const now = new Date();
    const pts = [];

    for (let i = count - 1; i >= 0; i--) {
      const stepMins = timeRange === '1h' ? 3 : timeRange === '6h' ? 15 : timeRange === '24h' ? 60 : 360;
      const d = new Date(now.getTime() - i * stepMins * 60 * 1000);
      const timeStr = timeRange === '1h' || timeRange === '6h' || timeRange === '24h'
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `${d.getMonth() + 1}/${d.getDate()}`;

      // Simulate variance based on device type
      const sinOffset = Math.sin((i / count) * Math.PI * 3);
      const signalDbm = -65 + Math.round(sinOffset * 6 + (Math.random() * 4 - 2));
      const batteryPct = Math.max(70, Math.round(98 - (i * 0.2)));
      const primaryMetric = Math.round((58.5 + sinOffset * 1.8 + (Math.random() * 0.4 - 0.2)) * 10) / 10;

      pts.push({
        time: timeStr,
        signalDbm,
        batteryPct,
        telemetryVal: primaryMetric,
      });
    }
    return pts;
  }, [selectedDevice, timeRange]);

  const handleDeviceAction = (dev: DeviceItem, action: 'ping' | 'burst' | 'clear' | 'restart') => {
    if (action === 'ping') {
      showToast(`Pinged ${dev.name} (${dev.ipAddress || dev.serialNumber}): Roundtrip RTT 12 ms, 0% packet loss.`);
    } else if (action === 'burst') {
      showToast(`Burst telemetry requested from ${dev.id}. Acquired 128 high-speed sensor frames.`);
    } else if (action === 'clear') {
      showToast(`Cleared communication buffer for ${dev.id}. Buffer cleared successfully.`);
    } else {
      showToast(`Sent soft reset command to ${dev.id}. Re-establishing protocol handshake...`);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Toast */}
      {actionNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/50 text-cyan-300 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white tracking-wide">
              Edge Telemetry & Device Monitoring
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              {devices.filter(d => d.status === 'Online').length} ONLINE
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
              DEMO SIMULATED DATA
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Real-time health, RF link quality, signal RSSI, battery voltage, and instantaneous sensor telemetry across all field automation equipment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              showToast('Broadcast poll sent to all 18 edge field transmitters. Telemetry cache refreshed.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Poll All Devices</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by device ID, name, well, or serial..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="All">All Statuses</option>
              <option value="Online">Online</option>
              <option value="Warning">Warning</option>
              <option value="Offline">Offline</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>Protocol:</span>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="All">All Protocols</option>
              <option value="Modbus TCP">Modbus TCP</option>
              <option value="MQTT">MQTT</option>
              <option value="OPC-UA">OPC-UA</option>
              <option value="WirelessHART">WirelessHART</option>
              <option value="HART">HART</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            >
              <option value="All">All Types</option>
              <option value="VFD Inverter">VFD Inverter</option>
              <option value="Downhole Phoenix Gauge">Downhole Phoenix Gauge</option>
              <option value="RTU Gateway">RTU Gateway</option>
              <option value="Coriolis Mass Meter">Coriolis Mass Meter</option>
              <option value="Rod Pump Controller">Rod Pump Controller</option>
              <option value="Surface Acoustic Sensor">Surface Acoustic Sensor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDevices.map(device => {
          const isWarning = device.status === 'Warning';
          const isOffline = device.status === 'Offline';

          return (
            <div
              key={device.id}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                isWarning ? 'border-amber-500/50 hover:border-amber-400' :
                isOffline ? 'border-rose-500/40 hover:border-rose-400' :
                'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-cyan-400 font-bold text-xs">{device.id}</span>
                    <span className="text-slate-500 text-xs">•</span>
                    <span className="text-[10px] text-slate-400 font-mono">{device.protocol}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                    device.status === 'Online' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                    device.status === 'Warning' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                    device.status === 'Offline' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                    'bg-slate-700 text-slate-300 border border-slate-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      device.status === 'Online' ? 'bg-emerald-400' :
                      device.status === 'Warning' ? 'bg-amber-400' : 'bg-rose-400'
                    }`} />
                    {device.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white truncate" title={device.name}>
                  {device.name}
                </h4>
                <div className="text-xs text-slate-400 font-sans mt-0.5">
                  Well: <span className="text-slate-200 font-medium">{device.wellName}</span>
                </div>

                {/* Signal & Firmware Specs */}
                <div className="grid grid-cols-2 gap-2 mt-3 p-2 bg-slate-950 rounded-lg border border-slate-800/80 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Signal className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Signal:</span>
                    <span className="text-slate-200 font-semibold">{device.signalQualityDbm ?? (-65 - (device.latencyMs % 20))} dBm</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Battery:</span>
                    <span className="text-slate-200 font-semibold">{device.batteryPct ?? (device.status === 'Offline' ? 12 : 94)}%</span>
                  </div>
                  <div className="col-span-2 flex items-center justify-between text-slate-400 border-t border-slate-800/60 pt-1.5 mt-0.5">
                    <span>Firmware: <span className="text-slate-300">{device.firmware}</span></span>
                    <span>Modbus ID: <span className="text-slate-300">{device.modbusAddress || ((parseInt(device.id.replace(/\D/g, '') || '1', 10) % 32) + 1)}</span></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons & Drilldown */}
              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1 text-xs">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDeviceAction(device, 'ping')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    title="Send Ping Request"
                  >
                    Ping
                  </button>
                  <button
                    onClick={() => handleDeviceAction(device, 'burst')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    title="Request Telemetry Burst"
                  >
                    Burst
                  </button>
                  <button
                    onClick={() => handleDeviceAction(device, 'clear')}
                    className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
                    title="Clear Buffer"
                  >
                    Clear
                  </button>
                </div>

                <button
                  onClick={() => setSelectedDevice(device)}
                  className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/50 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  <Maximize2 className="w-3 h-3" />
                  <span>Telemetry</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Device Telemetry Drilldown Modal */}
      {selectedDevice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-5 h-5 text-cyan-400" />
                <div>
                  <h3 className="text-base font-bold text-white font-mono">
                    {selectedDevice.id} — {selectedDevice.name}
                  </h3>
                  <div className="text-xs text-slate-400 font-sans">
                    Assigned Well: <span className="text-cyan-300">{selectedDevice.wellName}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedDevice(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Time Selector */}
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Historical Telemetry Stream</span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded border border-slate-800">
                {(['1h', '6h', '24h', '7d'] as const).map(tr => (
                  <button
                    key={tr}
                    onClick={() => setTimeRange(tr)}
                    className={`px-2 py-0.5 rounded transition-colors ${
                      timeRange === tr ? 'bg-cyan-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {tr}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart */}
            <div className="h-60 w-full bg-slate-950 p-2 rounded-lg border border-slate-800">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={deviceHistoryData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="sig" stroke="#38bdf8" tick={{ fontSize: 10 }} domain={[-90, -40]} unit="dBm" />
                  <YAxis yAxisId="val" orientation="right" stroke="#eab308" tick={{ fontSize: 10 }} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line yAxisId="sig" type="monotone" dataKey="signalDbm" name="RF RSSI Signal (dBm)" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  <Line yAxisId="val" type="monotone" dataKey="telemetryVal" name="Telemetry Value" stroke="#eab308" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Diagnostics Stats */}
            <div className="grid grid-cols-3 gap-3 text-xs font-mono">
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">CURRENT RSSI</span>
                <span className="text-white font-bold text-sm">{selectedDevice.signalQualityDbm ?? (-65 - (selectedDevice.latencyMs % 20))} dBm</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">BATTERY STATUS</span>
                <span className="text-emerald-400 font-bold text-sm">{selectedDevice.batteryPct ?? (selectedDevice.status === 'Offline' ? 12 : 94)}% Healthy</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[10px]">LAST HEARTBEAT</span>
                <span className="text-slate-200 text-xs">{selectedDevice.lastHeartbeat ? new Date(selectedDevice.lastHeartbeat).toLocaleTimeString() : 'Recent'}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-500 font-mono">Serial: {selectedDevice.serialNumber}</span>
              <button
                onClick={() => setSelectedDevice(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
