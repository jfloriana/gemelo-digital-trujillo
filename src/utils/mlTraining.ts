import { SensorNode, VIRTUAL_SENSOR_TYPE } from '../types';

// Motor ML 100% client-side (sin costo): entrena 3 regresores sobre la
// telemetría real del proyecto (nodos calibrados + referencias públicas
// Open-Meteo/OpenAQ) para predecir PM2.5 desde [temp, humedad, viento, radiación].
// Todo determinista por semilla → reproducible para tesis.

export interface TrainRow {
  x: number[]; // [temp, humidity, windSpeed, solarRadiation]
  y: number; // pm25
  source: 'public' | 'calibrated';
  sensorCode: string;
  timestamp: string;
}

export type ModelKind = 'linear' | 'knn' | 'mlp';

export interface Metrics {
  r2: number;
  rmse: number;
  mae: number;
  mape: number;
}

export interface TrialArtifact {
  model: ModelKind;
  seed: number;
  hyper: Record<string, number | string>;
  featureMeans: number[];
  featureStds: number[];
  payload: unknown; // pesos / vecinos / red
  metrics: Metrics; // test
  metricsTrain: Metrics; // train (brecha train-test = diagnóstico de overfitting)
  nTrain: number;
  nTest: number;
  datasetHash: string;
  createdAt: string;
}

const EMPTY_METRICS: Metrics = { r2: 0, rmse: 0, mae: 0, mape: 0 };

export interface TrialRecord extends TrialArtifact {
  id: string;
  cvMeanR2: number | null;
  cvStdR2: number | null;
  noiseRmse: number | null;
  noiseDegradPct: number | null;
  preds: { actual: number; pred: number; label: string }[];
}

export const FEATURE_NAMES = ['Temp (°C)', 'HR (%)', 'Viento (m/s)', 'Radiación (W/m²)'];

export function buildDatasetFull(sensors: SensorNode[]): { rows: TrainRow[]; dropped: number } {
  const rows: TrainRow[] = [];
  let dropped = 0;
  for (const s of sensors) {
    const pub = s.sensorType === VIRTUAL_SENSOR_TYPE;
    for (const r of s.hourlyHistory || []) {
      if (!Number.isFinite(r.temperature) || !Number.isFinite(r.pm25)) { dropped++; continue; }
      if (r.pm25 <= 0 && r.temperature <= 0) { dropped++; continue; } // placeholder sin telemetría
      rows.push({
        x: [r.temperature, r.humidity, r.windSpeed, r.solarRadiation],
        y: r.pm25,
        source: pub ? 'public' : 'calibrated',
        sensorCode: s.code,
        timestamp: r.timestamp,
      });
    }
  }
  return { rows, dropped };
}

export function buildDataset(sensors: SensorNode[]): TrainRow[] {
  return buildDatasetFull(sensors).rows;
}

// ---- EDA: descriptivos, correlación, outliers, histograma ----
export interface EdaCol {
  name: string;
  n: number;
  min: number;
  max: number;
  mean: number;
  std: number;
  median: number;
  outliers: number;
}

export interface EdaReport {
  cols: EdaCol[];
  corr: number[][]; // 5x5: 4 features + PM
  corrNames: string[];
  pmHist: { bin: string; count: number }[];
  dropped: number;
}

export function edaReport(rows: TrainRow[], dropped: number): EdaReport {
  const names = [...FEATURE_NAMES, 'PM2.5'];
  if (!rows.length) {
    return {
      cols: names.map((name) => ({ name, n: 0, min: 0, max: 0, mean: 0, std: 0, median: 0, outliers: 0 })),
      corr: Array.from({ length: 5 }, () => new Array(5).fill(0)),
      corrNames: names,
      pmHist: [],
      dropped,
    };
  }
  const series: number[][] = [0, 1, 2, 3].map((j) => rows.map((r) => r.x[j]));
  series.push(rows.map((r) => r.y));
  const desc = (v: number[]) => {
    const s = [...v].sort((a, b) => a - b);
    const mean = v.reduce((a, b) => a + b, 0) / v.length;
    const std = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length) || 0;
    const median = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
    const outliers = v.filter((x) => std > 0 && Math.abs((x - mean) / std) > 3).length;
    return { min: s[0], max: s[s.length - 1], mean, std, median, outliers };
  };
  const cols = series.map((v, i) => ({ name: names[i], n: v.length, ...desc(v) }));
  const corr: number[][] = series.map((a) =>
    series.map((b) => {
      const ma = a.reduce((s, v) => s + v, 0) / a.length;
      const mb = b.reduce((s, v) => s + v, 0) / b.length;
      let num = 0, da = 0, db = 0;
      for (let i = 0; i < a.length; i++) {
        num += (a[i] - ma) * (b[i] - mb);
        da += (a[i] - ma) ** 2;
        db += (b[i] - mb) ** 2;
      }
      return da && db ? num / Math.sqrt(da * db) : 0;
    }),
  );
  const pm = series[4];
  const lo = Math.min(...pm);
  const hi = Math.max(...pm);
  const bins = 10;
  const width = (hi - lo) / bins || 1;
  const pmHist = Array.from({ length: bins }, (_, i) => {
    const a = lo + i * width;
    const count = pm.filter((v) => (i === bins - 1 ? v >= a && v <= hi : v >= a && v < a + width)).length;
    return { bin: `${a.toFixed(0)}–${(a + width).toFixed(0)}`, count };
  });
  return { cols, corr, corrNames: names, pmHist, dropped };
}

export function datasetHash(rows: TrainRow[]): string {
  let h = 0;
  const s = rows.map((r) => `${r.sensorCode}|${r.timestamp}|${r.y}`).join(';');
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return `ds-${rows.length}-${(h >>> 0).toString(16)}`;
}

// RNG determinista (mulberry32) para reproducibilidad
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function standardize(X: number[][]): { means: number[]; stds: number[]; Z: number[][] } {
  const d = X[0].length;
  const means = Array.from({ length: d }, (_, j) => X.reduce((s, r) => s + r[j], 0) / X.length);
  const stds = Array.from({ length: d }, (_, j) => {
    const v = X.reduce((s, r) => s + (r[j] - means[j]) ** 2, 0) / X.length;
    return Math.sqrt(v) || 1;
  });
  const Z = X.map((r) => r.map((v, j) => (v - means[j]) / stds[j]));
  return { means, stds, Z };
}

function solveLinear(A: number[][], b: number[]): number[] {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
    }
    [M[col], M[piv]] = [M[piv], M[col]];
    const d = M[col][col] || 1e-12;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = M[r][col] / d;
      for (let c = col; c <= n; c++) M[r][c] -= f * M[col][c];
    }
  }
  return M.map((row, i) => row[n] / (row[i] || 1e-12));
}

export function computeMetrics(actual: number[], pred: number[]): Metrics {
  const n = actual.length;
  const mean = actual.reduce((a, b) => a + b, 0) / n;
  let ssRes = 0, ssTot = 0, ae = 0, ape = 0;
  for (let i = 0; i < n; i++) {
    ssRes += (actual[i] - pred[i]) ** 2;
    ssTot += (actual[i] - mean) ** 2;
    ae += Math.abs(actual[i] - pred[i]);
    ape += actual[i] !== 0 ? Math.abs((actual[i] - pred[i]) / actual[i]) : 0;
  }
  return {
    r2: ssTot === 0 ? 0 : 1 - ssRes / ssTot,
    rmse: Math.sqrt(ssRes / n),
    mae: ae / n,
    mape: (ape / n) * 100,
  };
}

// Ecuaciones normales sobre X estandarizada + bias
export function trainLinearModel(train: TrainRow[], seed: number): TrialArtifact {
  const { means, stds, Z } = standardize(train.map((r) => r.x));
  const d = Z[0].length;
  const XtX: number[][] = Array.from({ length: d + 1 }, () => new Array(d + 1).fill(0));
  const Xty: number[] = new Array(d + 1).fill(0);
  train.forEach((r, i) => {
    const f = [1, ...Z[i]];
    for (let a = 0; a <= d; a++) {
      Xty[a] += f[a] * r.y;
      for (let b = 0; b <= d; b++) XtX[a][b] += f[a] * f[b];
    }
  });
  const weights = solveLinear(XtX, Xty);
  return { model: 'linear', seed, hyper: {}, featureMeans: means, featureStds: stds, payload: { weights }, metrics: { ...EMPTY_METRICS }, metricsTrain: { ...EMPTY_METRICS }, nTrain: train.length, nTest: 0, datasetHash: '', createdAt: new Date().toISOString() };
}

export function predictWithArtifact(a: TrialArtifact, x: number[]): number {
  const z = x.map((v, j) => (v - a.featureMeans[j]) / a.featureStds[j]);
  if (a.model === 'linear') {
    const w = (a.payload as { weights: number[] }).weights;
    return w[0] + z.reduce((s, v, j) => s + v * w[j + 1], 0);
  }
  if (a.model === 'knn') {
    const p = a.payload as { k: number;XZ: number[][]; y: number[] };
    const dists = p.XZ.map((r, i) => ({ i, d: r.reduce((s, v, j) => s + (v - z[j]) ** 2, 0) }));
    dists.sort((u, v) => u.d - v.d);
    const k = Math.min(p.k, dists.length);
    return dists.slice(0, k).reduce((s, u) => s + p.y[u.i], 0) / k;
  }
  const p = a.payload as { w1: number[][]; b1: number[]; w2: number[]; b2: number; yMean: number; yStd: number };
  const h = p.b1.map((b, j) => Math.tanh(b + z.reduce((s, v, k) => s + v * p.w1[k][j], 0)));
  const out = p.b2 + h.reduce((s, v, j) => s + v * p.w2[j], 0);
  return out * p.yStd + p.yMean;
}

export function trainKnnModel(train: TrainRow[], seed: number, k = 5): TrialArtifact {
  const { means, stds, Z } = standardize(train.map((r) => r.x));
  return {
    model: 'knn', seed, hyper: { k },
    featureMeans: means, featureStds: stds,
    payload: { k, XZ: Z, y: train.map((r) => r.y) },
    metrics: { ...EMPTY_METRICS }, metricsTrain: { ...EMPTY_METRICS },
    nTrain: train.length, nTest: 0, datasetHash: '', createdAt: new Date().toISOString(),
  };
}

export function trainMlpModel(train: TrainRow[], seed: number, hidden = 8, epochs = 300, lr = 0.05): TrialArtifact {
  const { means, stds, Z } = standardize(train.map((r) => r.x));
  const ys = train.map((r) => r.y);
  const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
  const yStd = Math.sqrt(ys.reduce((s, v) => s + (v - yMean) ** 2, 0) / ys.length) || 1;
  const yn = ys.map((v) => (v - yMean) / yStd);
  const d = Z[0].length;
  const rnd = mulberry32(seed);
  const w1 = Array.from({ length: d }, () => Array.from({ length: hidden }, () => (rnd() - 0.5) * 0.6));
  const b1 = new Array(hidden).fill(0);
  const w2 = Array.from({ length: hidden }, () => (rnd() - 0.5) * 0.6);
  let b2 = 0;
  const forward = (zi: number[]) => {
    const h = b1.map((b, j) => Math.tanh(b + zi.reduce((s, v, k) => s + v * w1[k][j], 0)));
    return { h, out: b2 + h.reduce((s, v, j) => s + v * w2[j], 0) };
  };
  const lossHist: number[] = [];
  for (let ep = 0; ep < epochs; ep++) {
    const gw1 = w1.map((r) => r.map(() => 0));
    const gb1 = new Array(hidden).fill(0);
    const gw2 = new Array(hidden).fill(0);
    let gb2 = 0;
    for (let i = 0; i < Z.length; i++) {
      const h = b1.map((b, j) => Math.tanh(b + Z[i].reduce((s, v, k) => s + v * w1[k][j], 0)));
      const out = b2 + h.reduce((s, v, j) => s + v * w2[j], 0);
      const err = out - yn[i];
      gb2 += err;
      for (let j = 0; j < hidden; j++) {
        gw2[j] += err * h[j];
        const dh = err * w2[j] * (1 - h[j] * h[j]);
        gb1[j] += dh;
        for (let k = 0; k < d; k++) gw1[k][j] += dh * Z[i][k];
      }
    }
    const n = Z.length;
    for (let k = 0; k < d; k++) for (let j = 0; j < hidden; j++) w1[k][j] -= (lr * gw1[k][j]) / n;
    for (let j = 0; j < hidden; j++) { b1[j] -= (lr * gb1[j]) / n; w2[j] -= (lr * gw2[j]) / n; }
    b2 -= (lr * gb2) / n;
    if (ep % 10 === 0 || ep === epochs - 1) {
      let se = 0;
      for (let i = 0; i < Z.length; i++) {
        const o = forward(Z[i]).out;
        se += (o - yn[i]) ** 2;
      }
      lossHist.push(Number((se / Z.length).toFixed(5)));
    }
  }
  return {
    model: 'mlp', seed, hyper: { hidden, epochs, lr },
    featureMeans: means, featureStds: stds,
    payload: { w1, b1, w2, b2, yMean, yStd, lossHist },
    metrics: { ...EMPTY_METRICS }, metricsTrain: { ...EMPTY_METRICS },
    nTrain: train.length, nTest: 0, datasetHash: '', createdAt: new Date().toISOString(),
  };
}

// Split cronológico 80/20 + evaluación completa de un modelo (con hiperparámetros)
export function runTrialWithHyper(
  rows: TrainRow[], model: ModelKind, seed: number,
  hyper: Record<string, number> = {},
): Omit<TrialRecord, 'id' | 'cvMeanR2' | 'cvStdR2' | 'noiseRmse' | 'noiseDegradPct'> {
  const cut = Math.max(4, Math.floor(rows.length * 0.8));
  const train = rows.slice(0, cut);
  const test = rows.slice(cut);
  const artifact = model === 'linear' ? trainLinearModel(train, seed)
    : model === 'knn' ? trainKnnModel(train, seed, hyper.k ?? 5)
    : trainMlpModel(train, seed, hyper.hidden ?? 8, hyper.epochs ?? 300, hyper.lr ?? 0.05);
  const preds = test.map((r) => predictWithArtifact(artifact, r.x));
  const actual = test.map((r) => r.y);
  artifact.metrics = computeMetrics(actual, preds);
  const trainPreds = train.map((r) => predictWithArtifact(artifact, r.x));
  artifact.metricsTrain = computeMetrics(train.map((r) => r.y), trainPreds);
  artifact.nTest = test.length;
  artifact.datasetHash = datasetHash(rows);
  return {
    ...artifact,
    preds: test.map((r, i) => ({ actual: r.y, pred: Number(preds[i].toFixed(2)), label: `${r.sensorCode} ${r.timestamp}` })),
  };
}

export function runTrial(rows: TrainRow[], model: ModelKind, seed: number) {
  return runTrialWithHyper(rows, model, seed, {});
}

export interface HyperResult {
  model: ModelKind;
  hyper: Record<string, number>;
  hyperLabel: string;
  metrics: Metrics;
  seed: number;
}

// Búsqueda en malla (grid search) sobre hiperparámetros con split 80/20.
// Barata: 1 lineal + 4 kNN + 3 MLP con épocas reducidas. Ordenada por RMSE.
export function gridSearch(rows: TrainRow[], seed: number): HyperResult[] {
  const combos: { model: ModelKind; hyper: Record<string, number>; label: string }[] = [
    { model: 'linear', hyper: {}, label: '—' },
    { model: 'knn', hyper: { k: 3 }, label: 'k=3' },
    { model: 'knn', hyper: { k: 5 }, label: 'k=5' },
    { model: 'knn', hyper: { k: 7 }, label: 'k=7' },
    { model: 'knn', hyper: { k: 9 }, label: 'k=9' },
    { model: 'mlp', hyper: { hidden: 4, epochs: 200, lr: 0.05 }, label: 'h=4 e=200 lr=0.05' },
    { model: 'mlp', hyper: { hidden: 8, epochs: 200, lr: 0.05 }, label: 'h=8 e=200 lr=0.05' },
    { model: 'mlp', hyper: { hidden: 8, epochs: 400, lr: 0.02 }, label: 'h=8 e=400 lr=0.02' },
  ];
  return combos
    .map((c, i) => {
      const t = runTrialWithHyper(rows, c.model, seed + i * 37, c.hyper);
      return { model: c.model, hyper: c.hyper, hyperLabel: c.label, metrics: t.metrics, seed: seed + i * 37 };
    })
    .sort((a, b) => a.metrics.rmse - b.metrics.rmse);
}

// K-fold CV (folds barajados con semilla) → media ± std de R²
export function crossValidate(rows: TrainRow[], model: ModelKind, seed: number, k = 5): { meanR2: number | null; stdR2: number | null } {
  if (rows.length < k * 2) return { meanR2: null, stdR2: null };
  const rnd = mulberry32(seed + 999);
  const idx = rows.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const r2s: number[] = [];
  for (let f = 0; f < k; f++) {
    const testIdx = new Set(idx.filter((_, i) => i % k === f));
    const train = rows.filter((_, i) => !testIdx.has(i));
    const test = rows.filter((_, i) => testIdx.has(i));
    if (!train.length || !test.length) continue;
    const a = model === 'linear' ? trainLinearModel(train, seed + f)
      : model === 'knn' ? trainKnnModel(train, seed + f)
      : trainMlpModel(train, seed + f, 8, 150, 0.05);
    r2s.push(computeMetrics(test.map((r) => r.y), test.map((r) => predictWithArtifact(a, r.x))).r2);
  }
  if (!r2s.length) return { meanR2: null, stdR2: null };
  const mean = r2s.reduce((s, v) => s + v, 0) / r2s.length;
  const std = Math.sqrt(r2s.reduce((s, v) => s + (v - mean) ** 2, 0) / r2s.length);
  return { meanR2: mean, stdR2: std };
}

// Prueba de ruido: ±10% uniforme en features de test → degradación de RMSE
export function noiseTest(rows: TrainRow[], model: ModelKind, seed: number, baseRmse: number): { noiseRmse: number | null; degradPct: number | null } {
  const cut = Math.max(4, Math.floor(rows.length * 0.8));
  const train = rows.slice(0, cut);
  const test = rows.slice(cut);
  if (test.length < 3) return { noiseRmse: null, degradPct: null };
  const a = model === 'linear' ? trainLinearModel(train, seed)
    : model === 'knn' ? trainKnnModel(train, seed)
    : trainMlpModel(train, seed);
  const rnd = mulberry32(seed + 555);
  const noisy = test.map((r) => predictWithArtifact(a, r.x.map((v) => v * (1 + (rnd() - 0.5) * 0.2))));
  const rmse = Math.sqrt(noisy.reduce((s, p, i) => s + (p - test[i].y) ** 2, 0) / noisy.length);
  return { noiseRmse: rmse, degradPct: baseRmse > 0 ? ((rmse - baseRmse) / baseRmse) * 100 : null };
}

// Brecha de generalización: entrena en un dominio, evalúa en el otro.
// Incluye conteos para que la UI explique los "—".
export interface DomainGap {
  pubToCalRmse: number | null;
  calToPubRmse: number | null;
  nPub: number;
  nCal: number;
}

export function crossDomainGap(rows: TrainRow[], model: ModelKind, seed: number): DomainGap {
  const pub = rows.filter((r) => r.source === 'public');
  const cal = rows.filter((r) => r.source === 'calibrated');
  const one = (tr: TrainRow[], te: TrainRow[]) => {
    if (tr.length < 5 || te.length < 3) return null;
    const a = model === 'linear' ? trainLinearModel(tr, seed)
      : model === 'knn' ? trainKnnModel(tr, seed)
      : trainMlpModel(tr, seed, 8, 150, 0.05);
    const preds = te.map((r) => predictWithArtifact(a, r.x));
    return computeMetrics(te.map((r) => r.y), preds).rmse;
  };
  return { pubToCalRmse: one(pub, cal), calToPubRmse: one(cal, pub), nPub: pub.length, nCal: cal.length };
}

// ---- Explicabilidad por predicción (XAI local, exacta según familia) ----
export interface PredictionExplanation {
  kind: ModelKind;
  // lineal: aporte de cada feature (w·z) + intercepto
  contributions?: { feature: string; value: number }[];
  intercept?: number;
  // kNN: los k vecinos que votaron (distancia estandarizada + su PM)
  neighbors?: { dist: number; y: number }[];
  k?: number;
  // MLP: sensibilidad local ±10% por feature (agnóstico al modelo)
  sensitivities?: { feature: string; down: number; up: number }[];
}

export function explainPrediction(a: TrialArtifact, x: number[]): PredictionExplanation {
  const z = x.map((v, j) => (v - a.featureMeans[j]) / a.featureStds[j]);
  if (a.model === 'linear') {
    const w = (a.payload as { weights: number[] }).weights;
    return {
      kind: 'linear',
      intercept: w[0],
      contributions: FEATURE_NAMES.map((f, j) => ({ feature: f, value: w[j + 1] * z[j] })),
    };
  }
  if (a.model === 'knn') {
    const p = a.payload as { k: number; XZ: number[][]; y: number[] };
    const all = p.XZ.map((r, i) => ({
      dist: Math.sqrt(r.reduce((s, v, j) => s + (v - z[j]) ** 2, 0)),
      y: p.y[i],
    })).sort((u, v) => u.dist - v.dist);
    return { kind: 'knn', k: p.k, neighbors: all.slice(0, Math.min(p.k, all.length)) };
  }
  const base = predictWithArtifact(a, x);
  return {
    kind: 'mlp',
    sensitivities: FEATURE_NAMES.map((f, j) => {
      const dn = [...x]; dn[j] = x[j] * 0.9;
      const up = [...x]; up[j] = x[j] * 1.1;
      return { feature: f, down: predictWithArtifact(a, dn) - base, up: predictWithArtifact(a, up) - base };
    }),
  };
}

// ---- Pares de contraste (misma lógica para panel IoT, reportes y T-Student) ----
export interface ContrastPair {
  refCode: string;
  hwCode: string;
  zone: string;
  diffsT: number[]; // ref - hw en temperatura
  diffsP: number[]; // ref - hw en PM2.5
  byIndex: boolean;
}

// Series pareadas por timestamp; si hay <3 coincidencias, alinea por orden.
export function contrastPairs(sensors: SensorNode[]): ContrastPair[] {
  const refs = sensors.filter(
    (s) => s.sensorType === VIRTUAL_SENSOR_TYPE && (s.hourlyHistory?.length ?? 0) >= 1,
  );
  const out: ContrastPair[] = [];
  for (const ref of refs) {
    const hws = sensors.filter(
      (s) => s.sensorType !== VIRTUAL_SENSOR_TYPE && s.zoneId === ref.zoneId && (s.hourlyHistory?.length ?? 0) >= 1,
    );
    for (const hw of hws) {
      const refMap = new Map((ref.hourlyHistory || []).map((r) => [r.timestamp, r]));
      let pairs = (hw.hourlyHistory || []).flatMap((h) => {
        const r = refMap.get(h.timestamp);
        return r ? [{ dT: r.temperature - h.temperature, dP: r.pm25 - h.pm25 }] : [];
      });
      let byIndex = false;
      if (pairs.length < 3) {
        const a = (hw.hourlyHistory || []).slice(-12);
        const b = (ref.hourlyHistory || []).slice(-12);
        const n = Math.min(a.length, b.length);
        if (n >= 3) {
          pairs = Array.from({ length: n }, (_, i) => ({
            dT: b[b.length - n + i].temperature - a[a.length - n + i].temperature,
            dP: b[b.length - n + i].pm25 - a[a.length - n + i].pm25,
          }));
          byIndex = true;
        } else {
          continue;
        }
      }
      out.push({
        refCode: ref.code, hwCode: hw.code, zone: ref.zoneName,
        diffsT: pairs.map((p) => p.dT), diffsP: pairs.map((p) => p.dP), byIndex,
      });
    }
  }
  return out;
}

// ---- T-Student pareada (two-tailed) vía beta incompleta regularizada ----
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200, EPS = 3e-12, FPMIN = 1e-300;
  const qab = a + b, qap = a + 1, qam = a - 1;
  let c = 1, d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

function gammaln(z: number): number {
  const c = [76.18009172947146, -86.50532032961677, 24.01409824083091, -1.231739572450155, 0.001208650973866179, -0.000005395239384953];
  let y = z, tmp = z + 5.5;
  tmp -= (z + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) {
    y += 1;
    ser += c[j] / y;
  }
  return -tmp + Math.log(2.5066282746310005 * ser / z);
}

function betai(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const lbeta = gammaln(a) + gammaln(b) - gammaln(a + b);
  const bt = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta);
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

function studentP2(t: number, df: number): number {
  if (!(df > 0) || !Number.isFinite(t)) return NaN;
  if (t === 0) return 1;
  return betai(df / 2, 0.5, df / (df + t * t));
}

export interface WilcoxonResult {
  n: number;
  w: number | null;
  p: number | null;
  significant: boolean | null; // p < 0.05
}

export interface TTestResult {
  n: number;
  mean: number;
  sd: number;
  t: number | null;
  p: number | null;
  significant: boolean | null; // p < 0.05
  ci95: [number, number] | null;
  wilcoxon: WilcoxonResult;
}

function normCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - p : p;
}

// Cuantil t two-tailed al 95% por bisección sobre la CDF exacta
export function tQuantile975(df: number): number {
  if (!(df > 0)) return NaN;
  let lo = 0, hi = 50;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (studentP2(mid, df) > 0.05) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

// Wilcoxon signed-rank (alternativa no paramétrica, ideal con n pequeño).
// H0: mediana de las diferencias = 0. Aproximación normal con corrección
// por continuidad + corrección por empates.
export function wilcoxonSignedRank(diffs: number[]): WilcoxonResult {
  const nz = diffs.filter((v) => v !== 0);
  const n = nz.length;
  if (n < 6) return { n, w: null, p: null, significant: null };
  const ranked = nz
    .map((v, i) => ({ v, a: Math.abs(v), i }))
    .sort((u, w) => u.a - w.a);
  const ranks = new Array(n).fill(0);
  let k = 0;
  let tieCorr = 0;
  while (k < n) {
    let j = k;
    while (j + 1 < n && ranked[j + 1].a === ranked[k].a) j++;
    const avg = (k + 1 + j + 1) / 2;
    for (let m = k; m <= j; m++) ranks[m] = avg;
    const tlen = j - k + 1;
    if (tlen > 1) tieCorr += (tlen ** 3 - tlen) / 48;
    k = j + 1;
  }
  let wPlus = 0;
  for (let m = 0; m < n; m++) {
    if (ranked[m].v > 0) wPlus += ranks[m];
  }
  const mean = (n * (n + 1)) / 4;
  const variance = (n * (n + 1) * (2 * n + 1)) / 24 - tieCorr;
  if (!(variance > 0)) return { n, w: wPlus, p: null, significant: null };
  const z = (wPlus - mean - 0.5 * Math.sign(wPlus - mean)) / Math.sqrt(variance);
  const p = 2 * (1 - normCDF(Math.abs(z)));
  return { n, w: wPlus, p, significant: p < 0.05 };
}

// T pareada (o de una muestra si se pasa una sola serie de diferencias).
// H0: media de las diferencias = 0. Incluye IC95% y Wilcoxon.
export function pairedTTest(diffs: number[]): TTestResult {
  const n = diffs.length;
  const wilcoxon = wilcoxonSignedRank(diffs);
  if (n < 3) return { n, mean: NaN, sd: NaN, t: null, p: null, significant: null, ci95: null, wilcoxon };
  const mean = diffs.reduce((s, v) => s + v, 0) / n;
  const sd = Math.sqrt(diffs.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1));
  if (!(sd > 0)) return { n, mean, sd, t: null, p: null, significant: null, ci95: null, wilcoxon };
  const t = mean / (sd / Math.sqrt(n));
  const p = studentP2(Math.abs(t), n - 1);
  const q = tQuantile975(n - 1);
  const half = q * (sd / Math.sqrt(n));
  return { n, mean, sd, t, p, significant: p < 0.05, ci95: [mean - half, mean + half], wilcoxon };
}
