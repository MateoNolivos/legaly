import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const contarPalabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export async function POST(req: Request) {
  const session = getSession();
  if (!session || (session.role !== "ABOGADO" && session.role !== "ADMIN")) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const b = await req.json().catch(() => ({}));

  if (b.bio && contarPalabras(String(b.bio)) > 500) {
    return NextResponse.json({ error: "La biografía no puede superar las 500 palabras." }, { status: 400 });
  }
  if (b.foto && String(b.foto).length > 2_800_000) {
    return NextResponse.json({ error: "La foto es muy pesada. Usa una más liviana." }, { status: 400 });
  }

  const num = (v: unknown) =>
    v !== undefined && v !== null && v !== "" ? Number(v) || null : null;

  await prisma.user.update({
    where: { id: session.id },
    data: {
      phone: b.phone !== undefined ? String(b.phone).trim() || null : undefined,
      ubicacion: b.ubicacion !== undefined ? String(b.ubicacion).trim() || null : undefined,
      foto: b.foto ? String(b.foto) : undefined,
      especialidad: Array.isArray(b.especialidades)
        ? b.especialidades.join(", ")
        : undefined,
      matricula: b.matricula !== undefined ? String(b.matricula).trim() || null : undefined,
      experiencia: b.experiencia !== undefined ? num(b.experiencia) : undefined,
      bio: b.bio !== undefined ? String(b.bio).trim() || null : undefined,
      referencias:
        Array.isArray(b.referencias)
          ? (b.referencias.length ? JSON.stringify(b.referencias) : null)
          : undefined,
    },
  });

  return NextResponse.json({ ok: true });
}
