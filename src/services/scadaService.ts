import { ScadaHostNode, ScadaTagItem, TelemetryPoint } from '../types';

const SCADA_STORAGE_KEYS = {
  HOSTS: 'als_scada_hosts_v1',
  TAGS: 'als_scada_tags_v1',
};

export const INITIAL_SCADA_HOSTS: ScadaHostNode[] = [
  {
    id: 'HOST-01-PRI',
    name: 'Primary RTOC SCADA Server (Delaware Alpha)',
    role: 'Primary',
    ipAddress: '10.142.20.10',
    port: 502,
    protocol: 'Modbus TCP',
    pollIntervalMs: 1000,
    status: 'Online',
    latencyMs: 14,
    packetLossPct: 0.02,
    connectedDevices: 42,
    lastSyncTime: '2026-10-28T07:59:58Z',
  },
  {
    id: 'HOST-02-SEC',
    name: 'Secondary Hot-Standby SCADA Host (Midland Beta)',
    role: 'Secondary Failover',
    ipAddress: '10.142.20.11',
    port: 502,
    protocol: 'Modbus TCP',
    pollIntervalMs: 1000,
    status: 'Standby',
    latencyMs: 18,
    packetLossPct: 0.04,
    connectedDevices: 42,
    lastSyncTime: '2026-10-28T07:59:55Z',
  },
  {
    id: 'GATE-03-EDG',
    name: 'Phantom State Pad Bravo Edge RTU Gateway',
    role: 'Edge Gateway',
    ipAddress: '192.168.104.1',
    port: 1883,
    protocol: 'MQTT Sparkplug B',
    pollIntervalMs: 500,
    status: 'Online',
    latencyMs: 8,
    packetLossPct: 0.0,
    connectedDevices: 8,
    lastSyncTime: '2026-10-28T08:00:01Z',
  },
  {
    id: 'GATE-04-EDG',
    name: 'Canyon Creek Pad 19 OPC-UA Collector',
    role: 'Edge Gateway',
    ipAddress: '192.168.119.1',
    port: 4840,
    protocol: 'OPC-UA',
    pollIntervalMs: 2000,
    status: 'Online',
    latencyMs: 22,
    packetLossPct: 0.1,
    connectedDevices: 6,
    lastSyncTime: '2026-10-28T07:59:50Z',
  },
];

export const INITIAL_SCADA_TAGS: ScadaTagItem[] = [
  // Phantom State 104-2H (ESP)
  {
    id: 'TAG-104-001',
    register: 40001,
    tagName: 'ESP_DRIVE_RUN_STATUS',
    description: 'VFD Inverter Run/Stop status bitmask',
    dataType: 'UINT16',
    scale: '1:1',
    unit: 'Bitmask',
    currentValue: '1 (RUNNING)',
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Status',
    quality: 'GOOD',
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-002',
    register: 40002,
    tagName: 'ESP_OUTPUT_FREQUENCY_HZ',
    description: 'Variable frequency drive instantaneous output frequency',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: 'Hz',
    currentValue: 58.5,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Electrical',
    quality: 'GOOD',
    highLimit: 65.0,
    lowLimit: 40.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-003',
    register: 40003,
    tagName: 'ESP_MOTOR_CURRENT_RMS_A',
    description: 'Phase current root mean square to downhole PMM motor',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: 'Amps',
    currentValue: 52.4,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Electrical',
    quality: 'GOOD',
    highLimit: 62.0,
    lowLimit: 30.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-004',
    register: 40004,
    tagName: 'ESP_INTAKE_PRESSURE_PSI',
    description: 'Downhole Phoenix gauge intake static fluid pressure',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 840.2,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 1400.0,
    lowLimit: 400.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-005',
    register: 40005,
    tagName: 'ESP_DISCHARGE_PRESSURE_PSI',
    description: 'ESP discharge manifold head pressure into production tubing',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 2950.8,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 3600.0,
    lowLimit: 1800.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-006',
    register: 40006,
    tagName: 'ESP_MOTOR_TEMP_RTD_F',
    description: 'PMM stator winding temperature RTD telemetry',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: '°F',
    currentValue: 198.4,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Temperature',
    quality: 'GOOD',
    highLimit: 250.0,
    lowLimit: 100.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-007',
    register: 40007,
    tagName: 'ESP_TRIAXIAL_VIBRATION_G',
    description: 'Downhole pump housing composite vibration amplitude',
    dataType: 'FLOAT32',
    scale: '0.01',
    unit: 'g RMS',
    currentValue: 0.28,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Vibration',
    quality: 'GOOD',
    highLimit: 0.85,
    lowLimit: 0.05,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-008',
    register: 40008,
    tagName: 'SURFACE_GROSS_RATE_BPD',
    description: 'Coriolis mass flowmeter total gross fluid rate',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'BPD',
    currentValue: 2450.0,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Hydrodynamic',
    quality: 'GOOD',
    highLimit: 3500.0,
    lowLimit: 800.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-009',
    register: 40009,
    tagName: 'SURFACE_WATER_CUT_PCT',
    description: 'Microwave water-cut meter instantaneous water percentage',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: '%',
    currentValue: 59.8,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Hydrodynamic',
    quality: 'GOOD',
    highLimit: 95.0,
    lowLimit: 10.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-010',
    register: 40010,
    tagName: 'WELLHEAD_TUBING_PRESS_PSI',
    description: 'Surface Christmas tree tubing head pressure transmitter',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 245.0,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 500.0,
    lowLimit: 50.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-011',
    register: 40011,
    tagName: 'WELLHEAD_FLOWLINE_PRESS_PSI',
    description: 'Surface flowline pressure transmitter upstream of header manifold',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 115.6,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 250.0,
    lowLimit: 25.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-012',
    register: 40012,
    tagName: 'A_ANNULUS_CASING_PRESS_PSI',
    description: 'A-Annulus tubing-casing annular gas pressure',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 714.2,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 1100.0,
    lowLimit: 100.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-013',
    register: 40013,
    tagName: 'B_ANNULUS_CASING_PRESS_PSI',
    description: 'B-Annulus intermediate casing pressure transmitter',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 0.0,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 200.0,
    lowLimit: 0.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-014',
    register: 40014,
    tagName: 'INTAKE_FLUID_TEMP_F',
    description: 'Downhole Phoenix gauge fluid intake suction temperature',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: '°F',
    currentValue: 142.8,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Temperature',
    quality: 'GOOD',
    highLimit: 190.0,
    lowLimit: 80.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-015',
    register: 40015,
    tagName: 'FLOWLINE_FLUID_TEMP_F',
    description: 'Surface flowline temperature transmitter',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: '°F',
    currentValue: 113.8,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Temperature',
    quality: 'GOOD',
    highLimit: 160.0,
    lowLimit: 50.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-016',
    register: 40016,
    tagName: 'RTU_SOLAR_BATTERY_VOLTAGE_V',
    description: 'Solar RTU battery DC supply voltage',
    dataType: 'FLOAT32',
    scale: '0.01',
    unit: 'V',
    currentValue: 13.8,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Electrical',
    quality: 'GOOD',
    highLimit: 14.8,
    lowLimit: 11.8,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-104-017',
    register: 40017,
    tagName: 'ESP_ACTIVE_POWER_KW',
    description: 'Surface VFD instantaneous active power draw',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'kW',
    currentValue: 184.0,
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    padName: 'Phantom State Pad Bravo',
    category: 'Electrical',
    quality: 'GOOD',
    highLimit: 250.0,
    lowLimit: 80.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },

  // Red River Federal 82-4H (ESP Warning)
  {
    id: 'TAG-082-001',
    register: 40011,
    tagName: 'RR_ESP_DRIVE_FREQ_HZ',
    description: 'Red River 82-4H VFD speed frequency',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: 'Hz',
    currentValue: 54.0,
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    padName: 'Red River Central Pad',
    category: 'Electrical',
    quality: 'GOOD',
    highLimit: 62.0,
    lowLimit: 45.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-082-002',
    register: 40012,
    tagName: 'RR_ESP_MOTOR_TEMP_F',
    description: 'Red River 82-4H Elevated motor winding temperature',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: '°F',
    currentValue: 238.6,
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    padName: 'Red River Central Pad',
    category: 'Temperature',
    quality: 'FAIR',
    highLimit: 240.0,
    lowLimit: 120.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-082-003',
    register: 40013,
    tagName: 'RR_ESP_INTAKE_PRESS_PSI',
    description: 'Red River 82-4H Depleted intake pressure (Gas interference)',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 540.0,
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    padName: 'Red River Central Pad',
    category: 'Pressure',
    quality: 'FAIR',
    highLimit: 1200.0,
    lowLimit: 600.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },

  // Canyon Creek 19-3H (Rod Pump Critical Fluid Pound)
  {
    id: 'TAG-019-001',
    register: 40021,
    tagName: 'ROD_PPRL_PEAK_LOAD_KLB',
    description: 'Polished rod peak load loadcell reading',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: 'klb',
    currentValue: 24.8,
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    padName: 'Canyon Creek Pad 19',
    category: 'Hydrodynamic',
    quality: 'GOOD',
    highLimit: 26.5,
    lowLimit: 15.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-019-002',
    register: 40022,
    tagName: 'ROD_MPRL_MIN_LOAD_KLB',
    description: 'Polished rod minimum load on downstroke',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: 'klb',
    currentValue: 5.8,
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    padName: 'Canyon Creek Pad 19',
    category: 'Hydrodynamic',
    quality: 'GOOD',
    highLimit: 12.0,
    lowLimit: 4.5,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-019-003',
    register: 40023,
    tagName: 'ROD_PUMP_FILLAGE_PCT',
    description: 'Pump barrel fillage percentage (Severe fluid pound)',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: '%',
    currentValue: 32.0,
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    padName: 'Canyon Creek Pad 19',
    category: 'Hydrodynamic',
    quality: 'FAIR',
    highLimit: 95.0,
    lowLimit: 60.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-019-004',
    register: 40024,
    tagName: 'ROD_PUMP_SPM',
    description: 'Pumping unit strokes per minute',
    dataType: 'FLOAT32',
    scale: '0.1',
    unit: 'SPM',
    currentValue: 5.4,
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    padName: 'Canyon Creek Pad 19',
    category: 'Status',
    quality: 'GOOD',
    highLimit: 9.0,
    lowLimit: 2.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },

  // Fort Berthold 05-1H (PCP)
  {
    id: 'TAG-005-001',
    register: 40031,
    tagName: 'PCP_SURFACE_RPM',
    description: 'Direct drive PCP hydraulic head RPM',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'RPM',
    currentValue: 240.0,
    wellId: 'ALS-BAK-PCP-005',
    wellName: 'Fort Berthold 05-1H',
    padName: 'Fort Berthold Unit 5',
    category: 'Status',
    quality: 'GOOD',
    highLimit: 350.0,
    lowLimit: 100.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-005-002',
    register: 40032,
    tagName: 'PCP_HYDRAULIC_HEAD_PSI',
    description: 'PCP discharge pressure against heavy crude column',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'psi',
    currentValue: 1820.0,
    wellId: 'ALS-BAK-PCP-005',
    wellName: 'Fort Berthold 05-1H',
    padName: 'Fort Berthold Unit 5',
    category: 'Pressure',
    quality: 'GOOD',
    highLimit: 2200.0,
    lowLimit: 800.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
  {
    id: 'TAG-005-003',
    register: 40033,
    tagName: 'PCP_DRIVE_TORQUE_FTLBS',
    description: 'Stator elastomeric drive torque',
    dataType: 'FLOAT32',
    scale: '1.0',
    unit: 'ft-lbs',
    currentValue: 480.0,
    wellId: 'ALS-BAK-PCP-005',
    wellName: 'Fort Berthold 05-1H',
    padName: 'Fort Berthold Unit 5',
    category: 'Electrical',
    quality: 'GOOD',
    highLimit: 750.0,
    lowLimit: 150.0,
    lastUpdated: '2026-10-28T08:00:00Z',
  },
];

export const ScadaService = {
  getHosts(): ScadaHostNode[] {
    try {
      const data = localStorage.getItem(SCADA_STORAGE_KEYS.HOSTS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_SCADA_HOSTS;
  },

  saveHosts(hosts: ScadaHostNode[]): void {
    localStorage.setItem(SCADA_STORAGE_KEYS.HOSTS, JSON.stringify(hosts));
    window.dispatchEvent(new Event('scada_update'));
  },

  getTags(): ScadaTagItem[] {
    try {
      const data = localStorage.getItem(SCADA_STORAGE_KEYS.TAGS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_SCADA_TAGS;
  },

  saveTags(tags: ScadaTagItem[]): void {
    localStorage.setItem(SCADA_STORAGE_KEYS.TAGS, JSON.stringify(tags));
    window.dispatchEvent(new Event('scada_update'));
  },

  addTag(tag: ScadaTagItem): ScadaTagItem[] {
    const tags = this.getTags();
    const updated = [tag, ...tags];
    this.saveTags(updated);
    return updated;
  },

  updateTag(tag: ScadaTagItem): ScadaTagItem[] {
    const tags = this.getTags();
    const updated = tags.map(t => t.id === tag.id ? { ...tag, lastUpdated: new Date().toISOString() } : t);
    this.saveTags(updated);
    return updated;
  },

  deleteTag(id: string): ScadaTagItem[] {
    const tags = this.getTags();
    const updated = tags.filter(t => t.id !== id);
    this.saveTags(updated);
    return updated;
  },

  resetTags(): ScadaTagItem[] {
    this.saveTags(INITIAL_SCADA_TAGS);
    this.saveHosts(INITIAL_SCADA_HOSTS);
    return INITIAL_SCADA_TAGS;
  },

  // Generate realistic time-series telemetry points for Recharts based on timeRange
  generateTelemetrySeries(
    wellId: string, 
    timeRange: '1h' | '6h' | '24h' | '7d' | '30d',
    vfdHz: number = 58.5
  ): TelemetryPoint[] {
    const points: TelemetryPoint[] = [];
    let count = 24;
    let stepMinutes = 60;

    if (timeRange === '1h') {
      count = 30; // every 2 min
      stepMinutes = 2;
    } else if (timeRange === '6h') {
      count = 24; // every 15 min
      stepMinutes = 15;
    } else if (timeRange === '24h') {
      count = 24; // every 1 hour
      stepMinutes = 60;
    } else if (timeRange === '7d') {
      count = 28; // every 6 hours
      stepMinutes = 360;
    } else if (timeRange === '30d') {
      count = 30; // every 1 day
      stepMinutes = 1440;
    }

    const now = new Date();
    // Baseline well parameters
    const hzRatio = vfdHz / 58.5;
    const baseIntake = Math.round(840 / hzRatio);
    const baseDischarge = Math.round(2950 * Math.pow(hzRatio, 1.8));
    const baseMotorTemp = Math.round(198 * Math.pow(hzRatio, 0.4));
    const baseCurrent = Math.round(52.4 * Math.pow(hzRatio, 1.5) * 10) / 10;
    const baseVibe = Math.round(0.28 * Math.pow(hzRatio, 1.2) * 100) / 100;
    const baseFlow = Math.round(2450 * hzRatio);

    for (let i = count - 1; i >= 0; i--) {
      const ptTime = new Date(now.getTime() - i * stepMinutes * 60 * 1000);
      const timeLabel = timeRange === '1h' || timeRange === '6h' 
        ? ptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : timeRange === '24h'
        ? ptTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : `${ptTime.getMonth() + 1}/${ptTime.getDate()}`;

      // Pseudo-random deterministic noise
      const sinOffset = Math.sin((i / count) * Math.PI * 4);
      const cosOffset = Math.cos((i / count) * Math.PI * 2);

      const pip = Math.round(baseIntake + sinOffset * 18 + (Math.random() * 8 - 4));
      const pdp = Math.round(baseDischarge + cosOffset * 35 + (Math.random() * 14 - 7));
      const thp = Math.round((245 + cosOffset * 12 + (Math.random() * 6 - 3)) * 10) / 10;
      const flp = Math.round((115 + sinOffset * 8 + (Math.random() * 4 - 2)) * 10) / 10;
      const annA = Math.round((714 + sinOffset * 15 + (Math.random() * 6 - 3)) * 10) / 10;
      const annB = 0;
      const mTemp = Math.round((baseMotorTemp + sinOffset * 3.5 + (Math.random() * 1.5 - 0.75)) * 10) / 10;
      const flTemp = Math.round((113.8 + sinOffset * 2.2 + (Math.random() * 1.0 - 0.5)) * 10) / 10;
      const inTemp = Math.round((142.8 + sinOffset * 1.8 + (Math.random() * 0.8 - 0.4)) * 10) / 10;
      const freq = Math.round((vfdHz + sinOffset * 0.25) * 10) / 10;
      const amps = Math.round((baseCurrent + cosOffset * 1.2 + (Math.random() * 0.4 - 0.2)) * 10) / 10;
      const vibe = Math.round((baseVibe + Math.abs(sinOffset) * 0.04 + (Math.random() * 0.02 - 0.01)) * 100) / 100;
      const bfpd = Math.round(baseFlow + sinOffset * 65 + (Math.random() * 20 - 10));
      const bopd = Math.round(bfpd * 0.4 + (Math.random() * 15 - 7));
      const pKw = Math.round((1.732 * 2.24 * amps * 0.88 * 0.89) * 10) / 10;
      const battV = Math.round((13.8 + Math.sin(i * 0.5) * 0.15) * 100) / 100;

      points.push({
        time: timeLabel,
        intakePressure: pip,
        dischargePressure: pdp,
        tubingPressure: thp,
        flowlinePressure: flp,
        aAnnulusPressure: annA,
        bAnnulusPressure: annB,
        motorTemp: mTemp,
        intakeFluidTemp: inTemp,
        flowlineTemp: flTemp,
        frequency: freq,
        motorCurrent: amps,
        vibration: vibe,
        flowRate: bfpd,
        oilRate: bopd,
        powerKw: pKw,
        powerFactor: 0.89,
        batteryVoltage: battV,
      });
    }

    return points;
  },

  // Dynamic tags generator for any well asset to guarantee all 10 unified parameters are queryable
  getTagsForWell(wellId: string, wellName: string, padName: string = 'Production Pad'): ScadaTagItem[] {
    const allTags = this.getTags();
    const existing = allTags.filter(t => t.wellId === wellId);
    if (existing.length >= 8) {
      return existing;
    }

    // Generate canonical registers for this well
    const wellHash = wellId.split('-').pop() || '001';
    const num = parseInt(wellHash.replace(/\D/g, ''), 10) || 101;
    const baseReg = 40000 + (num % 500) * 15;

    const synthesized: ScadaTagItem[] = [
      {
        id: `TAG-${wellHash}-001`,
        register: baseReg + 1,
        tagName: `${wellHash}_THP_TUBING_PRESS_PSI`,
        description: `${wellName} Tubing Head Pressure (THP)`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'psi',
        currentValue: 245.0,
        wellId,
        wellName,
        padName,
        category: 'Pressure',
        quality: 'GOOD',
        highLimit: 500.0,
        lowLimit: 50.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-002`,
        register: baseReg + 2,
        tagName: `${wellHash}_FLOWLINE_PRESS_PSI`,
        description: `${wellName} Surface Flowline Pressure`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'psi',
        currentValue: 115.6,
        wellId,
        wellName,
        padName,
        category: 'Pressure',
        quality: 'GOOD',
        highLimit: 250.0,
        lowLimit: 25.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-003`,
        register: baseReg + 3,
        tagName: `${wellHash}_A_ANNULUS_PRESS_PSI`,
        description: `${wellName} A-Annulus Casing Pressure`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'psi',
        currentValue: 714.2,
        wellId,
        wellName,
        padName,
        category: 'Pressure',
        quality: 'GOOD',
        highLimit: 1100.0,
        lowLimit: 100.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-004`,
        register: baseReg + 4,
        tagName: `${wellHash}_B_ANNULUS_PRESS_PSI`,
        description: `${wellName} B-Annulus Intermediate Pressure`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'psi',
        currentValue: 0.0,
        wellId,
        wellName,
        padName,
        category: 'Pressure',
        quality: 'GOOD',
        highLimit: 200.0,
        lowLimit: 0.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-005`,
        register: baseReg + 5,
        tagName: `${wellHash}_PIP_INTAKE_PRESS_PSI`,
        description: `${wellName} Downhole Pump Intake Pressure (PIP)`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'psi',
        currentValue: 840.0,
        wellId,
        wellName,
        padName,
        category: 'Pressure',
        quality: 'GOOD',
        highLimit: 1400.0,
        lowLimit: 400.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-006`,
        register: baseReg + 6,
        tagName: `${wellHash}_PDP_DISCHARGE_PRESS_PSI`,
        description: `${wellName} Downhole Pump Discharge Pressure (PDP)`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'psi',
        currentValue: 2950.0,
        wellId,
        wellName,
        padName,
        category: 'Pressure',
        quality: 'GOOD',
        highLimit: 3600.0,
        lowLimit: 1800.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-007`,
        register: baseReg + 7,
        tagName: `${wellHash}_MOTOR_TEMP_F`,
        description: `${wellName} Motor Stator Winding Temperature`,
        dataType: 'FLOAT32',
        scale: '0.1',
        unit: '°F',
        currentValue: 198.4,
        wellId,
        wellName,
        padName,
        category: 'Temperature',
        quality: 'GOOD',
        highLimit: 250.0,
        lowLimit: 100.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-008`,
        register: baseReg + 8,
        tagName: `${wellHash}_INTAKE_FLUID_TEMP_F`,
        description: `${wellName} Downhole Intake Fluid Temperature`,
        dataType: 'FLOAT32',
        scale: '0.1',
        unit: '°F',
        currentValue: 142.8,
        wellId,
        wellName,
        padName,
        category: 'Temperature',
        quality: 'GOOD',
        highLimit: 190.0,
        lowLimit: 80.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-009`,
        register: baseReg + 9,
        tagName: `${wellHash}_FLOWLINE_TEMP_F`,
        description: `${wellName} Surface Flowline Fluid Temperature`,
        dataType: 'FLOAT32',
        scale: '0.1',
        unit: '°F',
        currentValue: 113.8,
        wellId,
        wellName,
        padName,
        category: 'Temperature',
        quality: 'GOOD',
        highLimit: 160.0,
        lowLimit: 50.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-010`,
        register: baseReg + 10,
        tagName: `${wellHash}_RTU_BATTERY_V`,
        description: `${wellName} Wellhead RTU Battery Supply Voltage`,
        dataType: 'FLOAT32',
        scale: '0.01',
        unit: 'V',
        currentValue: 13.8,
        wellId,
        wellName,
        padName,
        category: 'Electrical',
        quality: 'GOOD',
        highLimit: 14.8,
        lowLimit: 11.8,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-011`,
        register: baseReg + 11,
        tagName: `${wellHash}_VFD_FREQUENCY_HZ`,
        description: `${wellName} VFD Drive Instantaneous Frequency`,
        dataType: 'FLOAT32',
        scale: '0.1',
        unit: 'Hz',
        currentValue: 58.5,
        wellId,
        wellName,
        padName,
        category: 'Electrical',
        quality: 'GOOD',
        highLimit: 65.0,
        lowLimit: 40.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-012`,
        register: baseReg + 12,
        tagName: `${wellHash}_MOTOR_CURRENT_A`,
        description: `${wellName} Motor RMS Phase Current`,
        dataType: 'FLOAT32',
        scale: '0.1',
        unit: 'Amps',
        currentValue: 52.4,
        wellId,
        wellName,
        padName,
        category: 'Electrical',
        quality: 'GOOD',
        highLimit: 62.0,
        lowLimit: 30.0,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-013`,
        register: baseReg + 13,
        tagName: `${wellHash}_VIBRATION_G`,
        description: `${wellName} Triaxial Vibration Amplitude`,
        dataType: 'FLOAT32',
        scale: '0.01',
        unit: 'g RMS',
        currentValue: 0.28,
        wellId,
        wellName,
        padName,
        category: 'Vibration',
        quality: 'GOOD',
        highLimit: 0.85,
        lowLimit: 0.05,
        lastUpdated: new Date().toISOString(),
      },
      {
        id: `TAG-${wellHash}-014`,
        register: baseReg + 14,
        tagName: `${wellHash}_ACTIVE_POWER_KW`,
        description: `${wellName} Active Surface Power Consumption`,
        dataType: 'FLOAT32',
        scale: '1.0',
        unit: 'kW',
        currentValue: 184.0,
        wellId,
        wellName,
        padName,
        category: 'Electrical',
        quality: 'GOOD',
        highLimit: 250.0,
        lowLimit: 80.0,
        lastUpdated: new Date().toISOString(),
      },
    ];

    return [...existing, ...synthesized];
  },

  // Latest 10 synthetic alarms and operational events with clear distinction
  getLatestScadaEvents(): Array<{
    id: string;
    type: 'alarm' | 'event';
    severity: 'Critical' | 'High' | 'Warning' | 'Info';
    wellId: string;
    wellName: string;
    tagOrParam: string;
    description: string;
    value: string;
    limit?: string;
    timestamp: string;
    acknowledged: boolean;
  }> {
    return [
      {
        id: 'SCADA-ALM-101',
        type: 'alarm',
        severity: 'Critical',
        wellId: 'ALS-EF-ROD-019',
        wellName: 'Canyon Creek 19-3H',
        tagOrParam: 'ROD_PUMP_FILLAGE_PCT',
        description: 'Severe fluid pound detected. Pump fillage dropped below critical threshold.',
        value: '32.0 %',
        limit: 'Min > 60.0 %',
        timestamp: '2026-10-28T07:54:12Z',
        acknowledged: false,
      },
      {
        id: 'SCADA-ALM-102',
        type: 'alarm',
        severity: 'High',
        wellId: 'ALS-DEL-ESP-082',
        wellName: 'Red River Federal 82-4H',
        tagOrParam: 'RR_ESP_MOTOR_TEMP_F',
        description: 'Downhole motor winding temperature exceeding high alarm setpoint (238.6°F).',
        value: '238.6 °F',
        limit: 'High Limit: 240.0 °F',
        timestamp: '2026-10-28T07:48:30Z',
        acknowledged: false,
      },
      {
        id: 'SCADA-EVT-103',
        type: 'event',
        severity: 'Info',
        wellId: 'ALS-DEL-ESP-104',
        wellName: 'Phantom State 104-2H',
        tagOrParam: 'ESP_OUTPUT_FREQUENCY_HZ',
        description: 'VFD Speed setpoint remotely adjusted by RTOC controller from 57.5 to 58.5 Hz.',
        value: '58.5 Hz',
        timestamp: '2026-10-28T07:42:00Z',
        acknowledged: true,
      },
      {
        id: 'SCADA-ALM-104',
        type: 'alarm',
        severity: 'Warning',
        wellId: 'ALS-DEL-ESP-082',
        wellName: 'Red River Federal 82-4H',
        tagOrParam: 'ESP_TRIAXIAL_VIBRATION_G',
        description: 'Radial vibration amplitude exceeds warning band due to suspected multiphase slugging.',
        value: '0.62 g RMS',
        limit: 'Warning Limit: 0.50 g',
        timestamp: '2026-10-28T07:35:15Z',
        acknowledged: false,
      },
      {
        id: 'SCADA-EVT-105',
        type: 'event',
        severity: 'Info',
        wellId: 'HOST-01-PRI',
        wellName: 'Delaware RTOC Host',
        tagOrParam: 'MODBUS_TCP_HEALTH',
        description: 'Periodic cyclic polling sync completed across 42 Modbus field slaves. 0 packet drops.',
        value: 'Latency: 14ms',
        timestamp: '2026-10-28T07:30:00Z',
        acknowledged: true,
      },
      {
        id: 'SCADA-ALM-106',
        type: 'alarm',
        severity: 'Warning',
        wellId: 'ALS-MID-ESP-180',
        wellName: 'Cowden 180-4H',
        tagOrParam: 'ESP_INTAKE_PRESSURE_PSI',
        description: 'Depleted pump intake pressure approaching gas breakout bubble point.',
        value: '620 psi',
        limit: 'Low Limit: 650 psi',
        timestamp: '2026-10-28T07:18:40Z',
        acknowledged: true,
      },
      {
        id: 'SCADA-EVT-107',
        type: 'event',
        severity: 'Info',
        wellId: 'ALS-DEL-ESP-104',
        wellName: 'Phantom State 104-2H',
        tagOrParam: 'WELLHEAD_TUBING_PRESS_PSI',
        description: 'Choke trim valve calibration cycle executed successfully by surface controller.',
        value: '245.0 psi',
        timestamp: '2026-10-28T07:05:10Z',
        acknowledged: true,
      },
      {
        id: 'SCADA-EVT-108',
        type: 'event',
        severity: 'Info',
        wellId: 'ALS-BAK-PCP-005',
        wellName: 'Fort Berthold 05-1H',
        tagOrParam: 'PCP_SURFACE_RPM',
        description: 'Direct-drive PCP head speed locked at 240 RPM after soft start sequence.',
        value: '240 RPM',
        timestamp: '2026-10-28T06:50:22Z',
        acknowledged: true,
      },
      {
        id: 'SCADA-ALM-109',
        type: 'alarm',
        severity: 'Critical',
        wellId: 'ALS-DEL-ESP-099',
        wellName: 'Silver Spur 99-1H',
        tagOrParam: 'ESP_INSULATION_RES_MOHM',
        description: 'Downhole cable insulation resistance low. Underload auto-trip locked out.',
        value: '0.3 MΩ',
        limit: 'Min: 5.0 MΩ',
        timestamp: '2026-10-28T06:32:00Z',
        acknowledged: true,
      },
      {
        id: 'SCADA-EVT-110',
        type: 'event',
        severity: 'Info',
        wellId: 'GATE-03-EDG',
        wellName: 'Pad Bravo Edge RTU',
        tagOrParam: 'MQTT_SPARKPLUG_BIRTH',
        description: 'MQTT Sparkplug B DBIRTH payload broadcasted to central message broker.',
        value: 'Payload Size: 4.2KB',
        timestamp: '2026-10-28T06:15:00Z',
        acknowledged: true,
      },
    ];
  },
};

