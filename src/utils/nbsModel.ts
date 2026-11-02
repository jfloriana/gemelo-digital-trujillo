/**
 * Modelo del simulador de escenarios NBS (función pura, testeable).
 *
 * Reemplaza los topes fijos (5,6 °C y 42 %) por saturación derivada de parámetros:
 *  - la reducción térmica satura suavemente hacia la mayor media reportada (Kumar et al., 2024);
 *  - el efecto sobre PM2.5 tiene signo variable (deposición vs. reducción de dispersión).
 * Cada coeficiente está documentado en docs/coeficientes_simulador.md.
 * Origen: [D] documentado en una fuente del corpus; [R] referencia normativa;
 *         [H] heurístico del prototipo, sin fuente primaria verificada (calibrar con CFD/ENVI-met).
 */

// ---------------------------------------------------------------------------
// Coeficientes
// ---------------------------------------------------------------------------
export const NBS_COEF = {
  // Temperatura: reducción de referencia con cobertura efectiva = 1 (°C).
  // [D] Kumar et al. (2024), replicacion/datos/magnitudes_A30.csv. Se asume que la media reportada
  // corresponde a cobertura plena, lo que subestima el efecto de coberturas parciales típicas.
  DT_REF_TREE: 3.8,   // Árboles de calle
  DT_REF_WALL: 4.1,   // Muros verdes
  DT_REF_ROOF: 3.8,   // [H] proxy: "Balcones ajardinados"; el techo verde no figura en la tabla fuente
  DT_REF_RAIN: 5.0,   // [H] proxy: "Jardines botánicos"; el jardín de lluvia no figura en la tabla fuente
  DT_REF_PERM: 1.0,   // [H] pavimento permeable/frío, sin fuente primaria verificada
  // Mayor media documentada: asíntota de la saturación (no es un tope duro).
  DT_SATURATION: 5.0, // [D] Jardines botánicos, Kumar et al. (2024)

  // Intercepción de radiación por el dosel (Beer-Lambert): 1 - exp(-K_EXT * LAI).
  K_EXT: 0.5,         // [R] coeficiente de extinción típico para hoja esférica

  // Atrapamiento térmico del cañón (conservado del prototipo original).
  CANYON_TRAP_SLOPE: 0.18, // [H]

  // PM2.5: reducción relativa de referencia con cobertura efectiva = 1.
  // [D] Kumar et al. (2024), "Air pollution abatement from Green-Blue-Grey infrastructure":
  // elementos lineales 23 ± 21 %, muros verdes 14 ± 27 %, techos verdes 13 ± 23 %,
  // áreas no selladas 14 ± 20 %, infraestructura construida 14 ± 25 %.
  D_TREE: 0.23,
  D_WALL: 0.14,
  D_ROOF: 0.13,
  D_PERM: 0.14,
  D_RAIN: 0.14,       // [H] se usa "infraestructura construida" como proxy

  // La deposición solo actúa sobre la fracción por encima de una concentración de referencia.
  PM25_REF: 5,        // [R] guía anual de la OMS 2021 (µg/m³); no es el fondo local medido

  // Penalización por reducción de ventilación en el cañón (efecto adverso de las copas).
  P_TREE: 0.30,       // [H] aumento relativo máximo de PM2.5 con cobertura 1 y ventilación nula

  // Índice de ventilación del cañón.
  U_REF: 3.0,         // [H] velocidad (m/s) a la que el viento no limita la ventilación
  // Régimen de flujo por H/W (Oke, 1988): aislado ≤ 0,3; interferencia ≤ 0,65; rasante > 0,65.
  HW_ISOLATED: 0.3,   // [R]
  HW_WAKE: 0.65,      // [R]
  HW_DEEP: 2.0,       // [H]
  V_AT_WAKE: 0.6,     // [H]
  V_AT_DEEP: 0.2,     // [H]

  // Regla R1 (ventilación).
  R1_DENSE_CANOPY: 0.25,  // [H] cobertura de copas a partir de la cual el arbolado se considera denso
  R1_SPARSE_CANOPY: 0.15, // [H] cobertura máxima recomendada cuando R1 se activa
  R1_MIN_VENT: 0.35,      // [H] índice de ventilación mínimo para recomendar arbolado denso

  // Dosel de referencia.
  DEFAULT_CROWN_RADIUS_M: 3.0, // [H]
  DEFAULT_LAI: 3.0,            // [H]
  DEFAULT_STUDY_AREA_M2: 20000, // [H] manzana/tramo de microescala (≈ 2 ha)

  // PM10 respecto de PM2.5: las partículas gruesas se depositan más (conservado del prototipo).
  PM10_FACTOR: 1.1,   // [H]
  PM10_PM25_RATIO: 1.76, // [H]
} as const;

/** Rótulo obligatorio para toda cifra de escenario mostrada o exportada. */
export const ILLUSTRATIVE_LABEL = 'ilustrativa, modelo heurístico no validado';

/** Valores por defecto de la interfaz (viento y albedo) cuando no hay escenario guardado. */
export const DEFAULT_WIND_MS = 2.2;
export const DEFAULT_ALBEDO = 0.2;

export type NbsModelType = '1d_cnn' | 'gnn' | 'random_forest' | 'bi_lstm' | 'xgboost';

/** Multiplicadores por modelo ML (conservados del prototipo; ver docs). */
export const MODEL_FACTORS: Record<NbsModelType, { name: string; r2: number; tempFactor: number; pmFactor: number }> = {
  '1d_cnn': { name: '1D-CNN (Naveed et al. 2025)', r2: 0.9925, tempFactor: 1.05, pmFactor: 1.08 },
  gnn: { name: 'GNN - Graph Neural Network (Zhivkov et al. 2025)', r2: 0.988, tempFactor: 0.98, pmFactor: 1.15 },
  random_forest: { name: 'Random Forest Regressor (300 Trees)', r2: 0.961, tempFactor: 0.94, pmFactor: 0.92 },
  bi_lstm: { name: 'Bi-LSTM Spatiotemporal (Li et al. 2026)', r2: 0.974, tempFactor: 1.02, pmFactor: 1.04 },
  xgboost: { name: 'XGBoost Microclimate Ensemble', r2: 0.953, tempFactor: 0.96, pmFactor: 0.95 },
};

// ---------------------------------------------------------------------------
// Entradas y salidas
// ---------------------------------------------------------------------------
export interface NbsInputs {
  modelType: NbsModelType;
  baselineTemp: number;      // °C
  baselinePm25: number;      // µg/m³
  canyonHWRatio: number;
  windSpeed: number;         // m/s
  surfaceAlbedo: number;     // 0-1
  studyAreaM2: number;
  lai: number;               // índice de área foliar
  treeCrownRadiusM: number;
  treeCount: number;
  greenRoofArea: number;     // m²
  greenWallArea: number;     // m²
  permeableArea: number;     // m²
  rainGardenArea: number;    // m²
}

export interface R1Result {
  active: boolean;
  canopyCover: number;
  ventilation: number;
  reason: string;
  maxRecommendedTrees: number;
}

export interface NbsOutputs {
  tempReduction: number;           // °C
  pm25ReductionPercent: number;    // % (negativo = aumento de PM2.5)
  pm25TreeNetPercent: number;      // aporte neto del arbolado (con signo)
  ventilation: number;             // 0-1
  canopyCover: number;             // 0-1
  r1: R1Result;
  recommendationBlocked: boolean;  // true si R1 impide recomendar arbolado denso
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const r1dec = (x: number) => Number(x.toFixed(1));

/** Índice de ventilación del cañón, 0 (nula) a 1 (libre). */
export function ventilationIndex(windSpeed: number, hwRatio: number): number {
  const c = NBS_COEF;
  const vWind = clamp(windSpeed / c.U_REF, 0, 1);
  let vGeom: number;
  if (hwRatio <= c.HW_ISOLATED) vGeom = 1;
  else if (hwRatio <= c.HW_WAKE) vGeom = 1 + ((hwRatio - c.HW_ISOLATED) / (c.HW_WAKE - c.HW_ISOLATED)) * (c.V_AT_WAKE - 1);
  else if (hwRatio <= c.HW_DEEP) vGeom = c.V_AT_WAKE + ((hwRatio - c.HW_WAKE) / (c.HW_DEEP - c.HW_WAKE)) * (c.V_AT_DEEP - c.V_AT_WAKE);
  else vGeom = c.V_AT_DEEP;
  return vWind * vGeom;
}

/** Fracción de cobertura de copas del área de estudio (geométrica, 0-1). */
export function canopyCoverFraction(treeCount: number, crownRadiusM: number, studyAreaM2: number): number {
  return clamp((treeCount * Math.PI * crownRadiusM * crownRadiusM) / studyAreaM2, 0, 1);
}

export function computeNbs(i: NbsInputs): NbsOutputs {
  const c = NBS_COEF;
  const mf = MODEL_FACTORS[i.modelType] ?? MODEL_FACTORS.xgboost;
  const A = Math.max(1, i.studyAreaM2);

  const shade = 1 - Math.exp(-c.K_EXT * Math.max(0, i.lai));
  const canopy = canopyCoverFraction(i.treeCount, i.treeCrownRadiusM, A);
  const fTree = canopy * shade;
  const frac = (area: number) => clamp(area / A, 0, 1);

  // --- Temperatura: suma ponderada, atrapamiento del cañón, saturación suave hacia DT_SATURATION.
  const albedoRoof = 1 + (0.5 - i.surfaceAlbedo) * 0.4;
  const albedoPerm = 1 + i.surfaceAlbedo * 0.6;
  const dtSum =
    c.DT_REF_TREE * fTree * mf.tempFactor +
    c.DT_REF_ROOF * frac(i.greenRoofArea) * albedoRoof +
    c.DT_REF_WALL * frac(i.greenWallArea) +
    c.DT_REF_PERM * frac(i.permeableArea) * albedoPerm +
    c.DT_REF_RAIN * frac(i.rainGardenArea);
  const trap = 1 + (i.canyonHWRatio - 1) * c.CANYON_TRAP_SLOPE;
  const dtRaw = dtSum / Math.max(1, trap);
  const tempReduction = c.DT_SATURATION * (1 - Math.exp(-dtRaw / c.DT_SATURATION));

  // --- PM2.5 con signo: deposición (depende del nivel de PM2.5) menos penalización por ventilación.
  const V = ventilationIndex(i.windSpeed, i.canyonHWRatio);
  const g = i.baselinePm25 > 0 ? Math.max(0, 1 - c.PM25_REF / i.baselinePm25) : 0;
  const treeDep = c.D_TREE * fTree * g * mf.pmFactor;
  const treePenalty = c.P_TREE * canopy * (1 - V);
  const rTree = treeDep - treePenalty;
  const rWall = c.D_WALL * frac(i.greenWallArea) * g;
  const rRoof = c.D_ROOF * frac(i.greenRoofArea) * g;
  const rPerm = c.D_PERM * frac(i.permeableArea) * g;
  const rRain = c.D_RAIN * frac(i.rainGardenArea) * g;
  const remaining = [rTree, rWall, rRoof, rPerm, rRain].reduce((acc, r) => acc * (1 - r), 1);
  const pm25ReductionPercent = (1 - remaining) * 100;

  // --- Regla R1: no recomendar arbolado denso con ventilación baja.
  const dense = canopy >= c.R1_DENSE_CANOPY;
  const lowVent = V < c.R1_MIN_VENT;
  const active = dense && lowVent;
  const maxTrees = Math.floor((c.R1_SPARSE_CANOPY * A) / (Math.PI * i.treeCrownRadiusM ** 2));
  const r1: R1Result = {
    active,
    canopyCover: canopy,
    ventilation: V,
    maxRecommendedTrees: maxTrees,
    reason: active
      ? `R1: cobertura de copas ${(canopy * 100).toFixed(0)} % ≥ ${(c.R1_DENSE_CANOPY * 100).toFixed(0)} % con ventilación ${V.toFixed(2)} < ${c.R1_MIN_VENT}. ` +
        `No se recomienda arbolado denso; máximo sugerido ${maxTrees} árboles.`
      : 'R1 no activa.',
  };

  return {
    tempReduction: r1dec(tempReduction),
    pm25ReductionPercent: r1dec(pm25ReductionPercent),
    pm25TreeNetPercent: r1dec(rTree * 100),
    ventilation: Number(V.toFixed(3)),
    canopyCover: Number(canopy.toFixed(3)),
    r1,
    recommendationBlocked: active,
  };
}

// ---------------------------------------------------------------------------
// Registro de activaciones de R1
// ---------------------------------------------------------------------------
export interface RuleEvent {
  ts: string;
  rule: 'R1';
  zoneId: string;
  canopyCover: number;
  ventilation: number;
  message: string;
}

export const RULE_LOG_KEY = 'nbs_rule_log_r1';
const RULE_LOG_MAX = 200;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export function readRuleLog(storage: StorageLike | undefined): RuleEvent[] {
  try {
    const raw = storage?.getItem(RULE_LOG_KEY);
    return raw ? (JSON.parse(raw) as RuleEvent[]) : [];
  } catch {
    return [];
  }
}

export function appendRuleEvent(storage: StorageLike | undefined, ev: RuleEvent): RuleEvent[] {
  const next = [...readRuleLog(storage), ev].slice(-RULE_LOG_MAX);
  try {
    storage?.setItem(RULE_LOG_KEY, JSON.stringify(next));
  } catch {
    /* almacenamiento no disponible: el registro sigue en memoria */
  }
  return next;
}
