-- Agrega 7 capturas nuevas del sistema en producción (19-oct-2026) al
-- catálogo de Anexos de Tesis: no estaban en el informe original
-- (GemeloDigital_SBN.docx), pero sí en el documento complementario
-- GemeloDigital_SBN_Interpretacion_Figuras.docx. Idempotente: se puede
-- volver a correr sin duplicar filas.

insert into public.thesis_annex_items (kind, code, file_path, caption, sort_order) values
  ('figure', 'Captura 1', '/thesis/figures/captura_01_hub3d.jpg', 'Hub 3D en vivo del sistema en producción (19-oct-2026): cañón urbano del Centro Histórico con malla discretizada de 5×5 m y telemetría sincronizada en tiempo real.', 35),
  ('figure', 'Captura 2', '/thesis/figures/captura_02_oe1_diagnostico.jpg', 'Módulo OE1 en producción: alertas ECA-Aire/OMS/calor y catálogo de zonas filtrable por departamento, con datos en vivo.', 36),
  ('figure', 'Captura 3', '/thesis/figures/captura_03_iot_monitoreo.jpg', 'Módulo de Monitoreo IoT en producción: protocolo MQTT, calibración en dos etapas y nodos públicos de referencia en vivo.', 37),
  ('figure', 'Captura 4', '/thesis/figures/captura_04_oe3_modelos_ia.jpg', 'Módulo OE3 en producción: arquitectura 1D-CNN desplegada, curva de convergencia real y pronóstico a 24 horas.', 38),
  ('figure', 'Captura 5', '/thesis/figures/captura_05_oe4_simulador_nbs.jpg', 'Módulo OE4 en producción: simulador de SBN con parámetros de intervención y resultados del escenario activo.', 39),
  ('figure', 'Captura 6', '/thesis/figures/captura_06_oe5_validacion.jpg', 'Módulo OE5 en producción: cobertura real de monitoreo y dictamen estadístico de la hipótesis general.', 40),
  ('figure', 'Captura 7', '/thesis/figures/captura_07_anexos_tesis.jpg', 'Módulo "Anexos de Tesis" (funcionalidad nueva, no incluida en el documento original) mostrándose a sí mismo.', 41)
on conflict (code) do update set file_path = excluded.file_path, caption = excluded.caption, sort_order = excluded.sort_order;
