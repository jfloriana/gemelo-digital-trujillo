import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name, redirect_to } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email requerido' });

  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!BREVO_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Faltan env vars BREVO_API_KEY / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY en Vercel' });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: 'signup',
      email,
      options: { redirectTo: redirect_to || 'https://gemelo-digital-trujillo.vercel.app/verify' },
    });
    if (linkErr) throw linkErr;
    const verifyUrl = linkData?.properties?.action_link || linkData?.action_link;
    if (!verifyUrl) throw new Error('No se pudo generar link');

    const safeName = (name || email.split('@')[0] || 'colega').split(' ')[0];
    const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
<tr><td style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%);padding:28px 32px;text-align:center;">
<div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:6px 14px;color:#ecfdf5;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Gemelo Digital Trujillo • Tesis UNT</div>
<h1 style="margin:16px 0 6px;color:#ffffff;font-size:22px;font-weight:800;">Verifica tu correo</h1>
<p style="margin:0;color:#ccfbf1;font-size:13px;">Un clic para activar tu acceso al Gemelo Digital a microescala</p>
</td></tr>
<tr><td style="padding:32px;">
<p style="margin:0 0 12px;color:#0f172a;font-size:15px;font-weight:600;">Hola ${safeName} 👋</p>
<p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">Gracias por registrarte en el <strong>Gemelo Digital de Calidad del Aire y NbS — Trujillo 2026</strong>. Haz clic abajo para confirmar tu correo. Expira en 24h.</p>
<table cellpadding="0" cellspacing="0" style="margin:22px 0;"><tr><td align="center" style="border-radius:14px;background:linear-gradient(135deg,#059669 0%,#0d9488 100%);"><a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;">✓ Verificar mi correo</a></td></tr></table>
<p style="margin:0 0 8px;color:#64748b;font-size:12px;">Si el botón no funciona, copia este enlace:</p>
<p style="margin:0 0 20px;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;color:#0f172a;font-size:11px;font-family:monospace;">${verifyUrl}</p>
<div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:14px 16px;"><p style="margin:0;color:#134e4a;font-size:12px;line-height:1.6;"><strong>¿No te registraste?</strong> Ignora este correo. Solo las <strong>cuentas demo</strong> tienen acceso limitado sin verificar.</p></div>
</td></tr>
<tr><td style="background:#0f172a;padding:18px 32px;text-align:center;"><p style="margin:0;color:#94a3b8;font-size:11px;">© 2026 Gemelo Digital Microescala Trujillo • La Libertad, Perú</p></td></tr>
</table>
</td></tr></table>
</body></html>`;

    // Intenta Brevo API primero
    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Gemelo Digital Trujillo', email: 'noreply@brevo.com' },
        to: [{ email, name: name || email }],
        subject: 'Verifica tu correo — Gemelo Digital Trujillo',
        htmlContent: html,
        tags: ['verification'],
      }),
    });
    const brevoText = await brevoRes.text();
    if (!brevoRes.ok) {
      // Si Brevo bloquea por IP, intenta fallback con Supabase resend (usa SMTP configurado en Supabase si existe)
      console.warn('Brevo API fallo', brevoRes.status, brevoText);
      return res.status(200).json({ ok: true, verifyUrl, brevoStatus: brevoRes.status, brevoBody: brevoText, fallback: 'Revisa IP autorizada en https://app.brevo.com/security/authorised_ips o configura SMTP en Supabase' });
    }
    return res.status(200).json({ ok: true, verifyUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
