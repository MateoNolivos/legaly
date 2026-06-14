import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notificar } from "@/lib/notificaciones";

// Verifica que el usuario sea participante de la solicitud (cliente o abogado).
async function cargarSiParticipa(id: string, userId: string, role: string) {
  const solicitud = await prisma.solicitud.findUnique({ where: { id } });
  if (!solicitud) return null;
  const participa =
    solicitud.clienteId === userId ||
    solicitud.abogadoId === userId ||
    role === "ADMIN";
  return participa ? solicitud : null;
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const solicitud = await cargarSiParticipa(params.id, session.id, session.role);
  if (!solicitud) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  const mensajes = await prisma.mensaje.findMany({
    where: { solicitudId: params.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, autorRol: true, texto: true, createdAt: true },
  });

  return NextResponse.json({ mensajes, estado: solicitud.estado });
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const solicitud = await cargarSiParticipa(params.id, session.id, session.role);
  if (!solicitud) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  const { texto } = await req.json().catch(() => ({}));
  if (!texto || !String(texto).trim()) {
    return NextResponse.json({ error: "Mensaje vacío." }, { status: 400 });
  }

  const rol = session.role === "ABOGADO" || session.role === "ADMIN" ? "ABOGADO" : "CLIENTE";

  const mensaje = await prisma.mensaje.create({
    data: {
      solicitudId: params.id,
      autorId: session.id,
      autorRol: rol,
      texto: String(texto).trim(),
    },
    select: { id: true, autorRol: true, texto: true, createdAt: true },
  });

  // Si es la primera respuesta del abogado, registra el tiempo (para metricas)
  // y mueve la solicitud a "En progreso".
  if (rol === "ABOGADO") {
    const datos: { firstResponseAt?: Date; estado?: string } = {};
    if (!solicitud.firstResponseAt) datos.firstResponseAt = new Date();
    if (solicitud.estado === "Asignada" || solicitud.estado === "Nueva") {
      datos.estado = "En progreso";
    }
    if (Object.keys(datos).length > 0) {
      await prisma.solicitud.update({ where: { id: params.id }, data: datos });
    }
  }

  // Notifica a la otra persona del chat.
  const destinatarioId = rol === "ABOGADO" ? solicitud.clienteId : solicitud.abogadoId;
  if (destinatarioId) {
    await notificar({
      usuarioId: destinatarioId,
      tipo: "mensaje",
      titulo: "Nuevo mensaje",
      cuerpo: `tienes un mensaje nuevo en tu solicitud de ${solicitud.materia}.`,
      url: rol === "ABOGADO" ? `/cliente/solicitud/${params.id}` : `/abogado/solicitud/${params.id}`,
    });
  }

  return NextResponse.json({ ok: true, mensaje });
}
