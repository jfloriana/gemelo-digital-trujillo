/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider, useI18n } from './context/I18nContext';
import { Header } from './components/layout/Header';
import { VerifyEmail } from './components/auth/VerifyEmail';
import { DigitalTwinCanvas } from './components/digitaltwin/DigitalTwinCanvas';
import { DiagnosisModule } from './components/modules/DiagnosisModule';
import { ArchitectureModule } from './components/modules/ArchitectureModule';
import { AiEngineModule } from './components/modules/AiEngineModule';
import { NbsSimulatorModule } from './components/modules/NbsSimulatorModule';
import { ValidationPolicyModule } from './components/modules/ValidationPolicyModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { LoginModal } from './components/auth/LoginModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { AssistantChatbot } from './components/chatbot/AssistantChatbot';
import { useSupabaseData } from './hooks/useSupabaseData';
import { UrbanZone, SimulationScenario } from './types';
import { exportToExcel, exportToPDF, exportToWord, exportToCSV } from './utils/exportUtils';
import { 
  Compass, 
  Activity, 
  Boxes, 
  Cpu, 
  Trees, 
  Award, 
  FileSpreadsheet, 
  MapPin,
  Flame,
  ShieldCheck,
  Bot
} from 'lucide-react';

type ActiveModule = 
  | 'digital_twin' 
  | 'diagnosis' 
  | 'architecture' 
  | 'ai_engine' 
  | 'nbs_simulator' 
  | 'validation' 
  | 'reports';

function MainAppContent() {
  const { user, isDemo } = useAuth();
  const { t } = useI18n();
  const { zones: TRUJILLO_ZONES, sensors: SENSOR_NODES, models: AI_MODELS_BENCHMARK, nbs: NBS_CATALOG, objectives: THESIS_OBJECTIVES_DATA } = useSupabaseData();
  const [activeModule, setActiveModule] = useState<ActiveModule>('digital_twin');
  const [selectedZone, setSelectedZone] = useState<UrbanZone>(() => TRUJILLO_ZONES[0]);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

  // Sincroniza selectedZone cuando llegan datos de Supabase
  React.useEffect(() => {
    if (TRUJILLO_ZONES.length && !TRUJILLO_ZONES.find(z => z.id === selectedZone.id)) {
      setSelectedZone(TRUJILLO_ZONES[0]);
    }
  }, [TRUJILLO_ZONES]);

  // Active NbS configuration state applied to digital twin canvas
  const [appliedNbs, setAppliedNbs] = useState<{ nbsId: string; quantityOrArea: number }[]>([
    { nbsId: 'nbs-arbolado', quantityOrArea: 120 },
    { nbsId: 'nbs-techo-verde', quantityOrArea: 1800 },
    { nbsId: 'nbs-muro-verde', quantityOrArea: 650 },
  ]);
  const [isSimActive, setIsSimActive] = useState<boolean>(true);

  const handleQuickExport = (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => {
    if (format === 'xlsx') {
      exportToExcel(TRUJILLO_ZONES, SENSOR_NODES, AI_MODELS_BENCHMARK, NBS_CATALOG, THESIS_OBJECTIVES_DATA, activeScenario);
    } else if (format === 'pdf') {
      exportToPDF(TRUJILLO_ZONES, SENSOR_NODES, AI_MODELS_BENCHMARK, NBS_CATALOG, THESIS_OBJECTIVES_DATA, activeScenario);
    } else if (format === 'docx') {
      exportToWord(TRUJILLO_ZONES, SENSOR_NODES, AI_MODELS_BENCHMARK, NBS_CATALOG, THESIS_OBJECTIVES_DATA, activeScenario);
    } else if (format === 'csv') {
      exportToCSV(SENSOR_NODES);
    }
  };

  const handleQuickApplyNbs = (nbsId: string) => {
    setAppliedNbs(prev => {
      const existing = prev.find(p => p.nbsId === nbsId);
      if (existing) {
        return prev.map(p => p.nbsId === nbsId ? { ...p, quantityOrArea: p.quantityOrArea + 20 } : p);
      }
      return [...prev, { nbsId, quantityOrArea: 20 }];
    });
    setIsSimActive(true);
  };

  // FIX: Chatbot debe ser visible incluso sin autenticación (ayuda al login).
  // Antes: if (!user) return <AuthScreen /> ocultaba el chatbot en la pantalla de login.
  if (!user) {
    return (
      <>
        <AuthScreen />
        <AssistantChatbot
          currentModule={activeModule}
          onNavigateModule={(mod) => setActiveModule(mod as ActiveModule)}
          zones={TRUJILLO_ZONES}
          selectedZone={selectedZone}
          onSelectZone={(z) => setSelectedZone(z)}
          onExport={handleQuickExport}
          activeScenario={activeScenario}
          isOpenControlled={isChatbotOpen}
          onToggleControlled={setIsChatbotOpen}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header
        activeZone={selectedZone}
        onOpenLogin={() => setIsLoginOpen(true)}
        onQuickExport={handleQuickExport}
      />

      {isDemo && (
        <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-800 px-4 lg:px-8 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center justify-between">
          <span>Modo demo — acceso limitado (solo visualización). Verifica tu correo tras registrarte para acceso completo (simulación, inyección IoT, zonas).</span>
          <button onClick={() => { localStorage.removeItem('trujillo_is_demo'); location.reload(); }} className="font-bold underline">Salir demo</button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 sticky top-[61px] z-30 px-4 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => setActiveModule('digital_twin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'digital_twin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Compass className="w-4 h-4" />
            {t('nav.digital_twin')}
          </button>

          <button
            onClick={() => setActiveModule('diagnosis')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'diagnosis'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Activity className="w-4 h-4" />
            {t('nav.diagnosis')}
          </button>

          <button
            onClick={() => setActiveModule('architecture')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'architecture'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            {t('nav.architecture')}
          </button>

          <button
            onClick={() => setActiveModule('ai_engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'ai_engine'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            {t('nav.ai_engine')}
          </button>

          <button
            onClick={() => setActiveModule('nbs_simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'nbs_simulator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Trees className="w-4 h-4" />
            {t('nav.nbs_simulator')}
          </button>

          <button
            onClick={() => setActiveModule('validation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'validation'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            {t('nav.validation')}
          </button>

          <button
            onClick={() => setActiveModule('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'reports'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            {t('nav.reports')}
          </button>

          <button
            onClick={() => setIsChatbotOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-sm shadow-emerald-900/15 cursor-pointer ml-auto"
            title="Abrir Asistente Virtual EcoTwin Bot"
          >
            <Bot className="w-4 h-4 text-emerald-200 animate-pulse" />
            <span>{t('nav.assistant')}</span>
            <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
          </button>
        </div>
      </nav>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* VIEW 1: Interactive 3D Digital Twin Canvas Hub */}
        {activeModule === 'digital_twin' && (
          <div className="space-y-6">
            {/* Thesis Title Highlight Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-none">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800 text-[11px] font-bold">
                      {t('banner.badge')}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('banner.city')}</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {t('banner.title')}
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 pt-0.5 leading-relaxed">
                    {t('banner.desc')}
                  </p>
                </div>

                {/* Zone switcher quick pills */}
                <div className="flex flex-col gap-1.5 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{t('banner.activeZone')}</span>
                  <select
                    value={selectedZone.id}
                    onChange={(e) => {
                      const found = TRUJILLO_ZONES.find(z => z.id === e.target.value);
                      if (found) setSelectedZone(found);
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
                  >
                    {TRUJILLO_ZONES.map(z => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3D Digital Twin Visualizer Component */}
            <DigitalTwinCanvas
              zone={selectedZone}
              sensors={SENSOR_NODES}
              selectedNbs={appliedNbs}
              nbsCatalog={NBS_CATALOG}
              isSimulationActive={isSimActive}
              onApplyNbsQuick={handleQuickApplyNbs}
            />

            {/* Quick Interactive Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm dark:shadow-none space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{t('cards.grid')}</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{t('cards.gridVal')}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('cards.gridSub')}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm dark:shadow-none space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{t('cards.model')}</span>
                  <Cpu className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-700 dark:text-purple-400 font-mono">1D-CNN (R² = 0.9925)</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Inferencia ultrarrápida 4.8 ms</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm dark:shadow-none space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{t('cards.mitigation')}</span>
                  <Flame className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-emerald-700 dark:text-emerald-400 font-mono">{t('cards.mitigationVal')}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('cards.mitigationSub')}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4.5 rounded-2xl shadow-sm dark:shadow-none space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
                  <span>{t('cards.population')}</span>
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{t('cards.populationVal')}</div>
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">{t('cards.populationSub')}</p>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: OE1 Diagnosis */}
        {activeModule === 'diagnosis' && (
          <DiagnosisModule
            zones={TRUJILLO_ZONES}
            sensors={SENSOR_NODES}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            onExportReports={handleQuickExport}
          />
        )}

        {/* VIEW 3: OE2 Architecture */}
        {activeModule === 'architecture' && (
          <ArchitectureModule onExportReports={handleQuickExport} />
        )}

        {/* VIEW 4: OE3 AI Engine */}
        {activeModule === 'ai_engine' && (
          <AiEngineModule
            models={AI_MODELS_BENCHMARK}
            selectedZone={selectedZone}
            onExportReports={handleQuickExport}
          />
        )}

        {/* VIEW 5: OE4 NbS Simulator */}
        {activeModule === 'nbs_simulator' && (
          <NbsSimulatorModule
            nbsCatalog={NBS_CATALOG}
            selectedZone={selectedZone}
            onExportReports={handleQuickExport}
            onScenarioSaved={(scen) => setActiveScenario(scen)}
          />
        )}

        {/* VIEW 6: OE5 Validation & Policies */}
        {activeModule === 'validation' && (
          <ValidationPolicyModule
            objectives={THESIS_OBJECTIVES_DATA}
            zones={TRUJILLO_ZONES}
            onExportReports={handleQuickExport}
          />
        )}

        {/* VIEW 7: Reports & Multiformat Exporter */}
        {activeModule === 'reports' && (
          <ReportsModule
            zones={TRUJILLO_ZONES}
            sensors={SENSOR_NODES}
            models={AI_MODELS_BENCHMARK}
            nbsCatalog={NBS_CATALOG}
            objectives={THESIS_OBJECTIVES_DATA}
            activeScenario={activeScenario}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 py-6 px-4 lg:px-8 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800 dark:text-slate-100">
              {t('footer.lead')}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {t('footer.sub')}
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
            <span>{t('footer.leadLabel')} <strong className="text-slate-800 dark:text-slate-100">Ing. Joel Anderson Florian Arévalo</strong> & <strong className="text-slate-800 dark:text-slate-100">Ing. Jason Anderson Galvéz Luna</strong></span>
            <span>|</span>
            <button
              onClick={() => handleQuickExport('pdf')}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 underline transition-colors cursor-pointer"
            >
              {t('footer.exportPdf')}
            </button>
            <button
              onClick={() => handleQuickExport('xlsx')}
              className="hover:text-emerald-700 dark:hover:text-emerald-400 underline transition-colors cursor-pointer"
            >
              {t('footer.datasetExcel')}
            </button>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Intelligent AI Assistant Chatbot (Floating & Modal) — Siempre visible, incluso autenticado */}
      <AssistantChatbot
        currentModule={activeModule}
        onNavigateModule={(mod) => setActiveModule(mod as ActiveModule)}
        zones={TRUJILLO_ZONES}
        selectedZone={selectedZone}
        onSelectZone={(z) => setSelectedZone(z)}
        onExport={handleQuickExport}
        activeScenario={activeScenario}
        isOpenControlled={isChatbotOpen}
        onToggleControlled={setIsChatbotOpen}
      />
    </div>
  );
}

export default function App() {
  const isVerify = typeof window !== 'undefined' && (window.location.pathname === '/verify' || window.location.hash.includes('type=recovery') || window.location.search.includes('type=signup'));
  if (isVerify) {
    return (
      <ThemeProvider>
        <I18nProvider>
          <AuthProvider>
            <VerifyEmail />
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    );
  }
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
