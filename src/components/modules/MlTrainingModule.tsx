import React, { useMemo, useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { SensorNode } from '../../types';
import {
  buildDataset, datasetHash, runTrial, runTrialWithHyper, crossValidate, noiseTest, crossDomainGap,
  gridSearch, predictWithArtifact,
  FEATURE_NAMES, ModelKind, TrialRecord, Metrics, HyperResult,
} from '../../utils/mlTraining';
import { exportTrainingToExcel, exportTrainingToPDF } from '../../utils/exportUtils';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Brain, Play, Download, Trophy, FlaskConical, ShieldCheck, FileJson, Table2, SlidersHorizontal, FileText, Crosshair } from 'lucide-react';

interface MlTrainingModuleProps {
  sensors: SensorNode[];
}

const MODELS: { kind: ModelKind; color: string }[] = [
  { kind: 'linear', color: '#0d9488' },
  { kind: 'knn', color: '#0284c7' },
  { kind: 'mlp', color: '#9333ea' },
];

const TRIALS_KEY = 'mlt_trials_v1';
const REF_R2 = 0.9925; // 1D-CNN tesis (Naveed et al., 2025)

function loadTrials(): TrialRecord[] {
  try {
    const raw = localStorage.getItem(TRIALS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function ModelDetail({ tr }: { tr: TrialRecord }) {
  const { t } = useI18n();
  const a = tr;
  const hyperRows = Object.entries(a.hyper);
  const errs = a.preds.map((p) => p.pred - p.actual);
  const meanErr = errs.length ? errs.reduce((s, v) => s + v, 0) / errs.length : 0;
  const maxErr = errs.length ? Math.max(...errs.map((v) => Math.abs(v))) : 0;
  const within5 = errs.length ? (100 * errs.filter((v) => Math.abs(v) <= 5).length) / errs.length : 0;
  const testPub = a.preds.filter((p) => p.label.startsWith('"PUB-')).length;
  const gap = a.metricsTrain ? a.metrics.r2 - a.metricsTrain.r2 : null;
  const Sec = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <div className="font-bold text-slate-700 dark:text-slate-200 mb-1 uppercase text-[10px] tracking-wide">{title}</div>
      {children}
    </div>
  );
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 rounded-xl p-3 space-y-3 text-[11px]">
      <Sec title={t('mlt.fichaRep')}>
        <div className="grid sm:grid-cols-2 gap-x-3 gap-y-0.5 font-mono text-slate-600 dark:text-slate-300">
          <span>ID: {a.id}</span>
          <span>seed={a.seed}</span>
          <span className="truncate sm:col-span-2">hash: {a.datasetHash}</span>
          <span className="sm:col-span-2">{t('mlt.createdAt')}: {new Date(a.createdAt).toLocaleString('es-PE')}</span>
        </div>
        {hyperRows.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {hyperRows.map(([k, v]) => (
              <span key={k} className="px-2 py-0.5 rounded-md bg-violet-100 dark:bg-violet-950 text-violet-800 dark:text-violet-300 font-mono">{k}={String(v)}</span>
            ))}
          </div>
        )}
      </Sec>
      <Sec title={t('mlt.fichaData')}>
        <div className="text-slate-600 dark:text-slate-300">
          n train/test = {a.nTrain}/{a.nTest} · test: {testPub} {t('mlt.rowsPub')} / {a.preds.length - testPub} {t('mlt.rowsCal')}
        </div>
      </Sec>
      <Sec title={t('mlt.fichaEval')}>
        <table className="w-full text-left font-mono">
          <thead className="text-slate-500 uppercase text-[10px]">
            <tr><th className="py-0.5 pr-2"></th><th className="py-0.5 pr-2">R²</th><th className="py-0.5 pr-2">RMSE</th><th className="py-0.5 pr-2">MAE</th><th className="py-0.5">MAPE%</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
            <tr><td className="py-0.5 pr-2 font-sans">train</td><td className="py-0.5 pr-2">{a.metricsTrain ? a.metricsTrain.r2.toFixed(3) : '—'}</td><td className="py-0.5 pr-2">{a.metricsTrain ? a.metricsTrain.rmse.toFixed(2) : '—'}</td><td className="py-0.5 pr-2">{a.metricsTrain ? a.metricsTrain.mae.toFixed(2) : '—'}</td><td className="py-0.5">{a.metricsTrain ? a.metricsTrain.mape.toFixed(1) : '—'}</td></tr>
            <tr><td className="py-0.5 pr-2 font-sans">test</td><td className="py-0.5 pr-2">{a.metrics.r2.toFixed(3)}</td><td className="py-0.5 pr-2">{a.metrics.rmse.toFixed(2)}</td><td className="py-0.5 pr-2">{a.metrics.mae.toFixed(2)}</td><td className="py-0.5">{a.metrics.mape.toFixed(1)}</td></tr>
          </tbody>
        </table>
        {gap != null && <div className="text-slate-500 mt-0.5">{t('mlt.gapOverfit')}: ΔR² = {gap.toFixed(3)} {gap < -0.15 ? `(${t('mlt.gapWarn')})` : `(${t('mlt.gapOk')})`}</div>}
      </Sec>
      <Sec title={t('mlt.fichaResid')}>
        <div className="font-mono text-slate-600 dark:text-slate-300">
          {t('mlt.meanErr')}: {meanErr >= 0 ? '+' : ''}{meanErr.toFixed(2)} · {t('mlt.maxErr')}: {maxErr.toFixed(2)} · |e|≤5: {within5.toFixed(0)}%
        </div>
      </Sec>
      {a.model === 'linear' && (() => {
        const w = (a.payload as { weights: number[] }).weights;
        const raw = w.slice(1).map((c, j) => c / a.featureStds[j]);
        const b0 = w[0] - raw.reduce((s, c, j) => s + c * a.featureMeans[j], 0);
        return (
          <div className="space-y-2">
            <div className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wide">{t('mlt.methodLinear')}</div>
            <div className="font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 overflow-x-auto whitespace-nowrap">
              PM = {w[0].toFixed(2)}{w.slice(1).map((c, j) => ` ${c >= 0 ? '+' : '−'} ${Math.abs(c).toFixed(2)}·z(${FEATURE_NAMES[j]})`).join('')}
            </div>
            <table className="w-full text-left">
              <thead className="text-slate-500 uppercase text-[10px]">
                <tr><th className="py-1 pr-2">{t('mlt.featureCol')}</th><th className="py-1 pr-2">{t('mlt.coefCol')} z</th><th className="py-1 pr-2">{t('mlt.rawCoef')}</th><th className="py-1">{t('mlt.effectCol')}</th></tr>
              </thead>
              <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60 font-mono">
                {FEATURE_NAMES.map((f, j) => (
                  <tr key={f}>
                    <td className="py-1 pr-2 font-sans">{f}</td>
                    <td className="py-1 pr-2">{w[j + 1].toFixed(3)}</td>
                    <td className="py-1 pr-2">{raw[j] >= 0 ? '+' : ''}{raw[j].toFixed(3)}</td>
                    <td className="py-1">{t('mlt.perUnit').replace('{v}', `${raw[j] >= 0 ? '+' : ''}${raw[j].toFixed(2)}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="font-mono text-slate-500">b₀ (unidades reales) = {b0.toFixed(2)} µg/m³</div>
          </div>
        );
      })()}
      {a.model === 'knn' && (() => {
        const p = a.payload as { k: number; XZ: number[][]; y: number[] };
        const ys = p.y;
        const mn = Math.min(...ys);
        const mx = Math.max(...ys);
        // Vecinos de ejemplo: query = centroide del train, top-3 distancias
        const centroid = p.XZ[0].map((_, j) => p.XZ.reduce((s, r) => s + r[j], 0) / p.XZ.length);
        const ex = p.XZ.map((r, i) => ({ i, d: Math.sqrt(r.reduce((s, v, j) => s + (v - centroid[j]) ** 2, 0)) }))
          .sort((u, v) => u.d - v.d).slice(0, 3);
        return (
          <div className="space-y-2 text-slate-600 dark:text-slate-300">
            <div><strong>k</strong> = {p.k} · <strong>N</strong> = {p.y.length} · {t('mlt.knnMetric')}</div>
            <div>{t('mlt.knnRule')}</div>
            <div>{t('mlt.targetRange')}: [{mn.toFixed(1)}, {mx.toFixed(1)}] µg/m³</div>
            <div>
              <div className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wide mb-1">{t('mlt.knnExample')}</div>
              <table className="w-full text-left font-mono">
                <thead className="text-slate-500 uppercase text-[10px]">
                  <tr><th className="py-0.5 pr-2">#</th><th className="py-0.5 pr-2">dist</th><th className="py-0.5">y (PM)</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                  {ex.map((e, k) => (
                    <tr key={k}><td className="py-0.5 pr-2">#{e.i}</td><td className="py-0.5 pr-2">{e.d.toFixed(3)}</td><td className="py-0.5">{ys[e.i].toFixed(1)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
      {a.model === 'mlp' && (() => {
        const p = a.payload as { w1: number[][]; b1: number[]; w2: number[]; b2: number; yMean: number; yStd: number; lossHist?: number[] };
        const hidden = p.b1.length;
        const nParams = 4 * hidden + hidden + hidden + 1;
        const stat = (v: number[]) => ({ min: Math.min(...v).toFixed(3), max: Math.max(...v).toFixed(3) });
        const sW1 = stat(p.w1.flat());
        const sW2 = stat(p.w2);
        return (
          <div className="space-y-2">
            <div className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wide">{t('mlt.methodMlp')}</div>
            <div className="font-bold text-slate-700 dark:text-slate-200">{t('mlt.architecture')} · {nParams} {t('mlt.params')} · y→({p.yMean.toFixed(1)}±{p.yStd.toFixed(1)})</div>
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              {[`in(4)`, `h(${hidden}) tanh`, `out(1)`].map((s, i, arr) => (
                <span key={s} className="flex items-center gap-1.5">
                  <span className="px-2 py-1 rounded-lg bg-violet-600 text-white font-bold">{s}</span>
                  {i < arr.length - 1 && <span className="text-slate-400">→</span>}
                </span>
              ))}
            </div>
            <div className="font-mono text-slate-500">W1∈[{sW1.min},{sW1.max}] · W2∈[{sW2.min},{sW2.max}] · b2={p.b2.toFixed(3)}</div>
            <div>
              <div className="font-bold text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wide mb-1">{t('mlt.wTable')}</div>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left font-mono text-[10px]">
                  <thead className="bg-white dark:bg-slate-900 text-slate-500">
                    <tr><th className="py-1 px-2">h⧵in</th>{FEATURE_NAMES.map((f) => <th key={f} className="py-1 px-2">{f.split(' ')[0]}</th>)}<th className="py-1 px-2">b</th><th className="py-1 px-2">→out</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/60 dark:divide-slate-700/60">
                    {p.b1.map((b, j) => (
                      <tr key={j}>
                        <td className="py-0.5 px-2 font-bold">h{j}</td>
                        {p.w1.map((row, k) => <td key={k} className="py-0.5 px-2">{row[j].toFixed(3)}</td>)}
                        <td className="py-0.5 px-2">{b.toFixed(3)}</td>
                        <td className="py-0.5 px-2 font-bold">{p.w2[j].toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {p.lossHist?.length ? (
              <div className="h-[140px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={p.lossHist.map((v, i) => ({ ep: i * 10, loss: v }))} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="ep" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip />
                    <Line type="monotone" dataKey="loss" name="MSE" stroke="#9333ea" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="italic text-slate-400">{t('mlt.noLoss')}</p>
            )}
          </div>
        );
      })()}
    </div>
  );
}

function MetricGrid({ m }: { m: Metrics }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {[
        ['R²', m.r2.toFixed(4)],
        ['RMSE', m.rmse.toFixed(2)],
        ['MAE', m.mae.toFixed(2)],
        ['MAPE', `${m.mape.toFixed(2)}%`],
      ].map(([k, v]) => (
        <div key={k} className="bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-lg px-2 py-1.5 text-center">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 font-semibold">{k}</div>
          <div className="text-xs font-bold font-mono text-slate-900 dark:text-white">{v}</div>
        </div>
      ))}
    </div>
  );
}

export const MlTrainingModule: React.FC<MlTrainingModuleProps> = ({ sensors }) => {
  const { t } = useI18n();
  const [trials, setTrials] = useState<TrialRecord[]>(loadTrials);
  const [training, setTraining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gaps, setGaps] = useState<Record<ModelKind, { pubToCalRmse: number | null; calToPubRmse: number | null }> | null>(null);
  const [grid, setGrid] = useState<HyperResult[] | null>(null);
  const [gridRunning, setGridRunning] = useState(false);
  const [inferX, setInferX] = useState<number[]>([28, 70, 2.5, 400]);
  const [inferSensor, setInferSensor] = useState<string>('');
  const [expanded, setExpanded] = useState<ModelKind | null>(null);

  const rows = useMemo(() => buildDataset(sensors), [sensors]);
  const nPub = rows.filter((r) => r.source === 'public').length;
  const nCal = rows.filter((r) => r.source === 'calibrated').length;
  const canTrain = rows.length >= 12;

  const latestByModel = useMemo(() => {
    const m = {} as Record<ModelKind, TrialRecord | undefined>;
    for (const tr of trials) {
      if (!m[tr.model]) m[tr.model] = tr;
    }
    return m;
  }, [trials]);

  const bestKind = useMemo(() => {
    const cands = MODELS.map((x) => latestByModel[x.kind]).filter(Boolean) as TrialRecord[];
    if (!cands.length) return null;
    return cands.reduce((a, b) => (a.metrics.rmse <= b.metrics.rmse ? a : b)).model;
  }, [latestByModel]);

  const trainAll = () => {
    setError(null);
    if (!canTrain) {
      setError(t('mlt.needMore'));
      return;
    }
    setTraining(true);
    // Defer para que el spinner pinte antes del cómputo síncrono
    setTimeout(() => {
      try {
        const seed = 42 + trials.length;
        const recs: TrialRecord[] = MODELS.map(({ kind }, i) => {
          const base = runTrial(rows, kind, seed + i * 101);
          const cv = crossValidate(rows, kind, seed + i * 101);
          const nz = noiseTest(rows, kind, seed + i * 101, base.metrics.rmse);
          return {
            ...base,
            id: `trial-${Date.now().toString(36)}-${kind}`,
            cvMeanR2: cv.meanR2,
            cvStdR2: cv.stdR2,
            noiseRmse: nz.noiseRmse,
            noiseDegradPct: nz.degradPct,
          };
        });
        const next = [...recs, ...trials].slice(0, 30);
        setTrials(next);
        try {
          localStorage.setItem(TRIALS_KEY, JSON.stringify(next));
        } catch { /* almacenamiento lleno: se ignora */ }
        setGaps({
          linear: crossDomainGap(rows, 'linear', seed + 7),
          knn: crossDomainGap(rows, 'knn', seed + 8),
          mlp: crossDomainGap(rows, 'mlp', seed + 9),
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setTraining(false);
      }
    }, 60);
  };

  const runGridSearch = () => {
    setError(null);
    if (!canTrain) {
      setError(t('mlt.needMore'));
      return;
    }
    setGridRunning(true);
    setTimeout(() => {
      try {
        setGrid(gridSearch(rows, 1000 + trials.length));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setGridRunning(false);
      }
    }, 60);
  };

  const adoptGridBest = () => {
    if (!grid?.length) return;
    const g = grid[0];
    // Registra la combinación ganadora con sus hiperparámetros exactos + robustez
    const full = runTrialWithHyper(rows, g.model, g.seed, g.hyper);
    const cv = crossValidate(rows, g.model, g.seed);
    const nz = noiseTest(rows, g.model, g.seed, full.metrics.rmse);
    const rec: TrialRecord = {
      ...full,
      id: `trial-grid-${Date.now().toString(36)}-${g.model}`,
      cvMeanR2: cv.meanR2, cvStdR2: cv.stdR2,
      noiseRmse: nz.noiseRmse, noiseDegradPct: nz.degradPct,
    };
    const next = [rec, ...trials].slice(0, 30);
    setTrials(next);
    try {
      localStorage.setItem(TRIALS_KEY, JSON.stringify(next));
    } catch { /* ignore */ }
  };

  const fillFromSensor = (id: string) => {
    setInferSensor(id);
    const s = sensors.find((x) => x.id === id);
    if (s?.lastReading) {
      setInferX([s.lastReading.temperature, s.lastReading.humidity, s.lastReading.windSpeed, s.lastReading.solarRadiation]);
    }
  };

  const aqiOf = (pm: number) =>
    pm <= 12 ? 'Buena' : pm <= 35.4 ? 'Moderada' : pm <= 55.4 ? 'Dañina p/ sensibles' : pm <= 150.4 ? 'Dañina' : 'Muy dañina';

  const downloadArtifact = (tr: TrialRecord) => {
    const { id, cvMeanR2, cvStdR2, noiseRmse, noiseDegradPct, preds, ...artifact } = tr;
    download(`artefacto_${tr.model}_${tr.id}.json`, JSON.stringify(artifact, null, 2), 'application/json');
  };

  const downloadPreds = (tr: TrialRecord) => {
    const csv = ['etiqueta,real_pm25,predicho_pm25', ...tr.preds.map((p) => `"${p.label}",${p.actual},${p.pred}`)].join('\n');
    download(`predicciones_${tr.model}_${tr.id}.csv`, csv, 'text/csv;charset=utf-8;');
  };

  const best = bestKind ? latestByModel[bestKind] : undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <span className="px-3 py-1 bg-violet-50 text-violet-700 border border-violet-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
          {t('mlt.badge')}
        </span>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{t('mlt.title')}</h2>
        <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">{t('mlt.desc')}</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 font-mono">
          {t('mlt.refLine').replace('{r2}', String(REF_R2))}
        </p>
      </div>

      {/* Dataset + Train */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Table2 className="w-5 h-5 text-violet-600" />
          {t('mlt.datasetTitle')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            [t('mlt.rows'), String(rows.length)],
            [t('mlt.rowsPub'), String(nPub)],
            [t('mlt.rowsCal'), String(nCal)],
            [t('mlt.hash'), datasetHash(rows)],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl px-3 py-2">
              <div className="text-slate-500 dark:text-slate-400 font-medium">{k}</div>
              <div className="font-bold font-mono text-slate-900 dark:text-white truncate">{v}</div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('mlt.features')}: {FEATURE_NAMES.join(' · ')} → PM2.5 · {t('mlt.split')}
        </p>
        {error && (
          <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5">{error}</div>
        )}
        <button
          onClick={trainAll}
          disabled={training || !canTrain}
          className="w-full sm:w-auto px-5 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4" />
          {training ? t('mlt.training') : t('mlt.trainAll')}
        </button>
        {!canTrain && <p className="text-[11px] text-amber-700 dark:text-amber-400">{t('mlt.needMore')}</p>}
      </div>

      {/* Model cards */}
      {MODELS.map(({ kind, color }) => {
        const tr = latestByModel[kind];
        const isBest = bestKind === kind;
        return (
          <div key={kind} className={`bg-white dark:bg-slate-900 border rounded-2xl p-6 space-y-3 shadow-sm ${isBest ? 'border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-400/40' : 'border-slate-200/80 dark:border-slate-700'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5" style={{ color }} />
                {t(`mlt.model.${kind}`)}
              </h3>
              {isBest && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-600 text-white flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> {t('mlt.best')}
                </span>
              )}
            </div>
            {!tr ? (
              <p className="text-xs text-slate-400 italic">{t('mlt.noTrials')}</p>
            ) : (
              <>
                <MetricGrid m={tr.metrics} />
                <div className="text-[10px] text-slate-400 font-mono">
                  n={tr.nTrain}/{tr.nTest} · {t('mlt.cv')}: {tr.cvMeanR2 == null ? '—' : `${tr.cvMeanR2.toFixed(3)} ± ${tr.cvStdR2?.toFixed(3)}`} · {t('mlt.noise')}: {tr.noiseDegradPct == null ? '—' : `+${tr.noiseDegradPct.toFixed(1)}%`}
                </div>
                <button
                  onClick={() => setExpanded((prev) => (prev === kind ? null : kind))}
                  className="text-[11px] font-bold text-violet-700 dark:text-violet-300 hover:underline cursor-pointer"
                >
                  {expanded === kind ? t('mlt.hideModel') : t('mlt.showModel')}
                </button>
                {expanded === kind && <ModelDetail tr={tr} />}
              </>
            )}
          </div>
        );
      })}

      {/* Búsqueda de hiperparámetros + selección */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Crosshair className="w-5 h-5 text-violet-600" />
          {t('mlt.gridTitle')}
        </h3>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('mlt.gridDesc')}</p>
        <button
          onClick={runGridSearch}
          disabled={gridRunning || !canTrain}
          className="w-full sm:w-auto px-5 py-2.5 bg-violet-700 hover:bg-violet-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Play className="w-4 h-4" />
          {gridRunning ? t('mlt.training') : t('mlt.gridRun')}
        </button>
        {grid && (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">#</th>
                    <th className="py-2 px-3">{t('mlt.modelCol')}</th>
                    <th className="py-2 px-3">{t('mlt.hyperCol')}</th>
                    <th className="py-2 px-3">R²</th>
                    <th className="py-2 px-3">RMSE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {grid.map((g, i) => (
                    <tr key={i} className={i === 0 ? 'bg-emerald-50/70 dark:bg-emerald-950/20 font-semibold' : ''}>
                      <td className="py-2 px-3 font-mono">{i === 0 ? <Trophy className="w-3.5 h-3.5 text-emerald-600 inline" /> : i + 1}</td>
                      <td className="py-2 px-3">{t(`mlt.model.${g.model}`)}</td>
                      <td className="py-2 px-3 font-mono">{g.hyperLabel}</td>
                      <td className="py-2 px-3 font-mono">{g.metrics.r2.toFixed(3)}</td>
                      <td className="py-2 px-3 font-mono">{g.metrics.rmse.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={adoptGridBest}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Trophy className="w-3.5 h-3.5" />
              {t('mlt.gridAdopt')}
            </button>
          </>
        )}
      </div>

      {/* Best: predicted vs actual */}
      {best && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-emerald-600" />
            {t('mlt.chartTitle')} ({t(`mlt.model.${best.model}`)})
          </h3>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={best.preds.map((p, i) => ({ i: i + 1, real: p.actual, pred: p.pred }))} margin={{ top: 4, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="i" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="real" name={t('mlt.actual')} stroke="#64748b" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="pred" name={t('mlt.predicted')} stroke="#059669" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Motor de inferencia con el modelo campeón */}
      {best && (
        <div className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 rounded-2xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-emerald-600" />
            {t('mlt.inferTitle')} · {t(`mlt.model.${best.model}`)}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{t('mlt.inferSensor')}</span>
              <select
                value={inferSensor}
                onChange={(e) => fillFromSensor(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs"
              >
                <option value="">{t('mlt.inferManual')}</option>
                {sensors.filter((s) => s.lastReading?.timestamp).map((s) => (
                  <option key={s.id} value={s.id}>{s.code} — {s.lastReading.temperature}°C / PM {s.lastReading.pm25}</option>
                ))}
              </select>
            </label>
            {FEATURE_NAMES.map((f, i) => {
              const cfg = [
                { min: 5, max: 45, step: 0.1, unit: '°C' },
                { min: 20, max: 100, step: 1, unit: '%' },
                { min: 0, max: 12, step: 0.1, unit: 'm/s' },
                { min: 0, max: 1100, step: 10, unit: 'W/m²' },
              ][i];
              return (
                <div key={f} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{f}</span>
                    <strong className="font-mono text-slate-900 dark:text-white">{inferX[i]} {cfg.unit}</strong>
                  </div>
                  <input
                    type="range" min={cfg.min} max={cfg.max} step={cfg.step} value={inferX[i]}
                    onChange={(e) => setInferX((prev) => prev.map((v, j) => (j === i ? Number(e.target.value) : v)))}
                    className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              );
            })}
          </div>
          {(() => {
            const pm = Math.max(0, Number(predictWithArtifact(best, inferX).toFixed(1)));
            return (
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-xl px-4 py-3">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase">{t('mlt.inferResult')}</div>
                  <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400">{pm} µg/m³</div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  AQI: {aqiOf(pm)}
                </span>
              </div>
            );
          })()}
        </div>
      )}

      {/* Robustness */}
      {(gaps || Object.values(latestByModel).some(Boolean)) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            {t('mlt.robustTitle')}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('mlt.robustDesc')}</p>
          <p className="text-[11px] font-mono text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200/70 dark:border-slate-700 rounded-lg px-2.5 py-1.5">
            {t('mlt.robustBase').replace('{pub}', String(nPub)).replace('{cal}', String(nCal)).replace('{hash}', datasetHash(rows))}
          </p>
          <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">{t('mlt.modelCol')}</th>
                  <th className="py-2 px-3">{t('mlt.cvCol')}</th>
                  <th className="py-2 px-3">{t('mlt.noiseCol')}</th>
                  <th className="py-2 px-3">{t('mlt.gapPubCal')}</th>
                  <th className="py-2 px-3">{t('mlt.gapCalPub')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {MODELS.map(({ kind }) => {
                  const tr = latestByModel[kind];
                  return (
                    <tr key={kind}>
                      <td className="py-2 px-3 font-semibold">{t(`mlt.model.${kind}`)}</td>
                      <td className="py-2 px-3 font-mono">{tr?.cvMeanR2 == null ? '—' : `${tr.cvMeanR2.toFixed(3)} ± ${tr.cvStdR2?.toFixed(3)}`}</td>
                      <td className="py-2 px-3 font-mono">{tr?.noiseDegradPct == null ? '—' : `+${tr.noiseDegradPct.toFixed(1)}%`}</td>
                      <td className="py-2 px-3 font-mono">{!gaps || gaps[kind].pubToCalRmse == null ? '—' : `${gaps[kind].pubToCalRmse?.toFixed(2)} µg/m³`}</td>
                      <td className="py-2 px-3 font-mono">{!gaps || gaps[kind].calToPubRmse == null ? '—' : `${gaps[kind].calToPubRmse?.toFixed(2)} µg/m³`}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">{t('mlt.robustNeed')}</p>
        </div>
      )}

      {/* Trials history + artifacts */}
      {trials.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileJson className="w-5 h-5 text-slate-600" />
              {t('mlt.trialsTitle')} ({trials.length})
            </h3>
            <div className="flex gap-1.5">
              <button onClick={() => exportTrainingToExcel(trials, rows.length, gaps)} disabled={!trials.length} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> {t('mlt.reportExcel')}
              </button>
              <button onClick={() => exportTrainingToPDF(trials, rows.length)} disabled={!trials.length} className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                <FileText className="w-3.5 h-3.5" /> {t('mlt.reportPdf')}
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">{t('mlt.trialCol')}</th>
                  <th className="py-2 px-3">{t('mlt.modelCol')}</th>
                  <th className="py-2 px-3">R² / RMSE</th>
                  <th className="py-2 px-3">{t('mlt.filesCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {trials.map((tr) => (
                  <tr key={tr.id}>
                    <td className="py-2 px-3 font-mono text-slate-500">{tr.id} · n={tr.nTrain}/{tr.nTest}</td>
                    <td className="py-2 px-3 font-semibold">{t(`mlt.model.${tr.model}`)}</td>
                    <td className="py-2 px-3 font-mono">{tr.metrics.r2.toFixed(3)} / {tr.metrics.rmse.toFixed(2)}</td>
                    <td className="py-2 px-3">
                      <div className="flex gap-1.5">
                        <button onClick={() => downloadArtifact(tr)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer" title="JSON">
                          <Download className="w-3 h-3" /> JSON
                        </button>
                        <button onClick={() => downloadPreds(tr)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-semibold flex items-center gap-1 cursor-pointer" title="CSV">
                          <Download className="w-3 h-3" /> CSV
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
