-- Migración 0004: nodos virtuales de referencia pública (datasets abiertos).
-- Crea 2 nodos que NO son hardware propio: replican datos abiertos para
-- contrastar la calibración 2-etapas (OE1/OE3) sin contaminar la serie IoT.
--   sensor-openmeteo-trj-01 → Open-Meteo (reanalysis/forecast, siempre disponible)
--   sensor-openaq-trj-01    → OpenAQ v3 (estación real más cercana; puede no haber
--                            ninguna en Trujillo → el endpoint lo marca en qa_flags)
-- Reglas de honestidad: is_calibrated=false, calibration_status='En Validación',
-- R² en 0 (no aplica), y todo lo estimado va en qa_flags + raw_payload.
-- EJECUTAR EN 2 PASOS (Postgres no permite usar un valor nuevo de enum en la
-- misma transacción donde se crea — error 55P04):
--   PASO 1: corre SOLO el bloque "PASO 1" (el ALTER TYPE) y espera Success.
--   PASO 2: corre el bloque "PASO 2" (el INSERT).
-- Idempotente: puedes repetir ambos sin duplicar nada.

-- ==================== PASO 1 (correr solo, primero) ====================
-- Nuevo valor de enum para distinguir nodos virtuales (Postgres 15+: IF NOT EXISTS ok).
alter type public.sensor_type add value if not exists 'Referencia pública (OpenAQ/Open-Meteo)';

-- ==================== PASO 2 (seleccionar solo este bloque y correr) ====================
insert into public.sensor_nodes
  (id, code, name, zone_id, zone_name, lat, lng, elevation,
   street_canyon_hw_ratio, canopy_cover_percent, sealed_surface_percent, traffic_density,
   sensor_type, calibration_status, r2_score_raw, r2_score_calibrated, status)
values
  ('sensor-openmeteo-trj-01', 'PUB-METEO-01',
   'Referencia pública Open-Meteo — Trujillo Centro (virtual, sin hardware)',
   'zona-centro', 'Centro Histórico',
   -8.1116, -79.0287, 34,
   1.60, 5.80, 84.50, 'Medio',
   'Referencia pública (OpenAQ/Open-Meteo)', 'En Validación', 0.00, 0.00, 'online'),

  ('sensor-openaq-trj-01', 'PUB-OPENAQ-01',
   'Referencia pública OpenAQ — estación más cercana a Trujillo (virtual, sin hardware)',
   'zona-centro', 'Centro Histórico',
   -8.1116, -79.0287, 34,
   1.60, 5.80, 84.50, 'Medio',
   'Referencia pública (OpenAQ/Open-Meteo)', 'En Validación', 0.00, 0.00, 'online')
on conflict (id) do nothing;
