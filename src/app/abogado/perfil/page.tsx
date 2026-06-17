import Header from "@/components/Header";
import AbogadoNav from "@/components/AbogadoNav";
import PerfilAbogadoEditor from "@/components/PerfilAbogadoEditor";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function PerfilAbogadoPage() {
  const session = requireRole("ABOGADO");
  const u = await prisma.user.findUnique({ where: { id: session.id } });
  if (!u) return null;

  let refs: { nombre: string; contacto: string }[] = [];
  try { refs = u.referencias ? JSON.parse(u.referencias) : []; } catch { refs = []; }

  const inicial = {
    nombre: u.name,
    email: u.email,
    cedula: u.cedula || "",
    genero: u.genero || "",
    foto: u.foto || "",
    phone: u.phone || "",
    ubicacion: u.ubicacion || "",
    lat: u.lat ?? null,
    lng: u.lng ?? null,
    especialidades: (u.especialidad || "").split(",").map((s) => s.trim()).filter(Boolean),
    matricula: u.matricula || "",
    experiencia: u.experiencia ? String(u.experiencia) : "",
    bio: u.bio || "",
    referencias: refs,
  };

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Abogado" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <AbogadoNav actual="perfil" />
        <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-4">Mi perfil</h1>

        <PerfilAbogadoEditor inicial={inicial} />

        {/* Documentos de verificación (no editables: vienen del registro) */}
        <section className="bg-white rounded-xl border border-slate-200 p-5 mt-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">Documentos de verificación</h2>
          <div className="flex flex-wrap gap-3">
            {u.cedulaFoto && (
              <a href={u.cedulaFoto} target="_blank" rel="noreferrer" title="Cédula (frente)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.cedulaFoto} alt="Cédula frente" className="h-16 rounded border border-slate-200" />
              </a>
            )}
            {u.cedulaReverso && (
              <a href={u.cedulaReverso} target="_blank" rel="noreferrer" title="Cédula (reverso)">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.cedulaReverso} alt="Cédula reverso" className="h-16 rounded border border-slate-200" />
              </a>
            )}
            {u.selfie && (
              <a href={u.selfie} target="_blank" rel="noreferrer" title="Selfie">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u.selfie} alt="Selfie" className="h-16 w-16 object-cover rounded-full border border-slate-200" />
              </a>
            )}
            {!u.cedulaFoto && !u.cedulaReverso && !u.selfie && (
              <p className="text-sm text-slate-400">Sin documentos cargados.</p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
