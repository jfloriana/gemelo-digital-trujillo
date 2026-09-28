import React, { useEffect, useMemo, useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { supabase } from '../../lib/supabase';
import { VIRTUAL_SENSOR_TYPE } from '../../types';
import { Database, Download } from 'lucide-react';

interface PubReading {
  measured_at: string;
  sensor_id: string;
  temperature: number;
  humidity: number;
  wind_speed: number;
  solar_radiation: number;
  pm25: number;
  pm10: number;
  no2: number;
  o3: number;
  aqi_index: number;
  aqi_category: string;
  is_calibrated: boolean;
  qa_flags: string[];
}

const PAGE_SIZE = 25;
const EXPORT_CAP = 5000;

// Historial COMPLETO de los datasets públicos (Open-Meteo/OpenAQ) tal como
// está guardado en Supabase — sin el recorte de 12 lecturas del hook.
// Incluye conteo total y descarga CSV de todo el historial.
export const PublicRecordsViewer: React.FC = () => {
  const { t } = useI18n();
  const [sensorIds, setSensorIds] = useState<string[]>([]);
  const [sensorNames, setSensorNames] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [rows, setRows] = useState<PubReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Nodos virtuales (fuentes públicas)
  useEffect(() => {
    let live = true;
    (async () => {
      const { data, error } = await supabase
        .from('sensor_nodes')
        .select('id,code')
        .eq('sensor_type', VIRTUAL_SENSOR_TYPE)
        .order('code');
      if (!live) return;
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const ids = (data || []).map((s: { id: string }) => s.id);
      const names: Record<string, string> = {};
      (data || []).forEach((s: { id: string; code: string }) => { names[s.id] = s.code; });
      setSensorIds(ids);
      setSensorNames(names);
    })();
    return () => { live = false; };
  }, []);

  const activeIds = useMemo(
    () => (filter === 'all' ? sensorIds : sensorIds.filter((id) => id === filter)),
    [sensorIds, filter],
  );

  // Página actual + conteo total
  useEffect(() => {
    if (!activeIds.length) {
      setRows([]);
      setTotal(sensorIds.length ? 0 : null);
      setLoading(false);
      return;
    }
    let live = true;
    setLoading(true);
    setError(null);
    (async () => {
      const from = page * PAGE_SIZE;
      const { data, error, count } = await supabase
        .from('environmental_readings')
        .select('measured_at,sensor_id,temperature,humidity,wind_speed,solar_radiation,pm25,pm10,no2,o3,aqi_index,aqi_category,is_calibrated,qa_flags', { count: 'exact' })
        .in('sensor_id', activeIds)
        .order('measured_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1);
      if (!live) return;
      if (error) {
        setError(error.message);
      } else {
        setRows((data || []) as PubReading[]);
        setTotal(count ?? (data || []).length);
      }
      setLoading(false);
    })();
    return () => { live = false; };
  }, [activeIds, page, sensorIds.length]);

  const pages = total == null ? 1 : Math.max(1, Math.ceil(total / PAGE_SIZE));

  const exportAll = async () => {
    if (!activeIds.length) return;
    setExporting(true);
    try {
      const all: PubReading[] = [];
      for (let from = 0; from < Math.min(total ?? EXPORT_CAP, EXPORT_CAP); from += 1000) {
        const { data, error } = await supabase
          .from('environmental_readings')
          .select('measured_at,sensor_id,temperature,humidity,wind_speed,solar_radiation,pm25,pm10,no2,o3,aqi_index,aqi_category,is_calibrated,qa_flags')
          .in('sensor_id', activeIds)
          .order('measured_at', { ascending: false })
          .range(from, from + 999);
        if (error) throw new Error(error.message);
        all.push(...((data || []) as PubReading[]));
        if (!data || data.length < 1000) break;
      }
      const csv = ['sensor,measured_at,temperature,humidity,wind_speed,solar_radiation,pm25,pm10,no2,o3,aqi_index,aqi_category,is_calibrated,qa_flags',
        ...all.map((r) => `"${sensorNames[r.sensor_id] || r.sensor_id}","${r.measured_at}",${r.temperature},${r.humidity},${r.wind_speed},${r.solar_radiation},${r.pm25},${r.pm10},${r.no2},${r.o3},${r.aqi_index},"${r.aqi_category}",${r.is_calibrated},"${(r.qa_flags || []).join('|')}"`)].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `historial_publico_${all.length}filas.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-sky-200/70 dark:border-sky-900 rounded-2xl p-6 space-y-4 shadow-sm">
      <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
        <Database className="w-5 h-5 text-sky-600" />
        {t('mlt.pubRecTitle')}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('mlt.pubRecDesc')}</p>

      <div className="flex items-center gap-1.5 flex-wrap">
        <button
          onClick={() => { setFilter('all'); setPage(0); }}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${filter === 'all' ? 'bg-sky-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          {t('mlt.filterAll')} {total != null && `(${total})`}
        </button>
        {sensorIds.map((id) => (
          <button
            key={id}
            onClick={() => { setFilter(id); setPage(0); }}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono transition-all cursor-pointer ${filter === id ? 'bg-sky-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
          >
            {sensorNames[id] || id}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5">{error}</div>
      )}

      {loading ? (
        <p className="text-xs text-slate-400">{t('mlt.pubRecLoading')}</p>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200/70 dark:border-slate-700">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">{t('mlt.pubRecDate')}</th>
                  <th className="py-2 px-3">{t('mlt.dsSensor')}</th>
                  <th className="py-2 px-3">T°</th>
                  <th className="py-2 px-3">HR</th>
                  <th className="py-2 px-3">{t('mlt.dsWind')}</th>
                  <th className="py-2 px-3">Rad</th>
                  <th className="py-2 px-3">PM</th>
                  <th className="py-2 px-3">PM10</th>
                  <th className="py-2 px-3">NO₂/O₃</th>
                  <th className="py-2 px-3">AQI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                {rows.map((r, i) => (
                  <tr key={`${r.measured_at}-${i}`}>
                    <td className="py-1.5 px-3 whitespace-nowrap">{String(r.measured_at).slice(0, 16).replace('T', ' ')}</td>
                    <td className="py-1.5 px-3">{sensorNames[r.sensor_id] || r.sensor_id}</td>
                    <td className="py-1.5 px-3">{r.temperature}</td>
                    <td className="py-1.5 px-3">{r.humidity}</td>
                    <td className="py-1.5 px-3">{r.wind_speed}</td>
                    <td className="py-1.5 px-3">{r.solar_radiation}</td>
                    <td className="py-1.5 px-3 font-bold">{r.pm25}</td>
                    <td className="py-1.5 px-3">{r.pm10}</td>
                    <td className="py-1.5 px-3">{r.no2}/{r.o3}</td>
                    <td className="py-1.5 px-3">{r.aqi_index}</td>
                  </tr>
                ))}
                {!rows.length && (
                  <tr><td colSpan={10} className="py-3 px-3 text-center text-slate-400 font-sans">{t('mlt.pubRecEmpty')}</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-[11px] font-bold cursor-pointer"
            >
              ← {t('mlt.prev')}
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
              disabled={page >= pages - 1}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 disabled:opacity-40 text-[11px] font-bold cursor-pointer"
            >
              {t('mlt.next')} →
            </button>
            <span className="text-[11px] text-slate-400 font-mono">
              {t('mlt.pageOf').replace('{p}', String(page + 1)).replace('{n}', String(pages))}
              {total != null && ` · ${total} ${t('mlt.rows')}`}
            </span>
            <button
              onClick={exportAll}
              disabled={exporting || !total}
              className="px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 disabled:opacity-40 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? t('mlt.pubRecExporting') : t('mlt.pubRecExport')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
