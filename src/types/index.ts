export type PortalType = 'admin' | 'user';

export type UserRole = 
  | 'super_admin'
  | 'operations_admin'
  | 'field_engineer'
  | 'monitoring_operator'
  | 'maintenance_engineer'
  | 'fleet_manager'
  | 'viewer';

export interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: UserRole;
  roleTitle: string;
  department: string;
  fieldLocation: string;
  avatarUrl?: string;
  allowedPortals: PortalType[];
  defaultPortal: PortalType;
  status?: 'active' | 'deactivated' | 'pending_approval';
  authProvider?: 'credentials' | 'google';
  createdAt?: string;
  lastLoginAt?: string;
}

export type LiftType = 'ESP' | 'Rod Pump' | 'Gas Lift' | 'PCP' | 'Plunger Lift';

export type WellStatus = 'Nominal' | 'Warning' | 'Critical' | 'Offline' | 'Testing';

export interface WellAsset {
  id: string;
  wellCode?: string;
  name: string;
  padName: string;
  basin: string;
  field: string;
  zone?: string;
  oilStation?: string;
  plinth?: string;
  assetCategory?: string;
  assetType?: string;
  manufacturer?: string;
  liftType: LiftType;
  status: WellStatus;
  operator: string;
  spudDate: string;
  totalDepthFt: number;
  casingSizeIn: number;
  tubingSizeIn: number;
  targetBopd: number;
  currentBopd: number;
  grossFluidBpd: number;
  waterCutPct: number;
  gasMcfd: number;
  intakePressurePsi: number;
  dischargePressurePsi: number;
  wellheadTempF: number;
  motorTempF: number;
  vibrationG: number;
  vfdFrequencyHz: number;
  motorCurrentA: number;
  powerKw: number;
  runLifeDays: number;
  lastServiceDate: string;
  healthScore: number;
  streamingStatus?: 'Streaming' | 'Not Streaming';
  streamingAge?: string;
  tubingPressureKgCm2?: number;
  flowlinePressureKgCm2?: number;
  flowlineTempC?: number;
  aAnnulusPressureKgCm2?: number;
  bAnnulusPressureKgCm2?: number;
  batteryVoltage?: number;
  shutdownCause?: string;
  shutdownTime?: string;
  espSerialNumber?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  schematicDocName?: string;
  updatedAt?: string;
}

export type DeviceType = 
  | 'VFD Inverter' 
  | 'Downhole Phoenix Gauge' 
  | 'RTU Gateway' 
  | 'Coriolis Mass Meter' 
  | 'Wellhead Transmitter' 
  | 'Rod Pump Controller'
  | 'Surface Acoustic Sensor';

export type DeviceStatus = 'Online' | 'Warning' | 'Offline' | 'Maintenance';

export type CommunicationProtocol = 'Modbus TCP' | 'MQTT' | 'OPC-UA' | 'HART' | 'WirelessHART';

export interface DeviceItem {
  id: string;
  name: string;
  type: DeviceType;
  wellId: string;
  wellName: string;
  model: string;
  serialNumber: string;
  ipAddress: string;
  protocol: CommunicationProtocol;
  status: DeviceStatus;
  latencyMs: number;
  firmware: string;
  lastHeartbeat: string;
  installationDate: string;
  macAddress: string;
  calibrationDueDate: string;
  datasheetName?: string;
  signalQualityDbm?: number;
  batteryPct?: number;
  modbusAddress?: number;
  updatedAt: string;
}

export type EspStatus = 'Operating' | 'Warning' | 'Standby' | 'Pulled / Failed' | 'Commissioning';

export interface EspEquipment {
  id: string;
  wellId: string;
  wellName: string;
  status: EspStatus;
  pumpSeries: string;
  stageCount: number;
  impellerMaterial: string;
  designFlowMinBpd: number;
  designFlowMaxBpd: number;
  bepFlowBpd: number;
  totalHeadFt: number;
  motorHp: number;
  motorVoltageV: number;
  motorAmpsA: number;
  separatorType: string;
  sealChamber: string;
  cableType: string;
  cableLengthFt: number;
  runLifeDays: number;
  installationDate: string;
  pumpCurveName?: string;
  updatedAt: string;
  notes?: string;
}

export type PumpType = 'Rod Pumping Unit (SRP)' | 'Progressing Cavity Pump (PCP)' | 'Hydraulic Piston Pump';

export type PumpStatus = 'Operating' | 'Warning' | 'Critical' | 'Pumping Off' | 'Idle / Standby' | 'Maintenance';

export interface PumpEquipment {
  id: string;
  wellId: string;
  wellName: string;
  pumpType: PumpType;
  status: PumpStatus;
  unitModel: string;
  strokeLengthIn: number;
  spm: number;
  gearboxRatingInLbs: number;
  beamRatingLbs: number;
  plungerDiameterIn: number;
  pumpDepthFt: number;
  rodStringTaper: string;
  pprlLbs: number;
  mprlLbs: number;
  fillagePct: number;
  fluidPoundDetected: boolean;
  motorHp: number;
  installationDate: string;
  dynamometerCardName?: string;
  updatedAt: string;
  notes?: string;
}

export type AlarmSeverity = 'Urgent' | 'High' | 'Medium' | 'Low';
export type AlarmResolutionStatus = 'Active' | 'Under Investigation' | 'Resolved' | 'Suppressed';

export interface AlarmComment {
  id: string;
  author: string;
  authorRole: string;
  timestamp: string;
  text: string;
}

export interface AlarmItem {
  id: string;
  wellId: string;
  wellName: string;
  liftType: LiftType;
  severity: AlarmSeverity;
  category: 'Thermal' | 'Electrical' | 'Hydrodynamic' | 'Mechanical' | 'Communication';
  title: string;
  description: string;
  parameter: string;
  currentValue: string;
  setpointLimit: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  assignedEngineer?: string;
  resolutionStatus?: AlarmResolutionStatus;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  comments?: AlarmComment[];
}

export interface OperationalEvent {
  id: string;
  wellId: string;
  wellName: string;
  timestamp: string;
  eventType: 'Setpoint Changed' | 'VFD Trip' | 'Auto-Restart' | 'Well Shut-in' | 'Chemical Treatment' | 'Sensor Calibration' | 'Emergency Shutdown' | 'Choke Adjustment';
  user: string;
  description: string;
  severity: 'Info' | 'Warning' | 'Action';
  subsystem?: 'ESP Surface Drive' | 'Downhole Sensor' | 'Christmas Tree' | 'SCADA Host' | 'Flowline' | 'Chemical Injection';
  parameterChanged?: string;
  previousValue?: string;
  newValue?: string;
  notes?: string;
}

export type JobWorkflowType = 
  | 'Cable' 
  | 'MLE' 
  | 'ESP Installation' 
  | 'ESP Replacement' 
  | 'Inspection' 
  | 'Maintenance' 
  | 'Troubleshooting'
  | 'Workover Rig' 
  | 'Pulling Unit' 
  | 'Chemical Flush' 
  | 'VFD Maintenance' 
  | 'Sensor Replacement' 
  | 'Fluid Level Acoustic';

export type JobWorkflowStage = 
  | 'Draft / Requested'
  | 'Pending Engineering Review'
  | 'Scheduled & Mobilizing'
  | 'On-Site Execution'
  | 'Quality & Testing'
  | 'Completed & Closed'
  | 'Cancelled / Deferred';

export interface JobAuditRecord {
  id: string;
  stage: string;
  timestamp: string;
  user: string;
  notes: string;
}

export interface WorkOrderJob {
  id: string;
  wellId: string;
  wellName: string;
  title: string;
  type: JobWorkflowType;
  priority: 'Immediate' | 'High' | 'Normal' | 'Scheduled';
  status: 'In Progress' | 'Dispatched' | 'Scheduled' | 'Pending Approval' | 'Completed' | 'Draft' | 'Cancelled';
  stage?: JobWorkflowStage;
  responsibleEngineer?: string;
  assignedCrew: string;
  assignedVehicleId?: string;
  equipmentRef?: string;
  createdDate: string;
  scheduledDate: string;
  completedDate?: string;
  estimatedHours: number;
  actualHours?: number;
  notes: string;
  completionNotes?: string;
  auditHistory?: JobAuditRecord[];
}

export type FleetVehicleStatus = 'Moving' | 'Idle' | 'Stopped' | 'Maintenance' | 'Offline' | 'On Site' | 'En Route' | 'Dispatched' | 'Standby';

export interface FleetVehicle {
  id: string;
  name: string;
  unitCode: string;
  type: string;
  driver: string;
  assignedDriverId?: string;
  status: FleetVehicleStatus;
  assignedWellId: string;
  assignedWellName: string;
  locationArea: string;
  speedMph: number;
  odometerMiles?: number;
  fuelPct: number;
  fuelCapacityGal?: number;
  avgMpg?: number;
  lastLocationUpdate?: string;
  eta: string;
  licensePlate?: string;
  vin?: string;
  yearMakeModel?: string;
  nextMaintenanceDate?: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  updatedAt?: string;
}

export interface DriverProfile {
  id: string;
  name: string;
  badgeNumber: string;
  phone: string;
  email: string;
  licenseNumber: string;
  cdlClass: 'Class A' | 'Class B' | 'Standard';
  endorsements: string[];
  assignedVehicleId?: string;
  assignedVehicleCode?: string;
  status: 'On Duty' | 'Driving' | 'Rest / Sleeper' | 'Off Duty' | 'Medical Leave';
  safetyScore: number;
  hosHoursRemaining: number;
  totalMilesDriven: number;
  incidentFreeDays: number;
  baseStation: string;
}

export interface VehicleTrip {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  driverId: string;
  driverName: string;
  origin: string;
  destination: string;
  associatedWellId?: string;
  associatedWellName?: string;
  purpose: string;
  startTime: string;
  endTime?: string;
  distanceMiles: number;
  durationMinutes: number;
  avgSpeedMph: number;
  fuelUsedGal: number;
  status: 'In Progress' | 'Completed' | 'Scheduled' | 'Cancelled';
}

export interface VehicleMaintenancePlan {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  serviceType: string;
  priority: 'Routine' | 'Urgent' | 'Mandatory Safety';
  dueDate: string;
  dueMiles: number;
  estimatedCostUsd: number;
  status: 'Scheduled' | 'Overdue' | 'In Service' | 'Completed';
  serviceVendor: string;
  notes: string;
}

export interface FleetTransaction {
  id: string;
  vehicleId: string;
  vehicleCode: string;
  driverName: string;
  type: 'Fuel Card' | 'DEF Fluid' | 'Preventative Service' | 'Tire Replacement' | 'Toll / Permit';
  timestamp: string;
  location: string;
  gallons?: number;
  liters?: number;
  odometer?: number;
  economyKmL?: number;
  anomaly?: string;
  pricePerGal?: number;
  amountUsd: number;
  receiptRef: string;
}

export interface FailureIncident {
  id: string;
  wellId: string;
  wellName: string;
  liftType: LiftType;
  failureDate: string;
  runLifeDays: number;
  rootCauseCategory: 'Gas Locking' | 'Sand / Solids Erosion' | 'Electrical Insulation Breakdown' | 'Scale Deposition' | 'Mechanical Wear' | 'Power Quality / Surge' | 'Tubing Corrosion / Leak';
  reasonCode?: string;
  failedComponent: 'Motor' | 'Pump Impellers' | 'Gas Separator' | 'MLE Cable' | 'Thrust Bearing' | 'Rod String' | 'Surface Transformer' | 'Check Valve';
  equipmentRef?: string;
  costImpactUsd: number;
  downtimeHours?: number;
  deferredProductionBbl?: number;
  rootCauseFindings?: string;
  correctiveActions?: string;
  resolutionStatus: 'Resolved' | 'Root Cause Analysis' | 'Replacement In-Progress' | 'Corrective Action Implemented';
  assignedEngineer?: string;
  closedDate?: string;
  notes: string;
}

export interface TelemetryPoint {
  time: string;
  intakePressure: number;
  dischargePressure: number;
  tubingPressure?: number;
  flowlinePressure?: number;
  aAnnulusPressure?: number;
  bAnnulusPressure?: number;
  motorTemp: number;
  intakeFluidTemp?: number;
  flowlineTemp?: number;
  frequency: number;
  motorCurrent: number;
  vibration: number;
  flowRate: number;
  oilRate?: number;
  powerKw?: number;
  powerFactor?: number;
  batteryVoltage?: number;
}

export interface ScadaHostNode {
  id: string;
  name: string;
  role: 'Primary' | 'Secondary Failover' | 'Edge Gateway';
  ipAddress: string;
  port: number;
  protocol: 'Modbus TCP' | 'MQTT Sparkplug B' | 'OPC-UA';
  pollIntervalMs: number;
  status: 'Online' | 'Standby' | 'Degraded' | 'Offline';
  latencyMs: number;
  packetLossPct: number;
  connectedDevices: number;
  lastSyncTime: string;
}

export interface ScadaTagItem {
  id: string;
  register: number;
  tagName: string;
  description: string;
  dataType: 'FLOAT32' | 'UINT16' | 'INT16' | 'BOOLEAN';
  scale: string;
  unit: string;
  currentValue: number | string;
  wellId: string;
  wellName: string;
  padName: string;
  category: 'Pressure' | 'Temperature' | 'Electrical' | 'Hydrodynamic' | 'Status' | 'Vibration';
  quality: 'GOOD' | 'FAIR' | 'BAD';
  highLimit?: number;
  lowLimit?: number;
  lastUpdated: string;
}

export interface DigitalTwinModelConfig {
  wellId: string;
  resPressurePsi: number;
  productivityIndex: number;
  waterCutPct: number;
  gasOilRatioScfBbl: number;
  casingPressurePsi: number;
  chokeSize64ths: number;
  espDepthFt: number;
  motorRatingHp: number;
  pumpStages: number;
  vfdSpeedHz: number;
  fluidGravityApi: number;
  solverMethod: 'Vogel-BeggsBrill' | 'Darcy-HagedornBrown';
  wearFactorPct: number;
  updatedAt: string;
}

export type CableShopWorkflowStage = 
  | 'Equipment Selection'
  | 'Cable Inspection'
  | 'Individual Cable Test'
  | 'Equipment Preparation'
  | 'Splicing & Assembly'
  | 'Combined Spliced Cable Test'
  | 'Shipment Preparation'
  | 'Shipped Equipment'
  | 'Warehouse Receivals'
  | 'Cable Shop Invoice';

export interface CableShopItem {
  id: string;
  partName: string;
  wellId?: string;
  wellName?: string;
  recordedDate: string;
  vendorPartNumber: string;
  currentSerialNumber: string;
  spooledToReelNumber: string;
  totalShippingLengthFt: number;
  stage: CableShopWorkflowStage;
  manufacturer: string;
  classification: 'New' | 'Used' | 'Reconditioned';
  failureCause?: string;
  testVoltageKv?: number;
  insulationResistanceMohm?: number;
  conductorContinuity?: 'Pass' | 'Fail';
  certDocName?: string;
  invoiceNumber?: string;
  invoiceAmountUsd?: number;
  notes?: string;
  updatedAt: string;
}

export interface EspSizingRequest {
  id: string;
  wellId: string;
  wellName: string;
  requestDate: string;
  status: 'Draft' | 'Submitted' | 'Simulated' | 'Approved';
  afeNumber?: string;
  // Design Parameters
  designRateStbd: number;
  frequencyHz: number;
  whpPsig: number;
  tdhFt: number;
  motorLoadHp: number;
  pumpSpeedRpm: number;
  fluidLevelFt: number;
  intakePressurePsig: number;
  pumpDepthFt: number;
  dischargePressurePsig: number;
  mixtureGradientPsiFt: number;
  separationEfficiencyPct: number;
  // Fluids
  oilGravityApi: number;
  waterSpecificGravity: number;
  gasSpecificGravity: number;
  bubblePointPressurePsig: number;
  watercutPct: number;
  gorScfStb: number;
  // Reservoir
  reservoirTempF: number;
  wellTempF: number;
  bottomholeTempF: number;
  // Recommended Pump & Motor
  recommendedPumpSeries?: string;
  recommendedStages?: number;
  recommendedMotorHp?: number;
}

