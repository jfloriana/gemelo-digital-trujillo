import { UrbanZone, SensorNode, AiModelMetric, NbsIntervention, ThesisObjectiveEvaluation, User } from '../types';

export const DEMO_USERS: User[] = [
  {
    id: 'user-1',
    name: 'Demo Investigador UNT',
    email: 'investigador.demo@unt.edu.pe',
    role: 'investigador',
    institution: 'Universidad Nacional de Trujillo - Demo',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'user-2',
    name: 'Arq. Carlos Mendoza',
    email: 'cmendoza@munitrujillo.gob.pe',
    role: 'planificador',
    institution: 'Municipalidad Provincial de Trujillo - Gerencia de Desarrollo Urbano',
  },
  {
    id: 'user-3',
    name: 'Biól. Elena Ramos',
    email: 'eramos@oefa.gob.pe',
    role: 'analista',
    institution: 'OEFA / SENAMHI La Libertad - Fiscalización Ambiental',
  },
  {
    id: 'user-4',
    name: 'Vecino Vigilante Trujillo',
    email: 'ciudadano.trujillo@gmail.com',
    role: 'ciudadano',
    institution: 'Comité Ambiental Ciudadano - Centro Histórico Trujillo',
  }
];

export const TRUJILLO_ZONES: UrbanZone[] = [
  {
    id: 'zona-centro',
    name: 'Zona 1: Centro Histórico (Av. España / Jr. Pizarro)',
    district: 'Trujillo Cercado',
    description: 'Cañón urbano estrecho colonial con alta densidad peatonal y comercial, tráfico congestionado en anillo perimétrico Av. España y baja presencia de arbolado nativo.',
    vulnerabilityLevel: 'Muy Alta',
    targetPopulation: 42500,
    vulnerablePopulation: 14200,
    baselineTemp: 29.4,
    baselinePM25: 48.2,
    treeCover: 5.8,
    builtDensity: 84.5,
    primaryPollutionSource: 'Tráfico vehicular pesado/combis, cañón urbano con recirculación de vórtice y baja dispersión.',
    geometryCoords: [
      { x: 10, y: 10 }, { x: 90, y: 10 }, { x: 90, y: 90 }, { x: 10, y: 90 }
    ],
    sensorsCount: 4
  },
  {
    id: 'zona-mayorista',
    name: 'Zona 2: Corredor Av. América Sur / Mercado Mayorista',
    district: 'Trujillo Cercado / El Bosque',
    description: 'Punto crítico comercial y logístico de alto tránsito diésel pesado, microbuses, mototaxis y carga continua con alta emisión de material particulado y calor antropogénico.',
    vulnerabilityLevel: 'Crítica',
    targetPopulation: 68000,
    vulnerablePopulation: 22800,
    baselineTemp: 31.8,
    baselinePM25: 64.7,
    treeCover: 3.2,
    builtDensity: 91.0,
    primaryPollutionSource: 'Flota de carga pesada diésel, paraderos informales y asfalto degradado con alta radiación térmica.',
    geometryCoords: [
      { x: 15, y: 20 }, { x: 85, y: 15 }, { x: 80, y: 85 }, { x: 20, y: 80 }
    ],
    sensorsCount: 5
  },
  {
    id: 'zona-mansiche',
    name: 'Zona 3: Intercambio Vial Av. Mansiche / Mall Plaza',
    district: 'Trujillo / Huanchaco',
    description: 'Nodo vial metropolitano con alta velocidad y volumen vehicular continuo, grandes explanadas de pavimento asfaltado y estacionamientos que generan isla de calor.',
    vulnerabilityLevel: 'Media',
    targetPopulation: 35000,
    vulnerablePopulation: 9500,
    baselineTemp: 28.6,
    baselinePM25: 38.5,
    treeCover: 11.4,
    builtDensity: 72.0,
    primaryPollutionSource: 'Flujo vehicular continuo alta velocidad, calor reflejado por cubiertas metálicas y pavimentos.',
    geometryCoords: [
      { x: 5, y: 15 }, { x: 95, y: 10 }, { x: 90, y: 85 }, { x: 10, y: 90 }
    ],
    sensorsCount: 3
  },
  {
    id: 'zona-porvenir',
    name: 'Zona 4: Distrito El Porvenir (Sector Industrial Calzado)',
    district: 'El Porvenir',
    description: 'Zona de microempresas de calzado y curtiembres con calderas artesanales, calles con déficit de pavimentación y cobertura vegetal casi nula (<2.5%).',
    vulnerabilityLevel: 'Crítica',
    targetPopulation: 115000,
    vulnerablePopulation: 41000,
    baselineTemp: 32.5,
    baselinePM25: 72.3,
    treeCover: 2.1,
    builtDensity: 94.0,
    primaryPollutionSource: 'Combustión industrial, solventes COVs, polvo resuspendido y alta radiación superficial.',
    geometryCoords: [
      { x: 20, y: 10 }, { x: 95, y: 25 }, { x: 85, y: 95 }, { x: 10, y: 85 }
    ],
    sensorsCount: 4
  },
  {
    id: 'zona-victor-larco',
    name: 'Zona 5: Víctor Larco Herrera (Av. Larco / Huamán)',
    district: 'Víctor Larco',
    description: 'Corredor residencial-comercial con influencia de brisa marina vespertina pero con episodios matutinos de inversión térmica y congestión en horas punta.',
    vulnerabilityLevel: 'Media',
    targetPopulation: 52000,
    vulnerablePopulation: 16000,
    baselineTemp: 26.8,
    baselinePM25: 32.1,
    treeCover: 14.6,
    builtDensity: 65.0,
    primaryPollutionSource: 'Tráfico de transporte público y particular hacia balneario de Huanchaco/Buenos Aires.',
    geometryCoords: [
      { x: 10, y: 15 }, { x: 90, y: 20 }, { x: 85, y: 85 }, { x: 15, y: 80 }
    ],
    sensorsCount: 3
  },
  {
    id: 'zona-hermelinda',
    name: 'Zona 6: Complejo La Hermelinda (Av. Villarreal / 8 de Octubre)',
    district: 'Florencia de Mora / Trujillo',
    description: 'Mercado de abastos informal de mayor escala en el norte del país, acumulación de residuos, tráfico desordenado y alto índice de partículas gruesas y finas.',
    vulnerabilityLevel: 'Muy Alta',
    targetPopulation: 85000,
    vulnerablePopulation: 29000,
    baselineTemp: 31.2,
    baselinePM25: 68.9,
    treeCover: 1.8,
    builtDensity: 92.5,
    primaryPollutionSource: 'Tráfico logístico incesante, residuos orgánicos e inorgánicos, quema clandestina periférica.',
    geometryCoords: [
      { x: 15, y: 10 }, { x: 88, y: 18 }, { x: 82, y: 92 }, { x: 12, y: 88 }
    ],
    sensorsCount: 4
  }
];

const generateHourlyReadings = (basePM: number, baseTemp: number, isCalibrated = true) => {
  const hours = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  return hours.map((hour, idx) => {
    // Traffic peak at 08:00 and 18:00, Heat peak at 14:00
    const trafficFactor = idx === 4 || idx === 9 ? 1.45 : (idx >= 3 && idx <= 10 ? 1.15 : 0.75);
    const solarFactor = Math.sin((idx / 11) * Math.PI) * 5.2;
    const currentTemp = Number((baseTemp - 3 + solarFactor).toFixed(1));
    const currentPM25 = Number((basePM * trafficFactor + (isCalibrated ? 0 : 15.4)).toFixed(1));
    const currentPM10 = Number((currentPM25 * 1.78).toFixed(1));
    const humidity = Math.max(45, Math.min(88, Number((78 - solarFactor * 3.8).toFixed(0))));
    const windSpeed = Number((1.8 + Math.random() * 2.4).toFixed(1));
    const uhiDelta = Number((Math.max(1.2, (currentTemp - 23.5) * 0.65)).toFixed(1));
    const petScore = Number((currentTemp + (solarFactor * 0.8) + (humidity > 70 ? 2.5 : 0)).toFixed(1));
    const tcsScore = Math.max(15, Math.min(100, Math.round(100 - (currentTemp - 20) * 4.5 - (currentPM25 / 1.5))));

    let aqiCategory: 'Buena' | 'Moderada' | 'Dañina para grupos sensibles' | 'Dañina' | 'Muy dañina' | 'Peligrosa' = 'Moderada';
    if (currentPM25 <= 12) aqiCategory = 'Buena';
    else if (currentPM25 <= 35.4) aqiCategory = 'Moderada';
    else if (currentPM25 <= 55.4) aqiCategory = 'Dañina para grupos sensibles';
    else if (currentPM25 <= 150.4) aqiCategory = 'Dañina';
    else aqiCategory = 'Muy dañina';

    return {
      timestamp: `Hoy ${hour}`,
      pm25: currentPM25,
      pm10: currentPM10,
      no2: Number((24 + trafficFactor * 18).toFixed(1)),
      o3: Number((18 + solarFactor * 4.2).toFixed(1)),
      co: Number((1.2 + trafficFactor * 1.1).toFixed(2)),
      co2: Number((415 + trafficFactor * 42).toFixed(0)),
      temperature: currentTemp,
      humidity,
      windSpeed,
      windDirection: 'SO (Suroeste - Brisa Marina)',
      solarRadiation: Number((Math.max(0, solarFactor * 160)).toFixed(0)),
      heatIndex: Number((currentTemp + (humidity / 100) * 2.8).toFixed(1)),
      uhiDelta,
      petScore,
      tcsScore,
      aqiIndex: Math.round(currentPM25 * 2.8),
      aqiCategory
    };
  });
};

export const SENSOR_NODES: SensorNode[] = [
  {
    id: 'sensor-trj-01',
    code: 'TRJ-IOT-01',
    name: 'Nodo Av. España / Jr. Orbegoso (Anillo Centro)',
    zoneId: 'zona-centro',
    zoneName: 'Centro Histórico',
    lat: -8.1116,
    lng: -79.0287,
    elevation: 34,
    streetCanyonHWRatio: 2.1,
    canopyCoverPercent: 4.2,
    sealedSurfacePercent: 92.0,
    trafficDensity: 'Muy Crítico',
    sensorType: 'Sensirion SPS30 + BME680',
    calibrationStatus: 'Calibrado (2-Etapas Zhivkov)',
    r2ScoreRaw: 0.31,
    r2ScoreCalibrated: 0.94,
    status: 'online',
    lastReading: {
      timestamp: '22:30',
      pm25: 46.8,
      pm10: 83.2,
      no2: 38.4,
      o3: 21.0,
      co: 2.1,
      co2: 452,
      temperature: 28.9,
      humidity: 71,
      windSpeed: 2.1,
      windDirection: 'SO',
      solarRadiation: 420,
      heatIndex: 30.8,
      uhiDelta: 4.6,
      petScore: 32.4,
      tcsScore: 42,
      aqiIndex: 128,
      aqiCategory: 'Dañina para grupos sensibles'
    },
    hourlyHistory: generateHourlyReadings(46.8, 28.9)
  },
  {
    id: 'sensor-trj-02',
    code: 'TRJ-IOT-02',
    name: 'Nodo Plaza Mayor de Trujillo (Monitoreo Peatonal)',
    zoneId: 'zona-centro',
    zoneName: 'Centro Histórico',
    lat: -8.1118,
    lng: -79.0289,
    elevation: 35,
    streetCanyonHWRatio: 0.8,
    canopyCoverPercent: 18.5,
    sealedSurfacePercent: 78.0,
    trafficDensity: 'Medio',
    sensorType: 'PMS5003 + SHT31',
    calibrationStatus: 'Calibrado (2-Etapas Zhivkov)',
    r2ScoreRaw: 0.28,
    r2ScoreCalibrated: 0.91,
    status: 'online',
    lastReading: {
      timestamp: '22:30',
      pm25: 29.4,
      pm10: 51.8,
      no2: 21.2,
      o3: 24.5,
      co: 1.1,
      co2: 421,
      temperature: 27.2,
      humidity: 74,
      windSpeed: 3.2,
      windDirection: 'SO',
      solarRadiation: 405,
      heatIndex: 28.6,
      uhiDelta: 2.9,
      petScore: 29.1,
      tcsScore: 68,
      aqiIndex: 88,
      aqiCategory: 'Moderada'
    },
    hourlyHistory: generateHourlyReadings(29.4, 27.2)
  },
  {
    id: 'sensor-trj-03',
    code: 'TRJ-IOT-03',
    name: 'Nodo Av. América Sur / Mercado Mayorista Principal',
    zoneId: 'zona-mayorista',
    zoneName: 'Corredor Mayorista',
    lat: -8.1194,
    lng: -79.0192,
    elevation: 32,
    streetCanyonHWRatio: 1.6,
    canopyCoverPercent: 2.0,
    sealedSurfacePercent: 96.0,
    trafficDensity: 'Muy Crítico',
    sensorType: 'Alphasense OPC-N3',
    calibrationStatus: 'Calibrado (2-Etapas Zhivkov)',
    r2ScoreRaw: 0.35,
    r2ScoreCalibrated: 0.96,
    status: 'online',
    lastReading: {
      timestamp: '22:30',
      pm25: 67.4,
      pm10: 118.9,
      no2: 49.6,
      o3: 16.8,
      co: 3.2,
      co2: 495,
      temperature: 32.1,
      humidity: 65,
      windSpeed: 1.4,
      windDirection: 'S',
      solarRadiation: 510,
      heatIndex: 35.2,
      uhiDelta: 6.2,
      petScore: 36.8,
      tcsScore: 24,
      aqiIndex: 158,
      aqiCategory: 'Dañina'
    },
    hourlyHistory: generateHourlyReadings(67.4, 32.1)
  },
  {
    id: 'sensor-trj-04',
    code: 'TRJ-IOT-04',
    name: 'Nodo Sector Calzado - Av. Pumacahua (El Porvenir)',
    zoneId: 'zona-porvenir',
    zoneName: 'El Porvenir Industrial',
    lat: -8.0892,
    lng: -79.0014,
    elevation: 58,
    streetCanyonHWRatio: 1.9,
    canopyCoverPercent: 1.5,
    sealedSurfacePercent: 94.0,
    trafficDensity: 'Alto',
    sensorType: 'Sensirion SPS30 + BME680',
    calibrationStatus: 'Calibrado (2-Etapas Zhivkov)',
    r2ScoreRaw: 0.29,
    r2ScoreCalibrated: 0.93,
    status: 'online',
    lastReading: {
      timestamp: '22:30',
      pm25: 74.8,
      pm10: 132.5,
      no2: 42.1,
      o3: 19.5,
      co: 2.8,
      co2: 480,
      temperature: 33.2,
      humidity: 62,
      windSpeed: 1.6,
      windDirection: 'E',
      solarRadiation: 530,
      heatIndex: 36.4,
      uhiDelta: 6.9,
      petScore: 38.1,
      tcsScore: 18,
      aqiIndex: 162,
      aqiCategory: 'Dañina'
    },
    hourlyHistory: generateHourlyReadings(74.8, 33.2)
  },
  {
    id: 'sensor-trj-05',
    code: 'TRJ-IOT-05',
    name: 'Nodo Av. Larco / Huamán (Víctor Larco Herrera)',
    zoneId: 'zona-victor-larco',
    zoneName: 'Víctor Larco',
    lat: -8.1345,
    lng: -79.0432,
    elevation: 18,
    streetCanyonHWRatio: 1.1,
    canopyCoverPercent: 16.2,
    sealedSurfacePercent: 68.0,
    trafficDensity: 'Medio',
    sensorType: 'PMS5003 + SHT31',
    calibrationStatus: 'Calibrado (2-Etapas Zhivkov)',
    r2ScoreRaw: 0.32,
    r2ScoreCalibrated: 0.92,
    status: 'online',
    lastReading: {
      timestamp: '22:30',
      pm25: 31.6,
      pm10: 55.4,
      no2: 22.8,
      o3: 27.1,
      co: 0.9,
      co2: 412,
      temperature: 26.5,
      humidity: 78,
      windSpeed: 4.1,
      windDirection: 'SO',
      solarRadiation: 380,
      heatIndex: 27.9,
      uhiDelta: 2.2,
      petScore: 27.8,
      tcsScore: 72,
      aqiIndex: 91,
      aqiCategory: 'Moderada'
    },
    hourlyHistory: generateHourlyReadings(31.6, 26.5)
  },
  {
    id: 'sensor-trj-06',
    code: 'TRJ-IOT-06',
    name: 'Nodo Av. Mansiche / Intercambio Mall Plaza',
    zoneId: 'zona-mansiche',
    zoneName: 'Nodo Mansiche',
    lat: -8.0987,
    lng: -79.0412,
    elevation: 36,
    streetCanyonHWRatio: 0.9,
    canopyCoverPercent: 12.0,
    sealedSurfacePercent: 82.0,
    trafficDensity: 'Alto',
    sensorType: 'Sensirion SPS30 + BME680',
    calibrationStatus: 'Calibrado (2-Etapas Zhivkov)',
    r2ScoreRaw: 0.30,
    r2ScoreCalibrated: 0.93,
    status: 'online',
    lastReading: {
      timestamp: '22:30',
      pm25: 39.2,
      pm10: 69.8,
      no2: 33.1,
      o3: 23.4,
      co: 1.6,
      co2: 438,
      temperature: 28.4,
      humidity: 70,
      windSpeed: 2.8,
      windDirection: 'SO',
      solarRadiation: 440,
      heatIndex: 30.1,
      uhiDelta: 3.8,
      petScore: 31.2,
      tcsScore: 54,
      aqiIndex: 110,
      aqiCategory: 'Dañina para grupos sensibles'
    },
    hourlyHistory: generateHourlyReadings(39.2, 28.4)
  }
];

export const AI_MODELS_BENCHMARK: AiModelMetric[] = [
  {
    id: 'model-1d-cnn',
    name: '1D-CNN (2-Layer Deep Convolutional)',
    architecture: 'Conv1D(64, k=3) -> MaxPooling -> Conv1D(128, k=3) -> Dense(64) -> Output',
    referenceAuthor: 'Naveed et al.',
    year: 2025,
    r2: 0.9925,
    rmse: 1.42,
    mae: 0.98,
    mape: 1.23,
    trainingTimeSec: 42,
    inferenceTimeMs: 4.8,
    spatialResolution: 'A nivel de Edificación / Cañón (5m)',
    bestFitUse: 'Predicción en tiempo real de PM2.5 y Temperatura con series temporales continuas de sensores IoT.',
    status: 'Recomendado',
    features: ['PM2.5(t-1..t-12)', 'Temperatura', 'Humedad Relativa', 'Velocidad Viento', 'Radiación Solar', 'H/W Cañón']
  },
  {
    id: 'model-gnn',
    name: 'GNN (Graph Neural Network - Topología Vial)',
    architecture: 'GCNLayer(64) -> EdgeConv(128) -> GATConv(64) -> MLP Head',
    referenceAuthor: 'Zhivkov et al.',
    year: 2025,
    r2: 0.9510,
    rmse: 2.85,
    mae: 2.10,
    mape: 3.45,
    trainingTimeSec: 185,
    inferenceTimeMs: 14.2,
    spatialResolution: 'A nivel de Manzana y Red de Intersecciones (10m)',
    bestFitUse: 'Atribución de emisiones vehiculares (65%) y propagación de contaminantes a lo largo de ejes viales como Av. España.',
    status: 'Recomendado',
    features: ['Topología de calles', 'Flujo vehicular estimado', 'Índice de conectividad', 'NDVI de bordes', 'Dirección del viento']
  },
  {
    id: 'model-lstm',
    name: 'Bi-LSTM (Bidirectional Long Short-Term Memory)',
    architecture: 'BiLSTM(128, return_seq=True) -> Dropout(0.2) -> BiLSTM(64) -> Dense(32) -> Output',
    referenceAuthor: 'Li et al.',
    year: 2026,
    r2: 0.9380,
    rmse: 3.20,
    mae: 2.45,
    mape: 4.10,
    trainingTimeSec: 120,
    inferenceTimeMs: 8.5,
    spatialResolution: 'A nivel de Nodo Sensor (15m)',
    bestFitUse: 'Captura de memoria a largo plazo, inversión térmica matutina y ciclos diurnos/nocturnos.',
    status: 'Evaluado',
    features: ['Secuencia temporal 24h', 'Gradiente térmico vertical', 'Albedo superficial', 'Presión atmosférica']
  },
  {
    id: 'model-bayesian',
    name: 'Bayesian Spatiotemporal (B-ST Model)',
    architecture: 'Gaussian Process Spatial Prior + AR(1) Temporal Structure + MCMC Inference',
    referenceAuthor: 'Li et al. / Elizabeth NJ',
    year: 2026,
    r2: 0.9140,
    rmse: 3.90,
    mae: 2.95,
    mape: 5.20,
    trainingTimeSec: 320,
    inferenceTimeMs: 28.0,
    spatialResolution: 'A nivel de Fachada / Micro-área (10m)',
    bestFitUse: 'Cuantificación rigurosa de incertidumbre en zonas de Trujillo con baja densidad de sensores.',
    status: 'Evaluado',
    features: ['Coordenadas UTM', 'Distancia euclidiana a vías', 'Densidad de edificación BIM', 'Distribución a priori de COVs']
  },
  {
    id: 'model-rf',
    name: 'Random Forest Regressor (Optimizado 300 Trees)',
    architecture: 'Ensemble de 300 árboles de decisión con max_depth=16 y submuestreo de características',
    referenceAuthor: 'Babu Saheer et al. / Baseline',
    year: 2025,
    r2: 0.8870,
    rmse: 4.60,
    mae: 3.50,
    mape: 6.80,
    trainingTimeSec: 15,
    inferenceTimeMs: 2.1,
    spatialResolution: 'A nivel de Barrio (25m)',
    bestFitUse: 'Modelo de referencia rápido para interpretabilidad de variables clave (Feature Importance).',
    status: 'Línea Base',
    features: ['Temperatura', 'Humedad', 'Tráfico', 'Hora del día', 'Distancia a costa', 'Cobertura arbórea']
  }
];

export const NBS_CATALOG: NbsIntervention[] = [
  {
    id: 'nbs-arbolado',
    name: 'Corredores de Arbolado Urbano Nativo y Adaptado',
    type: 'arbolado_corredor',
    description: 'Plantación continua en bermas centrales y aceras con especies adaptadas al suelo y clima árido-costero de Trujillo (baja demanda hídrica y alto dosel).',
    recommendedFlora: ['Molle costeño (Schinus terebinthifolius)', 'Huarango (Prosopis pallida)', 'Jacarandá (Jacaranda mimosifolia)', 'Tecoma stans (Floripondio amarillo)', 'Meijo / Tipa'],
    unitCostPEN: 380, // Por árbol plantado con tutor y riego inicial
    unitMaintenancePENYear: 45,
    coolingCapacityC: 3.2,
    pmReductionPercent: 28.5,
    waterRetentionLPerM2: 120,
    co2SequestrationKgYear: 28.4,
    acousticDampingDb: 4.5
  },
  {
    id: 'nbs-techo-verde',
    name: 'Techos Verdes Extensivos en Edificaciones Públicas y Privadas',
    type: 'techo_verde',
    description: 'Instalación de cubiertas vegetales ligeras con sustrato drenante y vegetación xerófila en techos planos de casonas y edificios en Trujillo.',
    recommendedFlora: ['Sedum spp.', 'Aptenia cordifolia', 'Portulaca grandiflora', 'Echeveria', 'Gramíneas nativas'],
    unitCostPEN: 145, // Por m² instalado
    unitMaintenancePENYear: 18,
    coolingCapacityC: 3.8, // En superficie y 3.5°C interior
    pmReductionPercent: 22.0,
    waterRetentionLPerM2: 35,
    co2SequestrationKgYear: 5.2,
    acousticDampingDb: 6.0
  },
  {
    id: 'nbs-muro-verde',
    name: 'Jardines Verticales y Muros Verdes Modulares en Fachadas',
    type: 'muro_verde',
    description: 'Módulos verticales en fachadas y muros ciegos de cañones urbanos de alta densidad para absorción de NO2 y enfriamiento microclimático por evapotranspiración.',
    recommendedFlora: ['Hedera helix', 'Ficus pumila', 'Tradescantia pallida', 'Epipremnum aureum', 'Helechos adaptados'],
    unitCostPEN: 220, // Por m² de fachada
    unitMaintenancePENYear: 32,
    coolingCapacityC: 2.6,
    pmReductionPercent: 24.8,
    waterRetentionLPerM2: 25,
    co2SequestrationKgYear: 4.8,
    acousticDampingDb: 8.5
  },
  {
    id: 'nbs-pavimento-permeable',
    name: 'Pavimentos Permeables y Adoquines con Pasto (Grass Paver)',
    type: 'pavimento_permeable',
    description: 'Sustitución de asfalto continuo e impermeable en bermas, estacionamientos y plazas secundarias por adoquines porosos que reducen la acumulación de calor.',
    recommendedFlora: ['Cynodon dactylon (Bermuda grass)', 'Gravas volcánicas filtrantes', 'Sustrato de perlita y arena'],
    unitCostPEN: 110, // Por m²
    unitMaintenancePENYear: 12,
    coolingCapacityC: 2.1,
    pmReductionPercent: 14.5,
    waterRetentionLPerM2: 85,
    co2SequestrationKgYear: 1.8,
    acousticDampingDb: 2.0
  },
  {
    id: 'nbs-jardin-lluvia',
    name: 'Jardines de Lluvia y Bio-Retenciones Urbanas',
    type: 'jardin_lluvia',
    description: 'Depresiones vegetadas en esquinas y retiros viales para captar escorrentía superficial en eventos El Niño / lluvias costeras, con árboles y arbustos filtrantes.',
    recommendedFlora: ['Vetiver (Chrysopogon zizanioides)', 'Canna indica (Achira)', 'Pennisetum', 'Stipa ichu'],
    unitCostPEN: 160, // Por m²
    unitMaintenancePENYear: 22,
    coolingCapacityC: 2.9,
    pmReductionPercent: 26.0,
    waterRetentionLPerM2: 150,
    co2SequestrationKgYear: 8.5,
    acousticDampingDb: 3.5
  }
];

export const THESIS_OBJECTIVES_DATA: ThesisObjectiveEvaluation[] = [
  {
    code: 'OE1',
    title: 'Diagnosticar la variabilidad microescalar de calidad del aire y temperatura en Trujillo',
    status: 'Completado',
    progressPercent: 100,
    metrics: [
      { name: 'Zonas críticas caracterizadas en Trujillo', target: '4 zonas', achieved: '6 zonas (Centro, Mayorista, Mansiche, Porvenir, V. Larco, Hermelinda)', compliance: true },
      { name: 'Variabilidad de PM2.5 calle a calle identificada', target: 'Delta > 150%', achieved: 'Delta de hasta 285% en menos de 100m (Zhivkov et al. matching)', compliance: true },
      { name: 'R² calibración 2-etapas de sensores de bajo costo', target: 'R² > 0.85', achieved: 'R² = 0.94 (PMS5003 / Sensirion SPS30 corregidos)', compliance: true }
    ],
    summary: 'Se demostró que las estaciones macroescalares tradicionales no capturan los picos de exposición en los cañones urbanos de Trujillo.'
  },
  {
    code: 'OE2',
    title: 'Diseñar la arquitectura del gemelo digital a microescala (Capas Físicas, Datos y Modelado)',
    status: 'Completado',
    progressPercent: 100,
    metrics: [
      { name: 'Modelo tridimensional de cañones urbanos (BIM/LiDAR/OSM)', target: 'Malla 10x10m', achieved: 'Malla discretizada 5x5m y modelo 3D con H/W ratio', compliance: true },
      { name: 'Sincronización bidireccional física-virtual', target: 'Latencia < 5s', achieved: 'Latencia media de telemetría IoT 1.2s', compliance: true },
      { name: 'Integración del marco REFLECT (7 capas)', target: '7 capas activas', achieved: 'Retrieve, Establish, Facilitate, Lump, Examine, Cognition, Take implementadas', compliance: true }
    ],
    summary: 'Arquitectura validada según los estándares de Li et al. (2026) y Teutscher et al. (2025) con código abierto adaptado a presupuestos de ciudades intermedias.'
  },
  {
    code: 'OE3',
    title: 'Seleccionar y adaptar modelos de Machine Learning y Deep Learning a microescala',
    status: 'Completado',
    progressPercent: 100,
    metrics: [
      { name: 'Precisión predictiva de 1D-CNN (Naveed et al. 2025)', target: 'R² > 0.95', achieved: 'R² = 0.9925 | MAPE = 1.23%', compliance: true },
      { name: 'Atribución vehicular mediante GNN (Zhivkov et al. 2025)', target: 'Atribución > 50%', achieved: '65.2% de PM2.5 atribuido a flota diésel y combis en Trujillo', compliance: true },
      { name: 'Tiempo de inferencia para gemelo digital en tiempo real', target: '< 50ms', achieved: '4.8ms con 1D-CNN optimizado', compliance: true }
    ],
    summary: 'El modelo 1D-CNN y la arquitectura GNN superaron ampliamente a los modelos clásicos gaussianos y Random Forest.'
  },
  {
    code: 'OE4',
    title: 'Diseñar el módulo de simulación de escenarios de Soluciones basadas en la Naturaleza (NbS)',
    status: 'Completado',
    progressPercent: 100,
    metrics: [
      { name: 'Reducción térmica microclimática proyectada', target: 'ΔT = 2.0 - 3.5 °C', achieved: 'ΔT = 3.2 °C (Arbolado) y 3.8 °C (Techos Verdes) en Trujillo', compliance: true },
      { name: 'Reducción de exposición a PM2.5 por deposición foliar', target: 'ΔPM2.5 > 20%', achieved: '28.5% en corredores arbolados (Molle/Huarango)', compliance: true },
      { name: 'Mejora en Confort Térmico Score (TCS / PET)', target: 'Mejora > 25 pts', achieved: 'Incremento de TCS de 42 a 76 pts (+34 pts de confort)', compliance: true }
    ],
    summary: 'Simulador A/B permite a la Municipalidad evaluar proyectos antes de su ejecución física, respaldado en el marco GREENPASS® (Abbas et al., 2025).'
  },
  {
    code: 'OE5',
    title: 'Establecer indicadores y procedimientos de validación de hipótesis y política pública',
    status: 'Completado',
    progressPercent: 100,
    metrics: [
      { name: 'Validación estadística de Hipótesis General', target: 'p-valor < 0.05', achieved: 'p < 0.001 (Diferencia significativa pre y post NbS)', compliance: true },
      { name: 'Población vulnerable protegida estimada', target: '> 50,000 hab', achieved: '132,500 habitantes beneficiados en zonas críticas de Trujillo', compliance: true },
      { name: 'Retorno de inversión social (Costo-Efectividad)', target: 'B/C Ratio > 1.5', achieved: 'B/C Ratio = 3.4 (Ahorro en salud respiratoria y energía)', compliance: true }
    ],
    summary: 'Se valida la hipótesis de la tesis: el gemelo digital a microescala con NbS reduce significativamente la exposición a contaminantes y calor extremo en Trujillo.'
  }
];
