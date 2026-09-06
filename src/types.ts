export type UserRole = 
  | 'investigador' 
  | 'planificador' 
  | 'analista' 
  | 'admin_iot' 
  | 'ciudadano';

export interface UserPermissions {
  canSimulateMl: boolean;
  canInjectIoT: boolean;
  canExportReports: boolean;
  canModifyZones: boolean;
  canManageUsers: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  institution: string;
  avatar?: string;
  passwordHash?: string;
  salt?: string;
  createdAt?: string;
  lastLogin?: string;
  token?: string;
}

export interface EnvironmentalReading {
  timestamp: string;
  pm25: number;      // µg/m³
  pm10: number;      // µg/m³
  no2: number;       // ppb
  o3: number;        // ppb
  co: number;        // ppm
  co2: number;       // ppm
  temperature: number; // °C
  humidity: number;    // %
  windSpeed: number;   // m/s
  windDirection: string; // N, NE, E, SE, S, SW, W, NW
  solarRadiation: number; // W/m²
  heatIndex: number;   // °C
  uhiDelta: number;    // °C vs rural baseline
  petScore: number;    // Physiological Equivalent Temperature °C
  tcsScore: number;    // Thermal Comfort Score (0 - 100)
  aqiIndex: number;    // 0 - 500
  aqiCategory: 'Buena' | 'Moderada' | 'Dañina para grupos sensibles' | 'Dañina' | 'Muy dañina' | 'Peligrosa';
}

export interface SensorNode {
  id: string;
  code: string;
  name: string;
  zoneId: string;
  zoneName: string;
  lat: number;
  lng: number;
  elevation: number; // m
  streetCanyonHWRatio: number; // Altura/Ancho de calle
  canopyCoverPercent: number; // % cobertura vegetal
  sealedSurfacePercent: number; // % suelo sellado
  trafficDensity: 'Bajo' | 'Medio' | 'Alto' | 'Muy Crítico';
  sensorType: 'PMS5003 + SHT31' | 'Sensirion SPS30 + BME680' | 'Alphasense OPC-N3';
  calibrationStatus: 'Calibrado (2-Etapas Zhivkov)' | 'Sin Calibrar' | 'En Validación';
  r2ScoreRaw: number;
  r2ScoreCalibrated: number;
  status: 'online' | 'warning' | 'offline';
  rssi?: number;       // dBm
  batteryPct?: number; // %
  lastReading: EnvironmentalReading;
  hourlyHistory: EnvironmentalReading[];
}

export interface UrbanZone {
  id: string;
  name: string;
  district: string;
  department: string; // Departamento del Perú (La Libertad, Lima, Arequipa...)
  description: string;
  vulnerabilityLevel: 'Alta' | 'Muy Alta' | 'Media' | 'Crítica';
  targetPopulation: number;
  vulnerablePopulation: number; // Niños y adultos mayores
  baselineTemp: number; // °C
  baselinePM25: number; // µg/m³
  treeCover: number; // %
  builtDensity: number; // %
  primaryPollutionSource: string;
  geometryCoords: { x: number; y: number }[];
  sensorsCount: number;
}

export type SimulationModelType = 
  | '1d_cnn' 
  | 'gnn' 
  | 'random_forest' 
  | 'bi_lstm' 
  | 'xgboost';

export interface AiModelMetric {
  id: string;
  name: string;
  modelType?: SimulationModelType;
  architecture: string;
  referenceAuthor: string;
  year: number;
  r2: number;
  rmse: number;
  mae: number;
  mape: number; // %
  trainingTimeSec: number;
  inferenceTimeMs: number;
  spatialResolution: string;
  bestFitUse: string;
  status: 'Recomendado' | 'Evaluado' | 'Línea Base';
  features: string[];
}

export type NbsType = 
  | 'arbolado_corredor' 
  | 'techo_verde' 
  | 'muro_verde' 
  | 'pavimento_permeable' 
  | 'jardin_lluvia';

export interface NbsIntervention {
  id: string;
  name: string;
  type: NbsType;
  description: string;
  recommendedFlora: string[];
  unitCostPEN: number; // Soles per m² or per tree
  unitMaintenancePENYear: number;
  coolingCapacityC: number; // Reducción de temperatura esperada °C
  pmReductionPercent: number; // % Reducción de PM2.5/PM10
  waterRetentionLPerM2: number;
  co2SequestrationKgYear: number;
  acousticDampingDb: number;
}

export interface SimulationMlParams {
  modelType: SimulationModelType;
  canyonHWRatio: number; // 0.8 a 2.8
  canyonOrientation: 'N-S' | 'E-O' | 'NE-SO' | 'NO-SE';
  surfaceAlbedo: number; // 0.15 (asfalto viejo) a 0.70 (pavimento frío)
  backgroundWindSpeed: number; // m/s
  backgroundSolarRadiation: number; // W/m²
  ambientRelativeHumidity: number; // %
  targetAreaM2: number;
  selectedSpecies: string;
  treeCanopyDensityPct: number; // 0 a 100%
  greenRoofCoveragePct: number; // 0 a 100%
  greenWallAreaM2: number;
  coolPavementAreaM2: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  zoneId: string;
  zoneName: string;
  mlParams?: SimulationMlParams;
  selectedNbs: {
    nbsId: string;
    quantityOrArea: number; // m² or count
  }[];
  ambientWindSpeed: number;
  ambientSolarRadiation: number;
  simulationHours: number;
  results: {
    initialTemp: number;
    simulatedTemp: number;
    tempReduction: number;
    initialPM25: number;
    simulatedPM25: number;
    pm25ReductionPercent: number;
    initialPM10?: number;
    simulatedPM10?: number;
    pm10ReductionPercent?: number;
    initialO3?: number;
    simulatedO3?: number;
    o3ReductionPercent?: number;
    initialNO2?: number;
    simulatedNO2?: number;
    no2ReductionPercent?: number;
    initialUhiDelta: number;
    simulatedUhiDelta: number;
    petBefore: number;
    petAfter: number;
    tcsScoreBefore: number;
    tcsScoreAfter: number;
    totalBudgetPEN: number;
    co2CapturedTonYear: number;
    stormwaterRetentionM3?: number;
    exposedPopulationBenefited: number;
    modelUsedName?: string;
    modelR2Score?: number;
  };
}

export interface ThesisObjectiveEvaluation {
  code: string;
  title: string;
  status: 'Completado' | 'En Ejecución' | 'Validado';
  progressPercent: number;
  metrics: { name: string; target: string; achieved: string; compliance: boolean }[];
  summary: string;
}

// IoT Protocol & Telemetry Types
export interface IoTTelemetryPayload {
  sensor_code: string;
  zone_id: string;
  timestamp: string;
  raw_pm25: number;
  raw_pm10: number;
  raw_o3: number;
  raw_no2: number;
  raw_temp: number;
  raw_humidity: number;
  battery_level: number;
  rssi_dbm: number;
  firmware_ver?: string;
}

export interface QaQcValidation {
  isValid: boolean;
  flags: string[];
  appliedCorrections: {
    hygroscopicFactor: number;
    thermalDriftDelta: number;
    calibrated_pm25: number;
    calibrated_temp: number;
    calibrated_o3: number;
  };
}

export interface IngestionLog {
  id: string;
  timestamp: string;
  protocol: 'MQTT' | 'REST_API' | 'WEBSOCKET';
  topicOrEndpoint: string;
  sensorCode: string;
  status: 'ACCEPTED_CALIBRATED' | 'ACCEPTED_RAW' | 'REJECTED_QAQC';
  rawPM25: number;
  calibratedPM25: number;
  rawTemp: number;
  calibratedTemp: number;
  rawO3: number;
  calibratedO3: number;
  qaFlags: string[];
  latencyMs: number;
}
