-- Políticas RLS para el bucket de Storage "thesis-annex", usado por el
-- botón "Capturar para Anexos" (html2canvas) en los gráficos de cada
-- módulo. El bucket ya fue creado (público, 10MB, solo PNG/JPEG); aquí
-- solo se agregan las políticas de storage.objects, lectura pública y
-- escritura para roles privilegiados, igual que thesis_annex_items.

insert into storage.buckets (id, name, public)
values ('thesis-annex', 'thesis-annex', true)
on conflict (id) do nothing;

drop policy if exists "thesis_annex_storage_select_all" on storage.objects;
create policy "thesis_annex_storage_select_all" on storage.objects
  for select using (bucket_id = 'thesis-annex');

drop policy if exists "thesis_annex_storage_write_privileged" on storage.objects;
create policy "thesis_annex_storage_write_privileged" on storage.objects
  for all using (bucket_id = 'thesis-annex' and public.is_privileged())
  with check (bucket_id = 'thesis-annex' and public.is_privileged());
