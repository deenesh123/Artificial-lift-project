import { 
  AlarmItem, 
  OperationalEvent, 
  WorkOrderJob, 
  FailureIncident, 
  JobWorkflowStage, 
  JobWorkflowType,
  AlarmComment
} from '../types';

const STORAGE_KEYS = {
  ALARMS: 'als_storage_alarms_v2',
  EVENTS: 'als_storage_events_v2',
  JOBS: 'als_storage_jobs_v2',
  FAILURES: 'als_storage_failures_v2',
};

export const INITIAL_ALARMS: AlarmItem[] = [
  {
    id: 'ALM-8901',
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    liftType: 'Rod Pump',
    severity: 'Urgent',
    category: 'Mechanical',
    title: 'Severe Fluid Pound Detected on Downstroke',
    description: 'Acoustic fluid level test confirms incomplete pump fillage (32%). Severe impact shock loading detected at bottom of stroke, causing excessive rod string stress and coupling wear risk.',
    parameter: 'Pump Fillage % / Impact Load',
    currentValue: '32% fillage / 24.8 klb peak',
    setpointLimit: '< 50% fillage threshold',
    timestamp: '2026-10-28 06:14:22 UTC',
    acknowledged: false,
    assignedEngineer: 'David Chen',
    resolutionStatus: 'Active',
    comments: [
      {
        id: 'c-1',
        author: 'Elena Rostova',
        authorRole: 'SCADA Surveillance Controller',
        timestamp: '2026-10-28 06:20:00 UTC',
        text: 'Noticed fluid pound card pattern emerging after 05:00 UTC. Reduced SPM from 6.2 to 5.4 remotely.',
      },
      {
        id: 'c-2',
        author: 'David Chen',
        authorRole: 'Downhole Reliability Specialist',
        timestamp: '2026-10-28 06:45:10 UTC',
        text: 'Dispatched Slickline crew (SL-04) to measure acoustic fluid level and check downhole gas anchor.',
      }
    ],
  },
  {
    id: 'ALM-8902',
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    liftType: 'ESP',
    severity: 'High',
    category: 'Thermal',
    title: 'High Downhole Motor Winding Temperature',
    description: 'Motor internal RTD indicates temperature exceeding warning limit (238.6°F). Possible inadequate fluid flow velocity past motor shroud or scale build-up on motor housing.',
    parameter: 'Downhole Motor Temp (°F)',
    currentValue: '238.6 °F',
    setpointLimit: 'Warning > 225 °F / Trip @ 250 °F',
    timestamp: '2026-10-28 05:42:11 UTC',
    acknowledged: true,
    acknowledgedBy: 'Carlos Reyes, PE',
    acknowledgedAt: '2026-10-28 05:50:00 UTC',
    assignedEngineer: 'Carlos Reyes, PE',
    resolutionStatus: 'Under Investigation',
    comments: [
      {
        id: 'c-3',
        author: 'Carlos Reyes, PE',
        authorRole: 'Senior Optimization Engineer',
        timestamp: '2026-10-28 05:52:00 UTC',
        text: 'Trimmed VFD frequency from 58.5 Hz to 54.0 Hz to lower motor electrical load while monitoring casing pressure.',
      }
    ],
  },
  {
    id: 'ALM-8903',
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    liftType: 'ESP',
    severity: 'High',
    category: 'Mechanical',
    title: 'Radial Vibration Spike (X-Y Axis)',
    description: 'Triaxial downhole vibration sensor reads 0.62g RMS. Potential incipient impeller abrasion or gas breakthrough causing cyclic cavitation.',
    parameter: 'Vibration RMS (g)',
    currentValue: '0.62 g',
    setpointLimit: 'Warning > 0.50 g',
    timestamp: '2026-10-28 04:19:05 UTC',
    acknowledged: false,
    assignedEngineer: 'Carlos Reyes, PE',
    resolutionStatus: 'Active',
    comments: [],
  },
  {
    id: 'ALM-8904',
    wellId: 'ALS-DEL-ESP-099',
    wellName: 'Silver Spur 99-1H',
    liftType: 'ESP',
    severity: 'Urgent',
    category: 'Electrical',
    title: 'VFD Underload Trip / Phase Imbalance',
    description: 'Drive locked out following three automatic restart attempts. Phase C insulation resistance dropped below 0.5 Megaohms. Field dispatch requested for ground check.',
    parameter: 'Phase Resistance / Motor Current',
    currentValue: '0.38 MΩ / 0.0 A',
    setpointLimit: 'Trip < 1.0 MΩ',
    timestamp: '2026-10-28 02:08:44 UTC',
    acknowledged: true,
    acknowledgedBy: 'Marcus Vance',
    acknowledgedAt: '2026-10-28 02:15:00 UTC',
    assignedEngineer: 'David Chen',
    resolutionStatus: 'Under Investigation',
    comments: [
      {
        id: 'c-4',
        author: 'David Chen',
        authorRole: 'Downhole Reliability Specialist',
        timestamp: '2026-10-28 02:30:00 UTC',
        text: 'Megger test confirmed low resistance to ground at wellhead junction box. Testing downhole MLE cable next.',
      }
    ],
  },
  {
    id: 'ALM-8905',
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    liftType: 'ESP',
    severity: 'Medium',
    category: 'Hydrodynamic',
    title: 'Intake Pressure Depletion Trending Below Target',
    description: 'Downhole Phoenix gauge reports pump intake pressure (PIP) trending down to 840 psi. Near critical gas breakout boundary in Wolfcamp A bench.',
    parameter: 'Pump Intake Pressure (psi)',
    currentValue: '840.2 psi',
    setpointLimit: 'Target: 950 - 1,200 psi',
    timestamp: '2026-10-28 01:30:19 UTC',
    acknowledged: true,
    acknowledgedBy: 'Elena Rostova',
    acknowledgedAt: '2026-10-28 01:45:00 UTC',
    assignedEngineer: 'Carlos Reyes, PE',
    resolutionStatus: 'Resolved',
    resolvedBy: 'Carlos Reyes, PE',
    resolvedAt: '2026-10-28 03:00:00 UTC',
    resolutionNotes: 'Adjusted surface casing gas backpressure regulator to stabilize fluid column over intake sub.',
    comments: [],
  },
  {
    id: 'ALM-8906',
    wellId: 'ALS-BAK-PCP-005',
    wellName: 'Fort Berthold 05-1H',
    liftType: 'PCP',
    severity: 'Low',
    category: 'Thermal',
    title: 'Drive Head Polish Rod Stuffing Box Temp',
    description: 'Surface optical infrared sensor registers packing gland temperature of 172°F. Recommended routine lubrication grease injection.',
    parameter: 'Stuffing Box Temp (°F)',
    currentValue: '172.0 °F',
    setpointLimit: 'Caution > 165 °F',
    timestamp: '2026-10-27 23:11:00 UTC',
    acknowledged: false,
    resolutionStatus: 'Active',
    comments: [],
  },
  {
    id: 'ALM-8907',
    wellId: 'ALS-MID-ESP-215',
    wellName: 'Midland Basin Ranch 215-2H',
    liftType: 'ESP',
    severity: 'Low',
    category: 'Communication',
    title: 'Cellular Gateway Fallback Signal Degraded',
    description: 'Primary satellite link intermittent; edge RTU successfully switched to backup LTE carrier with +32ms latency.',
    parameter: 'Cellular RSSI / Latency',
    currentValue: '-88 dBm / 54 ms',
    setpointLimit: 'Warning < -85 dBm',
    timestamp: '2026-10-27 20:45:32 UTC',
    acknowledged: true,
    acknowledgedBy: 'Elena Rostova',
    assignedEngineer: 'Elena Rostova',
    resolutionStatus: 'Resolved',
    resolvedBy: 'Elena Rostova',
    resolvedAt: '2026-10-27 22:00:00 UTC',
    resolutionNotes: 'Cell tower antenna orientation checked; primary satellite link re-synchronized.',
    comments: [],
  },
];

export const INITIAL_EVENTS: OperationalEvent[] = [
  {
    id: 'EVT-7041',
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    timestamp: '2026-10-28 05:48:00 UTC',
    eventType: 'Setpoint Changed',
    user: 'c.reyes@als-operations.demo',
    description: 'Reduced VFD frequency from 58.5 Hz to 54.0 Hz in response to motor temperature alarm ALM-8902.',
    severity: 'Action',
    subsystem: 'ESP Surface Drive',
    parameterChanged: 'VFD Frequency Setpoint',
    previousValue: '58.5 Hz',
    newValue: '54.0 Hz',
  },
  {
    id: 'EVT-7042',
    wellId: 'ALS-DEL-ESP-099',
    wellName: 'Silver Spur 99-1H',
    timestamp: '2026-10-28 02:08:44 UTC',
    eventType: 'VFD Trip',
    user: 'SCADA Automation Daemon',
    description: 'Underload protection tripped drive after 3 restart attempts. Motor insulation resistance low.',
    severity: 'Action',
    subsystem: 'ESP Surface Drive',
    parameterChanged: 'Drive State',
    previousValue: 'RUNNING',
    newValue: 'LOCKED OUT',
  },
  {
    id: 'EVT-7043',
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    timestamp: '2026-10-28 01:45:12 UTC',
    eventType: 'Choke Adjustment',
    user: 'e.rostova@als-operations.demo',
    description: 'Trimmed surface production choke from 34/64" to 32/64" to maintain 245 psi tubing head pressure.',
    severity: 'Info',
    subsystem: 'Christmas Tree',
    parameterChanged: 'Choke Orifice',
    previousValue: '34/64"',
    newValue: '32/64"',
  },
  {
    id: 'EVT-7044',
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    timestamp: '2026-10-27 22:15:00 UTC',
    eventType: 'Setpoint Changed',
    user: 'd.chen@als-operations.demo',
    description: 'Adjusted Rod Pump Controller strokes per minute down to 5.4 SPM due to downhole fluid pound shock.',
    severity: 'Warning',
    subsystem: 'ESP Surface Drive',
    parameterChanged: 'Surface Pumping Speed',
    previousValue: '6.2 SPM',
    newValue: '5.4 SPM',
  },
  {
    id: 'EVT-7045',
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    timestamp: '2026-10-27 18:30:00 UTC',
    eventType: 'Chemical Treatment',
    user: 'm.vance@als-operations.demo',
    description: 'Continuous capillary scale inhibitor batch injection confirmed at 1.8 gal/day into downhole tubing.',
    severity: 'Info',
    subsystem: 'Chemical Injection',
    parameterChanged: 'Inhibitor Dosage',
    previousValue: '1.4 gal/d',
    newValue: '1.8 gal/d',
  },
  {
    id: 'EVT-7046',
    wellId: 'ALS-BAK-PCP-005',
    wellName: 'Fort Berthold 05-1H',
    timestamp: '2026-10-27 14:10:00 UTC',
    eventType: 'Sensor Calibration',
    user: 'c.reyes@als-operations.demo',
    description: 'Calibrated surface hydraulic pressure transducer with deadweight tester standard.',
    severity: 'Info',
    subsystem: 'Downhole Sensor',
    parameterChanged: 'Zero Offset',
    previousValue: '0.4 psi',
    newValue: '0.0 psi',
  },
  {
    id: 'EVT-7047',
    wellId: 'ALS-DEL-ESP-099',
    wellName: 'Silver Spur 99-1H',
    timestamp: '2026-10-27 09:00:00 UTC',
    eventType: 'Well Shut-in',
    user: 's.jenkins@als-operations.demo',
    description: 'Approved temporary electrical shut-in for downhole cable splice troubleshooting.',
    severity: 'Action',
    subsystem: 'Christmas Tree',
    parameterChanged: 'Well Operating Status',
    previousValue: 'Nominal',
    newValue: 'Offline',
  },
];

export const INITIAL_JOBS: WorkOrderJob[] = [
  {
    id: 'JOB-2026-081',
    wellId: 'ALS-DEL-ESP-099',
    wellName: 'Silver Spur 99-1H',
    title: 'Emergency Workover: ESP Pull & Replacement String',
    type: 'ESP Replacement',
    priority: 'Immediate',
    status: 'In Progress',
    stage: 'On-Site Execution',
    responsibleEngineer: 'Carlos Reyes, PE',
    assignedCrew: 'Permian Rig Crew 4 (Workover Rig #12)',
    assignedVehicleId: 'UNIT-CRANE-01',
    equipmentRef: 'ESP-SYS-099 / Reda Centrilift 182-Stage',
    createdDate: '2026-10-28',
    scheduledDate: '2026-10-28',
    estimatedHours: 48,
    actualHours: 14,
    notes: 'VFD phase C ground fault confirmed downhole. Workover rig mobilizing to unseat tubing hanger, pull damaged cable and string, and install replacement ALS-538 assembly.',
    auditHistory: [
      {
        id: 'aud-1',
        stage: 'Draft / Requested',
        timestamp: '2026-10-28 02:30:00 UTC',
        user: 'David Chen',
        notes: 'Job ticket drafted following underload lockout and megger test.',
      },
      {
        id: 'aud-2',
        stage: 'Pending Engineering Review',
        timestamp: '2026-10-28 03:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'Reviewed pull schedule; approved replacement string ALS-538 176-stage.',
      },
      {
        id: 'aud-3',
        stage: 'Scheduled & Mobilizing',
        timestamp: '2026-10-28 03:45:00 UTC',
        user: 'Marcus Vance',
        notes: 'Workover rig #12 and crane unit UNIT-CRANE-01 dispatched to location.',
      },
      {
        id: 'aud-4',
        stage: 'On-Site Execution',
        timestamp: '2026-10-28 06:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'BOP stack tested and installed. Rig pulling tubing joint #42.',
      }
    ],
  },
  {
    id: 'JOB-2026-079',
    wellId: 'ALS-DEL-ESP-082',
    wellName: 'Red River Federal 82-4H',
    title: 'Downhole Motor Lead Extension (MLE) & Cable Inspection',
    type: 'MLE',
    priority: 'High',
    status: 'Scheduled',
    stage: 'Scheduled & Mobilizing',
    responsibleEngineer: 'David Chen',
    assignedCrew: 'Wireline Specialist Crew Bravo',
    assignedVehicleId: 'UNIT-WIRE-03',
    equipmentRef: 'CBL-MONEL-082 / Motor Lead Extension Sub',
    createdDate: '2026-10-27',
    scheduledDate: '2026-10-29',
    estimatedHours: 16,
    notes: 'High-temperature motor winding telemetry alert. Scheduled to inspect wellhead penetrator, surface pothead, and downhole MLE transition splice with mobile instrumentation lab.',
    auditHistory: [
      {
        id: 'aud-5',
        stage: 'Draft / Requested',
        timestamp: '2026-10-27 16:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'Requested specialized MLE electrical integrity test.',
      },
      {
        id: 'aud-6',
        stage: 'Pending Engineering Review',
        timestamp: '2026-10-27 18:00:00 UTC',
        user: 'David Chen',
        notes: 'Assigned wireline crew and booked mobile test lab.',
      },
      {
        id: 'aud-7',
        stage: 'Scheduled & Mobilizing',
        timestamp: '2026-10-28 04:00:00 UTC',
        user: 'David Chen',
        notes: 'Scheduled on-pad arrival for tomorrow 07:00 local time.',
      }
    ],
  },
  {
    id: 'JOB-2026-075',
    wellId: 'ALS-DEL-ESP-104',
    wellName: 'Phantom State 104-2H',
    title: 'New Well Completion: ESP Installation & Commissioning',
    type: 'ESP Installation',
    priority: 'Normal',
    status: 'Completed',
    stage: 'Completed & Closed',
    responsibleEngineer: 'Carlos Reyes, PE',
    assignedCrew: 'ESP Field Service Team Alpha',
    assignedVehicleId: 'UNIT-CRANE-01',
    equipmentRef: 'ESP-SYS-104 (ALS-538 182-Stage)',
    createdDate: '2026-10-20',
    scheduledDate: '2026-10-22',
    completedDate: '2026-10-24',
    estimatedHours: 36,
    actualHours: 34,
    notes: 'Ran and set 182-stage centrifugal ESP with vortex gas separator and tandem seal bag at 10,200 ft. Spun up to 58.5 Hz cleanly.',
    completionNotes: 'All electrical Megger tests passed (> 100 MΩ). 24-hour continuous burn-in test completed with zero trip events.',
    auditHistory: [
      {
        id: 'aud-8',
        stage: 'Draft / Requested',
        timestamp: '2026-10-20 09:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'Well completion handover from drilling rig.',
      },
      {
        id: 'aud-9',
        stage: 'On-Site Execution',
        timestamp: '2026-10-22 08:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'ESP assembly made up and lowered into 5.5" casing.',
      },
      {
        id: 'aud-10',
        stage: 'Quality & Testing',
        timestamp: '2026-10-23 18:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'Pressure test to 3,500 psi held for 30 minutes.',
      },
      {
        id: 'aud-11',
        stage: 'Completed & Closed',
        timestamp: '2026-10-24 16:00:00 UTC',
        user: 'Marcus Vance',
        notes: 'Signed off and transitioned well to automated SCADA monitoring.',
      }
    ],
  },
  {
    id: 'JOB-2026-077',
    wellId: 'ALS-EF-ROD-019',
    wellName: 'Canyon Creek 19-3H',
    title: 'Acoustic Fluid Level & Dynamometer Troubleshooting',
    type: 'Troubleshooting',
    priority: 'High',
    status: 'In Progress',
    stage: 'On-Site Execution',
    responsibleEngineer: 'David Chen',
    assignedCrew: 'Field Reliability Techs',
    assignedVehicleId: 'UNIT-SLICK-04',
    equipmentRef: 'PMP-ROD-019 (Lufkin Mark II 640D)',
    createdDate: '2026-10-28',
    scheduledDate: '2026-10-28',
    estimatedHours: 8,
    actualHours: 2,
    notes: 'Conducting wellhead echo-meter acoustic shoot to verify distance to fluid column and diagnose severe fluid pound downstroke.',
    auditHistory: [
      {
        id: 'aud-12',
        stage: 'Draft / Requested',
        timestamp: '2026-10-28 06:30:00 UTC',
        user: 'David Chen',
        notes: 'Generated ticket following critical dyno card alarm.',
      },
      {
        id: 'aud-13',
        stage: 'On-Site Execution',
        timestamp: '2026-10-28 07:15:00 UTC',
        user: 'David Chen',
        notes: 'Slickline acoustic gun hooked up to wellhead casing valve.',
      }
    ],
  },
  {
    id: 'JOB-2026-072',
    wellId: 'ALS-DEL-ESP-112',
    wellName: 'War Admiral 112-1H',
    title: 'Downhole Power Cable Sheath & Armor Re-banding',
    type: 'Cable',
    priority: 'Normal',
    status: 'Scheduled',
    stage: 'Pending Engineering Review',
    responsibleEngineer: 'Carlos Reyes, PE',
    assignedCrew: 'Wireline Spooling Crew',
    equipmentRef: '#4 AWG Flat Monel Armor (12,200 ft)',
    createdDate: '2026-10-26',
    scheduledDate: '2026-11-02',
    estimatedHours: 20,
    notes: 'Planned preventative maintenance to replace cable protector cross-couplings and re-torque tubing bands.',
    auditHistory: [
      {
        id: 'aud-14',
        stage: 'Draft / Requested',
        timestamp: '2026-10-26 11:00:00 UTC',
        user: 'Carlos Reyes, PE',
        notes: 'Scheduled for next planned rig slot.',
      }
    ],
  },
  {
    id: 'JOB-2026-068',
    wellId: 'ALS-BAK-PCP-005',
    wellName: 'Fort Berthold 05-1H',
    title: 'PCP Surface Drive Head & Hydraulic Pack Inspection',
    type: 'Inspection',
    priority: 'Normal',
    status: 'Completed',
    stage: 'Completed & Closed',
    responsibleEngineer: 'David Chen',
    assignedCrew: 'Bakken Mechanical Field Service',
    equipmentRef: 'PMP-PCP-005 / Moyno Direct Drive',
    createdDate: '2026-10-15',
    scheduledDate: '2026-10-18',
    completedDate: '2026-10-18',
    estimatedHours: 6,
    actualHours: 5,
    notes: 'Annual mechanical inspection of drive head bearings, belt tension, and hydraulic braking backspin arrestor.',
    completionNotes: 'Replaced elastomeric packing seals and replenished synthetic gear oil. Verified zero vibration.',
    auditHistory: [
      {
        id: 'aud-15',
        stage: 'Completed & Closed',
        timestamp: '2026-10-18 17:00:00 UTC',
        user: 'David Chen',
        notes: 'Routine service completed on schedule.',
      }
    ],
  },
];

export const INITIAL_FAILURES: FailureIncident[] = [
  {
    id: 'FAIL-2026-012',
    wellId: 'ALS-DEL-ESP-099',
    wellName: 'Silver Spur 99-1H',
    liftType: 'ESP',
    failureDate: '2026-10-28',
    runLifeDays: 242,
    rootCauseCategory: 'Electrical Insulation Breakdown',
    reasonCode: 'FAIL-ELEC-MLE-03',
    failedComponent: 'MLE Cable',
    equipmentRef: 'ESP-SYS-099 (#4 AWG Lead-Sheathed MLE)',
    costImpactUsd: 145000,
    downtimeHours: 72,
    deferredProductionBbl: 2150,
    rootCauseFindings: 'Teardown inspection revealed mechanical pinching of the Motor Lead Extension (MLE) cable against the casing wall at 10,150 ft depth during thermal expansion cycling. Led to dielectric breakdown and phase-to-ground arc.',
    correctiveActions: '1. Upgraded to continuous heavy-duty cast steel cross-coupling cable protectors across entire motor section. 2. Installed temperature derating curve on surface VFD controller.',
    resolutionStatus: 'Replacement In-Progress',
    assignedEngineer: 'David Chen',
    notes: 'Rig #12 currently on location for string pull and failure verification.',
  },
  {
    id: 'FAIL-2026-009',
    wellId: 'ALS-DEL-ESP-044',
    wellName: 'Loving County State 44-3H',
    liftType: 'ESP',
    failureDate: '2026-09-14',
    runLifeDays: 310,
    rootCauseCategory: 'Gas Locking',
    reasonCode: 'FAIL-GAS-SEP-01',
    failedComponent: 'Gas Separator',
    equipmentRef: 'ESP-SYS-044 (Reverse-Flow Separator)',
    costImpactUsd: 185000,
    downtimeHours: 96,
    deferredProductionBbl: 3200,
    rootCauseFindings: 'Severe casing gas slugging (GOR exceeded 2,800 scf/bbl) overpowered standard reverse-flow separator intake port, causing persistent vapor lock and dry-run cavitation of lower 20 pump stages.',
    correctiveActions: 'Replaced intake with high-efficiency Active Rotary Vortex Gas Separator (AGS-400) and installed automated SCADA gas-venting protocol on casing annulus.',
    resolutionStatus: 'Resolved',
    assignedEngineer: 'Carlos Reyes, PE',
    closedDate: '2026-09-22',
    notes: 'Well restored to production. Post-workover GOR handled without cavitation.',
  },
  {
    id: 'FAIL-2026-006',
    wellId: 'ALS-MID-ESP-210',
    wellName: 'Midland Basin Ranch 210-4H',
    liftType: 'ESP',
    failureDate: '2026-08-02',
    runLifeDays: 185,
    rootCauseCategory: 'Sand / Solids Erosion',
    reasonCode: 'FAIL-SAND-IMP-02',
    failedComponent: 'Pump Impellers',
    equipmentRef: 'ESP-SYS-210 (Ni-Resist Type 1)',
    costImpactUsd: 165000,
    downtimeHours: 84,
    deferredProductionBbl: 2400,
    rootCauseFindings: 'Heavy frac sand flowback in first 6 months cut balance holes and diffuser vanes, degrading total developed dynamic head by 40%.',
    correctiveActions: 'Replaced pump with hardened Tungsten-Carbide radial bearing assembly and installed downhole ceramic desander screen below motor shroud.',
    resolutionStatus: 'Resolved',
    assignedEngineer: 'Carlos Reyes, PE',
    closedDate: '2026-08-10',
    notes: 'Sand concentration dropped from 45 lb/1,000 bbl to < 2 lb/1,000 bbl.',
  },
  {
    id: 'FAIL-2026-003',
    wellId: 'ALS-EF-ROD-014',
    wellName: 'Eagle Ford Unit 14-2H',
    liftType: 'Rod Pump',
    failureDate: '2026-06-19',
    runLifeDays: 420,
    rootCauseCategory: 'Mechanical Wear',
    reasonCode: 'FAIL-ROD-PART-04',
    failedComponent: 'Rod String',
    equipmentRef: 'PMP-ROD-014 (7/8" Grade D Sucker Rods)',
    costImpactUsd: 42000,
    downtimeHours: 36,
    deferredProductionBbl: 750,
    rootCauseFindings: 'Rod parting at 6,400 ft due to dogleg severity (DLS 4.8°/100ft) and cyclic side-loading friction against tubing wall.',
    correctiveActions: 'Installed 36 molded wheeled rod guides along deviation profile and applied continuous filming amine corrosion inhibitor.',
    resolutionStatus: 'Resolved',
    assignedEngineer: 'David Chen',
    closedDate: '2026-06-23',
    notes: 'Pulled fish in single run. Rod string re-spaced and running smoothly.',
  },
  {
    id: 'FAIL-2026-001',
    wellId: 'ALS-BAK-PCP-002',
    wellName: 'Bakken Ridge 02-1H',
    liftType: 'PCP',
    failureDate: '2026-04-11',
    runLifeDays: 290,
    rootCauseCategory: 'Scale Deposition',
    reasonCode: 'FAIL-SCALE-STAT-07',
    failedComponent: 'Motor',
    equipmentRef: 'PMP-PCP-002 / NBR Elastomer Stator',
    costImpactUsd: 68000,
    downtimeHours: 48,
    deferredProductionBbl: 1100,
    rootCauseFindings: 'Barium sulfate (BaSO4) scale deposition choked stator rotor cavities, dramatically increasing drive head torque and tearing elastomer lining.',
    correctiveActions: 'Installed continuous capillary downhole scale squeeze chemical treatment and upgraded stator to high-durability HNBR elastomer.',
    resolutionStatus: 'Resolved',
    assignedEngineer: 'David Chen',
    closedDate: '2026-04-18',
    notes: 'Scale coupons inspected monthly with zero reoccurrence.',
  },
];

export const OperationsService = {
  // Alarms
  getAlarms(): AlarmItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALARMS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_ALARMS;
  },

  saveAlarms(alarms: AlarmItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ALARMS, JSON.stringify(alarms));
    window.dispatchEvent(new Event('operations_update'));
  },

  acknowledgeAlarm(id: string, engineerName: string = 'Current Operator'): AlarmItem[] {
    const alarms = this.getAlarms();
    const updated = alarms.map(a => a.id === id ? {
      ...a,
      acknowledged: true,
      acknowledgedBy: engineerName,
      acknowledgedAt: new Date().toISOString()
    } : a);
    this.saveAlarms(updated);
    return updated;
  },

  assignAlarm(id: string, engineerName: string): AlarmItem[] {
    const alarms = this.getAlarms();
    const updated = alarms.map(a => a.id === id ? {
      ...a,
      assignedEngineer: engineerName,
      resolutionStatus: a.resolutionStatus === 'Active' ? 'Under Investigation' as const : a.resolutionStatus
    } : a);
    this.saveAlarms(updated);
    return updated;
  },

  addAlarmComment(id: string, commentText: string, author: string, authorRole: string): AlarmItem[] {
    const alarms = this.getAlarms();
    const newComment: AlarmComment = {
      id: `c-${Date.now()}`,
      author,
      authorRole,
      timestamp: new Date().toISOString(),
      text: commentText,
    };
    const updated = alarms.map(a => a.id === id ? {
      ...a,
      comments: [...(a.comments || []), newComment]
    } : a);
    this.saveAlarms(updated);
    return updated;
  },

  resolveAlarm(id: string, notes: string, resolvedBy: string): AlarmItem[] {
    const alarms = this.getAlarms();
    const updated = alarms.map(a => a.id === id ? {
      ...a,
      acknowledged: true,
      resolutionStatus: 'Resolved' as const,
      resolutionNotes: notes,
      resolvedAt: new Date().toISOString(),
      resolvedBy
    } : a);
    this.saveAlarms(updated);
    return updated;
  },

  suppressAlarm(id: string, reason: string): AlarmItem[] {
    const alarms = this.getAlarms();
    const updated = alarms.map(a => a.id === id ? {
      ...a,
      resolutionStatus: 'Suppressed' as const,
      resolutionNotes: `Suppressed/Shelved: ${reason}`
    } : a);
    this.saveAlarms(updated);
    return updated;
  },

  // Events
  getEvents(): OperationalEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_EVENTS;
  },

  saveEvents(events: OperationalEvent[]): void {
    localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
    window.dispatchEvent(new Event('operations_update'));
  },

  addEvent(event: OperationalEvent): OperationalEvent[] {
    const events = this.getEvents();
    const updated = [event, ...events];
    this.saveEvents(updated);
    return updated;
  },

  // Jobs
  getJobs(): WorkOrderJob[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.JOBS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_JOBS;
  },

  saveJobs(jobs: WorkOrderJob[]): void {
    localStorage.setItem(STORAGE_KEYS.JOBS, JSON.stringify(jobs));
    window.dispatchEvent(new Event('operations_update'));
  },

  createJob(job: WorkOrderJob): WorkOrderJob[] {
    const jobs = this.getJobs();
    const initialAudit = {
      id: `aud-${Date.now()}`,
      stage: job.stage || 'Draft / Requested',
      timestamp: new Date().toISOString(),
      user: job.responsibleEngineer || 'System Admin',
      notes: 'Initial work order creation and scoping.',
    };
    const newJob: WorkOrderJob = {
      ...job,
      auditHistory: [initialAudit]
    };
    const updated = [newJob, ...jobs];
    this.saveJobs(updated);
    return updated;
  },

  updateJob(job: WorkOrderJob): WorkOrderJob[] {
    const jobs = this.getJobs();
    const updated = jobs.map(j => j.id === job.id ? job : j);
    this.saveJobs(updated);
    return updated;
  },

  updateJobStage(id: string, newStage: JobWorkflowStage, user: string, notes: string): WorkOrderJob[] {
    const jobs = this.getJobs();
    const updated = jobs.map(j => {
      if (j.id === id) {
        const auditRecord = {
          id: `aud-${Date.now()}`,
          stage: newStage,
          timestamp: new Date().toISOString(),
          user,
          notes,
        };
        const statusMap: Record<JobWorkflowStage, WorkOrderJob['status']> = {
          'Draft / Requested': 'Draft',
          'Pending Engineering Review': 'Pending Approval',
          'Scheduled & Mobilizing': 'Scheduled',
          'On-Site Execution': 'In Progress',
          'Quality & Testing': 'In Progress',
          'Completed & Closed': 'Completed',
          'Cancelled / Deferred': 'Cancelled',
        };

        return {
          ...j,
          stage: newStage,
          status: statusMap[newStage] || j.status,
          completedDate: newStage === 'Completed & Closed' ? new Date().toISOString().slice(0, 10) : j.completedDate,
          auditHistory: [...(j.auditHistory || []), auditRecord]
        };
      }
      return j;
    });
    this.saveJobs(updated);
    return updated;
  },

  closeJob(id: string, completionNotes: string, actualHours: number, user: string): WorkOrderJob[] {
    return this.updateJobStage(id, 'Completed & Closed', user, completionNotes);
  },

  // Failures
  getFailures(): FailureIncident[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FAILURES);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_FAILURES;
  },

  saveFailures(failures: FailureIncident[]): void {
    localStorage.setItem(STORAGE_KEYS.FAILURES, JSON.stringify(failures));
    window.dispatchEvent(new Event('operations_update'));
  },

  addFailure(failure: FailureIncident): FailureIncident[] {
    const failures = this.getFailures();
    const updated = [failure, ...failures];
    this.saveFailures(updated);
    return updated;
  },

  updateFailure(failure: FailureIncident): FailureIncident[] {
    const failures = this.getFailures();
    const updated = failures.map(f => f.id === failure.id ? failure : f);
    this.saveFailures(updated);
    return updated;
  },
};
