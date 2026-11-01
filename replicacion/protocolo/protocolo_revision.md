# Protocolo de la revisión integradora

Revisión integradora sobre gemelos digitales (GD) de calidad del aire a microescala acoplados a soluciones basadas en la naturaleza (SBN). Este archivo reúne las Tablas 1 a 3 del artículo y describe el ensamblaje del conjunto documental.

## Ensamblaje del conjunto documental

- El conjunto se armó en dos rondas de selección dirigida por criterios temáticos: una de 20 fuentes y una ampliación de otras 20, con 40 registros iniciales.
- Se eliminaron 7 registros duplicados (EC3), quedaron 33 fuentes únicas; 2 pasaron a fuentes contextuales (EC1 y EC2) y 31 forman el corpus analítico (A1-A31).
- Se sumaron 7 fuentes complementarias, leídas en texto completo y fuera de los estadísticos. Total: 40 fuentes únicas.
- Las cadenas de búsqueda de la Tabla 1 se redactaron después de la selección, para que pueda replicarse y actualizarse. **No se registraron la fecha de ejecución ni los conteos por base.** Al ejecutarlas, anótese en `registro_busquedas.csv` (plantilla en esta carpeta).
- Extracción sobre título y resumen; codificación por un solo autor, sin segundo codificador.

### Tabla 1. Cadenas de búsqueda de replicación por base de datos (ventana 2020-2026)

| Base de datos | Cadena de búsqueda (campos: título, resumen, palabras clave) | Filtros |
|---|---|---|
| Scopus | TITLE-ABS-KEY( ("digital twin" AND ("air quality" OR "air pollution" OR "urban heat" OR "thermal comfort" OR "heat stress")) OR (("nature-based solution" OR "green infrastructure" OR "urban vegetation" OR "street tree" OR "green roof" OR "green wall") AND ("air quality" OR "air pollution" OR "urban heat island" OR "heat mitigation") AND (microscale OR micro-scale OR "street canyon" OR CFD OR "ENVI-met" OR "low-cost sensor")) ) | PUBYEAR 2020-2026; inglés o español |
| Web of Science (Core Collection) | TS=(("digital twin" AND ("air quality" OR "air pollution" OR "urban heat" OR "thermal comfort" OR "heat stress")) OR (("nature-based solution" OR "green infrastructure" OR "urban vegetation" OR "street tree" OR "green roof" OR "green wall") AND ("air quality" OR "air pollution" OR "urban heat island" OR "heat mitigation") AND (microscale OR "micro-scale" OR "street canyon" OR CFD OR "ENVI-met" OR "low-cost sensor"))) | PY 2020-2026; inglés o español |
| ScienceDirect (tres subconsultas por el límite de operadores) | S1: "digital twin" AND "air quality" AND urban \| S2: "digital twin" AND "urban heat" \| S3: "nature-based solutions" AND "air pollution" AND "street canyon" | Años 2020-2026 |
| arXiv (búsqueda avanzada) | all:"digital twin" AND all:"air quality" \| all:"digital twin" AND all:"urban heat" | 2020-01-01 a 2026-12-31 |

### Tabla 2. Criterios de inclusión y exclusión

| Código | Criterio |
|---|---|
| IC1 | Publicación entre 2020 y 2026. |
| IC2 | Tema: gemelos digitales o modelación de alta resolución aplicados a calidad del aire y/o calor urbano, o efectos de SBN sobre contaminantes y/o temperatura. |
| IC3 | Tipo: artículo, revisión, ponencia, preprint o documento técnico con método descrito. |
| IC4 | Identidad bibliográfica verificable (autoría, año, sede y DOI o URL). |
| EC1 | Fuera de la ventana temporal (se conserva como fuente contextual si es seminal). |
| EC2 | Sin fecha o sede verificables (se conserva como fuente contextual, sin computar en los estadísticos). |
| EC3 | Registro duplicado de una misma fuente. |

### Tabla 3. Variables de extracción y definición operativa

| Variable | Definición operativa | Categorías / unidad |
|---|---|---|
| V1. Año | Año de publicación en la sede indicada. | 2020-2026 (n.º) |
| V2. Escala espacial | Microescala: dominio de hasta 1 km de extensión horizontal, aproximadamente, o unidad a nivel de calle, cañón urbano, manzana, edificio o microambiente. Barrio/distrito/local: entre la microescala y la ciudad (incluye parques). Ciudad/metropolitana. Revisión multiescala: síntesis sin un dominio único. | 4 categorías excluyentes |
| V3. Tecnología primaria | Tecnología que predomina en la fuente: gemelo digital (arquitectura con datos, IoT o 3D), simulación numérica física o híbrida, monitoreo con sensores y datos observacionales, o revisión, síntesis y perspectiva. | 4 categorías excluyentes |
| V4. Capas del marco | Presencia (1) o ausencia (0) de un componente funcional equivalente a cada capa: L1 adquisición, L2 asimilación, L3 simulación, L4 optimización de SBN, L5 visualización participativa. | Binaria por capa |
| V5. SBN evaluada | La fuente evalúa (por simulación, medición o síntesis) el efecto de al menos un tipo de SBN sobre temperatura, confort térmico o contaminantes. | Sí / no; tipo de SBN |
| V6. Magnitud de temperatura | Reducción de temperatura o índice térmico atribuida a SBN, con la variable exacta (aire, interior, superficie, UTCI). | °C (reducción > 0) |
| V7. Magnitud de contaminantes | Cambio de concentración de PM o NO₂ atribuido a SBN, o métrica alternativa declarada (p. ej., dispersión). | % y tipo de métrica |
| V8. Caso de estudio | Ciudad o región del caso y grupo de ingreso del país (clasificación del Banco Mundial). | Alto / medio-alto / medio-bajo |
| V9. Tipo de publicación y nivel de lectura | Artículo, revisión, preprint, ponencia o documento técnico; nivel de lectura (resumen o texto). | Categórica |

## Codificación

`datos/extraccion_40_fuentes.csv` contiene una fila por fuente. Las capas L1-L5 y `evalua_sbn` se codifican 1/0 solo para las 31 fuentes del corpus. `grupo_ingreso` sigue la clasificación del Banco Mundial; se debe contrastar con la fuente original antes de reutilizarlo.
