-- Migración 0002: agrega zonas regionales fuera del casco de microescala de Trujillo.
-- IMPORTANTE: los valores ambientales (temperatura base, PM2.5, cobertura arbórea,
-- densidad edificada, población) son ESTIMACIONES razonadas por clima/geografía/
-- densidad poblacional típica de cada ciudad — NO son mediciones de campo ni salen
-- de sensores IoT reales. Se marcan explícitamente como "[ESTIMADO - no verificado]"
-- en la descripción. Si vas a citar estos números en la tesis, reemplázalos por datos
-- reales (SENAMHI, censos INEI, estudios locales) antes de publicar resultados.
--
-- No modifica ni borra las 6 zonas de microescala existentes (zona-centro, etc.).
-- Es idempotente: correrla dos veces no duplica filas (ON CONFLICT DO NOTHING).

insert into public.urban_zones
  (id, name, district, department, description, vulnerability_level,
   target_population, vulnerable_population, baseline_temp, baseline_pm25,
   tree_cover, built_density, primary_pollution_source, geometry_coords, sensors_count)
values
  ('zona-chepen', 'Chepén (Centro Urbano)', 'Chepén', 'La Libertad',
   '[ESTIMADO - no verificado] Centro urbano de la provincia de Chepén, valle agrícola costero de La Libertad.',
   'Media', 32000, 9600, 25.8, 24.5, 12.0, 55.0,
   'Tráfico vehicular local y quema agrícola estacional en el valle Jequetepeque.', '[]'::jsonb, 0),

  ('zona-guadalupe', 'Guadalupe (Centro Urbano)', 'Guadalupe', 'La Libertad',
   '[ESTIMADO - no verificado] Distrito de Guadalupe, provincia de Chepén, La Libertad.',
   'Media', 22000, 6600, 25.5, 22.0, 14.0, 50.0,
   'Tráfico vehicular local y actividad agroindustrial cercana.', '[]'::jsonb, 0),

  ('zona-chocope', 'Chocope (Centro Urbano)', 'Chocope', 'La Libertad',
   '[ESTIMADO - no verificado] Distrito de Chocope, provincia de Ascope, La Libertad.',
   'Media', 16000, 4800, 24.6, 20.5, 16.0, 45.0,
   'Actividad agroindustrial azucarera y quema periódica de residuos de caña.', '[]'::jsonb, 0),

  ('zona-viru', 'Virú (Centro Urbano)', 'Virú', 'La Libertad',
   '[ESTIMADO - no verificado] Provincia de Virú, polo agroexportador de La Libertad.',
   'Media', 38000, 11400, 23.9, 23.8, 10.0, 52.0,
   'Tráfico de carga agroexportadora y polvo de vías sin asfaltar.', '[]'::jsonb, 0),

  ('zona-pacasmayo', 'Pacasmayo (Centro Urbano)', 'Pacasmayo', 'La Libertad',
   '[ESTIMADO - no verificado] Ciudad portuaria de Pacasmayo, La Libertad.',
   'Media', 15000, 4500, 20.8, 17.5, 8.0, 48.0,
   'Emisiones portuarias e industria cementera cercana.', '[]'::jsonb, 0),

  ('zona-cajamarca', 'Cajamarca (Centro Histórico)', 'Cajamarca', 'Cajamarca',
   '[ESTIMADO - no verificado] Centro histórico de la ciudad de Cajamarca (~2,750 msnm).',
   'Alta', 220000, 66000, 15.9, 19.0, 18.0, 62.0,
   'Tráfico vehicular urbano en altitud y actividad minera regional cercana.', '[]'::jsonb, 0),

  ('zona-chiclayo', 'Chiclayo (Centro Urbano)', 'Chiclayo', 'Lambayeque',
   '[ESTIMADO - no verificado] Centro urbano de la ciudad de Chiclayo, capital de la región Lambayeque.',
   'Alta', 310000, 93000, 26.4, 34.0, 9.0, 68.0,
   'Alta densidad de tráfico vehicular y comercio informal en el centro urbano.', '[]'::jsonb, 0)
on conflict (id) do nothing;
