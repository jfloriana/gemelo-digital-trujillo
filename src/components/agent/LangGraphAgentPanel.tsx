import React, { useRef, useState, useEffect } from 'react';
import { useI18n } from '../../context/I18nContext';
import { Network, Send, X, Loader2, Wrench } from 'lucide-react';

interface AgentMsg {
  role: 'user' | 'assistant';
  content: string;
  toolStepsUsed?: number;
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
      setMessages(prev => [...prev, { role: 'assistant', content: j.reply, toolStepsUsed: j.toolStepsUsed }]);
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
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[60] w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-900/20 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
        title={t('agent.openBtn')}
      >
        <Network className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed z-[65] bottom-4 left-4 sm:bottom-6 sm:left-6 w-[calc(100vw-2rem)] sm:w-[420px] h-[560px] max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-100">{t('agent.badge')}</div>
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
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700'
                }`}>
                  {m.content}
                  {m.role === 'assistant' && typeof m.toolStepsUsed === 'number' && m.toolStepsUsed > 0 && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-500 dark:text-indigo-400 font-medium">
                      <Wrench className="w-3 h-3" /> {t('agent.toolsUsed').replace('{n}', String(m.toolStepsUsed))}
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
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
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
