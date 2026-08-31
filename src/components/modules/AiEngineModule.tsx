import React, { useState } from 'react';
import { AiModelMetric, UrbanZone } from '../../types';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar 
} from 'recharts';
import { 
  Cpu, 
  TrendingUp, 
  Zap, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  RotateCcw, 
  Download, 
  BarChart3, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';

interface AiEngineModuleProps {
  models: AiModelMetric[];
  selectedZone: UrbanZone;
  onExportReports: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const AiEngineModule: React.FC<AiEngineModuleProps> = ({
  models,
  selectedZone,
  onExportReports
}) => {
  const [selectedModel, setSelectedModel] = useState<AiModelMetric>(models[0]); // 1D-CNN default
  const [forecastHorizon, setForecastHorizon] = useState<number>(24); // 24 hours
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainingEpoch, setTrainingEpoch] = useState<number>(50);

  // Simulated Training Loss Curves for the selected model
  const lossData = Array.from({ length: 25 }, (_, i) => {
    const epoch = (i + 1) * 2;
    const baseLoss = selectedModel.id === 'model-1d-cnn' ? 0.45 : selectedModel.id === 'model-gnn' ? 0.58 : 0.75;
    const trainLoss = Number((baseLoss * Math.exp(-epoch / 8) + 0.015 + Math.random() * 0.005).toFixed(4));
    const valLoss = Number((trainLoss * 1.12 + Math.random() * 0.008).toFixed(4));
    return {
      epoch: `Época ${epoch}`,
      trainLoss,
      valLoss
    };
  });

  // Feature Importance data based on literature
  const featureImportanceData = [
    { feature: 'PM2.5 Histórico (t-1 a t-6)', importance: 34.2 },
    { feature: 'H/W Ratio Cañón Urbano', importance: 21.5 },
    { feature: 'Densidad Flujo Vehicular', importance: 18.0 },
    { feature: 'Humedad Relativa (%)', importance: 11.4 },
    { feature: 'Velocidad y Dirección Viento', importance: 8.9 },
    { feature: 'Cobertura Arbórea (NDVI)', importance: 6.0 }
  ];

  // Forecast curve for chosen horizon in Trujillo
  const forecastData = Array.from({ length: Math.min(forecastHorizon, 24) }, (_, i) => {
    const hour = (i + 1);
    const trafficBump = (hour === 8 || hour === 18) ? 18 : (hour >= 9 && hour <= 17) ? 8 : -10;
    const solarBump = Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2) * 4.5;
    
    const predPM25 = Number((selectedZone.baselinePM25 + trafficBump + (Math.random() * 3 - 1.5)).toFixed(1));
    const predTemp = Number((selectedZone.baselineTemp - 2 + solarBump).toFixed(1));
    const upperPM = Number((predPM25 * 1.08).toFixed(1));
    const lowerPM = Number((predPM25 * 0.92).toFixed(1));

    return {
      hour: `+${hour}h`,
      predPM25,
      predTemp,
      upperPM,
      lowerPM
    };
  });

  const handleSimulateTraining = () => {
    setIsTraining(true);
    setTimeout(() => {
      setIsTraining(false);
      setTrainingEpoch(50);
    }, 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-slate-900 relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
              Objetivo Específico 3 (OE3)
            </span>
            <h2 className="text-2xl font-bold text-slate-900 mt-2">
              Modelos de Machine Learning & Deep Learning a Microescala
            </h2>
            <p className="text-slate-600 text-sm max-w-3xl mt-1">
              Adaptación y comparación de algoritmos avanzados de aprendizaje supervisado y profundo: 
              <strong> 1D-CNN</strong> (Naveed et al., 2025), <strong>GNN</strong> (Zhivkov et al., 2025), 
              <strong> Bi-LSTM</strong> y <strong>Modelado Espaciotemporal Bayesiano</strong> (Li et al., 2026).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportReports('xlsx')}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              Métricas en Excel
            </button>
            <button
              onClick={() => onExportReports('pdf')}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-purple-900/10"
            >
              <Download className="w-3.5 h-3.5" />
              Informe IA (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Model Benchmark Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {models.map(model => {
          const isSelected = model.id === selectedModel.id;
          return (
            <button
              key={model.id}
              onClick={() => setSelectedModel(model)}
              className={`p-4 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-500/20 text-slate-900 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-purple-700 font-bold">{model.referenceAuthor}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  model.status === 'Recomendado' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                  model.status === 'Evaluado' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {model.status}
                </span>
              </div>
              <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{model.name}</h4>
              <div className="mt-3 space-y-1 text-[11px] font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">R² Score:</span>
                  <span className="font-bold text-emerald-700">{model.r2.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">MAPE:</span>
                  <span className="font-bold text-amber-700">{model.mape}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inferencia:</span>
                  <span className="text-slate-700">{model.inferenceTimeMs} ms</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Model Technical Deep-Dive */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Training Loss & Forecast Engine */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" />
                Arquitectura: {selectedModel.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Capas: <code className="text-purple-800 bg-purple-50 px-2 py-0.5 rounded font-mono text-[11px] border border-purple-200">{selectedModel.architecture}</code>
              </p>
            </div>

            <button
              onClick={handleSimulateTraining}
              disabled={isTraining}
              className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              {isTraining ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  Optimizando Gradientes...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Re-entrenar con Datos Trujillo
                </>
              )}
            </button>
          </div>

          {/* Loss Curve Chart */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-700">
              <span className="font-semibold">Curva de Convergencia (Loss vs Épocas de Entrenamiento)</span>
              <span className="text-slate-500 font-mono">Épocas: 50 | Optimizer: Adam (lr=0.001)</span>
            </div>
            <div className="h-[220px] w-full bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="epoch" stroke="#64748b" fontSize={10} />
                  <YAxis stroke="#64748b" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="trainLoss" name="Pérdida de Entrenamiento (MSE)" stroke="#9333ea" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="valLoss" name="Pérdida de Validación" stroke="#0284c7" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Horizon Forecast in Trujillo */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Pronóstico Predictivo a Futuro en {selectedZone.name.split(':')[1]?.trim() || selectedZone.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Horizonte:</span>
                {[6, 12, 24].map(h => (
                  <button
                    key={h}
                    onClick={() => setForecastHorizon(h)}
                    className={`px-2 py-0.5 text-xs rounded-lg font-mono font-medium transition-all ${
                      forecastHorizon === h ? 'bg-purple-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    +{h}h
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[220px] w-full bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecastData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="hour" stroke="#64748b" fontSize={10} />
                  <YAxis yAxisId="left" stroke="#d97706" fontSize={10} unit=" µg" />
                  <YAxis yAxisId="right" orientation="right" stroke="#ea580c" fontSize={10} unit=" °C" domain={[22, 38]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="predPM25" name="PM2.5 Predicho (µg/m³)" stroke="#d97706" strokeWidth={2.5} />
                  <Line yAxisId="right" type="monotone" dataKey="predTemp" name="Temp. Predicha (°C)" stroke="#ea580c" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Feature Importance & Academic Benchmark */}
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              Importancia de Variables (Feature Importance)
            </h4>
            <div className="space-y-2 pt-1">
              {featureImportanceData.map((f, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-700">{f.feature}</span>
                    <span className="font-mono font-bold text-purple-700">{f.importance}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                      style={{ width: `${f.importance * 2.5}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theoretical Validation Card */}
          <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-200/80 space-y-2.5 shadow-xs">
            <div className="flex items-center gap-2 text-purple-800 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Validación Científica del Modelo
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              El modelo <strong>1D-CNN (Naveed et al., 2025)</strong> demostró el mejor ajuste para Trujillo con un <strong>R² = {selectedModel.r2.toFixed(4)}</strong> y un error porcentual absoluto medio (MAPE) de solo <strong>{selectedModel.mape}%</strong>, permitiendo inferencias ultrarrápidas de <strong>{selectedModel.inferenceTimeMs} ms</strong> compatibles con el gemelo digital en tiempo real.
            </p>
            <div className="text-[11px] text-slate-500 border-t border-purple-200/60 pt-2 flex items-center justify-between">
              <span>Resolución Espacial:</span>
              <strong className="text-slate-800">{selectedModel.spatialResolution}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
