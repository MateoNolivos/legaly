import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notificar } from "@/lib/notificaciones";

// El cliente pide pasar del asistente (IA) a su abogado.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const solicitud = await prisma.solicitud.findUnique({ where: { id: params.id } });
  if (!solicitud) return NextResponse.json({ error: "No encontrada." }, { status: 404 });
  const participa =
    solicitud.clienteId === session.id ||
    solicitud.abogadoId === session.id ||
    session.role === "ADMIN";
  if (!participa) return NextResponse.json({ error: "No autorizado." }, { status: 403 });

  if (solicitud.modo !== "abogado") {
    await prisma.solicitud.update({
      where: { id: params.id },
      data: { modo: "abogado", ...(solicitud.estado !== "Resuelta" ? { estado: "En progreso" } : {}) },
    });
    await prisma.mensaje.create({
      data: {
        solicitudId: params.id,
        autorId: null,
        autorRol: "ASISTENTE",
        texto: "Listo, derivé tu consulta a tu abogado. Te responderá por aquí.",
      },
    });
    if (solicitud.abogadoId) {
      await notificar({
        usuarioId: solicitud.abogadoId,
        tipo: "mensaje",
        titulo: "Un cliente quiere hablar contigo",
        cuerpo: `un cliente solicitó atención directa en una solicitud de ${solicitud.materia}.`,
        url: `/abogado/solicitud/${params.id}`,
      });
    }
  }

  return NextResponse.json({ ok: true });
}
