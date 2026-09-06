-- ============================================================
-- Gemelo Digital Trujillo — SEED con datos de trujilloData.ts
-- 6 zonas + 6 sensores + 5 modelos IA + 5 NbS + 5 objetivos tesis
-- Ejecuta DESPUÉS de schema.sql
-- ============================================================

-- 1) ZONAS (6) — ahora con department para multi-departamento
insert into public.urban_zones (id, name, district, department, description, vulnerability_level, target_population, vulnerable_population, baseline_temp, baseline_pm25, tree_cover, built_density, primary_pollution_source, geometry_coords, sensors_count)
values
  ('zona-centro','Zona 1: Centro Histórico (Av. España / Jr. Pizarro)','Trujillo Cercado','La Libertad','Cañón urbano estrecho colonial con alta densidad peatonal y comercial, tráfico congestionado en anillo perimétrico Av. España y baja presencia de arbolado nativo.','Muy Alta',42500,14200,29.4,48.2,5.8,84.5,'Tráfico vehicular pesado/combis, cañón urbano con recirculación de vórtice y baja dispersión.','[{"x":10,"y":10},{"x":90,"y":10},{"x":90,"y":90},{"x":10,"y":90}]',4),
  ('zona-mayorista','Zona 2: Corredor Av. América Sur / Mercado Mayorista','Trujillo Cercado / El Bosque','La Libertad','Punto crítico comercial y logístico de alto tránsito diésel pesado, microbuses, mototaxis y carga continua con alta emisión de material particulado y calor antropogénico.','Crítica',68000,22800,31.8,64.7,3.2,91.0,'Flota de carga pesada diésel, paraderos informales y asfalto degradado con alta radiación térmica.','[{"x":15,"y":20},{"x":85,"y":15},{"x":80,"y":85},{"x":20,"y":80}]',5),
  ('zona-mansiche','Zona 3: Intercambio Vial Av. Mansiche / Mall Plaza','Trujillo / Huanchaco','La Libertad','Nodo vial metropolitano con alta velocidad y volumen vehicular continuo, grandes explanadas de pavimento asfaltado y estacionamientos que generan isla de calor.','Media',35000,9500,28.6,38.5,11.4,72.0,'Flujo vehicular continuo alta velocidad, calor reflejado por cubiertas metálicas y pavimentos.','[{"x":5,"y":15},{"x":95,"y":10},{"x":90,"y":85},{"x":10,"y":90}]',3),
  ('zona-porvenir','Zona 4: Distrito El Porvenir (Sector Industrial Calzado)','El Porvenir','La Libertad','Zona de microempresas de calzado y curtiembres con calderas artesanales, calles con déficit de pavimentación y cobertura vegetal casi nula (<2.5%).','Crítica',115000,41000,32.5,72.3,2.1,94.0,'Combustión industrial, solventes COVs, polvo resuspendido y alta radiación superficial.','[{"x":20,"y":10},{"x":95,"y":25},{"x":85,"y":95},{"x":10,"y":85}]',4),
  ('zona-victor-larco','Zona 5: Víctor Larco Herrera (Av. Larco / Huamán)','Víctor Larco','La Libertad','Corredor residencial-comercial con influencia de brisa marina vespertina pero con episodios matutinos de inversión térmica y congestión en horas punta.','Media',52000,16000,26.8,32.1,14.6,65.0,'Tráfico de transporte público y particular hacia balneario de Huanchaco/Buenos Aires.','[{"x":10,"y":15},{"x":90,"y":20},{"x":85,"y":85},{"x":15,"y":80}]',3),
  ('zona-hermelinda','Zona 6: Complejo La Hermelinda (Av. Villarreal / 8 de Octubre)','Florencia de Mora / Trujillo','La Libertad','Mercado de abastos informal de mayor escala en el norte del país, acumulación de residuos, tráfico desordenado y alto índice de partículas gruesas y finas.','Muy Alta',85000,29000,31.2,68.9,1.8,92.5,'Tráfico logístico incesante, residuos orgánicos e inorgánicos, quema clandestina periférica.','[{"x":15,"y":10},{"x":88,"y":18},{"x":82,"y":92},{"x":12,"y":88}]',4)
on conflict (id) do update set
  name = excluded.name, district = excluded.district, department = excluded.department, description = excluded.description,
  vulnerability_level = excluded.vulnerability_level, target_population = excluded.target_population,
  vulnerable_population = excluded.vulnerable_population, baseline_temp = excluded.baseline_temp,
  baseline_pm25 = excluded.baseline_pm25, tree_cover = excluded.tree_cover, built_density = excluded.built_density,
  primary_pollution_source = excluded.primary_pollution_source, geometry_coords = excluded.geometry_coords, sensors_count = excluded.sensors_count;

-- 2) SENSORES (6 nodos - coordenadas y calibración reales)
insert into public.sensor_nodes (id, code, name, zone_id, zone_name, lat, lng, elevation, street_canyon_hw_ratio, canopy_cover_percent, sealed_surface_percent, traffic_density, sensor_type, calibration_status, r2_score_raw, r2_score_calibrated, status, last_reading, last_reading_at)
values
  ('sensor-trj-01','TRJ-IOT-01','Nodo Av. España / Jr. Orbegoso (Anillo Centro)','zona-centro','Centro Histórico',-8.1116,-79.0287,34,2.1,4.2,92.0,'Muy Crítico','Sensirion SPS30 + BME680','Calibrado (2-Etapas Zhivkov)',0.31,0.94,'online','{"timestamp":"22:30","pm25":46.8,"pm10":83.2,"no2":38.4,"o3":21.0,"co":2.1,"co2":452,"temperature":28.9,"humidity":71,"windSpeed":2.1,"windDirection":"SO","solarRadiation":420,"heatIndex":30.8,"uhiDelta":4.6,"petScore":32.4,"tcsScore":42,"aqiIndex":128,"aqiCategory":"Dañina para grupos sensibles"}', now()),
  ('sensor-trj-02','TRJ-IOT-02','Nodo Plaza Mayor de Trujillo (Monitoreo Peatonal)','zona-centro','Centro Histórico',-8.1118,-79.0289,35,0.8,18.5,78.0,'Medio','PMS5003 + SHT31','Calibrado (2-Etapas Zhivkov)',0.28,0.91,'online','{"timestamp":"22:30","pm25":29.4,"pm10":51.8,"no2":21.2,"o3":24.5,"co":1.1,"co2":421,"temperature":27.2,"humidity":74,"windSpeed":3.2,"windDirection":"SO","solarRadiation":405,"heatIndex":28.6,"uhiDelta":2.9,"petScore":29.1,"tcsScore":68,"aqiIndex":88,"aqiCategory":"Moderada"}', now()),
  ('sensor-trj-03','TRJ-IOT-03','Nodo Av. América Sur / Mercado Mayorista Principal','zona-mayorista','Corredor Mayorista',-8.1194,-79.0192,32,1.6,2.0,96.0,'Muy Crítico','Alphasense OPC-N3','Calibrado (2-Etapas Zhivkov)',0.35,0.96,'online','{"timestamp":"22:30","pm25":67.4,"pm10":118.9,"no2":49.6,"o3":16.8,"co":3.2,"co2":495,"temperature":32.1,"humidity":65,"windSpeed":1.4,"windDirection":"S","solarRadiation":510,"heatIndex":35.2,"uhiDelta":6.2,"petScore":36.8,"tcsScore":24,"aqiIndex":158,"aqiCategory":"Dañina"}', now()),
  ('sensor-trj-04','TRJ-IOT-04','Nodo Sector Calzado - Av. Pumacahua (El Porvenir)','zona-porvenir','El Porvenir Industrial',-8.0892,-79.0014,58,1.9,1.5,94.0,'Alto','Sensirion SPS30 + BME680','Calibrado (2-Etapas Zhivkov)',0.29,0.93,'online','{"timestamp":"22:30","pm25":74.8,"pm10":132.5,"no2":42.1,"o3":19.5,"co":2.8,"co2":480,"temperature":33.2,"humidity":62,"windSpeed":1.6,"windDirection":"E","solarRadiation":530,"heatIndex":36.4,"uhiDelta":6.9,"petScore":38.1,"tcsScore":18,"aqiIndex":162,"aqiCategory":"Dañina"}', now()),
  ('sensor-trj-05','TRJ-IOT-05','Nodo Av. Larco / Huamán (Víctor Larco Herrera)','zona-victor-larco','Víctor Larco',-8.1345,-79.0432,18,1.1,16.2,68.0,'Medio','PMS5003 + SHT31','Calibrado (2-Etapas Zhivkov)',0.32,0.92,'online','{"timestamp":"22:30","pm25":31.6,"pm10":55.4,"no2":22.8,"o3":27.1,"co":0.9,"co2":412,"temperature":26.5,"humidity":78,"windSpeed":4.1,"windDirection":"SO","solarRadiation":380,"heatIndex":27.9,"uhiDelta":2.2,"petScore":27.8,"tcsScore":72,"aqiIndex":91,"aqiCategory":"Moderada"}', now()),
  ('sensor-trj-06','TRJ-IOT-06','Nodo Av. Mansiche / Intercambio Mall Plaza','zona-mansiche','Nodo Mansiche',-8.0987,-79.0412,36,0.9,12.0,82.0,'Alto','Sensirion SPS30 + BME680','Calibrado (2-Etapas Zhivkov)',0.30,0.93,'online','{"timestamp":"22:30","pm25":39.2,"pm10":69.8,"no2":33.1,"o3":23.4,"co":1.6,"co2":438,"temperature":28.4,"humidity":70,"windSpeed":2.8,"windDirection":"SO","solarRadiation":440,"heatIndex":30.1,"uhiDelta":3.8,"petScore":31.2,"tcsScore":54,"aqiIndex":110,"aqiCategory":"Dañina para grupos sensibles"}', now())
on conflict (id) do update set
  code=excluded.code, name=excluded.name, zone_id=excluded.zone_id, zone_name=excluded.zone_name,
  lat=excluded.lat, lng=excluded.lng, elevation=excluded.elevation,
  street_canyon_hw_ratio=excluded.street_canyon_hw_ratio, canopy_cover_percent=excluded.canopy_cover_percent,
  sealed_surface_percent=excluded.sealed_surface_percent, traffic_density=excluded.traffic_density,
  sensor_type=excluded.sensor_type, calibration_status=excluded.calibration_status,
  r2_score_raw=excluded.r2_score_raw, r2_score_calibrated=excluded.r2_score_calibrated,
  status=excluded.status, last_reading=excluded.last_reading, last_reading_at=excluded.last_reading_at;

-- 3) LECTURAS HISTÓRICAS — 12 lecturas por sensor (00:00..22:00) generadas como en trujilloData.ts
-- Usa función helpers para piggyback del generador JS: aquí valores fijos representativos
insert into public.environmental_readings (sensor_id, zone_id, measured_at, pm25, pm10, no2, o3, co, co2, temperature, humidity, wind_speed, wind_direction, solar_radiation, heat_index, uhi_delta, pet_score, tcs_score, aqi_index, aqi_category, is_calibrated)
select
  s.id, s.zone_id,
  (now() - (12 - gs.h)* interval '1 hour'),
  ( (s.last_reading->>'pm25')::numeric * case when gs.h in (4,9) then 1.45 when gs.h between 3 and 10 then 1.15 else 0.75 end )::numeric(6,2),
  ( (s.last_reading->>'pm25')::numeric * 1.45 * 1.78 )::numeric(6,2),
  (24 + case when gs.h in (4,9) then 1.45 when gs.h between 3 and 10 then 1.15 else 0.75 end * 18)::numeric(6,2),
  (18 + sin(gs.h/11.0*pi())*5.2*4.2)::numeric(6,2),
  (1.2 + case when gs.h in (4,9) then 1.45 when gs.h between 3 and 10 then 1.15 else 0.75 end *1.1)::numeric(6,3),
  (415 + case when gs.h in (4,9) then 1.45 when gs.h between 3 and 10 then 1.15 else 0.75 end *42)::numeric(7,1),
  ((s.last_reading->>'temperature')::numeric -3 + sin(gs.h/11.0*pi())*5.2)::numeric(5,2),
  greatest(45, least(88, (78 - sin(gs.h/11.0*pi())*5.2*3.8)::int))::numeric(5,2),
  (1.8 + random()*2.4)::numeric(5,2),
  'SO',
  greatest(0, sin(gs.h/11.0*pi())*5.2*160)::numeric(7,1),
  ((s.last_reading->>'temperature')::numeric -3 + sin(gs.h/11.0*pi())*5.2 + 78/100*2.8)::numeric(5,2),
  greatest(1.2, (((s.last_reading->>'temperature')::numeric -3 + sin(gs.h/11.0*pi())*5.2)-23.5)*0.65)::numeric(5,2),
  (((s.last_reading->>'temperature')::numeric -3 + sin(gs.h/11.0*pi())*5.2) + sin(gs.h/11.0*pi())*5.2*0.8 + case when 78>70 then 2.5 else 0 end)::numeric(5,2),
  greatest(15, least(100, (100 - (((s.last_reading->>'temperature')::numeric -3 + sin(gs.h/11.0*pi())*5.2)-20)*4.5 - ((s.last_reading->>'pm25')::numeric/1.5))::int)),
  (((s.last_reading->>'pm25')::numeric * case when gs.h in (4,9) then 1.45 when gs.h between 3 and 10 then 1.15 else 0.75 end)*2.8)::int,
  case when (s.last_reading->>'pm25')::numeric * case when gs.h in (4,9) then 1.45 else 1.15 end <=12 then 'Buena'::aqi_category
       when (s.last_reading->>'pm25')::numeric * case when gs.h in (4,9) then 1.45 else 1.15 end <=35.4 then 'Moderada'::aqi_category
       when (s.last_reading->>'pm25')::numeric * case when gs.h in (4,9) then 1.45 else 1.15 end <=55.4 then 'Dañina para grupos sensibles'::aqi_category
       else 'Dañina'::aqi_category end,
  true
from public.sensor_nodes s
cross join generate_series(0,11) as gs(h)
on conflict do nothing;

-- 4) MODELOS IA (5)
insert into public.ai_models (id, name, model_type, architecture, reference_author, year, r2, rmse, mae, mape, training_time_sec, inference_time_ms, spatial_resolution, best_fit_use, status, features)
values
  ('model-1d-cnn','1D-CNN (2-Layer Deep Convolutional)','1d_cnn','Conv1D(64, k=3) -> MaxPooling -> Conv1D(128, k=3) -> Dense(64) -> Output','Naveed et al.',2025,0.9925,1.42,0.98,1.23,42,4.8,'A nivel de Edificación / Cañón (5m)','Predicción en tiempo real de PM2.5 y Temperatura con series temporales continuas de sensores IoT.','Recomendado','{"PM2.5(t-1..t-12)","Temperatura","Humedad Relativa","Velocidad Viento","Radiación Solar","H/W Cañón"}'),
  ('model-gnn','GNN (Graph Neural Network - Topología Vial)','gnn','GCNLayer(64) -> EdgeConv(128) -> GATConv(64) -> MLP Head','Zhivkov et al.',2025,0.9510,2.85,2.10,3.45,185,14.2,'A nivel de Manzana y Red de Intersecciones (10m)','Atribución de emisiones vehiculares (65%) y propagación de contaminantes a lo largo de ejes viales como Av. España.','Recomendado','{"Topología de calles","Flujo vehicular estimado","Índice de conectividad","NDVI de bordes","Dirección del viento"}'),
  ('model-lstm','Bi-LSTM (Bidirectional Long Short-Term Memory)','bi_lstm','BiLSTM(128, return_seq=True) -> Dropout(0.2) -> BiLSTM(64) -> Dense(32) -> Output','Li et al.',2026,0.9380,3.20,2.45,4.10,120,8.5,'A nivel de Nodo Sensor (15m)','Captura de memoria a largo plazo, inversión térmica matutina y ciclos diurnos/nocturnos.','Evaluado','{"Secuencia temporal 24h","Gradiente térmico vertical","Albedo superficial","Presión atmosférica"}'),
  ('model-bayesian','Bayesian Spatiotemporal (B-ST Model)',null,'Gaussian Process Spatial Prior + AR(1) Temporal Structure + MCMC Inference','Li et al. / Elizabeth NJ',2026,0.9140,3.90,2.95,5.20,320,28.0,'A nivel de Fachada / Micro-área (10m)','Cuantificación rigurosa de incertidumbre en zonas de Trujillo con baja densidad de sensores.','Evaluado','{"Coordenadas UTM","Distancia euclidiana a vías","Densidad de edificación BIM","Distribución a priori de COVs"}'),
  ('model-rf','Random Forest Regressor (Optimizado 300 Trees)','random_forest','Ensemble de 300 árboles de decisión con max_depth=16 y submuestreo de características','Babu Saheer et al. / Baseline',2025,0.8870,4.60,3.50,6.80,15,2.1,'A nivel de Barrio (25m)','Modelo de referencia rápido para interpretabilidad de variables clave (Feature Importance).','Línea Base','{"Temperatura","Humedad","Tráfico","Hora del día","Distancia a costa","Cobertura arbórea"}')
on conflict (id) do update set
  name=excluded.name, architecture=excluded.architecture, r2=excluded.r2, rmse=excluded.rmse, mae=excluded.mae, mape=excluded.mape,
  training_time_sec=excluded.training_time_sec, inference_time_ms=excluded.inference_time_ms, status=excluded.status, features=excluded.features;

-- 5) NBS (5)
insert into public.nbs_interventions (id, name, type, description, recommended_flora, unit_cost_pen, unit_maintenance_pen_year, cooling_capacity_c, pm_reduction_percent, water_retention_l_m2, co2_sequestration_kg_year, acoustic_damping_db)
values
  ('nbs-arbolado','Corredores de Arbolado Urbano Nativo y Adaptado','arbolado_corredor','Plantación continua en bermas centrales y aceras con especies adaptadas al suelo y clima árido-costero de Trujillo (baja demanda hídrica y alto dosel).','{"Molle costeño (Schinus terebinthifolius)","Huarango (Prosopis pallida)","Jacarandá (Jacaranda mimosifolia)","Tecoma stans (Floripondio amarillo)","Meijo / Tipa"}',380,45,3.2,28.5,120,28.4,4.5),
  ('nbs-techo-verde','Techos Verdes Extensivos en Edificaciones Públicas y Privadas','techo_verde','Instalación de cubiertas vegetales ligeras con sustrato drenante y vegetación xerófila en techos planos de casonas y edificios en Trujillo.','{"Sedum spp.","Aptenia cordifolia","Portulaca grandiflora","Echeveria","Gramíneas nativas"}',145,18,3.8,22.0,35,5.2,6.0),
  ('nbs-muro-verde','Jardines Verticales y Muros Verdes Modulares en Fachadas','muro_verde','Módulos verticales en fachadas y muros ciegos de cañones urbanos de alta densidad para absorción de NO2 y enfriamiento microclimático por evapotranspiración.','{"Hedera helix","Ficus pumila","Tradescantia pallida","Epipremnum aureum","Helechos adaptados"}',220,32,2.6,24.8,25,4.8,8.5),
  ('nbs-pavimento-permeable','Pavimentos Permeables y Adoquines con Pasto (Grass Paver)','pavimento_permeable','Sustitución de asfalto continuo e impermeable en bermas, estacionamientos y plazas secundarias por adoquines porosos que reducen la acumulación de calor.','{"Cynodon dactylon (Bermuda grass)","Gravas volcánicas filtrantes","Sustrato de perlita y arena"}',110,12,2.1,14.5,85,1.8,2.0),
  ('nbs-jardin-lluvia','Jardines de Lluvia y Bio-Retenciones Urbanas','jardin_lluvia','Depresiones vegetadas en esquinas y retiros viales para captar escorrentía superficial en eventos El Niño / lluvias costeras, con árboles y arbustos filtrantes.','{"Vetiver (Chrysopogon zizanioides)","Canna indica (Achira)","Pennisetum","Stipa ichu"}',160,22,2.9,26.0,150,8.5,3.5)
on conflict (id) do update set
  name=excluded.name, type=excluded.type, description=excluded.description, recommended_flora=excluded.recommended_flora,
  unit_cost_pen=excluded.unit_cost_pen, cooling_capacity_c=excluded.cooling_capacity_c, pm_reduction_percent=excluded.pm_reduction_percent;

-- 6) OBJETIVOS TESIS (5)
insert into public.thesis_objectives (code, title, status, progress_percent, summary)
values
  ('OE1','Diagnosticar la variabilidad microescalar de calidad del aire y temperatura en Trujillo','Completado',100,'Se demostró que las estaciones macroescalares tradicionales no capturan los picos de exposición en los cañones urbanos de Trujillo.'),
  ('OE2','Diseñar la arquitectura del gemelo digital a microescala (Capas Físicas, Datos y Modelado)','Completado',100,'Arquitectura validada según los estándares de Li et al. (2026) y Teutscher et al. (2025) con código abierto adaptado a presupuestos de ciudades intermedias.'),
  ('OE3','Seleccionar y adaptar modelos de Machine Learning y Deep Learning a microescala','Completado',100,'El modelo 1D-CNN y la arquitectura GNN superaron ampliamente a los modelos clásicos gaussianos y Random Forest.'),
  ('OE4','Diseñar el módulo de simulación de escenarios de Soluciones basadas en la Naturaleza (NbS)','Completado',100,'Simulador A/B permite a la Municipalidad evaluar proyectos antes de su ejecución física, respaldado en el marco GREENPASS® (Abbas et al., 2025).'),
  ('OE5','Establecer indicadores y procedimientos de validación de hipótesis y política pública','Completado',100,'Se valida la hipótesis de la tesis: el gemelo digital a microescala con NbS reduce significativamente la exposición a contaminantes y calor extremo en Trujillo.')
on conflict (code) do update set title=excluded.title, status=excluded.status, progress_percent=excluded.progress_percent, summary=excluded.summary;

insert into public.thesis_objective_metrics (objective_code, name, target, achieved, compliance)
values
  ('OE1','Zonas críticas caracterizadas en Trujillo','4 zonas','6 zonas (Centro, Mayorista, Mansiche, Porvenir, V. Larco, Hermelinda)',true),
  ('OE1','Variabilidad de PM2.5 calle a calle identificada','Delta > 150%','Delta de hasta 285% en menos de 100m (Zhivkov et al. matching)',true),
  ('OE1','R² calibración 2-etapas de sensores de bajo costo','R² > 0.85','R² = 0.94 (PMS5003 / Sensirion SPS30 corregidos)',true),
  ('OE2','Modelo tridimensional de cañones urbanos (BIM/LiDAR/OSM)','Malla 10x10m','Malla discretizada 5x5m y modelo 3D con H/W ratio',true),
  ('OE2','Sincronización bidireccional física-virtual','Latencia < 5s','Latencia media de telemetría IoT 1.2s',true),
  ('OE2','Integración del marco REFLECT (7 capas)','7 capas activas','Retrieve, Establish, Facilitate, Lump, Examine, Cognition, Take implementadas',true),
  ('OE3','Precisión predictiva de 1D-CNN (Naveed et al. 2025)','R² > 0.95','R² = 0.9925 | MAPE = 1.23%',true),
  ('OE3','Atribución vehicular mediante GNN (Zhivkov et al. 2025)','Atribución > 50%','65.2% de PM2.5 atribuido a flota diésel y combis en Trujillo',true),
  ('OE3','Tiempo de inferencia para gemelo digital en tiempo real','< 50ms','4.8ms con 1D-CNN optimizado',true),
  ('OE4','Reducción térmica microclimática proyectada','ΔT = 2.0 - 3.5 °C','ΔT = 3.2 °C (Arbolado) y 3.8 °C (Techos Verdes) en Trujillo',true),
  ('OE4','Reducción de exposición a PM2.5 por deposición foliar','ΔPM2.5 > 20%','28.5% en corredores arbolados (Molle/Huarango)',true),
  ('OE4','Mejora en Confort Térmico Score (TCS / PET)','Mejora > 25 pts','Incremento de TCS de 42 a 76 pts (+34 pts de confort)',true),
  ('OE5','Validación estadística de Hipótesis General','p-valor < 0.05','p < 0.001 (Diferencia significativa pre y post NbS)',true),
  ('OE5','Población vulnerable protegida estimada','> 50,000 hab','132,500 habitantes beneficiados en zonas críticas de Trujillo',true),
  ('OE5','Retorno de inversión social (Costo-Efectividad)','B/C Ratio > 1.5','B/C Ratio = 3.4 (Ahorro en salud respiratoria y energía)',true)
on conflict do nothing;

-- Verificación rápida
select 'urban_zones' as tabla, count(*) from public.urban_zones
union all select 'sensor_nodes', count(*) from public.sensor_nodes
union all select 'environmental_readings', count(*) from public.environmental_readings
union all select 'ai_models', count(*) from public.ai_models
union all select 'nbs_interventions', count(*) from public.nbs_interventions
union all select 'thesis_objectives', count(*) from public.thesis_objectives;
