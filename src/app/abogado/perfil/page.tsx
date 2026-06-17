import Header from "@/components/Header";
import AbogadoNav from "@/components/AbogadoNav";
import Avatar from "@/components/Avatar";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

function Modulo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-5">
      <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">{titulo}</h2>
      {children}
    </section>
  );
}

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 last:border-0 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-800 text-right">{valor || "—"}</span>
    </div>
  );
}

export default async function PerfilAbogadoPage() {
  const session = requireRole("ABOGADO");
  const u = await prisma.user.findUnique({ where: { id: session.id } });
  if (!u) return null;

  const especialidades = (u.especialidad || "").split(",").map((s) => s.trim()).filter(Boolean);
  let refs: { nombre: string; contacto: string }[] = [];
  try { refs = u.referencias ? JSON.parse(u.referencias) : []; } catch { refs = []; }

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Abogado" />
      <main className="max-w-3xl mx-auto px-4 py-8">
        <AbogadoNav actual="perfil" />

        {/* Cabecera */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-5">
          <div className="flex items-start gap-4">
            <Avatar foto={u.foto} name={u.name} size={68} />
            <div className="flex-1">
              <h1 className="text-xl font-display font-extrabold text-slate-800">{u.name}</h1>
              <p className="text-sm text-slate-500">{u.especialidad || "Sin especialidad definida"}</p>
              <span className={`inline-block mt-2 text-xs font-medium rounded-full px-2.5 py-0.5 ${u.aprobado ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {u.aprobado ? "Cuenta aprobada" : "En revisión"}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <Modulo titulo="Datos personales">
            <Dato label="Correo" valor={u.email} />
            <Dato label="Teléfono" valor={u.phone} />
            <Dato label="Cédula" valor={u.cedula} />
            <Dato label="Fecha de nacimiento" valor={u.fechaNacimiento ? formatFecha(u.fechaNacimiento) : null} />
            <Dato label="Sexo" valor={u.genero} />
            <Dato label="Ubicación" valor={u.ubicacion} />
          </Modulo>

          <Modulo titulo="Información profesional">
            <div className="mb-3">
              <p className="text-xs text-slate-400 mb-1.5">Especialidades</p>
              <div className="flex flex-wrap gap-2">
                {especialidades.length ? especialidades.map((e) => (
                  <span key={e} className="text-xs font-medium bg-brand-mint text-brand-dark rounded-full px-3 py-1">{e}</span>
                )) : <span className="text-sm text-slate-400">—</span>}
              </div>
            </div>
            <Dato label="N° de matrícula" valor={u.matricula} />
            <Dato label="Años de experiencia" valor={u.experiencia ? String(u.experiencia) : null} />
            {u.bio && (
              <div className="pt-3">
                <p className="text-xs text-slate-400 mb-1">Biografía</p>
                <p className="text-sm text-slate-700">{u.bio}</p>
              </div>
            )}
          </Modulo>

          <Modulo titulo="Referencias personales">
            {refs.length ? (
              <ul className="text-sm text-slate-700 space-y-1">
                {refs.map((r, i) => (
                  <li key={i}>• {r.nombre}{r.contacto ? ` — ${r.contacto}` : ""}</li>
                ))}
              </ul>
            ) : <p className="text-sm text-slate-400">Sin referencias registradas.</p>}
          </Modulo>

          <Modulo titulo="Documentos de verificación">
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
          </Modulo>

          <p className="text-xs text-slate-400 text-center">
            ¿Necesitas actualizar tus datos? Escríbenos a soporte@legaly.ec
          </p>
        </div>
      </main>
    </div>
  );
}
