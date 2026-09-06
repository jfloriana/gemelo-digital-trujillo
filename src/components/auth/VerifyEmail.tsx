import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle2, Mail, ArrowRight, AlertTriangle } from 'lucide-react';

export const VerifyEmail: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const hash = window.location.hash;
    const search = window.location.search;
    // Supabase PKCE: ?code=...  o hash #access_token=...
    const params = new URLSearchParams(hash.replace(/^#/, '') + '&' + search.replace(/^\?/, ''));
    const hasCode = params.has('code') || params.has('access_token') || params.has('token_hash');

    // Si no hay token, pero hay sesión (usuario ya verificado y logueado), muestra success
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user?.email_confirmed_at) {
        setStatus('success');
        return;
      }
      if (!hasCode) {
        setStatus('error');
        setMessage('Enlace inválido o expirado. Solicita un nuevo correo de verificación desde el login.');
        return;
      }
      // Si hay code, Supabase ya manejó el intercambio vía detectSessionInUrl (supabase-js)
      // Esperamos un poco a que onAuthStateChange setee la sesión
      setTimeout(async () => {
        const { data: s2 } = await supabase.auth.getSession();
        if (s2.session?.user?.email_confirmed_at) setStatus('success');
        else {
          // Intenta verificar via OTP si viene token_hash
          const token_hash = params.get('token_hash');
          const type = params.get('type') as any;
          const email = params.get('email');
          if (token_hash && type && email) {
            const { error } = await supabase.auth.verifyOtp({ token_hash, type, email } as any);
            if (!error) setStatus('success');
            else { setStatus('error'); setMessage(error.message); }
          } else {
            setStatus('error');
            setMessage('No se pudo verificar. El enlace puede haber expirado.');
          }
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
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Verificando tu correo…</h1>
            <p className="text-sm text-slate-500">Un momento, estamos confirmando tu correo.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-600 text-white grid place-items-center"><CheckCircle2 className="w-6 h-6" /></div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">¡Correo verificado!</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">Tu cuenta ya está activa. Ya puedes iniciar sesión con tu correo y contraseña.</p>
            <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold">Ir al inicio <ArrowRight className="w-4 h-4" /></a>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 grid place-items-center"><AlertTriangle className="w-6 h-6 text-amber-600" /></div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">No se pudo verificar</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">{message}</p>
            <a href="/" className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-semibold">Volver al inicio</a>
          </>
        )}
      </div>
    </div>
  );
};
