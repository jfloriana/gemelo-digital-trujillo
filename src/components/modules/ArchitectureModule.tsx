import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { 
  Layers, 
  Cpu, 
  Radio, 
  Database, 
  Boxes, 
  Workflow, 
  ArrowRight, 
  CheckCircle, 
  Sparkles, 
  Download, 
  GitBranch, 
  Server, 
  Wifi, 
  Compass
} from 'lucide-react';

interface ArchitectureModuleProps {
  onExportReports: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const ArchitectureModule: React.FC<ArchitectureModuleProps> = ({ onExportReports }) => {
  const { t } = useI18n();
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const [activeReflectStep, setActiveReflectStep] = useState<number>(1);

  const reflectFramework = [
    { step: 1, name: t('architecture.reflect.step1.name'), description: t('architecture.reflect.step1.desc') },
    { step: 2, name: t('architecture.reflect.step2.name'), description: t('architecture.reflect.step2.desc') },
    { step: 3, name: t('architecture.reflect.step3.name'), description: t('architecture.reflect.step3.desc') },
    { step: 4, name: t('architecture.reflect.step4.name'), description: t('architecture.reflect.step4.desc') },
    { step: 5, name: t('architecture.reflect.step5.name'), description: t('architecture.reflect.step5.desc') },
    { step: 6, name: t('architecture.reflect.step6.name'), description: t('architecture.reflect.step6.desc') },
    { step: 7, name: t('architecture.reflect.step7.name'), description: t('architecture.reflect.step7.desc') },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
              {t('architecture.badge')}
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {t('architecture.title')}
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">
              {t('architecture.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReports('docx')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              {t('architecture.btnWord')}
            </button>
            <button
              onClick={() => onExportReports('pdf')}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-900/10"
            >
              <Download className="w-3.5 h-3.5" />
              {t('architecture.btnPdf')}
            </button>
          </div>
        </div>
      </div>

      {/* 3-Tier Architecture Interactive Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Tier 1 */}
        <button
          onClick={() => setActiveTier(1)}
          className={`p-5 rounded-2xl text-left border transition-all ${
            activeTier === 1
              ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-500/20 text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 shadow-xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center mb-3">
            <Boxes className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-sky-700 font-bold block mb-1">{t('architecture.tier1.badge')}</span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">{t('architecture.tier1.title')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('architecture.tier1.desc')}
          </p>
        </button>

        {/* Tier 2 */}
        <button
          onClick={() => setActiveTier(2)}
          className={`p-5 rounded-2xl text-left border transition-all ${
            activeTier === 2
              ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 shadow-xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
            <Radio className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-emerald-700 font-bold block mb-1">{t('architecture.tier2.badge')}</span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">{t('architecture.tier2.title')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('architecture.tier2.desc')}
          </p>
        </button>

        {/* Tier 3 */}
        <button
          onClick={() => setActiveTier(3)}
          className={`p-5 rounded-2xl text-left border transition-all ${
            activeTier === 3
              ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 text-slate-900 shadow-sm'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 shadow-xs'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
            <Cpu className="w-5 h-5" />
          </div>
          <span className="text-xs font-mono text-purple-700 font-bold block mb-1">{t('architecture.tier3.badge')}</span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">{t('architecture.tier3.title')}</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('architecture.tier3.desc')}
          </p>
        </button>
      </div>

      {/* Deep-Dive Tier Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        {activeTier === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-sky-600" />
                {t('architecture.detail1.title')}
              </h3>
              <span className="text-xs text-sky-700 font-mono font-medium">{t('architecture.detail1.discretization')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail1.card1.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail1.card1.desc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail1.card2.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail1.card2.desc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail1.card3.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail1.card3.desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTier === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-600" />
                {t('architecture.detail2.title')}
              </h3>
              <span className="text-xs text-emerald-700 font-mono font-medium">{t('architecture.detail2.freq')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail2.card1.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail2.card1.desc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail2.card2.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail2.card2.desc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail2.card3.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail2.card3.desc')}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTier === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                {t('architecture.detail3.title')}
              </h3>
              <span className="text-xs text-purple-700 font-mono font-medium">{t('architecture.detail3.inference')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail3.card1.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail3.card1.desc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail3.card2.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail3.card2.desc')}
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">{t('architecture.detail3.card3.title')}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {t('architecture.detail3.card3.desc')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Marco REFLECT (Omrany & Al-Obaidi, 2024) Interactive Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Workflow className="w-5 h-5 text-emerald-600" />
            {t('architecture.reflect.title')}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('architecture.reflect.desc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-2 pt-2">
          {reflectFramework.map((rf) => {
            const isCurrent = rf.step === activeReflectStep;
            return (
              <button
                key={rf.step}
                onClick={() => setActiveReflectStep(rf.step)}
                className={`p-3 rounded-xl text-left border transition-all ${
                  isCurrent
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200/80 hover:border-slate-300 text-slate-700'
                }`}
              >
                <span className="text-[10px] font-mono text-emerald-700 font-bold block mb-1">{t('architecture.reflect.stepLabel')} 0{rf.step}</span>
                <h4 className="font-bold text-xs text-slate-900 dark:text-white">{rf.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-3">{rf.description}</p>
              </button>
            );
          })}
        </div>

        <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300">
              {t('architecture.reflect.activeStep')} <strong className="text-emerald-700">{reflectFramework[activeReflectStep - 1].name}</strong> — {reflectFramework[activeReflectStep - 1].description}
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">{t('architecture.reflect.layer')} 0{activeReflectStep}/07</span>
        </div>
      </div>
    </div>
  );
};
