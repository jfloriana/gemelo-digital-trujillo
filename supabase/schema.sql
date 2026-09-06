-- ============================================================
-- Gemelo Digital Trujillo — Esquema Supabase (Postgres 15)
-- Migración inicial: auth + zonas + sensores + lecturas + catálogos + simulaciones
-- Generado: 2026-09-07 — listo para pegar en Supabase SQL Editor
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- 1) ENUMS
-- ============================================================
do $$ begin
  create type user_role as enum ('investigador','planificador','analista','admin_iot','ciudadano');
exception when duplicate_object then null; end $$;

do $$ begin
  create type vulnerability_level as enum ('Alta','Muy Alta','Media','Crítica');
exception when duplicate_object then null; end $$;

do $$ begin
  create type traffic_density as enum ('Bajo','Medio','Alto','Muy Crítico');
exception when duplicate_object then null; end $$;

do $$ begin
  create type sensor_type as enum ('PMS5003 + SHT31','Sensirion SPS30 + BME680','Alphasense OPC-N3');
exception when duplicate_object then null; end $$;

do $$ begin
  create type calibration_status as enum ('Calibrado (2-Etapas Zhivkov)','Sin Calibrar','En Validación');
exception when duplicate_object then null; end $$;

do $$ begin
  create type node_status as enum ('online','warning','offline');
exception when duplicate_object then null; end $$;

do $$ begin
  create type aqi_category as enum ('Buena','Moderada','Dañina para grupos sensibles','Dañina','Muy dañina','Peligrosa');
exception when duplicate_object then null; end $$;

do $$ begin
  create type nbs_type as enum ('arbolado_corredor','techo_verde','muro_verde','pavimento_permeable','jardin_lluvia');
exception when duplicate_object then null; end $$;

do $$ begin
  create type model_status as enum ('Recomendado','Evaluado','Línea Base');
exception when duplicate_object then null; end $$;

do $$ begin
  create type objective_status as enum ('Completado','En Ejecución','Validado');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingestion_protocol as enum ('MQTT','REST_API','WEBSOCKET');
exception when duplicate_object then null; end $$;

do $$ begin
  create type ingestion_status as enum ('ACCEPTED_CALIBRATED','ACCEPTED_RAW','REJECTED_QAQC');
exception when duplicate_object then null; end $$;

do $$ begin
  create type simulation_model_type as enum ('1d_cnn','gnn','random_forest','bi_lstm','xgboost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type canyon_orientation as enum ('N-S','E-O','NE-SO','NO-SE');
exception when duplicate_object then null; end $$;

-- ============================================================
-- 2) PROFILES — espejo de auth.users
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role user_role not null default 'ciudadano',
  institution text not null default 'Comunidad Digital Trujillo',
  avatar_url text,
  created_at timestamptz not null default now(),
  last_login timestamptz
);
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);

-- Trigger: auto-crear profile al registrarse en auth.users
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, institution)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'ciudadano'),
    coalesce(new.raw_user_meta_data->>'institution', 'Comunidad Digital Trujillo')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: sincronizar email si cambia en auth
create or replace function public.handle_user_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end; $$;

drop trigger if exists on_auth_user_updated on auth.users;
create trigger on_auth_user_updated
  after update of email on auth.users
  for each row execute procedure public.handle_user_update();

-- ============================================================
-- 3) URBAN_ZONES — 6 zonas críticas de Trujillo
-- ============================================================
create table if not exists public.urban_zones (
  id text primary key, -- ej: zona-centro
  name text not null,
  district text not null,
  department text not null default 'La Libertad',
  description text not null,
  vulnerability_level vulnerability_level not null,
  target_population integer not null check (target_population >= 0),
  vulnerable_population integer not null check (vulnerable_population >= 0),
  baseline_temp numeric(4,1) not null,
  baseline_pm25 numeric(5,1) not null,
  tree_cover numeric(4,1) not null check (tree_cover >= 0 and tree_cover <= 100),
  built_density numeric(4,1) not null check (built_density >= 0 and built_density <= 100),
  primary_pollution_source text not null,
  geometry_coords jsonb not null default '[]'::jsonb, -- [{x,y}]
  sensors_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_zones_district on public.urban_zones(district);
create index if not exists idx_zones_department on public.urban_zones(department);
create index if not exists idx_zones_vuln on public.urban_zones(vulnerability_level);

-- updated_at trigger
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists set_urban_zones_updated on public.urban_zones;
create trigger set_urban_zones_updated before update on public.urban_zones for each row execute procedure public.set_updated_at();

-- ============================================================
-- 4) SENSOR_NODES — nodos físicos IoT
-- ============================================================
create table if not exists public.sensor_nodes (
  id text primary key, -- sensor-trj-01
  code text unique not null, -- TRJ-IOT-01
  name text not null,
  zone_id text not null references public.urban_zones(id) on delete restrict,
  zone_name text not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  elevation numeric(6,1) not null,
  street_canyon_hw_ratio numeric(4,2) not null,
  canopy_cover_percent numeric(5,2) not null,
  sealed_surface_percent numeric(5,2) not null,
  traffic_density traffic_density not null,
  sensor_type sensor_type not null,
  calibration_status calibration_status not null default 'Sin Calibrar',
  r2_score_raw numeric(4,2) not null check (r2_score_raw between 0 and 1),
  r2_score_calibrated numeric(4,2) not null check (r2_score_calibrated between 0 and 1),
  status node_status not null default 'offline',
  rssi integer,
  battery_pct integer check (battery_pct between 0 and 100),
  -- última lectura desnormalizada para dashboard sin join (opcional)
  last_reading jsonb,
  last_reading_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sensor_zone on public.sensor_nodes(zone_id);
create index if not exists idx_sensor_status on public.sensor_nodes(status);
create index if not exists idx_sensor_code on public.sensor_nodes(code);
drop trigger if exists set_sensor_nodes_updated on public.sensor_nodes;
create trigger set_sensor_nodes_updated before update on public.sensor_nodes for each row execute procedure public.set_updated_at();

-- ============================================================
-- 5) ENVIRONMENTAL_READINGS — serie temporal (tabla separada)
--    Particionable por mes si escala > 10M filas (ver nota abajo)
-- ============================================================
create table if not exists public.environmental_readings (
  id uuid primary key default uuid_generate_v4(),
  sensor_id text not null references public.sensor_nodes(id) on delete cascade,
  zone_id text not null references public.urban_zones(id) on delete restrict,
  measured_at timestamptz not null default now(),
  -- contaminantes
  pm25 numeric(6,2) not null,
  pm10 numeric(6,2) not null,
  no2 numeric(6,2) not null,
  o3 numeric(6,2) not null,
  co numeric(6,3) not null,
  co2 numeric(7,1) not null,
  -- microclima
  temperature numeric(5,2) not null,
  humidity numeric(5,2) not null,
  wind_speed numeric(5,2) not null,
  wind_direction text not null default 'SO',
  solar_radiation numeric(7,1) not null,
  heat_index numeric(5,2) not null,
  uhi_delta numeric(5,2) not null,
  pet_score numeric(5,2) not null,
  tcs_score integer not null check (tcs_score between 0 and 100),
  aqi_index integer not null,
  aqi_category aqi_category not null,
  -- trazabilidad calibración
  is_calibrated boolean not null default true,
  raw_payload jsonb, -- payload crudo MQTT/REST si aplica
  qa_flags text[] not null default '{}',
  created_at timestamptz not null default now()
);
-- Índices críticos para series de tiempo
create index if not exists idx_readings_sensor_time on public.environmental_readings(sensor_id, measured_at desc);
create index if not exists idx_readings_zone_time on public.environmental_readings(zone_id, measured_at desc);
create index if not exists idx_readings_measured_at on public.environmental_readings(measured_at desc);
create index if not exists idx_readings_aqi on public.environmental_readings(aqi_category);

-- Nota: si > 1M lecturas/mes, convierte a hypertable o partición:
-- select * from pg_partman.create_parent('public.environmental_readings','measured_at','native','monthly');

-- ============================================================
-- 6) AI_MODELS — benchmark 5 modelos
-- ============================================================
create table if not exists public.ai_models (
  id text primary key, -- model-1d-cnn
  name text not null,
  model_type simulation_model_type,
  architecture text not null,
  reference_author text not null,
  year integer not null check (year between 2020 and 2030),
  r2 numeric(6,4) not null check (r2 between 0 and 1),
  rmse numeric(6,2) not null,
  mae numeric(6,2) not null,
  mape numeric(6,2) not null,
  training_time_sec integer not null,
  inference_time_ms numeric(6,2) not null,
  spatial_resolution text not null,
  best_fit_use text not null,
  status model_status not null,
  features text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 7) NBS_INTERVENTIONS — catálogo 5 soluciones basadas en naturaleza
-- ============================================================
create table if not exists public.nbs_interventions (
  id text primary key, -- nbs-arbolado
  name text not null,
  type nbs_type not null,
  description text not null,
  recommended_flora text[] not null default '{}',
  unit_cost_pen numeric(10,2) not null check (unit_cost_pen >= 0),
  unit_maintenance_pen_year numeric(10,2) not null check (unit_maintenance_pen_year >= 0),
  cooling_capacity_c numeric(4,2) not null,
  pm_reduction_percent numeric(5,2) not null,
  water_retention_l_m2 numeric(7,2) not null,
  co2_sequestration_kg_year numeric(7,2) not null,
  acoustic_damping_db numeric(4,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_nbs_type on public.nbs_interventions(type);

-- ============================================================
-- 8) SIMULATION_SCENARIOS — escenarios guardados por usuario
-- ============================================================
create table if not exists public.simulation_scenarios (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  zone_id text not null references public.urban_zones(id) on delete restrict,
  zone_name text not null,
  ml_params jsonb, -- SimulationMlParams serializado
  ambient_wind_speed numeric(5,2) not null,
  ambient_solar_radiation numeric(7,2) not null,
  simulation_hours integer not null default 24 check (simulation_hours > 0),
  results jsonb not null, -- SimulationScenario.results serializado
  total_budget_pen numeric(12,2) generated always as ((results->>'totalBudgetPEN')::numeric) stored,
  co2_captured_ton_year numeric(10,3) generated always as ((results->>'co2CapturedTonYear')::numeric) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_scenarios_user on public.simulation_scenarios(user_id, created_at desc);
create index if not exists idx_scenarios_zone on public.simulation_scenarios(zone_id);
create index if not exists idx_scenarios_created on public.simulation_scenarios(created_at desc);
drop trigger if exists set_scenarios_updated on public.simulation_scenarios;
create trigger set_scenarios_updated before update on public.simulation_scenarios for each row execute procedure public.set_updated_at();

-- ============================================================
-- 9) SIMULATION_SCENARIO_NBS — junction N:N escenario <-> NbS
-- ============================================================
create table if not exists public.simulation_scenario_nbs (
  id uuid primary key default uuid_generate_v4(),
  scenario_id uuid not null references public.simulation_scenarios(id) on delete cascade,
  nbs_id text not null references public.nbs_interventions(id) on delete restrict,
  quantity_or_area numeric(12,2) not null check (quantity_or_area > 0),
  created_at timestamptz not null default now(),
  unique(scenario_id, nbs_id)
);
create index if not exists idx_scenario_nbs_scenario on public.simulation_scenario_nbs(scenario_id);
create index if not exists idx_scenario_nbs_nbs on public.simulation_scenario_nbs(nbs_id);

-- ============================================================
-- 10) THESIS_OBJECTIVES — OE1..OE5
-- ============================================================
create table if not exists public.thesis_objectives (
  code text primary key, -- OE1
  title text not null,
  status objective_status not null,
  progress_percent integer not null check (progress_percent between 0 and 100),
  summary text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists set_thesis_updated on public.thesis_objectives;
create trigger set_thesis_updated before update on public.thesis_objectives for each row execute procedure public.set_updated_at();

create table if not exists public.thesis_objective_metrics (
  id uuid primary key default uuid_generate_v4(),
  objective_code text not null references public.thesis_objectives(code) on delete cascade,
  name text not null,
  target text not null,
  achieved text not null,
  compliance boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_metrics_objective on public.thesis_objective_metrics(objective_code);

-- ============================================================
-- 11) INGESTION_LOGS — QA/QC de telemetría (MQTT/REST)
-- ============================================================
create table if not exists public.ingestion_logs (
  id uuid primary key default uuid_generate_v4(),
  measured_at timestamptz not null default now(),
  protocol ingestion_protocol not null,
  topic_or_endpoint text not null,
  sensor_code text not null,
  sensor_id text references public.sensor_nodes(id) on delete set null,
  zone_id text references public.urban_zones(id) on delete set null,
  status ingestion_status not null,
  raw_pm25 numeric(6,2),
  calibrated_pm25 numeric(6,2),
  raw_temp numeric(5,2),
  calibrated_temp numeric(5,2),
  raw_o3 numeric(6,2),
  calibrated_o3 numeric(6,2),
  qa_flags text[] not null default '{}',
  latency_ms integer,
  created_at timestamptz not null default now()
);
create index if not exists idx_ingestion_sensor on public.ingestion_logs(sensor_code, measured_at desc);
create index if not exists idx_ingestion_status on public.ingestion_logs(status);
create index if not exists idx_ingestion_time on public.ingestion_logs(measured_at desc);

-- ============================================================
-- 12) RLS — habilitar + policies
-- ============================================================
alter table public.profiles enable row level security;
alter table public.urban_zones enable row level security;
alter table public.sensor_nodes enable row level security;
alter table public.environmental_readings enable row level security;
alter table public.ai_models enable row level security;
alter table public.nbs_interventions enable row level security;
alter table public.simulation_scenarios enable row level security;
alter table public.simulation_scenario_nbs enable row level security;
alter table public.thesis_objectives enable row level security;
alter table public.thesis_objective_metrics enable row level security;
alter table public.ingestion_logs enable row level security;

-- Helper: es investigador/admin?
create or replace function public.is_privileged() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('investigador','admin_iot')
  );
$$;
create or replace function public.can_simulate() returns boolean language sql stable as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('investigador','planificador','analista')
  );
$$;

-- profiles
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

-- urban_zones: lectura pública (dashboard ciudadano), escritura solo privilegiados
drop policy if exists "zones_select_all" on public.urban_zones;
create policy "zones_select_all" on public.urban_zones for select using (true);
drop policy if exists "zones_write_privileged" on public.urban_zones;
create policy "zones_write_privileged" on public.urban_zones for all using (public.is_privileged()) with check (public.is_privileged());

-- sensor_nodes: lectura pública, escritura privilegiada + admin_iot
drop policy if exists "sensors_select_all" on public.sensor_nodes;
create policy "sensors_select_all" on public.sensor_nodes for select using (true);
drop policy if exists "sensors_write_privileged" on public.sensor_nodes;
create policy "sensors_write_privileged" on public.sensor_nodes for all using (
  public.is_privileged() or exists (select 1 from public.profiles where id=auth.uid() and role='analista')
) with check (
  public.is_privileged() or exists (select 1 from public.profiles where id=auth.uid() and role='analista')
);

-- readings: lectura pública autenticada + anon para dashboard, inserción via service_role o analista/admin_iot
drop policy if exists "readings_select_all" on public.environmental_readings;
create policy "readings_select_all" on public.environmental_readings for select using (true);
drop policy if exists "readings_insert_service" on public.environmental_readings;
create policy "readings_insert_service" on public.environmental_readings for insert with check (
  auth.role() = 'service_role' or public.is_privileged() or exists (select 1 from public.profiles where id=auth.uid() and role='analista')
);

-- ai_models / nbs: lectura pública, escritura solo investigador
drop policy if exists "models_select_all" on public.ai_models;
create policy "models_select_all" on public.ai_models for select using (true);
drop policy if exists "models_write_investigador" on public.ai_models;
create policy "models_write_investigador" on public.ai_models for all using (
  exists (select 1 from public.profiles where id=auth.uid() and role='investigador')
) with check (
  exists (select 1 from public.profiles where id=auth.uid() and role='investigador')
);
drop policy if exists "nbs_select_all" on public.nbs_interventions;
create policy "nbs_select_all" on public.nbs_interventions for select using (true);
drop policy if exists "nbs_write_investigador" on public.nbs_interventions;
create policy "nbs_write_investigador" on public.nbs_interventions for all using (
  exists (select 1 from public.profiles where id=auth.uid() and role='investigador')
) with check (
  exists (select 1 from public.profiles where id=auth.uid() and role='investigador')
);

-- scenarios: cada usuario CRUD sobre los suyos, todos pueden leer (para comparar), investigador puede ver todos
drop policy if exists "scenarios_select_own_or_public" on public.simulation_scenarios;
create policy "scenarios_select_own_or_public" on public.simulation_scenarios for select using (true);
drop policy if exists "scenarios_insert_own" on public.simulation_scenarios;
create policy "scenarios_insert_own" on public.simulation_scenarios for insert with check (auth.uid() = user_id and public.can_simulate());
drop policy if exists "scenarios_update_own" on public.simulation_scenarios;
create policy "scenarios_update_own" on public.simulation_scenarios for update using (auth.uid() = user_id);
drop policy if exists "scenarios_delete_own" on public.simulation_scenarios;
create policy "scenarios_delete_own" on public.simulation_scenarios for delete using (auth.uid() = user_id or public.is_privileged());

drop policy if exists "scenario_nbs_select_all" on public.simulation_scenario_nbs;
create policy "scenario_nbs_select_all" on public.simulation_scenario_nbs for select using (true);
drop policy if exists "scenario_nbs_write_owner" on public.simulation_scenario_nbs;
create policy "scenario_nbs_write_owner" on public.simulation_scenario_nbs for all using (
  exists (select 1 from public.simulation_scenarios s where s.id = scenario_id and s.user_id = auth.uid())
) with check (
  exists (select 1 from public.simulation_scenarios s where s.id = scenario_id and s.user_id = auth.uid())
);

-- thesis: lectura pública, escritura investigador
drop policy if exists "thesis_select_all" on public.thesis_objectives;
create policy "thesis_select_all" on public.thesis_objectives for select using (true);
drop policy if exists "thesis_write_priv" on public.thesis_objectives;
create policy "thesis_write_priv" on public.thesis_objectives for all using (public.is_privileged()) with check (public.is_privileged());
drop policy if exists "metrics_select_all" on public.thesis_objective_metrics;
create policy "metrics_select_all" on public.thesis_objective_metrics for select using (true);
drop policy if exists "metrics_write_priv" on public.thesis_objective_metrics;
create policy "metrics_write_priv" on public.thesis_objective_metrics for all using (public.is_privileged()) with check (public.is_privileged());

-- ingestion_logs: solo lectura privilegiada + escritura service_role
drop policy if exists "ingestion_select_priv" on public.ingestion_logs;
create policy "ingestion_select_priv" on public.ingestion_logs for select using (public.is_privileged());
drop policy if exists "ingestion_insert_service" on public.ingestion_logs;
create policy "ingestion_insert_service" on public.ingestion_logs for insert with check (auth.role() = 'service_role' or public.is_privileged());

-- ============================================================
-- 13) Realtime — habilitar para dashboard en vivo
-- ============================================================
-- Ejecuta en Supabase Dashboard > Database > Realtime si deseas live:
-- alter publication supabase_realtime add table public.environmental_readings;
-- alter publication supabase_realtime add table public.sensor_nodes;
-- alter publication supabase_realtime add table public.simulation_scenarios;

-- ============================================================
-- 14) Storage bucket para avatares/reportes (opcional)
-- ============================================================
-- insert into storage.buckets (id, name, public) values ('avatars','avatars', true) on conflict (id) do nothing;
-- insert into storage.buckets (id, name, public) values ('reports','reports', false) on conflict (id) do nothing;

-- ============================================================
-- FIN SCHEMA — ahora ejecuta seed.sql
-- ============================================================
