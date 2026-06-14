import Link from "next/link";
import Header from "@/components/Header";
import AdminNav from "@/components/AdminNav";
import Avatar from "@/components/Avatar";
import { EstadoBadge, UrgenciaBadge } from "@/components/Badges";
import { requireAdmin } from "@/lib/guard";
import { prisma } from "@/lib/db";
import { aprobarAbogado, rechazarAbogado } from "./actions";
import {
  tiempoPrimeraRespuestaMs,
  tiempoPromedioRespuestaMs,
  promedio,
} from "@/lib/solicitudes";
import { formatDuracion, formatFecha } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = requireAdmin();

  const [solicitudes, abogados, pendientes, subsActivas] = await Promise.all([
    prisma.solicitud.findMany({
      include: {
        cliente: { select: { name: true } },
        abogado: { select: { id: true, name: true } },
        mensajes: { select: { autorRol: true, createdAt: true }, orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.user.findMany({
      where: { role: "ABOGADO", aprobado: true },
      select: { id: true, name: true, especialidad: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      where: { role: "ABOGADO", aprobado: false },
      orderBy: { createdAt: "desc" },
    }),
    prisma.suscripcion.findMany({ where: { estado: "Activa" }, select: { precio: true } }),
  ]);

  const ingresos = subsActivas.reduce((s, x) => s + (x.precio || 0), 0);

  // --- Métricas globales ---
  const activas = solicitudes.filter((s) => s.estado !== "Resuelta");
  const sinAsignar = solicitudes.filter((s) => !s.abogadoId);
  const sinResponder = activas.filter((s) => !s.firstResponseAt);
  const promPrimera = promedio(solicitudes.map((s) => tiempoPrimeraRespuestaMs(s)));
  const promChat = promedio(solicitudes.map((s) => tiempoPromedioRespuestaMs(s.mensajes)));

  const metricas: { label: string; valor: string; alerta?: boolean }[] = [
    { label: "Ingresos / mes", valor: `$${ingresos}` },
    { label: "Solicitudes totales", valor: String(solicitudes.length) },
    { label: "Activas", valor: String(activas.length) },
    { label: "Sin asignar", valor: String(sinAsignar.length), alerta: sinAsignar.length > 0 },
    { label: "Sin responder", valor: String(sinResponder.length), alerta: sinResponder.length > 0 },
    { label: "Prom. 1ª respuesta", valor: formatDuracion(promPrimera) },
    { label: "Prom. respuesta chat", valor: formatDuracion(promChat) },
  ];

  // --- Desempeño por abogado ---
  const desempeno = abogados.map((ab) => {
    const suyas = solicitudes.filter((s) => s.abogadoId === ab.id);
    const activasAb = suyas.filter((s) => s.estado !== "Resuelta");
    return {
      ...ab,
      total: suyas.length,
      activas: activasAb.length,
      resueltas: suyas.filter((s) => s.estado === "Resuelta").length,
      sinResponder: activasAb.filter((s) => !s.firstResponseAt).length,
      promPrimera: promedio(suyas.map((s) => tiempoPrimeraRespuestaMs(s))),
      promChat: promedio(suyas.map((s) => tiempoPromedioRespuestaMs(s.mensajes))),
    };
  });

  // --- Cola global (sin responder primero) ---
  const cola = [...solicitudes].sort((a, b) => {
    const ra = a.estado === "Resuelta" ? 1 : 0;
    const rb = b.estado === "Resuelta" ? 1 : 0;
    if (ra !== rb) return ra - rb;
    const pa = a.firstResponseAt ? 1 : 0;
    const pb = b.firstResponseAt ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="min-h-screen">
      <Header nombre={session.name} subtitulo="Supervisor" />

      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        <AdminNav actual="resumen" />
        <section>
          <h1 className="text-2xl font-display font-extrabold text-slate-800 mb-4">
            Panel de supervisión
          </h1>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
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

        {pendientes.length > 0 && (
          <section>
            <h2 className="text-lg font-display font-bold text-slate-800 mb-3">
              Candidaturas de abogados por revisar
              <span className="ml-2 text-xs font-medium bg-amber-100 text-amber-700 rounded-full px-2.5 py-0.5">
                {pendientes.length}
              </span>
            </h2>
            <div className="space-y-3">
              {pendientes.map((p) => {
                let refs: { nombre: string; contacto: string }[] = [];
                try {
                  refs = p.referencias ? JSON.parse(p.referencias) : [];
                } catch {
                  refs = [];
                }
                return (
                  <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5">
                    <div className="flex items-start gap-4">
                      <Avatar foto={p.foto} name={p.name} size={56} />
                      <div className="flex-1">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.email} · {p.phone ?? "sin teléfono"}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {p.especialidad ?? "Sin especialidad"}
                          {p.experiencia ? ` · ${p.experiencia} años` : ""}
                          {p.ubicacion ? ` · ${p.ubicacion}` : ""}
                          {p.matricula ? ` · Mat. ${p.matricula}` : ""}
                        </p>
                        {p.cedula && <p className="text-xs text-slate-500 mt-1">Cédula: {p.cedula}</p>}
                        {p.bio && <p className="text-sm text-slate-600 mt-2">{p.bio}</p>}
                        {refs.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-slate-400 uppercase">Referencias</p>
                            <ul className="text-xs text-slate-600">
                              {refs.map((r, i) => (
                                <li key={i}>• {r.nombre} {r.contacto ? `— ${r.contacto}` : ""}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <div className="flex gap-2 mt-2">
                          {p.cedulaFoto && (
                            <a href={p.cedulaFoto} target="_blank" rel="noreferrer" title="Cédula (frente)">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.cedulaFoto} alt="Cédula frente" className="h-16 rounded border border-slate-200" />
                            </a>
                          )}
                          {p.cedulaReverso && (
                            <a href={p.cedulaReverso} target="_blank" rel="noreferrer" title="Cédula (reverso)">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.cedulaReverso} alt="Cédula reverso" className="h-16 rounded border border-slate-200" />
                            </a>
                          )}
                          {p.selfie && (
                            <a href={p.selfie} target="_blank" rel="noreferrer" title="Selfie de verificación">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.selfie} alt="Selfie" className="h-16 w-16 object-cover rounded-full border border-slate-200" />
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <form action={aprobarAbogado}>
                          <input type="hidden" name="userId" value={p.id} />
                          <button className="bg-brand text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-brand-dark transition w-full">
                            Aprobar
                          </button>
                        </form>
                        <form action={rechazarAbogado}>
                          <input type="hidden" name="userId" value={p.id} />
                          <button className="text-sm text-red-600 border border-red-200 rounded-lg px-4 py-2 hover:bg-red-50 transition w-full">
                            Rechazar
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-display font-bold text-slate-800 mb-3">
            Desempeño por abogado
          </h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Abogado</th>
                  <th className="px-4 py-3 font-medium">Activas</th>
                  <th className="px-4 py-3 font-medium">Resueltas</th>
                  <th className="px-4 py-3 font-medium">Sin responder</th>
                  <th className="px-4 py-3 font-medium">Prom. 1ª resp.</th>
                  <th className="px-4 py-3 font-medium">Prom. chat</th>
                </tr>
              </thead>
              <tbody>
                {desempeno.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{d.name}</p>
                      <p className="text-xs text-slate-400">{d.especialidad}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{d.activas}</td>
                    <td className="px-4 py-3 text-slate-700">{d.resueltas}</td>
                    <td className={`px-4 py-3 ${d.sinResponder > 0 ? "text-red-600 font-medium" : "text-slate-700"}`}>
                      {d.sinResponder}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{formatDuracion(d.promPrimera)}</td>
                    <td className="px-4 py-3 text-slate-700">{formatDuracion(d.promChat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-display font-bold text-slate-800 mb-3">
            Todas las solicitudes
          </h2>
          <div className="space-y-3">
            {cola.map((s) => (
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
                      Cliente: {s.cliente.name} · Abogado:{" "}
                      {s.abogado ? s.abogado.name : "sin asignar"} · {formatFecha(s.createdAt)}
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
        </section>
      </main>
    </div>
  );
}
