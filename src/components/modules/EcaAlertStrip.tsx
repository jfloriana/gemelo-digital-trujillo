import React from 'react';
import { AlertTriangle, OctagonAlert } from 'lucide-react';
import { useI18n } from '../../context/I18nContext';
import { SensorNode } from '../../types';
import { buildEcaAlerts } from '../../utils/ecaAlerts';

// Cinta de alertas ECA-Aire / OMS / calor sobre la última telemetría de TODOS
// los nodos (hardware + referencias públicas etiquetadas). Solo visual.
export const EcaAlertStrip: React.FC<{ sensors: SensorNode[] }> = ({ sensors }) => {
  const { t } = useI18n();
  const alerts = buildEcaAlerts(sensors);
  if (!alerts.length) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-2xl px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
        {t('eca.none')}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
        {t('eca.title')} ({alerts.length})
      </div>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {alerts.slice(0, 6).map(a => (
          <div
            key={a.sensorId}
            className={`border rounded-xl px-3 py-2 text-xs flex items-start gap-2 ${
              a.level === 'danger'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900'
            }`}
          >
            {a.level === 'danger'
              ? <OctagonAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              : <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <div className="font-bold font-mono text-slate-900 dark:text-white">
                {a.code} <span className="font-sans font-medium text-slate-500">· {a.zoneName}</span>
              </div>
              <div className="text-slate-600 dark:text-slate-300">
                {a.kind === 'pm'
                  ? t('eca.pmMsg').replace('{pm}', String(a.pm25)).replace('{thr}', a.level === 'danger' ? '50' : '15')
                  : t('eca.heatMsg').replace('{temp}', String(a.temperature))}
                {a.isPublic ? ` · ${t('eca.publicTag')}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
