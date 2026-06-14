import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { asignarAbogado } from "@/lib/asignacion";
import { notificar } from "@/lib/notificaciones";

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const materia = String(body.materia || "").trim();
  const descripcion = String(body.descripcion || "").trim();
  if (!materia || !descripcion) {
    return NextResponse.json(
      { error: "Indica el tipo de necesidad y describe tu problema." },
      { status: 400 }
    );
  }

  // Asignacion automatica por especialidad + carga.
  const abogadoId = await asignarAbogado(materia);

  // La ciudad y el teléfono se toman del perfil del cliente (ya no se piden aquí).
  const perfil = await prisma.user.findUnique({
    where: { id: session.id },
    select: { phone: true, ubicacion: true },
  });

  const solicitud = await prisma.solicitud.create({
    data: {
      clienteId: session.id,
      materia,
      descripcion,
      urgencia: String(body.urgencia || "Media"),
      ciudad: perfil?.ubicacion ?? null,
      telefono: perfil?.phone ?? null,
      abogadoId,
      assignedAt: abogadoId ? new Date() : null,
      estado: abogadoId ? "Asignada" : "Nueva",
    },
  });

  if (abogadoId) {
    await notificar({
      usuarioId: abogadoId,
      tipo: "solicitud",
      titulo: "Nueva solicitud asignada",
      cuerpo: `se te asignó una solicitud de ${materia}. Revísala y responde a tu cliente.`,
      url: `/abogado/solicitud/${solicitud.id}`,
    });
  }

  return NextResponse.json({ ok: true, id: solicitud.id });
}
