import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { tiempoPrimeraRespuestaMs } from "@/lib/solicitudes";
import { formatFecha, formatDuracion } from "@/lib/format";

export const dynamic = "force-dynamic";

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div className="flex justify-between gap-3 py-1.5 border-b border-slate-100 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-800 text-right">{valor || "—"}</span>
    </div>
  );
}

export default async function FichaClientePage({ params }: { params: { id: string } }) {
  const session = requireAdmin();
  const c = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      suscripciones: { orderBy: { inicio: "desc" } },
      solicitudesComoCliente: {
        include: { abogado: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!c || c.role !== "CLIENTE") notFound();

  const subActiva = c.suscripciones.find((s) => s.estado === "Activa");

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Supervisor" />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <Link href="/admin/clientes" className="text-sm text-slate-400 hover:text-slate-700">← Volver a clientes</Link>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h1 className="text-xl font-display font-extrabold text-slate-800">{c.name}</h1>
          <p className="text-sm text-slate-500 mb-3">{c.email}</p>
          <Dato label="Cédula" valor={c.cedula} />
          <Dato label="Teléfono" valor={c.phone} />
          <Dato label="Fecha de nacimiento" valor={c.fechaNacimiento ? formatFecha(c.fechaNacimiento) : null} />
          <Dato label="Sexo" valor={c.genero} />
          <Dato label="Ocupación" valor={c.ocupacion} />
          <Dato label="Ubicación" valor={c.ubicacion} />
          <Dato label="Registrado" valor={formatFecha(c.createdAt)} />

          {(c.cedulaFoto || c.cedulaReverso || c.selfie) && (
            <div className="flex gap-2 mt-3">
              {c.cedulaFoto && (
                <a href={c.cedulaFoto} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.cedulaFoto} alt="Cédula" className="h-14 rounded border border-slate-200" />
                </a>
              )}
              {c.cedulaReverso && (
                <a href={c.cedulaReverso} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.cedulaReverso} alt="Reverso" className="h-14 rounded border border-slate-200" />
                </a>
              )}
              {c.selfie && (
                <a href={c.selfie} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.selfie} alt="Selfie" className="h-14 w-14 object-cover rounded-full border border-slate-200" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Suscripción / pagos */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-display font-bold text-slate-800 mb-2">Plan y pagos</h2>
          {subActiva ? (
            <p className="text-sm text-slate-700">
              Plan activo: <span className="font-medium">{subActiva.plan}</span> · ${subActiva.precio}/mes
              {subActiva.descuento ? ` · ${subActiva.descuento}% dto.` : ""} · desde {formatFecha(subActiva.inicio)}
            </p>
          ) : (
            <p className="text-sm text-slate-400">Sin plan activo.</p>
          )}
          {c.suscripciones.length > 1 && (
            <div className="mt-2 text-xs text-slate-400">
              Historial: {c.suscripciones.map((s) => `${s.plan} (${s.estado})`).join(" · ")}
            </div>
          )}
        </div>

        {/* Solicitudes */}
        <div>
          <h2 className="font-display font-bold text-slate-800 mb-3">Solicitudes y respuestas</h2>
          <div className="space-y-3">
            {c.solicitudesComoCliente.length === 0 && (
              <p className="text-sm text-slate-400 bg-white rounded-xl border border-slate-200 p-4">Sin solicitudes.</p>
            )}
            {c.solicitudesComoCliente.map((s) => (
              <Link key={s.id} href={`/abogado/solicitud/${s.id}`} className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase tracking-wide text-brand font-semibold">{s.materia}</span>
                      <UrgenciaBadge urgencia={s.urgencia} />
                    </div>
                    <p className="text-sm text-slate-700 mt-1 line-clamp-1">{s.descripcion}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Abogado: {s.abogado ? s.abogado.name : "sin asignar"} · {formatFecha(s.createdAt)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <EstadoBadge estado={s.estado} />
                    <p className="text-xs mt-1.5 text-slate-400">
                      1ª resp:{" "}
                      <span className={s.firstResponseAt ? "text-slate-600" : "text-red-600 font-medium"}>
                        {s.firstResponseAt ? formatDuracion(tiempoPrimeraRespuestaMs(s)) : "pendiente"}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
