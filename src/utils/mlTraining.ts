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

export function buildDataset(sensors: SensorNode[]): TrainRow[] {
  const rows: TrainRow[] = [];
  for (const s of sensors) {
    const pub = s.sensorType === VIRTUAL_SENSOR_TYPE;
    for (const r of s.hourlyHistory || []) {
      if (!Number.isFinite(r.temperature) || !Number.isFinite(r.pm25)) continue;
      if (r.pm25 <= 0 && r.temperature <= 0) continue; // placeholder sin telemetría
      rows.push({
        x: [r.temperature, r.humidity, r.windSpeed, r.solarRadiation],
        y: r.pm25,
        source: pub ? 'public' : 'calibrated',
        sensorCode: s.code,
        timestamp: r.timestamp,
      });
    }
  }
  return rows;
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

// Brecha de generalización: entrena en un dominio, evalúa en el otro
export function crossDomainGap(rows: TrainRow[], model: ModelKind, seed: number): { pubToCalRmse: number | null; calToPubRmse: number | null } {
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
  return { pubToCalRmse: one(pub, cal), calToPubRmse: one(cal, pub) };
}
