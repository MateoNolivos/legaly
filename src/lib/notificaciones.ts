import { prisma } from "./db";
import { enviarEmail } from "./email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function plantilla(nombre: string, titulo: string, cuerpo: string, url?: string): string {
  const boton = url
    ? `<a href="${APP_URL}${url}" style="display:inline-block;margin-top:16px;background:#059669;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-weight:600">Abrir en LEGALY</a>`
    : "";
  return `
  <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
    <div style="font-size:22px;font-weight:800;color:#059669">LEGALY</div>
    <h2 style="font-size:18px;margin:16px 0 8px">${titulo}</h2>
    <p style="color:#475569;line-height:1.6">Hola ${nombre || ""}, ${cuerpo}</p>
    ${boton}
    <p style="color:#94a3b8;font-size:12px;margin-top:24px">Este es un mensaje automático de LEGALY.</p>
  </div>`;
}

// Crea la notificación in-app y (si corresponde) envía el correo.
export async function notificar(opts: {
  usuarioId: string;
  tipo: "solicitud" | "mensaje" | "aprobacion" | "pago";
  titulo: string;
  cuerpo: string;
  url?: string;
  email?: boolean; // por defecto true
}): Promise<void> {
  try {
    await prisma.notificacion.create({
      data: {
        usuarioId: opts.usuarioId,
        tipo: opts.tipo,
        titulo: opts.titulo,
        cuerpo: opts.cuerpo,
        url: opts.url ?? null,
      },
    });
  } catch (e) {
    console.error("[notif] Error creando notificación:", e);
  }

  if (opts.email !== false) {
    const u = await prisma.user.findUnique({
      where: { id: opts.usuarioId },
      select: { email: true, name: true },
    });
    if (u?.email) {
      await enviarEmail({
        to: u.email,
        subject: opts.titulo,
        html: plantilla(u.name, opts.titulo, opts.cuerpo, opts.url),
      });
    }
  }
}
