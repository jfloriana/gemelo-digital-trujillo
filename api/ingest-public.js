// Vercel Function: POST /api/ingest-public
// Ingesta GRATUITA de datasets públicos al gemelo digital:
//   Open-Meteo (sin API key) → temperatura, humedad, viento, radiación en Trujillo
//   OpenAQ v3 (key gratuita) → PM2.5/PM10/NO2/O3 de la estación real más cercana
// Normaliza al esquema de environmental_readings, escribe ingestion_logs y
// actualiza last_reading de los nodos virtuales (migración 0004).
// NO toca los 6 nodos IoT propios ni su serie calibrada (OE1/OE3 intactos).
//
// Seguridad: si CRON_SECRET está definido en Vercel, exige header
//   x-cron-secret: <mismo valor>. El workflow de GitHub Actions lo envía.
// Body opcional: { zone_id?, dry_run? } (dry_run=true no escribe nada).

import { createClient } from '@supabase/supabase-js';

const TRUJILLO = { lat: -8.1116, lng: -79.0287 };
const DEFAULT_ZONE = 'zona-centro';
const SENSOR_METEO = 'sensor-openmeteo-trj-01';
const SENSOR_OPENAQ = 'sensor-openaq-trj-01';

const degToCompass = (deg) => {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
  return dirs[Math.round(((Number(deg) % 360) + 360) % 360 / 45) % 8];
};

const aqiCategory = (pm25) => {
  if (pm25 <= 12) return 'Buena';
  if (pm25 <= 35.4) return 'Moderada';
  if (pm25 <= 55.4) return 'Dañina para grupos sensibles';
  if (pm25 <= 150.4) return 'Dañina';
  if (pm25 <= 250.4) return 'Muy dañina';
  return 'Peligrosa';
};

async function fetchOpenMeteo() {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${TRUJILLO.lat}&longitude=${TRUJILLO.lng}` +
    `&current=temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m` +
    `&hourly=shortwave_radiation&timezone=America%2FLima&forecast_days=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);
  const j = await r.json();
  const c = j.current || {};
  // Radiación de la hora más cercana a "ahora"
  let radiation = 0;
  try {
    const times = j.hourly?.time || [];
    const vals = j.hourly?.shortwave_radiation || [];
    const nowH = String(c.time || '').slice(0, 13);
    const idx = times.findIndex((t) => String(t).slice(0, 13) === nowH);
    radiation = Number(vals[idx >= 0 ? idx : vals.length - 1] ?? 0);
  } catch { radiation = 0; }
  return {
    temperature: Number(c.temperature_2m),
    humidity: Number(c.relative_humidity_2m),
    apparent: Number(c.apparent_temperature ?? c.temperature_2m),
    windSpeed: Number((c.wind_speed_10m ?? 0) / 3.6), // km/h → m/s
    windDeg: Number(c.wind_direction_10m ?? 225),
    radiation,
    time: c.time,
  };
}

// Best-effort: devuelve {pm25, pm10, no2, o3, station} o null si no hay
// estación cercana / no hay key. Nunca lanza.
async function fetchOpenAQ(apiKey) {
  try {
    if (!apiKey) return { data: null, note: 'sin OPENAQ_API_KEY' };
    const locUrl =
      `https://api.openaq.org/v3/locations?coordinates=${TRUJILLO.lat},${TRUJILLO.lng}` +
      `&radius=25000&limit=5`; // máx. permitido por OpenAQ v3 (sin order_by: no lo acepta)
    const lr = await fetch(locUrl, { headers: { 'X-API-Key': apiKey } });
    if (!lr.ok) return { data: null, note: `locations HTTP ${lr.status}` };
    const lj = await lr.json();
    const loc = (lj.results || [])[0];
    if (!loc) return { data: null, note: 'sin estación OpenAQ en 25 km (verificado: Trujillo no tiene estación, se usa baseline de la zona)' };
    const dr = await fetch(
      `https://api.openaq.org/v3/locations/${loc.id}/latest?limit=100`,
      { headers: { 'X-API-Key': apiKey } }
    );
    if (!dr.ok) return { data: null, note: `latest HTTP ${dr.status}` };
    const dj = await dr.json();
    const out = {};
    for (const m of dj.results || []) {
      const p = m.parameter?.name;
      if (p && out[p] == null && m.value != null) out[p] = Number(m.value);
    }
    if (out.pm25 == null) return { data: null, note: `estación ${loc.name} sin PM2.5 reciente` };
    return { data: { ...out, station: loc.name, stationId: loc.id }, note: `estación ${loc.name}` };
  } catch (e) {
    return { data: null, note: `OpenAQ error: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type, x-cron-secret');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const CRON_SECRET = process.env.CRON_SECRET;
  if (CRON_SECRET && req.headers['x-cron-secret'] !== CRON_SECRET) {
    return res.status(401).json({ error: 'No autorizado (x-cron-secret inválido)' });
  }

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Faltan SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Vercel' });
  }
  const OPENAQ_API_KEY = process.env.OPENAQ_API_KEY || '';

  const { zone_id = DEFAULT_ZONE, dry_run = false } = req.body || {};
  const t0 = Date.now();

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Zona para baselines de respaldo (nunca inventar: viene de tu BD)
    const { data: zone, error: zoneErr } = await supabase
      .from('urban_zones')
      .select('id,name,baseline_temp,baseline_pm25')
      .eq('id', zone_id)
      .maybeSingle();
    if (zoneErr || !zone) return res.status(404).json({ error: `Zona ${zone_id} no existe` });

    const meteo = await fetchOpenMeteo();
    const { data: aq, note: aqNote } = await fetchOpenAQ(OPENAQ_API_KEY);

    const qa = ['fuente:open-meteo+openaq', 'sin-calibrar-2-etapas', 'referencia-publica'];
    const pm25 = aq?.pm25 ?? zone.baseline_pm25;
    if (!aq) qa.push('pm25:baseline-zona');
    const pm10 = aq?.pm10 ?? Number((pm25 * 1.78).toFixed(1));
    if (aq?.pm10 == null) qa.push('pm10:estimado-pm25x1.78');
    const no2 = aq?.no2 ?? 22.0;
    const o3 = aq?.o3 ?? 25.0;
    if (aq?.no2 == null) qa.push('no2:fondo-urbano');
    if (aq?.o3 == null) qa.push('o3:fondo-urbano');
    const co = 1.5, co2 = 430.0;
    qa.push('co:fondo-urbano', 'co2:fondo-global');

    const temp = Number.isFinite(meteo.temperature) ? meteo.temperature : zone.baseline_temp;
    const hum = Number.isFinite(meteo.humidity) ? meteo.humidity : 72;
    const wind = Number.isFinite(meteo.windSpeed) ? meteo.windSpeed : 2.0;
    const wdir = degToCompass(meteo.windDeg);
    const heat = Number.isFinite(meteo.apparent) ? meteo.apparent : Number((temp + (hum > 70 ? 2.5 : 0)).toFixed(1));
    const uhi = Number(Math.max(1.2, (temp - 23.5) * 0.65).toFixed(1));
    const pet = Number((temp + (hum > 70 ? 2.5 : 0)).toFixed(1));
    const tcs = Math.max(15, Math.min(100, Math.round(100 - (temp - 20) * 4.5 - pm25 / 1.5)));
    const aqi = Math.round(pm25 * 2.8);

    const reading = {
      pm25: Number(pm25.toFixed(2)), pm10: Number(Number(pm10).toFixed(2)),
      no2: Number(Number(no2).toFixed(2)), o3: Number(Number(o3).toFixed(2)),
      co: Number(co.toFixed(3)), co2: Number(co2.toFixed(1)),
      temperature: Number(Number(temp).toFixed(2)), humidity: Number(Number(hum).toFixed(2)),
      wind_speed: Number(Number(wind).toFixed(2)), wind_direction: wdir,
      solar_radiation: Number(Number(meteo.radiation || 0).toFixed(1)),
      heat_index: Number(Number(heat).toFixed(2)), uhi_delta: uhi,
      pet_score: pet, tcs_score: tcs, aqi_index: aqi,
      aqi_category: aqiCategory(pm25),
      is_calibrated: false,
      raw_payload: { open_meteo: meteo, openaq: aq, openaq_note: aqNote },
      qa_flags: qa,
    };

    const result = { zone: zone.name, openaq: aqNote, reading_preview: reading, dry_run };

    if (dry_run) return res.status(200).json({ ...result, written: false });

    // Escribe UNA lectura por nodo virtual, con dedup de 45 min
    const targets = [
      { sensor_id: SENSOR_METEO, sensor_code: 'PUB-METEO-01' },
      { sensor_id: SENSOR_OPENAQ, sensor_code: 'PUB-OPENAQ-01' },
    ];
    const written = [];
    for (const tg of targets) {
      const { data: last } = await supabase
        .from('environmental_readings')
        .select('measured_at')
        .eq('sensor_id', tg.sensor_id)
        .order('measured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (last && Date.now() - new Date(last.measured_at).getTime() < 45 * 60 * 1000) {
        written.push({ sensor: tg.sensor_code, skipped: 'lectura reciente (<45min)' });
        continue;
      }
      const { error: insErr } = await supabase.from('environmental_readings').insert({
        ...reading, sensor_id: tg.sensor_id, zone_id: zone.id,
      });
      if (insErr) throw insErr;
      const lastReading = { ...reading, timestamp: new Date().toISOString(), windDirection: wdir };
      await supabase.from('sensor_nodes').update({
        last_reading: lastReading, last_reading_at: new Date().toISOString(), status: 'online',
      }).eq('id', tg.sensor_id);
      await supabase.from('ingestion_logs').insert({
        protocol: 'REST_API', topic_or_endpoint: 'open-meteo+openaq/v3',
        sensor_code: tg.sensor_code, sensor_id: tg.sensor_id, zone_id: zone.id,
        status: 'ACCEPTED_RAW', raw_pm25: reading.pm25, calibrated_pm25: reading.pm25,
        raw_temp: reading.temperature, calibrated_temp: reading.temperature,
        raw_o3: reading.o3, calibrated_o3: reading.o3,
        qa_flags: qa, latency_ms: Date.now() - t0,
      });
      written.push({ sensor: tg.sensor_code, inserted: true });
    }

    return res.status(200).json({ ...result, written, latency_ms: Date.now() - t0 });
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
}
