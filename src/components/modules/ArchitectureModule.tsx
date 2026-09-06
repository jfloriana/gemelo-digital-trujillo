import React, { useState } from 'react';
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
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);
  const [activeReflectStep, setActiveReflectStep] = useState<number>(1);

  const reflectFramework = [
    { step: 1, name: 'Retrieve', description: 'Adquisición continua de datos meteorológicos y sensores IoT de bajo costo en Trujillo.' },
    { step: 2, name: 'Establish', description: 'Construcción del modelo geométrico 3D de cañones urbanos y albedo superficial.' },
    { step: 3, name: 'Facilitate', description: 'Discretización de mallas espaciales 5x5m y calibración higroscópica en 2 etapas.' },
    { step: 4, name: 'Lump', description: 'Agrupación y acoplamiento de variables de tráfico, viento y radiación solar.' },
    { step: 5, name: 'Examine', description: 'Evaluación de dispersión de contaminantes mediante 1D-CNN y GNN topológica.' },
    { step: 6, name: 'Cognition', description: 'Simulación de escenarios de Soluciones basadas en la Naturaleza (NbS).' },
    { step: 7, name: 'Take', description: 'Retroalimentación bidireccional y toma de decisiones para la Municipalidad de Trujillo.' },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-sky-50 text-sky-700 border border-sky-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
              Objetivo Específico 2 (OE2)
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Arquitectura del Gemelo Digital a Microescala
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">
              Estructura tridimensional en tres capas interconectadas (Li et al., 2026) articulada con el marco 
              conceptual <strong>REFLECT</strong> (Omrany & Al-Obaidi, 2024) adaptada para la gestión ambiental en Trujillo.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReports('docx')}
              className="px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-sky-600" />
              Arquitectura en Word
            </button>
            <button
              onClick={() => onExportReports('pdf')}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-sky-900/10"
            >
              <Download className="w-3.5 h-3.5" />
              Especificaciones PDF
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
          <span className="text-xs font-mono text-sky-700 font-bold block mb-1">CAPA 1</span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Capa de Activos Físicos 3D</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Modelos BIM, LiDAR y OpenStreetMap con morfología de cañones urbanos (H/W ratio), rugosidad y albedo en Trujillo.
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
          <span className="text-xs font-mono text-emerald-700 font-bold block mb-1">CAPA 2</span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Capa de Datos & IoT</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Red de sensores de bajo costo con alta densidad espacial, protocolos MQTT, telemetría continua y calibración.
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
          <span className="text-xs font-mono text-purple-700 font-bold block mb-1">CAPA 3</span>
          <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1">Capa de Modelado & Simulación</h3>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Modelos dato-dirigidos (1D-CNN, GNN, LSTM) y simulador de intervenciones NbS con métricas GREENPASS®.
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
                Detalle Técnico: Capa de Activos Físicos 3D (Li et al., 2026; Teutscher et al., 2025)
              </h3>
              <span className="text-xs text-sky-700 font-mono font-medium">Discretización: Malla 5x5m</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">1. Geometría Urbana & BIM</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Extracción de huellas de edificaciones y alturas desde OpenStreetMap y fotogrametría digital. Definición de relación Altura/Ancho (H/W = 1.6 a 2.1) en cañones coloniales de Trujillo.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">2. Propiedades de Superficie</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Asignación de albedos térmicos (asfalto 0.10, techos de calamina 0.25, coberturas vegetales 0.35) y rugosidad aerodinámica (z0) para la simulación microclimática.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">3. Elementos Porosos (Vegetación)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tratamiento de árboles y arbustos como cuerpos porosos según Teutscher et al. (2025), permitiendo modelar la desaceleración del viento y la intercepción foliar de PM.
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
                Detalle Técnico: Capa de Datos & Red de Sensores IoT (Cowell et al., 2025; Zhivkov et al., 2025)
              </h3>
              <span className="text-xs text-emerald-700 font-mono font-medium">Frecuencia: Muestreo 1 Hz | Envío 1 min</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">1. Hardware de Bajo Costo</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Nodos basados en ESP32, sensores de partículas Sensirion SPS30 / PMS5003, sensor ambiental BME680 (Temp, HR, Presión) y módulos electroquímicos de gases.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">2. Protocolos & Telemetría</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Transmisión segura vía MQTT sobre TLS / WebSockets con buffer local en tarjeta SD para tolerancia a fallos de conectividad celular en la ciudad de Trujillo.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">3. Control de Calidad (QA/QC)</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Detección automática de anomalías, filtrado de outliers, imputación por interpolación espacio-temporal y recalibración periódica en función de la humedad relativa.
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
                Detalle Técnico: Capa de Modelado Predictivo & Simulación NbS (Abbas et al., 2025; Naveed et al., 2025)
              </h3>
              <span className="text-xs text-purple-700 font-mono font-medium">Inferencia: 4.8 ms</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">1. Motor de Deep Learning</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Red 1D-CNN para predicción temporal de alta fidelidad y Red Neuronal de Grafos (GNN) para capturar la propagación de contaminantes en la red vial trujillana.
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">2. Simulación de Microclima & NbS</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cálculo de balances de energía superficial y balance radiativo. Estimación de reducción de temperatura (°C) y retención de partículas PM2.5 según área foliar (LAI).
                </p>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                <h4 className="font-semibold text-sm text-slate-900 dark:text-white">3. Retroalimentación Bidireccional</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Generación automática de alertas de salud ambiental y envío de recomendaciones de zonificación verde a la plataforma de la Municipalidad Provincial de Trujillo.
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
            Marco Conceptual REFLECT para Mitigación de Isla de Calor Urbano
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Propuesto por <strong>Omrany & Al-Obaidi (2024)</strong>, estructura las 7 etapas cíclicas para la integración del gemelo digital con intervenciones de vegetación urbana.
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
                <span className="text-[10px] font-mono text-emerald-700 font-bold block mb-1">PASO 0{rf.step}</span>
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
              Paso Activo: <strong className="text-emerald-700">{reflectFramework[activeReflectStep - 1].name}</strong> — {reflectFramework[activeReflectStep - 1].description}
            </span>
          </div>
          <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">REFLECT Layer 0{activeReflectStep}/07</span>
        </div>
      </div>
    </div>
  );
};
