import React, { useState, useEffect, useMemo } from 'react';
import { 
  Radio, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  ShieldCheck, 
  Database, 
  Cpu, 
  Activity, 
  Zap, 
  Gauge, 
  Thermometer, 
  Clock, 
  Filter, 
  SlidersHorizontal, 
  TrendingUp, 
  AlertTriangle, 
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  FastForward,
  Download,
  BellRing,
  Info,
  Check,
  Grid,
  Layers,
  Settings2,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  AreaChart, 
  Area,
  ReferenceArea,
  ReferenceLine
} from 'recharts';
import { ScadaTagItem, TelemetryPoint, WellAsset } from '../../types';
import { ScadaService } from '../../services/scadaService';
import { StorageService } from '../../services/storageService';

// Unified Gauge Component satisfying Section 2.A
interface UnifiedGaugeCardProps {
  id: string;
  title: string;
  shortTag: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  lowLimit: number;
  highLimit: number;
  warningLimit?: number;
  status: 'Nominal' | 'Warning' | 'Critical';
  color: string;
  batteryVolt?: number;
  thresholdLabel: string;
  onInspect?: () => void;
}

const UnifiedGaugeCard: React.FC<UnifiedGaugeCardProps> = ({
  title,
  shortTag,
  value,
  unit,
  min,
  max,
  lowLimit,
  highLimit,
  warningLimit,
  status,
  color,
  batteryVolt = 13.8,
  thresholdLabel,
  onInspect
}) => {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  // Semi-circle circumference: r=40 => C = pi*r ≈ 125.66
  const dashOffset = 125.7 - (pct / 100) * 125.7;

  const statusBadgeClass = 
    status === 'Critical' ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' :
    status === 'Warning' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between relative shadow-lg transition-all group">
      {/* Top Header */}
      <div className="w-full flex items-start justify-between gap-1 border-b border-slate-800/80 pb-2 mb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-bold">
              {shortTag}
            </span>
            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold ${statusBadgeClass}`}>
              {status}
            </span>
          </div>
          <span className="text-xs font-semibold text-slate-200 block truncate mt-1" title={title}>
            {title}
          </span>
        </div>
        {onInspect && (
          <button 
            onClick={onInspect}
            className="p-1 rounded text-slate-500 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            title="Inspect Register"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Circular Gauge Arc */}
      <div className="relative w-full h-24 flex items-center justify-center my-1">
        <svg className="w-40 h-28 -rotate-180" viewBox="0 0 100 58">
          {/* Background Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Active Value Arc */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="125.7"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute top-8 flex flex-col items-center text-center">
          <span className="text-xl font-bold font-mono text-white tracking-tight leading-none">
            {typeof value === 'number' ? (value > 999 ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : value.toFixed(1)) : value}
          </span>
          <span className="text-[11px] font-mono text-cyan-400 font-semibold mt-0.5">{unit}</span>
        </div>
      </div>

      {/* Threshold Indicators & Range Info */}
      <div className="w-full space-y-1.5 pt-1 border-t border-slate-800/80 text-[10px] font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span className="text-slate-500">Span: {min}–{max}</span>
          <span className="text-cyan-300 font-medium truncate max-w-[130px]" title={thresholdLabel}>
            {thresholdLabel}
          </span>
        </div>

        {/* Threshold bar */}
        <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden flex">
          <div style={{ width: `${Math.max(5, (lowLimit / max) * 100)}%` }} className="bg-slate-700 h-full" title={`Low Limit: ${lowLimit}`} />
          <div style={{ width: `${Math.max(10, ((highLimit - lowLimit) / max) * 100)}%` }} className="bg-emerald-500/60 h-full" title="Normal Envelope" />
          <div style={{ width: `${Math.max(5, ((max - highLimit) / max) * 100)}%` }} className="bg-rose-500/80 h-full" title={`High Limit: ${highLimit}`} />
        </div>

        <div className="flex items-center justify-between text-slate-500 pt-0.5">
          <span className="text-[9px]">L: {lowLimit} | H: {highLimit}</span>
          <span className="text-[9px] text-cyan-400/90 flex items-center gap-1 font-mono">
            <Zap className="w-2.5 h-2.5" />
            RTU: {batteryVolt.toFixed(1)}V
          </span>
        </div>
      </div>
    </div>
  );
};

// Mini Sparkline component for Live Grid
const MiniSparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

interface ScadaDashboardViewProps {
  selectedAssetId?: string | null;
  onSelectAssetId?: (assetId: string | null) => void;
}

export const ScadaDashboardView: React.FC<ScadaDashboardViewProps> = ({
  selectedAssetId: controlledAssetId,
  onSelectAssetId,
}) => {
  const [subTab, setSubTab] = useState<'cockpit' | 'pressure-temp' | 'trends' | 'live-grid' | 'quick-view' | 'registers'>('pressure-temp');
  const [tags, setTags] = useState<ScadaTagItem[]>(() => ScadaService.getTags());
  const [selectedWellId, setSelectedWellId] = useState<string>(controlledAssetId || 'ALS-DEL-ESP-104');

  useEffect(() => {
    if (controlledAssetId) {
      setSelectedWellId(controlledAssetId);
    }
  }, [controlledAssetId]);
  const [unitSystem, setUnitSystem] = useState<'imperial' | 'metric'>('imperial');
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d' | '30d' | 'custom'>('24h');
  const [activeTrendCategory, setActiveTrendCategory] = useState<'pressure' | 'temperature' | 'current' | 'frequency' | 'vibration' | 'production' | 'power'>('pressure');
  
  // Trend series visibility toggles
  const [seriesVisibility, setSeriesVisibility] = useState<Record<string, boolean>>({
    intakePressure: true,
    dischargePressure: true,
    tubingPressure: true,
    flowlinePressure: true,
    aAnnulusPressure: true,
    motorTemp: true,
    intakeFluidTemp: true,
    flowlineTemp: true,
    motorCurrent: true,
    frequency: true,
    vibration: true,
    flowRate: true,
    oilRate: true,
    powerKw: true,
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [registerCategoryFilter, setRegisterCategoryFilter] = useState<'All' | 'Pressure' | 'Temperature' | 'Electrical' | 'Hydrodynamic' | 'Vibration'>('All');
  
  // Simulation Controls State (Section 2.E)
  const [isSimRunning, setIsSimRunning] = useState<boolean>(true);
  const [simSpeedMs, setSimSpeedMs] = useState<number>(2500);
  const [simTickCount, setSimTickCount] = useState<number>(142);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  
  const [drillDownTag, setDrillDownTag] = useState<ScadaTagItem | null>(null);
  const [streamingFilter, setStreamingFilter] = useState<'All' | 'Running' | 'Warning' | 'Down' | 'Streaming'>('All');
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const [eventFilter, setEventFilter] = useState<'all' | 'alarms' | 'events'>('all');

  const wells = useMemo(() => StorageService.getWells(), []);
  const selectedWell: WellAsset = useMemo(() => {
    return wells.find(w => w.id === selectedWellId || w.wellCode === selectedWellId) || wells[0];
  }, [wells, selectedWellId]);

  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3500);
  };

  // Telemetry time series for charts
  const telemetryData: TelemetryPoint[] = useMemo(() => {
    const effRange = timeRange === 'custom' ? '24h' : timeRange;
    return ScadaService.generateTelemetrySeries(selectedWell.id, effRange, selectedWell?.vfdFrequencyHz || 58.5);
  }, [selectedWell.id, timeRange, selectedWell]);

  // Simulation loop wired to speed controls (Section 2.E)
  useEffect(() => {
    if (!isSimRunning) return;
    const interval = setInterval(() => {
      setSimTickCount(prev => prev + 1);
      setLastSyncTime(new Date());

      // Update tags with synthetic small fluctuations
      setTags(prev => prev.map(t => {
        if (typeof t.currentValue === 'number') {
          const delta = (Math.random() - 0.49) * 0.35;
          return {
            ...t,
            currentValue: Math.round((t.currentValue + delta) * 10) / 10,
            lastUpdated: new Date().toISOString()
          };
        }
        return t;
      }));
    }, simSpeedMs);
    return () => clearInterval(interval);
  }, [isSimRunning, simSpeedMs]);

  // Filtered tags for active well with all 10 unified parameters guarantee
  const wellTags = useMemo(() => {
    const raw = ScadaService.getTagsForWell(selectedWell.id, selectedWell.name, selectedWell.padName);
    return raw.filter(t => {
      const matchCategory = registerCategoryFilter === 'All' || t.category === registerCategoryFilter;
      const matchSearch = t.tagName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.register.toString().includes(searchTerm) ||
                          t.id.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [selectedWell, registerCategoryFilter, searchTerm]);

  // Latest 10 SCADA Events & Alarms (Section 2.D)
  const scadaEvents = useMemo(() => {
    const list = ScadaService.getLatestScadaEvents();
    if (eventFilter === 'alarms') return list.filter(e => e.type === 'alarm');
    if (eventFilter === 'events') return list.filter(e => e.type === 'event');
    return list;
  }, [eventFilter]);

  // Simulation controls actions
  const handleResetSimulation = () => {
    ScadaService.resetTags();
    setTags(ScadaService.getTags());
    setSimTickCount(0);
    showToast('Simulation reset: baseline nominal tags restored.');
  };

  const handleStepSimulation = () => {
    setSimTickCount(prev => prev + 1);
    setLastSyncTime(new Date());
    showToast('Advanced simulation by +1 cycle.');
  };

  const toggleSeries = (key: string) => {
    setSeriesVisibility(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExportCSV = () => {
    const headers = ['TagID', 'Register', 'TagName', 'Description', 'Category', 'DataType', 'Value', 'Unit', 'LowLimit', 'HighLimit', 'Quality', 'LastUpdated'];
    const rows = wellTags.map(t => [
      t.id,
      t.register,
      `"${t.tagName}"`,
      `"${t.description}"`,
      t.category,
      t.dataType,
      t.currentValue,
      t.unit,
      t.lowLimit || '',
      t.highLimit || '',
      t.quality,
      t.lastUpdated,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCADA_Registers_${selectedWell?.wellCode || selectedWell?.id}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Exported SCADA registers to CSV.');
  };

  // Convert pressure/temp values depending on active unit system
  const isMetric = unitSystem === 'metric';
  const pUnit = isMetric ? 'kg/cm²' : 'psi';
  const tUnit = isMetric ? '°C' : '°F';
  const pConv = (psi: number) => isMetric ? Math.round(psi * 0.070307 * 10) / 10 : Math.round(psi);
  const tConv = (f: number) => isMetric ? Math.round(((f - 32) * 5/9) * 10) / 10 : Math.round(f * 10) / 10;

  // 10 Unified Gauges Data for Section 2.A
  const unifiedGaugesData: UnifiedGaugeCardProps[] = [
    {
      id: 'thp',
      title: 'Tubing Head Pressure (THP)',
      shortTag: 'THP',
      value: pConv(selectedWell.tubingPressureKgCm2 ? selectedWell.tubingPressureKgCm2 * 14.22 : 245),
      unit: pUnit,
      min: 0,
      max: pConv(600),
      lowLimit: pConv(60),
      highLimit: pConv(450),
      status: 'Nominal',
      color: '#ec4899', // Pink
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Nominal 17-25 kg/cm²' : 'Nominal 200-350 psi',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('THP') || t.tagName.includes('TUBING')) || wellTags[0])
    },
    {
      id: 'flowline-p',
      title: 'Flowline Pressure',
      shortTag: 'FLP',
      value: pConv(selectedWell.flowlinePressureKgCm2 ? selectedWell.flowlinePressureKgCm2 * 14.22 : 115.6),
      unit: pUnit,
      min: 0,
      max: pConv(300),
      lowLimit: pConv(25),
      highLimit: pConv(220),
      status: 'Nominal',
      color: '#06b6d4', // Cyan
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Header Limit 15 kg/cm²' : 'Header Limit 220 psi',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('FLOWLINE_PRESS')) || wellTags[0])
    },
    {
      id: 'a-annulus',
      title: 'A-Annulus Casing Pressure',
      shortTag: 'ANN-A',
      value: pConv(selectedWell.aAnnulusPressureKgCm2 ? selectedWell.aAnnulusPressureKgCm2 * 14.22 : 714.2),
      unit: pUnit,
      min: 0,
      max: pConv(1200),
      lowLimit: pConv(100),
      highLimit: pConv(950),
      status: selectedWell.status === 'Warning' ? 'Warning' : 'Nominal',
      color: '#3b82f6', // Blue
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Target 45-65 kg/cm²' : 'Target 650-850 psi',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('A_ANNULUS')) || wellTags[0])
    },
    {
      id: 'b-annulus',
      title: 'B-Annulus Intermediate Pressure',
      shortTag: 'ANN-B',
      value: pConv(selectedWell.bAnnulusPressureKgCm2 ? selectedWell.bAnnulusPressureKgCm2 * 14.22 : 0),
      unit: pUnit,
      min: 0,
      max: pConv(250),
      lowLimit: 0,
      highLimit: pConv(150),
      status: 'Nominal',
      color: '#8b5cf6', // Violet
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: 'Integrity Seal: 0 psi',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('B_ANNULUS')) || wellTags[0])
    },
    {
      id: 'pip',
      title: 'Pump Intake Pressure (PIP)',
      shortTag: 'PIP',
      value: pConv(selectedWell.intakePressurePsi || 840),
      unit: pUnit,
      min: 0,
      max: pConv(1600),
      lowLimit: pConv(450),
      highLimit: pConv(1250),
      status: (selectedWell.intakePressurePsi || 840) < 550 ? 'Warning' : 'Nominal',
      color: '#10b981', // Emerald
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Drawdown Min 35 kg/cm²' : 'Drawdown Min 500 psi',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('INTAKE_PRESS') || t.tagName.includes('PIP')) || wellTags[0])
    },
    {
      id: 'pdp',
      title: 'Pump Discharge Pressure (PDP)',
      shortTag: 'PDP',
      value: pConv(selectedWell.dischargePressurePsi || 2950),
      unit: pUnit,
      min: 0,
      max: pConv(4000),
      lowLimit: pConv(1800),
      highLimit: pConv(3600),
      status: 'Nominal',
      color: '#a855f7', // Purple
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Manifold Head 200 kg/cm²' : 'Manifold Head 2950 psi',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('DISCHARGE') || t.tagName.includes('PDP')) || wellTags[0])
    },
    {
      id: 'motor-temp',
      title: 'Motor Stator Temperature',
      shortTag: 'M-TEMP',
      value: tConv(selectedWell.motorTempF || 198.4),
      unit: tUnit,
      min: tConv(80),
      max: tConv(300),
      lowLimit: tConv(100),
      highLimit: tConv(240),
      status: (selectedWell.motorTempF || 198) > 230 ? 'Warning' : 'Nominal',
      color: '#f43f5e', // Rose
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Class H Limit 115°C' : 'Class H Limit 240°F',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('MOTOR_TEMP')) || wellTags[0])
    },
    {
      id: 'intake-fluid-temp',
      title: 'Intake Fluid Temperature',
      shortTag: 'FLUID-IN',
      value: tConv(142.8),
      unit: tUnit,
      min: tConv(60),
      max: tConv(220),
      lowLimit: tConv(80),
      highLimit: tConv(190),
      status: 'Nominal',
      color: '#f59e0b', // Amber
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Downhole Suction 61°C' : 'Downhole Suction 142°F',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('INTAKE_FLUID_TEMP')) || wellTags[0])
    },
    {
      id: 'flowline-temp',
      title: 'Flowline Surface Temperature',
      shortTag: 'FL-TEMP',
      value: tConv(selectedWell.wellheadTempF || 113.8),
      unit: tUnit,
      min: tConv(40),
      max: tConv(180),
      lowLimit: tConv(50),
      highLimit: tConv(150),
      status: 'Nominal',
      color: '#14b8a6', // Teal
      batteryVolt: selectedWell.batteryVoltage || 13.8,
      thresholdLabel: isMetric ? 'Surface Ambient 45°C' : 'Surface Line 114°F',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('FLOWLINE_TEMP')) || wellTags[0])
    },
    {
      id: 'rtu-battery',
      title: 'RTU Battery & Solar Voltage',
      shortTag: 'RTU-BAT',
      value: selectedWell.batteryVoltage ? Math.round(selectedWell.batteryVoltage * 3.73 * 10) / 10 : 13.8,
      unit: 'V DC',
      min: 10.0,
      max: 16.0,
      lowLimit: 11.8,
      highLimit: 14.8,
      status: 'Nominal',
      color: '#eab308', // Yellow
      batteryVolt: 13.8,
      thresholdLabel: 'Float Charge 13.8V',
      onInspect: () => setDrillDownTag(wellTags.find(t => t.tagName.includes('BATTERY')) || wellTags[0])
    },
  ];

  // Daily production trend data matching Slide 22
  const dailyProductionSeries = [
    { month: 'Apr 26', bfpd: 6800, bopd: 2800, waterCut: 58.8 },
    { month: 'May 26', bfpd: 8200, bopd: 3300, waterCut: 59.7 },
    { month: 'Jun 26', bfpd: 10400, bopd: 4100, waterCut: 60.5 },
    { month: 'Jul 26', bfpd: 9600, bopd: 3800, waterCut: 60.4 },
    { month: 'Aug 26', bfpd: 11200, bopd: 4400, waterCut: 60.7 },
    { month: 'Sep 26', bfpd: 10800, bopd: 4250, waterCut: 60.6 },
    { month: 'Oct 26', bfpd: 12430, bopd: 5432, waterCut: 56.3 },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-5 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toastNotice && (
        <div className="fixed top-20 right-6 z-50 bg-slate-900 border border-cyan-500/60 text-cyan-200 px-4 py-2.5 rounded-lg text-xs shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-mono">{toastNotice}</span>
        </div>
      )}

      {/* TOP INDUSTRIAL SIMULATION & TELEMETRY CONTROLS BAR (Section 2.E) */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white tracking-wide font-mono">
                  SCADA Surveillance &amp; Telemetry
                </h2>
              </div>
              
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold flex items-center gap-1.5 ${
                isSimRunning 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isSimRunning ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
                {isSimRunning ? 'TELEMETRY STREAMING' : 'STREAM PAUSED'}
              </span>

              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                Tick #{simTickCount}
              </span>
            </div>
            
            <p className="text-xs text-slate-400 mt-1">
              DEMO SIMULATED DATA — Telemetry is synthetic and not connected to physical equipment.
            </p>
          </div>

          {/* Controls Bar Right: Simulation Buttons & Rate Selector */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Target Well Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-slate-500 font-mono">Asset:</span>
              <select
                value={selectedWell.id}
                onChange={(e) => {
                  setSelectedWellId(e.target.value);
                  showToast(`Switched active well to ${e.target.value}`);
                }}
                className="bg-transparent text-cyan-300 font-mono text-xs font-semibold focus:outline-none cursor-pointer max-w-[190px] truncate"
              >
                {wells.map(w => (
                  <option key={w.id} value={w.id} className="bg-slate-900 text-white">
                    {w.wellCode || w.id} — {w.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rate Intervals */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1 text-xs font-mono">
              <span className="text-slate-500 text-[10px] px-1">Rate:</span>
              {[
                { label: '1x (5s)', ms: 5000 },
                { label: '2x (2.5s)', ms: 2500 },
                { label: '5x (1s)', ms: 1000 },
                { label: '10x (0.5s)', ms: 500 },
              ].map(opt => (
                <button
                  key={opt.ms}
                  onClick={() => {
                    setSimSpeedMs(opt.ms);
                    showToast(`Simulation rate set to ${opt.label}`);
                  }}
                  className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                    simSpeedMs === opt.ms 
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Pause / Resume Button */}
            <button
              onClick={() => {
                setIsSimRunning(!isSimRunning);
                showToast(isSimRunning ? 'Telemetry paused.' : 'Telemetry streaming resumed.');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-colors ${
                isSimRunning 
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/50 hover:bg-emerald-900/40' 
                  : 'bg-amber-950/40 text-amber-300 border-amber-600/50 hover:bg-amber-900/40'
              }`}
            >
              {isSimRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Resume</span>
                </>
              )}
            </button>

            {/* Step Forward 1 Tick */}
            <button
              onClick={handleStepSimulation}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Step Forward +1 Simulation Cycle"
            >
              <FastForward className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Reset Simulation */}
            <button
              onClick={handleResetSimulation}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Reset Simulation to Baselines"
            >
              <RotateCcw className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </div>

      {/* PRIMARY SCADA SUBTABS (Sections 2.A, 2.B, 2.C, 2.D) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubTab('pressure-temp')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'pressure-temp' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>Pressure &amp; Temperature Gauges (10 Tags)</span>
          </button>

          <button
            onClick={() => setSubTab('trends')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'trends' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Multi-Parameter Trends (7 Parameters)</span>
          </button>

          <button
            onClick={() => setSubTab('live-grid')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'live-grid' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Live Status Grid</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">20 Wells</span>
          </button>

          <button
            onClick={() => setSubTab('quick-view')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'quick-view' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Real Time Quick View (Sparklines)</span>
          </button>

          <button
            onClick={() => setSubTab('registers')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'registers' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>SCADA Register &amp; Event Log</span>
          </button>

          <button
            onClick={() => setSubTab('cockpit')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all ${
              subTab === 'cockpit' ? 'bg-cyan-500 text-slate-950 shadow-md font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Production Overview</span>
          </button>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Registers</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2.A: PRESSURE & TEMPERATURE GAUGE PANEL (10 Unified Gauges)      */}
      {/* ========================================================================= */}
      {subTab === 'pressure-temp' && (
        <div className="space-y-5">
          {/* Header Controls for Section 2.A */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Unified Pressure &amp; Temperature Instrumentation Panel
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Calibrated RTU circular telemetry gauges for <span className="text-cyan-300 font-semibold">{selectedWell.wellCode || selectedWell.id}</span> ({selectedWell.name}). Threshold indicators and operating bands verified.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Unit System Toggle (Imperial psi/°F vs Metric kg/cm²/°C) */}
              <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg text-xs font-mono">
                <button
                  onClick={() => {
                    setUnitSystem('imperial');
                    showToast('Switched to Imperial units (psi, °F).');
                  }}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    unitSystem === 'imperial' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Imperial (psi, °F)
                </button>
                <button
                  onClick={() => {
                    setUnitSystem('metric');
                    showToast('Switched to Metric units (kg/cm², °C).');
                  }}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    unitSystem === 'metric' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Metric (kg/cm², °C)
                </button>
              </div>

              {/* Freshness Badge */}
              <div className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800 px-3 py-1 rounded-lg flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Synced: {lastSyncTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* 10 Unified Gauge Cards Grid (Section 2.A) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {unifiedGaugesData.map(g => (
              <UnifiedGaugeCard key={g.id} {...g} />
            ))}
          </div>

          {/* High-Resolution Parameter Trends (Last 1 Hour) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  High-Resolution Telemetry Response (1-Hour Window)
                </h4>
                <p className="text-xs text-slate-400">
                  Real-time 5-minute sampling correlation across tubing, annulus, flowline, and downhole Phoenix sensors.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-pink-400">THP: {unifiedGaugesData[0].value} {pUnit}</span>
                <span className="text-cyan-400">Flowline: {unifiedGaugesData[1].value} {pUnit}</span>
                <span className="text-blue-400">Annulus A: {unifiedGaugesData[2].value} {pUnit}</span>
                <span className="text-emerald-400">PIP: {unifiedGaugesData[4].value} {pUnit}</span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={telemetryData.slice(-12)} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="tubingPressure" name={`THP (${pUnit})`} stroke="#ec4899" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="flowlinePressure" name={`Flowline P (${pUnit})`} stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="aAnnulusPressure" name={`A-Annulus (${pUnit})`} stroke="#3b82f6" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="intakePressure" name={`PIP Intake (${pUnit})`} stroke="#10b981" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="motorTemp" name={`Motor Temp (${tUnit})`} stroke="#f43f5e" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2.B: MULTI-PARAMETER TREND CHARTS (7 Trend Families)              */}
      {/* ========================================================================= */}
      {subTab === 'trends' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Multi-Parameter Historical Trends — {selectedWell.wellCode || selectedWell.id}
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Interactive telemetry trends with selectable series, operating envelope bands, and customizable time windows.
              </p>
            </div>

            {/* Time Ranges: 24h, 7d, 30d, custom + 1h, 6h */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <span className="text-slate-500 text-[10px] px-1">Window:</span>
              {(['1h', '6h', '24h', '7d', '30d', 'custom'] as const).map(tr => (
                <button
                  key={tr}
                  onClick={() => {
                    setTimeRange(tr);
                    showToast(`Updated trend window to ${tr}.`);
                  }}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    timeRange === tr ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tr.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* 7 Parameter Categories Switcher */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'pressure', label: '1. Pressure vs Time (PIP / PDP / THP / Flowline)', icon: Gauge },
              { id: 'temperature', label: '2. Temperature vs Time (Motor & Fluid)', icon: Thermometer },
              { id: 'current', label: '3. Motor Current vs Time (Amps RMS)', icon: Zap },
              { id: 'frequency', label: '4. VFD Frequency vs Time (Hz)', icon: Activity },
              { id: 'vibration', label: '5. Vibration vs Time (g RMS)', icon: SlidersHorizontal },
              { id: 'production', label: '6. Production Rate vs Time (BFPD / BOPD)', icon: CheckCircle2 },
              { id: 'power', label: '7. Power Consumption vs Time (kW)', icon: Cpu },
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = activeTrendCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveTrendCategory(cat.id as any)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all ${
                    isActive 
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/60 shadow-lg shadow-cyan-950/40 font-semibold' 
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main Chart Card with Threshold Bands & Series Selectors */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            {/* Series Toggles Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-500 text-[11px]">Select Traces:</span>
                
                {activeTrendCategory === 'pressure' && (
                  <>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-purple-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.dischargePressure} onChange={() => toggleSeries('dischargePressure')} className="rounded" />
                      <span>PDP Discharge</span>
                    </label>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.intakePressure} onChange={() => toggleSeries('intakePressure')} className="rounded" />
                      <span>PIP Intake</span>
                    </label>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-pink-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.tubingPressure} onChange={() => toggleSeries('tubingPressure')} className="rounded" />
                      <span>THP Tubing</span>
                    </label>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.flowlinePressure} onChange={() => toggleSeries('flowlinePressure')} className="rounded" />
                      <span>Flowline</span>
                    </label>
                  </>
                )}

                {activeTrendCategory === 'temperature' && (
                  <>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-rose-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.motorTemp} onChange={() => toggleSeries('motorTemp')} className="rounded" />
                      <span>Motor Stator Temp</span>
                    </label>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-amber-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.intakeFluidTemp} onChange={() => toggleSeries('intakeFluidTemp')} className="rounded" />
                      <span>Intake Fluid Temp</span>
                    </label>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-teal-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.flowlineTemp} onChange={() => toggleSeries('flowlineTemp')} className="rounded" />
                      <span>Flowline Temp</span>
                    </label>
                  </>
                )}

                {activeTrendCategory === 'production' && (
                  <>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.flowRate} onChange={() => toggleSeries('flowRate')} className="rounded" />
                      <span>Gross Liquid (BFPD)</span>
                    </label>
                    <label className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-emerald-400 cursor-pointer">
                      <input type="checkbox" checked={seriesVisibility.oilRate} onChange={() => toggleSeries('oilRate')} className="rounded" />
                      <span>Net Oil (BOPD)</span>
                    </label>
                  </>
                )}
              </div>

              {/* Threshold band legend */}
              <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-2 bg-emerald-500/20 border border-emerald-500/40 rounded-xs" />
                  <span>Safe Operating Envelope</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-rose-500" />
                  <span>Trip Threshold</span>
                </span>
              </div>
            </div>

            {/* Dynamic Recharts Multi-Trend Container */}
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {activeTrendCategory === 'pressure' ? (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" psi" domain={[0, 3600]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    {/* Safe Operating Envelope for Intake Pressure */}
                    <ReferenceArea y1={600} y2={1200} fill="#10b981" fillOpacity={0.06} />
                    <ReferenceLine y={3200} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'PDP High Trip (3200 psi)', fill: '#f43f5e', fontSize: 10 }} />
                    {seriesVisibility.dischargePressure && <Line type="monotone" dataKey="dischargePressure" name="PDP Discharge (psi)" stroke="#a855f7" strokeWidth={2.5} dot={false} />}
                    {seriesVisibility.intakePressure && <Line type="monotone" dataKey="intakePressure" name="PIP Intake (psi)" stroke="#10b981" strokeWidth={2.5} dot={false} />}
                    {seriesVisibility.tubingPressure && <Line type="monotone" dataKey="tubingPressure" name="THP Tubing (psi)" stroke="#ec4899" strokeWidth={2} dot={false} />}
                    {seriesVisibility.flowlinePressure && <Line type="monotone" dataKey="flowlinePressure" name="Flowline (psi)" stroke="#06b6d4" strokeWidth={2} dot={false} />}
                  </LineChart>
                ) : activeTrendCategory === 'temperature' ? (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" °F" domain={[60, 270]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    <ReferenceArea y1={120} y2={220} fill="#10b981" fillOpacity={0.06} />
                    <ReferenceLine y={240} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Motor High Alarm (240°F)', fill: '#f43f5e', fontSize: 10 }} />
                    {seriesVisibility.motorTemp && <Line type="monotone" dataKey="motorTemp" name="Motor Stator Temp (°F)" stroke="#f43f5e" strokeWidth={2.5} dot={false} />}
                    {seriesVisibility.intakeFluidTemp && <Line type="monotone" dataKey="intakeFluidTemp" name="Intake Fluid Temp (°F)" stroke="#f59e0b" strokeWidth={2} dot={false} />}
                    {seriesVisibility.flowlineTemp && <Line type="monotone" dataKey="flowlineTemp" name="Surface Flowline Temp (°F)" stroke="#14b8a6" strokeWidth={2} dot={false} />}
                  </LineChart>
                ) : activeTrendCategory === 'current' ? (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#fbbf24" tick={{ fontSize: 11 }} unit=" A" domain={[20, 80]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    <ReferenceArea y1={40} y2={60} fill="#10b981" fillOpacity={0.06} />
                    <ReferenceLine y={65} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'Max Overcurrent Trip (65 A)', fill: '#f43f5e', fontSize: 10 }} />
                    <Line type="monotone" dataKey="motorCurrent" name="Phase Current RMS (Amps)" stroke="#fbbf24" strokeWidth={2.5} dot={false} />
                  </LineChart>
                ) : activeTrendCategory === 'frequency' ? (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#06b6d4" tick={{ fontSize: 11 }} unit=" Hz" domain={[35, 70]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    <ReferenceArea y1={45} y2={62} fill="#06b6d4" fillOpacity={0.05} />
                    <Line type="monotone" dataKey="frequency" name="VFD Operating Frequency (Hz)" stroke="#06b6d4" strokeWidth={2.5} dot={false} />
                  </LineChart>
                ) : activeTrendCategory === 'vibration' ? (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#eab308" tick={{ fontSize: 11 }} unit=" g" domain={[0, 1.0]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    <ReferenceArea y1={0.1} y2={0.45} fill="#10b981" fillOpacity={0.06} />
                    <ReferenceLine y={0.50} stroke="#eab308" strokeDasharray="2 2" label={{ value: 'Warning Limit (0.50 g)', fill: '#eab308', fontSize: 10 }} />
                    <ReferenceLine y={0.80} stroke="#f43f5e" strokeDasharray="3 3" label={{ value: 'High Vibration Trip (0.80 g)', fill: '#f43f5e', fontSize: 10 }} />
                    <Line type="monotone" dataKey="vibration" name="Triaxial Vibration (g RMS)" stroke="#eab308" strokeWidth={2.5} dot={false} />
                  </LineChart>
                ) : activeTrendCategory === 'production' ? (
                  <AreaChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bfpdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="bopdGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 11 }} unit=" BPD" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    {seriesVisibility.flowRate && <Area type="monotone" dataKey="flowRate" name="Gross Liquid Rate (BFPD)" stroke="#06b6d4" fill="url(#bfpdGrad)" strokeWidth={2} />}
                    {seriesVisibility.oilRate && <Area type="monotone" dataKey="oilRate" name="Net Oil Rate (BOPD)" stroke="#10b981" fill="url(#bopdGrad)" strokeWidth={2} />}
                  </AreaChart>
                ) : (
                  <LineChart data={telemetryData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#38bdf8" tick={{ fontSize: 11 }} unit=" kW" domain={[50, 300]} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="powerKw" name="VFD Surface Active Power (kW)" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2.C: LIVE STATUS GRID (20 Monitored Units)                        */}
      {/* ========================================================================= */}
      {subTab === 'live-grid' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <span>ESP Well Live Status Grid</span>
                  <span className="px-2 py-0.5 rounded text-[11px] bg-emerald-500/20 text-emerald-300 font-mono">
                    20 Monitored Units
                  </span>
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Field-wide telemetry surveillance matrix with status badges, streaming age, current, frequency, PIP, motor temp, and live sparklines.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['All', 'Running', 'Warning', 'Down'] as const).map(filter => (
                <button
                  key={filter}
                  onClick={() => setStreamingFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-colors ${
                    streamingFilter === filter 
                      ? 'bg-cyan-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {filter} {filter === 'All' ? '(20)' : filter === 'Running' ? '(18)' : filter === 'Warning' ? '(2)' : '(0)'}
                </button>
              ))}
            </div>
          </div>

          {/* 20-Well Live Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {wells.slice(0, 20).filter(w => {
              if (streamingFilter === 'Running') return w.status === 'Nominal';
              if (streamingFilter === 'Warning') return w.status === 'Warning';
              if (streamingFilter === 'Down') return w.status === 'Critical' || w.status === 'Offline';
              return true;
            }).map((well, idx) => {
              const isSelected = selectedWell.id === well.id;
              const wellCode = well.wellCode || `DEMO-WELL-${String(idx + 1).padStart(3, '0')}`;
              const isWarning = well.status === 'Warning';
              const isDown = well.status === 'Critical' || well.status === 'Offline';
              
              // Sparkline telemetry simulation points for this card
              const sparkPoints = [
                well.intakePressurePsi - 12,
                well.intakePressurePsi - 6,
                well.intakePressurePsi + 4,
                well.intakePressurePsi + 10,
                well.intakePressurePsi + 2,
                well.intakePressurePsi - 5,
                well.intakePressurePsi
              ];

              return (
                <div
                  key={well.id}
                  onClick={() => {
                    setSelectedWellId(well.id);
                    showToast(`Selected well ${wellCode} (${well.name}).`);
                  }}
                  className={`p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between relative space-y-3 ${
                    isSelected 
                      ? 'ring-2 ring-cyan-400 border-cyan-400 bg-slate-900 shadow-xl shadow-cyan-950/50' 
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  {/* Top: Short Name & Status Badge */}
                  <div className="flex items-start justify-between border-b border-slate-800/80 pb-2">
                    <div>
                      <span className="text-sm font-extrabold font-mono text-cyan-300 block tracking-wide">
                        {wellCode}
                      </span>
                      <span className="text-[11px] text-slate-300 truncate block mt-0.5 max-w-[125px]" title={well.name}>
                        {well.name}
                      </span>
                    </div>

                    <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                      isDown ? 'bg-rose-950/80 text-rose-300 border-rose-800' :
                      isWarning ? 'bg-amber-950/80 text-amber-300 border-amber-800' :
                      'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    }`}>
                      {isDown ? 'Down' : isWarning ? 'Warning' : 'Running'}
                    </span>
                  </div>

                  {/* Streaming indicator & Age */}
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Streaming
                    </span>
                    <span className="text-slate-500">Age: {well.streamingAge || '1m 15s'}</span>
                  </div>

                  {/* Key Metrics: Current, Frequency, PIP, Motor Temp */}
                  <div className="grid grid-cols-2 gap-1.5 bg-slate-950/90 p-2 rounded-lg border border-slate-800 text-[10px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Freq:</span>
                      <span className="text-cyan-400 font-bold">{well.vfdFrequencyHz} Hz</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amps:</span>
                      <span className="text-amber-400 font-bold">{well.motorCurrentA} A</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">PIP:</span>
                      <span className="text-emerald-400 font-bold">{well.intakePressurePsi} psi</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">M-Temp:</span>
                      <span className={`${(well.motorTempF || 198) > 225 ? 'text-rose-400' : 'text-slate-300'} font-bold`}>
                        {well.motorTempF}°F
                      </span>
                    </div>
                  </div>

                  {/* Sparkline & View Button */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono text-slate-500">PIP Trend</span>
                      <MiniSparkline data={sparkPoints} color={isWarning ? '#f59e0b' : '#10b981'} />
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400" />
                  </div>

                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2.C (Part 2): REAL-TIME QUICK VIEW COMPARISON MATRIX              */}
      {/* ========================================================================= */}
      {subTab === 'quick-view' && (
        <div className="space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Synchronized Multi-Well Comparison Matrix
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Side-by-side synchronized 5-trace sparkline tiles: Frequency (Hz), Motor Current (A), PIP (psi), Motor Temp (°F), and Fluid Temp (°F).
              </p>
            </div>

            <button
              onClick={() => showToast('Synchronized time traces across all 20 wellhead controllers.')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-mono font-semibold border border-slate-700 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync All Traces</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {wells.slice(0, 10).map((well, idx) => {
              const wellCode = well.wellCode || `DEMO-WELL-${String(idx + 1).padStart(3, '0')}`;
              const sparkData = [
                { t: '08:00', freq: well.vfdFrequencyHz - 2, current: well.motorCurrentA - 4, pip: well.intakePressurePsi - 25, motorTemp: well.motorTempF - 5 },
                { t: '10:00', freq: well.vfdFrequencyHz, current: well.motorCurrentA, pip: well.intakePressurePsi, motorTemp: well.motorTempF },
                { t: '12:00', freq: well.vfdFrequencyHz, current: well.motorCurrentA + 1, pip: well.intakePressurePsi - 10, motorTemp: well.motorTempF + 2 },
                { t: '14:00', freq: well.vfdFrequencyHz, current: well.motorCurrentA - 0.5, pip: well.intakePressurePsi + 5, motorTemp: well.motorTempF + 1 },
                { t: '16:00', freq: well.vfdFrequencyHz + 0.5, current: well.motorCurrentA + 1.2, pip: well.intakePressurePsi - 8, motorTemp: well.motorTempF + 3 },
                { t: '18:00', freq: well.vfdFrequencyHz, current: well.motorCurrentA, pip: well.intakePressurePsi, motorTemp: well.motorTempF },
              ];

              return (
                <div
                  key={well.id}
                  onClick={() => {
                    setSelectedWellId(well.id);
                    setSubTab('pressure-temp');
                    showToast(`Opened telemetry cockpit for ${wellCode}.`);
                  }}
                  className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 transition-all cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold font-mono text-cyan-300">{wellCode}</span>
                      <span className="text-xs text-slate-400 font-sans">{well.name}</span>
                    </div>
                    <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                      Streaming (30s)
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1 text-[10px] font-mono text-center bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-500 block">Freq (Hz)</span>
                      <span className="text-cyan-400 font-bold">{well.vfdFrequencyHz}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Amps (A)</span>
                      <span className="text-amber-400 font-bold">{well.motorCurrentA}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">PIP (psi)</span>
                      <span className="text-emerald-400 font-bold">{well.intakePressurePsi}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">M-Temp (°F)</span>
                      <span className="text-rose-400 font-bold">{well.motorTempF}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">FL-Temp (°F)</span>
                      <span className="text-teal-400 font-bold">{well.wellheadTempF}</span>
                    </div>
                  </div>

                  <div className="h-28 w-full bg-slate-950/60 rounded p-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparkData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                        <XAxis dataKey="t" stroke="#475569" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#475569" tick={{ fontSize: 9 }} />
                        <Line type="monotone" dataKey="freq" stroke="#06b6d4" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="current" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="pip" stroke="#10b981" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="motorTemp" stroke="#f43f5e" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2.D: SCADA TAG REGISTER & EVENT LOG                               */}
      {/* ========================================================================= */}
      {subTab === 'registers' && (
        <div className="space-y-6">
          {/* TAG REGISTER TABLE */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>SCADA Tag Register for {selectedWell.wellCode || selectedWell.id}</span>
                  <span className="text-xs text-slate-400 font-normal">({wellTags.length} mapped registers)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Modbus TCP / RTU registers with engineering units, low/high threshold limits, communication quality, and actions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Category filter */}
                <select
                  value={registerCategoryFilter}
                  onChange={(e) => setRegisterCategoryFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-xs font-mono text-cyan-300 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="All">All Categories</option>
                  <option value="Pressure">Pressure</option>
                  <option value="Temperature">Temperature</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Vibration">Vibration</option>
                </select>

                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search Tag ID or Register..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Tag ID</th>
                    <th className="px-3 py-2.5">Register</th>
                    <th className="px-3 py-2.5">Parameter / Tag Name</th>
                    <th className="px-3 py-2.5">Description</th>
                    <th className="px-3 py-2.5 text-right">Engineering Value</th>
                    <th className="px-3 py-2.5 text-center">Low / High Limits</th>
                    <th className="px-3 py-2.5 text-center">Quality / Status</th>
                    <th className="px-3 py-2.5 text-center">Timestamp</th>
                    <th className="px-3 py-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {wellTags.map((tag) => (
                    <tr key={tag.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-3 py-2 text-cyan-400 font-bold">{tag.id}</td>
                      <td className="px-3 py-2 font-mono text-slate-300">{tag.register}</td>
                      <td className="px-3 py-2 text-white font-medium">{tag.tagName}</td>
                      <td className="px-3 py-2 text-slate-400 truncate max-w-[200px]" title={tag.description}>
                        {tag.description}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-white">
                        {typeof tag.currentValue === 'number' ? tag.currentValue.toFixed(1) : tag.currentValue} {tag.unit}
                      </td>
                      <td className="px-3 py-2 text-center text-slate-400 text-[11px]">
                        {tag.lowLimit !== undefined && tag.highLimit !== undefined ? (
                          <span>{tag.lowLimit} — {tag.highLimit} {tag.unit}</span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tag.quality === 'GOOD' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          tag.quality === 'FAIR' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                          'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}>
                          {tag.quality}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center text-[10px] text-slate-400">
                        {tag.lastUpdated ? new Date(tag.lastUpdated).toLocaleTimeString() : '08:00:00'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => showToast(`Acknowledged register ${tag.tagName}.`)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-300 text-[10px] font-mono border border-slate-700 transition-colors"
                            title="Acknowledge Tag"
                          >
                            Ack
                          </button>
                          <button
                            onClick={() => setDrillDownTag(tag)}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-cyan-950/60 text-slate-300 hover:text-cyan-300 text-[10px] font-mono border border-slate-700 transition-colors inline-flex items-center gap-1"
                            title="Configure / Inspect Tag"
                          >
                            <Settings2 className="w-3 h-3 text-cyan-400" />
                            <span>Config</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DEDICATED SCADA EVENT LOG (Latest 10 Synthetic Alarms & Events - Section 2.D) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Latest SCADA Alarms &amp; Operational Events (10 Entries)
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Alarms are clearly distinguished from informational events with threshold violations and acknowledge actions.
                </p>
              </div>

              {/* Event Filter Toggle */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setEventFilter('all')}
                  className={`px-2.5 py-1 rounded transition-colors ${
                    eventFilter === 'all' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({scadaEvents.length})
                </button>
                <button
                  onClick={() => setEventFilter('alarms')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    eventFilter === 'alarms' ? 'bg-rose-600 text-white font-bold' : 'text-rose-400 hover:text-white'
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  <span>Alarms Only</span>
                </button>
                <button
                  onClick={() => setEventFilter('events')}
                  className={`px-2.5 py-1 rounded flex items-center gap-1 transition-colors ${
                    eventFilter === 'events' ? 'bg-blue-600 text-white font-bold' : 'text-blue-400 hover:text-white'
                  }`}
                >
                  <Info className="w-3 h-3" />
                  <span>Info Events</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-lg">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/90 text-slate-400 border-b border-slate-800 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Severity</th>
                    <th className="px-3 py-2.5">Asset / Source</th>
                    <th className="px-3 py-2.5">Tag / Parameter</th>
                    <th className="px-3 py-2.5">Event Description</th>
                    <th className="px-3 py-2.5 text-right">Value / Limit</th>
                    <th className="px-3 py-2.5 text-center">Timestamp</th>
                    <th className="px-3 py-2.5 text-center">Status / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-200">
                  {scadaEvents.map((evt) => {
                    const isAlarm = evt.type === 'alarm';
                    return (
                      <tr 
                        key={evt.id} 
                        className={`transition-colors ${
                          isAlarm ? 'bg-rose-950/15 hover:bg-rose-950/25' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isAlarm 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          }`}>
                            {isAlarm ? <AlertTriangle className="w-2.5 h-2.5" /> : <Info className="w-2.5 h-2.5" />}
                            {isAlarm ? 'ALARM' : 'EVENT'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-bold">
                          <span className={`${
                            evt.severity === 'Critical' ? 'text-rose-400 font-extrabold' :
                            evt.severity === 'High' ? 'text-amber-400' :
                            evt.severity === 'Warning' ? 'text-amber-300' :
                            'text-cyan-400'
                          }`}>
                            {evt.severity}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-white font-medium">{evt.wellName}</td>
                        <td className="px-3 py-2.5 text-cyan-300 font-mono text-[11px]">{evt.tagOrParam}</td>
                        <td className="px-3 py-2.5 text-slate-300 font-sans text-xs">{evt.description}</td>
                        <td className="px-3 py-2.5 text-right font-mono">
                          <span className="text-white font-bold block">{evt.value}</span>
                          {evt.limit && <span className="text-[10px] text-slate-500 block">{evt.limit}</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center text-[10px] text-slate-400 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          {isAlarm ? (
                            <button
                              onClick={() => showToast(`Alarm ${evt.id} acknowledged.`)}
                              className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-200 border border-rose-700 text-[10px] font-bold transition-colors"
                            >
                              {evt.acknowledged ? 'Acked ✓' : 'Acknowledge'}
                            </button>
                          ) : (
                            <span className="text-slate-500 text-[10px]">Logged ✓</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* COCKPIT & PRODUCTION OVERVIEW (Slide 22 Reference)                        */}
      {/* ========================================================================= */}
      {subTab === 'cockpit' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left 7 cols: Daily Production Trend Chart (Slide 22) */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                    Daily Production Trendz (BOPD / BFPD / Water Cut)
                  </h3>
                  <p className="text-xs text-slate-400">Total gross liquid vs oil cut allocation over historical quarters.</p>
                </div>
                <span className="text-xs font-mono text-cyan-400 font-semibold">Updated: Just Now</span>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyProductionSeries} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="bfpdGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="bopdGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 10 }} />
                    <YAxis yAxisId="fluid" stroke="#06b6d4" tick={{ fontSize: 10 }} label={{ value: 'Fluid (BPD)', angle: -90, position: 'insideLeft', fill: '#06b6d4', fontSize: 10 }} />
                    <YAxis yAxisId="wc" orientation="right" stroke="#eab308" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Area yAxisId="fluid" type="monotone" dataKey="bfpd" name="Production BFPD" stroke="#06b6d4" fill="url(#bfpdGrad2)" strokeWidth={2} />
                    <Area yAxisId="fluid" type="monotone" dataKey="bopd" name="Production BOPD" stroke="#10b981" fill="url(#bopdGrad2)" strokeWidth={2} />
                    <Line yAxisId="wc" type="monotone" dataKey="waterCut" name="Water Cut %" stroke="#eab308" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right 5 cols: SCADA Surface Transmitter Callouts & Dials (Slide 22) */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Downhole &amp; Surface Callouts
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  Telemetry Stream OK
                </span>
              </div>

              {/* 3 Inline Dials */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">Intake Press</span>
                  <span className="text-lg font-bold font-mono text-cyan-400 mt-0.5 block">{selectedWell.intakePressurePsi}</span>
                  <span className="text-[9px] text-slate-500 font-mono">psig</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">Discharge Press</span>
                  <span className="text-lg font-bold font-mono text-purple-400 mt-0.5 block">{selectedWell.dischargePressurePsi}</span>
                  <span className="text-[9px] text-slate-500 font-mono">psig</span>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] text-slate-400 font-mono block">Motor Temp</span>
                  <span className="text-lg font-bold font-mono text-rose-400 mt-0.5 block">{selectedWell.motorTempF}°</span>
                  <span className="text-[9px] text-slate-500 font-mono">°F</span>
                </div>
              </div>

              {/* Surface Wellhead SCADA Tag Readouts (Slide 22 Callouts) */}
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Voltage (V):</span>
                  <span className="text-white font-bold">2,241 V</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Current (A):</span>
                  <span className="text-amber-400 font-bold">{selectedWell.motorCurrentA} A</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Frequency (Hz):</span>
                  <span className="text-cyan-400 font-bold">{selectedWell.vfdFrequencyHz} Hz</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1">
                  <span className="text-slate-400">Vibration (G):</span>
                  <span className="text-white font-bold">{selectedWell.vibrationG} g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Wellhead Press (Pd):</span>
                  <span className="text-cyan-300 font-bold">3,114 psi</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Intake Press (Pi):</span>
                  <span className="text-purple-300 font-bold">{selectedWell.intakePressurePsi} psi</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 text-center border-t border-slate-800 pt-2 font-mono">
                Asset URI: <span className="text-cyan-400 font-bold">http://localhost:3000/#{selectedWell.wellCode || selectedWell.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAG INSPECTION / CONFIGURATION MODAL (Section 2.D) */}
      {drillDownTag && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-mono">
                  SCADA Tag Inspector — Reg {drillDownTag.register}
                </h3>
              </div>
              <button onClick={() => setDrillDownTag(null)} className="text-slate-400 hover:text-white font-bold text-sm">✕</button>
            </div>

            <div className="space-y-3 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tag Identifier:</span>
                  <span className="text-cyan-400 font-bold">{drillDownTag.tagName} ({drillDownTag.id})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Holding Register:</span>
                  <span className="text-white font-bold">{drillDownTag.register} (0x{(drillDownTag.register).toString(16).toUpperCase()})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Live Engineering Value:</span>
                  <span className="text-emerald-400 font-bold text-sm">{drillDownTag.currentValue} {drillDownTag.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Configured Limits:</span>
                  <span className="text-slate-300">
                    Low: {drillDownTag.lowLimit ?? 'N/A'} | High: {drillDownTag.highLimit ?? 'N/A'} {drillDownTag.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Data Type Encoding:</span>
                  <span className="text-slate-300">{drillDownTag.dataType} (IEEE 754 Big-Endian)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Calculated Scale Factor:</span>
                  <span className="text-slate-300">{drillDownTag.scale}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Communication Quality:</span>
                  <span className="text-emerald-400 font-semibold">{drillDownTag.quality} (CRC Verified OK)</span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 block mb-1">Raw Modbus TCP Packet Hex Dump:</span>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-emerald-400 font-mono break-all">
                  [RX] 00 01 00 00 00 06 01 03 04 42 {Math.floor(Number(drillDownTag.currentValue) || 58).toString(16)} 00 00
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  showToast(`Limits saved for ${drillDownTag.tagName}.`);
                  setDrillDownTag(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
              >
                Save Limits
              </button>
              <button
                onClick={() => setDrillDownTag(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
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
