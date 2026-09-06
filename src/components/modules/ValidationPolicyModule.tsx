import React from 'react';
import { useI18n } from '../../context/I18nContext';
import { ThesisObjectiveEvaluation, UrbanZone } from '../../types';
import { 
  CheckCircle2, 
  Award, 
  FileText, 
  ShieldAlert, 
  TrendingUp, 
  Users, 
  Landmark, 
  Scale, 
  Download, 
  Check, 
  AlertCircle 
} from 'lucide-react';

interface ValidationPolicyModuleProps {
  objectives: ThesisObjectiveEvaluation[];
  zones: UrbanZone[];
  onExportReports: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const ValidationPolicyModule: React.FC<ValidationPolicyModuleProps> = ({
  objectives,
  zones,
  onExportReports
}) => {
  const { t } = useI18n();
  const totalBenefitedPop = zones.reduce((acc, z) => acc + z.targetPopulation, 0);
  const totalVulnerablePop = zones.reduce((acc, z) => acc + z.vulnerablePopulation, 0);

  const policyRecommendations = [
    {
      id: 'rec-01',
      title: 'Ordenanza Municipal de Techos Verdes y Factor Bioclimático en Trujillo Cercado',
      description: 'Establecer incentivos tributarios en el arbitrio municipal para inmuebles comerciales que implementen cubiertas vegetales extensivas (>50 m²).',
      impact: 'Alto',
      responsible: 'Municipalidad Provincial de Trujillo (GDU)'
    },
    {
      id: 'rec-02',
      title: 'Priorización del Corredor Arbolado en Anillo Vial Av. España y Av. América',
      description: 'Sustitución de bermas asfaltadas por arbolado continuo de alta copa (Molle costeño, Huarango) para atrapar el 28% de PM2.5 diésel.',
      impact: 'Muy Alto',
      responsible: 'SEGAT / MPT'
    },
    {
      id: 'rec-03',
      title: 'Red de Alerta Temprana de Inversión Térmica y Picos de Calor a Microescala',
      description: 'Integrar la telemetría del Gemelo Digital con avisos en tiempo real para centros de salud y colegios en distritos de alto riesgo (El Porvenir, Mayorista).',
      impact: 'Crítico',
      responsible: 'GERESA La Libertad / OEFA'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
              {t('validation.badge')}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {t('validation.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">
              {t('validation.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReports('docx')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-amber-600" />
              {t('validation.btnDocx')}
            </button>
            <button
              onClick={() => onExportReports('pdf')}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-amber-900/10"
            >
              <Download className="w-3.5 h-3.5" />
              {t('validation.btnPdf')}
            </button>
          </div>
        </div>
      </div>

      {/* General Hypothesis Verification Card */}
      <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/50 to-amber-50/70 border border-amber-200/80 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <Award className="w-5 h-5 text-amber-600" />
            {t('validation.hypoTitle')}
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg shadow-xs">
            {t('validation.hypoConfirmed')}
          </span>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900/80 dark:bg-slate-900/80 p-4 rounded-xl border border-amber-200/60 leading-relaxed shadow-2xs">
          {t('validation.hypoQuote')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 text-xs space-y-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 block">{t('validation.precision')}</span>
            <strong className="text-base font-bold font-mono text-emerald-700">R² = 0.9925</strong>
            <p className="text-[10px] text-slate-400">{t('validation.precisionSub')}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 text-xs space-y-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 block">{t('validation.tempMagnitude')}</span>
            <strong className="text-base font-bold font-mono text-emerald-700">ΔT = -3.8 °C</strong>
            <p className="text-[10px] text-slate-400">{t('validation.tempMagnitudeSub')}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-amber-200/60 text-xs space-y-1 shadow-2xs">
            <span className="text-slate-500 dark:text-slate-400 block">{t('validation.pmReduction')}</span>
            <strong className="text-base font-bold font-mono text-emerald-700">ΔPM2.5 = -28.5%</strong>
            <p className="text-[10px] text-slate-400">{t('validation.pmReductionSub')}</p>
          </div>
        </div>
      </div>

      {/* Specific Objectives Verification Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-teal-600" />
          {t('validation.matrixTitle')}
        </h3>

        <div className="space-y-3">
          {objectives.map((obj) => (
            <div key={obj.code} className="bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-teal-100 text-teal-800 font-mono font-bold text-xs rounded border border-teal-200">
                    {obj.code}
                  </span>
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">{obj.title}</h4>
                </div>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  {obj.status} (100%)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-1">
                {obj.metrics.map((m, idx) => (
                  <div key={idx} className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs space-y-1 shadow-2xs">
                    <span className="text-slate-500 dark:text-slate-400 block text-[11px]">{m.name}</span>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">{t('validation.goal')} {m.target}</span>
                      <span className="font-bold text-teal-700">{t('validation.achieved')} {m.achieved}</span>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-slate-700/60">
                {obj.summary}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Human Exposure & Policy Guidelines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Population exposure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-600" />
            {t('validation.exposureTitle')}
          </h3>

          <div className="space-y-2">
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t('validation.totalPop')}</span>
              <strong className="text-slate-900 dark:text-white font-mono">{totalBenefitedPop.toLocaleString()} hab.</strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t('validation.vulnerablePop')}</span>
              <strong className="text-amber-700 font-mono">{totalVulnerablePop.toLocaleString()} hab.</strong>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 flex justify-between items-center text-xs">
              <span className="text-slate-600 dark:text-slate-400">{t('validation.bcRatio')}</span>
              <strong className="text-emerald-700 font-mono">{t('validation.bcRatioVal')}</strong>
            </div>
          </div>
        </div>

        {/* Right: Policy Recommendations */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-sky-600" />
            {t('validation.policyTitle')}
          </h3>

          <div className="space-y-2.5">
            {policyRecommendations.map(rec => (
              <div key={rec.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900 dark:text-white">{rec.title}</span>
                  <span className="text-[10px] px-1.5 py-0.5 bg-sky-100 text-sky-800 rounded font-semibold border border-sky-200">
                    {rec.responsible}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px]">{rec.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
