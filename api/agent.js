// Vercel Function: /api/agent
// Agente real LangChain + LangGraph (no simulado). Corre solo en el servidor.
// No modifica AssistantChatbot.tsx ni ningun otro flujo existente — es un modulo nuevo y aislado.
//
// Requiere en Vercel (Project Settings -> Environment Variables):
//   GEMINI_API_KEY            (Google AI Studio: https://aistudio.google.com/apikey)
//   VITE_SUPABASE_URL o SUPABASE_URL
//   VITE_SUPABASE_ANON_KEY o SUPABASE_ANON_KEY   (clave publica, solo lectura de zonas)

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `Eres el Agente Cientifico del Gemelo Digital Microescala de Trujillo, Peru.
Ayudas a interpretar datos de calidad del aire, calor urbano y a estimar el impacto de
intervenciones basadas en la naturaleza (NbS). Cuando necesites datos reales de una zona,
usa la herramienta get_zone_data. Cuando el usuario pida estimar el efecto de una
intervencion (arbolado, techos verdes, muros verdes, pavimento permeable), usa
estimate_nbs_impact con los datos base de la zona. Responde en el mismo idioma del usuario,
de forma tecnica pero clara, y cita las cifras que obtengas de las herramientas — no inventes
numeros que las herramientas puedan calcular.
REGLA DE FUENTES (obligatoria): get_zone_data devuelve baselines estáticas de la zona y,
cuando existen, latest_calibrated (nodo propio con calibración 2-etapas) y
latest_public_ref (referencia pública Open-Meteo/OpenAQ, SIN calibrar, solo contraste).
Prioriza siempre el dato calibrado propio; si usas la referencia pública, etiquétala
explícitamente como "referencia pública sin calibrar" y nunca la presentes como
medición validada ni la uses para validar modelos.`;

// Formulas deterministas que reflejan las mismas heuristicas usadas en el simulador NbS del
// front-end (src/components/modules/NbsSimulatorModule.tsx), para que el agente no "invente"
// cifras de impacto.
const NBS_FACTORS = {
  arbolado: { tempDelta: -1.4, pm25Pct: -0.12, costPerUnit: 850, unit: 'arboles' },
  techo_verde: { tempDelta: -0.9, pm25Pct: -0.06, costPerUnit: 180, unit: 'm2' },
  muro_verde: { tempDelta: -0.5, pm25Pct: -0.18, costPerUnit: 320, unit: 'm2' },
  pavimento_permeable: { tempDelta: -0.6, pm25Pct: -0.03, costPerUnit: 210, unit: 'm2' },
};

function buildTools(supabase) {
  const getZoneData = tool(
    async ({ zoneName }) => {
      const q = String(zoneName || '').trim().replace(/[%_]/g, '').slice(0, 120);
      const like = `%${q}%`;
      const { data, error } = await supabase
        .from('urban_zones')
        .select('id,name,district,department,vulnerability_level,baseline_temp,baseline_pm25,target_population,vulnerable_population,tree_cover,built_density,primary_pollution_source,description')
        .or(`name.ilike.${like},district.ilike.${like},department.ilike.${like},description.ilike.${like},primary_pollution_source.ilike.${like}`)
        .limit(1)
        .maybeSingle();
      if (error) return `Error consultando la zona: ${error.message}`;
      if (!data) {
        const { data: all } = await supabase.from('urban_zones').select('name').order('id').limit(20);
        const names = (all || []).map((z) => z.name).join(' | ');
        return `No se encontro ninguna zona que coincida con "${q}".${names ? ` Zonas disponibles: ${names}.` : ''}`;
      }
      // Contexto vivo: última lectura del nodo calibrado + de la referencia
      // pública (si existen). Nunca lanzar: el baseline estático basta.
      let latest_calibrated = null;
      let latest_public_ref = null;
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
            .select('sensor_id,measured_at,temperature,pm25,pm10,humidity,wind_speed,aqi_index,aqi_category')
            .in('sensor_id', ids)
            .order('measured_at', { ascending: false })
            .limit(30);
          const newest = {};
          for (const r of readings || []) {
            if (!newest[r.sensor_id]) newest[r.sensor_id] = r;
          }
          const pick = (virtual) => Object.entries(newest)
            .filter(([id]) => {
              const st = zoneSensors.find((s) => s.id === id)?.sensor_type;
              return virtual
                ? st === 'Referencia pública (OpenAQ/Open-Meteo)'
                : st !== 'Referencia pública (OpenAQ/Open-Meteo)';
            })
            .map(([, r]) => r)
            .sort((a, b) => new Date(b.measured_at) - new Date(a.measured_at))[0] || null;
          latest_calibrated = pick(false);
          latest_public_ref = pick(true);
        }
      } catch { /* contexto vivo opcional: se ignora el fallo */ }
      return JSON.stringify({ ...data, latest_calibrated, latest_public_ref });
    },
    {
      name: 'get_zone_data',
      description: 'Obtiene los datos ambientales reales de una zona (baselines, población, cobertura) MÁS la última lectura viva del nodo calibrado (latest_calibrated) y de la referencia pública Open-Meteo/OpenAQ (latest_public_ref, sin calibrar, solo contraste).',
      schema: z.object({ zoneName: z.string().describe('Nombre o parte del nombre de la zona, ej. "Centro Historico", "Av. España", "Mercado Hermelinda"') }),
    }
  );

  const estimateNbsImpact = tool(
    async ({ baselineTemp, baselinePM25, interventionType, quantity }) => {
      const f = NBS_FACTORS[interventionType];
      if (!f) return `Tipo de intervencion no reconocido: ${interventionType}. Usa uno de: ${Object.keys(NBS_FACTORS).join(', ')}.`;
      const scale = Math.max(0, Number(quantity) || 1) / 100; // normalizado cada 100 unidades
      const tempAfter = Math.max(baselineTemp + f.tempDelta * Math.min(scale, 3), baselineTemp - 6);
      const pmAfter = Math.max(baselinePM25 * (1 + f.pm25Pct * Math.min(scale, 3)), baselinePM25 * 0.3);
      const cost = Math.round(Number(quantity) * f.costPerUnit);
      return JSON.stringify({
        interventionType,
        quantity: Number(quantity),
        unit: f.unit,
        tempBefore: baselineTemp,
        tempAfter: Number(tempAfter.toFixed(1)),
        pm25Before: baselinePM25,
        pm25After: Number(pmAfter.toFixed(1)),
        estimatedCostPEN: cost,
      });
    },
    {
      name: 'estimate_nbs_impact',
      description: 'Calcula de forma deterministica el impacto proyectado (temperatura, PM2.5, costo) de aplicar una cantidad de una intervencion NbS sobre una zona con temperatura y PM2.5 base conocidos.',
      schema: z.object({
        baselineTemp: z.number().describe('Temperatura base de la zona en °C'),
        baselinePM25: z.number().describe('PM2.5 base de la zona en µg/m³'),
        interventionType: z.enum(['arbolado', 'techo_verde', 'muro_verde', 'pavimento_permeable']),
        quantity: z.number().describe('Cantidad de la intervencion: numero de arboles o m² segun el tipo'),
      }),
    }
  );

  return [getZoneData, estimateNbsImpact];
}

// Los modelos de Gemini devuelven `content` como array de bloques
// [{type:'text', text:'...'}, ...] y a veces parten la respuesta en varios
// bloques. Antes se hacía JSON.stringify() de ese array y el frontend mostraba
// `[{"type":"text","text":"..."}]` crudo. Esta función lo aplana a texto plano.
function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((b) => {
        if (typeof b === 'string') return b;
        if (b && typeof b === 'object' && typeof b.text === 'string') return b.text;
        return '';
      })
      .join('');
  }
  if (content && typeof content === 'object' && typeof content.text === 'string') {
    return content.text;
  }
  try {
    return JSON.stringify(content ?? '');
  } catch {
    return String(content ?? '');
  }
}

// Cuota gratuita Gemini: 20 req/día por modelo. Cada paso del ciclo
// agent<->tools consume 1 request, así que un turno gasta varias.
// Estrategia: rotar keys (principal + respaldo) y caer a gemini-2.5-flash
// (pool de cuota propio) antes de rendirse con 429 amable.
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash'];

function geminiKeys() {
  return [process.env.GEMINI_API_KEY, process.env.GEMINI_API_KEY_2].filter((k) => k && k.length >= 10);
}

function isQuotaError(e) {
  const msg = e instanceof Error ? e.message : String(e);
  return /429|quota|rate.?limit|exceed/i.test(msg);
}

function quotaRetryAfter(e) {
  const msg = e instanceof Error ? e.message : String(e);
  const m = msg.match(/retry in ([\d.]+)s/i);
  return m ? Math.max(5, Math.ceil(Number(m[1]))) : 60;
}

export function quotaResponse(res, e) {
  return res.status(429).json({
    code: 'QUOTA_EXHAUSTED',
    retryAfter: quotaRetryAfter(e),
    error: 'Cuota gratuita diaria de Gemini agotada (20 req/día por modelo). Se renueva cada 24 h. Tip: cada herramienta que usa el agente gasta 1 request; evita reintentar en bucle.',
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const KEYS = geminiKeys();
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!KEYS.length) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada. Agrega una key real de https://aistudio.google.com/apikey en las variables de entorno de Vercel (y en .env.local para desarrollo). Opcional: GEMINI_API_KEY_2 como respaldo.' });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.' });
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) requerido' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const tools = buildTools(supabase);
  const priorMessages = Array.isArray(history)
    ? history.slice(-8).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }))
    : [];
  const input = {
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      ...priorMessages,
      { role: 'user', content: message.slice(0, 4000) },
    ],
  };

  // Recorre keys × modelos hasta que uno responda; solo reintenta en 429.
  // recursionLimit acota el peor caso de requests por turno.
  let lastQuotaError = null;
  for (const apiKey of KEYS) {
    for (const modelName of GEMINI_MODELS) {
      try {
        const model = new ChatGoogleGenerativeAI({ apiKey, model: modelName, temperature: 0.3 });
        // Agente LangGraph real (createReactAgent construye un StateGraph con nodos
        // "agent" <-> "tools" y ciclo de tool-calling hasta que el modelo da respuesta final).
        const agent = createReactAgent({ llm: model, tools });
        const result = await agent.invoke(input, { recursionLimit: 12 });
        return sendResult(res, result);
      } catch (e) {
        if (!isQuotaError(e)) {
          const msg = e instanceof Error ? e.message : String(e);
          return res.status(500).json({ error: msg });
        }
        lastQuotaError = e;
      }
    }
  }
  return quotaResponse(res, lastQuotaError);

  function sendResult(res, result) {
    const msgs = result.messages || [];
    // Último mensaje con texto real (el final del agente; a veces el último
    // mensaje es un ToolMessage sin texto útil para mostrar).
    const withText = msgs.filter((m) => contentToText(m?.content).trim().length > 0);
    const last = withText[withText.length - 1] || msgs[msgs.length - 1];

    // Solo los ToolMessage (tienen tool_call_id) cuentan como ejecuciones reales.
    // Antes se contaban también los mensajes AI con tool_calls y el número salía inflado.
    const toolMsgs = msgs.filter((m) => m && m.tool_call_id != null);
    const toolStepsUsed = toolMsgs.length;
    const toolsUsed = [...new Set(toolMsgs.map((m) => m.name).filter(Boolean))];

    // Datos estructurados para que el frontend dibuje tabla/gráfico Base vs
    // Proyección sin depender de cómo el LLM redacte la respuesta.
    const estimates = [];
    let zone = null;
    for (const m of toolMsgs) {
      const text = contentToText(m.content);
      try {
        const parsed = JSON.parse(text);
        if (m.name === 'estimate_nbs_impact' && parsed && typeof parsed === 'object' && 'tempAfter' in parsed) {
          estimates.push(parsed);
        } else if (m.name === 'get_zone_data' && parsed && typeof parsed === 'object' && parsed.name) {
          zone = parsed;
        }
      } catch {
        // Contenido no-JSON (p. ej. mensaje de error de la herramienta): se ignora.
      }
    }

    return res.status(200).json({
      reply: contentToText(last?.content),
      toolStepsUsed,
      toolsUsed,
      estimates,
      zone,
    });
  }
}
