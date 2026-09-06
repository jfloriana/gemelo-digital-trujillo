import React, { useState } from 'react';
import { UrbanZone, SensorNode, AiModelMetric, NbsIntervention, ThesisObjectiveEvaluation, SimulationScenario } from '../../types';
import { 
  FileSpreadsheet, 
  FileText, 
  FileCode, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Layers, 
  Printer, 
  Database, 
  ShieldCheck,
  FileCheck2
} from 'lucide-react';
import { exportToExcel, exportToPDF, exportToWord, exportToCSV } from '../../utils/exportUtils';

interface ReportsModuleProps {
  zones: UrbanZone[];
  sensors: SensorNode[];
  models: AiModelMetric[];
  nbsCatalog: NbsIntervention[];
  objectives: ThesisObjectiveEvaluation[];
  activeScenario?: SimulationScenario | null;
}

export const ReportsModule: React.FC<ReportsModuleProps> = ({
  zones,
  sensors,
  models,
  nbsCatalog,
  objectives,
  activeScenario
}) => {
  const [isExporting, setIsExporting] = useState<string | null>(null);

  const handleExport = async (format: 'xlsx' | 'pdf' | 'docx' | 'csv') => {
    setIsExporting(format);
    try {
      if (format === 'xlsx') {
        exportToExcel(zones, sensors, models, nbsCatalog, objectives, activeScenario);
      } else if (format === 'pdf') {
        exportToPDF(zones, sensors, models, nbsCatalog, objectives, activeScenario);
      } else if (format === 'docx') {
        await exportToWord(zones, sensors, models, nbsCatalog, objectives, activeScenario);
      } else if (format === 'csv') {
        exportToCSV(sensors);
      }
    } catch (e) {
      console.error('Export error', e);
      alert('Hubo un inconveniente al generar el archivo. Por favor reintenta.');
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 bg-teal-50 text-teal-700 border border-teal-200/60 text-xs font-semibold rounded-lg uppercase tracking-wider">
              Centro de Exportación Multiformato
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Generación de Reportes Técnicos, Científicos y Datasets
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm max-w-3xl mt-1">
              Descarga directa de los resultados de la tesis en formatos estandarizados <strong>Excel (.xlsx)</strong>, 
              <strong> PDF (.pdf)</strong>, <strong>Word (.docx)</strong> y <strong>CSV (.csv)</strong> con estructura académica formal.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Datos Verificados Trujillo 2026
            </span>
          </div>
        </div>
      </div>

      {/* 4 Format Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* EXCEL CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-emerald-500/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm hover:shadow-md group">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Libro de Trabajo Excel (.xlsx)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Contiene 6 hojas estructuradas: Zonas de Trujillo, Telemetría IoT cruda y calibrada, Benchmarks de Modelos IA, Catálogo NbS, Cumplimiento de Objetivos y Escenario Simulado.
            </p>
          </div>

          <button
            onClick={() => handleExport('xlsx')}
            disabled={isExporting === 'xlsx'}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-900/10"
          >
            <Download className="w-4 h-4" />
            {isExporting === 'xlsx' ? 'Generando Excel...' : 'Descargar Excel (.xlsx)'}
          </button>
        </div>

        {/* PDF CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-rose-500/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm hover:shadow-md group">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Informe Técnico PDF (.pdf)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Documento formal con membrete institucional, tablas estilizadas con jspdf-autotable, indicadores de calidad del aire, fórmulas de calibración y firmas académicas.
            </p>
          </div>

          <button
            onClick={() => handleExport('pdf')}
            disabled={isExporting === 'pdf'}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-rose-900/10"
          >
            <Download className="w-4 h-4" />
            {isExporting === 'pdf' ? 'Compilando PDF...' : 'Descargar PDF (.pdf)'}
          </button>
        </div>

        {/* WORD CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-sky-500/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm hover:shadow-md group">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 border border-sky-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Capítulos de Tesis Word (.docx)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Documento estructurado en capítulos según la guía de tesis universitaria: Resumen, Diagnóstico OE1, Arquitectura OE2, Modelos OE3, Simulación NbS OE4 y Discusión OE5.
            </p>
          </div>

          <button
            onClick={() => handleExport('docx')}
            disabled={isExporting === 'docx'}
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-sky-900/10"
          >
            <Download className="w-4 h-4" />
            {isExporting === 'docx' ? 'Compilando Word...' : 'Descargar Word (.docx)'}
          </button>
        </div>

        {/* CSV DATASET CARD */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 hover:border-amber-500/60 rounded-2xl p-5 flex flex-col justify-between space-y-4 transition-all shadow-sm hover:shadow-md group">
          <div className="space-y-2">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <FileCode className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Dataset Crudo CSV (.csv)</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Matriz completa de telemetría horaria con valores de PM2.5, PM10, NO2, O3, Temperatura, PET, TCS y Delta UHI lista para importación directa en Python, R o SPSS.
            </p>
          </div>

          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting === 'csv'}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm shadow-amber-900/10"
          >
            <Download className="w-4 h-4" />
            {isExporting === 'csv' ? 'Exportando CSV...' : 'Descargar CSV (.csv)'}
          </button>
        </div>
      </div>

      {/* Live Report Preview Matrix */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-teal-600" />
              Vista Previa de Datos Compilados para el Reporte
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Resumen en tiempo real sincronizado con todas las simulaciones y lecturas de Trujillo.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium">
            {sensors.length} nodos activos | 6 zonas críticas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-mono border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Zona Trujillo</th>
                <th className="py-2.5 px-3">Temp Base</th>
                <th className="py-2.5 px-3">PM2.5 Base</th>
                <th className="py-2.5 px-3">Arbolado (%)</th>
                <th className="py-2.5 px-3">Población Vulnerable</th>
                <th className="py-2.5 px-3">Sensores IoT</th>
                <th className="py-2.5 px-3">Nivel de Riesgo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {zones.map(z => (
                <tr key={z.id} className="hover:bg-slate-50 dark:bg-slate-800/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">{z.name}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{z.baselineTemp} °C</td>
                  <td className="py-2.5 px-3 font-mono font-semibold text-amber-700">{z.baselinePM25} µg/m³</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700">{z.treeCover}%</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">{z.vulnerablePopulation.toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-mono text-sky-700">{z.sensorsCount} nodos</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      z.vulnerabilityLevel === 'Crítica' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      z.vulnerabilityLevel === 'Muy Alta' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {z.vulnerabilityLevel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
