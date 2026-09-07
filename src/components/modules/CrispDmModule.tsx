import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import {
  Target,
  Database,
  Wrench,
  Brain,
  CheckCircle2,
  Rocket,
  Download,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';

interface CrispDmModuleProps {
  onExportReports: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

const PHASES = [
  { id: 1, icon: Target, color: 'sky' },
  { id: 2, icon: Database, color: 'emerald' },
  { id: 3, icon: Wrench, color: 'amber' },
  { id: 4, icon: Brain, color: 'purple' },
  { id: 5, icon: CheckCircle2, color: 'rose' },
  { id: 6, icon: Rocket, color: 'teal' },
] as const;

const COLOR: Record<string, { chip: string; ring: string; icon: string; bar: string }> = {
  sky: { chip: 'text-sky-700 dark:text-sky-300', ring: 'border-sky-500 ring-sky-500/20 bg-sky-50/80 dark:bg-sky-950/40', icon: 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300', bar: 'bg-sky-500' },
  emerald: { chip: 'text-emerald-700 dark:text-emerald-300', ring: 'border-emerald-500 ring-emerald-500/20 bg-emerald-50/80 dark:bg-emerald-950/40', icon: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300', bar: 'bg-emerald-500' },
  amber: { chip: 'text-amber-700 dark:text-amber-300', ring: 'border-amber-500 ring-amber-500/20 bg-amber-50/80 dark:bg-amber-950/40', icon: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' },
  purple: { chip: 'text-purple-700 dark:text-purple-300', ring: 'border-purple-500 ring-purple-500/20 bg-purple-50/80 dark:bg-purple-950/40', icon: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300', bar: 'bg-purple-500' },
  rose: { chip: 'text-rose-700 dark:text-rose-300', ring: 'border-rose-500 ring-rose-500/20 bg-rose-50/80 dark:bg-rose-950/40', icon: 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300', bar: 'bg-rose-500' },
  teal: { chip: 'text-teal-700 dark:text-teal-300', ring: 'border-teal-500 ring-teal-500/20 bg-teal-50/80 dark:bg-teal-950/40', icon: 'bg-teal-100 dark:bg-teal-950 text-teal-700 dark:text-teal-300', bar: 'bg-teal-500' },
};

export const CrispDmModule: React.FC<CrispDmModuleProps> = ({ onExportReports }) => {
  const { t } = useI18n();
  const [active, setActive] = useState<number>(1);

  const phase = PHASES.find(p => p.id === active)!;
  const c = COLOR[phase.color];
  const progress = Math.max(0, Math.min(100, parseInt(t(`crispdm.p${active}.progress`), 10) || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800 text-xs font-semibold rounded-lg uppercase tracking-wider">
              {t('crispdm.badge')}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{t('crispdm.title')}</h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">{t('crispdm.desc')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReports('docx')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-indigo-600" />
              {t('crispdm.btnWord')}
            </button>
            <button
              onClick={() => onExportReports('pdf')}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-indigo-900/10"
            >
              <Download className="w-3.5 h-3.5" />
              {t('crispdm.btnPdf')}
            </button>
          </div>
        </div>
      </div>

      {/* Phase selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PHASES.map(p => {
            const pc = COLOR[p.color];
            const Icon = p.icon;
            const isCurrent = p.id === active;
            return (
              <button
                key={p.id}
                onClick={() => setActive(p.id)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isCurrent
                    ? `ring-2 ${pc.ring} text-slate-900 dark:text-white shadow-xs`
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${pc.icon}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] font-mono font-bold block ${pc.chip}`}>{t('crispdm.phaseLabel')} 0{p.id}</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white leading-tight mt-0.5">{t(`crispdm.p${p.id}.name`)}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{t(`crispdm.p${p.id}.short`)}</p>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
          <RefreshCw className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>{t('crispdm.cycleNote')}</span>
        </div>
      </div>

      {/* Active phase detail */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon}`}>
              <phase.icon className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-mono font-bold ${c.chip}`}>{t('crispdm.phaseLabel')} 0{active} / 06</span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">{t(`crispdm.p${active}.name`)}</h3>
            </div>
          </div>
          <div className="text-right min-w-[110px]">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">{t('crispdm.progress')}</span>
            <span className="text-lg font-bold text-slate-900 dark:text-white font-mono">{progress}%</span>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
              <div className={`h-full rounded-full ${c.bar}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{t(`crispdm.p${active}.objective`)}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 md:col-span-1">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">{t('crispdm.tasksTitle')}</h4>
            <ul className="space-y-1.5">
              {[1, 2, 3].map(n => (
                <li key={n} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex gap-1.5">
                  <ArrowRight className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                  {t(`crispdm.p${active}.task${n}`)}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">{t('crispdm.deliverablesTitle')}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t(`crispdm.p${active}.deliverable`)}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white mb-2">{t('crispdm.toolsTitle')}</h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{t(`crispdm.p${active}.tools`)}</p>
          </div>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2.5">
            <span className={`w-2.5 h-2.5 rounded-full ${c.bar}`} />
            <span className="text-slate-700 dark:text-slate-300">
              {t('crispdm.activePhase')} <strong className={c.chip}>{t(`crispdm.p${active}.name`)}</strong> — {t(`crispdm.p${active}.short`)}
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">CRISP-DM 0{active}/06</span>
        </div>
      </div>
    </div>
  );
};
