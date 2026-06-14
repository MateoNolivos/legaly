import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ items: [], noLeidas: 0 });

  const [items, noLeidas] = await Promise.all([
    prisma.notificacion.findMany({
      where: { usuarioId: session.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.notificacion.count({ where: { usuarioId: session.id, leida: false } }),
  ]);

  return NextResponse.json({ items, noLeidas });
}
