-- ============================================================
-- Migration 0001 — Lock down roles & profiles
-- Aplicar manualmente en el proyecto Supabase (SQL Editor) o via CLI.
-- Idempotente: CREATE OR REPLACE / DROP ... IF EXISTS.
--
-- Objetivos:
--   1) El registro NUNCA confía en raw_user_meta_data->>'role' -> siempre 'ciudadano'.
--   2) Un usuario no puede auto-promoverse: RLS UPDATE con WITH CHECK + trigger
--      BEFORE UPDATE que bloquea el cambio de 'role' salvo sesión privilegiada.
--   3) La tabla profiles deja de exponer todos los emails: sólo el propio o
--      usuarios privilegiados. anon no lee nada.
--
-- NOTA IMPORTANTE (recursión RLS): is_privileged() / can_simulate() consultan
-- public.profiles. Como ahora una política SELECT de profiles llama a
-- is_privileged(), estas funciones DEBEN ser SECURITY DEFINER para evitar
-- "infinite recursion detected in policy for relation profiles".
-- ============================================================

-- ------------------------------------------------------------
-- 1) Forzar rol en el signup — nunca confiar en el metadata del cliente
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, institution)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    'ciudadano'::user_role,  -- SIEMPRE el rol menos privilegiado; el metadata del cliente NO decide el rol
    coalesce(new.raw_user_meta_data->>'institution', 'Comunidad Digital Trujillo')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ------------------------------------------------------------
-- 2) Impedir la auto-promoción vía RLS + trigger
-- ------------------------------------------------------------
-- is_privileged() ya existe (investigador / admin_iot). Se recrea como
-- SECURITY DEFINER para que su SELECT interno sobre profiles NO dispare RLS
-- (evita recursión con profiles_select_privileged).
create or replace function public.is_privileged() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('investigador','admin_iot')
  );
$$;

-- can_simulate() comparte el mismo patrón (SELECT sobre profiles dentro de
-- políticas de otras tablas). Se recrea como SECURITY DEFINER por consistencia
-- y para evitar cualquier interacción con RLS.
create or replace function public.can_simulate() returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('investigador','planificador','analista')
  );
$$;

-- Trigger: si la sesión no es privilegiada, cualquier intento de cambiar 'role'
-- en la propia fila (o en otra) se rechaza con error claro.
create or replace function public.enforce_role_immutable()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_privileged() then
    raise exception 'No autorizado: no puedes cambiar tu rol. Contacta a un administrador.'
      using errcode = '42501';
  end if;
  return new;
end; $$;

drop trigger if exists enforce_role_immutable on public.profiles;
create trigger enforce_role_immutable
  before update on public.profiles
  for each row execute procedure public.enforce_role_immutable();

-- Política UPDATE: el usuario edita su propia fila; WITH CHECK mantiene la fila
-- como suya. El bloqueo por columna 'role' lo hace el trigger de arriba.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update
  using (auth.uid() = id or public.is_privileged())
  with check (auth.uid() = id or public.is_privileged());

-- ------------------------------------------------------------
-- 3) Dejar de exponer todos los emails
-- ------------------------------------------------------------
-- Antes: profiles_select_all USING (true) -> cualquiera (incl. anon) leía todo.
-- Ahora: cada quien lee su fila; los privilegiados leen todas; anon nada.
-- NOTA: AuthContext.fetchAllProfiles() ahora sólo devolverá filas para
--       usuarios privilegiados (investigador / admin_iot). Para el resto
--       devolverá únicamente su propio perfil.
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_select_privileged" on public.profiles;
create policy "profiles_select_privileged" on public.profiles
  for select using (public.is_privileged());

-- profiles_insert_own se mantiene igual (with check auth.uid() = id).
