import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { email, password } = await req.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json(
      { error: "Ingresa correo y contraseña." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
  });

  if (!user || !bcrypt.compareSync(String(password), user.passwordHash)) {
    return NextResponse.json(
      { error: "Correo o contraseña incorrectos." },
      { status: 401 }
    );
  }

  // Los abogados sin aprobar no pueden ingresar (candidatura en revisión).
  if (user.role === "ABOGADO" && !user.aprobado) {
    return NextResponse.json(
      { error: "Tu candidatura está en revisión. Te avisaremos por correo cuando sea aprobada." },
      { status: 403 }
    );
  }

  setSessionCookie({
    id: user.id,
    name: user.name,
    role: user.role as "CLIENTE" | "ABOGADO" | "ADMIN",
  });

  return NextResponse.json({ ok: true, role: user.role });
}
