-- Migración 0002: agrega zonas regionales fuera del casco de microescala de Trujillo.
-- Temperatura base y PM2.5: datos REALES tomados de climate-data.org / WeatherSpark
-- (promedio anual de temperatura) e IQAir (PM2.5 actual, modelado satelital/estaciones
-- cercanas donde no hay estación fija en la ciudad) — ver fuente por fila abajo.
-- Población, cobertura arbórea y densidad edificada siguen siendo ESTIMACIONES
-- razonadas (no censales) — reemplázalas por datos INEI si vas a citarlas en la tesis.
--
-- No modifica ni borra las 6 zonas de microescala existentes (zona-centro, etc.).
-- Es idempotente: correrla dos veces no duplica filas (ON CONFLICT DO NOTHING).

insert into public.urban_zones
  (id, name, district, department, description, vulnerability_level,
   target_population, vulnerable_population, baseline_temp, baseline_pm25,
   tree_cover, built_density, primary_pollution_source, geometry_coords, sensors_count)
values
  ('zona-chepen', 'Chepén (Centro Urbano)', 'Chepén', 'La Libertad',
   '[Clima real: climate-data.org / IQAir] Centro urbano de la provincia de Chepén, valle agrícola costero de La Libertad. Población y cobertura vegetal: estimadas.',
   'Media', 32000, 9600, 21.1, 12.4, 12.0, 55.0,
   'Tráfico vehicular local y quema agrícola estacional en el valle Jequetepeque.', '[]'::jsonb, 0),

  ('zona-guadalupe', 'Guadalupe (Centro Urbano)', 'Guadalupe', 'La Libertad',
   '[Clima real: SENAMHI/Wikipedia 1991-2020, IQAir] Distrito de Guadalupe, provincia de Chepén, La Libertad. Población y cobertura vegetal: estimadas.',
   'Media', 22000, 6600, 22.3, 13.1, 14.0, 50.0,
   'Tráfico vehicular local y actividad agroindustrial cercana.', '[]'::jsonb, 0),

  ('zona-chocope', 'Chocope (Centro Urbano)', 'Chocope', 'La Libertad',
   '[Clima real: WeatherSpark / IQAir] Distrito de Chocope, provincia de Ascope, La Libertad. Población y cobertura vegetal: estimadas.',
   'Media', 16000, 4800, 20.5, 12.6, 16.0, 45.0,
   'Actividad agroindustrial azucarera y quema periódica de residuos de caña.', '[]'::jsonb, 0),

  ('zona-viru', 'Virú (Centro Urbano)', 'Virú', 'La Libertad',
   '[Clima real: WeatherSpark / IQAir] Provincia de Virú, polo agroexportador de La Libertad. Población y cobertura vegetal: estimadas.',
   'Media', 38000, 11400, 20.6, 14.2, 10.0, 52.0,
   'Tráfico de carga agroexportadora y polvo de vías sin asfaltar.', '[]'::jsonb, 0),

  ('zona-pacasmayo', 'Pacasmayo (Centro Urbano)', 'Pacasmayo', 'La Libertad',
   '[Clima real: climate-data.org / IQAir] Ciudad portuaria de Pacasmayo, La Libertad. Población y cobertura vegetal: estimadas.',
   'Media', 15000, 4500, 20.2, 12.0, 8.0, 48.0,
   'Emisiones portuarias e industria cementera cercana.', '[]'::jsonb, 0),

  ('zona-cajamarca', 'Cajamarca (Centro Histórico)', 'Cajamarca', 'Cajamarca',
   '[Clima real: climate-data.org / IQAir] Centro histórico de la ciudad de Cajamarca (~2,750 msnm). Población y cobertura vegetal: estimadas.',
   'Alta', 220000, 66000, 12.8, 12.5, 18.0, 62.0,
   'Tráfico vehicular urbano en altitud y actividad minera regional cercana.', '[]'::jsonb, 0),

  ('zona-chiclayo', 'Chiclayo (Centro Urbano)', 'Chiclayo', 'Lambayeque',
   '[Clima real: climate-data.org / IQAir] Centro urbano de la ciudad de Chiclayo, capital de la región Lambayeque. Población y cobertura vegetal: estimadas.',
   'Alta', 310000, 93000, 21.3, 9.2, 9.0, 68.0,
   'Alta densidad de tráfico vehicular y comercio informal en el centro urbano.', '[]'::jsonb, 0)
on conflict (id) do update set
  baseline_temp = excluded.baseline_temp, baseline_pm25 = excluded.baseline_pm25,
  description = excluded.description;
