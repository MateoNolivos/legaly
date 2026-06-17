import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { notificar } from "@/lib/notificaciones";
import { responderAsistente } from "@/lib/asistente";

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
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = getSession();
  if (!session) return NextResponse.json({ error: "No autorizado." }, { status: 401 });

  const solicitud = await cargarSiParticipa(params.id, session.id, session.role);
  if (!solicitud) return NextResponse.json({ error: "No encontrada." }, { status: 404 });

  // "desde": si viene, solo devolvemos los mensajes posteriores (más liviano).
  const desde = new URL(req.url).searchParams.get("desde");
  const fecha = desde ? new Date(desde) : null;

  const mensajes = await prisma.mensaje.findMany({
    where: {
      solicitudId: params.id,
      ...(fecha && !isNaN(fecha.getTime()) ? { createdAt: { gt: fecha } } : {}),
    },
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

  // --- ABOGADO escribe: registra 1ª respuesta, toma el control (IA off) y avisa al cliente.
  if (rol === "ABOGADO") {
    const datos: { firstResponseAt?: Date; estado?: string; modo?: string } = {};
    if (!solicitud.firstResponseAt) datos.firstResponseAt = new Date();
    if (solicitud.estado === "Asignada" || solicitud.estado === "Nueva") datos.estado = "En progreso";
    if (solicitud.modo !== "abogado") datos.modo = "abogado";
    if (Object.keys(datos).length > 0) {
      await prisma.solicitud.update({ where: { id: params.id }, data: datos });
    }
    await notificar({
      usuarioId: solicitud.clienteId,
      tipo: "mensaje",
      titulo: "Nuevo mensaje",
      cuerpo: `tu abogado respondió en tu solicitud de ${solicitud.materia}.`,
      url: `/cliente/solicitud/${params.id}`,
    });
    return NextResponse.json({ ok: true, mensaje });
  }

  // --- CLIENTE escribe en modo IA: el asistente responde o deriva al abogado.
  if (solicitud.modo === "ia") {
    const hist = await prisma.mensaje.findMany({
      where: { solicitudId: params.id },
      orderBy: { createdAt: "asc" },
      take: 12,
      select: { autorRol: true, texto: true },
    });
    const decision = await responderAsistente({
      materia: solicitud.materia,
      descripcion: solicitud.descripcion,
      historial: hist.map((h) => ({ rol: h.autorRol, texto: h.texto })),
    });

    await prisma.mensaje.create({
      data: {
        solicitudId: params.id,
        autorId: null,
        autorRol: "ASISTENTE",
        texto: decision.respuesta || "Voy a derivar esto a tu abogado.",
      },
    });

    if (decision.escalar) {
      await prisma.solicitud.update({
        where: { id: params.id },
        data: { modo: "abogado", ...(solicitud.estado !== "Resuelta" ? { estado: "En progreso" } : {}) },
      });
      if (solicitud.abogadoId) {
        await notificar({
          usuarioId: solicitud.abogadoId,
          tipo: "mensaje",
          titulo: "Una consulta necesita tu ayuda",
          cuerpo: `un cliente requiere tu atención en una solicitud de ${solicitud.materia}.`,
          url: `/abogado/solicitud/${params.id}`,
        });
      }
    }
    return NextResponse.json({ ok: true, mensaje });
  }

  // --- CLIENTE escribe en modo abogado: avisa al abogado.
  if (solicitud.abogadoId) {
    await notificar({
      usuarioId: solicitud.abogadoId,
      tipo: "mensaje",
      titulo: "Nuevo mensaje",
      cuerpo: `tienes un mensaje nuevo en tu solicitud de ${solicitud.materia}.`,
      url: `/abogado/solicitud/${params.id}`,
    });
  }

  return NextResponse.json({ ok: true, mensaje });
}
