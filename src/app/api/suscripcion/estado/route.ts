import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Devuelve la suscripción activa más reciente del cliente (para detectar el pago).
export async function GET() {
  const session = getSession();
  if (!session || session.role !== "CLIENTE") {
    return NextResponse.json({ id: null });
  }
  const sub = await prisma.suscripcion.findFirst({
    where: { usuarioId: session.id, estado: "Activa" },
    orderBy: { inicio: "desc" },
    select: { id: true, plan: true, inicio: true },
  });
  return NextResponse.json({
    id: sub?.id ?? null,
    plan: sub?.plan ?? null,
    inicio: sub?.inicio ?? null,
  });
}
