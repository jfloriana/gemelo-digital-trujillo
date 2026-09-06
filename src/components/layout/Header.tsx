import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useI18n, LANG_LABELS, Lang } from '../../context/I18nContext';
import { 
  Trees, 
  Wind, 
  Thermometer, 
  User as UserIcon, 
  Download, 
  Lock, 
  ShieldCheck, 
  Layers,
  MapPin,
  ChevronDown,
  LogOut,
  Moon,
  Sun,
  Globe
} from 'lucide-react';
import { UrbanZone } from '../../types';

interface HeaderProps {
  activeZone: UrbanZone;
  onOpenLogin: () => void;
  onQuickExport: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeZone,
  onOpenLogin,
  onQuickExport
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useI18n();
  const [langOpen, setLangOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-xs dark:shadow-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-900/10">
            <Trees className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {t('header.title')}
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-semibold font-mono">
                v2.6 Tesis
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              {t('header.subtitle')}
            </p>
          </div>
        </div>

        {/* Live Weather / Microclimate pill — ahora multi-departamento */}
        <div className="hidden md:flex items-center gap-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-2xl text-xs text-slate-600 dark:text-slate-300 shadow-xs">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-100">{activeZone.district ? `${activeZone.district}, ${activeZone.department}` : t('header.city')}</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Thermometer className="w-3.5 h-3.5 text-amber-600" />
            <span className="font-mono text-slate-800 font-semibold">28.9 °C</span>
          </div>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-mono text-slate-800 font-semibold">2.1 m/s SO</span>
          </div>
        </div>

        {/* Action Controls & Auth User Badge */}
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all cursor-pointer"
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Language selector */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="h-9 px-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title={t('lang.label')}
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{LANG_LABELS[lang]}</span>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
                  <button
                    key={l}
                    onClick={() => { setLang(l); setLangOpen(false); }}
                    className={`w-full text-left px-3.5 py-2 text-xs font-medium flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer ${lang === l ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}
                  >
                    <span>{l === 'es' ? 'Español' : l === 'en' ? 'English' : l === 'zh' ? '中文' : l === 'de' ? 'Deutsch' : l === 'fr' ? 'Français' : 'Português'}</span>
                    <span className="text-[11px] font-mono text-slate-400">{LANG_LABELS[l]}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Export */}
          <button
            onClick={() => onQuickExport('pdf')}
            className="hidden sm:flex px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar reporte rápido en PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('header.reportPdf')}</span>
          </button>

          <button
            onClick={() => onQuickExport('xlsx')}
            className="hidden sm:flex px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs items-center gap-1.5 transition-all cursor-pointer"
            title="Exportar libro de datos en Excel"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('header.bookExcel')}</span>
          </button>

          {/* User Account / Role Badge & Logout */}
          {user ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 px-2.5 py-1.5 rounded-xl transition-all text-left shadow-xs cursor-pointer"
                title={t('header.profile')}
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px]">
                  {user.name.replace(/^Ing\.\s*/,'').split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div className="hidden lg:block text-left">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 block line-clamp-1">{user.name}</span>
                  <span className="text-[10px] text-emerald-600 capitalize block font-medium">{user.role}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={logout}
                className="p-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-500 dark:text-slate-400 hover:text-rose-700 border border-slate-200 dark:border-slate-700 hover:border-rose-300 rounded-xl transition-all shadow-xs cursor-pointer"
                title={t('header.logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-900/10 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              {t('header.login')}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
