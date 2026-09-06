// Supabase Edge Function: send-verification-email
// Despliegue: supabase functions deploy send-verification-email --no-verify-jwt
// Secrets: supabase secrets set BREVO_API_KEY=xkeysib-... SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=...

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function verificationHtml(name: string, verifyUrl: string) {
  const safeName = name?.split(" ")[0] || "colega";
  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 0;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">
        <tr>
          <td style="background:linear-gradient(135deg,#059669 0%,#0d9488 100%);padding:28px 32px;text-align:center;">
            <div style="display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.25);border-radius:999px;padding:6px 14px;color:#ecfdf5;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">Gemelo Digital Trujillo • Tesis UNT</div>
            <h1 style="margin:16px 0 6px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.02em;">Verifica tu correo</h1>
            <p style="margin:0;color:#ccfbf1;font-size:13px;line-height:1.5;">Un clic para activar tu acceso al Gemelo Digital a microescala</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px;">
            <p style="margin:0 0 12px;color:#0f172a;font-size:15px;font-weight:600;">Hola ${safeName} 👋</p>
            <p style="margin:0 0 16px;color:#334155;font-size:14px;line-height:1.7;">Gracias por registrarte en el <strong>Gemelo Digital de Calidad del Aire y NbS — Trujillo 2026</strong>. Para confirmar que este correo es tuyo y habilitar tu cuenta, haz clic en el botón de abajo. El enlace expira en 24 horas.</p>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0;">
              <tr>
                <td align="center" style="border-radius:14px;background:linear-gradient(135deg,#059669 0%,#0d9488 100%);">
                  <a href="${verifyUrl}" style="display:inline-block;padding:14px 28px;color:#ffffff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.02em;">✓ Verificar mi correo</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 8px;color:#64748b;font-size:12px;">Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="margin:0 0 20px;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;color:#0f172a;font-size:11px;font-family:monospace;">${verifyUrl}</p>
            <div style="background:#f0fdfa;border:1px solid #ccfbf1;border-radius:12px;padding:14px 16px;">
              <p style="margin:0;color:#134e4a;font-size:12px;line-height:1.6;"><strong>¿No te registraste?</strong> Ignora este correo. Tu cuenta no se activará sin verificación. Solo las <strong>cuentas demo</strong> tienen acceso limitado sin verificar.</p>
            </div>
            <p style="margin:20px 0 0;color:#94a3b8;font-size:11px;line-height:1.6;">Recibiste este correo porque te registraste en <strong>gemelo-digital-trujillo.vercel.app</strong>. Proyecto de Tesis de Posgrado — Universidad Nacional de Trujillo / MPT / SENAMHI.<br>Si tienes dudas, responde a este correo.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0f172a;padding:18px 32px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:11px;">© 2026 Gemelo Digital Microescala Trujillo • La Libertad, Perú</p>
            <p style="margin:4px 0 0;color:#64748b;font-size:11px;">Investigador Líder: Ing. Joel Arevalo • <span style="color:#5eead4;">tesis.unt.trujillo</span></p>
          </td>
        </tr>
      </table>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:11px;">Este es un mensaje automático, no respondas si no reconoces el registro.</p>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { email, name, redirect_to } = await req.json();
    if (!email) return new Response(JSON.stringify({ error: "email requerido" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Genera link de verificación tipo signup (funciona aunque el usuario ya exista, reenvía)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: { redirectTo: redirect_to || `${req.headers.get("origin") || "https://gemelo-digital-trujillo.vercel.app"}/verify` },
    });
    if (linkErr) throw linkErr;
    const verifyUrl: string = (linkData as any)?.properties?.action_link || (linkData as any)?.action_link;
    if (!verifyUrl) throw new Error("No se pudo generar el link de verificación");

    // Envía vía Brevo + copia a Joel para ver diseños — remitente verificado jfloriana@unitru.edu.pe
    const brevoRes = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Gemelo Digital Trujillo", email: "jfloriana@unitru.edu.pe" },
        to: [{ email, name: name || email.split("@")[0] }],
        bcc: [{ email: "joelandersonarevalo@gmail.com", name: "Ing. Joel Florian" }],
        subject: "Verifica tu correo — Gemelo Digital Trujillo",
        htmlContent: verificationHtml(name || "", verifyUrl),
        tags: ["verification", "trujillo-2026"],
      }),
    });
    const brevoBody = await brevoRes.text();
    if (!brevoRes.ok) throw new Error(`Brevo ${brevoRes.status}: ${brevoBody}`);

    return new Response(JSON.stringify({ ok: true, verifyUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
