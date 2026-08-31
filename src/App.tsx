/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { DigitalTwinCanvas } from './components/digitaltwin/DigitalTwinCanvas';
import { DiagnosisModule } from './components/modules/DiagnosisModule';
import { ArchitectureModule } from './components/modules/ArchitectureModule';
import { AiEngineModule } from './components/modules/AiEngineModule';
import { NbsSimulatorModule } from './components/modules/NbsSimulatorModule';
import { ValidationPolicyModule } from './components/modules/ValidationPolicyModule';
import { ReportsModule } from './components/modules/ReportsModule';
import { LoginModal } from './components/auth/LoginModal';
import { AuthScreen } from './components/auth/AuthScreen';
import { 
  TRUJILLO_ZONES, 
  SENSOR_NODES, 
  AI_MODELS_BENCHMARK, 
  NBS_CATALOG, 
  THESIS_OBJECTIVES_DATA 
} from './data/trujilloData';
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
  Sparkles,
  MapPin,
  Flame,
  Wind,
  ShieldCheck,
  CheckCircle2
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
  const { user } = useAuth();
  const [activeModule, setActiveModule] = useState<ActiveModule>('digital_twin');
  const [selectedZone, setSelectedZone] = useState<UrbanZone>(TRUJILLO_ZONES[0]);
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario | null>(null);

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

  // If user is not authenticated, show full-screen Authentication Gateway before entering the panel
  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <Header
        activeZone={selectedZone}
        onOpenLogin={() => setIsLoginOpen(true)}
        onQuickExport={handleQuickExport}
      />

      {/* Main Navigation Bar */}
      <nav className="bg-white border-b border-slate-200/80 sticky top-[61px] z-30 px-4 lg:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => setActiveModule('digital_twin')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'digital_twin'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Compass className="w-4 h-4" />
            Gemelo Digital 3D en Vivo
          </button>

          <button
            onClick={() => setActiveModule('diagnosis')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'diagnosis'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Activity className="w-4 h-4" />
            OE1: Diagnóstico Microescala
          </button>

          <button
            onClick={() => setActiveModule('architecture')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'architecture'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Boxes className="w-4 h-4" />
            OE2: Arquitectura 3 Capas
          </button>

          <button
            onClick={() => setActiveModule('ai_engine')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'ai_engine'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-4 h-4" />
            OE3: Modelos IA & Deep Learning
          </button>

          <button
            onClick={() => setActiveModule('nbs_simulator')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'nbs_simulator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Trees className="w-4 h-4" />
            OE4: Simulador NbS Verde
          </button>

          <button
            onClick={() => setActiveModule('validation')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'validation'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Award className="w-4 h-4" />
            OE5: Validación & Políticas
          </button>

          <button
            onClick={() => setActiveModule('reports')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-all ${
              activeModule === 'reports'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
                : 'text-emerald-700 bg-emerald-50/70 border border-emerald-200/60 hover:bg-emerald-100/70'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Reportes (Excel/PDF/Word/CSV)
          </button>
        </div>
      </nav>

      {/* Main App Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* VIEW 1: Interactive 3D Digital Twin Canvas Hub */}
        {activeModule === 'digital_twin' && (
          <div className="space-y-6">
            {/* Thesis Title Highlight Banner */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-[11px] font-bold">
                      PROYECTO DE INVESTIGACIÓN Y TESIS
                    </span>
                    <span className="text-xs text-slate-500 font-medium">Trujillo, La Libertad</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    Gemelo digital de calidad del aire a microescala y soluciones basadas en naturaleza urbana para reducir la exposición a contaminantes y calor extremo
                  </h2>
                  <p className="text-xs md:text-sm text-slate-600 pt-0.5 leading-relaxed">
                    Simulador bidireccional físico-virtual acoplado con sensores IoT de bajo costo, red 1D-CNN (Naveed et al., 2025) y catálogo de intervenciones verdes con flora nativa.
                  </p>
                </div>

                {/* Zone switcher quick pills */}
                <div className="flex flex-col gap-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-xs text-slate-600 font-semibold">Zona Activa en Trujillo:</span>
                  <select
                    value={selectedZone.id}
                    onChange={(e) => {
                      const found = TRUJILLO_ZONES.find(z => z.id === e.target.value);
                      if (found) setSelectedZone(found);
                    }}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 cursor-pointer"
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
              <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Malla de Resolución</span>
                  <MapPin className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono">5m x 5m (Microescala)</div>
                <p className="text-[11px] text-slate-500">Cañones urbanos (H/W ratio 1.6 a 2.1)</p>
              </div>

              <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Modelo de IA Predilecto</span>
                  <Cpu className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-lg font-bold text-purple-700 font-mono">1D-CNN (R² = 0.9925)</div>
                <p className="text-[11px] text-slate-500">Inferencia ultrarrápida 4.8 ms</p>
              </div>

              <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Mitigación Térmica NbS</span>
                  <Flame className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="text-lg font-bold text-emerald-700 font-mono">-3.2 °C a -3.8 °C</div>
                <p className="text-[11px] text-slate-500">Arbolado + Techos Verdes GREENPASS®</p>
              </div>

              <div className="bg-white border border-slate-200/80 p-4.5 rounded-2xl shadow-sm space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Población Beneficiada</span>
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono">132,500 hab.</div>
                <p className="text-[11px] text-amber-700 font-medium">41,000 en riesgo crítico protegidos</p>
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
      <footer className="bg-white border-t border-slate-200/80 py-6 px-4 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">
              Proyecto de Tesis de Posgrado / Ingeniería — Ciudad de Trujillo, Perú
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Gemelo Digital a Microescala | Soluciones Basadas en la Naturaleza (NbS) | Inteligencia Artificial
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Investigador Líder: <strong className="text-slate-800">Ing. Joel Arevalo</strong></span>
            <span>|</span>
            <button
              onClick={() => handleQuickExport('pdf')}
              className="hover:text-emerald-700 underline transition-colors"
            >
              Exportar Tesis PDF
            </button>
            <button
              onClick={() => handleQuickExport('xlsx')}
              className="hover:text-emerald-700 underline transition-colors"
            >
              Dataset Excel
            </button>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
