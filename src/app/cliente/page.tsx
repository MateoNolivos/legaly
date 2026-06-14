import Link from "next/link";
import Header from "@/components/Header";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireRole } from "@/lib/guard";
import { getSolicitudesDeCliente } from "@/lib/solicitudes";
import { prisma } from "@/lib/db";
import { formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClientePage() {
  const session = requireRole("CLIENTE");
  const [solicitudes, suscripcion] = await Promise.all([
    getSolicitudesDeCliente(session.id),
    prisma.suscripcion.findFirst({
      where: { usuarioId: session.id, estado: "Activa" },
      orderBy: { inicio: "desc" },
    }),
  ]);

  return (
    <div className="min-h-screen">
      <Header
        nombre={session.name}
        subtitulo={suscripcion ? `Plan ${suscripcion.plan}` : "Cliente"}
      />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-extrabold text-slate-800">
            Mis solicitudes
          </h1>
          <Link
            href="/cliente/nueva"
            className="bg-brand text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-dark transition"
          >
            + Necesito ayuda
          </Link>
        </div>

        {solicitudes.length === 0 && (
          <div className="text-center bg-white rounded-xl border border-slate-200 p-10">
            <p className="text-slate-600 font-medium">Aún no tienes solicitudes.</p>
            <p className="text-sm text-slate-400 mt-1 mb-4">
              Cuéntanos qué necesitas y te asignamos un abogado al instante.
            </p>
            <Link
              href="/cliente/nueva"
              className="inline-block bg-brand text-white text-sm font-medium rounded-lg px-5 py-2.5 hover:bg-brand-dark transition"
            >
              Crear mi primera solicitud
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {solicitudes.map((s) => (
            <Link
              key={s.id}
              href={`/cliente/solicitud/${s.id}`}
              className="block bg-white rounded-xl border border-slate-200 p-5 hover:border-brand transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-brand font-semibold">
                      {s.materia}
                    </span>
                    <UrgenciaBadge urgencia={s.urgencia} />
                  </div>
                  <p className="text-sm text-slate-700 mt-2 line-clamp-2">{s.descripcion}</p>
                  <p className="text-xs text-slate-400 mt-2">
                    {s.abogado
                      ? `Abogado asignado: ${s.abogado.name}`
                      : "Buscando abogado disponible…"}{" "}
                    · {s._count.mensajes} mensaje(s) · {formatFecha(s.createdAt)}
                  </p>
                </div>
                <EstadoBadge estado={s.estado} />
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
