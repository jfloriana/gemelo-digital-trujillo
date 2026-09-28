import React, { useRef, useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { Network, Send, X, Loader2, Wrench } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

interface NbsEstimate {
  interventionType: string;
  quantity: number;
  unit: string;
  tempBefore: number;
  tempAfter: number;
  pm25Before: number;
  pm25After: number;
  estimatedCostPEN: number;
}

interface AgentMsg {
  role: 'user' | 'assistant';
  content: string;
  toolStepsUsed?: number;
  toolsUsed?: string[];
  estimates?: NbsEstimate[];
}

const INTERVENTION_LABEL: Record<string, string> = {
  arbolado: 'Arbolado',
  techo_verde: 'Techo verde',
  muro_verde: 'Muro verde',
  pavimento_permeable: 'Pav. permeable',
};

const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderInline(s: string, keyPrefix: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /\*\*(.+?)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(s)) !== null) {
    if (m.index > last) out.push(<span key={`${keyPrefix}-t${k++}`}>{s.slice(last, m.index)}</span>);
    out.push(<strong key={`${keyPrefix}-b${k++}`} className="font-semibold text-slate-900 dark:text-white">{m[1]}</strong>);
    last = m.index + m[0].length;
  }
  if (last < s.length) out.push(<span key={`${keyPrefix}-t${k++}`}>{s.slice(last)}</span>);
  return out;
}

// Renderiza el markdown que genera el LLM (encabezados, negritas, listas,
// tablas, separadores) sin dependencias nuevas. El texto ya viene escapado.
function MarkdownText({ text }: { text: string }) {
  const lines = escapeHtml(text).split('\n');
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  const parseRow = (r: string) => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    // Tabla markdown: fila de encabezado + fila separadora |---|
    if (trimmed.startsWith('|') && i + 1 < lines.length && /^\|?[\s:|\-]+\|?$/.test(lines[i + 1].trim())) {
      const head = parseRow(line);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) { rows.push(parseRow(lines[i])); i++; }
      blocks.push(
        <div key={`tbl${k++}`} className="my-1.5 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <table className="w-full text-[10px] border-collapse">
            <thead>
              <tr className="bg-teal-700/10 dark:bg-teal-900/40">
                {head.map((h, hi) => <th key={hi} className="px-1.5 py-1 text-left font-semibold">{renderInline(h, `th${k}-${hi}`)}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, ri) => (
                <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50 dark:bg-slate-800/50' : ''}>
                  {r.map((c, ci) => <td key={ci} className="px-1.5 py-1 border-t border-slate-100 dark:border-slate-700/60">{renderInline(c, `td${k}-${ri}-${ci}`)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      blocks.push(<div key={`h${k++}`} className="font-bold text-slate-900 dark:text-white mt-1.5 mb-0.5 text-[12px]">{renderInline(h[2], `hh${k}`)}</div>);
      i++;
      continue;
    }
    if (/^\s*---+\s*$/.test(line)) {
      blocks.push(<hr key={`hr${k++}`} className="my-1.5 border-slate-200 dark:border-slate-700" />);
      i++;
      continue;
    }
    const li = line.match(/^\s*[-*•]\s+(.*)$/) || line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (li) {
      blocks.push(
        <div key={`li${k++}`} className="flex gap-1.5 ml-0.5">
          <span className="text-teal-600 dark:text-teal-400 shrink-0">•</span>
          <span>{renderInline(li[1], `li${k}`)}</span>
        </div>
      );
      i++;
      continue;
    }
    if (trimmed === '') { i++; continue; }
    blocks.push(<p key={`p${k++}`} className="mb-1 last:mb-0">{renderInline(line, `pp${k}`)}</p>);
    i++;
  }
  return <div>{blocks}</div>;
}

function EstimateChart({ e }: { e: NbsEstimate }) {
  const { t } = useI18n();
  const baseLabel = t('agent.base');
  const projLabel = t('agent.projection');
  const tempData = [{ n: baseLabel, v: e.tempBefore }, { n: projLabel, v: e.tempAfter }];
  const pmData = [{ n: baseLabel, v: e.pm25Before }, { n: projLabel, v: e.pm25After }];
  const label = INTERVENTION_LABEL[e.interventionType] ?? e.interventionType;
  return (
    <div className="mt-2 rounded-xl border border-teal-200/70 dark:border-teal-900 bg-teal-50/60 dark:bg-teal-950/20 p-2">
      <div className="text-[10px] font-bold text-teal-800 dark:text-teal-300 mb-1">
        {label} × {e.quantity} {e.unit} — {t('agent.base')} vs {t('agent.projection')}
      </div>
      <div className="flex gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 text-center">{t('agent.chartTemp')}</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={tempData} margin={{ top: 4, right: 0, left: -22, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="n" tick={{ fontSize: 8 }} interval={0} />
              <YAxis tick={{ fontSize: 8 }} domain={['auto', 'auto']} />
              <Tooltip formatter={(v: unknown) => [`${v} °C`, '']} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                <Cell fill="#94a3b8" />
                <Cell fill="#0f766e" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 text-center">{t('agent.chartPm')}</div>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={pmData} margin={{ top: 4, right: 0, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="n" tick={{ fontSize: 8 }} interval={0} />
              <YAxis tick={{ fontSize: 8 }} domain={['auto', 'auto']} />
              <Tooltip formatter={(v: unknown) => [`${v} µg/m³`, '']} />
              <Bar dataKey="v" radius={[4, 4, 0, 0]}>
                <Cell fill="#94a3b8" />
                <Cell fill="#059669" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-1 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
        {t('agent.estimatedCost')}: S/. {Number(e.estimatedCostPEN).toLocaleString('es-PE')} PEN
      </div>
    </div>
  );
}

// Panel aislado del AssistantChatbot existente: llama a /api/agent, que corre un
// agente real LangChain + LangGraph (createReactAgent) en el backend de Vercel.
// No comparte estado ni componentes con AssistantChatbot.tsx.
export const LangGraphAgentPanel: React.FC = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMsg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    const next: AgentMsg[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: next.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: typeof j.reply === 'string' ? j.reply : '',
        toolStepsUsed: j.toolStepsUsed,
        toolsUsed: Array.isArray(j.toolsUsed) ? j.toolsUsed : undefined,
        estimates: Array.isArray(j.estimates) ? j.estimates : undefined,
      }]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating toggle — esquina inferior izquierda, no colisiona con AssistantChatbot (derecha) */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[60] w-12 h-12 rounded-2xl bg-teal-800 hover:bg-teal-900 text-white shadow-lg shadow-teal-950/20 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
        title={t('agent.openBtn')}
      >
        <Network className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed z-[65] bottom-4 left-4 sm:bottom-6 sm:left-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-teal-800 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-200">{t('agent.badge')}</div>
              <h3 className="text-sm font-bold text-white leading-tight">{t('agent.title')}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white cursor-pointer" title={t('agent.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-slate-50 dark:bg-slate-950">
            {messages.length === 0 && (
              <p className="text-[11px] text-slate-400 dark:text-slate-500 italic p-2">{t('agent.emptyState')}</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-teal-700 text-white whitespace-pre-wrap'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                }`}>
                  {m.role === 'user' ? m.content : <MarkdownText text={m.content} />}
                  {m.role === 'assistant' && m.estimates && m.estimates.length > 0 && (
                    m.estimates.map((e, ei) => <EstimateChart key={ei} e={e} />)
                  )}
                  {m.role === 'assistant' && typeof m.toolStepsUsed === 'number' && m.toolStepsUsed > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-teal-600 dark:text-teal-400 font-medium">
                      <Wrench className="w-3 h-3" />
                      {m.toolsUsed && m.toolsUsed.length > 0
                        ? t('agent.toolsUsedDetail').replace('{names}', m.toolsUsed.join(', ')).replace('{n}', String(m.toolStepsUsed))
                        : t('agent.toolsUsed').replace('{n}', String(m.toolStepsUsed))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400"><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('agent.thinking')}</div>
            )}
            {error && (
              <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5">
                {t('agent.errorPrefix')} {error}
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder={t('agent.placeholder')}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-600/20"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title={t('agent.send')}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
