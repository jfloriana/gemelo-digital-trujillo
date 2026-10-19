-- Catálogo de figuras y tablas del informe de tesis (GemeloDigital_SBN.docx),
-- descargables desde el panel "Anexos de Tesis" de la app. Lectura pública;
-- eliminar/editar requiere rol privilegiado (investigador o admin_iot).

create table if not exists public.thesis_annex_items (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('figure','table')),
  code text not null,
  file_path text not null,
  caption text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists idx_thesis_annex_code on public.thesis_annex_items(code);

alter table public.thesis_annex_items enable row level security;

drop policy if exists "thesis_annex_select_all" on public.thesis_annex_items;
create policy "thesis_annex_select_all" on public.thesis_annex_items for select using (true);
drop policy if exists "thesis_annex_write_privileged" on public.thesis_annex_items;
create policy "thesis_annex_write_privileged" on public.thesis_annex_items for all using (public.is_privileged()) with check (public.is_privileged());

insert into public.thesis_annex_items (kind, code, file_path, caption, sort_order) values
  ('figure', 'Figura 1', '/thesis/figures/figura_01.png', 'Distribución de las 31 fuentes del corpus analítico por (a) año de publicación, (b) escala espacial y (c) tecnología o enfoque primario.', 0),
  ('figure', 'Figura 2', '/thesis/figures/figura_02.png', 'Marco de referencia de cinco capas para gemelos digitales de calidad del aire a microescala acoplados a SBN.', 1),
  ('figure', 'Figura 3', '/thesis/figures/figura_03.png', 'Magnitudes reportadas: (a) reducción de temperatura y (b) cambios en contaminantes.', 2),
  ('figure', 'Figura 4', '/thesis/figures/figura_04.png', 'Interfaz del prototipo de Trujillo: visor tridimensional del cañón del Centro Histórico con telemetría y simulación con SBN.', 3),
  ('figure', 'Figura 5', '/thesis/figures/figura_05.png', 'Módulos del prototipo: integración IoT, calibración en dos etapas, inyector de paquetes y simulador de SBN.', 4),
  ('figure', 'Figura A1', '/thesis/figures/figura_a1.png', 'Reporte automático de la plataforma, página 1 de 3: diagnóstico de microescala por zona (OE1) y telemetría IoT (OE2).', 5),
  ('figure', 'Figura A2', '/thesis/figures/figura_a2.png', 'Reporte automático de la plataforma, página 2 de 3: contraste con la referencia pública y desempeño de modelos (OE3).', 6),
  ('figure', 'Figura A3', '/thesis/figures/figura_a3.png', 'Reporte automático de la plataforma, página 3 de 3: catálogo de SBN (OE4) y matriz de cumplimiento de objetivos (OE5).', 7),
  ('figure', 'Figura B1', '/thesis/figures/figura_b1.png', 'Pantalla de inicio de sesión: módulos de calibración, aprendizaje, simulador de SBN y políticas públicas, accesos por rol.', 8),
  ('figure', 'Figura B2', '/thesis/figures/figura_b2.png', 'Módulo OE1, diagnóstico de la variabilidad microescalar: alertas ECA/OMS/calor y fichas de las 14 zonas.', 9),
  ('figure', 'Figura B3', '/thesis/figures/figura_b3.png', 'Módulo de monitoreo IoT: protocolo de comunicación, calibración en dos etapas e inyector de paquetes.', 10),
  ('figure', 'Figura B4', '/thesis/figures/figura_b4.png', 'Módulo OE2, arquitectura del gemelo en tres capas y pasos del marco conceptual REFLECT.', 11),
  ('figure', 'Figura B5', '/thesis/figures/figura_b5.png', 'Módulo OE3, modelos de aprendizaje: tarjetas de modelos, arquitectura 1D-CNN, importancia de variables y pronóstico 24h.', 12),
  ('figure', 'Figura B6', '/thesis/figures/figura_b6.png', 'Laboratorio de entrenamiento: conjunto de 96 filas (24 de referencia pública y 72 de nodos calibrados).', 13),
  ('figure', 'Figura B7', '/thesis/figures/figura_b7.png', 'Módulo OE5, validación y política pública: cobertura de monitoreo, dictamen y matriz de cumplimiento.', 14),
  ('figure', 'Figura B8', '/thesis/figures/figura_b8.png', 'Centro de exportación de reportes (Excel, PDF, Word y CSV) y vista previa de los datos compilados por zona.', 15),
  ('table', 'Tabla 1', '/thesis/tables/tabla_01.csv', 'Cadenas de búsqueda de replicación por base de datos (ventana 2020-2026).', 16),
  ('table', 'Tabla 2', '/thesis/tables/tabla_02.csv', 'Criterios de inclusión y exclusión.', 17),
  ('table', 'Tabla 3', '/thesis/tables/tabla_03.csv', 'Variables de extracción y definición operativa.', 18),
  ('table', 'Tabla 4', '/thesis/tables/tabla_04.csv', 'Inventario de las 40 fuentes únicas según escala espacial y tecnología principal.', 19),
  ('table', 'Tabla 5', '/thesis/tables/tabla_05.csv', 'Frecuencias de las 31 fuentes del corpus por año, escala espacial y tecnología primaria.', 20),
  ('table', 'Tabla 6', '/thesis/tables/tabla_06.csv', 'Cobertura de las cinco capas funcionales en las 31 fuentes del corpus.', 21),
  ('table', 'Tabla 7', '/thesis/tables/tabla_07.csv', 'Tipos de SBN evaluados en las 17 fuentes del corpus que abordan mitigación de calor y/o contaminación.', 22),
  ('table', 'Tabla 8', '/thesis/tables/tabla_08.csv', 'Magnitudes de efecto reportadas, con métrica unificada y procedencia.', 23),
  ('table', 'Tabla 9', '/thesis/tables/tabla_09.csv', 'Reducción media de temperatura del aire por tipo de infraestructura verde-azul según la síntesis A30.', 24),
  ('table', 'Tabla 10', '/thesis/tables/tabla_10.csv', 'Estadísticos descriptivos de las magnitudes de efecto extraídas.', 25),
  ('table', 'Tabla 11', '/thesis/tables/tabla_11.csv', 'Evidencia sobre la compensación entre enfriamiento y ventilación, y regla de diseño que motiva.', 26),
  ('table', 'Tabla 12', '/thesis/tables/tabla_12.csv', 'Respuestas a las preguntas de investigación y certeza de la evidencia.', 27),
  ('table', 'Tabla 13', '/thesis/tables/tabla_13.csv', 'Correspondencia entre las capas del marco y los módulos del prototipo de Trujillo.', 28),
  ('table', 'Tabla 14', '/thesis/tables/tabla_14.csv', 'Zonas críticas de Trujillo registradas en el prototipo.', 29),
  ('table', 'Tabla 15', '/thesis/tables/tabla_15.csv', 'Lecturas de los nodos de bajo costo del prototipo (instantánea del 1 de octubre de 2026).', 30),
  ('table', 'Tabla 16', '/thesis/tables/tabla_16.csv', 'Contraste de los nodos calibrados con la referencia pública (12 lecturas pareadas por nodo).', 31),
  ('table', 'Tabla 17', '/thesis/tables/tabla_17.csv', 'Catálogo de SBN del prototipo y valores comparables en las fuentes revisadas.', 32),
  ('table', 'Tabla 18', '/thesis/tables/tabla_18.csv', 'Comparación del marco propuesto con marcos y arquitecturas previos del corpus.', 33),
  ('table', 'Tabla 19', '/thesis/tables/tabla_19.csv', 'Amenazas a la validez y mitigación.', 34)
on conflict (code) do update set file_path = excluded.file_path, caption = excluded.caption, sort_order = excluded.sort_order;
