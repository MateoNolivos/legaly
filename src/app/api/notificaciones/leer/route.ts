import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST() {
  const session = getSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  await prisma.notificacion.updateMany({
    where: { usuarioId: session.id, leida: false },
    data: { leida: true },
  });
  return NextResponse.json({ ok: true });
}
