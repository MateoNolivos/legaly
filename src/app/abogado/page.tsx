import Link from "next/link";
import Header from "@/components/Header";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireRole } from "@/lib/guard";
import { prisma } from "@/lib/db";
import {
  tiempoPrimeraRespuestaMs,
  tiempoPromedioRespuestaMs,
  promedio,
} from "@/lib/solicitudes";
import { formatDuracion, formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

const ORDEN_URGENCIA: Record<string, number> = { Alta: 0, Media: 1, Baja: 2 };

export default async function AbogadoPage() {
  const session = requireRole("ABOGADO");

  const solicitudes = await prisma.solicitud.findMany({
    where: { abogadoId: session.id },
    include: {
      cliente: { select: { name: true } },
      mensajes: { select: { autorRol: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      _count: { select: { mensajes: true } },
    },
  });

  // Metricas
  const activas = solicitudes.filter((s) => s.estado !== "Resuelta");
  const sinResponder = activas.filter((s) => !s.firstResponseAt);
  const promPrimera = promedio(solicitudes.map((s) => tiempoPrimeraRespuestaMs(s)));
  const promChat = promedio(
    solicitudes.map((s) => tiempoPromedioRespuestaMs(s.mensajes))
  );

  // Orden de la cola: sin responder primero, luego por urgencia, luego mas antiguas.
  const cola = [...solicitudes].sort((a, b) => {
    const resueltaA = a.estado === "Resuelta" ? 1 : 0;
    const resueltaB = b.estado === "Resuelta" ? 1 : 0;
    if (resueltaA !== resueltaB) return resueltaA - resueltaB;
    const respA = a.firstResponseAt ? 1 : 0;
    const respB = b.firstResponseAt ? 1 : 0;
    if (respA !== respB) return respA - respB;
    const urg = ORDEN_URGENCIA[a.urgencia] - ORDEN_URGENCIA[b.urgencia];
    if (urg !== 0) return urg;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  const metricas = [
    { label: "Activas", valor: String(activas.length) },
    { label: "Sin responder", valor: String(sinResponder.length), alerta: sinResponder.length > 0 },
    { label: "Prom. 1ª respuesta", valor: formatDuracion(promPrimera) },
    { label: "Prom. respuesta chat", valor: formatDuracion(promChat) },
  ];

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo={`Abogado · ${session.role === "ADMIN" ? "Admin" : "Asignaciones"}`} />

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <section>
          <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-4">
            Mis métricas
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metricas.map((m) => (
              <div key={m.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-xs text-slate-400">{m.label}</p>
                <p
                  className={`text-xl font-display font-bold mt-1 ${
                    m.alerta ? "text-red-600" : "text-slate-800"
                  }`}
                >
                  {m.valor}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-display font-bold text-slate-800 mb-4">
            Solicitudes asignadas
          </h2>
          {cola.length === 0 && (
            <p className="text-slate-500 bg-white rounded-xl border border-slate-200 p-6">
              No tienes solicitudes asignadas por ahora.
            </p>
          )}
          <div className="space-y-3">
            {cola.map((s) => {
              const primera = tiempoPrimeraRespuestaMs(s);
              return (
                <Link
                  key={s.id}
                  href={`/abogado/solicitud/${s.id}`}
                  className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-brand transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-brand font-semibold">
                          {s.materia}
                        </span>
                        <UrgenciaBadge urgencia={s.urgencia} />
                      </div>
                      <p className="text-sm text-slate-700 mt-1.5 line-clamp-1">{s.descripcion}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {s.cliente.name} · {s._count.mensajes} mensaje(s) · {formatFecha(s.createdAt)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <EstadoBadge estado={s.estado} />
                      <p className="text-xs mt-1.5 text-slate-400">
                        1ª resp:{" "}
                        <span className={s.firstResponseAt ? "text-slate-600" : "text-red-600 font-medium"}>
                          {s.firstResponseAt ? formatDuracion(primera) : "pendiente"}
                        </span>
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
