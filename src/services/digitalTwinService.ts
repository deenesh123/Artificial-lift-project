import { DigitalTwinModelConfig } from '../types';

const TWIN_STORAGE_KEY = 'als_digital_twin_config_v1';

export interface TwinComponentTelemetry {
  id: string;
  name: string;
  category: 'Surface Power' | 'Wellhead' | 'Wellbore' | 'Downhole Lift' | 'Reservoir';
  depthFt: number;
  status: 'Optimal' | 'Warning' | 'Critical' | 'Offline';
  wearIndexPct: number;
  description: string;
  specs: string;
  metrics: {
    label: string;
    value: string | number;
    unit: string;
    normalMin?: number;
    normalMax?: number;
    isAlert?: boolean;
  }[];
}

export const DEFAULT_TWIN_CONFIG: DigitalTwinModelConfig = {
  wellId: 'ALS-DEL-ESP-104',
  resPressurePsi: 3850,
  productivityIndex: 1.25,
  waterCutPct: 59.8,
  gasOilRatioScfBbl: 1420,
  casingPressurePsi: 145,
  chokeSize64ths: 32,
  espDepthFt: 10200,
  motorRatingHp: 240,
  pumpStages: 182,
  vfdSpeedHz: 58.5,
  fluidGravityApi: 42.5,
  solverMethod: 'Vogel-BeggsBrill',
  wearFactorPct: 8.5,
  updatedAt: '2026-10-28T08:00:00Z',
};

export const DigitalTwinService = {
  getConfig(wellId: string = 'ALS-DEL-ESP-104'): DigitalTwinModelConfig {
    try {
      const data = localStorage.getItem(`${TWIN_STORAGE_KEY}_${wellId}`);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return { ...DEFAULT_TWIN_CONFIG, wellId };
  },

  saveConfig(config: DigitalTwinModelConfig): void {
    localStorage.setItem(`${TWIN_STORAGE_KEY}_${config.wellId}`, JSON.stringify(config));
    window.dispatchEvent(new Event('digital_twin_update'));
  },

  resetConfig(wellId: string = 'ALS-DEL-ESP-104'): DigitalTwinModelConfig {
    const config = { ...DEFAULT_TWIN_CONFIG, wellId, updatedAt: new Date().toISOString() };
    this.saveConfig(config);
    return config;
  },

  // Calculate dynamic component telemetry based on physical affinity laws
  getComponents(config: DigitalTwinModelConfig): TwinComponentTelemetry[] {
    const hzRatio = config.vfdSpeedHz / 58.5;
    const baseFlow = 2450 * hzRatio;
    const netOil = baseFlow * (1 - config.waterCutPct / 100);
    const intakePress = Math.max(250, Math.round(config.resPressurePsi - baseFlow / config.productivityIndex));
    const pumpHeadFt = Math.round(6200 * Math.pow(hzRatio, 2));
    const dischargePress = Math.round(intakePress + (pumpHeadFt * 0.35));
    const motorCurrentA = Math.round(52.4 * Math.pow(hzRatio, 1.5) * 10) / 10;
    const motorTempF = Math.round((180 + 18 * Math.pow(hzRatio, 2)) * 10) / 10;
    const vibrationG = Math.round((0.24 + 0.05 * Math.pow(hzRatio, 1.4)) * 100) / 100;
    const powerKw = Math.round(184 * Math.pow(hzRatio, 2.8));

    return [
      {
        id: 'comp-transformer',
        name: 'Surface Step-Up Transformer (SUT)',
        category: 'Surface Power',
        depthFt: 0,
        status: 'Optimal',
        wearIndexPct: 4,
        description: 'Oil-immersed heavy-duty outdoor step-up transformer converting 480V 3-phase grid/generator power to 4,160V medium voltage for downhole transmission.',
        specs: '1,000 kVA, 480V Delta Primary / 4160V Wye Secondary, ONAN Cooling',
        metrics: [
          { label: 'Primary Voltage', value: 478, unit: 'VAC', normalMin: 460, normalMax: 500 },
          { label: 'Secondary Output', value: 4152, unit: 'VAC', normalMin: 3950, normalMax: 4300 },
          { label: 'Insulating Oil Temp', value: 142, unit: '°F', normalMin: 80, normalMax: 185 },
          { label: 'Winding Load Factor', value: Math.round(powerKw / 8), unit: '%', normalMin: 10, normalMax: 90 },
        ],
      },
      {
        id: 'comp-vfd',
        name: 'Medium Voltage VFD Drive (Speed Controller)',
        category: 'Surface Power',
        depthFt: 0,
        status: config.vfdSpeedHz > 63 ? 'Warning' : 'Optimal',
        wearIndexPct: 11,
        description: 'Multi-pulse Pulse-Width Modulation (PWM) variable frequency drive providing smooth speed modulation, motor thermal protection, and harmonic mitigation.',
        specs: 'ALS-MV Drive 600 kVA, Active Front End (AFE) THD < 3%, Vector Control',
        metrics: [
          { label: 'Drive Frequency', value: config.vfdSpeedHz.toFixed(1), unit: 'Hz', normalMin: 45, normalMax: 65 },
          { label: 'DC Bus Voltage', value: Math.round(5850 * (config.vfdSpeedHz / 60)), unit: 'VDC', normalMin: 5200, normalMax: 6200 },
          { label: 'IGBT Junction Temp', value: Math.round(135 + (config.vfdSpeedHz - 50) * 1.8), unit: '°F', normalMin: 80, normalMax: 165 },
          { label: 'Total Power Draw', value: powerKw, unit: 'kW', normalMin: 100, normalMax: 260 },
        ],
      },
      {
        id: 'comp-wellhead',
        name: 'Surface Christmas Tree & Flow Manifold',
        category: 'Wellhead',
        depthFt: 0,
        status: 'Optimal',
        wearIndexPct: 6,
        description: 'API 6A 5,000 psi rated surface wellhead assembly, master valves, hydraulic surface safety valve (SSV), and adjustable production choke.',
        specs: '5-1/8" 5K Flanged, 316 Stainless Trim, Pneumatic Actuated ESD',
        metrics: [
          { label: 'Tubing Head Pressure', value: Math.round(245 * (baseFlow / 2450)), unit: 'psi', normalMin: 150, normalMax: 450 },
          { label: 'Casing Head Pressure', value: config.casingPressurePsi, unit: 'psi', normalMin: 50, normalMax: 300 },
          { label: 'Choke Orifice', value: `${config.chokeSize64ths}/64"`, unit: 'size', normalMin: 16, normalMax: 64 },
          { label: 'Wellhead Fluid Temp', value: Math.round(118 + (baseFlow - 2000) * 0.01), unit: '°F', normalMin: 80, normalMax: 150 },
        ],
      },
      {
        id: 'comp-flowline',
        name: 'Surface Flowline & Coriolis Production Skid',
        category: 'Wellhead',
        depthFt: 0,
        status: 'Optimal',
        wearIndexPct: 5,
        description: 'Multi-phase skid with Coriolis mass flowmeter, microwave water cut analyzer, and dual-chamber gas orifice run.',
        specs: 'Endress+Hauser Promass Coriolis & Phase Dynamics Microwave Water Cut',
        metrics: [
          { label: 'Gross Liquid Rate', value: Math.round(baseFlow), unit: 'BPD', normalMin: 1000, normalMax: 3500 },
          { label: 'Net Oil Production', value: Math.round(netOil), unit: 'BOPD', normalMin: 400, normalMax: 1500 },
          { label: 'Water Cut', value: config.waterCutPct.toFixed(1), unit: '%', normalMin: 20, normalMax: 90 },
          { label: 'Associated Gas Flow', value: Math.round(config.gasOilRatioScfBbl * netOil / 1000), unit: 'Mcfd', normalMin: 500, normalMax: 2500 },
        ],
      },
      {
        id: 'comp-cable',
        name: 'Downhole Power Cable (#4 AWG Monel Armor)',
        category: 'Wellbore',
        depthFt: 5100,
        status: 'Optimal',
        wearIndexPct: 14,
        description: 'High-temperature EPDM insulated, lead sheathed, Monel armored 3-conductor flat power cable strapped to production tubing down to the motor lead extension (MLE).',
        specs: '5 kV Rated, 450°F Max Temp, Continuous Lead Barrier, Monel 400 Armor',
        metrics: [
          { label: 'Total Cable Length', value: '10,400', unit: 'ft' },
          { label: 'Phase Insulation (IR)', value: 85.2, unit: 'MΩ', normalMin: 10, normalMax: 100 },
          { label: 'Cable Voltage Drop', value: Math.round(82 * (motorCurrentA / 52.4)), unit: 'VAC', normalMin: 40, normalMax: 120 },
          { label: 'Conductor Temp Avg', value: Math.round(168 + (motorCurrentA - 40) * 1.1), unit: '°F', normalMin: 100, normalMax: 250 },
        ],
      },
      {
        id: 'comp-discharge',
        name: 'ESP Discharge Head & Check Valve',
        category: 'Downhole Lift',
        depthFt: 9800,
        status: 'Optimal',
        wearIndexPct: 8,
        description: 'Tubing transition sub housing a spring-loaded flapper check valve and automatic drain valve to prevent back-spinning on shutdown.',
        specs: '2-7/8" EUE 8rd Box x Pump Bolt-on, Stellite Trim Non-Return Flapper',
        metrics: [
          { label: 'Discharge Pressure', value: dischargePress, unit: 'psi', normalMin: 2200, normalMax: 3500 },
          { label: 'Tubing Fluid Velocity', value: (baseFlow / 380).toFixed(1), unit: 'ft/s', normalMin: 3.0, normalMax: 9.0 },
          { label: 'Check Valve Status', value: 'Open (Seated Check)', unit: 'state' },
        ],
      },
      {
        id: 'comp-pump',
        name: 'Centrifugal Multi-Stage ESP Pump (182 Stages)',
        category: 'Downhole Lift',
        depthFt: 10050,
        status: vibrationG > 0.6 ? 'Warning' : 'Optimal',
        wearIndexPct: 9,
        description: 'Compression-style multi-stage centrifugal pump with Ni-Resist impellers and diffusers, stabilized with tungsten carbide bearings for sand tolerance.',
        specs: `${config.pumpStages} Stages, ALS-538 Series, 4.00" OD, BEP 2,200 BPD`,
        metrics: [
          { label: 'Developed Dynamic Head', value: pumpHeadFt, unit: 'ft', normalMin: 4500, normalMax: 7800 },
          { label: 'Differential Pressure (ΔP)', value: dischargePress - intakePress, unit: 'psi', normalMin: 1500, normalMax: 2800 },
          { label: 'Impeller Hydraulic Eff.', value: Math.round(72 * (1 - Math.abs(baseFlow - 2200) / 4000)), unit: '%', normalMin: 50, normalMax: 80 },
          { label: 'Triaxial Vibration', value: vibrationG, unit: 'g RMS', normalMin: 0.1, normalMax: 0.5 },
        ],
      },
      {
        id: 'comp-separator',
        name: 'Vortex Gas Separator & Pump Intake Sub',
        category: 'Downhole Lift',
        depthFt: 10180,
        status: intakePress < 500 ? 'Warning' : 'Optimal',
        wearIndexPct: 12,
        description: 'Rotary vortex separator using centrifugal force to separate free casing gas from liquid before fluid enters the first pump stage, venting gas up the annulus.',
        specs: 'Vortex-AGS 400, 85% Gas Separation Efficiency up to 40% Free Gas',
        metrics: [
          { label: 'Intake Pressure (PIP)', value: intakePress, unit: 'psi', normalMin: 500, normalMax: 1500 },
          { label: 'Intake Fluid Temp', value: Math.round(188 + (motorTempF - 198) * 0.3), unit: '°F', normalMin: 150, normalMax: 220 },
          { label: 'Free Gas In Intake', value: Math.round(12 * (1000 / intakePress)), unit: '% Vol', normalMin: 2, normalMax: 25 },
          { label: 'Venting Efficiency', value: 84, unit: '%', normalMin: 70, normalMax: 95 },
        ],
      },
      {
        id: 'comp-protector',
        name: 'Protector / Seal Chamber (Triple Bag Modular)',
        category: 'Downhole Lift',
        depthFt: 10220,
        status: 'Optimal',
        wearIndexPct: 7,
        description: 'Tandem elastomeric bag seal section protecting the downhole motor from well fluid ingress, absorbing downhole thrust load, and equalizing thermal expansion.',
        specs: 'Triple Aflas Bag + Mechanical Silicon Carbide Face Seals, 25,000 lbs Thrust',
        metrics: [
          { label: 'Downhole Axial Thrust', value: Math.round(11200 * Math.pow(hzRatio, 1.6)), unit: 'lbs', normalMin: 6000, normalMax: 18000 },
          { label: 'Barrier Dielectric Oil', value: 'Clean Synthetic Polyol', unit: 'grade' },
          { label: 'Seal Contamination', value: '< 0.05', unit: '% H2O', normalMin: 0, normalMax: 0.2 },
          { label: 'Thrust Bearing Temp', value: Math.round(motorTempF - 12), unit: '°F', normalMin: 140, normalMax: 230 },
        ],
      },
      {
        id: 'comp-motor',
        name: 'Downhole PMM Motor (Permanent Magnet 240 HP)',
        category: 'Downhole Lift',
        depthFt: 10320,
        status: motorTempF > 230 ? 'Warning' : 'Optimal',
        wearIndexPct: 10,
        description: 'Synchronous permanent magnet motor (PMM) offering 93% electrical efficiency, high torque density, and lower operating heat than standard induction motors.',
        specs: `${config.motorRatingHp} HP, 3,850 VAC, 52.4 A, Class H 400°F Stator Insulation`,
        metrics: [
          { label: 'Stator Winding Temp', value: motorTempF, unit: '°F', normalMin: 160, normalMax: 245 },
          { label: 'Motor Current', value: motorCurrentA, unit: 'Amps', normalMin: 35, normalMax: 60 },
          { label: 'Power Factor (cos φ)', value: 0.94, unit: 'pf', normalMin: 0.88, normalMax: 0.98 },
          { label: 'Motor Speed', value: Math.round(config.vfdSpeedHz * 60), unit: 'RPM', normalMin: 2700, normalMax: 3900 },
        ],
      },
      {
        id: 'comp-gauge',
        name: 'Downhole Phoenix Quartz Crystal Sensor Sub',
        category: 'Downhole Lift',
        depthFt: 10380,
        status: 'Optimal',
        wearIndexPct: 3,
        description: 'Multi-parameter quartz sensor telemetry instrument mounted at the motor base transmitting real-time intake/discharge pressure, internal motor temp, and triaxial vibration.',
        specs: 'Phoenix 20K Quartz Transducer, 0.01 psi Resolution, 350°F Rating',
        metrics: [
          { label: 'Sensor Quartz Pressure', value: intakePress, unit: 'psi', normalMin: 400, normalMax: 2000 },
          { label: 'Internal Temp RTD', value: motorTempF, unit: '°F', normalMin: 140, normalMax: 250 },
          { label: 'Z-Axis Vibration', value: (vibrationG * 0.85).toFixed(2), unit: 'g RMS', normalMin: 0.05, normalMax: 0.5 },
          { label: 'Telemetry Signal S/N', value: '44 dB (Clean Carrier)', unit: 'SNR' },
        ],
      },
      {
        id: 'comp-reservoir',
        name: 'Wolfcamp A Perforated Horizon & Reservoir',
        category: 'Reservoir',
        depthFt: 11450,
        status: 'Optimal',
        wearIndexPct: 1,
        description: 'Organic-rich Wolfcamp A shale bench completed with 45 hydraulic fracturing stages across 10,000 ft horizontal lateral section.',
        specs: `Total Vertical Depth 11,450 ft, Measured Depth 21,800 ft, API 42.5°`,
        metrics: [
          { label: 'Reservoir Static Press', value: config.resPressurePsi, unit: 'psi', normalMin: 3000, normalMax: 4500 },
          { label: 'Productivity Index (PI)', value: config.productivityIndex.toFixed(2), unit: 'bbl/d/psi', normalMin: 0.5, normalMax: 3.0 },
          { label: 'Drawdown Pressure (ΔP)', value: Math.round(config.resPressurePsi - intakePress), unit: 'psi', normalMin: 1000, normalMax: 3500 },
          { label: 'Flowing Bottomhole Press', value: intakePress + 320, unit: 'psi', normalMin: 600, normalMax: 2500 },
        ],
      },
    ];
  },

  // Calculate Nodal Analysis points (IPR vs VLP curves)
  getNodalCurveData(config: DigitalTwinModelConfig) {
    const points = [];
    const maxFlow = 3600;
    const qStep = 200;
    const hzRatio = config.vfdSpeedHz / 58.5;
    const pumpBoostPsi = Math.round(1850 * Math.pow(hzRatio, 1.8));

    for (let q = 0; q <= maxFlow; q += qStep) {
      // Inflow Performance Relationship (Vogel for solution-gas drive reservoirs)
      // Pwf = Pr * (1 - 0.2*(Q/Qmax) - 0.8*(Q/Qmax)^2)
      const qMax = config.productivityIndex * config.resPressurePsi * 0.8;
      const qFrac = Math.min(1.0, q / qMax);
      const iprPwf = Math.max(0, Math.round(config.resPressurePsi * (1 - 0.2 * qFrac - 0.8 * Math.pow(qFrac, 2))));

      // Vertical Lift Performance (VLP)
      // Pwf = Pwh + Hydrostatic + Friction - Pump_Head_Boost
      const friction = Math.pow(q / 1000, 1.8) * 190;
      const hydrostatic = 3200 * (1 + (config.waterCutPct - 50) * 0.002);
      const vlpPwf = Math.max(0, Math.round(config.casingPressurePsi + 120 + hydrostatic + friction - pumpBoostPsi));

      points.push({
        flowRateBpd: q,
        iprPwfPsi: iprPwf,
        vlpPwfPsi: vlpPwf,
      });
    }

    // Operating point
    const operatingFlowRate = Math.round(2450 * hzRatio);
    const operatingPwf = Math.max(300, Math.round(config.resPressurePsi - operatingFlowRate / config.productivityIndex));

    return { points, operatingFlowRate, operatingPwf };
  },

  // Calculate Depth Gradient points from surface to TD
  getDepthGradient(config: DigitalTwinModelConfig) {
    const hzRatio = config.vfdSpeedHz / 58.5;
    const intakeP = Math.max(300, Math.round(config.resPressurePsi - (2450 * hzRatio) / config.productivityIndex));
    const dischargeP = Math.round(intakeP + 6200 * Math.pow(hzRatio, 2) * 0.35);

    return [
      { depthFt: 0, pressurePsi: Math.round(245 * hzRatio), tempF: 118, label: 'Wellhead / Surface Tree' },
      { depthFt: 2500, pressurePsi: Math.round(790 * hzRatio), tempF: 136, label: 'Intermediate Casing Shoe' },
      { depthFt: 5500, pressurePsi: Math.round(1680 * hzRatio), tempF: 160, label: 'Kickoff Point (KOP)' },
      { depthFt: 9800, pressurePsi: dischargeP, tempF: 184, label: 'ESP Discharge Sub' },
      { depthFt: 10200, pressurePsi: intakeP, tempF: 198, label: 'ESP Intake / Gas Separator' },
      { depthFt: 11450, pressurePsi: config.resPressurePsi, tempF: 226, label: 'Wolfcamp A Perforations' },
    ];
  },
};
