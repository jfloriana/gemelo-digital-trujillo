import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useI18n } from '../../context/I18nContext';
import { CheckCircle2, Mail, ArrowRight, AlertTriangle } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const { t } = useI18n();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const search = window.location.search;
    const params = new URLSearchParams(search);
    const token = params.get('token');
    const email = params.get('email');

    // Flujo Brevo puro: /verify?token=...&email=...
    if (token && email) {
      fetch(`/api/verify?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`)
        .then(r => r.json().then(j => ({ ok: r.ok, j })))
        .then(({ ok, j }) => {
          if (ok) setStatus('success');
          else { setStatus('error'); setMessage(j.error || t('verify.err.tokenInvalid')); }
        })
        .catch(() => { setStatus('error'); setMessage(t('verify.err.network')); });
      return;
    }

    // Fallback Supabase PKCE/hash
    const hash = window.location.hash;
    const all = new URLSearchParams(hash.replace(/^#/, '') + '&' + search.replace(/^\?/, ''));
    const hasCode = all.has('code') || all.has('access_token') || all.has('token_hash');
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email_confirmed_at) { setStatus('success'); return; }
      if (!hasCode) { setStatus('error'); setMessage(t('verify.err.linkInvalid')); return; }
      setTimeout(async () => {
        const { data: s2 } = await supabase.auth.getSession();
        if (s2.session?.user?.email_confirmed_at) setStatus('success');
        else {
          const token_hash = all.get('token_hash');
          const type = all.get('type') as any;
          const em = all.get('email');
          if (token_hash && type && em) {
            const { error } = await supabase.auth.verifyOtp({ token_hash, type, email: em } as any);
            if (!error) setStatus('success'); else { setStatus('error'); setMessage(error.message); }
          } else { setStatus('error'); setMessage(t('verify.err.cannotVerify')); }
        }
      }, 800);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 grid place-items-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-8 text-center space-y-4 shadow-xl">
        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 dark:bg-emerald-950 grid place-items-center animate-pulse"><Mail className="w-6 h-6 text-emerald-600" /></div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('verify.verifying.title')}</h1>
            <p className="text-sm text-slate-500">{t('verify.verifying.desc')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 text-white grid place-items-center"><CheckCircle2 className="w-6 h-6" /></div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('verify.success.title')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{t('verify.success.desc')}</p>
            <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">{t('verify.success.cta')} <ArrowRight className="w-4 h-4" /></a>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 grid place-items-center"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">{t('verify.error.title')}</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
            <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold">{t('verify.error.cta')}</a>
          </>
        )}
      </div>
    </div>
  );
};
