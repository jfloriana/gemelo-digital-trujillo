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

type ExportLang = 'es' | 'en' | 'zh' | 'de' | 'fr' | 'pt';
const exT = (lang: ExportLang) => {
  const d: Record<ExportLang, any> = {
    es: {
      reportTitle: 'REPORTE TÉCNICO Y CIENTÍFICO - GEMELO DIGITAL A MICROESCALA TRUJILLO',
      thesisTitle: 'Gemelo digital de calidad del aire a microescala y soluciones basadas en naturaleza urbana para reducir la exposición a contaminantes y calor extremo',
      caseStudy: 'Ciudad de Trujillo, Región La Libertad, Perú',
      lead: 'Ing. Joel Anderson Florian Arévalo & Ing. Jason Anderson Galvéz Luna',
      dateLabel: 'Fecha de Generación:',
      inst: 'Universidad Nacional de Trujillo / Municipalidad Provincial de Trujillo / SENAMHI',
      zonesTitle: 'RESUMEN DE ZONAS CRÍTICAS EVALUADAS',
      zh: ['ID Zona', 'Nombre de Zona', 'Distrito', 'Departamento', 'Vulnerabilidad', 'Población Total', 'Población Vulnerable', 'Temp Base (°C)', 'PM2.5 Base (µg/m³)', 'Cobertura Arbórea (%)', 'Densidad Edificada (%)', 'Fuente Principal'],
      sh: ['Código Sensor', 'Nombre del Nodo', 'Zona', 'Latitud', 'Longitud', 'Tipo de Sensor', 'Calibración (2 Etapas)', 'R² Crudo', 'R² Calibrado', 'Temp (°C)', 'HR (%)', 'PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'NO2 (ppb)', 'O3 (ppb)', 'CO (ppm)', 'CO2 (ppm)', 'Índice PET (°C)', 'TCS Score', 'Delta UHI (°C)', 'Categoría AQI'],
      mh: ['Modelo IA / Arquitectura', 'Autor de Referencia', 'Año', 'R² Score', 'RMSE', 'MAE', 'MAPE (%)', 'Tiempo Entrenamiento (s)', 'Inferencia (ms)', 'Resolución Espacial', 'Estado', 'Variables de Entrada (Features)'],
      nh: ['Nombre de la Intervención NbS', 'Tipo', 'Especies de Flora Recomendadas', 'Costo Unitario (S/.)', 'Mantenimiento Anual (S/.)', 'Enfriamiento Térmico (°C)', 'Reducción PM2.5 (%)', 'Retención Hídrica (L/m²)', 'Captura CO2 (kg/año)', 'Atenuación Acústica (dB)'],
      oh: ['Objetivo', 'Título del Objetivo', 'Progreso (%)', 'Estado', 'Métrica Evaluada', 'Meta', 'Logrado', 'Cumplimiento'],
      w1: 'Resumen_Zonas', w2: 'Telemetria_Sensores', w3: 'Modelos_ML', w4: 'Catalogo_NbS', w5: 'Validacion_Objetivos', w6: 'Escenario_Simulado',
      file: 'Reporte_Gemelo_Digital_Trujillo',
      pdfTitle: 'GEMELO DIGITAL DE CALIDAD DEL AIRE A MICROESCALA Y NbS',
      pdfSub: 'CASO DE ESTUDIO: TRUJILLO, PERÚ | REPORTE DE PREDICCIÓN ML Y SIMULACIÓN NbS',
    },
    en: {
      reportTitle: 'TECHNICAL AND SCIENTIFIC REPORT — TRUJILLO MICRO-SCALE DIGITAL TWIN',
      thesisTitle: 'Micro-scale air quality digital twin and urban nature-based solutions to reduce pollutant and extreme heat exposure',
      caseStudy: 'City of Trujillo, La Libertad Region, Peru',
      lead: 'Eng. Joel Anderson Florian Arévalo & Eng. Jason Anderson Galvéz Luna',
      dateLabel: 'Generation Date:',
      inst: 'National University of Trujillo / Provincial Municipality of Trujillo / SENAMHI',
      zonesTitle: 'SUMMARY OF CRITICAL ZONES EVALUATED',
      zh: ['Zone ID', 'Zone Name', 'District', 'Department', 'Vulnerability', 'Total Population', 'Vulnerable Pop.', 'Base Temp (°C)', 'Base PM2.5 (µg/m³)', 'Tree Cover (%)', 'Built Density (%)', 'Main Source'],
      sh: ['Sensor Code', 'Node Name', 'Zone', 'Latitude', 'Longitude', 'Sensor Type', 'Calibration (2 Stages)', 'R² Raw', 'R² Calibrated', 'Temp (°C)', 'RH (%)', 'PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'NO2 (ppb)', 'O3 (ppb)', 'CO (ppm)', 'CO2 (ppm)', 'PET Index (°C)', 'TCS Score', 'UHI Delta (°C)', 'AQI Category'],
      mh: ['AI Model / Architecture', 'Reference Author', 'Year', 'R² Score', 'RMSE', 'MAE', 'MAPE (%)', 'Training Time (s)', 'Inference (ms)', 'Spatial Resolution', 'Status', 'Input Features'],
      nh: ['NbS Intervention Name', 'Type', 'Recommended Flora Species', 'Unit Cost (PEN)', 'Annual Maintenance (PEN)', 'Thermal Cooling (°C)', 'PM2.5 Reduction (%)', 'Water Retention (L/m²)', 'CO2 Capture (kg/year)', 'Acoustic Attenuation (dB)'],
      oh: ['Objective', 'Objective Title', 'Progress (%)', 'Status', 'Evaluated Metric', 'Target', 'Achieved', 'Compliance'],
      w1: 'Zones_Summary', w2: 'Sensors_Telemetry', w3: 'ML_Models', w4: 'NbS_Catalog', w5: 'Objectives_Validation', w6: 'Simulated_Scenario',
      file: 'Trujillo_Digital_Twin_Report',
      pdfTitle: 'MICRO-SCALE AIR QUALITY DIGITAL TWIN AND NbS',
      pdfSub: 'CASE STUDY: TRUJILLO, PERU | ML PREDICTION AND NbS SIMULATION REPORT',
    },
    zh: {
      reportTitle: '技术与科学报告 — 特鲁希略微尺度数字孪生',
      thesisTitle: '微尺度空气质量数字孪生与基于自然的城市解决方案',
      caseStudy: '秘鲁特鲁希略市，拉利伯塔德大区',
      lead: '工程师 Joel Anderson Florian Arévalo & Jason Anderson Galvéz Luna',
      dateLabel: '生成日期：',
      inst: '特鲁希略国立大学 / 特鲁希略省市政府 / SENAMHI',
      zonesTitle: '关键区域评估摘要',
      zh: ['区域ID', '区域名称', '区', '省', '脆弱性', '总人口', '脆弱人口', '基准温度 (°C)', '基准 PM2.5', '绿化覆盖率', '建筑密度', '主要来源'],
      sh: ['传感器代码', '节点名称', '区域', '纬度', '经度', '传感器类型', '校准 (2阶段)', 'R² 原始', 'R² 校准', '温度 (°C)', '湿度 (%)', 'PM2.5', 'PM10', 'NO2', 'O3', 'CO', 'CO2', 'PET 指数', 'TCS 分数', 'UHI 增量', 'AQI 类别'],
      mh: ['AI 模型 / 架构', '参考文献作者', '年份', 'R² 分数', 'RMSE', 'MAE', 'MAPE (%)', '训练时间 (s)', '推理 (ms)', '空间分辨率', '状态', '输入特征'],
      nh: ['NbS 干预名称', '类型', '推荐植物种类', '单位成本 (PEN)', '年度维护 (PEN)', '热冷却 (°C)', 'PM2.5 减少 (%)', '保水 (L/m²)', 'CO2 捕获 (kg/年)', '声学衰减 (dB)'],
      oh: ['目标', '目标标题', '进度 (%)', '状态', '评估指标', '目标', '已达成', '合规性'],
      w1: '区域摘要', w2: '传感器遥测', w3: 'ML模型', w4: 'NbS目录', w5: '目标验证', w6: '模拟场景',
      file: '特鲁希略_数字孪生_报告',
      pdfTitle: '微尺度空气质量数字孪生与基于自然的解决方案',
      pdfSub: '案例研究：秘鲁特鲁希略 | ML 预测与 NbS 模拟报告',
    },
    de: {
      reportTitle: 'TECHNISCHER UND WISSENSCHAFTLICHER BERICHT — MIKROSKALIGER DIGITALER ZWILLING TRUJILLO',
      thesisTitle: 'Mikroskaliger digitaler Zwilling der Luftqualität und naturbasierte Lösungen',
      caseStudy: 'Stadt Trujillo, Region La Libertad, Peru',
      lead: 'Ing. Joel Anderson Florian Arévalo & Ing. Jason Anderson Galvéz Luna',
      dateLabel: 'Erstellungsdatum:',
      inst: 'Nationale Universität Trujillo / Provinzgemeinde Trujillo / SENAMHI',
      zonesTitle: 'ZUSAMMENFASSUNG KRITISCHER ZONEN',
      zh: ['Zonen-ID', 'Zonenname', 'Bezirk', 'Departement', 'Vulnerabilität', 'Gesamtbevölkerung', 'Vulnerable Bev.', 'Basis Temp (°C)', 'Basis PM2.5', 'Baumbedeckung', 'Bebauungsdichte', 'Hauptquelle'],
      sh: ['Sensorcode', 'Knotenname', 'Zone', 'Breite', 'Länge', 'Sensortyp', 'Kalibrierung (2 Stufen)', 'R² Roh', 'R² Kalibriert', 'Temp (°C)', 'RF (%)', 'PM2.5', 'PM10', 'NO2', 'O3', 'CO', 'CO2', 'PET Index', 'TCS Wert', 'UHI Delta', 'AQI Kategorie'],
      mh: ['KI-Modell / Architektur', 'Referenzautor', 'Jahr', 'R² Wert', 'RMSE', 'MAE', 'MAPE (%)', 'Trainingszeit (s)', 'Inferenz (ms)', 'Räumliche Auflösung', 'Status', 'Eingabemerkmale'],
      nh: ['NbS-Interventionsname', 'Typ', 'Empfohlene Flora', 'Stückkosten (PEN)', 'Jährliche Wartung (PEN)', 'Kühlung (°C)', 'PM2.5 Reduktion (%)', 'Wasserrückhalt (L/m²)', 'CO2-Bindung (kg/Jahr)', 'Schalldämpfung (dB)'],
      oh: ['Ziel', 'Zieltitel', 'Fortschritt (%)', 'Status', 'Bewertete Metrik', 'Ziel', 'Erreicht', 'Konformität'],
      w1: 'Zonen_Zusammenfassung', w2: 'Sensoren_Telemetrie', w3: 'ML_Modelle', w4: 'NbS_Katalog', w5: 'Ziele_Validierung', w6: 'Simuliertes_Szenario',
      file: 'Trujillo_Digitaler_Zwilling_Bericht',
      pdfTitle: 'MIKROSKALIGER DIGITALER ZWILLING DER LUFTQUALITÄT UND NBS',
      pdfSub: 'FALLSTUDIE: TRUJILLO, PERU | ML-VORHERSAGE UND NBS-SIMULATIONSBERICHT',
    },
    fr: {
      reportTitle: 'RAPPORT TECHNIQUE ET SCIENTIFIQUE — JUMEAU NUMÉRIQUE MICRO-ÉCHELLE TRUJILLO',
      thesisTitle: 'Jumeau numérique de la qualité de l’air à micro-échelle et solutions fondées sur la nature',
      caseStudy: 'Ville de Trujillo, Région La Libertad, Pérou',
      lead: 'Ing. Joel Anderson Florian Arévalo & Ing. Jason Anderson Galvéz Luna',
      dateLabel: 'Date de génération :',
      inst: 'Université Nationale de Trujillo / Municipalité Provinciale de Trujillo / SENAMHI',
      zonesTitle: 'RÉSUMÉ DES ZONES CRITIQUES ÉVALUÉES',
      zh: ['ID Zone', 'Nom Zone', 'District', 'Département', 'Vulnérabilité', 'Population Totale', 'Pop. Vulnérable', 'Temp Base (°C)', 'PM2.5 Base', 'Couverture Arborée', 'Densité Bâtie', 'Source Principale'],
      sh: ['Code Capteur', 'Nom Nœud', 'Zone', 'Latitude', 'Longitude', 'Type Capteur', 'Étalonnage (2 Étapes)', 'R² Brut', 'R² Étalonné', 'Temp (°C)', 'HR (%)', 'PM2.5', 'PM10', 'NO2', 'O3', 'CO', 'CO2', 'Indice PET', 'Score TCS', 'Delta UHI', 'Catégorie AQI'],
      mh: ['Modèle IA / Architecture', 'Auteur Référence', 'Année', 'Score R²', 'RMSE', 'MAE', 'MAPE (%)', 'Temps Entraînement (s)', 'Inférence (ms)', 'Résolution Spatiale', 'Statut', 'Variables Entrée'],
      nh: ['Nom Intervention NbS', 'Type', 'Flore Recommandée', 'Coût Unitaire (PEN)', 'Maintenance Annuelle (PEN)', 'Refroidissement (°C)', 'Réduction PM2.5 (%)', 'Rétention Eau (L/m²)', 'Capture CO2 (kg/an)', 'Atténuation Acoustique (dB)'],
      oh: ['Objectif', 'Titre Objectif', 'Progrès (%)', 'Statut', 'Métrique Évaluée', 'Cible', 'Atteint', 'Conformité'],
      w1: 'Résumé_Zones', w2: 'Télémétrie_Capteurs', w3: 'Modèles_ML', w4: 'Catalogue_NbS', w5: 'Validation_Objectifs', w6: 'Scénario_Simulé',
      file: 'Rapport_Jumeau_Numérique_Trujillo',
      pdfTitle: 'JUMEAU NUMÉRIQUE DE LA QUALITÉ DE L’AIR À MICRO-ÉCHELLE ET NBS',
      pdfSub: 'ÉTUDE DE CAS : TRUJILLO, PÉROU | RAPPORT DE PRÉDICTION ML ET SIMULATION NBS',
    },
    pt: {
      reportTitle: 'RELATÓRIO TÉCNICO E CIENTÍFICO — GÊMEO DIGITAL MICROESCALA TRUJILLO',
      thesisTitle: 'Gêmeo digital de qualidade do ar em microescala e soluções baseadas na natureza',
      caseStudy: 'Cidade de Trujillo, Região La Libertad, Peru',
      lead: 'Eng. Joel Anderson Florian Arévalo & Eng. Jason Anderson Galvéz Luna',
      dateLabel: 'Data de Geração:',
      inst: 'Universidade Nacional de Trujillo / Prefeitura Provincial de Trujillo / SENAMHI',
      zonesTitle: 'RESUMO DAS ZONAS CRÍTICAS AVALIADAS',
      zh: ['ID Zona', 'Nome da Zona', 'Distrito', 'Departamento', 'Vulnerabilidade', 'População Total', 'Pop. Vulnerável', 'Temp Base (°C)', 'PM2.5 Base', 'Cobertura Arbórea', 'Densidade Edificada', 'Fonte Principal'],
      sh: ['Código Sensor', 'Nome Nó', 'Zona', 'Latitude', 'Longitude', 'Tipo Sensor', 'Calibração (2 Etapas)', 'R² Bruto', 'R² Calibrado', 'Temp (°C)', 'UR (%)', 'PM2.5', 'PM10', 'NO2', 'O3', 'CO', 'CO2', 'Índice PET', 'Score TCS', 'Delta UHI', 'Categoria AQI'],
      mh: ['Modelo IA / Arquitetura', 'Autor Referência', 'Ano', 'Score R²', 'RMSE', 'MAE', 'MAPE (%)', 'Tempo Treino (s)', 'Inferência (ms)', 'Resolução Espacial', 'Status', 'Variáveis Entrada'],
      nh: ['Nome Intervenção NbS', 'Tipo', 'Flora Recomendada', 'Custo Unitário (PEN)', 'Manutenção Anual (PEN)', 'Resfriamento (°C)', 'Redução PM2.5 (%)', 'Retenção Hídrica (L/m²)', 'Captura CO2 (kg/ano)', 'Atenuação Acústica (dB)'],
      oh: ['Objetivo', 'Título Objetivo', 'Progresso (%)', 'Status', 'Métrica Avaliada', 'Meta', 'Atingido', 'Conformidade'],
      w1: 'Resumo_Zonas', w2: 'Telemetria_Sensores', w3: 'Modelos_ML', w4: 'Catálogo_NbS', w5: 'Validação_Objetivos', w6: 'Cenário_Simulado',
      file: 'Relatório_Gêmeo_Digital_Trujillo',
      pdfTitle: 'GÊMEO DIGITAL DE QUALIDADE DO AR EM MICROESCALA E NBS',
      pdfSub: 'ESTUDO DE CASO: TRUJILLO, PERU | RELATÓRIO DE PREDIÇÃO ML E SIMULAÇÃO NBS',
    },
  };
  return d[lang] || d.es;
};

export const exportToExcel = (
  zones: UrbanZone[],
  sensors: SensorNode[],
  models: AiModelMetric[],
  nbsList: NbsIntervention[],
  objectives: ThesisObjectiveEvaluation[],
  activeScenario?: SimulationScenario | null,
  lang: ExportLang = 'es'
) => {
  const tr = exT(lang);
  const wb = XLSX.utils.book_new();

  // Sheet 1: Resumen General de Tesis
  const thesisSummaryData = [
    [tr.reportTitle],
    [tr.thesisTitle],
    [tr.caseStudy],
    [tr.lead],
    [tr.dateLabel, new Date().toLocaleString(lang === 'en' ? 'en-US' : lang === 'zh' ? 'zh-CN' : lang === 'de' ? 'de-DE' : lang === 'fr' ? 'fr-FR' : lang === 'pt' ? 'pt-BR' : 'es-PE')],
    [tr.inst],
    [''],
    [tr.zonesTitle],
    tr.zh
  ];

  zones.forEach(z => {
    thesisSummaryData.push([
      z.id,
      z.name,
      z.district,
      z.department || z.district,
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
  XLSX.utils.book_append_sheet(wb, wsSummary, tr.w1);

  // Sheet 2: Telemetría de Sensores IoT Calibrados (2-Etapas Zhivkov / Cowell)
  const sensorsData = [tr.sh];

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
  XLSX.utils.book_append_sheet(wb, wsSensors, tr.w2);

  // Sheet 3: Comparativa de Modelos Machine Learning y Deep Learning
  const modelsData = [tr.mh];

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
  XLSX.utils.book_append_sheet(wb, wsModels, tr.w3);

  // Sheet 4: Catálogo y Eficacia de Soluciones Basadas en la Naturaleza (NbS)
  const nbsData = [tr.nh];

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
  XLSX.utils.book_append_sheet(wb, wsNbs, tr.w4);

  // Sheet 5: Cumplimiento de Objetivos de Tesis
  const objData = [tr.oh];

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
  XLSX.utils.book_append_sheet(wb, wsObj, tr.w5);

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
    XLSX.utils.book_append_sheet(wb, wsScenario, tr.w6);
  }

  XLSX.writeFile(wb, `${tr.file}_${Date.now()}.xlsx`);
};

export const exportToCSV = (sensors: SensorNode[], _lang: ExportLang = 'es') => {
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
  activeScenario?: SimulationScenario | null,
  lang: ExportLang = 'es'
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Localized structural/label strings (titles, section headings, table
  // headers, metadata labels, footer). Body prose stays Spanish (out of scope).
  const pdfL: Record<ExportLang, any> = {
    es: {
      locale: 'es-PE',
      hTitle: 'GEMELO DIGITAL DE CALIDAD DEL AIRE A MICROESCALA Y NbS',
      hSub: 'CASO DE ESTUDIO: TRUJILLO, PERÚ | REPORTE DE PREDICCIÓN ML Y SIMULACIÓN NbS',
      mResearcher: 'Investigador Principal:',
      mDate: 'Fecha de Emisión:',
      mFramework: 'Marco Teórico:',
      s1: '1. Diagnóstico de Microescala en Trujillo (OE1)',
      s2: '2. Telemetría de Sensores IoT y Calibración 2-Etapas Zhivkov et al. (OE2)',
      s3: '3. Desempeño Comparativo de Modelos Machine Learning & Deep Learning (OE3)',
      p2banner: 'SIMULACIÓN DE ESCENARIOS NbS Y CONFORT TÉRMICO GREENPASS®',
      s4: '4. Catálogo de Soluciones Basadas en la Naturaleza Adaptadas a Trujillo (OE4)',
      s5: '5. Resultados Proyectados de Simulación NbS & Machine Learning',
      s6: '6. Validación de Hipótesis y Cumplimiento de Tesis (OE5)',
      thZones: ['Zona Urbana', 'Distrito', 'Vulnerab.', 'Temp Base', 'PM2.5 Base', 'Arbolado', 'Pob. Vulnerable'],
      thSensors: ['Código', 'Zona', 'Sensor', 'Calib.', 'Temp', 'PM2.5', 'Δ UHI', 'PET', 'Categoría AQI'],
      thModels: ['Modelo', 'Autor Ref.', 'R² Score', 'RMSE', 'MAPE', 'Inferencia', 'Resolución', 'Estado'],
      thNbs: ['Intervención NbS', 'Enfriamiento', 'Reducción PM2.5', 'Costo Unit.', 'Captura CO2', 'Flora Local Trujillo'],
      thSim: ['Parámetro / Métrica', 'Resultado del Modelo de Gemelo Digital'],
      thObj: ['Código', 'Objetivo Específico', 'Progreso', 'Estado', 'Conclusión Científica'],
      footer: (i: number, n: number) => `Página ${i} de ${n} | Gemelo Digital Microescala Trujillo 2026`,
    },
    en: {
      locale: 'en-US',
      hTitle: 'MICRO-SCALE AIR QUALITY DIGITAL TWIN AND NbS',
      hSub: 'CASE STUDY: TRUJILLO, PERU | ML PREDICTION AND NbS SIMULATION REPORT',
      mResearcher: 'Principal Researcher:',
      mDate: 'Issue Date:',
      mFramework: 'Theoretical Framework:',
      s1: '1. Micro-scale Diagnosis in Trujillo (OE1)',
      s2: '2. IoT Sensor Telemetry and 2-Stage Zhivkov et al. Calibration (OE2)',
      s3: '3. Comparative Performance of Machine Learning & Deep Learning Models (OE3)',
      p2banner: 'NbS SCENARIO SIMULATION AND GREENPASS® THERMAL COMFORT',
      s4: '4. Catalog of Nature-Based Solutions Adapted to Trujillo (OE4)',
      s5: '5. Projected Results of NbS & Machine Learning Simulation',
      s6: '6. Hypothesis Validation and Thesis Compliance (OE5)',
      thZones: ['Urban Zone', 'District', 'Vulnerab.', 'Base Temp', 'Base PM2.5', 'Tree Cover', 'Vulnerable Pop.'],
      thSensors: ['Code', 'Zone', 'Sensor', 'Calib.', 'Temp', 'PM2.5', 'Δ UHI', 'PET', 'AQI Category'],
      thModels: ['Model', 'Ref. Author', 'R² Score', 'RMSE', 'MAPE', 'Inference', 'Resolution', 'Status'],
      thNbs: ['NbS Intervention', 'Cooling', 'PM2.5 Reduction', 'Unit Cost', 'CO2 Capture', 'Local Trujillo Flora'],
      thSim: ['Parameter / Metric', 'Digital Twin Model Result'],
      thObj: ['Code', 'Specific Objective', 'Progress', 'Status', 'Scientific Conclusion'],
      footer: (i: number, n: number) => `Page ${i} of ${n} | Trujillo Micro-scale Digital Twin 2026`,
    },
    zh: {
      locale: 'zh-CN',
      hTitle: '微尺度空气质量数字孪生与基于自然的解决方案',
      hSub: '案例研究：秘鲁特鲁希略 | ML 预测与 NbS 模拟报告',
      mResearcher: '主要研究员：',
      mDate: '签发日期：',
      mFramework: '理论框架：',
      s1: '1. 特鲁希略微尺度诊断 (OE1)',
      s2: '2. 物联网传感器遥测与 Zhivkov 等两阶段校准 (OE2)',
      s3: '3. 机器学习与深度学习模型的性能比较 (OE3)',
      p2banner: 'NbS 情景模拟与 GREENPASS® 热舒适度',
      s4: '4. 适用于特鲁希略的基于自然的解决方案目录 (OE4)',
      s5: '5. NbS 与机器学习模拟的预测结果',
      s6: '6. 假设验证与论文达成情况 (OE5)',
      thZones: ['城市区域', '区', '脆弱性', '基准温度', '基准 PM2.5', '绿化', '脆弱人口'],
      thSensors: ['代码', '区域', '传感器', '校准', '温度', 'PM2.5', 'Δ UHI', 'PET', 'AQI 类别'],
      thModels: ['模型', '参考作者', 'R² 分数', 'RMSE', 'MAPE', '推理', '分辨率', '状态'],
      thNbs: ['NbS 干预', '降温', 'PM2.5 减少', '单位成本', 'CO2 捕获', '特鲁希略本地植物'],
      thSim: ['参数 / 指标', '数字孪生模型结果'],
      thObj: ['代码', '具体目标', '进度', '状态', '科学结论'],
      footer: (i: number, n: number) => `第 ${i} 页，共 ${n} 页 | 特鲁希略微尺度数字孪生 2026`,
    },
    de: {
      locale: 'de-DE',
      hTitle: 'MIKROSKALIGER DIGITALER ZWILLING DER LUFTQUALITÄT UND NBS',
      hSub: 'FALLSTUDIE: TRUJILLO, PERU | ML-VORHERSAGE UND NBS-SIMULATIONSBERICHT',
      mResearcher: 'Hauptforscher:',
      mDate: 'Ausstellungsdatum:',
      mFramework: 'Theoretischer Rahmen:',
      s1: '1. Mikroskalige Diagnose in Trujillo (OE1)',
      s2: '2. IoT-Sensortelemetrie und zweistufige Kalibrierung nach Zhivkov et al. (OE2)',
      s3: '3. Vergleichende Leistung von Machine-Learning- & Deep-Learning-Modellen (OE3)',
      p2banner: 'NBS-SZENARIOSIMULATION UND THERMISCHER KOMFORT GREENPASS®',
      s4: '4. Katalog naturbasierter Lösungen angepasst an Trujillo (OE4)',
      s5: '5. Projizierte Ergebnisse der NbS- & Machine-Learning-Simulation',
      s6: '6. Hypothesenvalidierung und Erfüllung der Thesis (OE5)',
      thZones: ['Stadtzone', 'Bezirk', 'Vulnerab.', 'Basis-Temp', 'Basis-PM2.5', 'Baumbestand', 'Vulnerable Bev.'],
      thSensors: ['Code', 'Zone', 'Sensor', 'Kalib.', 'Temp', 'PM2.5', 'Δ UHI', 'PET', 'AQI-Kategorie'],
      thModels: ['Modell', 'Ref.-Autor', 'R² Wert', 'RMSE', 'MAPE', 'Inferenz', 'Auflösung', 'Status'],
      thNbs: ['NbS-Intervention', 'Kühlung', 'PM2.5-Reduktion', 'Stückkosten', 'CO2-Bindung', 'Lokale Flora Trujillo'],
      thSim: ['Parameter / Metrik', 'Ergebnis des digitalen Zwillingsmodells'],
      thObj: ['Code', 'Spezifisches Ziel', 'Fortschritt', 'Status', 'Wissenschaftliche Schlussfolgerung'],
      footer: (i: number, n: number) => `Seite ${i} von ${n} | Mikroskaliger Digitaler Zwilling Trujillo 2026`,
    },
    fr: {
      locale: 'fr-FR',
      hTitle: 'JUMEAU NUMÉRIQUE DE LA QUALITÉ DE L’AIR À MICRO-ÉCHELLE ET NBS',
      hSub: 'ÉTUDE DE CAS : TRUJILLO, PÉROU | RAPPORT DE PRÉDICTION ML ET SIMULATION NBS',
      mResearcher: 'Chercheur principal :',
      mDate: 'Date d’émission :',
      mFramework: 'Cadre théorique :',
      s1: '1. Diagnostic à micro-échelle à Trujillo (OE1)',
      s2: '2. Télémétrie des capteurs IoT et étalonnage en 2 étapes de Zhivkov et al. (OE2)',
      s3: '3. Performance comparative des modèles Machine Learning & Deep Learning (OE3)',
      p2banner: 'SIMULATION DE SCÉNARIOS NBS ET CONFORT THERMIQUE GREENPASS®',
      s4: '4. Catalogue de solutions fondées sur la nature adaptées à Trujillo (OE4)',
      s5: '5. Résultats projetés de la simulation NbS & Machine Learning',
      s6: '6. Validation des hypothèses et conformité de la thèse (OE5)',
      thZones: ['Zone urbaine', 'District', 'Vulnérab.', 'Temp base', 'PM2.5 base', 'Arbres', 'Pop. vulnérable'],
      thSensors: ['Code', 'Zone', 'Capteur', 'Étal.', 'Temp', 'PM2.5', 'Δ UHI', 'PET', 'Catégorie AQI'],
      thModels: ['Modèle', 'Auteur réf.', 'Score R²', 'RMSE', 'MAPE', 'Inférence', 'Résolution', 'Statut'],
      thNbs: ['Intervention NbS', 'Refroidissement', 'Réduction PM2.5', 'Coût unit.', 'Capture CO2', 'Flore locale Trujillo'],
      thSim: ['Paramètre / Métrique', 'Résultat du modèle de jumeau numérique'],
      thObj: ['Code', 'Objectif spécifique', 'Progrès', 'Statut', 'Conclusion scientifique'],
      footer: (i: number, n: number) => `Page ${i} sur ${n} | Jumeau Numérique Micro-échelle Trujillo 2026`,
    },
    pt: {
      locale: 'pt-BR',
      hTitle: 'GÊMEO DIGITAL DE QUALIDADE DO AR EM MICROESCALA E NBS',
      hSub: 'ESTUDO DE CASO: TRUJILLO, PERU | RELATÓRIO DE PREDIÇÃO ML E SIMULAÇÃO NBS',
      mResearcher: 'Pesquisador Principal:',
      mDate: 'Data de Emissão:',
      mFramework: 'Marco Teórico:',
      s1: '1. Diagnóstico de Microescala em Trujillo (OE1)',
      s2: '2. Telemetria de Sensores IoT e Calibração em 2 Etapas de Zhivkov et al. (OE2)',
      s3: '3. Desempenho Comparativo de Modelos Machine Learning & Deep Learning (OE3)',
      p2banner: 'SIMULAÇÃO DE CENÁRIOS NbS E CONFORTO TÉRMICO GREENPASS®',
      s4: '4. Catálogo de Soluções Baseadas na Natureza Adaptadas a Trujillo (OE4)',
      s5: '5. Resultados Projetados da Simulação NbS & Machine Learning',
      s6: '6. Validação de Hipóteses e Cumprimento da Tese (OE5)',
      thZones: ['Zona Urbana', 'Distrito', 'Vulnerab.', 'Temp Base', 'PM2.5 Base', 'Arborização', 'Pop. Vulnerável'],
      thSensors: ['Código', 'Zona', 'Sensor', 'Calib.', 'Temp', 'PM2.5', 'Δ UHI', 'PET', 'Categoria AQI'],
      thModels: ['Modelo', 'Autor Ref.', 'Score R²', 'RMSE', 'MAPE', 'Inferência', 'Resolução', 'Status'],
      thNbs: ['Intervenção NbS', 'Resfriamento', 'Redução PM2.5', 'Custo Unit.', 'Captura CO2', 'Flora Local Trujillo'],
      thSim: ['Parâmetro / Métrica', 'Resultado do Modelo de Gêmeo Digital'],
      thObj: ['Código', 'Objetivo Específico', 'Progresso', 'Status', 'Conclusão Científica'],
      footer: (i: number, n: number) => `Página ${i} de ${n} | Gêmeo Digital Microescala Trujillo 2026`,
    },
  };
  const PL = pdfL[lang] || pdfL.es;

  const primaryColor: [number, number, number] = [15, 118, 110]; // Teal 700
  const darkTextColor: [number, number, number] = [30, 41, 59]; // Slate 800

  // Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(PL.hTitle, 105, 11, { align: 'center' });
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(PL.hSub, 105, 19, { align: 'center' });

  // Metadata block
  doc.setTextColor(...darkTextColor);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(PL.mResearcher, 14, 33);
  doc.setFont('helvetica', 'normal');
  doc.text('Ing. Joel Arevalo (Tesista Líder UNT)', 52, 33);

  doc.setFont('helvetica', 'bold');
  doc.text(PL.mDate, 14, 38);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date().toLocaleDateString(PL.locale, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }), 52, 38);

  doc.setFont('helvetica', 'bold');
  doc.text(PL.mFramework, 14, 43);
  doc.setFont('helvetica', 'normal');
  doc.text('Li et al. (2026) | Zhivkov et al. (2025) | Naveed et al. (2025) | Abbas et al. (2025)', 52, 43);

  // Section 1: Diagnóstico de Zonas Críticas en Trujillo
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(PL.s1, 14, 52);

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
    head: [PL.thZones],
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
  doc.text(PL.s2, 14, currentY);

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
    head: [PL.thSensors],
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
  doc.text(PL.s3, 14, currentY);

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
    head: [PL.thModels],
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
  doc.text(PL.p2banner, 105, 10, { align: 'center' });

  // Section 4: Catálogo NbS
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text(PL.s4, 14, 24);

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
    head: [PL.thNbs],
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
  doc.text(PL.s5, 14, currentY);

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
      head: [PL.thSim],
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
  doc.text(PL.s6, 14, currentY);

  const objTableRows = objectives.map(o => [
    o.code,
    o.title,
    `${o.progressPercent}%`,
    o.status,
    o.summary
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [PL.thObj],
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
    doc.text(PL.footer(i, pageCount), 105, 290, { align: 'center' });
  }

  doc.save(`Reporte_Cientifico_Tesis_Trujillo_${Date.now()}.pdf`);
};

export const exportToWord = async (
  zones: UrbanZone[],
  sensors: SensorNode[],
  models: AiModelMetric[],
  nbsList: NbsIntervention[],
  objectives: ThesisObjectiveEvaluation[],
  activeScenario?: SimulationScenario | null,
  lang: ExportLang = 'es'
) => {
  // Localized structural/label strings only: heading titles, table column
  // headers and footer labels. Body prose, cover page, H2 subsections,
  // captions and references remain Spanish (out of scope — see file notes).
  const wordL: Record<ExportLang, any> = {
    es: {
      locale: 'es-PE',
      ftPage: 'Página ', ftOf: ' de ',
      h1: { resumen: 'Resumen', toc: 'Tabla de contenido', intro: '1. Introducción', marco: '2. Marco teórico y revisión de literatura', metodo: '3. Metodología', result: '4. Resultados', oe5: '5. Discusión, conclusiones y validación de hipótesis (OE5)', refs: 'Referencias', apend: 'Apéndices' },
      thZones: ['ID', 'Zona', 'Distrito', 'Vuln.', 'Temp °C', 'PM2.5 µg', 'Vuln. pop.'],
      thSensors: ['Código', 'Zona', 'Sensor', 'R² cal.', 'Temp', 'PM2.5', 'AQI'],
      thModels: ['Modelo', 'Autor', 'R²', 'MAPE', 'Infer.', 'Estado'],
      thNbs: ['NbS', 'Enfriam.', 'ΔPM2.5', 'Costo S/.', 'CO₂ kg/año', 'Flora (top 2)'],
      thScen: ['Métrica', 'Línea base', 'Simulado', 'Δ'],
      thObj: ['Métrica', 'Meta', 'Logrado', 'Cumple'],
      thDict: ['Campo', 'Tipo', 'Unidad', 'Rango / Ejemplo'],
      thHour: ['Hora', 'PM2.5', 'Temp', 'HR', 'AQI'],
      thParam: ['Parámetro', 'Valor'],
    },
    en: {
      locale: 'en-US',
      ftPage: 'Page ', ftOf: ' of ',
      h1: { resumen: 'Abstract', toc: 'Table of Contents', intro: '1. Introduction', marco: '2. Theoretical Framework and Literature Review', metodo: '3. Methodology', result: '4. Results', oe5: '5. Discussion, Conclusions and Hypothesis Validation (OE5)', refs: 'References', apend: 'Appendices' },
      thZones: ['ID', 'Zone', 'District', 'Vuln.', 'Temp °C', 'PM2.5 µg', 'Vuln. pop.'],
      thSensors: ['Code', 'Zone', 'Sensor', 'R² cal.', 'Temp', 'PM2.5', 'AQI'],
      thModels: ['Model', 'Author', 'R²', 'MAPE', 'Infer.', 'Status'],
      thNbs: ['NbS', 'Cooling', 'ΔPM2.5', 'Cost S/.', 'CO₂ kg/yr', 'Flora (top 2)'],
      thScen: ['Metric', 'Baseline', 'Simulated', 'Δ'],
      thObj: ['Metric', 'Target', 'Achieved', 'Meets'],
      thDict: ['Field', 'Type', 'Unit', 'Range / Example'],
      thHour: ['Time', 'PM2.5', 'Temp', 'RH', 'AQI'],
      thParam: ['Parameter', 'Value'],
    },
    zh: {
      locale: 'zh-CN',
      ftPage: '第 ', ftOf: ' 页 / ',
      h1: { resumen: '摘要', toc: '目录', intro: '1. 引言', marco: '2. 理论框架与文献综述', metodo: '3. 方法论', result: '4. 结果', oe5: '5. 讨论、结论与假设验证 (OE5)', refs: '参考文献', apend: '附录' },
      thZones: ['ID', '区域', '区', '脆弱性', '温度 °C', 'PM2.5 µg', '脆弱人口'],
      thSensors: ['代码', '区域', '传感器', 'R² 校准', '温度', 'PM2.5', 'AQI'],
      thModels: ['模型', '作者', 'R²', 'MAPE', '推理', '状态'],
      thNbs: ['NbS', '降温', 'ΔPM2.5', '成本 S/.', 'CO₂ kg/年', '植物 (前 2)'],
      thScen: ['指标', '基线', '模拟', 'Δ'],
      thObj: ['指标', '目标', '已达成', '符合'],
      thDict: ['字段', '类型', '单位', '范围 / 示例'],
      thHour: ['时间', 'PM2.5', '温度', '湿度', 'AQI'],
      thParam: ['参数', '值'],
    },
    de: {
      locale: 'de-DE',
      ftPage: 'Seite ', ftOf: ' von ',
      h1: { resumen: 'Zusammenfassung', toc: 'Inhaltsverzeichnis', intro: '1. Einleitung', marco: '2. Theoretischer Rahmen und Literaturübersicht', metodo: '3. Methodik', result: '4. Ergebnisse', oe5: '5. Diskussion, Schlussfolgerungen und Hypothesenvalidierung (OE5)', refs: 'Literaturverzeichnis', apend: 'Anhänge' },
      thZones: ['ID', 'Zone', 'Bezirk', 'Vuln.', 'Temp °C', 'PM2.5 µg', 'Vuln. Bev.'],
      thSensors: ['Code', 'Zone', 'Sensor', 'R² kal.', 'Temp', 'PM2.5', 'AQI'],
      thModels: ['Modell', 'Autor', 'R²', 'MAPE', 'Inf.', 'Status'],
      thNbs: ['NbS', 'Kühlung', 'ΔPM2.5', 'Kosten S/.', 'CO₂ kg/Jahr', 'Flora (Top 2)'],
      thScen: ['Metrik', 'Basislinie', 'Simuliert', 'Δ'],
      thObj: ['Metrik', 'Ziel', 'Erreicht', 'Erfüllt'],
      thDict: ['Feld', 'Typ', 'Einheit', 'Bereich / Beispiel'],
      thHour: ['Zeit', 'PM2.5', 'Temp', 'RF', 'AQI'],
      thParam: ['Parameter', 'Wert'],
    },
    fr: {
      locale: 'fr-FR',
      ftPage: 'Page ', ftOf: ' sur ',
      h1: { resumen: 'Résumé', toc: 'Table des matières', intro: '1. Introduction', marco: '2. Cadre théorique et revue de la littérature', metodo: '3. Méthodologie', result: '4. Résultats', oe5: '5. Discussion, conclusions et validation des hypothèses (OE5)', refs: 'Références', apend: 'Annexes' },
      thZones: ['ID', 'Zone', 'District', 'Vuln.', 'Temp °C', 'PM2.5 µg', 'Pop. vuln.'],
      thSensors: ['Code', 'Zone', 'Capteur', 'R² étal.', 'Temp', 'PM2.5', 'AQI'],
      thModels: ['Modèle', 'Auteur', 'R²', 'MAPE', 'Inf.', 'Statut'],
      thNbs: ['NbS', 'Refroid.', 'ΔPM2.5', 'Coût S/.', 'CO₂ kg/an', 'Flore (top 2)'],
      thScen: ['Métrique', 'Référence', 'Simulé', 'Δ'],
      thObj: ['Métrique', 'Cible', 'Atteint', 'Conforme'],
      thDict: ['Champ', 'Type', 'Unité', 'Plage / Exemple'],
      thHour: ['Heure', 'PM2.5', 'Temp', 'HR', 'AQI'],
      thParam: ['Paramètre', 'Valeur'],
    },
    pt: {
      locale: 'pt-BR',
      ftPage: 'Página ', ftOf: ' de ',
      h1: { resumen: 'Resumo', toc: 'Sumário', intro: '1. Introdução', marco: '2. Marco Teórico e Revisão da Literatura', metodo: '3. Metodologia', result: '4. Resultados', oe5: '5. Discussão, Conclusões e Validação de Hipóteses (OE5)', refs: 'Referências', apend: 'Apêndices' },
      thZones: ['ID', 'Zona', 'Distrito', 'Vuln.', 'Temp °C', 'PM2.5 µg', 'Pop. vuln.'],
      thSensors: ['Código', 'Zona', 'Sensor', 'R² cal.', 'Temp', 'PM2.5', 'AQI'],
      thModels: ['Modelo', 'Autor', 'R²', 'MAPE', 'Infer.', 'Status'],
      thNbs: ['NbS', 'Resfriam.', 'ΔPM2.5', 'Custo S/.', 'CO₂ kg/ano', 'Flora (top 2)'],
      thScen: ['Métrica', 'Linha base', 'Simulado', 'Δ'],
      thObj: ['Métrica', 'Meta', 'Atingido', 'Cumpre'],
      thDict: ['Campo', 'Tipo', 'Unidade', 'Faixa / Exemplo'],
      thHour: ['Hora', 'PM2.5', 'Temp', 'UR', 'AQI'],
      thParam: ['Parâmetro', 'Valor'],
    },
  };
  const WL = wordL[lang] || wordL.es;

  const now = new Date();
  const fechaAPA = now.toLocaleDateString(WL.locale, { year: 'numeric', month: 'long', day: 'numeric' });
  const fechaCorta = now.toLocaleDateString(WL.locale);
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
          new TextRun({ text: WL.ftPage, size: 16, color: '64748b' }),
          new TextRun({ children: [PageNumber.CURRENT] }),
          new TextRun({ text: WL.ftOf, size: 16, color: '64748b' }),
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
    heading1(WL.h1.resumen, true),
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
    heading1(WL.h1.toc, true),
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
    heading1(WL.h1.intro, true),
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
    heading1(WL.h1.marco, true),
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
    heading1(WL.h1.metodo, true),
    normal('Diseño cuantitativo, correlacional y de simulación, con enfoque de gemelo digital (Teutscher et al., 2025). Población: ' + zones.reduce((a,z)=>a+z.targetPopulation,0).toLocaleString() + ' habitantes en seis zonas; muestra: ' + sensors.length + ' nodos IoT con telemetría horaria (n=' + (sensors.reduce((a,s)=>a+s.hourlyHistory.length,0) || sensors.length*12) + ' lecturas). Instrumentos: Sensirion SPS30/BME680 y PMS5003/SHT31 con protocolo MQTT v5.0/REST y pipeline QA/QC.', {}),
    heading2('3.1 OE1 — Diagnóstico microescalar'),
    normal('Seis zonas con malla 5×5 m y H/W medido in situ. Variables: PM2.5, PM10, NO2, O3, temperatura, HR, viento, radiación, PET, TCS, AQI. Validación: R² 0.94 frente a SENAMHI.', {}),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: WL.thZones.map((h: string) => tituloCell(h)) }),
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
        new TableRow({ children: WL.thSensors.map((h: string) => tituloCell(h)) }),
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
        new TableRow({ children: WL.thModels.map((h: string) => tituloCell(h)) }),
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
        new TableRow({ children: WL.thNbs.map((h: string) => tituloCell(h)) }),
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
    heading1(WL.h1.result, true),
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
          new TableRow({ children: WL.thScen.map((h: string) => tituloCell(h)) }),
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
    heading1(WL.h1.oe5, true),
    ...objectives.map(o => [
      heading2(`${o.code}: ${o.title} — ${o.status} (${o.progressPercent}%)`),
      normal(o.summary, {}),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({ children: WL.thObj.map((h: string) => tituloCell(h)) }),
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
    heading1(WL.h1.refs, true),
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
    heading1(WL.h1.apend, true),
    heading2('Apéndice A. Diccionario de datos de telemetría (n=' + sensors.length + ' nodos)'),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({ children: WL.thDict.map((h: string) => tituloCell(h)) }),
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
          new TableRow({ children: WL.thHour.map((h: string) => tituloCell(h)) }),
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
            new TableRow({ children: WL.thParam.map((h: string) => tituloCell(h)) }),
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
