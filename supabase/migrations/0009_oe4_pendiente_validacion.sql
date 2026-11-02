-- 0009: el objetivo OE4 pasa a "pendiente de validación" y se rotulan las cifras fijas de OE5.
-- Idempotente: se puede ejecutar más de una vez. Ejecutar en el SQL Editor de Supabase.
-- Motivo: los valores 3,2 / 3,8 °C y 28,5 % no salen del modelo corregido (src/utils/nbsModel.ts).

update public.thesis_objectives
   set status = 'En Ejecución',
       progress_percent = 75,
       summary = 'Simulador A/B permite a la Municipalidad evaluar proyectos antes de su ejecución física, respaldado en el marco GREENPASS® (Abbas et al., 2025). Los resultados del simulador están pendientes de validación.'
 where code = 'OE4';

update public.thesis_objective_metrics
   set achieved = 'Pendiente de validación: sin resultado validado; el simulador OE4 entrega valores ilustrativos de un modelo heurístico no validado',
       compliance = false
 where objective_code = 'OE4'
   and name in ('Reducción térmica microclimática proyectada',
                'Reducción de exposición a PM2.5 por deposición foliar',
                'Mejora en Confort Térmico Score (TCS / PET)');

update public.thesis_objective_metrics
   set achieved = achieved || ' — valor fijo, ilustrativo, no validado'
 where objective_code = 'OE5'
   and name in ('Validación estadística de Hipótesis General',
                'Población vulnerable protegida estimada',
                'Retorno de inversión social (Costo-Efectividad)')
   and achieved not like '%no validado';
