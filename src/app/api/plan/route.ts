import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getPlan } from "@/lib/constantes";

export async function POST(req: Request) {
  const session = getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { plan } = await req.json().catch(() => ({}));
  const elegido = getPlan(String(plan || ""));
  if (!elegido) {
    return NextResponse.json({ error: "Plan no válido." }, { status: 400 });
  }

  // Una suscripción activa por usuario: desactiva las anteriores y crea la nueva.
  await prisma.suscripcion.updateMany({
    where: { usuarioId: session.id, estado: "Activa" },
    data: { estado: "Cancelada", fin: new Date() },
  });

  await prisma.suscripcion.create({
    data: {
      usuarioId: session.id,
      plan: elegido.id,
      precio: elegido.precio,
      descuento: elegido.descuento,
    },
  });

  return NextResponse.json({ ok: true });
}
