// Vercel Function: /api/langchain-query
// Modulo LangChain INDEPENDIENTE de /api/agent.js (LangGraph).
// Aqui NO hay agente ni ciclo de decision: es una "chain" lineal clasica de
// LangChain -> Retrieval (Supabase) -> PromptTemplate -> LLM -> OutputParser.
// Demuestra el patron de composicion de LangChain (Runnable.pipe), distinto
// del patron de grafo con herramientas que usa LangGraph en /api/agent.js.

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';
import { createClient } from '@supabase/supabase-js';

const PROMPT_TEMPLATE = `Eres un asistente cientifico del Gemelo Digital de Calidad del Aire y NbS de Trujillo, Peru.
Responde la pregunta del usuario basandote UNICAMENTE en el siguiente contexto real
recuperado de la base de datos. Si el contexto no alcanza para responder, dilo
explicitamente en vez de inventar datos. Responde en el mismo idioma de la pregunta.

Contexto (zona: {zoneName}):
{context}

Pregunta: {question}

Respuesta:`;

// Paso de "retrieval": consulta de solo lectura a la tabla publica de zonas.
// Busca en name + district + department + description porque los nombres reales
// son del tipo "Zona 1: Centro Histórico (Av. España...)" y NUNCA contienen
// la palabra "Trujillo" sola (Trujillo solo aparece en district/department).
async function retrieveZoneContext(supabase, zoneName) {
  const q = String(zoneName || '').trim().replace(/[%_]/g, '').slice(0, 120);
  if (!q) return { context: 'Nombre de zona vacío.', found: false };
  const like = `%${q}%`;
  const { data, error } = await supabase
    .from('urban_zones')
    .select('id,name,district,department,vulnerability_level,baseline_temp,baseline_pm25,target_population,vulnerable_population,tree_cover,built_density,primary_pollution_source,description')
    .or(`name.ilike.${like},district.ilike.${like},department.ilike.${like},description.ilike.${like},primary_pollution_source.ilike.${like}`)
    .limit(1)
    .maybeSingle();
  if (error) return { context: `Error de consulta: ${error.message}`, found: false };
  if (!data) {
    // Fallback útil: listar zonas disponibles para que el usuario copie un nombre válido.
    const { data: all } = await supabase.from('urban_zones').select('name').order('id').limit(20);
    const names = (all || []).map((z) => z.name).join(' | ');
    return {
      context: `No se encontro ninguna zona que coincida con "${q}" en la base de datos.${names ? ` Zonas disponibles: ${names}. Prueba con "Centro", "España", "Hermelinda", "Porvenir", "Larco" o "Mansiche".` : ''}`,
      found: false,
    };
  }
  // Contexto vivo (best-effort): última lectura calibrada + referencia pública.
  let liveLines = [];
  try {
    const { data: zoneSensors } = await supabase
      .from('sensor_nodes')
      .select('id,code,sensor_type')
      .eq('zone_id', data.id)
      .limit(12);
    if (zoneSensors?.length) {
      const ids = zoneSensors.map((s) => s.id);
      const { data: readings } = await supabase
        .from('environmental_readings')
        .select('sensor_id,measured_at,temperature,pm25,aqi_category')
        .in('sensor_id', ids)
        .order('measured_at', { ascending: false })
        .limit(30);
      const newest = {};
      for (const r of readings || []) {
        if (!newest[r.sensor_id]) newest[r.sensor_id] = r;
      }
      const isVirtual = (id) => zoneSensors.find((s) => s.id === id)?.sensor_type === 'Referencia pública (OpenAQ/Open-Meteo)';
      const cal = Object.values(newest).filter((r) => !isVirtual(r.sensor_id))
        .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))[0];
      const pub = Object.values(newest).filter((r) => isVirtual(r.sensor_id))
        .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))[0];
      if (cal) {
        const code = zoneSensors.find((s) => s.id === cal.sensor_id)?.code ?? cal.sensor_id;
        liveLines.push(`Última lectura calibrada (${code}, ${cal.measured_at}): T=${cal.temperature} °C, PM2.5=${cal.pm25} µg/m³, AQI=${cal.aqi_category}.`);
      }
      if (pub) {
        const code = zoneSensors.find((s) => s.id === pub.sensor_id)?.code ?? pub.sensor_id;
        liveLines.push(`Referencia pública más reciente (${code}, ${pub.measured_at}): T=${pub.temperature} °C, PM2.5=${pub.pm25} µg/m³ — SIN calibrar, solo contraste, no usar para validar.`);
      }
    }
  } catch { /* contexto vivo opcional */ }
  const context = [
    `Nombre: ${data.name}`,
    `Distrito/Departamento: ${data.district}, ${data.department}`,
    `Nivel de vulnerabilidad: ${data.vulnerability_level ?? 'No registrado'}`,
    `Temperatura base: ${data.baseline_temp} °C`,
    `PM2.5 base: ${data.baseline_pm25} µg/m³`,
    `Población total / vulnerable: ${data.target_population} / ${data.vulnerable_population}`,
    `Cobertura arbórea: ${data.tree_cover}% | Densidad edificada: ${data.built_density}%`,
    `Fuente principal de contaminación: ${data.primary_pollution_source}`,
    `Descripción: ${data.description}`,
    ...liveLines,
  ].join('\n');
  return { context, found: true };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KEYS = [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter((k) => k && k.length >= 10);
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!KEYS.length) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada. Agrega una key real de https://aistudio.google.com/apikey en las variables de entorno de Vercel. Opcional: GEMINI_API_KEY_2 como respaldo.' });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.' });
  }

  const { zoneName, question } = req.body || {};
  if (!zoneName || !question) {
    return res.status(400).json({ error: 'zoneName y question (strings) requeridos' });
  }

  const isQuotaError = (e) => /429|quota|rate.?limit|exceed/i.test(e instanceof Error ? e.message : String(e));

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { context, found } = await retrieveZoneContext(supabase, String(zoneName).slice(0, 120));

  const prompt = PromptTemplate.fromTemplate(PROMPT_TEMPLATE);
  const outputParser = new StringOutputParser();
  const input = {
    zoneName: String(zoneName).slice(0, 120),
    question: String(question).slice(0, 2000),
    context,
  };

  // Rota keys × modelos (pools de cuota independientes) antes de rendirse.
  let lastQuotaError = null;
  for (const apiKey of KEYS) {
    for (const modelName of ['gemini-3.6-flash', 'gemini-2.5-flash']) {
      try {
        const model = new ChatGoogleGenerativeAI({ apiKey, model: modelName, temperature: 0.2 });
        // Chain LangChain pura: prompt -> modelo -> parser de salida. Sin herramientas, sin ciclos.
        const chain = RunnableSequence.from([prompt, model, outputParser]);
        const answer = await chain.invoke(input);
        return res.status(200).json({ answer, retrievedContext: context, contextFound: found });
      } catch (e) {
        if (!isQuotaError(e)) {
          const msg = e instanceof Error ? e.message : String(e);
          return res.status(500).json({ error: msg });
        }
        lastQuotaError = e;
      }
    }
  }
  const msg = lastQuotaError instanceof Error ? lastQuotaError.message : String(lastQuotaError);
  const m = msg.match(/retry in ([\d.]+)s/i);
  return res.status(429).json({
    code: 'QUOTA_EXHAUSTED',
    retryAfter: m ? Math.max(5, Math.ceil(Number(m[1]))) : 60,
    error: 'Cuota gratuita diaria de Gemini agotada (20 req/día por modelo). Se renueva cada 24 h. Evita reintentar en bucle.',
  });
}
