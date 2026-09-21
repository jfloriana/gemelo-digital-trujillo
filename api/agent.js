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
numeros que las herramientas puedan calcular.`;

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
      const { data, error } = await supabase
        .from('urban_zones')
        .select('id,name,district,department,baseline_temp,baseline_pm25,target_population,vulnerable_population,tree_cover,built_density,primary_pollution_source')
        .ilike('name', `%${zoneName}%`)
        .limit(1)
        .maybeSingle();
      if (error) return `Error consultando la zona: ${error.message}`;
      if (!data) return `No se encontro ninguna zona que coincida con "${zoneName}".`;
      return JSON.stringify(data);
    },
    {
      name: 'get_zone_data',
      description: 'Obtiene los datos ambientales reales (temperatura base, PM2.5 base, poblacion, cobertura arborea) de una zona urbana de Trujillo desde la base de datos del gemelo digital.',
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 10) {
    return res.status(500).json({ error: 'GEMINI_API_KEY no configurada. Agrega una key real de https://aistudio.google.com/apikey en las variables de entorno de Vercel (y en .env.local para desarrollo).' });
  }
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Faltan VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.' });
  }

  const { message, history } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) requerido' });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const tools = buildTools(supabase);

    const model = new ChatGoogleGenerativeAI({
      apiKey: GEMINI_API_KEY,
      model: 'gemini-3.6-flash',
      temperature: 0.3,
    });

    // Agente LangGraph real (createReactAgent construye un StateGraph con nodos
    // "agent" <-> "tools" y ciclo de tool-calling hasta que el modelo da respuesta final).
    const agent = createReactAgent({ llm: model, tools });

    const priorMessages = Array.isArray(history)
      ? history.slice(-8).map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 2000) }))
      : [];

    const result = await agent.invoke({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...priorMessages,
        { role: 'user', content: message.slice(0, 4000) },
      ],
    });

    const msgs = result.messages || [];
    const last = msgs[msgs.length - 1];
    const toolStepsUsed = msgs.filter((m) => m.tool_call_id || (m.tool_calls && m.tool_calls.length)).length;

    return res.status(200).json({
      reply: typeof last?.content === 'string' ? last.content : JSON.stringify(last?.content ?? ''),
      toolStepsUsed,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
