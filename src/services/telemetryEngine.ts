/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * ALS — Artificial Lift Suite
 * Synthetic Telemetry Engine & Time-Series Data Generator
 * 
 * ALL DATA GENERATED IS DEMO SIMULATED DATA.
 * No connection to real SCADA equipment or physical wellheads.
 */

export interface SyntheticTelemetryRecord {
  id: string; // unique hash: equipmentId_hourTimestamp
  equipmentId: string;
  equipmentName: string;
  liftType: 'ESP' | 'Rod Pump' | 'Gas Lift';
  timestamp: number; // epoch ms
  timestampIso: string;
  hourLabel: string; // e.g., "10/24 14:00"
  dateLabel: string; // "2026-10-24"
  
  // Pressure & Temperatures
  intakePressurePsi: number;
  dischargePressurePsi: number;
  casingPressurePsi: number;
  tubingPressurePsi: number;
  motorTempF: number;
  intakeTempF: number;
  wellheadTempF: number;

  // Flow & Production
  oilFlowBopd: number;
  waterFlowBwpd: number;
  gasFlowMcfd: number;
  grossFluidBpd: number;
  waterCutPct: number;

  // Mechanical & Electrical
  pumpRpm: number;
  vfdFrequencyHz: number;
  motorCurrentA: number;
  motorVoltageV: number;
  powerKw: number;
  powerFactor: number;
  vibrationX: number;
  vibrationY: number;
  vibrationZ: number;
  vibrationRmsG: number;

  // Equipment Health & Efficiency
  espHealthScore: number; // 0 - 100%
  pumpEfficiencyPct: number;
  insulationResistanceMohm: number;

  // Operational Events & Alarms
  hasAlarm: boolean;
  alarmSeverity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical';
  alarmTitle?: string;

  // Fleet & Logistics Aggregation for this hour
  fleetActiveVehicles: number;
  fleetFuelGallons: number;
  fleetTripsCount: number;
  fleetUtilizationPct: number;
}

export interface EngineState {
  isRunning: boolean;
  isAccelerated: boolean;
  playbackSpeedMs: number; // default 2500ms
  currentVirtualTime: number; // epoch ms of the latest simulated hour
  totalPointsGenerated: number;
  duplicatesBlocked: number;
  lastWallClockTick: number;
}

export interface EquipmentOption {
  id: string;
  name: string;
  pad: string;
  liftType: 'ESP' | 'Rod Pump' | 'Gas Lift';
  nominalPip: number;
  nominalPdp: number;
  nominalMotorTemp: number;
  nominalBopd: number;
  nominalHz: number;
  nominalCurrentA: number;
}

export const MONITORED_EQUIPMENT: EquipmentOption[] = [
  {
    id: 'ALS-DEL-ESP-104',
    name: 'Phantom State 104-2H',
    pad: 'Phantom State Pad Bravo',
    liftType: 'ESP',
    nominalPip: 840,
    nominalPdp: 2950,
    nominalMotorTemp: 198,
    nominalBopd: 985,
    nominalHz: 58.5,
    nominalCurrentA: 52.4,
  },
  {
    id: 'ALS-DEL-ESP-082',
    name: 'Red River Federal 82-4H',
    pad: 'Red River Central Pad',
    liftType: 'ESP',
    nominalPip: 495,
    nominalPdp: 2710,
    nominalMotorTemp: 232,
    nominalBopd: 590,
    nominalHz: 54.0,
    nominalCurrentA: 58.1,
  },
  {
    id: 'ALS-MID-ESP-215',
    name: 'Midland Basin Ranch 215-1H',
    pad: 'Ranch Unit East',
    liftType: 'ESP',
    nominalPip: 910,
    nominalPdp: 2680,
    nominalMotorTemp: 188,
    nominalBopd: 635,
    nominalHz: 52.0,
    nominalCurrentA: 47.8,
  },
  {
    id: 'ALS-EF-ROD-019',
    name: 'Canyon Creek 19-3H',
    pad: 'Canyon Creek Pad 19',
    liftType: 'Rod Pump',
    nominalPip: 320,
    nominalPdp: 1450,
    nominalMotorTemp: 142,
    nominalBopd: 310,
    nominalHz: 48.0,
    nominalCurrentA: 28.5,
  },
  {
    id: 'ALS-DEL-GAS-308',
    name: 'Pecos State 308-5H',
    pad: 'Pecos River Station',
    liftType: 'Gas Lift',
    nominalPip: 680,
    nominalPdp: 1850,
    nominalMotorTemp: 135,
    nominalBopd: 450,
    nominalHz: 50.0,
    nominalCurrentA: 31.0,
  },
];

const STORAGE_KEYS = {
  RECORDS: 'als_synthetic_telemetry_records_v3',
  ENGINE_STATE: 'als_synthetic_telemetry_engine_v3',
};

// 30 days * 24 hours = 720 hourly points per equipment
const BASELINE_HOURS = 720;
const ONE_HOUR_MS = 60 * 60 * 1000;

class SyntheticTelemetryEngine {
  private records: SyntheticTelemetryRecord[] = [];
  private knownHourKeys: Set<string> = new Set();
  private state: EngineState = {
    isRunning: true,
    isAccelerated: true,
    playbackSpeedMs: 2500,
    currentVirtualTime: Date.now(),
    totalPointsGenerated: 0,
    duplicatesBlocked: 0,
    lastWallClockTick: Date.now(),
  };

  private timerId: number | null = null;
  private listeners: Set<(state: EngineState, latestRecord?: SyntheticTelemetryRecord) => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    // 1. Try loading existing state from localStorage
    try {
      const savedState = localStorage.getItem(STORAGE_KEYS.ENGINE_STATE);
      if (savedState) {
        const parsed = JSON.parse(savedState);
        this.state = { ...this.state, ...parsed };
      }

      const savedRecords = localStorage.getItem(STORAGE_KEYS.RECORDS);
      if (savedRecords) {
        const parsedRecords: SyntheticTelemetryRecord[] = JSON.parse(savedRecords);
        if (Array.isArray(parsedRecords) && parsedRecords.length >= 100) {
          this.records = parsedRecords;
          this.buildKnownKeys();
          this.startTimer();
          return;
        }
      }
    } catch {
      // fallback to preloading
    }

    // 2. Preload 30 days of hourly synthetic telemetry
    this.preloadBaselineData();
    this.startTimer();
  }

  private buildKnownKeys() {
    this.knownHourKeys.clear();
    for (const rec of this.records) {
      const bucketKey = this.getHourlyBucketKey(rec.equipmentId, rec.timestamp);
      this.knownHourKeys.add(bucketKey);
    }
  }

  private getHourlyBucketKey(equipmentId: string, timestamp: number): string {
    const hourBucket = Math.floor(timestamp / ONE_HOUR_MS);
    return `${equipmentId}_${hourBucket}`;
  }

  /**
   * Preload 30 full days of hourly records for all monitored equipment items.
   * Total points: 720 hours * 5 equipment = 3,600 high-fidelity data points.
   */
  public preloadBaselineData() {
    const now = Date.now();
    // Round down to the nearest hour
    const endHourTimestamp = Math.floor(now / ONE_HOUR_MS) * ONE_HOUR_MS;
    const startHourTimestamp = endHourTimestamp - (BASELINE_HOURS - 1) * ONE_HOUR_MS;

    const generated: SyntheticTelemetryRecord[] = [];
    this.knownHourKeys.clear();

    for (let h = 0; h < BASELINE_HOURS; h++) {
      const timestamp = startHourTimestamp + h * ONE_HOUR_MS;
      for (const eq of MONITORED_EQUIPMENT) {
        const record = this.generateSyntheticPoint(eq, timestamp, h, BASELINE_HOURS);
        const bucketKey = this.getHourlyBucketKey(eq.id, timestamp);
        if (!this.knownHourKeys.has(bucketKey)) {
          this.knownHourKeys.add(bucketKey);
          generated.push(record);
        }
      }
    }

    // Sort chronologically
    generated.sort((a, b) => a.timestamp - b.timestamp);
    this.records = generated;
    this.state.currentVirtualTime = endHourTimestamp;
    this.state.totalPointsGenerated = generated.length;
    this.state.duplicatesBlocked = 0;
    this.state.lastWallClockTick = Date.now();

    this.persist();
    this.notifyListeners();
  }

  /**
   * Generates a physically realistic synthetic data point with oilfield dynamics:
   * diurnal atmospheric cycles, fluid slip, gas slugging, brownian motor vibration, and fleet metrics.
   */
  private generateSyntheticPoint(
    eq: EquipmentOption,
    timestamp: number,
    hourIndex: number,
    totalWindowHours: number
  ): SyntheticTelemetryRecord {
    const dateObj = new Date(timestamp);
    const hourOfDay = dateObj.getUTCHours();
    const dayProgress = hourIndex / totalWindowHours; // 0 to 1

    // Diurnal variation (temperatures rise during midday, cooler at night)
    const diurnalFactor = Math.sin(((hourOfDay - 6) / 24) * 2 * Math.PI);
    
    // Slow degradation curve (health score drops very slightly over 30 days unless serviced)
    let healthBase = 96 - (dayProgress * 8);
    if (eq.id === 'ALS-DEL-ESP-082') {
      // Red River well has a known high-temp degradation profile
      healthBase = 84 - (dayProgress * 18);
    }
    const healthScore = Math.max(55, Math.min(99, Math.round(healthBase + (Math.sin(hourIndex * 0.1) * 2))));

    // Brownian fluctuations
    const noise = (Math.sin(hourIndex * 1.33) + Math.cos(hourIndex * 0.77)) * 0.5;
    const randomJitter = (Math.random() - 0.5) * 0.4;

    // Pressures
    const intakePressurePsi = Math.round(eq.nominalPip + (noise * 25) + (randomJitter * 15));
    const dischargePressurePsi = Math.round(eq.nominalPdp + (noise * 45) + (randomJitter * 30));
    const casingPressurePsi = Math.round(intakePressurePsi * 0.45 + (noise * 8));
    const tubingPressurePsi = Math.round(dischargePressurePsi * 0.78 + (noise * 20));

    // Temperatures
    const ambientTemp = 75 + (diurnalFactor * 18);
    const motorTempF = Number((eq.nominalMotorTemp + (diurnalFactor * 3.5) + (noise * 2.2) + ((100 - healthScore) * 0.25)).toFixed(1));
    const intakeTempF = Number((140 + (noise * 1.5)).toFixed(1));
    const wellheadTempF = Number((ambientTemp + 35 + (noise * 2)).toFixed(1));

    // Flow rates
    const oilFlowBopd = Math.max(50, Math.round(eq.nominalBopd + (noise * 30) - (dayProgress * 15)));
    const waterCutPct = Number(Math.min(88, Math.max(45, 58 + (dayProgress * 4) + (noise * 1.2))).toFixed(1));
    const grossFluidBpd = Math.round(oilFlowBopd / (1 - (waterCutPct / 100)));
    const waterFlowBwpd = grossFluidBpd - oilFlowBopd;
    const gasFlowMcfd = Math.round(oilFlowBopd * 1.45 + (noise * 40));

    // Mechanical & Electrical
    const vfdFrequencyHz = Number((eq.nominalHz + (noise * 0.4) + (randomJitter * 0.2)).toFixed(1));
    const pumpRpm = Math.round((vfdFrequencyHz / 60) * 3500 + (noise * 15));
    const motorCurrentA = Number((eq.nominalCurrentA + (noise * 1.5) + ((100 - healthScore) * 0.1)).toFixed(1));
    const motorVoltageV = Math.round(480 - (motorCurrentA * 0.6) + (noise * 3));
    const powerKw = Math.round((Math.sqrt(3) * motorVoltageV * motorCurrentA * 0.86) / 1000);
    const powerFactor = Number((0.85 + (noise * 0.02)).toFixed(2));

    // Multi-axis Vibration (g RMS)
    const vibBase = eq.id === 'ALS-DEL-ESP-082' ? 0.58 : 0.25;
    const vibrationX = Number((vibBase * 0.9 + (noise * 0.04) + (randomJitter * 0.02)).toFixed(2));
    const vibrationY = Number((vibBase * 1.05 + (noise * 0.05) + (randomJitter * 0.02)).toFixed(2));
    const vibrationZ = Number((vibBase * 0.75 + (noise * 0.03) + (randomJitter * 0.01)).toFixed(2));
    const vibrationRmsG = Number(Math.sqrt((vibrationX ** 2 + vibrationY ** 2 + vibrationZ ** 2) / 3).toFixed(2));

    // Efficiency & Insulation
    const pumpEfficiencyPct = Number(Math.max(40, Math.min(84, 72 - (dayProgress * 5) + (noise * 2))).toFixed(1));
    const insulationResistanceMohm = Number(Math.max(12, 180 - (dayProgress * 30) - ((100 - healthScore) * 1.2)).toFixed(1));

    // Synthetic Alarm Generation
    let hasAlarm = false;
    let alarmSeverity: 'None' | 'Low' | 'Medium' | 'High' | 'Critical' = 'None';
    let alarmTitle: string | undefined = undefined;

    if (motorTempF > 238) {
      hasAlarm = true;
      alarmSeverity = 'High';
      alarmTitle = 'Motor Winding Overtemperature Alert';
    } else if (vibrationRmsG > 0.65) {
      hasAlarm = true;
      alarmSeverity = 'Medium';
      alarmTitle = 'Radial Bearing Vibration Excursion';
    } else if (intakePressurePsi < 450) {
      hasAlarm = true;
      alarmSeverity = 'Low';
      alarmTitle = 'Low Pump Intake Pressure (Under-fill Warning)';
    }

    // Fleet Logistics (Aggregated for this hour)
    const fleetActiveVehicles = Math.max(12, Math.min(24, Math.round(18 + (diurnalFactor * 5) + (noise * 2))));
    const fleetFuelGallons = Math.max(15, Math.round(fleetActiveVehicles * (1.8 + (diurnalFactor * 0.8) + (randomJitter * 0.5))));
    const fleetTripsCount = Math.max(2, Math.round(fleetActiveVehicles * (0.6 + (diurnalFactor * 0.4))));
    const fleetUtilizationPct = Number(((fleetActiveVehicles / 25) * 100).toFixed(1));

    const monthStr = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = dateObj.getDate().toString().padStart(2, '0');
    const hourStr = dateObj.getHours().toString().padStart(2, '0');
    const hourLabel = `${monthStr}/${dayStr} ${hourStr}:00`;
    const dateLabel = `${dateObj.getFullYear()}-${monthStr}-${dayStr}`;

    return {
      id: `${eq.id}_${timestamp}`,
      equipmentId: eq.id,
      equipmentName: eq.name,
      liftType: eq.liftType,
      timestamp,
      timestampIso: dateObj.toISOString(),
      hourLabel,
      dateLabel,
      intakePressurePsi,
      dischargePressurePsi,
      casingPressurePsi,
      tubingPressurePsi,
      motorTempF,
      intakeTempF,
      wellheadTempF,
      oilFlowBopd,
      waterFlowBwpd,
      gasFlowMcfd,
      grossFluidBpd,
      waterCutPct,
      pumpRpm,
      vfdFrequencyHz,
      motorCurrentA,
      motorVoltageV,
      powerKw,
      powerFactor,
      vibrationX,
      vibrationY,
      vibrationZ,
      vibrationRmsG,
      espHealthScore: healthScore,
      pumpEfficiencyPct,
      insulationResistanceMohm,
      hasAlarm,
      alarmSeverity,
      alarmTitle,
      fleetActiveVehicles,
      fleetFuelGallons,
      fleetTripsCount,
      fleetUtilizationPct,
    };
  }

  /**
   * Generates a single new hourly time point for all monitored equipment items.
   * Advances the current virtual time by 1 hour (3,600,000 ms).
   * Strictly prevents duplicate hourly records.
   */
  public advanceOneHour(): boolean {
    const nextHourTimestamp = this.state.currentVirtualTime + ONE_HOUR_MS;
    let anyAdded = false;

    for (const eq of MONITORED_EQUIPMENT) {
      const bucketKey = this.getHourlyBucketKey(eq.id, nextHourTimestamp);

      // Duplicate prevention check
      if (this.knownHourKeys.has(bucketKey)) {
        this.state.duplicatesBlocked += 1;
        continue;
      }

      this.knownHourKeys.add(bucketKey);
      const newRecord = this.generateSyntheticPoint(
        eq,
        nextHourTimestamp,
        this.records.length,
        BASELINE_HOURS
      );
      this.records.push(newRecord);
      anyAdded = true;
    }

    if (anyAdded) {
      this.state.currentVirtualTime = nextHourTimestamp;
      this.state.totalPointsGenerated += MONITORED_EQUIPMENT.length;
      this.state.lastWallClockTick = Date.now();

      // Maintain reasonable rolling memory limit (e.g. keep latest 1,200 hours = 50 days)
      const maxRecords = 1200 * MONITORED_EQUIPMENT.length;
      if (this.records.length > maxRecords) {
        const removed = this.records.splice(0, this.records.length - maxRecords);
        for (const rem of removed) {
          this.knownHourKeys.delete(this.getHourlyBucketKey(rem.equipmentId, rem.timestamp));
        }
      }

      this.persist();
      this.notifyListeners();
    }

    return anyAdded;
  }

  /**
   * Main simulation tick loop.
   * Handles:
   * 1. Accelerated Demo Mode (ticks every 2.5 seconds to advance simulated hours)
   * 2. Real wall-clock hour pass detection (if 1 actual hour elapsed in real time)
   */
  private startTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    this.timerId = window.setInterval(() => {
      if (!this.state.isRunning) return;

      if (this.state.isAccelerated) {
        // Accelerated presentation mode: advances 1 hour every playbackSpeedMs
        this.advanceOneHour();
      } else {
        // Real-time mode: check if 1 actual real-world clock hour has passed
        const now = Date.now();
        if (now - this.state.lastWallClockTick >= ONE_HOUR_MS) {
          this.advanceOneHour();
        }
      }
    }, this.state.playbackSpeedMs);
  }

  public pause() {
    this.state.isRunning = false;
    this.persist();
    this.notifyListeners();
  }

  public resume() {
    this.state.isRunning = true;
    this.persist();
    this.notifyListeners();
  }

  public setAccelerated(active: boolean) {
    this.state.isAccelerated = active;
    this.persist();
    this.notifyListeners();
  }

  public setSpeed(speedMs: number) {
    this.state.playbackSpeedMs = Math.max(500, Math.min(10000, speedMs));
    this.persist();
    this.startTimer();
    this.notifyListeners();
  }

  public reset() {
    this.records = [];
    this.knownHourKeys.clear();
    this.preloadBaselineData();
    this.state.isRunning = true;
    this.persist();
    this.startTimer();
    this.notifyListeners();
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEYS.ENGINE_STATE, JSON.stringify(this.state));
      // Store records in localStorage
      localStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(this.records));
    } catch (e) {
      console.warn('Telemetry storage quota warning:', e);
    }
  }

  public subscribe(listener: (state: EngineState, latestRecord?: SyntheticTelemetryRecord) => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    const latest = this.records[this.records.length - 1];
    for (const listener of this.listeners) {
      listener({ ...this.state }, latest);
    }
  }

  public getState(): EngineState {
    return { ...this.state };
  }

  /**
   * Retrieves telemetry filtered by equipment, time range, and optional custom dates.
   */
  public getTelemetry(
    equipmentId?: string,
    timeRange: '24h' | '7d' | '14d' | '30d' | 'custom' = '7d',
    customStart?: string,
    customEnd?: string
  ): SyntheticTelemetryRecord[] {
    let result = this.records;

    // Filter by Equipment
    if (equipmentId && equipmentId !== 'ALL') {
      result = result.filter(r => r.equipmentId === equipmentId);
    }

    // Filter by Time Range
    const latestTimestamp = this.state.currentVirtualTime;

    if (timeRange === '24h') {
      const cutoff = latestTimestamp - 24 * ONE_HOUR_MS;
      result = result.filter(r => r.timestamp >= cutoff);
    } else if (timeRange === '7d') {
      const cutoff = latestTimestamp - 7 * 24 * ONE_HOUR_MS;
      result = result.filter(r => r.timestamp >= cutoff);
    } else if (timeRange === '14d') {
      const cutoff = latestTimestamp - 14 * 24 * ONE_HOUR_MS;
      result = result.filter(r => r.timestamp >= cutoff);
    } else if (timeRange === '30d') {
      const cutoff = latestTimestamp - 30 * 24 * ONE_HOUR_MS;
      result = result.filter(r => r.timestamp >= cutoff);
    } else if (timeRange === 'custom' && customStart && customEnd) {
      const startMs = new Date(customStart).getTime();
      const endMs = new Date(customEnd).getTime() + ONE_HOUR_MS;
      result = result.filter(r => r.timestamp >= startMs && r.timestamp <= endMs);
    }

    return result;
  }

  /**
   * Export telemetry to CSV formatted string
   */
  public exportCsv(recordsToExport: SyntheticTelemetryRecord[], equipmentLabel: string = 'Filtered'): string {
    const headers = [
      'Record_ID',
      'Equipment_ID',
      'Equipment_Name',
      'Lift_Type',
      'Timestamp_ISO',
      'Hour_Label',
      'Date_Label',
      'Intake_Pressure_PIP_psi',
      'Discharge_Pressure_PDP_psi',
      'Casing_Pressure_psi',
      'Tubing_Pressure_psi',
      'Motor_Temp_degF',
      'Intake_Temp_degF',
      'Wellhead_Temp_degF',
      'Oil_Flow_BOPD',
      'Water_Flow_BWPD',
      'Gas_Flow_MCFD',
      'Gross_Fluid_BPD',
      'Water_Cut_Pct',
      'Pump_RPM',
      'VFD_Frequency_Hz',
      'Motor_Current_Amps',
      'Motor_Voltage_Volts',
      'Power_kW',
      'Power_Factor',
      'Vibration_X_g',
      'Vibration_Y_g',
      'Vibration_Z_g',
      'Vibration_RMS_g',
      'ESP_Health_Score_Pct',
      'Pump_Efficiency_Pct',
      'Insulation_Resistance_Mohm',
      'Alarm_Active',
      'Alarm_Severity',
      'Alarm_Title',
      'Fleet_Active_Vehicles',
      'Fleet_Fuel_Gallons',
      'Fleet_Trips_Count',
      'Fleet_Utilization_Pct',
      'DATA_INTEGRITY_NOTICE',
    ];

    const rows = recordsToExport.map(r => [
      r.id,
      r.equipmentId,
      `"${r.equipmentName}"`,
      r.liftType,
      r.timestampIso,
      r.hourLabel,
      r.dateLabel,
      r.intakePressurePsi,
      r.dischargePressurePsi,
      r.casingPressurePsi,
      r.tubingPressurePsi,
      r.motorTempF,
      r.intakeTempF,
      r.wellheadTempF,
      r.oilFlowBopd,
      r.waterFlowBwpd,
      r.gasFlowMcfd,
      r.grossFluidBpd,
      r.waterCutPct,
      r.pumpRpm,
      r.vfdFrequencyHz,
      r.motorCurrentA,
      r.motorVoltageV,
      r.powerKw,
      r.powerFactor,
      r.vibrationX,
      r.vibrationY,
      r.vibrationZ,
      r.vibrationRmsG,
      r.espHealthScore,
      r.pumpEfficiencyPct,
      r.insulationResistanceMohm,
      r.hasAlarm ? 'TRUE' : 'FALSE',
      r.alarmSeverity,
      r.alarmTitle ? `"${r.alarmTitle}"` : '',
      r.fleetActiveVehicles,
      r.fleetFuelGallons,
      r.fleetTripsCount,
      r.fleetUtilizationPct,
      '"DEMO SIMULATED DATA - NOT REAL SCADA TELEMETRY"',
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}

// Export singleton instance
export const telemetryEngine = new SyntheticTelemetryEngine();
