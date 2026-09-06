import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const { token, email } = req.query;
  if (!token || !email) return res.status(400).json({ error: 'token y email requeridos' });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return res.status(500).json({ error: 'Faltan env vars' });

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabaseAdmin.from('email_verifications').select('*').eq('token', token).eq('email', String(email).toLowerCase()).single();
  if (error || !data) return res.status(400).json({ error: 'Token inválido' });
  if (data.verified_at) return res.status(200).json({ ok: true, already: true });
  if (new Date(data.expires_at) < new Date()) return res.status(400).json({ error: 'Token expirado (24h). Solicita reenvío.' });

  await supabaseAdmin.from('email_verifications').update({ verified_at: new Date().toISOString() }).eq('id', data.id);
  await supabaseAdmin.from('profiles').update({ email_verified: true }).eq('email', String(email).toLowerCase());
  // también marca auth.users.email_confirmed_at para que Supabase lo considere verificado
  const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
  const u = userList.users.find(x => x.email.toLowerCase() === String(email).toLowerCase());
  if (u) await supabaseAdmin.auth.admin.updateUserById(u.id, { email_confirm: true });

  return res.status(200).json({ ok: true });
}
