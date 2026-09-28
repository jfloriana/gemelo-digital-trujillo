import React, { useMemo, useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { SensorNode } from '../../types';
import {
  buildDataset, datasetHash, runTrial, crossValidate, noiseTest, crossDomainGap,
  FEATURE_NAMES, ModelKind, TrialRecord, Metrics,
} from '../../utils/mlTraining';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { Brain, Play, Download, Trophy, FlaskConical, ShieldCheck, FileJson, Table2 } from 'lucide-react';

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
              </>
            )}
          </div>
        );
      })}

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

      {/* Robustness */}
      {(gaps || Object.values(latestByModel).some(Boolean)) && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            {t('mlt.robustTitle')}
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('mlt.robustDesc')}</p>
          {gaps && (
            <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3">{t('mlt.modelCol')}</th>
                    <th className="py-2 px-3">{t('mlt.gapPubCal')}</th>
                    <th className="py-2 px-3">{t('mlt.gapCalPub')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {MODELS.map(({ kind }) => (
                    <tr key={kind}>
                      <td className="py-2 px-3 font-semibold">{t(`mlt.model.${kind}`)}</td>
                      <td className="py-2 px-3 font-mono">{gaps[kind].pubToCalRmse == null ? '—' : `${gaps[kind].pubToCalRmse?.toFixed(2)} µg/m³`}</td>
                      <td className="py-2 px-3 font-mono">{gaps[kind].calToPubRmse == null ? '—' : `${gaps[kind].calToPubRmse?.toFixed(2)} µg/m³`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Trials history + artifacts */}
      {trials.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-3 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileJson className="w-5 h-5 text-slate-600" />
            {t('mlt.trialsTitle')} ({trials.length})
          </h3>
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
