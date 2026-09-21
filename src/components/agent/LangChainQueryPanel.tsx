import React, { useState } from 'react';
import { useI18n } from '../../context/I18nContext';
import { Link2, Send, X, Loader2 } from 'lucide-react';

// Modulo LangChain INDEPENDIENTE de LangGraphAgentPanel.tsx.
// Llama a /api/langchain-query, una chain lineal (retrieval -> prompt -> LLM ->
// parser), sin agente ni herramientas. No comparte estado con el panel de LangGraph.
export const LangChainQueryPanel: React.FC = () => {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [zoneName, setZoneName] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [context, setContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!zoneName.trim() || !question.trim() || loading) return;
    setLoading(true);
    setError(null);
    setAnswer(null);
    setContext(null);
    try {
      const r = await fetch('/api/langchain-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zoneName: zoneName.trim(), question: question.trim() }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
      setAnswer(j.answer);
      setContext(j.retrievedContext);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Botón flotante independiente — apilado sobre el del agente LangGraph */}
      <button
        onClick={() => setIsOpen(v => !v)}
        className="fixed bottom-20 left-4 sm:bottom-24 sm:left-6 z-[60] w-12 h-12 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white shadow-lg shadow-sky-950/20 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
        title={t('lc.openBtn')}
      >
        <Link2 className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="fixed z-[65] bottom-20 left-4 sm:bottom-24 sm:left-6 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[calc(100vh-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="bg-sky-700 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-sky-200">{t('lc.badge')}</div>
              <h3 className="text-sm font-bold text-white leading-tight">{t('lc.title')}</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white cursor-pointer" title={t('lc.close')}>
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3.5 space-y-3 overflow-y-auto">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t('lc.desc')}</p>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{t('lc.zoneLabel')}</label>
              <input
                value={zoneName}
                onChange={e => setZoneName(e.target.value)}
                placeholder={t('lc.zonePlaceholder')}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{t('lc.questionLabel')}</label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                placeholder={t('lc.questionPlaceholder')}
                rows={2}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-600/20 resize-none"
              />
            </div>

            <button
              onClick={submit}
              disabled={loading || !zoneName.trim() || !question.trim()}
              className="w-full py-2 bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {t('lc.submit')}
            </button>

            {error && (
              <div className="text-[11px] text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl p-2.5">
                {t('lc.errorPrefix')} {error}
              </div>
            )}

            {context && (
              <div className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 font-mono whitespace-pre-wrap">
                <div className="text-slate-400 dark:text-slate-500 font-sans font-semibold mb-1 uppercase tracking-wide">{t('lc.retrievedLabel')}</div>
                {context}
              </div>
            )}

            {answer && (
              <div className="text-xs text-slate-800 dark:text-slate-100 bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/70 dark:border-sky-900 rounded-xl p-3 leading-relaxed whitespace-pre-wrap">
                {answer}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
