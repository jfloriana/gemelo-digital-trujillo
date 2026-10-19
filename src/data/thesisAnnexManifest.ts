export interface ThesisFigure {
  id: string;
  file: string;
  caption: string;
}

export interface ThesisTable {
  id: string;
  file: string;
  caption: string;
}

/**
 * Figuras y tablas extraídas directamente del informe de tesis
 * (GemeloDigital_SBN.docx), más 7 capturas nuevas del sistema en
 * producción (Captura 1-7, no incluidas en el Word original — ver
 * GemeloDigital_SBN_Interpretacion_Figuras.docx). Las imágenes viven en
 * public/thesis/figures/ y las tablas en public/thesis/tables/ (CSV),
 * descargables desde la app.
 */
export const THESIS_FIGURES: ThesisFigure[] = [
  { id: 'Figura 1', file: '/thesis/figures/figura_01.png', caption: 'Distribución de las 31 fuentes del corpus analítico por (a) año de publicación, (b) escala espacial y (c) tecnología o enfoque primario.' },
  { id: 'Figura 2', file: '/thesis/figures/figura_02.png', caption: 'Marco de referencia de cinco capas para gemelos digitales de calidad del aire a microescala acoplados a SBN.' },
  { id: 'Figura 3', file: '/thesis/figures/figura_03.png', caption: 'Magnitudes reportadas: (a) reducción de temperatura y (b) cambios en contaminantes.' },
  { id: 'Figura 4', file: '/thesis/figures/figura_04.png', caption: 'Interfaz del prototipo de Trujillo: visor tridimensional del cañón del Centro Histórico con telemetría y simulación con SBN.' },
  { id: 'Figura 5', file: '/thesis/figures/figura_05.png', caption: 'Módulos del prototipo: integración IoT, calibración en dos etapas, inyector de paquetes y simulador de SBN.' },
  { id: 'Figura A1', file: '/thesis/figures/figura_a1.png', caption: 'Reporte automático de la plataforma, página 1 de 3: diagnóstico de microescala por zona (OE1) y telemetría IoT (OE2).' },
  { id: 'Figura A2', file: '/thesis/figures/figura_a2.png', caption: 'Reporte automático de la plataforma, página 2 de 3: contraste con la referencia pública y desempeño de modelos (OE3).' },
  { id: 'Figura A3', file: '/thesis/figures/figura_a3.png', caption: 'Reporte automático de la plataforma, página 3 de 3: catálogo de SBN (OE4) y matriz de cumplimiento de objetivos (OE5).' },
  { id: 'Figura B1', file: '/thesis/figures/figura_b1.png', caption: 'Pantalla de inicio de sesión: módulos de calibración, aprendizaje, simulador de SBN y políticas públicas, accesos por rol.' },
  { id: 'Figura B2', file: '/thesis/figures/figura_b2.png', caption: 'Módulo OE1, diagnóstico de la variabilidad microescalar: alertas ECA/OMS/calor y fichas de las 14 zonas.' },
  { id: 'Figura B3', file: '/thesis/figures/figura_b3.png', caption: 'Módulo de monitoreo IoT: protocolo de comunicación, calibración en dos etapas e inyector de paquetes.' },
  { id: 'Figura B4', file: '/thesis/figures/figura_b4.png', caption: 'Módulo OE2, arquitectura del gemelo en tres capas y pasos del marco conceptual REFLECT.' },
  { id: 'Figura B5', file: '/thesis/figures/figura_b5.png', caption: 'Módulo OE3, modelos de aprendizaje: tarjetas de modelos, arquitectura 1D-CNN, importancia de variables y pronóstico 24h.' },
  { id: 'Figura B6', file: '/thesis/figures/figura_b6.png', caption: 'Laboratorio de entrenamiento: conjunto de 96 filas (24 de referencia pública y 72 de nodos calibrados).' },
  { id: 'Figura B7', file: '/thesis/figures/figura_b7.png', caption: 'Módulo OE5, validación y política pública: cobertura de monitoreo, dictamen y matriz de cumplimiento.' },
  { id: 'Figura B8', file: '/thesis/figures/figura_b8.png', caption: 'Centro de exportación de reportes (Excel, PDF, Word y CSV) y vista previa de los datos compilados por zona.' },
  { id: 'Captura 1', file: '/thesis/figures/captura_01_hub3d.jpg', caption: 'Hub 3D en vivo del sistema en producción (19-oct-2026): cañón urbano del Centro Histórico con malla discretizada de 5×5 m y telemetría sincronizada en tiempo real.' },
  { id: 'Captura 2', file: '/thesis/figures/captura_02_oe1_diagnostico.jpg', caption: 'Módulo OE1 en producción: alertas ECA-Aire/OMS/calor y catálogo de zonas filtrable por departamento, con datos en vivo.' },
  { id: 'Captura 3', file: '/thesis/figures/captura_03_iot_monitoreo.jpg', caption: 'Módulo de Monitoreo IoT en producción: protocolo MQTT, calibración en dos etapas y nodos públicos de referencia en vivo.' },
  { id: 'Captura 4', file: '/thesis/figures/captura_04_oe3_modelos_ia.jpg', caption: 'Módulo OE3 en producción: arquitectura 1D-CNN desplegada, curva de convergencia real y pronóstico a 24 horas.' },
  { id: 'Captura 5', file: '/thesis/figures/captura_05_oe4_simulador_nbs.jpg', caption: 'Módulo OE4 en producción: simulador de SBN con parámetros de intervención y resultados del escenario activo.' },
  { id: 'Captura 6', file: '/thesis/figures/captura_06_oe5_validacion.jpg', caption: 'Módulo OE5 en producción: cobertura real de monitoreo y dictamen estadístico de la hipótesis general.' },
  { id: 'Captura 7', file: '/thesis/figures/captura_07_anexos_tesis.jpg', caption: 'Módulo "Anexos de Tesis" (funcionalidad nueva, no incluida en el documento original) mostrándose a sí mismo.' },
];

export const THESIS_TABLES: ThesisTable[] = [
  { id: 'Tabla 1', file: '/thesis/tables/tabla_01.csv', caption: 'Cadenas de búsqueda de replicación por base de datos (ventana 2020-2026).' },
  { id: 'Tabla 2', file: '/thesis/tables/tabla_02.csv', caption: 'Criterios de inclusión y exclusión.' },
  { id: 'Tabla 3', file: '/thesis/tables/tabla_03.csv', caption: 'Variables de extracción y definición operativa.' },
  { id: 'Tabla 4', file: '/thesis/tables/tabla_04.csv', caption: 'Inventario de las 40 fuentes únicas según escala espacial y tecnología principal.' },
  { id: 'Tabla 5', file: '/thesis/tables/tabla_05.csv', caption: 'Frecuencias de las 31 fuentes del corpus por año, escala espacial y tecnología primaria.' },
  { id: 'Tabla 6', file: '/thesis/tables/tabla_06.csv', caption: 'Cobertura de las cinco capas funcionales en las 31 fuentes del corpus.' },
  { id: 'Tabla 7', file: '/thesis/tables/tabla_07.csv', caption: 'Tipos de SBN evaluados en las 17 fuentes del corpus que abordan mitigación de calor y/o contaminación.' },
  { id: 'Tabla 8', file: '/thesis/tables/tabla_08.csv', caption: 'Magnitudes de efecto reportadas, con métrica unificada y procedencia.' },
  { id: 'Tabla 9', file: '/thesis/tables/tabla_09.csv', caption: 'Reducción media de temperatura del aire por tipo de infraestructura verde-azul según la síntesis A30.' },
  { id: 'Tabla 10', file: '/thesis/tables/tabla_10.csv', caption: 'Estadísticos descriptivos de las magnitudes de efecto extraídas.' },
  { id: 'Tabla 11', file: '/thesis/tables/tabla_11.csv', caption: 'Evidencia sobre la compensación entre enfriamiento y ventilación, y regla de diseño que motiva.' },
  { id: 'Tabla 12', file: '/thesis/tables/tabla_12.csv', caption: 'Respuestas a las preguntas de investigación y certeza de la evidencia.' },
  { id: 'Tabla 13', file: '/thesis/tables/tabla_13.csv', caption: 'Correspondencia entre las capas del marco y los módulos del prototipo de Trujillo.' },
  { id: 'Tabla 14', file: '/thesis/tables/tabla_14.csv', caption: 'Zonas críticas de Trujillo registradas en el prototipo.' },
  { id: 'Tabla 15', file: '/thesis/tables/tabla_15.csv', caption: 'Lecturas de los nodos de bajo costo del prototipo (instantánea del 1 de octubre de 2026).' },
  { id: 'Tabla 16', file: '/thesis/tables/tabla_16.csv', caption: 'Contraste de los nodos calibrados con la referencia pública (12 lecturas pareadas por nodo).' },
  { id: 'Tabla 17', file: '/thesis/tables/tabla_17.csv', caption: 'Catálogo de SBN del prototipo y valores comparables en las fuentes revisadas.' },
  { id: 'Tabla 18', file: '/thesis/tables/tabla_18.csv', caption: 'Comparación del marco propuesto con marcos y arquitecturas previos del corpus.' },
  { id: 'Tabla 19', file: '/thesis/tables/tabla_19.csv', caption: 'Amenazas a la validez y mitigación.' },
];
