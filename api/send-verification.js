import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export default async function handler(req, res) {
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
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Guarda token Brevo (24h)
    const { error: insErr } = await supabaseAdmin.from('email_verifications').insert({ email: email.toLowerCase(), token, expires_at: expiresAt });
    if (insErr) throw insErr;

    // Asegura que el profile exista y quede como no verificado hasta clic
    await supabaseAdmin.from('profiles').update({ email_verified: false }).eq('email', email.toLowerCase());

    const base = redirect_to || 'https://gemelo-digital-trujillo.vercel.app/verify';
    const verifyUrl = `${base}${base.includes('?') ? '&' : '?'}token=${token}&email=${encodeURIComponent(email)}`;

    const esc = (s) => String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    const safeName = esc((name || email.split('@')[0] || 'colega').split(' ')[0]);
    const safeUrl = esc(verifyUrl);
    const PROJECT_TITLE = 'Gemelo Digital Microescala – Calidad del Aire y NbS, Trujillo';

    const html = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${esc(PROJECT_TITLE)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Verifica tu correo para activar tu cuenta. El enlace expira en 24 horas. / Verify your email to activate your account. The link expires in 24 hours.</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
          <tr>
            <td style="background:#0d9488;padding:28px 32px;text-align:center;">
              <div style="color:#ccfbf1;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Gemelo Digital Microescala · Trujillo</div>
              <h1 style="margin:12px 0 4px;color:#ffffff;font-size:22px;font-weight:800;line-height:1.25;">Verifica tu correo<br><span style="font-size:15px;font-weight:600;color:#99f6e4;">Verify your email</span></h1>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 32px 8px;">
              <h2 style="margin:0 0 10px;color:#0f172a;font-size:16px;font-weight:700;">Español</h2>
              <p style="margin:0 0 14px;color:#0f172a;font-size:15px;font-weight:600;">Hola ${safeName} 👋</p>
              <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">Gracias por registrarte en <strong>${esc(PROJECT_TITLE)}</strong>. Para confirmar que este correo es tuyo y activar tu cuenta, pulsa el botón. El enlace <strong>expira en 24 horas</strong>.</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0;">
                <tr>
                  <td align="center" style="border-radius:12px;background:#059669;">
                    <a href="${safeUrl}" style="display:inline-block;padding:14px 30px;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;">Verificar mi correo / Verify email</a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Si el botón no funciona, copia y pega este enlace / If the button does not work, copy and paste this link:</p>
              <p style="margin:0 0 18px;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px 12px;color:#0f172a;font-size:12px;font-family:Consolas,Menlo,monospace;">${safeUrl}</p>
              <p style="margin:0 0 20px;color:#475569;font-size:12px;line-height:1.6;"><strong>¿No solicitaste esto?</strong> Ignora este correo. Tu cuenta no se activará sin verificación.</p>
              <hr style="border:none;border-top:1px solid #e2e8f0;margin:8px 0 20px;">
              <h2 style="margin:0 0 10px;color:#0f172a;font-size:15px;font-weight:700;">English</h2>
              <p style="margin:0 0 12px;color:#334155;font-size:13px;line-height:1.7;">Hi ${safeName}, thanks for signing up for <strong>${esc(PROJECT_TITLE)}</strong>. Use the button above to confirm this email is yours and activate your account. The link <strong>expires in 24 hours</strong>. If you did not request this, simply ignore this email — your account will not be activated.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#0f172a;padding:18px 32px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;line-height:1.6;">Proyecto de Tesis de Posgrado · Universidad Nacional de Trujillo / MPT / SENAMHI<br>gemelo-digital-trujillo.vercel.app · © 2026 · La Libertad, Perú</p>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Mensaje automático · Automated message</p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    const text = [
      PROJECT_TITLE, '', '── ESPAÑOL ──', '',
      safeName ? `Hola ${(name || '').trim().split(/\s+/)[0]},` : 'Hola,', '',
      'Gracias por registrarte. Para confirmar que este correo es tuyo y',
      'activar tu cuenta, abre el siguiente enlace:', '',
      verifyUrl, '',
      'El enlace expira en 24 horas.',
      'Si no solicitaste esto, ignora este correo: tu cuenta no se activará.', '',
      '── ENGLISH ──', '',
      'Hi, thanks for signing up. To confirm this email is yours and activate',
      'your account, open the link below:', '',
      verifyUrl, '',
      'The link expires in 24 hours.',
      'If you did not request this, just ignore this email: your account will not be activated.', '',
      '—',
      'Proyecto de Tesis de Posgrado · Universidad Nacional de Trujillo / MPT / SENAMHI',
      'gemelo-digital-trujillo.vercel.app',
    ].join('\n');

    const brevoRes = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Gemelo Digital Trujillo', email: 'jfloriana@unitru.edu.pe' },
        to: [{ email, name: name || email }],
        bcc: [{ email: 'joelandersonarevalo@gmail.com', name: 'Ing. Joel Florian' }],
        subject: 'Verifica tu correo / Verify your email — Gemelo Digital Trujillo',
        htmlContent: html,
        textContent: text,
        tags: ['verification', 'trujillo-2026'],
      }),
    });
    const brevoText = await brevoRes.text();
    if (!brevoRes.ok) {
      console.warn('Brevo fallo', brevoRes.status, brevoText);
      return res.status(500).json({ error: `Brevo ${brevoRes.status}: ${brevoText}` });
    }
    return res.status(200).json({ ok: true, verifyUrl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return res.status(500).json({ error: msg });
  }
}
