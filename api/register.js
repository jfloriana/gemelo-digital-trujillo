import { createClient } from '@supabase/supabase-js';

// Crea el usuario en Supabase SIN que Supabase envíe su propio correo de confirmación.
// El único correo de verificación lo manda Brevo (api/send-verification.js).
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, name, institution } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email y password requeridos' });

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Faltan env vars SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY' });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const normalized = String(email).trim().toLowerCase();

    // email_confirm: false -> el usuario queda sin verificar y Supabase NO manda correo.
    // handle_new_user() lee estos metadatos para crear el profile (rol 'ciudadano' lo pone la BD).
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: normalized,
      password,
      email_confirm: false,
      user_metadata: {
        name: (name || '').trim() || normalized.split('@')[0],
        institution: (institution || '').trim() || 'Comunidad Digital Trujillo',
      },
    });

    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('already') || msg.includes('registered') || msg.includes('exists')) {
        return res.status(409).json({ error: 'Ya existe cuenta con este correo.' });
      }
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ ok: true, userId: data?.user?.id });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
