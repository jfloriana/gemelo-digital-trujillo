// Vercel Function: GET /api/baseline-live?zone_id=zona-centro
// Línea base EFECTIVA para simulación y pronóstico (Fase B).
// Orden de preferencia, siempre explícito en `source`:
//   1) última lectura del nodo CALIBRADO propio  → source: 'calibrated'
//   2) si no hay, referencia PÚBLICA (Open-Meteo/OpenAQ) → source: 'public_ref'
//   3) si no hay, baseline estático de urban_zones  → source: 'baseline'
// Solo lectura con ANON key (las policies SELECT ya son públicas). Sin secreto.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !ANON_KEY) {
    return res.status(500).json({ error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.' });
  }

  const zone_id = String(req.query.zone_id || 'zona-centro').slice(0, 80);

  try {
    const supabase = createClient(SUPABASE_URL, ANON_KEY);
    const { data: zone, error: zoneErr } = await supabase
      .from('urban_zones')
      .select('id,baseline_temp,baseline_pm25')
      .eq('id', zone_id)
      .maybeSingle();
    if (zoneErr || !zone) return res.status(404).json({ error: `Zona ${zone_id} no existe` });

    const { data: zoneSensors } = await supabase
      .from('sensor_nodes')
      .select('id,code,sensor_type')
      .eq('zone_id', zone.id)
      .limit(12);

    if (zoneSensors?.length) {
      const ids = zoneSensors.map((s) => s.id);
      const { data: readings } = await supabase
        .from('environmental_readings')
        .select('sensor_id,measured_at,temperature,pm25')
        .in('sensor_id', ids)
        .order('measured_at', { ascending: false })
        .limit(30);
      const newest = {};
      for (const r of readings || []) {
        if (!newest[r.sensor_id]) newest[r.sensor_id] = r;
      }
      const isVirtual = (id) =>
        zoneSensors.find((s) => s.id === id)?.sensor_type === 'Referencia pública (OpenAQ/Open-Meteo)';
      const sorted = Object.values(newest).sort(
        (a, b) => new Date(b.measured_at) - new Date(a.measured_at)
      );
      const cal = sorted.find((r) => !isVirtual(r.sensor_id));
      if (cal) {
        return res.status(200).json({
          zone_id: zone.id,
          temp: Number(cal.temperature),
          pm25: Number(cal.pm25),
          source: 'calibrated',
          sensor_code: zoneSensors.find((s) => s.id === cal.sensor_id)?.code ?? null,
          measured_at: cal.measured_at,
        });
      }
      const pub = sorted.find((r) => isVirtual(r.sensor_id));
      if (pub) {
        return res.status(200).json({
          zone_id: zone.id,
          temp: Number(pub.temperature),
          pm25: Number(pub.pm25),
          source: 'public_ref',
          sensor_code: zoneSensors.find((s) => s.id === pub.sensor_id)?.code ?? null,
          measured_at: pub.measured_at,
        });
      }
    }

    return res.status(200).json({
      zone_id: zone.id,
      temp: Number(zone.baseline_temp),
      pm25: Number(zone.baseline_pm25),
      source: 'baseline',
      sensor_code: null,
      measured_at: null,
    });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
