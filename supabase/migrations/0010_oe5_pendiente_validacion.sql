-- 0010: OE5 pasa a "En Ejecución / pendiente de validación" y OE4 y OE5 dejan de mostrar un porcentaje de avance.
-- Idempotente: se puede ejecutar más de una vez. Ejecutar en el SQL Editor de Supabase.
-- Motivo: no hay validación empírica de p-valor, población protegida ni B/C, y el 75 % de OE4 no tenía base.
-- "Sin porcentaje validado" se representa con progress_percent NULL.

alter table public.thesis_objectives alter column progress_percent drop not null;

update public.thesis_objectives
   set progress_percent = null
 where code = 'OE4';

update public.thesis_objectives
   set status = 'En Ejecución',
       progress_percent = null,
       summary = 'Sin validación empírica; resultados ilustrativos'
 where code = 'OE5';

update public.thesis_objective_metrics
   set achieved = 'Pendiente de validación: sin validación empírica; p < 0.001 es un valor fijo, ilustrativo, no validado',
       compliance = false
 where objective_code = 'OE5' and name = 'Validación estadística de Hipótesis General';

update public.thesis_objective_metrics
   set achieved = 'Pendiente de validación: sin validación empírica; 132,500 habitantes es un valor fijo, ilustrativo, no validado',
       compliance = false
 where objective_code = 'OE5' and name = 'Población vulnerable protegida estimada';

update public.thesis_objective_metrics
   set achieved = 'Pendiente de validación: sin validación empírica; B/C Ratio = 3.4 es un valor fijo, ilustrativo, no validado',
       compliance = false
 where objective_code = 'OE5' and name = 'Retorno de inversión social (Costo-Efectividad)';
