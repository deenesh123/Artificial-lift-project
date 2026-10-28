import { 
  FleetVehicle, 
  DriverProfile, 
  VehicleTrip, 
  VehicleMaintenancePlan, 
  FleetTransaction 
} from '../types';

const FLEET_STORAGE_KEYS = {
  VEHICLES: 'als_fleet_vehicles_v2',
  DRIVERS: 'als_fleet_drivers_v2',
  TRIPS: 'als_fleet_trips_v2',
  MAINTENANCE: 'als_fleet_maint_v2',
  TRANSACTIONS: 'als_fleet_txns_v2',
};

// 22 Synthetic Vehicles
export const INITIAL_FLEET_VEHICLES: FleetVehicle[] = [
  {
    id: 'VEH-101',
    name: 'Kenworth C500 Heavy Pulling Crane 80T',
    unitCode: 'CRN-01',
    type: 'Heavy Pulling Crane',
    driver: 'Hector Ramirez',
    assignedDriverId: 'DRV-201',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-099',
    assignedWellName: 'Silver Spur 99-1H',
    locationArea: 'FM 652 Transit (Delaware Bench)',
    speedMph: 48,
    odometerMiles: 68420,
    fuelPct: 74,
    fuelCapacityGal: 150,
    avgMpg: 4.8,
    lastLocationUpdate: '2026-10-28 07:54:12 UTC',
    eta: '25 min (Arr: 08:20 UTC)',
    licensePlate: 'TX-HVY-9402',
    vin: '1NKDX4EX0JJ812901',
    yearMakeModel: '2023 Kenworth C500 Twin Steer',
    nextMaintenanceDate: '2026-11-15',
    coordinates: { lat: 31.8621, lng: -103.5210 },
  },
  {
    id: 'VEH-102',
    name: 'Peterbilt 389 Wireline Mast Truck',
    unitCode: 'WIRE-02',
    type: 'Wireline Truck',
    driver: 'Travis McCord',
    assignedDriverId: 'DRV-202',
    status: 'Stopped',
    assignedWellId: 'ALS-DEL-ESP-082',
    assignedWellName: 'Red River Federal 82-4H',
    locationArea: 'Red River Central Pad A',
    speedMph: 0,
    odometerMiles: 92450,
    fuelPct: 62,
    fuelCapacityGal: 120,
    avgMpg: 5.4,
    lastLocationUpdate: '2026-10-28 07:58:30 UTC',
    eta: 'On Site (Rigged Up)',
    licensePlate: 'TX-WRE-3381',
    vin: '1XP9DB9X8MD771204',
    yearMakeModel: '2022 Peterbilt 389 Extended Hood',
    nextMaintenanceDate: '2026-12-01',
    coordinates: { lat: 31.9124, lng: -103.4982 },
  },
  {
    id: 'VEH-103',
    name: 'Western Star 49X Mobile Acoustic Lab',
    unitCode: 'INST-05',
    type: 'Mobile Instrumentation Lab',
    driver: 'Bradley Cooper',
    assignedDriverId: 'DRV-203',
    status: 'Idle',
    assignedWellId: 'ALS-EF-ROD-019',
    assignedWellName: 'Canyon Creek 19-3H',
    locationArea: 'Canyon Creek Pad 19',
    speedMph: 0,
    odometerMiles: 44120,
    fuelPct: 88,
    fuelCapacityGal: 100,
    avgMpg: 6.8,
    lastLocationUpdate: '2026-10-28 07:56:02 UTC',
    eta: 'On Site (Diagnostics Running)',
    licensePlate: 'TX-LAB-5519',
    vin: '5KKPAAFE8PP901412',
    yearMakeModel: '2024 Western Star 49X Custom Box',
    nextMaintenanceDate: '2027-01-15',
    coordinates: { lat: 28.7412, lng: -97.9821 },
  },
  {
    id: 'VEH-104',
    name: 'Mack Granite Slickline Unit SL-04',
    unitCode: 'SL-04',
    type: 'Slickline Unit',
    driver: 'Jesse Vance',
    assignedDriverId: 'DRV-204',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-104',
    assignedWellName: 'Phantom State 104-2H',
    locationArea: 'State Hwy 285 Southbound',
    speedMph: 54,
    odometerMiles: 81290,
    fuelPct: 56,
    fuelCapacityGal: 110,
    avgMpg: 5.9,
    lastLocationUpdate: '2026-10-28 07:59:10 UTC',
    eta: '18 min (Arr: 08:18 UTC)',
    licensePlate: 'TX-SLK-4104',
    vin: '1M2AX07C7NM014992',
    yearMakeModel: '2021 Mack Granite 64FR',
    nextMaintenanceDate: '2026-11-20',
    coordinates: { lat: 31.8150, lng: -103.6210 },
  },
  {
    id: 'VEH-105',
    name: 'Freightliner M2 106 Chemical Batch Tanker',
    unitCode: 'CHEM-08',
    type: 'Chemical Tanker',
    driver: 'Ramon Gutierrez',
    assignedDriverId: 'DRV-205',
    status: 'Stopped',
    assignedWellId: 'ALS-MID-ESP-215',
    assignedWellName: 'Midland Basin Ranch 215-2H',
    locationArea: 'Midland North Pad 14',
    speedMph: 0,
    odometerMiles: 53100,
    fuelPct: 45,
    fuelCapacityGal: 90,
    avgMpg: 7.2,
    lastLocationUpdate: '2026-10-28 07:50:22 UTC',
    eta: 'On Site (Treating)',
    licensePlate: 'TX-CHM-8820',
    vin: '1FVACXDC6RH712499',
    yearMakeModel: '2023 Freightliner M2 106 2000Gal',
    nextMaintenanceDate: '2026-11-05',
    coordinates: { lat: 32.0512, lng: -102.1245 },
  },
  {
    id: 'VEH-106',
    name: 'Ford F-550 Super Duty Field Crew Unit 11',
    unitCode: 'CREW-11',
    type: 'Field Crew Pickup',
    driver: 'Cole Hawkins',
    assignedDriverId: 'DRV-206',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-112',
    assignedWellName: 'War Admiral 112-1H',
    locationArea: 'Pecos County Lease Road 4',
    speedMph: 36,
    odometerMiles: 38900,
    fuelPct: 82,
    fuelCapacityGal: 40,
    avgMpg: 11.2,
    lastLocationUpdate: '2026-10-28 07:58:44 UTC',
    eta: '10 min (Arr: 08:10 UTC)',
    licensePlate: 'TX-CRW-5511',
    vin: '1FT8W5DT4PE889123',
    yearMakeModel: '2023 Ford F-550 Crew Cab 4x4',
    nextMaintenanceDate: '2026-12-15',
    coordinates: { lat: 31.7890, lng: -103.4560 },
  },
  {
    id: 'VEH-107',
    name: 'Kenworth T880 Hot Oil Circulation Unit',
    unitCode: 'OIL-03',
    type: 'Hot Oil Unit',
    driver: 'Wyatt Sterling',
    assignedDriverId: 'DRV-207',
    status: 'Maintenance',
    assignedWellId: 'ALS-MID-ESP-180',
    assignedWellName: 'Cowden East Pad Unit 3',
    locationArea: 'Midland Central Maintenance Yard',
    speedMph: 0,
    odometerMiles: 112400,
    fuelPct: 35,
    fuelCapacityGal: 140,
    avgMpg: 4.5,
    lastLocationUpdate: '2026-10-28 07:30:00 UTC',
    eta: 'In Shop (Brake Relining)',
    licensePlate: 'TX-HTO-1903',
    vin: '1NKDX4TX5LR902311',
    yearMakeModel: '2020 Kenworth T880 Tri-Drive',
    nextMaintenanceDate: '2026-10-29',
    coordinates: { lat: 32.0120, lng: -102.0950 },
  },
  {
    id: 'VEH-108',
    name: 'Peterbilt 567 Pressure Pumper Unit 07',
    unitCode: 'PUMP-07',
    type: 'Pressure Pumper',
    driver: 'Garrett Holt',
    assignedDriverId: 'DRV-208',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-044',
    assignedWellName: 'Loving County State 44-3H',
    locationArea: 'Loving County Highway 302',
    speedMph: 52,
    odometerMiles: 74210,
    fuelPct: 68,
    fuelCapacityGal: 130,
    avgMpg: 5.1,
    lastLocationUpdate: '2026-10-28 07:57:15 UTC',
    eta: '30 min (Arr: 08:30 UTC)',
    licensePlate: 'TX-PMP-7007',
    vin: '1XP7D49X2ND410982',
    yearMakeModel: '2022 Peterbilt 567 Severe Duty',
    nextMaintenanceDate: '2026-11-28',
    coordinates: { lat: 31.8450, lng: -103.6820 },
  },
  {
    id: 'VEH-109',
    name: 'Ford F-550 Instrument Calibration Lab',
    unitCode: 'INST-09',
    type: 'Mobile Instrumentation Lab',
    driver: 'Austin Fletcher',
    assignedDriverId: 'DRV-209',
    status: 'Idle',
    assignedWellId: 'ALS-BAK-PCP-005',
    assignedWellName: 'Fort Berthold 05-1H',
    locationArea: 'Fort Berthold Unit 5',
    speedMph: 0,
    odometerMiles: 49800,
    fuelPct: 91,
    fuelCapacityGal: 40,
    avgMpg: 11.5,
    lastLocationUpdate: '2026-10-28 07:52:10 UTC',
    eta: 'On Site (Sensor Sweep)',
    licensePlate: 'ND-LAB-9109',
    vin: '1FDOW5HT1PED81203',
    yearMakeModel: '2023 Ford F-550 Chassis Cab',
    nextMaintenanceDate: '2027-02-01',
    coordinates: { lat: 47.9210, lng: -102.5820 },
  },
  {
    id: 'VEH-110',
    name: 'International HV607 Cable Spooler Unit',
    unitCode: 'CBL-02',
    type: 'Cable Spooler',
    driver: 'Clint Eastwood',
    assignedDriverId: 'DRV-210',
    status: 'Stopped',
    assignedWellId: 'ALS-DEL-ESP-099',
    assignedWellName: 'Silver Spur 99-1H',
    locationArea: 'Silver Spur Pad Bravo',
    speedMph: 0,
    odometerMiles: 61500,
    fuelPct: 76,
    fuelCapacityGal: 100,
    avgMpg: 6.2,
    lastLocationUpdate: '2026-10-28 07:55:00 UTC',
    eta: 'On Site (Ready for Spooling)',
    licensePlate: 'TX-CBL-2202',
    vin: '3HAEVAPR2NL992314',
    yearMakeModel: '2022 International HV607',
    nextMaintenanceDate: '2026-12-10',
    coordinates: { lat: 31.8740, lng: -103.5410 },
  },
  {
    id: 'VEH-111',
    name: 'Chevrolet Silverado 3500HD Field Tech 14',
    unitCode: 'CREW-14',
    type: 'Field Crew Pickup',
    driver: 'Logan Pierce',
    assignedDriverId: 'DRV-211',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-104',
    assignedWellName: 'Phantom State 104-2H',
    locationArea: 'Reeves County Loop 12',
    speedMph: 60,
    odometerMiles: 29400,
    fuelPct: 89,
    fuelCapacityGal: 36,
    avgMpg: 13.8,
    lastLocationUpdate: '2026-10-28 07:59:45 UTC',
    eta: '8 min (Arr: 08:08 UTC)',
    licensePlate: 'TX-SLV-3514',
    vin: '1GC4YNEY6PF102934',
    yearMakeModel: '2023 Chevrolet Silverado 3500HD',
    nextMaintenanceDate: '2027-01-10',
    coordinates: { lat: 31.8310, lng: -103.5950 },
  },
  {
    id: 'VEH-112',
    name: 'Kenworth W900 Heavy Rigging Tractor',
    unitCode: 'RIG-05',
    type: 'Heavy Pulling Crane',
    driver: 'Beau Bridges',
    assignedDriverId: 'DRV-212',
    status: 'Offline',
    assignedWellId: 'ALS-DEL-ESP-033',
    assignedWellName: 'Red Bluff Federal 33-1H',
    locationArea: 'Pecos Base Facility Depot',
    speedMph: 0,
    odometerMiles: 145200,
    fuelPct: 18,
    fuelCapacityGal: 200,
    avgMpg: 4.2,
    lastLocationUpdate: '2026-10-27 18:20:00 UTC',
    eta: 'Depot Standby',
    licensePlate: 'TX-RIG-9905',
    vin: '1NKDX40X7KR889104',
    yearMakeModel: '2019 Kenworth W900L Tri-Axle',
    nextMaintenanceDate: '2026-10-31',
    coordinates: { lat: 31.4210, lng: -103.4920 },
  },
  {
    id: 'VEH-113',
    name: 'Mack Granite Hydro-Vac Excavator Unit',
    unitCode: 'VAC-01',
    type: 'Hydro-Vac Excavator',
    driver: 'Mason Rivera',
    assignedDriverId: 'DRV-213',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-082',
    assignedWellName: 'Red River Federal 82-4H',
    locationArea: 'Ward County FM 1927',
    speedMph: 42,
    odometerMiles: 58200,
    fuelPct: 65,
    fuelCapacityGal: 110,
    avgMpg: 5.5,
    lastLocationUpdate: '2026-10-28 07:53:12 UTC',
    eta: '35 min (Arr: 08:32 UTC)',
    licensePlate: 'TX-VAC-1001',
    vin: '1M2AX07C9PM209144',
    yearMakeModel: '2023 Mack Granite Daycab',
    nextMaintenanceDate: '2026-12-05',
    coordinates: { lat: 31.7510, lng: -103.3210 },
  },
  {
    id: 'VEH-114',
    name: 'Peterbilt 389 Slickline Unit SL-09',
    unitCode: 'SL-09',
    type: 'Slickline Unit',
    driver: 'Nolan Scott',
    assignedDriverId: 'DRV-214',
    status: 'Stopped',
    assignedWellId: 'ALS-EF-ROD-014',
    assignedWellName: 'Eagle Ford Unit 14-2H',
    locationArea: 'Eagle Ford Central Yard',
    speedMph: 0,
    odometerMiles: 88100,
    fuelPct: 70,
    fuelCapacityGal: 120,
    avgMpg: 5.6,
    lastLocationUpdate: '2026-10-28 07:45:00 UTC',
    eta: 'Staged for Dispatch',
    licensePlate: 'TX-SLK-3809',
    vin: '1XP9DB9X1ND551902',
    yearMakeModel: '2022 Peterbilt 389',
    nextMaintenanceDate: '2026-11-18',
    coordinates: { lat: 28.7120, lng: -97.8920 },
  },
  {
    id: 'VEH-115',
    name: 'Freightliner Cascadia Wireline Unit 15',
    unitCode: 'WIRE-15',
    type: 'Wireline Truck',
    driver: 'Preston Miller',
    assignedDriverId: 'DRV-215',
    status: 'Moving',
    assignedWellId: 'ALS-MID-ESP-210',
    assignedWellName: 'Midland Basin Ranch 210-4H',
    locationArea: 'Interstate 20 Westbound',
    speedMph: 64,
    odometerMiles: 95400,
    fuelPct: 58,
    fuelCapacityGal: 140,
    avgMpg: 6.5,
    lastLocationUpdate: '2026-10-28 07:59:02 UTC',
    eta: '45 min (Arr: 08:45 UTC)',
    licensePlate: 'TX-WRE-1515',
    vin: '1FUJGLDR5NLAA8123',
    yearMakeModel: '2022 Freightliner Cascadia 116',
    nextMaintenanceDate: '2026-11-22',
    coordinates: { lat: 31.9890, lng: -102.2100 },
  },
  {
    id: 'VEH-116',
    name: 'Ford F-450 Super Duty Chemical Runner',
    unitCode: 'CHEM-04',
    type: 'Chemical Tanker',
    driver: 'Quinn Sullivan',
    assignedDriverId: 'DRV-216',
    status: 'Idle',
    assignedWellId: 'ALS-DEL-ESP-104',
    assignedWellName: 'Phantom State 104-2H',
    locationArea: 'Phantom State Pad Bravo',
    speedMph: 0,
    odometerMiles: 34100,
    fuelPct: 84,
    fuelCapacityGal: 48,
    avgMpg: 12.1,
    lastLocationUpdate: '2026-10-28 07:58:11 UTC',
    eta: 'On Site (Capillary Hooked)',
    licensePlate: 'TX-CHM-4404',
    vin: '1FT8W4DT2PED01984',
    yearMakeModel: '2023 Ford F-450 Crew Cab',
    nextMaintenanceDate: '2027-01-20',
    coordinates: { lat: 31.8412, lng: -103.5821 },
  },
  {
    id: 'VEH-117',
    name: 'Ram 5500 Heavy Field Tech Service 18',
    unitCode: 'CREW-18',
    type: 'Field Crew Pickup',
    driver: 'Riley Bennett',
    assignedDriverId: 'DRV-217',
    status: 'Moving',
    assignedWellId: 'ALS-BAK-PCP-012',
    assignedWellName: 'Fort Berthold 12-4H',
    locationArea: 'North Dakota BIA Route 14',
    speedMph: 45,
    odometerMiles: 42100,
    fuelPct: 77,
    fuelCapacityGal: 52,
    avgMpg: 11.9,
    lastLocationUpdate: '2026-10-28 07:56:45 UTC',
    eta: '12 min (Arr: 08:12 UTC)',
    licensePlate: 'ND-CRW-5518',
    vin: '3C7WRNEL6PG190284',
    yearMakeModel: '2023 Ram 5500 Tradesman 4x4',
    nextMaintenanceDate: '2026-12-28',
    coordinates: { lat: 47.9540, lng: -102.6120 },
  },
  {
    id: 'VEH-118',
    name: 'Western Star 4700 Pulling Unit 09',
    unitCode: 'RIG-09',
    type: 'Heavy Pulling Crane',
    driver: 'Samson Hayes',
    assignedDriverId: 'DRV-218',
    status: 'Maintenance',
    assignedWellId: 'ALS-DEL-ESP-099',
    assignedWellName: 'Silver Spur 99-1H',
    locationArea: 'Pecos Fleet Depot Bay 2',
    speedMph: 0,
    odometerMiles: 124800,
    fuelPct: 40,
    fuelCapacityGal: 150,
    avgMpg: 4.6,
    lastLocationUpdate: '2026-10-28 06:15:00 UTC',
    eta: 'In Maintenance (Hydraulic Seal)',
    licensePlate: 'TX-RIG-4709',
    vin: '5KKPAAED9NP881923',
    yearMakeModel: '2020 Western Star 4700SB',
    nextMaintenanceDate: '2026-10-30',
    coordinates: { lat: 31.4250, lng: -103.4990 },
  },
  {
    id: 'VEH-119',
    name: 'Kenworth T370 Mobile SCADA Gateway',
    unitCode: 'SCADA-01',
    type: 'Mobile Instrumentation Lab',
    driver: 'Tanner Vance',
    assignedDriverId: 'DRV-219',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-082',
    assignedWellName: 'Red River Federal 82-4H',
    locationArea: 'Reeves County Road 118',
    speedMph: 50,
    odometerMiles: 39500,
    fuelPct: 81,
    fuelCapacityGal: 75,
    avgMpg: 8.4,
    lastLocationUpdate: '2026-10-28 07:59:22 UTC',
    eta: '14 min (Arr: 08:15 UTC)',
    licensePlate: 'TX-SCD-3701',
    vin: '1NKHH7TX2NR981240',
    yearMakeModel: '2022 Kenworth T370',
    nextMaintenanceDate: '2027-02-15',
    coordinates: { lat: 31.8920, lng: -103.5120 },
  },
  {
    id: 'VEH-120',
    name: 'International WorkStar 7600 Tanker',
    unitCode: 'CHEM-10',
    type: 'Chemical Tanker',
    driver: 'Victor Sanchez',
    assignedDriverId: 'DRV-220',
    status: 'Stopped',
    assignedWellId: 'ALS-EF-ROD-019',
    assignedWellName: 'Canyon Creek 19-3H',
    locationArea: 'Karnes County Lease Road 7',
    speedMph: 0,
    odometerMiles: 71200,
    fuelPct: 50,
    fuelCapacityGal: 100,
    avgMpg: 6.4,
    lastLocationUpdate: '2026-10-28 07:48:30 UTC',
    eta: 'On Site (Offloading)',
    licensePlate: 'TX-CHM-7610',
    vin: '1HTMSAAN8NH881923',
    yearMakeModel: '2022 International WorkStar',
    nextMaintenanceDate: '2026-11-30',
    coordinates: { lat: 28.7450, lng: -97.9780 },
  },
  {
    id: 'VEH-121',
    name: 'Peterbilt 567 Heavy Haul Spooler',
    unitCode: 'CBL-05',
    type: 'Cable Spooler',
    driver: 'Wesley Crawford',
    assignedDriverId: 'DRV-221',
    status: 'Moving',
    assignedWellId: 'ALS-DEL-ESP-112',
    assignedWellName: 'War Admiral 112-1H',
    locationArea: 'Delaware Basin Hwy 285',
    speedMph: 55,
    odometerMiles: 63400,
    fuelPct: 69,
    fuelCapacityGal: 120,
    avgMpg: 5.7,
    lastLocationUpdate: '2026-10-28 07:58:18 UTC',
    eta: '22 min (Arr: 08:22 UTC)',
    licensePlate: 'TX-CBL-5605',
    vin: '1XP7D49X9ND661299',
    yearMakeModel: '2022 Peterbilt 567 Tri-Drive',
    nextMaintenanceDate: '2026-12-18',
    coordinates: { lat: 31.8100, lng: -103.4800 },
  },
  {
    id: 'VEH-122',
    name: 'Ford F-350 Rapid Response Tech 22',
    unitCode: 'CREW-22',
    type: 'Field Crew Pickup',
    driver: 'Xavier Mendez',
    assignedDriverId: 'DRV-222',
    status: 'Idle',
    assignedWellId: 'ALS-DEL-ESP-104',
    assignedWellName: 'Phantom State 104-2H',
    locationArea: 'Phantom State Pad Bravo',
    speedMph: 0,
    odometerMiles: 21500,
    fuelPct: 94,
    fuelCapacityGal: 34,
    avgMpg: 14.2,
    lastLocationUpdate: '2026-10-28 07:59:50 UTC',
    eta: 'On Site (Standby)',
    licensePlate: 'TX-CRW-3522',
    vin: '1FT8W3BT8PEE01982',
    yearMakeModel: '2024 Ford F-350 Super Duty',
    nextMaintenanceDate: '2027-03-01',
    coordinates: { lat: 31.8415, lng: -103.5825 },
  },
];

// 30 Drivers
export const INITIAL_DRIVERS: DriverProfile[] = [
  { id: 'DRV-201', name: 'Hector Ramirez', badgeNumber: 'DRV-901', phone: '(432) 555-0101', email: 'h.ramirez@als-fleet.demo', licenseNumber: 'TX-CDL-881290', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Double/Triple', 'Air Brakes'], assignedVehicleId: 'VEH-101', assignedVehicleCode: 'CRN-01', status: 'Driving', safetyScore: 99, hosHoursRemaining: 7.5, totalMilesDriven: 412000, incidentFreeDays: 980, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-202', name: 'Travis McCord', badgeNumber: 'DRV-902', phone: '(432) 555-0102', email: 't.mccord@als-fleet.demo', licenseNumber: 'TX-CDL-441209', cdlClass: 'Class A', endorsements: ['Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-102', assignedVehicleCode: 'WIRE-02', status: 'On Duty', safetyScore: 97, hosHoursRemaining: 6.0, totalMilesDriven: 389000, incidentFreeDays: 640, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-203', name: 'Bradley Cooper', badgeNumber: 'DRV-903', phone: '(361) 555-0103', email: 'b.cooper@als-fleet.demo', licenseNumber: 'TX-CDL-771249', cdlClass: 'Class B', endorsements: ['HazMat', 'Air Brakes'], assignedVehicleId: 'VEH-103', assignedVehicleCode: 'INST-05', status: 'On Duty', safetyScore: 98, hosHoursRemaining: 9.2, totalMilesDriven: 245000, incidentFreeDays: 820, baseStation: 'Eagle Ford Operations Yard' },
  { id: 'DRV-204', name: 'Jesse Vance', badgeNumber: 'DRV-904', phone: '(432) 555-0104', email: 'j.vance@als-fleet.demo', licenseNumber: 'TX-CDL-331902', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-104', assignedVehicleCode: 'SL-04', status: 'Driving', safetyScore: 96, hosHoursRemaining: 8.0, totalMilesDriven: 512000, incidentFreeDays: 520, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-205', name: 'Ramon Gutierrez', badgeNumber: 'DRV-905', phone: '(432) 555-0105', email: 'r.gutierrez@als-fleet.demo', licenseNumber: 'TX-CDL-552910', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-105', assignedVehicleCode: 'CHEM-08', status: 'On Duty', safetyScore: 98, hosHoursRemaining: 5.5, totalMilesDriven: 334000, incidentFreeDays: 1120, baseStation: 'Midland Operations Center' },
  { id: 'DRV-206', name: 'Cole Hawkins', badgeNumber: 'DRV-906', phone: '(432) 555-0106', email: 'c.hawkins@als-fleet.demo', licenseNumber: 'TX-DL-991204', cdlClass: 'Standard', endorsements: [], assignedVehicleId: 'VEH-106', assignedVehicleCode: 'CREW-11', status: 'Driving', safetyScore: 95, hosHoursRemaining: 9.5, totalMilesDriven: 142000, incidentFreeDays: 410, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-207', name: 'Wyatt Sterling', badgeNumber: 'DRV-907', phone: '(432) 555-0107', email: 'w.sterling@als-fleet.demo', licenseNumber: 'TX-CDL-661209', cdlClass: 'Class A', endorsements: ['Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-107', assignedVehicleCode: 'OIL-03', status: 'Rest / Sleeper', safetyScore: 94, hosHoursRemaining: 11.0, totalMilesDriven: 480000, incidentFreeDays: 310, baseStation: 'Midland Operations Center' },
  { id: 'DRV-208', name: 'Garrett Holt', badgeNumber: 'DRV-908', phone: '(432) 555-0108', email: 'g.holt@als-fleet.demo', licenseNumber: 'TX-CDL-221908', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-108', assignedVehicleCode: 'PUMP-07', status: 'Driving', safetyScore: 97, hosHoursRemaining: 7.2, totalMilesDriven: 395000, incidentFreeDays: 780, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-209', name: 'Austin Fletcher', badgeNumber: 'DRV-909', phone: '(701) 555-0109', email: 'a.fletcher@als-fleet.demo', licenseNumber: 'ND-CDL-112904', cdlClass: 'Class B', endorsements: ['Air Brakes'], assignedVehicleId: 'VEH-109', assignedVehicleCode: 'INST-09', status: 'On Duty', safetyScore: 99, hosHoursRemaining: 6.8, totalMilesDriven: 189000, incidentFreeDays: 910, baseStation: 'Bakken Field Unit' },
  { id: 'DRV-210', name: 'Clint Eastwood', badgeNumber: 'DRV-910', phone: '(432) 555-0110', email: 'c.eastwood@als-fleet.demo', licenseNumber: 'TX-CDL-998811', cdlClass: 'Class A', endorsements: ['Heavy Haul', 'Air Brakes'], assignedVehicleId: 'VEH-110', assignedVehicleCode: 'CBL-02', status: 'On Duty', safetyScore: 100, hosHoursRemaining: 8.5, totalMilesDriven: 620000, incidentFreeDays: 1450, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-211', name: 'Logan Pierce', badgeNumber: 'DRV-911', phone: '(432) 555-0111', email: 'l.pierce@als-fleet.demo', licenseNumber: 'TX-DL-448822', cdlClass: 'Standard', endorsements: [], assignedVehicleId: 'VEH-111', assignedVehicleCode: 'CREW-14', status: 'Driving', safetyScore: 96, hosHoursRemaining: 9.0, totalMilesDriven: 110000, incidentFreeDays: 340, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-212', name: 'Beau Bridges', badgeNumber: 'DRV-912', phone: '(432) 555-0112', email: 'b.bridges@als-fleet.demo', licenseNumber: 'TX-CDL-774411', cdlClass: 'Class A', endorsements: ['Heavy Haul', 'Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-112', assignedVehicleCode: 'RIG-05', status: 'Off Duty', safetyScore: 93, hosHoursRemaining: 10.0, totalMilesDriven: 590000, incidentFreeDays: 280, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-213', name: 'Mason Rivera', badgeNumber: 'DRV-913', phone: '(432) 555-0113', email: 'm.rivera@als-fleet.demo', licenseNumber: 'TX-CDL-334499', cdlClass: 'Class A', endorsements: ['Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-113', assignedVehicleCode: 'VAC-01', status: 'Driving', safetyScore: 97, hosHoursRemaining: 7.8, totalMilesDriven: 310000, incidentFreeDays: 610, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-214', name: 'Nolan Scott', badgeNumber: 'DRV-914', phone: '(361) 555-0114', email: 'n.scott@als-fleet.demo', licenseNumber: 'TX-CDL-558833', cdlClass: 'Class A', endorsements: ['HazMat', 'Air Brakes'], assignedVehicleId: 'VEH-114', assignedVehicleCode: 'SL-09', status: 'On Duty', safetyScore: 98, hosHoursRemaining: 10.5, totalMilesDriven: 440000, incidentFreeDays: 890, baseStation: 'Eagle Ford Operations Yard' },
  { id: 'DRV-215', name: 'Preston Miller', badgeNumber: 'DRV-915', phone: '(432) 555-0115', email: 'p.miller@als-fleet.demo', licenseNumber: 'TX-CDL-119933', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-115', assignedVehicleCode: 'WIRE-15', status: 'Driving', safetyScore: 96, hosHoursRemaining: 8.2, totalMilesDriven: 415000, incidentFreeDays: 560, baseStation: 'Midland Operations Center' },
  { id: 'DRV-216', name: 'Quinn Sullivan', badgeNumber: 'DRV-916', phone: '(432) 555-0116', email: 'q.sullivan@als-fleet.demo', licenseNumber: 'TX-DL-882244', cdlClass: 'Standard', endorsements: [], assignedVehicleId: 'VEH-116', assignedVehicleCode: 'CHEM-04', status: 'On Duty', safetyScore: 99, hosHoursRemaining: 8.7, totalMilesDriven: 135000, incidentFreeDays: 740, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-217', name: 'Riley Bennett', badgeNumber: 'DRV-917', phone: '(701) 555-0117', email: 'r.bennett@als-fleet.demo', licenseNumber: 'ND-DL-339911', cdlClass: 'Standard', endorsements: [], assignedVehicleId: 'VEH-117', assignedVehicleCode: 'CREW-18', status: 'Driving', safetyScore: 97, hosHoursRemaining: 6.4, totalMilesDriven: 160000, incidentFreeDays: 490, baseStation: 'Bakken Field Unit' },
  { id: 'DRV-218', name: 'Samson Hayes', badgeNumber: 'DRV-918', phone: '(432) 555-0118', email: 's.hayes@als-fleet.demo', licenseNumber: 'TX-CDL-447788', cdlClass: 'Class A', endorsements: ['Heavy Haul', 'Air Brakes'], assignedVehicleId: 'VEH-118', assignedVehicleCode: 'RIG-09', status: 'Off Duty', safetyScore: 95, hosHoursRemaining: 11.5, totalMilesDriven: 520000, incidentFreeDays: 430, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-219', name: 'Tanner Vance', badgeNumber: 'DRV-919', phone: '(432) 555-0119', email: 't.vance@als-fleet.demo', licenseNumber: 'TX-CDL-993322', cdlClass: 'Class B', endorsements: ['Air Brakes'], assignedVehicleId: 'VEH-119', assignedVehicleCode: 'SCADA-01', status: 'Driving', safetyScore: 98, hosHoursRemaining: 7.0, totalMilesDriven: 210000, incidentFreeDays: 690, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-220', name: 'Victor Sanchez', badgeNumber: 'DRV-920', phone: '(361) 555-0120', email: 'v.sanchez@als-fleet.demo', licenseNumber: 'TX-CDL-228844', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], assignedVehicleId: 'VEH-120', assignedVehicleCode: 'CHEM-10', status: 'On Duty', safetyScore: 97, hosHoursRemaining: 6.2, totalMilesDriven: 375000, incidentFreeDays: 810, baseStation: 'Eagle Ford Operations Yard' },
  { id: 'DRV-221', name: 'Wesley Crawford', badgeNumber: 'DRV-921', phone: '(432) 555-0121', email: 'w.crawford@als-fleet.demo', licenseNumber: 'TX-CDL-665511', cdlClass: 'Class A', endorsements: ['Heavy Haul', 'Air Brakes'], assignedVehicleId: 'VEH-122', assignedVehicleCode: 'CBL-05', status: 'Driving', safetyScore: 99, hosHoursRemaining: 8.8, totalMilesDriven: 490000, incidentFreeDays: 1040, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-222', name: 'Xavier Mendez', badgeNumber: 'DRV-922', phone: '(432) 555-0122', email: 'x.mendez@als-fleet.demo', licenseNumber: 'TX-DL-771199', cdlClass: 'Standard', endorsements: [], assignedVehicleId: 'VEH-122', assignedVehicleCode: 'CREW-22', status: 'On Duty', safetyScore: 98, hosHoursRemaining: 9.1, totalMilesDriven: 98000, incidentFreeDays: 530, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-223', name: 'Yusuf Al-Mansoor', badgeNumber: 'DRV-923', phone: '(432) 555-0123', email: 'y.almansoor@als-fleet.demo', licenseNumber: 'TX-CDL-883300', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], status: 'Rest / Sleeper', safetyScore: 96, hosHoursRemaining: 10.0, totalMilesDriven: 360000, incidentFreeDays: 450, baseStation: 'Midland Operations Center' },
  { id: 'DRV-224', name: 'Zachary Taylor', badgeNumber: 'DRV-924', phone: '(432) 555-0124', email: 'z.taylor@als-fleet.demo', licenseNumber: 'TX-CDL-112299', cdlClass: 'Class A', endorsements: ['Air Brakes'], status: 'Off Duty', safetyScore: 95, hosHoursRemaining: 12.0, totalMilesDriven: 420000, incidentFreeDays: 620, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-225', name: 'Aaron Montgomery', badgeNumber: 'DRV-925', phone: '(432) 555-0125', email: 'a.montgomery@als-fleet.demo', licenseNumber: 'TX-DL-554488', cdlClass: 'Standard', endorsements: [], status: 'Off Duty', safetyScore: 97, hosHoursRemaining: 11.0, totalMilesDriven: 115000, incidentFreeDays: 390, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-226', name: 'Brody Gallagher', badgeNumber: 'DRV-926', phone: '(432) 555-0126', email: 'b.gallagher@als-fleet.demo', licenseNumber: 'TX-CDL-449911', cdlClass: 'Class A', endorsements: ['Tanker', 'Air Brakes'], status: 'On Duty', safetyScore: 98, hosHoursRemaining: 7.5, totalMilesDriven: 290000, incidentFreeDays: 730, baseStation: 'Pecos Base Facility' },
  { id: 'DRV-227', name: 'Colton Davenport', badgeNumber: 'DRV-927', phone: '(701) 555-0127', email: 'c.davenport@als-fleet.demo', licenseNumber: 'ND-CDL-772211', cdlClass: 'Class A', endorsements: ['HazMat', 'Tanker', 'Air Brakes'], status: 'On Duty', safetyScore: 97, hosHoursRemaining: 8.0, totalMilesDriven: 340000, incidentFreeDays: 610, baseStation: 'Bakken Field Unit' },
  { id: 'DRV-228', name: 'Dalton Kirkpatrick', badgeNumber: 'DRV-928', phone: '(432) 555-0128', email: 'd.kirkpatrick@als-fleet.demo', licenseNumber: 'TX-CDL-338822', cdlClass: 'Class A', endorsements: ['Heavy Haul', 'Air Brakes'], status: 'Off Duty', safetyScore: 99, hosHoursRemaining: 11.5, totalMilesDriven: 475000, incidentFreeDays: 890, baseStation: 'Midland Operations Center' },
  { id: 'DRV-229', name: 'Elihu Mercer', badgeNumber: 'DRV-929', phone: '(361) 555-0129', email: 'e.mercer@als-fleet.demo', licenseNumber: 'TX-DL-994433', cdlClass: 'Standard', endorsements: [], status: 'On Duty', safetyScore: 96, hosHoursRemaining: 6.5, totalMilesDriven: 125000, incidentFreeDays: 480, baseStation: 'Eagle Ford Operations Yard' },
  { id: 'DRV-230', name: 'Ford Harrison', badgeNumber: 'DRV-930', phone: '(432) 555-0130', email: 'f.harrison@als-fleet.demo', licenseNumber: 'TX-CDL-115599', cdlClass: 'Class A', endorsements: ['HazMat', 'Air Brakes'], status: 'Rest / Sleeper', safetyScore: 98, hosHoursRemaining: 10.0, totalMilesDriven: 510000, incidentFreeDays: 950, baseStation: 'Pecos Base Facility' },
];

// 42 Synthetic Trips
export const INITIAL_TRIPS: VehicleTrip[] = [
  { id: 'TRIP-9001', vehicleId: 'VEH-101', vehicleCode: 'CRN-01', driverId: 'DRV-201', driverName: 'Hector Ramirez', origin: 'Pecos Base Facility', destination: 'Silver Spur 99-1H', associatedWellId: 'ALS-DEL-ESP-099', associatedWellName: 'Silver Spur 99-1H', purpose: 'Rig Mobilization & ESP Pull', startTime: '2026-10-28 07:15 UTC', distanceMiles: 38.4, durationMinutes: 45, avgSpeedMph: 48, fuelUsedGal: 8.0, status: 'In Progress' },
  { id: 'TRIP-9002', vehicleId: 'VEH-102', vehicleCode: 'WIRE-02', driverId: 'DRV-202', driverName: 'Travis McCord', origin: 'Pecos Base Facility', destination: 'Red River Federal 82-4H', associatedWellId: 'ALS-DEL-ESP-082', associatedWellName: 'Red River Federal 82-4H', purpose: 'Downhole MLE Cable Inspection', startTime: '2026-10-28 06:40 UTC', endTime: '2026-10-28 07:42 UTC', distanceMiles: 42.1, durationMinutes: 62, avgSpeedMph: 40.7, fuelUsedGal: 7.8, status: 'Completed' },
  { id: 'TRIP-9003', vehicleId: 'VEH-104', vehicleCode: 'SL-04', driverId: 'DRV-204', driverName: 'Jesse Vance', origin: 'Midland Operations Center', destination: 'Phantom State 104-2H', associatedWellId: 'ALS-DEL-ESP-104', associatedWellName: 'Phantom State 104-2H', purpose: 'Acoustic Fluid Level Echo Shoot', startTime: '2026-10-28 07:05 UTC', distanceMiles: 52.6, durationMinutes: 58, avgSpeedMph: 54.4, fuelUsedGal: 9.7, status: 'In Progress' },
  { id: 'TRIP-9004', vehicleId: 'VEH-106', vehicleCode: 'CREW-11', driverId: 'DRV-206', driverName: 'Cole Hawkins', origin: 'Pecos Depot', destination: 'War Admiral 112-1H', associatedWellId: 'ALS-DEL-ESP-112', associatedWellName: 'War Admiral 112-1H', purpose: 'Surface Wellhead Choke Trim', startTime: '2026-10-28 07:30 UTC', distanceMiles: 21.0, durationMinutes: 28, avgSpeedMph: 45.0, fuelUsedGal: 1.9, status: 'In Progress' },
  { id: 'TRIP-9005', vehicleId: 'VEH-108', vehicleCode: 'PUMP-07', driverId: 'DRV-208', driverName: 'Garrett Holt', origin: 'Pecos Yard', destination: 'Loving County State 44-3H', associatedWellId: 'ALS-DEL-ESP-044', associatedWellName: 'Loving County State 44-3H', purpose: 'Casing Flush & Pressure Test', startTime: '2026-10-28 07:10 UTC', distanceMiles: 34.5, durationMinutes: 44, avgSpeedMph: 47.0, fuelUsedGal: 6.8, status: 'In Progress' },
  { id: 'TRIP-9006', vehicleId: 'VEH-111', vehicleCode: 'CREW-14', driverId: 'DRV-211', driverName: 'Logan Pierce', origin: 'Pecos Central', destination: 'Phantom State 104-2H', associatedWellId: 'ALS-DEL-ESP-104', associatedWellName: 'Phantom State 104-2H', purpose: 'VFD Ground Resistance Audit', startTime: '2026-10-28 07:40 UTC', distanceMiles: 16.8, durationMinutes: 19, avgSpeedMph: 53.0, fuelUsedGal: 1.2, status: 'In Progress' },
  { id: 'TRIP-9007', vehicleId: 'VEH-113', vehicleCode: 'VAC-01', driverId: 'DRV-213', driverName: 'Mason Rivera', origin: 'Midland Base', destination: 'Red River Federal 82-4H', associatedWellId: 'ALS-DEL-ESP-082', associatedWellName: 'Red River Federal 82-4H', purpose: 'Cellar Cleanout & Pit Hydro-Vac', startTime: '2026-10-28 07:00 UTC', distanceMiles: 48.2, durationMinutes: 65, avgSpeedMph: 44.5, fuelUsedGal: 8.8, status: 'In Progress' },
  { id: 'TRIP-9008', vehicleId: 'VEH-115', vehicleCode: 'WIRE-15', driverId: 'DRV-215', driverName: 'Preston Miller', origin: 'Midland Operations', destination: 'Midland Basin Ranch 210-4H', associatedWellId: 'ALS-MID-ESP-210', associatedWellName: 'Midland Basin Ranch 210-4H', purpose: 'Downhole Sensor Log Sweep', startTime: '2026-10-28 07:20 UTC', distanceMiles: 54.0, durationMinutes: 52, avgSpeedMph: 62.3, fuelUsedGal: 8.3, status: 'In Progress' },
  { id: 'TRIP-9009', vehicleId: 'VEH-117', vehicleCode: 'CREW-18', driverId: 'DRV-217', driverName: 'Riley Bennett', origin: 'Watford City Yard', destination: 'Fort Berthold 12-4H', associatedWellId: 'ALS-BAK-PCP-012', associatedWellName: 'Fort Berthold 12-4H', purpose: 'PCP Hydraulic Head Inspection', startTime: '2026-10-28 07:25 UTC', distanceMiles: 29.4, durationMinutes: 38, avgSpeedMph: 46.4, fuelUsedGal: 2.5, status: 'In Progress' },
  { id: 'TRIP-9010', vehicleId: 'VEH-121', vehicleCode: 'CBL-05', driverId: 'DRV-221', driverName: 'Wesley Crawford', origin: 'Pecos Base', destination: 'War Admiral 112-1H', associatedWellId: 'ALS-DEL-ESP-112', associatedWellName: 'War Admiral 112-1H', purpose: 'Power Cable Re-banding Delivery', startTime: '2026-10-28 07:12 UTC', distanceMiles: 36.0, durationMinutes: 42, avgSpeedMph: 51.4, fuelUsedGal: 6.3, status: 'In Progress' },
  // Completed trips (11 - 42)
  ...Array.from({ length: 32 }, (_, i) => {
    const tripNum = 9011 + i;
    const dist = Math.round((18 + (i * 3.7) % 65) * 10) / 10;
    const duration = Math.round(dist * 1.3);
    const speed = Math.round((dist / (duration / 60)) * 10) / 10;
    const fuel = Math.round((dist / (5.2 + (i % 3))) * 10) / 10;
    const dayAgo = Math.floor(i / 6) + 1;
    const wellNames = ['Phantom State 104-2H', 'Red River Federal 82-4H', 'Canyon Creek 19-3H', 'Silver Spur 99-1H', 'Fort Berthold 05-1H', 'Midland Basin Ranch 215-2H'];
    const chosenWell = wellNames[i % wellNames.length];
    const purposes = ['Routine Pad Surveillance', 'Chemical Squeeze Flush', 'Preventative Lubrication', 'Sensor Calibration', 'Acoustic Shoot', 'Choke Verification'];

    return {
      id: `TRIP-${tripNum}`,
      vehicleId: `VEH-${101 + (i % 22)}`,
      vehicleCode: INITIAL_FLEET_VEHICLES[i % 22].unitCode,
      driverId: INITIAL_DRIVERS[i % 30].id,
      driverName: INITIAL_DRIVERS[i % 30].name,
      origin: i % 2 === 0 ? 'Pecos Base Facility' : 'Midland Operations Center',
      destination: chosenWell,
      associatedWellName: chosenWell,
      purpose: purposes[i % purposes.length],
      startTime: `2026-10-${28 - dayAgo} 0${6 + (i % 4)}:00 UTC`,
      endTime: `2026-10-${28 - dayAgo} 0${7 + (i % 4)}:${duration % 60} UTC`,
      distanceMiles: dist,
      durationMinutes: duration,
      avgSpeedMph: speed,
      fuelUsedGal: fuel,
      status: 'Completed' as const,
    };
  }),
];

// Maintenance Plans
export const INITIAL_MAINTENANCE_PLANS: VehicleMaintenancePlan[] = [
  { id: 'MAINT-401', vehicleId: 'VEH-107', vehicleCode: 'OIL-03', serviceType: 'Brake System Overhaul', priority: 'Mandatory Safety', dueDate: '2026-10-29', dueMiles: 112500, estimatedCostUsd: 2850, status: 'In Service', serviceVendor: 'Pecos Commercial Truck & Brake', notes: 'Rear air brake drum replacement and S-cam bushing rebuild.' },
  { id: 'MAINT-402', vehicleId: 'VEH-118', vehicleCode: 'RIG-09', serviceType: 'Heavy Hydraulic Flush', priority: 'Urgent', dueDate: '2026-10-30', dueMiles: 125000, estimatedCostUsd: 4200, status: 'In Service', serviceVendor: 'Permian Rig Hydraulics', notes: 'Main winch hydraulic pump seal replacement and high-pressure filter sweep.' },
  { id: 'MAINT-403', vehicleId: 'VEH-105', vehicleCode: 'CHEM-08', serviceType: 'DOT Annual Inspection', priority: 'Mandatory Safety', dueDate: '2026-11-05', dueMiles: 55000, estimatedCostUsd: 650, status: 'Scheduled', serviceVendor: 'Midland Fleet Safety Center', notes: 'Full annual DOT safety certificate and hazmat tank pressure re-cert.' },
  { id: 'MAINT-404', vehicleId: 'VEH-101', vehicleCode: 'CRN-01', serviceType: 'Crane Wire Rope Cert', priority: 'Mandatory Safety', dueDate: '2026-11-15', dueMiles: 70000, estimatedCostUsd: 1950, status: 'Scheduled', serviceVendor: 'Apex Crane Certification', notes: 'Non-destructive electromagnetic rope scan and load test.' },
  { id: 'MAINT-405', vehicleId: 'VEH-104', vehicleCode: 'SL-04', serviceType: 'Engine Oil & Filter', priority: 'Routine', dueDate: '2026-11-20', dueMiles: 85000, estimatedCostUsd: 480, status: 'Scheduled', serviceVendor: 'Speedy Fleet Lube Pecos', notes: 'Full synthetic 15W-40, fuel water separator, and air induction filters.' },
  { id: 'MAINT-406', vehicleId: 'VEH-112', vehicleCode: 'RIG-05', serviceType: 'Tire Rotation & Alignment', priority: 'Routine', dueDate: '2026-10-31', dueMiles: 146000, estimatedCostUsd: 1200, status: 'Scheduled', serviceVendor: 'Commercial Tire Pros', notes: 'Drive steer alignment and casing retread check.' },
];

// Fuel & Fleet Transactions (Slide 36 & 37)
export const INITIAL_FLEET_TRANSACTIONS: FleetTransaction[] = [
  { id: 'TXN-801', vehicleId: 'VEH-101', vehicleCode: 'CRN-01', driverName: 'Hector Ramirez', type: 'Fuel Card', timestamp: '2026-10-28 06:50 UTC', location: 'Pecos Travel Center Pump 8', gallons: 10.6, liters: 40.0, odometer: 68420, economyKmL: 8.4, anomaly: 'Normal', pricePerGal: 3.79, amountUsd: 151.60, receiptRef: 'REC-PEC-9921' },
  { id: 'TXN-802', vehicleId: 'VEH-104', vehicleCode: 'SL-04', driverName: 'Jesse Vance', type: 'Fuel Card', timestamp: '2026-10-28 06:40 UTC', location: 'Midland Fleet Depot Cardlock', gallons: 11.1, liters: 42.0, odometer: 84320, economyKmL: 8.6, anomaly: 'Normal', pricePerGal: 3.75, amountUsd: 157.50, receiptRef: 'REC-MID-1142' },
  { id: 'TXN-803', vehicleId: 'VEH-106', vehicleCode: 'CREW-11', driverName: 'Cole Hawkins', type: 'Fuel Card', timestamp: '2026-10-28 07:15 UTC', location: 'Kermit Strip Cardlock', gallons: 9.8, liters: 37.0, odometer: 32100, economyKmL: 9.2, anomaly: 'Normal', pricePerGal: 3.82, amountUsd: 141.34, receiptRef: 'REC-KER-4401' },
  { id: 'TXN-804', vehicleId: 'VEH-108', vehicleCode: 'TKR-05', driverName: 'Garrett Holt', type: 'Fuel Card', timestamp: '2026-10-28 03:14 UTC', location: 'Loving County Highway 302', gallons: 13.2, liters: 50.0, odometer: 74210, economyKmL: 4.8, anomaly: 'Rapid Tank Drop (-22%)', pricePerGal: 3.78, amountUsd: 189.00, receiptRef: 'REC-LOV-8821' },
  { id: 'TXN-805', vehicleId: 'VEH-102', vehicleCode: 'CRN-02', driverName: 'Travis McCord', type: 'Fuel Card', timestamp: '2026-10-28 05:22 UTC', location: 'Orla Bulk Station Pump 3', gallons: 12.7, liters: 48.0, odometer: 92450, economyKmL: 5.1, anomaly: 'High Consumption (Grade Climb)', pricePerGal: 3.77, amountUsd: 180.96, receiptRef: 'REC-ORL-2201' },
  { id: 'TXN-806', vehicleId: 'VEH-107', vehicleCode: 'OIL-03', driverName: 'Wyatt Sterling', type: 'Preventative Service', timestamp: '2026-10-27 15:30 UTC', location: 'Pecos Commercial Truck', amountUsd: 2850.00, receiptRef: 'INV-PC-7712' },
  { id: 'TXN-807', vehicleId: 'VEH-111', vehicleCode: 'CREW-14', driverName: 'Logan Pierce', type: 'Tire Replacement', timestamp: '2026-10-25 09:10 UTC', location: 'Commercial Tire Pros Pecos', amountUsd: 420.00, receiptRef: 'INV-CT-1092' },
];

export const FleetService = {
  getVehicles(): FleetVehicle[] {
    try {
      const data = localStorage.getItem(FLEET_STORAGE_KEYS.VEHICLES);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_FLEET_VEHICLES;
  },

  saveVehicles(vehicles: FleetVehicle[]): void {
    localStorage.setItem(FLEET_STORAGE_KEYS.VEHICLES, JSON.stringify(vehicles));
    window.dispatchEvent(new Event('fleet_update'));
  },

  addVehicle(vehicle: FleetVehicle): FleetVehicle[] {
    const list = this.getVehicles();
    const updated = [vehicle, ...list];
    this.saveVehicles(updated);
    return updated;
  },

  updateVehicle(vehicle: FleetVehicle): FleetVehicle[] {
    const list = this.getVehicles();
    const updated = list.map(v => v.id === vehicle.id ? { ...vehicle, updatedAt: new Date().toISOString() } : v);
    this.saveVehicles(updated);
    return updated;
  },

  deleteVehicle(id: string): FleetVehicle[] {
    const list = this.getVehicles();
    const updated = list.filter(v => v.id !== id);
    this.saveVehicles(updated);
    return updated;
  },

  getDrivers(): DriverProfile[] {
    try {
      const data = localStorage.getItem(FLEET_STORAGE_KEYS.DRIVERS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_DRIVERS;
  },

  saveDrivers(drivers: DriverProfile[]): void {
    localStorage.setItem(FLEET_STORAGE_KEYS.DRIVERS, JSON.stringify(drivers));
    window.dispatchEvent(new Event('fleet_update'));
  },

  addDriver(driver: DriverProfile): DriverProfile[] {
    const list = this.getDrivers();
    const updated = [driver, ...list];
    this.saveDrivers(updated);
    return updated;
  },

  updateDriver(driver: DriverProfile): DriverProfile[] {
    const list = this.getDrivers();
    const updated = list.map(d => d.id === driver.id ? driver : d);
    this.saveDrivers(updated);
    return updated;
  },

  getTrips(): VehicleTrip[] {
    try {
      const data = localStorage.getItem(FLEET_STORAGE_KEYS.TRIPS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_TRIPS;
  },

  saveTrips(trips: VehicleTrip[]): void {
    localStorage.setItem(FLEET_STORAGE_KEYS.TRIPS, JSON.stringify(trips));
    window.dispatchEvent(new Event('fleet_update'));
  },

  addTrip(trip: VehicleTrip): VehicleTrip[] {
    const list = this.getTrips();
    const updated = [trip, ...list];
    this.saveTrips(updated);
    return updated;
  },

  getMaintenancePlans(): VehicleMaintenancePlan[] {
    try {
      const data = localStorage.getItem(FLEET_STORAGE_KEYS.MAINTENANCE);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_MAINTENANCE_PLANS;
  },

  saveMaintenancePlans(plans: VehicleMaintenancePlan[]): void {
    localStorage.setItem(FLEET_STORAGE_KEYS.MAINTENANCE, JSON.stringify(plans));
    window.dispatchEvent(new Event('fleet_update'));
  },

  getTransactions(): FleetTransaction[] {
    try {
      const data = localStorage.getItem(FLEET_STORAGE_KEYS.TRANSACTIONS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_FLEET_TRANSACTIONS;
  },

  saveTransactions(txns: FleetTransaction[]): void {
    localStorage.setItem(FLEET_STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txns));
    window.dispatchEvent(new Event('fleet_update'));
  },

  resetAll(): void {
    this.saveVehicles(INITIAL_FLEET_VEHICLES);
    this.saveDrivers(INITIAL_DRIVERS);
    this.saveTrips(INITIAL_TRIPS);
    this.saveMaintenancePlans(INITIAL_MAINTENANCE_PLANS);
    this.saveTransactions(INITIAL_FLEET_TRANSACTIONS);
  },
};
