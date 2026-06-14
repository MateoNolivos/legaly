"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notificar } from "@/lib/notificaciones";
import { enviarEmail } from "@/lib/email";

function requireAdmin() {
  const session = getSession();
  if (!session || session.role !== "ADMIN") throw new Error("No autorizado");
}

export async function aprobarAbogado(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("userId"));
  await prisma.user.update({ where: { id }, data: { aprobado: true } });
  await notificar({
    usuarioId: id,
    tipo: "aprobacion",
    titulo: "¡Tu cuenta de abogado fue aprobada!",
    cuerpo: "ya puedes iniciar sesión en LEGALY y empezar a atender solicitudes.",
    url: "/login",
  });
  revalidatePath("/admin");
}

export async function rechazarAbogado(formData: FormData) {
  requireAdmin();
  const id = String(formData.get("userId"));
  // Solo se puede rechazar una candidatura aún no aprobada.
  const u = await prisma.user.findUnique({ where: { id } });
  if (u && u.role === "ABOGADO" && !u.aprobado) {
    // La cuenta se elimina, así que el aviso va solo por correo.
    if (u.email) {
      await enviarEmail({
        to: u.email,
        subject: "Resultado de tu postulación en LEGALY",
        html: `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#0f172a">
          <div style="font-size:22px;font-weight:800;color:#059669">LEGALY</div>
          <h2 style="font-size:18px;margin:16px 0 8px">Sobre tu postulación</h2>
          <p style="color:#475569;line-height:1.6">Hola ${u.name || ""}, gracias por postular como abogado en LEGALY. En esta ocasión tu candidatura no fue aprobada. Puedes volver a postular más adelante.</p>
        </div>`,
      });
    }
    await prisma.user.delete({ where: { id } });
  }
  revalidatePath("/admin");
}
