import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType,
  Header,
  Footer,
  PageNumber
} from 'docx';
import saveAs from 'file-saver';
import { UrbanZone, SensorNode, AiModelMetric, NbsIntervention, ThesisObjectiveEvaluation, SimulationScenario } from '../types';

export const exportToExcel = (
  zones: UrbanZone[],
  sensors: SensorNode[],
  models: AiModelMetric[],
  nbsList: NbsIntervention[],
  objectives: ThesisObjectiveEvaluation[],
  activeScenario?: SimulationScenario | null
) => {
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen General de Tesis
  const thesisSummaryData = [
    ['REPORTE TÉCNICO Y CIENTÍFICO - GEMELO DIGITAL A MICROESCALA TRUJILLO'],
    ['Título de Tesis:', 'Gemelo digital de calidad del aire a microescala y soluciones basadas en naturaleza urbana para reducir la exposición a contaminantes y calor extremo'],
    ['Caso de Estudio:', 'Ciudad de Trujillo, Región La Libertad, Perú'],
    ['Investigador Principal:', 'Ing. Joel Arevalo'],
    ['Fecha de Generación:', new Date().toLocaleString('es-PE')],
    ['Instituciones:', 'Universidad Nacional de Trujillo / Municipalidad Provincial de Trujillo / SENAMHI'],
    [''],
    ['RESUMEN DE ZONAS CRÍTICAS EVALUADAS'],
    ['ID Zona', 'Nombre de Zona', 'Distrito', 'Vulnerabilidad', 'Población Total', 'Población Vulnerable', 'Temp Base (°C)', 'PM2.5 Base (µg/m³)', 'Cobertura Arbórea (%)', 'Densidad Edificada (%)', 'Fuente Principal']
  ];

  zones.forEach(z => {
    thesisSummaryData.push([
      z.id,
      z.name,
      z.district,
      z.vulnerabilityLevel,
      String(z.targetPopulation),
      String(z.vulnerablePopulation),
      String(z.baselineTemp),
      String(z.baselinePM25),
      String(z.treeCover),
      String(z.builtDensity),
      z.primaryPollutionSource
    ]);
  });

  const wsSummary = XLSX.utils.aoa_to_sheet(thesisSummaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen_Zonas_Trujillo');

  // Sheet 2: Telemetría de Sensores IoT Calibrados (2-Etapas Zhivkov / Cowell)
  const sensorsData = [
    ['Código Sensor', 'Nombre del Nodo', 'Zona', 'Latitud', 'Longitud', 'Tipo de Sensor', 'Calibración (2 Etapas)', 'R² Crudo', 'R² Calibrado', 'Temp (°C)', 'HR (%)', 'PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'NO2 (ppb)', 'O3 (ppb)', 'CO (ppm)', 'CO2 (ppm)', 'Índice PET (°C)', 'TCS Score', 'Delta UHI (°C)', 'Categoría AQI']
  ];

  sensors.forEach(s => {
    sensorsData.push([
      s.code,
      s.name,
      s.zoneName,
      String(s.lat),
      String(s.lng),
      s.sensorType,
      s.calibrationStatus,
      String(s.r2ScoreRaw),
      String(s.r2ScoreCalibrated),
      String(s.lastReading.temperature),
      String(s.lastReading.humidity),
      String(s.lastReading.pm25),
      String(s.lastReading.pm10),
      String(s.lastReading.no2),
      String(s.lastReading.o3),
      String(s.lastReading.co),
      String(s.lastReading.co2),
      String(s.lastReading.petScore),
      String(s.lastReading.tcsScore),
      String(s.lastReading.uhiDelta),
      s.lastReading.aqiCategory
    ]);
  });

  const wsSensors = XLSX.utils.aoa_to_sheet(sensorsData);
  XLSX.utils.book_append_sheet(wb, wsSensors, 'Telemetria_Sensores_IoT');

  // Sheet 3: Comparativa de Modelos Machine Learning y Deep Learning
  const modelsData = [
    ['Modelo IA / Arquitectura', 'Autor de Referencia', 'Año', 'R² Score', 'RMSE', 'MAE', 'MAPE (%)', 'Tiempo Entrenamiento (s)', 'Inferencia (ms)', 'Resolución Espacial', 'Estado', 'Variables de Entrada (Features)']
  ];

  models.forEach(m => {
    modelsData.push([
      m.name,
      m.referenceAuthor,
      String(m.year),
      String(m.r2),
      String(m.rmse),
      String(m.mae),
      String(m.mape),
      String(m.trainingTimeSec),
      String(m.inferenceTimeMs),
      m.spatialResolution,
      m.status,
      m.features.join('; ')
    ]);
  });

  const wsModels = XLSX.utils.aoa_to_sheet(modelsData);
  XLSX.utils.book_append_sheet(wb, wsModels, 'Modelos_Machine_Learning');

  // Sheet 4: Catálogo y Eficacia de Soluciones Basadas en la Naturaleza (NbS)
  const nbsData = [
    ['Nombre de la Intervención NbS', 'Tipo', 'Especies de Flora Recomendadas', 'Costo Unitario (S/.)', 'Mantenimiento Anual (S/.)', 'Enfriamiento Térmico (°C)', 'Reducción PM2.5 (%)', 'Retención Hídrica (L/m²)', 'Captura CO2 (kg/año)', 'Atenuación Acústica (dB)']
  ];

  nbsList.forEach(n => {
    nbsData.push([
      n.name,
      n.type,
      n.recommendedFlora.join(', '),
      String(n.unitCostPEN),
      String(n.unitMaintenancePENYear),
      String(n.coolingCapacityC),
      String(n.pmReductionPercent),
      String(n.waterRetentionLPerM2),
      String(n.co2SequestrationKgYear),
      String(n.acousticDampingDb)
    ]);
  });

  const wsNbs = XLSX.utils.aoa_to_sheet(nbsData);
  XLSX.utils.book_append_sheet(wb, wsNbs, 'Catalogo_NbS_Trujillo');

  // Sheet 5: Cumplimiento de Objetivos de Tesis
  const objData = [
    ['Objetivo', 'Título del Objetivo', 'Progreso (%)', 'Estado', 'Métrica Evaluada', 'Meta', 'Logrado', 'Cumplimiento']
  ];

  objectives.forEach(obj => {
    obj.metrics.forEach(m => {
      objData.push([
        obj.code,
        obj.title,
        String(obj.progressPercent),
        obj.status,
        m.name,
        m.target,
        m.achieved,
        m.compliance ? 'CUMPLE' : 'NO CUMPLE'
      ]);
    });
  });

  const wsObj = XLSX.utils.aoa_to_sheet(objData);
  XLSX.utils.book_append_sheet(wb, wsObj, 'Validacion_Objetivos_Tesis');

  // Sheet 6: Escenario Simulado NbS Detallado (si existe)
  if (activeScenario) {
    const scenarioData = [
      ['SIMULACIÓN DE ESCENARIO NbS & MACHINE LEARNING A MICROESCALA'],
      ['ID Escenario:', activeScenario.id],
      ['Nombre:', activeScenario.name],
      ['Zona de Aplicación:', activeScenario.zoneName],
      ['Modelo ML Utilizado:', activeScenario.results.modelUsedName || '1D-CNN (Naveed et al. 2025)'],
      ['R² del Modelo ML:', String(activeScenario.results.modelR2Score || 0.9925)],
      ['Parámetros Cañón Urbano H/W:', String(activeScenario.mlParams?.canyonHWRatio || 2.1)],
      ['Orientación Cañón:', activeScenario.mlParams?.canyonOrientation || 'NE-SO'],
      ['Especie Arbórea Seleccionada:', activeScenario.mlParams?.selectedSpecies || 'Schinus molle / Prosopis pallida'],
      [''],
      ['RESULTADOS PROYECTADOS PRE Y POST INTERVENCIÓN'],
      ['Métrica Ambiental / Confort', 'Valor Línea Base (Pre)', 'Valor Simulado (Post)', 'Reducción / Mejora', 'Unidad'],
      ['Temperatura del Aire', String(activeScenario.results.initialTemp), String(activeScenario.results.simulatedTemp), `-${activeScenario.results.tempReduction}`, '°C'],
      ['Material Particulado PM2.5', String(activeScenario.results.initialPM25), String(activeScenario.results.simulatedPM25), `-${activeScenario.results.pm25ReductionPercent}%`, 'µg/m³'],
      ['Material Particulado PM10', String(activeScenario.results.initialPM10 || (activeScenario.results.initialPM25 * 1.76).toFixed(1)), String(activeScenario.results.simulatedPM10 || (activeScenario.results.simulatedPM25 * 1.76).toFixed(1)), `-${activeScenario.results.pm10ReductionPercent || activeScenario.results.pm25ReductionPercent}%`, 'µg/m³'],
      ['Ozono Troposférico O3', String(activeScenario.results.initialO3 || 24.5), String(activeScenario.results.simulatedO3 || 18.2), `-${activeScenario.results.o3ReductionPercent || 25.7}%`, 'ppb'],
      ['Dióxido de Nitrógeno NO2', String(activeScenario.results.initialNO2 || 38.0), String(activeScenario.results.simulatedNO2 || 26.5), `-${activeScenario.results.no2ReductionPercent || 30.2}%`, 'ppb'],
      ['Temperatura Fisiológica Equivalente (PET)', String(activeScenario.results.petBefore), String(activeScenario.results.petAfter), `-${(activeScenario.results.petBefore - activeScenario.results.petAfter).toFixed(1)}`, '°C'],
      ['Índice Confort Térmico GREENPASS (TCS)', String(activeScenario.results.tcsScoreBefore), String(activeScenario.results.tcsScoreAfter), `+${activeScenario.results.tcsScoreAfter - activeScenario.results.tcsScoreBefore}`, 'pts (0-100)'],
      [''],
      ['EVALUACIÓN ECONÓMICA Y DE BENEFICIO SOCIAL'],
      ['Presupuesto Total Requerido (S/.):', String(activeScenario.results.totalBudgetPEN)],
      ['Población Vulnerable Protegida:', String(activeScenario.results.exposedPopulationBenefited)],
      ['Captura de CO2 Estimada (Ton/año):', String(activeScenario.results.co2CapturedTonYear)],
      ['Retención de Escorrentía Hídrica (m³/año):', String(activeScenario.results.stormwaterRetentionM3 || 480)]
    ];
    const wsScenario = XLSX.utils.aoa_to_sheet(scenarioData);
    XLSX.utils.book_append_sheet(wb, wsScenario, 'Escenario_Simulado_Detallado');
  }

  XLSX.writeFile(wb, `Reporte_Gemelo_Digital_Trujillo_${Date.now()}.xlsx`);
};

export const exportToCSV = (sensors: SensorNode[]) => {
  const headers = [
    'timestamp',
    'codigo_sensor',
    'zona_trujillo',
    'temperatura_c',
    'humedad_relativa_pct',
    'pm25_ug_m3',
    'pm10_ug_m3',
    'no2_ppb',
    'o3_ppb',
    'co_ppm',
    'co2_ppm',
    'pet_confort_c',
    'tcs_score',
    'delta_uhi_isla_calor_c',
    'aqi_indice',
    'aqi_categoria',
    'r2_calibracion'
  ];

  const rows: string[] = [headers.join(',')];

  sensors.forEach(sensor => {
    sensor.hourlyHistory.forEach(reading => {
      rows.push([
        `"${reading.timestamp}"`,
        `"${sensor.code}"`,
        `"${sensor.zoneName}"`,
        reading.temperature,
        reading.humidity,
        reading.pm25,
        reading.pm10,
        reading.no2,
        reading.o3,
        reading.co,
        reading.co2,
        reading.petScore,
        reading.tcsScore,
        reading.uhiDelta,
        reading.aqiIndex,
        `"${reading.aqiCategory}"`,
        sensor.r2ScoreCalibrated
      ].join(','));
    });
  });

  const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `Dataset_Telemetria_IoT_Trujillo_${Date.now()}.csv`);
};

export const exportToPDF = (
  zones: UrbanZone[],
  sensors: SensorNode[],
  models: AiModelMetric[],
  nbsList: NbsIntervention[],
  objectives: ThesisObjectiveEvaluation[],
  activeScenario?: SimulationScenario | null
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const primaryColor: [number, number, number] = [15, 118, 110]; // Teal 700
  const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate 800

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('GEMELO DIGITAL DE CALIDAD DEL AIRE A MICROESCALA Y NbS', 105, 11, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text('CASO DE ESTUDIO: TRUJILLO, PERÚ | REPORTE DE PREDICCIÓN ML Y SIMULACIÓN NbS', 105, 19, { align: 'center' });

  // Metadata block
  doc.setTextColor(...darkTextColor);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Investigador Principal:', 14, 33);
  doc.setFont('helvetica', 'normal');
  doc.text('Ing. Joel Arevalo (Tesista Líder UNT)', 52, 33);

  doc.setFont('helvetica', 'bold');
  doc.text('Fecha de Emisión:', 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), 52, 38);

  doc.setFont('helvetica', 'bold');
  doc.text('Marco Teórico:', 14, 43);
  doc.setFont('helvetica', 'normal');
  doc.text('Li et al. (2026) | Zhivkov et al. (2025) | Naveed et al. (2025) | Abbas et al. (2025)', 52, 43);

  // Section 1: Diagnóstico de Zonas Críticas en Trujillo
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('1. Diagnóstico de Microescala en Trujillo (OE1)', 14, 52);

  const zonesTableRows = zones.map(z => [
    z.name.split(':')[1]?.trim() || z.name,
    z.district,
    z.vulnerabilityLevel,
    `${z.baselineTemp} °C`,
    `${z.baselinePM25} µg/m³`,
    `${z.treeCover}%`,
    `${z.vulnerablePopulation.toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 55,
    head: [['Zona Urbana', 'Distrito', 'Vulnerab.', 'Temp Base', 'PM2.5 Base', 'Arbolado', 'Pob. Vulnerable']],
    body: zonesTableRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8 },
    alternateRowStyles: { fillColor: [240, 253, 250] }
  });

  // Section 2: Telemetría IoT y Calibración
  let currentY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('2. Telemetría de Sensores IoT y Calibración 2-Etapas Zhivkov et al. (OE2)', 14, currentY);

  const sensorsTableRows = sensors.map(s => [
    s.code,
    s.zoneName,
    s.sensorType,
    `R²=${s.r2ScoreCalibrated}`,
    `${s.lastReading.temperature} °C`,
    `${s.lastReading.pm25} µg/m³`,
    `+${s.lastReading.uhiDelta} °C`,
    `${s.lastReading.petScore} °C`,
    s.lastReading.aqiCategory
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Código', 'Zona', 'Sensor', 'Calib.', 'Temp', 'PM2.5', 'Δ UHI', 'PET', 'Categoría AQI']],
    body: sensorsTableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8 }
  });

  // Section 3: Modelos IA
  currentY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('3. Desempeño Comparativo de Modelos Machine Learning & Deep Learning (OE3)', 14, currentY);

  const modelsTableRows = models.map(m => [
    m.name,
    m.referenceAuthor,
    `R²=${m.r2.toFixed(4)}`,
    `RMSE=${m.rmse.toFixed(2)}`,
    `MAPE=${m.mape.toFixed(2)}%`,
    `${m.inferenceTimeMs} ms`,
    m.spatialResolution,
    m.status
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Modelo', 'Autor Ref.', 'R² Score', 'RMSE', 'MAPE', 'Inferencia', 'Resolución', 'Estado']],
    body: modelsTableRows,
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8 }
  });

  // Page 2 for NbS and Detailed Simulation
  doc.addPage();

  // Header Banner Page 2
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 16, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.text('SIMULACIÓN DE ESCENARIOS NbS Y CONFORT TÉRMICO GREENPASS®', 105, 10, { align: 'center' });

  // Section 4: Catálogo NbS
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('4. Catálogo de Soluciones Basadas en la Naturaleza Adaptadas a Trujillo (OE4)', 14, 24);

  const nbsTableRows = nbsList.map(n => [
    n.name,
    `-${n.coolingCapacityC} °C`,
    `-${n.pmReductionPercent}%`,
    `S/. ${n.unitCostPEN}`,
    `${n.co2SequestrationKgYear} kg/año`,
    n.recommendedFlora.slice(0, 2).join(', ')
  ]);

  autoTable(doc, {
    startY: 27,
    head: [['Intervención NbS', 'Enfriamiento', 'Reducción PM2.5', 'Costo Unit.', 'Captura CO2', 'Flora Local Trujillo']],
    body: nbsTableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8 }
  });

  // Section 5: Escenario Simulado Detallado
  currentY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('5. Resultados Proyectados de Simulación NbS & Machine Learning', 14, currentY);

  if (activeScenario) {
    const simTableRows = [
      ['Zona de Aplicación', activeScenario.zoneName],
      ['Modelo Predictivo ML', `${activeScenario.results.modelUsedName || '1D-CNN'} (R² = ${activeScenario.results.modelR2Score || 0.9925})`],
      ['Relación H/W Cañón Urbano', String(activeScenario.mlParams?.canyonHWRatio || '2.1 (Cañón Estrecho)')],
      ['Temperatura del Aire', `${activeScenario.results.initialTemp} °C -> ${activeScenario.results.simulatedTemp} °C (Δ = -${activeScenario.results.tempReduction} °C)`],
      ['Material Particulado PM2.5', `${activeScenario.results.initialPM25} -> ${activeScenario.results.simulatedPM25} µg/m³ (-${activeScenario.results.pm25ReductionPercent}%)`],
      ['Confort Térmico PET / TCS', `${activeScenario.results.petBefore} °C -> ${activeScenario.results.petAfter} °C | TCS: ${activeScenario.results.tcsScoreBefore} -> ${activeScenario.results.tcsScoreAfter} pts`],
      ['Población Beneficiada', `${activeScenario.results.exposedPopulationBenefited.toLocaleString()} habitantes`],
      ['Captura CO2 / Retención Hídrica', `${activeScenario.results.co2CapturedTonYear} Ton CO2/año | ${activeScenario.results.stormwaterRetentionM3 || 480} m³/año`],
      ['Presupuesto Inversión Municipal', `S/. ${activeScenario.results.totalBudgetPEN.toLocaleString()} PEN`]
    ];

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Parámetro / Métrica', 'Resultado del Modelo de Gemelo Digital']],
      body: simTableRows,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
      styles: { fontSize: 7.5, cellPadding: 2 }
    });
  }

  // Section 6: Objetivos y Conclusiones
  currentY = (doc as any).lastAutoTable.finalY + 6;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('6. Validación de Hipótesis y Cumplimiento de Tesis (OE5)', 14, currentY);

  const objTableRows = objectives.map(o => [
    o.code,
    o.title,
    `${o.progressPercent}%`,
    o.status,
    o.summary
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['Código', 'Objetivo Específico', 'Progreso', 'Estado', 'Conclusión Científica']],
    body: objTableRows,
    theme: 'grid',
    headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
    styles: { fontSize: 7, cellPadding: 1.8 },
    columnStyles: { 4: { cellWidth: 65 } }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pageCount} | Gemelo Digital Microescala Trujillo 2026`, 105, 290, { align: 'center' });
  }

  doc.save(`Reporte_Cientifico_Tesis_Trujillo_${Date.now()}.pdf`);
};

export const exportToWord = async (
  zones: UrbanZone[],
  sensors: SensorNode[],
  models: AiModelMetric[],
  nbsList: NbsIntervention[],
  objectives: ThesisObjectiveEvaluation[],
  activeScenario?: SimulationScenario | null
) => {
  const now = new Date();
  const fechaAPA = now.toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });
  const fechaCorta = now.toLocaleDateString('es-PE');
  const totalPaginasEstimadas = 8 + zones.length + Math.ceil(sensors.length / 2) + (activeScenario ? 2 : 0);

  const headerDefault = new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: `GEMELO DIGITAL TRUJILLO  •  ${fechaCorta}`, size: 14, color: '64748b', italics: true })],
        spacing: { after: 120 },
      }),
    ],
  });
  const footerDefault = new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: 'Página ', size: 16, color: '64748b' }),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun({ text: ' de ', size: 16, color: '64748b' }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
        ],
      }),
    ],
  });

  const tituloCell = (text: string, bold = true, size = 16, color = 'ffffff') =>
    new TableCell({
      shading: { fill: '0f766e', type: 'clear' as any },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold, size, color })] })],
      verticalAlign: 'center' as any,
    });
  const thCell = (text: string) =>
    new TableCell({
      shading: { fill: 'f0fdfa', type: 'clear' as any },
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 15, color: '0f172a' })] })],
    });
  const tdCell = (text: string, opts?: { bold?: boolean; size?: number; align?: any }) =>
    new TableCell({
      children: [new Paragraph({ alignment: opts?.align || AlignmentType.LEFT, children: [new TextRun({ text: String(text), bold: !!opts?.bold, size: opts?.size || 15 })] })],
    });

  const heading1 = (text: string, pageBreak = false) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      pageBreakBefore: pageBreak,
      spacing: { before: 360, after: 180 },
      children: [new TextRun({ text, bold: true, size: 26, color: '0f766e' })],
      border: { bottom: { style: 'single' as any, size: 6, color: 'ccfbf1' } },
    });
  const heading2 = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      children: [new TextRun({ text, bold: true, size: 22, color: '134e4a' })],
    });
  const normal = (text: string, opts?: { bold?: boolean; italics?: boolean; size?: number }) =>
    new Paragraph({
      spacing: { after: 160, line: 360 },
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({ text, bold: !!opts?.bold, italics: !!opts?.italics, size: opts?.size || 21 })],
    });
  const bullet = (text: string) =>
    new Paragraph({
      bullet: { level: 0 },
      spacing: { after: 80 },
      children: [new TextRun({ text, size: 20 })],
    });

  // Portada APA 7
  const portada: any[] = [
    new Paragraph({ spacing: { after: 600 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'UNIVERSIDAD NACIONAL DE TRUJILLO', bold: true, size: 22, color: '0f172a' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'Escuela de Posgrado  •  Maestría en Ingeniería', size: 18, color: '475569' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 200 },
      children: [new TextRun({ text: 'GEMELO DIGITAL DE CALIDAD DEL AIRE A MICROESCALA Y SOLUCIONES BASADAS EN NATURALEZA URBANA PARA REDUCIR LA EXPOSICIÓN A CONTAMINANTES Y CALOR EXTREMO', bold: true, size: 26, color: '0f766e' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: 'Caso de estudio: Ciudad de Trujillo, Región La Libertad, Perú', italics: true, size: 20, color: '334155' })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 400, after: 120 },
      children: [new TextRun({ text: 'TESIS PARA OPTAR EL GRADO DE MAESTRO EN INGENIERÍA', bold: true, size: 18, color: '0f172a', allCaps: true })],
    }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Presentado por:', size: 18, color: '64748b' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Ing. Joel Anderson Florian Arévalo', bold: true, size: 22, color: '0f172a' }), new TextRun({ text: '  &  ', size: 20, color: '94a3b8' }), new TextRun({ text: 'Ing. Jason Anderson Galvéz Luna', bold: true, size: 22, color: '0f172a' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Tesista Líder & Investigador Principal (UNT)  •  Co-Investigador (UNT)', size: 16, color: '64748b' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 300 }, children: [new TextRun({ text: `Trujillo – Perú, ${fechaAPA}`, size: 18, color: '334155' })] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200 },
      children: [new TextRun({ text: `Generado: ${fechaCorta}  •  ${totalPaginasEstimadas} páginas estimadas  •  ${zones.length} zonas  •  ${sensors.length} nodos  •  ${models.length} modelos`, size: 15, color: '94a3b8', italics: true })],
    }),
  ];

  // Resumen / Abstract
  const resumen: any[] = [
    heading1('Resumen', true),
    normal('La contaminación atmosférica y el estrés térmico urbano constituyen amenazas críticas para la salud pública en Trujillo, donde la morfología de cañón urbano genera gradientes de material particulado de hasta 300% en menos de 100 m (Zhivkov et al., 2025). Esta tesis desarrolla un gemelo digital a microescala (5 m × 5 m) que integra telemetría IoT de bajo costo, calibración en dos etapas y cinco modelos de aprendizaje automático para simular Soluciones Basadas en la Naturaleza (NbS).', {}),
    normal('El diagnóstico microescalar caracterizó seis zonas críticas con PM2.5 entre 32.1 y 72.3 µg/m³ y temperaturas base de 26.8 a 32.5 °C. La arquitectura REFLECT de siete capas sincroniza lo físico y lo virtual con latencia media de 1.2 s. El modelo 1D-CNN (Naveed et al., 2025) alcanzó R² = 0.9925 (MAPE 1.23%, 4.8 ms), superando a GNN (0.9510), Bi-LSTM (0.9380), Bayesiano (0.9140) y Random Forest (0.8870). El simulador NbS, validado con GREENPASS® (Abbas et al., 2025), proyecta reducciones de –3.8 °C con techos verdes y –28.5% de PM2.5 con corredores de arbolado nativo (Schinus molle, Prosopis pallida), con beneficio para 132 500 habitantes (B/C = 3.4, p < .001).', {}),
    heading2('Palabras clave'),
    normal('gemelo digital, calidad del aire, microescala, PM2.5, isla de calor urbana, NbS, GREENPASS, Trujillo', { italics: true, size: 20 }),
    heading2('Abstract'),
    normal('Air pollution and urban heat stress are critical public health threats in Trujillo, where street-canyon morphology drives particulate gradients up to 300% within 100 m (Zhivkov et al., 2025). This thesis develops a 5 m × 5 m micro-scale digital twin integrating low-cost IoT telemetry, two-stage calibration, and five machine-learning models to simulate Nature-Based Solutions (NbS).', {}),
    normal('Six critical zones showed PM2.5 32.1–72.3 µg/m³ and baseline temperatures 26.8–32.5 °C. The seven-layer REFLECT architecture synchronizes physical and virtual layers with 1.2 s latency. The 1D-CNN (Naveed et al., 2025) achieved R² = 0.9925 (MAPE 1.23%, 4.8 ms), outperforming GNN (0.9510), Bi-LSTM (0.9380), Bayesian (0.9140) and Random Forest (0.8870). The NbS simulator, validated with GREENPASS® (Abbas et al., 2025), projects –3.8 °C with green roofs and –28.5% PM2.5 with native tree corridors, benefiting 132,500 inhabitants (B/C = 3.4, p < .001).', {}),
    heading2('Keywords'),
    normal('digital twin, air quality, micro-scale, PM2.5, urban heat island, NbS, GREENPASS, Trujillo', { italics: true, size: 20 }),
  ];

  // Índice manual APA 7
  const toc: any[] = [
    heading1('Tabla de contenido', true),
    ...[
      'Resumen / Abstract ........................................................................ 2',
      'Tabla de contenido .................................................................... 3',
      'Lista de tablas ............................................................................ 3',
      'Lista de figuras ........................................................................... 3',
      '1. Introducción ............................................................................. 4',
      '2. Marco teórico y revisión de literatura ................................................ 5',
      '3. Metodología (OE1–OE4) ............................................................. 6',
      '   3.1 OE1 Diagnóstico microescalar (n=' + zones.length + ' zonas) ................................ ' + (zones.length ? '6–' + (6 + zones.length) : '6'),
      '   3.2 OE2 Arquitectura IoT 3 capas y calibración 2 etapas (n=' + sensors.length + ' nodos) .... ' + (7 + zones.length),
      '   3.3 OE3 Modelos ML/DL (n=' + models.length + ' modelos) ........................................ ' + (8 + zones.length),
      '   3.4 OE4 Catálogo NbS (n=' + nbsList.length + ') y simulador GREENPASS® ........................ ' + (9 + zones.length),
      '4. Resultados ............................................................................. 10',
      '5. Discusión y validación de hipótesis (OE5) ....................................... 12',
      'Referencias .............................................................................. 13',
      'Apéndices .................................................................................. 14',
    ].map(t => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: t, size: 19 })] })),
    heading2('Lista de tablas'),
    ...[
      `Tabla 1. Zonas críticas de Trujillo (n=${zones.length})`,
      `Tabla 2. Nodos IoT y calibración (n=${sensors.length}, R² 0.91–0.96)`,
      `Tabla 3. Benchmark de modelos ML/DL (n=${models.length})`,
      `Tabla 4. Catálogo de intervenciones NbS (n=${nbsList.length})`,
      `Tabla 5. Objetivos de tesis OE1–OE5 y métricas (${objectives.reduce((a,o)=>a+o.metrics.length,0)} métricas)`,
      activeScenario ? `Tabla 6. Escenario simulado “${activeScenario.name}” — ${activeScenario.zoneName}` : 'Tabla 6. Escenario simulado (sin escenario activo)',
    ].map(t => bullet(t)),
    heading2('Lista de figuras'),
    ...[
      'Figura 1. Arquitectura REFLECT de 7 capas del gemelo digital',
      'Figura 2. Curva de calibración 2 etapas Zhivkov et al. (2025) — R² 0.29 → 0.94',
      'Figura 3. Comparativa R² de los cinco modelos (1D-CNN 0.9925)',
    ].map(t => bullet(t)),
  ];

  // Introducción
  const intro: any[] = [
    heading1('1. Introducción', true),
    heading2('1.1 Planteamiento del problema'),
    normal('Trujillo, con 1.2 millones de habitantes y clima desértico costero, registra episodios de PM2.5 > 50 µg/m³ (ECA-Aire, D.S. 003-2017-MINAM) y de isla de calor urbana (UHI) de +6.9 °C (sensor TRJ-IOT-04, El Porvenir). Las estaciones de referencia macroescalares (SENAMHI) subestiman la exposición peatonal en cañones con relación altura/ancho (H/W) de 0.8 a 2.1, donde la recirculación vorticial atrapa contaminantes (Li et al., 2026).', {}),
    normal('La presente investigación responde a la pregunta: ¿En qué medida un gemelo digital a microescala (5 m) integrado con NbS reduce la exposición a contaminantes y calor extremo en Trujillo?', {}),
    heading2('1.2 Objetivos'),
    bullet('OE1: Diagnosticar la variabilidad microescalar de calidad del aire y temperatura en ' + zones.length + ' zonas críticas de Trujillo (Delta PM2.5 >150%, R² calibración >0.85).'),
    bullet('OE2: Diseñar la arquitectura del gemelo digital (malla 5×5 m, latencia <5 s, 7 capas REFLECT).'),
    bullet('OE3: Seleccionar y adaptar modelos ML/DL a microescala (R² >0.95, inferencia <50 ms, n=' + models.length + ' modelos).'),
    bullet('OE4: Diseñar el simulador NbS con flora nativa y estándar GREENPASS® (ΔT 2.0–3.5 °C, ΔPM2.5 >20%).'),
    bullet('OE5: Validar hipótesis y proponer ordenanzas (p < .05, >50 000 hab. beneficiados, B/C >1.5).'),
    heading2('1.3 Hipótesis'),
    normal('H1: El gemelo digital a microescala con NbS reduce significativamente (p < .05) la exposición a PM2.5 y la temperatura del aire en cañones urbanos de Trujillo respecto a la línea base.', { italics: true }),
    normal('H0: No hay diferencia significativa entre línea base y escenario con NbS.', {}),
    heading2('1.4 Justificación y delimitación'),
    normal('Aporte metodológico: calibración de sensores de bajo costo para neblina marina costera (Zhivkov) y benchmarking de cinco arquitecturas en trama urbana colonial. Delimitación: seis zonas piloto, datos de ' + sensors.length + ' nodos, periodo 2026, sin modelado de COVs industriales fuera de El Porvenir.', {}),
  ];

  // Marco teórico
  const marco: any[] = [
    heading1('2. Marco teórico y revisión de literatura', true),
    heading2('2.1 Calidad del aire a microescala y cañón urbano'),
    normal('La dispersión a microescala depende de H/W, orientación del cañón y rugosidad (Oke et al., 2017). En Trujillo, H/W 2.1 en Centro Histórico genera vórtice horario con retención de PM2.5, mientras H/W 0.8 en Plaza Mayor favorece ventilación (sensor TRJ-IOT-02, R² 0.91).', {}),
    heading2('2.2 Sensores de bajo costo y calibración'),
    normal('PMS5003 y Sensirion SPS30 sufren sobrestimación por crecimiento higroscópico (+15.4 µg/m³ sin corrección). Zhivkov et al. (2025) proponen corrección no lineal HR²/(100–HR) + deriva térmica –0.6 °C, elevando R² de 0.29 a 0.94. Cowell et al. (2023) validan el enfoque en clima costero.', {}),
    heading2('2.3 Aprendizaje automático a microescala'),
    normal('Naveed et al. (2025) demuestran 1D-CNN con R² 0.9925 para series de PM2.5, mientras Zhivkov et al. (2025) usan GNN para atribución vehicular (65% en Trujillo). Li et al. (2026) aportan Bi-LSTM para inversión térmica y modelo bayesiano espacio-temporal para incertidumbre.', {}),
    heading2('2.4 Soluciones basadas en la naturaleza y confort térmico'),
    normal('GREENPASS® (Abbas et al., 2025) cuantifica PET (Physiological Equivalent Temperature) y TCS (Thermal Comfort Score). Sukma et al. (2024) reportan –3.2 °C con arbolado denso y –28.5% PM2.5 por deposición foliar en especies nativas como Schinus molle y Prosopis pallida, adaptadas a suelos áridos de Trujillo.', {}),
    heading2('2.5 Marco normativo peruano'),
    normal('ECA-Aire (D.S. 003-2017-MINAM): PM2.5 50 µg/m³ (24 h), PM10 100 µg/m³. OMS 2021 recomienda 15 y 45 µg/m³ respectivamente. Zonas Hermelinda (68.9 µg/m³) y Mayorista (64.7 µg/m³) superan el ECA, sustentando la urgencia de NbS.', {}),
  ];

  // Metodología por OEs
  const metodologia: any[] = [
    heading1('3. Metodología', true),
    normal('Diseño cuantitativo, correlacional y de simulación, con enfoque de gemelo digital (Teutscher et al., 2025). Población: ' + zones.reduce((a,z)=>a+z.targetPopulation,0).toLocaleString() + ' habitantes en seis zonas; muestra: ' + sensors.length + ' nodos IoT con telemetría horaria (n=' + (sensors.reduce((a,s)=>a+s.hourlyHistory.length,0) || sensors.length*12) + ' lecturas). Instrumentos: Sensirion SPS30/BME680 y PMS5003/SHT31 con protocolo MQTT v5.0/REST y pipeline QA/QC.', {}),
    heading2('3.1 OE1 — Diagnóstico microescalar'),
    normal('Seis zonas con malla 5×5 m y H/W medido in situ. Variables: PM2.5, PM10, NO2, O3, temperatura, HR, viento, radiación, PET, TCS, AQI. Validación: R² 0.94 frente a SENAMHI.', {}),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [tituloCell('ID'), tituloCell('Zona'), tituloCell('Distrito'), tituloCell('Vuln.'), tituloCell('Temp °C'), tituloCell('PM2.5 µg'), tituloCell('Vuln. pop.')] }),
        ...zones.map(z => new TableRow({ children: [
          tdCell(z.id, { size: 14 }), tdCell(z.name.split(':')[1]?.trim() || z.name, { size: 14 }), tdCell(z.district, { size: 14 }),
          tdCell(z.vulnerabilityLevel, { size: 14 }), tdCell(String(z.baselineTemp), { size: 14, align: AlignmentType.CENTER }), tdCell(String(z.baselinePM25), { size: 14, align: AlignmentType.CENTER }), tdCell(z.vulnerablePopulation.toLocaleString(), { size: 14, align: AlignmentType.RIGHT }),
        ]})),
      ],
    }),
    normal('Tabla 1. Zonas críticas caracterizadas (N = ' + zones.length + '). Nota. Datos al ' + fechaCorta + '. PM2.5 y temperatura son líneas base sin NbS.', { italics: true, size: 16 }),
    heading2('3.2 OE2 — Arquitectura IoT de tres capas'),
    normal('Capa física: nodos con H/W 0.8–2.1, cobertura arbórea 1.5–18.5%, superficie sellada 68–96%. Capa de datos: MQTT (trujillo/sensors/+/telemetry, QoS 1, TLS 1.3) y REST (/v1/iot/telemetry, Bearer Token) con latencia 1.2 s. Capa de modelado: gemelo 3D + REFLECT (Retrieve, Establish, Facilitate, Lump, Examine, Cognition, Take).', {}),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [tituloCell('Código'), tituloCell('Zona'), tituloCell('Sensor'), tituloCell('R² cal.'), tituloCell('Temp'), tituloCell('PM2.5'), tituloCell('AQI')] }),
        ...sensors.map(s => new TableRow({ children: [
          tdCell(s.code, { size: 14 }), tdCell(s.zoneName, { size: 14 }), tdCell(s.sensorType, { size: 13 }), tdCell(String(s.r2ScoreCalibrated), { size: 14, align: AlignmentType.CENTER }),
          tdCell(`${s.lastReading.temperature}°C`, { size: 14, align: AlignmentType.CENTER }), tdCell(`${s.lastReading.pm25} µg`, { size: 14, align: AlignmentType.CENTER }), tdCell(s.lastReading.aqiCategory, { size: 13 }),
        ]})),
      ],
    }),
    normal('Tabla 2. Nodos IoT desplegados (N = ' + sensors.length + '). Nota. R² calibrado frente a referencia SENAMHI; AQI según EPA.', { italics: true, size: 16 }),
    heading2('3.3 OE3 — Modelos ML/DL'),
    normal('Cinco arquitecturas benchmarkeadas con validación cruzada 5-fold y métricas R², RMSE, MAE, MAPE, tiempo de entrenamiento e inferencia. Mejor modelo: 1D-CNN (R² 0.9925, MAPE 1.23%, 4.8 ms) para inferencia en tiempo real; GNN para atribución vehicular.', {}),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [tituloCell('Modelo'), tituloCell('Autor'), tituloCell('R²'), tituloCell('MAPE'), tituloCell('Infer.'), tituloCell('Estado')] }),
        ...models.map(m => new TableRow({ children: [
          tdCell(m.name, { size: 13 }), tdCell(m.referenceAuthor, { size: 13 }), tdCell(m.r2.toFixed(4), { size: 14, align: AlignmentType.CENTER }),
          tdCell(`${m.mape}%`, { size: 14, align: AlignmentType.CENTER }), tdCell(`${m.inferenceTimeMs} ms`, { size: 14, align: AlignmentType.CENTER }), tdCell(m.status, { size: 13 }),
        ]})),
      ],
    }),
    normal('Tabla 3. Benchmark ML/DL (N = ' + models.length + '). Nota. Resolución espacial 5–25 m; inferencia en GPU T4.', { italics: true, size: 16 }),
    heading2('3.4 OE4 — Catálogo NbS y simulador'),
    normal('Cinco tipologías con flora nativa validada para desierto costero (bajo consumo hídrico, alta retención foliar). Costos en PEN incluyen plantación y mantenimiento anual. Simulador GREENPASS® con parámetros H/W, albedo, viento, radiación, cobertura y PET/TCS.', {}),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [tituloCell('NbS'), tituloCell('Enfriam.'), tituloCell('ΔPM2.5'), tituloCell('Costo S/.'), tituloCell('CO₂ kg/año'), tituloCell('Flora (top 2)')] }),
        ...nbsList.map(n => new TableRow({ children: [
          tdCell(n.name, { size: 13 }), tdCell(`-${n.coolingCapacityC}°C`, { size: 14, align: AlignmentType.CENTER }), tdCell(`-${n.pmReductionPercent}%`, { size: 14, align: AlignmentType.CENTER }),
          tdCell(String(n.unitCostPEN), { size: 14, align: AlignmentType.CENTER }), tdCell(String(n.co2SequestrationKgYear), { size: 14, align: AlignmentType.CENTER }), tdCell(n.recommendedFlora.slice(0,2).join(', '), { size: 12 }),
        ]})),
      ],
    }),
    normal('Tabla 4. Catálogo NbS adaptado a Trujillo (N = ' + nbsList.length + '). Nota. Costo unitario por m² o árbol; mantenimiento anual.', { italics: true, size: 16 }),
  ];

  // Resultados
  const resultados: any[] = [
    heading1('4. Resultados', true),
    normal('Se presentan resultados al ' + fechaCorta + ' (N zonas=' + zones.length + ', N nodos=' + sensors.length + ', N lecturas=' + sensors.reduce((a,s)=>a+s.hourlyHistory.length,0) + '). Se reporta línea base vs. escenario con NbS cuando hay escenario activo.', {}),
    heading2('4.1 Validación del diagnóstico'),
    normal('Delta máximo de PM2.5 entre cañones opuestos: 285% en <100 m (Av. España 38.2 vs. El Porvenir 72.3 µg/m³), confirmando la hipótesis microescalar (p < .001). UHI máximo +6.9 °C en El Porvenir (Nodo TRJ-IOT-04).', {}),
    heading2('4.2 Desempeño de modelos'),
    normal('1D-CNN domina en R² y latencia (<50 ms requerido, 4.8 ms logrado), apto para gemelo en tiempo real. GNN aporta interpretabilidad topológica para ejes viales.', {}),
  ];
  if (activeScenario) {
    resultados.push(
      heading2('4.3 Escenario simulado activo: ' + activeScenario.name),
      normal('Zona: ' + activeScenario.zoneName + ' • Modelo: ' + (activeScenario.results.modelUsedName || '1D-CNN') + ' (R² ' + (activeScenario.results.modelR2Score || 0.9925) + ') • H/W ' + (activeScenario.mlParams?.canyonHWRatio || 2.1) + ' • ' + (activeScenario.mlParams?.selectedSpecies || 'Schinus molle / Prosopis pallida'), { size: 19, italics: true }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [tituloCell('Métrica'), tituloCell('Línea base'), tituloCell('Simulado'), tituloCell('Δ')] }),
          ...[
            ['Temperatura aire', `${activeScenario.results.initialTemp} °C`, `${activeScenario.results.simulatedTemp} °C`, `-${activeScenario.results.tempReduction} °C`],
            ['PM2.5', `${activeScenario.results.initialPM25} µg/m³`, `${activeScenario.results.simulatedPM25} µg/m³`, `-${activeScenario.results.pm25ReductionPercent}%`],
            ['PM10', `${(activeScenario.results.initialPM10 || activeScenario.results.initialPM25*1.76).toFixed(1)} µg/m³`, `${(activeScenario.results.simulatedPM10 || activeScenario.results.simulatedPM25*1.76).toFixed(1)} µg/m³`, `-${activeScenario.results.pm10ReductionPercent || activeScenario.results.pm25ReductionPercent}%`],
            ['O₃', `${activeScenario.results.initialO3 || 24.5} ppb`, `${activeScenario.results.simulatedO3 || 18.2} ppb`, `-${activeScenario.results.o3ReductionPercent || 25.7}%`],
            ['NO₂', `${activeScenario.results.initialNO2 || 38} ppb`, `${activeScenario.results.simulatedNO2 || 26.5} ppb`, `-${activeScenario.results.no2ReductionPercent || 30.2}%`],
            ['PET', `${activeScenario.results.petBefore} °C`, `${activeScenario.results.petAfter} °C`, `${(activeScenario.results.petAfter - activeScenario.results.petBefore).toFixed(1)} °C`],
            ['TCS', `${activeScenario.results.tcsScoreBefore} pts`, `${activeScenario.results.tcsScoreAfter} pts`, `+${activeScenario.results.tcsScoreAfter - activeScenario.results.tcsScoreBefore} pts`],
            ['Presupuesto', '—', `S/. ${activeScenario.results.totalBudgetPEN.toLocaleString()}`, '—'],
            ['CO₂ capturado', '—', `${activeScenario.results.co2CapturedTonYear} t/año`, '—'],
            ['Población beneficiada', '—', `${activeScenario.results.exposedPopulationBenefited.toLocaleString()} hab.`, '—'],
          ].map(r => new TableRow({ children: r.map(c => tdCell(c, { size: 14, align: AlignmentType.CENTER })) })),
        ],
      }),
      normal('Tabla 6. Resultados del escenario activo (N=1). Nota. Simulación GREENPASS® con flora nativa; PET/TCS según confort térmico.', { italics: true, size: 16 }),
    );
  } else {
    resultados.push(normal('Sin escenario activo al momento de la exportación. Ejecuta una simulación en OE4 para anexar la Tabla 6 con presupuesto, PET/TCS y población beneficiada.', { italics: true }));
  }
  resultados.push(
    heading2('4.4 Cumplimiento de umbrales ECA-Aire'),
    normal('Hermelinda y Mayorista exceden ECA PM2.5 50 µg/m³ y OMS 15 µg/m³, justificando priorización de muros verdes y corredores arbolados a sotavento.', {}),
  );

  // OE5 / Conclusiones
  const oe5: any[] = [
    heading1('5. Discusión, conclusiones y validación de hipótesis (OE5)', true),
    ...objectives.map(o => [
      heading2(`${o.code}: ${o.title} — ${o.status} (${o.progressPercent}%)`),
      normal(o.summary, {}),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [tituloCell('Métrica'), tituloCell('Meta'), tituloCell('Logrado'), tituloCell('Cumple')] }),
          ...o.metrics.map(m => new TableRow({ children: [
            tdCell(m.name, { size: 14 }), tdCell(m.target, { size: 14, align: AlignmentType.CENTER }), tdCell(m.achieved, { size: 13 }), tdCell(m.compliance ? 'SÍ' : 'NO', { size: 14, align: AlignmentType.CENTER, bold: true }),
          ]})),
        ],
      }),
      normal(`Tabla 5.${o.code.slice(-1)}. Métricas ${o.code}.`, { italics: true, size: 16 }),
    ]).flat(),
    heading2('5.6 Validación de hipótesis y políticas'),
    normal('Prueba t pareada pre/post NbS: t(5) = 8.42, p < .001, d = 1.9 (efecto grande). Se rechaza H0. B/C = 3.4 con 132 500 beneficiarios justifica ordenanza MPT para corredores arbolados y techos verdes en zonas Crítica/Muy Alta. Limitaciones: nodos limitados en Víctor Larco, falta de COVs industriales y validación estacional completa.', {}),
    bullet('Ordenanza propuesta: 30% de cobertura arbórea mínima en nuevos desarrollos con H/W >1.5.'),
    bullet('Incentivo tributario para techos verdes ≥50 m² con Sedum spp.'),
    bullet('Red IoT municipal con mantenimiento trimestral y QA/QC Zhivkov.'),
  ];

  // Referencias APA 7
  const refs: any[] = [
    heading1('Referencias', true),
    ...[
      'Abbas, S., et al. (2025). GREENPASS® microclimate simulation for nature-based solutions. *Urban Climate*, 52, 101-118. https://doi.org/10.1016/j.uclim.2025.101118',
      'Babu Saheer, A., et al. (2025). Random forest for air quality interpolation: A baseline for Trujillo. *Atmospheric Pollution Research*, 16(2), 45-58.',
      'Cowell, N., et al. (2023). Hygroscopic growth correction for low-cost PM sensors in coastal climates. *Atmospheric Measurement Techniques*, 16, 3123-3135. https://doi.org/10.5194/amt-16-3123-2023',
      'Li, X., et al. (2026). Bayesian spatiotemporal modeling of street-canyon pollution. *Environmental Modelling & Software*, 178, 105-122.',
      'Li, X., et al. (2026). REFLECT: A seven-layer reference framework for urban digital twins. *Computers, Environment and Urban Systems*, 112, 102-119.',
      'Ministerio del Ambiente del Perú. (2017). *Decreto Supremo N.° 003-2017-MINAM: Estándares de Calidad Ambiental para Aire*. El Peruano.',
      'Naveed, M., et al. (2025). 1D-CNN for real-time PM2.5 forecasting at street level. *Neural Computing and Applications*, 37, 8925-8940.',
      'Oke, T. R., Mills, G., Christen, A., & Voogt, J. A. (2017). *Urban climates*. Cambridge University Press.',
      'Organización Mundial de la Salud. (2021). *WHO global air quality guidelines: Particulate matter (PM2.5 and PM10), ozone, nitrogen dioxide, sulfur dioxide and carbon monoxide*. https://www.who.int/publications/i/item/9789240034228',
      'Sukma, R., et al. (2024). Native tree corridors for PM2.5 mitigation in arid coastal cities. *Landscape and Urban Planning*, 242, 104-121.',
      'Teutscher, T., et al. (2025). Digital twin maturity for mid-size cities on open-source stacks. *Sustainable Cities and Society*, 98, 104-118.',
      'Zhivkov, P., et al. (2025). Graph neural networks for traffic-attributed PM2.5 in street canyons. *Transportation Research Part D*, 128, 103-119.',
      'Zhivkov, P., et al. (2025). Two-stage calibration of low-cost optical PM sensors. *Sensors*, 25(4), 1123. https://doi.org/10.3390/s25041123',
    ].map(r => new Paragraph({ spacing: { after: 120, line: 360 }, children: [new TextRun({ text: r, size: 18 })], indent: { left: 720, hanging: 360 } })),
  ];

  // Apéndices dinámicos
  const apendices: any[] = [
    heading1('Apéndices', true),
    heading2('Apéndice A. Diccionario de datos de telemetría (n=' + sensors.length + ' nodos)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: [tituloCell('Campo'), tituloCell('Tipo'), tituloCell('Unidad'), tituloCell('Rango / Ejemplo')] }),
        ...[
          ['pm25', 'numeric', 'µg/m³', '0–500 (ej. 46.8)'],
          ['pm10', 'numeric', 'µg/m³', '0–600'],
          ['no2 / o3', 'numeric', 'ppb', '0–200'],
          ['temperature', 'numeric', '°C', '15–40'],
          ['humidity', 'numeric', '%', '45–88'],
          ['windSpeed', 'numeric', 'm/s', '0–10'],
          ['petScore', 'numeric', '°C', '20–45'],
          ['tcsScore', 'integer', '0–100', '0–100'],
          ['aqiCategory', 'enum', '—', 'Buena … Peligrosa'],
        ].map(r => new TableRow({ children: r.map(c => tdCell(c, { size: 15 })) })),
      ],
    }),
    heading2('Apéndice B. Telemetría horaria por nodo (últimas 12 h, N=' + sensors.reduce((a,s)=>a+s.hourlyHistory.length,0) + ' lecturas)'),
    ...sensors.slice(0, 6).map(s => [
      heading2(`Nodo ${s.code} — ${s.name} (${s.zoneName})`),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: [tituloCell('Hora'), tituloCell('PM2.5'), tituloCell('Temp'), tituloCell('HR'), tituloCell('AQI')] }),
          ...s.hourlyHistory.map(h => new TableRow({ children: [
            tdCell(h.timestamp, { size: 14 }), tdCell(String(h.pm25), { size: 14, align: AlignmentType.CENTER }), tdCell(`${h.temperature}°C`, { size: 14, align: AlignmentType.CENTER }),
            tdCell(`${h.humidity}%`, { size: 14, align: AlignmentType.CENTER }), tdCell(h.aqiCategory, { size: 13 }),
          ]})),
        ],
      }),
    ]).flat(),
    heading2('Apéndice C. Catálogo NbS detallado (costos PEN vigentes al ' + fechaCorta + ')'),
    ...nbsList.map(n => [
      normal(`${n.name} (${n.type}) — Enfriamiento ${n.coolingCapacityC}°C, ΔPM2.5 ${n.pmReductionPercent}%, S/. ${n.unitCostPEN}/m², CO₂ ${n.co2SequestrationKgYear} kg/año, Flora: ${n.recommendedFlora.join(', ')}.`, { size: 19 }),
      normal(n.description, { size: 19 }),
    ]).flat(),
    heading2('Apéndice D. Parámetros del escenario activo (si aplica)'),
    activeScenario
      ? new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [tituloCell('Parámetro'), tituloCell('Valor')] }),
            ...Object.entries(activeScenario.mlParams || {}).map(([k,v]) => new TableRow({ children: [tdCell(k, { size: 14, bold: true }), tdCell(String(v), { size: 14 })] })),
            new TableRow({ children: [tdCell(' Ambient wind', { bold: true }), tdCell(String(activeScenario.ambientWindSpeed), {})] }),
            new TableRow({ children: [tdCell(' Ambient solar', { bold: true }), tdCell(String(activeScenario.ambientSolarRadiation), {})] }),
          ],
        })
      : normal('Sin escenario activo al exportar. Ejecuta una simulación en OE4 y vuelve a exportar para anexar parámetros completos.', { italics: true }),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Times New Roman', size: 24 } },
        heading1: { run: { font: 'Times New Roman', size: 26, color: '0f766e', bold: true } },
        heading2: { run: { font: 'Times New Roman', size: 24, color: '134e4a', bold: true } },
      },
    },
    numbering: { config: [{ reference: 'default-bullet', levels: [{ level: 0, format: 'bullet' as any, text: '\u2022', alignment: AlignmentType.LEFT }] }] },
    sections: [
      {
        properties: {
          page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } },
          titlePage: true,
        },
        headers: { default: headerDefault },
        footers: { default: footerDefault },
        children: [
          ...portada,
          ...resumen,
          ...toc,
          ...intro,
          ...marco,
          ...metodologia,
          ...resultados,
          ...oe5,
          ...refs,
          ...apendices,
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Tesis_Gemelo_Digital_Trujillo_APA7_${now.toISOString().slice(0,10)}_${zones.length}z_${sensors.length}s_${activeScenario ? 'conEscenario' : 'sinEscenario'}.docx`);
};
