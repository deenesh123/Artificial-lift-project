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

      points.push({
        time: timeLabel,
        intakePressure: Math.round(baseIntake + sinOffset * 18 + (Math.random() * 8 - 4)),
        dischargePressure: Math.round(baseDischarge + cosOffset * 35 + (Math.random() * 14 - 7)),
        motorTemp: Math.round((baseMotorTemp + sinOffset * 3.5 + (Math.random() * 1.5 - 0.75)) * 10) / 10,
        frequency: Math.round((vfdHz + sinOffset * 0.2) * 10) / 10,
        motorCurrent: Math.round((baseCurrent + cosOffset * 1.2 + (Math.random() * 0.4 - 0.2)) * 10) / 10,
        vibration: Math.round((baseVibe + Math.abs(sinOffset) * 0.04 + (Math.random() * 0.02 - 0.01)) * 100) / 100,
        flowRate: Math.round(baseFlow + sinOffset * 65 + (Math.random() * 20 - 10)),
      });
    }

    return points;
  },
};
