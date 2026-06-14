// Envío de correo vía Resend. Si no hay RESEND_API_KEY configurada,
// no falla: solo registra en consola (modo desarrollo).
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const FROM = process.env.EMAIL_FROM || "LEGALY <onboarding@resend.dev>";

export async function enviarEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log(`[email] (sin RESEND_API_KEY) Para: ${to} · Asunto: ${subject}`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Error Resend:", await res.text());
  } catch (e) {
    console.error("[email] Error enviando:", e);
  }
}
