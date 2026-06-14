import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { setSessionCookie } from "@/lib/auth";

const contarPalabras = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

export async function POST(req: Request) {
  const b = await req.json().catch(() => ({}));

  const role = b.role === "ABOGADO" ? "ABOGADO" : "CLIENTE";
  const name = String(b.name || "").trim();
  const email = String(b.email || "").toLowerCase().trim();
  const password = String(b.password || "");

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Completa nombre, correo y contraseña." }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres." }, { status: 400 });
  }
  if (b.bio && contarPalabras(String(b.bio)) > 500) {
    return NextResponse.json({ error: "La biografía no puede superar las 500 palabras." }, { status: 400 });
  }
  // Las imágenes viajan como data URL; limita el tamaño total.
  for (const img of [b.foto, b.cedulaFoto, b.cedulaReverso, b.selfie]) {
    if (img && String(img).length > 2_800_000) {
      return NextResponse.json({ error: "Una de las imágenes es muy pesada. Usa una más liviana." }, { status: 400 });
    }
  }

  const existe = await prisma.user.findUnique({ where: { email } });
  if (existe) {
    return NextResponse.json({ error: "Ya existe una cuenta con ese correo." }, { status: 409 });
  }

  const num = (v: unknown) =>
    v !== undefined && v !== null && v !== "" ? Number(v) : null;

  const base = {
    name,
    email,
    passwordHash: bcrypt.hashSync(password, 10),
    role,
    phone: b.phone ? String(b.phone).trim() : null,
    foto: b.foto ? String(b.foto) : null,
    cedulaFoto: b.cedulaFoto ? String(b.cedulaFoto) : null,
    cedulaReverso: b.cedulaReverso ? String(b.cedulaReverso) : null,
    selfie: b.selfie ? String(b.selfie) : null,
    ubicacion: b.ubicacion ? String(b.ubicacion).trim() : null,
    lat: num(b.lat),
    lng: num(b.lng),
    cedula: b.cedula ? String(b.cedula).trim() : null,
    fechaNacimiento: b.fechaNacimiento ? new Date(String(b.fechaNacimiento)) : null,
    genero: b.genero ? String(b.genero) : null,
  };

  const extra =
    role === "ABOGADO"
      ? {
          aprobado: false, // queda en revisión hasta que un admin lo apruebe
          especialidad: Array.isArray(b.especialidades)
            ? b.especialidades.join(", ")
            : b.especialidad
            ? String(b.especialidad)
            : null,
          matricula: b.matricula ? String(b.matricula).trim() : null,
          experiencia: num(b.experiencia),
          bio: b.bio ? String(b.bio).trim() : null,
          referencias:
            Array.isArray(b.referencias) && b.referencias.length > 0
              ? JSON.stringify(b.referencias)
              : null,
        }
      : {
          ocupacion: b.ocupacion ? String(b.ocupacion).trim() : null,
        };

  const user = await prisma.user.create({ data: { ...base, ...extra } });

  // El abogado NO inicia sesión: su candidatura queda en revisión.
  if (role === "ABOGADO") {
    return NextResponse.json({ ok: true, role, pendiente: true });
  }

  setSessionCookie({ id: user.id, name: user.name, role: "CLIENTE" });
  return NextResponse.json({ ok: true, role });
}
