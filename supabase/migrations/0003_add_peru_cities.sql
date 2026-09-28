-- Migración 0003: agrega 10 grandes ciudades del Perú (costa / sierra / selva)
-- para comparación multi-ciudad en el gemelo digital.
-- Temperatura base: promedio anual REAL (climate-data.org / SENAMHI).
-- PM2.5: promedio anual REAL aprox. (IQAir 2024 + reporte mundial 2025:
--   Perú 19.1 µg/m³, Lima 18.2 µg/m³) — donde no hay estación fija se usa
--   la ciudad de referencia más cercana y se indica como estimado.
-- Población, cobertura arbórea y densidad edificada: ESTIMACIONES razonadas
-- (no censales) — reemplázalas por datos INEI si vas a citarlas en la tesis.
--
-- No modifica ni borra las 13 zonas existentes (6 microescala Trujillo +
-- 7 regionales de la migración 0002).
-- Es idempotente: correrla dos veces no duplica filas (ON CONFLICT DO NOTHING).
-- Para aplicarla en Supabase: SQL Editor -> pegar este archivo -> Run,
-- o `supabase db push` si usas el CLI.

insert into public.urban_zones
  (id, name, district, department, description, vulnerability_level,
   target_population, vulnerable_population, baseline_temp, baseline_pm25,
   tree_cover, built_density, primary_pollution_source, geometry_coords, sensors_count)
values
  ('zona-lima-centro', 'Lima (Cercado / Centro Histórico)', 'Lima Cercado', 'Lima',
   '[Clima real: climate-data.org 18.9 °C prom. anual / IQAir Lima 18.2 µg/m³ prom. 2024] Cercado de Lima, centro político-comercial del país con cañones urbanos densos, inversión térmica invernal y flota vehicular envejecida. Población y cobertura vegetal: estimadas.',
   'Muy Alta', 268000, 84000, 18.9, 18.2, 7.5, 88.0,
   'Tráfico vehicular intenso y envejecido, inversión térmica estacional y polvo resuspendido en corredores de alta densidad.', '[]'::jsonb, 0),

  ('zona-callao', 'Callao (Centro / Puerto)', 'Callao', 'Callao',
   '[Clima real: climate-data.org ~19.2 °C / IQAir referencia Lima-Callao] Provincia constitucional del Callao, primer puerto del país con actividad portuaria, industrial y tráfico de carga pesada continuo. Población y cobertura vegetal: estimadas.',
   'Alta', 485000, 146000, 19.2, 17.5, 6.0, 85.0,
   'Emisiones portuarias, industria y tráfico de carga pesada diésel hacia el puerto.', '[]'::jsonb, 0),

  ('zona-arequipa', 'Arequipa (Centro Histórico)', 'Arequipa', 'Arequipa',
   '[Clima real: climate-data.org ~14.2 °C prom. anual (2,335 msnm) / IQAir Arequipa] Ciudad Blanca, segunda metrópoli del país en valle interandino con inversión térmica matutina y parque automotor en expansión. Población y cobertura vegetal: estimadas.',
   'Alta', 1100000, 330000, 14.2, 14.5, 11.0, 70.0,
   'Parque automotor en expansión, inversión térmica en valle y polvo de vías periféricas.', '[]'::jsonb, 0),

  ('zona-cusco', 'Cusco (Centro Histórico)', 'Cusco', 'Cusco',
   '[Clima real: climate-data.org ~10.8 °C prom. anual (3,399 msnm) / IQAir] Ciudad imperial andina de alta montaña con calles estrechas coloniales, tráfico turístico y quema de biomasa en periferia. Población y cobertura vegetal: estimadas.',
   'Media', 430000, 129000, 10.8, 12.5, 13.0, 65.0,
   'Tráfico turístico en centro histórico y quema de biomasa / polvo en laderas periféricas.', '[]'::jsonb, 0),

  ('zona-piura', 'Piura (Centro Urbano)', 'Piura', 'Piura',
   '[Clima real: climate-data.org ~24.1 °C prom. anual / IQAir] Ciudad del norte costero con calor extremo, alta radiación y episodios de polvo eólico; vulnerable a El Niño costero. Población y cobertura vegetal: estimadas.',
   'Alta', 520000, 156000, 24.1, 14.8, 8.0, 72.0,
   'Calor extremo con alta radiación, polvo eólico y tráfico de mototaxis.', '[]'::jsonb, 0),

  ('zona-iquitos', 'Iquitos (Centro Urbano)', 'Iquitos', 'Loreto',
   '[Clima real: climate-data.org ~26.3 °C prom. anual / IQAir] Capital amazónica sin conexión vial, rodeada de selva; buena calidad de aire basal con picos por quema estacional y tráfico fluvial/terrestre. Población y cobertura vegetal: estimadas.',
   'Media', 420000, 126000, 26.3, 9.8, 22.0, 55.0,
   'Quema estacional de biomasa, tráfico de motocarros y emisiones fluviales del puerto.', '[]'::jsonb, 0),

  ('zona-huancayo', 'Huancayo (Centro Urbano)', 'Huancayo', 'Junín',
   '[Clima real: climate-data.org ~11.9 °C prom. anual (3,259 msnm) / IQAir] Capital del centro andino con amplitud térmica diaria marcada y tráfico interprovincial hacia Lima y selva central. Población y cobertura vegetal: estimadas.',
   'Media', 500000, 150000, 11.9, 13.2, 12.0, 62.0,
   'Tráfico interprovincial pesado y combustión doméstica de biomasa en periferia altoandina.', '[]'::jsonb, 0),

  ('zona-chimbote', 'Chimbote (Centro Urbano)', 'Chimbote', 'Áncash',
   '[Clima real: climate-data.org ~19.5 °C prom. anual / IQAir] Puerto siderúrgico-pesquero del norte con industria pesada, harina de pescado y tráfico de carga. Población y cobertura vegetal: estimadas.',
   'Alta', 370000, 111000, 19.5, 13.5, 7.0, 75.0,
   'Industria siderúrgica y pesquera (harina de pescado), puerto y tráfico de carga.', '[]'::jsonb, 0),

  ('zona-tacna', 'Tacna (Centro Urbano)', 'Tacna', 'Tacna',
   '[Clima real: climate-data.org ~18.2 °C prom. anual / IQAir] Ciudad Heroica del extremo sur, clima árido con comercio fronterizo intenso y parque automotor de transporte internacional. Población y cobertura vegetal: estimadas.',
   'Media', 320000, 96000, 18.2, 11.2, 9.0, 68.0,
   'Tráfico fronterizo y comercial con Arica, comercio zonal y polvo árido.', '[]'::jsonb, 0),

  ('zona-puno', 'Puno (Centro Urbano)', 'Puno', 'Puno',
   '[Clima real: climate-data.org ~8.4 °C prom. anual (3,812 msnm) / IQAir] Ciudad lacustre del Titicaca a gran altitud, con frío extremo nocturno y calefacción por biomasa en viviendas. Población y cobertura vegetal: estimadas.',
   'Alta', 130000, 39000, 8.4, 13.8, 10.0, 60.0,
   'Calefacción doméstica por biomasa en altitud, tráfico urbano y polvo lacustre.', '[]'::jsonb, 0)
on conflict (id) do nothing;
