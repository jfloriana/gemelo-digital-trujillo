-- Migración 0005: habilita Realtime en las tablas que el frontend ya suscribe.
-- Sin esto, los channels 'realtime-zones' y 'realtime-readings' de
-- useSupabaseData.ts nunca reciben eventos y las zonas recién registradas
-- solo aparecen con F5 (el onSaved anterior tampoco refrescaba).
-- Ejecutar UNA vez en Supabase SQL Editor. Idempotente.
-- (urban_zones no estaba ni listada en el schema: también se agrega.)

do $$ begin
  alter publication supabase_realtime add table public.urban_zones;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.sensor_nodes;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.environmental_readings;
exception when duplicate_object then null; end $$;

do $$ begin
  alter publication supabase_realtime add table public.simulation_scenarios;
exception when duplicate_object then null; end $$;
