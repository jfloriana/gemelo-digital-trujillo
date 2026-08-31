import React, { useState } from 'react';
import { UrbanZone, SensorNode } from '../../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  ScatterChart, 
  Scatter 
} from 'recharts';
import { 
  Activity, 
  Thermometer, 
  Wind, 
  Sun, 
  AlertTriangle, 
  TrendingUp, 
  Cpu, 
  CheckCircle2, 
  MapPin, 
  Layers, 
  ArrowRight,
  ShieldAlert,
  Download
} from 'lucide-react';

interface DiagnosisModuleProps {
  zones: UrbanZone[];
  sensors: SensorNode[];
  selectedZone: UrbanZone;
  onSelectZone: (zone: UrbanZone) => void;
  onExportReports: (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => void;
}

export const DiagnosisModule: React.FC<DiagnosisModuleProps> = ({
  zones,
  sensors,
  selectedZone,
  onSelectZone,
  onExportReports
}) => {
  const [selectedSensor, setSelectedSensor] = useState<SensorNode>(
    sensors.find(s => s.zoneId === selectedZone.id) || sensors[0]
  );
  const [metricTab, setMetricTab] = useState<'pm' | 'temp_uhi' | 'gases' | 'calibration'>('pm');

  const zoneSensors = sensors.filter(s => s.zoneId === selectedZone.id);

  // Calibration curve comparison data (Raw low-cost sensor vs Reference Instrument)
  const calibrationScatterData = [
    { raw: 15, reference: 14.8, calibrated: 14.9 },
    { raw: 24, reference: 22.1, calibrated: 22.4 },
    { raw: 38, reference: 31.5, calibrated: 31.8 },
    { raw: 52, reference: 42.0, calibrated: 42.6 },
    { raw: 69, reference: 54.2, calibrated: 54.8 },
    { raw: 85, reference: 66.5, calibrated: 67.1 },
    { raw: 104, reference: 78.9, calibrated: 79.5 },
    { raw: 122, reference: 91.0, calibrated: 91.8 },
  ];

  // Street-level variation data (Microscale distance vs concentration jump)
  const streetDistanceVariation = [
    { distance: '0m (Eje Vial Av. España)', pm25: 72.4, temp: 31.8, description: 'Tráfico pesado y cañón estrecho' },
    { distance: '25m (Acera Comercial)', pm25: 58.2, temp: 30.6, description: 'Exposición directa de peatones' },
    { distance: '50m (Retiro con Árboles)', pm25: 39.5, temp: 28.4, description: 'Intercepción foliar y sombra' },
    { distance: '75m (Pasaje Peatonal)', pm25: 32.1, temp: 27.9, description: 'Sin tráfico rodado' },
    { distance: '100m (Parque / Plaza)', pm25: 25.8, temp: 26.5, description: 'Microclima de amortiguamiento' }
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-slate-900 relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
                Objetivo Específico 1 (OE1)
              </span>
              <h2 className="text-2xl font-bold text-slate-900 mt-2">
                Diagnóstico de Variabilidad Microescalar en Trujillo
              </h2>
              <p className="text-slate-600 text-sm max-w-3xl mt-1">
                Monitoreo de alta resolución espacial en zonas críticas de Trujillo. Evaluación de cañones urbanos, 
                efecto de isla de calor urbano (UHI) y calibración en dos etapas de sensores ópticos de bajo costo (Zhivkov et al., 2025).
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onExportReports('pdf')}
                className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-medium border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                Reporte OE1 (PDF)
              </button>
              <button
                onClick={() => onExportReports('xlsx')}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm shadow-emerald-900/10"
              >
                <Download className="w-3.5 h-3.5" />
                Datos Brutos (Excel)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Zone Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {zones.map((zone) => {
          const isSelected = zone.id === selectedZone.id;
          return (
            <button
              key={zone.id}
              onClick={() => {
                onSelectZone(zone);
                const firstSens = sensors.find(s => s.zoneId === zone.id);
                if (firstSens) setSelectedSensor(firstSens);
              }}
              className={`p-3.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/20 text-slate-900 shadow-sm'
                  : 'bg-white border-slate-200/80 hover:border-slate-300 text-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-mono text-emerald-700 font-bold">{zone.id.replace('zona-', 'Z-')}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                  zone.vulnerabilityLevel === 'Crítica' ? 'bg-red-50 text-red-700 border border-red-200' :
                  zone.vulnerabilityLevel === 'Muy Alta' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                  'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  {zone.vulnerabilityLevel}
                </span>
              </div>
              <h4 className="font-semibold text-xs text-slate-900 line-clamp-1">
                {zone.name.split(':')[1]?.trim() || zone.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1">{zone.district}</p>
              
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                <span className="text-slate-500">Base: <strong className="text-slate-800">{zone.baselineTemp}°C</strong></span>
                <span className="text-slate-500">PM: <strong className="text-amber-600 font-bold">{zone.baselinePM25}µg</strong></span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Zone Overview Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 space-y-1">
          <div className="flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Zona Seleccionada: {selectedZone.name}
          </div>
          <p className="text-slate-600 text-sm">
            {selectedZone.description}
          </p>
          <div className="pt-2 flex items-center gap-4 text-xs text-slate-500">
            <span>Población Total: <strong className="text-slate-800">{selectedZone.targetPopulation.toLocaleString()} hab.</strong></span>
            <span>Población Vulnerable: <strong className="text-amber-700 font-semibold">{selectedZone.vulnerablePopulation.toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1">
          <span className="text-xs text-slate-500 block font-medium">Fuente Principal de Emisión</span>
          <p className="text-xs text-slate-800 font-semibold">
            {selectedZone.primaryPollutionSource}
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Suelo Sellado (Asfalto/Concreto):</span>
            <span className="font-bold text-red-600">{selectedZone.builtDensity}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Cobertura Arbórea Actual:</span>
            <span className="font-bold text-emerald-600">{selectedZone.treeCover}%</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Nodos IoT Desplegados:</span>
            <span className="font-bold text-sky-700">{zoneSensors.length} sensores</span>
          </div>
        </div>
      </div>

      {/* Metric Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setMetricTab('pm')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            metricTab === 'pm' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Material Particulado (PM2.5 / PM10)
        </button>

        <button
          onClick={() => setMetricTab('temp_uhi')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            metricTab === 'temp_uhi' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Thermometer className="w-3.5 h-3.5" />
          Temperatura, UHI y Confort (PET/TCS)
        </button>

        <button
          onClick={() => setMetricTab('gases')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            metricTab === 'gases' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Wind className="w-3.5 h-3.5" />
          Gases Precursores (NO2, O3, CO)
        </button>

        <button
          onClick={() => setMetricTab('calibration')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
            metricTab === 'calibration' 
              ? 'bg-emerald-600 text-white shadow-sm' 
              : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Calibración 2-Etapas (Zhivkov et al.)
        </button>
      </div>

      {/* Main Charts & Telemetry Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Charts */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Serie Temporal de Telemetría 24 Horas: {selectedSensor.name}
              </h3>
              <p className="text-xs text-slate-500">
                Frecuencia horaria | Sensor: {selectedSensor.sensorType} ({selectedSensor.calibrationStatus})
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 block">Estado del Nodo</span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {selectedSensor.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Chart Rendering by Tab */}
          <div className="h-[320px] w-full pt-4">
            {metricTab === 'pm' && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selectedSensor.hourlyHistory}>
                  <defs>
                    <linearGradient id="pm25Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="pm10Grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" µg/m³" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="pm25" name="PM2.5 (µg/m³)" stroke="#d97706" strokeWidth={2.5} fillOpacity={1} fill="url(#pm25Grad)" />
                  <Area type="monotone" dataKey="pm10" name="PM10 (µg/m³)" stroke="#dc2626" strokeWidth={1.5} fillOpacity={1} fill="url(#pm10Grad)" />
                </AreaChart>
              </ResponsiveContainer>
            )}

            {metricTab === 'temp_uhi' && (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={selectedSensor.hourlyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} unit=" °C" domain={[20, 42]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="temperature" name="Temp. Aire (°C)" stroke="#ea580c" strokeWidth={3} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="petScore" name="Confort Térmico PET (°C)" stroke="#dc2626" strokeWidth={2} strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="uhiDelta" name="Delta Isla de Calor (+°C)" stroke="#9333ea" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            )}

            {metricTab === 'gases' && (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={selectedSensor.hourlyHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Bar dataKey="no2" name="Dióxido de Nitrógeno (NO2 ppb)" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="o3" name="Ozono Troposférico (O3 ppb)" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}

            {metricTab === 'calibration' && (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" dataKey="reference" name="Sensor Patrón Referencia" unit=" µg/m³" stroke="#64748b" />
                  <YAxis type="number" dataKey="calibrated" name="Sensor Bajo Costo Calibrado" unit=" µg/m³" stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend />
                  <Scatter name="Datos Calibrados (R² = 0.94)" data={calibrationScatterData} fill="#059669" line={{ stroke: '#059669', strokeWidth: 2 }} shape="circle" />
                </ScatterChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Street-Level Variability Evidence Table (Zhivkov et al. matching) */}
          <div className="pt-3 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              Evidencia Microescalar: Variabilidad de PM2.5 y Temperatura en distancias cortas (0 - 100m)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {streetDistanceVariation.map((item, idx) => (
                <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 text-xs space-y-1">
                  <span className="font-bold text-slate-800 block text-[11px]">{item.distance}</span>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">PM2.5:</span>
                    <span className="font-mono font-bold text-amber-700">{item.pm25} µg</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">Temp:</span>
                    <span className="font-mono font-bold text-orange-700">{item.temp} °C</span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic line-clamp-1">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Sensor Detail Card & Calibration Specs */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
              <span>Nodos IoT en {selectedZone.district}</span>
              <span className="text-xs text-emerald-700 font-mono font-bold">({zoneSensors.length} activos)</span>
            </h3>

            <div className="space-y-2">
              {zoneSensors.map(sensor => (
                <button
                  key={sensor.id}
                  onClick={() => setSelectedSensor(sensor)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    sensor.id === selectedSensor.id
                      ? 'bg-emerald-50/80 border-emerald-500 ring-1 ring-emerald-500/20 text-slate-900 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-800">{sensor.code}</span>
                    <span className="text-[10px] text-slate-500 font-mono">R² = {sensor.r2ScoreCalibrated}</span>
                  </div>
                  <p className="text-xs text-slate-800 mt-1 line-clamp-1 font-medium">{sensor.name}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Temp: <strong className="text-slate-800">{sensor.lastReading.temperature}°C</strong></span>
                    <span>PM2.5: <strong className="text-amber-700 font-bold">{sensor.lastReading.pm25} µg</strong></span>
                    <span>AQI: <strong className="text-emerald-700 font-bold">{sensor.lastReading.aqiIndex}</strong></span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2-Stage Calibration Method Box */}
          <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-2xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Método de Calibración en 2 Etapas
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Basado en <strong>Zhivkov et al. (2025)</strong>, los sensores ópticos de bajo costo (PMS5003 / Sensirion SPS30) se calibran en:
            </p>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal pl-4">
              <li><strong>Corrección higroscópica:</strong> Ajuste por alta humedad relativa costera de Trujillo (70-85% HR).</li>
              <li><strong>Regresión Polinomial Multivariable:</strong> Sube el R² de <strong>{selectedSensor.r2ScoreRaw}</strong> a <strong>{selectedSensor.r2ScoreCalibrated}</strong> contra estación de referencia oficial.</li>
            </ol>
            <div className="bg-white p-2.5 rounded-xl text-[11px] text-emerald-900 font-mono border border-emerald-200 shadow-xs">
              f(PM) = α·PM_raw + β·(HR/(1-HR)) + γ·Temp + δ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
